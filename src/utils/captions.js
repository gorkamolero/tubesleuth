import { fontColor as color } from "../config/config.js";

import Creatomate from "creatomate";
import { loadSegments } from "./loadSegments.js";
import { cleanSegments } from "./cleanSegments.js";

async function generateCaptions(video, transcription) {
  let segments = cleanSegments(
    transcription ? transcription.segments : await loadSegments(video),
  );

  const keyframes = [];

  // Iterate through each segment in the segments array
  for (const segment of segments) {
    // Convert each timestamp in the segment to seconds
    const startTime = segment.start;
    const endTime = segment.end;

    // Get the words that correspond to this segment
    const words = segment.text.split(" ").map((word, index, wordArray) => {
      const timePerWord = (endTime - startTime) / wordArray.length;
      const adjustedTimePerWord =
        timePerWord * (1 - (index / wordArray.length) * 0.1); // Adjust time per word based on index
      return {
        content: word,
        startTime: startTime + index * adjustedTimePerWord - 0.5, // Subtract 0.5 seconds from the start time
      };
    });

    // Iterate through each word
    for (let i = 0; i < words.length; i++) {
      const word = words[i];

      let text = "";

      // Encapsulate each spoken word with an RGBA color tag, to make it slightly transparent
      const spokenWords = words.slice(0, i);
      if (spokenWords.length > 0) {
        text += `[color ${color}]${spokenWords
          .map((word) => word.content)
          .join(" ")}[/color] `;
      }

      // Encapsulate the current spoken word with a color tag to make it fully white
      text += `[color #fff]${word.content}[/color]`;

      // Add the words that have not yet been spoken. As the default 'fillColor' is null,
      // the text will be invisible, but reserve its space in the text element
      const unspokenWords = words.slice(i + 1);
      if (unspokenWords.length) {
        text += ` ${unspokenWords.map((word) => word.content).join(" ")}`;
      }

      // Create a keyframe for each spoken word
      keyframes.push(new Creatomate.Keyframe(text, word.startTime));
    }
  }

  return {
    keyframes,
    duration: transcription.duration,
  };
}
export default generateCaptions;
