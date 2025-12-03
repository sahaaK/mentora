// Firebase config
const firebaseConfig = {
    apiKey: "AIzaSyCPV_mXojZBR-Dew8RuZSi9jv9X6rc_D90",
    authDomain: "mentora-71f5c.firebaseapp.com",
    projectId: "mentora-71f5c",
    storageBucket: "mentora-71f5c.appspot.com",
    messagingSenderId: "16685388211",
    appId: "1:16685388211:web:7eed812660439dec7b3bc6",
    measurementId: "G-BL98PXGK2G"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();

// State
let classId = '';
let teachers = [];

// UI refs
const addTeacherBtn = document.getElementById('addTeacherBtn');
const addTeacherModal = document.getElementById('addTeacherModal');
const closeTeacherModal = document.getElementById('closeTeacherModal');
const cancelTeacherBtn = document.getElementById('cancelTeacherBtn');
const saveTeacherBtn = document.getElementById('saveTeacherBtn');
const teacherForm = document.getElementById('teacherForm');

const teachersGrid = document.getElementById('teachersGrid');
const teachersTotal = document.getElementById('teachersTotal');
const statTotal = document.getElementById('statTotal');
const statActive = document.getElementById('statActive');
const statPhd = document.getElementById('statPhd');
const statMaster = document.getElementById('statMaster');
const refreshBtn = document.getElementById('refreshBtn');
const searchInput = document.getElementById('searchInput');

const teacherDetailModal = document.getElementById('teacherDetailModal');
const closeDetailModal = document.getElementById('closeDetailModal');
const closeDetailBtn = document.getElementById('closeDetailBtn');

const deleteConfirmModal = document.getElementById('deleteConfirmModal');
const cancelDeleteBtn = document.getElementById('cancelDeleteBtn');
const confirmDeleteBtn = document.getElementById('confirmDeleteBtn');

const teacherImageInput = document.getElementById('teacherImageInput');
const teacherImagePreview = document.getElementById('teacherImagePreview');
let selectedImageDataUrl = null;
let teacherToDeleteId = null;

// Helpers
function getClassIdFromURL() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('classId');
}
// Create bubbles
        function createBubbles() {
            const container = document.querySelector('.bubble-container');
            const bubbleCount = 15;
            
            for (let i = 0; i < bubbleCount; i++) {
                const bubble = document.createElement('div');
                bubble.className = 'bubble';
                
                const size = Math.random() * 100 + 50;
                const left = Math.random() * 100;
                const top = Math.random() * 100;
                const delay = Math.random() * 10;
                
                bubble.style.width = `${size}px`;
                bubble.style.height = `${size}px`;
                bubble.style.left = `${left}%`;
                bubble.style.top = `${top}%`;
                bubble.style.animationDelay = `${delay}s`;
                
                container.appendChild(bubble);
            }
        }
function openModal(modal) {
    modal.classList.remove('opacity-0', 'pointer-events-none');
    document.body.style.overflow = 'hidden';
}

function closeModal(modal) {
    modal.classList.add('opacity-0', 'pointer-events-none');
    document.body.style.overflow = '';
}

// Image preview
teacherImageInput.addEventListener('change', (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file.');
        return;
    }
    if (file.size > 2 * 1024 * 1024) {
        alert('Image must be less than 2MB.');
        return;
    }
    const reader = new FileReader();
    reader.onload = () => {
        selectedImageDataUrl = reader.result;
        teacherImagePreview.innerHTML = `<img src="${selectedImageDataUrl}" alt="Preview" class="w-full h-full object-cover">`;
    };
    reader.readAsDataURL(file);
});

teacherImagePreview.addEventListener('click', () => teacherImageInput.click());

// Load teachers from Firestore
async function fetchTeachers() {
    const deptId = localStorage.getItem('currentDeptId');
    if (!classId || !deptId) return;

    try {
        const snapshot = await db.collection('departments').doc(deptId).collection('classes').doc(classId).collection('teachers').orderBy('createdAt', 'desc').get();
        teachers = [];
        snapshot.forEach(doc => teachers.push({ id: doc.id, ...doc.data() }));
        renderTeachers();
    } catch (error) {
        console.error("Error fetching teachers:", error);
    }
}

