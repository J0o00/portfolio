/**
 * js/background.js
 * ─────────────────────────────────────────────────────────────────────────────
 * HIGH-DPI Canvas + Mouse-Reactive Network + Energy Pulse PCB Traces
 *
 * Canvas Memory Architecture:
 *   - ResizeObserver (not window resize) watches the canvas wrapper to detect
 *     size changes precisely. A debounce of 150ms prevents ghost frames during
 *     resize drag events.
 *   - On each resize: canvas.width/height are SET to the new logical size ×
 *     devicePixelRatio. Setting width/height implicitly clears the canvas and
 *     resets the 2D context state — no ghost frames can accumulate.
 *   - ctx.setTransform is called explicitly before ctx.scale() to reset any
 *     prior transforms, preventing compounding DPR scaling on repeated resizes.
 *   - The rAF loop is a single `requestAnimationFrame(animate)` call at the
 *     end of each frame — never nested or re-registered, so there is exactly
 *     one frame callback in flight at any time.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { motionPrefs } from './utils/accessibility.js';

export function initBackgroundAnimation() {
    const canvas = document.getElementById('bg-canvas');
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });

    // ── Logical (CSS) dimensions — updated by ResizeObserver ──────────────
    let W = 0, H = 0;

    const nodes   = [];
    const pulses  = [];
    const MAX_NODES          = 45;
    const MAX_PULSES         = 6;
    const CONNECTION_DIST    = 160;
    const PULSE_INTERVAL_MS  = 1800;

    const mouse = { x: -9999, y: -9999, active: false };
    const MOUSE_RADIUS = 200;
    const MOUSE_FORCE  = 0.06;

    // Engineering Research Platform — always dark navy background
    // BG_COLOR is unused (canvas draws over a CSS background-color body)
    let BG_COLOR   = '#08111F';
    // Domain-aware node colors: Power Electronics / Embedded Systems
    let NODE_RGB   = [249, 115, 22];   // Power Electronics orange
    let TRACE_RGB  = [14, 165, 233];   // Embedded Systems blue

    function updateThemeColors() {
        const theme = document.documentElement.getAttribute('data-theme');
        
        if (theme === 'light') {
            // Light mode background node trace colors: softer blue/orange
            TRACE_RGB = [14, 165, 233]; // light blue
            NODE_RGB  = [249, 115, 22];  // light orange
            BG_COLOR  = '#F8FAFC';       // (Not strictly drawn by canvas, but good to keep synced)
        } else {
            // Dark mode background node trace colors
            TRACE_RGB = [59, 130, 246];  // deep blue
            NODE_RGB  = [249, 115, 22];  // Power orange
            BG_COLOR  = '#08111F';
        }
    }
    updateThemeColors();
    window.addEventListener('themeChanged', updateThemeColors);

    // ── High-DPI Canvas Setup ─────────────────────────────────────────────
    function applyCanvasSize(logicalW, logicalH) {
        const dpr = window.devicePixelRatio || 1;
        // Setting .width/.height resets context state — no ghost frames
        canvas.width  = Math.round(logicalW * dpr);
        canvas.height = Math.round(logicalH * dpr);
        canvas.style.width  = logicalW + 'px';
        canvas.style.height = logicalH + 'px';
        // Reset transform to identity BEFORE scaling to avoid compound scaling
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.scale(dpr, dpr);
        W = logicalW;
        H = logicalH;
    }

    // ── ResizeObserver (more precise than window 'resize') ────────────────
    let resizeDebounce = null;
    const ro = new ResizeObserver(entries => {
        clearTimeout(resizeDebounce);
        resizeDebounce = setTimeout(() => {
            const entry = entries[entries.length - 1]; // only care about latest
            const { width, height } = entry.contentRect;
            applyCanvasSize(width, height);
            initNodes(); // redistribute nodes to new bounds
        }, 150); // 150ms debounce — prevents thrash during resize drag
    });

    // Observe the canvas parent (which is full-screen) rather than the canvas
    // itself (canvas dimensions change in response, not before)
    const parent = canvas.parentElement || document.body;
    ro.observe(parent);

    // Initial size
    applyCanvasSize(parent.clientWidth, parent.clientHeight);

    // ── Energy Pulse System ───────────────────────────────────────────────
    class Pulse {
        constructor(path) {
            this.path     = path;
            this.progress = 0;
            this.speed    = 0.004 + Math.random() * 0.003;
            this.opacity  = 0;
            this.alive    = true;
        }

        update() {
            this.progress += this.speed;
            if (this.progress >= 1) { this.alive = false; return; }
            // Fade envelope: linear in / plateau / linear out
            if      (this.progress < 0.10) this.opacity = this.progress / 0.10;
            else if (this.progress > 0.85) this.opacity = (1 - this.progress) / 0.15;
            else                           this.opacity = 1;
        }

        draw() {
            if (this.path.length < 2) return;
            const totalSegs  = this.path.length - 1;
            const segProg    = this.progress * totalSegs;
            const segIdx     = Math.min(Math.floor(segProg), totalSegs - 1);
            const segFrac    = segProg - segIdx;

            const a = nodes[this.path[segIdx]];
            const b = nodes[this.path[segIdx + 1]];
            if (!a || !b) return;

            const px = a.x + (b.x - a.x) * segFrac;
            const py = a.y + (b.y - a.y) * segFrac;

            // Radial glow at pulse head
            const grad = ctx.createRadialGradient(px, py, 0, px, py, 10);
            grad.addColorStop(0,   `rgba(${TRACE_RGB},${(0.9  * this.opacity).toFixed(2)})`);
            grad.addColorStop(0.4, `rgba(${TRACE_RGB},${(0.3  * this.opacity).toFixed(2)})`);
            grad.addColorStop(1,   `rgba(${TRACE_RGB},0)`);
            ctx.fillStyle = grad;
            ctx.beginPath();
            ctx.arc(px, py, 10, 0, Math.PI * 2);
            ctx.fill();

            // Trailing highlight along traversed segments
            const trailStart = Math.max(0, segIdx - 1);
            for (let i = trailStart; i <= segIdx; i++) {
                const ta = nodes[this.path[i]];
                const tb = nodes[this.path[i + 1]];
                if (!ta || !tb) continue;
                const frac = i < segIdx ? 1 : segFrac;
                ctx.beginPath();
                ctx.moveTo(ta.x, ta.y);
                ctx.lineTo(ta.x + (tb.x - ta.x) * frac, ta.y + (tb.y - ta.y) * frac);
                ctx.strokeStyle = `rgba(${TRACE_RGB},${(0.4 * this.opacity).toFixed(2)})`;
                ctx.lineWidth   = 1.5;
                ctx.stroke();
            }
        }
    }

    function spawnPulse() {
        if (pulses.length >= MAX_PULSES || nodes.length < 4) return;
        const start = (Math.random() * nodes.length) | 0;
        const path  = [start];
        for (let step = 0; step < 2 + ((Math.random() * 3) | 0); step++) {
            const last       = path[path.length - 1];
            const candidates = [];
            for (let i = 0; i < nodes.length; i++) {
                if (path.includes(i)) continue;
                const dx = nodes[last].x - nodes[i].x;
                const dy = nodes[last].y - nodes[i].y;
                if (dx * dx + dy * dy < CONNECTION_DIST * CONNECTION_DIST) candidates.push(i);
            }
            if (!candidates.length) break;
            path.push(candidates[(Math.random() * candidates.length) | 0]);
        }
        if (path.length >= 2) pulses.push(new Pulse(path));
    }

    // ── Nodes ─────────────────────────────────────────────────────────────
    class Node {
        constructor() {
            this.x      = Math.random() * W;
            this.y      = Math.random() * H;
            this.baseVx = (Math.random() - 0.5) * 0.35;
            this.baseVy = (Math.random() - 0.5) * 0.35;
            this.vx     = this.baseVx;
            this.vy     = this.baseVy;
            this.radius = Math.random() * 1.5 + 0.8;
            // Mix domain colors: Power (orange), Embedded (blue), Industrial (green), Digital (purple)
            const domainColors = [
                [249, 115, 22],   // Power Electronics
                [14,  165, 233],  // Embedded Systems
                [16,  185, 129],  // Industrial Automation
                [139, 92,  246],  // Digital Twins
            ];
            this.color = domainColors[Math.floor(Math.random() * domainColors.length)];
        }

        update() {
            if (mouse.active) {
                const dx   = this.x - mouse.x;
                const dy   = this.y - mouse.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < MOUSE_RADIUS && dist > 0) {
                    const f = (1 - dist / MOUSE_RADIUS) * MOUSE_FORCE;
                    this.vx += (dx / dist) * f;
                    this.vy += (dy / dist) * f;
                }
            }
            this.vx += (this.baseVx - this.vx) * 0.02;
            this.vy += (this.baseVy - this.vy) * 0.02;
            this.x  += this.vx;
            this.y  += this.vy;
            if (this.x < 0 || this.x > W) { this.baseVx *= -1; this.x = Math.max(0, Math.min(W, this.x)); }
            if (this.y < 0 || this.y > H) { this.baseVy *= -1; this.y = Math.max(0, Math.min(H, this.y)); }
        }

        draw(proximity) {
            // Always dark engineering theme — use node domain color
            const nodeColor = this.color;
            const baseOpacity = 0.35;
            const opacity = baseOpacity + proximity * 0.45;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
            ctx.fillStyle = `rgba(${nodeColor},${opacity.toFixed(2)})`;
            ctx.fill();

            if (proximity > 0) {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.radius * 2.5, 0, Math.PI * 2);
                ctx.fillStyle = `rgba(${nodeColor},${(proximity * 0.3).toFixed(2)})`;
                ctx.fill();
            }
        }
    }

    function initNodes() {
        nodes.length = 0;
        for (let i = 0; i < MAX_NODES; i++) nodes.push(new Node());
    }

    // ── Main rAF Loop ─────────────────────────────────────────────────────
    let lastPulseTime = 0;
    let running       = true;  // controlled by IntersectionObserver

    function animate(timestamp) {
        if (!running) return; // pause when off-screen

        ctx.clearRect(0, 0, W, H);

        if (!motionPrefs.reduced) {
            if (timestamp - lastPulseTime > PULSE_INTERVAL_MS) {
                spawnPulse();
                lastPulseTime = timestamp;
            }
        }

        // Nodes
        nodes.forEach(node => {
            node.update();
            const dx   = node.x - mouse.x;
            const dy   = node.y - mouse.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            const prox = mouse.active ? Math.max(0, 1 - dist / MOUSE_RADIUS) : 0;
            node.draw(prox);
        });

        // Connections
        const connRGB  = NODE_RGB.join(',');
        for (let i = 0; i < nodes.length; i++) {
            for (let j = i + 1; j < nodes.length; j++) {
                const dx   = nodes[i].x - nodes[j].x;
                const dy   = nodes[i].y - nodes[j].y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist >= CONNECTION_DIST) continue;
                const base  = (1 - dist / CONNECTION_DIST) * 0.18;
                const mdx   = (nodes[i].x + nodes[j].x) * 0.5 - mouse.x;
                const mdy   = (nodes[i].y + nodes[j].y) * 0.5 - mouse.y;
                const mDist = Math.sqrt(mdx * mdx + mdy * mdy);
                const boost = mouse.active ? Math.max(0, 1 - mDist / MOUSE_RADIUS) * 0.15 : 0;
                ctx.beginPath();
                ctx.moveTo(nodes[i].x, nodes[i].y);
                ctx.lineTo(nodes[j].x, nodes[j].y);
                ctx.strokeStyle = `rgba(${connRGB},${(base + boost).toFixed(2)})`;
                ctx.lineWidth   = 0.6;
                ctx.stroke();
            }
        }

        // Pulses
        if (!motionPrefs.reduced) {
            for (let i = pulses.length - 1; i >= 0; i--) {
                pulses[i].update();
                pulses[i].draw();
                if (!pulses[i].alive) pulses.splice(i, 1);
            }
        }

        requestAnimationFrame(animate);
    }

    // ── IntersectionObserver — pause loop off-screen ──────────────────────
    // IMPORTANT: io.observe() fires the callback synchronously on the next
    // microtask tick. When the canvas IS visible (typical case), this fires
    // with isIntersecting=true and schedules the FIRST frame via rAF.
    // We must NOT call requestAnimationFrame(animate) again after this, or
    // two concurrent animate loops will run and compound each frame.
    const io = new IntersectionObserver(entries => {
        const wasRunning = running;
        running = entries[0].isIntersecting;
        // Only restart the loop if we transitioned from paused → running.
        // If already running (first observe call while visible), the loop
        // is already scheduled — don't double-schedule.
        if (running && !wasRunning) requestAnimationFrame(animate);
    }, { threshold: 0 });

    // ── Events ────────────────────────────────────────────────────────────
    window.addEventListener('mousemove', e => {
        mouse.x = e.clientX; mouse.y = e.clientY; mouse.active = true;
    }, { passive: true });
    window.addEventListener('mouseleave', () => { mouse.active = false; }, { passive: true });

    // ── Boot sequence ─────────────────────────────────────────────────────
    // initNodes first so nodes[] is populated before first frame.
    // Then observe — this is the ONLY place the loop is started.
    initNodes();
    io.observe(canvas);
    // Initial kickoff: the first IO callback fires asynchronously, so we
    // manually start the loop here to avoid a blank first frame.
    requestAnimationFrame(animate);
}
