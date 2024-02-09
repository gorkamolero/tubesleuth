const filterMultiplier = 1.2;
const progressMultiplier = 0.05;

export function generateEffectFilter({
  effect,
  currentFrame,
  from,
  durationInFrames,
}) {
  let transform = "";

  const progress = Math.max(
    0,
    Math.min(1, (currentFrame - from) / durationInFrames),
  ); // Ensures progress is between 0 and 1

  switch (effect) {
    case "ZoomIn":
      // Adjust the maximum scale value and progress multiplier for a gentler zoom
      transform = `scale(${1 + progress * progressMultiplier})`; // More subtle zoom: ;
      break;
    case "ZoomOut":
      // Ensure scale gently zooms out without going below the original size
      transform = `scale(${Math.max(1, filterMultiplier - progress * progressMultiplier)})`; // More subtle zoom out
      break;
    case "PanLeft":
    case "PanRight":
      const translateX = Math.min(10, progress * 10); // Keep translation adjustment
      // Apply a more subtle scale during pan if needed
      transform = `translateX(${effect === "PanLeft" ? -translateX : translateX}%) scale(filterMultiplier)`;
      break;
    case "PanUp":
    case "PanDown":
      const translateY = Math.min(10, progress * 10); // Keep translation adjustment
      // Apply a more subtle scale during pan if needed
      transform = `translateY(${effect === "PanUp" ? -translateY : translateY}%) scale(filterMultiplier)`;
      break;
    default:
      transform = "scale(1)"; // Default case ensures no scaling if effect is not recognized
  }

  return {
    transform,
  };
}
