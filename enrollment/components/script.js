/* Firebase and App Init */
let db;
let storage;
let appStart = Date.now();

const firebaseConfig = {
    apiKey: "AIzaSyCPV_mXojZBR-Dew8RuZSi9jv9X6rc_D90",
    authDomain: "mentora-71f5c.firebaseapp.com",
    projectId: "mentora-71f5c",
    storageBucket: "mentora-71f5c.appspot.com",
    messagingSenderId: "16685388211",
    appId: "1:16685388211:web:7eed812660439dec7b3bc6",
    measurementId: "G-BL98PXGK2G"
};

/* Department -> Faculty mapping */
const facultyOptions = {
    medicine: [
        "Bachelor of Medicine and Surgery (MBBS)",
        "Bachelor of Clinical Medicine",
        "Bachelor of Clinical Midwifery",
        "Bachelor of Medical Laboratory",
        "Bachelor of Nursing",
        "Bachelor of Nutrition and Food Science",
        "Bachelor of Health Service Management"
    ],
    business: [
        "Bachelor of Business Administration",
        "Bachelor of Accounting & Finance",
        "Bachelor of Banking & Finance",
        "Bachelor of Procurement & Supply Chain Management",
        "Bachelor of Public Finance Management",
        "Bachelor of Human Resources Management"
    ],
    social: [
        "Bachelor of Public Administration",
        "Bachelor of Social Work & Social Administration",
        "Bachelor of Economics",
        "Bachelor of Strategic and Security Studies"
    ],
    marine: [
        "Bachelor of Climate Change and Environmental Studies"
    ],
    agriculture: [
        "Bachelor of Science in Agriculture",
        "Bachelor of Veterinary Medicine"
    ],
    technology: [
        "Bachelor of Computer Science (Software Engineering)",
        "Bachelor of Computer Science (Data Science)",
        "Bachelor of Computer Science (Cyber Security)",
        "Bachelor of Computer Science (Artificial Intelligence)",
        "Bachelor of Computer Science (Networking)",
        "Bachelor of Engineering (Electrical Engineering)",
        "Bachelor of Engineering (Telecommunication Engineering)"
    ]
};

/* Utility */
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    text.textContent = message;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function setLoading(btn, isLoading, loadingText = 'Submitting...') {
    if (isLoading) {
        btn.disabled = true;
        btn.innerHTML = `<span class="flex items-center justify-center gap-2"><span>${loadingText}</span><div class="w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin"></div></span>`;
    } else {
        btn.disabled = false;
        btn.innerHTML = `<span class="flex items-center justify-center gap-2"><span>${btn.dataset.label || 'Submit'}</span><i data-feather="arrow-right" class="w-4 h-4 group-hover:translate-x-1 transition-transform"></i></span>`;
    }
}

/* Image Slider */
function initSlider() {
    let currentSlide = 0;
    const slides = document.querySelectorAll('.slide');
    const indicators = document.querySelectorAll('.slide-indicator');

    function showSlide(n) {
        slides.forEach(slide => slide.classList.remove('active'));
        indicators.forEach(indicator => indicator.classList.remove('active'));
        
        if (n >= slides.length) currentSlide = 0;
        if (n < 0) currentSlide = slides.length - 1;
        
        slides[currentSlide].classList.add('active');
        indicators[currentSlide].classList.add('active');
    }

    function nextSlide() {
        currentSlide++;
        showSlide(currentSlide);
    }

    setInterval(nextSlide, 5000);

    indicators.forEach((indicator, index) => {
        indicator.addEventListener('click', () => {
            currentSlide = index;
            showSlide(currentSlide);
        });
    });
}

/* Profile picture upload */
let selectedProfileFile = null;

