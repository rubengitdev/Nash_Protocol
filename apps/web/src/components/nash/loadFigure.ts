import * as THREE from 'three';
import type { FigureMesh, FigureName, Quality } from './figures';

export interface LoadedFigure {
  geometry: THREE.BufferGeometry;
  ms: number;
}

function toGeometry(mesh: FigureMesh) {
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(mesh.positions, 3));
  geometry.setAttribute('normal', new THREE.BufferAttribute(mesh.normals, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(mesh.colors, 3));
  geometry.setIndex(new THREE.BufferAttribute(mesh.indices, 1));
  geometry.computeBoundingSphere();
  return geometry;
}

/**
 * Carves a figure in a Web Worker. Where workers are unavailable it falls back to the main thread, on a
 * timer so the first frame is not blocked.
 */
export function loadFigure(which: FigureName, quality: Quality): { promise: Promise<LoadedFigure>; cancel: () => void } {
  let worker: Worker | null = null;
  let cancelled = false;
  const promise = new Promise<LoadedFigure>((resolve, reject) => {
    const fallback = () => {
      window.setTimeout(async () => {
        if (cancelled) return;
        try {
          const { buildFigureMesh } = await import('./figures');
          const started = performance.now();
          const mesh = buildFigureMesh(which, quality);
          resolve({ geometry: toGeometry(mesh), ms: Math.round(performance.now() - started) });
        } catch (error) {
          reject(error);
        }
      }, 60);
    };
    try {
      worker = new Worker(new URL('./figures.worker.ts', import.meta.url));
    } catch {
      fallback();
      return;
    }
    worker.onmessage = (event: MessageEvent<{ mesh: FigureMesh; ms: number }>) => {
      if (cancelled) return;
      resolve({ geometry: toGeometry(event.data.mesh), ms: event.data.ms });
      worker?.terminate();
    };
    worker.onerror = () => {
      worker?.terminate();
      worker = null;
      fallback();
    };
    worker.postMessage({ id: 0, which, quality });
  });
  return {
    promise,
    cancel: () => {
      cancelled = true;
      worker?.terminate();
    },
  };
}
