import fs from "fs";
import readline from "readline";
import { google } from "googleapis";
const OAuth2 = google.auth.OAuth2;

const redirectUri = "http://localhost";

// video category IDs for YouTube:
const categoryIds = {
  Entertainment: 24,
  Education: 27,
  ScienceTechnology: 28,
  Shorts: 42,
};

// If modifying these scopes, delete your previously saved credentials in client_oauth_token.json
const SCOPES = ["https://www.googleapis.com/auth/youtube.upload"];
const TOKEN_PATH = "src/config/client_oauth_token.json";

const videoFilePath = "src/assets/video-gywyp99d/video-gywyp99d-output.mp4";
const videoFileRemotePath =
  "https://cdn.creatomate.com/renders/4b385c06-7e64-4ce0-8122-40b4d254b204.mp4";

const upload = async ({ videoFilePath, title, description, tags }) => {
  try {
    // Load client secrets from a local file.
    const content = await fs.promises.readFile("src/config/client_secret.json");

    // Authorize a client with the loaded credentials, then call the YouTube API.
    const credentials = JSON.parse(content);
    const clientSecret = credentials.web.client_secret;
    const clientId = credentials.web.client_id;
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUri);

    let token;
    try {
      token = await fs.promises.readFile(TOKEN_PATH);
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
  } catch (err) {
    console.log("Error loading client secret file: " + err);
  }
};

async function uploadVideo({ videoFilePath, auth, title, description, tags }) {
  const service = google.youtube("v3");

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
      /*
    console.log('Video uploaded. Uploading the thumbnail now.')
    service.thumbnails.set({
      auth: auth,
      videoId: response.data.id,
      media: {
        body: fs.createReadStream(thumbFilePath)
      },
    }, function(err, response) {
      if (err) {
        console.log('The API returned an error: ' + err);
        return;
      }
      console.log(response.data)
    })
    */
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
export function getNewToken(oauth2Client, callback) {
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

  data.videoFilePath = localVideo;

  await upload(data);
};

export default upload;

// init();