function initProfileUpload() {
    const profileInput = document.getElementById('profilePicture');
    const profilePreview = document.getElementById('profilePreview');

    const defaultProfileSrc = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';

    profileInput.addEventListener('change', function(event) {
        const file = event.target.files[0];
        if (file) {
            selectedProfileFile = file; // Store the file for later upload

            // Validate file type and size
            const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp'];
            if (!validTypes.includes(file.type)) {
                showToast('Please select a valid image file (JPEG, PNG, JPG, WEBP)', 'error');
                profileInput.value = '';
                return;
            }

            if (file.size > 5 * 1024 * 1024) { // 5MB limit for pre-processing
                showToast('Image size should be less than 5MB', 'error');
                profileInput.value = '';
                return;
            }

            const reader = new FileReader();
            reader.onload = function(e) {
                profilePreview.src = e.target.result;
                const formPreview = document.getElementById('formProfilePreview');
                if (formPreview) formPreview.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    });

    // Wire the choose/clear buttons inside the form (if they exist)
    const btnChoose = document.getElementById('btnChooseProfile');
    const btnClear = document.getElementById('btnClearProfile');

    if (btnChoose) btnChoose.addEventListener('click', () => profileInput.click());

    if (btnClear) btnClear.addEventListener('click', () => {
        profileInput.value = '';
        selectedProfileFile = null;
        profilePreview.src = defaultProfileSrc;
        const formPreview = document.getElementById('formProfilePreview');
        if (formPreview) formPreview.src = defaultProfileSrc;
    });
}

/* Image compression for Firestore storage as DataURL */
async function prepareImageDataForFirestore(file, options = {}) {
    if (!file) return null;

    const {
        maxDim = 512,       // max width or height
        quality = 0.82,     // JPEG quality
        mime = 'image/jpeg' // output format
    } = options;

    // Read file as DataURL
    const dataUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
    });

    // Load into Image for resizing
    const img = await new Promise((resolve, reject) => {
        const image = new Image();
        image.onload = () => resolve(image);
        image.onerror = () => reject(new Error('Failed to load image'));
        image.src = dataUrl;
    });

    const { width, height } = img;
    const maxSide = Math.max(width, height);
    let targetW = width;
    let targetH = height;

    if (maxSide > maxDim) {
        const scale = maxDim / maxSide;
        targetW = Math.round(width * scale);
        targetH = Math.round(height * scale);
    }

    const canvas = document.createElement('canvas');
    canvas.width = targetW;
    canvas.height = targetH;
    const ctx = canvas.getContext('2d');

    // Fill with white background to avoid black background for transparent PNGs
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, targetW, targetH);

    ctx.drawImage(img, 0, 0, targetW, targetH);

    const outDataUrl = canvas.toDataURL(mime, quality);
    return outDataUrl;
}

function getDataUrlByteLength(dataUrl) {
    try {
        const base64 = (dataUrl.split(',')[1] || '');
        return base64 ? atob(base64).length : 0;
    } catch (e) {
        return 0;
    }
}

/* Handle profile image -> store in Firestore as DataURL (no Firebase Storage) */
async function handleProfileImageForStudent(studentId, file) {
    if (!file) return null;

    try {
        const prepared = await prepareImageDataForFirestore(file, {
            maxDim: 512,
            quality: 0.82,
            mime: 'image/jpeg'
        });

        const byteLength = getDataUrlByteLength(prepared);
        // Firestore document limit is ~1 MiB. We stay conservative with a safety margin.
        const FIRESTORE_SAFE_BYTES = 900 * 1024; // ~900KB

        if (byteLength > FIRESTORE_SAFE_BYTES) {
            showToast('Compressed image still too large for Firestore. Please choose a smaller image.', 'error');
            return null;
        }

        await db.collection('students').doc(studentId).update({
            profileImageData: prepared,
            profileImageName: file.name,
            profileImageType: file.type || 'image/jpeg',
            profileImageSize: file.size
        });

        return prepared;
    } catch (err) {
        console.error('Error storing profile image in Firestore:', err);
        showToast('Failed to store profile image in Firestore.', 'error');
        return null;
    }
}

