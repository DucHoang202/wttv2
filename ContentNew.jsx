import React, { useEffect } from 'react';
import "/css/modal-form.css";
import "/scripts/simple-modal/simple-modal.css";
import "/css/font.css";
import "/css/style.css";
import "/css/responsive.css";
import "/css/content_new.css";
import "/scripts/toast/toast.css";
import "/scripts/toast/toast.js";
import "/scripts/guard.js";
import "/scripts/simple-modal/simple-modal.js";
import "/scripts/setting.js";
import "/scripts/menu-mobile.js";
import "/scripts/history.js";
import "/scripts/template.js";
import "/scripts/image-generation.js";
import { mockPosts, mockUser, mockCategories, mockEditorData } from "../mockData";

import "https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/js/bootstrap.bundle.min.js";
import "https://cdn.ckeditor.com/ckeditor5/41.0.0/classic/ckeditor.js";


const API_BASE = 'https://wttbe.metapress.ai/';   // đổi theo môi trường của bạn
const LOGIN_PAGE = '/login.html';            // đường dẫn trang đăng nhập
const REQUIRE_AUTH = true;                   // trang này bắt buộc đăng nhập
// Những API không chen Bearer / không redirect (login, register...)
const SKIP_PATHS = ['/api/login', '/api/register', '/api/password/forgot'];

// ====== Tiện ích ======
const nativeFetch = window.fetch.bind(window);
const isLoginPage = () => location.pathname.endsWith(LOGIN_PAGE);
const getToken = () => { try { return localStorage.getItem('auth_token') || ''; } catch { return ''; } };
const clearToken = () => { try { localStorage.removeItem('auth_token'); } catch { } };

function urlToAbsolute(u) {
    try { return new URL(u, location.origin); } catch { return null; }
}
function apiOrigin() {
    try { return new URL(API_BASE).origin; } catch { return location.origin; }
}
function isSameApi(u) {
    const abs = urlToAbsolute(u);
    return abs && abs.origin === apiOrigin();
}
function shouldSkip(u) {
    const abs = urlToAbsolute(u) || new URL(API_BASE);
    return SKIP_PATHS.some(p => abs.pathname.endsWith(p));
}

// ====== Guard ngay khi vào trang ======
if (REQUIRE_AUTH && !isLoginPage()) {
    const token = getToken();
    if (!token) {
        // Không có token -> về login luôn
        location.href = LOGIN_PAGE;
    }
}

// ====== Patch fetch ======
window.fetch = async (input, init = {}) => {
    const url = typeof input === 'string' ? input : input.url;
    const token = getToken();

    // Nếu gọi vào API của mình và không thuộc danh sách bỏ qua
    if (isSameApi(url) && !shouldSkip(url)) {
        // Không có token -> về login luôn và chặn request
        if (!token && !isLoginPage()) {
            location.href = LOGIN_PAGE;
            // Trả về Response 401 giả để code phía dưới không bị lỗi
            return new Response(null, { status: 401, statusText: 'Unauthorized (No token)' });
        }
    }

    // Gắn Bearer nếu có token và chưa set thủ công
    const headers = new Headers(init.headers || (typeof input !== 'string' ? input.headers : undefined));
    if (token && !headers.has('Authorization') && isSameApi(url) && !shouldSkip(url)) {
        headers.set('Authorization', `Bearer ${token}`);
    }

    const res = await nativeFetch(input, { ...init, headers });

    // Token hết hạn / không hợp lệ -> xoá token + về login
    if ([401, 403, 419].includes(res.status)) {
        clearToken();
        if (!isLoginPage()) location.href = LOGIN_PAGE;
    }
    return res;
};

// Đồng bộ logout giữa các tab
window.addEventListener('storage', (e) => {
    if (e.key === 'auth_token' && !e.newValue && !isLoginPage()) {
        location.href = LOGIN_PAGE;
    }
})


function showSpinner() {
    document.getElementById('global-spinner').style.display = 'flex';
}
function hideSpinner() {
    document.getElementById('global-spinner').style.display = 'none';
}
/* ==========================
   GLOBAL STATE
========================== */
const STEPS = { PROMPT: 1, EDITOR: 2, PUBLISH: 3 };
const toolSchema = {
    attributes: [
        {
            code: 'tone',
            label: 'Giọng điệu',
            type: 'select',
            defaultValue: 'professional',
            options: [
                { value: 'professional', label: 'Chuyên nghiệp' },
                { value: 'friendly', label: 'Thân thiện' },
                { value: 'academic', label: 'Học thuật' }
            ]
        },
        {
            code: 'length',
            label: 'Độ dài nội dung',
            type: 'select',
            defaultValue: '1000',
            options: [
                { value: '650', label: 'Ngắn' },
                { value: '1000', label: 'Vừa phải' },
                { value: '1500', label: 'Dài' }
            ]
        },
        {
            code: 'complexity',
            label: 'Độ phức tạp',
            type: 'select',
            defaultValue: 'medium',
            options: [
                { value: 'simple', label: 'Đơn giản' },
                { value: 'medium', label: 'Trung bình' },
                { value: 'advanced', label: 'Chuyên sâu' }
            ]
        },
        {
            code: 'language',
            label: 'Ngôn ngữ',
            type: 'select',
            defaultValue: 'vi',
            options: [
                { value: 'vi', label: 'Tiếng Việt' },
                { value: 'en', label: 'English' }
            ]
        }
    ]
};
let currentStep = STEPS.PROMPT;
let basePromptPayload = {};
let schemaGlobal = null;
let editorInstance = null;
let generatedHtml = "";
let finalHtml = "";

/* ==========================
   DOM ELEMENTS
========================== */
const buttonSubmit = document.getElementById("submitPromptBtn");
const formWrapper = document.getElementById("formWrapper");

// const dropdownButton = (<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 16 16" fill="none">
// 	<path d="M8.00001 11.2C7.53335 11.2 7.06668 11.0201 6.71335 10.6667L2.36668 6.32005C2.17335 6.12672 2.17335 5.80672 2.36668 5.61338C2.56001 5.42005 2.88001 5.42005 3.07335 5.61338L7.42001 9.96005C7.74001 10.2801 8.26001 10.2801 8.58001 9.96005L12.9267 5.61338C13.12 5.42005 13.44 5.42005 13.6333 5.61338C13.8267 5.80672 13.8267 6.12672 13.6333 6.32005L9.28668 10.6667C8.93335 11.0201 8.46668 11.2 8.00001 11.2Z" fill="#292D32" />
// </svg >);
function renderForm(data) {
    const schema = data.schema;

    schema.attributes.forEach(field => {
        const formRow = document.createElement('div');
        formRow.className = 'form-row';

        const formGroup = document.createElement('div');
        formGroup.className = 'form-group';

        const label = document.createElement('label');
        label.className = 'form-label';
        label.textContent = field.label + (field.required ? ' *' : '');
        formGroup.appendChild(label);

        switch (field.type) {
            case 'textarea': {
                const textarea = document.createElement('textarea');
                textarea.id = field.id;
                textarea.className = 'textarea';
                textarea.placeholder = field.meta?.description || '';
                textarea.value = field.defaultValue || '';
                formGroup.appendChild(textarea);
                break;
            }
            case 'number': {
                const input = document.createElement('input');
                input.id = field.id;
                input.type = 'number';
                input.className = 'custom-select-number';
                input.value = field.defaultValue || '';
                formGroup.appendChild(input);
                break;
            }
            case 'select': {
                const select = document.createElement('select');
                select.id = field.id;
                select.className = 'custom-select';

                const defaultOption = document.createElement('option');
                defaultOption.value = "";
                defaultOption.textContent = "Chọn";
                select.appendChild(defaultOption);

                field.options.forEach(opt => {
                    const option = document.createElement('option');
                    option.value = opt.value;
                    option.textContent = opt.label;
                    select.appendChild(option);
                });

                formGroup.appendChild(select);
                break;
            }
        }

        formRow.appendChild(formGroup);
        formWrapper.appendChild(formRow);
    });
}

