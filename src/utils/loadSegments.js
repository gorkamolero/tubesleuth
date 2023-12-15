import fs from "fs";
import path from "path";
import { __filename, __dirname } from "./path.js";

export async function loadSegments(video) {
  const filePath = path.resolve(
    __dirname,
    `../../assets/video-${video}/video-${video}-transcript.json`,
  );
  const data = await fs.promises.readFile(filePath, "utf-8");
  let segments = JSON.parse(data);

  // Iterate through each segment and remove all periods and commas from the text
  segments.segments = segments.segments.map((segment) => {
    segment.text = segment.text.replace(/[.,]/g, "");
    return segment;
  });

  return segments;
}
