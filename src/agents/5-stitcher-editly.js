import fs from "fs";
import path from "path";
import editly from "editly";
import axios from "axios";
import sharp from "sharp";

import { createSubtitles } from "../utils/ass.js";
import { generateEffectFilter } from "../utils/generateEffectFilter.js";
import { downloadAndCropImage } from "../utils/downloadAndCropImage.js";
import { uploadFile } from "../utils/firebaseConnector.js";
import { creatomateCaptions } from "../utils/creatomateCaptions.js";
import downloadVideo from "../utils/downloadVideo.js";

const stitchItAllUp = async ({ script, video, imageMap, transcription }) => {
  const dir = `./src/assets/video-${video}`;
  const futureVideoPath = `${dir}/video-${video}-output.mp4`;

  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error("Failed to create directory", err);
  }

  // Prepare Editly edit spec
  const clips = await Promise.all(
    imageMap.map(async (image, index) => {
      const imageURL = decodeURIComponent(image.url);

      const imagePath = `${dir}/video-${video}-image-${index + 1}.png`;

      await downloadAndCropImage({
        url: imageURL,
        path: imagePath,
        width: 1024,
        height: 1920,
      });

      return {
        duration: image.end - image.start,
        layers: [
          {
            type: "image",
            path: imagePath,
            ...generateEffectFilter({
              effect: image.effect,
            }),
          },
        ],
      };
    }),
  );

  const editSpec = {
    outPath: futureVideoPath,
    defaults: {
      transition: {
        duration: 0.5,
        name: "fade",
      },
    },
    width: 1080,
    height: 1920,
    fps: 60,
    clips,
    allowRemoteRequests: false,
    audioTracks: [
      {
        path: path.join(dir, `video-${video}-voiceover.mp3`),
        mixVolume: 1,
        cutFrom: 0,
        start: 0,
      },
      {
        path: "src/utils/deep.mp3",
        mixVolume: 0.5,
        cutFrom: 0,
        start: 0,
      },
      // ...more audio tracks
    ],
  };

  // Run Editly
  try {
    await editly(editSpec);
    console.log("Slideshow created successfully");
  } catch (err) {
    console.error("Error during video editing:", err);
    throw err;
  }

  // Create subtitles file
  await createSubtitles({ video, transcription });

  // Upload to Firebase Storage
  await uploadFile(
    futureVideoPath,
    `assets/video-${video}/video-${video}-output.mp4`,
  );

  // Return video info
  return {
    url: `file://${futureVideoPath}`,
    videoId: video,
    title: script.title,
    description: script.description,
    tags: script.tags,
    script: script.script,
    localFile: futureVideoPath,
  };
};

export default stitchItAllUp;
