document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector(".container");
  if (!container) return;

  // ===== 1. CSS を <style> として注入 =====
  const style = document.createElement("style");
  style.textContent = `
  .talk-widget {
    display: flex;
    gap: 20px;
    background-color: #000;
    color: #fff;
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 32px;
  }
  .talk-character {
    flex: 0 0 auto;
    text-align: center;
  }
  .talk-character img {
    max-width: 160px;
    height: auto;
    border-radius: 8px;
  }
  .talk-dialogue {
    flex: 1 1 auto;
    position: relative;
  }
  #talk-bubble {
    background-color: #fff;
    color: #000;
    padding: 14px 16px;
    border-radius: 15px;
    position: relative;
    cursor: pointer;
    min-height: 56px;
  }
  #talk-bubble::after {
    content: "";
    position: absolute;
    left: -18px;
    top: 24px;
    border: 10px solid transparent;
    border-right-color: #fff;
  }
  #talk-bubble-text {
    margin: 0;
    line-height: 1.6;
    white-space: pre-wrap;
  }
  #talk-next,
  #talk-random {
    margin-top: 8px;
    padding: 8px 16px;
    font-size: 14px;
    border-radius: 999px;
    border: 1px solid #ccc;
    background-color: #222;
    color: #fff;
    cursor: pointer;
  }
  #talk-next:hover,
  #talk-random:hover {
    background-color: #333;
  }
  #talk-random {
    background-color: #444;
  }
  #talk-random:hover {
    background-color: #555;
  }
  #talk-choices {
    margin-top: 14px;
    display: none;
    flex-wrap: wrap;
    gap: 8px;
  }
  .talk-choice {
    background-color: #333;
    color: #fff;
    border: 1px solid #555;
    padding: 6px 10px;
    border-radius: 999px;
    font-size: 14px;
    cursor: pointer;
  }
  .talk-choice:hover {
    background-color: #555;
  }

  /* スマホ用調整 */
  @media (max-width: 768px) {
    .talk-widget {
      flex-direction: column;
      align-items: stretch;
    }
    .talk-character {
      text-align: center;
      margin-bottom: 10px;
    }
    #talk-bubble {
      min-height: 72px;
      font-size: 15px;
    }
    #talk-next,
    #talk-random,
    .talk-choice {
      width: 100%;
      max-width: 320px;
      margin: 8px auto 0;
      padding: 10px 14px;
      font-size: 15px;
      text-align: center;
    }
    #talk-choices {
      flex-direction: column;
    }
  }
  `;
  document.head.appendChild(style);

  // ===== 2. 会話ウィジェットの DOM を生成して .container の先頭に差し込む =====
  const widget = document.createElement("div");
  widget.className = "talk-widget";
  widget.innerHTML = `
    <div class="talk-character">
      <!-- 画像は固定。パスは必要に応じて変更 -->
      <img id="talk-character-img" src="resources/images/normal.png" alt="キャラ画像">
    </div>
    <div class="talk-dialogue">
      <div id="talk-bubble">
        <p id="talk-bubble-text">タップ / クリック / Enter で会話開始！</p>
      </div>
      <button id="talk-next">▶ 次へ</button>
      <button id="talk-random">🎲 適当にしゃべる</button>
      <div id="talk-choices"></div>
    </div>
  `;
  container.insertBefore(widget, container.firstChild);

  // ===== 3. 会話データ（君の版に差し替え） =====
  const conversations = {
    greeting: {
      lines: [
        { text: "こんにちは。\nわざわざお越しいただきありがとうございます。" },
        { text: "ここでは、私のことを話しています。" },
        { choice: [
            { key: "profile", label: "ざっくりプロフィール" },
            {key: "program", label: "プログラミング" },
            {key: "love", label: "恋愛について" },
            { key: "contact", label: "連絡先について" }
        ]}
      ]
    },
    program: {
      lines: [
        { text: "プログラミングをやってみたいという人はかなりいますが" },
        { text: "できるだけ目的を持ったほうがいいです" },
        { text: "これを自動化したい...\nこういうソフトを作ってみたい..." },
        { text: "そういう意欲があったほうが効率は良くなると思います" },
        { text: "特に目的はないけど始めたい...\nという場合は" },
        { text: "競技プログラミングがおすすめです" },
        { text: "私は、高校受験が終わった瞬間にプログラミングを始めました。" },
        { text: "実は一番最初に勉強した言語はMQL4という言語です。" },
        { text: "まぁ今となってはかなり化石の言語ですけどね..." },

      ]
    },    
    love: {
      lines: [
        { text: "彼女はいたことがありません" },
        { text: "実は好きな人はいたのですが、\n結局言わないで終わりましたね..." },
        { text: "あの時に少しでも勇気があれば..." },
        { text: "そう思って今日も生きています" },
        { text: "その影響もあってか、\n後悔しないような生き方をしようと思えるようになりました" },
        { text: "行動しなければ、できたかもしれないことも絶対できませんからね" },
        { text: "皆さんはどんな後悔をしたことがありますか？\n是非教えて下さい" },
      ]
    },
    profile: {
      lines: [
        { text: "身長はだいたい175cmぐらいです" },
        { text: "数学が好きですが、工学部の道に進みました" },
        { text: "実は英語がとても苦手です" }
      ]
    },    
    contact: {
      lines: [
        { text: "連絡先は、一番右のcontactをクリックすれば書いてあります" },
        { text: "そこにあるメールアドレスから連絡してください" },
        { text: "あ、ちゃんと名乗っていただかないと反応しかねます\n(最低限苗字があれば大丈夫です)" },
        { text: "場合によっては1週間程度返信に時間がかかる場合があります" },
        { text: "返信が来なかったら...\n多分迷惑メールに入ってる可能性が高いです。ごめんなさい" }
      ]
    }
  };

  // ===== 3.5 ランダム単発トーク集 =====
  const randomTalks = [
    "実はこのランダム会話は10種類程度用意してます。\n是非楽しんでください!",
    "だれか私に英語の勉強方法を教えてくれませんか？\nお待ちしてます(笑)",
    "余談ですが、今まで彼女がいたことがありません。\nまぁ自信を持って言うことではないんですけどね。",
    "サイトのデザインを、たまに全部作り直したくなる衝動が来ます。",
    "RPGゲームは好きですが、対戦ゲームが下手です。",
    "実はRIJに出てみたいですが、なかなか勇気が出ません。",
    "休日はよくジョギングしてます",
    "恋人の作り方を知りたい？\n私も知りたいです(笑)",
    "実は実家で猫を飼ってます",
    "ドット絵の猫は、私の推しです",
    "実は、「春とヒコーキ」にいる土岡さんと同じ高校出身です\n(宇都宮高校)",
    "将来の夢は、好きな漫画家さんからサインをもらうことです",
    "実は医学に進むか工学に進むかでかなり迷いました",
    "このサイトでなにかおかしい部分があれば連絡お願いします",
  ];


