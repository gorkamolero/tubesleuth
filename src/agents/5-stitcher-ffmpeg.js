import fs from "fs";
import ffmpeg from "fluent-ffmpeg";
import path from "path";
import { exec } from "child_process";

import { backgroundMusicFFMPEG } from "../utils/backgroundMusicFFMPEG.js";
import { createSubtitles } from "../utils/ass.js";

const stitchItAllUp = async ({
  script,
  video,
  imageMap,
  transcription,
  skipIfLocalExists = false,
}) => {
  const dir = `./src/assets/video-${video}`;

  const futureVideoPath = `${dir}/video-${video}-output.mp4`;

  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error("Failed to create directory", err);
  }

  await createSubtitles({ video, transcription });

  let command = ffmpeg();
  let filterComplex = "";
  let previousIndex = null;

  console.log("imageMap:", imageMap);

  for (const [index, image] of imageMap.entries()) {
    const duration = image.end - image.start;
    const imagePath = `${dir}/video-${video}-image-${index + 1}.png`;
    command = command
      .input(imagePath)
      .inputOptions([`-loop 1`, `-t ${duration}`]);

    if (previousIndex !== null) {
      filterComplex += `[${previousIndex}][${index}:v]xfade=duration=1:offset=${image.start}[f${index}]; `;
    } else {
      previousIndex = `${index}:v`;
    }
  }

  if (previousIndex === null) {
    console.error("No streams were created");
    return;
  }

  await new Promise((resolve, reject) => {
    command;
    complexFilter(filterComplex)
      .outputOptions([
        `-map "[${previousIndex}]`,
        `-c:v libx264`,
        `-pix_fmt yuv420p`,
      ])
      .output(futureVideoPath)
      .on("end", resolve)
      .on("error", function (err) {
        console.log("An error occurred: " + err.message);
        reject(err);
      })
      .run();
  });

  // Ensure the concat file exists and is correctly formatted
  if (!fs.existsSync(futureVideoPath)) {
    console.error("Video file does not exist or is not formatted correctly");
    return;
  }

  const voiceoverPath = path.join(dir, `video-${video}-voiceover.mp3`); // adjust this to your voiceover file path
  // Get the background music

  const backgroundMusicPath = await backgroundMusicFFMPEG(
    script?.mood || "deep",
  );

  const subtitlePath = path.join(dir, `video-${video}-subtitles.ass`);

  const command2 = ffmpeg()
    .input(voiceoverPath)
    .input(backgroundMusicPath)
    .complexFilter([
      {
        filter: "volume",
        options: ["1.2"],
        inputs: "0:0",
        outputs: "[s1]",
      },
      {
        filter: "volume",
        options: ["0.2"],
        inputs: "1:0",
        outputs: "[s2]",
      },
      {
        filter: "amix",
        options: ["duration=first", "dropout_transition=0"],
        inputs: ["[s1]", "[s2]"],
      },
    ])
    .input(futureVideoPath)
    .videoFilters([
      {
        filter: "subtitles",
        options: [subtitlePath],
        inputs: "[v]",
        outputs: "[vo]",
      },
    ])
    .outputOptions("-framerate 60")
    .outputOptions("-vf crop=2160:3840")
    .output(futureVideoPath)
    .on("end", function () {
      console.log("Finished processing");
    })
    .on("error", function (err) {
      console.log("An error occurred: " + err.message);
    });

  command2.run();

  return new Promise((resolve, reject) => {
    command2.on("end", () => {
      resolve({
        url: `file://${futureVideoPath}`,
        videoId: video,
        title: script.title,
        description: script.description,
        tags: script.tags,
        script: script.script,
        localFile: futureVideoPath,
      });
    });

    command2.on("error", (error) => {
      reject(error);
    });
  });
};

export default stitchItAllUp;
