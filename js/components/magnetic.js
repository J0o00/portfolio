/**
 * js/components/magnetic.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Magnetic CTA Buttons with Spring Physics
 *
 * When the cursor enters a 20px boundary around a [data-magnetic] button:
 *   1. The button body translates towards the cursor (PULL_BODY factor).
 *   2. The inner text/label translates further (PULL_TEXT factor) to create
 *      a parallax depth illusion between button shell and label.
 *
 * On cursor exit, the spring physics engine returns both layers to origin
 * with the characteristic micro-bounce of a real elastic snap.
 *
 * Architecture:
 *   - One DampedSpring pair per button (body) + one for the label (text).
 *   - A SINGLE shared window.mousemove listener dispatches to all instances.
 *     (Previous design added one listener per button — N buttons = N listeners,
 *      causing O(N) getBoundingClientRect calls per mousemove event.)
 *   - Boundary detection uses getBoundingClientRect, but only in the shared
 *     handler so the DOM read cost scales linearly with button count, not
 *     quadratically.
 *   - rAF is started on boundary-enter and cancelled when springs rest.
 *   - will-change is applied on boundary-enter and removed after spring settles.
 *
 * Memory note:
 *   - Instances are stored in a plain Array (not WeakMap) because we need to
 *     iterate over all of them in the shared mousemove handler. The array is
 *     module-scoped and lives for the page lifetime (acceptable).
 *   - The mousemove listener is added once and never removed (single passive
 *     listener at module scope = effectively free).
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { SpringPair } from '../utils/physics.js';
import { motionPrefs } from '../utils/accessibility.js';

const BOUNDARY    = 20;    // px padding outside the button that activates pull
const PULL_BODY   = 0.35;  // translation factor for the button shell
const PULL_TEXT   = 0.55;  // translation factor for the label (stronger → deeper parallax)

const SPRING_OPTS = { stiffness: 260, damping: 22, mass: 1, precision: 0.001 };

/** @type {Array<MagneticInstance>} All active magnetic buttons */
const _instances = [];

/** Single shared mousemove handler — registered once for all buttons */
let _listenerAttached = false;

export function initMagneticButtons() {
    if (motionPrefs.reduced) return;

    document.querySelectorAll('[data-magnetic]').forEach(_attachMagnetic);

    // Attach the shared dispatcher only once across all initMagneticButtons calls
    if (!_listenerAttached && _instances.length > 0) {
        window.addEventListener('mousemove', _onMouseMove, { passive: true });
        _listenerAttached = true;
    }

    // Graceful degradation: if user enables reduced-motion mid-session,
    // snap all buttons to origin and pause their loops.
    motionPrefs.onChange(({ reduced }) => {
        if (!reduced) return;
        _instances.forEach(inst => {
            inst.bodySpring.snap(0, 0);
            inst.labelSpring.snap(0, 0);
            inst.btn.style.transform    = '';
            inst.label.style.transform  = '';
            inst.btn.style.willChange   = '';
            inst.label.style.willChange = '';
            inst.active = false;
        });
    });
}

// ── Private ────────────────────────────────────────────────────────────────

/**
 * Shared mousemove handler. Iterates all instances once per event.
 * Cost: O(N) rects reads per mousemove where N = number of magnetic buttons
 * (typical: 2–4). Each rect read is a reflow boundary — but getBCR on small
 * sets is negligible vs. the alternative of per-button listeners.
 */
function _onMouseMove(e) {
    if (motionPrefs.reduced) return;

    for (let i = 0; i < _instances.length; i++) {
        const inst = _instances[i];
        const rect = inst.btn.getBoundingClientRect();

        const inZone =
            e.clientX >= rect.left   - BOUNDARY &&
            e.clientX <= rect.right  + BOUNDARY &&
            e.clientY >= rect.top    - BOUNDARY &&
            e.clientY <= rect.bottom + BOUNDARY;

        if (inZone) {
            if (!inst.active) {
                // Entering boundary zone — promote layers to GPU
                inst.active = true;
                inst.btn.style.willChange   = 'transform';
                inst.label.style.willChange = 'transform';
            }
            // Offset from button centre — this is what the spring pulls toward
            const cx = rect.left + rect.width  * 0.5;
            const cy = rect.top  + rect.height * 0.5;
            const dx = e.clientX - cx;
            const dy = e.clientY - cy;

            inst.bodySpring.setTarget(  dx * PULL_BODY, dy * PULL_BODY);
            inst.labelSpring.setTarget( dx * PULL_TEXT, dy * PULL_TEXT);
            inst.startLoop();

        } else if (inst.active) {
            // Left boundary zone — spring back to origin
            inst.active = false;
            inst.bodySpring.setTarget(0, 0);
            inst.labelSpring.setTarget(0, 0);
            inst.startLoop();
        }
    }
}

/**
 * @typedef {{ btn: HTMLElement, label: HTMLElement, bodySpring: SpringPair,
 *             labelSpring: SpringPair, active: boolean, startLoop: function }} MagneticInstance
 */

function _attachMagnetic(btn) {
    // Wrap inner content in .mag-label span for independent parallax transform.
    // Guard against double-wrapping if initMagneticButtons is called twice.
    if (!btn.querySelector('.mag-label')) {
        // innerHTML swap — safe here since content is static markup, not user data
        btn.innerHTML = `<span class="mag-label">${btn.innerHTML}</span>`;
    }
    const label = btn.querySelector('.mag-label');

    const bodySpring  = new SpringPair(SPRING_OPTS);
    // Label spring is stiffer so it "leads" slightly — reinforces the parallax
    const labelSpring = new SpringPair({ ...SPRING_OPTS, stiffness: 340 });

    let rafId    = null;
    let prevTime = 0;
    let active   = false;

    function loop(timestamp) {
        if (motionPrefs.reduced) { rafId = null; return; }

        const dt = Math.min((timestamp - prevTime) / 1000, 0.05); // cap at 50ms
        prevTime = timestamp;

        const bMoving = bodySpring.update(dt);
        const lMoving = labelSpring.update(dt);

        // Composite-only writes: only transform is mutated
        btn.style.transform   = `translate3d(${bodySpring.x.position.toFixed(3)}px, ${bodySpring.y.position.toFixed(3)}px, 0)`;
        label.style.transform = `translate3d(${labelSpring.x.position.toFixed(3)}px, ${labelSpring.y.position.toFixed(3)}px, 0)`;

        if (bMoving || lMoving) {
            rafId = requestAnimationFrame(loop);
        } else {
            rafId = null;
            // Springs at rest — free GPU layers to reduce memory footprint
            if (!active) {
                btn.style.willChange   = '';
                label.style.willChange = '';
            }
        }
    }

    function startLoop() {
        if (rafId) return; // already running — spring target changed, loop continues
        prevTime = performance.now();
        rafId = requestAnimationFrame(loop);
    }

    /** @type {MagneticInstance} */
    const instance = { btn, label, bodySpring, labelSpring, active: false, startLoop };

    // Expose active as a getter/setter so _onMouseMove can set it on the instance object
    Object.defineProperty(instance, 'active', {
        get() { return active; },
        set(v) { active = v; },
    });

    _instances.push(instance);
}
