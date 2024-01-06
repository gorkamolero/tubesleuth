import cliProgress from "cli-progress";
import colors from "ansi-colors";

export const colorArray = [
  colors.red,
  colors.green,
  colors.yellow,
  colors.blue,
  colors.magenta,
  colors.cyan,
  colors.white,
  colors.gray,
];

export const multi = new cliProgress.MultiBar(
  {
    clearOnComplete: false,
    hideCursor: true,
    format: colors.cyan("{bar}") + "| {percentage}% | {message}",
  },
  cliProgress.Presets.shades_classic,
);
