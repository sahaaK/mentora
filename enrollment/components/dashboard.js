/* Firebase and Firestore */
let db;
const firebaseConfig = {
    apiKey: "AIzaSyCPV_mXojZBR-Dew8RuZSi9jv9X6rc_D90",
    authDomain: "mentora-71f5c.firebaseapp.com",
    projectId: "mentora-71f5c",
    storageBucket: "mentora-71f5c.appspot.com",
    messagingSenderId: "16685388211",
    appId: "1:16685388211:web:7eed812660439dec7b3bc6",
    measurementId: "G-BL98PXGK2G"
};

/* Color Map for Departments */
const deptColorMap = {
    medicine:   { bg: 'from-emerald-600/20 to-emerald-800/10', ring: 'ring-emerald-500/30', dot: 'bg-emerald-400', text: 'text-emerald-300' },
    business:   { bg: 'from-purple-600/20 to-purple-800/10', ring: 'ring-purple-500/30', dot: 'bg-purple-400', text: 'text-purple-300' },
    social:     { bg: 'from-sky-600/20 to-sky-800/10', ring: 'ring-sky-500/30', dot: 'bg-sky-400', text: 'text-sky-300' },
    marine:     { bg: 'from-cyan-600/20 to-cyan-800/10', ring: 'ring-cyan-500/30', dot: 'bg-cyan-400', text: 'text-cyan-300' },
    agriculture:{ bg: 'from-lime-600/20 to-lime-800/10', ring: 'ring-lime-500/30', dot: 'bg-lime-400', text: 'text-lime-300' },
    technology: { bg: 'from-blue-600/20 to-blue-800/10', ring: 'ring-blue-500/30', dot: 'bg-blue-400', text: 'text-blue-300' }
};
const fallbackDeptColor = { bg: 'from-slate-600/20 to-slate-800/10', ring: 'ring-slate-500/30', dot: 'bg-slate-400', text: 'text-slate-300' };

/* Utils */
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    const text = document.getElementById('toastText');
    text.textContent = message;
    toast.classList.add('show');
    toast.querySelector('#toastText').className =
        type === 'error' ? 'px-4 py-2 rounded-lg text-white text-sm shadow-lg bg-rose-600/90' :
        type === 'info' ? 'px-4 py-2 rounded-lg text-white text-sm shadow-lg bg-sky-600/90' :
        'px-4 py-2 rounded-lg text-white text-sm shadow-lg bg-emerald-600/90';
    setTimeout(() => toast.classList.remove('show'), 2500);
}

function toTitle(s) {
    if (!s) return '';
    return s
        .toLowerCase()
        .split(' ')
        .map(w => w.charAt(0).toUpperCase() + w.slice(1))
        .join(' ');
}

function toInitials(name = '') {
    const parts = name.trim().split(/\s+/);
    if (parts.length === 0) return 'NA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatPhone(phone = '') {
    const digits = String(phone).replace(/[^\d+]/g, '');
    if (digits.startsWith('256')) return `+${digits.slice(0,3)} ${digits.slice(3,6)} ${digits.slice(6)}`;
    if (digits.startsWith('0')) return `+256 ${digits.slice(1,4)} ${digits.slice(4)}`;
    return phone;
}

function timeAgo(date) {
    if (!date) return 'N/A';
    const d = date.toDate ? date.toDate() : new Date(date);
    const seconds = Math.floor((Date.now() - d.getTime()) / 1000);
    const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
    const intervals = [
        { unit: 'year', secs: 31536000 },
        { unit: 'month', secs: 2592000 },
        { unit: 'week', secs: 604800 },
        { unit: 'day', secs: 86400 },
        { unit: 'hour', secs: 3600 },
        { unit: 'minute', secs: 60 },
        { unit: 'second', secs: 1 }
    ];
    for (const { unit, secs } of intervals) {
        const val = Math.floor(seconds / secs);
        if (Math.abs(val) >= 1) return rtf.format(-val, unit);
    }
    return 'just now';
}

function animateCount(el, target, duration = 1200) {
    const start = 0;
    const startTime = performance.now();
    const formatter = (n) => Intl.NumberFormat('en-US').format(Math.round(n));

    function frame(now) {
        const p = Math.min((now - startTime) / duration, 1);
        const eased = p < 0.5 ? 4*p*p*p : 1 - Math.pow(-2*p + 2, 3) / 2; // easeInOutCubic
        const current = start + (target - start) * eased;
        el.textContent = formatter(current);
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = formatter(target);
    }
    requestAnimationFrame(frame);
}

