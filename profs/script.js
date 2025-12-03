// Firebase config (same project as registration dashboard)
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
const auth = firebase.auth();

// State
let currentUser = null;
let currentTeacherDoc = null; // Firestore teacher document
let selectedClassId = null;
let classes = [];
let courses = [];

// UI refs
const loginView = document.getElementById('loginView');
const appView = document.getElementById('appView');
const loginForm = document.getElementById('loginForm');
const loginIdentity = document.getElementById('loginIdentity');
const loginPassword = document.getElementById('loginPassword');
const togglePassword = document.getElementById('togglePassword');
const loginBtn = document.getElementById('loginBtn');
const loginError = document.getElementById('loginError');

const headerSubtitle = document.getElementById('headerSubtitle');
const userAvatar = document.getElementById('userAvatar');
const logoutBtn = document.getElementById('logoutBtn');
const refreshBtn = document.getElementById('refreshBtn');

const classesContainer = document.getElementById('classesContainer');
const classesCount = document.getElementById('classesCount');
const addCourseBtn = document.getElementById('addCourseBtn');
const exportBtn = document.getElementById('exportBtn');
const courseSearchInput = document.getElementById('courseSearchInput');

const selectedClassSummary = document.getElementById('selectedClassSummary');
const selectedClassName = document.getElementById('selectedClassName');
const selectedClassMeta = document.getElementById('selectedClassMeta');
const coursesGrid = document.getElementById('coursesGrid');
const coursesTotal = document.getElementById('coursesTotal');

// Course modal refs
const courseModal = document.getElementById('courseModal');
const closeCourseModal = document.getElementById('closeCourseModal');
const cancelCourseBtn = document.getElementById('cancelCourseBtn');
const saveCourseBtn = document.getElementById('saveCourseBtn');
const courseModalTitle = document.getElementById('courseModalTitle');
const courseForm = document.getElementById('courseForm');
const courseImageInput = document.getElementById('courseImageInput');
const courseImagePreview = document.getElementById('courseImagePreview');
let courseSelectedImageDataUrl = null;
let editingCourseId = null;

// Course detail modal
const courseDetailModal = document.getElementById('courseDetailModal');
const closeCourseDetailModal = document.getElementById('closeCourseDetailModal');
const closeCourseDetailBtn = document.getElementById('closeCourseDetailBtn');
const detailCourseImage = document.getElementById('detailCourseImage');
const detailCourseName = document.getElementById('detailCourseName');
const detailCourseSubject = document.getElementById('detailCourseSubject');
const detailCourseLevel = document.getElementById('detailCourseLevel');
const detailCourseDescription = document.getElementById('detailCourseDescription');
const detailCourseDuration = document.getElementById('detailCourseDuration');
const detailCourseLanguage = document.getElementById('detailCourseLanguage');
const detailCourseObjectives = document.getElementById('detailCourseObjectives');
const weeksChecklist = document.getElementById('weeksChecklist');

// Profile modal
const profileModal = document.getElementById('profileModal');
const closeProfileModal = document.getElementById('closeProfileModal');
const cancelProfileBtn = document.getElementById('cancelProfileBtn');
const saveProfileBtn = document.getElementById('saveProfileBtn');
const profileForm = document.getElementById('profileForm');
const profileName = document.getElementById('profileName');
const profileEmail = document.getElementById('profileEmail');
const profilePhone = document.getElementById('profilePhone');
const profileSpecialty = document.getElementById('profileSpecialty');
const profilePassword = document.getElementById('profilePassword');
const editProfileBtn = document.getElementById('editProfileBtn');

// Helpers
function show(el) { el.classList.remove('hidden'); }
function hide(el) { el.classList.add('hidden'); }
function openModal(modal) {
  modal.classList.remove('opacity-0', 'pointer-events-none');
  document.body.style.overflow = 'hidden';
}
function closeModal(modal) {
  modal.classList.add('opacity-0', 'pointer-events-none');
  document.body.style.overflow = '';
}
function uid() { return Math.random().toString(36).slice(2); }

