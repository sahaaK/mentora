// get.js - refactored to initialize UI after components are injected

// ========== App Logic ==========
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
const auth = firebase.auth();

// UI initialization: queries elements and wires modal/form behavior.
function initUI() {
    // Modal controls
    const openBtn = document.getElementById('openAddBachelorModal');
    // Try to get a dedicated backdrop element; if it doesn't exist,
    // fall back to using the modal container itself as the backdrop.
    const addBachelorModal = document.getElementById('addBachelorModal');
    let modalBackdrop = document.getElementById('modalBackdrop');
    if (!modalBackdrop) modalBackdrop = addBachelorModal;
    const modalPanel = document.getElementById('modalPanel');
    const closeModalBtn = document.getElementById('closeModalBtn');

    function openModal() {
        if (!modalBackdrop || !addBachelorModal || !modalPanel) {
            console.error('Modal elements not found when trying to open modal');
            return;
        }
        modalBackdrop.classList.remove('opacity-0', 'pointer-events-none');
        modalBackdrop.classList.add('opacity-100');

        addBachelorModal.classList.remove('opacity-0', 'pointer-events-none');
        addBachelorModal.classList.add('opacity-100');

        // Animate panel
        modalPanel.classList.remove('modal-enter', 'modal-enter-active');
        void modalPanel.offsetWidth; // reflow
        modalPanel.classList.add('modal-enter', 'modal-enter-active');

        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modalBackdrop || !addBachelorModal || !modalPanel) return;
        // Animate out
        modalPanel.classList.remove('modal-enter', 'modal-enter-active');
        modalPanel.classList.add('modal-exit', 'modal-exit-active');

        modalBackdrop.classList.remove('backdrop-enter', 'backdrop-enter-active');
        modalBackdrop.classList.add('backdrop-exit', 'backdrop-exit-active');

        addBachelorModal.classList.add('pointer-events-none');

        setTimeout(() => {
            modalBackdrop.classList.add('opacity-0');
            modalBackdrop.classList.remove('opacity-100', 'backdrop-exit', 'backdrop-exit-active');

            addBachelorModal.classList.add('opacity-0');
            addBachelorModal.classList.remove('opacity-100');

            modalPanel.classList.remove('modal-exit', 'modal-exit-active');

            document.body.style.overflow = '';
        }, 180);
    }

    if (openBtn) openBtn.addEventListener('click', openModal);
    if (closeModalBtn) closeModalBtn.addEventListener('click', closeModal);
    if (modalBackdrop) modalBackdrop.addEventListener('click', closeModal);
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeModal();
    });

    // Now wire the rest of the modal/form UI (only if modal exists)
    const bachelorForm = document.getElementById('bachelorForm');
    const submitButton = document.getElementById('submitButton');
    const addSpecialization = document.getElementById('addSpecialization');
    const specializationsContainer = document.getElementById('specializationsContainer');
    const randomImage = document.getElementById('randomImage');
    const successModal = document.getElementById('successModal');
    const addAnother = document.getElementById('addAnother');
    const viewPrograms = document.getElementById('viewPrograms');

    // If required elements are missing, bail early
    if (!bachelorForm) return;

    // Preview Elements
    const previewName = document.getElementById('previewName');
    const previewCode = document.getElementById('previewCode');
    const previewDescription = document.getElementById('previewDescription');
    const previewDuration = document.getElementById('previewDuration');
    const previewImage = document.getElementById('previewImage');
    const previewSpecializations = document.getElementById('previewSpecializations');

    // Categories for random images
    const imageCategories = [
        'technology', 'education', 'medical', 'science',
        'finance', 'architecture', 'laboratory', 'workspace'
    ];

    // Form inputs
    const programName = document.getElementById('programName');
    const programCode = document.getElementById('programCode');
    const programDescription = document.getElementById('programDescription');
    const programDuration = document.getElementById('programDuration');
    const programCredits = document.getElementById('programCredits');
    const programImage = document.getElementById('programImage');

    function updatePreviewSpecializations() {
        if (!previewSpecializations || !specializationsContainer) return;
        previewSpecializations.innerHTML = '';

        const inputs = specializationsContainer.querySelectorAll('input');
        if (inputs.length === 0) {
            previewSpecializations.innerHTML = '<span class="px-2 py-1 bg-slate-800/50 text-slate-300 rounded-full text-xs">General</span>';
            return;
        }

        inputs.forEach(input => {
            if (input.value.trim()) {
                const span = document.createElement('span');
                span.className = 'px-2 py-1 bg-slate-800/50 text-slate-300 rounded-full text-xs';
                span.textContent = input.value.trim();
                previewSpecializations.appendChild(span);
            }
        });

        if (previewSpecializations.children.length === 0) {
            previewSpecializations.innerHTML = '<span class="px-2 py-1 bg-slate-800/50 text-slate-300 rounded-full text-xs">General</span>';
        }
    }

    if (addSpecialization) addSpecialization.addEventListener('click', () => {
        if (!specializationsContainer) return;
        const div = document.createElement('div');
        div.className = 'flex items-center gap-2';
        div.innerHTML = `
            <input
                type="text"
                class="flex-1 form-input px-4 py-2 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary-500"
                placeholder="Specialization name"
            >
            <button type="button" class="text-red-400 hover:text-red-300">
                <i data-feather="trash-2" class="w-4 h-4"></i>
            </button>
        `;

        const deleteBtn = div.querySelector('button');
        deleteBtn.addEventListener('click', () => {
            div.remove();
            updatePreviewSpecializations();
        });

        const input = div.querySelector('input');
        input.addEventListener('input', updatePreviewSpecializations);

        specializationsContainer.appendChild(div);
        feather.replace();
        updatePreviewSpecializations();
    });

    if (randomImage) randomImage.addEventListener('click', () => {
        const category = imageCategories[Math.floor(Math.random() * imageCategories.length)];
        const width = 640;
        const height = 360;
        const seed = Math.floor(Math.random() * 1000);

        const imageUrl = `http://static.photos/${category}/${width}x${height}/${seed}`;
        if (programImage) programImage.value = imageUrl;
        if (previewImage) previewImage.src = imageUrl;
    });

    if (programName && previewName) programName.addEventListener('input', () => {
        previewName.textContent = programName.value || 'New Program';
    });

    if (programCode && previewCode) programCode.addEventListener('input', () => {
        previewCode.textContent = programCode.value.toUpperCase() || 'CODE';
    });

    if (programDescription && previewDescription) programDescription.addEventListener('input', () => {
        previewDescription.textContent = programDescription.value || 'Program description will appear here...';
    });

    if (programDuration && previewDuration) programDuration.addEventListener('change', () => {
        const years = programDuration.value || '4';
        previewDuration.textContent = `Duration: ${years} Year${years === '1' ? '' : 's'}`;
    });

    if (programImage && previewImage) programImage.addEventListener('input', () => {
        if (programImage.value) previewImage.src = programImage.value;
    });

    // Form submission
    bachelorForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Get current department ID from localStorage
        const deptId = localStorage.getItem('currentDeptId');
        if (!deptId) {
            alert('Department not found. Please login again.');
            window.location.href = 'index.html';
            return;
        }

        // Show loading state
        const submitText = submitButton ? submitButton.innerHTML : '';
        if (submitButton) {
            submitButton.innerHTML = '<i data-feather="loader" class="animate-spin w-5 h-5"></i> Registering...';
            submitButton.disabled = true;
        }
        feather.replace();

        try {
            // Get specializations
            const specializations = [];
            const inputs = specializationsContainer ? specializationsContainer.querySelectorAll('input') : [];
            inputs.forEach(input => {
                if (input.value.trim()) specializations.push(input.value.trim());
            });

            const programData = {
                name: programName ? programName.value.trim() : '',
                code: programCode ? programCode.value.trim().toUpperCase() : '',
                description: programDescription ? programDescription.value.trim() : '',
                duration: programDuration ? parseInt(programDuration.value) : 0,
                credits: programCredits ? parseInt(programCredits.value) : 0,
                imageUrl: programImage ? programImage.value.trim() : '',
                specializations: specializations.length ? specializations : ['General'],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            await db.collection('departments').doc(deptId).collection('programs').add(programData);

            if (successModal) {
                successModal.classList.remove('opacity-0', 'pointer-events-none');
                const inner = successModal.querySelector('div');
                if (inner) inner.classList.remove('scale-90');
            }

        } catch (error) {
            console.error("Error adding program: ", error);
            alert("Failed to add program: " + error.message);
        } finally {
            if (submitButton) {
                submitButton.innerHTML = submitText;
                submitButton.disabled = false;
            }
            feather.replace();
        }
    });

    // Success modal buttons
    if (addAnother) addAnother.addEventListener('click', () => {
        if (successModal) {
            successModal.classList.add('opacity-0', 'pointer-events-none');
            const inner = successModal.querySelector('div');
            if (inner) inner.classList.add('scale-90');
        }

        if (bachelorForm) bachelorForm.reset();
        if (specializationsContainer) specializationsContainer.innerHTML = '';
        updatePreviewSpecializations();

        if (addBachelorModal) {
            const scrollContent = addBachelorModal.querySelector('.overflow-y-auto');
            if (scrollContent) scrollContent.scrollTo({ top: 0, behavior: 'smooth' });
        }
    });

    if (viewPrograms) viewPrograms.addEventListener('click', () => {
        window.location.href = 'programs.html';
    });
}

// Initialize UI when components injected, or when DOMContentLoaded (safe fallback)
document.addEventListener('components:loaded', () => {
    initUI();
});

document.addEventListener('DOMContentLoaded', () => {
    AOS.init({
        duration: 600,
        easing: 'ease-out-quad',
        once: true
    });

    // Check authentication
    auth.onAuthStateChanged(user => {
        if (!user) {
            window.location.href = 'index.html';
        }
    });

    feather.replace();

    // Also attempt to initialize UI in case components were already present
    initUI();
});

// If the loader already ran and set the flag, initialize immediately.
if (window.__componentsLoaded) {
    initUI();
}