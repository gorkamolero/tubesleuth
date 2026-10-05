export function generateEffectFilterLegacy({ effect }) {
  let zoomDirection;

  switch (effect) {
    case "ZoomIn":
    case "ZoomOut":
      zoomDirection = "in";
      break;
    case "PanLeft":
    case "PanRight":
      zoomDirection = "right";
      break;
    case "PanUp":
    case "PanDown":
      zoomDirection = "left";
      break;
    default:
      zoomDirection = null;
  }

  return {
    zoomDirection: zoomDirection,
    zoomAmount: 0.1,
  };
}

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
      transform = `scale(${Math.min(1.1, 1 + progress * 0.1)})`; // Caps the maximum scale at 1.1
      break;
    case "ZoomOut":
      transform = `scale(${Math.max(1, 1.1 - progress * 0.1)})`; // Ensures scale does not go below 1
      break;
    case "PanLeft":
    case "PanRight":
      const translateX = Math.min(10, progress * 10); // Caps the maximum translateX at 10%
      transform = `translateX(${effect === "PanLeft" ? -translateX : translateX}%) scale(1.2)`;
      break;
    case "PanUp":
    case "PanDown":
      const translateY = Math.min(10, progress * 10); // Caps the maximum translateY at 10%
      transform = `translateY(${effect === "PanUp" ? -translateY : translateY}%) scale(1.2)`;
      break;
    default:
      transform = "scale(1)";
  }

  return {
    transform,
  };
}
