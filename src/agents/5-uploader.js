import fs from "fs";
import path from "path";
import readline from "readline";
import { google } from "googleapis";
import { __dirname } from "../utils/path.js";
const OAuth2 = google.auth.OAuth2;

const redirectUri = "http://localhost";

// video category IDs for YouTube:
const categoryIds = {
  Entertainment: 24,
};

// If modifying these scopes, delete your previously saved credentials in client_oauth_token.json
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const TOKEN_PATH = "../config/client_oauth_token.json";

const upload = async ({ videoFilePath, title, description, tags }) => {
  // Load client secrets from a local file.
  const contentPath = path.resolve(__dirname, "../config/client_secret.json");
  const content = await fs.promises.readFile(contentPath);

  // Authorize a client with the loaded credentials, then call the YouTube API.
  const credentials = JSON.parse(content);
  const clientSecret = credentials.web.client_secret;
  const clientId = credentials.web.client_id;
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUri);

  const fullTokenPath = path.resolve(__dirname, TOKEN_PATH);

  let token;
  try {
    token = await fs.promises.readFile(fullTokenPath, "utf8");
  } catch (err) {
    token = await getNewToken(oauth2Client);
  }

  oauth2Client.credentials = JSON.parse(token);
  await uploadVideo({
    videoFilePath,
    auth: oauth2Client,
    title,
    description,
    tags,
  });
};

async function uploadVideo({ videoFilePath, auth, title, description, tags }) {
  const service = google.youtube("v3");

  // read vidoe file path
  let exists;
  try {
    await fs.promises.access(videoFilePath, fs.constants.F_OK);
    exists = true;
  } catch (err) {
    exists = false;
  }

  if (!exists) {
    return;
  }

  return service.videos.insert(
    {
      auth: auth,
      part: "snippet,status",
      notifySubscribers: false,
      requestBody: {
        snippet: {
          title,
          description,
          tags,
          categoryId: categoryIds.Entertainment,
          defaultLanguage: "en",
          defaultAudioLanguage: "en",
        },
        status: {
          privacyStatus: "private",
        },
      },
      media: {
        body: fs.createReadStream(videoFilePath),
      },
    },
    function (err, response) {
      if (err) {
        console.log("The API returned an error: " + err);
        return;
      }
      console.log(response.data);
    },
  );
}

function authorize(credentials, callback) {
  const clientSecret = credentials.web.client_secret;
  const clientId = credentials.web.client_id;
  const redirectUrl = redirectUri;
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  fs.readFile(TOKEN_PATH, function (err, token) {
    if (err) {
      getNewToken(oauth2Client, callback);
    } else {
      oauth2Client.credentials = JSON.parse(token);
      callback(oauth2Client);
    }
  });
}

/**
 * Get and store new token after prompting for user authorization, and then
 * execute the given callback with the authorized OAuth2 client.
 *
 * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
 * @param {getEventsCallback} callback The callback to call with the authorized
 *     client.
 */
function getNewToken(oauth2Client, callback) {
  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
  });
  console.log("Authorize this app by visiting this url: ", authUrl);
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("Enter the full url from that page here: ", function (fullUrl) {
    // url is http://127.0.0.1/?code=4/0AfJohXkzAx2QChciUBD6rsA6gk9khCnHwALcFEnycbbJMzHLwL3FAxZn79hJg3RD-x2VpA&scope=https://www.googleapis.com/auth/youtube.upload, get the code
    let code = fullUrl.split("code=")[1].split("&")[0];
    // substitute %2F for / and %3A for : in code
    code = code.replace(/%2F/g, "/").replace(/%3A/g, ":");
    rl.close();
    oauth2Client.getToken(code, function (err, token) {
      if (err) {
        console.log("Error while trying to retrieve access token", err);
        return;
      }
      oauth2Client.credentials = token;
      storeToken(token);
      callback(oauth2Client);
    });
  });
}

/**
 * Store token to disk be used in later program executions.
 *
 * @param {Object} token The token to store to disk.
 */
async function storeToken(token) {
  // create file first if doesn't exist
  if (!fs.existsSync(TOKEN_PATH)) {
    fs.writeFileSync(TOKEN_PATH, "");
  }
  fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
    if (err) throw err;
    console.log("Token stored to " + TOKEN_PATH);
  });
}

const init = async () => {
  const path = "src/assets/test/video.mp4";
  const data = {
    title: "My YouTube Short",
    description: "This is a test short.",
    tags: ["shorts"],
  };

  data.videoFilePath = path;

  await upload(data);
};

export default upload;

// init();
