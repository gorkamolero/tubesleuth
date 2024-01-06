import { loadSegments } from "./loadSegments.js";
import { cleanSegments } from "./cleanSegments.js";

export async function generateCaptions({ video, transcription }) {
  let segments = cleanSegments(
    transcription ? transcription.segments : await loadSegments(video),
  );

  const sentencesWithTimes = [];
  let sentenceStartTime = 0;

  // Iterate through each segment in the segments array
  for (const segment of segments) {
    // Convert each timestamp in the segment to seconds
    const startTime = segment.start;
    const endTime = segment.end;

    // Split the segment text into sentences at commas
    const sentences = segment.text.split(",");

    for (const sentence of sentences) {
      // Get the words that correspond to this sentence
      const words = sentence.split(" ").map((word, index, wordArray) => {
        const timePerWord = (endTime - startTime) / wordArray.length;
        const adjustedTimePerWord =
          timePerWord * (1 - (index / wordArray.length) * 0.1); // Adjust time per word based on index
        return {
          content: word,
          startTime: sentenceStartTime + index * adjustedTimePerWord,
        };
      });

      sentencesWithTimes.push(words);
      sentenceStartTime += endTime - startTime;
    }
  }

  return sentencesWithTimes;
}

export default generateCaptions;
