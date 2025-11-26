// Program Registration Script
class ProgramRegistration {
    constructor() {
        this.initializeFirebase();
        this.initializeEventListeners();
        this.initializeImageUpload();
        this.setupFormValidation();
        this.departmentId = localStorage.getItem('currentDeptId');
        this.isSubmitting = false;
    }

    // Initialize Firebase
    initializeFirebase() {
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
        this.db = firebase.firestore();
        this.auth = firebase.auth();
    }

    // Initialize all event listeners
    initializeEventListeners() {
        // Form submission
        document.getElementById('programForm').addEventListener('submit', (e) => this.handleFormSubmit(e));
        
        // Form reset
        document.getElementById('resetForm').addEventListener('click', () => this.resetForm());
        
        // Real-time preview updates
        const formFields = [
            'programName', 'programCode', 'duration', 'programType', 'totalCredits',
            'programDescription', 'programFee', 'department', 'intakeCapacity', 'applicationDeadline'
        ];

        formFields.forEach(fieldId => {
            const element = document.getElementById(fieldId);
            if (element) {
                element.addEventListener('input', () => this.updatePreview());
                element.addEventListener('change', () => this.updatePreview());
            }
        });

        // Program code auto-formatting
        document.getElementById('programCode').addEventListener('input', (e) => {
            e.target.value = e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, '');
            this.updatePreview();
        });

        // Fee formatting
        document.getElementById('programFee').addEventListener('input', (e) => {
            this.updatePreview();
        });

