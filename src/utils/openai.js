import OpenAI from "openai";
import parseJson from "parse-json";
import readline from "readline";
import processEnv from "./env.js";
import { writeJsonToFile } from "./writeJsonToFile.js";

const openai = new OpenAI({
  apiKey: processEnv.OPENAI_API_KEY,
  organization: processEnv.OPENAI_ORG_ID,
});

const lemon = new OpenAI({
  apiKey: processEnv.OPENAI_API_KEY,
  baseURL: "https://api.lemonfox.ai/v1",
});

const sendAndAwaitResponse = async ({
  thread,
  message,
  assistant_id,
  isJSON,
}) => {
  // Send message to the thread
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: message,
  });

  let run = await openai.beta.threads.runs.create(thread.id, {
    assistant_id,
  });

  let messageList;
  let messages;

  while (run.status !== "completed") {
    run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    messageList = await openai.beta.threads.messages.list(thread.id);
    messages = messageList.data;

    // wait 2 seconds
    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  const answer = messages.filter((message) => message.role === "assistant")[0]
    .content[0].text.value;

  if (isJSON) {
    let jsonBlock;
    if (answer.includes("```json")) {
      jsonBlock = answer.replace("```json\n", "").replace("```", "");
    } else {
      jsonBlock = answer;
    }
    let jsonObject = jsonBlock;
    try {
      jsonObject = parseJson(jsonBlock);
    } catch (error) {
      console.error(`🛑 ERROR PARSING JSON`, error, jsonBlock);
    }
    return {
      result: jsonObject,
      threadId: run.thread_id,
      runId: run.id,
    };
  } else {
    return {
      result: answer,
      threadId: run.thread_id,
      runId: run.id,
    };
  }
};

const askQuestion = (rl, question) => {
  return new Promise((resolve) => {
    rl.question(question, (input) => {
      resolve(input);
    });
  });
};

export const askAssistant = async ({
  assistant_id,
  instruction,
  question,
  path,
  debug = false,
  prompt: originalPrompt,
  style = "",
  cta = "",
  isJSON = false,
  threadId = null,
  override,
}) => {
  const assistant = await openai.beta.assistants.retrieve(assistant_id);
  const instructions = assistant.instructions;

  const nodeUserMessage = `${instruction} ${originalPrompt}`;

  let prompt;

  try {
    if (originalPrompt) {
      prompt = originalPrompt;
    }

    if (!debug && !originalPrompt) {
      const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
      });
      prompt = await askQuestion(rl, question);
      rl.close();
    }

    if (debug) {
      prompt =
        "title: Cyclical Time in Hindu Mythology, description: Exploring the concept of Yuga cycles in Hindu mythology, where time is cyclical and each era ends in a world-resetting event.";
    }

    const styleInstructions =
      style?.length > 1
        ? `
    - Style instructions: ${style}`
        : "";
    const calltoaction =
      cta?.length > 1
        ? `
    - Include call to action: ${cta}`
        : "";

    let answer,
      newThreadId,
      newRunId = null,
      thread = threadId
        ? await openai.beta.threads.retrieve(threadId)
        : await openai.beta.threads.create();

    const result = await sendAndAwaitResponse({
      thread,
      message: nodeUserMessage,
      assistant_id,
      isJSON,
      override: override || instructions + styleInstructions + calltoaction,
    });

    answer = result.result;
    newThreadId = result.threadId;
    newRunId = result.runId;

    if (path) {
      await writeJsonToFile(answer, path);
    }

    return { ...answer, threadId: newThreadId, runId: newRunId };
  } catch (error) {
    console.error("ERROR ASKING ASSISTANT" + error.error.message);
  }
};

export const promptAssistant = async ({ assistant_id, prompt, isJSON }) => {
  const thread = await openai.beta.threads.create();
  const { result: answer } = await sendAndAwaitResponse({
    thread,
    message: prompt,
    assistant_id,
    isJSON,
  });

  return answer;
};

export async function regenerateSafePrompt(originalPrompt) {
  try {
    const response = await openai.ChatCompletion.create({
      model: "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant.",
        },
        {
          role: "user",
          content: originalPrompt,
        },
        {
          role: "assistant",
          content: "Sorry, but I can't assist with that.",
        },
        {
          role: "user",
          content:
            "Please help me generate a safe and appropriate version of this prompt.",
        },
      ],
    });

    const newPrompt = response["choices"][0]["message"]["content"];
    return newPrompt;
  } catch (error) {
    console.error("Error regenerating prompt:", error);
  }
}

export default openai;
export { lemon };
