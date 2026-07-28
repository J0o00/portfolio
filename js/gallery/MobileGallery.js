/**
 * MobileGallery.js
 * Touch-optimised horizontal snap gallery for mobile / no-WebGL devices.
 * Same images, same data, zero Three.js dependency.
 * Glass card aesthetic matches the dome's style via shared CSS variables.
 */

export class MobileGallery {
  constructor(container, { onSelect } = {}) {
    this.container = container;
    this.onSelect  = onSelect;
    this.items     = [];
    this._build();
  }

  _build() {
    this.track = document.createElement('div');
    this.track.className = 'mob-gallery__track';
    this.container.appendChild(this.track);
  }

  setItems(items) {
    this.items = items;
    this.track.innerHTML = '';
    items.forEach((item, i) => {
      const card = document.createElement('div');
      card.className = 'mob-gallery__card';
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', item.title);

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src  = item.url;
      img.alt  = item.altText;
      img.className = 'mob-gallery__img';

      card.appendChild(img);
      card.addEventListener('click',   () => this.onSelect?.(item, i));
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); this.onSelect?.(item, i); }
      });

      this.track.appendChild(card);
    });
  }

  destroy() { this.container.innerHTML = ''; }
}
