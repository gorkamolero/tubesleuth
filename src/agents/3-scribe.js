import fs from "fs"
import path from "path"
import OpenAI from "openai"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { video } from "../config/config.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
// Initialize OpenAI client
const parsedEnv = dotenv.config().parsed
const apiKey = parsedEnv.OPENAI_API_KEY

if (!apiKey) {
  console.error(
    "OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable."
  )
  process.exit(1)
}

const openai = new OpenAI({
  apiKey,
})
const videopath = `../assets/video-${video}/video-${video}-voiceover.mp3`
// Path to your audio file
const audioFilePath = path.resolve(__dirname, videopath)

// Read the audio file
const audioFile = fs.createReadStream(audioFilePath)

const remapTranscript = (transcript) => {
  return {
    duration: transcript.duration,
    language: transcript.language,
    text: transcript.text,
    segments: transcript.segments.map((segment) => ({
      id: segment.id,
      start: segment.start,
      end: segment.end,
      text: segment.text,
    })),
  }
}

async function transcribeAudio() {
  try {
    // Create a transcription request
    const transcript = await openai.audio.transcriptions.create({
      model: "whisper-1",
      file: audioFile,
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
  } catch (error) {
    console.error("Error in audio transcription:", error)
  }
}

transcribeAudio()
