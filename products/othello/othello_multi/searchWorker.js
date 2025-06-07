// searchWorker.js の修正版だぜ！

console.log("[searchWorker] スクリプトの実行開始。(WASMロード前)"); // 新しいログ

try {
    // searchCore.js が正しく読み込まれるかを確認するために
    // ここでログを挟む。
    console.log("[searchWorker] importScripts('searchCore.js') を実行します。");
    importScripts("searchCore.js"); 
    console.log("[searchWorker] importScripts('searchCore.js') が完了しました。");
} catch (e) {
    console.error("[searchWorker] importScripts 実行中に致命的なエラー:", e);
    self.postMessage({ type: 'error', message: "[searchWorker] importScriptsエラー", details: e.message });
    // importScripts が失敗したら、それ以降のWASM関連の処理はできないので、ここで停止する
    // return; // この行を有効にすると、importScripts失敗時にそれ以降の処理を停止する
}

// この行に到達するか確認！
console.log("[searchWorker] importScripts 後のコード実行確認。"); // 新しいログ

let wasmInstance = null;

// Module() が関数として存在するかチェックしてみる
if (typeof Module !== 'function') {
    console.error("[searchWorker] グローバルな 'Module' オブジェクトが関数として定義されていません。");
    console.error("[searchWorker] searchCore.js のビルドオプションが間違っている可能性があります。");
    self.postMessage({ type: 'error', message: "[searchWorker] 'Module' が関数ではありません", details: typeof Module });
    // return; // Module がない時に処理を停止する
} else {
    console.log("[searchWorker] 'Module' 関数が検出されました。WASMインスタンス化を開始します。");
}


Module().then((instance) => {
    wasmInstance = instance;
    console.log("[searchWorker] WASMインスタンスが正常にロードされ、初期化されました。");
    self.postMessage({ type: 'ready' });
}).catch((err) => {
    console.error("[searchWorker] WASMロードまたは初期化に失敗しました:", err);
    // ここでTypeError: Module is not a functionが出ることがよくある
    self.postMessage({ type: 'error', message: "[searchWorker] WASMロード失敗", details: err.message });
});

self.onmessage = function (e) {
    console.log("[searchWorker] メッセージを受信しました:", e.data.type);
    if (e.data.type === 'search') {
        const { playerBoard, opponentBoard, depth, strong, alpha, moveBit } = e.data;
        if (!wasmInstance) {
            console.error("[searchWorker] WASM未初期化のため計算できません。");
            self.postMessage({ type: 'result', result: -1, moveBit: moveBit });
            return;
        }
        try {
            console.log(`[searchWorker] 計算開始: moveBit=${moveBit}, depth=${depth}`);
            const pBoard = BigInt(playerBoard);
            const oBoard = BigInt(opponentBoard);
            const score = wasmInstance._Search(pBoard, oBoard, depth, strong, alpha);
            console.log(`[searchWorker] 計算終了: moveBit=${moveBit}, score=${score}`);
            self.postMessage({ type: 'result', result: score, moveBit: moveBit });
        } catch (err) {
            console.error("[searchWorker] WASM_Search実行エラー:", err);
            self.postMessage({ type: 'result', result: -1, moveBit: moveBit });
        }
    }
};