// // Firebase config + persistence
// const firebaseConfig = {
//     apiKey: "AIzaSyCPV_mXojZBR-Dew8RuZSi9jv9X6rc_D90",
//     authDomain: "mentora-71f5c.firebaseapp.com",
//     projectId: "mentora-71f5c",
//     storageBucket: "mentora-71f5c.appspot.com",
//     messagingSenderId: "16685388211",
//     appId: "1:16685388211:web:7eed812660439dec7b3bc6",
//     measurementId: "G-BL98PXGK2G"
// };

// firebase.initializeApp(firebaseConfig);
// const db = firebase.firestore();
// const auth = firebase.auth();

// // State
// let programs = [];
// let classes = [];
// let selectedProgramId = '';
// let selectedYear = '';

// // UI refs
// const createClassBtn = document.getElementById('createClassBtn');
// const createClassModal = document.getElementById('createClassModal');
// const closeModal = document.getElementById('closeModal');
// const modalOverlay = createClassModal.querySelector('.modal-overlay');
// const createClassForm = document.getElementById('createClassForm');
// const randomPoster = document.getElementById('randomPoster');
// const posterPreview = document.getElementById('posterPreview');
// const posterUrl = document.getElementById('posterUrl');
// const programSelect = document.getElementById('programSelect');
// const yearSelect = document.getElementById('yearSelect');
// const refreshBtn = document.getElementById('refreshBtn');
// const searchInput = document.getElementById('searchInput');

// // Recent activities
// const recentActivitiesGrid = document.getElementById('recentActivitiesGrid');

// // Pentagon canvas
// const pentagonCanvas = document.getElementById('pentagonCanvas');
// const pentagonPlayBtn = document.getElementById('pentagonPlay');
// const pentagonResetBtn = document.getElementById('pentagonReset');
// const pentagonLegend = document.getElementById('pentagonLegend');

// // Utility
// function generateRandomPosterUrl() {
//     const categories = ['education','technology','science','business','engineering','medical','workspace','abstract'];
//     const cat = categories[Math.floor(Math.random()*categories.length)];
//     return `https://picsum.photos/seed/${cat}/640/360`;
// }

// // Fetch programs
// async function fetchPrograms() {
//     const deptId = localStorage.getItem('currentDeptId');
//     if (!deptId) {
//         programs = [
//             { id: 'p-cs', name: 'Computer Science', duration: 4 },
//             { id: 'p-biz', name: 'Business', duration: 4 },
//             { id: 'p-eng', name: 'Engineering', duration: 4 },
//             { id: 'p-med', name: 'Medicine', duration: 5 }
//         ];
//         renderProgramFilters();
//         populateProgramSelect();
//         return;
//     }

//     try {
//         const snapshot = await db.collection('departments').doc(deptId).collection('programs').get();
//         programs = [];
//         snapshot.forEach(doc => programs.push({ id: doc.id, ...doc.data() }));
//         renderProgramFilters();
//         populateProgramSelect();
//     } catch (err) {
//         console.error('Error fetching programs', err);
//     }
// }

// // Fetch classes and apply filters
// async function fetchClasses() {
//     const deptId = localStorage.getItem('currentDeptId');
//     try {
//         if (!deptId) {
//             // Demo data for dev
//             const now = new Date();
//             const older = new Date(Date.now() - 40 * 24 * 60 * 60 * 1000);
//             classes = [
//                 { id: 'c1', name: 'Advanced Algorithms', programId: 'p-cs', year: '3', maxCapacity: 30, imageUrl: generateRandomPosterUrl(), instructor: 'Prof. Johnson', students: 24, createdAt: now.toISOString() },
//                 { id: 'c2', name: 'Financial Markets', programId: 'p-biz', year: '2', maxCapacity: 45, imageUrl: generateRandomPosterUrl(), instructor: 'Dr. Smith', students: 45, createdAt: older.toISOString() },
//                 { id: 'c3', name: 'Thermodynamics', programId: 'p-eng', year: '2', maxCapacity: 35, imageUrl: generateRandomPosterUrl(), instructor: 'Prof. Williams', students: 18, createdAt: now.toISOString() }
//             ];
//             renderAll();
//             return;
//         }

