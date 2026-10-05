import { askAssistant } from "./openai.js";
import processEnv from "./env.js";
import { readProperty, updateRichText } from "./notionConnector.js";
import { config } from "../main.js";

export const cutScript = async ({ video, entry, threadId, script }) => {
  const channel = readProperty({ entry, property: "channel" }).select.name;
  const newScript = await askAssistant({
    video,
    assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
    prompt: script,
    instruction: `Please reduce the length of the script so that it doesn't pass 1 minute. Eliminate some fluff.`,
    threadId,
    isJSON: true,
    cta: config[channel].cta,
    style: config[channel].style,
  });

  await updateRichText({
    id: video,
    property: "script",
    richTextContent: newScript.script,
  });

  return newScript.script;
};
