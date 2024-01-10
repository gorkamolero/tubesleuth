import React from "react";
import { spring, useVideoConfig } from "remotion";

import {
  Composition,
  Sequence,
  Img,
  staticFile,
  useCurrentFrame,
  AbsoluteFill,
  Audio,
  getInputProps,
} from "remotion";
import { linearTiming, TransitionSeries } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";

import { captionStylesModern } from "../config/config.js";
import { generateEffectFilter } from "../utils/generateEffectFilter.js";
import { testProps } from "../config/testProps.js";

let isLocal = false;

function convertTimeToFrames(time, fps) {
  const [hours, minutes, seconds] = time.split(":").map(parseFloat);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * fps);
}

const WordCaption = ({ from, durationInFrames, word }) => {
  const preMod = 0;
  const postMod = 0;

  const { fps } = useVideoConfig();

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
          position: "absolute",
          bottom: 50,
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
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              color: captionStylesModern.fontColor,
              transform: `scale(${scale})`,
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
      {subtitles.map((word, index) => {
        const from = convertTimeToFrames(word.start, fps);
        let durationInFrames = convertTimeToFrames(word.end, fps) - from;
        durationInFrames = Math.max(durationInFrames, 1); // Ensure duration is at least 1

        return (
          <WordCaption
            key={index}
            from={from}
            durationInFrames={Math.round(durationInFrames)}
            word={word.speech}
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
  const { video, imageMap, fps, script } = inputProps;

  let accumulatedFrames = 0;
  return (
    <>
      <TransitionSeries>
        {imageMap &&
          imageMap.map((image, index) => {
            const durationInFrames =
              Math.round((image.end - image.start) * fps) + fps;
            const from = accumulatedFrames;

            const transitionDuration = fps; // Assuming a fixed transition duration of 30 frames

            // Update accumulatedFrames for the next image
            accumulatedFrames += durationInFrames + transitionDuration;

            const { transform } = generateEffectFilter({
              effect: image?.effect || "ZoomIn",
              currentFrame,
              from,
              durationInFrames,
            });

            return image?.url ? (
              <>
                <TransitionSeries.Sequence durationInFrames={durationInFrames}>
                  <Img
                    src={image?.url}
                    style={{
                      transform,
                    }}
                  />
                </TransitionSeries.Sequence>
                <TransitionSeries.Transition
                  presentation={fade()}
                  timing={linearTiming({ durationInFrames: 30 })}
                />
              </>
            ) : null;
          })}
      </TransitionSeries>

      <TranscriptionCaptions />

      <AbsoluteFill>
        {isLocal || (
          <Audio src={staticFile(`assets/video-${video}-voiceover.mp3`)} />
        )}
        <Audio src={staticFile(`${script?.mood || "deep"}.mp3`)} volume={0.2} />
      </AbsoluteFill>
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
        width={1080}
        height={1920}
        inputProps={inputProps}
      />
    </>
  );
};
