import React from "react";
import { Easing, interpolate } from "remotion";

// The house look for animated symbols and diagrams in the dark episodes: ivory on deep ink-black, vermilion as the one
// accent, Big Caslon for words; flat shapes, no glow, no gradients (symbol-animation-brief.md, config/plate-style.json).
// Everything is drawn in a 1920x1080 SVG frame and timed in seconds from the shot's start; `cues` are the moments the
// narration names things (scripts/studio-props.mjs resolves them from the word timings).

export const INK = "#14120f", IVORY = "#ece5d6", VERMILION = "#a7351e", DIM = "#6f675a";
export const SERIF = "'Big Caslon', 'Big Caslon Medium', Georgia, serif";
export const ITALIC = "Georgia, 'Times New Roman', serif";

const ease = Easing.bezier(0.45, 0, 0.2, 1);
const settle = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

// 0 → 1 between a and b (eased); rise: the quick settle used for words and marks appearing
export const ramp = (t, a, b, e = ease) => interpolate(t, [a, b], [0, 1], { ...clamp, easing: e });
export const rise = (t, a, dur = 0.7) => ramp(t, a, a + dur, settle);
export const lerp = (a, b, u) => a + (b - a) * u;
// a cue's time, or a fallback when the phrase was not found (the animation still plays, on its own clock)
export const cue = (cues, key, fallback) => (cues && cues[key] != null ? cues[key] : fallback);

// a stroke drawn in from 0 to 1 (any SVG shape)
export const draw = (p) => ({ pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p });

export const Frame = ({ children }) => (
  <svg viewBox="0 0 1920 1080" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}>{children}</svg>
);

// a word in the house face; appears at `at` with a small rise
export const Label = ({ x, y, text, at, t, size = 38, color = IVORY, anchor = "middle", spacing = 0.14, italic = false, opacity = 1, rule = false }) => {
  const o = at == null ? 0 : rise(t, at);
  if (o <= 0 || opacity <= 0) return null;
  const w = size * 1.5;
  return (
    <g opacity={o * opacity} transform={`translate(0 ${(1 - o) * 10})`}>
      <text x={x} y={y} textAnchor={anchor} fill={color} fontFamily={italic ? ITALIC : SERIF} fontStyle={italic ? "italic" : "normal"}
        fontSize={size} letterSpacing={italic ? 0 : size * spacing}>{text}</text>
      {rule && <rect x={anchor === "middle" ? x - w / 2 : anchor === "end" ? x - w : x} y={y + size * 0.45} width={w} height={Math.max(2, size * 0.06)} fill={VERMILION} />}
    </g>
  );
};

// a small standing figure (feet at x, y; height h), a flat silhouette
export const Figure = ({ x, y, h, fill = IVORY, opacity = 1 }) => {
  const p = (dx, dy) => `${x + dx * h},${y - dy * h}`;
  return (
    <g opacity={opacity}>
      <circle cx={x} cy={y - 0.9 * h} r={0.085 * h} fill={fill} />
      <polygon fill={fill} points={[p(-0.12, 0.79), p(0.12, 0.79), p(0.1, 0.42), p(0.065, 0), p(0.015, 0), p(0, 0.36), p(-0.015, 0), p(-0.065, 0), p(-0.1, 0.42)].join(" ")} />
    </g>
  );
};

// equilateral triangle about its centroid; up or down
export const triangle = (cx, cy, s, up) => {
  const h = (s * Math.sqrt(3)) / 2;
  return up ? [[cx, cy - (2 * h) / 3], [cx + s / 2, cy + h / 3], [cx - s / 2, cy + h / 3]]
            : [[cx, cy + (2 * h) / 3], [cx - s / 2, cy - h / 3], [cx + s / 2, cy - h / 3]];
};
export const pts = (a) => a.map((p) => p.join(",")).join(" ");

// The two triangles as two forces joined, never one solid star (Gorka, 1 Oct): at each crossing one line passes over
// the other, alternating, with a sliver of ink cut out of the line beneath.
export const Weave = ({ U, D, w = 7, gap = 9, colors = [IVORY, VERMILION], opacity = 1 }) => {
  const segs = [];
  const near = (q) => {   // the down triangle's edge through q
    let best = null;
    for (let i = 0; i < 3; i++) {
      const a = D[i], b = D[(i + 1) % 3], ab = [b[0] - a[0], b[1] - a[1]], L = Math.hypot(...ab);
      const dist = Math.abs(ab[0] * (q[1] - a[1]) - ab[1] * (q[0] - a[0])) / L;
      if (!best || dist < best.dist) best = { dist, u: [ab[0] / L, ab[1] / L] };
    }
    return best.u;
  };
  for (let i = 0; i < 3; i++) {
    const a = U[i], b = U[(i + 1) % 3], L = Math.hypot(b[0] - a[0], b[1] - a[1]), u = [(b[0] - a[0]) / L, (b[1] - a[1]) / L];
    const p1 = [a[0] + (b[0] - a[0]) / 3, a[1] + (b[1] - a[1]) / 3], p2 = [a[0] + ((b[0] - a[0]) * 2) / 3, a[1] + ((b[1] - a[1]) * 2) / 3];
    segs.push({ p: p1, u, color: colors[0] });        // the up line passes over here
    segs.push({ p: p2, u: near(p2), color: colors[1] });  // and under here
  }
  const r = w * 3.2;
  return (
    <g opacity={opacity}>
      {segs.map((s, i) => {
        const x1 = s.p[0] - s.u[0] * r, y1 = s.p[1] - s.u[1] * r, x2 = s.p[0] + s.u[0] * r, y2 = s.p[1] + s.u[1] * r;
        return <g key={i}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke={INK} strokeWidth={w + gap} />
          <line x1={x1 - s.u[0] * 2} y1={y1 - s.u[1] * 2} x2={x2 + s.u[0] * 2} y2={y2 + s.u[1] * 2} stroke={s.color} strokeWidth={w} /></g>;
      })}
    </g>
  );
};

// a point along a cubic Bézier (for things travelling a drawn path)
export const bez = (P, u) => {
  const m = 1 - u, a = m * m * m, b = 3 * m * m * u, c = 3 * m * u * u, d = u * u * u;
  return [a * P[0][0] + b * P[1][0] + c * P[2][0] + d * P[3][0], a * P[0][1] + b * P[1][1] + c * P[2][1] + d * P[3][1]];
};
export const bezD = (P) => `M ${P[0].join(" ")} C ${P[1].join(" ")}, ${P[2].join(" ")}, ${P[3].join(" ")}`;

// a fixed scatter (the same every frame and every render)
export const scatter = (n, seed = 1) => {
  let s = seed;
  const rnd = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  return Array.from({ length: n }, () => [rnd(), rnd(), rnd(), rnd()]);
};
