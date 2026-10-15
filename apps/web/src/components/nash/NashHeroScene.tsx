'use client';

/**
 * Nash Protocol hero scene.
 *
 * A faceless hooded figure (the anonymous builder) stands inside a ring made of three parallel
 * silver ribbons — the three strands of the N mark — with a vertical halo behind the head.
 * Everything is procedural: no model or texture downloads, so the hero costs one JS chunk.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';

interface NashHeroSceneProps {
  onReady?: () => void;
  onFail?: () => void;
}

const EMERALD = 0x2ee6a6;
const FIGURE_Y = -0.55;
const ABYSS = 0x050a18;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const smooth = (e0: number, e1: number, x: number) => {
  const t = clamp01((x - e0) / (e1 - e0));
  return t * t * (3 - 2 * t);
};
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

// --- tiny value-noise toolkit (cloth folds, bump map) -------------------------------------------
function hash3(x: number, y: number, z: number) {
  const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453;
  return h - Math.floor(h);
}
function vnoise(x: number, y: number, z: number) {
  const xi = Math.floor(x), yi = Math.floor(y), zi = Math.floor(z);
  const xf = x - xi, yf = y - yi, zf = z - zi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf), w = zf * zf * (3 - 2 * zf);
  const c = (dx: number, dy: number, dz: number) => hash3(xi + dx, yi + dy, zi + dz);
  const x00 = lerp(c(0, 0, 0), c(1, 0, 0), u), x10 = lerp(c(0, 1, 0), c(1, 1, 0), u);
  const x01 = lerp(c(0, 0, 1), c(1, 0, 1), u), x11 = lerp(c(0, 1, 1), c(1, 1, 1), u);
  return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w);
}
function fbm(x: number, y: number, z: number, oct = 4) {
  let a = 0.5, f = 1, s = 0;
  for (let i = 0; i < oct; i++) {
    s += a * vnoise(x * f, y * f, z * f);
    f *= 2.03;
    a *= 0.5;
  }
  return s;
}

// Height map for the fabric: long, slightly diagonal folds with fine weave.
function makeClothBump(size = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const img = ctx.createImageData(size, size);
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const u = x / size, v = y / size;
      const fold = fbm(u * 3 + v * 1.2, v * 9, 1.7, 4);
      const ridge = 1 - Math.abs(fbm(u * 6, v * 14 + u * 3, 4.2, 3) * 2 - 1);
      const weave = vnoise(u * 180, v * 180, 0) * 0.12;
      const h = clamp01(fold * 0.62 + ridge * 0.3 + weave);
      const o = (y * size + x) * 4;
      const g = Math.round(h * 255);
      img.data[o] = img.data[o + 1] = img.data[o + 2] = g;
      img.data[o + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping;
  tex.anisotropy = 4;
  return tex;
}

function makeBackground(size = 1024) {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(size * 0.5, size * 0.44, size * 0.02, size * 0.5, size * 0.5, size * 0.74);
  g.addColorStop(0, '#12285c');
  g.addColorStop(0.35, '#0a1737');
  g.addColorStop(0.75, '#050a18');
  g.addColorStop(1, '#03060f');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function makeGlowSprite() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 128;
  const ctx = canvas.getContext('2d')!;
  const g = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  g.addColorStop(0, 'rgba(120,255,210,1)');
  g.addColorStop(0.25, 'rgba(46,230,166,0.55)');
  g.addColorStop(1, 'rgba(46,230,166,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 128, 128);
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

// --- figure --------------------------------------------------------------------------------------
// One continuous cloaked silhouette: broad shoulders flow into the hood dome with no neck gap.
// The face opening is carved into the dome afterwards, so it reads as fabric, not a mask.
const FACE_Y = 0.98;

function buildFigure(material: THREE.MeshPhysicalMaterial) {
  const profile = [
    [0.0, -3.4], [2.5, -3.4], [2.48, -2.6], [2.36, -1.7], [2.1, -1.06], [1.72, -0.62], [1.34, -0.28],
    [1.14, 0.06], [1.05, 0.48], [1.04, 0.98], [0.98, 1.42], [0.83, 1.86], [0.56, 2.2], [0.26, 2.42], [0.0, 2.5],
  ].map(([r, y]) => new THREE.Vector2(r, y));
  const pts = new THREE.SplineCurve(profile).getPoints(220);
  const geo = new THREE.LatheGeometry(pts, 192);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const colors = new Float32Array(pos.count * 3);
  const v = new THREE.Vector3();

  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const r = Math.hypot(v.x, v.z) || 1;
    const cosT = v.z / r; // +1 at the front, -1 at the back
    let x = v.x, y = v.y, z = v.z;

    // Chest is shallow front-to-back; the hood is nearly round.
    z *= THREE.MathUtils.lerp(0.5, 0.92, smooth(-0.35, 0.75, y));

    // Drape and creases across the whole garment.
    const fold = fbm(v.x * 1.1 + 3, v.y * 1.5, v.z * 1.1, 4) - 0.5;
    const crease = Math.sin(v.y * 6 + fbm(v.x * 2, v.y * 2, 0.5, 3) * 5) * 0.011;
    const k = 0.07 * fold + crease;
    x += (v.x / r) * k; z += (v.z / r) * k;

    // Hood peak sweeps back and up like a cowl.
    const hoodZone = smooth(0.35, 1.2, y);
    const back = smooth(-0.1, 0.95, -cosT);
    z -= back * hoodZone * 0.34;
    y += back * hoodZone * 0.14 * smooth(0.9, 2.2, y);

    // Brow overhang shades the face.
    const front = smooth(0.2, 0.85, cosT);
    const brow = Math.exp(-Math.pow((y - (FACE_Y + 0.55)) / 0.2, 2)) * front;
    z += brow * 0.1;

    // Carve the face opening and shade it into the dark.
    const fx = x / 0.46;
    const fy = (y - FACE_Y) / 0.6;
    const r2 = fx * fx + fy * fy;
    const cav = Math.exp(-r2 * 1.7) * front;
    const lip = Math.exp(-Math.pow((Math.sqrt(r2) - 1.12) / 0.2, 2)) * front;
    z -= cav * 0.62;
    z += lip * 0.13;
    x += fx * lip * 0.02;

    pos.setXYZ(i, x, y, z);

    const dark = 1 - smooth(0.05, 0.26, cav);
    const shade = 0.9 + 0.1 * (fbm(v.x * 3, v.y * 3, v.z * 3, 3) - 0.5);
    const c = Math.max(0.015, dark) * shade;
    colors[i * 3] = c; colors[i * 3 + 1] = c; colors[i * 3 + 2] = c;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  geo.computeVertexNormals();
  return new THREE.Mesh(geo, material);
}

// --- main ----------------------------------------------------------------------------------------
export default function NashHeroScene({ onReady, onFail }: NashHeroSceneProps) {
  const host = useRef<HTMLDivElement>(null);
  // Callbacks live in a ref so a parent re-render never tears the WebGL scene down.
  const callbacks = useRef({ onReady, onFail });
  callbacks.current = { onReady, onFail };

  useEffect(() => {
    const container = host.current;
    if (!container) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const coarse = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 768;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: !coarse, alpha: false, powerPreference: 'high-performance' });
    } catch {
      callbacks.current.onFail?.();
      return;
    }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, coarse ? 1.5 : 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const disposables: Array<{ dispose: () => void }> = [renderer];
    const track = <T extends { dispose: () => void }>(o: T): T => { disposables.push(o); return o; };

    const scene = new THREE.Scene();
    const bg = track(makeBackground());
    scene.background = bg;
    const world = new THREE.Group();
    scene.add(world);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
    const camTarget = new THREE.Vector3(0, 0.55, 0);

    // Environment reflections for the silver ribbons.
    const pmrem = track(new THREE.PMREMGenerator(renderer));
    const envScene = new RoomEnvironment();
    const envRT = pmrem.fromScene(envScene, 0.04);
    track(envRT);
    track(envRT.texture);
    const envMap = envRT.texture;

    // Lights: back-left emerald, back-right silver-blue, crown highlight, a whisper of front fill.
    scene.add(new THREE.AmbientLight(0x22356e, 0.18));
    const rimA = new THREE.DirectionalLight(EMERALD, 3.0); rimA.position.set(-5, 2.2, -3.6); scene.add(rimA);
    const rimB = new THREE.DirectionalLight(0x9db8ff, 3.0); rimB.position.set(5, 2, -3.2); scene.add(rimB);
    const crown = new THREE.DirectionalLight(0xffffff, 1.5); crown.position.set(0, 6, -3); scene.add(crown);
    const fill = new THREE.DirectionalLight(0x3a5cb0, 0.32); fill.position.set(-1.5, 1.4, 6); scene.add(fill);
    
    // ---- figure
    const figure = new THREE.Group();
    world.add(figure);

    const bump = track(makeClothBump(512));
    bump.repeat.set(2.5, 2.5);
    const hoodMat = track(new THREE.MeshPhysicalMaterial({
      color: 0x08112a,
      roughness: 0.84,
      metalness: 0.0,
      sheen: 0.55,
      sheenColor: new THREE.Color(0x6a86c4),
      sheenRoughness: 0.45,
      bumpMap: bump,
      bumpScale: 2.4,
      vertexColors: true,
      envMap,
      envMapIntensity: 0.06,
    }));

    const garment = buildFigure(hoodMat);
    figure.add(garment);
    // The face: a pure black void seated inside the opening.
    const voidMesh = new THREE.Mesh(
      track(new THREE.SphereGeometry(1, 48, 32)),
      track(new THREE.MeshBasicMaterial({ color: 0x000000 })),
    );
    voidMesh.scale.set(0.4, 0.56, 0.3);
    voidMesh.position.set(0, FACE_Y - 0.02, 0.3);
    figure.add(voidMesh);
        figure.scale.setScalar(1.22);
    figure.position.set(0, FIGURE_Y, 0);
    figure.rotation.z = 0.012;

    // ---- rings
    const rings = new THREE.Group();
    world.add(rings);

    const silver = track(new THREE.MeshPhysicalMaterial({
      color: 0xd5deee,
      metalness: 1,
      roughness: 0.24,
      envMap,
      envMapIntensity: 0.95,
      clearcoat: 0.5,
      clearcoatRoughness: 0.2,
      side: THREE.DoubleSide,
    }));
    const glowMat = track(new THREE.MeshBasicMaterial({ color: new THREE.Color(EMERALD).multiplyScalar(1.05), toneMapped: false }));

    // Vertical halo behind the head.
    const halo = new THREE.Group();
    halo.position.set(0, 0.9, -2.2);
    const haloTube = new THREE.Mesh(track(new THREE.TorusGeometry(3.5, 0.055, 32, 360)), silver);
    const haloGlow = new THREE.Mesh(track(new THREE.TorusGeometry(3.5, 0.012, 12, 360)), glowMat);
    haloGlow.position.z = 0.04;
    const haloOuter = new THREE.Mesh(track(new THREE.TorusGeometry(3.95, 0.007, 8, 360)), track(new THREE.MeshBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: 0.5 })));
    halo.add(haloTube, haloGlow, haloOuter);
    rings.add(halo);

    // Orbit: three parallel ribbon bands (the N's three strands) tilted around the figure.
    const orbit = new THREE.Group();
    orbit.position.set(0, 0.05, 0);
    const tilt = new THREE.Group();
    tilt.rotation.set(1.18, 0, 0.3);
    orbit.add(tilt);
    const bandGeo = track(new THREE.CylinderGeometry(4.3, 4.3, 0.17, 360, 1, true));
    const bandOffsets = [-0.36, 0, 0.36];
    const bands = bandOffsets.map((o, i) => {
      const m = new THREE.Mesh(bandGeo, silver);
      m.position.y = o;
      m.scale.setScalar(1 + (i === 1 ? 0.004 : 0));
      tilt.add(m);
      return m;
    });
    // Hairline emerald edge on the middle strand.
    const edgeGeo = track(new THREE.TorusGeometry(4.302, 0.009, 8, 360));
    const edge = new THREE.Mesh(edgeGeo, glowMat);
    edge.rotation.x = Math.PI / 2;
    edge.position.y = 0.09;
    tilt.add(edge);

    // Strategy nodes drifting along the middle strand.
    const glowTex = track(makeGlowSprite());
    const nodes: THREE.Group[] = [];
    for (let i = 0; i < 3; i++) {
      const n = new THREE.Group();
      const core = new THREE.Mesh(track(new THREE.SphereGeometry(0.04, 24, 16)), glowMat);
      const halo2 = new THREE.Sprite(track(new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.1 })));
      halo2.scale.setScalar(0.1);
      n.add(core, halo2);
      tilt.add(n);
      nodes.push(n);
    }
    rings.add(orbit);

    // ---- dust
    const dustCount = coarse ? 260 : 700;
    const dustGeo = track(new THREE.BufferGeometry());
    const dp = new Float32Array(dustCount * 3);
    const dc = new Float32Array(dustCount * 3);
    const tmp = new THREE.Color();
    for (let i = 0; i < dustCount; i++) {
      const r = 3.2 + Math.random() * 7.5;
      const th = Math.random() * Math.PI * 2;
      const ph = Math.acos(2 * Math.random() - 1);
      dp[i * 3] = r * Math.sin(ph) * Math.cos(th);
      dp[i * 3 + 1] = r * Math.cos(ph) * 0.7;
      dp[i * 3 + 2] = r * Math.sin(ph) * Math.sin(th) - 2;
      tmp.set(Math.random() < 0.28 ? EMERALD : 0xaebbd6).multiplyScalar(0.5 + Math.random() * 0.8);
      dc[i * 3] = tmp.r; dc[i * 3 + 1] = tmp.g; dc[i * 3 + 2] = tmp.b;
    }
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dp, 3));
    dustGeo.setAttribute('color', new THREE.BufferAttribute(dc, 3));
    const dust = new THREE.Points(dustGeo, track(new THREE.PointsMaterial({ size: 0.035, vertexColors: true, transparent: true, opacity: 0.75, depthWrite: false, sizeAttenuation: true })));
    world.add(dust);

    // ---- postprocessing
    const composer = new EffectComposer(renderer);
    composer.addPass(new RenderPass(scene, camera));
    let bloom: UnrealBloomPass | null = null;
    if (!coarse) {
      bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.2, 0.35, 1.05);
      composer.addPass(bloom);
    }
    composer.addPass(new OutputPass());

    // ---- sizing
    const resize = () => {
      const w = Math.max(1, container.clientWidth);
      const h = Math.max(1, container.clientHeight);
      renderer.setSize(w, h, false);
      composer.setSize(w, h);
      bloom?.setSize(w, h);
      camera.aspect = w / h;
      // Keep the whole ring in frame on tall/narrow viewports.
      const fitDist = 15.2 * Math.max(1, 1.3 / camera.aspect);
      const half = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * fitDist * camera.aspect;
      // Wide screens: the copy owns the left, the stage sits right of centre.
      world.position.x = camera.aspect > 1.25 ? half * 0.3 : 0;
      camera.position.set(0, 0.8, fitDist);
      camera.lookAt(camTarget);
      camera.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(resize);
    ro.observe(container);
    resize();

    // ---- interaction
    const pointer = { x: 0, y: 0, tx: 0, ty: 0 };
    const onMove = (e: PointerEvent) => {
      pointer.tx = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.ty = (e.clientY / window.innerHeight) * 2 - 1;
    };
    if (!reduced && !coarse) window.addEventListener('pointermove', onMove, { passive: true });

    let visible = true;
    const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; }, { threshold: 0 });
    io.observe(container);

    // ---- loop
    let last = performance.now();
    let raf = 0;
    let ready = false;
    let elapsed = 0;

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += reduced ? 0 : dt;
      const t = elapsed;

      const intro = reduced ? 1 : easeOutCubic(clamp01(t / 2.2));
      pointer.x = lerp(pointer.x, pointer.tx, 0.045);
      pointer.y = lerp(pointer.y, pointer.ty, 0.045);

      const scroll = clamp01(window.scrollY / Math.max(1, container.clientHeight));

      figure.rotation.y = -0.42 + pointer.x * 0.22 + Math.sin(t * 0.35) * 0.04;
      figure.position.y = FIGURE_Y + Math.sin(t * 0.8) * 0.03 - scroll * 0.5;
      figure.rotation.x = pointer.y * 0.035 + Math.sin(t * 0.6) * 0.008;

      rings.scale.setScalar(lerp(0.72, 1, intro));
      rings.rotation.y = pointer.x * 0.12 - scroll * 0.4;
      orbit.rotation.y = t * 0.16 + (1 - intro) * 1.4;
      tilt.rotation.x = 1.18 + Math.sin(t * 0.32) * 0.05 + pointer.y * 0.06;
      halo.rotation.z = t * 0.03;
      halo.rotation.y = pointer.x * 0.2;
      haloGlow.rotation.z = -t * 0.05;

      nodes.forEach((n, i) => {
        const a = t * 0.55 + (i * Math.PI * 2) / 3;
        n.position.set(Math.cos(a) * 4.302, 0, Math.sin(a) * 4.302);
      });
      dust.rotation.y = t * 0.012;

      camera.position.x = lerp(camera.position.x, pointer.x * 0.5, 0.04);
      camera.lookAt(camTarget);

      composer.render();
      if (!ready) { ready = true; callbacks.current.onReady?.(); }
    };
    frame();

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      io.disconnect();
      window.removeEventListener('pointermove', onMove);
      composer.dispose();
      envScene.dispose();
      scene.traverse((o) => {
        const m = o as THREE.Mesh;
        if (m.geometry) m.geometry.dispose?.();
      });
      disposables.forEach((d) => d.dispose());
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={host} className="nash-hero-canvas" />;
}
