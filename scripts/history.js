(function () {
  // ====== CONFIG ======
  const API_BASE = 'https://wttbe.metapress.ai';
  const getToken = () => localStorage.getItem("auth_token") || "";
  async function loadHistory(){
    const token = getToken();
    const historyContainer = document.getElementById("chat-history");
    try {
      const response = await fetch(API_BASE+'/api/load-history', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
           Authorization: "Bearer " + token, 
           Accept: "application/json"
        }
      });
      const data = await response.json();
      data.articles.forEach(article => {
          const item = document.createElement("div");
          item.textContent = article.title;
          item.classList.add('sidebar__menu-item');
          item.style.cursor = "pointer";
          // khi click sẽ chuyển trang kèm id
          item.onclick = () => {
              window.location.href = `article.html?code=${article.id}`;
          };
          historyContainer.appendChild(item);
      });
    }
    catch (error) {
      console.error(error);
      toast("Có lỗi xảy ra, vui lòng thử lại.",{type: "error"});
    }
  }
  loadHistory();
})();