//         let query = db.collection('departments').doc(deptId).collection('classes');
//         if (selectedProgramId) query = query.where('programId','==', selectedProgramId);
//         const snapshot = await query.get();
//         classes = [];
//         snapshot.forEach(doc => classes.push({ id: doc.id, ...doc.data() }));

//         // Apply year filter locally
//         let filtered = classes;
//         if (selectedYear) filtered = filtered.filter(c => String(c.year) === String(selectedYear));

//         renderAll(filtered);
//     } catch (err) {
//         console.error('Error fetching classes', err);
//     }
// }

// // Render program chips
// function renderProgramFilters() {
//     const container = document.getElementById('programsFilter');
//     if (!container) return;
//     container.innerHTML = '<button class="chip'+(selectedProgramId? '':' active')+'" data-program="">All Programs</button>' +
//         programs.map(p => `<button class="chip ${selectedProgramId===p.id? 'active':''}" data-program="${p.id}">${p.name}</button>`).join('');

//     container.querySelectorAll('.chip').forEach(btn => {
//         btn.onclick = function() {
//             selectedProgramId = this.getAttribute('data-program') || '';
//             container.querySelectorAll('.chip').forEach(b => b.classList.remove('active'));
//             this.classList.add('active');
//             // Reset year filter when switching program
//             selectedYear = '';
//             renderYearFilters();
//             fetchClasses();
//         }
//     });
// }

// // Populate program select in modal
// function populateProgramSelect() {
//     if (!programSelect) return;
//     programSelect.innerHTML = '<option value="">Select Program</option>' + programs.map(p => `<option value="${p.id}">${p.name}</option>`).join('');
// }

// // Render year chips
// function renderYearFilters() {
//     const container = document.getElementById('yearFilter');
//     if (!container) return;
//     const years = ['', '1','2','3','4','5'];
//     container.innerHTML = years.map(y => `<button class="chip ${selectedYear===String(y)? 'active':''}" data-year="${y}">${y? 'Year '+y : 'All Years'}</button>`).join('');
//     container.querySelectorAll('.chip').forEach(btn => {
//         btn.onclick = function() {
//             selectedYear = this.getAttribute('data-year') || '';
//             container.querySelectorAll('.chip').forEach(b=>b.classList.remove('active'));
//             this.classList.add('active');
//             fetchClasses();
//         }
//     });
// }

// // Render classes grid
// function renderClasses(list = classes) {
//     const container = document.getElementById('classesGrid');
//     const classCount = document.getElementById('classCount');
//     if (!container) return;

//     // Simple search filter
//     const q = (searchInput?.value || '').toLowerCase().trim();
//     let filtered = list;
//     if (q) {
//         filtered = list.filter(c => c.name.toLowerCase().includes(q) || (c.instructor||'').toLowerCase().includes(q));
//     }

//     if (!filtered.length) {
//         container.innerHTML = `<div class="glass rounded-2xl p-8 text-center col-span-full">
//             <i data-feather="book" class="w-16 h-16 text-gray-500 mx-auto mb-4"></i>
//             <h3 class="text-xl font-semibold text-gray-300 mb-2">No Classes Found</h3>
//             <p class="text-gray-400 mb-4">Try adjusting filters or search term</p>
//         </div>`;
//         feather.replace();
//         if (classCount) classCount.textContent = '0';
//         return;
//     }

//     if (classCount) classCount.textContent = String(filtered.length);

//     container.innerHTML = filtered.map((c, i) => {
//         const program = programs.find(p => p.id === c.programId) || { name: c.program || 'Unknown' };
//         const students = c.students || Math.floor(Math.random() * (c.maxCapacity || 30));
//         const capacity = c.maxCapacity || 30;
//         const percent = capacity ? Math.round((students / capacity) * 100) : 0;

//         // NEW badge if created within last 30 days
//         const created = c.createdAt ? new Date(c.createdAt) : new Date();
//         const isNew = (Date.now() - created.getTime()) < (30 * 24 * 60 * 60 * 1000);

