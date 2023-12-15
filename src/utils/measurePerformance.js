export const measurePerformance = (start, message) => {
  const end = performance.now()
  const timeTakenSec = (end - start) / 1000
  const minutes = Math.floor(timeTakenSec / 60)
  const seconds = timeTakenSec % 60
  console.log(`${message} Time taken: ${minutes}m ${seconds.toFixed(2)}s`)
  return end
}

export default measurePerformance
