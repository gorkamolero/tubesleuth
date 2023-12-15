import dotenv from "dotenv"
import { v4 as uuidv4 } from "uuid"

const dotenvConfig = dotenv.config()

if (dotenvConfig.error) {
  throw new Error("Couldn't parse .env file")
}

const processEnv = dotenvConfig.parsed

import { askAssistant, promptAssistant } from "../utils/openai.js"
import createVoiceover from "./2-voiceover.js"
import transcribeAudio from "./3-scribe.js"
import generateImagesFromDescriptions from "./4-painter.js"
import stitchItAllUp from "./stitcher/index.js"

const init = async () => {
  const video = uuidv4()
  // TODO: get video number from user
  // TODO: use video ids instead
  const script = await askAssistant({
    video,
    assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
    instruction:
      "Create a script for a YouTube Short video, with title, description and tags, including #shorts, #unsolvedmysteries for:",
    question: "🎥 What is the video about?",
    path: `src/assets/video-${video}/video-${video}-script.json`,
  })

  const voiceover = await createVoiceover(video, script)

  const transcription = await transcribeAudio(video, voiceover)

  const imageMap = await promptAssistant({
    video,
    assistant_id: processEnv.ASSISTANT_ARCHITECT_ID,
    instruction:
      "Please map images to the key MOMENTS of this script I provide, not necessarily to the segments, and output in JSON format with start, end, id, description, effect: ",
    prompt: transcription,
    path: `src/assets/video-${videonumber}/video-${videonumber}-imagemap.json`,
  })

  generateImagesFromDescriptions(video, imageMap)

  // TODO: check all files

  const stitch = await stitchItAllUp(video, imageMap)

  console.log(stitch)
}

init()
