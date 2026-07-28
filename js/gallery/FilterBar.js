/**
 * FilterBar.js
 * Sticky search / category / sort / view-mode toolbar. Owns only the
 * controls and their markup — GalleryLoader owns fetching data and
 * re-rendering whichever view is active in response to the callbacks
 * below.
 */

import { debounce } from './GalleryUtils.js';

const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest' },
  { value: 'oldest', label: 'Oldest' },
  { value: 'alphabetical', label: 'Alphabetical' },
];

const VIEW_MODES = [
  { value: 'dome', label: 'Dome' },
  { value: 'grid', label: 'Grid' },
  { value: 'timeline', label: 'Timeline' },
];

export class FilterBar {
  constructor(container, { categories = [], initialViewMode = 'dome', onChange, onViewModeChange } = {}) {
    this.container = container;
    this.categories = categories;
    this.state = { search: '', category: 'all', sort: 'newest' };
    this.viewMode = initialViewMode;
    this.onChange = onChange;
    this.onViewModeChange = onViewModeChange;

    this._render();
    this._bindEvents();
  }

  _render() {
    const categoryOptions = ['all', ...this.categories]
      .map((c) => `<option value="${this._escape(c)}">${c === 'all' ? 'All categories' : this._escape(c)}</option>`)
      .join('');

    const sortOptions = SORT_OPTIONS
      .map((o) => `<option value="${o.value}">${o.label}</option>`)
      .join('');

    const viewButtons = VIEW_MODES
      .map((v) => `
        <button type="button" class="filter-bar__view-btn" data-view="${v.value}" aria-pressed="${v.value === this.viewMode}">
          ${v.label}
        </button>
      `).join('');

    this.container.className = 'filter-bar';
    this.container.setAttribute('role', 'toolbar');
    this.container.setAttribute('aria-label', 'Gallery filters and view');

    this.container.innerHTML = `
      <div class="filter-bar__search">
        <label class="filter-bar__label" for="gallery-search">Search</label>
        <input id="gallery-search" type="search" placeholder="Search title, tag, category…" autocomplete="off" value="${this._escape(this.state.search)}" />
      </div>

      <div class="filter-bar__field">
        <label class="filter-bar__label" for="gallery-category">Category</label>
        <select id="gallery-category">${categoryOptions}</select>
      </div>

      <div class="filter-bar__field">
        <label class="filter-bar__label" for="gallery-sort">Sort</label>
        <select id="gallery-sort">${sortOptions}</select>
      </div>

      <div class="filter-bar__views" role="group" aria-label="View mode">
        ${viewButtons}
      </div>
    `;

    this.searchInput = this.container.querySelector('#gallery-search');
    this.categorySelect = this.container.querySelector('#gallery-category');
    this.sortSelect = this.container.querySelector('#gallery-sort');
    this.viewButtons = Array.from(this.container.querySelectorAll('.filter-bar__view-btn'));

    this.categorySelect.value = this.state.category;
    this.sortSelect.value = this.state.sort;
  }

  _escape(value) {
    return String(value).replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  _bindEvents() {
    const emitChange = () => this.onChange?.({ ...this.state });
    const emitDebounced = debounce(emitChange, 250);

    this.searchInput.addEventListener('input', (e) => {
      this.state.search = e.target.value;
      emitDebounced();
    });

    this.categorySelect.addEventListener('change', (e) => {
      this.state.category = e.target.value;
      emitChange();
    });

    this.sortSelect.addEventListener('change', (e) => {
      this.state.sort = e.target.value;
      emitChange();
    });

    this.viewButtons.forEach((btn) => {
      btn.addEventListener('click', () => this.setViewMode(btn.dataset.view, true));
    });
  }

  /** Update the active view-mode button. Pass notify=true only for user-initiated changes. */
  setViewMode(mode, notify = false) {
    this.viewMode = mode;
    this.viewButtons.forEach((btn) => btn.setAttribute('aria-pressed', String(btn.dataset.view === mode)));
    if (notify) this.onViewModeChange?.(mode);
  }

  /** Re-render with a fresh category list (e.g. after the Media Library is refreshed). */
  updateCategories(categories) {
    this.categories = categories;
    this._render();
    this._bindEvents();
    this.setViewMode(this.viewMode);
  }

  getState() {
    return { ...this.state };
  }
}