//         return `
//         <div class="glass rounded-2xl p-5 border border-white/10 shadow-glass cursor-pointer animate__animated animate__fadeInUp" onclick="viewClassDetails('${c.id}')" style="animation-delay: ${i*60}ms">
//             <div class="flex justify-between items-start mb-4">
//                 <div>
//                     <h3 class="font-bold text-lg">${c.name}</h3>
//                     <p class="text-sm text-gray-400">${program.name} • Year ${c.year || 'N/A'}</p>
//                 </div>
//                 <div class="flex items-center gap-2">
//                     ${isNew ? '<span class="px-2 py-1 bg-secondary-500/20 text-secondary-200 rounded-full text-xs">NEW</span>' : ''}
//                     <span class="px-2 py-1 ${percent>=100? 'badge-full' : percent>80? 'badge-almost' : 'badge-active'} rounded-full text-xs">${percent>=100? 'Full' : percent>80? 'Almost' : 'Active'}</span>
//                 </div>
//             </div>
//             <div class="mb-4">
//                 <div class="flex justify-between text-sm mb-1">
//                     <span>Students</span>
//                     <span>${students}/${capacity}</span>
//                 </div>
//                 <div class="tiny-bar"><i style="--w: ${percent}%"></i></div>
//             </div>
//             <div class="flex justify-between items-center">
//                 <div class="text-sm text-gray-400">
//                     <i data-feather="user" class="w-4 h-4 inline mr-1"></i>
//                     ${c.instructor || 'Instructor'}
//                 </div>
//                 <button class="glass p-2 rounded-lg hover:bg-white/10 transition-all">
//                     <i data-feather="more-vertical" class="w-4 h-4"></i>
//                 </button>
//             </div>
//         </div>`;
//     }).join('');

//     feather.replace();
// }

// // Recent activities (grid of small cards)
// function renderRecentActivities(list = classes) {
//     if (!recentActivitiesGrid) return;

//     // Choose most recent 4 classes by createdAt
//     const recent = [...list]
//         .filter(c => !!c.createdAt)
//         .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
//         .slice(0, 4);

//     recentActivitiesGrid.innerHTML = recent.map((c, i) => {
//         const program = programs.find(p => p.id === c.programId)?.name || 'General';
//         const students = c.students || 0;
//         const capacity = c.maxCapacity || 0;
//         const daysAgo = Math.floor((Date.now() - new Date(c.createdAt).getTime()) / (24*60*60*1000));
//         return `
//             <div class="glass rounded-xl p-4 border border-white/10 shadow-glass animate__animated animate__fadeInUp" style="animation-delay: ${i*80}ms">
//                 <div class="flex justify-between items-center mb-2">
//                     <span class="text-xs text-gray-400">${daysAgo === 0 ? 'Today' : `${daysAgo} days ago`}</span>
//                     <span class="text-xs px-2 py-1 rounded-full bg-white/5">${program}</span>
//                 </div>
//                 <div class="font-semibold">${c.name}</div>
//                 <div class="text-xs text-gray-400">${students}/${capacity} enrolled</div>
//                 <div class="mt-2 text-xs text-gray-300">Instructor: ${c.instructor || '—'}</div>
//             </div>
//         `;
//     }).join('');
// }

// // Update stats and distribution
// function updateStatsAndDistribution(list = classes) {
//     const total = list.length;
//     const totalCapacity = list.reduce((s, c) => s + (c.maxCapacity||0), 0) || 0;
//     const students = list.reduce((s, c) => s + (c.students || 0), 0) || 0;
//     const enrollRate = totalCapacity ? Math.round((students / totalCapacity) * 100) : 0;

//     // Update "Enrollment Growth" text (demo: derive from enrollment rate changes)
//     const enrollmentGrowthEl = document.getElementById('enrollmentGrowth');
//     if (enrollmentGrowthEl) {
//         // naive fake growth: base on rate vs 100
//         const growth = Math.max(0, Math.round((enrollRate - 50) / 5)); // just a fun number
//         enrollmentGrowthEl.textContent = `+${growth}%`;
//     }

//     // Program distribution
//     const countsByProgram = programs.map(p => ({ id: p.id, name: p.name, count: list.filter(c => c.programId === p.id).length }));
//     const totalForDist = countsByProgram.reduce((s, x) => s + x.count, 0) || 1;
//     countsByProgram.sort((a,b)=> b.count - a.count);

