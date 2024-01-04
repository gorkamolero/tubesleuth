import fs from "fs";

export default async function cleanFiles(video) {
  const out1 = `src/assets/video-${video}/`;

  await fs.promises.rm(out1, { recursive: true, force: true });
}
