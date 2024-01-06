import path, { dirname } from "path";
import upload from "./agents/5-uploader.js";
import {
  getRichTextFieldContent,
  readProperty,
} from "./utils/notionConnector.js";
import { colorArray, multi } from "./utils/multibar.js";

const uploadVideos = async (entry) => {
  console.log(`Creating video with id ${id}`);

  const color = colorArray[Math.floor(Math.random() * colorArray.length)];
  console.log("\n");
  const progressBar = multi.create(100, 0, {
    format: color("{bar}") + "| {percentage}% | {message}",
  });

  let t0 = performance.now();
  const tStart = t0;

  progressBar.start(100, 0);

  const tags = readProperty({ entry, property: "tags" }).multiSelect.join(", ");
  const title = getRichTextFieldContent({ entry, property: "title" });
  const description = getRichTextFieldContent({
    entry,
    property: "description",
  });

  const localVideoPath = `src/out/videos/video-${entry.id}/.mp4`;
  const localFile = path.resolve(dirname, localVideoPath);

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

    updateProgressBar(progressBar, 100, t0, "🎬 Video is uploaded :)");
  } catch (error) {
    updateProgressBar(progressBar, 100, t0, "🎬 Video upload failed :(");

    await updateCheckboxField({
      id,
      property: "dontupload",
      checked: true,
    });
  }
};

export default uploadVideos;
