import OpenAI from "openai"
import dotenv from "dotenv"
import parseJson from "parse-json"
import readline from "readline"
import fs from "fs"

const dotenvConfig = dotenv.config()

if (dotenvConfig.error) {
  throw new Error("Couldn't parse .env file")
}

const processEnv = dotenvConfig.parsed

const apiKey = processEnv.OPENAI_API_KEY
const organization = processEnv.OPENAI_ORG_ID

const openai = new OpenAI({
  apiKey,
  organization,
})

const createThreadAndRun = async ({ instruction, assistant_id, prompt }) => {
  const nodeUserMessage = `${instruction} ${prompt}`

  const thread = await openai.beta.threads.create()
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: nodeUserMessage,
  })

  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id,
  })

  let messageList
  let messages

  while (run.status !== "completed") {
    run = await openai.beta.threads.runs.retrieve(thread.id, run.id)
    messageList = await openai.beta.threads.messages.list(thread.id)
    messages = messageList.data

    // wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000))
  }

  const answer = messages.filter((message) => message.assistant_id)[0]
    .content[0].text

  const jsonBlock = answer.value.replace("```json\n", "").replace("```", "")
  const jsonObject = parseJson(jsonBlock)

  return jsonObject
}

const writeJsonToFile = async (jsonObject, path) => {
  await fs.promises.mkdir(path, { recursive: true })

  await fs.promises.writeFile(path, JSON.stringify(jsonObject, null, 2))
}

export const askAssistant = async ({
  assistant_id,
  instruction,
  question,
  path,
}) => {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  let prompt

  try {
    rl.question(question, (input) => {
      prompt = input
      rl.close()
    })

    const answer = await createThreadAndRun({
      instruction,
      assistant_id,
      prompt,
    })

    await writeJsonToFile(answer, path)

    return answer
  } catch (error) {
    console.error(error)
  }
}

export const promptAssistant = async ({
  assistant_id,
  instruction,
  prompt,
  path,
}) => {
  const answer = await createThreadAndRun({ instruction, assistant_id, prompt })

  await writeJsonToFile(answer, path)

  return answer
}

export default openai