/* Charts (Chart.js) */
let deptChart, facultyChart, ageChart;

function createBarChart(ctx, labels, data, colors, title = '') {
    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels,
            datasets: [{
                label: title || 'Values',
                data,
                backgroundColor: colors.map(c => c + 'AA'),
                borderColor: colors,
                borderWidth: 1.5,
                borderRadius: 8,
                maxBarThickness: 28
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                x: {
                    ticks: { color: '#cbd5e1', font: { size: 11 } },
                    grid: { color: 'rgba(255,255,255,0.06)' }
                },
                y: {
                    ticks: { color: '#cbd5e1', precision: 0 },
                    grid: { color: 'rgba(255,255,255,0.06)' },
                    beginAtZero: true
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1,
                    titleColor: '#e2e8f0',
                    bodyColor: '#e2e8f0'
                }
            }
        }
    });
}

function createDoughnutChart(ctx, labels, data, colors) {
    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels,
            datasets: [{
                data,
                backgroundColor: colors.map(c => c + 'CC'),
                borderColor: colors.map(() => 'rgba(255,255,255,0.15)'),
                borderWidth: 1,
                hoverOffset: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '62%',
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#cbd5e1', boxWidth: 10, boxHeight: 10, usePointStyle: true, pointStyle: 'circle' }
                },
                tooltip: {
                    backgroundColor: 'rgba(15,23,42,0.95)',
                    borderColor: 'rgba(255,255,255,0.08)',
                    borderWidth: 1
                }
            }
        }
    });
}

/* Firestore Fetch + Render */
async function initFirebase() {
    if (!firebase) {
        showToast('Firebase SDK not found. Check your network.', 'error');
        return;
    }
    try {
        if (!firebase.apps || firebase.apps.length === 0) {
            firebase.initializeApp(firebaseConfig);
        }
        db = firebase.firestore();
    } catch (err) {
        console.error('Firebase init error', err);
        showToast('Failed to initialize Firebase', 'error');
    }
}

function ageHistogram(ages) {
    const bins = [
        { label: '<18', min: 0, max: 17 },
        { label: '18-20', min: 18, max: 20 },
        { label: '21-23', min: 21, max: 23 },
        { label: '24-26', min: 24, max: 26 },
        { label: '27-30', min: 27, max: 30 },
        { label: '>30', min: 31, max: 999 }
    ];
    return bins.map(b => ages.filter(a => a >= b.min && a <= b.max).length);
}

function aggregate(students) {
    const deptCounts = {};
    const facultyCounts = {};
    const schoolCounts = {};
    const genderCounts = { Male: 0, Female: 0, Other: 0, Unknown: 0 };
    const gradeCounts = {};
    const ages = [];

    students.forEach(s => {
        const dept = (s.department || 'unknown').toLowerCase();
        const fac = s.faculty || 'N/A';
        const school = s.graduatedFrom || 'N/A';
        const gender = s.gender || 'Unknown';
        const grade = s.grade || 'N/A';
        const age = Number(s.age) || 0;

        deptCounts[dept] = (deptCounts[dept] || 0) + 1;
        facultyCounts[fac] = (facultyCounts[fac] || 0) + 1;
        schoolCounts[school] = (schoolCounts[school] || 0) + 1;

        if (['male'].includes(gender.toLowerCase())) genderCounts.Male++;
        else if (['female'].includes(gender.toLowerCase())) genderCounts.Female++;
        else if (gender && !['male', 'female'].includes(gender.toLowerCase())) genderCounts.Other++;
        else genderCounts.Unknown++;

        gradeCounts[grade] = (gradeCounts[grade] || 0) + 1;
        if (age > 0) ages.push(age);
    });

    const avgAge = ages.length ? (ages.reduce((a, b) => a + b, 0) / ages.length) : 0;
    const sortedDepts = Object.entries(deptCounts).sort((a, b) => b[1] - a[1]);
    const topFaculties = Object.entries(facultyCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);
    const topSchools = Object.entries(schoolCounts).sort((a, b) => b[1] - a[1]).slice(0, 7);

    return {
        total: students.length,
        avgAge,
        deptCounts,
        facultyCounts,
        topFaculties,
        topSchools,
        genderCounts,
        gradeCounts,
        ageHist: ageHistogram(ages)
    };
}

