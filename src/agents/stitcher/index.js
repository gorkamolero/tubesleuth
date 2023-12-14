import Creatomate from "creatomate"
import dotenv from "dotenv"
import fs from "fs"

import {
  backgroundMusicCreatomate,
  convertImageMapToCreatomate,
  voiceOver,
} from "./utils.js"
import generateCaptions, { captionStyles } from "./captions.js"
import { video } from "../../config/config.js"

const loadImages = async () => {
  const filePath = `./src/assets/video-${video}/video-${video}-imagemap.json`
  try {
    const data = await fs.promises.readFile(filePath, "utf-8")
    const images = JSON.parse(data)
    return images
  } catch (error) {
    console.error("Error loading script:", error)
  }
}

const apiKey = dotenv.config().parsed.CREATOMATE_API_KEY

const client = new Creatomate.Client(apiKey)

const { keyframes, duration } = await generateCaptions(video)

const images = await loadImages()

const elements = [
  ...convertImageMapToCreatomate(images),
  backgroundMusicCreatomate("dynamic"),
  voiceOver(video),
  new Creatomate.Text({
    ...captionStyles,
    text: keyframes,
  }),
]

let source = new Creatomate.Source({
  outputFormat: "mp4",
  frameRate: 30,
  width: 1080,
  height: 1920,
  duration,
  elements,
})

const generate = async () => {
  try {
    const response = await client.render({
      source,
    })

    const url = response[0].url
    // write url with fs to a txt file and use it as name
    await fs.promises.writeFile(`./src/assets/video-${video}/${url}`, url)
    console.log(response)
  } catch (error) {
    console.error(error)
  }
}

generate()
