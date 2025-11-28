// // Create animated background bubbles
// function createBubbles() {
//     const container = document.querySelector('.bubble-container');
//     if (!container) return;
    
//     const bubbleCount = 15;
    
//     for (let i = 0; i < bubbleCount; i++) {
//         const bubble = document.createElement('div');
//         bubble.className = 'bubble';
        
//         const size = Math.random() * 100 + 50;
//         const left = Math.random() * 100;
//         const top = Math.random() * 100;
//         const delay = Math.random() * 10;
//         const duration = Math.random() * 10 + 10;
        
//         bubble.style.width = `${size}px`;
//         bubble.style.height = `${size}px`;
//         bubble.style.left = `${left}%`;
//         bubble.style.top = `${top}%`;
//         bubble.style.animationDelay = `${delay}s`;
//         bubble.style.animationDuration = `${duration}s`;
        
//         container.appendChild(bubble);
//     }
// }

// // Initialize animations
// document.addEventListener('DOMContentLoaded', () => {
//     createBubbles();
    
//     // Initialize Feather Icons
//     if (typeof feather !== 'undefined') {
//         feather.replace();
//     }
// });

// // Re-initialize icons when needed
// function refreshIcons() {
//     if (typeof feather !== 'undefined') {
//         feather.replace();
//     }
// }