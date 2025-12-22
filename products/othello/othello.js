"use strict";
const canvas = document.getElementById('othelloBoard');
const ctx = canvas.getContext('2d');

// === flip animation settings ===
const FLIP_DURATION = 1000; // ms（好みで調整）
const EASE = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

// 反転アニメのキュー {key:"r,c", row, col, from:1|-1, to:1|-1, start:ms}
const flipAnims = new Map();

// 毎フレーム駆動
let rafId = 0;
function tick() {
  rafId = requestAnimationFrame(tick);
  drawBoard(); // 毎フレーム描く（反転が無ければ通常描画になる）
}
if (!rafId) rafId = requestAnimationFrame(tick);


// ====== ゲーム状態 ======
let search_score = -10000;
const table = new Array(64).fill(0);
const SIZE = 6;
let mode = true;    // true...最強モード   false...最弱モード
let normaldepth = 14;
let lastdepth = 18;
let positions = "";//棋譜用
let txtname = "";
let state = ""; //棋譜用

const gridSize = 6;
let cellSize;
let AIplayer = -1; // 1...黒 -1...白

let rotation = 0;
let rotationboard = [
  [[1,2,3,4,5,6],[7,8,9,10,11,12],[13,14,15,16,17,18],[19,20,21,22,23,24],[25,26,27,28,29,30],[31,32,33,34,35,36]],
  [[1,7,13,19,25,31],[2,8,14,20,26,32],[3,9,15,21,27,33],[4,10,16,22,28,34],[5,11,17,23,29,35],[6,12,18,24,30,36]],
  [[36,35,34,33,32,31],[30,29,28,27,26,25],[24,23,22,21,20,19],[18,17,16,15,14,13],[12,11,10,9,8,7],[6,5,4,3,2,1]],
  [[36,30,24,18,12,6],[35,29,23,17,11,5],[34,28,22,16,10,4],[33,27,21,15,9,3],[32,26,20,14,8,2],[31,25,19,13,7,1]],
];

const board = Array(gridSize).fill().map(() => Array(gridSize).fill(0));  // 0 = 空, 1 = 黒, -1 = 白
let currentPlayer = 1;  // 1: 黒, -1: 白
let vec_table = [
  [-1, -1], [0, -1], [1, -1],  // 左上、上、右上
  [-1, 0], [1, 0],             // 左、右
  [-1, 1], [0, 1], [1, 1]      // 左下、下、右下
];

// ==== AI用ビットボード ====
let OthelloBoard = {
  playerBoard: 0n,
  opponentBoard: 0n,
};

// ==== 共通 Worker 管理（ここが大きな変更点）====
let aiWorker = null;
let nextRequestId = 1;
const pendingRequests = new Map(); // id -> {resolve, reject}
let currentGameToken = 0;          // Resetごとに++して、古い結果を無効化

function ensureAIWorker() {
  if (aiWorker) return;

  aiWorker = new Worker('searchWorker.js');

  aiWorker.onmessage = (e) => {
    const { id, result, error } = e.data;
    const entry = pendingRequests.get(id);
    if (!entry) {
      // すでにキャンセル済み or 古いリクエスト
      return;
    }
    pendingRequests.delete(id);

    if (error) {
      entry.reject(new Error(error));
    } else {
      entry.resolve(result);
    }
  };

  aiWorker.onerror = (err) => {
    console.error('AI worker error:', err);
    for (const { reject } of pendingRequests.values()) {
      reject(err);
    }
    pendingRequests.clear();
  };
}

function resetAIWorker() {
  // ゲームをリセットしたときに呼ぶ
  currentGameToken++;    // これ以前の結果は全部「古いゲーム」扱い
  if (aiWorker) {
    aiWorker.terminate();
    aiWorker = null;
  }
  pendingRequests.clear();
  // 必要ならすぐ新しい Worker を作っておく
  ensureAIWorker();
}

