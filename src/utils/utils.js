export const replacer = (key, value) => {
  if (typeof value === "string") {
    return encodeURIComponent(value)
  }
  return value
}

export const formatTime = (milliseconds) => {
  let seconds = Math.floor(milliseconds / 1000)
  let minutes = Math.floor(seconds / 60)
  seconds = seconds % 60
  let hours = Math.floor(minutes / 60)
  minutes = minutes % 60

  return `${hours} hour(s), ${minutes} minute(s), and ${seconds} second(s)`
}
