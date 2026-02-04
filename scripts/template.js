(function () {
  const API_BASE = 'https://wttbe.metapress.ai';
  // ====== SimpleModal instance cho modal tạo template ======
  const modalTemplate = new SimpleModal({
    titleText: "Lưu Template",
    content: `
      <div id="templateForm" style="padding:16px" class="form-content">
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Tên template</label>
            <div class="input-box">
              <input 
                id="templateName" 
                name="templateName" 
                type="text" 
                class="input input-number" 
                placeholder="Nhập tên Template"
                required 
              />
            </div>
          </div>
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">Chế độ hiển thị</label>
            <div style="display: flex;gap: 20px;">
              <label style="display: flex;align-items: center;">
                <input type="radio" name="visibility" value="public" checked="" style="margin: 0px 4px 0px 0px;width: auto;">
                Công khai
              </label>
              <label style="display: flex;align-items: center;">
                <input type="radio" name="visibility" value="private" style="margin: 0px 4px 0px 0px;width: auto;">
                Riêng tư
              </label>
            </div>
            <div class="form-hint">
              Công khai: mọi người đều thấy và sử dụng; Riêng tư: chỉ bạn nhìn thấy và sử dụng
            </div>
          </div>
        </div>

      </div>
    `,
    position: "center",
    footerButtons: [
      { text: "Đóng", class: "btn-cancel", onClick: () => modalTemplate.closeModal() },
      { text: "Xác nhận", class: "btn-primary", onClick: () => saveTemplate(templateId) },
    ]
  });

  //const formWrapper = document.getElementById();

  // ====== Hàm mở modal ======
  async function openTemplateModal() {
    modalTemplate.openModal();
    if (templateId) {
      await loadTemplate(templateId); // load dữ liệu cũ để edit
    }
  }

  // ====== Hàm xử lý lưu template ======
  async function saveTemplate(templateCode = null) {
    const form = document.getElementById("templateForm");
    const templateName = document.getElementById("templateName").value.trim();
    const visibility = document.querySelector('input[name="visibility"]:checked')?.value || "private";
    const schema = schemaGlobal;
    const payloadSchema = {};
    schema.attributes.forEach(field => {
				const el = document.getElementById(field.id);
				if (!el) return;
				let value;
				switch (field.type) {
					case "select":
						value = el.multiple
							? Array.from(el.selectedOptions).map(opt => opt.value)
							: el.value;
						break;
					case "number":
						value = el.value ? Number(el.value) : null;
						break;
					default:
						value = el.value.trim();
						break;
				}
				payloadSchema[field.code] = { label: field.label, value };
		});
    
    if (!templateName) {
      toast("Vui lòng nhập tên template", { type: "warning" });
      return;
    }

    const payload = {
      id: templateCode,
      templateName: templateName,
      visibility: visibility,
      taxonomy_store:payloadSchema,
      taxonomy_code:schemaGlobal.id
    };

    const token = localStorage.getItem("auth_token");
    const url = templateId 
      ? API_BASE + "/api/template/update"
      : API_BASE + "/api/template/create";

    try {
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.status === "success") {
        toast("Template đã được lưu thành công", { type: "success" });
        if (typeof templateCache !== "undefined") {
          templateCache = null; // xóa cache cũ
        }
        renderTemplateList();
        templateId = data.template.id;
        modalTemplate.closeModal();
      } else {
        toast("Lỗi: " + data.message, { type: "error" });
      }
    }
    catch (error) {
      console.error(error);
      toast("Không thể lưu template, vui lòng thử lại.", { type: "error" });
    }
  }
  
  async function loadTemplate(templateId) {
      const token = localStorage.getItem("auth_token");
      const url = API_BASE + "/api/template/detail/" + templateId;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
            Accept: "application/json",
          },
        });
        const data = await response.json();
        if (data.status === "success" && data.template) {
          document.getElementById("templateName").value = data.template.name || "";
          document.querySelector(`input[name="visibility"][value="${data.template.visibility}"]`).checked = true;
          //console.log(data)
          //toast("Tải template thành công", { type: "info" });
        } else {
          //toast("Không tải được template", { type: "error" });
        }
      } catch (error) {
        console.log(error);
        toast("Có lỗi khi tải template", { type: "error" });
      }
  }
  async function loadHeaderTemplate(templateId) {
      const token = localStorage.getItem("auth_token");
      const url = API_BASE + "/api/template/detail/" + templateId;
      try {
        const response = await fetch(url, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + token,
            Accept: "application/json",
          },
        });
        const data = await response.json();
        if (data.status === "success" && data.template) {
          setTemplateHeader(data.template.id,data.template.name)
        } else {
          toast("Không tải được template", { type: "error" });
        }
      } catch (error) {
        //console.log(error);
        toast("Có lỗi khi tải template", { type: "error" });
      }
      
  }
  async function loadTemplateList() {
    if (templateCache) {
      return templateCache;
    }

    const token = localStorage.getItem("auth_token");
    const url = API_BASE + "/api/template/all";

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          Accept: "application/json",
        },
      });

      const data = await response.json();
      if (data.status === "success") {
        console.log("success");
        //toast("Danh sách template đã tải", { type: "success" });

      } else {

        toast("Không tải được danh sách template", { type: "error" });

      }

      templateCache = data.templates;
      return data.templates;
    } catch (error) {
      console.error(error);
      toast("Có lỗi khi tải danh sách template", { type: "error" });
      return [];
    }
  }

  async function renderTemplateList() {
    const templates = await loadTemplateList();
    const container = document.getElementById("templates");
    container.innerHTML = `
      <div class="template-search" role="search">
        <span class="template-search__icon" aria-hidden="true">
          <svg width="16" height="17" viewBox="0 0 16 17" fill="none"
            xmlns="http://www.w3.org/2000/svg">
            <path d="M7.66671 14.5C11.1645 14.5 14 11.6645 14 8.16667C14 4.66887 11.1645 1.83334 7.66671 1.83334C4.1689 1.83334 1.33337 4.66887 1.33337 8.16667C1.33337 11.6645 4.1689 14.5 7.66671 14.5Z" stroke="#666666" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M14.6667 15.1667L13.3334 13.8333" stroke="#666666" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </span>
        <input type="text" id="template-search-input" class="template-search__input"
          placeholder="Tìm kiếm theo tên template..."
          aria-label="Tìm kiếm theo tên template">
      </div>
      <div id="template-list" class="templates-grid"></div>
    `;

    const listEl = container.querySelector("#template-list");

    templates.forEach(template => {
      const card = document.createElement("div");
      card.classList.add("template-card");
      card.innerHTML = `
        <h3 class="template-card__title">${template.name}</h3>
        <div class="template-card__divider"></div>
        <div class="template-card__footer">
          <div class="template-card__meta">
            <span class="template-card__author">Tác giả: ${template.author || 'Không rõ'}</span>
          </div>
          <button class="template-card__btn" type="button">Sử dụng</button>
        </div>
      `;
      card.querySelector(".template-card__btn").addEventListener("click", () => {
        applyTemplate(template);
      });
      listEl.appendChild(card);
    });

    const searchInput = document.getElementById("template-search-input");
    searchInput.addEventListener("input", function () {
      const keyword = this.value.toLowerCase();
      const cards = listEl.querySelectorAll(".template-card");
      cards.forEach(card => {
        const title = card.querySelector(".template-card__title").textContent.toLowerCase();
        card.style.display = title.includes(keyword) ? "block" : "none";
      });
    });
  }

  function applyTemplate(template) {
    try {
      const data = JSON.parse(template.taxonomy_store);
      templateId = template.id;
      Object.keys(data).forEach(key => {
        const input = document.querySelector(`[name="${key}"]`);
        if(key=="chu_de"){
          return;
        }
        if (input) {
          input.value = data[key].value || "";
        }
      });
      const tab = document.querySelector('.tab[data-trigger="formWrapper"]');
      if (tab) {
        tab.click();
      }

      //loadTemplate(templateId);
      toast("Template đã được áp dụng: " + template.name, { type: "success" });

      setTemplateHeader(template.id,template.name);

    } catch (err) {

      console.error("Lỗi applyTemplate:", err, template);
      toast("Không thể áp dụng template", { type: "error" });

    }
  }

  function setTemplateHeader(templateId, templateName = "Tin highlight trận đấu") {
    const formWrapper = document.getElementById('formWrapper');
    if (!formWrapper) return;

    // Nếu đã có header => chỉ cập nhật tên template
    let templateRow = document.getElementById('templateRowInfo');
    if (templateRow) {
      const titleEl = templateRow.querySelector('.template-title');
      if (titleEl) titleEl.textContent = templateName;
      return;
    }

    // Tạo container chính
    templateRow = document.createElement('div');
    templateRow.id = 'templateRowInfo';
    templateRow.className = 'form-row template-header';

    // Nội dung HTML
    templateRow.innerHTML = `
      <div class="template-box">
        <div class="template-content">
          <span class="template-label">Templates đang dùng</span>
          <div class="template-title-wrapper">
            <span class="template-title">${templateName}</span>
          </div>
        </div>
        <div class="template-icon" style="cursor:pointer" title="Xóa template đang chọn">
          <svg width="33" height="32" viewBox="0 0 33 32" fill="none" xmlns="http://www.w3.org/2000/svg">
            <rect x="0.5" width="32" height="32" rx="16" fill="#F3F5F7"></rect>
            <path d="M11.2507 10.75L21.75 21.2493" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
            <path d="M11.2501 21.2493L21.7494 10.75" stroke="#292D32" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path>
          </svg>
        </div>
      </div>
    `;

    // Gán sự kiện click vào icon để xóa
    const iconBtn = templateRow.querySelector('.template-icon');
    iconBtn.addEventListener('click', () => {
      templateRow.remove();
      clearForm();
      templateId = null;
      //console.log('Template cleared!');
      // Nếu cần, thêm lệnh reset form hoặc cập nhật trạng thái tại đây
    });

    // Thêm vào đầu formWrapper
    formWrapper.prepend(templateRow);
  }



  // ====== Expose ra window ======
  window.openTemplateModal = openTemplateModal;
  window.loadTemplateList = loadTemplateList;
  window.renderTemplateList = renderTemplateList;
  window.saveTemplate = saveTemplate;
  window.setTemplateHeader = setTemplateHeader;
  window.loadHeaderTemplate = loadHeaderTemplate;
})();
