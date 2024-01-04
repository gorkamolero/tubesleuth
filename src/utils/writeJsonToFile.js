import fs from "fs";
import parseJson from "parse-json";

export const writeJsonToFile = async (jsonObject, filePath) => {
  const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));

  await fs.promises.mkdir(dirPath, { recursive: true });

  await fs.promises.writeFile(filePath, JSON.stringify(jsonObject, null, 2));
};

export const readJsonFromFile = async (filePath) => {
  // check dir exists; if not, return null
  try {
    await fs.promises.access(filePath);
  } catch (error) {
    return null;
  }
  const file = await fs.promises.readFile(filePath);
  return parseJson(file);
};
