// Firebase and App Init
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

// Department specific images and colors
const departmentAssets = {
    medicine: {
        color: '#ef4444',
        image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1f?w=400&h=200&fit=crop',
        icon: 'activity'
    },
    business: {
        color: '#f59e0b',
        image: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=200&fit=crop',
        icon: 'briefcase'
    },
    social: {
        color: '#8b5cf6',
        image: 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=400&h=200&fit=crop',
        icon: 'users'
    },
    marine: {
        color: '#06b6d4',
        image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=200&fit=crop',
        icon: 'wave'
    },
    agriculture: {
        color: '#10b981',
        image: 'https://images.unsplash.com/photo-1416879595882-3373a0480b5b?w=400&h=200&fit=crop',
        icon: 'leaf'
    },
    technology: {
        color: '#3b82f6',
        image: 'https://images.unsplash.com/photo-1518709268805-4e9042af2176?w=400&h=200&fit=crop',
        icon: 'cpu'
    }
};

// DOM elements
const facultiesContainer = document.getElementById('facultiesContainer');
const departmentFilter = document.getElementById('departmentFilter');
const loadingState = document.getElementById('loadingState');
const feeModal = document.getElementById('feeModal');
const quickFeeModal = document.getElementById('quickFeeModal');
const feeForm = document.getElementById('feeForm');
const quickFeeForm = document.getElementById('quickFeeForm');
const addNewFeeBtn = document.getElementById('addNewFeeBtn');

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
db = firebase.firestore();

