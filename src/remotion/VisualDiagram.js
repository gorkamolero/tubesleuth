import React from 'react';
import {AbsoluteFill, Easing, Img, interpolate, staticFile} from 'remotion';

// Diagrams in the house style: ink on ivory, one accent. Layouts (positions in % of the frame) come from
// scripts/direct_camera.py so the camera knows where every node is. Shapes: pyramid (the tetrapart self), spine
// and serpent (the seven states; the serpent climbs them), pairs (opposites as arcs), ladder (sin → virtue), rows.
// Timing: node.at (appears), node.parts_at (each half of "A · B"), node.hot [from, to] (lit while discussed).
const INK = '#26251f', clamp = v => Math.max(0, Math.min(1, v));
const X = v => v * 19.2, Y = v => v * 10.8;
const ease = {extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.bezier(0.16, 1, 0.3, 1)};
const split = label => label.split(/\s*[·↔/]\s*/).filter(Boolean);

function Label({x, y, parts, times, seconds, color, anchor = 'start', size = 52}) {
  // paper-coloured halo keeps labels legible over lines
  return <text x={x} y={y} textAnchor={anchor} fontFamily="Georgia, serif" fill={color} stroke="#eee6d5" strokeWidth="10" paintOrder="stroke" strokeLinejoin="round">
    {parts.map((p, i) => {
      const o = interpolate(seconds, [times[i] ?? times[0], (times[i] ?? times[0]) + 0.6], [0, 1], ease);
      return <tspan key={i} opacity={o} fontSize={i ? size * 0.66 : size} fontStyle={i ? 'italic' : 'normal'} dx={i ? 18 : 0}>{i ? `· ${p}` : p}</tspan>;
    })}
  </text>;
}

function Stamp({x, y, seconds, at, hot, accent, inverse}) {
  const r = interpolate(seconds, [at, at + 0.7], [0, 1], ease);
  const ink = hot > 0.5 ? accent : inverse ? '#eee6d5' : INK;      // inverse: ivory wheels on the black ink body
  return <g opacity={r} transform={`translate(${x} ${y}) scale(${1.35 - 0.35 * r + hot * 0.15})`}>
    <circle r="26" fill={inverse ? INK : '#eee6d5'} stroke={ink} strokeWidth={4 + hot * 2} />
    <circle r={9 + hot * 4} fill={ink} />
  </g>;
}