/* Department change updates faculty options */
function initDepartmentFacultyLink() {
    const departmentSelect = document.getElementById('department');
    const facultySelect = document.getElementById('faculty');

    departmentSelect.addEventListener('change', function() {
        const selected = this.value;
        facultySelect.innerHTML = '<option value="" disabled selected>Select Faculty</option>';
        if (selected && facultyOptions[selected]) {
            facultyOptions[selected].forEach(faculty => {
                const option = document.createElement('option');
                option.value = faculty;
                option.textContent = faculty;
                facultySelect.appendChild(option);
            });
        }
    });
}

/* Firestore helpers */
function sanitizeStudentData(raw) {
    return {
        fullName: raw.fullName || '',
        phone: raw.phone || '',
        department: raw.department || '',
        faculty: raw.faculty || '',
        graduatedFrom: raw.graduatedFrom || '',
        grade: raw.grade || '',
        city: raw.city || '',
        education: raw.education || '',
        gender: raw.gender || '',
        bloodType: raw.bloodType || '',
        age: parseInt(raw.age || 0, 10),
        guardianPhone: raw.guardianPhone || '',
        guardianName: raw.guardianName || '',
        profileImageUrl: raw.profileImageUrl || '',
        profileImageData: raw.profileImageData || '',
        profileImageName: raw.profileImageName || '',
        profileImageType: raw.profileImageType || '',
        profileImageSize: raw.profileImageSize || 0,
        createdAt: new Date()
    };
}

async function saveStudent(student) {
    // Defensive: ensure Firestore is initialized
    if (typeof db === 'undefined' || db === null) {
        // Try to initialize from global firebase if available
        if (window.firebase && firebase.firestore) {
            db = firebase.firestore();
        } else {
            throw new Error('Firestore is not initialized. Ensure firebase.initializeApp(...) runs before saving students.');
        }
    }

    const docRef = db.collection('students').doc();
    await docRef.set(student);
    return docRef.id;
}

async function saveBulkStudents(list) {
    const batchSize = 400; // Firestore limit
    let count = 0;

    for (let i = 0; i < list.length; i += batchSize) {
        const batch = db.batch();
        const chunk = list.slice(i, i + batchSize);

        chunk.forEach(item => {
            const ref = db.collection('students').doc();
            batch.set(ref, item);
        });

        await batch.commit();
        count += chunk.length;
        await new Promise(r => setTimeout(r, 50)); // small pause
    }

    return count;
}

function normalizeHeader(h) {
    return String(h || '')
        .trim()
        .toLowerCase()
        .replace(/\s+/g, '')
        .replace(/[_\-]/g, '');
}

/* Import */
function initImport() {
    const btn = document.getElementById('btnImport');
    const fileInput = document.getElementById('bulkFileInput');

    btn.addEventListener('click', () => fileInput.click());
    fileInput.addEventListener('change', handleImportFile);
}

async function handleImportFile(evt) {
    const file = evt.target.files[0];
    if (!file) return;

    try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data);
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        // Map columns to expected keys
        const mapped = rows.map(r => {
            const obj = {};
            const keys = Object.keys(r);
            keys.forEach(k => obj[normalizeHeader(k)] = r[k]);
            return {
                fullName: obj.fullname || obj.name || '',
                phone: obj.phone || obj.phonenumber || '',
                department: obj.department || '',
                faculty: obj.faculty || '',
                graduatedFrom: obj.graduatedfrom || obj.school || '',
                grade: obj.grade || '',
                city: obj.city || '',
                education: obj.education || obj.educationlevel || '',
                gender: obj.gender || '',
                bloodType: obj.bloodtype || '',
                age: obj.age || '',
                guardianPhone: obj.guardianphone || '',
                guardianName: obj.guardianname || '',
                profileImageUrl: obj.profileimageurl || '',
                profileImageData: obj.profileimagedata || '',
                profileImageName: obj.profileimagename || '',
                profileImageType: obj.profileimagetype || '',
                profileImageSize: obj.profileimagesize || 0
            };
        });

        // Basic validation
        const requiredFields = ['fullName', 'phone', 'department', 'faculty', 'graduatedFrom', 'grade', 'city', 'education', 'gender', 'bloodType', 'age', 'guardianPhone', 'guardianName'];
        const invalidRows = mapped.filter(row => requiredFields.some(f => !row[f] || String(row[f]).trim() === ''));
        if (invalidRows.length > 0) {
            showToast(`Import stopped. ${invalidRows.length} row(s) missing required fields.`, 'error');
            return;
        }

        const students = mapped.map(sanitizeStudentData);
        const savedCount = await saveBulkStudents(students);

        showToast(`Imported ${savedCount} student(s) successfully.`);
        evt.target.value = '';
    } catch (err) {
        console.error(err);
        showToast('Failed to import file. Check console for details.', 'error');
    }
}