// Create animated bubbles
function createBubbles() {
    const container = document.querySelector('.bubble-container');
    const bubbleCount = 20;
    
    for (let i = 0; i < bubbleCount; i++) {
        const bubble = document.createElement('div');
        bubble.className = 'bubble';
        
        const size = Math.random() * 120 + 40;
        const left = Math.random() * 100;
        const top = Math.random() * 100;
        const delay = Math.random() * 15;
        
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${left}%`;
        bubble.style.top = `${top}%`;
        bubble.style.animationDelay = `${delay}s`;
        
        container.appendChild(bubble);
    }
}

// Get faculty image based on department
function getFacultyImage(facultyName, department) {
    const asset = departmentAssets[department];
    const seed = facultyName.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
    return `https://picsum.photos/400/200?random=${seed}`;
}

// Create faculty card HTML
function createFacultyCard(facultyName, department, feeData = null) {
    const deptAsset = departmentAssets[department];
    const imageUrl = getFacultyImage(facultyName, department);
    const status = feeData ? 'status-set' : 'status-pending';
    const hasFee = !!feeData;
    
    const feeDisplay = hasFee ? `
        <div class="fee-display">
            <div>
                <p class="text-sm text-gray-400">Annual Fee</p>
                <p class="fee-amount">$${feeData.totalAmount}</p>
            </div>
            <div class="text-right">
                <p class="text-sm text-gray-400">Sem 1 / Sem 2</p>
                <p class="text-lg font-semibold">$${feeData.semester1Fee} / $${feeData.semester2Fee}</p>
            </div>
        </div>
        <div class="mt-4">
            <div class="flex justify-between text-sm mb-1">
                <span>Fee Completion</span>
                <span>100%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 100%"></div>
            </div>
        </div>
    ` : `
        <div class="fee-display">
            <div class="text-center w-full">
                <p class="text-gray-400">No fee set</p>
                <p class="text-sm text-gray-500">Click to set semester fees</p>
            </div>
        </div>
        <div class="mt-4">
            <div class="flex justify-between text-sm mb-1">
                <span>Fee Completion</span>
                <span>0%</span>
            </div>
            <div class="progress-bar">
                <div class="progress-fill" style="width: 0%"></div>
            </div>
        </div>
    `;

    return `
        <div class="glass-card gradient-border faculty-card dept-${department} ${status} p-6 hover-lift" 
             data-faculty="${facultyName}" 
             data-department="${department}">
            <div class="dept-badge">${department.charAt(0).toUpperCase() + department.slice(1)}</div>
            
            <div class="faculty-image">
                <img src="${imageUrl}" alt="${facultyName}" loading="lazy">
            </div>
            
            <div class="mb-4">
                <h3 class="text-lg font-bold text-white mb-2 line-clamp-2">${facultyName}</h3>
                <div class="flex items-center gap-2 mb-2">
                    <i data-feather="${deptAsset.icon}" class="w-4 h-4" style="color: ${deptAsset.color}"></i>
                    <span class="text-sm text-gray-400 capitalize">${department} Department</span>
                </div>
            </div>

            ${feeDisplay}

            <button class="w-full mt-4 glass-card py-2 rounded-lg bg-gradient-to-r from-primary-500 to-secondary-500 text-white font-medium hover:opacity-90 transition-opacity flex items-center justify-center gap-2 set-fee-btn" 
                    data-faculty="${facultyName}" 
                    data-department="${department}"
                    ${hasFee ? 'data-existing="true"' : ''}>
                <i data-feather="${hasFee ? 'edit' : 'plus'}" class="w-4 h-4"></i>
                ${hasFee ? 'Update Fee' : 'Set Fee'}
            </button>
        </div>
    `;
}

// Load all faculties
async function loadFaculties(departmentFilter = '') {
    loadingState.style.display = 'block';
    facultiesContainer.innerHTML = '';

    try {
        const faculties = [];
        
        for (const [dept, facultyList] of Object.entries(facultyOptions)) {
            if (departmentFilter && dept !== departmentFilter) continue;
            
            for (const faculty of facultyList) {
                // Try to get fee data from Firestore
                const feeDoc = await db.collection('facultyFees')
                    .where('facultyName', '==', faculty)
                    .limit(1)
                    .get();
                
                let feeData = null;
                if (!feeDoc.empty) {
                    feeData = feeDoc.docs[0].data();
                }
                
                faculties.push({
                    name: faculty,
                    department: dept,
                    feeData: feeData
                });
            }
        }

        // Sort faculties by department then by name
        faculties.sort((a, b) => {
            if (a.department !== b.department) {
                return a.department.localeCompare(b.department);
            }
            return a.name.localeCompare(b.name);
        });

        // Render faculty cards with animation
        faculties.forEach((faculty, index) => {
            const cardHtml = createFacultyCard(faculty.name, faculty.department, faculty.feeData);
            const cardElement = document.createElement('div');
            cardElement.innerHTML = cardHtml;
            cardElement.style.animationDelay = `${index * 0.1}s`;
            cardElement.querySelector('.faculty-card').classList.add('animate-slide-up');
            facultiesContainer.appendChild(cardElement.firstElementChild);
        });

        // Update statistics
        updateStatistics(faculties);
        
    } catch (error) {
        console.error('Error loading faculties:', error);
        facultiesContainer.innerHTML = `
            <div class="glass-card p-8 text-center col-span-3">
                <i data-feather="alert-circle" class="w-12 h-12 text-rose-400 mx-auto mb-4"></i>
                <h3 class="text-xl font-bold mb-2">Error Loading Data</h3>
                <p class="text-gray-400">Unable to load faculty data. Please try again.</p>
                <button onclick="loadFaculties()" class="mt-4 glass-card px-4 py-2 rounded-lg bg-primary-500 text-white hover:opacity-90 transition-opacity">
                    Retry
                </button>
            </div>
        `;
    } finally {
        loadingState.style.display = 'none';
        feather.replace();
    }
}

// Update statistics
function updateStatistics(faculties) {
    const totalFaculties = faculties.length;
    const totalRevenue = faculties.reduce((sum, f) => sum + (f.feeData ? parseFloat(f.feeData.totalAmount) || 0 : 0), 0);
    const departments = new Set(faculties.map(f => f.department)).size;
    const avgFee = totalFaculties > 0 ? totalRevenue / totalFaculties : 0;

    document.getElementById('totalFaculties').textContent = totalFaculties;
    document.getElementById('totalRevenue').textContent = `$${totalRevenue.toLocaleString()}`;
    document.getElementById('totalDepartments').textContent = departments;
    document.getElementById('avgFee').textContent = `$${avgFee.toLocaleString()}`;

    // Animate counters
    animateCounter('totalFaculties', 0, totalFaculties, 1000);
    animateCounter('totalRevenue', 0, totalRevenue, 1500, true);
    animateCounter('avgFee', 0, avgFee, 1200, true);
}

// Animate counter
function animateCounter(elementId, start, end, duration, isCurrency = false) {
    const element = document.getElementById(elementId);
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutCubic = 1 - Math.pow(1 - progress, 3);
        const current = start + (end - start) * easeOutCubic;
        
        element.textContent = isCurrency ? 
            `$${Math.round(current).toLocaleString()}` : 
            Math.round(current).toString();
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}
// Open fee setting modal
function openFeeModal(facultyName, department, existingData = null) {
    document.getElementById('facultyName').value = facultyName;
    document.getElementById('department').value = department.charAt(0).toUpperCase() + department.slice(1);
    
    // Clear form
    document.getElementById('semester1Fee').value = '';
    document.getElementById('semester2Fee').value = '';
    document.getElementById('totalAmount').value = '';
    document.getElementById('notes').value = '';
    
    if (existingData) {
        document.getElementById('semester1Fee').value = existingData.semester1Fee;
        document.getElementById('semester2Fee').value = existingData.semester2Fee;
        document.getElementById('totalAmount').value = existingData.totalAmount;
        document.getElementById('currency').value = existingData.currency || 'USD';
        document.getElementById('notes').value = existingData.notes || '';
    }
    
    feeModal.classList.remove('hidden');
    feeModal.style.display = 'flex';
}

// Open quick fee modal
function openQuickFeeModal() {
    quickFeeModal.classList.remove('hidden');
    quickFeeModal.style.display = 'flex';
}

// Close modals
function closeFeeModal() {
    feeModal.classList.add('hidden');
    feeModal.style.display = 'none';
}

function closeQuickFeeModal() {
    quickFeeModal.classList.add('hidden');
    quickFeeModal.style.display = 'none';
}

// Calculate total amount from semester fees
function calculateTotalAmount() {
    const sem1Fee = parseFloat(document.getElementById('semester1Fee').value) || 0;
    const sem2Fee = parseFloat(document.getElementById('semester2Fee').value) || 0;
    const total = sem1Fee + sem2Fee;
    
    document.getElementById('totalAmount').value = total;
}

// Auto-calculate for quick fee form
function calculateQuickTotal() {
    const sem1Fee = parseFloat(document.getElementById('quickSemester1Fee').value) || 0;
    const sem2Fee = parseFloat(document.getElementById('quickSemester2Fee').value) || 0;
    return sem1Fee + sem2Fee;
}

// Save fee data to Firestore
async function saveFeeData(facultyName, department, feeData) {
    try {
        // Check if document already exists
        const existingQuery = await db.collection('facultyFees')
            .where('facultyName', '==', facultyName)
            .limit(1)
            .get();
        
        const feeRecord = {
            facultyName,
            department,
            semester1Fee: parseFloat(feeData.semester1Fee),
            semester2Fee: parseFloat(feeData.semester2Fee),
            totalAmount: parseFloat(feeData.totalAmount),
            currency: feeData.currency,
            notes: feeData.notes || '',
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        };
        
        if (existingQuery.empty) {
            // Create new document
            await db.collection('facultyFees').add(feeRecord);
        } else {
            // Update existing document
            const docId = existingQuery.docs[0].id;
            await db.collection('facultyFees').doc(docId).update({
                ...feeRecord,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error('Error saving fee data:', error);
        return { success: false, error: error.message };
    }
}

// Apply fee to multiple faculties
async function applyFeeToFaculties(faculties, feeData) {
    try {
        const promises = faculties.map(async (facultyName) => {
            // Find department for this faculty
            let department = '';
            for (const [dept, facultyList] of Object.entries(facultyOptions)) {
                if (facultyList.includes(facultyName)) {
                    department = dept;
                    break;
                }
            }
            
            if (department) {
                return saveFeeData(facultyName, department, feeData);
            }
            return { success: false, error: 'Department not found' };
        });
        
        const results = await Promise.all(promises);
        const successCount = results.filter(r => r.success).length;
        
        return { 
            success: true, 
            successCount, 
            totalCount: faculties.length 
        };
    } catch (error) {
        console.error('Error applying fee to faculties:', error);
        return { success: false, error: error.message };
    }
}

// Show notification
function showNotification(message, type = 'success') {
    const notification = document.createElement('div');
    notification.className = `fixed top-4 right-4 z-50 px-6 py-3 rounded-lg text-white font-medium transition-all duration-300 transform translate-x-full`;
    
    if (type === 'success') {
        notification.className += ' bg-emerald-500';
        notification.innerHTML = `<i data-feather="check-circle" class="w-5 h-5 inline mr-2"></i>${message}`;
    } else if (type === 'error') {
        notification.className += ' bg-rose-500';
        notification.innerHTML = `<i data-feather="alert-circle" class="w-5 h-5 inline mr-2"></i>${message}`;
    } else {
        notification.className += ' bg-blue-500';
        notification.innerHTML = `<i data-feather="info" class="w-5 h-5 inline mr-2"></i>${message}`;
    }
    
    document.body.appendChild(notification);
    feather.replace();
    
    // Animate in
    setTimeout(() => {
        notification.classList.remove('translate-x-full');
    }, 100);
    
    // Auto remove after 3 seconds
    setTimeout(() => {
        notification.classList.add('translate-x-full');
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Handle form submissions
feeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        semester1Fee: document.getElementById('semester1Fee').value,
        semester2Fee: document.getElementById('semester2Fee').value,
        totalAmount: document.getElementById('totalAmount').value,
        currency: document.getElementById('currency').value,
        notes: document.getElementById('notes').value
    };
    
    const facultyName = document.getElementById('facultyName').value;
    const department = document.getElementById('department').value.toLowerCase();
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-feather="loader" class="w-4 h-4 animate-spin"></i> Saving...';
    submitBtn.disabled = true;
    
    try {
        const result = await saveFeeData(facultyName, department, formData);
        
        if (result.success) {
            showNotification('Fee structure saved successfully!', 'success');
            closeFeeModal();
            loadFaculties(departmentFilter.value);
        } else {
            showNotification('Failed to save fee structure: ' + result.error, 'error');
        }
    } catch (error) {
        showNotification('An error occurred while saving', 'error');
    } finally {
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
        feather.replace();
    }
});

quickFeeForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        semester1Fee: document.getElementById('quickSemester1Fee').value,
        semester2Fee: document.getElementById('quickSemester2Fee').value,
        totalAmount: calculateQuickTotal().toString(),
        currency: 'USD',
        notes: 'Applied via quick fee configuration'
    };
    
    // Get selected faculties
    const checkboxes = quickFeeModal.querySelectorAll('input[type="checkbox"]:checked');
    const selectedFaculties = Array.from(checkboxes).map(cb => cb.value);
    
    if (selectedFaculties.length === 0) {
        showNotification('Please select at least one faculty', 'error');
        return;
    }
    
    // Show loading state
    const submitBtn = e.target.querySelector('button[type="submit"]');
    const originalContent = submitBtn.innerHTML;
    submitBtn.innerHTML = '<i data-feather="loader" class="w-4 h-4 animate-spin"></i> Applying...';
    submitBtn.disabled = true;
    
    try {
        const result = await applyFeeToFaculties(selectedFaculties, formData);
        
        if (result.success) {
            showNotification(
                `Fee applied successfully to ${result.successCount}/${result.totalCount} faculties!`, 
                'success'
            );
            closeQuickFeeModal();
            loadFaculties(departmentFilter.value);
        } else {
            showNotification('Failed to apply fee: ' + result.error, 'error');
        }
    } catch (error) {
        showNotification('An error occurred while applying fees', 'error');
    } finally {
        submitBtn.innerHTML = originalContent;
        submitBtn.disabled = false;
        feather.replace();
    }
});

// Event listeners
document.addEventListener('DOMContentLoaded', () => {
    // Initialize app
    createBubbles();
    loadFaculties();
    
    // Add event listeners
    departmentFilter.addEventListener('change', (e) => {
        loadFaculties(e.target.value);
    });
    
    // Modal controls
    addNewFeeBtn.addEventListener('click', openQuickFeeModal);
    
    // Close modal buttons
    document.getElementById('closeModalBtn').addEventListener('click', closeFeeModal);
    document.getElementById('closeQuickModalBtn').addEventListener('click', closeQuickFeeModal);
    
    // Close modals when clicking outside
    feeModal.addEventListener('click', (e) => {
        if (e.target === feeModal) {
            closeFeeModal();
        }
    });
    
    quickFeeModal.addEventListener('click', (e) => {
        if (e.target === quickFeeModal) {
            closeQuickFeeModal();
        }
    });
    
    // Calculate total amount on input change
    document.getElementById('semester1Fee').addEventListener('input', calculateTotalAmount);
    document.getElementById('semester2Fee').addEventListener('input', calculateTotalAmount);
    
    // Faculty card click handlers
    document.addEventListener('click', (e) => {
        if (e.target.closest('.set-fee-btn')) {
            const btn = e.target.closest('.set-fee-btn');
            const facultyName = btn.dataset.faculty;
            const department = btn.dataset.department;
            
            // Try to get existing fee data
            const card = btn.closest('.faculty-card');
            const existingData = card.dataset.existing ? {
                semester1Fee: card.querySelector('.fee-amount').dataset.sem1,
                semester2Fee: card.querySelector('.fee-amount').dataset.sem2,
                totalAmount: card.querySelector('.fee-amount').dataset.total,
                currency: 'USD',
                notes: ''
            } : null;
            
            openFeeModal(facultyName, department, existingData);
        }
    });
    
    // Escape key to close modals
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeFeeModal();
            closeQuickFeeModal();
        }
    });
    
    // Sync button functionality
    document.querySelector('[data-feather="refresh-cw"]').parentElement.addEventListener('click', () => {
        loadFaculties(departmentFilter.value);
        showNotification('Data synchronized successfully', 'success');
    });
    
    feather.replace();
});

// Add CSS animations for newly created elements
const style = document.createElement('style');
style.textContent = `
    .modal-overlay {
        animation: fadeIn 0.3s ease-out;
    }
    
    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    .faculty-card {
        animation: slideInUp 0.6s ease forwards;
    }
    
    @keyframes slideInUp {
        from {
            opacity: 0;
            transform: translateY(50px);
        }
        to {
            opacity: 1;
            transform: translateY(0);
        }
    }
`;
document.head.appendChild(style);

// Export functions for global access
window.openFeeModal = openFeeModal;
window.closeFeeModal = closeFeeModal;
window.loadFaculties = loadFaculties;
