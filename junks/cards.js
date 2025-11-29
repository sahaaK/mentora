// DOM element references (will be assigned on DOMContentLoaded)
     let programsContainer;
     let emptyState;
     let programModal;
     let modalContent;
     let closeModal;
     let searchInput;
     let durationFilter;
     let applyFilters;

     // Modal elements
     let modalImage;
     let modalName;
     let modalCode;
     let modalDescription;
     let modalDuration;
     let modalFullDuration;
     let modalCredits;
     let modalFullCredits;
     let modalCreated;
     let modalSpecializations;
    let viewProgramBtn;
     let editProgramBtn;
     let deleteProgramBtn;

        // Current selected program
        let currentProgram = null;
        let currentProgramId = null;

        // Animated background bubbles
        

        // Fetch and display programs
        function fetchPrograms(searchTerm = '', duration = '') {
            const deptId = localStorage.getItem('currentDeptId');
            if (!deptId) {
                window.location.href = 'index.html';
                return;
            }

            let query = db.collection('departments').doc(deptId).collection('programs');
            
            // Apply search filter if term exists
            if (searchTerm) {
                query = query.where('name', '>=', searchTerm)
                           .where('name', '<=', searchTerm + '\uf8ff');
            }
            
            // Apply duration filter if selected
            if (duration) {
                query = query.where('duration', '==', parseInt(duration));
            }
            
            // Ensure container exists
            if (!programsContainer) {
                console.error('Program container element not found: #programsContainer');
                let viewProgramBtn; // Button to view program
            }

            // Show loading skeletons
            programsContainer.innerHTML = `
                <div class="program-card glass-card gradient-border overflow-hidden">
                    <div class="relative h-56"><div class="absolute inset-0 skeleton"></div></div>
                    <div class="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                        <div class="h-6 w-3/4 skeleton rounded"></div>
                        <div class="h-4 w-full skeleton rounded"></div>
                        <div class="flex gap-2"><div class="h-6 w-16 skeleton rounded-full"></div><div class="h-6 w-16 skeleton rounded-full"></div></div>
                    </div>
                </div>
                <div class="program-card glass-card gradient-border overflow-hidden">
                    <div class="relative h-56"><div class="absolute inset-0 skeleton"></div></div>
                    <div class="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                        <div class="h-6 w-3/4 skeleton rounded"></div>
                        <div class="h-4 w-full skeleton rounded"></div>
                        <div class="flex gap-2"><div class="h-6 w-16 skeleton rounded-full"></div><div class="h-6 w-16 skeleton rounded-full"></div></div>
                    </div>
                </div>
                <div class="program-card glass-card gradient-border overflow-hidden">
                    <div class="relative h-56"><div class="absolute inset-0 skeleton"></div></div>
                    <div class="absolute bottom-0 left-0 right-0 p-4 space-y-2">
                        <div class="h-6 w-3/4 skeleton rounded"></div>
                        <div class="h-4 w-full skeleton rounded"></div>
                        <div class="flex gap-2"><div class="h-6 w-16 skeleton rounded-full"></div><div class="h-6 w-16 skeleton rounded-full"></div></div>
                    </div>
                </div>
            `;

            query.orderBy('name').get().then((querySnapshot) => {
                if (querySnapshot.empty) {
                    programsContainer.innerHTML = '';
                    emptyState?.classList.remove('hidden');
                    return;
                }

                emptyState?.classList.add('hidden');
                programsContainer.innerHTML = '';

                querySnapshot.forEach((doc) => {
                    const program = doc.data();
                    const programId = doc.id;
                    
                    // Format duration text
                    const durationText = program.duration === 1 ? '1 Year' : `${program.duration} Years`;
                    
                    // Create program card (Style 3: Image Zoom with Overlay Panel)
                    const card = document.createElement('div');
                    card.className = 'program-card glass-card gradient-border overflow-hidden hover:cursor-pointer';
                    card.dataset.id = programId;
                    card.innerHTML = `
                        <div class="relative h-56 overflow-hidden">
                            <img 
                                src="${program.imageUrl || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1400&auto=format&fit=crop'}" 
                                alt="${program.name}" 
                                class="w-full h-full object-cover program-image"
                            >
                            <div class="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-slate-900/10"></div>

                            <div class="absolute left-4 top-4 flex items-center gap-2 rounded-xl bg-white/90 px-3 py-1.5 text-slate-800 shadow">
                                <i data-feather="trending-up" class="w-4 h-4 text-undefined-600"></i>
                                <span class="text-sm font-semibold">${program.code || 'Program'}</span>
                            </div>

                            <div class="overlay-shine"></div>

                            <div class="absolute bottom-0 left-0 right-0 p-5">
                                <h3 class="text-xl font-extrabold text-white drop-shadow-lg">${program.name}</h3>
                                <p class="text-white/90 text-sm mt-1 line-clamp-2">${program.description || 'No description provided'}</p>
                                <div class="mt-4 flex items-center justify-between">
                                    <div class="flex gap-2 text-white">
                                        <div class="rounded-full border border-white/40 p-2 bg-white/10"><i data-feather="database" class="w-4 h-4"></i></div>
                                        <div class="rounded-full border border-white/40 p-2 bg-white/10"><i data-feather="book" class="w-4 h-4"></i></div>
                                    </div>
                                    <span class="px-3 py-1 bg-undefined-500/20 text-undefined-300 rounded-full text-xs font-medium">${durationText}</span>
                                </div>
                            </div>

                            <div class="absolute inset-0 pointer-events-none">
                                <div class="absolute -top-24 -right-24 h-48 w-48 rounded-full bg-undefined-500/30 blur-3xl"></div>
                                <div class="absolute -bottom-20 -left-16 h-40 w-40 rounded-full bg-undefined-600/30 blur-3xl"></div>
                            </div>
                        </div>
                    `;
                    
                    // Add click event to open modal
                    card.addEventListener('click', () => openProgramModal(program, programId));
                    
                    programsContainer.appendChild(card);
                });
                
                feather.replace();
                
            }).catch((error) => {
                console.error("Error fetching programs: ", error);
                emptyState?.classList.remove('hidden');
            });
        }

        // Open program modal
        function openProgramModal(program, programId) {
            currentProgram = program;
            currentProgramId = programId;
            
            // Format dates
            const createdDate = program.createdAt?.toDate ? program.createdAt.toDate() : new Date();
            const formattedDate = createdDate.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
            
            // Duration text
            const durationText = program.duration === 1 ? '1 Year' : `${program.duration} Years`;
            
            // Set modal content (guard elements)
            if (modalImage) modalImage.src = program.imageUrl || 'https://images.unsplash.com/photo-1532094349884-543bc11b234d?q=80&w=1400&auto=format&fit=crop';
            if (modalName) modalName.textContent = program.name;
            if (modalCode) modalCode.textContent = program.code || 'PROGRAM';
            if (modalDescription) modalDescription.textContent = program.description || 'No description provided';
            if (modalDuration) modalDuration.textContent = durationText;
            if (modalFullDuration) modalFullDuration.textContent = durationText;
            if (modalCredits) modalCredits.textContent = `${program.credits || 0} Credits`;
            if (modalFullCredits) modalFullCredits.textContent = `${program.credits || 0} Credits`;
            if (modalCreated) modalCreated.textContent = formattedDate;
            
            // Clear and add specializations
            if (modalSpecializations) {
                modalSpecializations.innerHTML = '';
                (program.specializations || []).forEach(spec => {
                    const span = document.createElement('span');
                    span.className = 'px-3 py-1.5 bg-slate-800/50 text-slate-300 rounded-full text-sm';
                    span.textContent = spec;
                    modalSpecializations.appendChild(span);
                });
            }
            // update view (open in new tab) button
            if (viewProgramBtn) {
                viewProgramBtn.disabled = false;
                viewProgramBtn.onclick = () => {
                    // open a small manager page in a new tab
                    if (!currentProgramId) return;
                    const url = `manage-program.html?id=${encodeURIComponent(currentProgramId)}`;
                    window.open(url, '_blank');
                };
            }
            // Show modal
            if (programModal) programModal.classList.remove('opacity-0', 'pointer-events-none');
            if (modalContent) modalContent.classList.remove('scale-95');
            document.body.style.overflow = 'hidden';
        }

        // Close modal
        function closeProgramModal() {
            if (programModal) programModal.classList.add('opacity-0', 'pointer-events-none');
            if (modalContent) modalContent.classList.add('scale-95');
            document.body.style.overflow = '';
            currentProgram = null;
            currentProgramId = null;
            if (viewProgramBtn) viewProgramBtn.disabled = true;
        }

        // Delete program
        function deleteCurrentProgram() {
            if (!currentProgramId) return;
            
            const deptId = localStorage.getItem('currentDeptId');
            if (!deptId) {
                window.location.href = 'index.html';
                return;
            }
            
            if (!confirm(`Are you sure you want to delete "${currentProgram.name}"? This action cannot be undone.`)) {
                return;
            }
            
            if (deleteProgramBtn) {
                deleteProgramBtn.innerHTML = '<i data-feather="loader" class="animate-spin w-5 h-5"></i> Deleting...';
                deleteProgramBtn.disabled = true;
                feather.replace();
            }
            
            db.collection('departments').doc(deptId).collection('programs')
                .doc(currentProgramId).delete()
                .then(() => {
                    closeProgramModal();
                    const s = searchInput?.value?.trim() || '';
                    const d = durationFilter?.value || '';
                    fetchPrograms(s, d);
                })
                .catch((error) => {
                    console.error("Error deleting program: ", error);
                    alert("Failed to delete program: " + error.message);
                })
                .finally(() => {
                    if (deleteProgramBtn) {
                        deleteProgramBtn.innerHTML = '<i data-feather="trash-2"></i> Delete';
                        deleteProgramBtn.disabled = false;
                        feather.replace();
                    }
                });
        }

        // Edit program
        function editCurrentProgram() {
            if (!currentProgramId) return;
            window.location.href = `programs.html?id=${currentProgramId}`;
        }

        // NOTE: Event listeners are attached after DOMContentLoaded when elements exist

        // Initialize
        document.addEventListener('DOMContentLoaded', () => {
            // assign DOM element references now that DOM is ready
            programsContainer = document.getElementById('programsContainer');
            emptyState = document.getElementById('emptyState');
            programModal = document.getElementById('programModal');
            modalContent = programModal ? programModal.querySelector('.modal-content') : null;
            closeModal = document.getElementById('closeModal');
            searchInput = document.getElementById('search');
            durationFilter = document.getElementById('duration');
            applyFilters = document.getElementById('applyFilters');

            modalImage = document.getElementById('modalImage');
            modalName = document.getElementById('modalName');
            modalCode = document.getElementById('modalCode');
            modalDescription = document.getElementById('modalDescription');
            modalDuration = document.getElementById('modalDuration');
            modalFullDuration = document.getElementById('modalFullDuration');
            modalCredits = document.getElementById('modalCredits');
            modalFullCredits = document.getElementById('modalFullCredits');
            modalCreated = document.getElementById('modalCreated');
            modalSpecializations = document.getElementById('modalSpecializations');
            viewProgramBtn = document.getElementById('viewProgram');
            if (viewProgramBtn) viewProgramBtn.disabled = true;
            editProgramBtn = document.getElementById('editProgram');
            deleteProgramBtn = document.getElementById('deleteProgram');

            AOS.init({
                duration: 600,
                easing: 'ease-out-quad',
                once: true
            });

            // Attach event listeners now that elements are available
            if (closeModal) closeModal.addEventListener('click', closeProgramModal);
            if (programModal) programModal.addEventListener('click', (e) => {
                if (e.target === programModal) closeProgramModal();
            });
            if (editProgramBtn) editProgramBtn.addEventListener('click', editCurrentProgram);
            if (viewProgramBtn) viewProgramBtn.addEventListener('click', () => {
                // if user clicks view from modal, open in new tab (click handler also set when modal opens)
                if (!currentProgramId) return;
                const url = `manage-program.html?id=${encodeURIComponent(currentProgramId)}`;
                window.open(url, '_blank');
            });
            if (deleteProgramBtn) deleteProgramBtn.addEventListener('click', deleteCurrentProgram);
            if (applyFilters) applyFilters.addEventListener('click', () => {
                fetchPrograms(searchInput?.value?.trim() || '', durationFilter?.value || '');
            });
            if (searchInput) searchInput.addEventListener('keyup', (e) => {
                if (e.key === 'Enter') fetchPrograms(searchInput.value.trim(), durationFilter?.value || '');
            });

            // Check authentication
            auth.onAuthStateChanged(user => {
                if (!user) {
                    window.location.href = 'index.html';
                } else {
                    fetchPrograms();
                }
            });

            feather.replace();
        });

        // Escape key to close modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && programModal && !programModal.classList.contains('pointer-events-none')) {
                closeProgramModal();
            }
        });