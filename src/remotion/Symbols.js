import React from "react";
import { interpolate, useVideoConfig } from "remotion";
import { Seal } from "./Seals.js";
import { INK, IVORY, VERMILION, SERIF, Frame, Label, Weave, cue, draw, lerp, ramp, rise, triangle, pts } from "./Ink.js";

// Symbol animations for the Left-Hand Path episode (symbol-animation-brief.md), each a shot of the edit
// (ShotComponent.js). Times are seconds from the shot's start; cues come from the narration's word timings.

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

// a seal label or a word in the house face, with the vermilion rule under it (as SealsPair)
const Word = ({ text, x, y, o, k, size = 40 }) => (
  <div style={{ position: "absolute", left: x, top: y, opacity: o, translate: `-50% calc(-50% + ${(1 - o) * 12 * k}px)`, textAlign: "center", whiteSpace: "nowrap" }}>
    <div style={{ fontFamily: SERIF, fontSize: size * k, letterSpacing: size * k * 0.14, color: IVORY }}>{text}</div>
    <div style={{ width: size * 1.6 * k, height: Math.max(2, size * 0.05 * k), background: VERMILION, margin: `${size * 0.3 * k}px auto 0` }} />
  </div>
);

// The two seals drawing themselves in (cold open), then the Left-Hand Path's seal alone at the centre with the words
// around it as the narration says them (the reference video's EGO / POISON, INDULGENCE / MEDICINE, INDIVIDUATION /
// GOD-HOOD pairs, timed to our lines). props.pair: only the two seals, labelled (II, "two of the best known are
// pentagrams"); props.hold: the finished state (the cut on "Do you want to become a god?"); pair + hold: the two seals
// already drawn, labelled, each lit as its cue is spoken ("There are two liberations. On the right hand … On the left
// hand …"); props.single "lhp" | "rhp": that seal alone, drawn, large, as the narration describes it (the Adam and Eve
// seal, the Samael and Lilith seal: Gorka's review, 3 Oct). hold + props.alone: on the question itself the words fade
// away and the seal grows, alone at the centre (Gorka, 5 Oct: "when you say 'do you want to become a god' fade out all
// text and keep the center image, perhaps enlarge").
export const SealsOpen = ({ t, d, cues, data, props = {} }) => {
  const { width, height, fps } = useVideoConfig();
  const k = width / 1920, S = data.seals.seals, hold = !!props.hold, pair = !!props.pair;
  if (props.single) {
    const key = props.single, size = 720 * k, push = 1 + 0.03 * Math.min(1, t / Math.max(1, d || 1));
    return (
      <div style={{ position: "absolute", inset: 0, background: INK }}>
        <div style={{ position: "absolute", left: width / 2 - size / 2, top: height * 0.45 - size / 2, width: size, height: size, scale: String(push) }}>
          <Seal data={S[key]} t0={-300} id={`${key}-single`} frame={t * fps} />
          <Word text={key === "lhp" ? "The Left-Hand Path" : "The Right-Hand Path"} x={size / 2} y={size + 70 * k} o={1} k={k} size={42} />
        </div>
      </div>
    );
  }
  const fx = pair ? 0 : hold ? 1 : ramp(t, cue(cues, "ego", 16) - 1.8, cue(cues, "ego", 16) - 0.2);
  const rh = cue(cues, "rhp", null), lh = cue(cues, "lhp", null);
  const dimL = rh != null && lh != null ? interpolate(t, [rh, rh + 0.6, lh, lh + 0.6], [0, 1, 1, 0], clamp) : 0;
  const dimR = lh != null ? ramp(t, lh, lh + 0.6) : 0;
  const alone = props.alone ? ramp(t, 0.2, 1.2) : 0, grow = props.alone ? ramp(t, 0.2, 3.4) : 0;
  const size0 = 760 * k, size1 = 600 * k * (1 + 0.45 * grow), cy = height * (0.45 + 0.05 * grow);
  const L = { cx: lerp(width / 2 - 400 * k, width / 2, fx), size: lerp(size0, size1, fx), o: 1 - 0.55 * dimL };
  const R = { cx: width / 2 + 400 * k, size: size0, o: (1 - 0.55 * dimR) * (1 - Math.min(1, fx / 0.35)) };   // gone before the left one arrives
  const F = fps / 30;                                          // the seal timings below are in 30 fps frames
  const t0 = hold ? -300 : 0;                                   // frames; a held seal is already drawn
  const labelO = (start) => (hold ? (pair ? 1 : 0) : rise(t, (start + 120) / 30, 0.6)) * (1 - fx);
  const words = [   // [text, cue, column, row]
    ["EGO", "ego", 0, 0], ["INDIVIDUATION", "ego", 1, 0], ["INDULGENCE", "indulgence", 0, 1], ["GOD-HOOD", "god", 1, 1],
    ["POISON", "poison", 0, 2], ["MEDICINE", "medicine", 1, 2]];
  return (
    <div style={{ position: "absolute", inset: 0, background: INK }}>
      {[["lhp", L, 0, "The Left-Hand Path"], ["rhp", R, 24, "The Right-Hand Path"]].map(([key, P, start, label]) => P.o > 0.001 && (
        <div key={key} style={{ position: "absolute", left: P.cx - P.size / 2, top: cy - P.size / 2, width: P.size, height: P.size, opacity: P.o }}>
          <Seal data={S[key]} t0={(t0 + start) * F} id={key} frame={t * fps} />
          <Word text={label} x={P.size / 2} y={P.size + 70 * k} o={labelO(start)} k={k} size={42} />
        </div>
      ))}
      {!pair && words.map(([text, c, col, row]) => {
        const at = hold ? -9 : cue(cues, c, null);
        if (at == null) return null;
        return <Word key={text} text={text} k={k} size={38} o={(hold ? 1 : rise(t, at, 0.6)) * (1 - alone)}
          x={col ? width * 0.835 : width * 0.165} y={cy + (row - 1) * 190 * k} />;
      })}
    </div>
  );
};

