document.addEventListener("DOMContentLoaded", function () {
    function hello() {
        console.log('hi');
    }
    hello();

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
        document.getElementById('stepEditor').style.display = (step === 2) ? 'flex' : 'none';

        // STEP 3
        document.getElementById('stepPublish').style.display = (step === 3) ? 'flex' : 'none';

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
        editorInstance = await ClassicEditor.create(document.querySelector('#editor-root'));
        return editorInstance;
    }
    // window.__EDITOR_DATA__ = {
    // 	articleId: 123,
    // 	content: [
    // 		{ type: "paragraph", content:  "" }
    // 	]
    // };

    function saveToCMS(data) {
        console.log("Content:", data.content);
        console.log("Stats:", data.stats);
        document.getElementById('statBlocks').textContent = data.stats.blocks;
        document.getElementById('statWords').textContent = data.stats.words;
        document.getElementById('statChars').textContent = data.stats.characters;
        window.__CMS_CONTENT__ = data.content;
        console.log("Content:", window.__CMS_CONTENT__);
    }
    function waitForEditor() {
        return new Promise((resolve) => {
            const check = () => {
                if (window.__EDITOR_READY__) return resolve();
                setTimeout(check, 50);
            };
            check();
        });
    }

    function renderStats() {
        document.getElementById("stats").innerText =
            `Blocks: ${window.__CMS_DATA__.stats.blocks} | Words: ${window.__CMS_DATA__.stats.words} | Characters: ${window.__CMS_DATA__.stats.characters}`;
    }


    async function loadToEditor(html) {
        generatedHtml = html;
        gotoStep(STEPS.EDITOR);

        renderEditorTools(toolSchema);
        ensureToolStatsUI();      // ➕

        //const ed = await ensureEditor();
        // ed.setData(html);

        bindEditorStatsOnce();    // ➕
        updateToolStats();        // ➕

        // window.__EDITOR_DATA__ = {
        // 	articleId: 123,
        // 	content: html

        // };
        await waitForEditor();
        window.loadHTMLToEditor(html);

        console.log("HTML gửi lên editor:", html);
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

                    //Assign data here
                    loadToEditor(html);
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
                const el = document.getElementById('step3Social');

                if (target === 'social') {
                    el.style.display = 'block';
                    el.style.background = 'none';
                    el.style.border = ' none';
                    el.style.padding = '0';
                } else {
                    el.style.display = 'none';
                }
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
            //const res = await fetch("http://localhost:3000/social_create", {

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
        document.getElementById('seoMeta')?.addEventListener('input', (e) => {
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

    document.getElementById('btnRegenerate')?.addEventListener('click', async () => {
        const toolPayload = buildToolPayloadFromSchema(toolSchema);

        const finalPayload = {
            ...basePromptPayload,
            ...toolPayload,
            full_content: {
                label: 'Nội dung hiện tại',
                value: window.__CMS_CONTENT__ || ""
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
                    console.log("Result nhận được từ API:", result);
                    if (result.status === "success") {
                        let html = result.data?.text || '';
                        html = removeAllMarkdownLinks(html);
                        console.log("HTML nhận được:", html);
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
    function cleanBlockNoteHTML(html) {
        // Tạo DOM ảo để xử lý
        const container = document.createElement("div");
        container.innerHTML = html;

        // Các selector cần bóc bỏ wrapper
        const wrappers = container.querySelectorAll(
            ".bn-block-group, .bn-block-outer, .bn-block, .bn-block-content, .bn-inline-content"
        );

        wrappers.forEach(el => {
            // Thay thế phần tử bằng nội dung bên trong nó
            el.replaceWith(...el.childNodes);
        });

        // Xóa toàn bộ attribute thừa
        const allElements = container.querySelectorAll("*");

        allElements.forEach(el => {
            [...el.attributes].forEach(attr => {
                if (
                    attr.name.startsWith("data-") ||
                    attr.name === "class" ||
                    attr.name === "style"
                ) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        // Xóa thẻ rỗng không cần thiết
        container.querySelectorAll("p, div, span").forEach(el => {
            if (!el.textContent.trim() && el.children.length === 0) {
                el.remove();
            }
        });

        return container.innerHTML.trim();
    }
    function convertBlockNoteToCKEditorHTML(blockNoteHtml) {
        const container = document.createElement("div");
        container.innerHTML = blockNoteHtml;

        // Bóc hết các wrapper của BlockNote
        const selectors = [
            ".bn-block-group",
            ".bn-block-outer",
            ".bn-block",
            ".bn-block-content",
            ".bn-inline-content"
        ];

        selectors.forEach(selector => {
            container.querySelectorAll(selector).forEach(el => {
                el.replaceWith(...el.childNodes);
            });
        });

        // Chuẩn hóa heading theo data-level
        container.querySelectorAll("[data-content-type='heading']").forEach(el => {
            const level = el.getAttribute("data-level") || "1";
            const h = document.createElement(`h${level}`);
            h.innerHTML = el.innerHTML;
            el.replaceWith(h);
        });

        // Chuẩn hóa paragraph
        container.querySelectorAll("[data-content-type='paragraph']").forEach(el => {
            const p = document.createElement("p");
            p.innerHTML = el.innerHTML;
            el.replaceWith(p);
        });

        // Chuẩn hóa quote
        container.querySelectorAll("[data-content-type='quote']").forEach(el => {
            const blockquote = document.createElement("blockquote");
            blockquote.innerHTML = el.innerHTML.replace(/<br\s*\/?>/g, "").trim();
            el.replaceWith(blockquote);
        });

        // Xóa toàn bộ attribute thừa
        container.querySelectorAll("*").forEach(el => {
            [...el.attributes].forEach(attr => {
                if (
                    attr.name.startsWith("data-") ||
                    attr.name === "class" ||
                    attr.name === "style"
                ) {
                    el.removeAttribute(attr.name);
                }
            });
        });

        // Dọn thẻ rỗng
        container.querySelectorAll("p, div, span").forEach(el => {
            if (!el.textContent.trim() && el.children.length === 0) {
                el.remove();
            }
        });

        return container.innerHTML.trim();
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
    document.getElementById("btnToPublish")?.addEventListener("click", async () => {
        //if (!editorInstance) return;
        if (window.__CMS_CONTENT__ === null || window.__CMS_CONTENT__ === "") return;
        const btn = document.getElementById("btnToPublish");
        btn.classList.add("disabled");
        btn.style.pointerEvents = "none";

        showSpinner(); // 🔴 BẬT SPINNER Ở ĐÂY

        try {
            //finalHtml = editorInstance.getData();
            finalHtml = window.__CMS_CONTENT__;
            //finalHtml = convertBlockNoteToCKEditorHTML(finalHtml);
            finalHtml = cleanBlockNoteHTML(finalHtml);
            console.log(finalHtml);
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
    document.getElementById("btnPublishFb")?.addEventListener("click", async () => {
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

        // editorInstance.model.document.on('change:data', () => {
        // 	updateToolStats();
        // });
    }
    console.log("Instance", document.getElementById("editor-root"))


    /* ========= SPINNER (giữ nguyên) ========= */


    /* ========= AI MENU SHOW/HIDE (giữ nguyên logic) ========= */
    // const aiMenu = document.getElementById('ai-menu');

    // document.addEventListener('mouseup', () => {
    // 	setTimeout(() => {
    // 		// if (!editorInstance) return;
    // 		if (!window.__CMS_CONTENT__) return;
    // 		const selection = window.getSelection();
    // 		if (!selection || selection.isCollapsed) {
    // 			aiMenu.style.display = 'none';
    // 			return;
    // 		}

    // 		const range = selection.getRangeAt(0);
    // 		let container = range.commonAncestorContainer;

    // 		if (container.nodeType !== 1) container = container.parentElement;

    // 		// chỉ hiện menu nếu bôi đen trong CKEditor
    // 		if (!container.closest('.ck-content')) {
    // 			aiMenu.style.display = 'none';
    // 			return;
    // 		}

    // 		const rect = range.getBoundingClientRect();
    // 		aiMenu.style.display = 'block';
    // 		aiMenu.style.top = `${rect.top + window.scrollY - aiMenu.offsetHeight - 8}px`;
    // 		aiMenu.style.left = `${rect.left + window.scrollX}px`;
    // 	});
    // });

    // document.addEventListener('mousedown', e => {
    // 	if (!aiMenu.contains(e.target)) aiMenu.style.display = 'none';
    // });

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
        //return editorInstance.getData(); // full HTML trong editor
        return window.__CMS_CONTENT__;
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
        // if (!editorInstance) return;
        if (window.__CMS_CONTENT__ === null || window.__CMS_CONTENT__ === "") return;

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
            alert('AI xử lý thất bại. Kiểm tra webhook n8n và response JSON { text: "..." }');
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


    (function () {
        const API_BASE = 'https://wttbe.metapress.ai/';   // đổi theo môi trường của bạn
        const LOGIN_PAGE = '/login.html';
        document.getElementById('sidebarLogout')?.addEventListener('click', function (e) {
            e.preventDefault();

            // Lấy token hiện tại (nếu có)
            let token = '';
            try { token = localStorage.getItem('auth_token') || ''; } catch { }

            // (Tùy chọn) Gọi API logout để revoke token ở server, nếu bạn có route /api/logout
            if (token) {
                fetch(API_BASE + '/api/logout', {
                    method: 'POST',
                    headers: {
                        'Accept': 'application/json',
                        'Authorization': 'Bearer ' + token
                    }
                }).catch(() => { /* bỏ qua lỗi */ });
            }

            // Xóa token local và chuyển về login
            try {
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
            } catch { }

            location.href = LOGIN_PAGE;
        });
    })();


    (function () {
        // ====== Cấu hình nhanh ======
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
        });
    })();
    init();
});
