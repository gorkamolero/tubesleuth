import OpenAI from "openai";
import parseJson from "parse-json";
import readline from "readline";
import fs from "fs";
import processEnv from "./env.js";

const openai = new OpenAI({
  apiKey: processEnv.OPENAI_API_KEY,
  organization: processEnv.OPENAI_ORG_ID,
});

const createThreadAndRun = async ({ instruction, assistant_id, prompt }) => {
  const nodeUserMessage = `${instruction} ${prompt}`;

  const thread = await openai.beta.threads.create();
  await openai.beta.threads.messages.create(thread.id, {
    role: "user",
    content: nodeUserMessage,
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

  const answer = messages.filter((message) => message.assistant_id)[0]
    .content[0].text;

  let jsonBlock;
  if (answer.value.includes("```json")) {
    jsonBlock = answer.value.replace("```json\n", "").replace("```", "");
  } else {
    jsonBlock = answer.value;
  }
  let jsonObject;
  try {
    jsonObject = parseJson(jsonBlock);
  } catch (error) {
    console.error(`🛑 ERROR PARSING JSON`, error, jsonBlock);
  }

  return jsonObject;
};

const writeJsonToFile = async (jsonObject, filePath) => {
  const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));

  await fs.promises.mkdir(dirPath, { recursive: true });

  await fs.promises.writeFile(filePath, JSON.stringify(jsonObject, null, 2));
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
  writersToLookUpTo,
  styleInstructions,
}) => {
  // TODO: override instruction with writer styles and style

  /*
  Pseudo code:
  const assistant = ...
  const writerString = writersToLookUpto.map((writer, index) => {
    // if last index
    if (index ... writersToLookUpto.length) {
      return writer
    } else {
      return `%{writer} and`
    }
  })

  assistant.instructions.add(`Write in the style of ${writerstring}. ${styleInstructions}. `)
  
  */

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let prompt;

  try {
    if (!debug) {
      prompt = await askQuestion(rl, question);
      rl.close();
    }

    if (debug) {
      prompt =
        "title: Cyclical Time in Hindu Mythology, description: Exploring the concept of Yuga cycles in Hindu mythology, where time is cyclical and each era ends in a world-resetting event.";
    }

    console.log(`⏱ OK, let's go`);

    const answer = await createThreadAndRun({
      instruction,
      assistant_id,
      prompt,
    });

    try {
      await writeJsonToFile(answer, path);
    } catch (error) {
      console.error(`🛑 ERROR WRITING JSON FILE`, error);
    }

    return answer;
  } catch (error) {
    console.error(error);
  }
};

export const promptAssistant = async ({
  assistant_id,
  instruction,
  prompt,
  path,
}) => {
  const answer = await createThreadAndRun({
    instruction,
    assistant_id,
    prompt,
  });

  await writeJsonToFile(answer, path);

  return answer;
};

export default openai;