async function callSearch({ playerBoard, opponentBoard, depth, strong, alpha }) {
  ensureAIWorker();

  const id = nextRequestId++;
  const gameTokenAtStart = currentGameToken;

  const p = new Promise((resolve, reject) => {
    pendingRequests.set(id, { resolve, reject });
  });

  aiWorker.postMessage({
    id,
    playerBoard: playerBoard.toString(),
    opponentBoard: opponentBoard.toString(),
    depth,
    strong,
    alpha,
  });

  const pos = await p;

  // この待ちの間にゲームがリセットされていたら無効
  if (gameTokenAtStart !== currentGameToken) {
    return null; // 呼び出し側で「何もしない」ように扱う
  }
  return pos;
}


// ========= ユーティリティ =========
async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}


// ========= 描画関連 =========
function drawStone(cx, cy, radius, color, scaleY = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, scaleY); // 縦つぶしで回転っぽく
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fillStyle = (color === 1) ? '#000' : '#fff';
  ctx.fill();

  ctx.lineWidth = Math.max(1, radius * 0.08);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();

  const grd = ctx.createRadialGradient(-radius * 0.3, -radius * 0.3, radius * 0.1, 0, 0, radius);
  if (color === 1) { // black
    grd.addColorStop(0, 'rgba(255,255,255,0.10)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
  } else { // white
    grd.addColorStop(0, 'rgba(255,255,255,0.7)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
  }
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function queueFlip(row, col, fromColor, toColor) {
  const key = `${row},${col}`;
  flipAnims.set(key, {
    key, row, col, from: fromColor, to: toColor, start: performance.now()
  });
}

function drawBoard() {
  ctx.fillStyle = '#006400';
  ctx.fillRect(0, 0, cellSize * gridSize, cellSize * gridSize);

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 5 * gridSize / 50.;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  const now = performance.now();

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col] === 3) {
        ctx.fillStyle = 'darkred';
        ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
        continue;
      }
      if (board[row][col] === 2 || board[row][col] === -2) {
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(col * cellSize + 1, row * cellSize + 1, cellSize - 2, cellSize - 2);
      }

      const cell = board[row][col];
      if (cell !== 0) {
        const cx = col * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2;
        const r = cellSize / 3;

        const key = `${row},${col}`;
        const anim = flipAnims.get(key);
        if (anim) {
          const t = Math.min(1, (now - anim.start) / FLIP_DURATION);
          const tt = EASE(t);
          const scaleY = Math.abs(Math.cos(Math.PI * tt)); // 1→0→1
          const showing = (tt < 0.5) ? anim.from : anim.to;
          drawStone(cx, cy, r, showing, scaleY);

          if (t >= 1) {
            flipAnims.delete(key);
          }
        } else {
          const color = (cell === 1 || cell === 2) ? 1 : -1;
          drawStone(cx, cy, r, color, 1);
        }
      }
    }
  }
}

function resizeCanvas() {
  const screenSize = Math.min(window.innerWidth * 0.75, 400);
  const dpr = window.devicePixelRatio || 1;

  canvas.style.width = screenSize + "px";
  canvas.style.height = screenSize + "px";
  canvas.width = screenSize * dpr;
  canvas.height = screenSize * dpr;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  cellSize = screenSize / gridSize;

  drawBoard();
}


// ========= ルールロジック =========
function ReturnBoard(row, col) {
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (board[i][j] === 3) board[i][j] = 0;
      if (board[i][j] === 2 || board[i][j] === -2) board[i][j] = board[i][j] / 2;
    }
  }

  let player = currentPlayer;

  for (let [vx, vy] of vec_table) {
    let flipList = [];
    let x = col + vx;
    let y = row + vy;

    while (x >= 0 && x < gridSize && y >= 0 && y < gridSize && board[y][x] === -player) {
      flipList.push([x, y]);
      x += vx; y += vy;
    }

    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && (board[y][x] === player || board[y][x] === 2 * player)) {
      for (let [fx, fy] of flipList) {
        queueFlip(fy, fx, -player, player);
        board[fy][fx] = player;
      }
    }
  }

  board[row][col] = currentPlayer * 2;
  currentPlayer = currentPlayer === 1 ? -1 : 1;
  document.getElementById('status').textContent = currentPlayer === 1 ? "黒のターン" : "白のターン";
}

