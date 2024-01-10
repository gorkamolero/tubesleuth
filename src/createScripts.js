import fs from "fs";
import processEnv from "./utils/env.js";
import { askAssistant } from "./utils/openai.js";
import { updateProgressBar } from "./utils/measurePerformance.js";
import { generateRandomId } from "./utils/generateRandomID.js";
import {
  createEntry,
  updateTitle,
  updateRichText,
  updateTagsField,
  readProperty,
  getRichTextFieldContent,
} from "./utils/notionConnector.js";
import { config } from "./main.js";
import { colorArray, multi } from "./utils/multibar.js";

const createScripts = async (entry) => {
  const channel = readProperty({ entry, property: "channel" }).select.name;
  const color = colorArray[Math.floor(Math.random() * colorArray.length)];
  console.log("\n");
  const progressBar = multi.create(100, 0, {
    format: color("{bar}") + "| {percentage}% | {message}",
  });
  console.log("\n");
  progressBar.start(100, 0);

  let t0 = performance.now();
  const tStart = t0;

  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      const video = entry.id ? entry.id : generateRandomId();
      let id = video;

      if (!entry.id) {
        id = await createEntry();
      }

      console.log(`Creating script for video with id ${id}`);

      await fs.promises.mkdir(`src/assets/video-${video}`, { recursive: true });

      await updateRichText({
        id,
        property: "videoId",
        richTextContent: video,
      });

      let script = {};
      // read from json file
      let existsScript = false;

      existsScript = getRichTextFieldContent({
        entry,
        property: "script",
      });

      updateProgressBar(progressBar, 20, t0, "🖊 Starting script...");
      t0 = performance.now();

      if (existsScript.length > 10) {
        script = existsScript;

        const refineScript = getRichTextFieldContent({
          entry,
          property: "refineScript",
        });

        if (refineScript.length > 4) {
          const prompt = refineScript;

          const threadId = getRichTextFieldContent({
            entry,
            property: "threadId",
          });

          const result = await askAssistant({
            video,
            assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
            prompt,
            instruction:
              "Please refine the script with the following instructions: ",
            threadId,
            cta: config[channel].cta,
            isJSON: true,
          });

          script = result;

          await updateRichText({
            id,
            property: "refineScript",
            richTextContent: "",
          });
        }
      } else {
        const prompt = getRichTextFieldContent({ entry, property: "input" });

        const style = config[channel].styleInstructions || "";
        const { threadId, ...answer } = await askAssistant({
          video,
          assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
          instruction:
            "Create a script for a YouTube Short video, with 'title', 'description', 'script' and 'tags', including #shorts, IN JSON FORMAT for: ",
          question: "🎥 What is the video about?",
          path: `src/assets/video-${video}/video-${video}-script.json`,
          cta: config[channel].cta,
          debug: false,
          ...(prompt && { prompt }),
          style,
          isJSON: true,
        });

        await updateRichText({
          id,
          property: "threadId",
          richTextContent: threadId,
        });

        script = answer;
      }

      if (script?.title) {
        await updateTitle({
          id,
          title: script.title,
        });
      }

      if (script?.script) {
        await updateRichText({
          id,
          property: "script",
          richTextContent: script.script,
        });
      }

      if (script?.description) {
        await updateRichText({
          id,
          property: "description",
          richTextContent: script.description,
        });
      }

      if (script?.tags) {
        await updateTagsField({ id, property: "tags", tags: script.tags });
      }

      updateProgressBar(
        progressBar,
        100,
        t0,
        "Step 5 complete! Finalizing script",
      );

      const tEnd = performance.now();
      const totalExecutionTime = (tEnd - tStart) / 1000; // in seconds
      progressBar.update(100, {
        message: `Total execution time: ${totalExecutionTime.toFixed(2)}s`,
      });
      break;
    } catch (error) {
      console.log("Error creating scripts", error);
    }
  }

  progressBar.stop();
};

export default createScripts;
