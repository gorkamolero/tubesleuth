import React from "react";
import { interpolate } from "remotion";
import { INK, IVORY, VERMILION, DIM, SERIF, ITALIC, Frame, Label, Figure, cue, draw, lerp, ramp, rise, bez, bezD, scatter } from "./Ink.js";

// Diagrams for the Left-Hand Path episode, each a shot of the edit (ShotComponent.js): ivory on ink, vermilion only
// for what the narration singles out, every mark appearing as it is named (cues from the word timings).

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" };
const Arrow = ({ x1, y1, x2, y2, p, color = IVORY, w = 4, head = 18 }) => {
  const L = Math.hypot(x2 - x1, y2 - y1), u = [(x2 - x1) / L, (y2 - y1) / L], n = [-u[1], u[0]];
  const tip = [lerp(x1, x2, p), lerp(y1, y2, p)];
  return (
    <g>
      <line x1={x1} y1={y1} x2={tip[0]} y2={tip[1]} stroke={color} strokeWidth={w} />
      {p > 0.02 && <polyline fill="none" stroke={color} strokeWidth={w} strokeLinejoin="miter"
        points={`${tip[0] - u[0] * head + n[0] * head * 0.7},${tip[1] - u[1] * head + n[1] * head * 0.7} ${tip[0]},${tip[1]} ${tip[0] - u[0] * head - n[0] * head * 0.7},${tip[1] - u[1] * head - n[1] * head * 0.7}`} />}
    </g>
  );
};

