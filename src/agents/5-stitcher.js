import Creatomate from "creatomate";
import fs from "fs";

import { backgroundMusicCreatomate } from "../utils/backgroundMusicCreatomate.js";
import { voiceOver } from "../utils/voiceOver.js";
import { convertImageMapToCreatomate } from "../utils/convertImageMapToCreatomate.js";
import generateCaptions from "../utils/captions.js";
import { captionStyles, height, width } from "../config/config.js";
import { uploadToFirestore } from "../utils/firebaseConnector.js";
import processEnv from "../utils/env.js";

const apiKey = processEnv.CREATOMATE_API_KEY;

const client = new Creatomate.Client(apiKey);

const stitchItAllUp = async ({ script, video, imageMap, transcription }) => {
  try {
    const { keyframes, duration } = await generateCaptions(
      video,
      transcription,
    );

    const images = imageMap;

    const elements = [
      ...convertImageMapToCreatomate({ script, images, video }),
      backgroundMusicCreatomate(script?.mood || "deep"),
      voiceOver(video),
      new Creatomate.Text({
        ...captionStyles,
        text: keyframes,
      }),
    ];

    const source = new Creatomate.Source({
      outputFormat: "mp4",
      frameRate: 30,
      width,
      height,
      duration,
      elements,
    });

    const response = await client.render({
      source,
    });

    const url = response[0].url;

    const dir = `./src/assets/video-${video}`;

    try {
      await fs.promises.mkdir(dir, { recursive: true });
    } catch (err) {
      console.error("Failed to create directory", err);
    }

    try {
      await fs.promises.writeFile(`${dir}/video-${video}-url.txt`, url);
    } catch (err) {
      console.error("Failed to write file", err);
    }

    await uploadToFirestore({
      video,
      ...script,
      url,
    });

    const output = {
      url,
      videoId: video,
      title: script.title,
      description: script.description,
      tags: script.tags,
      script: script.script,
    };

    // TODO: upload to firestore and try to download video to local

    try {
      const response = await fetch(url);
      const buffer = await response.arrayBuffer();
      await fs.promises.writeFile(
        `${dir}/video-${video}-output.mp4`,
        Buffer.from(buffer),
      );
    } catch (error) {
      console.error("Failed to download file", error);
    }

    return output;
  } catch (error) {
    console.error(error);
  }
};

export default stitchItAllUp;
