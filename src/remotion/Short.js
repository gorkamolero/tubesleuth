import React, {useEffect, useMemo, useState} from 'react';
import {AbsoluteFill, Easing, Img, OffthreadVideo, Sequence, cancelRender, continueRender, delayRender, getRemotionEnvironment, interpolate, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import {Audio} from '@remotion/media';
import {createTikTokStyleCaptions} from '@remotion/captions';

// A Short: its own vertical edit, built from a spec by scripts/build_short.py (direction in
// saga-vault/Channel/Shorts direction.md). Props carry everything resolved to seconds: shots (plate + camera segments),
// the voice (one track, assembled sample-accurately), the score, captions (Caption[]), the closing card.
// This file only draws: no timing decisions are made here.

const INK = '#1d1a17', PAPER = '#eee6d5', VERMILION = '#a7351e', VERMILION_NIGHT = '#e05c3e';
const SERIF = "'Hoefler Text', 'IM Fell English', Georgia, serif";

// ---- camera: a 9:16 window on the plate. (cx, cy) = window centre, h = window height, as fractions of the plate.
const lerp = (a, b, u) => a + (b - a) * u;
const easeInOut = Easing.bezier(0.45, 0, 0.55, 1), easeWhip = Easing.bezier(0.7, 0, 0.3, 1);   // whip: slow out, fast across, slow in
function viewAt(shot, t) {
  let cur = shot.start;
  for (const s of shot.segs) {
    if (t <= s.t0) return cur;
    if (t < s.t1) {
      const raw = (t - s.t0) / (s.t1 - s.t0), u = s.ease === 'whip' ? easeWhip(raw) : s.ease === 'inout' ? easeInOut(raw) : raw;
      return {cx: lerp(cur.cx, s.to.cx, u), cy: lerp(cur.cy, s.to.cy, u), h: Math.exp(lerp(Math.log(cur.h), Math.log(s.to.h), u))};
    }
    cur = s.to;
  }
  return cur;
}

// The plate placed so the window fills the frame (pixel maths, no CSS transforms to accumulate rounding).
function placement(shot, v, W, H) {
  const k = H / (v.h * shot.plateH);
  return {width: shot.plateW * k, height: shot.plateH * k, left: W / 2 - v.cx * shot.plateW * k, top: H / 2 - v.cy * shot.plateH * k};
}

// Each shot is its own Sequence, premounted 1.5 s before its cut (Remotion's premountFor), so its plate is decoded
// before it is needed and nothing loads at the cut, while only the shots near the playhead hold an image in memory
// (1 Oct: mounting every plate at once - 42 large images - broke the renderer's decoder). Motion blur only while the
// frame moves fast: copies drawn at sub-frame instants inside a ~126 degree shutter, averaged (copy i at opacity
// 1/(i+1)). Shots that never travel draw one image; shots with travels keep their copies mounted in the Studio (no
// mounting mid-play) and mount only the copies a frame needs when rendering.
const SHUTTER = 0.35, SPACING = 3, COPIES = 10;
function Shot({shot}) {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H} = useVideoConfig();
  const t = shot.from + frame / fps;
  const moves = shot.segs.some((s) => s.ease !== 'linear');
  const a = placement(shot, viewAt(shot, t - 1 / fps), W, H), b = placement(shot, viewAt(shot, t), W, H);
  const streak = (Math.abs(b.left - a.left) + Math.abs(b.top - a.top) + Math.abs(b.width - a.width) / 2) * SHUTTER;
  const n = !moves || streak < 2 ? 1 : Math.min(COPIES, 1 + Math.ceil(streak / SPACING));
  const mounted = !moves ? 1 : getRemotionEnvironment().isRendering ? n : COPIES;
  const src = staticFile(shot.plateFile);
  return (
    <AbsoluteFill style={{overflow: 'hidden', backgroundColor: PAPER}}>
      {Array.from({length: mounted}, (_, i) => {
        const p = placement(shot, viewAt(shot, n === 1 ? t : t - (SHUTTER / fps) * (Math.min(i, n - 1) / Math.max(1, n - 1))), W, H);
        return <Img key={i} src={src} style={{position: 'absolute', left: p.left, top: p.top, width: p.width, height: p.height, maxWidth: 'none',
          opacity: i < n ? (i === 0 ? 1 : 1 / (i + 1)) : 0}} />;
      })}
    </AbsoluteFill>
  );
}