/* ==========================
   INIT
========================== */
async function init() {
    showSpinner(); // 🔴 BẬT SPINNER (load schema)

    try {
        const response = await fetch("https://wttbe.metapress.ai/api/schema/content", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ slug: getParam('id', '') })
        });

        const data = await response.json();
        renderForm(data);
        schemaGlobal = data.schema;
        gotoStep(STEPS.PROMPT);
    } finally {
        hideSpinner(); // 🟢 TẮT SPINNER
    }
}
init();
initStep3Tabs();
/* ==========================
   STEP PROGRESS UI
========================== */
function updateStepProgress(step) {
    const stepItems = document.querySelectorAll('.step-item');
    const stepLines = document.querySelectorAll('.step-line');

    stepItems.forEach((item, index) => {
        const stepNumber = index + 1;
        const circle = item.querySelector('.step-circle');

        item.classList.remove('active', 'completed');

        if (stepNumber < step) {
            item.classList.add('completed');
            circle.innerHTML = '✓';
        }
        else if (stepNumber === step) {
            item.classList.add('active');
            circle.innerHTML = stepNumber;
        }
        else {
            circle.innerHTML = stepNumber;
        }
    });

    stepLines.forEach((line, index) => {
        line.classList.toggle('completed', index < step - 1);
    });
}

/* ==========================
   STEP HANDLING
========================== */
function gotoStep(step) {
    currentStep = step;

    // STEP 1
    document.getElementById('formWrapper').style.display = (step === 1) ? 'flex' : 'none';
    document.getElementById('stepPromptFooter').style.display = (step === 1) ? 'flex' : 'none';

    // STEP 2
    document.getElementById('stepEditor').style.display = (step === 2) ? 'block' : 'none';

    // STEP 3
    document.getElementById('stepPublish').style.display = (step === 3) ? 'block' : 'none';

    // Update progress bar
    updateStepProgress(step);
}

/* ==========================
   CKEDITOR
========================== */
function buildToolPayloadFromSchema(schema) {
    const payload = {};

    schema.attributes.forEach(field => {
        const el = document.getElementById('tool_' + field.code);
        if (!el) return;

        payload[field.code] = {
            label: field.label,
            value: el.value
        };
    });

    return payload;
}



async function ensureEditor() {
    if (editorInstance) return editorInstance;
    editorInstance = await ClassicEditor.create(document.querySelector('#editorInline'));
    return editorInstance;
}

async function loadToEditor(html) {
    generatedHtml = html;
    gotoStep(STEPS.EDITOR);

    renderEditorTools(toolSchema);
    ensureToolStatsUI();      // ➕

    const ed = await ensureEditor();
    ed.setData(html);

    bindEditorStatsOnce();    // ➕
    updateToolStats();        // ➕
}

async function regenerateWithPayload(payload) {
    const token = localStorage.getItem('auth_token');
    showSpinner(); // 🔴

    try {
        const submitRes = await fetch(
            "https://wttbe.metapress.ai/api/article/submit",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            }
        );

        const { job_id } = await submitRes.json();

        async function poll() {
            const res = await fetch(
                `https://wttbe.metapress.ai/api/article/result/${job_id}`,
                { headers: { Authorization: "Bearer " + token } }
            );
            const result = await res.json();

            if (result.status === 'success') {
                let html = removeAllMarkdownLinks(result.data.text || '');
                editorInstance.setData(html);
                hideSpinner(); // 🟢
                return;
            }

            if (result.status === 'continue') {
                setTimeout(poll, 1000);
            }
        }
        poll();
    } catch (e) {
        hideSpinner(); // 🟢
        throw e;
    }
}

function initStep3Tabs() {
    document.querySelectorAll('[data-step3-tab]').forEach(tab => {
        tab.addEventListener('click', () => {
            document.querySelectorAll('[data-step3-tab]').forEach(t => t.classList.remove('tab--active'));
            tab.classList.add('tab--active');

            const target = tab.dataset.step3Tab;
            document.getElementById('step3Seo').style.display = (target === 'seo') ? 'block' : 'none';
            document.getElementById('step3Social').style.display = (target === 'social') ? 'block' : 'none';
        });
    });
}

function htmlToPlainText(html) {
    return (html || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
}

function slugify(str) {
    return (str || '')
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .trim()
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

async function generateStep3FromN8n(finalHtml) {
    const token = localStorage.getItem('auth_token');

    const res = await fetch("https://content.kongbot.net/webhook/social_create", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            type: "generate_step3",
            content_html: finalHtml,
            language: "vi"
        })
    });

    return await res.json();
}
function renderSeoTitles(titles) {
    const list = document.getElementById('seoTitleList');
    list.innerHTML = '';

    titles.forEach((t, idx) => {
        const item = document.createElement('div');
        item.className = 'seo-title-item' + (idx === 0 ? ' active' : '');

        item.innerHTML = `
        <input type="radio" name="seoTitlePick" ${idx === 0 ? 'checked' : ''} style="margin-top:4px;">
            <div style="flex:1;">
                <div style="font-weight:600;">${t}</div>
                <small>${t.length} ký tự</small>
            </div>
            `;

        item.addEventListener('click', () => {
            document.querySelectorAll('.seo-title-item').forEach(x => x.classList.remove('active'));
            item.classList.add('active');
            item.querySelector('input').checked = true;

            // khi chọn title thì tự sync slug
            document.getElementById('seoSlug').value = slugify(t);
        });

        list.appendChild(item);
    });
}
function fillStep3Mock(finalHtml) {
    const text = htmlToPlainText(finalHtml);

    // SEO
    const seo = generateSeoMockFromText(text);
    renderSeoTitles(seo.titles);
    document.getElementById('seoMeta').value = seo.meta;
    document.getElementById('seoMetaCount').innerText = seo.meta.length;
    document.getElementById('seoSlug').value = seo.slug;

    const tagsWrap = document.getElementById('seoTags');
    tagsWrap.innerHTML = '';
    seo.tags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'seo-tag';
        chip.innerText = tag;
        tagsWrap.appendChild(chip);
    });

    // Social
    const social = generateSocialMockFromText(text);
    document.getElementById('fbContent').value = social.facebook;
    document.getElementById('linkedinContent').value = social.linkedin;

    // meta counter live
    document.getElementById('seoMeta').addEventListener('input', (e) => {
        document.getElementById('seoMetaCount').innerText = e.target.value.length;
    });
}

function initSocialActions() {
    const copy = async (text) => {
        try {
            await navigator.clipboard.writeText(text);
            toast("Đã copy", { type: "success" });
        } catch {
            toast("Copy thất bại", { type: "error" });
        }
    };

    document.getElementById('fbCopyBtn')?.addEventListener('click', () => copy(document.getElementById('fbContent').value));
    document.getElementById('liCopyBtn')?.addEventListener('click', () => copy(document.getElementById('linkedinContent').value));

    document.getElementById('fbReloadBtn')?.addEventListener('click', () => {
        const t = htmlToPlainText(finalHtml);
        document.getElementById('fbContent').value = generateSocialMockFromText(t).facebook;
    });

    document.getElementById('liReloadBtn')?.addEventListener('click', () => {
        const t = htmlToPlainText(finalHtml);
        document.getElementById('linkedinContent').value = generateSocialMockFromText(t).linkedin;
    });
}
function buildFieldPayload(field, value) {
    return {
        label: field.label,
        value: value
    };
}

document.getElementById('btnRegenerate').addEventListener('click', async () => {
    const toolPayload = buildToolPayloadFromSchema(toolSchema);

    const finalPayload = {
        ...basePromptPayload,
        ...toolPayload,
        full_content: {
            label: 'Nội dung hiện tại',
            value: editorInstance.getData()
        },
        regenerate: {
            label: 'Regenerate',
            value: true
        }
    };

    await regenerateWithPayload(finalPayload);
});

