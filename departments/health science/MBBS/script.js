// Data and Utilities
const mockStudents = [
  { id: 1, name: "Aisha Khan", studentNumber: "MBBS2024001", bloodType: "A+", attendance: 96, examPerformance: 88, avatar: "https://i.pravatar.cc/150?img=1", grade: "A" },
  { id: 2, name: "Rahul Sharma", studentNumber: "MBBS2024002", bloodType: "O+", attendance: 89, examPerformance: 92, avatar: "https://i.pravatar.cc/150?img=2", grade: "A+" },
  { id: 3, name: "Emily Chen", studentNumber: "MBBS2024003", bloodType: "B-", attendance: 78, examPerformance: 81, avatar: "https://i.pravatar.cc/150?img=3", grade: "B+" },
  { id: 4, name: "Mohammed Ali", studentNumber: "MBBS2024004", bloodType: "AB+", attendance: 94, examPerformance: 95, avatar: "https://i.pravatar.cc/150?img=4", grade: "A+" },
  { id: 5, name: "Sofia Rossi", studentNumber: "MBBS2024005", bloodType: "A-", attendance: 84, examPerformance: 79, avatar: "https://i.pravatar.cc/150?img=5", grade: "B+" },
  { id: 6, name: "Liam O'Connor", studentNumber: "MBBS2024006", bloodType: "B+", attendance: 73, examPerformance: 75, avatar: "https://i.pravatar.cc/150?img=6", grade: "B" },
  { id: 7, name: "Ava Johnson", studentNumber: "MBBS2024007", bloodType: "AB-", attendance: 91, examPerformance: 89, avatar: "https://i.pravatar.cc/150?img=7", grade: "A" },
  { id: 8, name: "Noah Williams", studentNumber: "MBBS2024008", bloodType: "O-", attendance: 88, examPerformance: 90, avatar: "https://i.pravatar.cc/150?img=8", grade: "A" },
  { id: 9, name: "Isabella Garcia", studentNumber: "MBBS2024009", bloodType: "B-", attendance: 82, examPerformance: 84, avatar: "https://i.pravatar.cc/150?img=9", grade: "B+" },
  { id: 10, name: "Ethan Brown", studentNumber: "MBBS2024010", bloodType: "A+", attendance: 77, examPerformance: 80, avatar: "https://i.pravatar.cc/150?img=10", grade: "B" },
  { id: 11, name: "Mia Davis", studentNumber: "MBBS2024011", bloodType: "O+", attendance: 95, examPerformance: 93, avatar: "https://i.pravatar.cc/150?img=11", grade: "A" },
  { id: 12, name: "Lucas Martin", studentNumber: "MBBS2024012", bloodType: "AB+", attendance: 86, examPerformance: 88, avatar: "https://i.pravatar.cc/150?img=12", grade: "A-" }
];

const today = new Date();
const todayISO = today.toISOString().split('T')[0];
let attendanceMap = loadAttendance();
let selectedRows = new Set();
let attendanceChart = null;

