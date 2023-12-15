import dotenv from "dotenv";

const replitStrings = ["replit", "repl.it", "replit.com"];
const isReplit = replitStrings.some((str) =>
  window.location.href.includes(str),
);

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
