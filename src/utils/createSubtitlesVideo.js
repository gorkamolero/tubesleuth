import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import { captionStyles } from "../config/config.js";

export const createSubtitlesVideo = async ({ video }) => {
  let assFilePath = `src/assets/video-${video}/video-${video}-subtitles.ass`;
  // assFilePath = "src/utils/default.ass";
  const vidPath = `src/assets/video-${video}/video-${video}-output.mp4`;
  const subVidPath = `src/assets/video-${video}/video-${video}-with-subtitles.mp4`;

  ffmpeg(vidPath)
    .outputOptions(
      `-vf subtitles=${assFilePath}:force_style='FontName=${captionStyles.fontFamily},FontSize=${captionStyles.fontSize}'`,
    )
    .output(subVidPath)
    .on("end", () => console.log("Video created"))
    .on("error", (err) => console.log("An error occurred: " + err.message))
    .run();
};
