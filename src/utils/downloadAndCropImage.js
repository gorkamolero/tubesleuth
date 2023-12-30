import sharp from "sharp";
import axios from "axios";
import fs from "fs";

export const downloadAndCropImage = async ({ url, path, width, height }) => {
  const response = await axios({
    url,
    method: "GET",
    responseType: "stream",
  });

  await new Promise((resolve, reject) => {
    response.data
      .pipe(sharp().resize(width, height))
      .pipe(fs.createWriteStream(path))
      .on("finish", resolve)
      .on("error", reject);
  });
};
