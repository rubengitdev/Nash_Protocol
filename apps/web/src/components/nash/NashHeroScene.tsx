'use client';

/**
 * Nash Protocol hero scene.
 *
 * Two characters inside a ring of three silver ribbons (the three strands of the N mark):
 *  - behind and above: a marble bust of John Nash, a stylised statue that fades into the dark;
 *  - in front: the faceless hooded figure of Satoshi Nakamoto.
 * Both are carved procedurally in a Web Worker (see figures.ts), so the hero ships no model or texture files.
 */

import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { loadFigure } from './loadFigure';

interface NashHeroSceneProps {
  onReady?: () => void;
  onFail?: () => void;
}

const EMERALD = 0x2ee6a6;

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

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
    renderer.toneMappingExposure = 1.0;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.domElement.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;display:block;';
    renderer.domElement.setAttribute('aria-hidden', 'true');
    container.appendChild(renderer.domElement);

    const disposables: Array<{ dispose: () => void }> = [renderer];
    const track = <T extends { dispose: () => void }>(o: T): T => { disposables.push(o); return o; };

    const scene = new THREE.Scene();
    scene.background = track(makeBackground());
    const world = new THREE.Group();
    scene.add(world);

    const camera = new THREE.PerspectiveCamera(30, 1, 0.1, 80);
    const camTarget = new THREE.Vector3(0, 0.4, 0);

    // Environment reflections: the silver ribbons, and the studio light that makes the marble read.
    const pmrem = track(new THREE.PMREMGenerator(renderer));
    const envScene = new RoomEnvironment();
    const envRT = pmrem.fromScene(envScene, 0.04);
    track(envRT);
    track(envRT.texture);
    const envMap = envRT.texture;

    // Lights: back-left emerald, back-right silver-blue, a crown highlight, a soft key for the marble face.
    scene.add(new THREE.AmbientLight(0x22356e, 0.2));
    const rimA = new THREE.DirectionalLight(EMERALD, 3.0); rimA.position.set(-5, 2.2, -3.6); scene.add(rimA);
    const rimB = new THREE.DirectionalLight(0x9db8ff, 3.0); rimB.position.set(5, 2, -3.2); scene.add(rimB);
    const crown = new THREE.DirectionalLight(0xffffff, 1.4); crown.position.set(0, 6, -3); scene.add(crown);
    const key = new THREE.DirectionalLight(0xcfdcff, 0.75); key.position.set(2.6, 3.4, 6); scene.add(key);

    // ---- the two characters
    const stage = new THREE.Group();
    world.add(stage);

    const marble = track(new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.55,
      metalness: 0,
      envMap,
      envMapIntensity: 0.6,
      clearcoat: 0.12,
      clearcoatRoughness: 0.45,
      transparent: true,
      opacity: 0,
    }));
    const cloth = track(new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      roughness: 0.84,
      metalness: 0,
      sheen: 0.6,
      sheenColor: new THREE.Color(0x6a86c4),
      sheenRoughness: 0.45,
      envMap,
      envMapIntensity: 0.06,
      transparent: true,
      opacity: 0,
    }));

    // Nash looms behind and above; Satoshi stands in front, a little smaller, facing the headline.
    const nashPivot = new THREE.Group();
    nashPivot.position.set(0, 2.0, -1.9);
    nashPivot.scale.setScalar(1.95);
    stage.add(nashPivot);
    const satoshiPivot = new THREE.Group();
    satoshiPivot.position.set(0.15, -1.15, 0);
    satoshiPivot.scale.setScalar(1.3);
    stage.add(satoshiPivot);

    const reveal = { nash: -1, satoshi: -1 }; // start time of each fade-in, once its mesh exists
    let elapsed = 0;
    const quality = coarse ? 'low' : 'high';
    const jobs = [
      { which: 'satoshi' as const, pivot: satoshiPivot, material: cloth },
      { which: 'nash' as const, pivot: nashPivot, material: marble },
    ].map(({ which, pivot, material }) => {
      const job = loadFigure(which, quality);
      job.promise
        .then(({ geometry }) => {
          track(geometry);
          pivot.add(new THREE.Mesh(geometry, material));
          reveal[which] = elapsed;
        })
        .catch(() => { /* the ring and the dust still render without the figures */ });
      return job;
    });

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

    // Vertical halo behind both figures.
    const halo = new THREE.Group();
    halo.position.set(0, 0.9, -3.0);
    const haloTube = new THREE.Mesh(track(new THREE.TorusGeometry(3.5, 0.055, 32, 360)), silver);
    const haloGlow = new THREE.Mesh(track(new THREE.TorusGeometry(3.5, 0.012, 12, 360)), glowMat);
    haloGlow.position.z = 0.04;
    const haloOuter = new THREE.Mesh(track(new THREE.TorusGeometry(3.95, 0.007, 8, 360)), track(new THREE.MeshBasicMaterial({ color: 0x8aa0c8, transparent: true, opacity: 0.5 })));
    halo.add(haloTube, haloGlow, haloOuter);
    rings.add(halo);

    // Orbit: three parallel ribbon bands (the N's three strands) tilted around the pair.
    const orbit = new THREE.Group();
    orbit.position.set(0, 0.05, 0);
    const tilt = new THREE.Group();
    tilt.rotation.set(1.18, 0, 0.3);
    orbit.add(tilt);
    const bandGeo = track(new THREE.CylinderGeometry(4.3, 4.3, 0.17, 360, 1, true));
    for (const offset of [-0.36, 0, 0.36]) {
      const band = new THREE.Mesh(bandGeo, silver);
      band.position.y = offset;
      tilt.add(band);
    }
    const edge = new THREE.Mesh(track(new THREE.TorusGeometry(4.302, 0.009, 8, 360)), glowMat);
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
      const fitDist = 15.6 * Math.max(1, 1.3 / camera.aspect);
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
    const fade = (material: THREE.Material & { opacity: number; transparent: boolean }, start: number) => {
      if (start < 0) return 0;
      const t = reduced ? 1 : easeOutCubic(clamp01((elapsed - start) / 1.6));
      material.opacity = t;
      if (t >= 1 && material.transparent) {
        material.transparent = false; // fully opaque again: no sorting cost
        material.needsUpdate = true;
      }
      return t;
    };

    const frame = () => {
      raf = requestAnimationFrame(frame);
      if (!visible || document.hidden) return;
      const now = performance.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      elapsed += dt; // the clock runs even under reduced motion: it only paces the fades
      const t = reduced ? 0 : elapsed;

      const intro = reduced ? 1 : easeOutCubic(clamp01(elapsed / 2.2));
      pointer.x = lerp(pointer.x, pointer.tx, 0.045);
      pointer.y = lerp(pointer.y, pointer.ty, 0.045);
      const scroll = clamp01(window.scrollY / Math.max(1, container.clientHeight));

      // Depth parallax: the statue moves least, the hooded figure most.
      const nashIn = fade(marble, reveal.nash);
      const satIn = fade(cloth, reveal.satoshi);
      nashPivot.rotation.y = -0.16 + pointer.x * 0.12 + Math.sin(t * 0.3) * 0.03;
      nashPivot.rotation.x = 0.1 + pointer.y * 0.03 + Math.sin(t * 0.5) * 0.008;
      nashPivot.position.x = pointer.x * 0.12;
      nashPivot.position.y = 2.0 + Math.sin(t * 0.6) * 0.03 - (1 - nashIn) * 0.25;
      satoshiPivot.rotation.y = -0.42 + pointer.x * 0.22 + Math.sin(t * 0.35) * 0.04;
      satoshiPivot.rotation.x = pointer.y * 0.035 + Math.sin(t * 0.6) * 0.008;
      satoshiPivot.position.x = 0.15 - pointer.x * 0.1;
      satoshiPivot.position.y = -1.15 + Math.sin(t * 0.8) * 0.03 - (1 - satIn) * 0.3;
      stage.position.y = -scroll * 0.5;

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
      jobs.forEach((job) => job.cancel());
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