// ---- real footage (the people Shorts): a 1080x1920 clip baked by build_short.py (band on ink with the name, or full
// frame), silent here; its sound is in the voice track.
// No text is drawn over the footage (Gorka, 3 Oct); the scene is named by one small line at the bottom, in the
// subtitles' style, below the speech captions and above the player's own buttons.
// Footage that hands over to a plate keeps playing past its sound while the plate soaks in through it, as ink into
// paper (the episode's section transition, LivingPrint.js inkMask): `inkOut` s, through `inkFrames` (masks of what the
// ink has not reached yet).
function Footage({file, credit, length = Infinity, inkOut = 0, inkFrames = []}) {
  const frame = useCurrentFrame();
  const {width, height, fps} = useVideoConfig();
  const left = length - frame / fps;                                 // seconds until this footage's picture ends
  const p = inkOut && inkFrames.length ? 1 - left / inkOut : 0;
  const mask = p > 0 ? (() => { const u = `url(${staticFile(inkFrames[Math.min(inkFrames.length - 1, Math.floor(p * inkFrames.length))])})`;
    return {maskImage: u, WebkitMaskImage: u, maskSize: 'cover', WebkitMaskSize: 'cover', maskPosition: 'center', WebkitMaskPosition: 'center',
      maskRepeat: 'no-repeat', WebkitMaskRepeat: 'no-repeat'}; })() : {};
  return (
    <AbsoluteFill style={{backgroundColor: INK, ...mask}}>
      <OffthreadVideo src={staticFile(file)} muted style={{width: '100%', height: '100%'}} />
      {credit && <div style={{position: 'absolute', left: 0, right: 0, top: Math.round(height * 0.745), display: 'flex', justifyContent: 'center'}}>
        <div style={{fontFamily: SERIF, fontStyle: 'italic', fontSize: Math.round(width * 0.03), color: PAPER, background: 'rgba(29,26,23,0.72)',
          padding: `${Math.round(width * 0.006)}px ${Math.round(width * 0.018)}px`, borderRadius: 3}}>{credit}</div>
      </div>}
    </AbsoluteFill>
  );
}

// ---- captions: 2-4 word pages on an ink plate, the spoken word lit; above or below the subject, never over it.
function Captions({captions, zone, hideFrom, shots}) {
  const {fps, height} = useVideoConfig();
  const zoneAt = (ms) => {
    const s = shots.find((x) => ms / 1000 >= x.from && ms / 1000 < x.to); if (!s) return zone;
    const z = (s.zones || []).filter((c) => c.t <= ms / 1000).pop();            // a change of side inside the shot
    return z ? z.zone : (s.captions || zone);
  };
  // pages are the builder's phrases (pageBreakAfter); the time window is only a backstop
  const {pages} = useMemo(() => createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: 60000}), [captions]);
  // a page begun over footage but said mostly over the plate after it sits where the plate's captions sit
  const inFoot = (ms) => shots.some((x) => x.footage && ms / 1000 >= x.from && ms / 1000 < x.to);
  return <>{pages.map((page, i) => {
    const mid = page.startMs + page.durationMs / 2;
    const z = inFoot(page.startMs + 1) && !inFoot(mid) ? zoneAt(mid) : zoneAt(page.startMs + 1);
    if (z === 'none') return null;
    const top = z === 'bottom' ? 0.64 : 0.25;
    const next = pages[i + 1];
    const from = Math.round((page.startMs / 1000) * fps);
    const foot = shots.find((x) => x.footage && page.startMs / 1000 >= x.from && page.startMs / 1000 < x.to);   // footage's own words end
    const until = Math.min(next ? Math.round((next.startMs / 1000) * fps) : Infinity, Math.round(((page.startMs + page.durationMs) / 1000) * fps) + 9,   // with
      Math.round(hideFrom * fps), foot ? Math.round((page.tokens[page.tokens.length - 1].toMs / 1000) * fps) + 9 : Infinity);   // footage words: their own time                                                                        // its picture
    if (until <= from) return null;
    return (
      <Sequence key={i} from={from} durationInFrames={until - from} name={`Caption ${i + 1}`}>
        <CaptionPage page={page} top={Math.round(height * top)} first={i === 0} />
      </Sequence>
    );
  })}</>;
}