/* Export */
function initExport() {
    const btn = document.getElementById('btnExport');
    btn.addEventListener('click', exportStudents);
}

/* Helper: read file as DataURL (returns Promise<string>) */
function readFileAsDataURL(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onerror = () => {
            reader.abort();
            reject(new Error('Failed to read file'));
        };
        reader.onload = () => resolve(String(reader.result));
        reader.readAsDataURL(file);
    });
}

/* Excel cell length helper (Excel max per-cell text = 32,767 characters) */
const MAX_EXCEL_CELL = 32767;
function truncateText(value, max = MAX_EXCEL_CELL) {
    if (value === null || value === undefined) return '';
    let s;
    if (typeof value === 'string') s = value;
    else if (value instanceof Date) s = value.toISOString();
    else {
        try {
            s = String(value);
        } catch (e) {
            try { s = JSON.stringify(value); } catch (e2) { s = '' + value; }
        }
    }
    if (s.length > max) return s.slice(0, max);
    return s;
}


async function exportStudents() {
    try {
        const snap = await db.collection('students').get();
        const rows = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        if (rows.length === 0) {
            showToast('No students to export.', 'error');
            return;
        }

        // Prepare worksheet with desired columns
        const headers = [
            'id','fullName','phone','department','faculty','graduatedFrom',
            'grade','city','education','gender','bloodType','age','guardianPhone',
            'guardianName','profileImageUrl','profileImageData','profileImageName','profileImageType','profileImageSize','createdAt'
        ];

        const data = rows.map(r => {
            const obj = {};
            headers.forEach(h => {
                let v = r[h];
                if (h === 'createdAt' && v && v.toDate) {
                    v = v.toDate().toISOString();
                }

                // Convert non-strings safely, then truncate long text to Excel cell limit
                if (v === null || v === undefined) {
                    obj[h] = '';
                    return;
                }

                // If this is the profileImageData (potentially huge base64), avoid writing full blob
                if (h === 'profileImageData' && typeof v === 'string' && v.length > 2000) {
                    // store a short placeholder with size info
                    obj[h] = `[DATA_URL_TRUNCATED length=${v.length}]`;
                    console.warn(`Export: truncated profileImageData for student ${r.id} (original length=${v.length})`);
                    return;
                }

                // Ensure we have a string and truncate if needed
                let vs;
                if (typeof v === 'string') vs = v;
                else if (v instanceof Date) vs = v.toISOString();
                else {
                    try { vs = String(v); } catch (e) { try { vs = JSON.stringify(v); } catch(e2) { vs = '' + v; } }
                }

                if (vs.length > MAX_EXCEL_CELL) {
                    console.warn(`Export: truncating field '${h}' for student ${r.id} from ${vs.length} to ${MAX_EXCEL_CELL} chars`);
                    vs = vs.slice(0, MAX_EXCEL_CELL);
                }

                obj[h] = vs;
            });
            return obj;
        });

        const worksheet = XLSX.utils.json_to_sheet(data);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');

        const fileName = `students_export_${new Date().toISOString().slice(0,10)}.xlsx`;
        XLSX.writeFile(workbook, fileName);

        showToast(`Exported ${rows.length} student(s).`);
    } catch (err) {
        console.error(err);
        showToast('Export failed. See console for details.', 'error');
    }

    
}

