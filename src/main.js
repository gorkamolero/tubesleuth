import { formatTime } from "./utils/formatTime.js";
import { cta } from "./config/config.js";

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

const init = async (debug) => {
  // let's measure the time it takes to run the whole thing
  let t0 = performance.now();
  const tStart = t0;

  const video = generateRandomId();

  console.log(`🎥 Starting video with id  -   ${video}`);

  await localCleanup(video);

  console.log("Step 1: We write a script");
  const script = await askAssistant({
    video,
    assistant_id: processEnv.ASSISTANT_SCRIPTWRITER_ID,
    instruction:
      "Create a script for a YouTube Short video, with title, description and tags, including #shorts for:",
    question: "🎥 What is the video about?",
    path: `src/assets/video-${video}/video-${video}-script.json`,
    cta,
    debug: false,
    // testPrompt: "The Lost Pillars of Atlantis: A journey into the Egyptian city of Sais, examining the supposed pillars that hold the records of Atlantis, as claimed by the ancient philosopher Krantor.",
  });

  try {
    let scriptPath = `assets/video-${video}/video-${video}-script.json`;
    await uploadFile(`src/${scriptPath}`, scriptPath);
  } catch (e) {
    console.log("🐌 Error uploading script to Firebase", e);
  }

  t0 = measurePerformance(t0, `🖊  Step 1 complete! Script's done`);

  console.log("Step 2: We get a voice actor to read it");
  const voiceover = await createVoiceover(video, script);

  t0 = measurePerformance(t0, `🙊 Step 2 complete! The cyber voice is ready!`);

  console.log("Step 3: We transcribe the voice to find the exact times");

  const transcription = await transcribeAudio(video, voiceover);

  t0 = measurePerformance(
    t0,
    "📝 Step 3 complete! We put their voice through a machine and now we know everything!",
  );

  console.log("Step 4: We think very hard about what images to show");

  const imageMap = await promptAssistant({
    video,
    assistant_id: processEnv.ASSISTANT_ARCHITECT_ID,
    instruction:
      "Please map images to the key MOMENTS of this script I provide, not necessarily to the segments, and output in JSON format with start, end, id, description, effect: ",
    prompt: JSON.stringify(transcription.segments, replacer),
    path: `src/assets/video-${video}/video-${video}-imagemap.json`,
  });

  try {
    let imageMapPath = `assets/video-${video}/video-${video}-imagemap.json`;
    await uploadFile(`src/${imageMapPath}`, imageMapPath);
  } catch (e) {
    console.log("🐌 Error uploading image map to Firebase", e);
  }

  t0 = measurePerformance(
    t0,
    `🎨 Step 4 complete! From the cyber voice and script we are creating images!`,
  );

  const numberOfImages = imageMap.length;

  console.log(`🐌 ${numberOfImages} images to be generated now. Hang tight...`);

  await generateImagesFromDescriptions(video, imageMap);

  t0 = measurePerformance(
    t0,
    "📸 Step 5 complete! Images generated and uploaded to the cyber cloud!",
  );

  console.log("🎬 Stitching it all up, hang tight...");

  try {
    const stitch = await stitchItAllUp({
      script,
      video,
      imageMap,
      transcription,
    });

    if (stitch && stitch?.tags && stitch?.tags.length > 0) {
      stitch.tags = stitch.tags.join(", ");
    }

    t0 = measurePerformance(
      t0,
      "🎬 Final step complete! Video is ready at !" +
        JSON.stringify(stitch, null, 2),
    );
    console.log(
      `Total execution time: ${formatTime(t0 - tStart)} milliseconds`,
    );
  } catch (e) {
    t0 = measurePerformance(
      t0,
      "🎬 Final step failed! But check Creatomate. The video might be created, and check the local files here",
    );
    console.log(e);
  }
};

init(false);
