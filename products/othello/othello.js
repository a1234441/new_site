"use strict";
const canvas = document.getElementById('othelloBoard');
const ctx = canvas.getContext('2d');
//python -m http.server 8000
//http://localhost:8000

// グリッドサイズとボード設定
//203   234行目


// === flip animation settings ===
const FLIP_DURATION = 1000; // ms（好みで調整）
const EASE = t => t<.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2,3)/2; // cubic easeInOut

// 反転アニメのキュー {key:"r,c", row, col, from:1|-1, to:1|-1, start:ms}
const flipAnims = new Map();

// 毎フレーム駆動
let rafId = 0;
function tick() {
  rafId = requestAnimationFrame(tick);
  drawBoard(); // 毎フレーム描く（反転が無ければ通常描画になる）
}
if (!rafId) rafId = requestAnimationFrame(tick);



let search_score=-10000;
const table = new Array(64).fill(0);
const SIZE = 6;
let mode = true;    // true...最強モード   false...最弱モード
let normaldepth=14;
let lastdepth=18;
let positions="";//棋譜用
let txtname="";
let state=""; //棋譜用

const gridSize = 6;
let cellSize;
let AIplayer=-1; // 1...黒 -1...白
let requestIdCounter = 0;
let requestId=0;

let rotation=0;
let rotationboard=[
    [[1,2,3,4,5,6],[7,8,9,10,11,12],[13,14,15,16,17,18],[19,20,21,22,23,24],[25,26,27,28,29,30],[31,32,33,34,35,36]],
    [[1,7,13,19,25,31],[2,8,14,20,26,32],[3,9,15,21,27,33],[4,10,16,22,28,34],[5,11,17,23,29,35],[6,12,18,24,30,36]],
    [[36,35,34,33,32,31],[30,29,28,27,26,25],[24,23,22,21,20,19],[18,17,16,15,14,13],[12,11,10,9,8,7],[6,5,4,3,2,1]],
    [[36,30,24,18,12,6],[35,29,23,17,11,5],[34,28,22,16,10,4],[33,27,21,15,9,3],[32,26,20,14,8,2],[31,25,19,13,7,1]],
]



const board = Array(gridSize).fill().map(() => Array(gridSize).fill(0));  // 0 = 空, 1 = 黒, -1 = 白
let currentPlayer = 1;  // 1: 黒, -1: 白
let vec_table = [
    [-1, -1], [0, -1], [1, -1],  // 左上、上、右上
    [-1, 0], [1, 0],  // 左、右
    [-1, 1], [0, 1], [1, 1]  // 左下、下、右下
];

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}


let OthelloBoard = {
    playerBoard: 0n,
    opponentBoard: 0n, 
};


