import fs from "fs"
import parseJson from "parse-json"

export const loadImages = async (video) => {
  const filePath = `./src/assets/video-${video}/video-${video}-imagemap.json`
  try {
    const data = await fs.promises.readFile(filePath, "utf-8")
    const images = parseJson(data)
    return images
  } catch (error) {
    console.error("Error loading script:", error)
  }
}
