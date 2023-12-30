import Editor from "@reactive-video/builder";
import { computeExecutablePath } from "@puppeteer/browsers";
import { height, width } from "../config/config.js";
import { generateCaptionsForReactive } from "../utils/captions.js";

const reactVideo = "src/reactive/NuVid.js";

const video = "7678448e-c1ce-4840-a42c-91d960ecf1c4";

const userData = { video };

const editor = Editor({
  ffmpegPath: "ffmpeg",
  ffprobePath: "ffprobe",
  browserExePath: computeExecutablePath,
  devMode: true,
});

export const createReactiveVideo = async ({
  video,
  imageMap,
  transcription,
}) => {
  const subtitles = await generateCaptionsForReactive({
    video,
    transcription,
  });
  const userData = {
    video,
    imageMap,
    subtitles,
  };

  await editor.preview({
    reactVideo,
    width,
    height,
    durationFrames: 1800,
    fps: 30,
    userData,
  });
};