// Two triangles: up (ivory, the Right-Hand Path), down (vermilion, the Left-Hand Path), each drawn as it is named, then
// sliding together into the six-pointed star, woven so it reads as two forces joined.
export const Triangles = ({ t, d, cues, props = {} }) => {
  if (props.hold) {                                            // the star, woven, held (the alchemists' mirror)
    const U = triangle(960, 540, 560, true), D = triangle(960, 540, 560, false), push = 1 + 0.06 * Math.min(1, t / Math.max(1, d || 1));
    return (
      <Frame>
        <g transform={`translate(960 540) scale(${push}) translate(-960 -540)`} opacity={rise(t, 0, 0.8)}>
          <polygon points={pts(U)} fill="none" stroke={IVORY} strokeWidth={7} />
          <polygon points={pts(D)} fill="none" stroke={VERMILION} strokeWidth={7} />
          <Weave U={U} D={D} />
        </g>
      </Frame>
    );
  }
  const two = 0.3, up = cue(cues, "up", 3), dn = cue(cues, "down", 9), tog = cue(cues, "together", 15);   // drawn faintly as the shot opens
  const g = ramp(t, tog, tog + 1.8), s = 400, cy = 470, dx = 420 * (1 - g);
  const U = triangle(960 - dx, cy, s, true), D = triangle(960 + dx, cy, s, false);
  const labels = 1 - ramp(t, tog, tog + 0.7);
  const lit = (at) => 0.3 + 0.7 * ramp(t, at, at + 0.6);
  return (
    <Frame>
      <polygon points={pts(U)} fill="none" stroke={IVORY} strokeWidth={7} opacity={lit(up)} {...draw(ramp(t, Math.min(two, up), Math.min(two, up) + 1.6))} />
      <polygon points={pts(D)} fill="none" stroke={VERMILION} strokeWidth={7} opacity={lit(dn)} {...draw(ramp(t, Math.min(two, dn), Math.min(two, dn) + 1.6))} />
      {g > 0.995 && <Weave U={U} D={D} opacity={rise(t, tog + 1.8, 0.3)} />}
      <Label t={t} at={up + 0.9} x={960 - 420} y={cy + 250} text="THE RIGHT-HAND PATH" size={34} opacity={labels} rule />
      <Label t={t} at={dn + 0.9} x={960 + 420} y={cy + 250} text="THE LEFT-HAND PATH" size={34} opacity={labels} rule />
    </Frame>
  );
};

