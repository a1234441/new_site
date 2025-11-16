document.addEventListener("DOMContentLoaded", () => {
  const navContainer = document.getElementById("site-nav");
  if (!navContainer) return;

  fetch("/resources/programs/nav.html")
    .then(response => response.text())
    .then(html => {
      navContainer.innerHTML = html;
    })
    .catch(err => {
      console.error("ナビ読み込みエラー:", err);
    });
});
