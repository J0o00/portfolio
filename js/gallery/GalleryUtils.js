/**
 * GalleryUtils.js
 * Shared, dependency-light helpers consumed by every other gallery
 * module (DomeGallery, GalleryLoader, FilterBar, GalleryService).
 */

import * as THREE from 'three';

/** Clamp a number between min and max. */
export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

/** Linear interpolation between two values. */
export function lerp(start, end, t) {
  return start + (end - start) * t;
}

/** Frame-rate independent exponential easing toward a target value. */
export function damp(current, target, lambda, deltaTime) {
  return lerp(current, target, 1 - Math.exp(-lambda * deltaTime));
}

/** Debounce: fires once after `wait` ms of silence. */
export function debounce(fn, wait = 200) {
  let timer = null;
  return function debounced(...args) {
    clearTimeout(timer);
    timer = setTimeout(() => fn.apply(this, args), wait);
  };
}

/** Format an ISO date string for display, e.g. "Mar 2024". */
export function formatDate(isoString, options = { year: 'numeric', month: 'short' }) {
  if (!isoString) return '';
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', options).format(date);
}

/** True if the user has requested reduced motion at the OS level. */
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
}

/** Detect WebGL support, used for the automatic mobile/low-capability fallback to Grid view. */
export function hasWebGLSupport() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext
      && (canvas.getContext('webgl2') || canvas.getContext('webgl')));
  } catch (e) {
    return false;
  }
}

/**
 * Distribute `count` points evenly across a sphere of `radius` using
 * the golden-angle (Fibonacci) spiral method. This is what gives the
 * dome its evenly spaced, non-overlapping layout instead of a naive
 * latitude/longitude grid, which bunches points at the poles.
 */
export function fibonacciSphere(count, radius = 10) {
  const points = [];
  if (count <= 0) return points;
  const goldenAngle = Math.PI * (3 - Math.sqrt(5));

  for (let i = 0; i < count; i++) {
    const y = count === 1 ? 0 : 1 - (i / (count - 1)) * 2; // -1..1
    const radiusAtY = Math.sqrt(Math.max(0, 1 - y * y));
    const theta = goldenAngle * i;

    const x = Math.cos(theta) * radiusAtY;
    const z = Math.sin(theta) * radiusAtY;

    points.push(new THREE.Vector3(x * radius, y * radius, z * radius));
  }

  return points;
}

/**
 * Rolling FPS monitor. Call `tick(now)` every animation frame; it
 * returns a smoothed average and flags sustained low performance so
 * the caller can drop from the 3D Dome to the flat Grid view.
 */
export class FPSMonitor {
  constructor({ targetFPS = 60, sampleSize = 60, degradeThreshold = 30, sustainedFrames = 90 } = {}) {
    this.targetFPS = targetFPS;
    this.sampleSize = sampleSize;
    this.degradeThreshold = degradeThreshold;
    this.sustainedFrames = sustainedFrames;
    this.samples = [];
    this.lastTime = null;
    this.lowFrameStreak = 0;
    this.averageFPS = targetFPS;
  }

  tick(now) {
    if (this.lastTime !== null) {
      const delta = now - this.lastTime;
      const fps = delta > 0 ? 1000 / delta : this.targetFPS;
      this.samples.push(fps);
      if (this.samples.length > this.sampleSize) this.samples.shift();
      this.averageFPS = this.samples.reduce((a, b) => a + b, 0) / this.samples.length;
      this.lowFrameStreak = this.averageFPS < this.degradeThreshold ? this.lowFrameStreak + 1 : 0;
    }
    this.lastTime = now;
    return this.averageFPS;
  }

  shouldDegrade() {
    return this.lowFrameStreak >= this.sustainedFrames;
  }
}

/**
 * Concurrency-limited texture loader with an internal cache, so the
 * same media URL is never fetched or decoded twice across the whole
 * gallery session. Also the single place textures get disposed from.
 */
export class TextureCache {
  constructor({ maxConcurrent = 6 } = {}) {
    this.loader = new THREE.TextureLoader();
    this.cache = new Map(); // url -> THREE.Texture
    this.pending = new Map(); // url -> Promise<THREE.Texture>
    this.queue = [];
    this.active = 0;
    this.maxConcurrent = maxConcurrent;
  }

  get(url, { priority = false } = {}) {
    if (this.cache.has(url)) return Promise.resolve(this.cache.get(url));
    if (this.pending.has(url)) return this.pending.get(url);

    const promise = new Promise((resolve, reject) => {
      const job = () => {
        this.active++;
        this.loader.load(
          url,
          (texture) => {
            texture.colorSpace = THREE.SRGBColorSpace;
            texture.anisotropy = 4;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.generateMipmaps = true;
            this.cache.set(url, texture);
            this.active--;
            this._drain();
            resolve(texture);
          },
          undefined,
          (error) => {
            this.active--;
            this._drain();
            reject(error);
          },
        );
      };

      if (priority) this.queue.unshift(job);
      else this.queue.push(job);
    }).finally(() => this.pending.delete(url));

    this.pending.set(url, promise);
    this._drain();
    return promise;
  }

  _drain() {
    while (this.active < this.maxConcurrent && this.queue.length) {
      const job = this.queue.shift();
      job();
    }
  }

  disposeAll() {
    this.cache.forEach((texture) => texture.dispose());
    this.cache.clear();
    this.pending.clear();
    this.queue.length = 0;
  }
}

/** Visually hide an element while keeping it in the accessibility tree. */
export function applyVisuallyHidden(el) {
  Object.assign(el.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: '0',
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  });
}