// The serpent of the summit: coiled at the root, it glides up to each state as it is named (never a jump), its body
// slithering (a wave travelling up it, always), a head leading; reaching the crown it breaks through in a burst.
function Serpent({nodes, seconds, accent, appear}) {
  // the head reaches each state at its 'arrive' time (scripts/direct_camera.py: one schedule with the lighting and the
  // camera), leaving the coil a second before the first; its height is the piecewise-linear path averaged over a
  // 1.2 s window, so it glides at a smoothly changing speed and never stops at a state
  const up = [...nodes].sort((a, b) => b.y - a.y), arrive = n => n.arrive ?? n.at + 0.9, BASE = 91;
  const keys = [[Math.max(0, arrive(up[0]) - 1.0), BASE - 1], ...up.map(n => [arrive(n), n.y])]
    .filter((k, i, all) => !i || k[0] > all[i - 1][0]);
  const lin = t => interpolate(t, keys.map(k => k[0]), keys.map(k => k[1]), {extrapolateLeft: 'clamp', extrapolateRight: 'clamp'});
  let acc = 0; for (let k = -6; k <= 6; k++) acc += lin(seconds + k * 0.1); const headY = acc / 13;
  const len = BASE - headY;
  // the body lies on the path the head took (a sine fixed in space: the body follows the head, like a real snake),
  // swaying gently in place; width swells out of the coil and narrows toward the head with smoothsteps, so no corners
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const sway = 0.35 * Math.sin(seconds * 1.4), phase = seconds * 2.2;
  const xAt = y => { const d = BASE - y, amp = 3.2 * smooth(0, 5, d) * (0.45 + 0.55 * smooth(0, 4, y - headY));
    return 50 + amp * Math.sin(d / 4.2 + sway); };
  const P = []; const steps = Math.max(2, Math.ceil(len / 0.25));
  for (let k = 0; k <= steps; k++) { const y = BASE - (len * k) / steps; P.push([X(xAt(y)), Y(y)]); }
  const spline = P.map((p, k) => { if (!k) return `M${p[0]},${p[1]}`;
    const p0 = P[k - 2] || P[k - 1], p1 = P[k - 1], p3 = P[k + 1] || p;
    return `C${p1[0] + (p[0] - p0[0]) / 6},${p1[1] + (p[1] - p0[1]) / 6} ${p[0] - (p3[0] - p1[0]) / 6},${p[1] - (p3[1] - p1[1]) / 6} ${p[0]},${p[1]}`; }).join(' ');
  const h = 0.3, angle = Math.atan2(X(xAt(headY)) - X(xAt(headY + h)), Y(headY + h) - Y(headY)) * 180 / Math.PI;
  const coil = []; for (let t = 0; t <= Math.PI * 5; t += 0.08) { const r = 1.2 + t * 0.28;
    coil.push(`${X(50 + r * Math.cos(t + phase * 0.15))},${Y(BASE + 1.2 + r * 0.32 * Math.sin(t + phase * 0.15))}`); }
  const crown = nodes.reduce((a, n) => (n.y < a.y ? n : a)), tc = keys.at(-1)[0], b = seconds - tc;
  return <g opacity={clamp(appear * 1.5)}>
    <polyline points={coil.join(' ')} fill="none" stroke={accent} strokeWidth="9" strokeLinecap="round" opacity={0.9} />
    {len > 0.5 && <path d={spline} fill="none" stroke={accent} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />}
    <g transform={`translate(${X(xAt(headY))} ${Y(headY)}) rotate(${angle})`}>
      <ellipse cx="0" cy="-6" rx="11" ry="17" fill={accent} />
      <circle cx="-4" cy="-10" r="2.4" fill="#efe6d2" /><circle cx="4" cy="-10" r="2.4" fill="#efe6d2" />
    </g>
    {b > 0 && <g transform={`translate(${X(50)} ${Y(crown.y)})`}>
      {Array.from({length: 16}, (_, i) => { const a = (i / 16) * Math.PI * 2, grow = interpolate(b, [0, 1.6], [0, 1], ease),
        r0 = 34 + 10 * Math.sin(seconds * 1.6 + i), r1 = r0 + (70 + 30 * (i % 2)) * grow * (0.9 + 0.1 * Math.sin(seconds * 2 + i));
        return <line key={i} x1={r0 * Math.cos(a)} y1={r0 * Math.sin(a)} x2={r1 * Math.cos(a)} y2={r1 * Math.sin(a)}
          stroke={accent} strokeWidth="6" strokeLinecap="round" opacity={0.85} />; })}
      <circle r={interpolate(b % 3, [0, 3], [30, 160])} fill="none" stroke={accent} strokeWidth="4" opacity={interpolate(b % 3, [0, 3], [0.7, 0])} />
    </g>}
  </g>;
}