function drawStone(cx, cy, radius, color, scaleY = 1) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(1, scaleY); // ←縦つぶしで回転っぽく
  // 本体
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI*2);
  ctx.closePath();
  ctx.fillStyle = (color === 1) ? '#000' : '#fff';
  ctx.fill();
  // 縁の陰影（軽い立体感）
  ctx.lineWidth = Math.max(1, radius*0.08);
  ctx.strokeStyle = 'rgba(0,0,0,0.35)';
  ctx.stroke();
  // ハイライト
  const grd = ctx.createRadialGradient(-radius*0.3, -radius*0.3, radius*0.1, 0, 0, radius);
  if (color === 1) { // black
    grd.addColorStop(0, 'rgba(255,255,255,0.10)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
  } else { // white
    grd.addColorStop(0, 'rgba(255,255,255,0.7)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
  }
  ctx.fillStyle = grd;
  ctx.beginPath();
  ctx.arc(0, 0, radius, 0, Math.PI*2);
  ctx.fill();
  ctx.restore();
}

function queueFlip(row, col, fromColor, toColor) {
  const key = `${row},${col}`;
  flipAnims.set(key, {
    key, row, col, from: fromColor, to: toColor, start: performance.now()
  });
}





// 石の描画
/*function drawBoard() {
    // 背景を黒に塗りつぶす

    ctx.fillStyle = '#006400';
    ctx.fillRect(0, 0, cellSize*gridSize, cellSize*gridSize);
    
    // グリッド線を描画
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 5*gridSize/50.;
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
        }
    }

    // 石を描画
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (board[row][col] === 3 ) {
                ctx.fillStyle = 'darkred';
                ctx.fillRect(col * cellSize+1, row * cellSize+1, cellSize-2, cellSize-2);
                continue;
            }
            if (board[row][col] === 2 || board[row][col] === -2) {
                ctx.fillStyle = 'lightblue';
                ctx.fillRect(col * cellSize+1, row * cellSize+1, cellSize-2, cellSize-2);
            }
            if (board[row][col] !== 0) {
                ctx.beginPath();
                ctx.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                if(board[row][col] === 1 || board[row][col] === 2) ctx.fillStyle='black';
                else ctx.fillStyle='white';
                ctx.fill();
            }
        }
    }
}*/

function drawBoard() {
  // 盤面背景と線はそのまま
  ctx.fillStyle = '#006400';
  ctx.fillRect(0, 0, cellSize*gridSize, cellSize*gridSize);

  ctx.strokeStyle = 'black';
  ctx.lineWidth = 5*gridSize/50.;
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      ctx.strokeRect(col * cellSize, row * cellSize, cellSize, cellSize);
    }
  }

  const now = performance.now();

  // 石／候補描画
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      // マーカー
      if (board[row][col] === 3 ) {
        ctx.fillStyle = 'darkred';
        ctx.fillRect(col * cellSize+1, row * cellSize+1, cellSize-2, cellSize-2);
        continue;
      }
      if (board[row][col] === 2 || board[row][col] === -2) {
        ctx.fillStyle = 'lightblue';
        ctx.fillRect(col * cellSize+1, row * cellSize+1, cellSize-2, cellSize-2);
      }

      // 石本体
      const cell = board[row][col];
      if (cell !== 0) {
        const cx = col * cellSize + cellSize / 2;
        const cy = row * cellSize + cellSize / 2;
        const r  = cellSize / 3;

        const key = `${row},${col}`;
        const anim = flipAnims.get(key);
        if (anim) {
          const t = Math.min(1, (now - anim.start) / FLIP_DURATION);
          const tt = EASE(t);
          // 0→0.5で from の面が潰れていく、0.5→1で to の面が開く
          const scaleY = Math.abs(Math.cos(Math.PI * tt)); // 1→0→1
          const showing = (tt < 0.5) ? anim.from : anim.to;
          drawStone(cx, cy, r, showing, scaleY);

          if (t >= 1) {
            flipAnims.delete(key); // 完了
          }
        } else {
          // 通常描画
          const color = (cell === 1 || cell === 2) ? 1 : -1;
          drawStone(cx, cy, r, color, 1);
        }
      }
    }
  }

  // ターン表示は元のままでOK
}




// ウィンドウ幅に基づいてキャンバスをリサイズ
/*function resizeCanvas() {
    const screenSize = Math.min(window.innerWidth * 0.8, 600); // 最大600pxまで
    canvas.width = screenSize;
    canvas.height = screenSize;
    cellSize = canvas.width / gridSize;
    drawBoard();
}*/
function resizeCanvas() {
    const screenSize = Math.min(window.innerWidth * 0.8, 600); // CSS上の表示サイズ
    const dpr = window.devicePixelRatio || 1; // デバイスピクセル比（Retina対応）

    canvas.style.width = screenSize + "px";       // 表示サイズ（CSS）
    canvas.style.height = screenSize + "px";      // 表示サイズ（CSS）
    canvas.width = screenSize * dpr;              // 実際のピクセルサイズ
    canvas.height = screenSize * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // キャンバスのスケールを調整（すべての描画にdprがかかる）

    cellSize = screenSize / gridSize; // 座標計算はCSSベースでOK

    drawBoard();
}


/*function ReturnBoard(row , col) {
    for (let i = 0; i < gridSize; i++) {
        for (let j = 0; j < gridSize; j++) {
            if (board[i][j] === 3) board[i][j] = 0;
            if (board[i][j] === 2 || board[i][j] === -2) board[i][j] = board[i][j]/2;
        }
    }
    let player = currentPlayer;
    for (let [vx, vy] of vec_table) {
        let flipList = [];
        let x = col + vx;
        let y = row + vy;
        // 隣接する石がプレイヤーの石と違う場合、ひっくり返せる可能性がある
        while (x >= 0 && x < gridSize && y >= 0 && y < gridSize && board[y][x] === -player) {
            flipList.push([x, y]);x += vx;y += vy;
            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && board[y][x] === player)// プレイヤーの石がある場合は、ひっくり返し実行
                for (let [flipX, flipY] of flipList)  board[flipY][flipX] = player;
        }
    }
    board[row ][col] = currentPlayer*2;
    currentPlayer = currentPlayer === 1 ? -1 : 1;  // ターン交代
    document.getElementById('status').textContent = currentPlayer === 1 ? "黒のターン" : "白のターン";
}*/