// The eclipse: the sun drawn in ivory, a dark disc slides across it until only a thin ring of light is left; the
// flames of our black sun (work/art-v2/black-sun-flame, traced by scripts/trace_symbol.py) burn out around it; the two
// triangles lock into the star at its centre. props.hold: the finished black sun.
export const BlackSun = ({ t, cues, data, props = {} }) => {
  const B = data.blacksun, { cx, cy, r } = B.disc, R = 190, sc = R / r, hold = !!props.hold;
  const sun = hold ? 1 : ramp(t, 0.2, 1.6), fill = hold ? 1 : ramp(t, 0.9, 2.1);
  const ds = hold ? -99 : cue(cues, "disc", 6), m = hold ? 1 : ramp(t, ds, ds + 2.6);
  const bs = hold ? -99 : cue(cues, "blacksun", 12), st = hold ? -99 : cue(cues, "star", 15);
  const grow = ramp(t, bs, bs + 1.8), spin = Math.max(0, t - bs) * 0.6;
  const g = ramp(t, st, st + 1.8), s = 250;
  const U = triangle(960, 540 - 420 * (1 - g), s, true), D = triangle(960, 540 + 420 * (1 - g), s, false);
  const paths = B.groups[0].paths;
  return (
    <Frame>
      <g transform={`translate(960 540) rotate(${spin}) scale(${sc * lerp(0.84, 1, grow)}) translate(${-cx} ${-cy})`}>
        <g transform={B.transform}>
          {paths.map((d, i) => <path key={i} d={d} fill={VERMILION} opacity={hold ? 1 : ramp(t, bs + (i / paths.length) * 0.9, bs + (i / paths.length) * 0.9 + 0.7)} />)}
        </g>
      </g>
      <circle cx={960} cy={540} r={R} fill={IVORY} fillOpacity={fill} stroke={IVORY} strokeWidth={5} transform="rotate(-90 960 540)" {...draw(sun)} />
      <circle cx={lerp(960 - 760, 960, m)} cy={540} r={R * 0.972} fill={INK} />
      <g opacity={ramp(t, st, st + 0.5)}>
        <polygon points={pts(U)} fill="none" stroke={IVORY} strokeWidth={6} />
        <polygon points={pts(D)} fill="none" stroke={VERMILION} strokeWidth={6} />
        {g > 0.995 && <Weave U={U} D={D} w={6} gap={8} />}
      </g>
    </Frame>
  );
};

// Led Zeppelin's four symbols (Wikimedia Commons, public domain), drawn in one by one: each outline draws, then its
// ink fills; Jimmy Page's Zoso first, in vermilion, then the triquetra, the three rings and the feather in ivory.
export const Zoso = ({ t, d, data }) => {
  const Z = data.zoso, [W, H] = Z.size, sc = 1560 / W, per = Math.min(1.1, Math.max(0.6, (d - 0.8) / 4.4));
  return (
    <Frame>
      <g transform={`translate(${960 - (W * sc) / 2} ${540 - (H * sc) / 2}) scale(${sc})`}>
        <g transform={Z.transform}>
          {Z.groups.map((g, i) => {
            const a = 0.3 + i * per, col = i === 0 ? VERMILION : IVORY;
            return <g key={i}>{g.paths.map((p, j) => (
              <path key={j} d={p} fill={col} fillOpacity={ramp(t, a + per * 0.55, a + per * 1.3)} stroke={col} strokeWidth={2.2}
                vectorEffect="non-scaling-stroke" {...draw(ramp(t, a, a + per))} />))}</g>;
          })}
        </g>
      </g>
    </Frame>
  );
};