function setFbStatus(state, text) {
    const el = document.getElementById('fbStatus');
    if (!el) return;

    el.classList.remove('connected', 'disconnected');

    if (state === 'connected') {
        el.classList.add('connected');
        el.textContent = text || '🟢 Đã kết nối fanpage';
    } else {
        el.classList.add('disconnected');
        el.textContent = text || '🔴 Chưa kết nối';
    }
}
/* ==========================
   STEP 1: GENERATE ARTICLE
========================== */
async function sendArticlePromptToN8n(schema) {
    /* ==========================
        1. COLLECT FORM DATA
        ========================== */
    const payload = {};
    const errors = [];

    schema.attributes.forEach(field => {
        const el = document.getElementById(field.id);
        if (!el) return;

        let value = '';

        switch (field.type) {
            case 'number':
                value = el.value ? Number(el.value) : '';
                break;
            case 'select':
                value = el.value;
                break;
            default:
                value = el.value?.trim();
                break;
        }

        if (field.required && !value) {
            errors.push(field.label);
        }

        payload[field.code] = buildFieldPayload(field, value);
    });

    if (errors.length > 0) {
        toast("Thiếu dữ liệu: " + errors.join(", "), { type: "error" });
        return;
    }

    /* ==========================
        2. SAVE BASE PROMPT
    ========================== */
    basePromptPayload = { ...payload };

    /* ==========================
        3. UI LOADING (GLOBAL SPINNER)
    ========================== */
    const buttonSubmit = document.getElementById("submitPromptBtn");
    buttonSubmit?.classList.add("disabled");

    showSpinner(); // 🔴 BẬT SPINNER TOÀN MÀN HÌNH

    /* ==========================
        4. SUBMIT JOB
    ========================== */
    const token = localStorage.getItem('auth_token');

    try {
        const submitRes = await fetch(
            "https://wttbe.metapress.ai/api/article/submit",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": "Bearer " + token
                },
                body: JSON.stringify(payload)
            }
        );

        if (!submitRes.ok) {
            throw new Error("Submit job thất bại");
        }

        const { job_id } = await submitRes.json();
        if (!job_id) {
            throw new Error("Không nhận được job_id");
        }

        /* ==========================
        5. LONG POLLING RESULT
        ========================== */
        const pollResult = async () => {
            try {
                const res = await fetch(
                    `https://wttbe.metapress.ai/api/article/result/${job_id}`,
                    { headers: { Authorization: "Bearer " + token } }
                );

                const result = await res.json();

                if (result.status === "success") {
                    let html = result.data?.text || '';
                    html = removeAllMarkdownLinks(html);

                    hideSpinner(); // 🟢 TẮT SPINNER
                    buttonSubmit?.classList.remove("disabled");

                    loadToEditor(html);
                    return;
                }

                if (result.status === "continue") {
                    setTimeout(pollResult, 1000);
                    return;
                }

                throw new Error(result.message || "Generate lỗi");

            } catch (err) {
                hideSpinner();
                buttonSubmit?.classList.remove("disabled");
                console.error(err);
                toast("Có lỗi khi tạo nội dung", { type: "error" });
            }
        };

        pollResult();

    } catch (error) {
        hideSpinner();
        buttonSubmit?.classList.remove("disabled");
        console.error(error);
        toast("Không thể gửi yêu cầu tạo nội dung", { type: "error" });
    }
}
function isToolField(field) {
    return field.code !== 'topic' && field.code !== 'prompt' && field.code !== 'chu_de';
}
function renderEditorTools(schema) {
    const container = document.getElementById('toolFields');
    container.innerHTML = '';

    schema.attributes
        .filter(isToolField)
        .forEach(field => {
            const wrap = document.createElement('div');
            wrap.className = 'form-group';

            const label = document.createElement('label');
            label.className = 'form-label';
            label.textContent = field.label;
            wrap.appendChild(label);

            let input;

            if (field.type === 'select') {
                input = document.createElement('select');
                field.options.forEach(opt => {
                    const o = document.createElement('option');
                    o.value = opt.value;
                    o.textContent = opt.label;
                    input.appendChild(o);
                });
            } else {
                input = document.createElement('input');
                input.type = 'text';
            }

            input.id = 'tool_' + field.code;
            input.value = field.defaultValue || '';
            input.className = 'custom-select';

            wrap.appendChild(input);
            container.appendChild(wrap);
        });
}
/* ==========================
   STEP 2 → STEP 3
========================== */
function fillStep3FromApi(data) {
    // SEO
    renderSeoTitles(data.seo.titles);
    document.getElementById('seoMeta').value = data.seo.meta_description;
    document.getElementById('seoMetaCount').innerText = data.seo.meta_description.length;
    document.getElementById('seoSlug').value = data.seo.slug;

    const tagsWrap = document.getElementById('seoTags');
    tagsWrap.innerHTML = '';
    data.seo.tags.forEach(tag => {
        const chip = document.createElement('span');
        chip.className = 'seo-tag';
        chip.innerText = tag;
        tagsWrap.appendChild(chip);
    });

    // Social
    document.getElementById('fbContent').value = data.social.facebook;
    document.getElementById('linkedinContent').value = data.social.linkedin;
}
document.getElementById("btnToPublish").addEventListener("click", async () => {
    if (!editorInstance) return;

    const btn = document.getElementById("btnToPublish");
    btn.classList.add("disabled");
    btn.style.pointerEvents = "none";

    showSpinner(); // 🔴 BẬT SPINNER Ở ĐÂY

    try {
        finalHtml = editorInstance.getData();

        const step3Data = await generateStep3FromN8n(finalHtml);

        fillStep3FromApi(step3Data);
        gotoStep(STEPS.PUBLISH);

    } catch (err) {
        console.error(err);
        toast("Không thể tạo nội dung SEO / Social", { type: "error" });

    } finally {
        hideSpinner(); // 🟢 TẮT SPINNER
        btn.classList.remove("disabled");
        btn.style.pointerEvents = "auto";
    }
});

/* ==========================
   STEP 3: PUBLISH FACEBOOK
========================== */
document.getElementById("btnPublishFb").addEventListener("click", async () => {
    const btn = document.getElementById("btnPublishFb");
    const fbMessage = document.getElementById('fbContent')?.value?.trim() || '';

    if (!fbMessage) {
        toast("Nội dung Facebook đang trống", { type: "error" });
        return;
    }

    btn.classList.add("disabled");
    btn.style.pointerEvents = "none";
    setFbStatus("disconnected", "🟡 Đang gửi bài lên fanpage...");

    try {
        const res = await fetch("https://official.wepro.io.vn/webhook/fanpage_post", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: fbMessage })
        });

        if (!res.ok) throw new Error("HTTP " + res.status);

        const data = await res.json();

        if (!data?.id) throw new Error("Không có id trả về");

        setFbStatus("connected", "🟢 Đã đăng fanpage");
        toast("Đăng Facebook thành công", { type: "success" });

    } catch (err) {
        console.error(err);
        setFbStatus("disconnected", "🔴 Chưa kết nối");
        toast("Đăng Facebook thất bại", { type: "error" });
    } finally {
        btn.classList.remove("disabled");
        btn.style.pointerEvents = "auto";
    }
});

/* ==========================
   HELPERS
========================== */
function removeAllMarkdownLinks(text) {
    return text.replace(/\[[^\]]+\]\([^)]+\)/g, '');
}

function getParam(key, fallback = null) {
    const qs = new URLSearchParams(window.location.search);
    return qs.get(key) ?? fallback;
}

/* ==========================
   EVENT
========================== */
buttonSubmit.addEventListener("click", () => {
    if (buttonSubmit.classList.contains("disabled")) return;
    sendArticlePromptToN8n(schemaGlobal);
});
function ensureToolStatsUI() {
    const container = document.getElementById('toolFields');
    if (!container) return;
    if (document.getElementById('toolStats')) return;

    const wrap = document.createElement('div');
    wrap.id = 'toolStats';
    wrap.style.marginTop = '16px';
    wrap.innerHTML = `
            <div style="font-size:12px;color:#6b7280;margin-bottom:6px;">Thống kê</div>
            <div style="display:flex;justify-content:space-between;font-size:13px">
                <span>Blocks</span><strong id="statBlocks">0</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px">
                <span>Từ</span><strong id="statWords">0</strong>
            </div>
            <div style="display:flex;justify-content:space-between;font-size:13px">
                <span>Ký tự</span><strong id="statChars">0</strong>
            </div>
            `;
    container.appendChild(wrap);
}
function updateToolStats() {
    if (!editorInstance) return;

    const html = editorInstance.getData() || '';
    const text = htmlToPlainText(html);

    const blocks = (html.match(/<(p|li|h[1-6]|blockquote)\b/gi) || []).length;
    const words = text ? text.split(/\s+/).filter(Boolean).length : 0;
    const chars = text.length;

    document.getElementById('statBlocks').textContent = blocks;
    document.getElementById('statWords').textContent = words;
    document.getElementById('statChars').textContent = chars;
}
function bindEditorStatsOnce() {
    if (!editorInstance || editorInstance.__statsBound) return;
    editorInstance.__statsBound = true;

    editorInstance.model.document.on('change:data', () => {
        updateToolStats();
    });
}


