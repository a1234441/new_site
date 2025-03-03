const canvas = document.getElementById('othelloBoard');
const ctx = canvas.getContext('2d');

// グリッドサイズとボード設定
const gridSize = 6;
let cellSize;
const board = Array(gridSize).fill().map(() => Array(gridSize).fill(0));  // 0 = 空, 1 = 黒, -1 = 白
let currentPlayer = 1;  // 1: 黒, -1: 白
let vec_table = [
    [-1, -1], [0, -1], [1, -1],  // 左上、上、右上
    [-1, 0], [1, 0],  // 左、右
    [-1, 1], [0, 1], [1, 1]  // 左下、下、右下
];




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
                board[row][col] = board[row][col] / 2;// その後、値を1/2倍して配列に代入
            }
            if (board[row][col] !== 0) {
                ctx.beginPath();
                ctx.arc(col * cellSize + cellSize / 2, row * cellSize + cellSize / 2, cellSize / 3, 0, Math.PI * 2);
                ctx.fillStyle = board[row][col] === 1 ? 'black' : 'white';
                
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
    for (let row = 0; row < gridSize; row++) {
        for (let col = 0; col < gridSize; col++) {
            if (board[row][col] === 3) board[row][col] = 0;
        }
    }
}

function GetPositions() {
    let player = currentPlayer;
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
                                break;
                            } 
                            else break;
                            
                        }
                    }
                }
            }
        }
    }
}

// マウスクリックで石を置く
canvas.addEventListener('click', (event) => {
    const x = event.offsetX;
    const y = event.offsetY;
    const row = Math.floor(y / cellSize);
    const col = Math.floor(x / cellSize);

    // クリックしたセルが空であれば石を置く
    if (board[row][col] === 3) {
        board[row][col] = currentPlayer*2;
        ReturnBoard(row, col);
        currentPlayer = currentPlayer === 1 ? -1 : 1;  // ターン交代
        GetPositions();
        drawBoard();
        document.getElementById('status').textContent = currentPlayer === 1 ? "黒のターン" : "白のターン";
    }
});

function Reset() {
    board[2][2] = -1;  // 白
    board[2][3] = 1;   // 黒
    board[3][2] = 1;   // 黒
    board[3][3] = -1;  // 白
    GetPositions();
    resizeCanvas();
}
Reset();
window.addEventListener('resize', resizeCanvas);