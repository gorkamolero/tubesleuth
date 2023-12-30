import Creatomate from "creatomate";
import processEnv from "./env.js";
import { captionStyles } from "../config/config.js";
import downloadVideo from "./downloadVideo.js";

const client = new Creatomate.Client(processEnv.CREATOMATE_API_KEY);

export async function creatomateCaptions({ url, id }) {
  const source = new Creatomate.Source({
    outputFormat: "mp4",
    elements: [
      new Creatomate.Video({
        id,
        source: url,
        opacity: 0,
      }),
      new Creatomate.Text({
        ...captionStyles,
        transcriptSource: id,
        transcriptEffect: "highlight",
        transcriptColor: captionStyles.fontColor,
      }),
    ],
  });

  try {
    const response = await client.render({ source });
    const dir = `src/assets/video-${id}`;
    const localVidPath = `${dir}/video-${id}-output.mp4`;
    const captionsPath = `${dir}/video-${id}-captions.mp4`;

    await downloadVideo(url, localVidPath);

    const mixTwoVidsSpec = {
      width: 1080,
      height: 1920,
      fps: 60,
      clips: [
        {
          path: url,
        },
        {
          path: captionsPath,
        },
      ],
    };

    // Run Editly
    try {
      await editly(mixTwoVidsSpec);
      console.log("Captions added successfully");
    } catch (err) {
      console.error("Error during captions addition:", err);
      throw err;
    }
    return response;
  } catch (error) {
    console.error("Failed to make Creatomate call", error);
  }
}
