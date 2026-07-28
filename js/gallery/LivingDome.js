/**
 * LivingDome.js
 * Outward-convex barrel dome — camera sits OUTSIDE the cylinder,
 * images curve toward the viewer at centre and wrap away at the edges.
 *
 * Key visual differences from the previous version:
 *  - Camera is placed in front of the dome (z = -CAM_DIST)
 *  - Cards are on the OUTSIDE of the cylinder, facing the camera
 *  - Centre row/column is closest to viewer — edges taper away in 3D
 *  - Cards fill only the front-facing arc (~260°)
 *  - Background is fully transparent → integrates with page seamlessly
 *  - Subtle scale+brightness fall-off toward edges (not a separate box)
 */

import * as THREE from 'three';

// ── Layout ────────────────────────────────────────────────────
const ROWS        = 5;
const RADIUS      = 11;        // cylinder radius
const CAM_DIST    = 16;        // camera distance from cylinder axis
const COL_ANGLE   = 0.20;      // radians between column centres
const VISIBLE_ARC = Math.PI * 1.45;  // ~261° — only front hemisphere
const ROW_HEIGHT  = 2.5;
const CARD_W      = 2.7;
const CARD_H      = 2.1;

// ── Motion ────────────────────────────────────────────────────
const AUTO_SPEED  = 0.000095;  // radians / ms — slow and cinematic
const INERTIA     = 0.91;
const ROT_SCALE   = 0.0038;
const CLICK_THRESH = 6;        // px of drag before treating as scroll

// ── Camera / FOV ─────────────────────────────────────────────
const FOV = 68;

