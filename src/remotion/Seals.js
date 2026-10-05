import React, { useEffect, useState } from "react";
import { AbsoluteFill, Easing, interpolate, staticFile, useCurrentFrame, useVideoConfig, delayRender, continueRender } from "remotion";

// The two pentagram seals of the Left-Hand Path episode, copied from their source: Stanislas de Guaïta, La Clef de la
// Magie Noire (1897), the plate the reference video uses (public domain). scripts/trace_seals.py fits the circles,
// computes the star and traces the art; here the circles and the star draw themselves in as strokes, in the order a
// hand would draw them, and the art (the goat, the figure, the names) inks in after them from the centre.
// Palette (symbol-animation-brief.md): ivory line-work on deep ink-black, vermilion only as the labels' rule; flat
// printmaking, no glow, no gradients.

const IVORY = "#ece5d6", INK = "#14120f", VERMILION = "#a7351e";
const ease = Easing.bezier(0.45, 0, 0.2, 1);
const ramp = (f, a, b) => interpolate(f, [a, b], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: ease });

// one seal; `t0` is the frame its drawing starts, `speed` stretches the whole drawing
export const Seal = ({ data, t0 = 0, speed = 1, color = IVORY, id, frame: at }) => {
  const current = useCurrentFrame();
  const frame = at ?? current;          // a seal held under an archival modal is drawn at its frozen frame
  const { fps } = useVideoConfig();
  const f = (frame - t0) / speed, s = fps / 30;               // timings below are at 30 fps
  const { outer, inner, star, order, art, size } = data;
  const line = data.line * 1.9;                                // the engraving's own line weight
  const circ = (c, a, b) => {
    const L = 2 * Math.PI * c.r, p = ramp(f, a * s, b * s);
    // drawn clockwise from the top, as a pen would
    return <circle cx={c.cx} cy={c.cy} r={c.r} fill="none" stroke={color} strokeWidth={line}
      strokeDasharray={L} strokeDashoffset={L * (1 - p)} transform={`rotate(-90 ${c.cx} ${c.cy})`} />;
  };
  const lines = [];
  for (let i = 0; i < 5; i++) {
    const [x1, y1] = star[order[i]], [x2, y2] = star[order[i + 1]];
    const L = Math.hypot(x2 - x1, y2 - y1), p = ramp(f, (40 + i * 9) * s, (52 + i * 9) * s);
    lines.push(<line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke={color} strokeWidth={line} strokeLinecap="round"
      strokeDasharray={L} strokeDashoffset={L * (1 - p)} />);
  }
  // the art inks in from the centre outward, through a ragged edge (a printed reveal, not a fade)
  const reveal = ramp(f, 86 * s, 132 * s);
  const R = outer.r * 1.08 * reveal;
  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: "100%", height: "100%", overflow: "visible" }}>
      <defs>
        <filter id={`rag-${id}`}><feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
          <feDisplacementMap in="SourceGraphic" scale="38" /></filter>
        <mask id={`m-${id}`}><circle cx={outer.cx} cy={outer.cy} r={Math.max(0.001, R)} fill="#fff" filter={`url(#rag-${id})`} /></mask>
      </defs>
      {circ(outer, 0, 34)}
      {circ(inner, 16, 46)}
      {lines}
      <g mask={`url(#m-${id})`} opacity={ramp(f, 86 * s, 96 * s)}>
        <g transform={art.transform}>{art.paths.map((d, i) => <path key={i} d={d} fill={color} />)}</g>
      </g>
    </svg>
  );
};

// the pair, as the script's first symbol beat shows them: the inverted seal on the left, the upright on the right,
// each named underneath once it is drawn
export const SealsPair = ({ src = "seals.json", labels = ["The Left-Hand Path", "The Right-Hand Path"], gap = 10 }) => {
  const [data, setData] = useState(null);
  const [handle] = useState(() => delayRender("seals"));
  useEffect(() => { fetch(staticFile(src)).then(r => r.json()).then(d => { setData(d); continueRender(handle); }); }, [src, handle]);
  const frame = useCurrentFrame();
  const { width } = useVideoConfig();
  if (!data) return null;
  const S = data.seals, k = width / 1920;
  const label = (text, t0) => {
    const o = ramp(frame, t0, t0 + 18), size = 46 * k;
    return <div style={{ opacity: o, translate: `0 ${(1 - o) * 10 * k}px`, textAlign: "center", marginTop: 26 * k }}>
      <div style={{ fontFamily: "'Big Caslon', Georgia, serif", fontSize: size, color: IVORY, letterSpacing: size * 0.02 }}>{text}</div>
      <div style={{ width: size * 2.2, height: Math.max(2, size * 0.05), background: VERMILION, margin: `${size * 0.3}px auto 0` }} />
    </div>;
  };
  return (
    <AbsoluteFill style={{ background: INK, alignItems: "center", justifyContent: "center", flexDirection: "row", gap: gap * k * 4 }}>
      {[["lhp", 0, labels[0]], ["rhp", 24, labels[1]]].map(([key, t0, text]) => (
        <div key={key} style={{ width: 780 * k, display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ width: 780 * k, height: 780 * k }}><Seal data={S[key]} t0={t0} id={key} /></div>
          {label(text, t0 + 120)}
        </div>
      ))}
    </AbsoluteFill>
  );
};
