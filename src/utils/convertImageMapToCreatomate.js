import Creatomate from "creatomate";
import { createFirebaseImageURL } from "./createFirebaseImageURL.js";

export function convertImageMapToCreatomate({ script, images, video }) {
  return images.map((image, index) => {
    let animation;
    if (image.animation === "ZoomIn") {
      animation = new Creatomate.Scale({
        startScale: "100%",
        endScale: "120%",
        easing: "linear",
      });
    } else if (image.animation === "ZoomOut") {
      animation = new Creatomate.Scale({
        startScale: "120%",
        endScale: "100%",
        easing: "linear",
      });
    } else {
      if (Creatomate[image.animation]) {
        animation = new Creatomate[image.animation]({
          easing: "linear",
        });
      } else {
        animation = new Creatomate.PanCenter({
          startScale: "100%",
          endScale: "120%",
          easing: "linear",
        });
      }
    }

    let transition;
    if (Creatomate[image.transition]) {
      transition = new Creatomate[image.transition]();
    } else {
      transition = new Creatomate.Fade();
    }

    const imageBuffer = createFirebaseImageURL(index, video);

    let duration = image.end - image.start;
    // if last item, choose script.duration as the end instead of image.end
    if (index === images.length - 1) {
      duration = script.duration - image.start;
    }

    return new Creatomate.Image({
      track: 1,
      duration,
      source: imageBuffer,
      animations: [animation],
      // transition: if last or first, none
      ...(index === 0 || index === images.length - 1 ? {} : { transition }),
    });
  });
}
