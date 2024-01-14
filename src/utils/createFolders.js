import fs from "fs";
import path from "path";
import { __dirname } from "./path.js";

export const createFolders = async () => {
  const publicFolder = path.resolve(__dirname, "../../public/assets");
  const outFolder = path.resolve(__dirname, "../../src/out");
  const outVideoFolder = path.resolve(__dirname, "../../src/out/videos");

  await fs.promises.mkdir(publicFolder, { recursive: true });
  await fs.promises.mkdir(outFolder, { recursive: true });
  await fs.promises.mkdir(outVideoFolder, { recursive: true });
};
