/**
 * LivingDome.js — Sphere Dome Gallery
 *
 * Matches the reference image exactly:
 *  - Cards placed on the OUTSIDE of a sphere in a grid (cols × rows)
 *  - Cards face OUTWARD (not billboarded) — edges are angled naturally
 *  - The entire dome GROUP rotates on Y axis as one piece (true dome spin)
 *  - Barrel/fish-eye look from camera being relatively close to sphere
 *  - 5 rows, 16 columns filling 360° → same images repeat as it spins
 *  - Drag overrides auto-spin with physics inertia
 */

import * as THREE from 'three';

// ── Sphere geometry ───────────────────────────────────────────
const SPHERE_R    = 18;         // slightly larger sphere
const CAM_DIST    = 21;         // camera further back
const N_COLS      = 60;         // columns around 360° (6.0° apart)
const N_ROWS      = 17;         // rows top to bottom
const ROW_PHI_DEG = 4.5;        // degrees between rows
const CARD_W      = 1.55;       // much smaller card width
const CARD_H      = 1.15;       // much smaller card height
const FOV         = 70;         // wide-angle for strong barrel distortion

const COL_ANGLE   = (Math.PI * 2) / N_COLS;
const ROW_PHI     = ROW_PHI_DEG * Math.PI / 180;

// ── Motion ────────────────────────────────────────────────────
const AUTO_SPEED  = 0.00013;  // radians / ms (slow cinematic)
const INERTIA     = 0.92;
const ROT_SCALE   = 0.005;
const CLICK_THRESH = 5;

// ─────────────────────────────────────────────────────────────
// GLSL — rounded image card with hover rim glow
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
    float d    = sdRRect(vUv, cornerR);
    float mask = 1.0 - smoothstep(-0.016, 0.016, d);
    if (mask < 0.005) discard;

    vec3 col = hasTexture > 0.5 ? texture2D(map, vUv).rgb : cardBg;

    // Subtle top sheen
    col += smoothstep(0.0, 0.2, vUv.y - 0.80) * 0.09;

    // Inner border glow
    col = mix(col, vec3(1.0), smoothstep(0.0, 0.04, -d) * 0.10);

    // Orange rim on hover
    col = mix(col, accentColor, smoothstep(-0.22, 0.0, d) * hover * 0.45);
    col *= 1.0 + hover * 0.07;

    gl_FragColor = vec4(col, mask);
  }
