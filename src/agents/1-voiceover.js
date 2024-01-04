import fs from "fs";
import fetch from "node-fetch";
import path from "path";
import { uploadB64Image } from "../utils/firebaseConnector.js";
import openai from "../utils/openai.js";
import { config } from "../main.js";
import {
  getRichTextFieldContent,
  readSingleFile,
  updateRichText,
} from "../utils/notionConnector.js";
import getMP3Duration from "get-mp3-duration";
import { cutScript } from "../utils/cutScript.js";

async function createVoiceover({
  video,
  entry,
  script,
  channel,
  force = false,
  redo = false,
}) {
  // Temporary file to store the MP3
  const tempFile = path.resolve(
    `./src/assets/video-${video}/video-${video}-voiceover.mp3`,
  );

  const publicFile = path.resolve(
    `./public/assets/video-${video}-voiceover.mp3`,
  );
  // Ensure the directory exists
  const dir = path.dirname(tempFile);
  await fs.promises.mkdir(dir, { recursive: true });

  let voiceover = readSingleFile({ entry, property: "voiceover" });

  if (voiceover && !force && !redo) {
    // download the file URL to the voiceover var, and return {voiceover, url}
    const url = voiceover;
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    voiceover = buffer;
  } else {
    try {
      // Perform text-to-speech conversion
      const mp3Response = await openai.audio.speech.create({
        model: "tts-1",
        voice: config[channel].voiceModel || "onyx",
        input: script,
      });

      const arrayBuffer = await mp3Response.arrayBuffer();

      const buffer = Buffer.from(arrayBuffer);
      voiceover = buffer;
    } catch (error) {
      console.error("Error in text-to-speech conversion:", error);

      throw error;
    }
  }

  const duration = getMP3Duration(voiceover);

  // if longer than one minute,
  if (duration > 60000) {
    const threadId = getRichTextFieldContent({
      entry,
      property: "threadId",
    });

    const newScript = await cutScript({
      video,
      entry,
      threadId,
      script,
      force: true,
    });

    return createVoiceover({ video, entry, script: newScript, channel });
  }

  await fs.promises.writeFile(tempFile, voiceover);
  await fs.promises.writeFile(publicFile, voiceover);

  const contentType = "audio/mpeg";

  let url = null;
  try {
    url = await uploadB64Image(
      voiceover,
      `assets/video-${video}/video-${video}-voiceover.mp3`,
      contentType,
    );
  } catch (error) {
    console.error("Error uploading voiceover:", error);
  }

  return {
    voiceover,
    url,
  };
}

// createVoiceover()

export default createVoiceover;