        // Initialize particles
        this.createParticles();
    }

    // Initialize image upload functionality
    initializeImageUpload() {
        const uploadArea = document.getElementById('imageUploadArea');
        const fileInput = document.getElementById('programImage');
        let uploadedImageBase64 = null;

        // Click to upload
        uploadArea.addEventListener('click', () => fileInput.click());

        // Drag and drop
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.classList.add('dragover');
        });

        uploadArea.addEventListener('dragleave', () => {
            uploadArea.classList.remove('dragover');
        });

        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.classList.remove('dragover');
            
            const files = e.dataTransfer.files;
            if (files.length > 0 && files[0].type.startsWith('image/')) {
                this.handleImageUpload(files[0]);
            }
        });

        // File input change
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleImageUpload(e.target.files[0]);
            }
        });
    }

    // Handle image upload
    handleImageUpload(file) {
        const maxSize = 5 * 1024 * 1024; // 5MB
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

        if (!allowedTypes.includes(file.type)) {
            this.showError('Please upload a valid image file (JPG, PNG, or WebP)');
            return;
        }

        if (file.size > maxSize) {
            this.showError('Image size must be less than 5MB');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                // Update preview image
                document.getElementById('previewImage').src = e.target.result;
                this.uploadedImageBase64 = e.target.result;
                
                // Show success feedback
                uploadArea.classList.add('success');
                setTimeout(() => uploadArea.classList.remove('success'), 2000);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Setup form validation
    setupFormValidation() {
        const requiredFields = [
            'programName', 'programCode', 'duration', 'programType', 
            'totalCredits', 'programDescription', 'programFee', 
            'department', 'intakeCapacity'
        ];

        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (field) {
                field.addEventListener('blur', () => this.validateField(fieldId));
                field.addEventListener('input', () => this.clearFieldError(fieldId));
            }
        });
    }

    // Validate individual field
    validateField(fieldId) {
        const field = document.getElementById(fieldId);
        const value = field.value.trim();
        let isValid = true;
        let errorMessage = '';

        // Required field validation
        if (field.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = 'This field is required';
        }

        // Specific field validations
        switch (fieldId) {
            case 'programCode':
                if (value && !/^[A-Z0-9-]+$/.test(value)) {
                    isValid = false;
                    errorMessage = 'Only uppercase letters, numbers, and hyphens allowed';
                }
                break;
            case 'totalCredits':
                if (value && (isNaN(value) || value <= 0 || value > 500)) {
                    isValid = false;
                    errorMessage = 'Credits must be between 1 and 500';
                }
                break;
            case 'programFee':
                if (value && (isNaN(value) || value < 0)) {
                    isValid = false;
                    errorMessage = 'Fee must be a positive number';
                }
                break;
            case 'intakeCapacity':
                if (value && (isNaN(value) || value <= 0 || value > 1000)) {
                    isValid = false;
                    errorMessage = 'Capacity must be between 1 and 1000';
                }
                break;
        }

        // Update field state
        this.updateFieldState(fieldId, isValid, errorMessage);
        return isValid;
    }

    // Update field visual state
    updateFieldState(fieldId, isValid, errorMessage) {
        const field = document.getElementById(fieldId);
        const existingError = field.parentNode.querySelector('.validation-message');
        
        // Remove existing error
        if (existingError) {
            existingError.remove();
        }

        // Add error styling and message
        if (!isValid && errorMessage) {
            field.classList.add('error');
            field.classList.remove('success');
            
            const errorDiv = document.createElement('div');
            errorDiv.className = 'validation-message';
            errorDiv.textContent = errorMessage;
            field.parentNode.appendChild(errorDiv);
            
            // Trigger animation
            requestAnimationFrame(() => {
                errorDiv.classList.add('show');
            });
        } else if (field.value.trim()) {
            field.classList.remove('error');
            field.classList.add('success');
        } else {
            field.classList.remove('error', 'success');
        }
    }

    // Clear field error
    clearFieldError(fieldId) {
        const field = document.getElementById(fieldId);
        field.classList.remove('error');
        
        const existingError = field.parentNode.querySelector('.validation-message');
        if (existingError) {
            existingError.classList.remove('show');
            setTimeout(() => existingError.remove(), 300);
        }
    }

    // Update preview in real-time
    updatePreview() {
        // Get form values
        const name = document.getElementById('programName').value || 'Program Name';
        const code = document.getElementById('programCode').value || 'PROG-001';
        const duration = document.getElementById('duration').value || '4';
        const type = document.getElementById('programType').value || 'undergraduate';
        const credits = document.getElementById('totalCredits').value || '120';
        const fee = document.getElementById('programFee').value || '25000';
        const department = document.getElementById('department').value || 'Computer Science';
        const capacity = document.getElementById('intakeCapacity').value || '60';
        const description = document.getElementById('programDescription').value || 
            'Program description will appear here as you fill in the form...';

        // Update preview elements
        document.getElementById('previewName').textContent = name;
        document.getElementById('previewCode').textContent = code;
        document.getElementById('previewDuration').textContent = `${duration} Year${duration !== '1' ? 's' : ''}`;
        document.getElementById('previewType').textContent = this.formatProgramType(type);
        document.getElementById('previewCredits').textContent = `${credits} Credits`;
        document.getElementById('previewFee').textContent = `$${parseInt(fee).toLocaleString()}`;
        document.getElementById('previewCapacity').textContent = `${capacity} Students`;
        document.getElementById('previewDepartment').textContent = this.formatDepartment(department);
        document.getElementById('previewDescription').textContent = description.length > 150 ? 
            description.substring(0, 150) + '...' : description;

        // Update program type badge
        this.updateProgramTypeBadge(type);
    }

    // Format program type for display
    formatProgramType(type) {
        const typeMap = {
            'undergraduate': 'Undergraduate Program',
            'graduate': 'Graduate Program',
            'postgraduate': 'Postgraduate Program',
            'diploma': 'Diploma Program',
            'certificate': 'Certificate Program'
        };
        return typeMap[type] || 'Academic Program';
    }

    // Format department name
    formatDepartment(dept) {
        const deptMap = {
            'computer-science': 'Computer Science',
            'engineering': 'Engineering',
            'business': 'Business Administration',
            'medicine': 'Medicine',
            'arts': 'Arts & Humanities'
        };
        return deptMap[dept] || dept;
    }

    // Update program type badge in preview
    updateProgramTypeBadge(type) {
        const typeElement = document.getElementById('previewType');
        typeElement.className = `text-sm font-medium mt-1 program-type-badge ${type}`;
        typeElement.textContent = this.formatProgramType(type);
    }

    // Handle form submission
    async handleFormSubmit(e) {
        e.preventDefault();
        
        if (this.isSubmitting) return;

        // Validate all fields
        const requiredFields = [
            'programName', 'programCode', 'duration', 'programType', 
            'totalCredits', 'programDescription', 'programFee', 
            'department', 'intakeCapacity'
        ];

        let isValid = true;
        requiredFields.forEach(fieldId => {
            if (!this.validateField(fieldId)) {
                isValid = false;
            }
        });

        if (!isValid) {
            this.showError('Please correct the validation errors');
            return;
        }

        // Check authentication
        const user = this.auth.currentUser;
        if (!user) {
            this.showError('You must be logged in to register a program');
            return;
        }

        this.isSubmitting = true;
        this.showLoading(true);

        try {
            // Collect form data
            const programData = this.collectFormData();
            
            // Add metadata
            programData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
            programData.updatedAt = firebase.firestore.FieldValue.serverTimestamp();
            programData.createdBy = user.uid;
            programData.departmentId = this.departmentId;
            programData.isActive = true;
            programData.enrolledStudents = 0;
            
            // Check for duplicate program code
            const existingProgram = await this.db.collection('programs')
                .where('programCode', '==', programData.programCode)
                .where('departmentId', '==', this.departmentId)
                .get();
            
            if (!existingProgram.empty) {
                throw new Error('A program with this code already exists in your department');
            }

            // Save to Firestore
            const docRef = await this.db.collection('programs').add(programData);
            
            // Show success
            this.showSuccess('Program registered successfully!');
            
            // Reset form after delay
            setTimeout(() => {
                this.resetForm();
                // Optionally redirect to programs list
                // window.location.href = 'programs.html';
            }, 2000);

        } catch (error) {
            console.error('Error registering program:', error);
            this.showError(error.message || 'Failed to register program. Please try again.');
        } finally {
            this.isSubmitting = false;
            this.showLoading(false);
        }
    }

    // Collect all form data
    collectFormData() {
        // Get required subjects
        const requiredSubjects = [];
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            requiredSubjects.push(checkbox.value);
        });

        return {
            programName: document.getElementById('programName').value.trim(),
            programCode: document.getElementById('programCode').value.trim(),
            duration: parseInt(document.getElementById('duration').value),
            programType: document.getElementById('programType').value,
            totalCredits: parseInt(document.getElementById('totalCredits').value),
            programDescription: document.getElementById('programDescription').value.trim(),
            programFee: parseFloat(document.getElementById('programFee').value),
            department: document.getElementById('department').value,
            intakeCapacity: parseInt(document.getElementById('intakeCapacity').value),
            applicationDeadline: document.getElementById('applicationDeadline').value || null,
            minQualification: document.getElementById('minQualification').value.trim(),
            requiredSubjects: requiredSubjects,
            additionalRequirements: document.getElementById('additionalRequirements').value.trim() || null,
            programImage: this.uploadedImageBase64 || null
        };
    }

    // Reset form
    resetForm() {
        document.getElementById('programForm').reset();
        
        // Clear validation states
        document.querySelectorAll('.form-input, .form-textarea, .form-select').forEach(field => {
            field.classList.remove('error', 'success', 'loading');
            const errorMessage = field.parentNode.querySelector('.validation-message');
            if (errorMessage) {
                errorMessage.remove();
            }
        });

        // Reset preview image
        document.getElementById('previewImage').src = 'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1000&q=80';
        this.uploadedImageBase64 = null;

        // Reset preview content
        this.updatePreview();

        // Clear checked subjects
        document.querySelectorAll('input[type="checkbox"]:checked').forEach(checkbox => {
            checkbox.checked = false;
        });

        this.showSuccess('Form reset successfully!');
    }

    // Show loading state
    showLoading(show) {
        const overlay = document.getElementById('loadingOverlay');
        if (show) {
            overlay.classList.remove('opacity-0', 'pointer-events-none');
        } else {
            overlay.classList.add('opacity-0', 'pointer-events-none');
        }
    }

    // Show success message
    showSuccess(message) {
        const successEl = document.getElementById('successMessage');
        successEl.querySelector('span').textContent = message;
        successEl.classList.add('show');
        
        setTimeout(() => {
            successEl.classList.remove('show');
        }, 5000);
    }

    // Show error message
    showError(message) {
        const errorEl = document.getElementById('errorMessage');
        errorEl.querySelector('span').textContent = message;
        errorEl.classList.add('show');
        
        setTimeout(() => {
            errorEl.classList.remove('show');
        }, 5000);
    }

    // Create floating particles
    createParticles() {
        const container = document.querySelector('.particles-container');
        const particleCount = 15;
        
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            
            const size = Math.random() * 80 + 40;
            const left = Math.random() * 100;
            const top = Math.random() * 100;
            const delay = Math.random() * 10;
            const duration = Math.random() * 10 + 10;
            
            particle.style.width = `${size}px`;
            particle.style.height = `${size}px`;
            particle.style.left = `${left}%`;
            particle.style.top = `${top}%`;
            particle.style.animationDelay = `${delay}s`;
            particle.style.animationDuration = `${duration}s`;
            
            container.appendChild(particle);
        }
    }

    // Initialize the application
    init() {
        // Check authentication
        this.auth.onAuthStateChanged((user) => {
            if (!user) {
                window.location.href = 'index.html';
                return;
            }
        });

        // Initialize AOS
        AOS.init({
            duration: 800,
            once: true,
            offset: 100
        });

        // Initial preview update
        this.updatePreview();

        // Animate form sections
        const formSections = document.querySelectorAll('.glass-card.gradient-border');
        formSections.forEach((section, index) => {
            section.style.animationDelay = `${index * 0.1}s`;
            section.classList.add('form-section');
        });

        console.log('Program Registration initialized');
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    const programRegistration = new ProgramRegistration();
    programRegistration.init();
});

// Global functions for Feather icons
window.feather = feather;