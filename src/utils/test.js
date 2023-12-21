const videoFilePath = "src/assets/video-gywyp99d/video-gywyp99d-output.mp4";

const videoDirPath = videoFilePath.replace(".mp4", "");

// create dir first with fs

const init = async () => {
  await fs.promises.mkdir(videoDirPath, { recursive: true });
};