// The one and the many (II). The one: a still ring with its point, above; the many: a drifting scatter below, fed by
// the one breaking into forms. props.arrows (the next beat, the same diagram): transcendence up to the one,
// immanence down into the many; one point rises and dissolves, one comes down and stays; the down path turns
// vermilion when it is named as the Left-Hand Path.
const MANY = scatter(46, 7);
export const OneMany = ({ t, cues, props = {} }) => {
  const st = !!props.arrows, pre = st ? -99 : null;
  const one = pre ?? cue(cues, "one", 1.5), many = pre ?? cue(cues, "many", 2.6);
  const still = pre ?? cue(cues, "stillness", null), shiva = pre ?? cue(cues, "shiva", null);
  const fem = pre ?? cue(cues, "feminine", null), brk = pre ?? cue(cues, "breaks", null), shakti = pre ?? cue(cues, "shakti", null);
  const O = [960, 250], band = [640, 820];
  const dots = MANY.map(([a, b, c, d], i) => {
    const x = 520 + a * 880 + Math.sin(t * (0.25 + c * 0.35) + d * 6.28) * 18, y = band[0] + b * (band[1] - band[0]) + Math.cos(t * (0.2 + d * 0.3) + c * 6.28) * 10;
    return { x, y, r: 4 + c * 5, at: many + (i / MANY.length) * 1.2 };
  });
  const up = cue(cues, "up", 1.5), dn = cue(cues, "down", 8), dis = cue(cues, "dissolve", 20), back = cue(cues, "back", 28), lhp = cue(cues, "lhp", 36);
  const red = st ? ramp(t, lhp, lhp + 0.8) : 0;
  const riseP = st ? ramp(t, dis, dis + 3.2) : 0, downP = st ? ramp(t, back, back + 3.2) : 0;
  return (
    <Frame>
      <circle cx={O[0]} cy={O[1]} r={72} fill="none" stroke={IVORY} strokeWidth={4} transform={`rotate(-90 ${O[0]} ${O[1]})`} {...draw(ramp(t, one, one + 1.4))} />
      <circle cx={O[0]} cy={O[1]} r={9} fill={IVORY} opacity={rise(t, one + 1.0)} />
      <Label t={t} at={one + 0.6} x={O[0] + 130} y={O[1] - 6} anchor="start" text="THE ONE" size={38} />
      <Label t={t} at={still} x={O[0] + 130} y={O[1] + 40} anchor="start" text={shiva != null && t >= shiva ? "stillness · Shiva" : "stillness"} size={28} italic />
      {dots.map((p, i) => <circle key={i} cx={p.x} cy={p.y} r={p.r} fill={IVORY} opacity={rise(t, p.at, 0.6) * 0.92} />)}
      {brk != null && Array.from({ length: 12 }, (_, i) => {   // the one breaking into many: points fall from it into the scatter
        const a = brk + i * 0.22, u = ramp(t, a, a + 2.2), tgt = dots[(i * 7) % dots.length];
        return u > 0 && u < 1 ? <circle key={i} cx={lerp(O[0], tgt.x, u)} cy={lerp(O[1] + 80, tgt.y, u)} r={lerp(6, tgt.r, u)} fill={IVORY} /> : null;
      })}
      <Label t={t} at={many + 0.6} x={1440} y={760} anchor="start" text="THE MANY" size={38} />
      <Label t={t} at={fem} x={1440} y={806} anchor="start" text={shakti != null && t >= shakti ? "change · Shakti" : "change"} size={28} italic />
      {st && <>
        <Arrow x1={780} y1={600} x2={780} y2={360} p={ramp(t, up, up + 1.4)} />
        <Label t={t} at={up + 0.5} x={740} y={490} anchor="end" text="TRANSCENDENCE" size={30} />
        <Arrow x1={1140} y1={360} x2={1140} y2={600} p={ramp(t, dn, dn + 1.4)} color={red > 0.5 ? VERMILION : IVORY} />
        <Label t={t} at={dn + 0.5} x={1180} y={490} anchor="start" text="IMMANENCE" size={30} />
        <Label t={t} at={lhp + 0.3} x={1180} y={532} anchor="start" text="the Left-Hand Path" size={28} italic color={VERMILION} />
        {riseP > 0 && riseP < 1 && Array.from({ length: riseP < 0.7 ? 1 : 8 }, (_, j) => {     // one rises and dissolves into the one
          const spread = riseP < 0.7 ? 0 : (riseP - 0.7) / 0.3;
          return <circle key={j} cx={780 + Math.cos(j * 0.785) * spread * 40} cy={lerp(600, 330, Math.min(1, riseP / 0.7)) + Math.sin(j * 0.785) * spread * 40}
            r={lerp(9, 3, spread)} fill={IVORY} opacity={1 - spread} />;
        })}
        {downP > 0 && <circle cx={1140} cy={lerp(360, 660, downP)} r={lerp(9, 15, red)} fill={red > 0.5 ? VERMILION : IVORY} />}
      </>}
    </Frame>
  );
};

// The five M's (III): five words, each with its meaning, as they are named; the orthodox ban dims them all.
const MS = [["m", "adya", "WINE", "m1"], ["m", "amsa", "MEAT", "m2"], ["m", "atsya", "FISH", "m3"], ["m", "udra", "GRAIN", "m4"], ["m", "aithuna", "SEXUAL UNION", "m5"]];
export const FiveMs = ({ t, cues }) => {
  const five = cue(cues, "five", 0.5), forbid = cue(cues, "forbid", null);
  const dim = forbid != null ? 1 - 0.6 * ramp(t, forbid, forbid + 1.2) : 1;
  return (
    <Frame>
      <Label t={t} at={five} x={960} y={330} text="THE FIVE M’S" size={40} rule />
      {MS.map(([m, rest, en, c], i) => {
        const at = cue(cues, c, five + 1 + i * 2.5), o = rise(t, at, 0.6), x = 960 + (i - 2) * 340;
        return (
          <g key={c} opacity={o * dim} transform={`translate(0 ${(1 - o) * 12})`}>
            <text x={x} y={560} textAnchor="middle" fontFamily={ITALIC} fontStyle="italic" fontSize={66} fill={IVORY}>
              <tspan fill={VERMILION}>{m}</tspan>{rest}</text>
            <text x={x} y={630} textAnchor="middle" fontFamily={SERIF} fontSize={26} letterSpacing={26 * 0.16} fill={IVORY}>{en}</text>
          </g>
        );
      })}
    </Frame>
  );
};

