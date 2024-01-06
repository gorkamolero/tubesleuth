// signale.js
import signale from "signale";

const options = {
  types: {
    create: {
      badge: "🎥",
      color: "green",
      label: "video creation",
      logLevel: "info",
    },
    transcribe: {
      badge: "📝",
      color: "yellow",
      label: "transcription",
      logLevel: "info",
    },
    upload: {
      badge: "☁️",
      color: "blue",
      label: "upload",
      logLevel: "info",
    },
    error: {
      badge: "❌",
      color: "red",
      label: "error",
      logLevel: "error",
    },
  },
};

const videoLogger = new signale.Signale(options);

const startTimer = (label) => {
  const startTime = process.hrtime();
  videoLogger.time(label);
  return startTime;
};

const endTimer = (label, startTime) => {
  const [seconds, nanoseconds] = process.hrtime(startTime);
  const duration = seconds * 1000 + nanoseconds / 1e6;
  videoLogger.timeEnd(label);
  videoLogger.info(`${label} took ${duration.toFixed(2)}ms`);
};

export { videoLogger, startTimer, endTimer };
