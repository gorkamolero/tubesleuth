import fs from "fs";
import axios from "axios";

async function downloadVideo(videoUrl, outputPath) {
  try {
    // remove xxx.mp4 from videoFilePath but keep the rest of slashes
    const videoDirPath = outputPath.replace(".mp4", "");

    // create dir first with fs
    await fs.promises.mkdir(videoDirPath, { recursive: true });
    const response = await axios({
      method: "GET",
      url: videoUrl,
      responseType: "stream",
    });

    const writer = fs.createWriteStream(outputPath);

    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      response.data.on("end", () => resolve(outputPath));
      response.data.on("error", reject);
    });
  } catch (error) {
    console.error("Error downloading the video:", error);
    throw error;
  }
}

export default downloadVideo;
