import fs from "fs";
import { loadSegments } from "./loadSegments.js";
import { cleanSegments } from "./cleanSegments.js";
import { formatTime } from "./formatTimeForFFMPEG.js";

export async function generateSRT(video, transcription) {
  let segments = cleanSegments(
    transcription ? transcription.segments : await loadSegments(video),
  );

  let srtContent = "";
  let index = 1;

  // Iterate through each segment in the segments array
  for (const segment of segments) {
    // Convert each timestamp in the segment to seconds
    const startTime = formatTime(segment.start);
    const endTime = formatTime(segment.end);

    // Get the text that corresponds to this segment
    const text = segment.text;

    srtContent += `${index}\n${startTime} --> ${endTime}\n${text}\n\n`;
    index++;
  }

  await fs.promises.writeFile(
    `src/assets/video-${video}/video-${video}-captions.srt`,
    srtContent,
  );

  return {
    duration: transcription.duration,
  };
}

export default generateSRT;
