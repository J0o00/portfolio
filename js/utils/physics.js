/**
 * js/utils/physics.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable Damped Spring Physics Engine
 *
 * Models a spring-mass system using Hooke's Law with viscous damping:
 *   F = -stiffness * displacement - damping * velocity
 *   acceleration = F / mass
 *
 * Each tick advances the simulation by a fixed sub-step (4ms) to achieve
 * deterministic, frame-rate-independent results regardless of rAF timing.
 *
 * Memory note: instances hold only 6 floats on the heap. No closures or
 * array allocations occur inside the hot path (update()).
 * ─────────────────────────────────────────────────────────────────────────────
 */

const FIXED_DT   = 0.004;   // 4ms fixed sub-step (deterministic regardless of FPS)
const MAX_STEPS  = 10;       // Safety cap — prevents spiral-of-death on tab resume

export class DampedSpring {
    /**
     * @param {object} opts
     * @param {number} [opts.stiffness=180]  Spring constant  (higher = snappier)
     * @param {number} [opts.damping=20]     Damping ratio    (higher = less bounce)
     * @param {number} [opts.mass=1]         Virtual mass     (higher = sluggish)
     * @param {number} [opts.precision=0.001] Rest threshold  (stops rAF when met)
     */
    constructor({ stiffness = 180, damping = 20, mass = 1, precision = 0.001 } = {}) {
        this.stiffness = stiffness;
        this.damping   = damping;
        this.mass      = mass;
        this.precision = precision;

        this.position  = 0;   // current simulated value
        this.velocity  = 0;   // current velocity
        this.target    = 0;   // desired end value
        this._accumulator = 0; // leftover time from last tick
    }

    /** Set the spring target without resetting velocity (allows mid-flight retarget). */
    setTarget(value) {
        this.target = value;
    }

    /** Snap to a value instantly with no animation. */
    snap(value) {
        this.position  = value;
        this.velocity  = 0;
        this.target    = value;
        this._accumulator = 0;
    }

    /**
     * Advance the simulation by `dt` real seconds.
     * Uses a fixed sub-step loop for stability.
     * @param {number} dt  Elapsed time in seconds (from rAF delta / 1000)
     * @returns {boolean}  false when the spring has come to rest (safe to cancel rAF)
     */
    update(dt) {
        this._accumulator += dt;

        let steps = 0;
        while (this._accumulator >= FIXED_DT && steps < MAX_STEPS) {
            const displacement  = this.position - this.target;
            const springForce   = -this.stiffness * displacement;
            const dampingForce  = -this.damping   * this.velocity;
            const acceleration  = (springForce + dampingForce) / this.mass;

            this.velocity += acceleration * FIXED_DT;
            this.position += this.velocity  * FIXED_DT;

            this._accumulator -= FIXED_DT;
            steps++;
        }

        // Check rest condition — both displacement and velocity below threshold
        const atRest =
            Math.abs(this.position - this.target) < this.precision &&
            Math.abs(this.velocity) < this.precision;

        if (atRest) {
            this.position = this.target; // snap to exact target to avoid float drift
            this.velocity = 0;
        }

        return !atRest; // return true if still animating
    }
}

/**
 * SpringPair — convenience wrapper for 2-axis (x/y) spring simulations.
 * Used by tilt cards and magnetic buttons to avoid managing two instances manually.
 */
export class SpringPair {
    constructor(opts = {}) {
        this.x = new DampedSpring(opts);
        this.y = new DampedSpring(opts);
    }

    setTarget(tx, ty) { this.x.setTarget(tx); this.y.setTarget(ty); }
    snap(x, y)        { this.x.snap(x); this.y.snap(y); }

    /**
     * @param {number} dt seconds
     * @returns {boolean} true if still moving
     */
    update(dt) {
        const ax = this.x.update(dt);
        const ay = this.y.update(dt);
        return ax || ay;
    }
}