function renderSummaryCards(data) {
    const container = document.getElementById('summary');
    const items = [
        { label: 'Total Students', value: data.total, icon: 'users' },
        { label: 'Average Age', value: data.avgAge ? data.avgAge.toFixed(1) : '0.0', icon: 'calendar' },
        { label: 'Top Department', value: Object.entries(data.deptCounts).sort((a,b)=>b[1]-a[1])[0]?.[0] || 'N/A', icon: 'layers' },
        { label: 'With Guardian', value: '-', icon: 'user-check' } // Placeholder
    ];

    container.innerHTML = items.map(item => `
        <div class="glass rounded-2xl p-5 card-anim">
            <div class="flex items-center justify-between">
                <div>
                    <p class="text-slate-400 text-sm">${item.label}</p>
                    <p class="text-white text-2xl font-semibold mt-1" data-count>${item.value}</p>
                </div>
                <div class="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-300">
                    <i data-feather="${item.icon}" class="w-6 h-6"></i>
                </div>
            </div>
        </div>
    `).join('');

    // Animate counts (skip text values)
    $$('#summary [data-count]').forEach(el => {
        const txt = el.textContent.trim();
        if (!isNaN(Number(txt))) animateCount(el, Number(txt), 1000);
    });
    feather.replace();
}

function renderDepartmentChart(agg) {
    const ctx = document.getElementById('deptChart');
    const labels = Object.keys(agg.deptCounts).map(toTitle);
    const values = Object.values(agg.deptCounts);
    const colors = Object.keys(agg.deptCounts).map(d => {
        const c = deptColorMap[d] || fallbackDeptColor;
        // convert ring color to chart color (using dot)
        return getComputedStyle(document.documentElement).getPropertyValue(`--${c.dot.split('-')[1]}-400`) || '#10b981';
    });
    if (deptChart) deptChart.destroy();
    deptChart = createDoughnutChart(ctx, labels, values, colors);
}

function renderFacultyChart(agg) {
    const ctx = document.getElementById('facultyChart');
    const labels = agg.topFaculties.map(([name]) => name.length > 30 ? name.slice(0, 30) + '…' : name);
    const values = agg.topFaculties.map(([, v]) => v);
    const colors = agg.topFaculties.map(([name]) => {
        // Map by department keyword found in faculty
        const key = Object.keys(deptColorMap).find(k => name.toLowerCase().includes(k));
        const c = deptColorMap[key] || fallbackDeptColor;
        return getComputedStyle(document.documentElement).getPropertyValue(`--${c.dot.split('-')[1]}-400`) || '#10b981';
    });
    if (facultyChart) facultyChart.destroy();
    facultyChart = createBarChart(ctx, labels, values, colors, 'Faculties');
}

function renderAgeChart(agg) {
    const ctx = document.getElementById('ageChart');
    const labels = ['<18','18-20','21-23','24-26','27-30','>30'];
    const values = agg.ageHist;
    const colors = labels.map(() => '#38bdf8');
    if (ageChart) ageChart.destroy();
    ageChart = createBarChart(ctx, labels, values, colors, 'Age Distribution');
}

function renderTopSchools(agg) {
    const root = document.getElementById('topSchools');
    root.innerHTML = agg.topSchools.map(([name, count], i) => `
        <div class="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/8">
            <div class="flex items-center gap-3">
                <div class="w-8 h-8 rounded-lg bg-amber-500/15 text-amber-300 flex items-center justify-center">
                    <i data-feather="award" class="w-4 h-4"></i>
                </div>
                <div>
                    <p class="text-white text-sm">${name}</p>
                    <p class="text-slate-400 text-xs">${count} student${count>1?'s':''}</p>
                </div>
            </div>
            <div class="text-amber-300 font-semibold">#${i+1}</div>
        </div>
    `).join('');
    feather.replace();
}

function renderTable(students) {
    const tbody = document.getElementById('studentsTableBody');
    tbody.innerHTML = students.slice(0, 50).map(s => {
        const deptKey = (s.department || '').toLowerCase();
        const color = (deptColorMap[deptKey] || fallbackDeptColor).text;
        return `
            <tr class="hover:bg-white/5 transition">
                <td class="py-3 px-3">
                    <div class="flex items-center gap-3">
                        <div class="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-slate-300">
                            ${toInitials(s.fullName)}
                        </div>
                        <div>
                            <div class="text-white text-sm">${s.fullName || 'N/A'}</div>
                            <div class="text-slate-400 text-xs">${s.grade || '-'}</div>
                        </div>
                    </div>
                </td>
                <td class="py-3 px-3">
                    <span class="${color}">${toTitle(s.department || '-')}</span>
                </td>
                <td class="py-3 px-3 text-slate-300">${s.faculty || 'N/A'}</td>
                <td class="py-3 px-3 text-slate-300">${s.age || '-'}</td>
                <td class="py-3 px-3 text-slate-300">${s.gender || '-'}</td>
                <td class="py-3 px-3 text-slate-300">${formatPhone(s.phone || '')}</td>
                <td class="py-3 px-3">
                    <div class="text-slate-300 text-sm">${s.guardianName || '-'}</div>
                    <div class="text-slate-400 text-xs">${formatPhone(s.guardianPhone || '')}</div>
                </td>
            </tr>
        `;
    }).join('');
}

