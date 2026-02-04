document.addEventListener("DOMContentLoaded", function () {
  function createMobileMenu() {
    // Nếu đã có menu rồi thì không tạo thêm
    if (document.querySelector(".mobile-top-menu")) return;

    // Tạo container menu
    const menu = document.createElement("div");
    menu.className = "mobile-top-menu";

    // Nội dung menu
    menu.innerHTML = `
      <div class="menu-left">
        <div class="logo">
          <img src="/images/logo.svg" onerror="this.onerror=null; this.src='/images/logo.png';">
        </div>
      </div>
      <div class="menu-right">
        <button class="btn-plus">
          <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 10.5H15" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
            <path d="M10 15.5V5.5" stroke="white" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
        
        <button class="btn-menu">
          <span class="bar"></span>
          <span class="bar"></span>
          <span class="bar"></span>
        </button>
      </div>
    `;

    document.body.prepend(menu);

    // Gắn event cho nút menu (3 sọc -> X)
    const btnMenu = menu.querySelector(".btn-menu");
    const sidebar = document.querySelector(".sidebar");

    btnMenu.addEventListener("click", function () {
      btnMenu.classList.toggle("active");
      sidebar.classList.toggle("open");
       if (sidebar.classList.contains("open")) {
        document.body.classList.add("mobile-menu-open");
      } else {
        document.body.classList.remove("mobile-menu-open");
      }
    });
    const btnPlus = menu.querySelector(".btn-plus");
    btnPlus.addEventListener("click", function () {
      window.location.href = "content.html";
    });

   
  }

  function handleResize() {
    if (window.innerWidth <= 768) {
      createMobileMenu();
    } else {
      // Xóa menu nếu không ở mobile
      const menu = document.querySelector(".mobile-top-menu");
      if (menu) menu.remove();
      const sidebar = document.querySelector(".sidebar");
      if (sidebar) sidebar.classList.remove("open");
      document.body.classList.remove('mobile-menu-open');
    }
  }

  window.addEventListener("resize", handleResize);
  handleResize();
});
