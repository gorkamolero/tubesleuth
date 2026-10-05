import Creatomate from "creatomate";

export const voiceOver = (video) => {
  const url = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fvideo-${video}%2Fvideo-${video}-voiceover.mp3?alt=media`;

  const voiceover = new Creatomate.Audio({
    source: url,
    // Make the audio track as long as the output
    duration: null,
    volume: 100,
  });

  return voiceover;
};
