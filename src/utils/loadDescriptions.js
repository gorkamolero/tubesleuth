import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export async function loadDescriptions(video) {
  const filePath = path.resolve(
    __dirname,
    `../assets/video-${video}/video-${video}-imagemap.json`
  )
  const data = await fs.promises.readFile(filePath, "utf-8")
  const segments = JSON.parse(data)

  const descriptions = segments.map((segment) => segment.description)

  return descriptions
}

export default loadDescriptions