// Build completion waves SVG
function createWavesSVG() {
  const svg = `
    <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
      <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z" fill="#7dd3fc"></path>
    </svg>
  `;
  const wrapper = document.createElement('div');
  wrapper.className = 'completion__waves';
  wrapper.innerHTML = svg + svg;
  return wrapper;
}
function initCompletionCapsule(capsule, percent) {
  const track = capsule.querySelector('.completion__track') || capsule.querySelector('.completion__track--wide');
  if (!track) return;
  track.innerHTML = ''; // reset
  const liquid = document.createElement('div');
  liquid.className = 'completion__liquid';
  const waves = createWavesSVG();
  const gloss = document.createElement('div');
  gloss.className = 'completion__gloss';
  track.appendChild(liquid);
  track.appendChild(waves);
  track.appendChild(gloss);

  const label = capsule.querySelector('.completion__label');
  requestAnimationFrame(() => {
    liquid.style.height = `${percent}%`;
    if (label) label.querySelector('span').textContent = `${Math.round(percent)}%`;
  });
}

// Sign in
async function signIn(identifier, password) {
  // identifier can be username or email. We'll first try to resolve username -> email via Firestore.
  let email = identifier;
  const looksLikeEmail = identifier.includes('@');
  if (!looksLikeEmail) {
    // lookup username -> email
    const q = await db.collectionGroup('teachers').where('username', '==', identifier).limit(1).get();
    if (!q.empty) {
      email = q.docs[0].data().email;
    } else {
      throw new Error('Username not found');
    }
  }
  await auth.signInWithEmailAndPassword(email, password);
}

// Load current teacher's assigned classes and data
async function loadTeacherData() {
  const user = auth.currentUser;
  if (!user) return;
  const deptSnap = await db.collection('departments').get();
  let found = null;
  for (const deptDoc of deptSnap.docs) {
    const classSnap = await db.collection('departments').doc(deptDoc.id).collection('classes').get();
    for (const classDoc of classSnap.docs) {
      const tSnap = await db.collection('departments').doc(deptDoc.id).collection('classes').doc(classDoc.id).collection('teachers').where('authUid', '==', user.uid).limit(1).get();
      if (!tSnap.empty) {
        found = { teacher: tSnap.docs[0], class: classDoc, department: deptDoc };
        break;
      }
    }
    if (found) break;
  }

  if (!found) {
    headerSubtitle.textContent = 'No class assignment found.';
    return;
  }

  currentTeacherDoc = found.teacher;
  const tData = found.teacher.data();

  // Update header/profile UI
  const name = tData.name || 'Teacher';
  const initial = name.trim().charAt(0).toUpperCase() || 'T';
  userAvatar.textContent = initial;

  headerSubtitle.textContent = `${name} • ${tData.specialty || '—'}`;
  // Load assigned classes for this teacher (by authUid). In a real system, you'd normalize linking.
  classes = [{ id: found.class.id, name: found.class.data().name || 'Class', departmentId: found.department.id }];

  classesCount.textContent = classes.length;
  renderClasses();

  // Auto select first class
  if (classes.length) {
    selectClass(classes[0].id);
  }
}

