/**
 * gallerySection.js
 * Entry point — initialises the Living Gallery as a section within
 * index.html. Handles:
 *  - Intersection Observer → starts dome only when section is visible
 *  - WebGL detection → routes to MobileGallery on low-end devices
 *  - Supabase data fetch → passes items to the correct renderer
 *  - ImageViewer → fullscreen overlay that keeps the dome alive
 *  - Particles canvas → ambient floating particles in the background
 *  - Scroll-triggered fade-in
 */

import { fetchMediaLibrary }  from './GalleryService.js';
import { LivingDome }         from './LivingDome.js';
import { MobileGallery }      from './MobileGallery.js';
import { ImageViewer }        from './ImageViewer.js';
import { Particles }          from './Particles.js';

function hasWebGL() {
  try {
    const c = document.createElement('canvas');
    return !!(window.WebGLRenderingContext &&
      (c.getContext('webgl2') || c.getContext('webgl')));
  } catch { return false; }
}

function isMobile() {
  return window.matchMedia('(max-width: 768px)').matches;
}

export async function initLivingGallery(sectionEl) {
  if (!sectionEl) return;

  const stageEl    = sectionEl.querySelector('[data-gallery-stage]');
  const statusEl   = sectionEl.querySelector('[data-gallery-status]');
  const particleEl = sectionEl.querySelector('[data-gallery-particles]');

  if (!stageEl) return;

  let dome    = null;
  let mobile  = null;
  let viewer  = new ImageViewer();
  let particles = null;
  let initialised = false;

  // ── Particles ──────────────────────────────────────────────
  if (particleEl) {
    particles = new Particles(particleEl);
  }

  // ── Data Fetch ─────────────────────────────────────────────
  async function loadAndRender() {
    if (initialised) return;
    initialised = true;

    setStatus('Loading media…');
    let items = [];
    try {
      items = await fetchMediaLibrary();
    } catch (err) {
      setStatus(`Failed to load gallery: ${err.message}`);
      return;
    }

    if (!items.length) {
      setStatus('No media uploaded yet — add images in Quantum Control.');
      return;
    }

    hideStatus();

    const useWebGL = hasWebGL() && !isMobile();

    if (useWebGL) {
      dome = new LivingDome(stageEl, {
        onSelect: (item, index) => {
          viewer.open(items, index ?? 0);
          // Dome keeps rotating — we do NOT pause it
        }
      });
      dome.setItems(items);
    } else {
      stageEl.classList.add('gallery-stage--mobile');
      mobile = new MobileGallery(stageEl, {
        onSelect: (item, i) => viewer.open(items, i)
      });
      mobile.setItems(items);
    }
  }

  // ── Intersection Observer — start only when visible ────────
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        loadAndRender();
        sectionEl.classList.add('gallery-section--visible');
        if (dome) dome.resume();
        if (particles) particles.resume();
      } else {
        if (dome) dome.pause();
        if (particles) particles.pause();
      }
    });
  }, { threshold: 0.1 });

  io.observe(sectionEl);

  // ── Helpers ────────────────────────────────────────────────
  function setStatus(msg) {
    if (!statusEl) return;
    statusEl.textContent = msg;
    statusEl.hidden = false;
  }
  function hideStatus() {
    if (!statusEl) return;
    statusEl.hidden = true;
  }
}