// Add teacher to Firestore
async function addTeacher(teacherData) {
    const deptId = localStorage.getItem('currentDeptId');
    if (!classId || !deptId) return;

    try {
        // --- Create a Firebase Auth user for the teacher (if possible) ---
        // NOTE: This uses the client SDK and requires Email/Password sign-in enabled
        // in your Firebase project settings. For production you should use
        // a server-side Admin SDK (Cloud Function) to create users and set custom
        // claims for roles to avoid exposing privileges in client code.
        let authUid = null;
        try {
            // create the auth user (will throw if email already exists or other auth errors)
            const userCredential = await firebase.auth().createUserWithEmailAndPassword(teacherData.email, teacherData.password);
            authUid = userCredential.user && userCredential.user.uid;
            // set display name on auth profile (optional)
            if (userCredential.user && teacherData.name) {
                try { await userCredential.user.updateProfile({ displayName: teacherData.name }); } catch(e) { /* ignore */ }
                // optionally send verification email
                try { await userCredential.user.sendEmailVerification(); } catch(e) { /* ignore */ }
            }
        } catch (authErr) {
            // Re-throw certain auth errors so caller can show a proper message
            console.error('Auth create user failed:', authErr);
            throw authErr; // bubble up so UI informs user
        }

        // Do not persist raw password in Firestore; remove before storing
        const { password, ...persist } = teacherData;
        // include the auth UID for reference and avoid storing sensitive info
        if (authUid) persist.authUid = authUid;

        await db.collection('departments').doc(deptId).collection('classes').doc(classId).collection('teachers').add({
            ...persist,
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            active: true
        });
        closeModal(addTeacherModal);
        resetTeacherForm();
        fetchTeachers();
        alert('Teacher registered successfully.');
    } catch (error) {
        console.error("Error adding teacher:", error);
        // Friendly messages for common Auth errors
        if (error && error.code) {
            if (error.code === 'auth/email-already-in-use') {
                alert('That email is already in use by another account. Please choose a different email.');
                return;
            }
            if (error.code === 'auth/invalid-email') {
                alert('Please provide a valid email address.');
                return;
            }
            if (error.code === 'auth/weak-password') {
                alert('Password is too weak — try something longer and more complex.');
                return;
            }
        }

        alert("Failed to register teacher. Please try again.");
    }
}

// Delete teacher
async function deleteTeacher(id) {
    const deptId = localStorage.getItem('currentDeptId');
    if (!classId || !deptId) return;
    try {
        await db.collection('departments').doc(deptId).collection('classes').doc(classId).collection('teachers').doc(id).delete();
        closeModal(deleteConfirmModal);
        teacherToDeleteId = null;
        fetchTeachers();
        alert('Teacher deleted.');
    } catch (error) {
        console.error("Error deleting teacher:", error);
        alert("Failed to delete teacher.");
    }
}

