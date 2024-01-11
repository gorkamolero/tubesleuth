import path from "path";
import upload from "./agents/5-uploader.js";
import {
  getRichTextFieldContent,
  readProperty,
  updateCheckboxField,
} from "./utils/notionConnector.js";
import { colorArray, multi } from "./utils/multibar.js";
import { __dirname } from "./utils/path.js";

const uploadVideos = async (entry) => {
  const id = entry.id;
  console.log(`Creating video with id ${id}`);

  const color = colorArray[Math.floor(Math.random() * colorArray.length)];
  console.log("\n");
  const progressBar = multi.create(100, 0, {
    format: color("{bar}") + "| {percentage}% | {message}",
  });

  let t0 = performance.now();
  const tStart = t0;

  progressBar.start(100, 0);

  const tags = readProperty({ entry, property: "tags" })
    .multi_select.map((tag) => tag.name)
    .join(", ");

  const title = readProperty({ entry, property: "title" }).title[0].text
    .content;

  const description = getRichTextFieldContent({
    entry,
    property: "description",
  });

  const localVideoPath = `../out/videos/video-${entry.id}.mp4`;
  const localFile = path.resolve(__dirname, localVideoPath);

  try {
    progressBar.update(20, {
      message: `🎬 Uploading video to YouTube`,
    });
    await upload({
      videoFilePath: localFile,
      title: title,
      description: description,
      tags: tags,
    });
    progressBar.update(80, {
      message: `🎬 Updating Notion database`,
    });

    await updateCheckboxField({ id, property: "uploaded", checked: true });

    progressBar.update(100, {
      message: `🎬 Video is uploaded :)`,
    });
  } catch (error) {
    progressBar.update(100, {
      message: `🎬 Video upload failed :(`,
    });
  } finally {
    progressBar.stop();
    multi.stop();
  }
};

export default uploadVideos;
