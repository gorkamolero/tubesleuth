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

const test = true;

const instructionsForOneVideo =
  "Create a script for a YouTube Short video, with 'title', 'description', 'script' and 'tags', including #shorts, IN JSON FORMAT for: ";
const instructionsForSeries =
  "We're going to create a series of videos. For each video, create a script with 'title', 'description', 'script' and 'tags', including #shorts, IN JSON FORMAT. Here's the first one: ";
const instructionsForSeriesNext = "Great. Here's the next one: ";

const createScriptsSingle = async ({
  entry,
  threadId = null,
  instruction = instructionsForOneVideo,
}) => {
  let threadIdNew = threadId;

  const channel = readProperty({ entry, property: "channel" }).select.name;
  /*
  const color = colorArray[Math.floor(Math.random() * colorArray.length)];
  console.log("\n");
  const progressBar = multi.create(100, 0, {
    format: color("{bar}") + "| {percentage}% | {message}",
  });
  console.log("\n");
  progressBar.start(100, 0);
  */

  let t0 = performance.now();
  const tStart = t0;

  try {
    const video = entry.id ? entry.id : generateRandomId();
    let id = video;

    if (!entry.id) {
      id = await createEntry();
    }

    console.log(`Creating script for video with id ${id}`);

    await fs.promises.mkdir(`src/assets/video-${video}`, { recursive: true });

    if (!test) {
      await updateRichText({
        id,
        property: "videoId",
        richTextContent: video,
      });
    }

    let script = {};
    // read from json file
    let existsScript = false;

    existsScript = getRichTextFieldContent({
      entry,
      property: "script",
    });

    // updateProgressBar(progressBar, 20, t0, "🖊 Starting script...");
    t0 = performance.now();

    if (existsScript.length > 10) {
      script = existsScript;
    } else {
      const prompt = getRichTextFieldContent({ entry, property: "input" });

      const style = config[channel]?.styleInstructions || "";
      const { threadId: newThreadId, ...answer } = await askAssistant({
        video,
        assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
        instruction,
        question: "🎥 What is the video about?",
        path: `src/assets/video-${video}/video-${video}-script.json`,
        cta: config[channel].cta,
        debug: false,
        ...(prompt && { prompt }),
        style,
        isJSON: true,
        threadId,
      });

      threadIdNew = newThreadId;

      if (!test) {
        await updateRichText({
          id,
          property: "threadId",
          richTextContent: newThreadId,
        });
      }

      script = answer;
    }

    if (script?.title && !test) {
      await updateTitle({
        id,
        title: script.title,
      });
    }

    if (script?.script && !test) {
      await updateRichText({
        id,
        property: "script",
        richTextContent: script.script,
      });
    }

    if (script?.description && !test) {
      await updateRichText({
        id,
        property: "description",
        richTextContent: script.description,
      });
    }

    if (script?.tags && !test) {
      await updateTagsField({ id, property: "tags", tags: script.tags });
    }
    /*
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
    */

    return threadIdNew;
  } catch (error) {
    console.log("Error creating scripts", error);
  }

  progressBar.stop();
};

const createScrips = async (entries) => {
  let threadId = null;
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const series =
      readProperty({ entry, property: "series" })?.select?.name ?? "none";
    const multipleEntries = entries.length > 1 && series !== "none";

    if (i === 0) {
      const instruction = multipleEntries
        ? instructionsForSeries
        : instructionsForOneVideo;
      threadId = await createScriptsSingle({ entry, instruction });
    } else {
      threadId = await createScriptsSingle({
        entry,
        threadId,
        instruction: instructionsForSeriesNext,
      });
    }

    console.log("threadId", threadId);
  }
};

export default createScrips;
