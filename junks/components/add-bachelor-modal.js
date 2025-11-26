// add-bachelor-modal.js
// A reusable Web Component for adding "Bachelor Programs" with a modal UI, preview, and Firebase Firestore integration.

class AddBachelorModal extends HTMLElement {
    static get observedAttributes() {
        return ['primary-color', 'secondary-color', 'theme-mode', 'button-text', 'button-icon', 'dept-id', 'firebase-config'];
    }

    constructor() {
        super();
        this.attachShadow({ mode: 'open' });
        this._uid = 'abm-' + Math.random().toString(36).slice(2, 10);
        this._loaded = { tailwind: false, feather: false, firebase: false };
        this._featherReady = false;
        this._aosReady = false;
        this._firebaseReady = false;
        this._defaultPrimary = 'indigo';
        this._defaultSecondary = 'violet';
        this._defaultTheme = 'dark';
    }

    // Public API
    open() { this._openModal(); }
    close() { this._closeModal(); }
    reset() { this._resetForm(); }

    attributeChangedCallback(name, oldValue, newValue) {
        if (name === 'primary-color' || name === 'secondary-color' || name === 'theme-mode') {
            // Live-update config if needed
            this._reconfigureTailwind();
        }
    }

    connectedCallback() {
        this._init();
    }

    async _init() {
        await this._ensureDependencies();
        this._render();
        this._bindEvents();
        this._bootstrap();
    }

    async _ensureDependencies() {
        await this._loadTailwind();
        await this._loadFeather();
        await this._loadFirebase();
    }

    async _loadTailwind() {
        if (window.tailwindLoaded) {
            this._loaded.tailwind = true;
            return;
        }
        await this._injectScript('https://cdn.tailwindcss.com', { id: 'cdn-tailwind' });
        window.tailwindLoaded = true;
        this._loaded.tailwind = true;
        this._reconfigureTailwind();
    }

    _reconfigureTailwind() {
        const primary = (this.getAttribute('primary-color') || this._defaultPrimary).trim();
        const secondary = (this.getAttribute('secondary-color') || this._defaultSecondary).trim();
        const themeMode = (this.getAttribute('theme-mode') || this._defaultTheme).toLowerCase();

        const config = {
            theme: {
                extend: {
                    colors: {
                        primary: this._toColorObject(primary),
                        secondary: this._toColorObject(secondary),
                    }
                }
            },
            darkMode: themeMode === 'light' ? 'media' : 'class',
        };

        try {
            if (window.tailwind && window.tailwind.config) {
                window.tailwind.config = this._deepMerge({}, window.tailwind.config, config);
            }
        } catch (e) {
            // ignore
        }
        // Also store for later
        this._tailwindConfig = config;
    }

    _toColorObject(token) {
        // Accepts either a palette name (e.g., "indigo", "blue") or a hex (e.g., "#6366f1")
        const palette = token.replace('#', '');
        const hex = this._isHex(palette) ? palette : this._paletteHex(palette);
        if (!hex) return undefined;
        return this._shadesFromHex(hex);
    }

    _isHex(str) {
        return /^[0-9a-fA-F]{6}$/.test(str);
    }

    _paletteHex(name) {
        const map = {
            indigo: '6366f1', violet: '8b5cf6', blue: '3b82f6', emerald: '10b981',
            pink: 'ec4899', slate: '64748b', gray: '6b7280', red: 'ef4444',
            amber: 'f59e0b', green: '22c55e', teal: '14b8a6', cyan: '06b6d4',
            sky: '0ea5e9', purple: 'a855f7', fuchsia: 'd946ef', rose: 'f43f5e',
            orange: 'f97316', lime: '84cc16', yellow: 'eab308'
        };
        return map[name] || null;
    }

    _shadesFromHex(hex) {
        return {
            50: this._tint(hex, 0.9),
            100: this._tint(hex, 0.8),
            200: this._tint(hex, 0.65),
            300: this._tint(hex, 0.5),
            400: this._tint(hex, 0.35),
            500: '#' + hex,
            600: this._shade(hex, 0.1),
            700: this._shade(hex, 0.2),
            800: this._shade(hex, 0.3),
            900: this._shade(hex, 0.4),
        };
    }

    _tint(hex, p) {
        const [r, g, b] = this._hexToRgb(hex);
        const mix = (c) => Math.round(c + (255 - c) * p);
        return this._rgbToHex(mix(r), mix(g), mix(b));
    }

