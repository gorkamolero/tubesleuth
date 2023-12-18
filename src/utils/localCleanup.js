import fs from "fs";
import readline from "readline";

export async function localCleanup(video) {
  console.log(
    `This will clean all local files, so make sure you have all you need before proceeding`,
  );

  // prompt user to confirm
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const prompt = await new Promise((resolve, reject) => {
    rl.question(`Do you want to clean up local files? (y/n)`, (answer) => {
      resolve(answer);
    });
  });

  if (prompt === "y") {
    if (fs.existsSync(`./src/assets`)) {
      await fs.promises.rm("./src/assets", { recursive: true });
      await fs.promises.mkdir("./src/assets", { recursive: true });

      // make video folder with video-${video}

      await fs.promises.mkdir(`./src/assets/video-${video}`, {
        recursive: true,
      });
    }

    console.log("🐌 Local cleanup complete");
    rl.close();
  } else {
    console.log("🐌 Aborting local cleanup, continuing");
  }
}