function GetPositions() {
  let posnum = 0;
  let player = currentPlayer;
  for (let i = 0; i < gridSize; i++)
    for (let j = 0; j < gridSize; j++)
      if (board[i][j] === 3) board[i][j] = 0;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (board[row][col] === 0) {
        for (let [vx, vy] of vec_table) {
          let x = col + vx;
          let y = row + vy;
          if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && (board[y][x] === -player || board[y][x] === -2 * player)) {
            while (true) {
              x += vx; y += vy;
              if (x >= 0 && x < gridSize && y >= 0 && y < gridSize &&
                  (board[y][x] === -player || board[y][x] === -2 * player) && board[y][x] !== 3) {
                continue;
              } else if (x >= 0 && x < gridSize && y >= 0 && y < gridSize &&
                         (board[y][x] === player || board[y][x] === 2 * player) && board[y][x] !== 3) {
                board[row][col] = 3;
                posnum++;
                break;
              } else {
                break;
              }
            }
          }
        }
      }
    }
  }
  for (let i = 0; i < gridSize; i++)
    for (let j = 0; j < gridSize; j++)
      if (board[i][j] === 3 && currentPlayer == AIplayer) board[i][j] = 0;
  return posnum;
}

function displayBoard(b) {
  for (let i = 0; i < SIZE; ++i) {
    let row = '';
    for (let j = 0; j < SIZE; ++j) {
      let bit = 1n << BigInt((SIZE - 1 - i) * SIZE + (SIZE - 1 - j));
      if (b.playerBoard & bit) {
        row += 'B ';
      } else if (b.opponentBoard & bit) {
        row += 'W ';
      } else {
        row += '. ';
      }
    }
    console.log(row);
  }
  console.log('');
}


// ========= AI 本体 =========
async function AI() {
  // ビットボード作成
  OthelloBoard.playerBoard = 0n;
  OthelloBoard.opponentBoard = 0n;

  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (Number(board[row][col]) === Number(AIplayer) || board[row][col] === Number(AIplayer) * 2) {
        OthelloBoard.playerBoard |= 1n << BigInt((5 - row) * 6 + (5 - col));
      } else if (Number(board[row][col]) === -Number(AIplayer) || board[row][col] === -Number(AIplayer) * 2) {
        OthelloBoard.opponentBoard |= 1n << BigInt((5 - row) * 6 + (5 - col));
      }
    }
  }

  let strong_ = mode ? 1 : -1;
  let depth;

  if (countBit(OthelloBoard.playerBoard) + countBit(OthelloBoard.opponentBoard) >= 18) {
    if ((txtname === "whitestrong" || txtname === "whitelose") && search_score === -10000) {
      search_score = await Search1();
    }
    console.log("最終探索だピヨ");
    depth = lastdepth;
  } else if (txtname === "whitestrong" || txtname === "whitelose") {
    console.log("定石だピヨ");
    let num = await Search();
    return PutToPos(num);
  } else {
    depth = normaldepth;
    console.log("通常探索だピヨ");
  }

  const pos = await callSearch({
    playerBoard: OthelloBoard.playerBoard,
    opponentBoard: OthelloBoard.opponentBoard,
    depth,
    strong: strong_,
    alpha: search_score - 1,
  });

  return pos; // null の可能性あり（リセット中の結果）
}

function Recordpos(p) {
  positions += String(p);
  positions += (currentPlayer == AIplayer) ? "," : ".";
  let truenum = String(PutToPos(p));
  if (truenum.length === 1) truenum = truenum.padStart(2, '0');
  state += truenum;
  state += (currentPlayer == AIplayer) ? "," : ".";
}

