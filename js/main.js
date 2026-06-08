/**
 * js/main.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Application Bootstrap
 *
 * Initialization order matters:
 *  1. Core rendering systems (canvas, scroll reveal, header)
 *  2. Interaction systems that depend on DOM being stable (tilt, magnetic)
 *  3. Data-driven systems (counters, skills network)
 *
 * Every module imported here guards itself with motionPrefs.reduced and
 * IntersectionObserver so nothing runs wastefully off-screen or when the
 * user prefers reduced motion.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { inject } from '@vercel/analytics';
import { injectSpeedInsights } from '@vercel/speed-insights';

// Initialize Vercel Analytics and Speed Insights
inject();
injectSpeedInsights();

// ── Core utility systems ────────────────────────────────────────────────────
import { initBackgroundAnimation }           from './background.js';
import { initScrollReveal, initStickyHeader, initCounters } from './animations.js';

// ── Premium interaction systems (new modular components) ────────────────────
import { initTiltCards }                     from './components/tilt.js';

import {
    initScrollProgress,
    initTimelineSkew,
    initHeroParallax,
    initModalTransitions,
    initStaggeredReveal,
    initPatentFlow,
    initDomainConnections
} from './components/interactions.js';

// ── Data visualisation ──────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    // ── 1. Core rendering ──────────────────────────────────────────────────
    initBackgroundAnimation();   // High-DPI canvas node network
    initScrollReveal();          // .fade-in IntersectionObserver
    initStickyHeader();          // Navbar blur on scroll

    // ── 2. Scroll systems ─────────────────────────────────────────────────
    initScrollProgress();        // Fixed top progress bar
    initTimelineSkew();          // Velocity-based skew on timeline items
    initHeroParallax();          // Slower scroll for profile image

    // ── 3. Pointer interaction systems ────────────────────────────────────
    initTiltCards();             // Spring-physics 3D tilt + glare (desktop only)
    // initMagneticButtons();       // Disabled for new clean theme
    initModalTransitions();      // Smooth opacity + slide for modals

    // ── 4. Reveal & data ──────────────────────────────────────────────────
    initStaggeredReveal();       // Staggered child reveal via IntersectionObserver
    initCounters();              // Animated metric counters
    initPatentFlow();            // Sequential light-up for patent nodes
    initDomainConnections();     // SVG lines on domain click

    // Domain Map Logic
    const domainNodes = document.querySelectorAll('.domain-node');
    domainNodes.forEach(node => {
        node.addEventListener('mouseenter', () => {
            const domain = node.getAttribute('data-domain');
            document.querySelectorAll(`[data-related~="${domain}"]`).forEach(el => {
                el.classList.add('glow-highlight');
            });
        });
        node.addEventListener('mouseleave', () => {
            document.querySelectorAll('.glow-highlight').forEach(el => {
                el.classList.remove('glow-highlight');
            });
        });
    });

    console.log('%c⚡ Engineering Intelligence Portfolio — all systems nominal.',
        'color:#E64A19;font-family:monospace;font-size:11px;');
});
