import Creatomate from "creatomate";
import fs from "fs";

import { backgroundMusicCreatomate } from "../utils/backgroundMusicCreatomate.js";
import { voiceOver } from "../utils/voiceOver.js";
import { convertImageMapToCreatomate } from "../utils/convertImageMapToCreatomate.js";
import generateCaptions from "../utils/captions.js";
import { captionStyles, height, width } from "../config/config.js";
import processEnv from "../utils/env.js";
import downloadVideo from "../utils/downloadVideo.js";

const apiKey = processEnv.CREATOMATE_API_KEY;

const client = new Creatomate.Client(apiKey);

const stitchItAllUp = async ({ script, video, imageMap, transcription }) => {
  const futureVideoPath = `src/assets/video-${video}/video-${video}-output.mp4`;
  try {
    const exists = await fs.promises.stat(futureVideoPath);
    if (exists) {
      console.log(`Video ${video} already exists`);

      const output = {
        url: `https://cdn.creatomate.com/renders/${video}.mp4`,
        videoId: video,
        title: script.title,
        description: script.description,
        tags: script.tags,
        script: script.script,
        localFile: futureVideoPath,
      };
      return output;
    }
  } catch (error) {}

  const { keyframes, duration } = await generateCaptions({
    video,
    transcription,
  });

  const images = imageMap;
  const voiceover = voiceOver(video);

  const elements = [
    ...convertImageMapToCreatomate({ script, images, video }),
    backgroundMusicCreatomate(script?.mood || "deep"),
    voiceover,
    new Creatomate.Text({
      ...captionStyles,
      text: keyframes,
    }),
  ];

  const source = new Creatomate.Source({
    outputFormat: "mp4",
    frameRate: 30,
    width,
    height,
    duration,
    elements,
  });

  const response = await client.render({
    source,
  });

  const url = response[0].url;

  const dir = `./src/assets/video-${video}`;

  try {
    await fs.promises.mkdir(dir, { recursive: true });
  } catch (err) {
    console.error("Failed to create directory", err);
  }

  try {
    await fs.promises.writeFile(`${dir}/video-${video}-url.txt`, url);
  } catch (err) {
    console.error("Failed to write file", err);
  }

  // upload to firestore storage

  // save video locally
  const filePath = `${dir}/video-${video}-output.mp4`;
  try {
    await downloadVideo(url, filePath);
  } catch (error) {
    console.error("Failed to download file", error);
    // throw error;
  }

  const output = {
    url,
    videoId: video,
    title: script.title,
    description: script.description,
    tags: script.tags,
    script: script.script,
    localFile: filePath,
  };

  return output;
};

/*

curl -s -X POST https://api.creatomate.com/v1/renders \
  -H 'Authorization: Bearer YOUR_API_KEY' \
  -H 'Content-Type: application/json' \
  --data-binary @- << EOF
{
  "output_format": "mp4",
  "source": {
    "elements": [
      {
        "type": "video",
        "id": "17ca2169-786f-477f-aaea-4a2598bf24eb",
        "source": "https://cdn.creatomate.com/demo/the-daily-stoic-podcast.mp4"
      },
      {
        "type": "text",
        "transcript_source": "17ca2169-786f-477f-aaea-4a2598bf24eb",
        "transcript_effect": "highlight",
        "transcript_maximum_length": 14,
        "y": "82%",
        "width": "81%",
        "height": "35%",
        "x_alignment": "50%",
        "y_alignment": "50%",
        "fill_color": "#ffffff",
        "stroke_color": "#000000",
        "stroke_width": "1.6 vmin",
        "font_family": "Montserrat",
        "font_weight": "700",
        "font_size": "9.29 vmin",
        "background_color": "rgba(216,216,216,0)",
        "background_x_padding": "31%",
        "background_y_padding": "17%",
        "background_border_radius": "31%"
      }
    ]
  }
}

*/

export default stitchItAllUp;
