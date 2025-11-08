 /* Firebase and Firestore fetch for Students List */
(() => {
    // Configuration (fallback to admission.js if present)
    const firebaseConfig = window.firebaseConfig || {
        apiKey: "AIzaSyCPV_mXojZBR-Dew8RuZSi9jv9X6rc_D90",
        authDomain: "mentora-71f5c.firebaseapp.com",
        projectId: "mentora-71f5c",
        storageBucket: "mentora-71f5c.appspot.com",
        messagingSenderId: "16685388211",
        appId: "1:16685388211:web:7eed812660439dec7b3bc6",
        measurementId: "G-BL98PXGK2G"
    };

    // Initialize Firebase (only when SDK is available)
    let db = null;
    if (window.firebase && firebase.firestore) {
        try {
            // initialize app if not already
            const appsExist = Array.isArray(firebase.apps) ? firebase.apps.length > 0 : (firebase.apps && Object.keys(firebase.apps).length > 0);
            if (!appsExist) firebase.initializeApp(firebaseConfig);
            db = firebase.firestore();
        } catch (e) {
            console.error("Firebase/Firestore init error:", e);
            db = null;
        }
    } else {
        console.warn('Firebase SDK not found. Firestore will be unavailable.');
    }

    // DOM elements
    const searchInput = document.getElementById('searchInput');
    const departmentFilter = document.getElementById('departmentFilter');
    const facultyFilter = document.getElementById('facultyFilter');
    const gradeFilter = document.getElementById('gradeFilter');
    const sortSelect = document.getElementById('sortSelect');
    const studentsTableBody = document.getElementById('studentsTableBody');
    const studentsCountEl = document.getElementById('studentsCount');
    const pageInfoEl = document.getElementById('pageInfo');
    const prevPageBtn = document.getElementById('prevPage');
    const nextPageBtn = document.getElementById('nextPage');
    const sortNameBtn = document.getElementById('sortName');
    const sortGradeBtn = document.getElementById('sortGrade');
    const sortAgeBtn = document.getElementById('sortAge');

    // Modal elements
    const modal = document.getElementById('studentModal');
    const modalCard = document.getElementById('modalCard');
    const closeModalBtns = [document.getElementById('closeModal'), document.getElementById('closeModalFooter')];

    // State
    let allStudents = [];
    let filtered = [];
    let currentPage = 1;
    const perPage = 10;

    // Department -> Faculty mapping
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

    function initFacultyOptions() {
        const dept = departmentFilter.value;
        facultyFilter.innerHTML = '<option value="">All Faculties</option>';
        if (dept && facultyOptions[dept]) {
            facultyOptions[dept].forEach(f => {
                const opt = document.createElement('option');
                opt.value = f;
                opt.textContent = f;
                facultyFilter.appendChild(opt);
            });
        }
    }

    function gradeClass(grade) {
        if (!grade) return 'badge';
        const g = String(grade).trim().toUpperCase();
        if (g === 'A') return 'badge badge-grade-a';
        if (g === 'B') return 'badge badge-grade-b';
        if (g === 'C') return 'badge badge-grade-c';
        if (g === 'D') return 'badge badge-grade-d';
        return 'badge';
    }

    function deptClass(dept) {
        if (!dept) return '';
        const key = String(dept).trim().toLowerCase();
        return `border-dept-${key}`;
    }

    function timeAgo(ts) {
        if (!ts) return '-';
        const d = ts.toDate ? ts.toDate() : new Date(ts);
        const diff = Date.now() - d.getTime();
        const s = Math.floor(diff / 1000);
        const m = Math.floor(s / 60);
        const h = Math.floor(m / 60);
        const day = Math.floor(h / 24);
        if (day > 0) return `${day} day(s) ago`;
        if (h > 0) return `${h} hour(s) ago`;
        if (m > 0) return `${m} min ago`;
        return 'just now';
    }

    function applyFilters() {
        const q = searchInput.value.trim().toLowerCase();
        const dept = departmentFilter.value;
        const fac = facultyFilter.value;
        const grade = gradeFilter.value;

        filtered = allStudents.filter(s => {
            const matchesQ = !q || s.fullName?.toLowerCase().includes(q) || s.phone?.toLowerCase().includes(q) || s.city?.toLowerCase().includes(q);
            const matchesDept = !dept || (s.department && s.department.toLowerCase() === dept.toLowerCase());
            const matchesFac = !fac || (s.faculty && s.faculty.toLowerCase() === fac.toLowerCase());
            const matchesGrade = !grade || (s.grade && String(s.grade).trim().toUpperCase() === grade);
            return matchesQ && matchesDept && matchesFac && matchesGrade;
        });

        // Sort
        const sort = sortSelect.value;
        const sorters = {
            'name-asc': (a,b) => (a.fullName||'').localeCompare(b.fullName||''),
            'name-desc': (a,b) => (b.fullName||'').localeCompare(a.fullName||''),
            'grade-desc': (a,b) => gradeRank(b.grade) - gradeRank(a.grade),
            'grade-asc': (a,b) => gradeRank(a.grade) - gradeRank(b.grade),
        'age-desc': (a,b) => bAge(b) - bAge(a),
        'age-asc': (a,b) => bAge(a) - bAge(b)
        };
        function bAge(s){ return Number(s.age || 0); }
        function gradeRank(g) {
            const v = String(g||'').trim().toUpperCase();
            if (v === 'A') return 4;
            if (v === 'B') return 3;
            if (v === 'C') return 2;
            if (v === 'D') return 1;
            return 0;
        }
        filtered.sort(sorters[sort] || sorters['name-asc']);

        currentPage = 1;
        renderTable();
    }

    function renderTable() {
        // Skeleton rows while loading
        if (allStudents.length === 0) {
            studentsTableBody.innerHTML = '';
            for (let i = 0; i < 6; i++) {
                const tr = document.createElement('tr');
                tr.className = 'table-row';
                tr.innerHTML = `
                    <td class="p-4"><div class="skeleton h-4 w-40 rounded"></div></td>
                    <td class="p-4"><div class="skeleton h-4 w-28 rounded"></div></td>
                    <td class="p-4"><div class="skeleton h-4 w-36 rounded"></div></td>
                    <td class="p-4"><div class="skeleton h-4 w-48 rounded"></div></td>
                    <td class="p-4"><div class="skeleton h-4 w-12 rounded"></div></td>
                    <td class="p-4"><div class="skeleton h-4 w-24 rounded"></div></td>
                    <td class="p-4"><div class="skeleton h-4 w-8 rounded"></div></td>
                    <td class="p-4"><div class="skeleton h-8 w-16 rounded"></div></td>
                `;
                studentsTableBody.appendChild(tr);
            }
            return;
        }

        const total = filtered.length;
        const pages = Math.max(1, Math.ceil(total / perPage));
        if (currentPage > pages) currentPage = pages;
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        const pageItems = filtered.slice(start, end);

        studentsTableBody.innerHTML = pageItems.map(s => {
            const deptBorder = deptClass(s.department);
            return `
                <tr class="table-row border-l-2 ${deptBorder} hover:bg-slate-800/30">
                    <td class="p-4">
                        <div class="flex items-center gap-3">
                            <img class="w-9 h-9 rounded-lg object-cover border border-white/10" src="${s.profileImageData ? s.profileImageData : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'}" alt="avatar" onerror="this.src='https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'">
                            <div>
                                <div class="text-slate-200 font-medium">${s.fullName || '-'}</div>
                                <div class="text-slate-400 text-xs">${s.gender || ''} ${s.age ? '• ' + s.age : ''}</div>
                            </div>
                        </div>
                    </td>
                    <td class="p-4 text-slate-300">${s.phone || '-'}</td>
                    <td class="p-4 text-slate-300">${s.department || '-'}</td>
                    <td class="p-4 text-slate-300">${s.faculty || '-'}</td>
                    <td class="p-4"><span class="${gradeClass(s.grade)}">${s.grade || '-'}</span></td>
                    <td class="p-4 text-slate-300">${s.city || '-'}</td>
                    <td class="p-4 text-slate-300">${s.age ?? '-'}</td>
                    <td class="p-4">
                        <button data-id="${s.id}" class="view-btn inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 transition">
                            <i data-feather="eye" class="w-4 h-4"></i>
                            View
                        </button>
                    </td>
                </tr>
            `;
        }).join('');

        // re-activate feather icons inside new rows
        if (window.feather) feather.replace();

        studentsCountEl.textContent = total.toString();
        pageInfoEl.textContent = `Page ${currentPage} of ${pages}`;

        prevPageBtn.disabled = currentPage === 1;
        nextPageBtn.disabled = currentPage === pages || pages === 0;
    }

    async function fetchStudents() {
        if (!db) {
            console.error('Firestore is not initialized. Cannot fetch students.');
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="p-8 text-center text-rose-300">
                        Firestore not initialized. Ensure the Firebase SDK is loaded and configured.
                    </td>
                </tr>
            `;
            return;
        }

        try {
            const snap = await db.collection('students').get();
            allStudents = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            // Basic client-side normalization
            allStudents.forEach(s => {
                s.department = (s.department || '').toLowerCase();
            });
            applyFilters();
        } catch (e) {
            console.error('Error fetching students:', e);
            studentsTableBody.innerHTML = `
                <tr>
                    <td colspan="8" class="p-8 text-center text-rose-300">
                        Failed to load students. Please check console for details.
                    </td>
                </tr>
            `;
        }
    }

    // Modal helpers
    function openModal(student) {
        if (!student) return;
        // Fill content
        document.getElementById('modalName').textContent = student.fullName || '-';
        document.getElementById('modalFaculty').textContent = student.faculty || '-';
        document.getElementById('modalPhone').textContent = student.phone || '-';
        document.getElementById('modalCity').textContent = student.city || '-';
        document.getElementById('modalGrade').innerHTML = `<span class="${gradeClass(student.grade)}">${student.grade || '-'}</span>`;
        document.getElementById('modalAge').textContent = student.age ?? '-';
        document.getElementById('modalBlood').textContent = student.bloodType || '-';
        document.getElementById('modalDepartment').textContent = (student.department || '-').replace(/\b\w/g, c => c.toUpperCase());
        document.getElementById('modalGuardian').textContent = student.guardianName || '-';
        document.getElementById('modalGuardianPhone').textContent = student.guardianPhone || '-';
        document.getElementById('modalGraduatedFrom').textContent = student.graduatedFrom || '-';
        document.getElementById('modalEducation').textContent = student.education || '-';
        document.getElementById('modalUpdated').textContent = timeAgo(student.createdAt);

        const avatar = document.getElementById('modalAvatar');
        avatar.src = student.profileImageData ? student.profileImageData : 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop';
        avatar.onerror = () => { avatar.src = 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'; };

        modal.classList.remove('hidden');
        gsap.fromTo(modalCard, { y: 12, opacity: 0 }, { y: 0, opacity: 1, duration: 0.25, ease: "power2.out" });
    }
    function closeModal() {
        gsap.to(modalCard, { y: 8, opacity: 0, duration: 0.18, ease: "power2.in", onComplete: () => modal.classList.add('hidden') });
    }

    // Event listeners
    searchInput.addEventListener('input', () => applyFilters());
    departmentFilter.addEventListener('change', () => { initFacultyOptions(); applyFilters(); });
    facultyFilter.addEventListener('change', applyFilters);
    gradeFilter.addEventListener('change', applyFilters);
    sortSelect.addEventListener('change', applyFilters);

    prevPageBtn.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            renderTable();
        }
    });
    nextPageBtn.addEventListener('click', () => {
        const pages = Math.max(1, Math.ceil(filtered.length / perPage));
        if (currentPage < pages) {
            currentPage++;
            renderTable();
        }
    });

    if (sortNameBtn) sortNameBtn.addEventListener('click', () => { sortSelect.value = 'name-asc'; applyFilters(); });
    if (sortGradeBtn) sortGradeBtn.addEventListener('click', () => { sortSelect.value = 'grade-desc'; applyFilters(); });
    if (sortAgeBtn) sortAgeBtn.addEventListener('click', () => { sortSelect.value = 'age-desc'; applyFilters(); });

    studentsTableBody.addEventListener('click', (e) => {
        const btn = e.target.closest('.view-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        const student = allStudents.find(s => s.id === id);
        openModal(student);
    });
    closeModalBtns.forEach(btn => btn.addEventListener('click', closeModal));
    modal.addEventListener('click', (e) => {
        if (e.target === modal) closeModal();
    });

    // Initialize
    initFacultyOptions();
    fetchStudents();
})();