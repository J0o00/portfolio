/**
 * Theme Toggle & Context-Aware System Utility
 * Handles dynamic greetings, time-based themes, and the segmented control (Auto, Light, Dark).
 */

export function initThemeSystem() {
    const segments = document.querySelectorAll('.theme-segmented-control .segment');
    if (!segments.length) return;

    // Run every minute to keep greeting accurate if page is left open
    setInterval(updateContextAwareState, 60000);

    // Initial update
    updateContextAwareState();

    segments.forEach(segment => {
        segment.addEventListener('click', () => {
            const mode = segment.getAttribute('data-mode');
            localStorage.setItem('theme_mode', mode);
            
            document.documentElement.classList.add('theme-transition');
            updateContextAwareState();
            
            setTimeout(() => {
                document.documentElement.classList.remove('theme-transition');
            }, 400);
        });
    });
}

export function updateContextAwareState() {
    const savedMode = localStorage.getItem('theme_mode') || 'auto';
    const hour = new Date().getHours();
    
    let themeClass = 'morning';
    let greeting = 'Good Morning,';

    if (savedMode === 'dark') {
        themeClass = 'dark';
        if (hour >= 5 && hour < 12) greeting = 'Good <span class="accent">Morning,</span>';
        else if (hour >= 12 && hour < 17) greeting = 'Good <span class="accent">Afternoon,</span>';
        else if (hour >= 17 && hour < 21) greeting = 'Good <span class="accent">Evening,</span>';
        else greeting = 'Good <span class="accent">Night,</span>';
    } else if (savedMode === 'light') {
        if (hour >= 5 && hour < 12) {
            themeClass = 'morning';
            greeting = 'Good <span class="accent">Morning,</span>';
        } else if (hour >= 12 && hour < 17) {
            themeClass = 'afternoon';
            greeting = 'Good <span class="accent">Afternoon,</span>';
        } else if (hour >= 17 && hour < 21) {
            themeClass = 'evening';
            greeting = 'Good <span class="accent">Evening,</span>';
        } else {
            themeClass = 'afternoon'; // Default light fallback for night
            greeting = 'Good <span class="accent">Night,</span>';
        }
    } else {
        // Auto
        if (hour >= 5 && hour < 12) {
            themeClass = 'morning';
            greeting = 'Good <span class="accent">Morning,</span>';
        } else if (hour >= 12 && hour < 17) {
            themeClass = 'afternoon';
            greeting = 'Good <span class="accent">Afternoon,</span>';
        } else if (hour >= 17 && hour < 21) {
            themeClass = 'evening';
            greeting = 'Good <span class="accent">Evening,</span>';
        } else {
            themeClass = 'dark';
            greeting = 'Good <span class="accent">Night,</span>';
        }
    }

    // Update DOM Theme Attribute
    if (themeClass === 'morning') {
        document.documentElement.removeAttribute('data-theme');
    } else {
        document.documentElement.setAttribute('data-theme', themeClass);
    }

    // Update Greeting
    const greetingEl = document.getElementById('greeting-text');
    if (greetingEl) {
        greetingEl.innerHTML = greeting;
    }

    // Update Context Badge
    const contextBadge = document.getElementById('context-subtitle');
    if (contextBadge) {
        if (savedMode === 'auto') {
            contextBadge.style.display = 'inline-block';
        } else {
            contextBadge.style.display = 'none';
        }
    }

    // Update Segment Active State
    const segments = document.querySelectorAll('.theme-segmented-control .segment');
    segments.forEach(seg => {
        if (seg.getAttribute('data-mode') === savedMode) {
            seg.classList.add('active');
        } else {
            seg.classList.remove('active');
        }
    });

    // Dispatch event for canvas/background components to update their colors
    window.dispatchEvent(new CustomEvent('themeChanged', { detail: { theme: themeClass } }));
}

document.addEventListener('DOMContentLoaded', initThemeSystem);