let randomPool = [...randomTalks];  // 今の周回でまだ出ていないやつ
  // ===== 4. タイピング表示＆操作ロジック =====
  const bubble      = document.getElementById("talk-bubble");
  const bubbleText  = document.getElementById("talk-bubble-text");
  const choicesBox  = document.getElementById("talk-choices");
  const nextButton  = document.getElementById("talk-next");
  const randomButton= document.getElementById("talk-random");

  let currentScriptKey = "greeting";
  let currentScript    = conversations[currentScriptKey];
  let lineIndex        = 0;

  let isTyping    = false;
  let typingTimer = null;
  let fullText    = "";

  function typeText(text, speed = 35) {
    if (typingTimer) clearInterval(typingTimer);
    isTyping = true;
    fullText = text;
    bubbleText.textContent = "";
    let i = 0;

    typingTimer = setInterval(() => {
      if (i < text.length) {
        bubbleText.textContent += text[i++];
      } else {
        clearInterval(typingTimer);
        typingTimer = null;
        isTyping = false;
      }
    }, speed);
  }

  function showChoices(options) {
    choicesBox.innerHTML = "";
    choicesBox.style.display = "flex";

    options.forEach(({ key, label }) => {
      const btn = document.createElement("div");
      btn.className = "talk-choice";
      btn.textContent = label;
      btn.onclick = () => {
        currentScriptKey = key;
        currentScript    = conversations[currentScriptKey];
        lineIndex        = 0;
        choicesBox.style.display = "none";
        nextLine(true);
      };
      choicesBox.appendChild(btn);
    });
  }

  function nextLine(fromChoice = false) {
    // タイピング途中なら、まず全文表示だけする
    if (isTyping) {
      if (typingTimer) {
        clearInterval(typingTimer);
        typingTimer = null;
      }
      bubbleText.textContent = fullText;
      isTyping = false;
      return;
    }

    const lines = currentScript.lines;

    if (lineIndex < lines.length) {
      const line = lines[lineIndex];

      if (line.choice) {
        typeText("他に聞きたいことはありますか？");
        showChoices(line.choice);
        return;
      }

      choicesBox.style.display = "none";
      typeText(line.text);
      lineIndex++;

    } else {
      // 会話が末尾まで行ったら、共通メニューを出す
      typeText("他に聞きたいことはありますか？");
      showChoices([
            { key: "profile", label: "ざっくりプロフィール" },
            {key: "program", label: "プログラミング" },
            {key: "love", label: "恋愛について" },
            { key: "contact", label: "連絡先について" },
        { key: "greeting", label: "最初のあいさつに戻る" }
      ]);
    }
  }

  // 単発ランダムトーク
  function speakRandom() {
    if (typingTimer) {
      clearInterval(typingTimer);
      typingTimer = null;
    }
    isTyping = false;
    choicesBox.style.display = "none";

    // プールが空になったら補充
    if (randomPool.length === 0) {
      randomPool = [...randomTalks];
    }

    // プールの中からランダムで1つ選び、取り除く
    const idxInPool = Math.floor(Math.random() * randomPool.length);
    const text = randomPool.splice(idxInPool, 1)[0];

    typeText(text);
  }


  // ===== 5. イベント設定 =====

  // 吹き出しクリック
  bubble.addEventListener("click", (e) => {
    e.stopPropagation();
    nextLine();
  });

  // Nextボタン
  nextButton.addEventListener("click", (e) => {
    e.stopPropagation();
    nextLine();
  });

  // ランダムトークボタン
  randomButton.addEventListener("click", (e) => {
    e.stopPropagation();
    speakRandom();
  });

  randomButton.addEventListener("touchstart", (e) => {
    e.stopPropagation();
    e.preventDefault();
    speakRandom();
  });

  // キーボード（PC向け）
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      nextLine();
    }
  });

  // スマホ向け：吹き出しタップでも進む
  bubble.addEventListener("touchstart", (e) => {
    e.preventDefault(); // クリック二重発火を防ぐ
    nextLine();
  });
});
