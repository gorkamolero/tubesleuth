import dotenv from "dotenv";

let processEnv;

const dotenvConfig = dotenv.config();

if (dotenvConfig.error) {
  console.log("This must be replit then");
  processEnv = process.env;
} else {
  processEnv = dotenvConfig.parsed;
}

export default processEnv;
