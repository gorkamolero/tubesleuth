import admin from "firebase-admin";

// import json from "./serviceAccountKey.json"
import serviceAccount from "../config/tubesleuth-firebase-adminsdk-3u6pr-b9a83abb5f.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "tubesleuth.appspot.com",
});

const bucket = admin.storage().bucket();

const uploadFile = async (localFilePath, storageFilePath) => {
  try {
    const [file] = await bucket.upload(localFilePath, {
      destination: storageFilePath,
    });
    console.log(`${localFilePath} uploaded to ${storageFilePath}.`);
    return file;
  } catch (e) {
    console.log("🔥 Error uploading file to Firebase", e);
    return e;
  }
};

const uploadB64Image = async (
  b64Image,
  storageFilePath,
  contentType = "image/png",
) => {
  const file = bucket.file(storageFilePath);
  await file.save(b64Image, {
    contentType,
  });

  // return url
  const url = await file.getSignedUrl({
    action: "read",
    expires: "03-09-2491",
  });

  return url[0];
};

const downloadFile = async (storageFilePath, localFilePath) => {
  const [file] = await bucket
    .file(storageFilePath)
    .download({ destination: localFilePath });
  console.log(`Downloaded ${storageFilePath} to ${localFilePath}.`);
  return localFilePath;
};

export const uploadToFirestore = async ({
  video,
  title,
  description,
  tags,
  script,
  url,
}) => {
  const object = {
    video,
    title,
    description,
    tags,
    script,
    url,
  };

  try {
    await admin.firestore().collection("videos").doc(video).set(object);
    console.log("🔥 Uploaded video to Firestore");
  } catch (e) {
    console.log("🔥 Error uploading video to Firestore", e);
    return e;
  }
};

const firestore = admin.firestore();

export { uploadFile, uploadB64Image, downloadFile, firestore };