// Load and Save attendance
function loadAttendance() {
  try {
    const raw = localStorage.getItem('attendance');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function saveAttendance() {
  localStorage.setItem('attendance', JSON.stringify(attendanceMap));
}

function getTodayRecord(studentId) {
  if (!attendanceMap[studentId]) {
    attendanceMap[studentId] = {};
  }
  return attendanceMap[studentId][todayISO] || { status: 'absent', time: null, notes: '' };
}

function setTodayRecord(studentId, status, time = new Date().toLocaleTimeString(), notes = '') {
  if (!attendanceMap[studentId]) attendanceMap[studentId] = {};
  attendanceMap[studentId][todayISO] = { status, time, notes };
  saveAttendance();
}

// Bubble background
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

// Helpers
function getInitials(name) {
  return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getBloodClass(bloodType) {
  return `blood-${bloodType.replace('+', 'plus').replace('-', 'minus')}`;
}

function statusBadgeHTML(status, time = null) {
  const map = {
    present: { cls: 'status-present', icon: 'check-circle', label: 'Present' },
    absent: { cls: 'status-absent', icon: 'x-circle', label: 'Absent' },
    late: { cls: 'status-late', icon: 'clock', label: 'Late' },
    excused: { cls: 'status-excused', icon: 'shield', label: 'Excused' }
  };
  const info = map[status] || map.absent;
  return `<span class="status-badge ${info.cls}">
    <i data-feather="${info.icon}" class="w-3.5 h-3.5"></i>
    ${info.label}${time ? ` • ${time}` : ''}
  </span>`;
}

function filterStudents() {
  const searchTerm = document.getElementById('studentSearch').value.toLowerCase();
  const presentFilter = document.getElementById('presentFilter').value;
  const bloodFilter = document.getElementById('bloodFilter').value;

  let filtered = mockStudents.filter(student => {
    const rec = getTodayRecord(student.id);
    const matchesSearch = student.name.toLowerCase().includes(searchTerm) || student.studentNumber.toLowerCase().includes(searchTerm);
    const matchesPresent = presentFilter === 'all' || rec.status === presentFilter;
    const matchesBlood = !bloodFilter || student.bloodType === bloodFilter;
    return matchesSearch && matchesPresent && matchesBlood;
  });

  renderTable(filtered);
}

// Render table
function renderTable(students = mockStudents) {
  const tbody = document.getElementById('attendanceTableBody');
  tbody.innerHTML = '';

  students.forEach((student) => {
    const rec = getTodayRecord(student.id);
    const row = document.createElement('tr');
    row.className = 'table-row';
    row.dataset.id = student.id;

    row.innerHTML = `
      <td class="p-4">
        <input type="checkbox" class="row-checkbox rounded border-white/20 bg-transparent text-indigo-500 focus:ring-indigo-500/50" ${selectedRows.has(student.id) ? 'checked' : ''} />
      </td>
      <td class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 flex items-center justify-center font-bold overflow-hidden">
            ${student.avatar ? `<img src="${student.avatar}" alt="${student.name}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='${getInitials(student.name)}'">` : getInitials(student.name)}
          </div>
          <div>
            <div class="font-medium">${student.name}</div>
            <div class="text-xs text-gray-400 md:hidden">${student.studentNumber}</div>
          </div>
        </div>
      </td>
      <td class="p-4 hidden md:table-cell">${student.studentNumber}</td>
      <td class="p-4 hidden lg:table-cell">
        <span class="blood-badge ${getBloodClass(student.bloodType)}">${student.bloodType}</span>
      </td>
      <td class="p-4">
        <div class="text-sm">
          <div class="text-gray-400">Attendance</div>
          <div class="font-semibold">${student.attendance}%</div>
        </div>
      </td>
      <td class="p-4">
        ${statusBadgeHTML(rec.status, rec.time)}
      </td>
      <td class="p-4 hidden sm:table-cell">
        <div class="flex items-center gap-2">
          <button class="glass-card p-2 rounded-lg hover:bg-white/10 transition-all view-student" data-id="${student.id}" title="View Details">
            <i data-feather="eye" class="w-4 h-4"></i>
          </button>
          <button class="glass-card p-2 rounded-lg hover:bg-white/10 transition-all quick-present" data-id="${student.id}" title="Mark Present">
            <i data-feather="check" class="w-4 h-4 text-emerald-400"></i>
          </button>
          <button class="glass-card p-2 rounded-lg hover:bg-white/10 transition-all quick-absent" data-id="${student.id}" title="Mark Absent">
            <i data-feather="x" class="w-4 h-4 text-rose-400"></i>
          </button>
        </div>
      </td>
    `;

    tbody.appendChild(row);
  });

  if (window.feather) feather.replace();
  updateStats();
  updateSelectionSummary();
}

// Stats
function computeTodayStats(students = mockStudents) {
  let present = 0, absent = 0, late = 0, excused = 0;
  students.forEach(s => {
    const status = getTodayRecord(s.id).status;
    if (status === 'present') present++;
    else if (status === 'late') late++;
    else if (status === 'excused') excused++;
    else absent++;
  });
  return { present, absent, late, excused, total: students.length };
}

function updateStats() {
  const { present, absent, late, total } = computeTodayStats();
  document.getElementById('presentCount').textContent = present;
  document.getElementById('absentCount').textContent = absent;
  document.getElementById('lateCount').textContent = late;
  document.getElementById('presentToday').textContent = present;
  document.getElementById('absentToday').textContent = absent;
  document.getElementById('lateToday').textContent = late;
  document.getElementById('totalStudents').textContent = total;
}

// Selection
function updateSelectionSummary() {
  const summary = document.getElementById('selectionSummary');
  summary.textContent = `${selectedRows.size} selected`;
}

function getSelectedIds() {
  return Array.from(selectedRows);
}

// Modal
function openStudentModal(studentId) {
  const student = mockStudents.find(s => s.id == studentId);
  if (!student) return;
  const rec = getTodayRecord(student.id);
  const modalBody = document.getElementById('studentModalBody');
  modalBody.innerHTML = `
    <div class="flex items-center gap-6">
      <div class="w-20 h-20 rounded-full bg-gradient-to-r from-indigo-400 to-violet-400 flex items-center justify-center text-2xl font-bold overflow-hidden">
        ${student.avatar ? `<img src="${student.avatar}" alt="${student.name}" class="w-full h-full object-cover" onerror="this.parentElement.innerHTML='${getInitials(student.name)}'">` : getInitials(student.name)}
      </div>
      <div>
        <h3 class="text-2xl font-bold">${student.name}</h3>
        <p class="text-gray-400">${student.studentNumber}</p>
        <div class="flex items-center gap-2 mt-2">
          <span class="blood-badge ${getBloodClass(student.bloodType)}">${student.bloodType}</span>
          <span class="blood-badge">Grade: ${student.grade}</span>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div class="glass-card p-4 rounded-xl bg-white/5">
        <div class="text-sm text-gray-400 mb-1">Today's Status</div>
        <div class="flex items-center gap-2">
          ${statusBadgeHTML(rec.status, rec.time)}
        </div>
      </div>
      <div class="glass-card p-4 rounded-xl bg-white/5">
        <div class="text-sm text-gray-400 mb-1">Overall Attendance</div>
        <div class="text-2xl font-bold">${student.attendance}%</div>
      </div>
    </div>

    <div class="flex gap-3">
      <button class="flex-1 glass-card py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:opacity-90 transition-opacity mark-present" data-id="${student.id}">
        Mark Present
      </button>
      <button class="flex-1 glass-card py-2 rounded-lg bg-gradient-to-r from-rose-500 to-pink-500 text-white font-medium hover:opacity-90 transition-opacity mark-absent" data-id="${student.id}">
        Mark Absent
      </button>
    </div>
  `;

  document.getElementById('studentModal').classList.remove('hidden');
  document.body.style.overflow = 'hidden';
  if (window.feather) feather.replace();
}

function closeStudentModal() {
  document.getElementById('studentModal').classList.add('hidden');
  document.body.style.overflow = '';
}

// Export CSV
function exportCSV() {
  const headers = ['Student ID', 'Name', 'Student Number', 'Blood Type', 'Status', 'Time', 'Date'];
  const rows = mockStudents.map(s => {
    const rec = getTodayRecord(s.id);
    return [
      s.id,
      s.name,
      s.studentNumber,
      s.bloodType,
      rec.status,
      rec.time || '',
      todayISO
    ];
  });

  const csvContent = [headers, ...rows]
    .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `attendance_${todayISO}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Chart
function renderChart() {
  const ctx = document.getElementById('attendanceChart');
  if (!ctx) return;

  if (attendanceChart) {
    attendanceChart.destroy();
  }

  // Simple mock dataset: last 7 days
  const labels = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toLocaleDateString(undefined, { weekday: 'short' });
  });

  const presentData = labels.map(() => Math.floor(Math.random() * 6) + 20);
  const absentData = labels.map(() => Math.floor(Math.random() * 4) + 2);
  const lateData = labels.map(() => Math.floor(Math.random() * 3) + 1);

  attendanceChart = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Present',
          data: presentData,
          borderColor: '#34d399',
          backgroundColor: 'rgba(52, 211, 153, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Absent',
          data: absentData,
          borderColor: '#f87171',
          backgroundColor: 'rgba(248, 113, 113, 0.2)',
          tension: 0.4,
          fill: true
        },
        {
          label: 'Late',
          data: lateData,
          borderColor: '#fbbf24',
          backgroundColor: 'rgba(251, 191, 36, 0.2)',
          tension: 0.4,
          fill: true
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { labels: { color: '#e2e8f0' } }
      },
      scales: {
        x: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } },
        y: { ticks: { color: '#94a3b8' }, grid: { color: 'rgba(148,163,184,0.1)' } }
      }
    }
  });
}

// Event Handlers
function bindEvents() {
  // Filters
  document.getElementById('studentSearch').addEventListener('input', filterStudents);
  document.getElementById('presentFilter').addEventListener('change', filterStudents);
  document.getElementById('bloodFilter').addEventListener('change', filterStudents);

  // Master checkbox
  document.getElementById('masterCheckbox').addEventListener('change', (e) => {
    selectedRows.clear();
    if (e.target.checked) {
      mockStudents.forEach(s => selectedRows.add(s.id));
    }
    // Reflect in UI
    document.querySelectorAll('.row-checkbox').forEach(cb => {
      cb.checked = e.target.checked;
    });
    updateSelectionSummary();
  });

  // Row selection
  document.addEventListener('change', (e) => {
    if (e.target.classList.contains('row-checkbox')) {
      const id = parseInt(e.target.closest('tr').dataset.id, 10);
      if (e.target.checked) selectedRows.add(id);
      else selectedRows.delete(id);
      // Update master
      const master = document.getElementById('masterCheckbox');
      master.checked = selectedRows.size === mockStudents.length;
      master.indeterminate = selectedRows.size > 0 && selectedRows.size < mockStudents.length;
      updateSelectionSummary();
    }
  });

  // Quick actions
  document.addEventListener('click', (e) => {
    if (e.target.closest('.quick-present')) {
      const id = parseInt(e.target.closest('.quick-present').dataset.id, 10);
      setTodayRecord(id, 'present');
      renderTable();
    } else if (e.target.closest('.quick-absent')) {
      const id = parseInt(e.target.closest('.quick-absent').dataset.id, 10);
      setTodayRecord(id, 'absent');
      renderTable();
    } else if (e.target.closest('.view-student')) {
      const id = parseInt(e.target.closest('.view-student').dataset.id, 10);
      openStudentModal(id);
    }
  });

  // Bulk actions
  document.getElementById('markPresentBtn').addEventListener('click', () => {
    getSelectedIds().forEach(id => setTodayRecord(id, 'present'));
    renderTable();
  });
  document.getElementById('markAbsentBtn').addEventListener('click', () => {
    getSelectedIds().forEach(id => setTodayRecord(id, 'absent'));
    renderTable();
  });
  document.getElementById('markLateBtn').addEventListener('click', () => {
    getSelectedIds().forEach(id => setTodayRecord(id, 'late'));
    renderTable();
  });
  document.getElementById('markExcusedBtn').addEventListener('click', () => {
    getSelectedIds().forEach(id => setTodayRecord(id, 'excused'));
    renderTable();
  });

  // Select/Clear
  document.getElementById('selectAllBtn').addEventListener('click', () => {
    selectedRows = new Set(mockStudents.map(s => s.id));
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = true);
    const master = document.getElementById('masterCheckbox');
    master.checked = true;
    master.indeterminate = false;
    updateSelectionSummary();
  });

  document.getElementById('clearSelectionBtn').addEventListener('click', () => {
    selectedRows.clear();
    document.querySelectorAll('.row-checkbox').forEach(cb => cb.checked = false);
    const master = document.getElementById('masterCheckbox');
    master.checked = false;
    master.indeterminate = false;
    updateSelectionSummary();
  });

  // Export
  document.getElementById('exportCsvBtn').addEventListener('click', exportCSV);

  // Modal
  document.getElementById('closeStudentModal').addEventListener('click', closeStudentModal);
  document.getElementById('studentModal').addEventListener('click', (e) => {
    if (e.target.id === 'studentModal') closeStudentModal();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeStudentModal();
  });

  // Modal quick mark
  document.addEventListener('click', (e) => {
    if (e.target.closest('.mark-present')) {
      const id = parseInt(e.target.closest('.mark-present').dataset.id, 10);
      setTodayRecord(id, 'present');
      renderTable();
      closeStudentModal();
    }
    if (e.target.closest('.mark-absent')) {
      const id = parseInt(e.target.closest('.mark-absent').dataset.id, 10);
      setTodayRecord(id, 'absent');
      renderTable();
      closeStudentModal();
    }
  });
}

// Init
document.addEventListener('DOMContentLoaded', () => {
  createBubbles();
  bindEvents();
  renderTable();
  renderChart();
});