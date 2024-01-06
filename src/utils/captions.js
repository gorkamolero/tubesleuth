import path from "path";
import {whisper} from "whisper-node";

import { __filename, __dirname } from "../utils/path.js";
import convertMp3ToWav from "./convertMp3ToWav.js";

import isWord from "is-word";
const englishWords = isWord('american-english');

function mergeCaptions(captions) {
  const mergedCaptions = [];
  let previousCaption = null;

  for (const caption of captions) {
      if (caption.speech.startsWith("'") || /^[,.?!;:]$/.test(caption.speech)) {
          if (previousCaption) {
              // Merge with previous and update the end time
              previousCaption.speech += caption.speech;
              previousCaption.end = caption.end;
          }
      } else {
          if (previousCaption) {
              // Push the previous caption to the merged array
              mergedCaptions.push(previousCaption);
          }
          // Set the current caption as the previous one for the next iteration
          previousCaption = caption;
      }
  }

  // Add the last caption if it hasn't been merged
  if (previousCaption) {
      mergedCaptions.push(previousCaption);
  }

  return mergedCaptions;
}

function mergeCaptionsAdvanced(captions) {
  const mergedCaptions = [];
  let i = 0;

  while (i < captions.length) {
      let currentCaption = captions[i];
      let nextCaption = captions[i + 1];
      
      // Remove non-letter characters except apostrophes for word check
      let currentWordCheck = currentCaption.speech.replace(/[^a-zA-Z0-9']/g, "");

      // If the current word is valid or a punctuation, push it as is
      if (englishWords.check(currentWordCheck) || /[?.!,;:]$/.test(currentCaption.speech)) {
          mergedCaptions.push(currentCaption);
      } else if (nextCaption) {
          // Attempt to merge with the next caption
          let mergedSpeech = currentCaption.speech + nextCaption.speech;
          let mergedWordCheck = mergedSpeech.replace(/[^a-zA-Z0-9']/g, "");

          // Check if the merged speech forms a valid word
          if (englishWords.check(mergedWordCheck)) {
              currentCaption = {
                  start: currentCaption.start,
                  end: nextCaption.end,
                  speech: mergedSpeech
              };
              i++; // Skip the next caption as it's merged
          }
          mergedCaptions.push(currentCaption);
      } else {
          // Last caption or no valid merge, just add it
          mergedCaptions.push(currentCaption);
      }
      i++; // Move to the next caption
  }

  return mergedCaptions;
}


export async function generateCaptions({video}) {
  const videopath = `../../public/assets/video-${video}-voiceover`;
  const outputWav = path.resolve(__dirname, `${videopath}.wav`);

  await convertMp3ToWav(video);

  try {
    const transcript = await whisper(outputWav, {
      modelName: "base.en",
      whisperOptions: {
        word_timestamps: true,
      },
    });

    const captions = mergeCaptionsAdvanced(mergeCaptions(transcript));

    return captions;
  } catch (error) {
    console.error("Error in audio caption:", error);
  }
}

export default generateCaptions;
