/**
 * DomeGallery.js
 * Premium 3D dome gallery (Apple Vision Pro–style) built on Three.js.
 *
 * Images sit on the inside of a sphere ("domeGroup"). The camera stays
 * near the sphere's center; dragging/swiping rotates the dome around
 * the camera with inertia, and scroll/pinch adjusts the camera's field
 * of view to simulate zoom without ever pushing the camera through the
 * image surface. Rounded corners, the hover glow, and the glass sheen
 * are all done in a single small fragment shader per card rather than
 * with DOM overlays, so the effect stays GPU-accelerated at 60 FPS.
 */

import * as THREE from 'three';
import {
  fibonacciSphere, clamp, damp, TextureCache, FPSMonitor,
  prefersReducedMotion, applyVisuallyHidden,
} from './GalleryUtils.js';

const DOME_RADIUS = 14;
const CARD_ASPECT = 4 / 3;
const CARD_HEIGHT = 3.2;
const MIN_FOV = 35;
const MAX_FOV = 85;
const DEFAULT_FOV = 62;
const ROTATE_DAMPING = 0.9;
const ROTATE_STOP_THRESHOLD = 0.00005;
const MAX_PITCH = Math.PI / 2 - 0.15;
const CLICK_DRAG_THRESHOLD = 6; // px of movement before a pointerup is treated as a drag, not a click
const TEXTURE_CHECK_INTERVAL = 0.25; // seconds between visibility scans for lazy texture loads

const CARD_VERTEX_SHADER = `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

// Rounded-rect mask (SDF), a hover-driven accent border/glow, and a soft
// diagonal "glass" sheen — everything is derived in-shader so no extra
// geometry or DOM overlay is needed per card.
const CARD_FRAGMENT_SHADER = `
  uniform sampler2D map;
  uniform float hasTexture;
  uniform float hover;
  uniform float cornerRadius;
  uniform vec3 accentColor;
  uniform vec3 placeholderColor;
  varying vec2 vUv;

  float roundedBoxSDF(vec2 p, vec2 halfSize, float r) {
    vec2 q = abs(p) - halfSize + r;
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    vec2 centered = (vUv - 0.5) * 2.0;
    float dist = roundedBoxSDF(centered, vec2(1.0), cornerRadius);

    float alpha = 1.0 - smoothstep(-0.025, 0.0, dist);
    if (alpha <= 0.001) discard;

    vec3 color = hasTexture > 0.5 ? texture2D(map, vUv).rgb : placeholderColor;

    // Soft glass sheen: a diagonal highlight band near the top edge.
    float sheen = pow(clamp(1.0 - abs(vUv.y - 0.86) * 5.0, 0.0, 1.0), 2.0) * 0.18;
    color += sheen;

    // Hover: accent-tinted rim glow plus a gentle overall brighten.
    float rim = smoothstep(-0.18, 0.0, dist) * hover;
    color = mix(color, accentColor, rim * 0.4);
    color *= 1.0 + hover * 0.06;

    gl_FragColor = vec4(color, alpha);
  }
