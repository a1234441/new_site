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
    playerBoardup: 0,
    playerBoarddown: 0,
    opponentBoardup: 0,
    opponentBoarddown: 0,
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
    OthelloBoard.playerBoardup = 0;
    OthelloBoard.opponentBoardup = 0;
    OthelloBoard.playerBoarddown = 0;
    OthelloBoard.opponentBoarddown = 0;
    OthelloBoard.playerBoardup = OthelloBoard.playerBoardup>>>0;
    OthelloBoard.opponentBoardup = OthelloBoard.opponentBoardup>>>0;
    OthelloBoard.playerBoarddown = OthelloBoard.playerBoarddown>>>0;
    OthelloBoard.opponentBoarddown = OthelloBoard.opponentBoarddown>>>0;
    OthelloBoard.turn = AIplayer;
    
    for (let row = 0; row < gridSize; row++) {
        let row1='';
        for (let col = 0; col < gridSize; col++) {
            if (Number(board[row][col]) === Number(AIplayer) || board[row][col] === Number(AIplayer)*2) {
                row1 += 'B '; // 黒の石
                if(row<3)OthelloBoard.playerBoardup |= 1 << ((2-row)*6+(5-col));
                else OthelloBoard.playerBoarddown |= 1 << ((5-row)*6+(5-col));
            }
            else if (Number(board[row][col]) === -Number(AIplayer) || board[row][col] === -Number(AIplayer)*2) {
                row1 += 'W '; // 白の石
                if(row<3)OthelloBoard.opponentBoardup |= 1 << ((2-row)*6+(5-col));
                else OthelloBoard.opponentBoarddown |= 1 << ((5-row)*6+(5-col));
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
            const start = performance.now();
            let put= AI();
            const end = performance.now();
            console.log(`実行時間: ${(end - start).toFixed(4)} ms`);
            
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
    mode = true ? Number(difficulty) === 1 : false;
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



function getNumberZeros(x) {
    if (x === 0) return 64;
    let y = BigInt(x & -x); // 最も右の1ビットのみを抽出
    let i = Number(((y * 0x03F566ED27179461n)) >> 58n);
    return table[i];
}

function countBit(x1, x0) {
    let t0 = x1 - (x1 >>> 1 & 0x55555555);
    t0 = (t0 & 0x33333333) + ((t0 & 0xcccccccc) >>> 2);
    let t1 = x0 - (x0 >>> 1 & 0x55555555);
    t0 += (t1 & 0x33333333) + ((t1 & 0xcccccccc) >>> 2);
    t0 = (t0 & 0x0f0f0f0f) + ((t0 & 0xf0f0f0f0) >>> 4);
    return t0 * 0x01010101 >>> 24;
}
function initializeTable() {
    let hash = 0x03F566ED27179461n; // BigInt型を使用
    for (let i = 0; i < 64; i++) {
        table[Number(hash >> 58n)] = i; // 58ビットシフトし、インデックスとして使用
        hash <<= 1n; // 左に1ビットシフト
    }
}

/*
011110
011110
011110
1E79E

000000
111111
111111
FFF

111111
111111
000000
3FFC0

000000
011110
011110
79E

011110
011110
000000
1E780
*/
function makeLegalBoard(p1, p0, o1, o0) {
    //p1 p0 は自分の石のビットボード　p0が下位
    //
    let blank1 = ~(p1 | o1 |0xFFFFFFFFC0000);
    let blank0 = ~(p0 | o0 |0xFFFFFFFFC0000);
    
    let rowmask1 = o1 & 0x1E79E;
    let rowmask0 = o0 & 0x1E79E;
    let colmask1 = o1 & 0xFFF;
    let colmask0 = o0 & 0x3FFC0;
    let allsidemask1 = o1 & 0x79E;
    let allsidemask0 = o0 & 0x1E780;
    let tmp0,tmp1;
    let legalBoard0 = 0;
    let legalBoard1 = 0;

    // 左方向
    tmp1 = rowmask1 & (p1 << 1);
    legalBoard1 |= rowmask1 + tmp1;
    tmp0 = rowmask0 & (p0 << 1);
    legalBoard0 |= rowmask0 + tmp0;

    // 右方向
    tmp1 = rowmask1 & (p1 >>> 1);
    tmp1 |= rowmask1 & (tmp1 >>> 1);
    tmp1 |= rowmask1 & (tmp1 >>> 1);
    tmp1 |= rowmask1 & (tmp1 >>> 1);
    legalBoard1 |= tmp1 >>> 1;
    tmp0 = rowmask0 & (p0 >>> 1);
    tmp0 |= rowmask0 & (tmp0 >>> 1);
    tmp0 |= rowmask0 & (tmp0 >>> 1);
    tmp0 |= rowmask0 & (tmp0 >>> 1);
    legalBoard0 |= tmp0 >>> 1;


    // 上向き
    tmp0 = p0 << 6 & colmask0;
    tmp0 |= tmp0 << 6 & colmask0;
    tmp1=(tmp0 | p0) >>> 12 & colmask1;
    tmp1 |= ((p1|tmp1)<<6) & colmask1;
    tmp1 |= tmp1 << 6 & colmask1;

    legalBoard1 |= (tmp1 << 6) | (tmp0 >>> 12);
    legalBoard0 |= tmp0 << 6 & 0x3FFFF;

    // 下向き
    tmp1 = p1 >>> 6 & colmask1;
    tmp1 |= tmp1 >>> 6 & colmask1;
    tmp0=(tmp1 | p1) << 12 & colmask0;
    tmp0 |= ((p0|tmp0) >>> 6) & colmask0;
    tmp0 |= tmp0 >>> 6 & colmask0;
    legalBoard0 |= (tmp0 >>> 6) | (tmp1 << 12);
    legalBoard1 |= tmp1 >> 6 & 0x3FFFF;

    // 左上
    tmp0 = p0 << 7 & allsidemask0;
    tmp0 |= tmp0 << 7 & allsidemask0;
    tmp1 = ((tmp0 | p0) >>> 11) & allsidemask1;
    tmp1 |= ((p1 | tmp1) << 7) & allsidemask1;
    tmp1 |= tmp1 << 7 & allsidemask1;
    legalBoard1 |= (tmp1 << 7) | (tmp0 >>> 11);
    legalBoard0 |= tmp0 << 7 & 0x3FFFF;

    // 右下
    tmp1 = p1 >>> 7 & allsidemask1;
    tmp1 |= tmp1 >>> 7 & allsidemask1;
    tmp0 = ((tmp1 | p1) << 11) & allsidemask0;
    tmp0 |= ((p0 | tmp0) >>> 7) & allsidemask0;
    tmp0 |= tmp0 >>> 7 & allsidemask0;
    legalBoard1 |= tmp1 >>> 7 & 0x3FFFF ;
    legalBoard0 |= (tmp0 >>> 7) | (tmp1 << 11);

    // 右上
    tmp0 = p0 << 5 & allsidemask0;
    tmp0 |= tmp0 << 5 & allsidemask0;
    tmp1 = ((tmp0 | p0) >>> 13) & allsidemask1;
    tmp1|= ((p1 | tmp1)<<5) & allsidemask1;
    tmp1 |= tmp1 << 5 & allsidemask1;
    legalBoard1 |= (tmp1 << 5) | (tmp0 >>> 13);
    legalBoard0 |= tmp0 << 5 & 0x3FFFF;

    // 左下
    tmp1 = p1 >>> 5 & allsidemask1;
    tmp1 |= tmp1 >>> 5 & allsidemask1;
    tmp0 = ((tmp1 | p1) << 13) & allsidemask0;
    tmp0 |= ((p0 | tmp0) >>> 5) & allsidemask0;
    tmp0 |= tmp0 >>> 5 & allsidemask0;
    legalBoard1 |= tmp1 >>> 5 & 0x3FFFF;
    legalBoard0 |= (tmp0 >>> 5 | tmp1 << 13) ;

    legalBoard1 &= blank1;
    /*console.log("legalboard");
    getBinarySegment(legalBoard1);*/
    legalBoard0 &= blank0;

    return [legalBoard1,legalBoard0];
}

// 上側に置いたときの反転する石の位置を返す
//sq_bit→bitposition
function flip1(b,p1, p0, o1, o0,sq_bit) {
    let f1 = 0;
    let f0 = 0;

    let mo1 = o1 & 0x1E79E;
    let mo0 = o0 & 0x1E79E;

    // 左
    let d1 = 0x0000003e * sq_bit;
    let t1 = (mo1 | ~d1) + 1 & d1 & p1;
    f1 = t1 - ((t1 | -t1) >>> 31) & d1;

    // 左上
    d1 = 0x4080 * sq_bit;
    t1 = (mo1 | ~d1) + 1 & d1 & p1;
    f1 |= t1 - ((t1 | -t1) >>> 31) & d1;
    /*console.log("test");
    getBinarySegment( t1 - ((t1 | -t1) >>> 31) & d1);*/

    // 上 マスクは付けてはだめ。
    d1 = 0x1040 * sq_bit;
    t1 = (o1 | ~d1) + 1 & d1 & p1;
    f1 |= t1 - ((t1 | -t1) >>> 31) & d1;

    // 右上
    d1 = 0x8420 * sq_bit;
    t1 = (mo1 | ~d1) + 1 & d1 & p1;
    f1 |= t1 - ((t1 | -t1) >>> 31) & d1;

    // 右
    t1 = sq_bit >>> 1 & mo1;
    t1 |= t1 >>> 1 & mo1;
    t1 |= t1 >>> 1 & mo1;
    t1 |= t1 >>> 1 & mo1;
    f1 |= t1 & -(t1 >>> 1 & p1);

    // 右下
    t1 = sq_bit >>> 7 & mo1;
    t1 |= t1 >>> 7 & mo1;
    let t0 = (t1 | sq_bit) << 11 & mo0;
    t0 |= t0 >>> 7 & mo0;
    let t = t1 >>> 7 & p1 | (t0 >>> 7 | t1 << 11) & p0;
    t = (t | -t) >> 31;
    f1 |= t1 & t;
    f0 |= t0 & t;

    
    // 下 敵石にマスクはつけない
    t1 = sq_bit >>> 6 & o1;
    t1 |= t1 >>> 6 & o1;
    t0 = (t1 | sq_bit) << 12 & o0;
    t0 |= t0 >>> 6 & o0;
    t = t1 >>> 6 & p1 | (t0 >>> 6 | t1 << 12) & p0;
    t = (t | -t) >> 31;
    f1 |= t1 & t;
    f0 |= t0 & t;

    // 左下
    t1 = sq_bit >>> 5 & mo1;
    t1 |= t1 >>> 5 & mo1;
    t0 = (t1 | sq_bit) << 13 & mo0;
    t0 |= t0 >>> 5 & mo0;
    t = t1 >>> 5 & p1 | (t0 >>> 5 | t1 << 13) & p0;
    t = (t | -t) >> 31;

    f1 |= t1 & t &0x3FFFF;
    f0 |= t0 & t &0x3FFFF;
    /*console.log("bitover");
    getBinarySegment(sq_bit);
    console.log("flip");
    getBinarySegment(f1);
    getBinarySegment(f0);*/

    b.opponentBoardup ^= f1;
    b.opponentBoarddown ^= f0;
    b.playerBoardup ^= f1;
    b.playerBoarddown ^= f0;
    b.playerBoardup |= sq_bit;
    b=changeOnlyTurn(b);
    return b;
}


// p1, p0: 自石ビット
// o1, o0: 敵石ビット
// sq_bit: 石を置くマスのビット(2^n)
//下側に置いたとき
function flip0(b,p1, p0, o1, o0, sq_bit) {
    let f1 = 0;
    let f0 = 0;

    let mo1 = o1 & 0x1E79E;
    let mo0 = o0 & 0x1E79E;

    // 左
    let d0 = mo0 & (sq_bit<<1);
    let t0;
    d0 |=mo0 & (d0<<1);
    d0 |=mo0 & (d0<<1);
    d0 |=mo0 & (d0<<1);
    if(Number((d0<<1)&p0)!==0) f0=d0;

    //f0 = t0 - ((t0 | -t0) >>> 31) & d0;

    // 左上
    t0 = sq_bit << 7 & mo0;
    t0 |= t0 << 7 & mo0;
    let t1 = (t0 | sq_bit) >>> 11 & mo1;
    t1 |= t1 << 7 & mo1;
    let t = (t1 << 7 | t0 >>> 11) & p1 | t0 << 7 & p0;
    t = (t | -t) >> 31;
    f1 |= t1 & t;
    f0 |= t0 & t;

    // 上 敵石にマスクはつけない
    t0 = sq_bit << 6 & o0;
    t0 |= t0 << 6 & o0;
    t1 = (t0 | sq_bit) >>> 12 & o1;
    t1 |= t1 << 6 & o1;
    t = (t1 << 6 | t0 >>> 12) & p1 | t0 << 6 & p0;
    t = (t | -t) >> 31;
    f1 |= t1 & t;
    f0 |= t0 & t;

    // 右上
    t0 = sq_bit << 5 & mo0;
    t0 |= t0 << 5 & mo0;
    t1 = (t0 | sq_bit) >>> 13 & mo1;
    t1 |= t1 << 5 & mo1;
    t = (t1 << 5 | t0 >>> 13) & p1 | t0 << 5 & p0;
    t = (t | -t) >> 31;
    f1 |= t1 & t;
    f0 |= t0 & t;

    // 右
    t0 = sq_bit >>> 1 & mo0;
    t0 |= t0 >>> 1 & mo0;
    t0 |= t0 >>> 1 & mo0;
    t0 |= t0 >>> 1 & mo0;
    f0 |= t0 & -(t0 >>> 1 & p0);

    // 右下
    t0 = sq_bit >>> 7 & mo0;
    t0 |= t0 >>> 7 & mo0;
    f0 |= t0 & -(t0 >>> 7 & p0);

    // 下 敵石マスク無し
    t0 = sq_bit >>> 6 & o0;
    t0 |= t0 >>> 6 & o0;
    f0 |= t0 & -(t0 >>> 6 & p0);

    // 左下
    t0 = sq_bit >>> 5 & mo0;
    t0 |= t0 >>> 5 & mo0;
    f0 |= t0 & -(t0 >>> 5 & p0);

    /*console.log("bitunder");
    getBinarySegment(sq_bit);
    console.log("flip");
    getBinarySegment(f1);
    getBinarySegment(f0);*/
    b.opponentBoardup ^= f1;
    b.opponentBoarddown ^= f0;
    b.playerBoardup ^= f1;
    b.playerBoarddown ^= f0;
    b.playerBoarddown |= sq_bit;
    b=changeOnlyTurn(b);
    return b;
}

function changeOnlyTurn(b) {
    let tmp = b.playerBoardup;
    b.playerBoardup = b.opponentBoardup;
    b.opponentBoardup = tmp;

    tmp = b.playerBoarddown;
    b.playerBoarddown = b.opponentBoarddown;
    b.opponentBoarddown = tmp;
    b.turn = 1 - b.turn;
    return b;
}

/*function resetBoard(b) {
    b.playerBoard = 0x0000000000108000;
    b.opponentBoard = 0x0000000000204000;
    b.turn = 0;
}*/

function evaluate(b) {
    let playerscore = countBit(b.playerBoardup)+countBit(b.playerBoarddown);
    let opponentscore = countBit(b.opponentBoardup)+countBit(b.opponentBoarddown);
    let count = playerscore - opponentscore;
    if (playerscore === 0) count = - 36 * 2 + opponentscore;
    if (opponentscore === 0) count = 36 * 2 - playerscore;
    if (!mode) count = -count;
    
    return count;
}



function Nega_alpha(b, depth, passed, alpha, beta) {
    //console.log("depth:",depth);
    //displayBoard(b);
    //displayBoard(b);
    if (depth === 0)
        return evaluate(b);
    let max_score = -10000;
    let legalMoves = makeLegalBoard(b.playerBoardup, b.playerBoarddown, b.opponentBoardup,b.opponentBoarddown);
    //console.log("0");
    //getBinarySegment(legalMoves[0]);
    //getBinarySegment(legalMoves[1]);

    
    
    //displayBoard(b);
    //displayLegal(legalMoves);   
    while (legalMoves[0] !== 0 || legalMoves[1] !== 0) {
        if(legalMoves[1] !== 0){//下位ビット
            let bitposition = legalMoves[1] & (~legalMoves[1] + 1);
            let newB = structuredClone(b);
            newB = flip0(newB,newB.playerBoardup,newB.playerBoarddown,newB.opponentBoardup,newB.opponentBoarddown, bitposition);
            let g = -Nega_alpha(newB, depth - 1, false, -beta, -alpha);
            //console.log("score:",g);
            if (g >= beta) return g;
            alpha = Math.max(alpha, g);
            max_score = Math.max(max_score, g);
            legalMoves[1] &= legalMoves[1] - 1;
        }   
        else{//上位ビット
            let bitposition = legalMoves[0] & (~legalMoves[0] + 1);
            let newB = structuredClone(b);
            newB = flip1(newB,newB.playerBoardup,newB.playerBoarddown,newB.opponentBoardup,newB.opponentBoarddown, bitposition);
            let g = -Nega_alpha(newB, depth - 1, false, -beta, -alpha);
            //console.log("score:",g);
            if (g >= beta) return g;
            alpha = Math.max(alpha, g);
            max_score = Math.max(max_score, g);
            legalMoves[0] &= legalMoves[0] - 1;
        }
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
            let bit = 1 << (SIZE - 1 - i) * SIZE + (SIZE - 1 - j);
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