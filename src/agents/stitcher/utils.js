import Creatomate from "creatomate"
import { video } from "../../config/config.js"

function createFirebaseImageURL(index, video) {
  const imagePath = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fvideo-${video}%2Fvideo-${video}-image-${
    index + 1
  }.png?alt=media`

  return imagePath
}

export function convertImageMapToCreatomate(images) {
  return images.map((image, index) => {
    let animation
    if (image.animation === "ZoomIn") {
      animation = new Creatomate.Scale({
        startScale: "100%",
        endScale: "120%",
        easing: "linear",
      })
    } else if (image.animation === "ZoomOut") {
      animation = new Creatomate.Scale({
        startScale: "120%",
        endScale: "100%",
        easing: "linear",
      })
    } else {
      if (Creatomate[image.animation]) {
        animation = new Creatomate[image.animation]({
          easing: "linear",
        })
      } else {
        animation = new Creatomate.PanCenter({
          startScale: "100%",
          endScale: "120%",
          easing: "linear",
        })
      }
    }

    let transition
    if (Creatomate[image.transition]) {
      transition = new Creatomate[image.transition]()
    } else {
      transition = new Creatomate.Fade()
    }

    const imageBuffer = createFirebaseImageURL(index, video)

    return new Creatomate.Image({
      track: 1,
      duration: image.end - image.start,
      source: imageBuffer,
      animations: [animation],
      // transition: if last, non
      transition: transition,
    })
  })
}

export const backgroundMusicCreatomate = (choice) => {
  const choices = {
    dynamic: `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fhenson-sahara-compressed.mp3?alt=media`,
  }
  const backgroundMusic = choices[choice] || choices[dynamic]

  return new Creatomate.Audio({
    source: backgroundMusic,
    // Make the audio track as long as the output
    duration: null,
    volume: 20,
  })
}

export const voiceOver = (video) => {
  const voiceOverURL = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fvideo-${video}%2Fvideo-${video}-voiceover.mp3?alt=media`

  return new Creatomate.Audio({
    source: voiceOverURL,
    // Make the audio track as long as the output
    duration: null,
    volume: 100,
  })
}
