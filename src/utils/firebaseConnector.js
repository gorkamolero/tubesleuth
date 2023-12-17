import admin from "firebase-admin";

// import json from "./serviceAccountKey.json"
import serviceAccount from "../config/tubesleuth-firebase-adminsdk-3u6pr-b9a83abb5f.json" assert { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "tubesleuth.appspot.com",
});

const bucket = admin.storage().bucket();

const uploadFile = async (localFilePath, storageFilePath) => {
  const [file] = await bucket.upload(localFilePath, {
    destination: storageFilePath,
  });
  console.log(`${localFilePath} uploaded to ${storageFilePath}.`);
  return file;
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

  return file;
};

const downloadFile = async (storageFilePath, localFilePath) => {
  const [file] = await bucket
    .file(storageFilePath)
    .download({ destination: localFilePath });
  console.log(`Downloaded ${storageFilePath} to ${localFilePath}.`);
  return file;
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

/*

TODO: upload stuff to firestore

const firestore = ...

export const uploadToFirestore = (object) => {
  ...
}

*/

export { uploadFile, uploadB64Image, downloadFile };