// Render classes grid
function renderClasses() {
  if (!classes.length) {
    classesContainer.innerHTML = `
      <div class="glass-card p-6 text-center">
        <i data-feather="inbox" class="w-10 h-10 text-gray-500 mx-auto mb-3"></i>
        <h3 class="text-lg font-semibold text-gray-300 mb-1">No Classes Assigned</h3>
        <p class="text-gray-400 text-sm">Contact your administrator to get access to classes.</p>
      </div>
    `;
    feather.replace();
    return;
  }
  classesContainer.innerHTML = classes.map(c => `
    <div class="glass-card p-5 cursor-pointer class-card" data-class-id="${c.id}">
      <div class="flex items-center gap-3">
        <div class="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-500/20 to-secondary-500/20 flex items-center justify-center text-primary-300">
          <i data-feather="book"></i>
        </div>
        <div class="flex-1 min-w-0">
          <h3 class="font-bold truncate">${c.name}</h3>
          <p class="text-sm text-gray-400">Class ID: ${c.id.slice(0,8)}</p>
        </div>
        <button class="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-all">
          <i data-feather="arrow-right"></i>
        </button>
      </div>
    </div>
  `).join('');
  feather.replace();
  document.querySelectorAll('.class-card').forEach(card => {
    card.addEventListener('click', () => {
      selectClass(card.dataset.classId);
    });
  });
}

// Select class
async function selectClass(classId) {
  selectedClassId = classId;
  const cls = classes.find(c => c.id === classId);
  selectedClassName.textContent = cls ? cls.name : 'Class';
  selectedClassMeta.textContent = `ID: ${classId}`;
  selectedClassSummary.classList.remove('hidden');
  await loadCourses();
}

// Load courses for selected class
async function loadCourses() {
  if (!selectedClassId) return;
  const deptId = classes.find(c => c.id === selectedClassId)?.departmentId;
  if (!deptId) return;

  const snap = await db.collection('departments').doc(deptId).collection('classes').doc(selectedClassId).collection('courses').orderBy('createdAt', 'desc').get();
  courses = snap.docs.map(d => ({ id: d.id, ...d.data() }));
  renderCourses();
}

