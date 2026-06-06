/**
 * js/utils/accessibility.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Global Motion Preference State & EventBus
 *
 * Single source of truth for prefers-reduced-motion. All animation modules
 * import `motionPrefs` and check `motionPrefs.reduced` before starting rAF
 * loops, spring calculations, or 3D transforms.
 *
 * Pattern: Publish-Subscribe EventBus so modules can react to live OS-level
 * changes (user toggles accessibility setting mid-session).
 *
 * Memory note: Listeners are stored in a Set, not an Array, to prevent
 * duplicate registrations and allow O(1) removal.
 * ─────────────────────────────────────────────────────────────────────────────
 */

const _listeners = new Set();
const _mq = window.matchMedia('(prefers-reduced-motion: reduce)');

/**
 * Global singleton — import this object everywhere.
 *
 * @property {boolean} reduced  true when the OS requests minimal motion
 */
export const motionPrefs = {
    get reduced() { return _mq.matches; },

    /**
     * Register a callback to be fired when the preference changes.
     * @param {function} fn  Called with `{ reduced: boolean }`
     * @returns {function}   Unsubscribe function (call to clean up)
     */
    onChange(fn) {
        _listeners.add(fn);
        return () => _listeners.delete(fn); // returns cleanup fn
    },
};

// Wire up the MediaQueryList change event once, globally.
_mq.addEventListener('change', e => {
    const payload = { reduced: e.matches };
    _listeners.forEach(fn => {
        try { fn(payload); } catch (_) { /* isolate listener errors */ }
    });
});
