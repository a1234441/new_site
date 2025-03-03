"use strict";
const canvas = document.getElementById('othelloBoard');
const ctx = canvas.getContext('2d');

// グリッドサイズとボード設定

const table = new Array(64).fill(0);
const SIZE = 6;
let mode = true;    // true...最強モード   false...最弱モード
let normaldepth=10;
let lastdepth=18;


const gridSize = 6;
let cellSize;
let AIplayer=-1; // 1...黒　　-1...白

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
    turn: 0 
};

// 石の描画
function drawBoard() {
    // 背景を黒に塗りつぶす
    ctx.fillStyle = '#006400';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // グリッド線を描画
    ctx.strokeStyle = 'black';
    ctx.lineWidth = 2;
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
                //board[row][col] = board[row][col] / 2;// その後、値を1/2倍して配列に代入
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
}

// ウィンドウ幅に基づいてキャンバスをリサイズ
function resizeCanvas() {
    const screenSize = Math.min(window.innerWidth * 0.8, 600); // 最大600pxまで
    canvas.width = screenSize;
    canvas.height = screenSize;
    cellSize = canvas.width / gridSize;
    drawBoard();
}




function ReturnBoard(row , col) {
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
                    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && board[y][x] === -player) {
                        while (true) {
                            x += vx;y += vy;
                            // プレイヤーの石と異なる色の石がある場合、その方向は引き続きチェック
                            if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && board[y][x] === -player && board[y][x] !== 3) 
                                continue;
                            // プレイヤーの石と同色の石がある場合、石を置けるためインデックスを保存
                            else if (x >= 0 && x < gridSize && y >= 0 && y < gridSize && board[y][x] === player && board[y][x] !== 3) {
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

function AI(){
    //AIとプレイヤーの石をビットに変換する
    OthelloBoard.playerBoard = 0n;
    OthelloBoard.opponentBoard = 0n;
    OthelloBoard.turn = AIplayer;
    
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
    //console.log('');


    //どこに置くべきか決定する
    let pos=Search(OthelloBoard);
    console.log(pos);
    return pos;
}

// マウスクリックで石を置く
canvas.addEventListener('click',async (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);

    // クリックしたセルが空であれば石を置く
    if (board[row][col] === 3) {
        ReturnBoard(row, col);
        let num1=row*6+col+1;
        console.log(num1);
        board[row][col] = currentPlayer*2;
        
        currentPlayer = currentPlayer === 1 ? -1 : 1;  // ターン交代
        let num=GetPositions();
        drawBoard();
        if(num===0){//相手pass
            currentPlayer = currentPlayer === 1 ? -1 : 1;  // ターン交代
            num=GetPositions();
            if(num===0){
                Result();
                return;
            }
            else{
                drawBoard();
                document.getElementById('status').textContent = currentPlayer === 1 ? "黒のターン" : "白のターン";
                return;
            }
        }
        document.getElementById('status').textContent = currentPlayer === 1 ? "黒のターン" : "白のターン";
        

        //AIのターン
        while(true){//置けなくなるまでひたすら置いていく
            drawBoard();
            await sleep(1000);//読む深さによってここの時間を変更する
            let put= AI();
            let putrow = Math.floor((put-1) / 6);
            let putcol = (put-1) % 6;
            ReturnBoard(putrow, putcol);
            board[putrow][putcol] = currentPlayer*2;
            drawBoard();

            currentPlayer = currentPlayer === 1 ? -1 : 1;  //プレイヤーが石をおける→break
            num=GetPositions();
            if(num!==0) break;

            currentPlayer = currentPlayer === 1 ? -1 : 1;  //自分が石をおける→continue  おけない場合はResult()で終了
            num=GetPositions();
            if(num===0){
                Result();
                return;
            }   
            else continue;
        }   
        drawBoard();
        document.getElementById('status').textContent = currentPlayer === 1 ? "黒のターン" : "白のターン";
        
    }

});


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
    if (Number(AIplayer) === Number(currentPlayer)) {
        let put= AI();
        console.log(put);
        let putrow = Math.floor(put / 6);
        let putcol = put % 6-1;
        console.log(putrow);
        console.log(putcol);
        ReturnBoard(putrow, putcol);
        board[putrow][putcol] = currentPlayer*2;
        currentPlayer = currentPlayer === 1 ? -1 : 1;  // ターン交代
        GetPositions();
        drawBoard();
        document.getElementById('status').textContent = currentPlayer === 1 ? "黒のターン" : "白のターン";
    }
    return;
}



