/**
 * js/animations.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Core scroll + header + counter animations
 *
 * Engineering notes:
 *  - initScrollReveal: IntersectionObserver, zero rAF cost.
 *  - initStickyHeader: throttled via ticking flag (one rAF per scroll event).
 *  - initCounters: pure rAF loop with performance.now() timestamp math.
 *    Avoids setTimeout because setTimeout is not frame-aligned (it can fire
 *    mid-paint causing a visible stutter). Also avoids innerText reads inside
 *    the animation — only writes, never reads layout properties on each frame.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { motionPrefs } from './utils/accessibility.js';

// ─── 1. SCROLL REVEAL ────────────────────────────────────────────────────────
export function initScrollReveal() {
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
                obs.unobserve(entry.target); // fire-once: no re-triggering
            }
        });
    }, { rootMargin: '0px', threshold: 0 });

    document.querySelectorAll('.fade-in').forEach(el => observer.observe(el));
}

// ─── 2. STICKY HEADER ────────────────────────────────────────────────────────
export function initStickyHeader() {
    const header = document.getElementById('navbar');
    if (!header) return;

    let ticking = false;

    function update() {
        // window.scrollY is a cached value — no forced reflow
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
        ticking = false;
    }

    window.addEventListener('scroll', () => {
        if (ticking) return;       // skip: a frame is already queued
        requestAnimationFrame(update);
        ticking = true;
    }, { passive: true });
}

// ─── 3. ANIMATED METRIC COUNTERS ─────────────────────────────────────────────
/**
 * Counts a metric-number element from 0 to its data-target using a rAF loop.
 *
 * Motion model: ease-out cubic  f(t) = 1 - (1-t)³
 * Duration: COUNTER_DURATION_MS — fast enough to feel snappy but slow enough
 * to be legible at low target values (e.g. "1 patent").
 *
 * Memory: no closures are allocated inside the rAF loop. The loop captures
 * startTime and targetValue from its outer scope (cheap primitives).
 *
 * Accessibility: if the user prefers reduced motion, the counter snaps to
 * the target value immediately without any rAF animation.
 */
const COUNTER_DURATION_MS = 1400; // ms — duration of counting animation

export function initCounters() {
    const counters = document.querySelectorAll('.metric-number');
    if (!counters.length) return;

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;

            const el          = entry.target;
            const targetValue = parseInt(el.getAttribute('data-target'), 10);

            // Snap instantly for reduced-motion preference
            if (motionPrefs.reduced || isNaN(targetValue)) {
                el.textContent = targetValue || 0;
                obs.unobserve(el);
                return;
            }

            let startTime = null; // set on first frame

            function tick(timestamp) {
                if (startTime === null) startTime = timestamp;

                const elapsed  = timestamp - startTime;
                const progress = Math.min(elapsed / COUNTER_DURATION_MS, 1);

                // Ease-out cubic: decelerates into the final number
                const eased = 1 - Math.pow(1 - progress, 3);

                // Integer output only — Math.round prevents float flickering
                el.textContent = Math.round(eased * targetValue);

                if (progress < 1) {
                    requestAnimationFrame(tick);
                } else {
                    el.textContent = targetValue; // snap to exact value on completion
                }
            }

            requestAnimationFrame(tick);
            obs.unobserve(el); // fire-once
        });
    }, { threshold: 0.5 });

    counters.forEach(counter => observer.observe(counter));
}