// ─────────────────────────────────────────────────────────────
// GLSL shaders
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
  uniform float falloff;    // 0 (centre) → 1 (edge): dims card naturally
  uniform vec3  accentColor;
  uniform vec3  cardBg;
  uniform float cornerR;

  varying vec2 vUv;

  // Signed-distance for a rounded rectangle; returns neg inside, pos outside
  float sdRoundRect(vec2 uv, float r) {
    vec2 p = (uv - 0.5) * 2.0;
    vec2 q = abs(p) - (1.0 - r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    float d    = sdRoundRect(vUv, cornerR);
    float mask = 1.0 - smoothstep(-0.02, 0.02, d);
    if (mask < 0.005) discard;

    // Base colour
    vec3 col = hasTexture > 0.5 ? texture2D(map, vUv).rgb : cardBg;

    // Subtle top-edge sheen (glass feel)
    float sheen = smoothstep(0.0, 0.18, vUv.y - 0.82) * 0.10;
    col += sheen;

    // Thin bright border
    float border = smoothstep(0.0, 0.035, -d) * 0.12;
    col = mix(col, vec3(1.0), border);

    // Orange accent rim on hover
    float rimZone = smoothstep(-0.20, 0.0, d);
    col = mix(col, accentColor, rimZone * hover * 0.45);
    col *= 1.0 + hover * 0.07;

    // Edge fall-off: cards at cylinder edges fade/dim naturally
    col *= 1.0 - falloff * 0.55;
    float alpha = mask * (1.0 - falloff * 0.40);

    gl_FragColor = vec4(col, alpha);
  }
`;

// ── Helpers ───────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function damp(a, b, lam, dt) { return lerp(a, b, 1 - Math.exp(-lam * dt)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ── Main Class ────────────────────────────────────────────────
export class LivingDome {
  constructor(container, { onSelect } = {}) {
    this.container  = container;
    this.onSelect   = onSelect;
    this.items      = [];
    this.meshes     = [];
    this.loader     = new THREE.TextureLoader();
    this.texCache   = new Map();
    this.texPending = new Map();

    // Rotation
    this.rotY    = 0;
    this.targetY = 0;
    this.velY    = 0;

    // Pointer
    this.dragging   = false;
    this.dragDist   = 0;
    this.lastX      = 0;
    this.velSamples = [];

    // Hover
    this.hovered    = null;
    this.ndc        = new THREE.Vector2();
    this.raycaster  = new THREE.Raycaster();

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

    // Camera outside the dome, looking at the front face
    this.camera = new THREE.PerspectiveCamera(FOV, Math.max(W, 1) / Math.max(H, 1), 0.1, 200);
    this.camera.position.set(0, 0, -CAM_DIST);
    this.camera.lookAt(0, 0, 0);

    // Transparent renderer — integrates with page background
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha:     true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0); // fully transparent background
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor      = 'grab';
    dom.style.display     = 'block';
    dom.setAttribute('aria-hidden', 'true');
    this.container.appendChild(dom);

    // Group that we rotate (the whole dome)
    this.dome = new THREE.Group();
    this.scene.add(this.dome);

    this._resObs = new ResizeObserver(() => this._onResize());
    this._resObs.observe(this.container);

    this._bindEvents();
    this._animate = this._animate.bind(this);
    this._raf = requestAnimationFrame(this._animate);
  }

  // ── Public API ────────────────────────────────────────────
  setItems(items) {
    this._clearDome();
    this.items = items;
    if (!items.length) return;

    const totalCols = Math.ceil(VISIBLE_ARC / COL_ANGLE) + 1;
    const startAngle = -VISIBLE_ARC / 2;   // centre arc on front face

    let idx = 0;
    for (let col = 0; col < totalCols; col++) {
      const angle = startAngle + col * COL_ANGLE;

      // How far off-centre? 0 = front, 1 = edge
      const normalised = Math.abs(angle) / (VISIBLE_ARC / 2);
      const falloff    = Math.pow(normalised, 1.4);

      for (let row = 0; row < ROWS; row++) {
        const item = items[idx % items.length];
        idx++;

        // Outward convex: card on OUTSIDE of cylinder facing -Z (camera direction)
        const x = Math.sin(angle) * RADIUS;
        const z = -Math.cos(angle) * RADIUS;
        // Brick offset on alternate columns
        const yOffset = (col % 2 === 0) ? 0 : ROW_HEIGHT * 0.5;
        const y = (row - (ROWS - 1) / 2) * ROW_HEIGHT + yOffset;

        const mesh = this._makeCard(item, falloff);
        mesh.position.set(x, y, z);
        // Rotate card to face outward (away from cylinder axis, toward camera)
        mesh.rotation.y = angle;

        this.dome.add(mesh);
        this.meshes.push(mesh);
      }
    }

    this._lazyLoad();
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
    this._clearDome();
    const dom = this.renderer.domElement;
    dom?.parentElement?.removeChild(dom);
    this.renderer.dispose();
  }

  // ── Card Factory ──────────────────────────────────────────
  _makeCard(item, falloff) {
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
    const isDark = this._isDark();
    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      side:           THREE.FrontSide,
      uniforms: {
        map:         { value: null },
        hasTexture:  { value: 0 },
        hover:       { value: 0 },
        falloff:     { value: falloff },
        accentColor: { value: new THREE.Color('#E67E22') },
        cardBg:      { value: new THREE.Color(isDark ? '#111C30' : '#E2E8F0') },
        cornerR:     { value: 0.13 },
      },
    });
    const mesh        = new THREE.Mesh(geo, mat);
    mesh.userData.item     = item;
    mesh.userData.hoverAmt = 0;
    mesh.userData.hoverTgt = 0;
    return mesh;
  }

  _clearDome() {
    this.meshes.forEach(m => {
      this.dome.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.meshes = [];
    this.texCache.forEach(t => t.dispose());
    this.texCache.clear();
    this.texPending.clear();
    this.hovered = null;
  }

  // ── Lazy Texture Loading ──────────────────────────────────
  _lazyLoad() {
    const seen = new Set();
    this.meshes.forEach(mesh => {
      const url = mesh.userData.item?.url;
      if (!url || seen.has(url)) return;
      seen.add(url);

      if (this.texCache.has(url)) {
        this._applyTex(url, this.texCache.get(url));
        return;
      }
      if (this.texPending.has(url)) return;
      this.texPending.set(url, true);

      this.loader.load(url, (tex) => {
        if (this.destroyed) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        this.texCache.set(url, tex);
        this._applyTex(url, tex);
      }, undefined, () => {});
    });
  }

  _applyTex(url, tex) {
    this.meshes.forEach(mesh => {
      if (mesh.userData.item?.url === url) {
        mesh.material.uniforms.map.value        = tex;
        mesh.material.uniforms.hasTexture.value = 1;
      }
    });
  }

  // ── Raycasting ────────────────────────────────────────────
  _hitTest(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes);
    return hits.length ? hits[0].object : null;
  }

  // ── Animation Loop ────────────────────────────────────────
  _animate(now) {
    if (this.destroyed) return;
    this._raf = requestAnimationFrame(this._animate);

    const dt = Math.min((now - (this._last ?? now)) / 1000, 0.1);
    this._last = now;

    if (!this.dragging) {
      this.targetY += AUTO_SPEED * (dt * 1000);
      this.targetY += this.velY;
      this.velY    *= INERTIA;
    }

    this.rotY      = damp(this.rotY, this.targetY, 9, dt);
    this.dome.rotation.y = this.rotY;

    // Hover animation — card lifts slightly toward camera
    this.meshes.forEach(m => {
      const prev = m.userData.hoverAmt;
      m.userData.hoverAmt = damp(prev, m.userData.hoverTgt, 14, dt);
      if (Math.abs(m.userData.hoverAmt - prev) > 0.001) {
        m.material.uniforms.hover.value = m.userData.hoverAmt;
        m.scale.setScalar(1 + m.userData.hoverAmt * 0.06);
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
      this.velY       = 0;
      dom.style.cursor = 'grabbing';
      dom.setPointerCapture?.(e.pointerId);
    };

    this._onPM = (e) => {
      if (this.dragging) {
        const dx       = e.clientX - this.lastX;
        this.lastX     = e.clientX;
        this.dragDist += Math.abs(dx);
        this.targetY  -= dx * ROT_SCALE;
        this.velSamples.push({ dx, t: performance.now() });
        if (this.velSamples.length > 5) this.velSamples.shift();
        return;
      }
      // Hover
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
        const dt = Math.max(b.t - a.t, 1);
        this.velY = -(b.dx / dt) * 13 * ROT_SCALE;
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
        this.onSelect?.(item, index === -1 ? 0 : index);
      }
    };

    this._onWheel = (e) => {
      e.preventDefault();
      this.targetY -= e.deltaY * 0.0005;
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

  _isDark() {
    return document.documentElement.getAttribute('data-theme') !== 'light';
  }
}
