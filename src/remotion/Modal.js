import React from "react";
import { AbsoluteFill, Easing, Img, OffthreadVideo, interpolate, staticFile, useVideoConfig } from "remotion";
import { cameraStyle } from "./Camera.js";
import { ShotComponent } from "./ShotComponent.js";

// An archival picture (a photograph, a painting, a film) shown over the shot it cuts into (Gorka, 3 Oct: "a modal over
// the blurred previous slide"). The shot underneath holds its last frame, exactly as the camera left it, and sinks back
// (blur, darker); the picture rises onto it and drifts in slowly while it is on screen. In a chain of modals over the
// same shot the shot stays sunk and only the picture changes (scripts/studio-props.mjs sets under/chain).

const INK = "#14120f";
const settle = Easing.bezier(0.16, 1, 0.3, 1);
const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };

export const ArchivalModal = ({ modal, seconds, duration }) => {
  const { width, height } = useVideoConfig();
  const k = width / 1920;
  const isVideo = /\.(mp4|mov|webm|m4v)$/i.test(modal.file);
  // a clip closes when it ends: the picture sinks away and the shot underneath comes back into focus
  const close = modal.clipSeconds ? interpolate(seconds, [modal.clipSeconds - 0.3, modal.clipSeconds + 0.6], [0, 1], { ...clamp, easing: settle }) : 0;
  const sink = (modal.chain ? 1 : interpolate(seconds, [0, 0.9], [0, 1], { ...clamp, easing: settle })) * (1 - close);
  const rise = interpolate(seconds, modal.chain ? [0, 0.5] : [0.2, 1.1], [0, 1], { ...clamp, easing: settle }) * (1 - close);
  const drift = interpolate(seconds, [0, Math.max(1, duration)], [0, 0.035], clamp);
  // its size: the largest that fits 80% of the frame, but a small original is enlarged at most 2.4 times (a 200-pixel
  // press photo stays a photograph, not a smear)
  const fit = modal.w && modal.h ? Math.min((width * 0.8) / modal.w, (height * 0.8) / modal.h, 2.4 * k) : null;   // the cap in 1080p pixels
  const box = { ...(fit ? { width: modal.w * fit, height: modal.h * fit } : { maxWidth: width * 0.8, maxHeight: height * 0.8, width: "auto", height: "auto" }),
    display: "block", objectFit: "contain",
    // a transparent picture (an emblem) is a shape, not a print: its shadow follows the shape and it has no edge line
    ...(modal.alpha ? { filter: `drop-shadow(0 ${24 * k}px ${70 * k}px rgba(0,0,0,.6))` }
      : { boxShadow: `0 ${24 * k}px ${70 * k}px rgba(0,0,0,.6)`, outline: `${Math.max(1, k)}px solid rgba(236,229,214,.28)` }) };
  return (
    <AbsoluteFill style={{ backgroundColor: INK, overflow: "hidden" }}>
      {modal.under && (
        <AbsoluteFill style={{ filter: `blur(${sink * 18 * k}px) brightness(${1 - sink * 0.55})`, scale: String(1 + sink * 0.04) }}>
          {modal.underComponent
            ? <ShotComponent c={modal.underComponent} seconds={modal.underSeconds || 0} duration={modal.underSeconds || 0} />
            : <div style={modal.underCamera ? cameraStyle(modal.underCamera, modal.underSeconds || 0) : { width: "100%", height: "100%" }}>
                <Img src={staticFile(modal.under)} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </div>}
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
        <div style={{ opacity: rise, translate: `0 ${(1 - rise) * 28 * k}px`, scale: String(0.97 + rise * 0.03 + drift) }}>
          {isVideo
            ? <OffthreadVideo src={staticFile(modal.file)} muted style={box} />
            : <Img src={staticFile(modal.file)} style={box} />}
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};
