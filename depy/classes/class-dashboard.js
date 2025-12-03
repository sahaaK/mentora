// Firebase config + persistence
const firebaseConfig = {
    apiKey: "AIzaSyCPV_mXojZBR-Dew8RuZSi9jv9X6rc_D90",
    authDomain: "mentora-71f5c.firebaseapp.com",
    projectId: "mentora-71f5c",
    storageBucket: "mentora-71f5c.appspot.com",
    messagingSenderId: "16685388211",
    appId: "1:16685388211:web:7eed812660439dec7b3bc6",
    measurementId: "G-BL98PXGK2G"
};

firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// State
let currentClass = null;
let classStudents = [];
let programs = [];
let filteredStudents = [];

// UI refs
const loadingState = document.getElementById('loadingState');
const dashboardContent = document.getElementById('dashboardContent');
const classNameDisplay = document.getElementById('classNameDisplay');
const searchStudents = document.getElementById('searchStudents');

// Stats elements
const enrollmentCount = document.getElementById('enrollmentCount');
const capacityCount = document.getElementById('capacityCount');
const enrollmentRate = document.getElementById('enrollmentRate');
const daysActive = document.getElementById('daysActive');
const programName = document.getElementById('programName');
const classYear = document.getElementById('classYear');
const instructorName = document.getElementById('instructorName');
const createdDate = document.getElementById('createdDate');
const classStatus = document.getElementById('classStatus');
const classImage = document.getElementById('classImage');
const enrollmentProgress = document.getElementById('enrollmentProgress');
const enrollmentText = document.getElementById('enrollmentText');
const studentsTable = document.getElementById('studentsTable');
const recentActivities = document.getElementById('recentActivities');

// Chart instances
let gradeChart = null;
let attendanceChart = null;

// Fetch class details
async function fetchClassDetails(classId) {
    const deptId = localStorage.getItem('currentDeptId');
    
    if (!deptId) {
        // Demo data for development
        return {
            id: classId,
            name: "Advanced Algorithms",
            programId: "p-cs",
            year: "3",
            maxCapacity: 30,
            instructor: "Prof. Johnson",
            imageUrl: "http://static.photos/technology/640x360/42",
            students: 24,
            createdAt: new Date().toISOString(),
            description: "Advanced data structures and algorithm analysis"
        };
    }

    try {
        const doc = await db.collection('departments').doc(deptId).collection('classes').doc(classId).get();
        if (doc.exists) {
            return { id: doc.id, ...doc.data() };
        } else {
            throw new Error('Class not found');
        }
    } catch (err) {
        console.error('Error fetching class details:', err);
        throw err;
    }
}

