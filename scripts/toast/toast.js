(function () {
  const positions = [
    "top-left",
    "top-right",
    "bottom-left",
    "bottom-right",
    "top-center",
    "bottom-center"
  ];

  function getContainer(position) {
    let container = document.querySelector(`.toast-container.${position}`);
    if (!container) {
      container = document.createElement("div");
      container.className = `toast-container ${position}`;
      document.body.appendChild(container);
    }
    return container;
  }

  function removeToast(toast) {
    toast.classList.remove("show");
    toast.classList.add("hide");
    toast.addEventListener("transitionend", () => toast.remove());
  }

  window.toast = function (message, { type = "success", position = "top-right", duration = 3000 } = {}) {
    if (!positions.includes(position)) position = "top-right";

    const container = getContainer(position);
    const toast = document.createElement("div");
    toast.className = `toast ${type}`;
    toast.innerHTML = `
      <span class="toast-message">${message}</span>
      <button class="toast-close" aria-label="Đóng">&times;</button>
    `;

    toast.querySelector(".toast-close").onclick = () => removeToast(toast);
    container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add("show"));

    if (duration > 0) {
      setTimeout(() => removeToast(toast), duration);
    }
  };
})();
