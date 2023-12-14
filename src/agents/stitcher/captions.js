import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

import Creatomate from "creatomate"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

async function loadSegments(videoNumber) {
  const filePath = path.resolve(
    __dirname,
    `../../assets/video-${videoNumber}/video-${videoNumber}-transcript.json`
  )
  const data = await fs.promises.readFile(filePath, "utf-8")
  const segments = JSON.parse(data)

  return segments
}

async function generateCaptions(videoNumber) {
  const segments = await loadSegments(videoNumber)

  const keyframes = []

  // Iterate through each segment in the segments array
  for (const segment of segments.segments) {
    // Convert each timestamp in the segment to seconds
    const startTime = segment.start
    const endTime = segment.end

    // Get the words that correspond to this segment
    const words = segment.text.split(" ").map((word, index, wordArray) => {
      const timePerWord = (endTime - startTime) / wordArray.length
      const adjustedTimePerWord =
        timePerWord * (1 - (index / wordArray.length) * 0.1) // Adjust time per word based on index
      return {
        content: word,
        startTime: startTime + index * adjustedTimePerWord - 0.5, // Subtract 0.5 seconds from the start time
      }
    })

    // Iterate through each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i]

      let text = ""

      // Encapsulate each spoken word with an RGBA color tag, to make it slightly transparent
      const spokenWords = words.slice(0, i)
      if (spokenWords.length > 0) {
        text += `[color rgba(255,255,255,0.4)]${spokenWords
          .map((word) => word.content)
          .join(" ")}[/color] `
      }

      // Encapsulate the current spoken word with a color tag to make it fully white
      text += `[color #fff]${word.content}[/color]`

      // Add the words that have not yet been spoken. As the default 'fillColor' is null,
      // the text will be invisible, but reserve its space in the text element
      const unspokenWords = words.slice(i + 1)
      if (unspokenWords.length) {
        text += ` ${unspokenWords.map((word) => word.content).join(" ")}`
      }

      // Create a keyframe for each spoken word
      keyframes.push(new Creatomate.Keyframe(text, word.startTime))
    }
  }

  return {
    keyframes,
    duration: segments.duration,
  }
}

export const captionStyles = {
  // Make the subtitle container as large as the screen with some padding
  width: "100%",
  height: "100%",
  xPadding: "3 vmin",
  yPadding: "8 vmin",

  // Align text to bottom center
  xAlignment: "50%",
  yAlignment: "100%",

  // Text style - note that the default fill color is null (transparent)
  fontFamily: "Montserrat",
  textTransform: "uppercase",
  fontWeight: "800",
  fontSize: "6 vh",
  fillColor: null,
  shadowColor: "rgba(0,0,0,0.65)",
  shadowBlur: "1.6 vmin",
}

export default generateCaptions
