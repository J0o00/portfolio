/**
 * LivingDome.js — Infinite Billboard Carousel
 *
 * Architecture:
 *  - Cards sit on the OUTSIDE of a cylinder arc, NOT inside a rotating group.
 *  - A global `scrollAngle` shifts all cards along the arc each frame.
 *  - When a card drifts past the right or left edge of the visible arc,
 *    its baseAngle is teleported to the opposite side (object-pool wrap).
 *  - Each frame, every card calls lookAt(camera) so it ALWAYS faces forward.
 *  - Result: perfectly front-facing photos, seamless endless loop, no gaps.
 *
 * Controls:
 *  - Drag left/right to rotate; release → physics inertia carries it.
 *  - Scroll wheel also rotates.
 *  - Click a card → onSelect(item, index) callback.
 */

import * as THREE from 'three';

// ── Layout constants ──────────────────────────────────────────
const ROWS        = 5;
const RADIUS      = 13;       // cylinder radius — wider = more spread
const CAM_DIST    = 16;       // camera sits this far in front of dome centre
const COL_ANGLE   = 0.23;     // radians between column centres (smaller = denser)
const VISIBLE_HALF= 1.65;     // half of the visible arc in radians (±95°)
const ROW_HEIGHT  = 2.5;
const CARD_W      = 2.75;
const CARD_H      = 2.05;

// Derived: how many slots we create (enough to tile the arc + 4 buffer slots)
const N_VISIBLE   = Math.ceil((VISIBLE_HALF * 2) / COL_ANGLE);
const N_SLOTS     = N_VISIBLE + 4;
const CONTENT_ARC = N_SLOTS * COL_ANGLE; // arc length before repeating

// ── Motion ────────────────────────────────────────────────────
const AUTO_SPEED  = 0.00011; // radians per ms (slow, cinematic)
const INERTIA     = 0.91;
const ROT_SCALE   = 0.0042;
const CLICK_THRESH = 6;
const FOV         = 65;

// ─────────────────────────────────────────────────────────────
// GLSL
// ─────────────────────────────────────────────────────────────
const VERT = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const FRAG = `
  precision highp float;
  uniform sampler2D map;
  uniform float hasTexture;
  uniform float hover;
  uniform float edgeFade;    // 0 (centre) → 1 (off-screen edge)
  uniform vec3  accentColor;
  uniform vec3  cardBg;
  uniform float cornerR;
  varying vec2 vUv;

  float sdRRect(vec2 uv, float r) {
    vec2 p = (uv - 0.5) * 2.0;
    vec2 q = abs(p) - (1.0 - r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    float d     = sdRRect(vUv, cornerR);
    float mask  = 1.0 - smoothstep(-0.018, 0.018, d);
    if (mask < 0.005) discard;

    vec3 col = hasTexture > 0.5 ? texture2D(map, vUv).rgb : cardBg;

    // glass sheen
    col += smoothstep(0.0, 0.18, vUv.y - 0.82) * 0.10;

    // border highlight
    col = mix(col, vec3(1.0), smoothstep(0.0, 0.035, -d) * 0.11);

    // orange rim on hover
    col = mix(col, accentColor, smoothstep(-0.22, 0.0, d) * hover * 0.44);
    col *= 1.0 + hover * 0.07;

    // edge fade (dims cards near arc boundary)
    col      *= 1.0 - edgeFade * 0.60;
    float a   = mask * (1.0 - edgeFade * 0.50);

    gl_FragColor = vec4(col, a);
  }
`;

