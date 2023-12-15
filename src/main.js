import { v4 as uuidv4 } from "uuid";
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

const init = async () => {
  // let's measure the time it takes to run the whole thing
  let t0 = performance.now();
  const tStart = t0;

  const video = uuidv4().replace("-", "").substring(0, 8);

  console.log(`🎥 Starting video ${video}`);
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

  t0 = measurePerformance(t0, "🖊  Step 1 complete! Script generated!");

  const voiceover = await createVoiceover(video, script);

  t0 = measurePerformance(t0, "🙊 Step 2 complete! Voiceover uploaded!");

  const transcription = await transcribeAudio(video, voiceover);

  t0 = measurePerformance(t0, "📝 Step 3 complete! Transcription generated!");

  const imageMap = await promptAssistant({
    video,
    assistant_id: processEnv.ASSISTANT_ARCHITECT_ID,
    instruction:
      "Please map images to the key MOMENTS of this script I provide, not necessarily to the segments, and output in JSON format with start, end, id, description, effect: ",
    prompt: JSON.stringify(transcription.segments, replacer),
    path: `src/assets/video-${video}/video-${video}-imagemap.json`,
  });

  t0 = measurePerformance(t0, "🎨 Step 4 complete! Image map created!");

  console.log("📷 Generating images from descriptions...");
  await generateImagesFromDescriptions(video, imageMap);

  t0 = measurePerformance(
    t0,
    "📸 Step 5 complete! Images generated and uploaded!",
  );

  console.log("🎬 Stitching it all up...");

  const stitch = await stitchItAllUp({ script, video, imageMap });

  // stitch is a js object, let's output it to the console in readable format

  t0 = measurePerformance(
    t0,
    "🎬 Final step complete! Video is ready at !" +
      JSON.stringify(stitch, null, 2),
  );
  console.log(`Total execution time: ${formatTime(t0 - tStart)} milliseconds`);
};

init();
