/**
 * ImageViewer.js
 * The fullscreen image viewer that opens when a dome card is clicked.
 *
 * Design intent (per spec):
 *  ✓  Clicked image comes forward — no metadata panel
 *  ✓  Dark glass overlay — background stays ALIVE (dome keeps rotating)
 *  ✓  Image enlarges with a smooth scale+fade
 *  ✓  Click outside → image returns back into dome
 *  ✓  No title, no description, no buttons — just the image
 *  ✓  Keyboard accessible: Escape closes, Left/Right navigate
 */

export class ImageViewer {
  constructor() {
    this.items   = [];
    this.index   = -1;
    this._lastFocus = null;
    this._build();
    this._bind();
  }

  _build() {
    this.root = document.createElement('div');
    this.root.className = 'img-viewer';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.setAttribute('aria-label', 'Image viewer');
    this.root.hidden = true;

    // Glass backdrop — clicking here closes
    this.backdrop = document.createElement('div');
    this.backdrop.className = 'img-viewer__backdrop';
    this.root.appendChild(this.backdrop);

    // Image wrapper
    this.wrap = document.createElement('div');
    this.wrap.className = 'img-viewer__wrap';

    this.img = document.createElement('img');
    this.img.className = 'img-viewer__img';
    this.img.alt = '';

    // Prev / Next arrows (minimal, accessible)
    this.prevBtn = this._arrow('left',  '‹', 'Previous image');
    this.nextBtn = this._arrow('right', '›', 'Next image');

    this.wrap.append(this.prevBtn, this.img, this.nextBtn);
    this.root.appendChild(this.wrap);

    document.body.appendChild(this.root);
  }

  _arrow(side, char, label) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = `img-viewer__arrow img-viewer__arrow--${side}`;
    btn.setAttribute('aria-label', label);
    btn.textContent = char;
    return btn;
  }

  _bind() {
    this.backdrop.addEventListener('click', () => this.close());
    this.prevBtn.addEventListener('click', (e) => { e.stopPropagation(); this.prev(); });
    this.nextBtn.addEventListener('click', (e) => { e.stopPropagation(); this.next(); });

    this._onKey = (e) => {
      if (this.root.hidden) return;
      if (e.key === 'Escape')      this.close();
      if (e.key === 'ArrowLeft')   this.prev();
      if (e.key === 'ArrowRight')  this.next();
    };
    document.addEventListener('keydown', this._onKey);
  }

  open(items, index) {
    this.items = items;
    this.index = index;
    this._lastFocus = document.activeElement;
    this.root.hidden = false;
    // Trigger paint then add class for CSS transition
    requestAnimationFrame(() => {
      requestAnimationFrame(() => this.root.classList.add('img-viewer--open'));
    });
    this._render();
    this.prevBtn.focus();
  }

  close() {
    this.root.classList.remove('img-viewer--open');
    // Wait for transition before hiding
    const done = () => {
      this.root.hidden = true;
      this.root.removeEventListener('transitionend', done);
    };
    this.root.addEventListener('transitionend', done);
    this._lastFocus?.focus?.();
  }

  next() { this.index = (this.index + 1) % this.items.length; this._render(); }
  prev() { this.index = (this.index - 1 + this.items.length) % this.items.length; this._render(); }

  _render() {
    const item = this.items[this.index];
    if (!item) return;
    // Fade image out, swap, fade in
    this.img.style.opacity = '0';
    this.img.style.transform = 'scale(0.95)';
    setTimeout(() => {
      this.img.src = item.url;
      this.img.alt = item.altText;
      this.img.style.opacity = '1';
      this.img.style.transform = 'scale(1)';
    }, 150);

    const hasPrev = this.items.length > 1;
    this.prevBtn.hidden = !hasPrev;
    this.nextBtn.hidden = !hasPrev;
  }

  destroy() {
    document.removeEventListener('keydown', this._onKey);
    this.root.remove();
  }
}