//     const grid = document.getElementById('programDistributionGrid');
//     if (grid) {
//         grid.innerHTML = countsByProgram.map((p, i) => {
//             const pct = Math.round((p.count / totalForDist) * 100);
//             const activeCls = i === 0 ? 'border-primary-500/50 ring-2 ring-primary-400/10' : '';
//             return `
//                 <div class="glass rounded-xl p-4 ${activeCls}">
//                     <div class="flex items-center gap-3 mb-3">
//                         <div class="w-3 h-3 rounded-full ${i===0? 'bg-primary-500' : i===1? 'bg-secondary-500' : i===2? 'bg-cyan-500' : 'bg-pink-500'}"></div>
//                         <span class="text-sm">${p.name}</span>
//                         <span class="ml-auto text-xs text-gray-400">${p.count} classes</span>
//                     </div>
//                     <div class="text-2xl font-bold">${pct}%</div>
//                     <div class="tiny-bar mt-2"><i style="--w: ${pct}%"></i></div>
//                 </div>`;
//         }).join('');
//     }

//     // Also update pentagon
//     renderPentagon(countsByProgram);
// }

// // Pentagonal (radar-style) canvas visualization
// let pentagonAnim = null;
// function renderPentagon(programCounts) {
//     if (!pentagonCanvas) return;
//     const ctx = pentagonCanvas.getContext('2d');
//     const dpr = window.devicePixelRatio || 1;
//     const rect = pentagonCanvas.getBoundingClientRect();
//     pentagonCanvas.width = rect.width * dpr;
//     pentagonCanvas.height = rect.height * dpr;
//     ctx.scale(dpr, dpr);

//     const cx = rect.width / 2;
//     const cy = rect.height / 2;
//     const radius = Math.min(rect.width, rect.height) * 0.38;

//     // Build dataset (top 5)
//     const top = programCounts
//         .sort((a,b) => b.count - a.count)
//         .slice(0,5);
//     const labels = top.map(x => x.name);
//     const values = top.map(x => x.count);
//     const maxVal = Math.max(1, ...values);
//     const n = labels.length;

//     // Legend
//     pentagonLegend.innerHTML = labels.map((lbl, idx) => {
//         const val = values[idx];
//         const pct = maxVal ? Math.round((val / maxVal) * 100) : 0;
//         const colors = ['bg-primary-500','bg-secondary-500','bg-cyan-500','bg-pink-500','bg-yellow-500'];
//         return `
//             <div class="flex items-center justify-between gap-3">
//                 <div class="flex items-center gap-2">
//                     <span class="inline-block w-3 h-3 rounded-full ${colors[idx%colors.length]}"></span>
//                     <span class="text-sm text-gray-300">${lbl}</span>
//                 </div>
//                 <div class="text-sm text-gray-400">${val} classes</div>
//             </div>
//         `;
//     }).join('');

//     // Clear
//     ctx.clearRect(0,0,rect.width,rect.height);

//     // Grid
//     const levels = 4;
//     ctx.strokeStyle = 'rgba(255,255,255,0.15)';
//     ctx.lineWidth = 1;
//     for (let l = 1; l <= levels; l++) {
//         const r = (radius / levels) * l;
//         ctx.beginPath();
//         for (let i=0; i<n; i++) {
//             const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
//             const x = cx + r * Math.cos(angle);
//             const y = cy + r * Math.sin(angle);
//             if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
//         }
//         ctx.closePath();
//         ctx.stroke();
//     }

//     // Axes + labels
//     ctx.fillStyle = 'rgba(255,255,255,0.75)';
//     ctx.font = '12px Inter, system-ui, sans-serif';
//     ctx.textAlign = 'center';
//     ctx.textBaseline = 'middle';
//     for (let i=0; i<n; i++) {
//         const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
//         const x = cx + (radius + 14) * Math.cos(angle);
//         const y = cy + (radius + 14) * Math.sin(angle);
//         // axis line
//         const ax = cx + radius * Math.cos(angle);
//         const ay = cy + radius * Math.sin(angle);
//         ctx.beginPath();
//         ctx.moveTo(cx, cy);
//         ctx.lineTo(ax, ay);
//         ctx.strokeStyle = 'rgba(255,255,255,0.08)';
//         ctx.stroke();
//         // label
//         ctx.fillText(labels[i], x, y);
//     }