function ReturnBoard(row , col) {
  // マーカー/直前置き石のリセットはそのまま
  for (let i = 0; i < gridSize; i++) {
    for (let j = 0; j < gridSize; j++) {
      if (board[i][j] === 3) board[i][j] = 0;
      if (board[i][j] === 2 || board[i][j] === -2) board[i][j] = board[i][j]/2;
    }
  }

  let player = currentPlayer;

  for (let [vx, vy] of vec_table) {
    let flipList = [];
    let x = col + vx;
    let y = row + vy;

    // まず“挟み列”を収集
    while (x >= 0 && x < gridSize && y >= 0 && y < gridSize && board[y][x] === -player) {
      flipList.push([x, y]);
      x += vx; y += vy;
    }
    // 収束先が自石なら有効
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && (board[y][x] === player || board[y][x] === 2*player)) {
      // ここで論理反転 + アニメ予約
      for (let [fx, fy] of flipList)  {
        // from は -player, to は player
        queueFlip(fy, fx, -player, player);
        board[fy][fx] = player; // ←ロジックは即時でOK（AI探索・合法手生成に影響しない）
      }
    }
  }

  // 置いた石そのものを“ポン”と出すアニメ（オプション）
  // 置き石を2/-2で一旦描いてる仕様を尊重してそのまま
  board[row][col] = currentPlayer*2;

  currentPlayer = currentPlayer === 1 ? -1 : 1;  // ターン交代
  document.getElementById('status').textContent = currentPlayer === 1 ? "黒のターン" : "白のターン";
}




function GetPositions() {
    let posnum=0;
    let player = currentPlayer;
    for (let i = 0; i < gridSize; i++) 
        for (let j = 0; j < gridSize; j++) 
            if (board[i][j] === 3) board[i][j] = 0;
        
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (board[row][col] === 0) {            // 石を置いていないマスのみチェック
                for (let [vx, vy] of vec_table) {
                    let x = col + vx;let y = row + vy;
                    // マスの範囲内、かつプレイヤーの石と異なる石がある場合、その方向は引き続きチェック
                    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && (board[y][x] === -player || board[y][x] === -2*player )) {
                        while (true) {
                            x += vx;y += vy;
                            // プレイヤーの石と異なる色の石がある場合、その方向は引き続きチェック
                            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && (board[y][x] === -player || board[y][x] === -2*player ) && board[y][x] !== 3) 
                                continue;
                            // プレイヤーの石と同色の石がある場合、石を置けるためインデックスを保存
                            else if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && (board[y][x] === player || board[y][x] === 2*player ) && board[y][x] !== 3) {
                                board[row][col] = 3;
                                posnum++;
                                break;
                            } 
                            else break;
                        }
                    }
                }
            }
        }
    }
    for (let i = 0; i < gridSize; i++) 
        for (let j = 0; j < gridSize; j++) 
            if (board[i][j] === 3 && currentPlayer==AIplayer) board[i][j] = 0;
    return posnum;
}

// `b`のボード情報を基に、プレイヤーの石（黒・白）や空きの状態を表示する関数
function displayBoard(b) {
    for (let i = 0; i < SIZE; ++i) {
        let row = '';
        for (let j = 0; j < SIZE; ++j) {
            let bit = 1n << BigInt((SIZE - 1 - i) * SIZE + (SIZE - 1 - j));
            if (b.playerBoard & bit) {
                row += 'B '; // 黒の石
            } else if (b.opponentBoard & bit) {
                row += 'W '; // 白の石
            } else {
                row += '. '; // 空き
            }
        }
        console.log(row);
    }
    console.log('');
}


let currentRequestId = 0;

