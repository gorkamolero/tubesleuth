import Creatomate from "creatomate"
import dotenv from "dotenv"
import fs from "fs"

import {
  backgroundMusicCreatomate,
  convertImageMapToCreatomate,
  voiceOver,
} from "./utils.js"
import generateCaptions, { captionStyles } from "./captions.js"
import { loadImages } from "../../utils/loadImages.js"
const apiKey = dotenv.config().parsed.CREATOMATE_API_KEY

const client = new Creatomate.Client(apiKey)

const stitchItAllUp = async (video, userImages) => {
  try {
    const { keyframes, duration } = await generateCaptions(video)

    const images = userImages ? userImages : await loadImages(video)

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

    const response = await client.render({
      source,
    })

    const url = response[0].url
    // write url with fs to a txt file and use it as name
    await fs.promises.writeFile(`./src/assets/video-${video}/${url}`, url)
    console.log(response)

    return url
  } catch (error) {
    console.error(error)
  }
}

// generate()

export default stitchItAllUp
