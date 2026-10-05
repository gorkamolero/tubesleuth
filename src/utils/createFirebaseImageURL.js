export function createFirebaseImageURL(index, video) {
  const imagePath = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fvideo-${video}%2Fvideo-${video}-image-${
    index + 1
  }.png?alt=media`;

  return imagePath;
}
