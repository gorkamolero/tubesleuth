import pLimit from "p-limit";
import readline from "readline";

import {
  readDatabase,
  loadConfig,
  readProperty,
} from "./utils/notionConnector.js";
import createScripts from "./createScripts.js";
import createVideos from "./createVideos.js";
import uploadVideos from "./uploadVideos.js";
import { multi } from "./utils/multibar.js";

const loop = false;

export let config = {};
let videos = [];
let limit = 10;
export let channel = "";
export const imageGenerationLimit = pLimit(1);
export const stitchLimit = pLimit(1);

const init = async (debug) => {
  const actions = {
    createScripts,
    createVideos,
    uploadVideos,
  };

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question(
    "What do you want to do?\n1 - Create scripts\n2 - Create videos\n3 - Upload videos\n",
    async (actionAnswer) => {
      const actionNames = Object.keys(actions);
      const actionName = actionNames[actionAnswer - 1];
      const func = actions[actionName];

      if (!func) {
        throw new Error("Invalid action");
      }

      rl.question(
        "How many videos do you want to process? (Leave blank for all)\n",
        async (limitAnswer) => {
          limit = limitAnswer ? parseInt(limitAnswer) : Infinity;

          videos = await readDatabase({
            empty: true,
            action: actionName,
            limit,
          });

          config = await loadConfig();

          if (actionName === "createScripts") {
            // Group videos by series
            const seriesMap = new Map();
            videos.forEach((video) => {
              const series =
                readProperty({ entry: video, property: "series" })?.select
                  ?.name || "default";
              const seriesVideos = seriesMap.get(series) || [];
              seriesVideos.push(video);
              seriesMap.set(series, seriesVideos);
            });

            for (const [series, seriesVideos] of seriesMap) {
              await func(seriesVideos);
            }
            return;
          }

          videos = videos.slice(0, limit);

          const concurrencyLimit = pLimit(loop ? 1 : 3);

          const tasks = videos.map((entry) => {
            return concurrencyLimit(() =>
              func(entry).catch((error) => {
                console.error(`Error processing video ${entry.id}:`, error);
              }),
            );
          });

          // Only 10 `createVideo` calls will be executed concurrently.
          await Promise.all(tasks);

          multi.stop();
          rl.close();
        },
      );
    },
  );

  multi.stop();
};

init(false);
