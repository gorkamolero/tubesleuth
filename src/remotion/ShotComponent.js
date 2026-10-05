import React, { useEffect, useState } from "react";
import { AbsoluteFill, continueRender, delayRender, staticFile } from "remotion";
import { INK } from "./Ink.js";
import { SealsOpen, Triangles, BlackSun, Zoso } from "./Symbols.js";
import { OneMany, FiveMs, TwoDoctrines, Atbash, FeedbackLoop, WheelExits } from "./Diagrams.js";

// A shot drawn by a component instead of a picture: a symbol animation or a diagram. The storyboard config attaches it
// to a beat (config/storyboard/<episode>.json "components": name, cues, files, props); scripts/studio-props.mjs turns
// the cue phrases into seconds from the shot's start and stages the data files (traced seals, symbols).
const REGISTRY = { SealsOpen, Triangles, BlackSun, Zoso, OneMany, FiveMs, TwoDoctrines, Atbash, FeedbackLoop, WheelExits };

export const ShotComponent = ({ c, seconds, duration }) => {
  const files = Object.entries(c.files || {}).filter(([, f]) => f.endsWith(".json"));
  const [data, setData] = useState(files.length ? null : {});
  const [handle] = useState(() => (files.length ? delayRender(`component ${c.name}`) : null));
  useEffect(() => {
    if (!files.length) return;
    Promise.all(files.map(([k, f]) => fetch(staticFile(f)).then((r) => r.json()).then((j) => [k, j])))
      .then((es) => { setData(Object.fromEntries(es)); continueRender(handle); });
  }, []);
  const C = REGISTRY[c.name];
  if (!C) throw new Error(`Unknown shot component: ${c.name}`);
  if (!data) return null;
  return (
    <AbsoluteFill style={{ backgroundColor: INK }}>
      <C t={seconds} d={duration} cues={c.cueTimes || {}} data={data} props={c.props || {}} />
    </AbsoluteFill>
  );
};
