import fs from "fs";
import generateCaptions from "./captions.js";
import { captionStyles } from "../config/config.js";

// Function to convert time in seconds to ASS timestamp format
function toASSTimestamp(seconds) {
  let hours = Math.floor(seconds / 3600);
  seconds %= 3600;
  let minutes = Math.floor(seconds / 60);
  let secs = seconds % 60;
  return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
    .toFixed(2)
    .padStart(5, "0")}`;
}

// Function to create ASS subtitle content from keyframes
function createASSFromKeyframes(wordsWithTimes) {
  // Convert font weight to a boolean for bold in ASS (ASS only supports bold or not bold)
  const bold = captionStyles.fontWeight >= 700 ? 1 : 0; // ASS uses 1 for bold, 0 for not bold

  // Convert font size from viewport height (vh) to ASS script resolution height
  const assFontSize = parseInt(captionStyles.fontSize) * 19.2; // ASS uses script resolution based on 1080p (19.20 is a scaling factor)

  // Convert font color from rgba to ASS BGR plus alpha hex format
  const bgrColor = captionStyles.fontColor
    .replace("rgba", "")
    .replace(/\s/g, "")
    .match(/\d+/g);
  const assFontColor = `&H${parseInt(bgrColor[3], 10)
    .toString(16)
    .padStart(2, "0")}${parseInt(bgrColor[2], 10)
    .toString(16)
    .padStart(2, "0")}${parseInt(bgrColor[1], 10)
    .toString(16)
    .padStart(2, "0")}&`; // BGR

  // ASS file header
  let assContent = `[Script Info]
Title: Word-by-Word Subtitles
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: TV.601

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginV, MarginR, Encoding
Style: CustomStyle,${captionStyles.fontFamily},${assFontSize},${assFontColor},${assFontColor},&H00000000,&H00000000,${bold},0,0,0,100,100,0,0,1,1,0,2,10,${captionStyles.yPadding},10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

  wordsWithTimes.forEach((word, index) => {
    const sentence = word.content;

    const nextWord = wordsWithTimes[index + 1];
    const endTime = nextWord ? nextWord.startTime : word.startTime + 2;

    const assLine = `Dialogue: 0,${toASSTimestamp(
      word.startTime,
    )},${toASSTimestamp(endTime)},Default,,0000,0000,0000,,${sentence}\n`;

    assContent += assLine;
  });

  return assContent;
}

const createSubtitles = async ({ video, transcription }) => {
  const wordsWithTimes = await generateCaptions({
    video,
    transcription,
    addColors: false,
  });

  const assSubtitles = createASSFromKeyframes(wordsWithTimes);
  const path = `src/assets/video-${video}/video-${video}-subtitles.ass`;
  // Write ASS content to file
  fs.writeFileSync(path, assSubtitles);
};

export { createSubtitles };