// Two doctrines (V, the Templars): the outer ring for the outside world, the inner circle for the initiated, where
// Lucifer is honoured as the light-bringer.
export const TwoDoctrines = ({ t, cues }) => {
  const two = 0.3, exo = cue(cues, "exo", 2), cath = cue(cues, "cath", null), eso = cue(cues, "eso", 6);   // drawn faintly as the shot opens
  const lit = (at) => 0.3 + 0.7 * ramp(t, at, at + 0.6);
  const luc = cue(cues, "lucifer", null), light = cue(cues, "light", null), C = [960, 590];
  const swap = luc != null ? ramp(t, luc - 0.2, luc + 0.4) : 0;
  return (
    <Frame>
      <circle cx={C[0]} cy={C[1]} r={330} fill="none" stroke={IVORY} strokeWidth={3} opacity={lit(exo)} transform={`rotate(-90 ${C[0]} ${C[1]})`} {...draw(ramp(t, Math.min(two, exo), Math.min(two, exo) + 1.6))} />
      <Label t={t} at={exo + 0.4} x={960} y={190} text="EXOTERIC" size={36} />
      <Label t={t} at={exo + 0.9} x={960} y={232} text={cath != null && t >= cath ? "for the outside world: Catholicism" : "for the outside world"} size={26} italic />
      <circle cx={C[0]} cy={C[1]} r={150} fill="none" stroke={VERMILION} strokeWidth={4} opacity={lit(eso)} transform={`rotate(-90 ${C[0]} ${C[1]})`} {...draw(ramp(t, Math.min(two + 0.5, eso), Math.min(two + 0.5, eso) + 1.4))} />
      <Label t={t} at={eso + 0.4} x={960} y={C[1] - 4} text="ESOTERIC" size={32} opacity={1 - swap} />
      <Label t={t} at={eso + 0.8} x={960} y={C[1] + 38} text="for the initiated" size={24} italic opacity={1 - swap} />
      <Label t={t} at={luc} x={960} y={C[1] - 4} text="LUCIFER" size={36} />
      <Label t={t} at={light} x={960} y={C[1] + 40} text="the light-bringer" size={26} italic />
    </Frame>
  );
};

// The Atbash (V): BAPHOMET written in Hebrew, each letter swapped for its mirror in the alphabet (the first for the
// last, the second for the second-last…), reads SOPHIA. Hebrew runs right to left.
const ALEPHBET = "אבגדהוזחטיכלמנסעפצקרשת".split("");
const SRC = ["ב", "פ", "ו", "מ", "ת"], DST = SRC.map((c) => ALEPHBET[21 - ALEPHBET.indexOf(c)]);   // ש ו פ י א
const HEB = "'New Peninim MT', 'Times New Roman', 'Arial Hebrew', serif";
export const Atbash = ({ t, cues }) => {
  const heb = cue(cues, "hebrew", 4), ciph = cue(cues, "cipher", 8), soph = cue(cues, "sophia", 11), wis = cue(cues, "wisdom", 13);
  const flip0 = ciph + 0.4, step = Math.max(0.35, Math.min(0.6, (soph - flip0 - 0.6) / 5));
  return (
    <Frame>
      <Label t={t} at={0.3} x={960} y={250} text="BAPHOMET" size={60} spacing={0.22} />
      {SRC.map((c, i) => {
        const x = 960 + (2 - i) * 160, o = rise(t, heb + i * 0.25, 0.5);
        const f0 = flip0 + i * step, u = ramp(t, f0, f0 + 0.5), sy = Math.abs(Math.cos(u * Math.PI)), done = u >= 0.5;
        return (
          <g key={i} opacity={o} transform={`translate(${x} 470) scale(1 ${Math.max(0.02, sy)})`}>
            <text x={0} y={0} textAnchor="middle" dominantBaseline="central" fontFamily={HEB} fontSize={120} fill={done ? VERMILION : IVORY}>{done ? DST[i] : c}</text>
          </g>
        );
      })}
      <g opacity={rise(t, ciph, 0.8) * 0.75}>   {/* the key: the alphabet over itself reversed */}
        {ALEPHBET.map((c, i) => {
          const x = 960 + (10.5 - i) * 58, used = SRC.includes(c) || DST.includes(c);
          return <g key={i}>
            <text x={x} y={850} textAnchor="middle" fontFamily={HEB} fontSize={34} fill={used ? IVORY : DIM}>{c}</text>
            <text x={x} y={905} textAnchor="middle" fontFamily={HEB} fontSize={34} fill={used ? IVORY : DIM}>{ALEPHBET[21 - i]}</text>
          </g>;
        })}
      </g>
      <Label t={t} at={soph} x={960} y={660} text="SOPHIA" size={56} spacing={0.22} rule />
      <Label t={t} at={wis} x={960} y={740} text="ΣΟΦΙΑ · wisdom" size={30} italic />
    </Frame>
  );
};

