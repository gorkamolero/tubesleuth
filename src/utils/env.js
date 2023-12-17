import dotenv from "dotenv";

const isReplit = false;

let processEnv;

if (!isReplit) {
  const dotenvConfig = dotenv.config();

  if (dotenvConfig.error) {
    throw new Error("Couldn't parse .env file");
  }

  processEnv = dotenvConfig.parsed;
} else {
  processEnv = process.env;
}
export default processEnv;
