/// <reference lib="webworker" />
// Carves the hero figure off the main thread and hands the buffers back without copying.
import { buildFigureMesh, type Quality } from './figures';

interface Request {
  id: number;
  quality: Quality;
}

self.onmessage = (event: MessageEvent<Request>) => {
  const { id, quality } = event.data;
  const started = performance.now();
  const mesh = buildFigureMesh(quality);
  (self as unknown as Worker).postMessage(
    { id, mesh, ms: Math.round(performance.now() - started) },
    [mesh.positions.buffer, mesh.normals.buffer, mesh.colors.buffer, mesh.indices.buffer],
  );
};
