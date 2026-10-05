export function formatTime(time) {
  const date = new Date(time * 1000);
  const hh = date.getUTCHours();
  const mm = date.getUTCMinutes();
  const ss = date.getSeconds();
  const ms = date.getMilliseconds();

  return `${hh.toString().padStart(2, "0")}:${mm
    .toString()
    .padStart(2, "0")}:${ss.toString().padStart(2, "0")},${ms
    .toString()
    .padStart(3, "0")}`;
}
