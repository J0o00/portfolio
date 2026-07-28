/**
 * FullscreenViewer.js
 * Glassmorphism fullscreen viewer shared by every gallery view mode
 * (Dome, Grid, Timeline). Renders on top of the page, traps focus,
 * and supports keyboard navigation across the currently filtered set
 * of media items.
 */

import { resolveLinks } from './GalleryService.js';
import { formatDate } from './GalleryUtils.js';

export class FullscreenViewer {
  constructor() {
    this.items = [];
    this.currentIndex = -1;
    this.lastFocusedElement = null;
    this._buildDOM();
    this._bindEvents();
  }

  _buildDOM() {
    this.root = document.createElement('div');
    this.root.className = 'gallery-viewer';
    this.root.setAttribute('role', 'dialog');
    this.root.setAttribute('aria-modal', 'true');
    this.root.hidden = true;

    this.root.innerHTML = `
      <div class="gallery-viewer__backdrop" data-close></div>
      <div class="gallery-viewer__panel">
        <button type="button" class="gallery-viewer__close" data-close aria-label="Close viewer">
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M6 6L18 18M18 6L6 18" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>
        </button>
        <button type="button" class="gallery-viewer__nav gallery-viewer__nav--prev" data-prev aria-label="Previous item">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M15 5L8 12L15 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        </button>
        <button type="button" class="gallery-viewer__nav gallery-viewer__nav--next" data-next aria-label="Next item">
          <svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M9 5L16 12L9 19" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
        </button>

        <figure class="gallery-viewer__media">
          <img class="gallery-viewer__image" alt="" />
        </figure>

        <div class="gallery-viewer__meta">
          <h2 class="gallery-viewer__title"></h2>
          <p class="gallery-viewer__description"></p>
          <ul class="gallery-viewer__tags"></ul>
          <div class="gallery-viewer__row">
            <time class="gallery-viewer__date"></time>
            <a class="gallery-viewer__download" download aria-label="Download full resolution image">
              <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/></svg>
              Download
            </a>
          </div>
          <nav class="gallery-viewer__links" aria-label="Related pages"></nav>
        </div>
      </div>
    `;

    document.body.appendChild(this.root);

    this.imageEl = this.root.querySelector('.gallery-viewer__image');
    this.titleEl = this.root.querySelector('.gallery-viewer__title');
    this.descriptionEl = this.root.querySelector('.gallery-viewer__description');
    this.tagsEl = this.root.querySelector('.gallery-viewer__tags');
    this.dateEl = this.root.querySelector('.gallery-viewer__date');
    this.downloadEl = this.root.querySelector('.gallery-viewer__download');
    this.linksEl = this.root.querySelector('.gallery-viewer__links');
  }

  _bindEvents() {
    this.root.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) this.close();
      else if (e.target.closest('[data-prev]')) this.previous();
      else if (e.target.closest('[data-next]')) this.next();
    });

    this._onKeydown = (e) => {
      if (this.root.hidden) return;
      if (e.key === 'Escape') this.close();
      else if (e.key === 'ArrowLeft') this.previous();
      else if (e.key === 'ArrowRight') this.next();
      else if (e.key === 'Tab') this._trapFocus(e);
    };
    document.addEventListener('keydown', this._onKeydown);

    // Swipe gestures
    let touchStartX = 0;
    this.root.addEventListener('touchstart', (e) => {
      touchStartX = e.changedTouches[0].screenX;
    }, { passive: true });
    
    this.root.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].screenX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 50) { // minimum swipe distance
        if (diff > 0) this.next();     // swiped left
        else this.previous();          // swiped right
      }
    }, { passive: true });
  }

  _trapFocus(e) {
    const focusable = this.root.querySelectorAll('button, a[href]');
    if (!focusable.length) return;
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (e.shiftKey && document.activeElement === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && document.activeElement === last) {
      e.preventDefault();
      first.focus();
    }
  }

  /** Open the viewer on `items[index]`, keeping the full list for prev/next navigation. */
  open(items, index) {
    this.items = items;
    this.currentIndex = index;
    this.lastFocusedElement = document.activeElement;

    this.root.hidden = false;
    document.body.classList.add('gallery-viewer-open');
    this._render();

    requestAnimationFrame(() => this.root.querySelector('.gallery-viewer__close')?.focus());
  }

  close() {
    if (this.root.hidden) return;
    this.root.hidden = true;
    document.body.classList.remove('gallery-viewer-open');
    this.lastFocusedElement?.focus?.();
  }

  next() {
    if (!this.items.length) return;
    this.currentIndex = (this.currentIndex + 1) % this.items.length;
    this._render();
  }

  previous() {
    if (!this.items.length) return;
    this.currentIndex = (this.currentIndex - 1 + this.items.length) % this.items.length;
    this._render();
  }

  _render() {
    const item = this.items[this.currentIndex];
    if (!item) return;

    this.imageEl.src = item.url;
    this.imageEl.alt = item.altText;

    this.titleEl.textContent = item.title;

    this.descriptionEl.textContent = item.description;
    this.descriptionEl.hidden = !item.description;

    this.tagsEl.innerHTML = '';
    item.tags.forEach((tag) => {
      const li = document.createElement('li');
      li.textContent = tag;
      this.tagsEl.appendChild(li);
    });
    this.tagsEl.hidden = item.tags.length === 0;

    this.dateEl.textContent = formatDate(item.createdAt);
    this.dateEl.dateTime = item.createdAt ?? '';

    this.downloadEl.href = item.url;
    this.downloadEl.download = item.title || 'image';

    this.linksEl.innerHTML = '';
    resolveLinks(item).forEach((link) => {
      const a = document.createElement('a');
      a.href = link.href;
      a.textContent = link.label;
      this.linksEl.appendChild(a);
    });

    this.root.setAttribute('aria-label', `${item.title} — item ${this.currentIndex + 1} of ${this.items.length}`);
  }

  destroy() {
    document.removeEventListener('keydown', this._onKeydown);
    this.root.remove();
  }
}