function renderStudentGrid(students) {
    const root = document.getElementById('studentGrid');
    document.getElementById('studentCountLabel').textContent = `${students.length} student${students.length !== 1 ? 's' : ''}`;

    root.innerHTML = students.map(s => {
        const deptKey = (s.department || '').toLowerCase();
        const c = deptColorMap[deptKey] || fallbackDeptColor;
        const initials = toInitials(s.fullName);

        return `
            <div class="glass rounded-2xl p-5 card-anim">
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-xl bg-gradient-to-br ${c.bg} ring-1 ${c.ring} flex items-center justify-center text-white font-semibold">
                        ${initials}
                    </div>
                    <div class="flex-1 min-w-0">
                        <p class="text-white font-medium truncate">${s.fullName || 'Unnamed Student'}</p>
                        <p class="text-slate-400 text-sm truncate">${s.faculty || 'Faculty N/A'}</p>
                    </div>
                    <div class="text-right">
                        <div class="chip">
                            <span class="chip-dot ${c.dot}"></span>
                            ${toTitle(s.department || 'N/A')}
                        </div>
                    </div>
                </div>
                <div class="mt-4 grid grid-cols-2 gap-3 text-sm">
                    <div class="bg-white/5 rounded-lg p-3">
                        <div class="text-slate-400">Age</div>
                        <div class="text-white font-medium">${s.age || '-'}</div>
                    </div>
                    <div class="bg-white/5 rounded-lg p-3">
                        <div class="text-slate-400">Gender</div>
                        <div class="text-white font-medium">${s.gender || '-'}</div>
                    </div>
                    <div class="bg-white/5 rounded-lg p-3">
                        <div class="text-slate-400">Grade</div>
                        <div class="text-white font-medium">${s.grade || '-'}</div>
                    </div>
                    <div class="bg-white/5 rounded-lg p-3">
                        <div class="text-slate-400">Phone</div>
                        <div class="text-white font-medium">${formatPhone(s.phone || '')}</div>
                    </div>
                </div>
                <div class="mt-4 text-xs text-slate-400 flex items-center gap-2">
                    <i data-feather="clock" class="w-3 h-3"></i>
                    <span>${timeAgo(s.createdAt)}</span>
                </div>
            </div>
        `;
    }).join('');

    feather.replace();
}

async function loadStudents() {
    try {
        showToast('Loading students...', 'info');
        const snap = await db.collection('students').orderBy('createdAt', 'desc').get();
        const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const agg = aggregate(students);

        // Summary
        renderSummaryCards(agg);
        // Charts
        renderDepartmentChart(agg);
        renderFacultyChart(agg);
        renderAgeChart(agg);
        // Side panels
        renderTopSchools(agg);
        renderTable(students);
        // Grid
        renderStudentGrid(students);

        showToast('Students loaded');
    } catch (err) {
        console.error(err);
        showToast('Failed to load students', 'error');
    }
}

/* Search */
function attachSearch() {
    const input = document.getElementById('searchInput');
    input.addEventListener('input', async () => {
        const q = input.value.toLowerCase().trim();
        const snap = await db.collection('students').orderBy('createdAt', 'desc').get();
        const students = snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const filtered = students.filter(s => {
            const hay = [
                s.fullName, s.phone, s.faculty, s.department, s.grade, s.guardianName, s.guardianPhone, s.graduatedFrom
            ].map(x => (x || '').toString().toLowerCase()).join(' ');
            return hay.includes(q);
        });
        const agg = aggregate(filtered);
        renderSummaryCards(agg);
        renderDepartmentChart(agg);
        renderFacultyChart(agg);
        renderAgeChart(agg);
        renderTopSchools(agg);
        renderTable(filtered);
        renderStudentGrid(filtered);
    });
}

/* Boot */
document.addEventListener('DOMContentLoaded', async () => {
    try {
        await initFirebase();
        await loadStudents();
        attachSearch();
        document.getElementById('btnRefresh').addEventListener('click', loadStudents);
    } catch (e) {
        console.error(e);
    }
});