// ── Helpers ───────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function damp(a, b, lam, dt) { return lerp(a, b, 1 - Math.exp(-lam * dt)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─────────────────────────────────────────────────────────────
export class LivingDome {
  constructor(container, { onSelect } = {}) {
    this.container  = container;
    this.onSelect   = onSelect;

    this.items      = [];
    this.slots      = [];   // { baseAngle, itemIdx, meshes[] }
    this.meshes     = [];   // flat list for raycasting

    this.loader     = new THREE.TextureLoader();
    this.texCache   = new Map();  // url → THREE.Texture
    this.texPending = new Set();

    // Scroll state
    this.scrollAngle  = 0;
    this.targetScroll = 0;
    this.velScroll    = 0;

    // Pointer state
    this.dragging   = false;
    this.dragDist   = 0;
    this.lastX      = 0;
    this.velSamples = [];

    // Hover
    this.hovered  = null;
    this.ndc      = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    // RAF
    this._raf      = null;
    this._last     = null;
    this.destroyed = false;

    this._init();
  }

  // ── Bootstrap ─────────────────────────────────────────────
  _init() {
    const { clientWidth: W, clientHeight: H } = this.container;

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 200);
    // Camera in front of dome looking toward +Z (dome front is at z = -RADIUS)
    this.camera.position.set(0, 0, -CAM_DIST);
    this.camera.lookAt(0, 0, 0);

    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha:     true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);  // transparent bg
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor      = 'grab';
    dom.style.display     = 'block';
    dom.setAttribute('aria-hidden', 'true');
    this.container.appendChild(dom);

    this._resObs = new ResizeObserver(() => this._onResize());
    this._resObs.observe(this.container);
    this._bindEvents();

    this._animate = this._animate.bind(this);
    this._raf = requestAnimationFrame(this._animate);
  }

  // ── Public API ────────────────────────────────────────────
  setItems(items) {
    this._clear();
    if (!items.length) return;
    this.items = items;

    // Slot column layout: start at left edge of visible arc
    const startAngle = -VISIBLE_HALF - COL_ANGLE; // one slot off screen to left

    for (let col = 0; col < N_SLOTS; col++) {
      const baseAngle = startAngle + col * COL_ANGLE;
      const itemIdx   = col % items.length;

      const meshes = [];
      for (let row = 0; row < ROWS; row++) {
        // Brick-lay: alternate columns offset vertically by half row
        const yOff = (col % 2 === 0) ? 0 : ROW_HEIGHT * 0.45;
        const y    = (row - (ROWS - 1) / 2) * ROW_HEIGHT + yOff;

        const mesh = this._makeCard(items[itemIdx]);
        mesh.position.y = y; // x and z set each frame
        this.scene.add(mesh);
        meshes.push(mesh);
      }

      this.slots.push({ baseAngle, itemIdx, meshes });
      this.meshes.push(...meshes);
    }

    this._placeSlots(); // initial placement before first frame
    this._loadAllTextures();
  }

  pause()  { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; } }
  resume() {
    if (!this._raf && !this.destroyed) {
      this._last = null;
      this._raf  = requestAnimationFrame(this._animate);
    }
  }

  destroy() {
    this.destroyed = true;
    this.pause();
    this._resObs?.disconnect();
    this._unbindEvents();
    this._clear();
    const dom = this.renderer.domElement;
    dom?.parentElement?.removeChild(dom);
    this.renderer.dispose();
  }

  // ── Card factory ──────────────────────────────────────────
  _makeCard(item) {
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      uniforms: {
        map:         { value: null },
        hasTexture:  { value: 0 },
        hover:       { value: 0 },
        edgeFade:    { value: 0 },
        accentColor: { value: new THREE.Color('#E67E22') },
        cardBg:      { value: new THREE.Color(isDark ? '#111C30' : '#DCE4F0') },
        cornerR:     { value: 0.13 },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.item     = item;
    mesh.userData.hoverAmt = 0;
    mesh.userData.hoverTgt = 0;
    return mesh;
  }

  _clear() {
    this.slots.forEach(slot =>
      slot.meshes.forEach(m => {
        this.scene.remove(m);
        m.geometry.dispose();
        m.material.dispose();
      })
    );
    this.slots  = [];
    this.meshes = [];
    this.texCache.forEach(t => t.dispose());
    this.texCache.clear();
    this.texPending.clear();
    this.hovered = null;
  }

  // ── Texture loading ───────────────────────────────────────
  _loadAllTextures() {
    const seen = new Set();
    this.items.forEach(item => {
      if (!item.url || seen.has(item.url)) return;
      seen.add(item.url);
      if (this.texCache.has(item.url) || this.texPending.has(item.url)) return;
      this.texPending.add(item.url);
      this.loader.load(item.url, (tex) => {
        if (this.destroyed) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        this.texCache.set(item.url, tex);
        // Apply to all matching cards
        this.meshes.forEach(m => {
          if (m.userData.item?.url === item.url) {
            m.material.uniforms.map.value        = tex;
            m.material.uniforms.hasTexture.value = 1;
          }
        });
      }, undefined, () => {});
    });
  }

  _applyTexture(mesh) {
    const url = mesh.userData.item?.url;
    if (!url) return;
    const tex = this.texCache.get(url);
    if (tex) {
      mesh.material.uniforms.map.value        = tex;
      mesh.material.uniforms.hasTexture.value = 1;
    }
  }

  // ── Slot placement (called every frame) ───────────────────
  _placeSlots() {
    const camPos = this.camera.position;
    const items  = this.items;
    if (!items.length) return;

    this.slots.forEach(slot => {
      // world angle = slot's base + current scroll
      let worldAngle = slot.baseAngle + this.scrollAngle;

      // ── WRAP: slot drifted off the left edge → teleport to right ──
      if (worldAngle < -VISIBLE_HALF - COL_ANGLE * 2) {
        slot.baseAngle += CONTENT_ARC;
        worldAngle      = slot.baseAngle + this.scrollAngle;
        // Advance to next set of items
        slot.itemIdx = (slot.itemIdx + N_SLOTS) % items.length;
        slot.meshes.forEach(m => {
          m.userData.item = items[slot.itemIdx];
          m.material.uniforms.hasTexture.value = 0;
          this._applyTexture(m);
        });
      }
      // ── WRAP: slot drifted off the right edge → teleport to left ──
      else if (worldAngle > VISIBLE_HALF + COL_ANGLE * 2) {
        slot.baseAngle -= CONTENT_ARC;
        worldAngle      = slot.baseAngle + this.scrollAngle;
        slot.itemIdx = ((slot.itemIdx - N_SLOTS) % items.length + items.length) % items.length;
        slot.meshes.forEach(m => {
          m.userData.item = items[slot.itemIdx];
          m.material.uniforms.hasTexture.value = 0;
          this._applyTexture(m);
        });
      }

      // Position on outward convex cylinder (camera at z = -CAM_DIST, front at z = -RADIUS)
      const x = Math.sin(worldAngle) * RADIUS;
      const z = -Math.cos(worldAngle) * RADIUS;

      // Edge fade: smooth 0→1 as card moves from ±0.7*VISIBLE_HALF to ±VISIBLE_HALF
      const absA    = Math.abs(worldAngle);
      const fadeStart = VISIBLE_HALF * 0.70;
      const edgeFade  = clamp((absA - fadeStart) / (VISIBLE_HALF - fadeStart), 0, 1);

      slot.meshes.forEach(m => {
        m.position.x = x;
        m.position.z = z;
        m.material.uniforms.edgeFade.value = edgeFade;

        // ── BILLBOARD: always face the camera ──
        // Reset world rotation, then turn to face camera
        m.rotation.set(0, 0, 0);
        m.lookAt(camPos);
      });
    });
  }

  // ── Raycasting ────────────────────────────────────────────
  _hitTest(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes, false);
    return hits.length ? hits[0].object : null;
  }

  // ── Animation loop ────────────────────────────────────────
  _animate(now) {
    if (this.destroyed) return;
    this._raf = requestAnimationFrame(this._animate);

    const dt = Math.min((now - (this._last ?? now)) / 1000, 0.1);
    this._last = now;

    if (!this.dragging) {
      // Perpetual auto-scroll (moves right-to-left)
      this.targetScroll -= AUTO_SPEED * (dt * 1000);
      // Inertia after drag release
      this.targetScroll += this.velScroll;
      this.velScroll    *= INERTIA;
    }

    // Smooth follow
    this.scrollAngle = damp(this.scrollAngle, this.targetScroll, 9, dt);

    // Update all slot positions + billboarding + wrapping
    this._placeSlots();

    // Per-card hover animation
    this.meshes.forEach(m => {
      const prev = m.userData.hoverAmt;
      m.userData.hoverAmt = damp(prev, m.userData.hoverTgt, 14, dt);
      if (Math.abs(m.userData.hoverAmt - prev) > 0.001) {
        m.material.uniforms.hover.value = m.userData.hoverAmt;
        m.scale.setScalar(1 + m.userData.hoverAmt * 0.055);
      }
    });

    this.renderer.render(this.scene, this.camera);
  }

  // ── Events ────────────────────────────────────────────────
  _bindEvents() {
    const dom = this.renderer.domElement;

    this._onPD = (e) => {
      this.dragging   = true;
      this.dragDist   = 0;
      this.lastX      = e.clientX;
      this.velSamples = [];
      this.velScroll  = 0;
      dom.style.cursor = 'grabbing';
      dom.setPointerCapture?.(e.pointerId);
    };

    this._onPM = (e) => {
      if (this.dragging) {
        const dx       = e.clientX - this.lastX;
        this.lastX     = e.clientX;
        this.dragDist += Math.abs(dx);
        // Drag right (dx > 0) → scroll backward (increase angle)
        this.targetScroll += dx * ROT_SCALE;
        this.velSamples.push({ dx, t: performance.now() });
        if (this.velSamples.length > 6) this.velSamples.shift();
        return;
      }
      // Hover detection
      const hit = this._hitTest(e);
      if (hit !== this.hovered) {
        if (this.hovered) this.hovered.userData.hoverTgt = 0;
        this.hovered = hit;
        if (hit) hit.userData.hoverTgt = 1;
        dom.style.cursor = hit ? 'pointer' : 'grab';
      }
    };

    this._onPU = (e) => {
      dom.releasePointerCapture?.(e.pointerId);
      if (this.dragging && this.velSamples.length >= 2) {
        const a  = this.velSamples[0];
        const b  = this.velSamples[this.velSamples.length - 1];
        const elapsed = Math.max(b.t - a.t, 1);
        this.velScroll = (b.dx / elapsed) * 14 * ROT_SCALE;
      }
      this.dragging = false;
      dom.style.cursor = this.hovered ? 'pointer' : 'grab';
    };

    this._onClick = (e) => {
      if (this.dragDist > CLICK_THRESH) { this.dragDist = 0; return; }
      const hit = this._hitTest(e);
      if (hit) {
        const item  = hit.userData.item;
        const index = this.items.findIndex(i => i.id === item.id);
        this.onSelect?.(item, Math.max(0, index));
      }
    };

    this._onWheel = (e) => {
      e.preventDefault();
      this.targetScroll += e.deltaY * -0.0005;
    };

    dom.addEventListener('pointerdown',    this._onPD);
    window.addEventListener('pointermove',    this._onPM);
    window.addEventListener('pointerup',      this._onPU);
    window.addEventListener('pointercancel',  this._onPU);
    dom.addEventListener('wheel',   this._onWheel, { passive: false });
    dom.addEventListener('click',   this._onClick);
  }

  _unbindEvents() {
    const dom = this.renderer.domElement;
    if (!dom) return;
    dom.removeEventListener('pointerdown',   this._onPD);
    window.removeEventListener('pointermove',   this._onPM);
    window.removeEventListener('pointerup',     this._onPU);
    window.removeEventListener('pointercancel', this._onPU);
    dom.removeEventListener('wheel',  this._onWheel);
    dom.removeEventListener('click',  this._onClick);
  }

  _onResize() {
    const { clientWidth: W, clientHeight: H } = this.container;
    if (!W || !H) return;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }
}
