import fs from "fs"
import path from "path"
import { uploadB64Image } from "../firebaseConnector.js"
import { fileURLToPath } from "url"
import { Buffer } from "buffer"
import openai from "../utils/openai.js"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function generateAndUploadImage(video, description, index) {
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
      `assets/video-${video}/video-${video}-image-${index}.png`
    )

    console.log(`Image ${index} generated:`)

    // write this image to a local file, too
    const tempFile = path.resolve(
      __dirname,
      `../assets/video-${video}/video-${video}-image-${index}.png`
    )

    // Ensure the directory exists
    const dir = path.dirname(tempFile)
    await fs.promises.mkdir(dir, { recursive: true })

    await fs.promises.writeFile(tempFile, bufferObj)
  } catch (error) {
    console.error("Error generating image:", error)
  }
}

async function generateImagesFromDescriptions(video, userDescriptions) {
  try {
    const descriptions = userDescriptions
      ? userDescriptions
      : await loadDescriptions(video)

    let index = 0
    for (const description of descriptions) {
      index++
      generateAndUploadImage(video, description, index)

      // Wait 10 seconds between each request
      await new Promise((resolve) => setTimeout(resolve, 10000))
    }

    console.log("All images generated")
    return true
  } catch (error) {
    console.error(error)

    return false
  }
}

// generateImagesFromDescriptions()

export default generateImagesFromDescriptions
