document.addEventListener("DOMContentLoaded", () => {
  const navContainer = document.getElementById("site-nav");
  if (!navContainer) return;

  // --- GitHub Pages かどうか判定 ---
  const isGithub = location.hostname.endsWith(".github.io");
  let basePath = "";

  if (isGithub) {
    // 例: https://username.github.io/new_site/self_intro.html
    // → pathname: /new_site/self_intro.html
    // → parts[0] = "new_site" をベースパスにする
    const parts = location.pathname.split("/").filter(Boolean); // 空文字を削除
    if (parts.length > 0) {
      basePath = "/" + parts[0]; // "/new_site" みたいになる
    }
  }

  // GitHub のとき: "/new_site/resources/..."
  // 普通のサーバのとき: "/resources/..."
  fetch(`${basePath}/resources/programs/nav.html`)
    .then((response) => {
      if (!response.ok) {
        console.error("nav.html 読み込み失敗:", response.status);
        return "";
      }
      return response.text();
    })
    .then((html) => {
      navContainer.innerHTML = html;

      // GitHub Pages のときだけ、/index.html 系リンクにベースパスを足す
      if (isGithub && basePath) {
        navContainer.querySelectorAll("a[href^='/']").forEach((a) => {
          const href = a.getAttribute("href"); // 例: "/index.html"
          a.setAttribute("href", basePath + href); // "/new_site/index.html" に書き換え
        });
      }
    })
    .catch((err) => {
      console.error("ナビ読み込みエラー:", err);
    });
});
