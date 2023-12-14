import prompts from "./prompts.json" assert { type: "json" }
import dotenv from "dotenv"
import fs from "fs"

const processEnv = dotenv.config().parsed

import { askAssistant } from "../utils/openai.js"

const init = async () => {
  let index = 10
  for (const prompt of prompts) {
    const answer = await askAssistant({
      assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
      prompt: `TITLE: ${prompt.title}, DESCRIPTION: ${prompt.description}`,
      instruction:
        "Create a script for a YouTube Short video, with title, description and tags, including #shorts for:",
    })

    const dir = `src/assets/video-${index}`
    await fs.promises.mkdir(dir, { recursive: true })

    await fs.promises.writeFile(
      `src/assets/video-${index}/video-${index}-script.json`,
      JSON.stringify(answer)
    )

    continue
  }
}

init()
