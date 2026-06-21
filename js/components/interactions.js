/**
 * js/components/interactions.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Scroll Progress Indicator + Timeline Scroll-Skew + Modal Transitions
 * + Staggered Section Reveal
 *
 * Scroll velocity skew:
 *   The scroll velocity (px/ms) from utils/scroll.js is mapped to a CSS
 *   skewX() value on each .timeline-item. The mapping is clamped to ±2.5°
 *   so the effect is visible but never jarring. A CSS custom property
 *   (--skew) is written once per frame onto the section container rather
 *   than per-element to minimise style recalculations.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { onScrollVelocity } from '../utils/scroll.js';
import { motionPrefs }      from '../utils/accessibility.js';

const MAX_SKEW_DEG = 2.5; // °  — maximum visual skew at peak scroll speed
const SKEW_SCALE   = 60;  // px/ms → degrees mapping divisor (tune higher = less sensitive)

// ─── 1. SCROLL PROGRESS BAR ─────────────────────────────────────────────────
export function initScrollProgress() {
    const bar = document.createElement('div');
    bar.id    = 'scroll-progress';
    document.body.prepend(bar);

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (ticking) return;
        requestAnimationFrame(() => {
            const top     = window.scrollY;
            const docH    = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.width = docH > 0 ? ((top / docH) * 100).toFixed(1) + '%' : '0%';
            ticking = false;
        });
        ticking = true;
    }, { passive: true });
}

// ─── 2. TIMELINE SCROLL-SKEW ────────────────────────────────────────────────
export function initTimelineSkew() {
    return; // Skew effect disabled per user request
    if (motionPrefs.reduced) return;

    const items = document.querySelectorAll('.timeline-item');
    if (!items.length) return;

    // Subscribe to scroll velocity — returns unsubscribe fn
    const unsub = onScrollVelocity(({ velocity }) => {
        if (motionPrefs.reduced) { unsub(); return; }

        // Clamp velocity → degrees  (negative vel = scrolling up → negative skew)
        const deg = Math.max(
            -MAX_SKEW_DEG,
            Math.min(MAX_SKEW_DEG, velocity * SKEW_SCALE)
        );

        items.forEach((item, i) => {
            // Alternate direction per item for a subtle wave pattern
            const sign   = i % 2 === 0 ? 1 : -1;
            item.style.setProperty('--skew', (deg * sign).toFixed(2) + 'deg');
            // Toggle .skewing class to remove CSS transition while moving
            if (Math.abs(deg) > 0.05) {
                item.classList.add('skewing');
            } else {
                item.classList.remove('skewing');
            }
        });
    });

    // Clean up if reduced-motion is enabled mid-session
    motionPrefs.onChange(({ reduced }) => {
        if (reduced) {
            unsub();
            items.forEach(item => {
                item.style.removeProperty('--skew');
                item.classList.remove('skewing');
            });
        }
    });
}

// ─── 3. SMOOTH MODAL TRANSITIONS ────────────────────────────────────────────
export function initModalTransitions() {
    const overlay = document.getElementById('modal-overlay');
    if (!overlay) return;

    // Cache references to existing open/close globals defined in index.html
    const _origOpen  = window.openModal;
    const _origClose = window.closeModal;

    window.openModal = function(id) {
        if (_origOpen) _origOpen(id);

        // Force display before animating opacity
        overlay.style.display   = 'block';
        overlay.style.opacity   = '0';
        overlay.style.transition = 'none';

        requestAnimationFrame(() => {
            requestAnimationFrame(() => {   // double-rAF — guarantees paint before transition
                overlay.style.transition = 'opacity 0.35s cubic-bezier(0.25,1,0.5,1)';
                overlay.style.opacity    = '1';
            });
        });

        document.body.style.overflow = 'hidden';

        // Slide modal content up
        const container = document.getElementById(id);
        if (container) {
            container.style.opacity   = '0';
            container.style.transform = 'translateY(28px)';
            container.style.transition = 'none';
            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    container.style.transition = 'opacity 0.4s ease, transform 0.4s cubic-bezier(0.25,1,0.5,1)';
                    container.style.opacity    = '1';
                    container.style.transform  = 'translateY(0)';
                });
            });
        }
    };

    window.closeModal = function() {
        overlay.style.transition = 'opacity 0.22s ease';
        overlay.style.opacity    = '0';
        setTimeout(() => {
            if (_origClose) _origClose();
            overlay.style.opacity    = '';
            overlay.style.transition = '';
            overlay.style.display    = '';
            document.body.style.overflow = '';

            // Clean up deep link URL
            const url = new URL(window.location);
            let updatedUrl = false;
            if (url.searchParams.has('project') || url.searchParams.has('research') || url.searchParams.has('experience')) {
                url.searchParams.delete('project');
                url.searchParams.delete('research');
                url.searchParams.delete('experience');
                updatedUrl = true;
            }
            if (url.pathname.startsWith('/project/') || url.pathname.startsWith('/research/') || url.pathname.startsWith('/experience/')) {
                url.pathname = '/';
                updatedUrl = true;
            }
            
            if (updatedUrl) {
                window.history.pushState({}, '', url);
                import('../seoManager.js').then(m => m.updateCanonicalUrl(url.href)).catch(e => console.error(e));
            }
        }, 230);
    };

    // Escape key support
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape' && overlay.style.display === 'block') {
            window.closeModal();
        }
    });
}

// ─── 4. STAGGERED SECTION CHILD REVEAL ──────────────────────────────────────
export function initStaggeredReveal() {
    const CHILD_SELECTORS =
        '.project-card, .phil-card, .loop-node, .timeline-item, .metric-item, .research-card, .nvidia-card';

    const observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
            if (!entry.isIntersecting) return;
            const children = entry.target.querySelectorAll(CHILD_SELECTORS);
            children.forEach((child, i) => {
                child.style.transitionDelay = `${i * 70}ms`;
                child.classList.add('child-visible');
            });
            // Unobserve after reveal — prevents re-triggering
            observer.unobserve(entry.target);
        });
    }, { threshold: 0 });

    document.querySelectorAll('.fade-in').forEach(container => {
        observer.observe(container);
    });
}

// ─── 5. PATENT FLOW ANIMATION ────────────────────────────────────────────────
export function initPatentFlow() {
    if (motionPrefs.reduced) return;
    
    const container = document.querySelector('.patent-architecture');
    if (!container) return;
    
    const nodes = container.querySelectorAll('.patent-node');
    const arrows = container.querySelectorAll('.loop-arrow');
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                nodes.forEach((node, i) => {
                    setTimeout(() => {
                        node.classList.add('active-flow');
                        if (arrows[i]) {
                            arrows[i].classList.add('active-flow');
                        }
                    }, i * 400); // 400ms delay between nodes
                });
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 });
    
    observer.observe(container);
}

// ─── 6. DOMAIN CONNECTIONS (SIGNATURE INTERACTION) ───────────────────────────
export function initDomainConnections() {
    const domains = document.querySelectorAll('.domain-node');
    if (!domains.length) return;

    let svg = document.getElementById('connections-svg');
    if (!svg) {
        svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
        svg.id = 'connections-svg';
        svg.style.position = 'absolute';
        svg.style.top = '0';
        svg.style.left = '0';
        svg.style.width = '100%';
        svg.style.height = document.documentElement.scrollHeight + 'px';
        svg.style.pointerEvents = 'none';
        svg.style.zIndex = '0';
        document.body.prepend(svg);
    }

    const resizeObserver = new ResizeObserver(() => {
        svg.style.height = document.documentElement.scrollHeight + 'px';
    });
    resizeObserver.observe(document.body);

    domains.forEach(domain => {
        domain.addEventListener('click', (e) => {
            svg.innerHTML = ''; // clear existing
            
            domains.forEach(d => d.style.borderColor = 'var(--border-color)');
            domains.forEach(d => d.style.color = 'var(--text-body)');
            domain.style.borderColor = 'var(--accent-primary)';
            domain.style.color = 'var(--accent-primary)';

            const type = domain.getAttribute('data-domain');
            const targets = document.querySelectorAll(`[data-related~="${type}"]`);
            if (!targets.length) return;
            
            const startRect = domain.getBoundingClientRect();
            const startX = startRect.left + startRect.width / 2 + window.scrollX;
            const startY = startRect.bottom + window.scrollY;

            targets.forEach((target, i) => {
                const endRect = target.getBoundingClientRect();
                const endX = endRect.left + endRect.width / 2 + window.scrollX;
                const endY = endRect.top + window.scrollY;

                const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
                const curve = Math.abs(endY - startY) * 0.4;
                const d = `M ${startX} ${startY} C ${startX} ${startY + curve}, ${endX} ${endY - curve}, ${endX} ${endY}`;
                
                path.setAttribute('d', d);
                path.setAttribute('fill', 'none');
                path.setAttribute('stroke', 'var(--accent-primary)');
                path.setAttribute('stroke-width', '2');
                
                // Animate line drawing
                const length = 2500; // approximation
                path.style.strokeDasharray = length;
                path.style.strokeDashoffset = length;
                path.style.transition = `stroke-dashoffset 1.5s cubic-bezier(0.25, 1, 0.5, 1) ${i * 0.2}s`;
                
                svg.appendChild(path);

                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        path.style.strokeDashoffset = '0';
                    });
                });
                
                // Target highlight
                setTimeout(() => {
                    target.classList.add('highlight-pulse');
                    setTimeout(() => target.classList.remove('highlight-pulse'), 2000);
                }, 800 + i * 200);
            });
            
            // Scroll to the first target
            const firstTargetTop = targets[0].getBoundingClientRect().top + window.scrollY;
            window.scrollTo({ top: firstTargetTop - 100, behavior: 'smooth' });
        });
    });
}

// ─── 7. HERO PARALLAX ───────────────────────────────────────────────────────
export function initHeroParallax() {
    if (motionPrefs.reduced) return;
    
    const profileContainer = document.querySelector('.profile-container');
    if (!profileContainer) return;

    let ticking = false;
    window.addEventListener('scroll', () => {
        if (!ticking) {
            window.requestAnimationFrame(() => {
                const scrolled = window.scrollY;
                // Only parallax if the hero is in view
                if (scrolled < 1000) {
                    // Slower scroll speed for parallax effect
                    profileContainer.style.transform = `translateY(${scrolled * 0.15}px)`;
                }
                ticking = false;
            });
            ticking = true;
        }
    }, { passive: true });
}
