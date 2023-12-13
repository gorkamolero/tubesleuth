import OpenAI from "openai"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"
import dotenv from "dotenv"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Initialize OpenAI client
const parsedEnv = dotenv.config().parsed
const apiKey = parsedEnv.OPENAI_KEY_2

if (!apiKey) {
  console.error(
    "OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable."
  )
  process.exit(1)
}

const openai = new OpenAI({
  apiKey,
})
console.log(process.cwd())
console.log(__dirname)
// Path to your audio file
const audioFilePath = path.resolve(
  __dirname,
  "../assets/5675035d-78c5-4468-9175-e52b448de6fa.mp3"
)

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

    console.log("Transcription:", remappedTranscript)
  } catch (error) {
    console.error("Error in audio transcription:", error)
  }
}

transcribeAudio()
