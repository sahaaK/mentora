 // Initialize Firebase
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

// Get class ID from URL
const urlParams = new URLSearchParams(window.location.search);
const classId = urlParams.get('id');

// DOM elements
const addStudentBtn = document.getElementById('addStudentBtn');
const closeAddStudentModalBtn = document.getElementById('closeAddStudentModal');
const addStudentModal = document.getElementById('addStudentModal');
const closeStudentModalBtn = document.getElementById('closeStudentModal');
const studentModal = document.getElementById('studentModal');
const studentsGrid = document.getElementById('studentsGrid');
const studentDirectory = document.getElementById('studentDirectory');
const studentSearch = document.getElementById('studentSearch');
const bloodFilter = document.getElementById('bloodFilter');
const gradeFilter = document.getElementById('gradeFilter');
const studentDirectorySearch = document.getElementById('studentDirectorySearch');
const facultyFilter = document.getElementById('facultyFilter');
const confirmAddStudents = document.getElementById('confirmAddStudents');
const studentCount = document.getElementById('studentCount');

// Chart variables
let attendanceChart, performanceChart;

// State management
let allStudents = [];
let classStudents = [];
let filteredStudents = [];

// Create bubbles for background
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

// Utility functions
function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
}

function getBloodClass(bloodType) {
    return `blood-${bloodType.replace('+', 'plus').replace('-', 'minus')}`;
}

function getPerformanceClass(value) {
    if (value >= 85) return 'green';
    if (value >= 70) return 'yellow';
    return 'red';
}

function getCircumference(radius = 20) {
    return 2 * Math.PI * radius;
}

// Generate realistic performance data
function generatePerformanceData() {
    // Generate realistic attendance (70-100%)
    const attendance = Math.floor(Math.random() * 31) + 70;
    
    // Generate exam performance correlated with attendance
    const baseScore = Math.max(40, attendance - Math.floor(Math.random() * 20));
    const examPerformance = Math.min(100, baseScore + Math.floor(Math.random() * 30));
    
    // Generate grade based on average of attendance and exam
    const average = (attendance + examPerformance) / 2;
    let grade;
    if (average >= 97) grade = 'A+';
    else if (average >= 93) grade = 'A';
    else if (average >= 90) grade = 'A-';
    else if (average >= 87) grade = 'B+';
    else if (average >= 83) grade = 'B';
    else if (average >= 80) grade = 'B-';
    else if (average >= 77) grade = 'C+';
    else if (average >= 73) grade = 'C';
    else if (average >= 70) grade = 'C-';
    else if (average >= 67) grade = 'D+';
    else if (average >= 65) grade = 'D';
    else grade = 'F';
    
    return { attendance, examPerformance, grade };
}

