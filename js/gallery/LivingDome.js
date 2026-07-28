/**
 * LivingDome.js
 * The core WebGL experience. A Three.js sphere (dome) of image cards
 * that rotates forever, responds to mouse drag with physics-based
 * inertia, and brings a clicked card smoothly forward while the rest
 * of the dome continues rotating in the background.
 *
 * Design targets:
 *  - Apple Vision Pro feel: glass tiles, orange rim glow, constant motion
 *  - Never freezes — the dome keeps rotating even when an image is open
 *  - Mouse drag temporarily overrides auto-rotation; release → smooth resume
 *  - Click → camera eases toward the card (no DOM overlay, pure WebGL)
 *  - Inherits light/dark mode from CSS custom properties via getComputedStyle
 */

import * as THREE from 'three';

// ─── Constants ────────────────────────────────────────────────────────────────
const DOME_RADIUS   = 15;
const CARD_H        = 3.0;
const CARD_W        = CARD_H * (4 / 3);
const AUTO_SPEED    = 0.00018; // radians per ms — slow, perpetual
const INERTIA       = 0.93;    // momentum damping after drag release
const ROT_SCALE     = 0.0035;  // drag px → rotation radians
const FOV_DEFAULT   = 65;
const FOV_MIN       = 40;
const FOV_MAX       = 80;
const CLICK_THRESH  = 5;       // px movement before classified as drag

// ─── Shaders ─────────────────────────────────────────────────────────────────
const VERT = `
  varying vec2 vUv;
  varying vec3 vNormal;
  void main() {
    vUv    = uv;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Each card has: image texture, hover rim glow (orange), glass sheen, rounded corners.
const FRAG = `
  precision highp float;
  uniform sampler2D map;
  uniform float     hasTexture;
  uniform float     hover;          // 0..1
  uniform float     selected;       // 0..1 — card is the open one
  uniform float     corner;
  uniform vec3      rimColor;
  uniform vec3      placeholder;
  varying vec2 vUv;

  float roundRect(vec2 p, vec2 half, float r) {
    vec2 q = abs(p) - half + r;
    return length(max(q,0.0)) + min(max(q.x,q.y),0.0) - r;
  }

  void main() {
    vec2  c    = (vUv - 0.5) * 2.0;
    float dist = roundRect(c, vec2(1.0), corner);
    float alpha = 1.0 - smoothstep(-0.02, 0.0, dist);
    if (alpha < 0.002) discard;

    // Base colour
    vec3 col = hasTexture > 0.5 ? texture2D(map, vUv).rgb : placeholder;

    // Glass sheen — diagonal highlight near top
    float sheen = pow(clamp(1.0 - abs(vUv.y - 0.88)*6.0, 0.0, 1.0), 2.0) * 0.22;
    col += sheen;

    // Thin white border
    float border = smoothstep(0.0, 0.03, -dist) * 0.15;
    col = mix(col, vec3(1.0), border);

    // Orange rim glow on hover
    float rimW   = max(hover, selected);
    float rim    = smoothstep(-0.22, 0.0, dist) * rimW;
    col = mix(col, rimColor, rim * 0.55);
    col *= 1.0 + rimW * 0.08;

    // When selected: brighten slightly more
    col *= 1.0 + selected * 0.12;

    gl_FragColor = vec4(col, alpha * (0.9 + hover * 0.1));
  }
