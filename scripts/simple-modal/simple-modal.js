class SimpleModal {
  static modalStack = [];

  constructor(userOptions = {}) {
    this.options = Object.assign({
      titleText: "Modal",
      allowCloseButton: true,
      allowCloseByOverlay: true,
      overlayExtraClass: "",
      modalExtraClass:"",
      position: "center",
      width: "768px",     // có thể: "768px", "80%", "90vh"
      height: "auto",     // có thể: "600px", "70%", "auto", "90vh"
      content: "",
      footerButtons: []
    }, userOptions);

    this.createModalStructure();
  }

  createModalStructure() {
    // Overlay
    this.overlayElement = document.createElement("div");
    this.overlayElement.className = `simple-overlay ${this.options.position} ${this.options.overlayExtraClass}`;

    // Modal
    this.modalElement = document.createElement("div");
    this.modalElement.className = `simple-modal ${this.options.modalExtraClass}`;

    // Xử lý width/height: tự động thêm đơn vị nếu là số
    const widthValue = isNaN(this.options.width)
      ? this.options.width
      : this.options.width + "px";
    const heightValue = isNaN(this.options.height)
      ? this.options.height
      : this.options.height + "px";

    this.modalElement.style.width = widthValue;
    this.modalElement.style.height = heightValue;

    // Header
    this.headerElement = document.createElement("div");
    this.headerElement.className = "simple-header";

    const headerTitleWrapper = document.createElement("div");
    headerTitleWrapper.className = "header-title";
    headerTitleWrapper.textContent = this.options.titleText;
    this.headerElement.appendChild(headerTitleWrapper);

    if (this.options.allowCloseButton) {
      const closeButton = document.createElement("button");
      closeButton.className = "header-close-button";
      closeButton.innerHTML = `
        <svg style="cursor: pointer;" width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect width="32" height="32" rx="16" fill="#F3F5F7"></rect>
          <path d="M10.7507 10.75L21.25 21.2493" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          <path d="M10.75 21.2493L21.2493 10.75" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
        </svg>`;
      closeButton.onclick = () => this.closeModal();
      this.headerElement.appendChild(closeButton);
    }

    // Body
    this.bodyElement = document.createElement("div");
    this.bodyElement.className = "simple-body";
    if (typeof this.options.content === "string") {
      this.bodyElement.innerHTML = this.options.content;
    } else {
      this.bodyElement.appendChild(this.options.content);
    }

    // Footer
    this.footerElement = document.createElement("div");
    this.footerElement.className = "simple-footer";
    if (this.options.footerButtons.length > 0) {
      this.options.footerButtons.forEach(buttonOption => {
        const footerButton = document.createElement("button");
        footerButton.innerHTML = buttonOption.text;
        if (buttonOption.class) footerButton.className = buttonOption.class;
        if (buttonOption.onClick) footerButton.onclick = buttonOption.onClick;
        this.footerElement.appendChild(footerButton);
      });
    }

    // Combine
    this.modalElement.appendChild(this.headerElement);
    this.modalElement.appendChild(this.bodyElement);
    if (this.options.footerButtons.length > 0) {
      this.modalElement.appendChild(this.footerElement);
    }
    this.overlayElement.appendChild(this.modalElement);

    // Overlay click để đóng
    if (this.options.allowCloseByOverlay) {
      this.overlayElement.addEventListener("click", (event) => {
        if (event.target === this.overlayElement) this.closeModal();
      });
    }
  }

  openModal() {
    document.body.appendChild(this.overlayElement);
    document.body.classList.add("modal-open");
    SimpleModal.modalStack.push(this);
    setTimeout(() => this.overlayElement.classList.add("show"), 10);
  }

  closeModal() {
    this.overlayElement.classList.remove("show");
    document.body.classList.remove("modal-open");
    setTimeout(() => {
      if (this.overlayElement.parentNode) {
        this.overlayElement.parentNode.removeChild(this.overlayElement);
      }
    }, 250);
    SimpleModal.modalStack = SimpleModal.modalStack.filter(modal => modal !== this);
  }
}