// Render courses grid with card design
function renderCourses() {
  const q = (courseSearchInput.value || '').toLowerCase().trim();
  const filtered = courses.filter(c =>
    !q || [c.name, c.description, c.subject, (c.objectives||[]).join(' ')].filter(Boolean).some(v => v.toLowerCase().includes(q))
  );
  coursesTotal.textContent = filtered.length;

  if (!filtered.length) {
    coursesGrid.innerHTML = `
      <div class="glass-card p-8 text-center col-span-full">
        <i data-feather="book" class="w-12 h-12 text-gray-500 mx-auto mb-4"></i>
        <h3 class="text-xl font-semibold text-gray-300 mb-2">No Courses Yet</h3>
        <p class="text-gray-400">Click "Add Course" to create your first 16‑week plan</p>
      </div>
    `;
    feather.replace();
    return;
  }

  coursesGrid.innerHTML = filtered.map(course => {
    const percent = computeCoursePercent(course);
    const initials = (course.name || 'C').slice(0,2).toUpperCase();
    const duration = course.duration ? `${course.duration}h` : '—';
    const subject = course.subject || 'General';
    const level = course.level || 'Intermediate';
    const img = course.imageUrl || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop';
    return `
      <article class="relative card card--glass rounded-2xl overflow-hidden group">
        <div class="absolute inset-0 pointer-events-none">
          <div class="absolute -top-16 -left-20 h-64 w-64 rounded-full bg-violet-500/20 blur-3xl"></div>
          <div class="absolute -bottom-20 -right-16 h-64 w-64 rounded-full bg-sky-500/20 blur-3xl"></div>
        </div>
        <div class="relative p-5 flex flex-col gap-4">
          <!-- Poster Top -->
          <div class="relative rounded-xl overflow-hidden ring-1 ring-white/10 shadow-lg shadow-black/30 h-40">
            <img src="${img}" alt="${course.name}" class="w-full h-full object-cover">
            <div class="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent"></div>
            <div class="absolute top-3 left-3 px-2 py-1 rounded-md text-xs bg-black/40 backdrop-blur-sm ring-1 ring-white/10 flex items-center gap-1">
              <i data-feather="database" class="w-3.5 h-3.5 text-violet-400"></i>
              <span>${subject}</span>
            </div>
            <div class="absolute bottom-3 left-3 right-3 flex justify-between items-center">
              <div class="flex items-center gap-1 text-[10px] text-slate-300">
                <i data-feather="clock" class="w-3.5 h-3.5"></i>
                <span>${duration}</span>
              </div>
              <div class="px-1.5 py-0.5 rounded bg-violet-400/20 text-violet-300 text-[10px] ring-1 ring-violet-300/40">${level}</div>
            </div>
          </div>

          <!-- Title + Meta -->
          <div class="flex items-start justify-between gap-3">
            <h3 class="text-lg font-semibold leading-tight">${course.name}</h3>
            <div class="shrink-0 text-xs text-slate-400 flex items-center gap-1">
              <i data-feather="activity" class="w-4 h-4 text-pink-400"></i>
              ${Math.round(percent)}%
            </div>
          </div>
          <p class="text-sm text-slate-300/90 line-clamp-3">
            ${course.description || 'No description provided.'}
          </p>
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2 text-xs text-slate-400">
              <i data-feather="user" class="w-4 h-4"></i>
              <span>by ${currentTeacherDoc?.data()?.name || 'Teacher'}</span>
            </div>
            <div class="flex -space-x-1">
              <img class="w-6 h-6 rounded-full ring-2 ring-black/50" src="https://i.pravatar.cc/24?img=2" alt="">
              <img class="w-6 h-6 rounded-full ring-2 ring-black/50" src="https://i.pravatar.cc/24?img=4" alt="">
            </div>
          </div>
          <!-- Completion Horizontal Capsule -->
          <div class="completion completion--wide" data-percent="${percent}">
            <div class="completion__track completion__track--wide">
              <div class="completion__waves"></div>
              <div class="completion__liquid"></div>
              <div class="completion__gloss"></div>
            </div>
            <div class="completion__label">
              <i data-feather="check-circle" class="w-4 h-4 text-emerald-300"></i>
              <span>${Math.round(percent)}%</span>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <button class="flex-1 flex items-center justify-center gap-2 px-3 py-2 glass rounded-lg hover:bg-white/10 transition-all view-course-btn" data-id="${course.id}">
              <i data-feather="eye"></i> View
            </button>
            <button class="px-3 py-2 glass rounded-lg hover:bg-white/10 transition-all edit-course-btn" data-id="${course.id}">
              <i data-feather="edit-2"></i>
            </button>
            <button class="px-3 py-2 glass rounded-lg hover:bg-rose-500/20 text-rose-300 transition-all delete-course-btn" data-id="${course.id}">
              <i data-feather="trash-2"></i>
            </button>
          </div>
        </div>
      </article>
    `;
  }).join('');

  feather.replace();
  AOS.init({ once: true, duration: 400 });

  // Wire buttons
  document.querySelectorAll('.view-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = courses.find(c => c.id === btn.dataset.id);
      if (course) openCourseDetail(course);
    });
  });
  document.querySelectorAll('.edit-course-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const course = courses.find(c => c.id === btn.dataset.id);
      if (course) openCourseModal(course);
    });
  });
  document.querySelectorAll('.delete-course-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
      if (!confirm('Delete this course? This action cannot be undone.')) return;
      await deleteCourse(btn.dataset.id);
    });
  });

  // Initialize completion capsules
  document.querySelectorAll('.completion--wide').forEach(cap => {
    const pct = parseFloat(cap.getAttribute('data-percent') || '0');
    initCompletionCapsule(cap, pct);
  });
}

// Compute course progress percent
function computeCoursePercent(course) {
  const weeks = course.weeks || {};
  const total = 16;
  let completed = 0;
  for (let i = 1; i <= total; i++) if (weeks[i]?.completed) completed++;
  return (completed / total) * 100;
}

