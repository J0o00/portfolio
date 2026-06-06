/**
 * js/utils/scroll.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scroll Velocity Observer
 *
 * Calculates real-time scroll velocity (px/ms) and direction without
 * firing expensive DOM reads on every scroll event.
 *
 * Architecture:
 *  - The raw `scroll` event is passive and simply marks a dirty flag.
 *  - A single shared rAF loop reads `window.scrollY` once per frame
 *    (batching all reads), computes velocity, and notifies subscribers.
 *  - Velocity decays to 0 when scrolling stops (exponential decay).
 *
 * Memory note: Uses a Set for subscribers. The rAF loop is lazily started
 * on first subscription and stopped when the Set empties.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { motionPrefs } from './accessibility.js';

const subscribers   = new Set();
let   rafId         = null;
let   lastScrollY   = window.scrollY;
let   lastTimestamp = performance.now();
let   _velocity     = 0;           // px/ms  (+ = scrolling down)
let   _dirty        = false;

const DECAY = 0.88; // velocity multiplier per frame when idle (tune 0.8–0.95)

/** Read current scroll state. No DOM reads — just the cached value. */
export const scrollState = {
    get velocity() { return _velocity; },
    get direction() { return _velocity > 0 ? 'down' : _velocity < 0 ? 'up' : 'none'; },
    get speed()     { return Math.abs(_velocity); },
};

/** Subscribe to per-frame velocity updates. Returns unsubscribe fn. */
export function onScrollVelocity(fn) {
    subscribers.add(fn);
    if (subscribers.size === 1) _startLoop(); // lazy start
    return () => {
        subscribers.delete(fn);
        if (subscribers.size === 0) _stopLoop(); // GC when unused
    };
}

// ── Private ────────────────────────────────────────────────────────────────

function _tick(timestamp) {
    if (motionPrefs.reduced) {
        _velocity = 0;
    } else {
        const dt = timestamp - lastTimestamp;
        if (dt > 0) {
            if (_dirty) {
                const currentY = window.scrollY;
                _velocity = (currentY - lastScrollY) / dt;
                lastScrollY = currentY;
                _dirty = false;
            } else {
                // Decay velocity exponentially to smooth the "stop" transition
                _velocity *= DECAY;
                if (Math.abs(_velocity) < 0.0001) _velocity = 0;
            }
        }
    }

    lastTimestamp = timestamp;
    subscribers.forEach(fn => fn(scrollState));
    rafId = requestAnimationFrame(_tick);
}

function _onScroll() { _dirty = true; }

function _startLoop() {
    lastScrollY   = window.scrollY;
    lastTimestamp = performance.now();
    window.addEventListener('scroll', _onScroll, { passive: true });
    rafId = requestAnimationFrame(_tick);
}

function _stopLoop() {
    window.removeEventListener('scroll', _onScroll);
    cancelAnimationFrame(rafId);
    rafId = null;
    _velocity = 0;
}
