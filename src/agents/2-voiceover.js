// TODO import script from file

import OpenAI from "openai"
import fs from "fs"
import path from "path"
import dotenv from "dotenv"
import { video } from "../config/config.js"
import { uploadB64Image } from "../firebaseConnector.js"

const loadScript = async () => {
  const filePath = `./src/assets/video-${video}/video-${video}-script.json`
  try {
    const data = await fs.promises.readFile(filePath, "utf-8")
    const script = JSON.parse(data)
    return script.script
  } catch (error) {
    console.error("Error loading script:", error)
  }
}

// Initialize OpenAI client
const apiKey = dotenv.config().parsed.OPENAI_API_KEY

if (!apiKey) {
  console.error(
    "OpenAI API key is not set. Please set the OPENAI_API_KEY environment variable."
  )
  process.exit(1)
}

const openai = new OpenAI({
  apiKey,
})

async function convertTextToSpeech() {
  try {
    const script = await loadScript()
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

    const contentType = "audio/mpeg"

    await uploadB64Image(
      buffer,
      `assets/video-${video}/video-${video}-voiceover.mp3`,
      contentType
    )

    console.log("MP3 file saved to:", tempFile)
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error)
  }
}

convertTextToSpeech()
