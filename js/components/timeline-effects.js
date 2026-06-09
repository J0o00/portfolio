export function initTimelineCanvases() {
    const canvases = document.querySelectorAll('.timeline-canvas');
    if (!canvases.length) return;

    canvases.forEach(canvas => {
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let animationId;

        // Colors suited for both light and dark mode glassmorphism (cyan/blue tones)
        const colors = [
            'rgba(56, 189, 248, ', // Sky
            'rgba(99, 102, 241, ', // Indigo
            'rgba(6, 182, 212, '   // Cyan
        ];

        const init = () => {
            if (!canvas.parentElement) return;
            width = canvas.parentElement.offsetWidth;
            height = canvas.parentElement.offsetHeight;
            canvas.width = width * window.devicePixelRatio;
            canvas.height = height * window.devicePixelRatio;
            ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
            
            particles = [];
            
            // Background large glow orbs (like card 3)
            for(let i=0; i<3; i++) {
                particles.push({
                    type: 'orb',
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.3,
                    vy: (Math.random() - 0.5) * 0.3,
                    radius: Math.random() * 80 + 100, // 100-180px
                    alpha: Math.random() * 0.15 + 0.1, // Subtle opacity
                    color: colors[Math.floor(Math.random() * colors.length)],
                    pulseSpeed: Math.random() * 0.02 + 0.01,
                    pulseOffset: Math.random() * Math.PI * 2
                });
            }

            // Small floating particles (like card 1)
            for(let i=0; i<40; i++) {
                particles.push({
                    type: 'particle',
                    x: Math.random() * width,
                    y: Math.random() * height,
                    vx: (Math.random() - 0.5) * 0.5,
                    vy: (Math.random() - 0.5) * 0.5 - 0.1, // Slight upward drift
                    radius: Math.random() * 1.5 + 0.5,
                    alpha: Math.random() * 0.4 + 0.1,
                    color: colors[Math.floor(Math.random() * colors.length)],
                    pulseSpeed: Math.random() * 0.05 + 0.02,
                    pulseOffset: Math.random() * Math.PI * 2
                });
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);
            const time = Date.now() * 0.001;

            particles.forEach(p => {
                p.x += p.vx; 
                p.y += p.vy;
                
                // Wrap around bounds
                if (p.y < -p.radius) p.y = height + p.radius;
                if (p.y > height + p.radius) p.y = -p.radius;
                if (p.x < -p.radius) p.x = width + p.radius;
                if (p.x > width + p.radius) p.x = -p.radius;

                const twinkle = Math.sin(time * p.pulseSpeed * 100 + p.pulseOffset) * 0.5 + 0.5;
                const dynamicAlpha = p.alpha * (0.6 + twinkle * 0.4);

                ctx.beginPath();
                if (p.type === 'orb') {
                    // Soft glowing orb
                    const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.radius);
                    grad.addColorStop(0, p.color + dynamicAlpha + ')');
                    grad.addColorStop(1, p.color + '0)');
                    ctx.fillStyle = grad;
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                } else {
                    // Crisp particle
                    ctx.fillStyle = p.color + dynamicAlpha + ')';
                    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
                }
                ctx.fill();
            });
            animationId = requestAnimationFrame(animate);
        };

        init(); 
        animate();
        
        // Handle resize gracefully
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(init, 100);
        });

        // Use IntersectionObserver to pause off-screen animations
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    if (!animationId) animate();
                } else {
                    if (animationId) {
                        cancelAnimationFrame(animationId);
                        animationId = null;
                    }
                }
            });
        }, { threshold: 0 });
        
        if (canvas.parentElement) {
            observer.observe(canvas.parentElement);
        }
    });
}
