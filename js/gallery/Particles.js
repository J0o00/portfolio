/**
 * Particles.js
 * Lightweight canvas-based ambient floating particles.
 * In dark mode: orange/amber. In light mode: warm grey.
 * Reads the theme from the <html data-theme> attribute.
 */

export class Particles {
  constructor(canvas) {
    this.canvas  = canvas;
    this.ctx     = canvas.getContext('2d');
    this.pts     = [];
    this._raf    = null;
    this._last   = null;
    this.paused  = false;

    this._onResize = () => this._resize();
    window.addEventListener('resize', this._onResize);
    this._resize();
    this._spawn();
    this._tick = this._tick.bind(this);
    this._raf = requestAnimationFrame(this._tick);
  }

  _resize() {
    const {offsetWidth: W, offsetHeight: H} = this.canvas.parentElement;
    this.canvas.width  = W;
    this.canvas.height = H;
    this.W = W;
    this.H = H;
  }

  _isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }

  _spawn() {
    const count = Math.min(60, Math.floor((this.W * this.H) / 18000));
    this.pts = Array.from({length: count}, () => ({
      x:  Math.random() * this.W,
      y:  Math.random() * this.H,
      r:  0.8 + Math.random() * 1.6,
      vx: (Math.random() - 0.5) * 0.18,
      vy: -0.06 - Math.random() * 0.14,
      a:  0.1 + Math.random() * 0.4,
    }));
  }

  _tick(now) {
    if (this.paused) { this._raf = requestAnimationFrame(this._tick); return; }
    const dt = Math.min((now - (this._last ?? now)) / 16.67, 3);
    this._last = now;

    const isDark = this._isDark();
    const color  = isDark ? '230,126,34' : '180,140,100';

    this.ctx.clearRect(0, 0, this.W, this.H);

    this.pts.forEach(p => {
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      if (p.y < -10) { p.y = this.H + 10; p.x = Math.random() * this.W; }
      if (p.x < -10) p.x = this.W + 10;
      if (p.x > this.W + 10) p.x = -10;

      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      this.ctx.fillStyle = `rgba(${color},${p.a})`;
      this.ctx.fill();
    });

    this._raf = requestAnimationFrame(this._tick);
  }

  pause()  { this.paused = true; }
  resume() { this.paused = false; }

  destroy() {
    window.removeEventListener('resize', this._onResize);
    if (this._raf) cancelAnimationFrame(this._raf);
  }
}
