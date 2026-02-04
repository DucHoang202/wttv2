(function () {
  // ====== CONFIG ======
  const STORAGE_KEY = 'app_setting';
  const API_BASE = 'https://wttbe.metapress.ai';
  // ====== DATA ======
  // Thêm nhiều mục test: general, security, billing, about
  const setting = [
    { 'general': {
        title: "Cài đặt chung",
        html: `
          <div class="form-content">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">API Key</label>
                <div class="input-box">
                  <input name="apiKey" autocomplete="new-password" id="apiKey" type="password" class="input input-number" placeholder="API Key" required />
                  <span class="pw-icon" onclick="togglePassword('apiKey', this)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.58 12c0 1.98-1.6 3.58-3.58 3.58S8.42 13.98 8.42 12s1.6-3.58 3.58-3.58 3.58 1.6 3.58 3.58Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-2.29-3.6-5.58-5.68-9.11-5.68-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.6 5.58 5.68 9.11 5.68Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>                
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Số lượt sử dụng AI giới hạn (mặc định theo tháng)</label>
                <div class="input-box">
                  <input type="number" name="usage_limit" class="input input-number" placeholder="Nhập thông tin" required />
                </div>
              </div>
            </div>
          </div>`
      }
    },
    { 'user': {
        title: "Thông tin tài khoản",
        html: `
          <div class="form-content">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Họ và tên</label>
                <div class="input-box">
                  <input name="fullname" type="text" class="input input-number" placeholder="Nhập thông tin" required />
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Chức vụ</label>
                <div class="input-box">
                  <input type="text" name="position" class="input input-number" placeholder="Nhập thông tin" required />
                </div>
              </div>
            </div>
          </div>`
      }
    },
    { 'user_password': {
        title: "Đổi mật khẩu",
        html: `
          <div class="form-content">
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mật khẩu cũ</label>
                <div class="input-box">
                  <input id="old-password" type="password" autocomplete="new-password" class="input input-number" placeholder="Mật khẩu cũ" required />
                  <span class="pw-icon" onclick="togglePassword('old-password', this)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.58 12c0 1.98-1.6 3.58-3.58 3.58S8.42 13.98 8.42 12s1.6-3.58 3.58-3.58 3.58 1.6 3.58 3.58Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-2.29-3.6-5.58-5.68-9.11-5.68-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.6 5.58 5.68 9.11 5.68Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Mật khẩu mới</label>
                <div class="input-box">
                  <input id="new-password" type="password" autocomplete="new-password" class="input input-number" placeholder="Mật khẩu mới" required />
                  <span class="pw-icon" onclick="togglePassword('new-password', this)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.58 12c0 1.98-1.6 3.58-3.58 3.58S8.42 13.98 8.42 12s1.6-3.58 3.58-3.58 3.58 1.6 3.58 3.58Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-2.29-3.6-5.58-5.68-9.11-5.68-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.6 5.58 5.68 9.11 5.68Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label class="form-label">Nhập lại mật khẩu mới</label>
                <div class="input-box">
                  <input id="confirm-new-password" type="password" autocomplete="new-password" class="input input-number" placeholder="Nhập lại mật khẩu mới" required />
                  <span class="pw-icon" onclick="togglePassword('confirm-new-password', this)"><svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.58 12c0 1.98-1.6 3.58-3.58 3.58S8.42 13.98 8.42 12s1.6-3.58 3.58-3.58 3.58 1.6 3.58 3.58Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-2.29-3.6-5.58-5.68-9.11-5.68-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.6 5.58 5.68 9.11 5.68Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg></span>
                </div>
              </div>
            </div>
          </div>`
      }
    },
  ];

  // ====== Tạo HTML modal nội dung ======
  const settingHtml = `
    <div id="setting">
      <div class="col-3">
        <div class="setting-sidebar">
          <ul class="setting-list" id="settingList"></ul>
        </div>
      </div>
      <div class="col-9">
        <div class="setting-content" id="settingContent"></div>
      </div>
    </div>`;

  // ====== SimpleModal instance ======
  const modalSetting = new SimpleModal({
    titleText: "Cài đặt",
    content: settingHtml,
    position: "center",
    footerButtons: [
      { text: "Đóng", class: "btn-cancel", onClick: () => modalSetting.closeModal() },
      { text: "Xác nhận", class: "btn-primary", onClick: () => saveSetting() },
    ]
  });

  const getToken = () => localStorage.getItem("auth_token") || "";

  // ====== Helpers chuyển setting -> list hiển thị ======
  function normalizeSettingList(raw) {
    const list = [];
    for (const obj of raw) {
      const key = Object.keys(obj)[0];
      const { title, html } = obj[key];
      list.push({ key, title, html });
    }
    return list;
  }

  let _settingItems = [];
  let _activeKey = null;

  // ====== Public: mở modal ======
  function openSetting() {
    modalSetting.openModal();
    initSettingUI();
  }

  // ====== Dựng UI sau khi modal mount ======
  function initSettingUI() {
    _settingItems = normalizeSettingList(setting);

    const listEl = document.getElementById('settingList');
    const contentEl = document.getElementById('settingContent');
    if (!listEl || !contentEl) return;

    // Render sidebar
    listEl.innerHTML = _settingItems.map(item => `
      <li><button class="setting-item" data-key="${item.key}" type="button">${item.title}</button></li>
    `).join('');

    // Gắn click
    listEl.querySelectorAll('.setting-item').forEach(btn => {
      btn.addEventListener('click', () => {
        setActiveSetting(btn.getAttribute('data-key'));
      });
    });

    // Active mặc định mục đầu tiên
    if (_settingItems.length) {
      setActiveSetting(_settingItems[0].key);
    }
  }

  // ====== Chuyển tab setting + render content ======
  function setActiveSetting(key) {
    const listEl = document.getElementById('settingList');
    const contentEl = document.getElementById('settingContent');
    const item = _settingItems.find(x => x.key === key);
    if (!item || !listEl || !contentEl) return;

    _activeKey = key;

    // Toggle class active
    listEl.querySelectorAll('.setting-item').forEach(btn => {
      const k = btn.getAttribute('data-key');
      btn.classList.toggle('setting-item--active', k === key);
    });

    // Cập nhật html nội dung
    contentEl.innerHTML = item.html;
    if(key === "general"){
      loadSetting();
    }
    else if(key === "user"){
      loadUserInfo();
    }
  }

  function saveSetting() {
    if(_activeKey === "general"){
      saveGeneralSetting();
    }
    else if(_activeKey === "user"){
      saveUserInfo();
    }
    else if(_activeKey === "user_password"){
      savePassword();
    }
  }

  async function loadSetting() {
    const apiKeyInput = document.querySelector('#setting input[name="apiKey"]');
    const usageLimitInput = document.querySelector('#setting input[name="usage_limit"]');
    const token = getToken();
    try {
      const response = await fetch(API_BASE+'/api/load-setting', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
           Authorization: "Bearer " + token, 
           Accept: "application/json"
        }
      });

      const structureData = await response.json();
      console.log(structureData.data.api_key, structureData.data.ai_usage_limit);

      if (structureData.status === 'success') {
        apiKeyInput.value = structureData.data.api_key; 
        usageLimitInput.value = structureData.data.ai_usage_limit;
      } else {
        toast("Lỗi: " + structureData.message, { type: "error"});
      }
    }
    catch (error) {
      console.error(error);
      toast("Có lỗi xảy ra, vui lòng thử lại.", { type: "error"});
    }
  }

  async function saveGeneralSetting() {
    const apiKeyInput = document.querySelector('#setting input[name="apiKey"]');
    const usageLimitInput = document.querySelector('#setting input[name="usage_limit"]');
    const apiKey = apiKeyInput.value;
    const usage_limit = usageLimitInput.value;
    const token = getToken();
    try {
      const response = await fetch(API_BASE+'/api/set-api-key-usage', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           Authorization: "Bearer " + token, 
           Accept: "application/json"
        },
        body: JSON.stringify({
          apiKey: apiKey,
          usage_limit: usage_limit
        })
      });

      const data = await response.json();
      if (data.status === 'success') {
        toast(data.message, { type: "success"});
        modalSetting.closeModal();
      } else {
        toast("Lỗi: " + data.message, { type: "error"});
      }
    } catch (error) {
      console.error(error);
      toast("Có lỗi xảy ra, vui lòng thử lại.", { type: "error"});
    }
  }

  async function saveUserInfo(){
    const fullnameInput = document.querySelector('#setting input[name="fullname"]');
    const positionInput = document.querySelector('#setting input[name="position"]');
    const fullname = fullnameInput.value;
    const position = positionInput.value;
    const token = getToken();
    try {
      const response = await fetch(API_BASE+'/api/user/change-info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
           Authorization: "Bearer " + token, 
           Accept: "application/json"
        },
        body: JSON.stringify({
          fullname: fullname,
          position: position
        })
      });
      const data = await response.json();
      if (data.status === 'success') {
        toast(data.message, { type: "success"});
        modalSetting.closeModal()
      } else {
        toast("Lỗi: " + data.message, { type: "error"});
      }
    }
    catch (error) {
      console.error(error);
      toast("Có lỗi xảy ra, vui lòng thử lại.", { type: "error"});
    }
  }

  async function loadUserInfo() {
    const fullnameInput = document.querySelector('#setting input[name="fullname"]');
    const positionInput = document.querySelector('#setting input[name="position"]');
    const token = getToken();
    try {
      const response = await fetch(API_BASE+'/api/user/load-user-info', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
           Authorization: "Bearer " + token, 
           Accept: "application/json"
        }
      });

      const structureData = await response.json();
      console.log(structureData);

      if (structureData.status === 'success') {
        fullnameInput.value = structureData.data.fullname; 
        positionInput.value = structureData.data.position;
      } else {
        toast("Lỗi: " + structureData.message, { type: "error"});
      }
    } catch (error) {
      toast("Có lỗi xảy ra, vui lòng thử lại.", { type: "error"});
    }
  }

  async function savePassword() {
    const oldPasswordInput = document.getElementById('old-password');
    const newPasswordInput = document.getElementById('new-password');
    const confirmNewPasswordInput = document.getElementById('confirm-new-password');

    const token = getToken(); 

    try {
      const response = await fetch(API_BASE + '/api/user/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: "Bearer " + token,
          Accept: "application/json"
        },
        body: JSON.stringify({
          old_password: oldPasswordInput.value,
          new_password: newPasswordInput.value,
          new_password_confirmation: confirmNewPasswordInput.value
        })
      });

      const data = await response.json();

      if (response.ok && data.status === 'success') {
        toast(data.message, { type: "success"});
        oldPasswordInput.value = '';
        newPasswordInput.value = '';
        confirmNewPasswordInput.value = '';
        modalSetting.closeModal();
      } else {
        toast("Lỗi: " + data.message, { type: "error"});
      }
    } catch (error) {
      toast("Lỗi không kết nối được tới máy chủ !", { type: "error"});
    }
  }

