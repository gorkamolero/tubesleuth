import React from "react";
import { AbsoluteFill, Audio, Easing, Sequence, interpolate, staticFile } from "remotion";
import { Audio as ClipAudio } from "@remotion/media";

// Everything the film sounds like, from the same props as the pictures (scripts/studio-props.mjs).
// scripts/render-draft.mjs renders pictures muted and this soundtrack on its own, so it is kept out of the picture cache key.
// The music comes up between paragraphs (pauses listed by scripts/mix_levels.py, in film seconds) and is back down
// before the voice returns: pad after the last word, ramp up, hold, ramp down to end pad before the next word.
function gapLift(mix, t) {
  if (!mix || !mix.gaps?.length) return 1;
  const g = mix.gaps; let lo = 0, hi = g.length - 1;
  while (lo < hi) { const mid = (lo + hi + 1) >> 1; if (g[mid][0] <= t) lo = mid; else hi = mid - 1; }
  const [a, b] = g[lo]; if (t < a || t > b) return 1;
  const s = a + mix.pad_s, e = b - mix.pad_s, r = Math.min(mix.ramp_s, Math.max(0, (e - s) / 2));
  if (r <= 0.01) return 1;
  const [xs, ys] = s + r < e - r ? [[s, s + r, e - r, e], [0, 1, 1, 0]] : [[s, s + r, e], [0, 1, 0]];
  const k = interpolate(t, xs, ys, {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 0, 0.67, 1)});
  const lift = lo === g.length - 1 && mix.tail_lift_db != null ? mix.tail_lift_db : mix.lift_db;   // after the last word: the end card
  return Math.pow(10, (lift * k) / 20);
}

export function Soundtrack({ props, lead, fps, muted }) {
  // the end: music and sound fade with the picture, silent through the black (studio-props --fade-out / --black)
  const fadeF = (props.endFadeSeconds || 0) * fps, endAt = (props.durationInFrames || Infinity) - (props.endBlackSeconds || 0) * fps - fadeF;
  const endGain = (gf) => (fadeF || props.endBlackSeconds) ? interpolate(gf, [endAt, endAt + Math.max(1, fadeF)], [1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 1;
  const { video, voiceoverFile, musicFile } = props;
  return (
    <AbsoluteFill>
      {muted || (props.narrationClips
        // The narration as an edit list (scripts/narration_edl.py): each clip is a stretch of one take, pre-cut
        // sample-accurately, starting and ending in silence, placed at its start after the lead-in. Edits are data.
        // Each clip plays through @remotion/media's Audio: decoded ahead (premountFor) and scheduled on the Web Audio
        // clock at its exact time. remotion's own Audio drove one HTML audio element per clip, which the player only
        // re-syncs past 0.65 s of drift and stops when the clip's slot ends, so a clip that started late lost its last
        // word ("Do you want to become a god" badly cut at the end, Gorka 5 Oct; the take and the clip file were
        // whole). The slot runs a second past the audio; the file has nothing after its end.
        ? props.narrationClips.map((c, i) => (
            <Sequence key={`v-${i}`} from={lead + Math.round(c.start_s * fps)} durationInFrames={Math.ceil(c.dur_s * fps) + fps} premountFor={fps}>
              <ClipAudio src={staticFile(c.file)} />
            </Sequence>
          ))
        : (
          // The voice comes in after the lead-in: picture first.
          <Sequence from={lead}>
            <Audio src={staticFile(voiceoverFile || `assets/video-${video}-voiceover.mp3`)} />
          </Sequence>
        ))}
      {musicFile && <Audio src={staticFile(musicFile)} volume={props.musicVolume ?? 0.2} />}
      {(props.musicTracks || []).map((m) => {
        // One scored piece per group of sections (scripts/score_music.py); fades make the joins crossfade.
        const from = Math.round(m.start_s * fps), len = Math.round(m.duration_s * fps);
        const fi = Math.round((m.fade_in_s ?? 2.5) * fps), fo = Math.round((m.fade_out_s ?? 3) * fps);
        // measured gain under the voice when there is one (scripts/mix_levels.py), else the flat house level
        const vol = m.gain_db != null ? Math.pow(10, m.gain_db / 20) : props.musicVolume ?? 0.2;
        return (
          <Sequence key={m.file} from={from} durationInFrames={len + fo}>
            <Audio src={staticFile(m.file)} volume={(f) => vol * endGain(from + f) * gapLift(props.musicMix, (from + f) / fps) * interpolate(f, [0, fi, len - fo, len + fo], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})} />
          </Sequence>
        );
      })}
      {(props.sfxTracks || []).map((c, i) => {
        // Sound cues placed by scripts/score_sfx.py: the level is baked into the file; swell in, fade the tail.
        const len = Math.round(c.duration_s * fps), fo = Math.min(len - 1, Math.round((c.fade_out_s ?? 0.6) * fps));
        const fi = Math.max(1, Math.min(len - fo - 1, Math.round((c.fade_in_s ?? 0) * fps)));
        return (
          <Sequence key={`sfx-${i}`} from={Math.round(c.start_s * fps)} durationInFrames={len}>
            <Audio src={staticFile(c.file)} volume={(f) => (c.volume ?? 1) * endGain(Math.round(c.start_s * fps) + f) * interpolate(f, [0, fi, len - fo, len], [0, 1, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 0, 0.67, 1)})} />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
}