// Add/Update Course
async function saveCourse() {
  if (!selectedClassId) return alert('Select a class first.');
  const deptId = classes.find(c => c.id === selectedClassId)?.departmentId;
  if (!deptId) return;

  const name = document.getElementById('courseName').value.trim();
  const subject = document.getElementById('courseSubject').value;
  const description = document.getElementById('courseDescription').value.trim();
  const objectives = document.getElementById('courseObjectives').value.split(',').map(s => s.trim()).filter(Boolean);
  const prerequisites = document.getElementById('coursePrerequisites').value.split(',').map(s => s.trim()).filter(Boolean);
  const audience = document.getElementById('courseAudience').value.trim();
  const duration = parseFloat(document.getElementById('courseDuration').value) || 0;
  const level = document.getElementById('courseLevel').value;
  const language = document.getElementById('courseLanguage').value.trim() || 'English';

  if (!name) return alert('Course name is required.');

  const payload = {
    name, subject, description,
    objectives, prerequisites, audience,
    duration, level, language,
    imageUrl: courseSelectedImageDataUrl || '',
    updatedAt: firebase.firestore.FieldValue.serverTimestamp()
  };

  if (!editingCourseId) {
    // create
    const weeks = {};
    for (let i = 1; i <= 16; i++) weeks[i] = { completed: false, title: `Week ${i}`, notes: '' };
    payload.weeks = weeks;
    payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();

    await db.collection('departments').doc(deptId).collection('classes').doc(selectedClassId).collection('courses').add(payload);
  } else {
    await db.collection('departments').doc(deptId).collection('classes').doc(selectedClassId).collection('courses').doc(editingCourseId).update(payload);
  }

  closeModal(courseModal);
  resetCourseForm();
  await loadCourses();
}

// Delete course
async function deleteCourse(courseId) {
  const deptId = classes.find(c => c.id === selectedClassId)?.departmentId;
  await db.collection('departments').doc(deptId).collection('classes').doc(selectedClassId).collection('courses').doc(courseId).delete();
  await loadCourses();
}

// Open course modal for add/edit
function openCourseModal(course = null) {
  editingCourseId = course ? course.id : null;
  courseModalTitle.textContent = course ? 'Edit Course' : 'Add Course';
  if (course) {
    document.getElementById('courseName').value = course.name || '';
    document.getElementById('courseSubject').value = course.subject || 'Other';
    document.getElementById('courseDescription').value = course.description || '';
    document.getElementById('courseObjectives').value = (course.objectives || []).join(', ');
    document.getElementById('coursePrerequisites').value = (course.prerequisites || []).join(', ');
    document.getElementById('courseAudience').value = course.audience || '';
    document.getElementById('courseDuration').value = course.duration || '';
    document.getElementById('courseLevel').value = course.level || 'Intermediate';
    document.getElementById('courseLanguage').value = course.language || 'English';
    courseSelectedImageDataUrl = course.imageUrl || '';
    if (courseSelectedImageDataUrl) {
      courseImagePreview.innerHTML = `<img src="${courseSelectedImageDataUrl}" alt="Course" class="w-full h-full object-cover">`;
    } else {
      courseImagePreview.innerHTML = `
        <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
          <i data-feather="upload-cloud" class="w-8 h-8 mb-2"></i>
          <p class="text-sm">Click to upload</p>
          <p class="text-xs">PNG, JPG up to 2MB</p>
        </div>`;
      feather.replace();
    }
  } else {
    resetCourseForm();
  }
  openModal(courseModal);
}

// Reset course form
function resetCourseForm() {
  courseForm.reset();
  courseSelectedImageDataUrl = null;
  courseImagePreview.innerHTML = `
    <div class="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
      <i data-feather="upload-cloud" class="w-8 h-8 mb-2"></i>
      <p class="text-sm">Click to upload</p>
      <p class="text-xs">PNG, JPG up to 2MB</p>
    </div>`;
  feather.replace();
  editingCourseId = null;
}

