import React from 'react';
import {cameraAt} from './Camera.js';

// Camera motion blur. The camera is analytic, so a fast travel is blurred by drawing the view a few times at
// sub-frame instants inside the shutter and averaging the copies (copy i at opacity 1/(i+1) gives an equal mean).
// Holds and slow pushes draw once: blur only where the picture actually moves, like a real shutter.
const SHUTTER = 0.35;         // ~126 degrees: a subtle blur on crisp line art
const SPACING_PX = 1.5;       // samples close enough that copies read as a streak, never as ghosts
const MAX_SAMPLES = 10;

// How far the frame's edge moves in one frame, in output pixels (zoom and pan together).
export function edgeSpeed(camera, seconds, fps, width) {
  const a = cameraAt(camera, seconds - 1 / fps), b = cameraAt(camera, seconds);
  const zoom = Math.abs(Math.log(b.s / a.s)) * 0.5 * width;
  const pan = Math.hypot(b.x - a.x, (b.y - a.y) * 9 / 16) * width * b.s;
  return zoom + pan;
}

// render(seconds, copy) draws the whole view (image, layers, wash) with the camera at that instant.
export function CameraBlur({camera, seconds, fps, width, render}) {
  const speed = edgeSpeed(camera, seconds, fps, width);
  const streak = speed * SHUTTER;                                    // blur length at the frame edge, px
  const n = streak < 2 ? 1 : Math.min(MAX_SAMPLES, 1 + Math.ceil(streak / SPACING_PX));
  // Always the same tree (copy 0 is the sharp instant), so starting or ending a blur never remounts the picture.
  return <>
    {Array.from({length: n}, (_, i) => {
      const t = n === 1 ? seconds : seconds - (SHUTTER / fps) * (i / (n - 1));
      return <div key={i} style={{position: 'absolute', inset: 0, opacity: i === 0 ? 1 : 1 / (i + 1)}}>{render(t, i)}</div>;
    })}
  </>;
}
