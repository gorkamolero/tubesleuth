import React from 'react';
import {AbsoluteFill, Img, staticFile} from 'remotion';

// The living print (layers from scripts/print_layers.py). Everything is a pure function of time, so frames render
// identically in the Studio and in any renderer, out of order.

// Deterministic "noise": incommensurate sines, smooth and never periodic within a shot.
const wobble = t => 0.5 * Math.sin(t * 11.3) + 0.3 * Math.sin(t * 7.1 + 1.3) + 0.2 * Math.sin(t * 17.9 + 2.1);

// The plate's accent colour on its own layer: breathes (suns, discs, eggs), flickers (flames), or glows.
// It also drifts a hair off register, like a second printing plate.
export function AccentLayer({src, motion, box, seconds, bloom: withBloom = true}) {
  const [x0, y0, x1, y1] = box, cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let scale = 1, bright = 1, origin = `${cx}% ${cy}%`, bloom = 0;
  if (motion === 'breathe') {
    // no scaling: a layer holds every red shape of the plate, and scaling around one of them slid the others off their
    // print (29 Sep: the boxer's glove floated beside itself). It breathes in light only.
    const b = Math.sin((seconds * 2 * Math.PI) / 6); bright = 1 + 0.06 * b; bloom = 0.5 + 0.5 * b;
  } else if (motion === 'pulse') {                          // a slow heartbeat: two beats, then rest (blood, veins)
    const ph = (seconds % 1.4) / 1.4, beat = Math.exp(-((ph - 0.08) ** 2) / 0.002) + 0.6 * Math.exp(-((ph - 0.3) ** 2) / 0.002);
    bright = 1 + 0.12 * beat; bloom = 0.3 + 0.6 * beat;
  } else if (motion === 'flicker') {
    const n = wobble(seconds); scale = 1 + 0.03 * n; bright = 1 + 0.16 * n; origin = `${cx}% ${y1}%`; bloom = 0.55 + 0.45 * n;
  } else {
    const b = Math.sin((seconds * 2 * Math.PI) / 5); bright = 1 + 0.06 * b; bloom = 0.35 + 0.25 * b;
  }
  const layer = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transformOrigin: origin,
    translate: `${Math.sin(seconds * 0.37) * 1.2}px ${Math.cos(seconds * 0.29) * 0.9}px`, scale: String(scale)};
  return <>
    {withBloom && <Img src={staticFile(src)} style={{...layer, filter: 'blur(10px)', opacity: 0.32 * bloom, mixBlendMode: 'screen'}} />}
    <Img src={staticFile(src)} style={{...layer, filter: `brightness(${bright})`}} />
  </>;
}

// Paper grain that "boils" at 12 fps, and a vignette that breathes very slowly. Screen space, above every shot.
export function PrintSurface({grainFiles, seconds}) {
  const i = grainFiles?.length ? Math.floor(seconds * 12) % grainFiles.length : -1;
  return <>
    {i >= 0 && <Img src={staticFile(grainFiles[i])} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.55, pointerEvents: 'none'}} />}
    <AbsoluteFill style={{pointerEvents: 'none', background: `radial-gradient(ellipse at 50% 48%, transparent 58%, rgba(28,20,12,${0.2 + 0.04 * Math.sin((seconds * 2 * Math.PI) / 9)}) 100%)`}} />
  </>;
}

// Ink-bleed mask for section transitions: the incoming shot soaks in like ink into paper.
export function inkMask(inkFiles, progress) {
  if (!inkFiles?.length || progress >= 1) return {};
  const f = staticFile(inkFiles[Math.max(0, Math.min(inkFiles.length - 1, Math.floor(progress * inkFiles.length)))]);
  return {maskImage: `url(${f})`, WebkitMaskImage: `url(${f})`, maskSize: '100% 100%', WebkitMaskSize: '100% 100%'};
}

