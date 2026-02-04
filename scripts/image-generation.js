(function () {
  const API_BASE = 'https://wttbe.metapress.ai';
  const getToken = () => localStorage.getItem("auth_token") || "";
  let currentArticleContentId = null;
  let progressInterval = null;

  // ====== HTML MODAL ======
  const createImageHtml = `
    <div id="generateImage" class="modal-generate-image">
      <div class="generate-grid">
        <!-- LEFT PANEL -->
        <div class="generate-left">
          <div class="generate-form">

            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="image_type">Loại hình ảnh *</label>
                <div class="select-wrapper">
                  <select id="image_type" name="image_type" class="custom-select" required>
                    <option value="">Chọn phong cách hình ảnh</option>
                    <option value="realistic">Realistic / Natural</option>
                    <option value="cinematic">Cinematic</option>
                    <option value="3d_render">3D Render / CGI</option>
                    <option value="digital_art">Digital Art / Concept Art</option>
                    <option value="vector">Flat Vector / Illustration</option>
                    <option value="isometric">Isometric</option>
                    <option value="watercolor">Watercolor Painting</option>
                    <option value="sketch">Sketch / Pencil Drawing</option>
                    <option value="minimalist">Minimalist / Clean</option>
                    <option value="futuristic">Futuristic / Sci-Fi</option>
                    <option value="vintage">Vintage / Retro</option>
                    <option value="moody">Moody / Dramatic Lighting</option>
                  </select>
                  <div class="select-icon">
                    <svg width="17" height="17" viewBox="0 0 17 17" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8.5 11.7c-.47 0-.93-.18-1.28-.53L2.87 6.82a.38.38 0 0 1 0-.71c.19-.19.49-.19.7 0l4.35 4.35c.32.32.83.32 1.15 0l4.35-4.35c.19-.19.5-.19.7 0a.38.38 0 0 1 0 .71l-4.35 4.35c-.35.35-.81.53-1.27.53z" fill="#292D32"/>
                    </svg>
                  </div>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label" for="description">Mô tả (nếu có)</label>
                <div class="textarea-box" style="display:flex">
                  <textarea name="description" id="description" class="textarea" placeholder="Nhập nội dung..."></textarea>
                </div>
              </div>
            </div>

          </div>
        </div>
        <!-- RIGHT PANEL -->
        <div class="generate-right">
          <div class="output-section">

            <span class="output-title">Outputs</span>

            <div id="imageLoadingSpinner" class="loading-spinner" style="display:none;margin-top:14px">
              <div class="loading-text">Đang tạo ảnh minh họa...</div>
              <div class="loading-bar-container">
                <div class="loading-bar" id="imageLoadingBar" style="width:10%;"></div>
              </div>
            </div>

            <!-- EMPTY STATE -->

            <div class="output-content output-empty">
              <div class="output-image-wrapper">
                <div class="output-image-placeholder">
                  <svg width="141" height="89" viewBox="0 0 141 89" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <rect width="141" height="89" rx="8" fill="#F3F4F6"/>
                    <path d="M46 65L63 47L74 60L89 43L112 65H46Z" fill="#E5E7EB"/>
                    <circle cx="56" cy="36" r="6" fill="#D1D5DB"/>
                  </svg>
                </div>
              </div>
              <div class="output-message" style="text-align:center;padding-top:15px">
                <span>Ảnh minh họa sẽ được tạo ra ở đây</span>
              </div>
            </div>

            <div id="outputList" class="output-list"></div>
            
          </div>
        </div>
      </div>
    </div>
  `;
  
  const modalGenerate = new SimpleModal({
    titleText: "Tạo ảnh minh họa",
    content: createImageHtml,
    modalExtraClass: "image-generate-modal",
    position: "center",
    width: '880px',
    height: '90vh',
    footerButtons: [
      { text: "Đóng", class: "btn-outline", onClick: () => modalGenerate.closeModal() },
      { text: `<svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
								<path d="M16.25 6.25007L15.0084 7.49173L12.5084 4.99173L13.75 3.75007C14.1 3.40007 14.55 3.2334 15 3.2334C15.45 3.2334 15.9 3.40007 16.25 3.75007C16.9417 4.44173 16.9417 5.5584 16.25 6.25007Z" fill="white"></path>
								<path d="M14.425 8.08325L5.4167 17.0833C4.72503 17.7749 3.60837 17.7749 2.9167 17.0833C2.22503 16.3916 2.22503 15.2749 2.9167 14.5833L11.925 5.58325L14.425 8.08325Z" fill="white"></path>
								<path d="M8.2917 2.91668L8.63337 1.75835C8.6667 1.65001 8.63337 1.53335 8.55837 1.45001C8.48337 1.36668 8.35003 1.33335 8.2417 1.36668L7.08337 1.70835L5.92503 1.36668C5.8167 1.33335 5.70003 1.36668 5.6167 1.44168C5.53337 1.52501 5.50837 1.64168 5.5417 1.75001L5.87503 2.91668L5.53337 4.07501C5.50003 4.18335 5.53337 4.30001 5.60837 4.38335C5.6917 4.46668 5.80837 4.49168 5.9167 4.45835L7.08337 4.12501L8.2417 4.46668C8.27503 4.47501 8.30003 4.48335 8.33337 4.48335C8.4167 4.48335 8.4917 4.45001 8.55837 4.39168C8.6417 4.30835 8.6667 4.19168 8.63337 4.08335L8.2917 2.91668Z" fill="white"></path>
								<path d="M4.95833 7.91668L5.29999 6.75835C5.33333 6.65001 5.29999 6.53335 5.22499 6.45001C5.14166 6.36668 5.02499 6.34168 4.91666 6.37501L3.74999 6.70835L2.59166 6.36668C2.48333 6.33335 2.36666 6.36668 2.28333 6.44168C2.19999 6.52501 2.17499 6.64168 2.20833 6.75001L2.54166 7.91668L2.19999 9.07501C2.16666 9.18335 2.19999 9.30001 2.27499 9.38335C2.35833 9.46668 2.47499 9.49168 2.58333 9.45835L3.74166 9.11668L4.89999 9.45835C4.92499 9.46668 4.95833 9.46668 4.99166 9.46668C5.07499 9.46668 5.14999 9.43335 5.21666 9.37501C5.29999 9.29168 5.32499 9.17501 5.29166 9.06668L4.95833 7.91668Z" fill="white"></path>
								<path d="M17.4583 12.0833L17.8 10.925C17.8333 10.8166 17.8 10.7 17.725 10.6166C17.6417 10.5333 17.525 10.5083 17.4167 10.5416L16.2583 10.8833L15.1 10.5416C14.9917 10.5083 14.875 10.5416 14.7917 10.6166C14.7083 10.7 14.6833 10.8166 14.7167 10.925L15.0583 12.0833L14.7167 13.2416C14.6833 13.35 14.7167 13.4666 14.7917 13.55C14.875 13.6333 14.9917 13.6583 15.1 13.625L16.2583 13.2833L17.4167 13.625C17.4417 13.6333 17.475 13.6333 17.5083 13.6333C17.5917 13.6333 17.6667 13.6 17.7333 13.5416C17.8167 13.4583 17.8417 13.3416 17.8083 13.2333L17.4583 12.0833Z" fill="white"></path>
							</svg> Generate`, class: "btn-primary", onClick: () => handleGenerate() },
    ]
  });
  
  // ====== OPEN MODAL ======
  function openGenerateModal(article_content_id) {
    if (!article_content_id) {
      return;
    }
    currentArticleContentId = article_content_id;
    modalGenerate.openModal();
    loadExistingImages(article_content_id);
  }

  // ====== LOAD EXISTING IMAGES ======
  async function loadExistingImages(article_content_id) {
    const token = getToken();
    const outputList = document.getElementById("outputList");
    const emptyBox = document.querySelector('#generateImage .output-empty');
    outputList.innerHTML = ``;
    if (emptyBox) emptyBox.style.display = "block";

    try {
      const response = await fetch(`${API_BASE}/api/load-image?article_content_id=${article_content_id}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          Accept: "application/json",
        },
      });
      const data = await response.json();
      if (data.status !== "success") {
        if (emptyBox) emptyBox.style.display = "block";
        return;
      }
      const images = data.data?.images || [];
      if (images.length) {
        renderOutputs(images);
        if (emptyBox) emptyBox.style.display = "none";
      } else {
        if (emptyBox) emptyBox.style.display = "block";
      }
    } catch (error) {
      console.error(error);
      if (emptyBox) emptyBox.style.display = "block";
    }
  }

  // ====== SHOW / HIDE SPINNER + PROGRESS ======
  function showLoadingSpinner() {
    const spinner = document.getElementById("imageLoadingSpinner");
    const bar = document.getElementById("imageLoadingBar");
    if (!spinner || !bar) return;
    spinner.style.display = "flex";
    spinner.classList.add("show");

    let progress = 10;
    bar.style.width = progress + "%";

    if (progressInterval) clearInterval(progressInterval);
    progressInterval = setInterval(() => {
      if (progress >= 90) return;
      progress += 3;
      bar.style.width = progress + "%";
    }, 1200);
  }

  function hideLoadingSpinner() {
    const spinner = document.getElementById("imageLoadingSpinner");
    const bar = document.getElementById("imageLoadingBar");
    if (!spinner || !bar) return;
    spinner.style.display = "none";
    spinner.classList.remove("show");
    if (progressInterval) clearInterval(progressInterval);
    bar.style.width = "100%";
    setTimeout(() => (bar.style.width = "10%"), 500);
  }

  // ====== HANDLE GENERATE ======
  async function handleGenerate() {
  const type = document.querySelector('#generateImage select[name="image_type"]').value.trim();
  const desc = document.querySelector('#generateImage textarea[name="description"]').value.trim();
  const token = getToken();
  const emptyBox = document.querySelector('#generateImage .output-empty');
  const outputList = document.getElementById("outputList");

  if (!type) {
    toast("Vui lòng chọn loại hình ảnh.", { type: "warning" });
    return;
  }

  // 1. Trước khi generate: ẩn empty và hiển thị spinner
  if (emptyBox) emptyBox.style.display = "none";
  showLoadingSpinner();

  try {
    const response = await fetch(`${API_BASE}/api/generate-image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer " + token,
        "Accept": "application/json",
      },
      body: JSON.stringify({
        image_type: type,
        description: desc,
        article_content_id: currentArticleContentId,
      }),
    });

    const data = await response.json();
    hideLoadingSpinner();

    if (data.status !== "success") {
      toast("Lỗi: " + (data.message || "Không thể tạo ảnh."), { type: "error" });
      updateEmptyBoxState();
      return;
    }

    const images = data.data?.images || [];

    if (images.length > 0) {
      appendOutputs(images);
      toast("Tạo ảnh thành công.", { type: "success" });
    } else {
      toast("Không có ảnh nào được tạo.", { type: "warning" });
    }

    // Cập nhật trạng thái empty sau khi xử lý
    updateEmptyBoxState();

  } catch (error) {
    //console.error(error);
    hideLoadingSpinner();

    toast("Có lỗi xảy ra khi tạo ảnh.", { type: "error" });

    updateEmptyBoxState();
  }

  // Hàm phụ: kiểm tra còn ảnh không, nếu không thì show empty
  function updateEmptyBoxState() {
    if (!emptyBox || !outputList) return;
    if (outputList.children.length === 0) {
      emptyBox.style.display = "block";
    } else {
      emptyBox.style.display = "none";
    }
  }
}


  // ====== RENDER OUTPUTS ======
  function renderOutputs(images) {
    const outputList = document.getElementById("outputList");
    if (!outputList) return;
    outputList.innerHTML = images.map(renderOutputItem).join('');
  }

  function appendOutputs(images) {
    const outputList = document.getElementById("outputList");
    if (!outputList) return;
    const html = images.map(renderOutputItem).join('');
    outputList.insertAdjacentHTML("afterbegin", html);
  }

  function renderOutputItem(url, i) {
    return `
      <div class="output-item" data-url="${url}">
        <img onclick="openImagePreview('/${url}')" src="/${url}" alt="Ảnh ${i + 1 || ''}" class="output-thumb" style="cursor:pointer" />
        <div class="output-actions">
          <button class="btn-icon" title="Xem ảnh" onclick="openImagePreview('/${url}')">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M8.99994 12.2474C7.20744 12.2474 5.75244 10.7924 5.75244 8.99994C5.75244 7.20744 7.20744 5.75244 8.99994 5.75244C10.7924 5.75244 12.2474 7.20744 12.2474 8.99994C12.2474 10.7924 10.7924 12.2474 8.99994 12.2474ZM8.99994 6.87744C7.82994 6.87744 6.87744 7.82994 6.87744 8.99994C6.87744 10.1699 7.82994 11.1224 8.99994 11.1224C10.1699 11.1224 11.1224 10.1699 11.1224 8.99994C11.1224 7.82994 10.1699 6.87744 8.99994 6.87744Z" fill="#292D32"/>
              <path d="M9.00006 15.7649C6.18006 15.7649 3.51756 14.1149 1.68756 11.2499C0.892559 10.0124 0.892559 7.99486 1.68756 6.74986C3.52506 3.88486 6.18756 2.23486 9.00006 2.23486C11.8126 2.23486 14.4751 3.88486 16.3051 6.74986C17.1001 7.98736 17.1001 10.0049 16.3051 11.2499C14.4751 14.1149 11.8126 15.7649 9.00006 15.7649ZM9.00006 3.35986C6.57756 3.35986 4.26006 4.81486 2.64006 7.35736C2.07756 8.23486 2.07756 9.76486 2.64006 10.6424C4.26006 13.1849 6.57756 14.6399 9.00006 14.6399C11.4226 14.6399 13.7401 13.1849 15.3601 10.6424C15.9226 9.76486 15.9226 8.23486 15.3601 7.35736C13.7401 4.81486 11.4226 3.35986 9.00006 3.35986Z" fill="#292D32"/>
            </svg>
          </button>
          <button class="btn-icon" title="Tải ảnh" onclick="downloadImage('/${url}')"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M11.4449 16.6875H6.55486C2.87236 16.6875 1.29736 15.1125 1.29736 11.43V11.3325C1.29736 8.00246 2.60986 6.39746 5.54986 6.11996C5.84986 6.09746 6.13486 6.32246 6.16486 6.62996C6.19486 6.93746 5.96986 7.21496 5.65486 7.24496C3.29986 7.46246 2.42236 8.57246 2.42236 11.34V11.4375C2.42236 14.49 3.50236 15.57 6.55486 15.57H11.4449C14.4974 15.57 15.5774 14.49 15.5774 11.4375V11.34C15.5774 8.55746 14.6849 7.44746 12.2849 7.24496C11.9774 7.21496 11.7449 6.94496 11.7749 6.63746C11.8049 6.32996 12.0674 6.09746 12.3824 6.12746C15.3674 6.38246 16.7024 7.99496 16.7024 11.3475V11.445C16.7024 15.1125 15.1274 16.6875 11.4449 16.6875Z" fill="#292D32"/>
<path d="M9 11.7225C8.6925 11.7225 8.4375 11.4675 8.4375 11.16V1.5C8.4375 1.1925 8.6925 0.9375 9 0.9375C9.3075 0.9375 9.5625 1.1925 9.5625 1.5V11.16C9.5625 11.475 9.3075 11.7225 9 11.7225Z" fill="#292D32"/>
<path d="M9.00013 12.5626C8.85763 12.5626 8.71513 12.5101 8.60263 12.3976L6.09013 9.88513C5.87263 9.66763 5.87263 9.30763 6.09013 9.09013C6.30763 8.87263 6.66763 8.87263 6.88513 9.09013L9.00013 11.2051L11.1151 9.09013C11.3326 8.87263 11.6926 8.87263 11.9101 9.09013C12.1276 9.30763 12.1276 9.66763 11.9101 9.88513L9.39763 12.3976C9.28513 12.5101 9.14263 12.5626 9.00013 12.5626Z" fill="#292D32"/>
</svg>
</button>
          <button class="btn-icon" title="Xóa ảnh" onclick="deleteImageFromServer('${url}', this)"><svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg">
<path d="M15.75 5.04736C15.735 5.04736 15.7125 5.04736 15.69 5.04736C11.7225 4.64986 7.7625 4.49986 3.84 4.89736L2.31 5.04736C1.995 5.07736 1.7175 4.85236 1.6875 4.53736C1.6575 4.22236 1.8825 3.95236 2.19 3.92236L3.72 3.77236C7.71 3.36736 11.7525 3.52486 15.8025 3.92236C16.11 3.95236 16.335 4.22986 16.305 4.53736C16.2825 4.82986 16.035 5.04736 15.75 5.04736Z" fill="#292D32"/>
<path d="M6.37507 4.29C6.34507 4.29 6.31507 4.29 6.27757 4.2825C5.97757 4.23 5.76757 3.9375 5.82007 3.6375L5.98507 2.655C6.10507 1.935 6.27007 0.9375 8.01757 0.9375H9.98257C11.7376 0.9375 11.9026 1.9725 12.0151 2.6625L12.1801 3.6375C12.2326 3.945 12.0226 4.2375 11.7226 4.2825C11.4151 4.335 11.1226 4.125 11.0776 3.825L10.9126 2.85C10.8076 2.1975 10.7851 2.07 9.99007 2.07H8.02507C7.23007 2.07 7.21507 2.175 7.10257 2.8425L6.93007 3.8175C6.88507 4.095 6.64507 4.29 6.37507 4.29Z" fill="#292D32"/>
<path d="M11.4073 17.0627H6.5923C3.9748 17.0627 3.8698 15.6152 3.7873 14.4452L3.2998 6.89268C3.2773 6.58518 3.5173 6.31518 3.8248 6.29268C4.1398 6.27768 4.4023 6.51018 4.4248 6.81768L4.9123 14.3702C4.9948 15.5102 5.0248 15.9377 6.5923 15.9377H11.4073C12.9823 15.9377 13.0123 15.5102 13.0873 14.3702L13.5748 6.81768C13.5973 6.51018 13.8673 6.27768 14.1748 6.29268C14.4823 6.31518 14.7223 6.57768 14.6998 6.89268L14.2123 14.4452C14.1298 15.6152 14.0248 17.0627 11.4073 17.0627Z" fill="#292D32"/>
<path d="M10.2451 12.9375H7.74756C7.44006 12.9375 7.18506 12.6825 7.18506 12.375C7.18506 12.0675 7.44006 11.8125 7.74756 11.8125H10.2451C10.5526 11.8125 10.8076 12.0675 10.8076 12.375C10.8076 12.6825 10.5526 12.9375 10.2451 12.9375Z" fill="#292D32"/>
<path d="M10.875 9.9375H7.125C6.8175 9.9375 6.5625 9.6825 6.5625 9.375C6.5625 9.0675 6.8175 8.8125 7.125 8.8125H10.875C11.1825 8.8125 11.4375 9.0675 11.4375 9.375C11.4375 9.6825 11.1825 9.9375 10.875 9.9375Z" fill="#292D32"/>
</svg>
</button>
        </div>
      </div>
    `;
  }
  
  // ====== UTILITIES ======
  window.downloadImage = function (url) {
    const a = document.createElement('a');
    a.href = url;
    a.download = 'generated_image.jpg';
    a.click();
  };

  window.deleteImageFromServer = async function (url, el) {
    if (!confirm("Bạn có chắc muốn xóa ảnh này?")) return;
    const token = getToken();
    const item = el.closest('.output-item');
    item.style.opacity = 0.5;

    try {
      const response = await fetch(`${API_BASE}/api/delete-image`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: "Bearer " + token,
          Accept: "application/json",
        },
        body: JSON.stringify({
          article_content_id: currentArticleContentId,
          image_url: url
        }),
      });

      const data = await response.json();
      if (data.status === "success") {
        item.remove();
        const outputList = document.getElementById("outputList");
        if (outputList && !outputList.children.length) {
          const emptyBox = document.querySelector('#generateImage .output-empty');
          if (emptyBox) emptyBox.style.display = "block";
        }
      } else {
        toast("Lỗi: " + data.message,{type: "error"})
        item.style.opacity = 1;
      }
    } catch (error) {
      console.error(error);
      toast("Không thể xóa ảnh. Vui lòng thử lại.",{type: "error"});
      item.style.opacity = 1;
    }
  };

  window.openImagePreview = function (url) {
  if (!url) return;

  const previewHtml = `
    <div class="image-preview-wrapper">
      <img src="${url}" alt="Ảnh xem trước" class="image-preview-img" />
    </div>
  `;

  const modalPreview = new SimpleModal({
    titleText: "Xem ảnh minh họa",
    content: previewHtml,
    position: "center",
    width: 900,
    footerButtons: [
    ]
  });

  modalPreview.openModal();
};
  window.openGenerateModal = openGenerateModal;
})();
