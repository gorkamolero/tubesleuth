export const measurePerformance = (start) => {
  const end = performance.now();
  const timeTakenSec = (end - start) / 1000;
  return timeTakenSec;
};

export const updateProgressBar = (progressBar, progress, start, message) => {
  const timeTaken = measurePerformance(start);
  progressBar.update(progress, {
    message: `${message} Time taken: ${timeTaken.toFixed(2)}s`,
  });
  return timeTaken;
};
