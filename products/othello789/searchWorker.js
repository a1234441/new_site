// searchWorker.js
importScripts('main.js'); // emccで出力されたWASM＋JS


// Module 初期化待ちPromise
function waitModuleReady() {
  return new Promise((resolve) => {
    if (Module.calledRun) {
      resolve();
    } else {
      Module.onRuntimeInitialized = resolve;
    }
  });
}


function extractBigInt(obj) {
  if (typeof obj === 'bigint') return obj;
  if (typeof obj === 'string') return BigInt(obj);
  if (typeof obj === 'object' && typeof obj.value === 'string') return BigInt(obj.value);
  throw new Error('Cannot convert to BigInt: ' + JSON.stringify(obj));
}

let ModulePromise = Module(); // ← ここが重要！

onmessage = async function(e) {
  try {
    const Module = await ModulePromise;


    const playerBoard = BigInt(e.data.playerBoard);
    const opponentBoard = BigInt(e.data.opponentBoard);

    //console.log(typeof playerBoard, playerBoard);
    const depth = Number(e.data.depth);
    const strong_ = Number(e.data.strong_);


    const result = Module._Search(extractBigInt(opponentBoard),extractBigInt(playerBoard), depth-1, strong_);
    //console.log(`[searchWorker] 探索結果: ${result}`);
    postMessage(result);
  } catch (err) {
    console.error('[searchWorker] エラー:', err);
    postMessage({ error: err.message });
  }
};