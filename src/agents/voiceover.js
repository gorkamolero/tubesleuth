import OpenAI from "openai"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"
import dotenv from "dotenv"

const video = 1

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

async function convertTextToSpeech(script) {
  try {
    // Temporary file to store the MP3
    const tempFile = path.resolve(
      `./src/assets/video-${video}/video-${video}-voiceover.mp3`
    )
    // Ensure the directory exists
    const dir = path.dirname(tempFile)
    await fs.promises.mkdir(dir, { recursive: true })

    // Perform text-to-speech conversion
    const mp3Response = await openai.audio.speech.create({
      model: "tts-1-hd",
      voice: "onyx",
      input: script,
    })

    const buffer = Buffer.from(await mp3Response.arrayBuffer())
    await fs.promises.writeFile(tempFile, buffer)

    console.log("MP3 file saved to:", tempFile)
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error)
  }
}

// Example script to convert
const script =
  "Have you ever heard the haunting whispers of ancient waters? Long ago, civilizations across the globe shared a chilling tale – a story of a great flood. In the heart of Mesopotamia, the Epic of Gilgamesh spoke of rains that engulfed the world, a narrative eerily mirrored in the biblical story of Noah. Far in the icy realms of the Norse, they too whispered of a massive deluge, where only two of every creature survived. Even the Maya, isolated in their majestic cities, foretold a flood sweeping away the old world. Each story, separated by oceans and centuries, shares an unexplained, sinister similarity. Were these mere myths or did they stem from a catastrophic event lost in time? Dive deep into the abyss of history with me, and we might just uncover the truth. Follow for more unsolved mysteries of the world. But beware, for the waters may pull us back to the beginning, where the haunting whispers first began..."

convertTextToSpeech(script)