`;

// ── Helpers ───────────────────────────────────────────────────
function lerp(a, b, t) { return a + (b - a) * t; }
function damp(a, b, lam, dt) { return lerp(a, b, 1 - Math.exp(-lam * dt)); }

// ─────────────────────────────────────────────────────────────
export class LivingDome {
  constructor(container, { onSelect } = {}) {
    this.container  = container;
    this.onSelect   = onSelect;
    this.items      = [];
    this.meshes     = [];
    this.loader     = new THREE.TextureLoader();
    this.texCache   = new Map();
    this.texPending = new Set();

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
    this.hovered   = null;
    this.ndc       = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    this._raf      = null;
    this._last     = null;
    this.destroyed = false;

    this._init();
  }

  // ── Bootstrap ──────────────────────────────────────────────
  _init() {
    const { clientWidth: W, clientHeight: H } = this.container;

    this.scene  = new THREE.Scene();

    // Camera outside the sphere looking at origin
    this.camera = new THREE.PerspectiveCamera(FOV, W / H, 0.1, 300);
    this.camera.position.set(0, 0, -CAM_DIST);
    this.camera.lookAt(0, 0, 0);

    // Transparent renderer — zero background, blends with page
    this.renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    this.renderer.setClearColor(0x000000, 0);
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor      = 'grab';
    dom.style.display     = 'block';
    dom.setAttribute('aria-hidden', 'true');
    this.container.appendChild(dom);

    // The dome — one group that rotates on Y axis as a single piece
    this.dome = new THREE.Group();
    this.scene.add(this.dome);

    this._resObs = new ResizeObserver(() => this._onResize());
    this._resObs.observe(this.container);
    this._bindEvents();

    this._animate = this._animate.bind(this);
    this._raf = requestAnimationFrame(this._animate);
  }

  // ── Public API ─────────────────────────────────────────────
  setItems(items) {
    this._clear();
    if (!items.length) return;
    this.items = items;

    for (let col = 0; col < N_COLS; col++) {
      const theta = col * COL_ANGLE;  // longitude (around Y)

      for (let row = 0; row < N_ROWS; row++) {
        // Latitude: centre row at 0, expand up and down
        const phi = (row - (N_ROWS - 1) / 2) * ROW_PHI;

        // Spherical → Cartesian (front at -Z so camera at -CAM_DIST looks at it)
        const cosP = Math.cos(phi);
        const sinP = Math.sin(phi);
        const cosT = Math.cos(theta);
        const sinT = Math.sin(theta);

        const x =  SPHERE_R * cosP * sinT;
        const y =  SPHERE_R * sinP;
        const z = -SPHERE_R * cosP * cosT;  // front hemisphere at negative Z

        // Item for this cell (repeats when items.length < N_COLS * N_ROWS)
        const itemIdx = (col * N_ROWS + row) % items.length;
        const mesh    = this._makeCard(items[itemIdx]);

        mesh.position.set(x, y, z);

        // Face OUTWARD from sphere centre — this is what creates the dome look
        // lookAt() from mesh.position pointing toward (2x, 2y, 2z) = outward direction
        const outP = new THREE.Vector3(x * 2, y * 2, z * 2);
        mesh.lookAt(outP);

        this.dome.add(mesh);
        this.meshes.push(mesh);
      }
    }

    this._loadTextures();
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

  // ── Card factory ───────────────────────────────────────────
  _makeCard(item) {
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H);
    const isDark = document.documentElement.getAttribute('data-theme') !== 'light';
    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      side:           THREE.FrontSide,   // back-face culled automatically
      uniforms: {
        map:         { value: null },
        hasTexture:  { value: 0 },
        hover:       { value: 0 },
        accentColor: { value: new THREE.Color('#E67E22') },
        cardBg:      { value: new THREE.Color(isDark ? '#111C30' : '#D5DCE8') },
        cornerR:     { value: 0.30 },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.userData.item     = item;
    mesh.userData.hoverAmt = 0;
    mesh.userData.hoverTgt = 0;
    return mesh;
  }

  _clear() {
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

  // ── Textures ───────────────────────────────────────────────
  _loadTextures() {
    const seen = new Set();
    this.items.forEach(item => {
      if (!item.url || seen.has(item.url)) return;
      seen.add(item.url);
      if (this.texCache.has(item.url) || this.texPending.has(item.url)) return;
      this.texPending.add(item.url);

      this.loader.load(item.url, (tex) => {
        if (this.destroyed) return;
        tex.colorSpace  = THREE.SRGBColorSpace;
        tex.anisotropy  = Math.min(4, this.renderer.capabilities.getMaxAnisotropy());
        this.texCache.set(item.url, tex);
        this.meshes.forEach(m => {
          if (m.userData.item?.url === item.url) {
            m.material.uniforms.map.value        = tex;
            m.material.uniforms.hasTexture.value = 1;
          }
        });
      }, undefined, () => {});
    });
  }

  // ── Raycasting ─────────────────────────────────────────────
  _hitTest(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes, false);
    return hits.length ? hits[0].object : null;
  }

  // ── Animation loop ─────────────────────────────────────────
  _animate(now) {
    if (this.destroyed) return;
    this._raf = requestAnimationFrame(this._animate);

    const dt = Math.min((now - (this._last ?? now)) / 1000, 0.1);
    this._last = now;

    if (!this.dragging) {
      // Perpetual slow spin
      this.targetY -= AUTO_SPEED * (dt * 1000);
      // Inertia carry
      this.targetY += this.velY;
      this.velY    *= INERTIA;
    }

    // Smoothly follow target
    this.rotY      = damp(this.rotY, this.targetY, 9, dt);
    this.dome.rotation.y = this.rotY;   // THE whole dome rotates as one

    // Hover animation
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

  // ── Events ─────────────────────────────────────────────────
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
        this.targetY  += dx * ROT_SCALE;
        this.velSamples.push({ dx, t: performance.now() });
        if (this.velSamples.length > 6) this.velSamples.shift();
        return;
      }
      // Hover detection on non-drag movement
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
        this.velY = (b.dx / dt) * 16 * ROT_SCALE;
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
      this.targetY -= e.deltaY * 0.0006;
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
