import { formatTime } from "./utils/formatTime.js";
import processEnv from "./utils/env.js";
import { promptAssistant } from "./utils/openai.js";
import createVoiceover from "./agents/1-voiceover.js";
import transcribeAudio from "./agents/2-scribe.js";
import generateImagesFromDescriptions from "./agents/3-painter.js";
import { updateProgressBar } from "./utils/measurePerformance.js";
import { replacer } from "./utils/replacer.js";
import {
  updateFileField,
  updateImageField,
  updateCheckboxField,
  readProperty,
  updateDateField,
  getRichTextFieldContent,
  readJsonFromNotion,
  readImages,
  uploadJsonToNotion,
} from "./utils/notionConnector.js";
import { readJsonFromFile, writeJsonToFile } from "./utils/writeJsonToFile.js";
import { renderVideo } from "./agents/4-stitcher.js";
import cleanFiles from "./utils/cleanFiles.js";
import { imageGenerationLimit, stitchLimit } from "./main.js";
import { colorArray, multi } from "./utils/multibar.js";

const createVideos = async (entry) => {
  const channel = readProperty({ entry, property: "channel" }).select.name;
  const script = getRichTextFieldContent({ entry, property: "script" });
  const video = getRichTextFieldContent({ entry, property: "videoId" });
  const redo = readProperty({ entry, property: "redo" }).checkbox;
  const id = video;

  console.log(`Creating video with id ${id}`);

  const color = colorArray[Math.floor(Math.random() * colorArray.length)];
  console.log("\n");
  const progressBar = multi.create(100, 0, {
    format: color("{bar}") + "| {percentage}% | {message}",
  });
  console.log("\n");

  let t0 = performance.now();
  const tStart = t0;

  progressBar.start(100, 0);

  progressBar.update(20, {
    message: `🗣 Step 1: Voiceover`,
  });
  t0 = performance.now();

  const { voiceover, url } = await createVoiceover({
    video,
    entry,
    script,
    channel,
    redo,
  });

  if (url) {
    await updateFileField({ id: video, property: "voiceover", fileUrl: url });
  }

  t0 = performance.now();
  progressBar.update(40, {
    message: "🖊 Step 2: Transcribing the audio",
  });

  const transcriptPath = `src/assets/video-${video}/video-${video}-transcription.json`;
  let transcription = await readJsonFromFile(transcriptPath);

  if (!transcription || transcription.length <= 3 || redo) {
    transcription = await transcribeAudio(video, voiceover);
    await writeJsonToFile(transcription, transcriptPath);
  }

  t0 = performance.now();
  progressBar.update(40, {
    message: `🎨 Step 3: Generating images from the transcript`,
  });

  let imageMap = readJsonFromNotion({ entry, property: "imageMap" });
  if (!imageMap || imageMap.length <= 3 || redo) {
    imageMap = await promptAssistant({
      assistant_id: processEnv.ASSISTANT_ARCHITECT_ID,
      instruction:
        "Please map images to the key MOMENTS of this script I provide, not necessarily to the segments, and output in JSON format with start, end, id, description, effect: ",
      prompt: JSON.stringify(transcription.segments, replacer),
      isJSON: true,
    });

    try {
      await uploadJsonToNotion({
        entry,
        property: "imageMap",
        json: imageMap,
      });
    } catch (error) {
      console.error("Too big. Continuing: ", error);
    }
  }

  const numberOfImages = imageMap.length;

  t0 = performance.now();
  progressBar.update(60, {
    message: `🎨 Step 5: Generating ${numberOfImages} images and uploading to the cyber cloud`,
  });

  let urls;
  let imagesExistInNotion = false;
  if (imageMap[0]?.url) {
    urls = imageMap.map((image) => image.url);
  } else {
    imagesExistInNotion = await readImages({
      entry,
      property: "images",
    });

    urls =
      imagesExistInNotion.length > 1 && !redo
        ? imagesExistInNotion
        : await imageGenerationLimit(
            async () =>
              await generateImagesFromDescriptions({
                video,
                imageMap,
                lemon: true,
              }),
          );

    imageMap = imageMap.map((image, index) => {
      image.url = urls[index];
      return image;
    });
  }

  progressBar.update(80, {
    message: "🎬 Step 6: Stitching it all up, hang tight...",
  });
  t0 = performance.now();

  await updateImageField({ id, property: "images", urls });

  await stitchLimit(
    async () =>
      await renderVideo({
        entry,
        script,
        video,
        imageMap,
        transcription,
      }),
  );

  progressBar.update(90, {
    message: "🎥 Video is ready :)",
  });
  updateProgressBar(progressBar, 90, t0, "");

  await updateCheckboxField({ id, property: "done", checked: true });

  await updateDateField({ id, property: "date", date: new Date() });

  await cleanFiles(video);

  progressBar.update(100, {
    message: `Total execution time: ${formatTime(t0 - tStart)} milliseconds`,
  });

  progressBar.stop();
};

export default createVideos;