`;

// ─── Utility ─────────────────────────────────────────────────────────────────
function fibSphere(n, r) {
  const pts = [];
  const phi = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y   = 1 - (i / Math.max(n - 1, 1)) * 2;
    const rad = Math.sqrt(Math.max(0, 1 - y * y));
    const th  = phi * i;
    pts.push(new THREE.Vector3(Math.cos(th) * rad * r, y * r, Math.sin(th) * rad * r));
  }
  return pts;
}

function lerp(a, b, t) { return a + (b - a) * t; }
function damp(a, b, lam, dt) { return lerp(a, b, 1 - Math.exp(-lam * dt)); }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

// ─── Main Class ───────────────────────────────────────────────────────────────
export class LivingDome {
  constructor(container, { onSelect } = {}) {
    this.container = container;
    this.onSelect  = onSelect;

    // Items + GPU
    this.items   = [];
    this.meshes  = [];
    this.byId    = new Map();
    this.texCache = new Map();
    this.texPending = new Map();
    this.loader  = new THREE.TextureLoader();

    // Rotation state
    this.rotY   = 0;
    this.rotX   = -0.12;
    this.velY   = 0;
    this.velX   = 0;
    this.targetY = 0;
    this.targetX = -0.12;
    this.autoT   = 0;   // cumulative auto-rotation (ms)

    // Pointer state
    this.ptrs      = new Map();
    this.dragging  = false;
    this.dragDist  = 0;
    this.lastPt    = {x:0, y:0};
    this.velSamples = [];
    this.pinchD0   = null;
    this.pinchFov0 = FOV_DEFAULT;

    // FOV / camera
    this.fov       = FOV_DEFAULT;
    this.targetFov = FOV_DEFAULT;

    // Selection
    this.selectedId = null;
    this.camOrigPos = new THREE.Vector3(0,0,0.01);
    this.camTargetPos = new THREE.Vector3(0,0,0.01);

    // Hover
    this.hovered = null;
    this.ndc     = new THREE.Vector2();
    this.raycaster = new THREE.Raycaster();

    // RAF
    this._raf = null;
    this._last = null;
    this.destroyed = false;

    this._init();
  }

  // ── Boot ──────────────────────────────────────────────────────
  _init() {
    const {clientWidth: W, clientHeight: H} = this.container;

    this.scene  = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(this.fov, Math.max(W,1)/Math.max(H,1), 0.1, 200);
    this.camera.position.copy(this.camOrigPos);

    this.renderer = new THREE.WebGLRenderer({antialias:true, alpha:true, powerPreference:'high-performance'});
    this.renderer.setSize(W, H);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio||1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const dom = this.renderer.domElement;
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';
    dom.setAttribute('aria-hidden', 'true');
    this.container.appendChild(dom);

    // Subtle ambient + point light for depth (barely visible but adds 3D feel)
    this.scene.add(new THREE.AmbientLight(0xffffff, 0.4));
    const pt = new THREE.PointLight(0xffa040, 0.8, 60);
    pt.position.set(0,10,5);
    this.scene.add(pt);

    this.dome = new THREE.Group();
    this.scene.add(this.dome);

    this._resObs = new ResizeObserver(() => this._onResize());
    this._resObs.observe(this.container);

    this._bindEvents();

    this._animate = this._animate.bind(this);
    this._raf = requestAnimationFrame(this._animate);
  }

  // ── Public API ────────────────────────────────────────────────
  setItems(items) {
    this._clearDome();
    this.items = items;
    const positions = fibSphere(items.length, DOME_RADIUS);
    items.forEach((item, i) => {
      const mesh = this._makeCard(item, positions[i]);
      this.dome.add(mesh);
      this.meshes.push(mesh);
      this.byId.set(item.id, mesh);
    });
    this._lazyLoad();
  }

  pause()  { if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; } }
  resume() { if (!this._raf && !this.destroyed) { this._last = null; this._raf = requestAnimationFrame(this._animate); } }
  refreshSize() { this._onResize(); }

  destroy() {
    this.destroyed = true;
    this.pause();
    this._resObs?.disconnect();
    const dom = this.renderer.domElement;
    dom.parentElement?.removeChild(dom);
    this._clearDome();
    this._unbindEvents();
    this.renderer.dispose();
  }

  // ── Card Factory ──────────────────────────────────────────────
  _makeCard(item, pos) {
    const geo = new THREE.PlaneGeometry(CARD_W, CARD_H, 1, 1);
    const mat = new THREE.ShaderMaterial({
      vertexShader:   VERT,
      fragmentShader: FRAG,
      transparent:    true,
      side:           THREE.DoubleSide,
      uniforms: {
        map:         { value: null },
        hasTexture:  { value: 0 },
        hover:       { value: 0 },
        selected:    { value: 0 },
        corner:      { value: 0.16 },
        rimColor:    { value: new THREE.Color(this._accentColor()) },
        placeholder: { value: new THREE.Color(this._placeholderColor()) },
      },
    });
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.copy(pos);
    mesh.lookAt(0, 0, 0);
    mesh.rotateY(Math.PI);
    mesh.userData.item      = item;
    mesh.userData.hoverAmt  = 0;
    mesh.userData.hoverTgt  = 0;
    mesh.userData.selAmt    = 0;
    mesh.userData.selTgt    = 0;
    return mesh;
  }

  _clearDome() {
    this.meshes.forEach(m => {
      this.dome.remove(m);
      m.geometry.dispose();
      m.material.dispose();
    });
    this.meshes = [];
    this.byId.clear();
    this.texCache.forEach(t => t.dispose());
    this.texCache.clear();
    this.texPending.clear();
    this.selectedId = null;
    this.hovered    = null;
  }

  // ── Texture Lazy-Load ─────────────────────────────────────────
  _lazyLoad() {
    this.dome.updateMatrixWorld(true);
    const fwd = new THREE.Vector3();
    this.camera.getWorldDirection(fwd);
    const camPos = this.camera.getWorldPosition(new THREE.Vector3());

    this.meshes.forEach(mesh => {
      if (mesh.material.uniforms.hasTexture.value === 1) return;
      const toMesh = mesh.getWorldPosition(new THREE.Vector3()).sub(camPos).normalize();
      if (toMesh.dot(fwd) <= 0.2) return;

      const url = mesh.userData.item.url;
      if (!url || this.texPending.has(url)) return;
      this.texPending.set(url, true);

      if (this.texCache.has(url)) {
        mesh.material.uniforms.map.value        = this.texCache.get(url);
        mesh.material.uniforms.hasTexture.value = 1;
        return;
      }
      this.loader.load(url, (tex) => {
        if (this.destroyed) return;
        tex.colorSpace = THREE.SRGBColorSpace;
        tex.anisotropy = 4;
        this.texCache.set(url, tex);
        mesh.material.uniforms.map.value        = tex;
        mesh.material.uniforms.hasTexture.value = 1;
      }, undefined, () => {});
    });
  }

  // ── Raycasting ────────────────────────────────────────────────
  _raycast() {
    this.raycaster.setFromCamera(this.ndc, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes);
    return hits.length ? hits[0].object : null;
  }

  _updateHover(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.ndc.x =  ((e.clientX - rect.left) / rect.width)  * 2 - 1;
    this.ndc.y = -((e.clientY - rect.top)  / rect.height) * 2 + 1;
    const hit = this._raycast();
    if (hit === this.hovered) return;
    if (this.hovered) this.hovered.userData.hoverTgt = 0;
    this.hovered = hit;
    if (hit) hit.userData.hoverTgt = 1;
    const dom = this.renderer.domElement;
    dom.style.cursor = hit ? 'pointer' : (this.dragging ? 'grabbing' : 'grab');
  }

  // ── Selection ─────────────────────────────────────────────────
  _openCard(mesh) {
    const item = mesh.userData.item;
    if (this.selectedId === item.id) return; // already open
    
    // Clear previous selection
    if (this.selectedId) {
      const prev = this.byId.get(this.selectedId);
      if (prev) prev.userData.selTgt = 0;
    }
    this.selectedId = item.id;
    mesh.userData.selTgt = 1;

    // Camera glide toward card
    const dir = mesh.position.clone().normalize();
    this.camTargetPos.copy(dir.multiplyScalar(DOME_RADIUS - 6));

    this.onSelect?.(item);
  }

  closeSelection() {
    if (!this.selectedId) return;
    const mesh = this.byId.get(this.selectedId);
    if (mesh) mesh.userData.selTgt = 0;
    this.selectedId = null;
    this.camTargetPos.copy(this.camOrigPos);
  }

  // ── Animation Loop ────────────────────────────────────────────
  _animate(now) {
    if (this.destroyed) return;
    this._raf = requestAnimationFrame(this._animate);

    const dt  = Math.min((now - (this._last ?? now)) / 1000, 0.1);
    this._last = now;

    // Auto-rotation: constant drift unless dragging
    if (!this.dragging) {
      this.targetY += AUTO_SPEED * (now - (this._autoLast ?? now));
      this._autoLast = now;

      // Apply inertia velocity
      this.targetY += this.velY;
      this.targetX  = clamp(this.targetX + this.velX, -Math.PI/2 + 0.1, Math.PI/2 - 0.1);
      this.velY *= INERTIA;
      this.velX *= INERTIA;
    } else {
      this._autoLast = now; // keep synced so no jump on release
    }

    // Smooth rotation
    const rotLambda = 6;
    this.rotY = damp(this.rotY, this.targetY, rotLambda, dt);
    this.rotX = damp(this.rotX, this.targetX, rotLambda, dt);
    this.dome.rotation.y = this.rotY;
    this.dome.rotation.x = this.rotX;

    // FOV
    this.fov = damp(this.fov, this.targetFov, 10, dt);
    if (Math.abs(this.fov - this.camera.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }

    // Camera position (selection glide)
    this.camera.position.lerp(this.camTargetPos, 0.06);

    // Per-card hover / selection animation
    this.meshes.forEach(m => {
      m.userData.hoverAmt = damp(m.userData.hoverAmt, m.userData.hoverTgt, 10, dt);
      m.userData.selAmt   = damp(m.userData.selAmt,   m.userData.selTgt,   8, dt);
      m.material.uniforms.hover.value    = m.userData.hoverAmt;
      m.material.uniforms.selected.value = m.userData.selAmt;

      // Hover: card lifts slightly toward camera
      const liftDir = m.position.clone().normalize().negate();
      const liftAmt = m.userData.hoverAmt * 0.4;
      m.position.addScaledVector(liftDir, liftAmt * dt * 10);  // additive damped nudge
      m.scale.setScalar(1 + m.userData.hoverAmt * 0.07 + m.userData.selAmt * 0.14);
    });

    // Lazy-load on every Nth frame
    this._lazyAcc = (this._lazyAcc || 0) + dt;
    if (this._lazyAcc > 0.3) { this._lazyAcc = 0; this._lazyLoad(); }

    this.renderer.render(this.scene, this.camera);
  }

  // ── Events ────────────────────────────────────────────────────
  _bindEvents() {
    const dom = this.renderer.domElement;

    this._onPD = (e) => {
      this.ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY});
      dom.setPointerCapture?.(e.pointerId);
      if (this.ptrs.size === 1) {
        this.dragging   = true;
        this.dragDist   = 0;
        this.lastPt     = {x: e.clientX, y: e.clientY};
        this.velSamples = [];
        this.velY = 0; this.velX = 0;
        dom.style.cursor = 'grabbing';
      } else if (this.ptrs.size === 2) {
        const [a,b] = [...this.ptrs.values()];
        this.pinchD0 = Math.hypot(a.x-b.x, a.y-b.y);
        this.pinchFov0 = this.targetFov;
      }
    };

    this._onPM = (e) => {
      if (!this.ptrs.has(e.pointerId)) { this._updateHover(e); return; }
      this.ptrs.set(e.pointerId, {x: e.clientX, y: e.clientY});
      if (this.ptrs.size === 2) {
        const [a,b] = [...this.ptrs.values()];
        const d = Math.hypot(a.x-b.x, a.y-b.y);
        if (this.pinchD0) this.targetFov = clamp(this.pinchFov0*(this.pinchD0/d), FOV_MIN, FOV_MAX);
        return;
      }
      if (!this.dragging) return;
      const dx = e.clientX - this.lastPt.x;
      const dy = e.clientY - this.lastPt.y;
      this.lastPt = {x: e.clientX, y: e.clientY};
      this.dragDist += Math.abs(dx) + Math.abs(dy);
      this.targetY += dx * ROT_SCALE;
      this.targetX  = clamp(this.targetX - dy * ROT_SCALE, -Math.PI/2+0.1, Math.PI/2-0.1);
      this.velSamples.push({dx, dy, t: now});
      if (this.velSamples.length > 5) this.velSamples.shift();
    };

    this._onPU = (e) => {
      this.ptrs.delete(e.pointerId);
      dom.releasePointerCapture?.(e.pointerId);
      if (this.ptrs.size < 2) this.pinchD0 = null;
      if (this.ptrs.size === 0) {
        if (this.dragging && this.velSamples.length >= 2) {
          const a = this.velSamples[0], b = this.velSamples[this.velSamples.length-1];
          const dt2 = Math.max(b.t - a.t, 1);
          this.velY =  (b.dx / dt2) * 14 * ROT_SCALE;
          this.velX = -(b.dy / dt2) * 14 * ROT_SCALE;
        }
        this.dragging = false;
        dom.style.cursor = 'grab';
      }
    };

    this._onClick = () => {
      if (this.dragDist > CLICK_THRESH) { this.dragDist = 0; return; }
      const hit = this._raycast();
      if (hit) this._openCard(hit);
      else this.closeSelection();
    };

    this._onWheel = (e) => {
      e.preventDefault();
      this.targetFov = clamp(this.targetFov + e.deltaY * 0.025, FOV_MIN, FOV_MAX);
    };

    this._onTM = (e) => e.preventDefault();

    dom.addEventListener('pointerdown',  this._onPD);
    window.addEventListener('pointermove',  this._onPM);
    window.addEventListener('pointerup',    this._onPU);
    window.addEventListener('pointercancel',this._onPU);
    dom.addEventListener('wheel',   this._onWheel, {passive:false});
    dom.addEventListener('click',   this._onClick);
    dom.addEventListener('touchmove', this._onTM, {passive:false});
  }

  _unbindEvents() {
    const dom = this.renderer.domElement;
    if (!dom) return;
    dom.removeEventListener('pointerdown',  this._onPD);
    window.removeEventListener('pointermove',  this._onPM);
    window.removeEventListener('pointerup',    this._onPU);
    window.removeEventListener('pointercancel',this._onPU);
    dom.removeEventListener('wheel',   this._onWheel);
    dom.removeEventListener('click',   this._onClick);
    dom.removeEventListener('touchmove', this._onTM);
  }

  _onResize() {
    const {clientWidth: W, clientHeight: H} = this.container;
    if (!W || !H) return;
    this.camera.aspect = W / H;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(W, H);
  }

  // ── Theme Helpers ─────────────────────────────────────────────
  _accentColor() {
    // Read the CSS variable so it matches whatever the current theme is
    const v = getComputedStyle(document.documentElement)
                .getPropertyValue('--gallery-glow').trim();
    return v || '#E67E22';
  }

  _placeholderColor() {
    const v = getComputedStyle(document.documentElement)
                .getPropertyValue('--gallery-placeholder').trim();
    return v || '#1a2640';
  }
}
