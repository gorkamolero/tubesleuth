import fs from "fs";
import path from "path";
import { uploadB64Image } from "../utils/firebaseConnector.js";
import { loadScript } from "../utils/loadScript.js";
import openai from "../utils/openai.js";
import { config } from "../main.js";

async function createVoiceover(video, userScript, channel) {
  try {
    let script = userScript.script;
    if (!userScript) {
      script = await loadScript(video);
    }
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

    // Perform text-to-speech conversion
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: config[channel].voiceModel || "onyx",
      input: script,
    });

    const arrayBuffer = await mp3Response.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(tempFile, buffer);
    await fs.promises.writeFile(publicFile, buffer);

    const contentType = "audio/mpeg";

    let url = null;
    try {
      url = await uploadB64Image(
        buffer,
        `assets/video-${video}/video-${video}-voiceover.mp3`,
        contentType,
      );
    } catch (error) {
      console.error("Error uploading voiceover:", error);
    }

    return {
      voiceover: buffer,
      url,
    };
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error);

    throw error;
  }
}

// createVoiceover()

export default createVoiceover;
