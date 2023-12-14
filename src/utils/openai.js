import OpenAI from "openai"
import dotenv from "dotenv"

const apiKey = dotenv.config().parsed.OPENAI_API_KEY
const organization = dotenv.config().parsed.OPENAI_ORG_ID

const openai = new OpenAI({
  apiKey,
  organization,
})

export const askAssistant = async ({ instruction, prompt, assistant_id }) => {
  const thread = await openai.beta.threads.create()
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: `${instruction} ${prompt}`,
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

  const jsonBlock = answer.value
    .replace("```json\n", "")
    .replace("\n```", "")
    .replace("\n", "")
    .trim()

  const jsonObject = JSON.parse(jsonBlock)

  return jsonObject
}

export default openai