// Fetch class students
async function fetchClassStudents(classId) {
    const deptId = localStorage.getItem('currentDeptId');
    
    if (!deptId) {
        // Demo data for development
        const names = [
            "Alex Johnson", "Maria Garcia", "David Smith", "Sarah Wilson", "James Brown", 
            "Emma Davis", "Michael Miller", "Sophia Martinez", "Robert Taylor", "Olivia Anderson",
            "William Thomas", "Isabella Jackson", "Ethan White", "Mia Harris", "Noah Martin"
        ];
        
        return names.map((name, index) => ({
            id: `student-${index}`,
            name: name,
            email: `${name.toLowerCase().replace(' ', '.')}@university.edu",
            joinDate: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000).toISOString(),
            status: Math.random() > 0.1 ? 'Active' : 'Inactive',
            avatarColor: ['red', 'blue', 'green', 'purple', 'yellow', 'pink'][index % 6],
            grade: Math.floor(Math.random() * 40) + 60,
            attendance: Math.floor(Math.random() * 30) + 70
        }));
    }

    try {
        const snapshot = await db.collection('departments').doc(deptId).collection('classes').doc(classId).collection('students').get();
        const students = [];
        snapshot.forEach(doc => students.push({ id: doc.id, ...doc.data() }));
        return students;
    } catch (err) {
        console.error('Error fetching students:', err);
        return [];
    }
}

// Fetch programs
async function fetchPrograms() {
    const deptId = localStorage.getItem('currentDeptId');
    if (!deptId) {
        programs = [
            { id: 'p-cs', name: 'Computer Science' },
            { id: 'p-biz', name: 'Business' },
            { id: 'p-eng', name: 'Engineering' },
            { id: 'p-med', name: 'Medicine' }
        ];
        return;
    }

    try {
        const snapshot = await db.collection('departments').doc(deptId).collection('programs').get();
        programs = [];
        snapshot.forEach(doc => programs.push({ id: doc.id, ...doc.data() }));
    } catch (err) {
        console.error('Error fetching programs:', err);
    }
}

// Render class information
function renderClassInfo() {
    if (!currentClass) return;

    // Update main display
    classNameDisplay.textContent = currentClass.name;
    updatePageTitle(currentClass.name);

    // Update stats
    enrollmentCount.textContent = currentClass.students || 0;
    capacityCount.textContent = currentClass.maxCapacity || 0;
    
    const rate = currentClass.maxCapacity ? Math.round(((currentClass.students || 0) / currentClass.maxCapacity) * 100) : 0;
    enrollmentRate.textContent = `${rate}%`;

    // Calculate days active
    const created = new Date(currentClass.createdAt);
    const today = new Date();
    const diffTime = Math.abs(today - created);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    daysActive.textContent = diffDays;

    // Update class information
    const program = programs.find(p => p.id === currentClass.programId) || { name: 'Unknown' };
    programName.textContent = program.name;
    classYear.textContent = `Year ${currentClass.year || 'N/A'}`;
    instructorName.textContent = currentClass.instructor || '—';
    createdDate.textContent = created.toLocaleDateString();

    // Update status
    const students = currentClass.students || 0;
    const capacity = currentClass.maxCapacity || 0;
    const percent = capacity ? Math.round((students / capacity) * 100) : 0;
    
    let statusText = 'Active';
    let statusClass = 'text-green-400';
    
    if (percent >= 100) {
        statusText = 'Full';
        statusClass = 'text-red-400';
    } else if (percent > 80) {
        statusText = 'Almost Full';
        statusClass = 'text-yellow-400';
    }
    
    classStatus.textContent = statusText;
    classStatus.className = `font-medium ${statusClass}`;

    // Update image
    if (currentClass.imageUrl) {
        classImage.src = currentClass.imageUrl;
        classImage.alt = currentClass.name;
    }

    // Update enrollment progress
    enrollmentProgress.style.setProperty('--w', `${percent}%`);
    enrollmentText.textContent = `${students}/${capacity}`;
}

// Render students table
function renderStudentsTable(students = classStudents) {
    if (!studentsTable) return;

    // Apply search filter
    const query = (searchStudents?.value || '').toLowerCase().trim();
    let filtered = students;
    if (query) {
        filtered = students.filter(s => 
            s.name.toLowerCase().includes(query) || 
            s.email.toLowerCase().includes(query)
        );
    }

    filteredStudents = filtered;

    if (!filtered.length) {
        studentsTable.innerHTML = `
            <tr>
                <td colspan="5" class="py-8 text-center text-gray-400">
                    <i data-feather="users" class="w-12 h-12 mx-auto mb-3"></i>
                    <div>No students found</div>
                    <div class="text-sm">Try adjusting your search term</div>
            </tr>`;
        feather.replace();
        return;
    }

    studentsTable.innerHTML = filtered.map((student, index) => {
        const joinDate = new Date(student.joinDate);
        const avatarColors = ['avatar-red', 'avatar-blue', 'avatar-green', 'avatar-purple', 'avatar-yellow', 'avatar-pink'];
        const colorClass = avatarColors[index % avatarColors.length];
        
        return `
            <tr class="border-b border-white/5 hover:bg-white/5 transition-all">
                <td class="py-4">
                    <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full ${colorClass} flex items-center justify-center text-white font-bold text-sm">
                            ${student.name.split(' ').map(n => n[0]).join('')}
                        </div>
                        <div>
                            <div class="font-medium">${student.name}</div>
                        </div>
                    </td>
                    <td class="py-4 text-gray-300">${student.email}</td>
                    <td class="py-4 text-gray-300">${joinDate.toLocaleDateString()}</td>
                    <td class="py-4">
                        <span class="px-2 py-1 rounded-full text-xs ${
                                student.status === 'Active' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }">${student.status}</span>
                    </td>
                    <td class="py-4">
                        <div class="flex gap-2">
                            <button class="glass p-1.5 rounded hover:bg-white/10 transition-all" onclick="viewStudentDetails('${student.id}')">
                                <i data-feather="eye" class="w-3 h-3"></i>
                            </button>
                            <button class="glass p-1.5 rounded hover:bg-white/10 transition-all">
                                <i data-feather="edit-2" class="w-3 h-3"></i>
                            </button>
                        </div>
                    </td>
                </tr>`;
    }).join('');

    feather.replace();
}

// Render performance charts
function renderPerformanceCharts() {
    // Grade Distribution Chart
    const gradeCtx = document.getElementById('gradeChart')?.getContext('2d');
    if (gradeCtx && gradeChart) {
        gradeChart.destroy();
    }

    if (gradeCtx) {
        const grades = classStudents.map(s => s.grade || 85);
        const gradeRanges = {
            'A (90-100)': grades.filter(g => g >= 90).length,
            'B (80-89)': grades.filter(g => g >= 80 && g < 90).length,
            'C (70-79)': grades.filter(g => g >= 70 && g < 80).length,
            'D (60-69)': grades.filter(g => g >= 60 && g < 70).length,
            'F (<60)': grades.filter(g => g < 60).length
        };

        gradeChart = new Chart(gradeCtx, {
            type: 'doughnut',
            data: {
                labels: Object.keys(gradeRanges),
                datasets: [{
                    data: Object.values(gradeRanges),
                    backgroundColor: [
                        'rgba(34, 197, 94, 0.8)',
                        'rgba(134, 239, 172, 0.8)',
                        'rgba(253, 224, 71, 0.8)',
                        'rgba(249, 115, 22, 0.8)',
                        'rgba(239, 68, 68, 0.8)'
                    ],
                    borderColor: [
                        'rgba(34, 197, 94, 1)',
                        'rgba(134, 239, 172, 1)',
                        'rgba(253, 224, 71, 1)',
                        'rgba(249, 115, 22, 1)',
                        'rgba(239, 68, 68, 1)'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: 'rgba(255, 255, 255, 0.7)'
                }
            }
        });
    }

    // Attendance Rate Chart
    const attendanceCtx = document.getElementById('attendanceChart')?.getContext('2d');
    if (attendanceCtx && attendanceChart) {
        attendanceChart.destroy();
    }

    if (attendanceCtx) {
        const attendanceData = classStudents.map(s => s.attendance || 85);
        const attendanceLabels = classStudents.map(s => s.name.split(' ')[0]));

        attendanceChart = new Chart(attendanceCtx, {
            type: 'bar',
            data: {
                labels: attendanceLabels,
                datasets: [{
                    label: 'Attendance Rate (%)',
                    data: attendanceData,
                    backgroundColor: 'rgba(84, 119, 255, 0.8)',
                    borderColor: 'rgba(84, 119, 255, 1)',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100,
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)',
                        ticks: {
                            color: 'rgba(255, 255, 255, 0.7)'
                    },
                    x: {
                        grid: {
                            color: 'rgba(255, 255, 255, 0.1)'
                }
            }
        });
    }
}

// Render recent activities
function renderRecentActivities() {
    if (!recentActivities) return;

    const activities = [
        { id: 1, type: 'enrollment', student: 'Alex Johnson', date: new Date().toISOString() },
        { id: 2, type: 'assignment', description: 'Homework 3 submitted', date: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString() },
        { id: 3, type: 'grade', description: 'Quiz 2 graded', date: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString() },
        { id: 4, type: 'announcement', description: 'New course materials available', date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString() }
    ];

    recentActivities.innerHTML = activities.map(activity => {
        const date = new Date(activity.date);
        const timeAgo = getTimeAgo(activity.date);
        
        let icon = 'user-plus';
        let color = 'text-primary-400';
        
        switch (activity.type) {
            case 'enrollment':
                icon = 'user-plus';
                color = 'text-primary-400';
                break;
            case 'assignment':
                icon = 'file-text';
                color = 'text-secondary-400';
                break;
            case 'grade':
                icon = 'award';
                color = 'text-green-400';
                break;
            case 'announcement':
                icon = 'megaphone';
                color = 'text-yellow-400';
                break;
            default:
                icon = 'activity';
                color = 'text-gray-400';
        }

        return `
            <div class="flex items-start gap-3 p-3 rounded-lg hover:bg-white/5 transition-all">
                    <div class="p-2 rounded-lg bg-white/5">
                        <i data-feather="${icon}" class="w-4 h-4 ${color}"></i>
                </div>
                <div class="flex-1">
                    <div class="font-medium">${getActivityDescription(activity)}</div>
                    <div class="text-xs text-gray-400">${timeAgo}</div>
            </div>
        `;
    }).join('');

    feather.replace();
}

// Helper functions
function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago';
    
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago';
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays}d ago';
    
    return date.toLocaleDateString();
}

function getActivityDescription(activity) {
    switch (activity.type) {
        case 'enrollment':
            return `${activity.student} enrolled in the class`;
        case 'assignment':
            return activity.description;
        case 'grade':
            return activity.description;
        case 'announcement':
            return activity.description;
        default:
            return 'Activity recorded';
    }
}

function viewStudentDetails(studentId) {
    const student = classStudents.find(s => s.id === studentId);
    if (student) {
        alert(`Viewing details for: ${student.name}\nEmail: ${student.email}\nStatus: ${student.status}`;
    }
}

// Initialize dashboard
async function initDashboard() {
    showLoading();
    
    try {
        const params = getUrlParams();
        if (!params.classId) {
            throw new Error('No class ID provided');
        }

        await fetchPrograms();
        currentClass = await fetchClassDetails(params.classId);
        classStudents = await fetchClassStudents(params.classId);

        renderClassInfo();
        renderStudentsTable();
        renderPerformanceCharts();
        renderRecentActivities();

        showDashboard();
    } catch (err) {
        console.error('Failed to initialize dashboard:', err);
        alert('Failed to load class details: ' + (err.message || err));
        window.close();
    }
}

// Event listeners
searchStudents?.addEventListener('input', () => renderStudentsTable(classStudents));

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
    feather.replace();
    initDashboard();
});