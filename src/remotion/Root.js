import React from "react";
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

const testProps = {
  video: "59ffd6b9-1e41-47a7-ac1e-ac2740c0597f",
  imageMap: [
    {
      id: 0,
      start: 0,
      end: 6.36,
      description:
        "Vintage illustration of a mystical figure resembling Hermes Trismegistus amidst ancient symbols",
      effect: "ZoomIn",
    },
    {
      id: 1,
      start: 6.36,
      end: 13,
      description:
        "Silhouettes whispering in a dark, candlelit corridor with alchemical symbols on the walls",
      effect: "PanLeft",
    },
    {
      id: 2,
      start: 13,
      end: 18.96,
      description:
        "An array of secret codes and cryptic texts laid out on a table with a flickering lantern",
      effect: "ZoomOut",
    },
    {
      id: 3,
      start: 18.96,
      end: 27.84,
      description:
        "A seeker at the crossroads of multiple realms, a faint figure of Hermes visible in the sky above",
      effect: "PanUp",
    },
    {
      id: 4,
      start: 27.84,
      end: 32.72,
      description:
        "Close-up of an ancient scroll being unrolled, revealing astrological charts and alchemical symbols",
      effect: "PanRight",
    },
    {
      id: 5,
      start: 32.72,
      end: 39.92,
      description:
        "A mysterious hand laying out tarot cards on a stone table, with the Wheel of Fortune card prominent",
      effect: "PanDown",
    },
    {
      id: 6,
      start: 39.92,
      end: 46.36,
      description:
        "An open book with the emblem of Hermes, surrounded by light rays, suggesting the revelation of secrets",
      effect: "ZoomIn",
    },
  ],
  transcription: {
    duration: 45.55,
    language: "english",
    text: "Ever wonder where modern mysticism got its roots? Three words, Hermes, Trismegistus. This ancient figure's teachings, whispered through the corridors of time, echo in today's occult and New Age movements. But what if everything you believed was rooted in secrets, codes hidden in plain sight, leading those who seek to a different reality? Followers of Hermes, the thrice great, seek the truth behind the veil, as above, so below. This knowledge, shrouded in mystery, paved the way for alchemy, astrology, and even the enigmatic tarot. It's time to question what's been told. What if what you've been told is all a lie? Follow to discover the truth, and perhaps you, too, will uncover the secrets of Hermes' legacy.",
    segments: [
      {
        id: 0,
        start: 0,
        end: 3.12,
        text: " Ever wonder where modern mysticism got its roots?",
      },
      {
        id: 1,
        start: 3.12,
        end: 6.36,
        text: " Three words, Hermes, Trismegistus",
      },
      {
        id: 2,
        start: 6.36,
        end: 8.28,
        text: " This ancient figure's teachings, whispered",
      },
      {
        id: 3,
        start: 8.28,
        end: 11.4,
        text: " through the corridors of time, echo in today's occult",
      },
      {
        id: 4,
        start: 11.4,
        end: 13,
        text: " and New Age movements",
      },
      {
        id: 5,
        start: 13,
        end: 15.48,
        text: " But what if everything you believed",
      },
      {
        id: 6,
        start: 15.48,
        end: 18.96,
        text: " was rooted in secrets, codes hidden in plain sight",
      },
      {
        id: 7,
        start: 18.96,
        end: 21.32,
        text: " leading those who seek to a different reality?",
      },
      {
        id: 8,
        start: 21.32,
        end: 23.8,
        text: " Followers of Hermes, the thrice great",
      },
      {
        id: 9,
        start: 23.8,
        end: 27.84,
        text: " seek the truth behind the veil, as above, so below",
      },
      {
        id: 10,
        start: 27.84,
        end: 29.84,
        text: " This knowledge, shrouded in mystery",
      },
      {
        id: 11,
        start: 29.84,
        end: 32.72,
        text: " paved the way for alchemy, astrology, and even",
      },
      {
        id: 12,
        start: 32.72,
        end: 34.76,
        text: " the enigmatic tarot",
      },
      {
        id: 13,
        start: 34.76,
        end: 37.68,
        text: " It's time to question what's been told",
      },
      {
        id: 14,
        start: 37.68,
        end: 39.92,
        text: " What if what you've been told is all a lie?",
      },
      {
        id: 15,
        start: 39.92,
        end: 42.88,
        text: " Follow to discover the truth, and perhaps you, too",
      },
      {
        id: 16,
        start: 42.88,
        end: 46.36,
        text: " will uncover the secrets of Hermes' legacy",
      },
    ],
  },
  durationInFrames: 1420,
  fps: 30,
  script: {
    mood: "deep",
  },
};