/* ========= SPINNER (giữ nguyên) ========= */


/* ========= AI MENU SHOW/HIDE (giữ nguyên logic) ========= */
const aiMenu = document.getElementById('ai-menu');

document.addEventListener('mouseup', () => {
    setTimeout(() => {
        if (!editorInstance) return;

        const selection = window.getSelection();
        if (!selection || selection.isCollapsed) {
            aiMenu.style.display = 'none';
            return;
        }

        const range = selection.getRangeAt(0);
        let container = range.commonAncestorContainer;

        if (container.nodeType !== 1) container = container.parentElement;

        // chỉ hiện menu nếu bôi đen trong CKEditor
        if (!container.closest('.ck-content')) {
            aiMenu.style.display = 'none';
            return;
        }

        const rect = range.getBoundingClientRect();
        aiMenu.style.display = 'block';
        aiMenu.style.top = `${rect.top + window.scrollY - aiMenu.offsetHeight - 8}px`;
        aiMenu.style.left = `${rect.left + window.scrollX}px`;
    });
});

document.addEventListener('mousedown', e => {
    if (!aiMenu.contains(e.target)) aiMenu.style.display = 'none';
});

/* ========= HELPER: lấy selected text & full content ========= */
function getSelectedText() {
    const selection = editorInstance.model.document.selection;
    let text = '';

    for (const range of selection.getRanges()) {
        for (const item of range.getItems()) {
            if (item.is('textProxy')) {
                text += item.data;
            }
        }
    }

    return text.trim();
}

function getFullContentHtml() {
    return editorInstance.getData(); // full HTML trong editor
}

// Nếu bạn muốn gửi plain text thay vì HTML, dùng cái này:
// function getFullContentPlainText() {
//   const div = document.createElement('div');
//   div.innerHTML = editorInstance.getData();
//   return (div.textContent || div.innerText || '').replace(/\s+/g, ' ').trim();
// }

/* ========= REPLACE SELECTED TEXT (giữ nguyên) ========= */
function replaceSelectedText(newText) {
    const model = editorInstance.model;
    const selection = model.document.selection;

    model.change(writer => {
        const range = selection.getFirstRange();
        writer.remove(range);
        writer.insertText(newText, range.start);
    });

    aiMenu.style.display = 'none';
}

/* ========= CALL N8N (MỚI) ========= */
const N8N_WEBHOOK_URL = 'https://content.kongbot.net/webhook/ai-editor';

async function callAiViaN8n(action) {
    if (!editorInstance) return;

    const selected_text = getSelectedText();
    if (!selected_text || !selected_text.trim()) {
        aiMenu.style.display = 'none';
        return;
    }

    const full_content = getFullContentHtml();

    showSpinner();

    try {
        const res = await fetch(N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                action,                 // rewrite | improve | shorten | expand
                selected_text,          // đoạn bôi đen
                full_content,           // toàn bộ bài (HTML)
                language: 'vi'
            })
        });

        const data = await res.json();

        if (!data || typeof data.text !== 'string' || !data.text.trim()) {
            throw new Error('n8n không trả về field "text" hợp lệ');
        }

        replaceSelectedText(data.text.trim());
    } catch (err) {
        console.error(err);
        alert('AI xử lý thất bại. Kiểm tra webhook n8n và response JSON {text: "..." }');
    } finally {
        hideSpinner();
    }
}

/* ========= ACTIONS (ĐỔI SANG GỌI N8N) ========= */
function aiRewrite() {
    callAiViaN8n('rewrite');
}

function aiImprove() {
    callAiViaN8n('improve');
}

function aiShorten() {
    callAiViaN8n('shorten');
}

function aiExpand() {
    callAiViaN8n('expand');
}


const getUser = () => {
    const user = localStorage.getItem('auth_user');
    return JSON.parse(user);
};
const userAuth = getUser();
if (userAuth.name) {
    document.getElementById('userName').textContent = userAuth.name;
}

// export default function ContentNew() {
//     // useEffect(() => {
//     //     const API_BASE = 'https://wttbe.metapress.ai/';   // đổi theo môi trường của bạn
//     //     const LOGIN_PAGE = '/login.html';
//     //     document.getElementById('sidebarLogout')?.addEventListener('click', function (e) {
//     //         e.preventDefault();

//     //         // Lấy token hiện tại (nếu có)
//     //         let token = '';
//     //         try { token = localStorage.getItem('auth_token') || ''; } catch { }

//     //         // (Tùy chọn) Gọi API logout để revoke token ở server, nếu bạn có route /api/logout
//     //         if (token) {
//     //             fetch(API_BASE + '/api/logout', {
//     //                 method: 'POST',
//     //                 headers: {
//     //                     'Accept': 'application/json',
//     //                     'Authorization': 'Bearer ' + token
//     //                 }
//     //             }).catch(() => { /* bỏ qua lỗi */ });
//     //         }

//     //         // Xóa token local và chuyển về login
//     //         try {
//     //             localStorage.removeItem('auth_token');
//     //             localStorage.removeItem('auth_user');
//     //         } catch { }

//     //         //Chuyển về login
//     //         //location.href = LOGIN_PAGE;
//     //     });
//     // }, []);
//     const posts = mockPosts;
//     const user = mockUser;

