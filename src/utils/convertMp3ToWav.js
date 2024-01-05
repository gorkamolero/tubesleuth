import fs from "fs";
import path from "path";
import ffmpeg from "fluent-ffmpeg";
import { __filename, __dirname } from "./path.js";

async function convertMp3ToWav(video) {
  const tempFile = path.resolve(
    __dirname,
    `../out/voiceovers/video-${video}-voiceover.mp3`,
  );

  const publicOutput = path.resolve(
    __dirname,
    `../../public/assets/video-${video}-voiceover.wav`,
  );

  return new Promise((resolve, reject) => {
    ffmpeg()
      .input(tempFile)
      .inputFormat("mp3")
      .audioFrequency(16000)
      .outputFormat("wav")
      .saveToFile(publicOutput)
      .on("end", (output) => {
        resolve();
      })
      .on("error", (error) => {
        reject(error);
      });
  });
}

export default convertMp3ToWav;
