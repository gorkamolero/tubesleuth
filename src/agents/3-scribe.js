import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import openai from "../utils/openai"
import remapTranscript from "../utils/remapTranscript.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function transcribeAudio(video, userAudioFile) {
  const videopath = `../assets/video-${video}/video-${video}-voiceover.mp3`
  // Path to your audio file
  const audioFilePath = path.resolve(__dirname, videopath)

  // Read the audio file
  const audioFile = fs.createReadStream(audioFilePath)

  let audio = userAudioFile ? userAudioFile : audioFile
  try {
    // Create a transcription request
    const transcript = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audio,
      response_format: "verbose_json",
    })

    const remappedTranscript = remapTranscript(transcript)

    // Define the path for the JSON file
    const jsonFilePath = path.resolve(
      __dirname,
      `../assets/video-${video}/video-${video}-transcript.json`
    )

    // Ensure the directory exists
    const dir = path.dirname(jsonFilePath)
    await fs.promises.mkdir(dir, { recursive: true })

    // Write the remapped transcript to the JSON file
    await fs.promises.writeFile(
      jsonFilePath,
      JSON.stringify(remappedTranscript, null, 2)
    )

    console.log("Transcription:", remappedTranscript)

    return remappedTranscript
  } catch (error) {
    console.error("Error in audio transcription:", error)
  }
}

// transcribeAudio()

export default transcribeAudio
