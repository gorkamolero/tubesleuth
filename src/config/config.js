export const cta = `What if what you've been told is all a lie? Follow to discover the truth`;

export const imageStyle = "PHOTORREALISTIC"; // try "cartoon style, Salvador Dalí style or whatever you want"

// aspect ratio: 9:16 is vertical
export const height = 1920;
export const width = 1080;

// caption styles
export const fontFamily = "Montserrat"; // important to change channel style
export const textTransform = "uppercase"; // change if you don't want all caps... you crazy person
export const fontWeight = "800"; // that's super bold. regular is 400
export const fontSize = "4.5vh"; // experiment, I think 2 - 6 is good but 5+ cuts words
export const fontColor = `rgba(243,206,50,1)`; // main color of the word being spoken
export const yPadding = "8 vmin"; // use this to center

export const captionStyles = {
  // Make the subtitle container as large as the screen with some padding
  width: "100%",
  height: "100%",
  xPadding: "3 vmin",
  yPadding,

  // Align text to bottom center
  xAlignment: "50%",
  yAlignment: "100%",

  // Text style - note that the default fill color is null (transparent)
  fontFamily,
  textTransform,
  fontWeight,
  fontSize,
  fillColor: null,
  shadowColor: "rgba(0,0,0,0.65)",
  shadowBlur: "1.6vmin",
};
