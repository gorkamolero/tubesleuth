export const cleanSegments = (segments) => {
  // Remove the last character from the last segment, if it is a period or a comma
  return segments.map((segment) => {
    if (segment.text.slice(-1) === "." || segment.text.slice(-1) === ",") {
      segment.text = segment.text.slice(0, -1);
    }
    return segment;
  });
};