function CaptionPage({page, top, first}) {
  const frame = useCurrentFrame();
  const {fps, width} = useVideoConfig();
  const nowMs = page.startMs + (frame / fps) * 1000;
  const appear = first ? 1 : interpolate(frame, [0, 3], [0, 1], {extrapolateRight: 'clamp'});   // the hook is up on frame 0
  return (
    <div style={{position: 'absolute', left: 0, right: 0, top, display: 'flex', justifyContent: 'center', opacity: appear}}>
      <div style={{maxWidth: '84%', textAlign: 'center', whiteSpace: 'pre-wrap', textWrap: 'balance', fontFamily: SERIF, fontSize: Math.round(width * 0.06),
        lineHeight: 1.2, color: PAPER, background: 'rgba(29,26,23,0.88)', padding: `${Math.round(width * 0.011)}px ${Math.round(width * 0.028)}px`, borderRadius: 3}}>
        {/* each word is unbreakable ("Right-Hand" never splits at its hyphen); the space before it stays outside, so the
            line still breaks between words. The font's own hyphen: Hoefler Text has no non-breaking hyphen glyph */}
        {page.tokens.map((tk, i) => (
          <React.Fragment key={i}>{tk.text.match(/^\s*/)[0]}<span style={{whiteSpace: 'nowrap', color: tk.fromMs <= nowMs && nowMs < tk.toMs ? VERMILION_NIGHT : PAPER}}>{tk.text.trimStart()}</span></React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ---- a typographic list (sin -> virtue): the left column is there from the cut, each right item arrives on its word.
function ListCard({shot}) {
  const frame = useCurrentFrame();
  const {fps, width, height} = useVideoConfig();
  const t = shot.from + frame / fps;
  const size = Math.round(width * 0.078), gap = Math.round(height * 0.062);
  return (
    <AbsoluteFill style={{backgroundColor: PAPER, justifyContent: 'center', alignItems: 'center'}}>
      <div style={{display: 'grid', gridTemplateColumns: '1fr auto 1fr', columnGap: Math.round(width * 0.04), rowGap: gap - size, alignItems: 'baseline', fontFamily: SERIF, fontSize: size, marginTop: -height * 0.04}}>
        {shot.rows.map((r, i) => {
          const on = interpolate(t, [r.at - 0.05, r.at + 0.3], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)});
          return <React.Fragment key={i}>
            <div style={{textAlign: 'right', color: INK}}>{r.left}</div>
            <div style={{color: VERMILION, opacity: 0.35 + 0.65 * on, fontSize: size * 0.7}}>&rarr;</div>
            <div style={{textAlign: 'left', color: VERMILION, fontStyle: 'italic', opacity: on, translate: `${(1 - on) * -10}px 0`}}>{r.right}</div>
          </React.Fragment>;
        })}
      </div>
    </AbsoluteFill>
  );
}

// ---- the end plate: a full-frame poster. The episode's key art, cut to 9:16 with its own paper carried up above it
// (scripts/endplate_art.py) and brought to life by a motion clip when there is one, dissolves in over the last shot
// and closes in slowly on the sun. On its paper: the house
// lockup as on the website (vermilion sun, CYBERTANTRA in IM Fell English SC, black sun), then THE FULL EPISODE between
// fine rules and the episode's title stacked in the thumbnail's type, each arriving as the voice reaches it.
const FELL = "'IM Fell English SC', 'IM Fell English', Georgia, serif";
const HOEFLER = "'Hoefler Text', Georgia, serif";             // weight 900: Hoefler Text Black, as on the thumbnail
const TYPE = {ink: INK, vermilion: VERMILION};
// The title's lines are spaced by the thumbnails' rule (scripts/thumb_text.py): from one line's baseline to the next
// line's cap tops, 0.30 of the two lines' mean size. In CSS a line box holds more than the caps, so the margin is that
// gap less what each box adds below the baseline / above the cap tops, from Hoefler Text Black's metrics at line-height
// TITLE_LH (ascent minus descent 0.465 em, cap height 0.7285 em: measured on a render, 1 Oct, gaps 17 and 27 px).
const TITLE_LH = 0.8, TITLE_GAP = 0.30, HOEFLER_BLACK = {ascMinusDesc: 0.465, cap: 0.7285};
const titleGap = (upper, lower) => TITLE_GAP * (upper + lower) / 2
  - upper * (TITLE_LH / 2 - HOEFLER_BLACK.ascMinusDesc / 2) - lower * (TITLE_LH / 2 + HOEFLER_BLACK.ascMinusDesc / 2 - HOEFLER_BLACK.cap);

// a font shipped in the Short's public dir, held until loaded (renders never fall back to Georgia)
function useFont(family, file) {
  const [handle] = useState(() => (file ? delayRender(`font ${family}`) : null));
  useEffect(() => {
    if (!file) return;
    const face = new FontFace(family, `url(${staticFile(file)})`);
    face.load().then(() => { document.fonts.add(face); continueRender(handle); }).catch((err) => cancelRender(err));
  }, [family, file, handle]);
}

function EndPlate({card}) {
  const frame = useCurrentFrame();
  const {fps, width: W, height: H, durationInFrames} = useVideoConfig();
  const t = card.plateFrom + frame / fps, end = card.plateFrom + durationInFrames / fps;
  const ease = Easing.bezier(0.16, 1, 0.3, 1);
  const at = (t0, d = 0.7) => interpolate(t, [t0, t0 + d], [0, 1], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: ease});
  const veil = at(card.plateFrom, 0.9), mark = at(card.plateFrom + 0.35), lead = at(card.leadAt), title = at(card.from - 0.2, 0.9);
  const rise = (o) => `0 ${(1 - o) * H * 0.008}px`;
  const big = W * card.titleSize, F = W * (card.lockupSize || 0.046);   // the title's big lines; the lockup's em
  const [fx, fy] = card.focus;
  // the lockup, measured as on the site: each disc a round capital, 0.62 em from disc edge to ink on both sides. At the
  // top of the sheet in ink, or at its foot (card.lockupAt 'bottom') in a colour that reads on the art there.
  // 'invert': the letters take, pixel by pixel, the opposite of what lies beneath them (a difference blend), ink over
  // the snow and ivory over the rock, changing as the snow blows past. Their colour is the light ground plus the ink, so the
  // blend lands on our own ink over the paper and close to the paper over the ink. A blended element mixes only with
  // its own stacking context, so the letters carry their own fade and the wrapper creates none.
  const inverted = card.lockupColor === 'invert';
  const fade = {opacity: mark, translate: rise(mark)};
  const lockup = (
    <div style={{fontFamily: FELL, fontSize: F, lineHeight: 1, whiteSpace: 'nowrap', color: {paper: PAPER, vermilion: VERMILION, 'vermilion-night': VERMILION_NIGHT}[card.lockupColor] || INK, ...(inverted ? {} : fade)}}>
      <Img src={staticFile(card.sunLeft)} style={{display: 'inline-block', verticalAlign: '-0.0107em', height: '0.7360em', margin: '-0.0079em 0.566em -0.0079em -0.0079em', ...(inverted ? fade : {})}} />
      <span style={{display: 'inline-block', letterSpacing: '0.32em', ...(inverted ? {...fade, color: card.lockupInvert || 'rgb(255, 255, 236)', mixBlendMode: 'difference'} : {})}}>CYBERTANTRA</span>
      <Img src={staticFile(card.sunRight)} style={{display: 'inline-block', verticalAlign: '-0.0107em', height: '1.4152em', margin: '-0.3475em -0.3475em -0.3475em -0.0255em', ...(inverted ? fade : {})}} />
    </div>
  );
  return (
    <AbsoluteFill style={{opacity: veil, backgroundColor: PAPER}}>
      {/* zoom: a fixed enlargement from the top edge, which lowers the picture under the type without opening a gap */}
      <AbsoluteFill style={{transformOrigin: '50% 0%', scale: String(card.zoom || 1)}}>
        {[card.art, card.artVideo].filter(Boolean).map((src, i) => {
          const style = {position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', transformOrigin: `${fx * 100}% ${fy * 100}%`,
            scale: interpolate(t, [card.plateFrom, end], [1, 1 + card.push], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})};
          // the still, and over it the art's motion clip (scripts/motion_clip.mjs) when the episode has one
          return i === 0 ? <Img key={i} src={staticFile(src)} style={style} />
            : <OffthreadVideo key={i} src={staticFile(src)} muted playbackRate={card.artVideoRate || 1} style={style} />;
        })}
      </AbsoluteFill>
      <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-start', paddingTop: H * card.lockupY}}>
        {card.lockupAt === 'top' || !card.lockupAt ? lockup : null}
        {card.lead && (
          <div style={{display: 'flex', alignItems: 'center', gap: W * 0.03, marginTop: H * card.leadGap, opacity: lead, translate: rise(lead)}}>
            <div style={{width: W * 0.085, height: 2, background: INK, opacity: 0.5}} />
            <div style={{fontFamily: FELL, fontSize: W * 0.032, lineHeight: 1, letterSpacing: `${card.leadTracking}em`, marginRight: `-${card.leadTracking}em`, color: INK}}>{card.lead}</div>
            <div style={{width: W * 0.085, height: 2, background: INK, opacity: 0.5}} />
          </div>
        )}
        <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: H * card.titleGap, opacity: title, translate: rise(title)}}>
          {card.titleLines.map((line, i) => {
            const size = big * (line.scale || 1), above = i ? big * (card.titleLines[i - 1].scale || 1) : 0;
            return (
              <div key={i} style={{fontFamily: HOEFLER, fontWeight: 900, fontSize: size, lineHeight: TITLE_LH, letterSpacing: '0.04em', wordSpacing: '0.1em', marginRight: '-0.04em', whiteSpace: 'nowrap',
                marginTop: i ? titleGap(above, size) : 0}}>
                {/* a hanging segment (the ink "?") sits outside the line's width, so the word itself is on the axis */}
                {line.segments.map((sg, j) => sg.hang
                  ? <span key={j} style={{position: 'relative'}}><span style={{position: 'absolute', left: 0, color: TYPE[sg.color]}}>{sg.text}</span></span>
                  : <span key={j} style={{color: TYPE[sg.color]}}>{sg.text}</span>)}
              </div>
            );
          })}
        </div>
      </AbsoluteFill>
      {card.lockupAt === 'bottom' && !card.lockupPlate && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: H * card.lockupBottom}}>{lockup}</AbsoluteFill>
      )}
      {/* the lockup on a plate of its own at the foot: a paper band across the frame (a print's lower margin) or a
          framed cartouche, the name in ink on it */}
      {card.lockupAt === 'bottom' && card.lockupPlate === 'band' && (
        <AbsoluteFill style={{justifyContent: 'flex-end'}}>
          <div style={{height: H * (card.lockupBandH || 0.075), background: PAPER, borderTop: `2px solid ${INK}`, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: mark}}>{lockup}</div>
        </AbsoluteFill>
      )}
      {card.lockupAt === 'bottom' && card.lockupPlate === 'cartouche' && (
        <AbsoluteFill style={{alignItems: 'center', justifyContent: 'flex-end', paddingBottom: H * card.lockupBottom}}>
          <div style={{background: PAPER, border: `${Math.round(W * 0.004)}px double ${INK}`, padding: `${F * 0.55}px ${F * 0.9}px`, opacity: mark}}>{lockup}</div>
        </AbsoluteFill>
      )}
    </AbsoluteFill>
  );
}

