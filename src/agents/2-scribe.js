import fs from "fs";
import path from "path";
import openai from "../utils/openai.js";
import remapTranscript from "../utils/remapTranscript.js";
import { toFile } from "openai";

import { __filename, __dirname } from "../utils/path.js";

async function transcribeAudio(video, userAudioFile) {
  const videopath = `../assets/video-${video}/video-${video}-voiceover.mp3`;

  let audio;

  if (!userAudioFile) {
    // Path to your audio file
    const audioFilePath = path.resolve(__dirname, videopath);

    // Read the audio file
    const audioFile = fs.createReadStream(audioFilePath);

    audio = audioFile;
  } else {
    audio = await toFile(userAudioFile, "audio.mp3", {
      contentType: "audio/mpeg",
    });
  }

  try {
    // Create a transcription request
    const transcript = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audio,
      response_format: "verbose_json",
    });

    const remappedTranscript = remapTranscript(transcript);

    // Define the path for the JSON file
    const jsonFilePath = path.resolve(
      __dirname,
      `../assets/video-${video}/video-${video}-transcript.json`,
    );

    // Ensure the directory exists
    const dir = path.dirname(jsonFilePath);
    await fs.promises.mkdir(dir, { recursive: true });

    // Write the remapped transcript to the JSON file
    await fs.promises.writeFile(
      jsonFilePath,
      JSON.stringify(remappedTranscript, null, 2),
    );

    return remappedTranscript;
  } catch (error) {
    console.error("Error in audio transcription:", error);
  }
}

// transcribeAudio()

export default transcribeAudio;
