import Creatomate from "creatomate";

export const voiceOver = (video) => {
  const voiceOverURL = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fvideo-${video}%2Fvideo-${video}-voiceover.mp3?alt=media`;

  return new Creatomate.Audio({
    source: voiceOverURL,
    // Make the audio track as long as the output
    duration: null,
    volume: 100,
  });
};
