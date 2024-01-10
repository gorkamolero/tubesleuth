import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

import { __filename, __dirname } from "../utils/path.js";
import generateCaptions from "../utils/captions.js";

const fps = 30;

function timeToSeconds(time) {
  const [hours, minutes, seconds] = time.split(":").map(parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function renderVideo(inputProps) {
  const { video, script, duration } = inputProps;
  const subtitles = await generateCaptions({ video, script });

  const durationInFrames = parseInt(duration * fps);

  const outputLocation = path.resolve(
    __dirname,
    `../out/videos/video-${video}.mp4`,
  );

  const serveUrl = await bundle({
    entryPoint: path.resolve(__dirname, "../remotion/index.js"),
    webpackOverride: (config) => config,
  });

  const finalProps = {
    ...inputProps,
    durationInFrames,
    subtitles,
    fps,
  };

  const composition = await selectComposition({
    serveUrl,
    id: video,
    inputProps: finalProps,
  });

  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps: finalProps,
    verbose: true,
    timeoutInMilliseconds: 1000 * 60 * 60,
  });

  const output = {
    videoId: video,
    localFile: `src/out/videos/video-${inputProps.video}.mp4`,
  };

  return output;
}
