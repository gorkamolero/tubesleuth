import Creatomate from "creatomate"

function createFirebaseImageURL(index, video) {
  const imagePath = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fvideo-${video}%2Fvideo-${video}-image-${
    index + 1
  }.png?alt=media`

  return imagePath
}

export function convertImageMapToCreatomate({ script, images, video }) {
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

    let duration = image.end - image.start
    // if last item, choose script.duration as the end instead of image.end
    if (index === images.length - 1) {
      duration = script.duration - image.start
    }

    return new Creatomate.Image({
      track: 1,
      duration,
      source: imageBuffer,
      animations: [animation],
      // transition: if last or first, none
      ...(index === 0 || index === images.length - 1 ? {} : { transition }),
    })
  })
}

export const backgroundMusicCreatomate = (choice) => {
  const firebasepath = `https://firebasestorage.googleapis.com/v0/b/tubesleuth.appspot.com/o/assets%2Fmusic%2F`
  const choices = {
    powerful: `${firebasepath}powerful.mp3?alt=media`,
    mysterious: `${firebasepath}mysterious.mp3?alt=media`,
    sentimental: `${firebasepath}sentimental.mp3?alt=media`,
    interesting: `${firebasepath}interesting.mp3?alt=media`,
    deep: `${firebasepath}deep.mp3?alt=media`,
    epic: `${firebasepath}epic.mp3?alt=media`,
  }
  const backgroundMusic = choices[choice] || choices.deep

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
