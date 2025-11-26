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

        // Initialize Firebase
        firebase.initializeApp(firebaseConfig);
        const db = firebase.firestore();
        const auth = firebase.auth();

        

        // Create floating particles
        function createParticles() {
            const container = document.querySelector('.particles-container');
            const particleCount = 20;
            
            for (let i = 0; i < particleCount; i++) {
                const particle = document.createElement('div');
                particle.className = 'particle';
                
                const size = Math.random() * 100 + 50;
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

        

        // Initialize charts
        function initCharts() {
            // Attendance Chart
            const attendanceCtx = document.getElementById('attendanceChart').getContext('2d');
            new Chart(attendanceCtx, {
                type: 'line',
                data: {
                    labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
                    datasets: [{
                        label: 'Attendance Rate',
                        data: [82, 85, 88, 87, 89, 92],
                        backgroundColor: 'rgba(99, 102, 241, 0.2)',
                        borderColor: 'rgb(99, 102, 241)',
                        borderWidth: 2,
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: 'white',
                        pointBorderColor: 'rgb(99, 102, 241)',
                        pointBorderWidth: 2
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#e2e8f0',
                            bodyColor: '#94a3b8',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 12,
                            usePointStyle: true,
                            callbacks: {
                                label: function(context) {
                                    return ` ${context.parsed.y}%`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 70,
                            max: 100,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8',
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8'
                            }
                        }
                    },
                    elements: {
                        line: {
                            borderJoinStyle: 'round'
                        }
                    }
                }
            });

            // Performance Chart
            const performanceCtx = document.getElementById('performanceChart').getContext('2d');
            new Chart(performanceCtx, {
                type: 'bar',
                data: {
                    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
                    datasets: [{
                        label: 'Average Score',
                        data: [78, 85, 88, 82, 90],
                        backgroundColor: [
                            'rgba(139, 92, 246, 0.7)',
                            'rgba(124, 58, 237, 0.7)',
                            'rgba(109, 40, 217, 0.7)',
                            'rgba(91, 33, 182, 0.7)',
                            'rgba(76, 29, 149, 0.7)'
                        ],
                        borderColor: [
                            'rgba(139, 92, 246, 1)',
                            'rgba(124, 58, 237, 1)',
                            'rgba(109, 40, 217, 1)',
                            'rgba(91, 33, 182, 1)',
                            'rgba(76, 29, 149, 1)'
                        ],
                        borderWidth: 1,
                        borderRadius: 6,
                        borderSkipped: false
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            display: false
                        },
                        tooltip: {
                            backgroundColor: 'rgba(15, 23, 42, 0.9)',
                            titleColor: '#e2e8f0',
                            bodyColor: '#94a3b8',
                            borderColor: 'rgba(255, 255, 255, 0.1)',
                            borderWidth: 1,
                            padding: 12,
                            usePointStyle: true
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 70,
                            max: 100,
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8',
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(255, 255, 255, 0.05)',
                                drawBorder: false
                            },
                            ticks: {
                                color: '#94a3b8'
                            }
                        }
                    }
                }
            });
        }

        // Initialize
        document.addEventListener('DOMContentLoaded', async () => {
            createParticles();
            initCharts();
            
            // Animate performance fills
            setTimeout(() => {
                document.querySelectorAll('.performance-fill').forEach(bar => {
                    const width = bar.style.width;
                    bar.style.width = '0%';
                    setTimeout(() => {
                        bar.style.width = width;
                    }, 200);
                });
            }, 500);
            
            // Check authentication
            auth.onAuthStateChanged(async (user) => {
                if (!user) {
                    window.location.href = 'index.html';
                    return;
                }

                // Get current department ID from localStorage
                const deptId = localStorage.getItem('currentDeptId');
                if (!deptId) {
                    window.location.href = 'index.html';
                    return;
                }

                try {
                    // Fetch department data
                    const doc = await db.collection('departments').doc(deptId).get();
                    if (!doc.exists) {
                        throw new Error('Department not found');
                    }

                    const deptData = doc.data();
                    
                    // Update UI with department information
                    document.getElementById('portalTitle').textContent = `${deptData.dean.split(' ')[0] || 'Dean'}'s Portal`;
                    document.getElementById('departmentName').textContent = `${deptData.name} Management Portal`;
                    document.getElementById('userInitial').textContent = deptData.dean.charAt(0) || 'D';
                    document.getElementById('deanName').textContent = deptData.dean;
                    document.getElementById('deanTitle').textContent = `Dean of ${deptData.name}`;
                    
                    // Set mock statistics
                    const studentCount = Math.floor(Math.random() * 500) + 200;
                    document.getElementById('studentCount').textContent = studentCount;
                    document.getElementById('profileStudentCount').textContent = studentCount;
                    document.getElementById('courseCount').textContent = Math.floor(Math.random() * 30) + 15;
                    document.getElementById('facultyCount').textContent = Math.floor(Math.random() * 20) + 10;
                    document.getElementById('enrollmentRate').textContent = `${Math.floor(Math.random() * 20) + 80}%`;
                    
                    // Set dean experience
                    const experience = Math.floor(Math.random() * 15) + 5;
                    document.getElementById('deanExperience').textContent = `${experience} Years Exp`;
                    
                } catch (error) {
                    console.error("Error loading department data: ", error);
                }
            });

            feather.replace();
        });