// Create student card HTML
function createStudentCard(student) {
    const performance = student.performance || generatePerformanceData();
    const attendanceCirc = getCircumference(20);
    const examCirc = getCircumference(20);
    const attendanceOffset = attendanceCirc - (performance.attendance / 100) * attendanceCirc;
    const examOffset = examCirc - (performance.examPerformance / 100) * examCirc;
    
    return `
        <div class="glass-card gradient-border p-6 student-card relative animate-slide-up" style="animation-delay: ${Math.random() * 0.3}s" data-student-id="${student.id}">
            <!-- Floating Actions -->
            <div class="floating-actions">
                <button class="action-btn view-student" data-id="${student.id}" title="View Details">
                    <i data-feather="eye" class="w-4 h-4"></i>
                </button>
                <button class="action-btn remove-student" data-id="${student.id}" title="Remove from Class">
                    <i data-feather="trash-2" class="w-4 h-4"></i>
                </button>
            </div>

            <div class="flex items-center gap-4 mb-4">
                <div class="student-avatar">
                    ${student.profileImageUrl ? `<img src="${student.profileImageUrl}" alt="${student.fullName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                    <div class="w-full h-full flex items-center justify-center" ${student.profileImageUrl ? 'style="display:none;"' : ''}>${getInitials(student.fullName)}</div>
                </div>
                <div class="flex-1 min-w-0">
                    <h3 class="text-lg font-bold truncate">${student.fullName}</h3>
                    <p class="text-gray-400 text-sm">${student.phone || 'No phone provided'}</p>
                </div>
            </div>

            <div class="flex items-center gap-2 mb-4">
                <span class="blood-badge ${getBloodClass(student.bloodType)}">${student.bloodType}</span>
                <span class="grade-badge">${performance.grade}</span>
            </div>

            <!-- Progress Rings -->
            <div class="flex justify-between items-center mb-4">
                <div class="flex flex-col items-center gap-1">
                    <svg class="progress-ring" viewBox="0 0 48 48">
                        <defs>
                            <linearGradient id="grad-attendance" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#22c55e;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#16a34a;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <circle class="progress-bg" cx="24" cy="24" r="20" stroke-width="4"></circle>
                        <circle class="progress-fill attendance ${getPerformanceClass(performance.attendance)}" cx="24" cy="24" r="20" stroke-width="4" 
                                stroke-dasharray="${attendanceCirc}" stroke-dashoffset="${attendanceOffset}"></circle>
                    </svg>
                    <span class="metric-label">Attendance</span>
                    <span class="metric-value">${performance.attendance}%</span>
                </div>

                <div class="flex flex-col items-center gap-1">
                    <svg class="progress-ring" viewBox="0 0 48 48">
                        <defs>
                            <linearGradient id="grad-exam" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
                                <stop offset="100%" style="stop-color:#8b5cf6;stop-opacity:1" />
                            </linearGradient>
                        </defs>
                        <circle class="progress-bg" cx="24" cy="24" r="20" stroke-width="4"></circle>
                        <circle class="progress-fill exam ${getPerformanceClass(performance.examPerformance)}" cx="24" cy="24" r="20" stroke-width="4" 
                                stroke-dasharray="${examCirc}" stroke-dashoffset="${examOffset}"></circle>
                    </svg>
                    <span class="metric-label">Exam</span>
                    <span class="metric-value">${performance.examPerformance}%</span>
                </div>
            </div>

            <!-- Additional Stats -->
            <div class="grid grid-cols-2 gap-3">
                <div class="stat-pill">
                    <div class="metric-label">Faculty</div>
                    <div class="metric-value truncate">${student.faculty || 'N/A'}</div>
                </div>
                <div class="stat-pill">
                    <div class="metric-label">Department</div>
                    <div class="metric-value truncate">${student.department || 'N/A'}</div>
                </div>
            </div>

            <!-- Action Button -->
            <button class="w-full glass-card mt-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 view-student-btn" data-id="${student.id}">
                <i data-feather="user" class="w-4 h-4"></i>
                View Profile
            </button>
        </div>
    `;
}

// Create student directory item
function createStudentDirectoryItem(student) {
    return `
        <div class="flex items-center justify-between glass-card p-3 rounded-lg">
            <div class="flex items-center gap-3">
                <div class="student-avatar w-10 h-10">
                    ${student.profileImageUrl ? `<img src="${student.profileImageUrl}" alt="${student.fullName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                    <div class="w-full h-full flex items-center justify-center" ${student.profileImageUrl ? 'style="display:none;"' : ''}>${getInitials(student.fullName)}</div>
                </div>
                <div>
                    <h4 class="font-medium">${student.fullName}</h4>
                    <p class="text-xs text-gray-400">${student.faculty || 'No faculty specified'}</p>
                </div>
            </div>
            <div class="flex items-center gap-3">
                <span class="blood-badge ${getBloodClass(student.bloodType)}">${student.bloodType}</span>
                <label class="inline-flex items-center">
                    <input type="checkbox" class="form-checkbox rounded text-indigo-500 bg-gray-700 border-gray-600" data-id="${student.id}">
                    <span class="ml-2 text-sm">Select</span>
                </label>
            </div>
        </div>
    `;
}

// Load students in this class
async function loadClassStudents() {
    if (!classId) {
        console.warn("No class ID specified");
        return;
    }

    try {
        const querySnapshot = await db.collection('classes').doc(classId).collection('students').get();
        classStudents = [];
        
        if (querySnapshot.empty) {
            studentsGrid.innerHTML = `
                <div class="glass-card p-8 text-center col-span-full">
                    <i data-feather="users" class="w-12 h-12 text-rose-400 mx-auto mb-4"></i>
                    <h3 class="text-xl font-bold mb-2">No Students Found</h3>
                    <p class="text-gray-400">Add students to get started</p>
                </div>
            `;
            feather.replace();
            studentCount.textContent = '0';
            return;
        }

        // Resolve full student profiles
        const studentPromises = querySnapshot.docs.map(async (doc) => {
            const data = doc.data();
            if (data.studentId) {
                try {
                    const sDoc = await db.collection('students').doc(data.studentId).get();
                    if (sDoc.exists) {
                        const student = sDoc.data();
                        student.id = sDoc.id;
                        student.performance = generatePerformanceData(); // Generate performance data
                        return student;
                    }
                } catch (err) {
                    console.warn('Failed to fetch student profile for', data.studentId, err);
                }
                // Fallback
                return { 
                    id: data.studentId, 
                    fullName: data.name || 'Unknown Student', 
                    phone: data.phone || '', 
                    faculty: data.faculty || '', 
                    department: data.department || '',
                    bloodType: data.bloodType || 'N/A'
                };
            }
            // If document already contains full student data
            return { id: doc.id, ...data, performance: generatePerformanceData() };
        });

        classStudents = await Promise.all(studentPromises);
        filteredStudents = [...classStudents];
        renderStudents(filteredStudents);
        updateCharts(classStudents);
        studentCount.textContent = classStudents.length;
    } catch (error) {
        console.error("Error loading students: ", error);
    }
}

// Render students in grid
function renderStudents(students) {
    if (students.length === 0) {
        studentsGrid.innerHTML = `
            <div class="glass-card p-8 text-center col-span-full">
                <i data-feather="users" class="w-12 h-12 text-rose-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold mb-2">No Students Found</h3>
                <p class="text-gray-400">Try adjusting your filters</p>
            </div>
        `;
        feather.replace();
        return;
    }
    
    studentsGrid.innerHTML = '';
    students.forEach(student => {
        studentsGrid.innerHTML += createStudentCard(student);
    });
    feather.replace();
    
    // Add event listeners to newly created elements
    document.querySelectorAll('.view-student, .view-student-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.target.closest('[data-id]').dataset.id;
            openStudentModal(studentId);
        });
    });
    
    document.querySelectorAll('.remove-student').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const studentId = e.target.closest('[data-id]').dataset.id;
            removeStudentFromClass(studentId);
        });
    });
}