//     // Data polygon with animation
//     const points = values.map((val, i) => {
//         const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
//         const r = radius * (val / maxVal);
//         return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
//     });

//     // Animate drawing
//     if (pentagonAnim) cancelAnimationFrame(pentagonAnim);
//     const start = performance.now();
//     const duration = 800;
//     function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }

//     function frame(now) {
//         const p = Math.min(1, (now - start) / duration);
//         const e = easeOutCubic(p);

//         // Clear
//         ctx.clearRect(0,0,rect.width,rect.height);

//         // Re-draw grid and labels (same as above)
//         // Grid
//         ctx.strokeStyle = 'rgba(255,255,255,0.15)';
//         ctx.lineWidth = 1;
//         for (let l = 1; l <= levels; l++) {
//             const r = (radius / levels) * l;
//             ctx.beginPath();
//             for (let i=0; i<n; i++) {
//                 const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
//                 const x = cx + r * Math.cos(angle);
//                 const y = cy + r * Math.sin(angle);
//                 if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
//             }
//             ctx.closePath();
//             ctx.stroke();
//         }
//         // Axes + labels
//         ctx.fillStyle = 'rgba(255,255,255,0.75)';
//         ctx.font = '12px Inter, system-ui, sans-serif';
//         ctx.textAlign = 'center';
//         ctx.textBaseline = 'middle';
//         for (let i=0; i<n; i++) {
//             const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
//             const x = cx + (radius + 14) * Math.cos(angle);
//             const y = cy + (radius + 14) * Math.sin(angle);
//             const ax = cx + radius * Math.cos(angle);
//             const ay = cy + radius * Math.sin(angle);
//             ctx.beginPath();
//             ctx.moveTo(cx, cy);
//             ctx.lineTo(ax, ay);
//             ctx.strokeStyle = 'rgba(255,255,255,0.08)';
//             ctx.stroke();
//             ctx.fillText(labels[i], x, y);
//         }

//         // Draw data polygon up to progress e
//         const currentPoints = [];
//         for (let i=0; i<n; i++) {
//             const angle = (Math.PI * 2 * i / n) - Math.PI / 2;
//             const targetR = radius * (values[i] / maxVal);
//             const r = targetR * e;
//             currentPoints.push({ x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) });
//         }

//         // Fill
//         const gradient = ctx.createLinearGradient(cx, cy - radius, cx, cy + radius);
//         gradient.addColorStop(0, 'rgba(168,85,247,0.35)');
//         gradient.addColorStop(1, 'rgba(84,119,255,0.20)');
//         ctx.beginPath();
//         currentPoints.forEach((pt, i) => i===0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
//         ctx.closePath();
//         ctx.fillStyle = gradient;
//         ctx.fill();

//         // Stroke
//         ctx.beginPath();
//         currentPoints.forEach((pt, i) => i===0 ? ctx.moveTo(pt.x, pt.y) : ctx.lineTo(pt.x, pt.y));
//         ctx.closePath();
//         ctx.strokeStyle = 'rgba(168,85,247,0.9)';
//         ctx.lineWidth = 2;
//         ctx.stroke();

//         // Points
//         currentPoints.forEach(pt => {
//             ctx.beginPath();
//             ctx.arc(pt.x, pt.y, 3, 0, Math.PI*2);
//             ctx.fillStyle = '#c084fc';
//             ctx.fill();
//         });

//         if (p < 1) pentagonAnim = requestAnimationFrame(frame);
//     }
//     pentagonAnim = requestAnimationFrame(frame);
// }

// // Create class to Firestore
// async function createClassToDb(formData) {
//     const deptId = localStorage.getItem('currentDeptId');
//     if (!deptId) {
//         // Local demo
//         const id = 'local-' + Math.random().toString(36).slice(2,9);
//         classes.push({ id, ...formData, students: 0, createdAt: new Date().toISOString() });
//         renderAll();
//         return;
//     }
//     try {
//         await db.collection('departments').doc(deptId).collection('classes').add({
//             ...formData,
//             createdAt: firebase.firestore.FieldValue.serverTimestamp()
//         });
//     } catch (err) {
//         console.error('Failed to create class:', err);
//         throw err;
//     }
// }