async function AI(){
    //AIとプレイヤーの石をビットに変換する
    OthelloBoard.playerBoard = 0n;
    OthelloBoard.opponentBoard = 0n;
    
    for (let row = 0; row < gridSize; row++) {
        let row1='';
        for (let col = 0; col < gridSize; col++) {
            if (Number(board[row][col]) === Number(AIplayer) || board[row][col] === Number(AIplayer)*2) {
                row1 += 'B '; // 黒の石
                OthelloBoard.playerBoard |= 1n << BigInt((5-row)*6+(5-col));
            }
            else if (Number(board[row][col]) === -Number(AIplayer) || board[row][col] === -Number(AIplayer)*2) {
                row1 += 'W '; // 白の石
                OthelloBoard.opponentBoard |= 1n << BigInt((5-row)*6+(5-col));
            } 
            else row1+= '. '; // 空き
        }
        //console.log(row1);
    } 

    let strong_;
    if(mode===true)strong_=1;
    else strong_=-1
    let depth;
    if(countBit(OthelloBoard.playerBoard)+countBit(OthelloBoard.opponentBoard) >= 18) {
        if(txtname==="whitestrong" && search_score===-10000){
            search_score=await Search1();
            //console.log("search_score:",search_score);
        }
        console.log("最終探索だピヨ");depth = lastdepth;
    }
    //else {depth = normaldepth};
    else if(txtname==="whitestrong"){
        console.log("定石だピヨ");
        let num=await Search();
        return PutToPos(num);
    }
    else{
        depth = normaldepth;
        console.log("通常探索だピヨ");
    }

    //どこに置くべきか決定する
    const worker = new Worker('searchWorker.js');
    requestId = ++requestIdCounter;

    const pos = await new Promise((resolve, reject) => {
        const handleMessage = (e) => {
            if (e.data.id !== requestId) return; // ← 古いレスポンスは無視
            worker.removeEventListener("message", handleMessage);
            resolve(e.data.result);
        };

        worker.addEventListener("message", handleMessage);
        worker.onerror = (err) => {
            worker.removeEventListener("message", handleMessage);
            reject(err);
        };

        worker.postMessage({
            id: requestId,
            playerBoard: OthelloBoard.playerBoard.toString(),
            opponentBoard: OthelloBoard.opponentBoard.toString(),
            depth,
            strong: strong_,
            alpha: search_score-1
        });
    });
    console.log("動作中ではない");
    return pos;
}

function Recordpos(p){
    positions+=String(p);
    positions+=(currentPlayer==AIplayer)? "," : ".";
    let truenum=String(PutToPos(p));
    if (truenum.length === 1) truenum = truenum.padStart(2, '0');
    state+=truenum;
    state+=(currentPlayer==AIplayer)? "," : ".";
    return;
}


function PutToPos(pos){
    if(rotation===-1){
        if(pos===9) rotation=0;
        if(pos===14) rotation=1;
        if(pos===28) rotation=2;
        if(pos===23) rotation=3;
        if(txtname!=="whitestrong") rotation=0;
    }
    let putrow = Math.floor((pos-1) / 6);
    let putcol = (pos-1) % 6;
    return    rotationboard[rotation][putrow][putcol];
}


// マウスクリックで石を置く
canvas.addEventListener('click',async (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);

    if (board[row][col] === 3) {    // クリックしたセルが空であれば石を置く
        let num1=row*6+col+1;
        console.log("put;",num1);
        Recordpos(num1);
        ReturnBoard(row, col);

        let num=GetPositions();
        drawBoard();
        if(num==0){
            if(PassCheck(",")==true)return;
            else{drawBoard();return;}
        }  
        /*if (Module._multiply_by_two) {
            var result = Module._multiply_by_two(10);
            console.log("The result is: " + result);  // 結果をコンソールに出力
        } else {
            console.log("関数が準備できていません");
        }*/

        //AIのターン
        while(true){//置けなくなるまでひたすら置いていく
            const buttons = document.querySelectorAll("button");
            buttons.forEach(btn => btn.disabled = true);

            await sleep(1000); // 読む深さによる待ち

            buttons.forEach(btn => btn.disabled = false);

            const start = performance.now();
            let put= await AI();
            if(requestIdCounter!==requestId)return;
            
            Recordpos(put);
            put=String(put);
            console.log("putpos:",put);
            const end = performance.now();
            console.log(`実行時間: ${(end - start).toFixed(4)} ms`);
            ReturnBoard(Math.floor((put-1) / 6), (put-1) % 6);
            drawBoard();
            num=GetPositions();
            if(num==0){
                if(PassCheck(".")==true)return;
                else continue;
            }
            else break;
        }   
        drawBoard();
    }

});