// Load all students for directory
async function loadStudentDirectory(searchTerm = '', faculty = '') {
    try {
        let query = db.collection('students');
        
        if (searchTerm) {
            query = query.where('fullName', '>=', searchTerm)
                       .where('fullName', '<=', searchTerm + '\uf8ff');
        }
        
        if (faculty) {
            query = query.where('faculty', '==', faculty);
        }
        
        const querySnapshot = await query.get();
        allStudents = [];
        
        if (querySnapshot.empty) {
            studentDirectory.innerHTML = `
                <div class="glass-card p-6 text-center">
                    <i data-feather="user-x" class="w-12 h-12 text-rose-400 mx-auto mb-4"></i>
                    <h3 class="text-lg font-bold mb-2">No Students Found</h3>
                    <p class="text-gray-400">Try adjusting your search criteria</p>
                </div>
            `;
            feather.replace();
            return;
        }
        
        querySnapshot.forEach(doc => {
            const student = doc.data();
            student.id = doc.id;
            allStudents.push(student);
        });
        
        studentDirectory.innerHTML = '';
        allStudents.forEach(student => {
            studentDirectory.innerHTML += createStudentDirectoryItem(student);
        });
        
        feather.replace();
    } catch (error) {
        console.error("Error loading student directory: ", error);
    }
}

