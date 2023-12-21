import fs from "fs";
import path from "path";
import { uploadB64Image } from "../utils/firebaseConnector.js";
import { loadScript } from "../utils/loadScript.js";
import openai from "../utils/openai.js";

async function createVoiceover(video, userScript) {
  /* let voiceover = {};
  try {
    const existsVoiceover = await fs.promises.readFile(
      `src/assets/video-${video}/video-${video}-voiceover.mp3`,
      "utf-8",
    );

    if (existsVoiceover) {
      console.log("📝 Voiceover exists, skipping");
      const firebasePath = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets`;

      const url = `${firebasePath}/video-${video}%2Fvideo-${video}-voiceover.mp3?alt=media`;
      return {
        voiceover: existsVoiceover,
        url,
      };
    }
  } catch (error) {} */
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

    const url = await uploadB64Image(
      buffer,
      `assets/video-${video}/video-${video}-voiceover.mp3`,
      contentType,
    );

    return {
      voiceover: buffer,
      url,
    };
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error);
  }
}

// createVoiceover()

export default createVoiceover;
