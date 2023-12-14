import fs from "fs"
import path from "path"
import OpenAI from "openai"
import { uploadB64Image } from "../firebaseConnector.js"
import dotenv from "dotenv"
import { fileURLToPath } from "url"
import { Buffer } from "buffer"

import { video } from "../config/config.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const apiKey = dotenv.config().parsed.OPENAI_API_KEY

async function loadDescriptions(videoNumber) {
  const filePath = path.resolve(
    __dirname,
    `../assets/video-${videoNumber}/video-${videoNumber}-imagemap.json`
  )
  const data = await fs.promises.readFile(filePath, "utf-8")
  const segments = JSON.parse(data)

  const descriptions = segments.map((segment) => segment.description)

  return descriptions
}

const openai = new OpenAI({
  apiKey,
})

async function generateAndUploadImage(videoNumber, description, index) {
  try {
    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt: `NEVER USE TEXT / ONLY ONE IMAGE / PHOTORREALISTIC - ${description}`,
      n: 1,
      size: "1024x1024",

      // b64_json or url
      response_format: "b64_json",
    })

    const image_b64 = response.data[0].b64_json

    const bufferObj = Buffer.from(image_b64, "base64")

    await uploadB64Image(
      bufferObj,
      `assets/video-${videoNumber}/video-${videoNumber}-image-${index}.png`
    )

    console.log(`Image ${index} generated:`)

    // write this image to a local file, too
    const tempFile = path.resolve(
      __dirname,
      `../assets/video-${videoNumber}/video-${videoNumber}-image-${index}.png`
    )

    // Ensure the directory exists
    const dir = path.dirname(tempFile)
    await fs.promises.mkdir(dir, { recursive: true })

    await fs.promises.writeFile(tempFile, bufferObj)
  } catch (error) {
    console.error("Error generating image:", error)
  }
}

async function generateImagesFromDescriptions(videoNumber) {
  const descriptions = await loadDescriptions(videoNumber)

  let index = 0
  for (const description of descriptions) {
    index++
    generateAndUploadImage(videoNumber, description, index)

    // Wait 10 seconds between each request
    await new Promise((resolve) => setTimeout(resolve, 10000))
  }
}

generateImagesFromDescriptions(video)
