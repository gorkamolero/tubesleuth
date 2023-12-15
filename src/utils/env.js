import dotenv from "dotenv";

const dotenvConfig = dotenv.config();

if (dotenvConfig.error) {
  throw new Error("Couldn't parse .env file");
}

const processEnv = dotenvConfig.parsed;

export default processEnv;
