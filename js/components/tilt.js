/**
 * js/components/tilt.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Spring-Physics 3D Tilt Cards + Composite-Optimized Glare
 *
 * Replaces the basic Lerp tilt from interactions.js with a proper damped
 * spring so the card settles with a subtle, tactile micro-bounce.
 *
 * Glare implementation:
 *   Uses a child div (.tilt-glare-inner) sized at 200% × 200% of the card,
 *   centred in a clip container (.tilt-glare). On mouse move, we translate
 *   the inner div using transform: translate3d(x, y, 0). This forces GPU
 *   compositing and never triggers layout or paint.
 *
 * Memory management:
 *   - One rAF loop per card, started on pointerenter, cancelled on rest.
 *   - Mouse coordinates are stored as plain floats, not objects, to avoid
 *     heap allocation on every mousemove.
 *   - Event listeners are stored in a WeakMap so they are GC'd when the
 *     card element is removed from the DOM.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SpringPair } from '../utils/physics.js';
import { motionPrefs } from '../utils/accessibility.js';

const MAX_TILT  = 6;          // degrees
const GLARE_MAX = 0.15;       // max opacity of the glare highlight

// Spring tuning: stiff & lightly damped → tactile micro-bounce
const SPRING_OPTS = { stiffness: 220, damping: 18, mass: 1, precision: 0.0005 };

// WeakMap keeps listener references tied to element lifetime
const _listenerMap = new WeakMap();

export function initTiltCards() {
    if (window.matchMedia('(max-width: 768px)').matches) return;
    if (motionPrefs.reduced) return;

    document.querySelectorAll('.project-card, .patent-node').forEach(_attachTilt);

    // Degrade gracefully if user enables reduced-motion mid-session
    motionPrefs.onChange(({ reduced }) => {
        if (reduced) {
            document.querySelectorAll('.project-card, .patent-node').forEach(card => {
                card.style.transform = '';
                const glare = card.querySelector('.tilt-glare-inner');
                if (glare) glare.style.transform = 'translate3d(0,0,0)';
            });
        }
    });
}

// ── Private ────────────────────────────────────────────────────────────────

function _attachTilt(card) {
    // Build glare DOM (if not already present from previous interactions.js)
    card.querySelector('.card-glare')?.remove(); // remove old basic glare
    const glareWrap  = document.createElement('div');
    glareWrap.className = 'tilt-glare';
    const glareInner = document.createElement('div');
    glareInner.className = 'tilt-glare-inner';
    glareWrap.appendChild(glareInner);
    card.appendChild(glareWrap);

    // Spring instances (one pair for tilt, one for glare position)
    const tiltSpring  = new SpringPair(SPRING_OPTS);
    const glareSpring = new SpringPair({ stiffness: 160, damping: 22, mass: 1 });

    let rafId     = null;
    let prevTime  = 0;
    let mouseX    = 0;   // raw floats — no object allocation per event
    let mouseY    = 0;
    let inside    = false;

    function loop(timestamp) {
        if (motionPrefs.reduced) { rafId = null; return; }

        const dt = Math.min((timestamp - prevTime) / 1000, 0.05); // cap at 50ms
        prevTime = timestamp;

        const tiltMoving  = tiltSpring.update(dt);
        const glareMoving = glareSpring.update(dt);

        // Write transforms — composite only (transform + opacity)
        card.style.transform =
            `perspective(900px) rotateX(${tiltSpring.y.position}deg) rotateY(${tiltSpring.x.position}deg) translateZ(0)`;

        // Glare: translate inner 200% div so its centre tracks mouse quadrant
        const gx = glareSpring.x.position;
        const gy = glareSpring.y.position;
        glareInner.style.transform = `translate3d(${gx}px, ${gy}px, 0)`;

        // Glare opacity based on distance from centre
        const dist = Math.sqrt(gx * gx + gy * gy);
        const rect = card.getBoundingClientRect();
        const maxDist = Math.sqrt(rect.width * rect.width + rect.height * rect.height) * 0.5;
        const opacity = inside ? (dist / maxDist) * GLARE_MAX : 0;
        glareInner.style.opacity = opacity.toFixed(3);

        if (tiltMoving || glareMoving) {
            rafId = requestAnimationFrame(loop);
        } else {
            rafId = null;
        }
    }

    function startLoop() {
        if (rafId) return;
        prevTime = performance.now();
        rafId = requestAnimationFrame(loop);
    }

    function onEnter() {
        inside = true;
        card.style.willChange = 'transform'; // promote to GPU layer
        glareInner.style.willChange = 'transform, opacity';
    }

    function onMove(e) {
        if (motionPrefs.reduced) return;
        const rect = card.getBoundingClientRect();
        const cx = rect.left + rect.width  * 0.5;
        const cy = rect.top  + rect.height * 0.5;
        // Normalise to [-1, 1]
        const nx = (e.clientX - cx) / (rect.width  * 0.5);
        const ny = (e.clientY - cy) / (rect.height * 0.5);

        mouseX = nx; mouseY = ny;

        tiltSpring.setTarget( nx * MAX_TILT, -ny * MAX_TILT);

        // Glare target: offset inner div by ±50% of card size
        glareSpring.setTarget(nx * rect.width  * 0.28, ny * rect.height * 0.28);

        startLoop();
    }

    function onLeave() {
        inside = false;
        tiltSpring.setTarget(0, 0);
        glareSpring.setTarget(0, 0);
        startLoop();

        // Remove will-change after animation settles to free GPU memory
        const cleanup = () => {
            card.style.willChange = '';
            glareInner.style.willChange = '';
        };
        setTimeout(cleanup, 800);
    }

    card.addEventListener('pointerenter', onEnter, { passive: true });
    card.addEventListener('pointermove',  onMove,  { passive: true });
    card.addEventListener('pointerleave', onLeave, { passive: true });

    // Store refs in WeakMap for future cleanup if needed
    _listenerMap.set(card, { onEnter, onMove, onLeave });
}