// Focus wash: when the narration names something, everything else fades toward the paper, like an overprint.
// box is in % of the image; the wash lives inside the camera view, so it stays locked to the image.
export function FocusWash({box, seconds, from = 0, until = Infinity, amount = 0.5, id}) {
  const on = Math.max(0, Math.min(1, (seconds - from) / 0.6, (until - seconds) / 0.5));
  if (!box || on <= 0) return null;
  const [x0, y0, x1, y1] = box, pad = 2.5;
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
    <defs>
      {/* Filter region in canvas units (a region sized to a narrow box clipped the feather into a hard edge), and a
          feather equal in pixels both ways (the 100x100 canvas is stretched to 16:9). */}
      <filter id={`soft-${id}`} filterUnits="userSpaceOnUse" x="-20" y="-20" width="140" height="140"><feGaussianBlur stdDeviation="3.2 5.7" /></filter>
      <mask id={`wash-${id}`} maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
        <rect x="0" y="0" width="100" height="100" fill="white" />
        <rect x={x0 - pad} y={y0 - pad} width={x1 - x0 + 2 * pad} height={y1 - y0 + 2 * pad} fill="black" filter={`url(#soft-${id})`} />
      </mask>
    </defs>
    <rect x="0" y="0" width="100" height="100" fill="#eee6d5" opacity={amount * on} mask={`url(#wash-${id})`} />
  </svg>;
}

// Light from one region (plan "light", scripts/direct_camera.py): the sun radiates. It swells from `from`, peaks at
// `peak` and settles by `until`, drawn in the camera's space so it stays on the sun as the camera moves. Light is drawn
// the way the prints draw it (a flat wash on ivory only muddied the ink, 29 Sep): a vermilion halo ringing the disc
// (the disc itself stays clear and strong), long fine rays turning slowly across the sky, and a faint lift of the ink
// around the horizon, as if it melts into the light.
export function Bloom({light, seconds, id}) {
  const {box, from, peak, until, amount = 0.6, horizon = 100} = light;   // horizon: % down the plate; the land hides the light
  const k = seconds < peak ? Math.max(0, (seconds - from) / Math.max(0.1, peak - from))
    : Math.max(0, 1 - (seconds - peak) / Math.max(0.1, until - peak));
  if (k <= 0) return null;
  const e = k * k * (3 - 2 * k), cx = (box[0] + box[2]) / 2, cy = (box[1] + box[3]) / 2;
  const R = (box[2] - box[0]) / 2 * 0.62;                        // the disc's radius (in width units)
  const ax = 0.5625;                                              // 100x100 canvas on 16:9: x units are 16/9 wider
  const rays = Array.from({length: 28}, (_, i) => {
    const a = (i / 28) * Math.PI * 2 + seconds * 0.035, long = i % 2 ? 1 : 0.62, w = 0.9 + 0.5 * (i % 3);
    const r0 = R * 1.35, r1 = R * (1.6 + 5.5 * e * long) * (1 + 0.04 * Math.sin(seconds * 0.9 + i));
    const p = (r, da) => `${cx + Math.cos(a + da) * r * 1}${','}${cy + Math.sin(a + da) * r / ax}`;
    return <polygon key={i} points={`${p(r0, -w * 0.012)} ${p(r1, 0)} ${p(r0, w * 0.012)}`} fill="#b8341d" opacity={0.55 * e * amount} />;
  });
  return <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none'}}>
    <defs>
      <radialGradient id={`halo-${id}`}>
        <stop offset="0" stopColor="#c43a20" stopOpacity="0" />
        <stop offset="0.34" stopColor="#c43a20" stopOpacity="0" />
        <stop offset="0.42" stopColor="#c8452a" stopOpacity="0.55" />
        <stop offset="0.7" stopColor="#dd7a52" stopOpacity="0.18" />
        <stop offset="1" stopColor="#e8a07c" stopOpacity="0" />
      </radialGradient>
      <clipPath id={`sky-${id}`}><rect x="0" y="0" width="100" height={horizon} /></clipPath>
      <radialGradient id={`lift-${id}`}>
        <stop offset="0" stopColor="#fbf3e4" stopOpacity="0.9" />
        <stop offset="1" stopColor="#fbf3e4" stopOpacity="0" />
      </radialGradient>
    </defs>
    <ellipse cx={cx} cy={cy + 8} rx={34 * (0.6 + 0.4 * e)} ry={14 * (0.6 + 0.4 * e) / ax * ax * 1.4} fill={`url(#lift-${id})`} opacity={0.45 * e * amount} style={{mixBlendMode: 'screen'}} />
    <g clipPath={`url(#sky-${id})`}>
      {rays}
      <ellipse cx={cx} cy={cy} rx={R * (2.4 + 1.6 * e)} ry={R * (2.4 + 1.6 * e) / ax} fill={`url(#halo-${id})`} opacity={Math.min(1, 1.3 * e * amount)} />
    </g>
  </svg>;
}
