import React from "react";
import { spring, useVideoConfig, interpolate, Easing } from "remotion";

import {
  Composition,
  Sequence,
  Img,
  OffthreadVideo,
  Loop,
  staticFile,
  useCurrentFrame,
  AbsoluteFill,
  Audio,
  getInputProps,
} from "remotion";

import { captionStylesModern } from "../config/config.js";
import { generateEffectFilter } from "../utils/generateEffectFilter.js";
import { sceneTiming } from "../../../lib/scene-timing.mjs";
import { VisualTreatment } from "./VisualTreatment.js";
import { SealsPair } from "./Seals.js";
import { ArchivalModal } from "./Modal.js";
import { ShotComponent } from "./ShotComponent.js";
import { cameraStyle } from "./Camera.js";
import { AccentLayer, PrintSurface, inkMask, FocusWash, Bloom } from "./LivingPrint.js";
import { Soundtrack } from "./Soundtrack.js";
import { DepthPlanes } from "./Depth.js";
import { CameraBlur } from "./MotionBlur.js";
import { mindFilter } from "./MindMess.js";
import { TermCards } from "./TermCards.js";
import { Short } from "./Short.js";
const testProps = {};

let isLocal = false;

function convertMsToFrames(ms, fps) {
  return Math.round((ms / 1000) * fps);
}

