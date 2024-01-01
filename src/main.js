import fs from "fs";
import pLimit from "p-limit";
import readline from "readline";
import cliProgress from "cli-progress";

import { formatTime } from "./utils/formatTime.js";

import processEnv from "./utils/env.js";

import { askAssistant, promptAssistant } from "./utils/openai.js";
import createVoiceover from "./agents/1-voiceover.js";
import transcribeAudio from "./agents/2-scribe.js";
import generateImagesFromDescriptions from "./agents/3-painter.js";
import {
  measurePerformance,
  updateProgressBar,
} from "./utils/measurePerformance.js";
import { replacer } from "./utils/replacer.js";
import { generateRandomId } from "./utils/generateRandomID.js";
import {
  createEntry,
  updateTitle,
  readDatabase,
  updateFileField,
  updateImageField,
  updateRichText,
  updateTagsField,
  updateCheckboxField,
  readProperty,
  updateDateField,
  loadConfig,
  getRichTextFieldContent,
} from "./utils/notionConnector.js";
import upload from "./agents/5-uploader.js";
import { writeJsonToFile } from "./utils/writeJsonToFile.js";
import { renderVideo } from "./agents/4-stitcher.js";

const loop = false;

export let config = {};
let videos = [];
let limit = 10;
let channel = "";
const imageGenerationLimit = pLimit(1);

