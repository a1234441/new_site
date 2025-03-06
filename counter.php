<?php
$counterFile = "counter.txt";

// カウンターの初期化
if (!file_exists($counterFile)) {
    file_put_contents($counterFile, "0");
}

// カウントを読み込み
$count = (int)file_get_contents($counterFile);
$count++;

// 更新
file_put_contents($counterFile, $count);

// 現在のカウントを表示
echo $count;
?>