// Add selected students to class
async function addStudentsToClass() {
    if (!classId) return;
    
    const checkboxes = document.querySelectorAll('#studentDirectory input[type="checkbox"]:checked');
    const studentIds = Array.from(checkboxes).map(checkbox => checkbox.dataset.id);
    
    if (studentIds.length === 0) {
        alert('Please select at least one student to add');
        return;
    }
    
    try {
        const batch = db.batch();
        
        studentIds.forEach(studentId => {
            const ref = db.collection('classes').doc(classId).collection('students').doc(studentId);
            batch.set(ref, { studentId, addedAt: firebase.firestore.FieldValue.serverTimestamp() });
        });
        
        await batch.commit();
        alert(`${studentIds.length} students added successfully`);
        closeAddStudentModal();
        loadClassStudents();
    } catch (error) {
        console.error("Error adding students: ", error);
        alert("Failed to add students. Please try again.");
    }
}

// Remove student from class
async function removeStudentFromClass(studentId) {
    if (!classId || !studentId) return;
    
    if (!confirm('Are you sure you want to remove this student from the class?')) {
        return;
    }
    
    try {
        await db.collection('classes').doc(classId).collection('students').doc(studentId).delete();
        loadClassStudents();
    } catch (error) {
        console.error("Error removing student: ", error);
        alert("Failed to remove student. Please try again.");
    }
}