// ====== Expose ra window ======
window.openSetting = openSetting;
window.saveSetting = saveSetting;

})();

function togglePassword(inputId, el) {
            const input = document.getElementById(inputId);
            if (!input) return;
            if (input.type === "password") {
                input.type = "text";
                el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="m14.53 9.47-5.06 5.06a3.576 3.576 0 1 1 5.06-5.06Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M17.82 5.77C16.07 4.45 14.07 3.73 12 3.73c-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19.79 1.24 1.71 2.31 2.71 3.17M8.42 19.53c1.14.48 2.35.74 3.58.74 3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-.33-.52-.69-1.01-1.06-1.47" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M15.51 12.7a3.565 3.565 0 0 1-2.82 2.82M9.47 14.53 2 22M22 2l-7.47 7.47" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`; 
            } else {
                input.type = "password";
                el.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none"><path d="M15.58 12c0 1.98-1.6 3.58-3.58 3.58S8.42 13.98 8.42 12s1.6-3.58 3.58-3.58 3.58 1.6 3.58 3.58Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path><path d="M12 20.27c3.53 0 6.82-2.08 9.11-5.68.9-1.41.9-3.78 0-5.19-2.29-3.6-5.58-5.68-9.11-5.68-3.53 0-6.82 2.08-9.11 5.68-.9 1.41-.9 3.78 0 5.19 2.29 3.6 5.58 5.68 9.11 5.68Z" stroke="#374151" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"></path></svg>`; // đổi icon khi ẩn mật khẩu
            }
        }