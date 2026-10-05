import fs from "fs"

export const loadScript = async (video) => {
  const filePath = `./src/assets/video-${video}/video-${video}-script.json`
  try {
    const data = await fs.promises.readFile(filePath, "utf-8")
    const script = JSON.parse(data)
    return script.script
  } catch (error) {
    console.error("Error loading script:", error)
  }
}
