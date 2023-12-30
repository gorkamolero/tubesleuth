import React from "react";
import { Image, Segment, Video, useVideo } from "reactive-video";

export default () => {
  const { currentFrame, currentTime, durationFrames, durationTime } =
    useVideo();

  return (
    <>
      {/* This segment lasts for 30 frames. Print out the current frame number */}
      <Segment duration={30}>
        <div
          style={{
            width: "100%",
            height: "100%",
            backgroundColor: `hsl(${(currentFrame * 10) % 360}deg 78% 37%)`,
            color: "white",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexDirection: "column",
            fontSize: 100,
          }}
        >
          Current frame {currentFrame}
        </div>
      </Segment>

      {/* This segment starts from 60 frames. Shows an image with a Ken Burns zoom effect */}
      <Segment
        start={30}
        duration={30}
        render={(segment) => (
          <Image
            src="https://static.mifi.no/losslesscut/47320816_571610306620180_5860442193520120371_n.jpg"
            style={{
              width: "100%",
              transform: `scale(${
                1 + (segment.currentFrame / segment.durationFrames) * 0.1
              })`,
            }}
          />
        )}
      />

      {/* This segment starts from 60 frames. Starts 100 frames into the source video (seek to) */}
      <Segment start={60}>
        <Segment start={-100}>
          <Video
            src="https://static.mifi.no/Zv5RvLhCz4M-small.mp4"
            style={{ width: "100%" }}
          />
        </Segment>
      </Segment>
    </>
  );
};
