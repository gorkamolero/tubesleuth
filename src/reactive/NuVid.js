import React from "react";
import { Image, Segment, Video, useVideo } from "reactive-video";

const fps = 30;
/*
const imageMap = [
  {
    id: 0,
    start: 0,
    end: 12.1,
    description:
      "A swirling gust of wind over the desert sands with the outline of the Pyramids of Giza in the background.",
    effect: "PanRight",
    url: "https%3A%2F%2Foutput.lemonfox.ai%2Fimages%2F924b95e9-ab0c-4d2a-97de-ba9d276c4d01.png",
  },
  */

export default () => {
  const { currentFrame, currentTime, durationFrames, durationTime, userData } =
    useVideo();

  const { imageMap, subtitles } = userData;

  return (
    <div
      style={{
        width: 1080,
        height: 1920,
      }}
    >
      {imageMap.map((image) => {
        return (
          <Segment
            start={image.start}
            duration={image.end - image.start}
            render={(segment) => (
              <Image
                src={decodeURIComponent(image.url)}
                style={{
                  width: "100%",
                  transform: `scale(${
                    1 + (segment.currentFrame / segment.durationFrames) * 0.1
                  })`,
                }}
              />
            )}
          />
        );
      })}

      {subtitles.map((sentence, index) => {
        const sentenceStartTime = sentence[0].startTime;
        const nextSentenceStartTime = subtitles[index + 1]?.[0]?.startTime;
        const sentenceDuration = nextSentenceStartTime
          ? nextSentenceStartTime - sentenceStartTime
          : durationTime - sentenceStartTime;

        const startTime = sentenceStartTime * fps;
        const endTime = (sentenceStartTime + sentenceDuration) * fps;

        return (
          <Segment key={index} start={startTime} duration={endTime}>
            <div
              style={{
                width: "100%",
                height: "100%",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexDirection: "column",
                fontSize: 100,
              }}
            >
              {sentence.map((word) => word.content).join(" ")}
            </div>
          </Segment>
        );
      })}
    </div>
  );
};
