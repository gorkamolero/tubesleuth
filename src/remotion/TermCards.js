import React from "react";
import { AbsoluteFill, Sequence, interpolate, Easing, staticFile, useCurrentFrame, useVideoConfig } from "remotion";

// On-screen term cards (config/term-cards.json, scripts/term_cards.py): an old or unusual word appears in the house
// typeface while it is spoken, lower left inside the title-safe frame, over a soft shade so it reads on any plate.
// It fades in over fade_in_s on the word, stays until hold_after_s after the word ends, and fades out over fade_out_s.
const Card = ({ card, style, timing, fps }) => {
  const frame = useCurrentFrame();
  const { width, height } = useVideoConfig();
  const inF = timing.fade_in_s * fps, outF = timing.fade_out_s * fps;
  const total = (card.end_s - card.start_s + timing.lead_s + timing.hold_after_s + timing.fade_out_s) * fps;
  const opacity = interpolate(frame, [0, inF, total - outF, total], [0, 1, 1, 0],
    { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 0, 0.2, 1) });
  const rise = interpolate(frame, [0, inF], [height * 0.006, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.16, 1, 0.3, 1) });
  const p = style.palettes[style.palette] || style.palettes.dark;
  const size = width * style.size;
  return (
    <AbsoluteFill style={{ pointerEvents: "none", opacity }}>
      {/* a soft pool of shade behind the word, never a box */}
      <div style={{ position: "absolute", left: 0, bottom: 0, width: "55%", height: "34%",
        background: `radial-gradient(ellipse at ${style.x * 100 + 12}% 78%, ${p.shade} 0%, transparent 62%)` }} />
      <div style={{ position: "absolute", left: width * style.x, bottom: height * style.bottom, translate: `0 ${rise}px` }}>
        <div style={{ fontFamily: `'${style.family}', 'Big Caslon', Georgia, serif`, fontSize: size, lineHeight: 1, color: p.ink,
          letterSpacing: size * 0.02 }}>{card.text}</div>
        <div style={{ width: size * 1.6, height: Math.max(2, size * 0.045), background: style.rule, marginTop: size * 0.32 }} />
      </div>
    </AbsoluteFill>
  );
};

export const TermCards = ({ cards, style, timing, lead, fps, fontFile }) => {
  if (!cards || !cards.length) return null;
  return (
    <>
      {fontFile && <style>{`@font-face { font-family: '${style.family}'; src: url('${staticFile(fontFile)}'); }`}</style>}
      {cards.map((c, i) => {
        const from = lead + Math.round((c.start_s - timing.lead_s) * fps);
        const dur = Math.ceil((c.end_s - c.start_s + timing.lead_s + timing.hold_after_s + timing.fade_out_s) * fps) + 1;
        return <Sequence key={i} from={from} durationInFrames={dur} layout="none"><Card card={c} style={style} timing={timing} fps={fps} /></Sequence>;
      })}
    </>
  );
};