// Open course detail with 16-week checklist
function openCourseDetail(course) {
  detailCourseName.textContent = course.name || '—';
  detailCourseSubject.querySelector('span').textContent = course.subject || 'General';
  detailCourseLevel.textContent = course.level || 'Intermediate';
  detailCourseDescription.textContent = course.description || 'No description provided.';
  detailCourseDuration.textContent = course.duration ? `${course.duration}h` : '—';
  detailCourseLanguage.textContent = course.language || '—';
  detailCourseObjectives.textContent = (course.objectives || []).join(', ') || '—';
  detailCourseImage.src = course.imageUrl || 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=1200&auto=format&fit=crop';

  weeksChecklist.innerHTML = '';
  const weeks = course.weeks || {};
  for (let i = 1; i <= 16; i++) {
    const w = weeks[i] || { completed: false, title: `Week ${i}`, notes: '' };
    const id = uid();
    const item = document.createElement('label');
    item.className = 'flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10 hover:bg-white/10 transition-all cursor-pointer';
    item.innerHTML = `
      <input type="checkbox" class="peer sr-only week-check" data-week="${i}" ${w.completed ? 'checked' : ''}>
      <div class="w-5 h-5 rounded-md border border-white/15 peer-checked:border-emerald-400/60 bg-white/5 peer-checked:bg-emerald-400/20 flex items-center justify-center transition-all">
        <i data-feather="check" class="w-3.5 h-3.5 text-emerald-300 opacity-0 peer-checked:opacity-100 transition"></i>
      </div>
      <div class="flex-1">
        <div class="text-sm font-medium">${w.title || `Week ${i}`}</div>
        <div class="text-xs text-gray-400">${w.notes || ''}</div>
      </div>
      <span class="text-[10px] text-gray-400">Week ${i}</span>
    `;
    weeksChecklist.appendChild(item);
  }
  feather.replace();

  // Wire up week checkboxes with saving
  weeksChecklist.querySelectorAll('.week-check').forEach(cb => {
    cb.addEventListener('change', async (e) => {
      const weekNum = parseInt(e.target.dataset.week, 10);
      const completed = e.target.checked;
      await updateWeekCompletion(course.id, weekNum, completed);
      // update course in memory and re-render grid
      if (!course.weeks) course.weeks = {};
      course.weeks[weekNum] = { ...(course.weeks[weekNum]||{}), completed };
      renderCourses();
    });
  });

  openModal(courseDetailModal);
}

// Update week completion in Firestore
async function updateWeekCompletion(courseId, weekNum, completed) {
  const deptId = classes.find(c => c.id === selectedClassId)?.departmentId;
  const ref = db.collection('departments').doc(deptId).collection('classes').doc(selectedClassId).collection('courses').doc(courseId);
  await ref.update({
    [`weeks.${weekNum}.completed`]: completed
  });
}

// Export courses (simple JSON)
function exportCourses() {
  const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(courses, null, 2));
  const dlAnchor = document.createElement('a');
  dlAnchor.setAttribute("href", dataStr);
  dlAnchor.setAttribute("download", `courses_${selectedClassId || 'class'}.json`);
  document.body.appendChild(dlAnchor);
  dlAnchor.click();
  dlAnchor.remove();
}

// Login handlers
togglePassword.addEventListener('click', () => {
  const type = loginPassword.getAttribute('type') === 'password' ? 'text' : 'password';
  loginPassword.setAttribute('type', type);
  togglePassword.innerHTML = type === 'password'
    ? '<i data-feather="eye-off" class="w-5 h-5"></i>'
    : '<i data-feather="eye" class="w-5 h-5"></i>';
  feather.replace();
});

loginForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  loginError.classList.add('hidden');
  loginBtn.disabled = true;
  loginBtn.querySelector('span').innerHTML = '<i data-feather="loader"></i> Signing in...';
  feather.replace();

  try {
    await signIn(loginIdentity.value.trim(), loginPassword.value);
  } catch (err) {
    loginError.textContent = err?.message || 'Failed to sign in';
    loginError.classList.remove('hidden');
  } finally {
    loginBtn.disabled = false;
    loginBtn.querySelector('span').innerHTML = '<i data-feather="log-in"></i> Sign In';
    feather.replace();
  }
});