`;

export class DomeGallery {
  constructor(container, { onSelect, accentColor = '#5b8cff' } = {}) {
    this.container = container;
    this.onSelect = onSelect;
    this.accentColor = new THREE.Color(accentColor);

    this.items = [];
    this.meshes = [];
    this.meshByItemId = new Map();

    this.textureCache = new TextureCache({ maxConcurrent: 6 });
    this.fpsMonitor = new FPSMonitor({ degradeThreshold: 30, sustainedFrames: 90 });
    this.reducedMotion = prefersReducedMotion();

    this.rotation = { x: -0.15, y: 0 };
    this.rotationTarget = { x: -0.15, y: 0 };
    this.rotationVelocity = { x: 0, y: 0 };

    this.activePointers = new Map();
    this.isDragging = false;
    this.lastPointer = { x: 0, y: 0 };
    this.pointerVelocitySamples = [];
    this._dragDistance = 0;
    this.pinchStartDistance = null;
    this.pinchStartFov = DEFAULT_FOV;

    this.fov = DEFAULT_FOV;
    this.targetFov = DEFAULT_FOV;

    this.hoveredMesh = null;
    this._textureCheckAccum = 0;
    this._lastFrame = null;
    this._rafId = null;
    this.destroyed = false;
    this._onLowPerformance = null;

    this._init();
  }

  /** Fires once when sustained low FPS is detected; caller owns the mode switch. */
  onLowPerformance(callback) {
    this._onLowPerformance = callback;
  }

  _init() {
    const { clientWidth: width, clientHeight: height } = this.container;

    this.scene = new THREE.Scene();

    this.camera = new THREE.PerspectiveCamera(this.fov, Math.max(width, 1) / Math.max(height, 1), 0.1, 100);
    this.camera.position.set(0, 0, 0.01);

    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    this.renderer.setSize(width, height);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;

    const dom = this.renderer.domElement;
    dom.setAttribute('aria-hidden', 'true'); // real content is exposed via the accessible list below
    dom.style.touchAction = 'none';
    dom.style.cursor = 'grab';
    this.container.appendChild(dom);

    this.domeGroup = new THREE.Group();
    this.scene.add(this.domeGroup);

    this.raycaster = new THREE.Raycaster();
    this.pointerNDC = new THREE.Vector2();

    this._buildAccessibleList();
    this._bindEvents();

    this._resizeObserver = new ResizeObserver(() => this._handleResize());
    this._resizeObserver.observe(this.container);

    this._animate = this._animate.bind(this);
    this._rafId = requestAnimationFrame(this._animate);
  }

  /** Rebuild the dome from a fresh (already filtered/sorted) item list. */
  setItems(items) {
    this._clearMeshes();
    this.items = items;

    const positions = fibonacciSphere(items.length, DOME_RADIUS);
    items.forEach((item, i) => {
      const mesh = this._createCard(item, positions[i]);
      this.domeGroup.add(mesh);
      this.meshes.push(mesh);
      this.meshByItemId.set(item.id, mesh);
    });

    this._rebuildAccessibleList();
    this._loadVisibleTextures();
  }

  _createCard(item, position) {
    const height = CARD_HEIGHT;
    const width = height * CARD_ASPECT;
    const geometry = new THREE.PlaneGeometry(width, height, 1, 1);

    const material = new THREE.ShaderMaterial({
      vertexShader: CARD_VERTEX_SHADER,
      fragmentShader: CARD_FRAGMENT_SHADER,
      transparent: true,
      side: THREE.DoubleSide,
      uniforms: {
        map: { value: null },
        hasTexture: { value: 0 },
        hover: { value: 0 },
        cornerRadius: { value: 0.14 },
        accentColor: { value: this.accentColor },
        placeholderColor: { value: new THREE.Color('#8892a6') },
      },
    });

    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.copy(position);
    mesh.lookAt(0, 0, 0);
    mesh.rotateY(Math.PI); // face the textured side inward, toward the camera at the dome's center
    mesh.userData.item = item;
    mesh.userData.hoverAmount = 0;
    mesh.userData.hoverTarget = 0;

    return mesh;
  }

  _clearMeshes() {
    this.meshes.forEach((mesh) => {
      this.domeGroup.remove(mesh);
      mesh.geometry.dispose();
      mesh.material.dispose();
    });
    this.meshes = [];
    this.meshByItemId.clear();
    this.textureCache.disposeAll();
  }

  /**
   * Lazy-load textures for cards currently facing the camera. There is
   * no DOM to attach an IntersectionObserver to inside WebGL, so
   * "visible" is approximated with a facing-the-camera dot product —
   * cards on the far side of the dome stay untextured until the user
   * rotates toward them.
   */
  _loadVisibleTextures() {
    this.domeGroup.updateMatrixWorld(true);
    const forward = new THREE.Vector3();
    this.camera.getWorldDirection(forward);
    const cameraPosition = this.camera.getWorldPosition(new THREE.Vector3());

    this.meshes.forEach((mesh) => {
      if (mesh.material.uniforms.hasTexture.value === 1) return;

      const worldPosition = mesh.getWorldPosition(new THREE.Vector3());
      const toMesh = worldPosition.sub(cameraPosition).normalize();
      const facing = toMesh.dot(forward);
      if (facing <= 0.3) return;

      this.textureCache
        .get(mesh.userData.item.url, { priority: facing > 0.7 })
        .then((texture) => {
          if (this.destroyed) return;
          mesh.material.uniforms.map.value = texture;
          mesh.material.uniforms.hasTexture.value = 1;
        })
        .catch(() => {
          // A single broken image should never block the rest of the dome —
          // leave the placeholder color and move on.
        });
    });
  }

  _buildAccessibleList() {
    this.a11yList = document.createElement('ul');
    this.a11yList.className = 'dome-gallery__a11y-list';
    this.a11yList.setAttribute('aria-label', 'Engineering media items');
    applyVisuallyHidden(this.a11yList);
    this.container.appendChild(this.a11yList);
  }

  _rebuildAccessibleList() {
    this.a11yList.innerHTML = '';
    this.items.forEach((item, index) => {
      const li = document.createElement('li');
      const button = document.createElement('button');
      button.type = 'button';
      button.textContent = item.title;
      button.setAttribute('aria-label', `Open ${item.title}`);
      button.addEventListener('click', () => this.onSelect?.(item, index));
      button.addEventListener('focus', () => this._faceCard(index));
      li.appendChild(button);
      this.a11yList.appendChild(li);
    });
  }

  /** Rotate the dome so the given card faces the camera — used when a keyboard/SR user focuses it. */
  _faceCard(index) {
    const mesh = this.meshes[index];
    if (!mesh) return;
    const direction = mesh.position.clone().normalize();
    this.rotationTarget.y = Math.atan2(direction.x, direction.z) + Math.PI;
    this.rotationTarget.x = clamp(Math.asin(direction.y), -MAX_PITCH, MAX_PITCH);
  }

  _bindEvents() {
    const dom = this.renderer.domElement;

    this._onPointerDown = (e) => {
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dom.setPointerCapture?.(e.pointerId);

      if (this.activePointers.size === 1) {
        this.isDragging = true;
        this.lastPointer = { x: e.clientX, y: e.clientY };
        this._dragDistance = 0;
        this.pointerVelocitySamples = [];
        dom.style.cursor = 'grabbing';
      } else if (this.activePointers.size === 2) {
        this.isDragging = false;
        const [a, b] = Array.from(this.activePointers.values());
        this.pinchStartDistance = Math.hypot(a.x - b.x, a.y - b.y);
        this.pinchStartFov = this.targetFov;
      }
    };

    this._onPointerMove = (e) => {
      if (!this.activePointers.has(e.pointerId)) {
        this._updatePointerNDC(e);
        this._updateHover();
        return;
      }
      this.activePointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (this.activePointers.size === 2) {
        const [a, b] = Array.from(this.activePointers.values());
        const distance = Math.hypot(a.x - b.x, a.y - b.y);
        if (this.pinchStartDistance) {
          this.targetFov = clamp(this.pinchStartFov * (this.pinchStartDistance / distance), MIN_FOV, MAX_FOV);
        }
        return;
      }

      this._updatePointerNDC(e);
      this._updateHover();
      if (!this.isDragging) return;

      const dx = e.clientX - this.lastPointer.x;
      const dy = e.clientY - this.lastPointer.y;
      this.lastPointer = { x: e.clientX, y: e.clientY };
      this._dragDistance += Math.abs(dx) + Math.abs(dy);

      const rotSpeed = 0.0045;
      this.rotationTarget.y += dx * rotSpeed;
      this.rotationTarget.x = clamp(this.rotationTarget.x - dy * rotSpeed, -MAX_PITCH, MAX_PITCH);

      this.pointerVelocitySamples.push({ dx, dy, t: performance.now() });
      if (this.pointerVelocitySamples.length > 5) this.pointerVelocitySamples.shift();
    };

    this._onPointerUp = (e) => {
      this.activePointers.delete(e.pointerId);
      dom.releasePointerCapture?.(e.pointerId);
      if (this.activePointers.size < 2) this.pinchStartDistance = null;

      if (this.activePointers.size === 0) {
        if (this.isDragging && !this.reducedMotion && this.pointerVelocitySamples.length >= 2) {
          const first = this.pointerVelocitySamples[0];
          const last = this.pointerVelocitySamples[this.pointerVelocitySamples.length - 1];
          const dt = Math.max(last.t - first.t, 1);
          this.rotationVelocity.y = (last.dx / dt) * 16 * 0.0045;
          this.rotationVelocity.x = -(last.dy / dt) * 16 * 0.0045;
        }
        this.isDragging = false;
        dom.style.cursor = 'grab';
      }
    };

    this._onWheel = (e) => {
      e.preventDefault();
      this.targetFov = clamp(this.targetFov + e.deltaY * 0.03, MIN_FOV, MAX_FOV);
    };

    this._onClick = () => {
      if (this._dragDistance > CLICK_DRAG_THRESHOLD) {
        this._dragDistance = 0;
        return;
      }
      const mesh = this._raycastMesh();
      if (mesh) this.onSelect?.(mesh.userData.item, this.meshes.indexOf(mesh));
    };

    this._onTouchMove = (e) => e.preventDefault();

    dom.addEventListener('pointerdown', this._onPointerDown);
    window.addEventListener('pointermove', this._onPointerMove);
    window.addEventListener('pointerup', this._onPointerUp);
    window.addEventListener('pointercancel', this._onPointerUp);
    dom.addEventListener('wheel', this._onWheel, { passive: false });
    dom.addEventListener('click', this._onClick);
    dom.addEventListener('touchmove', this._onTouchMove, { passive: false });
  }

  _updatePointerNDC(e) {
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointerNDC.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    this.pointerNDC.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  _raycastMesh() {
    this.raycaster.setFromCamera(this.pointerNDC, this.camera);
    const hits = this.raycaster.intersectObjects(this.meshes);
    return hits.length ? hits[0].object : null;
  }

  _updateHover() {
    const mesh = this._raycastMesh();
    if (mesh === this.hoveredMesh) return;

    if (this.hoveredMesh) this.hoveredMesh.userData.hoverTarget = 0;
    this.hoveredMesh = mesh;
    if (mesh) mesh.userData.hoverTarget = 1;

    this.renderer.domElement.style.cursor = mesh ? 'pointer' : (this.isDragging ? 'grabbing' : 'grab');
  }

  _handleResize() {
    const { clientWidth: width, clientHeight: height } = this.container;
    if (!width || !height) return;
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(width, height);
  }

  /** Public wrapper so GalleryLoader can force a resize check after unhiding the container. */
  refreshSize() {
    this._handleResize();
  }

  /** Stop the render loop without disposing GPU resources — used when switching away from Dome view. */
  pause() {
    if (this._rafId !== null) cancelAnimationFrame(this._rafId);
    this._rafId = null;
  }

  /** Resume the render loop after pause(). */
  resume() {
    if (this.destroyed || this._rafId !== null) return;
    this._lastFrame = null;
    this._rafId = requestAnimationFrame(this._animate);
  }

  _animate(now) {
    if (this.destroyed) return;
    this._rafId = requestAnimationFrame(this._animate);

    const fps = this.fpsMonitor.tick(now);
    if (this._onLowPerformance && this.fpsMonitor.shouldDegrade()) {
      const callback = this._onLowPerformance;
      this._onLowPerformance = null; // fire once; the caller owns the mode switch
      callback(fps);
    }

    const dt = Math.min((now - (this._lastFrame ?? now)) / 1000, 0.1);
    this._lastFrame = now;

    if (!this.isDragging) {
      this.rotationTarget.x = clamp(this.rotationTarget.x + this.rotationVelocity.x, -MAX_PITCH, MAX_PITCH);
      this.rotationTarget.y += this.rotationVelocity.y;
      this.rotationVelocity.x *= ROTATE_DAMPING;
      this.rotationVelocity.y *= ROTATE_DAMPING;
      if (Math.abs(this.rotationVelocity.x) < ROTATE_STOP_THRESHOLD) this.rotationVelocity.x = 0;
      if (Math.abs(this.rotationVelocity.y) < ROTATE_STOP_THRESHOLD) this.rotationVelocity.y = 0;
    }

    const rotationLambda = this.reducedMotion ? 40 : 8;
    this.rotation.x = damp(this.rotation.x, this.rotationTarget.x, rotationLambda, dt);
    this.rotation.y = damp(this.rotation.y, this.rotationTarget.y, rotationLambda, dt);
    this.domeGroup.rotation.x = this.rotation.x;
    this.domeGroup.rotation.y = this.rotation.y;

    this.fov = damp(this.fov, this.targetFov, 10, dt);
    if (Math.abs(this.fov - this.camera.fov) > 0.01) {
      this.camera.fov = this.fov;
      this.camera.updateProjectionMatrix();
    }

    this.meshes.forEach((mesh) => {
      mesh.userData.hoverAmount = damp(mesh.userData.hoverAmount, mesh.userData.hoverTarget, 12, dt);
      mesh.material.uniforms.hover.value = mesh.userData.hoverAmount;
      mesh.scale.setScalar(1 + mesh.userData.hoverAmount * 0.08);
    });

    this._textureCheckAccum += dt;
    if (this._textureCheckAccum > TEXTURE_CHECK_INTERVAL) {
      this._textureCheckAccum = 0;
      this._loadVisibleTextures();
    }

    this.renderer.render(this.scene, this.camera);
  }

  /** Full teardown: stop the render loop, remove listeners, dispose every GPU resource. */
  destroy() {
    this.destroyed = true;
    this.pause();
    this._resizeObserver?.disconnect();

    const dom = this.renderer.domElement;
    dom.removeEventListener('pointerdown', this._onPointerDown);
    window.removeEventListener('pointermove', this._onPointerMove);
    window.removeEventListener('pointerup', this._onPointerUp);
    window.removeEventListener('pointercancel', this._onPointerUp);
    dom.removeEventListener('wheel', this._onWheel);
    dom.removeEventListener('click', this._onClick);
    dom.removeEventListener('touchmove', this._onTouchMove);

    this._clearMeshes();
    this.renderer.dispose();
    dom.parentElement?.removeChild(dom);
    this.a11yList?.parentElement?.removeChild(this.a11yList);
  }
}
