// js/skills-network.js
// Interactive skills network visualisation — replaces static tag badges in the skills section

export function initSkillsNetwork() {
    const section = document.getElementById('skills');
    if (!section) return;

    // ── Build canvas ──────────────────────────────────────────────────────
    const wrapper = document.createElement('div');
    wrapper.id = 'skills-canvas-wrapper';
    wrapper.style.cssText = `
        width: 100%;
        height: 320px;
        margin-top: 2rem;
        position: relative;
        border: 1px solid var(--border-color);
        border-radius: 6px;
        overflow: hidden;
        background: var(--card-bg);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        transition: background-color 0.4s ease, border-color 0.4s ease;
    `;

    const canvas = document.createElement('canvas');
    canvas.id = 'skills-canvas';
    canvas.style.cssText = 'width:100%;height:100%;display:block;';
    wrapper.appendChild(canvas);

    const hint = document.createElement('p');
    hint.style.cssText = `
        position: absolute;
        bottom: 10px;
        right: 14px;
        font-family: 'JetBrains Mono', monospace;
        font-size: 0.65rem;
        letter-spacing: 0.08em;
        text-transform: uppercase;
        color: var(--text-body);
        pointer-events: none;
        transition: color 0.4s ease;
    `;
    hint.textContent = 'Hover to explore';
    wrapper.appendChild(hint);

    // Insert after the static skills-stack
    const stack = section.querySelector('.skills-stack');
    if (stack) stack.after(wrapper);
    else section.appendChild(wrapper);

    // ── Skill nodes data ─────────────────────────────────────────────────
    const SKILLS = [
        // Core — centre cluster
        { label: 'PLC / TIA Portal', group: 'control',    size: 26 },
        { label: 'SCADA',            group: 'control',    size: 22 },
        { label: 'Ladder Logic',     group: 'control',    size: 18 },
        { label: 'HMI Design',       group: 'control',    size: 18 },
        // Power / Hardware cluster
        { label: 'BMS Design',       group: 'hardware',   size: 24 },
        { label: 'EV Systems',       group: 'hardware',   size: 22 },
        { label: 'ESP32',            group: 'hardware',   size: 20 },
        { label: 'PCB Design',       group: 'hardware',   size: 18 },
        { label: 'Sensor Integration', group: 'hardware', size: 17 },
        // Intelligence cluster
        { label: 'MATLAB/Simulink',  group: 'intelligence', size: 24 },
        { label: 'Digital Twins',    group: 'intelligence', size: 22 },
        { label: 'ML Inference',     group: 'intelligence', size: 20 },
        { label: 'Computer Vision',  group: 'intelligence', size: 19 },
        { label: 'IoT / MQTT',       group: 'intelligence', size: 18 },
        { label: 'Python',           group: 'intelligence', size: 18 },
        { label: 'C / C++',          group: 'intelligence', size: 17 },
    ];

    let COLORS = getThemeColors();

    function getThemeColors() {
        const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
        if (isDark) {
            return {
                control:      { node: '#F97316', text: '#FDBA74', line: 'rgba(249, 115, 22,0.25)' },
                hardware:     { node: '#06B6D4', text: '#67E8F9', line: 'rgba(6,182,212,0.25)'  },
                intelligence: { node: '#D946EF', text: '#F0ABFC', line: 'rgba(217,70,239,0.25)' },
            };
        } else {
            return {
                control:      { node: '#6D28D9', text: '#4C1D95', line: 'rgba(109,40,217,0.25)' },
                hardware:     { node: '#0891B2', text: '#164E63', line: 'rgba(8,145,178,0.25)'  },
                intelligence: { node: '#C026D3', text: '#701A75', line: 'rgba(192,38,211,0.25)' },
            };
        }
    }

    window.addEventListener('themeChanged', () => { COLORS = getThemeColors(); });

    // ── Canvas setup ─────────────────────────────────────────────────────
    let W, H, dpr;
    const ctx = canvas.getContext('2d');
    const mouse = { x: -9999, y: -9999 };
    let hovered = null;
    let animId = null;
    let active = false;

    function resize() {
        dpr = window.devicePixelRatio || 1;
        W = canvas.offsetWidth;
        H = canvas.offsetHeight;
        canvas.width  = W * dpr;
        canvas.height = H * dpr;
        ctx.setTransform(1,0,0,1,0,0);
        ctx.scale(dpr, dpr);
        placeNodes();
    }

    // ── Physics nodes ─────────────────────────────────────────────────────
    const nodes = [];

    function placeNodes() {
        nodes.length = 0;
        const groups = ['control', 'hardware', 'intelligence'];
        const centres = [
            { x: W * 0.22, y: H * 0.50 },
            { x: W * 0.52, y: H * 0.50 },
            { x: W * 0.80, y: H * 0.50 },
        ];

        SKILLS.forEach((s, i) => {
            const gi = groups.indexOf(s.group);
            const cx = centres[gi].x + (Math.random() - 0.5) * W * 0.22;
            const cy = centres[gi].y + (Math.random() - 0.5) * H * 0.55;
            nodes.push({
                ...s,
                x:  Math.max(s.size + 10, Math.min(W - s.size - 10, cx)),
                y:  Math.max(s.size + 10, Math.min(H - s.size - 10, cy)),
                vx: (Math.random() - 0.5) * 0.3,
                vy: (Math.random() - 0.5) * 0.3,
                tx: 0, ty: 0,   // target offsets from mouse
                scale: 1,
            });
        });
    }

    function lerp(a, b, t) { return a + (b - a) * t; }

    function updateNodes() {
        nodes.forEach((n, i) => {
            // Soft spring to group centre — very mild
            n.vx *= 0.97;
            n.vy *= 0.97;

            // Mouse attraction / repulsion
            const dx = n.x - mouse.x;
            const dy = n.y - mouse.y;
            const dist = Math.sqrt(dx*dx + dy*dy);
            const ATTRACT_R = 100;
            if (dist < ATTRACT_R && dist > 0) {
                const f = (1 - dist / ATTRACT_R) * 0.04;
                n.vx -= (dx / dist) * f;
                n.vy -= (dy / dist) * f;
            }

            // Node–node soft repulsion
            for (let j = i + 1; j < nodes.length; j++) {
                const m = nodes[j];
                const ex = n.x - m.x;
                const ey = n.y - m.y;
                const ed = Math.sqrt(ex*ex + ey*ey);
                const minD = n.size + m.size + 14;
                if (ed < minD && ed > 0) {
                    const f = (minD - ed) / minD * 0.06;
                    n.vx += (ex/ed)*f;
                    n.vy += (ey/ed)*f;
                    m.vx -= (ex/ed)*f;
                    m.vy -= (ey/ed)*f;
                }
            }

            n.x += n.vx;
            n.y += n.vy;

            // Wall bounce
            if (n.x < n.size) { n.x = n.size; n.vx = Math.abs(n.vx) * 0.5; }
            if (n.x > W - n.size) { n.x = W - n.size; n.vx = -Math.abs(n.vx) * 0.5; }
            if (n.y < n.size) { n.y = n.size; n.vy = Math.abs(n.vy) * 0.5; }
            if (n.y > H - n.size) { n.y = H - n.size; n.vy = -Math.abs(n.vy) * 0.5; }

            // Hover scale
            const isHov = (n === hovered);
            n.scale = lerp(n.scale, isHov ? 1.22 : 1, 0.12);
        });
    }

    function draw() {
        ctx.clearRect(0, 0, W, H);

        // Group connection lines (within same group)
        SKILLS.forEach((_, i) => {
            const a = nodes[i];
            for (let j = i+1; j < nodes.length; j++) {
                const b = nodes[j];
                if (a.group !== b.group) return;
                const dx = a.x - b.x, dy = a.y - b.y;
                const dist = Math.sqrt(dx*dx + dy*dy);
                if (dist > 180) return;
                const opacity = (1 - dist/180) * 0.5;
                ctx.beginPath();
                ctx.moveTo(a.x, a.y);
                ctx.lineTo(b.x, b.y);
                ctx.strokeStyle = COLORS[a.group].line.replace('0.25', opacity.toFixed(2));
                ctx.lineWidth = 1;
                ctx.stroke();
            }
        });

        // Cross-group lines (sparse — only nearest neighbour per node)
        nodes.forEach(a => {
            let nearest = null, nearDist = 200;
            nodes.forEach(b => {
                if (b.group === a.group) return;
                const d = Math.hypot(a.x - b.x, a.y - b.y);
                if (d < nearDist) { nearDist = d; nearest = b; }
            });
            if (!nearest) return;
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(nearest.x, nearest.y);
            ctx.strokeStyle = isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.04)';
            ctx.lineWidth = 0.8;
            ctx.stroke();
        });

        // Nodes
        nodes.forEach(n => {
            const c = COLORS[n.group];
            const r = n.size * n.scale;
            const isHov = (n === hovered);

            // Glow
            if (isHov) {
                const grd = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, r * 2.5);
                grd.addColorStop(0, c.node + '55');
                grd.addColorStop(1, 'transparent');
                ctx.fillStyle = grd;
                ctx.beginPath();
                ctx.arc(n.x, n.y, r * 2.5, 0, Math.PI * 2);
                ctx.fill();
            }

            // Circle
            ctx.beginPath();
            ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
            ctx.fillStyle = isHov ? c.node + 'FF' : c.node + 'BB';
            ctx.fill();

            // Label
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            ctx.font = `${isHov ? 600 : 400} ${Math.round(9 * n.scale)}px 'Inter', sans-serif`;
            ctx.fillStyle = isHov ? (isDark ? '#FFFFFF' : '#000000') : c.text;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(n.label, n.x, n.y + r + 11 * n.scale);
        });
    }

    function loop() {
        updateNodes();
        draw();
        animId = requestAnimationFrame(loop);
    }

    // ── IntersectionObserver — only animate when visible ─────────────────
    const io = new IntersectionObserver(entries => {
        entries.forEach(e => {
            if (e.isIntersecting && !active) {
                active = true;
                loop();
            } else if (!e.isIntersecting && active) {
                active = false;
                cancelAnimationFrame(animId);
            }
        });
    }, { threshold: 0.1 });
    io.observe(wrapper);

    // ── Events ────────────────────────────────────────────────────────────
    canvas.addEventListener('mousemove', e => {
        const rect = canvas.getBoundingClientRect();
        mouse.x = (e.clientX - rect.left);
        mouse.y = (e.clientY - rect.top);

        hovered = null;
        nodes.forEach(n => {
            const d = Math.hypot(n.x - mouse.x, n.y - mouse.y);
            if (d < n.size * 1.4) hovered = n;
        });
        canvas.style.cursor = hovered ? 'pointer' : 'default';
    });

    canvas.addEventListener('mouseleave', () => {
        mouse.x = -9999; mouse.y = -9999;
        hovered = null;
        canvas.style.cursor = 'default';
    });

    const resizeObs = new ResizeObserver(() => resize());
    resizeObs.observe(wrapper);

    resize();
}