//     return (
//         <div>
//             <div class="cms-content">
//                 <div class="sidebar-placeholder"></div>
//                 <div class="sidebar">
//                     <div class="sidebar__header">
//                         <div class="sidebar__logo">
//                             <img src="/images/logo.svg" onerror="this.onerror=null; this.src='/images/logo.png';" alt="Logo"
//                                 onclick="window.location.href='./';" />
//                         </div>
//                     </div>
//                     <div class="sidebar__primary-action">
//                         <button class="btn btn--primary btn-icon" type="button" onclick="window.location.href='content.html'">
//                             <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none">
//                                 <path
//                                     d="M21 22H3c-.41 0-.75-.34-.75-.75s.34-.75.75-.75h18c.41 0 .75.34.75.75s-.34.75-.75.75ZM19.02 3.482c-1.94-1.94-3.84-1.99-5.83 0l-1.21 1.21c-.1.1-.14.26-.1.4a8.129 8.129 0 0 0 5.53 5.53.4.4 0 0 0 .41-.1l1.2-1.21c.99-.98 1.47-1.93 1.47-2.89.01-.99-.47-1.95-1.47-2.94ZM15.61 11.53c-.29-.14-.57-.28-.84-.44a8.8 8.8 0 0 1-.64-.42c-.17-.11-.37-.27-.56-.43a1.22 1.22 0 0 1-.17-.15c-.33-.28-.7-.64-1.03-1.04-.03-.02-.08-.09-.15-.18-.1-.12-.27-.32-.42-.55a5.49 5.49 0 0 1-.39-.59c-.16-.27-.3-.54-.44-.82a6.88 6.88 0 0 1-.061-.135c-.148-.333-.583-.43-.84-.173L4.34 12.331c-.13.13-.25.38-.28.55l-.54 3.83c-.1.68.09 1.32.51 1.75.36.35.86.54 1.4.54.12 0 .24-.01.36-.03l3.84-.54c.18-.03.43-.15.55-.28l5.722-5.721c.26-.26.161-.705-.176-.85a26.852 26.852 0 0 1-.116-.05Z"
//                                     fill="#ffffff"></path>
//                             </svg>
//                             <span> Nội dung </span>
//                         </button>
//                     </div>
//                     <div class="sidebar__section">
//                         <div class="sidebar__section-title">Danh mục</div>
//                         <a class="sidebar__menu-item" href="dashboard.html">Dashboard</a>
//                         <a class="sidebar__menu-item" href="taxonomy.html">Bộ Taxonomy</a>
//                         <a class="sidebar__menu-item" href="manage.html">Quản lý tài khoản</a>
//                         <a class="sidebar__menu-item mobile-hidden" href="#" onclick="openSetting()">Cài đặt</a>
//                     </div>
//                     <div class="sidebar__divider"></div>
//                     <div class="sidebar__section" id="chat-history">
//                         <div class="sidebar__section-title">LỊCH SỬ</div>
//                     </div>
//                     <div class="sidebar__user-info">
//                         <div class="sidebar__user-avatar"></div>
//                         <div class="sidebar__user-details">
//                             <span class="sidebar__user-name" id="userName">Admin</span>
//                             <span class="sidebar__user-plan"></span>
//                         </div>
//                         <div class="logout-icon">
//                             <img id="sidebarLogout" src="/images/logout.svg" />
//                         </div>
//                     </div>
//                 </div>
//                 <div class="content-wrapper">
//                     <div class="smart-paragraph-container">
//                         <div class="smart-paragraph-icon-wrapper">
//                             <div class="smart-paragraph-icon">
//                                 <svg width="20" height="21" viewBox="0 0 20 21" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                     <path
//                                         d="M16.25 6.75L15.0083 7.99167L12.5083 5.49167L13.75 4.25C14.1 3.9 14.55 3.73333 15 3.73333C15.45 3.73333 15.9 3.9 16.25 4.25C16.9417 4.94167 16.9417 6.05833 16.25 6.75Z"
//                                         fill="url(#paint0_linear_6_1026)" />
//                                     <path
//                                         d="M14.425 8.58333L5.41667 17.5833C4.725 18.275 3.60834 18.275 2.91667 17.5833C2.225 16.8917 2.225 15.775 2.91667 15.0833L11.925 6.08333L14.425 8.58333Z"
//                                         fill="url(#paint1_linear_6_1026)" />
//                                     <path
//                                         d="M8.29167 3.41667L8.63334 2.25833C8.66667 2.15 8.63334 2.03333 8.55834 1.95C8.48334 1.86667 8.35 1.83333 8.24167 1.86667L7.08334 2.20833L5.925 1.86667C5.81667 1.83333 5.7 1.86667 5.61667 1.94167C5.53334 2.025 5.50834 2.14167 5.54167 2.25L5.875 3.41667L5.53334 4.575C5.5 4.68333 5.53334 4.8 5.60834 4.88333C5.69167 4.96667 5.80834 4.99167 5.91667 4.95833L7.08334 4.625L8.24167 4.96667C8.275 4.975 8.3 4.98333 8.33334 4.98333C8.41667 4.98333 8.49167 4.95 8.55834 4.89167C8.64167 4.80833 8.66667 4.69167 8.63334 4.58333L8.29167 3.41667Z"
//                                         fill="url(#paint2_linear_6_1026)" />
//                                     <path
//                                         d="M4.95833 8.41667L5.29999 7.25833C5.33333 7.15 5.29999 7.03333 5.22499 6.95C5.14166 6.86667 5.02499 6.84167 4.91666 6.875L3.74999 7.20833L2.59166 6.86667C2.48333 6.83333 2.36666 6.86667 2.28333 6.94167C2.19999 7.025 2.17499 7.14167 2.20833 7.25L2.54166 8.41667L2.19999 9.575C2.16666 9.68333 2.19999 9.8 2.27499 9.88333C2.35833 9.96667 2.47499 9.99167 2.58333 9.95833L3.74166 9.61667L4.89999 9.95833C4.92499 9.96667 4.95833 9.96667 4.99166 9.96667C5.07499 9.96667 5.14999 9.93333 5.21666 9.875C5.29999 9.79167 5.32499 9.675 5.29166 9.56667L4.95833 8.41667Z"
//                                         fill="url(#paint3_linear_6_1026)" />
//                                     <path
//                                         d="M17.4583 12.5833L17.8 11.425C17.8333 11.3167 17.8 11.2 17.725 11.1167C17.6417 11.0333 17.525 11.0083 17.4167 11.0417L16.2583 11.3833L15.1 11.0417C14.9917 11.0083 14.875 11.0417 14.7917 11.1167C14.7083 11.2 14.6833 11.3167 14.7167 11.425L15.0583 12.5833L14.7167 13.7417C14.6833 13.85 14.7167 13.9667 14.7917 14.05C14.875 14.1333 14.9917 14.1583 15.1 14.125L16.2583 13.7833L17.4167 14.125C17.4417 14.1333 17.475 14.1333 17.5083 14.1333C17.5917 14.1333 17.6667 14.1 17.7333 14.0417C17.8167 13.9583 17.8417 13.8417 17.8083 13.7333L17.4583 12.5833Z"
//                                         fill="url(#paint4_linear_6_1026)" />
//                                     <defs>
//                                         <linearGradient id="paint0_linear_6_1026" x1="14.6385" y1="3.73333" x2="14.6385"
//                                             y2="7.99167" gradientUnits="userSpaceOnUse">
//                                             <stop stop-color="#E91FCF" />
//                                             <stop offset="1" stop-color="#FF8CF0" />
//                                         </linearGradient>
//                                         <linearGradient id="paint1_linear_6_1026" x1="8.41146" y1="6.08333" x2="8.41146"
//                                             y2="18.1021" gradientUnits="userSpaceOnUse">
//                                             <stop stop-color="#E91FCF" />
//                                             <stop offset="1" stop-color="#FF8CF0" />
//                                         </linearGradient>
//                                         <linearGradient id="paint2_linear_6_1026" x1="7.08402" y1="1.85375" x2="7.08402"
//                                             y2="4.98333" gradientUnits="userSpaceOnUse">
//                                             <stop stop-color="#E91FCF" />
//                                             <stop offset="1" stop-color="#FF8CF0" />
//                                         </linearGradient>
//                                         <linearGradient id="paint3_linear_6_1026" x1="3.74999" y1="6.85374" x2="3.74999"
//                                             y2="9.97262" gradientUnits="userSpaceOnUse">
//                                             <stop stop-color="#E91FCF" />
//                                             <stop offset="1" stop-color="#FF8CF0" />
//                                         </linearGradient>
//                                         <linearGradient id="paint4_linear_6_1026" x1="16.2625" y1="11.0274" x2="16.2625"
//                                             y2="14.1393" gradientUnits="userSpaceOnUse">
//                                             <stop stop-color="#E91FCF" />
//                                             <stop offset="1" stop-color="#FF8CF0" />
//                                         </linearGradient>
//                                     </defs>
//                                 </svg>
//                             </div>
//                         </div>
//                         <div class="smart-paragraph-content">
//                             <span class="smart-paragraph-title">Smart Paragraph</span>
//                             <span class="smart-paragraph-description"> Generate paragraphs that will captivate your readers.
//                             </span>
//                         </div>
//                     </div>
//                     <div class="step-progress">
//                         <div class="step-item active" data-step="1">
//                             <div class="step-circle">✓</div>
//                             <span class="step-label">Chọn chủ đề</span>
//                         </div>
//                         <div class="step-line"></div>
//                         <div class="step-item" data-step="2">
//                             <div class="step-circle">2</div>
//                             <span class="step-label">Sinh nội dung</span>
//                         </div>
//                         <div class="step-line"></div>
//                         <div class="step-item" data-step="3">
//                             <div class="step-circle">3</div>
//                             <span class="step-label">Xuất bản</span>
//                         </div>
//                     </div>
//                     <div id="formWrapper"></div>
//                     <div id="stepPromptFooter" class="footer-actions">
//                         <div class="footer-actions__left">
//                             <span id="btnClear" class="btn-text btn-clear">Clear</span>
//                         </div>
//                         <div class="footer-actions__right">
//                             <div class="btn-outline" onclick="openTemplateModal()" id="submitSaveTemplate">
//                                 Lưu template
//                             </div>
//                             <div id="submitPromptBtn" class="btn-primary">
//                                 {/* <!-- SVG giữ nguyên --> */}
//                                 Generate
//                             </div>
//                         </div>
//                     </div>
//                     {/* <!-- ================= STEP 2 ================= --> */}
//                     <div id="stepEditor" style="display:none;width:100%;display: flex;
//     width: 100%;
//     height: 100%;
//     justify-content: space-between;
//     flex-direction: column;">
//                         <div style="display:flex;gap:16px;width:100%;">
//                             {/* <!-- LEFT: EDITOR --> */}
//                             <div style="flex:1;background: #fff;border:1px solid #dde8ff;border-radius:10px;padding:12px;">
//                                 <textarea id="editorInline"></textarea>
//                             </div>
//                             {/* <!-- RIGHT: TOOL PANEL --> */}
//                             <div id="editorTools" style="width:280px;background:#fff;border:1px solid #dde8ff; 
// 							border-radius:10px;padding:12px;display:flex;
// 							flex-direction:column;gap:14px;">
//                                 <h4 style="margin:0;font-size:14px;">Công cụ</h4>
//                                 {/* <!-- Tool fields render here --> */}
//                                 <div id="toolFields"></div>
//                                 <div class="btn-primary" id="btnRegenerate">
//                                     <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
//                                         xmlns="http://www.w3.org/2000/svg">
//                                         <path
//                                             d="M7.34472 1.87605C7.37328 1.72312 7.45443 1.58499 7.57412 1.4856C7.6938 1.3862 7.84447 1.33179 8.00005 1.33179C8.15563 1.33179 8.3063 1.3862 8.42599 1.4856C8.54567 1.58499 8.62682 1.72312 8.65538 1.87605L9.35605 5.58138C9.40581 5.84482 9.53383 6.08713 9.7234 6.2767C9.91297 6.46627 10.1553 6.59429 10.4187 6.64405L14.1241 7.34472C14.277 7.37328 14.4151 7.45443 14.5145 7.57412C14.6139 7.6938 14.6683 7.84447 14.6683 8.00005C14.6683 8.15563 14.6139 8.3063 14.5145 8.42599C14.4151 8.54567 14.277 8.62682 14.1241 8.65538L10.4187 9.35605C10.1553 9.40581 9.91297 9.53383 9.7234 9.7234C9.53383 9.91297 9.40581 10.1553 9.35605 10.4187L8.65538 14.1241C8.62682 14.277 8.54567 14.4151 8.42599 14.5145C8.3063 14.6139 8.15563 14.6683 8.00005 14.6683C7.84447 14.6683 7.6938 14.6139 7.57412 14.5145C7.45443 14.4151 7.37328 14.277 7.34472 14.1241L6.64405 10.4187C6.59429 10.1553 6.46627 9.91297 6.2767 9.7234C6.08713 9.53383 5.84482 9.40581 5.58138 9.35605L1.87605 8.65538C1.72312 8.62682 1.58499 8.54567 1.4856 8.42599C1.3862 8.3063 1.33179 8.15563 1.33179 8.00005C1.33179 7.84447 1.3862 7.6938 1.4856 7.57412C1.58499 7.45443 1.72312 7.37328 1.87605 7.34472L5.58138 6.64405C5.84482 6.59429 6.08713 6.46627 6.2767 6.2767C6.46627 6.08713 6.59429 5.84482 6.64405 5.58138L7.34472 1.87605Z"
//                                             stroke="white" stroke-width="1.33333" stroke-linecap="round"
//                                             stroke-linejoin="round" />
//                                         <path d="M13.3333 1.33337V4.00004" stroke="white" stroke-width="1.33333"
//                                             stroke-linecap="round" stroke-linejoin="round" />
//                                         <path d="M14.6667 2.66663H12" stroke="white" stroke-width="1.33333"
//                                             stroke-linecap="round" stroke-linejoin="round" />
//                                         <path
//                                             d="M2.66659 14.6667C3.40297 14.6667 3.99992 14.0697 3.99992 13.3333C3.99992 12.597 3.40297 12 2.66659 12C1.93021 12 1.33325 12.597 1.33325 13.3333C1.33325 14.0697 1.93021 14.6667 2.66659 14.6667Z"
//                                             stroke="white" stroke-width="1.33333" stroke-linecap="round"
//                                             stroke-linejoin="round" />
//                                     </svg>
//                                     Tạo lại nội dung
//                                 </div>
//                             </div>
//                         </div>
//                         <div class="footer-actions">
//                             <div class="footer-actions__left">
//                                 <span class="btn-text btn-clear" onclick="gotoStep(1)">← Quay lại</span>
//                             </div>
//                             <div class="footer-actions__right">
//                                 <div class="btn-primary" id="btnToPublish">Tiếp tục</div>
//                             </div>
//                         </div>
//                     </div>
//                     {/* ================= STEP 3 ================= */}
//                     <div id="stepPublish" style="display:none;width:100%;     display: flex;
//     flex-direction: column;
//     justify-content: space-between;
//     height: 100%;">
//                         {/* TAB HEADER: SEO / Social */}
//                         <div class="tab-bar">
//                             <div class="tab tab--active" data-step3-tab="seo">SEO</div>
//                             <div class="tab" data-step3-tab="social">Social Media</div>
//                         </div>
//                         {/* ===== TAB SEO ===== */}
//                         <div id="step3Seo" class="step3-panel">
//                             <div class="step3-section">
//                                 <div class="step3-title">Tiêu đề SEO (chọn 1 biến thể)</div>
//                                 <div class="step3-desc">Tôi đề xuất 3 biến thể dựa trên từ khóa và khả năng thu hút click</div>
//                                 <div class="seo-title-list" id="seoTitleList"></div>
//                             </div>
//                             <div class="step3-section">
//                                 <div class="step3-title">Mô tả Meta</div>
//                                 <textarea id="seoMeta" class="step3-meta-description" rows="3" maxlength="160"></textarea>
//                                 <div class="step3-hint"><span id="seoMetaCount">0</span>/160 ký tự</div>
//                             </div>
//                             <div class="step3-section">
//                                 <div class="step3-title">URL Slug</div>
//                                 <input id="seoSlug" class="step3-slug-input" />
//                             </div>
//                             <div class="step3-section">
//                                 <div class="step3-title">Nhóm chuyên mục</div>
//                                 <select id="seoCategory" class="step3-select">
//                                     <option value="">Chọn</option>
//                                     <option value="thi-truong">Thị trường</option>
//                                     <option value="kinh-te">Kinh tế</option>
//                                     <option value="cong-nghe">Công nghệ</option>
//                                 </select>
//                             </div>
//                             <div class="step3-section">
//                                 <div class="step3-title">Tags</div>
//                                 <div id="seoTags" class="seo-tags"></div>
//                             </div>
//                             <div class="step3-section">
//                                 <div class="step3-title">Góc tiếp cận</div>
//                                 <select id="seoAngle" class="step3-select">
//                                     <option value="">Chọn</option>
//                                     <option value="tin-tuc">Tin tức</option>
//                                     <option value="phan-tich">Phân tích</option>
//                                     <option value="binh-luan">Bình luận</option>
//                                 </select>
//                             </div>
//                         </div>
//                         {/* ===== TAB SOCIAL MEDIA ===== */}
//                         <div id="step3Social" class="step3-panel" style="display:none;">
//                             <div class="social-card">
//                                 <div class="social-card__header">
//                                     <div class="social-card__title">Facebook</div>
//                                     <div class="social-card__actions">
//                                         <span class="icon-btn" id="fbCopyBtn"><svg xmlns="http://www.w3.org/2000/svg" width="16"
//                                             height="16" viewBox="0 0 16 16" fill="none">
//                                             <g clip-path="url(#clip0_2003_4475)">
//                                                 <path
//                                                     d="M13.3335 5.33337H6.66683C5.93045 5.33337 5.3335 5.93033 5.3335 6.66671V13.3334C5.3335 14.0698 5.93045 14.6667 6.66683 14.6667H13.3335C14.0699 14.6667 14.6668 14.0698 14.6668 13.3334V6.66671C14.6668 5.93033 14.0699 5.33337 13.3335 5.33337Z"
//                                                     stroke="#0A0A0A" stroke-width="1.33333" stroke-linecap="round"
//                                                     stroke-linejoin="round" />
//                                                 <path
//                                                     d="M2.66683 10.6667C1.9335 10.6667 1.3335 10.0667 1.3335 9.33337V2.66671C1.3335 1.93337 1.9335 1.33337 2.66683 1.33337H9.3335C10.0668 1.33337 10.6668 1.93337 10.6668 2.66671"
//                                                     stroke="#0A0A0A" stroke-width="1.33333" stroke-linecap="round"
//                                                     stroke-linejoin="round" />
//                                             </g>
//                                             <defs>
//                                                 <clipPath id="clip0_2003_4475">
//                                                     <rect width="16" height="16" fill="white" />
//                                                 </clipPath>
//                                             </defs>
//                                         </svg></span>
//                                         <span class="icon-btn" id="fbReloadBtn"><svg xmlns="http://www.w3.org/2000/svg"
//                                             width="16" height="16" viewBox="0 0 16 16" fill="none">
//                                             <path
//                                                 d="M6.07355 3.38664C6.65355 3.21331 7.29355 3.09998 8.00022 3.09998C11.1935 3.09998 13.7802 5.68664 13.7802 8.87998C13.7802 12.0733 11.1935 14.66 8.00022 14.66C4.80688 14.66 2.22021 12.0733 2.22021 8.87998C2.22021 7.69331 2.58021 6.58664 3.19355 5.66664"
//                                                 stroke="#292D32" stroke-width="1.3" stroke-linecap="round"
//                                                 stroke-linejoin="round" />
//                                             <path d="M5.24658 3.54671L7.17325 1.33337" stroke="#292D32"
//                                                 stroke-linecap="round" stroke-linejoin="round" />
//                                             <path d="M5.24658 3.54675L7.49325 5.18675" stroke="#292D32"
//                                                 stroke-linecap="round" stroke-linejoin="round" />
//                                         </svg></span>
//                                     </div>
//                                 </div>
//                                 <textarea id="fbContent" class="step3-publish" rows="6"></textarea>
//                                 <div class="social-card__footer">
//                                     <div id="fbStatus" class="social-status disconnected">🔴 Chưa kết nối</div>
//                                     <div class="btn-primary" id="btnPublishFb">Xuất bản Facebook</div>
//                                 </div>
//                             </div>
//                             <div class="social-card" style="margin-top:14px;">
//                                 <div class="social-card__header">
//                                     <div class="social-card__title">LinkedIn</div>
//                                     <div class="social-card__actions">
//                                         <span class="icon-btn" id="liCopyBtn"><svg xmlns="http://www.w3.org/2000/svg" width="16"
//                                             height="16" viewBox="0 0 16 16" fill="none">
//                                             <g clip-path="url(#clip0_2003_4475)">
//                                                 <path
//                                                     d="M13.3335 5.33337H6.66683C5.93045 5.33337 5.3335 5.93033 5.3335 6.66671V13.3334C5.3335 14.0698 5.93045 14.6667 6.66683 14.6667H13.3335C14.0699 14.6667 14.6668 14.0698 14.6668 13.3334V6.66671C14.6668 5.93033 14.0699 5.33337 13.3335 5.33337Z"
//                                                     stroke="#0A0A0A" stroke-width="1.33333" stroke-linecap="round"
//                                                     stroke-linejoin="round" />
//                                                 <path
//                                                     d="M2.66683 10.6667C1.9335 10.6667 1.3335 10.0667 1.3335 9.33337V2.66671C1.3335 1.93337 1.9335 1.33337 2.66683 1.33337H9.3335C10.0668 1.33337 10.6668 1.93337 10.6668 2.66671"
//                                                     stroke="#0A0A0A" stroke-width="1.33333" stroke-linecap="round"
//                                                     stroke-linejoin="round" />
//                                             </g>
//                                             <defs>
//                                                 <clipPath id="clip0_2003_4475">
//                                                     <rect width="16" height="16" fill="white" />
//                                                 </clipPath>
//                                             </defs>
//                                         </svg></span>
//                                         <span class="icon-btn" id="liReloadBtn"><svg xmlns="http://www.w3.org/2000/svg"
//                                             width="16" height="16" viewBox="0 0 16 16" fill="none">
//                                             <path
//                                                 d="M6.07355 3.38664C6.65355 3.21331 7.29355 3.09998 8.00022 3.09998C11.1935 3.09998 13.7802 5.68664 13.7802 8.87998C13.7802 12.0733 11.1935 14.66 8.00022 14.66C4.80688 14.66 2.22021 12.0733 2.22021 8.87998C2.22021 7.69331 2.58021 6.58664 3.19355 5.66664"
//                                                 stroke="#292D32" stroke-width="1.3" stroke-linecap="round"
//                                                 stroke-linejoin="round" />
//                                             <path d="M5.24658 3.54671L7.17325 1.33337" stroke="#292D32"
//                                                 stroke-linecap="round" stroke-linejoin="round" />
//                                             <path d="M5.24658 3.54675L7.49325 5.18675" stroke="#292D32"
//                                                 stroke-linecap="round" stroke-linejoin="round" />
//                                         </svg></span>
//                                     </div>
//                                 </div>
//                                 <textarea id="linkedinContent" class="step3-publish" rows="6"></textarea>
//                                 <div class="social-card__footer">
//                                     <div class="social-status disconnected">🔴 Chưa kết nối</div>
//                                     <div class="btn-outline disabled">Xuất bản LinkedIn</div>
//                                 </div>
//                             </div>
//                         </div>

