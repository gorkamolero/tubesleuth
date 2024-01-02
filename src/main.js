import fs from "fs";
import { EventEmitter } from "events";

import { formatTime } from "./utils/formatTime.js";

import processEnv from "./utils/env.js";

import { askAssistant, promptAssistant } from "./utils/openai.js";
import createVoiceover from "./agents/1-voiceover.js";
import transcribeAudio from "./agents/2-scribe.js";
import generateImagesFromDescriptions from "./agents/3-painter.js";
import measurePerformance from "./utils/measurePerformance.js";
import { replacer } from "./utils/replacer.js";
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
  readProperty,
  updateDateField,
  loadConfig,
} from "./utils/notionConnector.js";
import upload from "./agents/5-uploader.js";
import { writeJsonToFile } from "./utils/writeJsonToFile.js";
import { renderVideo } from "./agents/4-stitcher.js";
import cleanFiles from "./utils/cleanFiles.js";

const eventEmitter = new EventEmitter();

export let config = {};
let videos = [];
let limit = 10;
let tTotalStart = performance.now();
const loop = false;

const createVideo = async (entry) => {
  const channel = readProperty({ entry, property: "channel" }).select.name;
  const input = joinRichText(
    readProperty({ entry, property: "input" }).rich_text,
  );
  const dontupload = readProperty({ entry, property: "dontupload" });
  // const uploadVid = !dontupload?.checkbox;
  const uploadVid = false;
  // let's measure the time it takes to run the whole thing
  let t0 = performance.now();
  const tStart = t0;

  const video = entry.id ? entry.id : generateRandomId();
  let id = video;

  const videoFilePath = `src/out/videos/video-${video}.mp4`;
  try {
    await fs.promises.access(videoFilePath, fs.constants.F_OK);
    console.log(`🎥 Output video exists, skipping to next video`);
    return; // Skip the rest of the function
  } catch (error) {
    console.log(`🎥 Output video doesn't exist, continue with the function`);
    // Video file doesn't exist, continue with the function
  }

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

  let script = {};
  const style = config[channel].styleInstructions || "";
  let scriptPath = `src/assets/video-${video}/video-${video}-script.json`;

  try {
    let existsScript = await fs.promises.readFile(scriptPath, "utf-8");

    if (existsScript) {
      console.log("🖊 Script exists, skipping");
      script = JSON.parse(existsScript);
    }
  } catch (error) {
    script = await askAssistant({
      video,
      assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
      instruction:
        "Create a script for a YouTube Short video, with 'title', 'description', 'script' and 'tags', including #shorts, IN JSON FORMAT for: ",
      question: "🎥 What is the video about?",
      path: scriptPath,
      cta: config[channel].cta,
      debug: false,
      ...(prompt && { prompt }),
      style,
      isJSON: true,
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

  const { voiceover, url } = await createVoiceover(video, script, channel);

  if (url) {
    await updateFileField({ id, fieldName: "voiceover", fileUrl: url });
  }

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
    `📝 Step 3 complete! We put their voice through a machine and now we know everything!. The video duration is ${transcription.duration}`,
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
  } catch (error) {
    imageMap = await promptAssistant({
      video,
      assistant_id: processEnv.ASSISTANT_ARCHITECT_ID,
      instruction:
        "Please map images to the key MOMENTS of this script I provide, not necessarily to the segments, and output in JSON format with start, end, id, description, effect: ",
      prompt: JSON.stringify(transcription.segments, replacer),
      path: imageMapPath,
      isJSON: true,
    });
  }

  t0 = measurePerformance(
    t0,
    `🎨 Step 4 complete! From the cyber voice and script we are creating images!`,
  );

  const numberOfImages = imageMap.length;

  console.log(`🐌 ${numberOfImages} images to be generated now. Hang tight...`);

  const urls = await generateImagesFromDescriptions({
    video,
    imageMap,
    lemon: true,
  });

  if (!loop) {
    eventEmitter.emit("go");
  }

  t0 = measurePerformance(
    t0,
    "📸 Step 5 complete! Images generated and uploaded to the cyber cloud!",
  );

  console.log("🎬 Stitching it all up, hang tight...");

  await updateImageField({ id, fieldName: "images", urls });

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

  t0 = measurePerformance(t0, "🎬 Video is ready :) ");
  if (uploadVid) {
    try {
      await upload({
        videoFilePath: stitch.localFile,
        title: stitch.title,
        description: stitch.description,
        tags: stitch.tags,
      });

      await updateCheckboxField({ id, fieldName: "uploaded", checked: true });

      t0 = measurePerformance(t0, "🎬 Video is uploaded to YouTube :)");
    } catch (error) {
      console.log("🎬 Video upload failed at :(");
      await updateCheckboxField({
        id,
        fieldName: "dontupload",
        checked: true,
      });
    }
  }

  await cleanFiles();

  await updateCheckboxField({ id, fieldName: "done", checked: true });

  await updateDateField({ id, fieldName: "date", date: new Date() });

  console.log(`Total execution time: ${formatTime(t0 - tStart)} milliseconds`);
};

const init = async (debug) => {
  videos = await readDatabase({
    empty: true,
    id: false,
  });

  config = await loadConfig();

  videos = videos.slice(0, limit);

  if (videos.length > 0) {
    if (loop) {
      for (const video of videos) {
        await createVideo(video);
      }
    } else {
      await createVideo(videos[0]);
    }
  } else {
    console.log("🎥 No videos to process");
  }
};

eventEmitter.on("go", async () => {
  // wait 10 secs
  await new Promise((resolve) => setTimeout(resolve, 10000));
  // Start the next job here
  console.log("Starting the next job...");
  videos.shift(); // Remove the first video from the array
  if (videos.length > 0 && videos.length < limit) {
    await createVideo(videos[0]); // Start the next video
  } else {
    let tTotalEnd = performance.now();
    console.log(
      `Total execution time for ${limit} videos: ${formatTime(
        tTotalEnd - tTotalStart,
      )} milliseconds`,
    );
  }
});

init(false);