// Land's loop (VII): commerce and technology feeding each other, a point running the loop faster and faster, and
// humanity in the middle as its temporary host.
const TOP = [[760, 480], [860, 330], [1060, 330], [1160, 480]], BOT = [[1160, 600], [1060, 750], [860, 750], [760, 600]];
export const FeedbackLoop = ({ t, cues }) => {
  const com = cue(cues, "commerce", 3), tech = cue(cues, "tech", 4), fast = cue(cues, "faster", 7);
  const feed = 0.3;                                  // the loop is drawn as the shot opens ("a runaway process"); the point runs it from "faster"
  const host = cue(cues, "host", 10), acc = cue(cues, "accel", null);
  const tau = 6, base = 0.18, ph = t > fast ? base * tau * (Math.exp(Math.min(t - fast, 40) / tau) - 1) : 0;   // turns, accelerating
  const at = (q) => { const u = ((q % 1) + 1) % 1; return u < 0.5 ? bez(TOP, u * 2) : bez(BOT, (u - 0.5) * 2); };
  const speed = base * Math.exp(Math.min(t - fast, 40) / tau);
  const trail = t > fast ? Array.from({ length: 6 }, (_, j) => ({ p: at(ph - j * Math.min(0.03, speed / 30 * 0.6)), o: 1 - j / 6 })) : [];
  const hostO = rise(t, host, 0.8) * (1 - 0.6 * ramp(t, host + 2.5, host + 7));
  return (
    <Frame>
      <Label t={t} at={com} x={640} y={555} text="COMMERCE" size={42} anchor="end" />
      <Label t={t} at={tech} x={1280} y={555} text="TECHNOLOGY" size={42} anchor="start" />
      <path d={bezD(TOP)} fill="none" stroke={IVORY} strokeWidth={4} {...draw(ramp(t, feed, feed + 1.2))} />
      <path d={bezD(BOT)} fill="none" stroke={IVORY} strokeWidth={4} {...draw(ramp(t, feed + 0.5, feed + 1.7))} />
      {trail.map((d, j) => <circle key={j} cx={d.p[0]} cy={d.p[1]} r={11 - j} fill={VERMILION} opacity={d.o} />)}
      <Figure x={960} y={590} h={86} opacity={hostO} />
      <Label t={t} at={host + 0.4} x={960} y={640} text="humanity" size={26} italic opacity={1 - 0.6 * ramp(t, host + 2.5, host + 7)} />
      <Label t={t} at={acc} x={960} y={900} text="ACCELERATIONISM" size={36} rule />
    </Frame>
  );
};

