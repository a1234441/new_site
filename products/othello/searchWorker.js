// searchWorker.js
importScripts("searchCore.js");

self.onmessage = function (e) {
    const { id, playerBoard, opponentBoard, depth, strong, alpha } = e.data;

    try {
        const pBoard = BigInt(playerBoard);
        const oBoard = BigInt(opponentBoard);

        Module().then((instance) => {
            const pos = instance._Search(pBoard, oBoard, depth, strong, alpha);
            self.postMessage({ id, result: pos });
        }).catch((err) => {
            console.error("[searchWorker] モジュール読み込みエラー:", err);
            self.postMessage({ id, result: -1 });
        });

    } catch (err) {
        console.error("[searchWorker] 実行エラー:", err);
        self.postMessage({ id, result: -1 });
    }
};