//                         <div class="footer-actions">
//                             <div class="footer-actions__left">
//                                 <span class="btn-text btn-clear" onclick="gotoStep(2)">
//                                     ← Quay lại chỉnh sửa
//                                 </span>
//                             </div>

//                             <div class="footer-actions__right">
//                                 <div class="btn-primary" id="btnPublishFinal">
//                                     Xuất bản
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//             <div id="global-spinner"
//                 style="position:fixed;inset:0;background:rgba(255,255,255,0.9);display:none;align-items:center;justify-content:center;z-index:100000;">
//                 <div class="spinner"></div>
//             </div>
//             <div id="ai-menu"
//                 style="position:absolute;display:none;background:#fff;border-radius:10px;padding:6px;box-shadow:0 10px 30px rgba(0,0,0,.15);z-index:99999;min-width:220px;font-family:system-ui;">
//                 <div style="font-size:12px;color:#6b7280;padding:4px 8px;">
//                     ✨ Chỉnh sửa với AI
//                 </div>
//                 <button onclick="aiRewrite()">✍️ Viết lại</button>
//                 <button onclick="aiImprove()">✨ Cải thiện văn phong</button>
//                 <button onclick="aiShorten()">✂️ Rút gọn</button>
//                 <button onclick="aiExpand()">➕ Mở rộng</button>
//             </div>
//             <div class="modal fade" id="ckeditorModal" tabindex="-1" aria-labelledby="ckeditorModalLabel" aria-hidden="true">
//                 <div class="modal-dialog modal-lg modal-dialog-scrollable">
//                     <div class="modal-content">
//                         <div class="modal-header">
//                             <span class="modal-title" id="ckeditorModalLabel">Chi tiết bài viết</span>
//                             <svg style="cursor: pointer;" data-bs-dismiss="modal" aria-label="Đóng" width="32" height="32"
//                                 viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
//                                 <rect width="32" height="32" rx="16" fill="#F3F5F7" />
//                                 <path d="M10.7507 10.75L21.25 21.2493" stroke="#292D32" stroke-width="1.5"
//                                     stroke-linecap="round" stroke-linejoin="round" />
//                                 <path d="M10.75 21.2493L21.2493 10.75" stroke="#292D32" stroke-width="1.5"
//                                     stroke-linecap="round" stroke-linejoin="round" />
//                             </svg>
//                         </div>
//                         <div class="modal-body">
//                             <textarea id="editor"></textarea>
//                         </div>
//                         <div class="modal-footer">
//                             <div class="wrapper-left">
//                                 <div id="closeModal" data-bs-dismiss="modal" style="display: none;">
//                                 </div>
//                                 <svg data-bs-dismiss="modal" aria-label="Đóng" width="77" height="37" viewBox="0 0 77 37"
//                                     fill="none" xmlns="http://www.w3.org/2000/svg">
//                                     <rect x="0.5" y="0.5" width="76" height="36" rx="5.5" fill="white" />
//                                     <rect x="0.5" y="0.5" width="76" height="36" rx="5.5" stroke="#C3D4E9" />
//                                     <path
//                                         d="M27.9674 23H25.0202V14.2695H28.0319C28.8991 14.2695 29.6471 14.4473 30.276 14.8027C30.9049 15.1543 31.3893 15.6562 31.7291 16.3086C32.069 16.957 32.2389 17.7285 32.2389 18.623C32.2389 19.5254 32.069 20.3047 31.7291 20.9609C31.3893 21.6133 30.8991 22.1172 30.2584 22.4727C29.6217 22.8242 28.858 23 27.9674 23ZM26.567 21.6758H27.8854C28.8346 21.6758 29.5358 21.4102 29.9889 20.8789C30.4459 20.3438 30.6745 19.5918 30.6745 18.623C30.6745 17.6621 30.4479 16.918 29.9948 16.3906C29.5416 15.8594 28.8541 15.5938 27.9323 15.5938H26.567V21.6758ZM24.3698 19.168V18.1016H29.5202V19.168H24.3698ZM35.8427 23.1406C35.2333 23.1406 34.7001 23.0059 34.243 22.7363C33.786 22.4629 33.4286 22.084 33.1708 21.5996C32.9169 21.1152 32.7899 20.5527 32.7899 19.9121C32.7899 19.2715 32.9169 18.709 33.1708 18.2246C33.4286 17.7363 33.786 17.3555 34.243 17.082C34.7001 16.8086 35.2333 16.6719 35.8427 16.6719C36.4481 16.6719 36.9794 16.8086 37.4364 17.082C37.8973 17.3555 38.2548 17.7363 38.5087 18.2246C38.7665 18.709 38.8954 19.2715 38.8954 19.9121C38.8954 20.5527 38.7665 21.1152 38.5087 21.5996C38.2548 22.084 37.8973 22.4629 37.4364 22.7363C36.9794 23.0059 36.4481 23.1406 35.8427 23.1406ZM35.8427 21.9043C36.3153 21.9043 36.6923 21.7266 36.9735 21.3711C37.2548 21.0156 37.3954 20.5293 37.3954 19.9121C37.3954 19.2949 37.2548 18.8066 36.9735 18.4473C36.6923 18.0879 36.3153 17.9082 35.8427 17.9082C35.3661 17.9082 34.9872 18.0879 34.7059 18.4473C34.4247 18.8027 34.2841 19.291 34.2841 19.9121C34.2841 20.5293 34.4247 21.0156 34.7059 21.3711C34.9872 21.7266 35.3661 21.9043 35.8427 21.9043ZM35.2333 16.0391L36.1825 14.2344H37.6884L36.3231 16.0391H35.2333ZM41.1573 19.502V23H39.6808V16.8125H41.1339V17.7617C41.5636 17.0469 42.1964 16.6895 43.0323 16.6895C43.6808 16.6895 44.2101 16.8984 44.6202 17.3164C45.0343 17.7344 45.2413 18.3398 45.2413 19.1328V23H43.7589V19.3672C43.7589 18.9141 43.6495 18.5703 43.4308 18.3359C43.212 18.1016 42.9054 17.9844 42.5109 17.9844C42.1241 17.9844 41.8019 18.1055 41.5441 18.3477C41.2863 18.5898 41.1573 18.9746 41.1573 19.502ZM49.1263 25.5312C48.3099 25.5312 47.6615 25.3555 47.181 25.0039C46.7005 24.6523 46.4193 24.1758 46.3373 23.5742H47.7845C47.8548 23.8398 48.0091 24.041 48.2474 24.1777C48.4857 24.3184 48.7787 24.3887 49.1263 24.3887C49.5873 24.3887 49.9447 24.2637 50.1986 24.0137C50.4564 23.7637 50.5853 23.4023 50.5853 22.9297V21.9863H50.5795C50.3802 22.3496 50.1205 22.6172 49.8002 22.7891C49.4798 22.957 49.1166 23.041 48.7103 23.041C48.1712 23.041 47.7005 22.9062 47.2982 22.6367C46.8959 22.3672 46.5834 21.9961 46.3607 21.5234C46.142 21.0469 46.0326 20.498 46.0326 19.877C46.0326 19.252 46.1439 18.6992 46.3666 18.2188C46.5892 17.7383 46.9017 17.3633 47.3041 17.0938C47.7064 16.8242 48.1712 16.6895 48.6986 16.6895C49.1009 16.6895 49.4642 16.7754 49.7884 16.9473C50.1166 17.1152 50.3822 17.377 50.5853 17.7324H50.5912V16.8125H52.0502V22.8418C52.0502 23.4785 51.9232 23.9941 51.6693 24.3887C51.4154 24.7871 51.0677 25.0762 50.6263 25.2559C50.1849 25.4395 49.6849 25.5312 49.1263 25.5312ZM49.056 21.8223C49.5404 21.8223 49.9271 21.6445 50.2162 21.2891C50.5091 20.9297 50.6556 20.4531 50.6556 19.8594C50.6556 19.2656 50.5091 18.791 50.2162 18.4355C49.9271 18.0762 49.5404 17.8965 49.056 17.8965C48.599 17.8965 48.2298 18.0664 47.9486 18.4062C47.6673 18.7461 47.5267 19.2305 47.5267 19.8594C47.5267 20.4922 47.6673 20.9785 47.9486 21.3184C48.2298 21.6543 48.599 21.8223 49.056 21.8223Z"
//                                         fill="#363F5E" />
//                                 </svg>
//                             </div>
//                             <div class="wrapper-right">
//                                 <svg id="saveContent" width="69" height="37" viewBox="0 0 69 37" fill="none"
//                                     xmlns="http://www.w3.org/2000/svg">
//                                     <rect width="69" height="37" rx="6" fill="#303454" />
//                                     <path
//                                         d="M24.949 23V14.2695H26.4959V21.6582H30.5447V23H24.949ZM33.4395 23.123C32.791 23.123 32.2617 22.9141 31.8516 22.4961C31.4414 22.0781 31.2363 21.4727 31.2363 20.6797V16.8125H32.7129V20.4453C32.7129 20.8984 32.8223 21.2422 33.041 21.4766C33.2598 21.7109 33.5664 21.8281 33.9609 21.8281C34.3516 21.8281 34.6738 21.707 34.9277 21.4648C35.1855 21.2227 35.3145 20.8379 35.3145 20.3105V16.8125H36.4336C36.5625 16.8125 36.627 16.748 36.627 16.6191V15.4062H37.8574V16.666C37.8574 17.0176 37.7637 17.2812 37.5762 17.457C37.3887 17.6328 37.1289 17.7305 36.7969 17.75V23H35.3438V22.0508C34.9102 22.7656 34.2754 23.123 33.4395 23.123ZM40.758 23.123C40.1096 23.123 39.5803 22.9141 39.1702 22.4961C38.76 22.0781 38.5549 21.4727 38.5549 20.6797V16.8125H40.0315V20.4453C40.0315 20.8984 40.1409 21.2422 40.3596 21.4766C40.5784 21.7109 40.885 21.8281 41.2795 21.8281C41.6702 21.8281 41.9924 21.707 42.2463 21.4648C42.5041 21.2227 42.633 20.8379 42.633 20.3105V16.8125H44.1155V23H42.6623V22.0508C42.2288 22.7656 41.594 23.123 40.758 23.123Z"
//                                         fill="white" />
//                                 </svg>
//                                 <div id="modalCopyContent" class="copy-content">
//                                     Copy
//                                 </div>
//                             </div>
//                         </div>
//                     </div>
//                 </div>
//             </div>
//         </div>
//     )
// }         
export default function ContentNew() {
    return (
        <div>
            <h1>ContentNew</h1>
        </div>
    );
};