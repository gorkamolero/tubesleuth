import { bundle } from "@remotion/bundler";
import { renderMedia, renderStill, selectComposition } from "@remotion/renderer";
import path from "path";

import { __filename, __dirname } from "../utils/path.js";
import fs from "node:fs/promises";

const fps = 30;

function timeToSeconds(time) {
  const [hours, minutes, seconds] = time.split(":").map(parseFloat);
  return hours * 3600 + minutes * 60 + seconds;
}

export async function renderVideo(inputProps) {
  const { video, duration, voiceoverUrl } = inputProps;
  const subtitles = inputProps.subtitles ?? await (await import("../utils/captions.js")).default({ voiceoverUrl });

  const durationInFrames = Math.ceil(duration * (inputProps.fps || fps));

  const outputLocation = inputProps.outputLocation || path.resolve(
    __dirname,
    `../out/videos/video-${video}.mp4`,
  );

  await fs.mkdir(path.dirname(outputLocation), {recursive: true});
  const serveUrl = await bundle({
    publicDir: inputProps.publicDir,
    entryPoint: path.resolve(__dirname, "../remotion/index.js"),
    webpackOverride: (config) => config,
  });

  const finalProps = {
    ...inputProps,
    durationInFrames,
    subtitles,
    fps: inputProps.fps || fps,
  };

  const composition = await selectComposition({
    serveUrl,
    id: video,
    browserExecutable: inputProps.browserExecutable,
    inputProps: finalProps,
  });

  if (inputProps.stillFrame !== undefined) {
    await renderStill({composition, serveUrl, output: outputLocation, inputProps: finalProps,
      frame: inputProps.stillFrame, scale: inputProps.scale || 1,
      browserExecutable: inputProps.browserExecutable});
    return {videoId: video, localFile: outputLocation};
  }

  let reportedProgress = -1;
  await renderMedia({
    composition,
    serveUrl,
    codec: "h264",
    outputLocation,
    inputProps: finalProps,
    browserExecutable: inputProps.browserExecutable,
    scale: inputProps.scale || 1,
    concurrency: inputProps.concurrency ?? 2,
    verbose: false,
    timeoutInMilliseconds: 1000 * 60 * 60,
    onProgress: ({progress}) => {
      const step = Math.floor(progress * 10);
      if (step > reportedProgress) {
        reportedProgress = step;
        console.log(`${video}: ${step * 10}% rendered`);
      }
    },
  });

  const output = {
    videoId: video,
    localFile: outputLocation,
  };

  return output;
}