export function VisualDiagram({scene, seconds}) {
  const d = scene.diagram, accent = scene.accentHex || '#a7351e', shape = d.shape || 'rows', nodes = d.nodes;
  const hotOf = n => n.hot ? clamp(Math.min((seconds - n.hot[0]) / 0.4, (n.hot[1] - seconds) / 0.6)) : 0;
  const first = Math.min(...nodes.map(n => n.at || 0));
  // The structure inks in first: from the end of the transition into this shot (or earlier, if a node is named sooner),
  // so a dissolve or a section's ink bleed never lands on a blank page (29 Sep QA).
  const drawStart = Math.min(Math.max(0, first - 1.4), scene.transitionSeconds ?? 0.5);
  const frame = interpolate(seconds, [drawStart, drawStart + Math.max(1.2, first + 0.2 - drawStart)], [0, 1], ease);
  const draw = (p) => ({pathLength: 1, strokeDasharray: 1, strokeDashoffset: 1 - p});
  let deco = null, labels = null;
  if (shape === 'pyramid') {
    const apex = 10, base = 88, halfW = y => 34 * (y - apex) / (base - apex), cx = nodes[0]?.x ?? 50;
    const bounds = [base, ...nodes.slice(0, -1).map((n, i) => (n.y + nodes[i + 1].y) / 2), apex];
    deco = <g>
      {nodes.map((n, i) => { const y0 = bounds[i], y1 = bounds[i + 1], h = hotOf(n);
        return h > 0 && <polygon key={i} points={`${X(cx - halfW(y0))},${Y(y0)} ${X(cx + halfW(y0))},${Y(y0)} ${X(cx + halfW(y1))},${Y(y1)} ${X(cx - halfW(y1))},${Y(y1)}`} fill={accent} opacity={0.22 * h} />; })}
      <path d={`M ${X(cx)} ${Y(apex)} L ${X(cx + halfW(base))} ${Y(base)} L ${X(cx - halfW(base))} ${Y(base)} Z`} fill="none" stroke={INK} strokeWidth="5" {...draw(frame)} />
      {bounds.slice(1, -1).map((y, i) => <line key={i} x1={X(cx - halfW(y))} x2={X(cx + halfW(y))} y1={Y(y)} y2={Y(y)} stroke={INK} strokeWidth="3" opacity={frame} />)}
    </g>;
    // the four names appear together (Gorka, 29 Sep: Fire was hidden until named); the elements and the light follow the words
    labels = nodes.map(n => <Label key={n.id} x={X(cx + halfW(n.y) + 3)} y={Y(n.y) + 16} parts={split(n.label)} times={[first, ...(n.parts_at || [n.at]).slice(1)]} seconds={seconds} color={hotOf(n) > 0.5 ? accent : INK} />);
  } else if (shape === 'body') {
    // A seated body in the house print style: a pale ink silhouette, the spine faint inside it, each state where it sits.
    const fade = frame;
    deco = d.image ? <g>
      {/* the seated body is a plate drawn in the house style (work/art-v2/body); the spine is a faint ivory thread */}
      <line x1={X(50)} x2={X(50)} y1={Y(78)} y2={Y(11)} stroke="#eee6d5" strokeWidth="3" opacity={0.5}
        {...draw(interpolate(seconds, [drawStart + 0.3, drawStart + 1.8], [0, 1], ease))} />
    </g> : <g>
      <g opacity={0.9 * fade}>
        <ellipse cx={X(50)} cy={Y(79)} rx={X(18)} ry={Y(6.5)} fill={INK} opacity={0.09} />
        <path d={`M ${X(46)} ${Y(29)} L ${X(54)} ${Y(29)} L ${X(55)} ${Y(32)} Q ${X(61)} ${Y(33)} ${X(62)} ${Y(38)} L ${X(64)} ${Y(58)}
          Q ${X(66)} ${Y(66)} ${X(66.5)} ${Y(73)} L ${X(60)} ${Y(74)} L ${X(57.5)} ${Y(56)} L ${X(57)} ${Y(66)} Q ${X(50)} ${Y(69)} ${X(43)} ${Y(66)}
          L ${X(42.5)} ${Y(56)} L ${X(40)} ${Y(74)} L ${X(33.5)} ${Y(73)} Q ${X(34)} ${Y(66)} ${X(36)} ${Y(58)} L ${X(38)} ${Y(38)}
          Q ${X(39)} ${Y(33)} ${X(45)} ${Y(32)} Z`} fill={INK} opacity={0.09} />
        <circle cx={X(50)} cy={Y(22.5)} r={Y(6.4)} fill={INK} opacity={0.09} />
      </g>
      <line x1={X(50)} x2={X(50)} y1={Y(78)} y2={Y(23)} stroke={INK} strokeWidth="3" opacity={0.25} {...draw(frame)} />
    </g>;
    // every name on the right, joined to its wheel by a thin line that draws out as the state is named
    labels = nodes.map((n, i) => { const lead = interpolate(seconds, [n.at - 0.2, n.at + 0.5], [0, 1], ease);
      return <g key={n.id}>
        <line x1={X(50) + 30} x2={X(50) + 30 + (X(69) - X(50) - 30) * lead} y1={Y(n.y)} y2={Y(n.y)} stroke={hotOf(n) > 0.5 ? accent : '#8a8378'} strokeWidth="2.5" opacity={lead > 0 ? 0.9 : 0} />
        <Label x={X(70)} y={Y(n.y) + 16} parts={split(n.label)} times={[(n.parts_at || [n.at])[0] + 0.35, ...(n.parts_at || []).slice(1)]} seconds={seconds} color={hotOf(n) > 0.5 ? accent : INK} />
      </g>; });
  } else if (shape === 'spine' || shape === 'serpent') {
    deco = <g>
      <line x1={X(50)} x2={X(50)} y1={Y(92)} y2={Y(8)} stroke={INK} strokeWidth="6" {...draw(frame)} />
      {shape === 'serpent' && <Serpent nodes={nodes} seconds={seconds} accent={accent} appear={frame} />}
    </g>;
    labels = nodes.map((n, i) => <Label key={n.id} x={X(i % 2 ? 46 : 54)} y={Y(n.y) + 16} anchor={i % 2 ? 'end' : 'start'} parts={split(n.label)} times={n.parts_at || [n.at]} seconds={seconds} color={hotOf(n) > 0.5 ? accent : INK} />);
  } else if (shape === 'pairs') {
    const states = d.states || ['Root', 'Senses', 'Fire', 'Heart', 'Throat', 'Third eye', 'Crown'];
    const ys = Object.fromEntries(states.map((s, i) => [s, 86 - i * 12]));
    deco = <g>
      {states.map(s => <g key={s} opacity={frame}><circle cx={X(40)} cy={Y(ys[s])} r="8" fill={INK} />
        <text x={X(37.5)} y={Y(ys[s]) + 14} textAnchor="end" fontFamily="Georgia, serif" fontSize="42" fill={INK}>{s}</text></g>)}
      {nodes.map(n => { const h = hotOf(n), p = interpolate(seconds, [n.at, n.at + 1.2], [0, 1], ease), col = h > 0.5 ? accent : INK;
        if ((n.pair || []).length === 2) {
          const [a, b] = n.pair, cx = 2 * n.x - 42;
          return <path key={n.id} d={`M ${X(41.5)} ${Y(ys[a])} Q ${X(cx)} ${Y((ys[a] + ys[b]) / 2)} ${X(41.5)} ${Y(ys[b])}`} fill="none" stroke={col} strokeWidth={5 + h * 3} {...draw(p)} />;
        }
        return <circle key={n.id} cx={X(46)} cy={Y(ys.Heart)} r="34" fill="none" stroke={col} strokeWidth={5 + h * 3} {...draw(p)} />;
      })}
    </g>;
    // the arcs join labelled states; only the heart needs words
    labels = nodes.filter(n => (n.pair || []).length !== 2).map(n =>
      <Label key={n.id} x={X(49)} y={Y(50) + 14} size={40} parts={['its own opposite']} times={[n.at]} seconds={seconds} color={hotOf(n) > 0.5 ? accent : INK} />);
  } else if (shape === 'ladder') {
    labels = nodes.map(n => { const [a, b] = split(n.label), t = n.parts_at || [n.at, n.at], h = hotOf(n);
      const arrow = interpolate(seconds, [t[1] ?? n.at, (t[1] ?? n.at) + 0.8], [0, 1], ease);
      return <g key={n.id}>
        <Label x={X(44)} y={Y(n.y) + 16} anchor="end" parts={[a]} times={[t[0]]} seconds={seconds} color={INK} />
        <line x1={X(46)} x2={X(46 + 8 * arrow)} y1={Y(n.y)} y2={Y(n.y)} stroke={h > 0.5 ? accent : INK} strokeWidth="4" />
        {b && <Label x={X(56)} y={Y(n.y) + 16} parts={[b]} times={[t[1] ?? n.at]} seconds={seconds} color={h > 0.5 || arrow > 0.9 ? accent : INK} />}
      </g>; });
  } else {
    const ys = nodes.map(n => n.y), guide = <line key="guide" x1={X(40)} x2={X(40)} y1={Y(Math.min(...ys))} y2={Y(Math.max(...ys))}
      stroke={INK} strokeWidth="2" opacity={0.35} {...draw(frame)} />;             // a faint spine inks in with the shot
    deco = [guide, ...d.edges.map((e, i) => { const a = nodes.find(n => n.id === e.from), b = nodes.find(n => n.id === e.to);
      const p = clamp((seconds - (e.at || 0)) / (e.duration || 1));
      return <line key={i} x1={X(40)} y1={Y(a.y)} x2={X(40)} y2={Y(b.y)} stroke={INK} strokeWidth="4" {...draw(p)} />; })];
    labels = nodes.map(n => <Label key={n.id} x={X(44)} y={Y(n.y) + 16} parts={split(n.label)} times={n.parts_at || [n.at]} seconds={seconds} color={hotOf(n) > 0.5 ? accent : INK} />);
  }
  const dots = shape === 'ladder' || shape === 'pairs' ? null
    : nodes.map((n, i) => <Stamp key={n.id} x={X(shape === 'rows' ? 40 : n.x)} y={Y(n.y)} seconds={seconds}
        // the body's seven wheels paint in first, bare and bottom-up; names and light then climb with the words
        at={shape === 'pyramid' ? first : shape === 'body' ? drawStart + 1.9 + i * 0.25 : n.at} hot={hotOf(n)} accent={accent} inverse={shape === 'body'} />);
  return <AbsoluteFill style={{background: 'rgba(238,230,213,.97)'}}>
    {/* a plate under the diagram (the seated body): Img waits for the file, so no frame renders without it */}
    {d.image && <Img src={staticFile(d.image)} style={{position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
      opacity: interpolate(seconds, [0, 0.6], [0, 1], ease)}} />}
    <svg viewBox="0 0 1920 1080" style={{position: 'absolute', inset: 0, width: '100%', height: '100%'}}>
      <defs><filter id="ink" x="-5%" y="-5%" width="110%" height="110%">
        <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="3" />
        <feDisplacementMap in="SourceGraphic" scale="3.5" />
      </filter></defs>
      <g filter="url(#ink)">{deco}{dots}{labels}</g>
    </svg>
  </AbsoluteFill>;
}
