import Creatomate from "creatomate"
import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

const client = new Creatomate.Client("Your API key")

const imageMap = [
  {
    id: 0,
    start: 0,
    end: 3.54,
    description:
      "A misty ancient water body with faint whispers echoing around.",
    transition: "Fade",
    animation: "ZoomIn",
  },
  {
    id: 1,
    start: 3.54,
    end: 9.86,
    description:
      "A montage of ancient civilizations (Mesopotamian, Norse, Maya) with a looming storm in the background.",
    transition: "Fade",
    animation: "ZoomIn",
    effect: "Cross dissolve between images",
  },
  {
    id: 2,
    start: 9.86,
    end: 14.88,
    description:
      "Illustration of the Epic of Gilgamesh with dark rain clouds and a biblical Ark in tumultuous waters.",
    transition: "Fade",
    animation: "PanRight",
    effect: "Pan across illustrations",
  },
  {
    id: 3,
    start: 14.88,
    end: 26.2,
    description:
      "Norse icy landscapes with a massive wave, and Maya cities with rising floodwaters.",
    transition: "Fade",
    animation: "ZoomOut",
  },
  {
    id: 4,
    start: 26.2,
    end: 35.6,
    description:
      "A globe with highlighted regions of these stories, connected by water waves.",
    transition: "Fade",
    animation: "ZoomIn",
    effect: "Slow zoom in on globe",
  },
  {
    id: 5,
    start: 35.6,
    end: 43.48,
    description:
      "Shadowy figures pondering over ancient texts, surrounded by artifacts.",
    transition: "Fade",
    animation: "PanRight",
    effect: "Fade between figures and artifacts",
  },
  {
    id: 6,
    start: 43.48,
    end: 52.44,
    description:
      "A diver exploring underwater ruins with a flashlight, uncovering hidden inscriptions.",
    transition: "Fade",
    animation: "ZoomIn",
    effect: "Gradual brightening effect on underwater scene",
  },
  {
    id: 7,
    start: 52.44,
    end: 56.97,
    description:
      "Waters retreating to reveal an ancient stone with inscriptions, then fading to the misty waters from the beginning.",
    transition: "Fade",
    animation: "ZoomIn",
    effect: "Fade to ancient stone then back to misty waters",
  },
]

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

function createImageBuffer(index, video) {
  const imagePath = path.join(
    __dirname,
    `../assets/video-${video}/video-${video}-image-${index + 1}.png`
  )
  return fs.readFileSync(imagePath)
}

function convertImageMapToCreatomate(imageMap) {
  return imageMap.map((image, index) => {
    let animation
    if (image.animation === "ZoomIn") {
      animation = new Creatomate.PanCenter({
        startScale: "100%",
        endScale: "120%",
        easing: "linear",
      })
    } else if (image.animation === "ZoomOut") {
      animation = new Creatomate.PanCenter({
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

    const imageBuffer = createImageBuffer(index, 1)

    return new Creatomate.Image({
      track: 1,
      duration: image.end - image.start,
      source: imageBuffer,
      animations: [animation],
      transition: transition,
    })
  })
}

function createAudioBuffer(fullpath) {
  const audioPath = path.resolve(__dirname, fullpath)
  return fs.readFileSync(audioPath)
}

const backgroundMusic = createAudioBuffer("../assets/hensonn-sahara.mp3")
const voiceOver = createAudioBuffer("../assets/video-1/video-1-voiceover.mp3")

const source = new Creatomate.Source({
  outputFormat: "mp4",
  frameRate: 30,
  width: 1080,
  height: 1920,

  elements: [
    ...convertImageMapToCreatomate(imageMap),

    // VoiceOver
    new Creatomate.Audio({
      source: voiceOver,
      // Make the audio track as long as the output
      duration: null,
    }),

    // Background music
    new Creatomate.Audio({
      source: backgroundMusic,
      // Make the audio track as long as the output
      duration: null,
      // Fade out for 2 seconds
      audioFadeOut: 2,
    }),
  ],
})

client
  .render({ source })
  .then((response) => {
    console.log(response)
  })
  .catch((error) => {
    console.error(error)
  })
