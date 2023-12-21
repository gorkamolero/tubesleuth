import google from "googleapis";
import fs from "fs";
const OAuth2 = google.auth.OAuth2;

import processEnv from "../utils/env.js";

// Initialize OAuth2 client
const oauth2Client = new OAuth2(
  processEnv.CLIENT_ID,
  processEnv.CLIENT_SECRET,
  processEnv.REDIRECT_URI,
);

oauth2Client.setCredentials({
  refresh_token: process.env.REFRESH_TOKEN,
});

const youtube = google.youtube({
  version: "v3",
  auth: oauth2Client,
});

async function uploadShort(filePath, title, description) {
  try {
    const response = await youtube.videos.insert({
      part: "snippet,status",
      notifySubscribers: false,
      requestBody: {
        snippet: {
          title: title,
          description: description,
          tags: ["shorts"],
          categoryId: "22", // Category for People & Blogs
        },
        status: {
          privacyStatus: "public",
          selfDeclaredMadeForKids: false,
        },
      },
      media: {
        body: fs.createReadStream(filePath),
      },
    });

    console.log("Upload Successful, Video ID:", response.data.id);
  } catch (error) {
    console.error("Error uploading video:", error);
  }
}

// Example Usage
// uploadShort('path/to/short.mp4', 'My YouTube Short', 'This is a test short.');