const WordCaption = ({ from, durationInFrames, word }) => {
  const preMod = 0;
  const postMod = 0;

  const { fps, width, height } = useVideoConfig();
  const phrase = getInputProps().captionMode === "phrase";

  const frame = useCurrentFrame();
  const localFrame = frame - from - preMod;

  const scale = spring({
    frame: localFrame < durationInFrames ? localFrame : 0,
    fps,
    config: {
      damping: 200,
      stiffness: 500,
      mass: 0.25,
    },
  });

  return (
    <Sequence
      from={from - preMod}
      durationInFrames={durationInFrames + postMod}
    >
      <div
        style={{
          ...captionStylesModern,
          height: "auto",
          top: "auto",
          paddingTop: 0,
          paddingBottom: 0,
          fontSize: Math.round(width * (phrase ? 0.026 : 0.043)),
          fontFamily: "Arial, sans-serif",
          textTransform: getInputProps().captionMode === "phrase" ? "none" : "uppercase",
          position: "absolute",
          bottom: Math.round(height * 0.046),
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div
          style={{
            maxWidth: phrase ? "84%" : "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: phrase ? "#f5efdf" : captionStylesModern.fontColor,
              lineHeight: phrase ? 1.3 : undefined,
              fontWeight: phrase ? 500 : undefined,
              background: phrase ? "rgba(17,19,16,.84)" : undefined,
              padding: phrase ? "10px 22px" : undefined,
              borderRadius: phrase ? 5 : undefined,
              transform: `scale(${phrase ? 1 : scale})`,
            }}
          >
            {word}
          </div>
        </div>
      </div>
    </Sequence>
  );
};

const TranscriptionCaptions = () => {
  const inputProps =
    getInputProps() && Object.keys(getInputProps()).length
      ? getInputProps()
      : testProps;
  const { subtitles, fps } = inputProps;

  return (
    <>
      {subtitles &&
        subtitles?.map((word, index) => {
          const from = convertMsToFrames(word.start, fps);
          let durationInFrames = convertMsToFrames(word.end, fps) - from;
          durationInFrames = Math.max(durationInFrames, 1); // Ensure duration is at least 1

          // remove commas and other punctuation signs
          const cleanWord = inputProps.captionMode === "phrase" ? word.text : word.text.replace(
            /[\.,-\/#!$%\^&\*;:{}=\-_`~()]/g,
            "",
          );

          return (
            <WordCaption
              key={index}
              from={from}
              durationInFrames={Math.round(durationInFrames)}
              word={cleanWord}
            />
          );
        })}
    </>
  );
};

const Vid = () => {
  const currentFrame = useCurrentFrame();
  const inputProps =
    getInputProps() && Object.keys(getInputProps()).length
      ? getInputProps()
      : testProps;
  const { video, imageMap, fps, script, mood = "deep", voiceoverFile, musicFile } = inputProps;
  // Picture first, voice after: the narration (and every timed shot) starts leadInSeconds into the film;
  // the first shot is extended back to frame 0 so the fade from black reveals it before the voice comes in.
  const lead = Math.round((inputProps.leadInSeconds || 0) * (fps || 30));

  return (
    <>
      {imageMap && imageMap.map((image, index) => {
        const t = sceneTiming(imageMap, index, fps);
        const from = index === 0 ? 0 : t.from + lead;
        const durationInFrames = index === 0 ? t.duration + lead : t.duration;
        const {fadeIn: fadeFrames, hold} = t;
        const { transform } = generateEffectFilter({
          effect: image.effect || "ZoomIn", currentFrame, from, durationInFrames,
        });
        // Absolute timestamps prevent transition overlap from moving later shots.
        const opacity = index === 0 || !fadeFrames ? 1 : Math.min(1, Math.max(0, (currentFrame-from)/fadeFrames));
        const src = /^https?:/.test(image.url || "") ? image.url : staticFile(image.url || "");
        if (!image.url) return null;
        if (image.component) {
          // A symbol animation or a diagram drawn in place of a picture (ShotComponent.js)
          return (
            <Sequence key={image.id || index} from={from} durationInFrames={durationInFrames + hold}>
              <AbsoluteFill style={{opacity}}>
                <ShotComponent c={image.component} seconds={(currentFrame - from) / (fps || 30)} duration={durationInFrames / (fps || 30)} />
              </AbsoluteFill>
            </Sequence>
          );
        }
        if (image.modal) {
          // An archival picture over the shot before it, blurred (Modal.js)
          return (
            <Sequence key={image.id || index} from={from} durationInFrames={durationInFrames + hold}>
              <AbsoluteFill style={{opacity}}>
                <ArchivalModal modal={image.modal} seconds={(currentFrame - from) / (fps || 30)} duration={durationInFrames / (fps || 30)} />
              </AbsoluteFill>
            </Sequence>
          );
        }
        if (image.camera) {
          // Directed shot: the whole view (image, accent layer, diagram) moves with the camera keyframes.
          // shot time runs with the narration (the first shot reaches back into the lead-in, where its camera waits)
          const seconds = (currentFrame - (index === 0 ? lead : from)) / (fps || 30);
          const ink = (image.transitionSeconds || 0) >= 1 && index > 0;      // section transitions soak in like ink
          // A plate with a motion clip (sea, clouds, fire) plays the clip in place of the still; a locked shot keeps the
          // camera on its establishing frame so only the picture moves.
          const camera = image.cameraLock ? {...image.camera, keys: [image.camera.keys[0]]} : image.camera;
          const clipFrames = Math.round((image.motionSeconds || 10) / (image.motionRate || 1) * (fps || 30));
          const progress = fadeFrames ? (currentFrame - from) / fadeFrames : 1;
          return (
            <Sequence key={image.id || index} from={from} durationInFrames={durationInFrames + hold}>
              <AbsoluteFill style={{opacity: ink ? 1 : opacity, overflow:"hidden", backgroundColor:"#eee6d5", ...(ink ? inkMask(inputProps.inkFiles, progress) : {})}}>
                {/* Fast camera travels are drawn at sub-frame instants and averaged (MotionBlur.js); holds draw once. */}
                {(() => { const m = mindFilter(image.mind, seconds, `mind-${image.id || index}`); return <>{m.defs}<div style={{position: "absolute", inset: 0}}>
                <CameraBlur camera={camera} seconds={seconds} fps={fps || 30} width={inputProps.width || 1920} render={(t, copy) => (
                  <div style={cameraStyle(camera, t)}>
                    <VisualTreatment scene={image} frame={t * (fps || 30)} durationInFrames={durationInFrames}>
                      <div style={{position: "absolute", inset: 0, ...m.style}}>
                      {image.motionClip
                        ? <Loop durationInFrames={clipFrames}><OffthreadVideo src={staticFile(image.motionClip)} muted playbackRate={image.motionRate || 1} style={{width:"100%",height:"100%",objectFit:"cover"}} /></Loop>
                        : <Img src={image.depth ? staticFile(image.depth.base) : src} style={{width:"100%",height:"100%",objectFit:"cover"}} />}
                      {image.accentLayer && <AccentLayer src={image.accentLayer} motion={image.accentMotion} box={image.accentBox} seconds={t} bloom={copy === 0} />}
                      {image.depth && <DepthPlanes depth={image.depth} camera={image.camera} seconds={t} duration={durationInFrames / (fps || 30)} />}
                      </div>
                    </VisualTreatment>
                  </div>
                )} />
                </div></>; })()}
                {/* The wash is drawn once, over the (possibly blurred) picture: it is soft already, and SVG blurs in every
                    sub-frame copy overloaded the compositor (an intermittent black frame, 29 Sep). */}
                {image.light && (
                  <div style={{position: "absolute", inset: 0}}>
                    <div style={cameraStyle(camera, seconds)}><Bloom light={image.light} seconds={seconds} id={image.id || index} /></div>
                  </div>
                )}
                {image.focus && (
                  <div style={{position: "absolute", inset: 0}}>
                    <div style={cameraStyle(camera, seconds)}>
                      {(Array.isArray(image.focus) ? image.focus : [image.focus]).map((f, k) => (
                        <FocusWash key={k} box={f.box} from={f.from || 0} until={f.until ?? Infinity} amount={f.amount ?? 0.5} seconds={seconds} id={`${image.id || index}-${k}`} />
                      ))}
                    </div>
                  </div>
                )}
              </AbsoluteFill>
            </Sequence>
          );
        }
        return (
          <Sequence key={image.id || index} from={from} durationInFrames={durationInFrames + hold}>
            <AbsoluteFill style={{opacity, overflow:"hidden"}}>
              <VisualTreatment scene={image} frame={currentFrame-from} durationInFrames={durationInFrames}>
              {image.motionClip
                ? <OffthreadVideo src={staticFile(image.motionClip)} style={{width:"100%",height:"100%",objectFit:"cover"}} />
                : <Img src={src} style={{width:"100%",height:"100%",objectFit:"cover",transform:`scale(${image.framing?.scale ?? 1}) ${transform}`,transformOrigin:`${image.framing?.x ?? 50}% ${image.framing?.y ?? 50}%`}} />}
              </VisualTreatment>
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {inputProps.captionMode !== "none" && <TranscriptionCaptions />}

      <PrintSurface grainFiles={inputProps.grainFiles} seconds={currentFrame / (fps || 30)} />

      {/* Old or unusual words on screen while they are spoken (config/term-cards.json, scripts/term_cards.py) */}
      <TermCards cards={inputProps.termCards} style={inputProps.termStyle} timing={inputProps.termTiming} lead={lead} fps={fps || 30} fontFile={inputProps.termFont} />

      {/* Film opens from black and closes to black (2.5 s in, 3 s out). */}
      <AbsoluteFill
        style={{
          backgroundColor: "black",
          pointerEvents: "none",
          opacity: interpolate(
            currentFrame,
            [0, 2.5 * fps, (inputProps.durationInFrames || 1) - 3 * fps, (inputProps.durationInFrames || 1) - 1],
            [1, 0, 0, 1],
            {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.33, 0, 0.2, 1)},
          ),
        }}
      />

      {/* Narration, score and sound cues live in Soundtrack.js (edits there never invalidate rendered pictures). */}
      <Soundtrack props={inputProps} lead={lead} fps={fps || 30} muted={isLocal} />
      {/* The end: the last picture fades to black, then black (studio-props --fade-out / --black) */}
      {(inputProps.endFadeSeconds || inputProps.endBlackSeconds) ? (() => {
        const f = fps || 30, total = inputProps.durationInFrames, b = (inputProps.endBlackSeconds || 0) * f, fo = (inputProps.endFadeSeconds || 0) * f;
        const o = interpolate(currentFrame, [total - b - fo - 1, total - b], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: Easing.bezier(0.45, 0, 0.55, 1)});
        return o > 0 ? <AbsoluteFill style={{backgroundColor: "#000", opacity: o}} /> : null;
      })() : null}
    </>
  );
};

export const RemotionRoot = () => {
  const inputProps =
    getInputProps() && Object.keys(getInputProps()).length
      ? getInputProps()
      : testProps;

  if (!getInputProps() || !Object.keys(getInputProps()).length) {
    isLocal = true;
  }

  return (
    <>
      <Composition
        id={inputProps?.video || "123"}
        component={Vid}
        durationInFrames={inputProps?.durationInFrames || 1920}
        fps={inputProps?.fps || 30}
        width={inputProps.width || 1080}
        height={inputProps.height || 1920}
        inputProps={inputProps}
      />
      {/* The Left-Hand Path's pentagram seals, drawn in (Seals.js; data from scripts/trace_seals.py) */}
      <Composition id="SealsPair" component={SealsPair} durationInFrames={210} fps={30} width={1920} height={1080} defaultProps={{}} />
      {/* Shorts: their own vertical edit (scripts/build_short.py, Short.js) */}
      <Composition
        id="Short"
        component={Short}
        durationInFrames={inputProps?.durationInFrames || 300}
        fps={30}
        width={inputProps?.width || 1440}
        height={inputProps?.height || 2560}
        defaultProps={{}}
      />
    </>
  );
};
