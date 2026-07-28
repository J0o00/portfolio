/**
 * views/TimelineView.js
 * Groups the currently filtered media set by year, most recent first,
 * with a horizontally scrollable row of thumbnails per year.
 */

import { groupByYear } from '../GalleryService.js';

export class TimelineView {
  constructor(container, { onSelect } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.container.className = 'gallery-timeline';
  }

  setItems(items) {
    this.container.innerHTML = '';
    const groups = groupByYear(items);

    if (!groups.length) {
      const empty = document.createElement('p');
      empty.className = 'gallery-timeline__empty';
      empty.textContent = 'No media matches these filters yet.';
      this.container.appendChild(empty);
      return;
    }

    groups.forEach(({ year, items: yearItems }) => {
      const section = document.createElement('section');
      section.className = 'gallery-timeline__group';
      section.setAttribute('aria-label', year);

      const heading = document.createElement('h3');
      heading.className = 'gallery-timeline__year';
      heading.textContent = year;
      section.appendChild(heading);

      const row = document.createElement('div');
      row.className = 'gallery-timeline__row';
      row.setAttribute('role', 'list');

      yearItems.forEach((item) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'gallery-timeline__item';
        button.setAttribute('role', 'listitem');
        button.setAttribute('aria-label', `Open ${item.title}`);

        const img = document.createElement('img');
        img.loading = 'lazy';
        img.decoding = 'async';
        img.src = item.url;
        img.alt = item.altText;

        button.appendChild(img);
        button.addEventListener('click', () => this.onSelect?.(item, items.indexOf(item)));
        row.appendChild(button);
      });

      section.appendChild(row);
      this.container.appendChild(section);
    });
  }

  destroy() {
    this.container.innerHTML = '';
  }
}