function PassCheck(char){
    state+=("-1"+char);
    currentPlayer = currentPlayer === 1 ? -1 : 1;  //自分が石をおける→continue  おけない場合はResult()で終了
    let num=GetPositions();
    if(num===0){Result();return true;}//pass
    else return false;;//no pass
}



function CountStone(player){
    let num=0;

    for (let i = 0; i < gridSize; i++) 
        for (let j = 0; j < gridSize; j++) 
            if (board[i][j] === player || board[i][j] === 2*player) num++;
    return num;
}

function Result(){
    let black=CountStone(1);
    let white=CountStone(-1);
    if(black>white) document.getElementById('status').textContent = "黒の勝ち";
    else if(white>black)document.getElementById('status').textContent = "白の勝ち";
    else document.getElementById('status').textContent = "引き分け";
    document.getElementById('status').style.color = "red";  // 黒に変更
    document.getElementById('status').style.fontWeight = 'bold';  // 太字に設定
}

function Start(){
    search_score=-10000;
    if (Number(AIplayer) === Number(currentPlayer)) {
        let put=PutToPos(9);
        positions+=String(put)+",";
        console.log(put);
        ReturnBoard(Math.floor(put / 6), put % 6-1);//row,col
        state+=(String(put)+",");
        GetPositions();
        drawBoard();
    }
    return;
}


function roundUpLastTwoDigits(num) {
    let rounded = Math.ceil(num / 100) * 100; // 下二桁を切り上げ
    return rounded;
}

function Reset() {
    //initializeTable();
    document.getElementById('status').style.color = "black";  // 黒色に戻す
    document.getElementById('status').style.fontWeight = 'normal';  // 元の太さに戻す
    document.getElementById('status').textContent = "黒のターン";
    currentPlayer = 1;
    rotation=-1;
    state="";
    for (let i = 0; i < gridSize; i++) 
        for (let j = 0; j < gridSize; j++) 
            board[i][j] = 0;
    board[2][2] = -1;  // 白
    board[2][3] = 1;   // 黒
    board[3][2] = 1;   // 黒
    board[3][3] = -1;  // 白
    requestIdCounter = roundUpLastTwoDigits(requestIdCounter);
    GetPositions();
    resizeCanvas();
    Start();
}


document.getElementById('startButton').addEventListener('click', () => {
    positions="";
    const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    //console.log("難易度:",difficulty);
    mode = true ? Number(difficulty) === 1 : false;
    if(mode==true)positions+="1:";
    else positions+="-1:";
    AIplayer = document.querySelector('input[name="turn"]:checked').value;
    positions=positions+String(AIplayer)+":";

    if( Number(AIplayer)===-1) txtname="white";
    else txtname="black";
    if(mode==true) txtname+="strong";
    else txtname+="poor";

    //console.log("txt:",txtname);
    //console.log("turn:",AIplayer);
    resetGame();
});

function resetGame() {
    // ゲームをリセットし、選択されたモードでスタート
    Reset();
    Start();
}

window.addEventListener('resize', resizeCanvas);

//---------------------------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------
//---------------------------------------------------------------------------------------------------------------------------------------------------------------------

document.getElementById("generateTextButton").addEventListener("click", function() {
    document.getElementById("outputArea").innerText = "棋譜:"+positions; // 画面に表示
    //console.log("p:"+positions);
});


document.getElementById("copyButton").addEventListener("click", function() {
    // テキストエリアを取得
    const outputArea = document.getElementById("outputArea");
    outputArea.select();
    outputArea.setSelectionRange(0, 99999); // モバイル対応

    // コピーコマンドを実行
    try {
        const successful = document.execCommand('copy'); // 'copy' コマンド実行
        if (successful) {
            console.log("コピー成功！"); // デバッグ用
        } else {
            console.error("コピー失敗！");
        }
    } catch (err) {
        console.error("コピーできませんでした:", err);
    }
});



