import fs from "fs";
import path from "path";
import { uploadB64Image } from "../utils/firebaseConnector.js";
import { Buffer } from "buffer";
import openai, { askAssistant, regenerateSafePrompt } from "../utils/openai.js";
import loadDescriptions from "../utils/loadDescriptions.js";
import terminalImage from "terminal-image";
import { imageStyle } from "../config/config.js";

import { __filename, __dirname } from "../utils/path.js";
import processEnv from "../utils/env.js";

async function generateImageWithLemonFox(description, retryCount = 3) {
  try {
    const response = await fetch(
      "https://api.lemonfox.ai/v1/images/generations",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${processEnv.LEMONFOX_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          prompt: description,
          negative_prompt: "NEVER USE TEXT",
        }),
      },
    );
    const { data } = await response.json();
    const url = data[0].url;
    return url;
  } catch (error) {
    if (retryCount > 0) {
      console.log(
        `Retrying generateImageWithLemonFox, attempts left: ${retryCount - 1}`,
      );
      return generateImageWithLemonFox(description, retryCount - 1);
    } else {
      throw error;
    }
  }
}

async function generateImageWithOpenAI(description) {
  return await openai.images.generate({
    model: "dall-e-3",
    prompt: `NEVER USE TEXT / ONLY ONE IMAGE / ${imageStyle} - ${description}`,
    n: 1,
    size: "1024x1792",
    response_format: "b64_json",
  });
}

async function generateAndUploadImage(
  video,
  description,
  index,
  lemon = false,
) {
  try {
    let url;
    const trueDescription = await askAssistant({
      assistant_id: processEnv.ASSISTANT_PHOTOGRAPHER,
      instruction: `create a prompt for: `,
      prompt: description,
      isJSON: false,
    });

    if (lemon) {
      url = await generateImageWithLemonFox(trueDescription);
    } else {
      const response = await generateImageWithOpenAI(trueDescription);
      const image_b64 = response.data[0].b64_json;

      const bufferObj = Buffer.from(image_b64, "base64");

      await uploadB64Image(
        bufferObj,
        `assets/video-${video}/video-${video}-image-${index}.png`,
      );

      url = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fvideo-${video}%2Fvideo-${video}-image-${index}.png?alt=media`;

      console.log(`Image ${index} generated:`);

      try {
        console.log(await terminalImage.buffer(bufferObj));
      } catch (error) {}

      // write this image to a local file, too
      const tempFile = path.resolve(
        __dirname,
        `../assets/video-${video}/video-${video}-image-${index}.png`,
      );

      // Ensure the directory exists
      const dir = path.dirname(tempFile);
      await fs.promises.mkdir(dir, { recursive: true });

      await fs.promises.writeFile(tempFile, bufferObj);
    }

    return url;
  } catch (error) {
    // if error.code content_policy_violation, regenerate with adjusted prompt
    if (error.code === "content_policy_violation") {
      let safePrompt = await regenerateSafePrompt(description);

      return generateAndUploadImage(video, safePrompt, index);
    }
    console.error("Error generating image:", error);
  }
}

const descriptMap = (imageMap) =>
  imageMap.map((description) => description.description);

async function generateImagesFromDescriptions({
  video,
  imageMap,
  lemon = false,
}) {
  try {
    const descriptions = imageMap
      ? descriptMap(imageMap)
      : await loadDescriptions(video);

    // Generate and upload images in parallel
    const urls = await Promise.all(
      descriptions.map((description, index) =>
        generateAndUploadImage(video, description, index + 1, lemon),
      ),
    );

    return urls;
  } catch (error) {
    console.error(error);

    return false;
  }
}

export default generateImagesFromDescriptions;
