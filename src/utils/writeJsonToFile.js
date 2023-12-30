import fs from "fs";

export const writeJsonToFile = async (jsonObject, filePath) => {
  const dirPath = filePath.substring(0, filePath.lastIndexOf("/"));

  await fs.promises.mkdir(dirPath, { recursive: true });

  await fs.promises.writeFile(filePath, JSON.stringify(jsonObject, null, 2));
};
