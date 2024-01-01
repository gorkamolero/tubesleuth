import { bundle } from "@remotion/bundler";
import { renderMedia, selectComposition } from "@remotion/renderer";
import path from "path";

import { __filename, __dirname } from "../utils/path.js";
import generateCaptions from "../utils/captions.js";
import { getRichTextFieldContent } from "../utils/notionConnector.js";

const fps = 30;

export async function renderVideo(inputProps) {
  const { video, transcription, entry, script } = inputProps;
  const subtitles = await generateCaptions({
    video,
    transcription,
  });
  const duration =
    transcription.segments[transcription.segments.length - 1].end + 1;
  const durationInFrames = parseInt(duration * fps);

  const outputLocation = path.resolve(`./src/out/videos/video-${video}.mp4`);

  const serveUrl = await bundle({
    entryPoint: path.resolve("./src/remotion/index.js"),
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
    verbose: false,
  });

  const title = await getRichTextFieldContent({
    entry,
    property: "title",
  });

  const description = await getRichTextFieldContent({
    entry,
    property: "description",
  });

  const tags = await getRichTextFieldContent({
    entry,
    property: "tags",
  });

  const output = {
    videoId: video,
    title: title,
    description,
    tags,
    script,
    localFile: `src/out/videos/video-${inputProps.video}.mp4`,
  };

  return output;
}