// Course image upload
courseImageInput.addEventListener('change', (e) => {
  const file = e.target.files?.[0];
  if (!file) return;
  if (!file.type.startsWith('image/')) return alert('Please select an image file.');
  if (file.size > 2 * 1024 * 1024) return alert('Image must be less than 2MB.');
  const reader = new FileReader();
  reader.onload = () => {
    courseSelectedImageDataUrl = reader.result;
    courseImagePreview.innerHTML = `<img src="${courseSelectedImageDataUrl}" alt="Preview" class="w-full h-full object-cover">`;
  };
  reader.readAsDataURL(file);
});
courseImagePreview.addEventListener('click', () => courseImageInput.click());

// Course modal buttons
addCourseBtn.addEventListener('click', () => openCourseModal());
closeCourseModal.addEventListener('click', () => closeModal(courseModal));
cancelCourseBtn.addEventListener('click', () => closeModal(courseModal));
courseModal.querySelector('.absolute.inset-0.bg-black\\/70').addEventListener('click', () => closeModal(courseModal));
saveCourseBtn.addEventListener('click', saveCourse);

// Course detail modal buttons
closeCourseDetailModal.addEventListener('click', () => closeModal(courseDetailModal));
closeCourseDetailBtn.addEventListener('click', () => closeModal(courseDetailModal));
courseDetailModal.querySelector('.absolute.inset-0.bg-black\\/70').addEventListener('click', () => closeModal(courseDetailModal));

// Profile modal
editProfileBtn.addEventListener('click', () => {
  const t = currentTeacherDoc?.data() || {};
  profileName.value = t.name || '';
  profileEmail.value = auth.currentUser?.email || t.email || '';
  profilePhone.value = t.phone || '';
  profileSpecialty.value = t.specialty || '';
  profilePassword.value = '';
  openModal(profileModal);
});
closeProfileModal.addEventListener('click', () => closeModal(profileModal));
cancelProfileBtn.addEventListener('click', () => closeModal(profileModal));
profileModal.querySelector('.absolute.inset-0.bg-black\\/70').addEventListener('click', () => closeModal(profileModal));
saveProfileBtn.addEventListener('click', async () => {
  try {
    const name = profileName.value.trim();
    const phone = profilePhone.value.trim();
    const specialty = profileSpecialty.value.trim();
    const newPassword = profilePassword.value.trim();
    const email = profileEmail.value.trim();

    // Update Auth email if changed
    const user = auth.currentUser;
    if (email && email !== user.email) {
      await user.updateEmail(email);
    }
    // Update Password if provided
    if (newPassword) {
      await user.updatePassword(newPassword);
    }
    // Update Firestore teacher profile
    await currentTeacherDoc.ref.update({
      name, phone, specialty, email
    });
    // Update profile UI
    headerSubtitle.textContent = `${name} • ${specialty || '—'}`;
    userAvatar.textContent = (name || 'T').charAt(0).toUpperCase();
    alert('Profile updated successfully.');
    closeModal(profileModal);
  } catch (err) {
    alert('Failed to update profile: ' + (err?.message || 'Unknown error'));
  }
});

// Export
exportBtn.addEventListener('click', exportCourses);

// Search
courseSearchInput.addEventListener('input', renderCourses);

// Refresh
refreshBtn.addEventListener('click', () => {
  if (selectedClassId) loadCourses();
});

// Logout
logoutBtn.addEventListener('click', async () => {
  await auth.signOut();
});

// Auth state
auth.onAuthStateChanged(async (user) => {
  if (user) {
    currentUser = user;
    hide(loginView);
    show(appView);
    await loadTeacherData();
  } else {
    currentUser = null;
    show(loginView);
    hide(appView);
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  feather.replace();
});