// The wheel of birth and death and its two ways out (IX): one rises off the top and dissolves (transcendence); the
// other grows stronger on the rim and leaves through it as itself, in vermilion (the Left-Hand Path).
export const WheelExits = ({ t, cues }) => {
  const two = cue(cues, "two", 0.5), trans = cue(cues, "trans", 4), dis = cue(cues, "dissolved", 8), lhp = cue(cues, "lhp", 12);
  const strong = cue(cues, "stronger", 14), out = cue(cues, "itself", 22), god = cue(cues, "god", 30);
  const C = [820, 560], R = 250, rot = t * 7, wheel = ramp(t, two, two + 1.6), dimW = 1 - 0.45 * ramp(t, god, god + 2);
  const riders = Array.from({ length: 6 }, (_, i) => ((i / 6) * 360 + rot) * (Math.PI / 180));
  const up = ramp(t, trans, trans + 3), spread = ramp(t, dis, dis + 2.2);
  const grow = ramp(t, strong, strong + 3), leave = ramp(t, out, out + 3.2);
  const ang = -Math.PI / 6 + rot * (Math.PI / 180) * (1 - ramp(t, out - 1.5, out)), onRim = [C[0] + Math.cos(ang) * R, C[1] + Math.sin(ang) * R];
  const red = [lerp(onRim[0], 1500, leave), lerp(onRim[1], 560, leave)];
  return (
    <Frame>
      <g opacity={dimW}>
        <circle cx={C[0]} cy={C[1]} r={R} fill="none" stroke={IVORY} strokeWidth={6} transform={`rotate(-90 ${C[0]} ${C[1]})`} {...draw(wheel)} />
        {Array.from({ length: 8 }, (_, i) => {
          const a = ((i * 45 + rot) * Math.PI) / 180;
          return <line key={i} x1={C[0] + Math.cos(a) * 26} y1={C[1] + Math.sin(a) * 26} x2={C[0] + Math.cos(a) * (R - 3)} y2={C[1] + Math.sin(a) * (R - 3)}
            stroke={IVORY} strokeWidth={5} opacity={ramp(t, two + 0.6 + i * 0.08, two + 1.2 + i * 0.08)} />;
        })}
        <circle cx={C[0]} cy={C[1]} r={26} fill="none" stroke={IVORY} strokeWidth={5} opacity={wheel} />
        {riders.map((a, i) => <circle key={i} cx={C[0] + Math.cos(a) * R} cy={C[1] + Math.sin(a) * R} r={8} fill={IVORY} opacity={rise(t, two + 1.4 + i * 0.1)} />)}
      </g>
      {up > 0 && Array.from({ length: spread > 0 ? 9 : 1 }, (_, j) => {      // transcendence: up off the top, then nothing
        const a = (j / 9) * Math.PI * 2, y = lerp(C[1] - R, 150, up);
        return <circle key={j} cx={C[0] + Math.cos(a) * spread * 70} cy={y + Math.sin(a) * spread * 70} r={lerp(9, 2, spread)} fill={IVORY} opacity={1 - spread} />;
      })}
      <Label t={t} at={trans + 0.6} x={C[0] + 40} y={170} anchor="start" text="TRANSCENDENCE" size={30} opacity={1 - 0.5 * spread} />
      <Label t={t} at={dis + 0.4} x={C[0] + 40} y={210} anchor="start" text="nobody left to be born" size={26} italic />
      {t >= lhp && <circle cx={red[0]} cy={red[1]} r={lerp(9, 18, grow)} fill={VERMILION} opacity={rise(t, lhp, 0.5)} />}
      <Label t={t} at={out + 1.8} x={1500} y={640} text="THE LEFT-HAND PATH" size={30} />
      <Label t={t} at={out + 2.4} x={1500} y={682} text="the self kept" size={26} italic />
    </Frame>
  );
};