async function Search() {
    let fileName = txtname+".txt"; // ファイル名

    try {

        // fetchを使用してサーバーからファイルを非同期に取得
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
        }
        // ファイル内容をテキストとして取得
        const content = await response.text();
        // ファイル内容を行ごとに分割
        const lines = content.split('\n');
        console.log(state);
        // 各行を通常のforループで処理（早期リターン可能）
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index];
            if (line.includes(state)) { // "state" が含まれるか確認
                const stateIndex = line.indexOf(state);
                
                // state の直後の2文字を抽出するため、state.length だけ先頭をずらす
                if (line.length >= stateIndex + state.length + 2) {
                    let extractedStr = line.slice(stateIndex + state.length, stateIndex + state.length + 2);
                    // もし extractedStr の長さが 1 文字なら、先頭に "0" を付加
                    if (extractedStr.length === 1) {
                        extractedStr = extractedStr.padStart(2, '0');
                    }
                    // 文字列を整数に変換
                    const number = parseInt(extractedStr, 10);
                    //console.log(`Found number on line ${index + 1}: ${number}`);
                    return number; // 必要な数字を見つけたらすぐに返す
                }
            }
        }
    } catch (error) {
        // エラーハンドリング
        console.error('Error in Search function:', error);
    }
    console.log("No matching line found:", state); // 見つからなかった場合のログ
    return 0; // 見つからなかった場合は 0 を返す
}



async function Search1() {
    let fileName = txtname + ".txt"; // ファイル名

    try {
        // fetchを使用してサーバーからファイルを非同期に取得
        const response = await fetch(fileName);
        if (!response.ok) {
            throw new Error(`Failed to fetch file: ${response.status}`);
            }
        const content = await response.text();
        const lines = content.split('\n');
        // ★ここから追加・変更！ stateの末尾3文字を取り除く
        let searchState = state; // まずstateの値をコピー
        searchState = state.slice(0, -3); // 末尾3文字を取り除く
        for (let index = 0; index < lines.length; index++) {
            const line = lines[index].trim(); // 各行の前後空白や改行をtrimする
            if (line.includes(searchState)) {
                const colonIndex = line.indexOf(':'); // ':' の位置を探す
                if (colonIndex !== -1 && colonIndex < line.length - 1) {
                    let extractedStr = line.slice(colonIndex + 1).trim();
                    const number = parseInt(extractedStr, 10);
                    // NaN (Not a Number) でない、つまり有効な数字に変換できた場合
                    if (!isNaN(number)) {
                        return number; // 必要な数字を見つけたらすぐに返す
                    }
                }
            }
        }
    } catch (error) {
        // エラーハンドリング
        console.error('Error in Search function:', error);
    }
    console.log("No matching line found (including modified state):", searchState); // 見つからなかった場合のログ
    return 0; // 見つからなかった場合は 0 を返す
}


function getBinarySegment(num) {
    let binaryString = num.toString(2).padStart(18, '0');
    //console.log(binaryString);
    console.log(binaryString.slice(0,6));
    console.log(binaryString.slice(6,12));
    console.log(binaryString.slice(12,18));
}


// `board`に基づいて、空きと石の状態を表示する関数
function displayLegal(board) {
    for (let i = 0; i < SIZE; ++i) {
        let row = '';
        for (let j = 0; j < SIZE; ++j) {   
            let bit = 1n << BigInt((SIZE - 1 - i) * SIZE + (SIZE - 1 - j));
            row += (board & bit) ? 'o ' : '. '; // 石か空きかを表示
        }
        console.log(row);
    }
    console.log('');
}


// `b`のボード情報を基に、プレイヤーの石（黒・白）や空きの状態を表示する関数
function displayBoard(b) {
    for (let i = 0; i < SIZE; ++i) {
        let row = '';
        row += i + ' ';
        if(i <=2 ){
            for (let j = 0; j < SIZE; ++j) {
                let bit = 1 << (SIZE - 4 - i) * SIZE + (SIZE - 1 - j);
                if (b.playerBoardup & bit) {
                    row += 'B '; // 黒の石
                } else if (b.opponentBoardup & bit) {
                    row += 'W '; // 白の石
                } else {
                    row += '. '; // 空き
                }
            }
        }
        else{
            for (let j = 0; j < SIZE; ++j) {
                let bit = 1 << (SIZE - 1 - i) * SIZE + (SIZE - 1 - j);
                if (b.playerBoarddown & bit) {
                    row += 'B '; // 黒の石
                } else if (b.opponentBoarddown & bit) {
                    row += 'W '; // 白の石
                } else {
                    row += '. '; // 空き
                }
            }
        }
        console.log(row);
    }
    console.log('');
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
