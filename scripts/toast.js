(function() {
  function showAlert(message) {
    // Nếu đã có alert đang mở thì bỏ qua
    if (document.querySelector(".custom-alert-overlay")) return;

    const overlay = document.createElement("div");
    overlay.className = "custom-alert-overlay";
    overlay.style.position = "fixed";
    overlay.style.top = "0";
    overlay.style.left = "0";
    overlay.style.width = "100%";
    overlay.style.height = "100%";
    overlay.style.background = "rgba(0,0,0,0.4)";
    overlay.style.display = "flex";
    overlay.style.justifyContent = "center";
    overlay.style.alignItems = "center";
    overlay.style.zIndex = "9999";

    const box = document.createElement("div");
    box.style.background = "#fff";
    box.style.padding = "20px";
    box.style.borderRadius = "8px";
    box.style.maxWidth = "300px";
    box.style.textAlign = "center";
    box.style.boxShadow = "0 4px 10px rgba(0,0,0,0.2)";

    const msg = document.createElement("div");
    msg.style.marginBottom = "15px";
    msg.textContent = message;

    const btn = document.createElement("button");
    btn.textContent = "OK";
    btn.style.padding = "6px 15px";
    btn.style.border = "none";
    btn.style.background = "#007bff";
    btn.style.color = "#fff";
    btn.style.borderRadius = "4px";
    btn.style.cursor = "pointer";

    btn.onmouseover = () => btn.style.background = "#0056b3";
    btn.onmouseout = () => btn.style.background = "#007bff";

    btn.onclick = function() {
      document.body.removeChild(overlay);
    };

    box.appendChild(msg);
    box.appendChild(btn);
    overlay.appendChild(box);
    document.body.appendChild(overlay);
  }

  // Expose ra global
  window.showAlert = showAlert;
})();
