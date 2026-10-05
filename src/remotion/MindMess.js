import React from 'react';
import {interpolate, Easing} from 'remotion';

// The messy mind: part of the picture (mind.box, % of the image) wavers as if seen through restless thought, then
// settles. The noise drifts slowly and continuously. mind = {amount px, box, start, clearFrom, clearUntil} (shot s).
// Apply the style to the element that carries the image (inside the camera), so the box stays locked to the picture.
export function mindFilter(mind, seconds, id) {
  if (!mind) return {style: {}, defs: null};
  const ease = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.sin)};
  const k = Math.min(interpolate(seconds, [mind.start ?? 0, (mind.start ?? 0) + 1.5], [0, 1], ease),
                     interpolate(seconds, [mind.clearFrom, mind.clearUntil], [1, 0], ease));
  if (k <= 0.001) return {style: {}, defs: null};
  const drift = seconds * 14;
  const [x0, y0, x1, y1] = (mind.box || [0, 0, 100, 100]).map(v => v / 100);
  const defs = <svg width="0" height="0" style={{position: 'absolute'}}>
    <filter id={id} x="0" y="0" width="1" height="1" primitiveUnits="objectBoundingBox">
      <feTurbulence type="fractalNoise" baseFrequency="0.010 0.014" numOctaves="2" seed="11" result="n" />
      <feOffset in="n" dx={drift / 1920} dy={drift * 0.4 / 1080} result="m" />
      <feDisplacementMap in="SourceGraphic" in2="m" scale={(mind.amount ?? 12) * k / 1920} result="d" />
      <feOffset in="d" dx="0" dy="0" x={x0} y={y0} width={x1 - x0} height={y1 - y0} result="part" />
      <feMerge><feMergeNode in="SourceGraphic" /><feMergeNode in="part" /></feMerge>
    </filter>
  </svg>;
  return {style: {filter: `url(#${id})`}, defs};
}
