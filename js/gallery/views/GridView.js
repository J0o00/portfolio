/**
 * views/GridView.js
 * Responsive masonry grid. Pure DOM + CSS columns, so it works even
 * without WebGL — this is also what DomeGallery automatically falls
 * back to when it detects sustained low FPS.
 */

export class GridView {
  constructor(container, { onSelect } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.container.className = 'gallery-grid';
    this.container.setAttribute('role', 'list');
  }

  setItems(items) {
    this.container.innerHTML = '';

    if (!items.length) {
      this._renderEmpty();
      return;
    }

    items.forEach((item, index) => {
      const figure = document.createElement('figure');
      figure.className = 'gallery-grid__item';
      figure.setAttribute('role', 'listitem');

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'gallery-grid__button';
      button.setAttribute('aria-label', `Open ${item.title}`);

      const img = document.createElement('img');
      img.loading = 'lazy';
      img.decoding = 'async';
      img.src = item.url;
      img.alt = item.altText;

      const caption = document.createElement('figcaption');
      caption.className = 'gallery-grid__caption';
      caption.textContent = item.title;

      button.append(img, caption);
      button.addEventListener('click', () => this.onSelect?.(item, index));

      figure.appendChild(button);
      this.container.appendChild(figure);
    });
  }

  _renderEmpty() {
    const empty = document.createElement('p');
    empty.className = 'gallery-grid__empty';
    empty.textContent = 'No media matches these filters yet.';
    this.container.appendChild(empty);
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
