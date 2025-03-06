<!DOCTYPE html>
<html lang="ja">
<head>
   <meta charset="UTF-8">
   <title>Self-introduction</title>
   <link rel="stylesheet" href="style.css">
</head>
<body> 

    <nav>
        <a href="index.html">ホーム</a>
        <a href="indexs/product_host.html">Product</a>
        <a href="indexs/dairy_host.html">Article</a>
        <a href="indexs/contact.html">Contact</a>
    </nav>

    <div class="container">
        <h1>このサイトの訪問者数: <span id="counter">読み込み中...</span></h1>

        <script>
            // PHPのカウンターからデータ取得
            fetch("counter.php")
                .then(response => response.text())
                .then(count => {
                    document.getElementById("counter").textContent = count;
                })
                .catch(error => {
                    console.error("カウンターの読み込みエラー:", error);
                    document.getElementById("counter").textContent = "エラー";
                });
        </script>
        <h1>自己紹介</h1>
        <table>
            <tr>
                <td>名前</td>
                <td>柊(仮名)</td>
            </tr>
            <tr>
                <td>趣味</td>
                <td>プログラミング、イラスト、FX</td>
            </tr>
            <tr>
                <td>TOEIC</td>
                <td>MAX 420, MIN 255</td>
            </tr> 
        </table>
        <br>
        <br>
        <h1>Skills</h1>
        <h3>プログラム言語</h3>
        <table>
            <tr>
                <th>言語</th>
                <th>習得度</th>
            </tr>
            <tr>
                <td>Python</td>
                <td>
                    <div class="bar-container">
                        <div class="bar" style="width: 100%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td>MQL5</td>
                <td>
                    <div class="bar-container">
                        <div class="bar" style="width: 100%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td>C++</td>
                <td>
                    <div class="bar-container">
                        <div class="bar" style="width: 80%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td>C</td>
                <td>
                    <div class="bar-container">
                        <div class="bar" style="width: 60%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td>MQL4</td>
                <td>
                    <div class="bar-container">
                        <div class="bar" style="width: 60%;"></div>
                    </div>
                </td>
            </tr>
            <tr>
                <td>JavaScript</td>
                <td>
                    <div class="bar-container">
                        <div class="bar" style="width: 30%;"></div>
                    </div>
                </td>
            </tr>
        </table>
        <h3>資格</h3>
        <table>
            <tr>
                <td>ビジネス著作権検定  上級</td>
            </tr>
        </table>
    </div>

</body>
</html>
