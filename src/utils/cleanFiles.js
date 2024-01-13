import fs from "fs";
import path from "path";
import { __dirname } from "./path.js";

export default async function cleanFiles(video) {
  const publicpathmp3 = `../../public/assets/video-${video}-voiceover.mp3`;
  const publicpathwav = `../../public/assets/video-${video}-voiceover.wav`;

  // delete file
  await fs.promises.rm(path.resolve(__dirname, publicpathmp3), {
    recursive: true,
    force: true,
  });
  await fs.promises.rm(path.resolve(__dirname, publicpathwav), {
    recursive: true,
    force: true,
  });
}