/* System Health (Realtime demo) */
function initSystemHealth() {
    const serverBar = document.getElementById('serverBar');
    const serverLoad = document.getElementById('serverLoad');
    const latency = document.getElementById('latency');
    const uptime = document.getElementById('uptime');

    // Simulated real-time telemetry with easing
    let currentLoad = 35;
    const update = () => {
        const target = Math.floor(Math.random() * 100);
        const duration = 1.2;

        gsap.to({ val: currentLoad }, {
            val: target,
            duration,
            ease: "power2.out",
            onUpdate: function() {
                const v = Math.round(this.targets()[0].val);
                serverBar.style.width = `${v}%`;
                serverLoad.textContent = `${v}%`;
            },
            onComplete: () => { currentLoad = target; }
        });

        const ping = Math.floor(20 + Math.random() * 180);
        latency.textContent = `${ping} ms`;

        const days = Math.floor((Date.now() - appStart) / (1000 * 60 * 60 * 24));
        uptime.textContent = `${days}d`;
    };

    update();
    setInterval(update, 3000);
}

/* Form submit -> Firestore (profile image stored in Firestore as DataURL) */
function initForm() {
    const form = document.getElementById('studentForm');
    const submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.dataset.label = 'Register Student';

    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!form.checkValidity()) {
            const firstInvalid = form.querySelector(':invalid');
            if (firstInvalid) {
                firstInvalid.focus({ preventScroll: false });
                firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
            return;
        }

        try {
            setLoading(submitBtn, true, 'Submitting...');
            const raw = Object.fromEntries(new FormData(form).entries());
            const student = sanitizeStudentData(raw);

            // First save the student to get an ID
            const studentId = await saveStudent(student);

            // If a profile image is selected, compress and store it directly in Firestore as DataURL
            if (selectedProfileFile) {
                await handleProfileImageForStudent(studentId, selectedProfileFile);
            }

            showToast('Student registered successfully.');
            form.reset();

            // Reset profile preview to default
            const defaultProfileSrc = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
            const p = document.getElementById('profilePreview');
            if (p) p.src = defaultProfileSrc;
            const fp = document.getElementById('formProfilePreview');
            if (fp) fp.src = defaultProfileSrc;
            selectedProfileFile = null;
        } catch (err) {
            console.error(err);
            showToast('Registration failed. See console.', 'error');
        } finally {
            setLoading(submitBtn, false);
        }
    });
}

/* Initialize App */
document.addEventListener('DOMContentLoaded', () => {
    // Replace feather icons
    if (window.feather) feather.replace();

    // Init
    AOS.init();

    // Initialize Firebase early so any init handlers that interact with Firestore/Storage
    // (for example, form submit, import/export) will have `db` and `storage` available.
    try {
        if (!window.firebase) {
            console.warn('Firebase SDK not found. Firestore/storage will not be available.');
        } else {
            // Some environments may not support optional chaining; use safe checks
            const appsExist = Array.isArray(firebase.apps) ? firebase.apps.length > 0 : (firebase.apps && Object.keys(firebase.apps).length > 0);
            if (!appsExist) {
                firebase.initializeApp(firebaseConfig);
            }
            db = firebase.firestore();
            storage = firebase.storage();
        }
    } catch (err) {
        console.error('Firebase initialization failed:', err);
    }

    // Remaining initializers that may use db/storage
    initSlider();
    initProfileUpload();
    initDepartmentFacultyLink();
    initForm();
    initImport();
    initExport();
    initSystemHealth();

    // Small affordances for actions
    document.getElementById('btnDashboard').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Dashboard coming soon!');
    });
    document.getElementById('btnSettings').addEventListener('click', (e) => {
        e.preventDefault();
        showToast('Settings coming soon!');
    });
});