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

import { captionStylesModern } from "../config/config.js";
import { generateEffectFilter } from "../utils/generateEffectFilter.js";
import { testProps } from "../config/testProps.js";

let isLocal = false;

function convertTimeToFrames(time, fps) {
  const [hours, minutes, seconds] = time.split(':').map(parseFloat);
  return Math.round((hours * 3600 + minutes * 60 + seconds) * fps);
}

const ImageComp = ({
  from,
  durationInFrames,
  currentFrame,
  index,
  totalImages,
  effect = "ZoomIn",
  url,
}) => {
  // Calculate the opacity based on the current frame
  let opacity = 1;
  const isFirst = index === 0;
  const isLast = index === totalImages - 1;
  if (!isFirst && currentFrame < from + 15) {
    opacity = (currentFrame - from + 15) / 15;
  } else if (!isLast && currentFrame > from + durationInFrames - 15) {
    opacity = 1 - (currentFrame - from - durationInFrames + 15) / 15;
  }

  const { transform } = generateEffectFilter({
    effect,
    currentFrame,
    from,
    durationInFrames,
  });

  return (
    <Sequence
      from={isFirst ? from : from - 15}
      durationInFrames={durationInFrames + 30}
    >
      <AbsoluteFill>
        <Img
          src={url}
          style={{
            objectFit: "cover",
            objectPosition: "center",
            height: "100%",
            opacity: opacity,
            transform,
            transition: "opacity 0.5s",
          }}
        />
      </AbsoluteFill>
    </Sequence>
  );
};

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
      {imageMap &&
        imageMap.map((image, index) => {
          const durationInFrames = parseInt(
            image.end * fps - image.start * fps,
          );
          const from = accumulatedFrames;

          // Update accumulatedFrames for the next image
          accumulatedFrames += durationInFrames;

          return (
            <ImageComp
              key={index}
              video={video}
              index={index}
              from={from - 1}
              durationInFrames={durationInFrames}
              currentFrame={currentFrame}
              totalImages={imageMap.length}
              effect={image.effect}
              url={image.url}
            />
          );
        })}

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
