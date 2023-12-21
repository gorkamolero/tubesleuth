import fs from "fs";

import { formatTime } from "./utils/formatTime.js";
import { cta, styleInstructions } from "./config/config.js";

import processEnv from "./utils/env.js";

import { askAssistant, promptAssistant } from "./utils/openai.js";
import createVoiceover from "./agents/1-voiceover.js";
import transcribeAudio from "./agents/2-scribe.js";
import generateImagesFromDescriptions from "./agents/4-painter.js";
import stitchItAllUp from "./agents/5-stitcher.js";
import measurePerformance from "./utils/measurePerformance.js";
import { replacer } from "./utils/replacer.js";
import { localCleanup } from "./utils/localCleanup.js";
import { uploadFile } from "./utils/firebaseConnector.js";
import { generateRandomId } from "./utils/generateRandomID.js";
import {
  createEntry,
  updateTitle,
  joinRichText,
  readDatabase,
  updateFileField,
  updateImageField,
  updateRichText,
  updateTagsField,
  updateCheckboxField,
  updateURLField,
  readProperty,
} from "./utils/notionConnector.js";
import upload from "./agents/6-uploader.js";

// TODO: restart from where we left it

const createVideo = async (entry) => {
  const channel = readProperty({ entry, property: "channel" }).select.name;
  const input = joinRichText(
    readProperty({ entry, property: "input" }).rich_text,
  );
  const dontupload = readProperty({ entry, property: "dontupload" });
  const uploadVid = !dontupload?.checkbox;
  // let's measure the time it takes to run the whole thing
  let t0 = performance.now();
  const tStart = t0;

  const video = entry.id ? entry.id : generateRandomId();
  let id = video;

  // if no id, we create a new entry
  if (!entry.id) {
    id = await createEntry();
  }

  console.log(`🎥 Starting video with id  -   ${video}`);
  console.log(`🎥 Input for video: ${input}`);

  // create dir

  await fs.promises.mkdir(`src/assets/video-${video}`, { recursive: true });

  await updateRichText({
    id,
    fieldName: "videoId",
    richTextContent: video,
  });

  // await localCleanup(video);

  const prompt = joinRichText(entry.properties.input.rich_text);

  console.log("Step 1: We write a script");
  let script = {};
  let existsScript = false;
  try {
    existsScript = await fs.promises.readFile(
      `src/assets/video-${video}/video-${video}-script.json`,
      "utf-8",
    );

    if (existsScript) {
      console.log("📝 Script exists, skipping");
      script = JSON.parse(existsScript);
    }
  } catch (error) {}

  if (!existsScript) {
    const style = styleInstructions[channel];
    script = await askAssistant({
      video,
      assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
      instruction:
        "Create a script for a YouTube Short video, with title, description and tags, including #shorts for:",
      question: "🎥 What is the video about?",
      path: `src/assets/video-${video}/video-${video}-script.json`,
      cta: cta[channel],
      debug: false,
      ...(prompt && { prompt }),
      style,
      // testPrompt: "The Lost Pillars of Atlantis: A journey into the Egyptian city of Sais, examining the supposed pillars that hold the records of Atlantis, as claimed by the ancient philosopher Krantor.",
    });
  }

  t0 = measurePerformance(t0, `🖊  Step 1 complete! Script's done`);

  await updateTitle({
    id,
    title: script.title,
  });

  await updateRichText({
    id,
    fieldName: "script",
    richTextContent: script.script,
  });
  await updateRichText({
    id,
    fieldName: "description",
    richTextContent: script.description,
  });
  await updateTagsField({ id, fieldName: "tags", tags: script.tags });

  console.log("Step 2: We get a voice actor to read it");

  const { voiceover, url } = await createVoiceover(video, script);

  await updateFileField({ id, fieldName: "voiceover", fileUrl: url });

  t0 = measurePerformance(t0, `🙊 Step 2 complete! The cyber voice is ready!`);

  console.log("Step 3: We transcribe the voice to find the exact times");

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

  t0 = measurePerformance(
    t0,
    "📝 Step 3 complete! We put their voice through a machine and now we know everything!",
  );

  console.log("Step 4: We think very hard about what images to show");

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
  });

  t0 = measurePerformance(
    t0,
    `🎨 Step 4 complete! From the cyber voice and script we are creating images!`,
  );

  const numberOfImages = imageMap.length;

  console.log(`🐌 ${numberOfImages} images to be generated now. Hang tight...`);

  const urls = await generateImagesFromDescriptions(video, imageMap);

  t0 = measurePerformance(
    t0,
    "📸 Step 5 complete! Images generated and uploaded to the cyber cloud!",
  );

  console.log("🎬 Stitching it all up, hang tight...");

  await updateImageField({ id, fieldName: "images", urls });

  const stitch = await stitchItAllUp({
    script,
    video,
    imageMap,
    transcription,
  });

  if (stitch && stitch?.tags && stitch?.tags.length > 0) {
    stitch.tags = stitch.tags.join(", ");
  }

  t0 = measurePerformance(t0, "🎬 Video is ready at " + stitch.url);
  if (uploadVid) {
    await upload({
      videoFilePath: stitch.localFile,
      title: stitch.title,
      description: stitch.description,
      tags: stitch.tags,
    });

    await updateCheckboxField({ id, fieldName: "uploaded", checked: true });

    t0 = measurePerformance(
      t0,
      "🎬 Video is uploaded to YouTube at " + stitch.url,
    );
  } else {
    t0 = measurePerformance(t0, "🎬 Video is finished at " + stitch.url);
  }

  await updateURLField({
    id,
    fieldName: "url",
    url: stitch.url,
  });

  await updateCheckboxField({ id, fieldName: "done", checked: true });

  console.log(`Total execution time: ${formatTime(t0 - tStart)} milliseconds`);
};

const create = async () => {
  const videos = await readDatabase({
    empty: true,
    id: false,
  });

  for (const video of videos) {
    await createVideo(video);
  }
};

const init = async (debug) => {
  let times = 5;

  while (times > 0) {
    try {
      await create();
      times = 0;
    } catch (e) {
      console.log("🐌 Error creating video, Trying again", e);
      times--;
    }
  }
};

init(false);
