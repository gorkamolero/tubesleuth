import fs from "fs";

export default async function cleanFiles() {
  const voiceovers = `src/out/voiceovers`;

  await fs.promises.rm(voiceovers, { recursive: true, force: true });

  // recreate dir
  await fs.promises.mkdir(voiceovers, { recursive: true });
}
