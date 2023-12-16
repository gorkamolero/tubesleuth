import fs from "fs";
import path from "path";
import { __filename, __dirname } from "./path.js";

export async function loadSegments(video) {
  const filePath = path.resolve(
    __dirname,
    `../assets/video-${video}/video-${video}-transcript.json`,
  );
  const data = await fs.promises.readFile(filePath, "utf-8");
  const segments = JSON.parse(data);

  return segments.segments;
}