const createScripts = async (entry) => {
  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );

  progressBar.start(100, 0);

  let t0 = performance.now();
  const tStart = t0;

  const maxRetries = 3;

  for (let i = 0; i < maxRetries; i++) {
    try {
      channel = readProperty({ entry, property: "channel" }).select.name;

      const video = entry.id ? entry.id : generateRandomId();
      let id = video;

      if (!entry.id) {
        id = await createEntry();
      }

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

      await updateProgressBar(
        progressBar,
        20,
        t0,
        "Step 1 complete! Starting script creation process",
      );
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
        const { answer, threadId, runId, ...rest } = await askAssistant({
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
          // testPrompt: "The Lost Pillars of Atlantis: A journey into the Egyptian city of Sais, examining the supposed pillars that hold the records of Atlantis, as claimed by the ancient philosopher Krantor.",
        });

        await updateRichText({
          id,
          property: "threadId",
          richTextContent: threadId,
        });

        await updateRichText({
          id,
          property: "runId",
          richTextContent: runId,
        });

        script = rest;
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

      await updateProgressBar(
        progressBar,
        100,
        t0,
        "Step 5 complete! Finalizing script",
      );
      const totalExecutionTime = measurePerformance(t0 - tStart);
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

const createVideos = async (entry) => {
  const channel = readProperty({ entry, property: "channel" }).select.name;
  const script = getRichTextFieldContent({ entry, property: "script" });
  const video = getRichTextFieldContent({ entry, property: "videoId" });
  const id = video;

  const progressBar = new cliProgress.SingleBar(
    {},
    cliProgress.Presets.shades_classic,
  );
  let t0 = performance.now();
  const tStart = t0; // Define tStart here

  progressBar.start(100, 0);

  progressBar.update(0, { message: "Step 1: Starting video creation process" });

  t0 = updateProgressBar(
    progressBar,
    20,
    t0,
    "Step 2: We get a voice actor to read it",
  );

  const { voiceover, url } = await createVoiceover(video, script, channel);
  t0 = updateProgressBar(
    progressBar,
    20,
    t0,
    "Step 2 complete! The cyber voice is ready!",
  );

  if (url) {
    await updateFileField({ id: video, property: "voiceover", fileUrl: url });
  }

  t0 = measurePerformance(t0, `🙊 Step 2 complete! The cyber voice is ready!`);

  progressBar.update(20, {
    message: "Step 3: Transcribing the voice to find the exact times",
  });

  let transcription = {};

  try {
    const existsTranscription = await fs.promises.readFile(
      `src/assets/video-${video}/video-${video}-transcript.mp3`,
      "utf-8",
    );

    if (existsTranscription) {
      console.log("📝 Transcription exists, skipping");
      transcription = JSON.parse(existsTranscription);
    }
  } catch (error) {}

  transcription = await transcribeAudio(video, voiceover);

  t0 = updateProgressBar(
    progressBar,
    40,
    t0,
    `Step 3 complete! We put their voice through a machine and now we know everything! The video duration is ${transcription.duration}`,
  );

  progressBar.update(40, {
    message: "Step 4: Thinking very hard about what images to show",
  });

  let imageMap = [];
  let imageMapPath = `src/assets/video-${video}/video-${video}-imagemap.json`;

  try {
    existsImageMap = await fs.promises.readFile(imageMapPath, "utf-8");

    if (existsImageMap) {
      console.log("📝 Image map exists, skipping");
      imageMap = JSON.parse(existsImageMap);
    }
  } catch (error) {}
  imageMap = await promptAssistant({
    video,
    assistant_id: processEnv.ASSISTANT_ARCHITECT_ID,
    instruction:
      "Please map images to the key MOMENTS of this script I provide, not necessarily to the segments, and output in JSON format with start, end, id, description, effect: ",
    prompt: JSON.stringify(transcription.segments, replacer),
    path: imageMapPath,
    isJSON: true,
  });

  t0 = updateProgressBar(
    progressBar,
    60,
    t0,
    "Step 4 complete! From the cyber voice and script we are creating images!",
  );

  const numberOfImages = imageMap.length;

  progressBar.update(60, {
    message: `Step 5: Generating ${numberOfImages} images and uploading to the cyber cloud`,
  });

  const urls = await imageGenerationLimit(() =>
    generateImagesFromDescriptions({
      video,
      imageMap,
      lemon: true,
    }),
  );
  t0 = updateProgressBar(
    progressBar,
    80,
    t0,
    "Step 5 complete! Images generated and uploaded to the cyber cloud!",
  );

  progressBar.update(80, {
    message: "🎬 Step 6: Stitching it all up, hang tight...",
  });

  await updateImageField({ id, property: "images", urls });

  imageMap = imageMap.map((image, index) => {
    image.url = urls[index];
    return image;
  });

  await writeJsonToFile(imageMap, imageMapPath);

  const stitch = await renderVideo({
    script,
    video,
    imageMap,
    transcription,
  });

  if (stitch && stitch?.tags && stitch?.tags.length > 0) {
    stitch.tags = stitch.tags.join(", ");
  }

  updateProgressBar(progressBar, 90, t0, "Video is ready :)");

  await updateCheckboxField({ id, property: "done", checked: true });

  await updateDateField({ id, property: "date", date: new Date() });
  // await cleanFiles();

  progressBar.update(100, {
    message: `Total execution time: ${formatTime(t0 - tStart)} milliseconds`,
  });

  progressBar.stop();
};

const uploadVideos = async (entry) => {
  // Todo: upload videos
  /*

  const dontupload = readProperty({ entry, property: "dontupload" });
  const uploadVid = !dontupload?.checkbox;

  if (uploadVid) {
    try {
      await upload({
        videoFilePath: stitch.localFile,
        title: stitch.title,
        description: stitch.description,
        tags: stitch.tags,
      });

      await updateCheckboxField({ id, property: "uploaded", checked: true });

      updateProgressBar(
        progressBar,
        100,
        t0,
        "🎬 Video is uploaded to YouTube :)",
      );
    } catch (error) {
      updateProgressBar(progressBar, 100, t0, "🎬 Video upload failed :(");

      await updateCheckboxField({
        id,
        property: "dontupload",
        checked: true,
      });
    }
  }


  */
};

const init = async (debug) => {
  const actions = {
    createScripts,
    createVideos,
    uploadVideos,
    // Add more actions here in the future
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "What do you want to do?\n1 - Create scripts\n2 - Create videos\n",
    async (actionAnswer) => {
      const actionNames = Object.keys(actions);
      const actionName = actionNames[actionAnswer - 1];
      const func = actions[actionName];

      if (!func) {
        throw new Error("Invalid action");
      }

      rl.question(
        "How many videos do you want to process? (Leave blank for all)\n",
        async (limitAnswer) => {
          limit = limitAnswer ? parseInt(limitAnswer) : Infinity;

          videos = await readDatabase({
            empty: true,
            action: actionName,
            limit,
          });

          config = await loadConfig();

          videos = videos.slice(0, limit);

          const concurrencyLimit = pLimit(loop ? 1 : 10); // Limit to 1 concurrent promise if loop is true, else 10

          const tasks = videos.map((entry) => {
            return concurrencyLimit(() => func(entry));
          });

          // Only 10 `createVideo` calls will be executed concurrently.
          await Promise.all(tasks);

          rl.close();
        },
      );
    },
  );
};

init(false);