// Update charts with student data
function updateCharts(students) {
    // Calculate attendance distribution
    const attendanceData = {
        '80-100%': 0,
        '60-79%': 0,
        'Below 60%': 0
    };
    
    students.forEach(student => {
        const perf = student.performance || generatePerformanceData();
        if (perf.attendance >= 80) {
            attendanceData['80-100%']++;
        } else if (perf.attendance >= 60) {
            attendanceData['60-79%']++;
        } else {
            attendanceData['Below 60%']++;
        }
    });
    
    // Calculate grade distribution
    const gradeCounts = {};
    students.forEach(student => {
        const perf = student.performance || generatePerformanceData();
        gradeCounts[perf.grade] = (gradeCounts[perf.grade] || 0) + 1;
    });
    
    // Attendance chart
    if (attendanceChart) attendanceChart.destroy();
    const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
    attendanceChart = new Chart(attendanceCtx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(attendanceData),
            datasets: [{
                data: Object.values(attendanceData),
                backgroundColor: [
                    'rgba(34, 197, 94, 0.7)',
                    'rgba(234, 179, 8, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                ],
                borderColor: [
                    'rgba(34, 197, 94, 1)',
                    'rgba(234, 179, 8, 1)',
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
                        color: '#e2e8f0'
                    }
                }
            }
        }
    });
    
    // Performance chart
    if (performanceChart) performanceChart.destroy();
    const performanceCtx = document.getElementById('performanceChart').getContext('2d');
    performanceChart = new Chart(performanceCtx, {
        type: 'bar',
        data: {
            labels: Object.keys(gradeCounts),
            datasets: [{
                label: 'Students',
                data: Object.values(gradeCounts),
                backgroundColor: [
                    'rgba(99, 102, 241, 0.7)',
                    'rgba(124, 58, 237, 0.7)',
                    'rgba(139, 92, 246, 0.7)',
                    'rgba(168, 85, 247, 0.7)',
                    'rgba(192, 38, 211, 0.7)',
                    'rgba(217, 70, 239, 0.7)',
                    'rgba(236, 72, 153, 0.7)',
                    'rgba(239, 68, 68, 0.7)'
                ],
                borderColor: [
                    'rgba(99, 102, 241, 1)',
                    'rgba(124, 58, 237, 1)',
                    'rgba(139, 92, 246, 1)',
                    'rgba(168, 85, 247, 1)',
                    'rgba(192, 38, 211, 1)',
                    'rgba(217, 70, 239, 1)',
                    'rgba(236, 72, 153, 1)',
                    'rgba(239, 68, 68, 1)'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        color: '#e2e8f0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                },
                x: {
                    ticks: {
                        color: '#e2e8f0'
                    },
                    grid: {
                        color: 'rgba(255, 255, 255, 0.1)'
                    }
                }
            },
            plugins: {
                legend: {
                    display: false
                }
            }
        }
    });
}

// Open student modal
async function openStudentModal(studentId) {
    try {
        const doc = await db.collection('students').doc(studentId).get();
        if (!doc.exists) {
            throw new Error("Student not found");
        }
        
        const student = doc.data();
        const performance = student.performance || generatePerformanceData();
        
        document.getElementById('studentModalBody').innerHTML = `
            <div class="flex items-center gap-6">
                <div class="student-avatar w-20 h-20 text-2xl">
                    ${student.profileImageUrl ? `<img src="${student.profileImageUrl}" alt="${student.fullName}" onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">` : ''}
                    <div class="w-full h-full flex items-center justify-center" ${student.profileImageUrl ? 'style="display:none;"' : ''}>${getInitials(student.fullName)}</div>
                </div>
                <div>
                    <h3 class="text-2xl font-bold">${student.fullName}</h3>
                    <p class="text-gray-400">${student.phone || 'No phone provided'}</p>
                    <div class="flex items-center gap-2 mt-2">
                        <span class="blood-badge ${getBloodClass(student.bloodType)}">${student.bloodType}</span>
                        <span class="grade-badge">${performance.grade}</span>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-2 gap-4">
                <div class="stat-item">
                    <div class="flex items-center gap-2">
                        <i data-feather="check-circle" class="text-emerald-400"></i>
                        <span>Attendance</span>
                    </div>
                    <p class="text-2xl font-bold mt-2">${performance.attendance}%</p>
                    <div class="performance-bar mt-2">
                        <div class="performance-fill ${getPerformanceClass(performance.attendance)}" style="width: ${performance.attendance}%"></div>
                    </div>
                </div>
                <div class="stat-item">
                    <div class="flex items-center gap-2">
                        <i data-feather="file-text" class="text-indigo-400"></i>
                        <span>Exam Performance</span>
                    </div>
                    <p class="text-2xl font-bold mt-2">${performance.examPerformance}%</p>
                    <div class="performance-bar mt-2">
                        <div class="performance-fill exam ${getPerformanceClass(performance.examPerformance)}" style="width: ${performance.examPerformance}%"></div>
                    </div>
                </div>
            </div>

            <div class="grid grid-cols-3 gap-3">
                <div class="stat-pill">
                    <div class="metric-label">Overall</div>
                    <div class="metric-value">${Math.round((performance.attendance + performance.examPerformance) / 2)}%</div>
                </div>
                <div class="stat-pill">
                    <div class="metric-label">Status</div>
                    <div class="metric-value ${performance.attendance >= 85 && performance.examPerformance >= 85 ? 'text-emerald-400' : performance.attendance >= 70 && performance.examPerformance >= 70 ? 'text-amber-400' : 'text-rose-400'}">
                        ${performance.attendance >= 85 && performance.examPerformance >= 85 ? 'Excellent' : performance.attendance >= 70 && performance.examPerformance >= 70 ? 'Good' : 'Needs Attention'}
                    </div>
                </div>
                <div class="stat-pill">
                    <div class="metric-label">Risk</div>
                    <div class="metric-value ${performance.attendance < 70 || performance.examPerformance < 70 ? 'text-rose-400' : 'text-emerald-400'}">
                        ${performance.attendance < 70 || performance.examPerformance < 70 ? 'High' : 'Low'}
                    </div>
                </div>
            </div>

            <div class="pt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                    <h4 class="font-medium mb-2">Personal Details</h4>
                    <div class="glass-card p-4 rounded-lg">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-xs text-gray-400">Age</p>
                                <p class="font-medium">${student.age || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">Gender</p>
                                <p class="font-medium">${student.gender || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">City</p>
                                <p class="font-medium">${student.city || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">Education</p>
                                <p class="font-medium">${student.education || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div>
                    <h4 class="font-medium mb-2">Academic Details</h4>
                    <div class="glass-card p-4 rounded-lg">
                        <div class="grid grid-cols-2 gap-4">
                            <div>
                                <p class="text-xs text-gray-400">Faculty</p>
                                <p class="font-medium">${student.faculty || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">Department</p>
                                <p class="font-medium">${student.department || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">Graduated From</p>
                                <p class="font-medium">${student.graduatedFrom || 'N/A'}</p>
                            </div>
                            <div>
                                <p class="text-xs text-gray-400">Guardian</p>
                                <p class="font-medium">${student.guardianName || 'N/A'}</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="flex gap-3 pt-4">
                <button class="flex-1 glass-card py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <i data-feather="mail" class="w-4 h-4"></i>
                    Message
                </button>
                <button class="flex-1 glass-card py-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
                    <i data-feather="download" class="w-4 h-4"></i>
                    Export
                </button>
            </div>
        `;
        
        studentModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        feather.replace();
    } catch (error) {
        console.error("Error loading student details: ", error);
        alert("Failed to load student details. Please try again.");
    }
}

// Close student modal
function closeStudentModal() {
    studentModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Open add student modal
function openAddStudentModal() {
    addStudentModal.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    loadStudentDirectory();
}

// Close add student modal
function closeAddStudentModal() {
    addStudentModal.classList.add('hidden');
    document.body.style.overflow = '';
}

// Filter students in grid
function filterStudents() {
    const searchTerm = studentSearch.value.toLowerCase();
    const bloodType = bloodFilter.value;
    const grade = gradeFilter.value;
    
    filteredStudents = classStudents.filter(student => {
        const matchesSearch = student.fullName.toLowerCase().includes(searchTerm);
        const matchesBlood = !bloodType || student.bloodType === bloodType;
        const matchesGrade = !grade || (student.performance?.grade === grade);
        
        return matchesSearch && matchesBlood && matchesGrade;
    });
    
    renderStudents(filteredStudents);
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    createBubbles();
    feather.replace();

    if (classId) {
        loadClassStudents();
    } else {
        // No classId provided - show empty state
        studentsGrid.innerHTML = `
            <div class="glass-card p-8 text-center col-span-full">
                <i data-feather="alert-circle" class="w-12 h-12 text-amber-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Class Not Found</h3>
                <p class="text-gray-400">Please specify a valid class ID in the URL</p>
            </div>
        `;
        feather.replace();
        studentCount.textContent = '0';
    }

    // Event listeners
    addStudentBtn.addEventListener('click', openAddStudentModal);
    closeAddStudentModalBtn.addEventListener('click', closeAddStudentModal);
    closeStudentModalBtn.addEventListener('click', closeStudentModal);
    confirmAddStudents.addEventListener('click', addStudentsToClass);
    
    studentSearch.addEventListener('input', filterStudents);
    bloodFilter.addEventListener('change', filterStudents);
    gradeFilter.addEventListener('change', filterStudents);
    
    studentDirectorySearch.addEventListener('input', (e) => {
        loadStudentDirectory(e.target.value, facultyFilter.value);
    });
    
    facultyFilter.addEventListener('change', (e) => {
        loadStudentDirectory(studentDirectorySearch.value, e.target.value);
    });
    
    // Close modals when clicking outside
    addStudentModal.addEventListener('click', (e) => {
        if (e.target === addStudentModal) {
            closeAddStudentModal();
        }
    });
    
    studentModal.addEventListener('click', (e) => {
        if (e.target === studentModal) {
            closeStudentModal();
        }
    });
    
    // Close modals with escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeAddStudentModal();
            closeStudentModal();
        }
    });
});
    feather.replace();