function PutToPos(pos) {
  if (rotation === -1) {
    if (pos === 9) rotation = 0;
    if (pos === 14) rotation = 1;
    if (pos === 28) rotation = 2;
    if (pos === 23) rotation = 3;
    if (txtname === "blackstrong") rotation = 0;
    if (txtname === "blacklose") rotation = 0;
  }
  let putrow = Math.floor((pos - 1) / 6);
  let putcol = (pos - 1) % 6;
  return rotationboard[rotation][putrow][putcol];
}


// ========= 入力処理 =========
canvas.addEventListener('click', async (event) => {
  const x = event.offsetX;
  const y = event.offsetY;
  const row = Math.floor(y / cellSize);
  const col = Math.floor(x / cellSize);

  if (board[row][col] === 3) {
    let num1 = row * 6 + col + 1;
    console.log("put;", num1);
    Recordpos(num1);
    ReturnBoard(row, col);

    let num = GetPositions();
    drawBoard();
    if (num == 0) {
      if (PassCheck(",") == true) return;
      else { drawBoard(); return; }
    }

    // AIのターン
    while (true) {
      const buttons = document.querySelectorAll("button");
      buttons.forEach(btn => btn.disabled = true);

      await sleep(1000);

      buttons.forEach(btn => btn.disabled = false);

      const start = performance.now();
      const gameTokenBeforeAI = currentGameToken;
      let put = await AI();

      // Reset中に返ってきた結果なら無視
      if (put === null || gameTokenBeforeAI !== currentGameToken) {
        return;
      }

      // 安全チェック：1〜36以外ならAIエラー扱い
      if (!Number.isInteger(put) || put < 1 || put > 36) {
        console.error("INVALID AI MOVE:", put);
        document.getElementById('status').textContent =
          "AIエラー（端末のメモリ不足など）でこれ以上打てません。リロードしてください。";
        document.getElementById('status').style.color = "red";
        document.getElementById('status').style.fontWeight = 'bold';
        return;
      }

      Recordpos(put);
      put = String(put);
      console.log("putpos:", put);
      const end = performance.now();
      console.log(`実行時間: ${(end - start).toFixed(4)} ms`);

      ReturnBoard(Math.floor((put - 1) / 6), (put - 1) % 6);
      drawBoard();
      num = GetPositions();
      if (num == 0) {
        if (PassCheck(".") == true) return;
        else continue;
      } else break;
    }
    drawBoard();
  }
});

function PassCheck(char) {
  state += ("-1" + char);
  currentPlayer = currentPlayer === 1 ? -1 : 1;
  let num = GetPositions();
  if (num === 0) { Result(); return true; }
  else return false;
}

function CountStone(player) {
  let num = 0;
  for (let i = 0; i < gridSize; i++)
    for (let j = 0; j < gridSize; j++)
      if (board[i][j] === player || board[i][j] === 2 * player) num++;
  return num;
}

function Result() {
  let black = CountStone(1);
  let white = CountStone(-1);
  if (black > white) document.getElementById('status').textContent = "黒の勝ち";
  else if (white > black) document.getElementById('status').textContent = "白の勝ち";
  else document.getElementById('status').textContent = "引き分け";
  document.getElementById('status').style.color = "red";
  document.getElementById('status').style.fontWeight = 'bold';
}

function Start() {
  search_score = -10000;
  if (Number(AIplayer) === Number(currentPlayer)) {
    let put = PutToPos(9);
    positions += String(put) + ",";
    console.log(put);
    ReturnBoard(Math.floor(put / 6), put % 6 - 1);
    state += (String(put) + ",");
    GetPositions();
    drawBoard();
  }
}

