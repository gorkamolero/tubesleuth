import path from "path";
import https from "https";
import fs from "fs";

import { __filename, __dirname } from "../utils/path.js";

export const backgroundMusicFFMPEG = (choice) => {
  return new Promise((resolve, reject) => {
    const firebasepath = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fmusic%2F`;
    const choices = {
      powerful: `${firebasepath}powerful.mp3?alt=media`,
      mysterious: `${firebasepath}mysterious.mp3?alt=media`,
      sentimental: `${firebasepath}sentimental.mp3?alt=media`,
      interesting: `${firebasepath}interesting.mp3?alt=media`,
      deep: `${firebasepath}deep.mp3?alt=media`,
      epic: `${firebasepath}epic.mp3?alt=media`,
    };
    const backgroundMusic = choices[choice] || choices.deep;
    const outputPath = path.join(__dirname, `${choice}.mp3`);
    const relativePath = path.relative(process.cwd(), outputPath);

    const file = fs.createWriteStream(outputPath);
    https
      .get(backgroundMusic, function (response) {
        response.pipe(file);
        file.on("finish", function () {
          file.close(() => resolve(relativePath));
        });
      })
      .on("error", (err) => {
        fs.unlink(outputPath);
        reject(err.message);
      });
  });
};
