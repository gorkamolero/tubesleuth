import OpenAI from "openai"
import fs from "fs"
import path from "path"
import { v4 as uuidv4 } from "uuid"

// Initialize OpenAI client
const apiKey = process.env.OPENAI_API_KEY

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
    // Perform text-to-speech conversion
    const mp3Response = await openai.audio.speech.create({
      model: "canary-tts",
      voice: "onyx",
      input: script,
    })

    // Temporary file to store the MP3
    const tempFile = path.resolve("./" + uuidv4() + ".mp3")
    const buffer = Buffer.from(await mp3Response.arrayBuffer())
    await fs.promises.writeFile(tempFile, buffer)

    console.log("MP3 file saved:", tempFile)
  } catch (error) {
    console.error("Error in text-to-speech conversion:", error)
  }
}

// Example script to convert
const script =
  "It was May 6, 2010, a seemingly ordinary day in the stock market, until suddenly, at 2:45 PM, an unprecedented event occurred. The Dow Jones Industrial Average plummeted, losing over a thousand points in mere minutes. This shocking moment, later known as the 'Flash Crash,' had traders and investors worldwide staring at their screens in disbelief. How could billions of dollars vanish so quickly? The cause? A tangled web of automated high-frequency trading algorithms. They had spiraled out of control, triggering a domino effect. But just as suddenly as it fell, the market began to recover. By the end of the day, most of the losses had been recouped, leaving everyone puzzled. What lessons were learned from this digital age anomaly? Could it happen again? Follow for more moments in stock history. And remember, in the world of stocks, what goes down might just come back up, just like the story of the Flash Crash of 2010..."

convertTextToSpeech(script)