function Reset() {
    initializeTable();
    currentPlayer = 1;
    for (let i = 0; i < gridSize; i++) 
        for (let j = 0; j < gridSize; j++) 
            board[i][j] = 0;
    board[2][2] = -1;  // 白
    board[2][3] = 1;   // 黒
    board[3][2] = 1;   // 黒
    board[3][3] = -1;  // 白
    GetPositions();
    resizeCanvas();
    Start();
}


document.getElementById('startButton').addEventListener('click', () => {
    const difficulty = document.querySelector('input[name="difficulty"]:checked').value;
    console.log("難易度:",difficulty);
    mode = true ? difficulty === 1 : false;
    AIplayer = document.querySelector('input[name="turn"]:checked').value;

    console.log("turn:",AIplayer);
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


const outflank=
[[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x04,0x00,0x01,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x08,0x00,0x02,0x00,0x00],[0x00,0x08,0x00,0x02,0x00,0x00],[0x08,0x00,0x00,0x01,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x00,0x10,0x00,0x04,0x00],[0x00,0x00,0x10,0x00,0x04,0x00],[0x04,0x00,0x11,0x00,0x04,0x00],[0x00,0x00,0x10,0x00,0x04,0x00],
[0x00,0x10,0x00,0x00,0x02,0x00],[0x00,0x10,0x00,0x00,0x02,0x00],[0x10,0x00,0x00,0x00,0x01,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x00,0x00,0x20,0x00,0x08],[0x00,0x00,0x00,0x20,0x00,0x08],[0x04,0x00,0x01,0x20,0x00,0x08],[0x00,0x00,0x00,0x20,0x00,0x08],
[0x00,0x08,0x00,0x22,0x00,0x08],[0x00,0x08,0x00,0x22,0x00,0x08],[0x08,0x00,0x00,0x21,0x00,0x08],[0x00,0x00,0x00,0x20,0x00,0x08],
[0x00,0x00,0x20,0x00,0x00,0x04],[0x00,0x00,0x20,0x00,0x00,0x04],[0x04,0x00,0x21,0x00,0x00,0x04],[0x00,0x00,0x20,0x00,0x00,0x04],
[0x00,0x20,0x00,0x00,0x00,0x02],[0x00,0x20,0x00,0x00,0x00,0x02],[0x20,0x00,0x00,0x00,0x00,0x01],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x04,0x00,0x01,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x08,0x00,0x02,0x00,0x00],[0x00,0x08,0x00,0x02,0x00,0x00],[0x08,0x00,0x00,0x01,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x00,0x10,0x00,0x04,0x00],[0x00,0x00,0x10,0x00,0x04,0x00],[0x04,0x00,0x11,0x00,0x04,0x00],[0x00,0x00,0x10,0x00,0x04,0x00],
[0x00,0x10,0x00,0x00,0x02,0x00],[0x00,0x10,0x00,0x00,0x02,0x00],[0x10,0x00,0x00,0x00,0x01,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x04,0x00,0x01,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x08,0x00,0x02,0x00,0x00],[0x00,0x08,0x00,0x02,0x00,0x00],[0x08,0x00,0x00,0x01,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x04,0x00,0x01,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00]];


const fliplen=
[[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x02,0x06,0x0e,0x1e],[0x00,0x00,0x00,0x04,0x0c,0x1c],[0x00,0x00,0x00,0x04,0x0c,0x1c],
[0x02,0x00,0x00,0x00,0x08,0x18],[0x00,0x00,0x00,0x00,0x08,0x18],[0x00,0x00,0x00,0x00,0x08,0x18],[0x00,0x00,0x00,0x00,0x08,0x18],
[0x06,0x04,0x00,0x00,0x00,0x10],[0x00,0x04,0x02,0x00,0x00,0x10],[0x00,0x00,0x00,0x00,0x00,0x10],[0x00,0x00,0x00,0x00,0x00,0x10],
[0x02,0x00,0x00,0x00,0x00,0x10],[0x00,0x00,0x00,0x00,0x00,0x10],[0x00,0x00,0x00,0x00,0x00,0x10],[0x00,0x00,0x00,0x00,0x00,0x10],
[0x0e,0x0c,0x08,0x00,0x00,0x00],[0x00,0x0c,0x0a,0x06,0x00,0x00],[0x00,0x00,0x08,0x04,0x00,0x00],[0x00,0x00,0x08,0x04,0x00,0x00],
[0x02,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x06,0x04,0x00,0x00,0x00,0x00],[0x00,0x04,0x02,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x02,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x1e,0x1c,0x18,0x10,0x00,0x00],[0x00,0x1c,0x1a,0x16,0x0e,0x00],[0x00,0x00,0x18,0x14,0x0c,0x00],[0x00,0x00,0x18,0x14,0x0c,0x00],
[0x02,0x00,0x00,0x10,0x08,0x00],[0x00,0x00,0x00,0x10,0x08,0x00],[0x00,0x00,0x00,0x10,0x08,0x00],[0x00,0x00,0x00,0x10,0x08,0x00],
[0x06,0x04,0x00,0x00,0x00,0x00],[0x00,0x04,0x02,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x02,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x0e,0x0c,0x08,0x00,0x00,0x00],[0x00,0x0c,0x0a,0x06,0x00,0x00],[0x00,0x00,0x08,0x04,0x00,0x00],[0x00,0x00,0x08,0x04,0x00,0x00],
[0x02,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x06,0x04,0x00,0x00,0x00,0x00],[0x00,0x04,0x02,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],
[0x02,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00],[0x00,0x00,0x00,0x00,0x00,0x00]];



const lastFlipNum=
[[0,0,0,0,0,0],[0,0,1,2,3,4],[0,0,0,1,2,3],[0,0,0,1,2,3],[1,0,0,0,1,2],[0,0,0,0,1,2],[0,0,0,0,1,2],[0,0,0,0,1,2],
[2,1,0,0,0,1],[0,1,1,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],[1,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],[0,0,0,0,0,1],
[3,2,1,0,0,0],[0,2,2,2,0,0],[0,0,1,1,0,0],[0,0,1,1,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
[2,1,0,0,0,0],[0,1,1,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
[4,3,2,1,0,0],[0,3,3,3,3,0],[0,0,2,2,2,0],[0,0,2,2,2,0],[1,0,0,1,1,0],[0,0,0,1,1,0],[0,0,0,1,1,0],[0,0,0,1,1,0],
[2,1,0,0,0,0],[0,1,1,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
[3,2,1,0,0,0],[0,2,2,2,0,0],[0,0,1,1,0,0],[0,0,1,1,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],
[2,1,0,0,0,0],[0,1,1,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[1,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0],[0,0,0,0,0,0]];

const d7RightShift = [0, 0, 18, 12, 6, 0, 1, 2, 3, 0, 0];
const d7Mask = [
  0n, 0n, 0x102040000n, 0x204081000n,
  0x408102040n, 0x810204081n, 0x20408102n,
  0x810204n, 0x20408n, 0n, 0n
];

const d5LeftShift = [0, 0, 3, 2, 1, 0, 0, 0, 0, 0, 0];
const d5RightShift = [0, 0, 0, 0, 0, 0, 6, 12, 18, 0, 0];
const d5Mask = [
  0n, 0n, 0x1084n, 0x42108n, 0x1084210n,
  0x42108420n, 0x84210800n, 0x108420000n,
  0x210800000n, 0n, 0n
];

// t = x + y
function change5line(index, t) {
    index &= d5Mask[t];
    index <<= BigInt(d5LeftShift[t]); // BigInt 型に変換
    index >>= BigInt(d5RightShift[t]); // BigInt 型に変換
    return Number((((index * 0x2220n) & 0xE00000000n) | ((index * 0x2220000n) & 0x1C0000000n)) >> 30n);
  }
  
  // t = x + 5 - y
  function change7line(index, t) {
    index &= d7Mask[t];
    index >>= BigInt(d7RightShift[t]); // BigInt 型に変換
    return Number(((index * 0x41041041n) & 0xFC0000000n) >> 30n);
  }
  
  // t = y
  function changeRline(index, t) {
    return Number(((index << BigInt((5 - t) * 6)) & 0xFC0000000n) >> 30n); // BigInt 型に変換
  }
  
  // t = x
  function changeCline(index, t) {
    index = 0x41041041n & (index >> BigInt(t)); // BigInt 型に変換
    return Number(((index * 0x42108420n) & 0xFC0000000n) >> 30n);
  }
  
  // t = x + y
  function dechange5line(index, t) {
    let index1 = (((index & 0x38n) * 0x2220000n) | ((index & 0x7n) * 0x2220n)) & 0x42108420n;
    index1 <<= BigInt(d5RightShift[t]); // BigInt 型に変換
    index1 >>= BigInt(d5LeftShift[t]); // BigInt 型に変換
    index1 &= d5Mask[t];
    return index1;
  }
  
  // t = x + 5 - y
  function dechange7line(index, t) {
    let index1 = ((index & 0x3Fn) * 0x41041041n) & 0x810204081n;
    index1 <<= BigInt(d7RightShift[t]); // BigInt 型に変換
    index1 &= d7Mask[t];
    return index1;
  }
  
// t = y
function dechangeRline(index, t) {
  return (index & 0x3Fn) << (6 * t);
}

// t = x
function dechangeCline(index, t) {
  let index1 = (((index & 0x38n) * 0x2108000n) | ((index & 0x7n) * 0x421n)) & 0x41041041n;
  return index1 << t;
}

function initializeTable() {
    let hash = 0x03F566ED27179461n; // BigInt型を使用
    for (let i = 0; i < 64; i++) {
        table[Number(hash >> 58n)] = i; // 58ビットシフトし、インデックスとして使用
        hash <<= 1n; // 左に1ビットシフト
    }
}

function getNumberZeros(x) {
    if (x === 0) return 64;
    let y = BigInt(x & -x); // 最も右の1ビットのみを抽出
    let i = Number(((y * 0x03F566ED27179461n)) >> 58n);
    return table[i];
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

function makeLegalBoard(p, o) {
    let colmask = o & 0x000000079E79E79En; 
    let rowmask = o & 0x000000003FFFFFC0n;
    let allsidemask = o & 0x000000001E79E780n; 
    let legalBoard = 0n;
    let tmp;

    // 各方向の合法手を計算 (左, 右, 上, 下, 斜め)
    // 左方向
    tmp = colmask & (p << 1n); // 左
    legalBoard |= colmask + tmp;

    // 右方向
    tmp = colmask & (p >> 1n);
    tmp |= colmask & (tmp >> 1n);
    tmp |= colmask & (tmp >> 1n);
    tmp |= colmask & (tmp >> 1n);
    legalBoard |= tmp >> 1n;

    // 上方向
    tmp = rowmask & (p << 6n);
    tmp |= rowmask & (tmp << 6n);
    tmp |= rowmask & (tmp << 6n);
    tmp |= rowmask & (tmp << 6n);
    legalBoard |= tmp << 6n;

    // 下方向
    tmp = rowmask & (p >> 6n);
    tmp |= rowmask & (tmp >> 6n);
    tmp |= rowmask & (tmp >> 6n);
    tmp |= rowmask & (tmp >> 6n);
    legalBoard |= tmp >> 6n;

    // 斜め方向 (左上)
    tmp = allsidemask & (p << 5n);
    tmp |= allsidemask & (tmp << 5n);
    tmp |= allsidemask & (tmp << 5n);
    tmp |= allsidemask & (tmp << 5n);
    legalBoard |= tmp << 5n;

    // 斜め方向 (右上)
    tmp = allsidemask & (p << 7n);
    tmp |= allsidemask & (tmp << 7n);
    tmp |= allsidemask & (tmp << 7n);
    tmp |= allsidemask & (tmp << 7n);
    legalBoard |= tmp << 7n;

    // 斜め方向 (左下)
    tmp = allsidemask & (p >> 7n);
    tmp |= allsidemask & (tmp >> 7n);
    tmp |= allsidemask & (tmp >> 7n);
    tmp |= allsidemask & (tmp >> 7n);
    legalBoard |= tmp >> 7n;

    // 斜め方向 (右下)
    tmp = allsidemask & (p >> 5n);
    tmp |= allsidemask & (tmp >> 5n);
    tmp |= allsidemask & (tmp >> 5n);
    tmp |= allsidemask & (tmp >> 5n);
    legalBoard |= tmp >> 5n;

    // 現在のプレイヤーと相手の石を取り除く
    legalBoard &= ~(p | o);

    return legalBoard;
}

function putStone(b, position) {
    // プレイヤーの石をボードに追加
    b.playerBoard |= position; 

    // 各方向のマスク
    let colmask = b.opponentBoard & 0x000000079E79E79En;
    let rowmask = b.opponentBoard & 0x000000003FFFFFC0n;
    let allsidemask = b.opponentBoard & 0x000000001E79E780n;

    let board = b.playerBoard;
    let rev = 0n;  // 反転させる石を保存する変数
    let tmp;

    // 左方向
    tmp = colmask & (position << 1n);
    tmp |= colmask & (tmp << 1n);
    tmp |= colmask & (tmp << 1n);
    tmp |= colmask & (tmp << 1n);
    if ((tmp << 1n) & board) rev |= tmp;
    //rev |= (tmp & -(b.playerBoard & (tmp << 1n) !== 0n));

    // 右方向
    tmp = colmask & (position >> 1n);
    tmp |= colmask & (tmp >> 1n);
    tmp |= colmask & (tmp >> 1n);
    tmp |= colmask & (tmp >> 1n);
    if ((tmp >> 1n) & board) rev |= tmp;

    // 上方向
    tmp = rowmask & (position << 6n);
    tmp |= rowmask & (tmp << 6n);
    tmp |= rowmask & (tmp << 6n);
    tmp |= rowmask & (tmp << 6n);
    if ((tmp << 6n) & board) rev |= tmp;

    // 下方向
    tmp = rowmask & (position >> 6n);
    tmp |= rowmask & (tmp >> 6n);
    tmp |= rowmask & (tmp >> 6n);
    tmp |= rowmask & (tmp >> 6n);
    if ((tmp >> 6n) & board) rev |= tmp;

    // 左上方向
    tmp = allsidemask & (position << 5n);
    tmp |= allsidemask & (tmp << 5n);
    tmp |= allsidemask & (tmp << 5n);
    tmp |= allsidemask & (tmp << 5n);
    if ((tmp << 5n) & board) rev |= tmp;

    // 右上方向
    tmp = allsidemask & (position << 7n);
    tmp |= allsidemask & (tmp << 7n);
    tmp |= allsidemask & (tmp << 7n);
    tmp |= allsidemask & (tmp << 7n);
    if ((tmp << 7n) & board) rev |= tmp;

    // 左下方向
    tmp = allsidemask & (position >> 7n);
    tmp |= allsidemask & (tmp >> 7n);
    tmp |= allsidemask & (tmp >> 7n);
    tmp |= allsidemask & (tmp >> 7n);
    if ((tmp >> 7n) & board) rev |= tmp;

    // 右下方向
    tmp = allsidemask & (position >> 5n);
    tmp |= allsidemask & (tmp >> 5n);
    tmp |= allsidemask & (tmp >> 5n);
    tmp |= allsidemask & (tmp >> 5n);
    if ((tmp >> 5n) & board) rev |= tmp;

    // プレイヤーのボードに反転を適用
    b.playerBoard ^= rev;  
    b.opponentBoard ^= rev;  

    // ボードを入れ替え
    tmp = b.playerBoard;
    b.playerBoard = b.opponentBoard;
    b.opponentBoard = tmp;

    // ターンを変更
    b.turn = 1 - b.turn;

    return b;
}



function changeOnlyTurn(b) {
    let tmp = b.playerBoard;
    b.playerBoard = b.opponentBoard;
    b.opponentBoard = tmp;
    b.turn = 1 - b.turn;
    return b;
}

function resetBoard(b) {
    b.playerBoard = 0x0000000000108000n;
    b.opponentBoard = 0x0000000000204000n;
    b.turn = 0;
}

function evaluate(b) {
    let playerscore = countBit(b.playerBoard);
    let opponentscore = countBit(b.opponentBoard);
    let count = playerscore - opponentscore;
    
    if (playerscore === 0) count = -64 * 64 * 2 + opponentscore;
    if (opponentscore === 0) count = 64 * 64 * 2 - playerscore;
    if (!mode) count = -count;
    
    return count;
}

function lastEvaluate1(b, position, change) {
    let x = position % 6;
    let y = Math.floor(position / 6);
    
    let score = lastFlipNum[change5line(b.playerBoard, x + y)][Math.min(5 - x, y)] +
        lastFlipNum[change7line(b.playerBoard, x + 5 - y)][Math.min(x, y)] +
        lastFlipNum[changeRline(b.playerBoard, y)][x] +
        lastFlipNum[changeCline(b.playerBoard, x)][y];
    
    if (score === 0) {
        if (change) {
            let playerscore = countBit(b.playerBoard);
            let opponentscore = countBit(b.opponentBoard);
            let count = playerscore - opponentscore;
            if (playerscore === 0) count = -64 * 64 * 2 + opponentscore;
            if (opponentscore === 0) count = 64 * 64 * 2 - playerscore;
            if (!mode) count = -count;
            return count;
        } else {
            b = changeOnlyTurn(b);
            return -lastEvaluate1(b, position, true);
        }
    }
    
    let playerscore = countBit(b.playerBoard);
    let opponentscore = countBit(b.opponentBoard);
    let count = playerscore - opponentscore + 2 * score + 1;
    
    if (!mode) count = -count;
    
    return count;
}

function Nega_alpha(b, depth, passed, alpha, beta) {
    //console.log("depth: " + depth)
    if (countBit(~(0xFFFFFFF000000000n | b.playerBoard | b.opponentBoard)) === 1) {
        //console.log("last")
        return lastEvaluate1(b, getNumberZeros(~(0xFFFFFFF000000000n | b.playerBoard | b.opponentBoard)), false);
    }
    if (depth === 0)
        return evaluate(b);

    let max_score = -10000;
    let legalMoves = makeLegalBoard(b.playerBoard, b.opponentBoard);
    //displayBoard(b);
    //displayLegal(legalMoves);   
    while (legalMoves !== 0n) {
        let bitposition = legalMoves & (~legalMoves + 1n);
        //console.log(bitposition.toString(2));  // bitposition を二進数で表示
        //console.log(legalMoves.toString(2));   // legalMoves を二進数で表示
        let newB = structuredClone(b);
        newB = putStone(newB, bitposition);
        let g = -Nega_alpha(newB, depth - 1, false, -beta, -alpha);
        if (g >= beta) return g;
        alpha = Math.max(alpha, g);
        max_score = Math.max(max_score, g);
        legalMoves &= legalMoves - 1n;
    }

    // Handle pass
    if (max_score === -10000) {
        //console.log("pass")
        if (passed) return evaluate(b);
        return -Nega_alpha(changeOnlyTurn(b), depth, true, -beta, -alpha);
    }
    return max_score;
}


function Search(b) {
    //console.log(1332)
    let res = -1, score, alpha = -10000, beta = 10000;
    let legalMoves = makeLegalBoard(b.playerBoard, b.opponentBoard); // Use the player's board (white)
    let depth;
    if(countBit(b.playerBoard | b.opponentBoard) >= 19) depth = lastdepth;
    else depth = normaldepth;
    console.log("depth:",depth)  
    //displayBoard(b);
    while (legalMoves !== 0n) {
        //console.log(".....")
        let coord = SIZE * SIZE - getNumberZeros(legalMoves);
        //console.log(coord)
        let bitposition = legalMoves & (~legalMoves + 1n);
        let newB = structuredClone(b);
        newB = putStone(newB, bitposition);
        score = -Nega_alpha(newB, depth - 1, false, -beta, -alpha);
        if (alpha < score) {
            alpha = score;
            res = coord;
        }
        legalMoves &= legalMoves - 1n;
    }

    return res;
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