const ImageComp = ({
  from,
  durationInFrames,
  currentFrame,
  video,
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
      durationInFrames={isLast ? durationInFrames : durationInFrames + 30}
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

const WordCaption = ({ from, durationInFrames, word, activeWordIndex }) => {
  const words = word.split(" ");
  const priorWords = words.slice(0, activeWordIndex).join(" ");
  const activeWord = words[activeWordIndex];
  const unspokenWords = words.slice(activeWordIndex + 1).join(" ");

  return (
    <Sequence from={from - 10} durationInFrames={durationInFrames + 2}>
      <div
        style={{
          ...captionStylesModern,
          position: "absolute",
          bottom: 50,
          width: "100%",
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          alignItems: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            gap: 2,
            textAlign: "center",
          }}
        >
          <span style={{ color: "white" }}>{priorWords} </span>
          <span style={{ color: "yellow" }}>{activeWord} </span>
          <span style={{ color: "transparent", opacity: 0 }}>
            {unspokenWords}
          </span>
        </div>
      </div>
    </Sequence>
  );
};

const TranscriptionCaptions = () => {
  const inputProps = getInputProps() ? getInputProps() : testProps;
  const { transcription, fps } = inputProps;
  const [keyframes, setKeyframes] = React.useState([]);

  React.useEffect(() => {
    const segments = transcription.segments;
    const newKeyframes = [];

    for (const segment of segments) {
      const startTime = segment.start;
      const endTime = segment.end;
      const words = segment.text.split(" ");

      for (let i = 0; i < words.length; i++) {
        newKeyframes.push({
          text: segment.text,
          time: startTime + ((endTime - startTime) / words.length) * i,
          activeWordIndex: i,
        });
      }
    }

    setKeyframes(newKeyframes);
  }, [transcription, fps]);

  return (
    <>
      {keyframes.map((keyframe, index) => {
        const from = keyframe.time * fps;
        const durationInFrames =
          (keyframes[index + 1]?.time - keyframe.time || 0.5) * fps;

        return (
          <WordCaption
            key={index}
            from={Math.round(from)}
            durationInFrames={Math.round(durationInFrames)}
            word={keyframe.text}
            activeWordIndex={keyframe.activeWordIndex}
          />
        );
      })}
    </>
  );
};

const Vid = () => {
  const currentFrame = useCurrentFrame();
  const inputProps = getInputProps() ? getInputProps() : testProps;
  const { video, imageMap, fps, script } = inputProps;

  let accumulatedFrames = 0;
  return (
    <>
      {imageMap.map((image, index) => {
        const durationInFrames = parseInt(image.end * fps - image.start * fps);
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

      <TranscriptionCaptions inputProps={inputProps} />

      <AbsoluteFill>
        <Audio src={staticFile(`assets/video-${video}-voiceover.mp3`)} />
        <Audio src={staticFile(`${script.mood}.mp3`)} volume={0.2} />
      </AbsoluteFill>
    </>
  );
};

export const RemotionRoot = () => {
  const inputProps = getInputProps() ? getInputProps() : testProps;
  return (
    <>
      <Composition
        id={inputProps.video}
        component={Vid}
        durationInFrames={inputProps.durationInFrames}
        fps={inputProps.fps}
        width={1080}
        height={1920}
        inputProps={inputProps}
      />
    </>
  );
};