function Reset() {
  document.getElementById('status').style.color = "black";
  document.getElementById('status').style.fontWeight = 'normal';
  document.getElementById('status').textContent = "黒のターン";

  currentPlayer = 1;
  rotation = -1;
  state = "";
  positions = "";

  for (let i = 0; i < gridSize; i++)
    for (let j = 0; j < gridSize; j++)
      board[i][j] = 0;

  board[2][2] = -1;
  board[2][3] = 1;
  board[3][2] = 1;
  board[3][3] = -1;

  // ★ ゲームリセット時にAI側も世代を進めてメモリを解放
  resetAIWorker();

  GetPositions();
  resizeCanvas();
}

document.getElementById('startButton').addEventListener('click', () => {
  positions = "";
  const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
  mode = (Number(difficulty) === 1); // 1なら強い, それ以外は弱い

  if (mode == true) positions += "1:";
  else positions += "-1:";

  AIplayer = Number(document.querySelector('input[name="turn"]:checked').value);
  positions = positions + String(AIplayer) + ":";

  if (AIplayer === -1) txtname = "white";
  else txtname = "black";
  if (mode == true) txtname += "strong";
  else txtname += "poor";

  resetGame();
});

function resetGame() {
  Reset();
  Start();
}

window.addEventListener('resize', resizeCanvas);

// 初期化
ensureAIWorker();
Reset();
Start();

function Search(b) {
    //console.log(1332)
    let res = -1, score, alpha = -10000, beta = 10000;
    let legalMoves = makeLegalBoard(b.playerBoardup, b.playerBoarddown, b.opponentBoardup,b.opponentBoarddown); // Use the player's board (white)
    let depth;
    if(countBit(b.playerBoardup) +countBit(b.playerBoarddown)+countBit(b.opponentBoardup)+countBit(b.opponentBoarddown) >= 19) depth = lastdepth;
    else depth = normaldepth;
    console.log("depth:",depth)  
    //displayBoard(b);
    //getBinarySegment(legalMoves[0]);
    //getBinarySegment(legalMoves[1]);
    while (legalMoves[0] !== 0 || legalMoves[1] !== 0) {
        //console.log(".................................................")
        if(legalMoves[1] !== 0){//下位ビット
            let coord = SIZE * SIZE - getNumberZeros(legalMoves[1]);
            let bitposition = legalMoves[1] & (~legalMoves[1] + 1);
            let newB = structuredClone(b);
            newB = flip0(newB,newB.playerBoardup,newB.playerBoarddown,newB.opponentBoardup,newB.opponentBoarddown, bitposition);
            score = -Nega_alpha(newB, depth - 1, false, -beta, -alpha);
            console.log("coord:"+ coord + " score:" + score);
            if (alpha < score) {
                alpha = score;
                res = coord;
            }
            legalMoves[1] &= legalMoves[1] - 1;
        }   
        else{//上位ビット
            let coord = SIZE * SIZE / 2 - getNumberZeros(legalMoves[0]);
            let bitposition = legalMoves[0] & (~legalMoves[0] + 1);
            let newB = structuredClone(b);
            newB = flip1(newB,newB.playerBoardup,newB.playerBoarddown,newB.opponentBoardup,newB.opponentBoarddown, bitposition);
            score = -Nega_alpha(newB, depth - 1, false, -beta, -alpha);
            console.log("coord:"+ coord + " score:" + score);
            if (alpha < score) {
                alpha = score;
                res = coord;
            }
            legalMoves[0] &= legalMoves[0] - 1;
        }
    }
    console.log("res:", res);
    return res;
}

function countBit(board) {
    board = board - ((board >> 1n) & 0x5555555555555555n); 
    board = (board & 0x3333333333333333n) + ((board >> 2n) & 0x3333333333333333n);
    board = (board + (board >> 4n)) & 0x0f0f0f0f0f0f0f0fn;
    board = board + (board >> 8n);
    board = board + (board >> 16n);
    board = board + (board >> 32n);
    return Number(board & 0x0000007fn);
}

