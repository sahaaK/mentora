class BubbleBackground extends HTMLElement {
    connectedCallback() {
        this.attachShadow({ mode: 'open' });
        this.shadowRoot.innerHTML = `
            <style>
                :host {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    z-index: 0;
                    overflow: hidden;
                }
                
                .bubble {
                    position: absolute;
                    border-radius: 50%;
                    background: rgba(99, 102, 241, 0.1);
                    filter: blur(60px);
                    animation: float 15s infinite ease-in-out;
                }
                
                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0);
                    }
                    50% {
                        transform: translateY(-100px) translateX(50px);
                    }
                }
            </style>
            <div id="bubbles"></div>
        `;
        
        this.createBubbles();
    }
    
    createBubbles() {
        const bubblesContainer = this.shadowRoot.getElementById('bubbles');
        const colors = [
            'rgba(99, 102, 241, 0.1)',  // indigo
            'rgba(217, 70, 239, 0.1)',  // pink
            'rgba(6, 182, 212, 0.1)',   // cyan
            'rgba(139, 92, 246, 0.1)'    // violet
        ];
        
        for (let i = 0; i < 10; i++) {
            const bubble = document.createElement('div');
            bubble.className = 'bubble';
            
            const size = Math.random() * 300 + 100;
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.background = color;
            bubble.style.left = `${Math.random() * 100}%`;
            bubble.style.top = `${Math.random() * 100}%`;
            bubble.style.animationDuration = `${Math.random() * 15 + 10}s`;
            bubble.style.animationDelay = `${Math.random() * 5}s`;
            
            bubblesContainer.appendChild(bubble);
        }
    }
}

customElements.define('bubble-background', BubbleBackground);
// Also provide a simple global initializer for projects that prefer
// injecting a plain `.bubble-container` div (matches final.html style).
window.initBubbleBackground = function initBubbleBackground(opts = {}) {
    const count = Number(opts.count) || 15;
    const containerClass = opts.containerClass || 'bubble-container';
    const elementClass = opts.elementClass || 'bubble';

    // find existing container or create one
    let container = document.querySelector(`.${containerClass}`);
    if (!container) {
        container = document.createElement('div');
        container.className = containerClass;
        container.style.position = 'fixed';
        container.style.inset = '0';
        container.style.zIndex = opts.zIndex != null ? String(opts.zIndex) : '-1';
        container.style.pointerEvents = 'none';
        document.body.appendChild(container);
    }

    // avoid recreating if it already has bubbles created by this initializer
    if (container.dataset.bubbleInit === '1') return container;

    const colors = opts.colors || [
        'radial-gradient(circle at 30% 30%, rgba(99, 102, 241, 0.1), rgba(147, 51, 234, 0.05))',
        'radial-gradient(circle at 30% 30%, rgba(84, 119, 255, 0.08), rgba(168, 85, 247, 0.04))'
    ];

    for (let i = 0; i < count; i++) {
        const bubble = document.createElement('div');
        bubble.className = elementClass;
        const size = Math.random() * 100 + 50;
        bubble.style.width = `${size}px`;
        bubble.style.height = `${size}px`;
        bubble.style.left = `${Math.random() * 120 - 10}%`;
        bubble.style.top = `${Math.random() * 120 - 10}%`;
        bubble.style.animationDelay = `${Math.random() * 10}s`;
        bubble.style.animationDuration = `${Math.random() * 12 + 12}s`;
        bubble.style.background = colors[Math.floor(Math.random() * colors.length)];
        bubble.style.borderRadius = '50%';
        bubble.style.position = 'absolute';
        bubble.style.pointerEvents = 'none';
        container.appendChild(bubble);
    }

    // mark as initialized by this helper to avoid duplicates
    container.dataset.bubbleInit = '1';
    return container;
};