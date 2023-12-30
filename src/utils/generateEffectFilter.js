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

  const progress = (currentFrame - from) / durationInFrames;

  switch (effect) {
    case "ZoomIn":
      transform = `scale(${1 + progress * 0.1})`;
      break;
    case "ZoomOut":
      transform = `scale(${1.1 - progress * 0.1})`;
      break;
    case "PanLeft":
      transform = `translateX(${-progress * 10}%) scale(1.2)`;
      break;
    case "PanRight":
      transform = `translateX(${progress * 10}%) scale(1.2)`;
      break;
    case "PanUp":
      transform = `translateY(${-progress * 10}%) scale(1.2)`;
      break;
    case "PanDown":
      transform = `translateY(${progress * 10}%) scale(1.2)`;
      break;
    default:
      transform = "scale(1.1)";
  }

  return {
    transform,
  };
}