// ---- the print: grain and a soft vignette, as in the film (cropped, never stretched, to the vertical frame).
function Print({grainFiles}) {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = frame / fps, i = grainFiles?.length ? Math.floor(s * 12) % grainFiles.length : -1;
  return <>
    {i >= 0 && <Img src={staticFile(grainFiles[i])} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', opacity: 0.5, pointerEvents: 'none'}} />}
    <AbsoluteFill style={{pointerEvents: 'none', background: 'radial-gradient(ellipse at 50% 46%, transparent 60%, rgba(28,20,12,0.22) 100%)'}} />
  </>;
}

export const Short = (props) => {
  const {fps} = useVideoConfig();
  const {shots = [], footage = [], inkOut = [], voice, music, captions = [], captionZone = 'top', card, grainFiles} = props;
  const F = (s) => Math.round(s * fps);
  useFont('IM Fell English SC', card?.font);
  return (
    <AbsoluteFill style={{backgroundColor: PAPER}}>
      {shots.map((shot, i) => shot.type === 'list' ? null : (
        <Sequence key={i} from={F(shot.from)} durationInFrames={Math.max(1, F(shot.to) - F(shot.from))} premountFor={Math.round(1.5 * fps)} name={`Shot ${i + 1}: ${shot.plate || shot.file}`}>
          {shot.type === 'video' ? <Footage file={shot.file} /> : <Shot shot={shot} />}
        </Sequence>
      ))}
      {footage.map((f, i) => (
        <Sequence key={`f${i}`} from={F(f.from)} durationInFrames={Math.max(1, F(f.to) - F(f.from))} premountFor={Math.round(1.5 * fps)} name={`Footage ${i + 1}`}>
          <Footage file={f.file} credit={f.credit} length={f.to - f.from} inkOut={f.inkOut} inkFrames={inkOut} />
        </Sequence>
      ))}
      <Print grainFiles={grainFiles} />
      {shots.filter((s) => s.type === 'list').map((s, i) => (
        <Sequence key={`l${i}`} from={F(s.from)} durationInFrames={Math.max(1, F(s.to) - F(s.from))} name={`List ${i + 1}`}><ListCard shot={s} /></Sequence>
      ))}
      <Captions captions={captions} zone={captionZone} hideFrom={card ? card.plateFrom : Infinity} shots={[...footage.map((f) => ({...f, to: f.soundTo ?? f.to, picTo: f.to, captions: 'bottom', footage: true})), ...shots]} />
      {card && <Sequence from={F(card.plateFrom)} name="End plate"><EndPlate card={card} /></Sequence>}
      {voice && <Audio src={staticFile(voice.file)} name="Voice" />}
      {music && (
        <Sequence from={F(music.startAt || 0)} name="Score" layout="none">
          <Audio src={staticFile(music.file)} trimBefore={F(music.trim)} name="Score"
            volume={(f) => { const t = f / fps + (music.startAt || 0), L = music.lift;   // lift: the score up a little in a deliberate beat
              const up = L ? Math.pow(10, (L.db / 20) * interpolate(t, [L.from, L.from + 0.3, L.to - 0.4, L.to], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'})) : 1;
              return up * music.gain * interpolate(t, [music.startAt || 0, (music.startAt || 0) + music.fadeIn, music.fadeOutAt, music.end], [0, 1, 1, 0], {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.33, 0, 0.67, 1)}); }} />
        </Sequence>
      )}
    </AbsoluteFill>
  );
};
