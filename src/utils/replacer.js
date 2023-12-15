export const replacer = (key, value) => {
  if (typeof value === "string") {
    return encodeURIComponent(value);
  }
  return value;
};
