import {Easing, interpolate} from 'remotion';

// Camera keyframes from scripts/direct_camera.py: {keys: [{t, x, y, s}]} with t in seconds from the shot start,
// (x, y) the image-relative centre of the view and s the zoom (1 = whole image). Same maths as the director.
const clampToImage = (x, y, s) => {
  const h = 0.5 / s;
  return {x: Math.min(Math.max(x, h), 1 - h), y: Math.min(Math.max(y, h), 1 - h), s};
};

// Pushes and drifts run at constant speed; travels and releases (a real change of view) ease in and out.
const isTravel = (a, b) => Math.abs(Math.log(b.s / a.s)) > Math.log(1.12) || Math.hypot(b.x - a.x, b.y - a.y) > 0.08;

export function cameraAt(camera, seconds) {
  const keys = camera.keys;
  const clampView = camera.free ? (x, y, s) => ({x, y, s}) : clampToImage;   // free: a key may frame past the edge
  if (seconds <= keys[0].t) return clampView(keys[0].x, keys[0].y, keys[0].s);
  for (let i = 0; i < keys.length - 1; i++) {
    const a = keys[i], b = keys[i + 1];
    if (seconds <= b.t) {
      const u = interpolate(seconds, [a.t, b.t], [0, 1], {
        extrapolateLeft: 'clamp', extrapolateRight: 'clamp',
        easing: b.e || isTravel(a, b) ? Easing.bezier(0.45, 0, 0.55, 1) : Easing.linear,     // e: a travel between views
      });
      return clampView(a.x + (b.x - a.x) * u, a.y + (b.y - a.y) * u, Math.exp(Math.log(a.s) + (Math.log(b.s) - Math.log(a.s)) * u));
    }
  }
  const z = keys[keys.length - 1];
  return clampView(z.x, z.y, z.s);
}

// CSS for the view: scale about the centre, then translate so (x, y) sits at the frame centre.
export function cameraStyle(camera, seconds) {
  const {x, y, s} = cameraAt(camera, seconds);
  return {width: '100%', height: '100%', scale: String(s), translate: `${s * (0.5 - x) * 100}% ${s * (0.5 - y) * 100}%`};
}
