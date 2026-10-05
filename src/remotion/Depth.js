import React from 'react';
import {Easing, Img, interpolate, staticFile} from 'remotion';
import {cameraAt} from './Camera.js';

// Depth for key plates (scripts/depth_layers.py): the plate is cut into planes, far to near, each with a depth d
// (0 = paper and sky, 1 = nearest). Every plane scales about the camera's view point, as in a real dolly:
//   (s / s_widest)^(strength * d)       nearer planes grow faster as the camera pushes in
//   * (1 + dolly * d * progress)        and drift closer on a hold
// Planes only ever grow (1 at the widest view), so no frame edge opens; what they hide is inpainted.
export function DepthPlanes({depth, camera, seconds, duration}) {
  const {x, y, s} = cameraAt(camera, seconds);
  const widest = Math.min(...camera.keys.map(k => k.s));
  const u = interpolate(seconds, [0, Math.max(duration, 0.1)], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)});
  return <>
    {depth.layers.map((L, i) => {
      const m = Math.pow(s / widest, (depth.strength ?? 0.22) * L.d) * (1 + (depth.dolly ?? 0.035) * L.d * u);
      const [x0, y0, x1, y1] = L.box;
      return (
        <div key={i} style={{position: 'absolute', inset: 0, transformOrigin: `${x * 100}% ${y * 100}%`, scale: String(m)}}>
          <Img src={staticFile(L.src)} style={{position: 'absolute', left: `${x0}%`, top: `${y0}%`, width: `${x1 - x0}%`, height: `${y1 - y0}%`}} />
        </div>
      );
    })}
  </>;
}
