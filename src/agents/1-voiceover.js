import fs from "fs";
import path from "path";
import { uploadB64Image } from "../utils/firebaseConnector.js";
import { loadScript } from "../utils/loadScript.js";
import openai from "../utils/openai.js";

async function createVoiceover(video, userScript) {
  try {
    let script = userScript.script;
    if (!userScript) {
      script = await loadScript(video);
    }
    // Temporary file to store the MP3
    const tempFile = path.resolve(
      `./src/assets/video-${video}/video-${video}-voiceover.mp3`,
    );

    // Ensure the directory exists
    const dir = path.dirname(tempFile);
    await fs.promises.mkdir(dir, { recursive: true });

    // Perform text-to-speech conversion
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "onyx",
      input: script,
    });

    const arrayBuffer = await mp3Response.arrayBuffer();

    const buffer = Buffer.from(arrayBuffer);
    await fs.promises.writeFile(tempFile, buffer);

    const contentType = "audio/mpeg";

    await uploadB64Image(
      buffer,
      `assets/video-${video}/video-${video}-voiceover.mp3`,
      contentType,
    );

    return buffer;
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error);
  }
}

// createVoiceover()

export default createVoiceover;
