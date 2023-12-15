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

const stitchItAllUp = async ({ script, video, imageMap }) => {
  try {
    const { keyframes, duration } = await generateCaptions(video)

    const images = imageMap ? imageMap : await loadImages(video)

    const elements = [
      ...convertImageMapToCreatomate({ script, images, video }),
      backgroundMusicCreatomate(script?.mood || "deep"),
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

    const dir = `./src/assets/video-${video}`

    try {
      await fs.promises.mkdir(dir, { recursive: true })
    } catch (err) {
      console.error("Failed to create directory", err)
    }

    // write url with fs to a txt file and use it as name

    try {
      await fs.promises.writeFile(`${dir}/video-${video}-url.txt`, url)
    } catch (err) {
      console.error("Failed to write file", err)
    }

    return url
  } catch (error) {
    console.error(error)
  }
}

export default stitchItAllUp
