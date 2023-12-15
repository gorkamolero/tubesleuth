import Creatomate from "creatomate";

export const backgroundMusicCreatomate = (choice) => {
  const firebasepath = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fmusic%2F`;
  const choices = {
    powerful: `${firebasepath}powerful.mp3?alt=media`,
    mysterious: `${firebasepath}mysterious.mp3?alt=media`,
    sentimental: `${firebasepath}sentimental.mp3?alt=media`,
    interesting: `${firebasepath}interesting.mp3?alt=media`,
    deep: `${firebasepath}deep.mp3?alt=media`,
    epic: `${firebasepath}epic.mp3?alt=media`,
  };
  const backgroundMusic = choices[choice] || choices.deep;

  return new Creatomate.Audio({
    source: backgroundMusic,
    // Make the audio track as long as the output
    duration: null,
    volume: 20,
  });
};
