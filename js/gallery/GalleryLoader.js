/**
 * GalleryLoader.js
 * Entry point for the Engineering Media Explorer. Fetches the Media
 * Library once, then wires it to the Dome / Grid / Timeline views,
 * the filter toolbar, and the fullscreen viewer. This file owns
 * state and sequencing only — every visual concern lives in its own
 * module.
 */

import { fetchMediaLibrary, getCategories, filterItems, sortItems } from './GalleryService.js';
import { DomeGallery } from './DomeGallery.js';
import { GridView } from './views/GridView.js';
import { TimelineView } from './views/TimelineView.js';
import { FullscreenViewer } from './FullscreenViewer.js';
import { FilterBar } from './FilterBar.js';
import { hasWebGLSupport } from './GalleryUtils.js';

const VIEW_MODE_KEY = 'ei:gallery:viewMode';
const VALID_MODES = new Set(['dome', 'grid', 'timeline']);

export class GalleryLoader {
  constructor(root) {
    this.root = root;
    this.allItems = [];
    this.filteredItems = [];
    this.currentMode = this._getStoredViewMode();

    this.domeGallery = null;
    this.gridView = null;
    this.timelineView = null;
    this.filterBar = null;
    this.viewer = null;

    this._handleWindowResize = () => this._handleWindowResize_();
  }

  async init() {
    this._buildLayout();
    this.viewer = new FullscreenViewer();

    try {
      this._setStatus('loading');
      this.allItems = await fetchMediaLibrary();
      this.filteredItems = sortItems(this.allItems, 'newest');
      this._setStatus(this.allItems.length ? 'ready' : 'empty');
    } catch (error) {
      console.error('[GalleryLoader]', error);
      this._setStatus('error', error.message);
      return;
    }

    this.filterBar = new FilterBar(this.filterBarEl, {
      categories: getCategories(this.allItems),
      initialViewMode: this.currentMode,
      onChange: (state) => this._handleFilterChange(state),
      onViewModeChange: (mode) => this._setViewMode(mode),
    });

    this._renderCurrentView();
    window.addEventListener('resize', this._handleWindowResize);
  }

  _buildLayout() {
    this.root.innerHTML = `
      <div class="gallery-explorer" data-gallery-root>
        <div class="gallery-explorer__toolbar" data-filter-bar></div>
        <p class="gallery-explorer__status" data-status role="status" aria-live="polite" hidden></p>
        <div class="gallery-explorer__stage">
          <div class="gallery-explorer__view gallery-explorer__view--dome" data-view-dome></div>
          <div class="gallery-explorer__view gallery-explorer__view--grid" data-view-grid hidden></div>
          <div class="gallery-explorer__view gallery-explorer__view--timeline" data-view-timeline hidden></div>
        </div>
      </div>
    `;

    this.filterBarEl = this.root.querySelector('[data-filter-bar]');
    this.statusEl = this.root.querySelector('[data-status]');
    this.domeContainer = this.root.querySelector('[data-view-dome]');
    this.gridContainer = this.root.querySelector('[data-view-grid]');
    this.timelineContainer = this.root.querySelector('[data-view-timeline]');
  }

  _setStatus(state, detail = '') {
    const messages = {
      loading: 'Loading engineering media…',
      empty: 'No media has been uploaded yet.',
      error: `Couldn't load the gallery. ${detail}`.trim(),
      ready: '',
    };
    const message = messages[state] ?? '';
    this.statusEl.hidden = !message;
    this.statusEl.textContent = message;
  }

  _handleFilterChange(state) {
    const filtered = filterItems(this.allItems, state);
    this.filteredItems = sortItems(filtered, state.sort);
    this._setStatus(this.filteredItems.length ? 'ready' : 'empty');
    this._updateCurrentView();
  }

  _getStoredViewMode() {
    try {
      const stored = localStorage.getItem(VIEW_MODE_KEY);
      if (stored && VALID_MODES.has(stored)) return stored;
    } catch (e) {
      // localStorage unavailable (private browsing, etc.) — fall through to a default.
    }
    return hasWebGLSupport() ? 'dome' : 'grid';
  }

  _storeViewMode(mode) {
    try {
      localStorage.setItem(VIEW_MODE_KEY, mode);
    } catch (e) {
      // Non-fatal: the chosen view just won't persist across visits.
    }
  }

  _setViewMode(mode) {
    if (!VALID_MODES.has(mode) || mode === this.currentMode) return;
    this.currentMode = mode;
    this._storeViewMode(mode);
    this.filterBar?.setViewMode(mode);
    this._renderCurrentView();
  }

  _renderCurrentView() {
    this.domeContainer.hidden = this.currentMode !== 'dome';
    this.gridContainer.hidden = this.currentMode !== 'grid';
    this.timelineContainer.hidden = this.currentMode !== 'timeline';

    if (this.currentMode === 'dome') {
      if (!hasWebGLSupport()) {
        this._setViewMode('grid');
        return;
      }
      if (!this.domeGallery) {
        this.domeGallery = new DomeGallery(this.domeContainer, {
          onSelect: (item) => this._openViewer(item),
        });
        // Sustained sub-30fps triggers one automatic, permanent drop to Grid view for this session.
        this.domeGallery.onLowPerformance(() => this._setViewMode('grid'));
        this.domeGallery.setItems(this.filteredItems);
      } else {
        this.domeGallery.resume();
        this.domeGallery.refreshSize();
      }
      return;
    }

    // Leaving Dome view: stop its render loop but keep its GPU resources
    // warm in case the user switches back.
    this.domeGallery?.pause();

    if (this.currentMode === 'grid') {
      if (!this.gridView) {
        this.gridView = new GridView(this.gridContainer, { onSelect: (item) => this._openViewer(item) });
      }
      this.gridView.setItems(this.filteredItems);
    } else if (this.currentMode === 'timeline') {
      if (!this.timelineView) {
        this.timelineView = new TimelineView(this.timelineContainer, { onSelect: (item) => this._openViewer(item) });
      }
      this.timelineView.setItems(this.filteredItems);
    }
  }

  _updateCurrentView() {
    if (this.currentMode === 'dome') this.domeGallery?.setItems(this.filteredItems);
    else if (this.currentMode === 'grid') this.gridView?.setItems(this.filteredItems);
    else if (this.currentMode === 'timeline') this.timelineView?.setItems(this.filteredItems);
  }

  _openViewer(item) {
    const index = this.filteredItems.findIndex((i) => i.id === item.id);
    this.viewer.open(this.filteredItems, index === -1 ? 0 : index);
  }

  _handleWindowResize_() {
    if (this.currentMode === 'dome') this.domeGallery?.refreshSize();
  }

  /** Full teardown — call when navigating away from the gallery page/section in an SPA. */
  destroy() {
    window.removeEventListener('resize', this._handleWindowResize);
    this.domeGallery?.destroy();
    this.gridView?.destroy();
    this.timelineView?.destroy();
    this.viewer?.destroy();
  }
}

/** Convenience bootstrapper for a page/section that just wants to mount the gallery. */
export function mountGalleryExplorer(selector) {
  const root = typeof selector === 'string' ? document.querySelector(selector) : selector;
  if (!root) throw new Error(`GalleryLoader: no element found for "${selector}"`);
  const loader = new GalleryLoader(root);
  loader.init();
  return loader;
}
