import Creatomate from "creatomate"
import dotenv from "dotenv"
import images from "./images.js"
import {
  backgroundMusicCreatomate,
  convertImageMapToCreatomate,
  voiceOver,
} from "./utils.js"
import generateCaptions, { captionStyles } from "./captions.js"

const video = 1

const apiKey = dotenv.config().parsed.CREATOMATE_API_KEY

const client = new Creatomate.Client(apiKey)

const { keyframes, duration } = await generateCaptions(video)

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
    console.log(response)
  } catch (error) {
    console.error(error)
  }
}

generate()
