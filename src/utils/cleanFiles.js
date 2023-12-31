import fs from "fs";

export default async function cleanFiles() {
  const out1 = `src/out/voiceovers`;

  await fs.promises.rm(out1, { recursive: true, force: true });

  const out2 = `public/assets`;

  await fs.promises.rm(out2, { recursive: true, force: true });

  await fs.promises.mkdir(out1, { recursive: true });
  await fs.promises.mkdir(out2, { recursive: true });
}
