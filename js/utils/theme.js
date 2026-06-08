/**
 * js/utils/theme.js
 * ─────────────────────────────────────────────────────────────────────────────
 * 3-Way Theme System: Dark | Light | System (Auto)
 *
 * Modes:
 *   "dark"   → always [data-theme="dark"]
 *   "light"  → always [data-theme="light"]
 *   "auto"   → reads prefers-color-scheme, maps to dark|light
 *
 * The blocking IIFE in <head> uses the same logic to prevent FOUC.
 * This module handles the UI toggle and listens for system preference changes.
 * ─────────────────────────────────────────────────────────────────────────────
 */

export function initThemeSystem() {
    const segments = document.querySelectorAll('.theme-segmented-control .segment');
    if (!segments.length) return;

    // Initial sync
    applyTheme();

    // Segment click handler
    segments.forEach(segment => {
        segment.addEventListener('click', () => {
            const mode = segment.getAttribute('data-mode');
            localStorage.setItem('theme_mode', mode);

            document.documentElement.classList.add('theme-transition');
            applyTheme();

            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 350);
        });
    });

    // React to OS-level preference changes (e.g. user switches system dark/light)
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        const savedMode = localStorage.getItem('theme_mode') || 'auto';
        if (savedMode === 'auto') applyTheme();
    });
}

/**
 * applyTheme()
 * Reads localStorage → applies [data-theme] → updates segment active states
 * and dispatches "themeChanged" for background canvas to update colors.
 */
export function applyTheme() {
    const savedMode = localStorage.getItem('theme_mode') || 'auto';
    const resolvedTheme = resolveTheme(savedMode);

    // Apply to <html>
    document.documentElement.setAttribute('data-theme', resolvedTheme);

    // Update greeting text to reflect time of day (informational, no visual effect)
    updateGreeting();

    // Hide context badge — it was used for time-of-day mood (no longer relevant)
    const contextBadge = document.getElementById('context-subtitle');
    if (contextBadge) contextBadge.style.display = 'none';

    // Update segment active indicator
    const segments = document.querySelectorAll('.theme-segmented-control .segment');
    segments.forEach(seg => {
        seg.classList.toggle('active', seg.getAttribute('data-mode') === savedMode);
    });

    // Notify canvas / other components
    window.dispatchEvent(new CustomEvent('themeChanged', {
        detail: { theme: resolvedTheme, mode: savedMode }
    }));
    
    // Force UnicornStudio to re-render its iframe canvases
    refreshUnicornStudio();
}

/**
 * resolveTheme(mode) → "dark" | "light"
 * Maps the stored mode preference to a concrete theme value.
 */
export function resolveTheme(mode) {
    if (mode === 'dark') return 'dark';
    if (mode === 'light') return 'light';
    // auto: read system preference
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * updateGreeting()
 * Updates the greeting text element based on local time.
 * This is purely informational — no theme logic attached.
 */
function updateGreeting() {
    const greetingEl = document.getElementById('greeting-text');
    if (!greetingEl) return;
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12)       greetingEl.textContent = 'Good Morning,';
    else if (hour >= 12 && hour < 17) greetingEl.textContent = 'Good Afternoon,';
    else if (hour >= 17 && hour < 21) greetingEl.textContent = 'Good Evening,';
    else                               greetingEl.textContent = 'Good Night,';
}

/**
 * refreshUnicornStudio()
 * Forces the UnicornStudio WebGL canvas to re-initialize and bypass caching
 * when the theme is toggled.
 */
function refreshUnicornStudio() {
    if (window.UnicornStudio && window.UnicornStudio.isInitialized) {
        // Find all injected UnicornStudio iframes and force them to reload
        const iframes = document.querySelectorAll('.unicorn-bg iframe');
        iframes.forEach(iframe => {
            // Force the iframe to reload its source, triggering a fresh WebGL paint
            const currentSrc = iframe.src;
            iframe.src = '';
            iframe.src = currentSrc;
        });
        
        // Call init again just in case the wrapper lost state
        window.UnicornStudio.init();
    }
}

// Auto-init on DOM ready
document.addEventListener('DOMContentLoaded', initThemeSystem);