// // Open/Close modal
// function openModal() {
//     createClassModal.classList.add('modal-open');
//     createClassModal.classList.remove('opacity-0', 'pointer-events-none');
//     document.body.style.overflow = 'hidden';
//     // Preselect program if any
//     try {
//         if (selectedProgramId) {
//             programSelect.value = selectedProgramId;
//         }
//     } catch(e) {}
// }
// function closeModalFunc() {
//     createClassModal.classList.remove('modal-open');
//     createClassModal.classList.add('opacity-0', 'pointer-events-none');
//     document.body.style.overflow = '';
// }
// function setRandomPoster() {
//     const randomUrl = generateRandomPosterUrl();
//     posterPreview.src = randomUrl;
//     posterUrl.value = randomUrl;
// }

// // Global helper
// function viewClassDetails(id) {
//     window.open(`class-dashboard.html?classId=${id}`, '_blank');
// }

// // Render pipeline
// function renderAll(list = classes) {
//     renderClasses(list);
//     renderRecentActivities(list);
//     updateStatsAndDistribution(list);
// }

// // Event listeners
// createClassBtn?.addEventListener('click', openModal);
// closeModal?.addEventListener('click', closeModalFunc);
// modalOverlay?.addEventListener('click', closeModalFunc);
// randomPoster?.addEventListener('click', setRandomPoster);
// refreshBtn?.addEventListener('click', () => fetchClasses());
// searchInput?.addEventListener('input', () => renderAll(classes));

// // Pentagon controls
// pentagonPlayBtn?.addEventListener('click', () => renderPentagon(
//     programs.map(p => ({ id: p.id, name: p.name, count: classes.filter(c => c.programId === p.id).length }))
// ));
// pentagonResetBtn?.addEventListener('click', () => renderPentagon(
//     programs.map(p => ({ id: p.id, name: p.name, count: classes.filter(c => c.programId === p.id).length }))
// ));

// // Form submission
// createClassForm?.addEventListener('submit', async function(e) {
//     e.preventDefault();
//     const className = document.getElementById('className').value.trim();
//     const programId = programSelect.value;
//     const yearValue = (document.getElementById('yearSelect').value || '').replace(/[^0-9]/g, '');
//     const capacityValue = parseInt(document.getElementById('capacity').value, 10) || 0;
//     const instructorValue = document.getElementById('instructor').value.trim();
//     const posterValue = posterUrl.value || generateRandomPosterUrl();

//     if (!className || !programId || !yearValue) {
//         alert('Please fill class name, program and year.');
//         return;
//     }

//     const payload = {
//         name: className,
//         programId,
//         year: yearValue,
//         maxCapacity: capacityValue,
//         instructor: instructorValue,
//         imageUrl: posterValue
//     };

//     try {
//         await createClassToDb(payload);
//         alert(`Class "${className}" created successfully!`);
//         closeModalFunc();
//         createClassForm.reset();
//         setRandomPoster();
//         fetchClasses();
//     } catch (err) {
//         alert('Failed to create class: ' + (err.message || err));
//     }
// });

// // Escape closes modal
// document.addEventListener('keydown', function(e) {
//     if (e.key === 'Escape' && createClassModal && !createClassModal.classList.contains('opacity-0')) {
//         closeModalFunc();
//     }
// });

// // Init
// document.addEventListener('DOMContentLoaded', function() {
//     feather.replace();

//     // AOS init (if you want scroll animations)
//     try { AOS.init({ once: true }); } catch(e) {}

//     renderYearFilters();

//     try {
//         if (auth && typeof auth.onAuthStateChanged === 'function') {
//             auth.onAuthStateChanged((user) => {
//                 fetchPrograms();
//                 fetchClasses();
//             });
//         } else {
//             fetchPrograms();
//             fetchClasses();
//         }
//     } catch (err) {
//         fetchPrograms();
//         fetchClasses();
//     }
// });