    _shade(hex, p) {
        const [r, g, b] = this._hexToRgb(hex);
        const mix = (c) => Math.round(c * (1 - p));
        return this._rgbToHex(mix(r), mix(g), mix(b));
    }

    _hexToRgb(hex) {
        return [0, 2, 4].map(i => parseInt(hex.slice(i, i + 2), 16));
    }

    _rgbToHex(r, g, b) {
        const toHex = (n) => n.toString(16).padStart(2, '0');
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    async _loadFeather() {
        if (window.feather) {
            this._loaded.feather = true;
            this._featherReady = true;
            return;
        }
        await this._injectScript('https://unpkg.com/feather-icons');
        await this._injectScript('https://cdn.jsdelivr.net/npm/feather-icons/dist/feather.min.js');
        this._loaded.feather = true;
        this._featherReady = true;
    }

    async _loadFirebase() {
        if (window.firebase && window.firebase.apps) {
            this._loaded.firebase = true;
            this._firebaseReady = true;
            return;
        }
        const scripts = [
            'https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js',
            'https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js',
            'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth-compat.js'
        ];
        for (const src of scripts) {
            await this._injectScript(src);
        }
        this._loaded.firebase = true;

        const attr = this.getAttribute('firebase-config');
        if (attr) {
            try {
                const config = JSON.parse(attr);
                if (!window.firebase.apps || window.firebase.apps.length === 0) {
                    window.firebase.initializeApp(config);
                }
                this._firebaseReady = true;
                return;
            } catch (e) {
                console.warn('Invalid firebase-config JSON:', e);
            }
        }
        // If no firebase-config provided, try legacy global config
        if (window.firebaseConfig) {
            if (!window.firebase.apps || window.firebase.apps.length === 0) {
                window.firebase.initializeApp(window.firebaseConfig);
            }
            this._firebaseReady = true;
        } else {
            console.warn('Firebase not configured and no firebase-config attribute provided.');
        }
    }

    _injectScript(src, attrs = {}) {
        return new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = src;
            Object.entries(attrs).forEach(([k, v]) => s.setAttribute(k, v));
            s.onload = () => resolve();
            s.onerror = (e) => reject(e);
            document.head.appendChild(s);
        });
    }

    _bindEvents() {
        const doc = this.shadowRoot;
        const openBtn = doc.getElementById(`${this._uid}-open`);
        const closeBtn = doc.getElementById(`${this._uid}-close`);
        const backdrop = doc.getElementById(`${this._uid}-backdrop`);
        const modal = doc.getElementById(`${this._uid}-modal`);
        const modalPanel = doc.getElementById(`${this._uid}-panel`);
        const form = doc.getElementById(`${this._uid}-form`);
        const addSpecBtn = doc.getElementById(`${this._uid}-add-spec`);
        const randomImageBtn = doc.getElementById(`${this._uid}-random-img`);
        const successModal = doc.getElementById(`${this._uid}-success`);
        const addAnotherBtn = doc.getElementById(`${this._uid}-add-another`);
        const viewProgramsBtn = doc.getElementById(`${this._uid}-view-programs`);

        openBtn?.addEventListener('click', () => this._openModal());
        closeBtn?.addEventListener('click', () => this._closeModal());
        backdrop?.addEventListener('click', () => this._closeModal());
        doc.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && modal && !modal.classList.contains('opacity-0')) this._closeModal();
        });

        addSpecBtn?.addEventListener('click', () => this._addSpecialization());
        randomImageBtn?.addEventListener('click', () => this._randomizeImage());

        form?.addEventListener('submit', (e) => this._handleSubmit(e));

        addAnotherBtn?.addEventListener('click', () => {
            successModal?.classList.add('opacity-0', 'pointer-events-none');
            this._resetForm();
            const scrollContent = modal?.querySelector('.overflow-y-auto');
            scrollContent?.scrollTo({ top: 0, behavior: 'smooth' });
            this._openModal();
        });
        viewProgramsBtn?.addEventListener('click', () => {
            const attrHref = this.getAttribute('on-view-href');
            if (attrHref) window.location.href = attrHref;
        });

        // Input bindings for preview
        this._bindPreviewInputs();
    }

    _bindPreviewInputs() {
        const doc = this.shadowRoot;
        const ids = {
            name: `${this._uid}-name`,
            code: `${this._uid}-code`,
            desc: `${this._uid}-desc`,
            duration: `${this._uid}-duration`,
            img: `${this._uid}-img`,
        };

        const get = (id) => doc.getElementById(id);
        const setText = (id, text) => { const el = doc.getElementById(id); if (el) el.textContent = text; };
        const setSrc = (id, src) => { const el = doc.getElementById(id); if (el) el.src = src; };

        get(ids.name)?.addEventListener('input', (e) => setText(`${this._uid}-preview-name`, e.target.value || 'New Program'));
        get(ids.code)?.addEventListener('input', (e) => setText(`${this._uid}-preview-code`, e.target.value.toUpperCase() || 'CODE'));
        get(ids.desc)?.addEventListener('input', (e) => setText(`${this._uid}-preview-desc`, e.target.value || 'Program description will appear here...'));
        get(ids.duration)?.addEventListener('change', (e) => {
            const years = e.target.value || '4';
            setText(`${this._uid}-preview-duration`, `Duration: ${years} Year${years === '1' ? '' : 's'}`);
        });
        get(ids.img)?.addEventListener('input', (e) => {
            if (e.target.value) setSrc(`${this._uid}-preview-img`, e.target.value);
        });
    }

    _openModal() {
        const doc = this.shadowRoot;
        const backdrop = doc.getElementById(`${this._uid}-backdrop`);
        const modal = doc.getElementById(`${this._uid}-modal`);
        const panel = doc.getElementById(`${this._uid}-panel`);

        if (!backdrop || !modal) return;
        backdrop.classList.remove('opacity-0', 'pointer-events-none');
        backdrop.classList.add('opacity-100');

        modal.classList.remove('opacity-0', 'pointer-events-none');
        modal.classList.add('opacity-100');

        panel.classList.remove('modal-enter', 'modal-enter-active');
        void panel.offsetWidth; // reflow
        panel.classList.add('modal-enter', 'modal-enter-active');

        document.body.style.overflow = 'hidden';
    }

    _closeModal() {
        const doc = this.shadowRoot;
        const backdrop = doc.getElementById(`${this._uid}-backdrop`);
        const modal = doc.getElementById(`${this._uid}-modal`);
        const panel = doc.getElementById(`${this._uid}-panel`);

        if (!backdrop || !modal) return;

        panel.classList.remove('modal-enter', 'modal-enter-active');
        panel.classList.add('modal-exit', 'modal-exit-active');

        backdrop.classList.remove('backdrop-enter', 'backdrop-enter-active');
        backdrop.classList.add('backdrop-exit', 'backdrop-exit-active');

        modal.classList.add('pointer-events-none');

        setTimeout(() => {
            backdrop.classList.add('opacity-0');
            backdrop.classList.remove('opacity-100', 'backdrop-exit', 'backdrop-exit-active');

            modal.classList.add('opacity-0');
            modal.classList.remove('opacity-100');

            panel.classList.remove('modal-exit', 'modal-exit-active');

            document.body.style.overflow = '';
        }, 180);
    }

    _bootstrap() {
        // Initialize icons and preview specializations
        if (this._featherReady && window.feather) {
            this._updateFeather();
        }
        this._updatePreviewSpecializations();

        // Init AOS locally if present
        const doc = this.shadowRoot;
        const aosContainer = doc.querySelector('[data-aos]');
        if (aosContainer) {
            if (window.AOS) {
                window.AOS.init({ duration: 600, easing: 'ease-out-quad', once: true });
            } else {
                this._injectScript('https://unpkg.com/aos@2.3.1/dist/aos.js').then(() => {
                    window.AOS.init({ duration: 600, easing: 'ease-out-quad', once: true });
                }).catch(() => {});
            }
        }

        // Auth guard if Firebase is ready
        if (this._firebaseReady && window.firebase?.auth) {
            const auth = window.firebase.auth();
            auth.onAuthStateChanged(user => {
                if (!user) {
                    const fallback = this.getAttribute('on-auth-failure') || 'index.html';
                    window.location.href = fallback;
                }
            });
        }
    }

    _updateFeather() {
        const icons = this.shadowRoot.querySelectorAll('[data-feather]');
        window.feather.replace({ width: 16, height: 16 });
        icons.forEach(el => window.feather.replace({ width: parseInt(el.getAttribute('data-feather-size') || el.getAttribute('data-feather-width') || '16', 10), height: parseInt(el.getAttribute('data-feather-height') || '16', 10) }));
    }

    _addSpecialization() {
        const doc = this.shadowRoot;
        const container = doc.getElementById(`${this._uid}-spec-container`);
        if (!container) return;
        const wrap = doc.createElement('div');
        wrap.className = 'flex items-center gap-2';
        wrap.innerHTML = `
            <input type="text"
                   class="flex-1 form-input px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                   placeholder="Specialization name" />
            <button type="button" class="text-red-400 hover:text-red-300">
                <i data-feather="trash-2" class="w-4 h-4"></i>
            </button>
        `;
        const deleteBtn = wrap.querySelector('button');
        const input = wrap.querySelector('input');
        deleteBtn.addEventListener('click', () => {
            wrap.remove();
            this._updatePreviewSpecializations();
            this._updateFeather();
        });
        input.addEventListener('input', () => this._updatePreviewSpecializations());
        container.appendChild(wrap);
        this._updateFeather();
        this._updatePreviewSpecializations();
    }

    _randomizeImage() {
        const categories = ['technology', 'education', 'medical', 'science', 'finance', 'architecture', 'laboratory', 'workspace'];
        const category = categories[Math.floor(Math.random() * categories.length)];
        const width = 640;
        const height = 360;
        const seed = Math.floor(Math.random() * 1000);
        const imageUrl = `http://static.photos/${category}/${width}x${height}/${seed}`;

        const doc = this.shadowRoot;
        const imgInput = doc.getElementById(`${this._uid}-img`);
        const imgPrev = doc.getElementById(`${this._uid}-preview-img`);
        if (imgInput) imgInput.value = imageUrl;
        if (imgPrev) imgPrev.src = imageUrl;
    }

    _updatePreviewSpecializations() {
        const doc = this.shadowRoot;
        const container = doc.getElementById(`${this._uid}-spec-container`);
        const preview = doc.getElementById(`${this._uid}-preview-specs`);
        if (!container || !preview) return;

        preview.innerHTML = '';
        const inputs = Array.from(container.querySelectorAll('input'));
        const items = inputs.map(i => i.value.trim()).filter(Boolean);

        if (items.length === 0) {
            preview.innerHTML = '<span class="px-2 py-1 bg-slate-800/50 text-slate-300 rounded-full text-xs">General</span>';
            return;
        }

        items.forEach(item => {
            const span = doc.createElement('span');
            span.className = 'px-2 py-1 bg-slate-800/50 text-slate-300 rounded-full text-xs';
            span.textContent = item;
            preview.appendChild(span);
        });
    }

    _getDepartmentId() {
        const attr = this.getAttribute('dept-id');
        if (attr) return attr;
        try { return localStorage.getItem('currentDeptId'); } catch (e) { return null; }
    }

    async _handleSubmit(e) {
        e.preventDefault();
        if (!this._firebaseReady || !window.firebase?.firestore) {
            alert('Firebase Firestore is not configured or not available.');
            return;
        }

        const doc = this.shadowRoot;
        const form = doc.getElementById(`${this._uid}-form`);
        const submitBtn = doc.getElementById(`${this._uid}-submit`);

        const deptId = this._getDepartmentId();
        if (!deptId) {
            alert('Department not found. Please login again or provide dept-id attribute.');
            const fallback = this.getAttribute('on-auth-failure') || 'index.html';
            window.location.href = fallback;
            return;
        }

        const getVal = (id) => (doc.getElementById(`${this._uid}-${id}`)?.value || '').trim();
        const programName = getVal('name');
        const programCode = getVal('code');
        const programDesc = getVal('desc');
        const programDuration = parseInt(getVal('duration') || '4', 10);
        const programCredits = parseInt(getVal('credits') || '120', 10);
        const programImage = getVal('img') || 'http://static.photos/technology/640x360';

        const specInputs = Array.from(doc.querySelectorAll(`#${this._uid}-spec-container input`));
        const specializations = specInputs.map(i => i.value.trim()).filter(Boolean);
        const specializationsFinal = specializations.length ? specializations : ['General'];

        const db = window.firebase.firestore();

        const original = submitBtn.innerHTML;
        submitBtn.innerHTML = '<i data-feather="loader" class="animate-spin w-5 h-5"></i> Registering...';
        submitBtn.disabled = true;
        this._updateFeather();

        try {
            const programData = {
                name: programName,
                code: programCode.toUpperCase(),
                description: programDesc,
                duration: programDuration,
                credits: programCredits,
                imageUrl: programImage,
                specializations: specializationsFinal,
                createdAt: window.firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: window.firebase.firestore.FieldValue.serverTimestamp(),
            };

            await db.collection('departments').doc(deptId).collection('programs').add(programData);
            this._openSuccessModal();
            this._closeModal();
        } catch (err) {
            console.error('Error adding program:', err);
            alert('Failed to add program: ' + err.message);
        } finally {
            submitBtn.innerHTML = original;
            submitBtn.disabled = false;
            this._updateFeather();
        }
    }

    _openSuccessModal() {
        const doc = this.shadowRoot;
        const modal = doc.getElementById(`${this._uid}-success`);
        const panel = modal?.querySelector('div');
        if (!modal || !panel) return;
        modal.classList.remove('opacity-0', 'pointer-events-none');
        panel.classList.remove('scale-90');
    }

    _resetForm() {
        const doc = this.shadowRoot;
        const form = doc.getElementById(`${this._uid}-form`);
        const container = doc.getElementById(`${this._uid}-spec-container`);
        if (form) form.reset();
        if (container) container.innerHTML = '';
        this._updatePreviewSpecializations();

        // Reset preview to defaults
        const setText = (id, text) => { const el = doc.getElementById(`${this._uid}-${id}`); if (el) el.textContent = text; };
        setText('preview-name', 'New Program');
        setText('preview-code', 'CODE');
        setText('preview-desc', 'Program description will appear here...');
        setText('preview-duration', 'Duration: 4 Years');

        const imgPrev = doc.getElementById(`${this._uid}-preview-img`);
        if (imgPrev) imgPrev.src = 'http://static.photos/technology/640x360';
    }

    _deepMerge(target, ...sources) {
        if (!sources.length) return target;
        const source = sources.shift();
        if (this._isObject(target) && this._isObject(source)) {
            for (const key in source) {
                if (this._isObject(source[key])) {
                    if (!target[key]) Object.assign(target, { [key]: {} });
                    this._deepMerge(target[key], source[key]);
                } else {
                    Object.assign(target, { [key]: source[key] });
                }
            }
        }
        return this._deepMerge(target, ...sources);
    }

    _isObject(item) {
        return item && typeof item === 'object' && !Array.isArray(item);
    }

    _render() {
        const themeMode = (this.getAttribute('theme-mode') || this._defaultTheme).toLowerCase();
        const primary = (this.getAttribute('primary-color') || this._defaultPrimary);
        const secondary = (this.getAttribute('secondary-color') || this._defaultSecondary);
        const btnText = this.getAttribute('button-text') || 'Add Bachelor';
        const btnIcon = this.getAttribute('button-icon') || 'plus-circle';

        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    --primary: ${this._cssColorFromPaletteOrHex(primary, '#6366f1')};
                    --secondary: ${this._cssColorFromPaletteOrHex(secondary, '#8b5cf6')};
                    --accent: #ec4899;
                    display: inline-block;
                }
                .font-inter { font-family: 'Inter', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
                .html-body, .body { margin:0; padding:0; font-family: Inter, system-ui; }
                .min-h-screen { min-height: 100vh; }
                .flex { display:flex; }
                .items-center { align-items:center; }
                .justify-center { justify-content:center; }
                .p-6 { padding: 1.5rem; }

                /* Modal transitions */
                .modal-enter { opacity: 0; transform: scale(0.95); }
                .modal-enter-active { opacity: 1; transform: scale(1); transition: all 220ms ease-out; }
                .modal-exit { opacity: 1; transform: scale(1); }
                .modal-exit-active { opacity: 0; transform: scale(0.95); transition: all 180ms ease-in; }

                .backdrop-enter { opacity: 0; }
                .backdrop-enter-active { opacity: 1; transition: opacity 200ms ease-out; }
                .backdrop-exit { opacity: 1; }
                .backdrop-exit-active { opacity: 0; transition: opacity 160ms ease-in; }

                /* Glass card effect */
                .glass-card {
                    background: rgba(15, 23, 42, 0.6);
                    backdrop-filter: blur(10px);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
                    transition: all 0.3s ease;
                }
                .glass-card:hover {
                    transform: translateY(-2px);
                    box-shadow: 0 12px 24px rgba(99, 102, 241, 0.15);
                }

                /* Bachelor card styling */
                .bachelor-card {
                    perspective: 1000px;
                    transform-style: preserve-3d;
                    transition: all 0.5s ease;
                }
                .bachelor-card:hover { transform: translateY(-6px) scale(1.01); }
                .bachelor-card-inner {
                    position: relative; width: 100%; height: 100%;
                    transform-style: preserve-3d; transition: transform 0.6s;
                }
                .bachelor-card:hover .bachelor-card-inner { transform: rotateY(5deg) rotateX(5deg); }
                .bachelor-image { transform: rotate(-5deg); transition: all 0.5s ease; }
                .bachelor-card:hover .bachelor-image { transform: rotate(0deg) scale(1.05); }

                /* Gradient text */
                .gradient-text {
                    background: linear-gradient(90deg, var(--primary), var(--secondary));
                    -webkit-background-clip: text;
                    background-clip: text;
                    color: transparent;
                }

                /* Custom scrollbar */
                ::-webkit-scrollbar { width: 8px; }
                ::-webkit-scrollbar-track { background: rgba(15, 23, 42, 0.5); }
                ::-webkit-scrollbar-thumb { background: var(--primary); border-radius: 4px; }

                /* Input styling */
                .form-input {
                    background: rgba(15, 23, 42, 0.5);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    transition: all 0.3s ease;
                }
                .form-input:focus {
                    border-color: var(--primary);
                    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
                }

                /* Hover lift */
                .hover-lift { transition: transform 180ms ease, box-shadow 180ms ease; }
                .hover-lift:hover { transform: translateY(-1px); box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25); }

                /* Animations */
                @keyframes spin { to { transform: rotate(360deg); } }
                .animate-spin { animation: spin 1s linear infinite; }

                /* Success modal */
                .success-panel { transition: transform 0.5s ease; }
                .scale-90 { transform: scale(0.9); }

                /* Responsive image helper */
                .object-cover { object-fit: cover; }

                /* Line clamp helper */
                .line-clamp-3 {
                    display: -webkit-box;
                    -webkit-line-clamp: 3;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                }
            </style>

            <div class="body">
                <!-- Open Button -->
                <button id="${this._uid}-open" class="group relative inline-flex items-center gap-3 px-6 py-3.5 rounded-xl text-white font-semibold bg-gradient-to-br from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-4 focus:ring-primary/30 transition-all duration-200 shadow-lg hover:shadow-primary/30 hover-lift">
                    <span class="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                    <i data-feather="${btnIcon}" class="w-5 h-5"></i>
                    <span>${btnText}</span>
                </button>

                <!-- Modal Backdrop -->
                <div id="${this._uid}-backdrop" class="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm opacity-0 pointer-events-none transition-opacity duration-200"></div>

                <!-- Modal -->
                <div id="${this._uid}-modal" class="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 opacity-0 pointer-events-none transition-all duration-200">
                    <!-- Modal Panel -->
                    <div class="relative w-full max-w-7xl max-h-[92vh] overflow-hidden">
                        <div class="glass-card rounded-2xl shadow-2xl border border-white/10 modal-enter modal-enter-active" id="${this._uid}-panel">
                            <!-- Header -->
                            <div class="px-6 py-5 border-b border-white/10 flex items-center justify-between">
                                <div>
                                    <h1 class="text-xl sm:text-2xl font-bold text-white">
                                        <span class="gradient-text">Add New Bachelor Program</span>
                                    </h1>
                                    <p class="text-gray-400 text-sm">Register new undergraduate programs for your department</p>
                                </div>
                                <div class="flex items-center gap-2">
                                    <button id="${this._uid}-close" class="glass-card p-2 rounded-lg hover:bg-primary/10 transition-all" title="Close">
                                        <i data-feather="x" class="w-5 h-5 text-gray-300"></i>
                                    </button>
                                </div>
                            </div>

                            <!-- Scrollable Content -->
                            <div class="overflow-y-auto max-h-[calc(92vh-72px)]">
                                <main class="p-6">
                                    <!-- Two Column Layout -->
                                    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        <!-- Form Section -->
                                        <div class="lg:col-span-2">
                                            <div class="glass-card rounded-2xl p-6" data-aos="fade-right">
                                                <h2 class="text-lg font-bold text-white mb-4 flex items-center gap-2">
                                                    <i data-feather="plus-circle" class="text-primary-400"></i>
                                                    Program Details
                                                </h2>

                                                <form id="${this._uid}-form" class="space-y-5">
                                                    <!-- Program Name -->
                                                    <div>
                                                        <label for="${this._uid}-name" class="block text-sm font-medium text-gray-300 mb-2">Program Name</label>
                                                        <input type="text" id="${this._uid}-name"
                                                               class="w-full form-input px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                               placeholder="Bachelor of Medicine and Bachelor of Surgery (MBBS)" required />
                                                    </div>

                                                    <!-- Program Code -->
                                                    <div>
                                                        <label for="${this._uid}-code" class="block text-sm font-medium text-gray-300 mb-2">Program Code</label>
                                                        <input type="text" id="${this._uid}-code"
                                                               class="w-full form-input px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                               placeholder="MBBS" required />
                                                    </div>

                                                    <!-- Description -->
                                                    <div>
                                                        <label for="${this._uid}-desc" class="block text-sm font-medium text-gray-300 mb-2">Description</label>
                                                        <textarea id="${this._uid}-desc" rows="4"
                                                                  class="w-full form-input px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                                  placeholder="A comprehensive medical program that prepares students..."></textarea>
                                                    </div>

                                                    <!-- Duration and Credits -->
                                                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                        <div>
                                                            <label for="${this._uid}-duration" class="block text-sm font-medium text-gray-300 mb-2">Duration (Years)</label>
                                                            <select id="${this._uid}-duration"
                                                                    class="w-full form-input px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                                    required>
                                                                <option value="">Select duration</option>
                                                                <option value="1">1 Year</option>
                                                                <option value="2">2 Years</option>
                                                                <option value="3">3 Years</option>
                                                                <option value="4" selected>4 Years</option>
                                                                <option value="5">5 Years</option>
                                                                <option value="6">6 Years</option>
                                                            </select>
                                                        </div>
                                                        <div>
                                                            <label for="${this._uid}-credits" class="block text-sm font-medium text-gray-300 mb-2">Total Credits</label>
                                                            <input type="number" id="${this._uid}-credits"
                                                                   class="w-full form-input px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                                   placeholder="120" value="120" required />
                                                        </div>
                                                    </div>

                                                    <!-- Specializations -->
                                                    <div>
                                                        <label class="block text-sm font-medium text-gray-300 mb-2">Specializations (Optional)</label>
                                                        <div id="${this._uid}-spec-container" class="space-y-2"></div>
                                                        <button type="button" id="${this._uid}-add-spec" class="mt-2 text-sm text-primary-400 hover:text-primary-300 flex items-center gap-1">
                                                            <i data-feather="plus" class="w-4 h-4"></i>
                                                            Add Specialization
                                                        </button>
                                                    </div>

                                                    <!-- Image URL -->
                                                    <div>
                                                        <label for="${this._uid}-img" class="block text-sm font-medium text-gray-300 mb-2">Program Image (URL)</label>
                                                        <div class="flex items-center gap-2">
                                                            <input type="text" id="${this._uid}-img"
                                                                   class="flex-1 form-input px-4 py-3 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                                                                   placeholder="https://example.com/image.jpg"
                                                                   value="http://static.photos/technology/640x360" />
                                                            <button type="button" id="${this._uid}-random-img"
                                                                    class="glass-card px-3 py-3 rounded-lg hover:bg-primary-500/10 transition-all"
                                                                    title="Random Image">
                                                                <i data-feather="shuffle" class="w-4 h-4"></i>
                                                            </button>
                                                        </div>
                                                    </div>

                                                    <!-- Submit Button -->
                                                    <div class="pt-2">
                                                        <button type="submit" id="${this._uid}-submit"
                                                                class="w-full flex justify-center items-center gap-2 py-3.5 px-6 border border-transparent rounded-lg shadow-sm text-base font-medium text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-all duration-200">
                                                            <i data-feather="save" class="w-5 h-5"></i>
                                                            Register Program
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>

                                        <!-- Preview Section -->
                                        <div class="lg:col-span-1">
                                            <div class="sticky top-0 space-y-4">
                                                <!-- Program Preview -->
                                                <div class="glass-card rounded-2xl p-5" data-aos="fade-left">
                                                    <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                                        <i data-feather="eye" class="text-primary-400"></i>
                                                        Program Preview
                                                    </h2>

                                                    <p class="text-gray-400 text-sm mb-4">This is how your program will appear to students</p>

                                                    <div class="bachelor-card">
                                                        <div class="bachelor-card-inner glass-card rounded-xl overflow-hidden border border-slate-700/50 hover:border-primary-400/30 transition-all">
                                                            <!-- Program Image -->
                                                            <div class="relative h-36 sm:h-40 overflow-hidden">
                                                                <div class="absolute inset-0 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 z-10"></div>
                                                                <img src="http://static.photos/technology/640x360"
                                                                     alt="Program Preview" id="${this._uid}-preview-img"
                                                                     class="bachelor-image w-full h-full object-cover" />
                                                            </div>

                                                            <!-- Program Content -->
                                                            <div class="p-5">
                                                                <div class="flex justify-between items-start mb-2">
                                                                    <h3 id="${this._uid}-preview-name" class="text-lg sm:text-xl font-bold text-white">New Program</h3>
                                                                    <span id="${this._uid}-preview-code" class="px-2 py-1 bg-primary-500/20 text-primary-300 rounded-full text-xs font-medium">CODE</span>
                                                                </div>

                                                                <p id="${this._uid}-preview-duration" class="text-sm text-gray-400 mb-3">Duration: 4 Years</p>

                                                                <p id="${this._uid}-preview-desc" class="text-sm text-gray-300 line-clamp-3 mb-4">
                                                                    Program description will appear here...
                                                                </p>

                                                                <div class="flex flex-wrap gap-2" id="${this._uid}-preview-specs">
                                                                    <span class="px-2 py-1 bg-slate-800/50 text-slate-300 rounded-full text-xs">General</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                <!-- Tips Section -->
                                                <div class="glass-card rounded-2xl p-5" data-aos="fade-left" data-aos-delay="100">
                                                    <h2 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                                                        <i data-feather="info" class="text-emerald-400"></i>
                                                        Tips for Adding Programs
                                                    </h2>

                                                    <ul class="space-y-2.5 text-sm text-gray-400">
                                                        <li class="flex items-start gap-2">
                                                            <i data-feather="check-circle" class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"></i>
                                                            <span>Use clear and descriptive program names that students will recognize</span>
                                                        </li>
                                                        <li class="flex items-start gap-2">
                                                            <i data-feather="check-circle" class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"></i>
                                                            <span>Standard program codes help with administration and reporting</span>
                                                        </li>
                                                        <li class="flex items-start gap-2">
                                                            <i data-feather="check-circle" class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"></i>
                                                            <span>Highlight unique aspects of your program in the description</span>
                                                        </li>
                                                        <li class="flex items-start gap-2">
                                                            <i data-feather="check-circle" class="w-4 h-4 text-emerald-400 mt-0.5 flex-shrink-0"></i>
                                                            <span>Add specializations to show different tracks within your program</span>
                                                        </li>
                                                    </ul>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </main>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Success Modal -->
                <div id="${this._uid}-success" class="fixed inset-0 bg-black/70 flex items-center justify-center z-[60] opacity-0 pointer-events-none transition-opacity duration-300">
                    <div class="glass-card rounded-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 scale-90 success-panel">
                        <div class="text-center">
                            <div class="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <i data-feather="check-circle" class="w-10 h-10 text-emerald-400"></i>
                            </div>

                            <h3 class="text-2xl font-bold text-white mb-2">Program Added Successfully!</h3>
                            <p class="text-gray-400 mb-6">The new bachelor program has been registered in your department.</p>

                            <div class="flex gap-4 justify-center">
                                <button id="${this._uid}-add-another"
                                        class="px-6 py-3 rounded-lg flex items-center gap-2 text-white bg-gradient-to-r from-primary-500 to-secondary-500 hover:from-primary-600 hover:to-secondary-600 transition-all">
                                    <i data-feather="plus"></i>
                                    Add Another
                                </button>
                                <button id="${this._uid}-view-programs"
                                        class="px-6 py-3 rounded-lg flex items-center gap-2 text-white bg-slate-700 hover:bg-slate-600 transition-all">
                                    <i data-feather="list"></i>
                                    View Programs
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    _cssColorFromPaletteOrHex(token, fallbackHex) {
        if (!token) return fallbackHex;
        const t = token.trim();
        if (this._isHex(t)) return `#${t}`;
        const hex = this._paletteHex(t);
        return hex ? `#${hex}` : fallbackHex;
    }
}

customElements.define('add-bachelor-modal', AddBachelorModal);