// Render teachers grid
function renderTeachers() {
    const q = (searchInput.value || '').toLowerCase().trim();
    const filtered = teachers.filter(t =>
        !q || [t.name, t.email, t.specialty, t.degree].filter(Boolean).some(v => v.toLowerCase().includes(q))
    );

    teachersTotal.textContent = filtered.length;
    statTotal.textContent = filtered.length;

    if (filtered.length === 0) {
        teachersGrid.innerHTML = `
            <div class="glass-card p-8 text-center col-span-full">
                <i data-feather="users" class="w-12 h-12 text-gray-500 mx-auto mb-4"></i>
                <h3 class="text-xl font-semibold text-gray-300 mb-2">No Teachers Found</h3>
                <p class="text-gray-400">Click "Add Teacher" to register your first faculty member</p>
            </div>
        `;
        feather.replace();
        return;
    }

    teachersGrid.innerHTML = filtered.map(teacher => {
        const degree = teacher.degree || '—';
        const email = teacher.email || '—';
        const phone = teacher.phone || '—';
        const specialty = teacher.specialty || '—';
        const img = teacher.imageUrl || 'http://static.photos/people/320x240/5';

        // Fake metrics for demo purposes
        const rating = (80 + Math.floor(Math.random() * 20));
        const courses = Math.floor(Math.random() * 5) + 1;
        const satisfaction = (85 + Math.floor(Math.random() * 15));
        const engagement = (70 + Math.floor(Math.random() * 30));
        const performance = (60 + Math.floor(Math.random() * 40));

        return `
            <div class="glass-card  p-5 group cursor-pointer animate-slide-up" data-teacher-id="${teacher.id}">
                <div class="flex items-center gap-4 mb-4">
                    <div class="faculty-img w-16 h-16 rounded-xl overflow-hidden">
                        <img src="${img}" alt="${teacher.name}" class="w-full h-full object-cover">
                    </div>
                    <div class="flex-1 min-w-0">
                        <h3 class="font-bold truncate">${teacher.name}</h3>
                        <p class="text-sm text-gray-400 truncate">${specialty}</p>
                        <span class="inline-block mt-1 px-2 py-0.5 text-xs rounded-full teacher-badge ${degree.toLowerCase()}">
                            ${degree}
                        </span>
                    </div>
                </div>

                <div class="space-y-2 mb-4 text-sm">
                    <div class="flex justify-between">
                        <span class="text-gray-400">Email:</span>
                        <span class="truncate max-w-[55%]">${email}</span>
                    </div>
                    <div class="flex justify-between">
                        <span class="text-gray-400">Phone:</span>
                        <span>${phone}</span>
                    </div>
                    <div class="mt-2">
                        <div class="flex justify-between text-xs text-gray-400 mb-1">
                            <span>Performance</span>
                            <span>${performance}%</span>
                        </div>
                        <div class="performance-bar h-2">
                            <div class="performance-fill" style="width:${performance}%"></div>
                        </div>
                    </div>
                </div>

                <div class="grid grid-cols-3 gap-2 mb-4">
                    <div class="metric">
                        <div class="metric-value">${courses}</div>
                        <div class="metric-label">Courses</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${satisfaction}%</div>
                        <div class="metric-label">Satisfaction</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${rating}</div>
                        <div class="metric-label">Rating</div>
                    </div>
                </div>

                <div class="flex items-center gap-2">
                    <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-all view-btn" data-id="${teacher.id}">
                        <i data-feather="eye"></i>
                        View
                    </button>
                    <button class="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-all edit-btn" data-id="${teacher.id}">
                        <i data-feather="edit-2"></i>
                    </button>
                    <button class="px-3 py-2 glass rounded-lg hover:bg-rose-500/20 text-rose-300 transition-all delete-btn" data-id="${teacher.id}">
                        <i data-feather="trash-2"></i>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    feather.replace();
    AOS.init({ once: true, duration: 400 });

    // Wire action buttons
    document.querySelectorAll('.view-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = e.currentTarget.dataset.id;
            const t = teachers.find(x => x.id === id);
            if (t) openTeacherDetail(t);
        });
    });
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            teacherToDeleteId = e.currentTarget.dataset.id;
            openModal(deleteConfirmModal);
        });
    });
    document.querySelectorAll('.edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            alert('Edit flow can be implemented here.');
        });
    });
}

// Open detail modal with mock metrics
function openTeacherDetail(teacher) {
    document.getElementById('detailTeacherName').textContent = teacher.name || '—';
    document.getElementById('detailTeacherSpecialty').textContent = teacher.specialty || '—';
    document.getElementById('detailTeacherDegree').textContent = teacher.degree ? `Degree: ${teacher.degree}` : '—';
    document.getElementById('detailTeacherEmail').textContent = teacher.email || '—';
    document.getElementById('detailTeacherPhone').textContent = teacher.phone || '—';
    document.getElementById('detailTeacherUsername').textContent = teacher.username || '—';
    document.getElementById('detailTeacherImage').src = teacher.imageUrl || 'http://static.photos/people/320x240/5';

    const engagement = 70 + Math.floor(Math.random() * 30);
    const bar = document.getElementById('detailEngagementBar');
    bar.style.width = `${engagement}%`;

    openModal(teacherDetailModal);
}

// Reset form
function resetTeacherForm() {
    // If teacherForm exists, use reset(); otherwise clear fields individually
    if (teacherForm && typeof teacherForm.reset === 'function') {
        teacherForm.reset();
    } else {
        // fallback: clear inputs by id
        const ids = ['teacherName','teacherEmail','teacherPhone','teacherDegree','teacherSpecialty','teacherUsername','teacherPassword'];
        ids.forEach(id => {
            const e = document.getElementById(id);
            if (e) {
                if (e.tagName === 'SELECT') e.selectedIndex = 0;
                else e.value = '';
            }
        });
    }
    teacherImagePreview.innerHTML = `
        <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
            <i data-feather="upload-cloud" class="w-8 h-8 mb-2"></i>
            <p class="text-sm">Click to upload</p>
            <p class="text-xs">PNG, JPG up to 2MB</p>
        </div>
    `;
    selectedImageDataUrl = null;
    feather.replace();
}

// Event bindings
addTeacherBtn.addEventListener('click', () => openModal(addTeacherModal));
closeTeacherModal.addEventListener('click', () => closeModal(addTeacherModal));
cancelTeacherBtn.addEventListener('click', () => closeModal(addTeacherModal));
document.querySelector('#addTeacherModal .absolute.inset-0.bg-black\\/70').addEventListener('click', () => closeModal(addTeacherModal));

closeDetailModal.addEventListener('click', () => closeModal(teacherDetailModal));
closeDetailBtn.addEventListener('click', () => closeModal(teacherDetailModal));
document.querySelector('#teacherDetailModal .absolute.inset-0.bg-black\\/70').addEventListener('click', () => closeModal(teacherDetailModal));

cancelDeleteBtn.addEventListener('click', () => {
    teacherToDeleteId = null;
    closeModal(deleteConfirmModal);
});
confirmDeleteBtn.addEventListener('click', () => {
    if (teacherToDeleteId) deleteTeacher(teacherToDeleteId);
});
document.querySelector('#deleteConfirmModal .absolute.inset-0.bg-black\\/70').addEventListener('click', () => {
    teacherToDeleteId = null;
    closeModal(deleteConfirmModal);
});

// Save teacher
saveTeacherBtn.addEventListener('click', async () => {
    const teacherData = {
        name: document.getElementById('teacherName').value.trim(),
        email: document.getElementById('teacherEmail').value.trim(),
        phone: document.getElementById('teacherPhone').value.trim(),
        degree: document.getElementById('teacherDegree').value,
        specialty: document.getElementById('teacherSpecialty').value.trim(),
        username: document.getElementById('teacherUsername').value.trim(),
        password: document.getElementById('teacherPassword').value,
        imageUrl: selectedImageDataUrl || ''
    };

    if (!teacherData.name || !teacherData.email || !teacherData.degree || !teacherData.username || !teacherData.password) {
        alert('Please fill in all required fields.');
        return;
    }

    await addTeacher(teacherData);
});

// Search
searchInput.addEventListener('input', () => renderTeachers());

// Refresh
refreshBtn.addEventListener('click', () => fetchTeachers());

// Close modals with Escape
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        [addTeacherModal, teacherDetailModal, deleteConfirmModal].forEach(m => {
            if (!m.classList.contains('opacity-0')) closeModal(m);
        });
    }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    // Resolve classId: prefer URL param, then fall back to localStorage
    const urlClassId = getClassIdFromURL();
    const storedClassId = localStorage.getItem('currentClassId');

    if (urlClassId) {
        classId = urlClassId;
        // Persist for future navigations so the page won't lose the class context
        localStorage.setItem('currentClassId', classId);
    } else if (storedClassId) {
        classId = storedClassId;
    } else {
        console.error('No class ID provided in URL or localStorage');
        return;
    }

    // Create background bubbles and load data
    try { createBubbles(); } catch (e) { /* ignore if not present */ }
    fetchTeachers();
});