import React from 'react';
import {AbsoluteFill, Img, staticFile, useVideoConfig} from 'remotion';
import {VisualDiagram} from './VisualDiagram.js';

const clamp = n => Math.max(0, Math.min(1, n));
const asset = value => /^https?:/.test(value) ? value : staticFile(value);

function Highlight({excerpt, accent}) {
  const {text, highlight} = excerpt;
  if (!highlight) return text;
  const index = text.indexOf(highlight);
  return <>{text.slice(0,index)}<span style={{color:accent, borderBottom:`2px solid ${accent}`}}>{highlight}</span>{text.slice(index+highlight.length)}</>;
}

/** Frame-driven effects remain deterministic when rendering frames out of order. */
export function VisualTreatment({scene, frame, durationInFrames, children}) {
  const {width, height, fps} = useVideoConfig();
  const treatment = scene.treatment || 'classic';
  const paper = scene.palette === 'ink';
  const accent = paper ? '#a7351e' : '#d8bd87';
  const textColor = paper ? '#201f1b' : '#eee8db';
  const progress = clamp(frame / Math.max(1, durationInFrames));
  const seconds = frame / fps;
  const reveal = clamp((seconds-.15)/.8);
  const wide = width > height;
  const atmospheric = treatment === 'atmosphere';
  const editorial = treatment === 'manuscript';
  const chapter = treatment === 'chapter';
  const inkReveal = treatment === 'ink-reveal';
  const edge = clamp(seconds/4)*116-8;
  const paperCut = Array.from({length:13},(_,i)=>`${edge+Math.sin(i*2.6)*1.7}% ${i/12*100}%`).join(',');
  const serif = 'Georgia, Times New Roman, serif';
  const titleStyle = {color:textColor,fontFamily:serif,fontWeight:400,fontSize:width*(wide?.051:.081),lineHeight:1.08,margin:'22px 0',maxWidth:wide?'66%':'95%'};
  const labelStyle = {fontFamily:'Arial, sans-serif',fontSize:width*(wide?.012:.025),letterSpacing:width*.0022,textTransform:'uppercase',color:accent,lineHeight:1.5};
  return <AbsoluteFill style={{background:inkReveal?'#eee6d5':'#090b0e',overflow:'hidden'}}>
    <AbsoluteFill style={{filter:chapter && !paper?'brightness(.48)':undefined,clipPath:inkReveal && seconds<4?`polygon(0 0, ${paperCut}, 0 100%)`:undefined}}>{children}</AbsoluteFill>
    {scene.foreground && <AbsoluteFill style={{transform:`translate(${(progress-.5)*-2}%, ${(progress-.5)*.8}%) scale(${1.05+progress*.025})`}}>
      <Img src={asset(scene.foreground)} style={{width:'100%',height:'100%',objectFit:'cover'}} />
    </AbsoluteFill>}
    {treatment !== 'classic' && <AbsoluteFill style={{background:paper?'radial-gradient(ellipse at 57% 42%, transparent 30%, rgba(55,34,19,.12) 100%)':'radial-gradient(ellipse at 57% 42%, transparent 25%, rgba(3,6,10,.63) 100%)'}} />}
    {atmospheric && <>
      <AbsoluteFill style={{inset:'-12%',width:'124%',height:'124%',opacity:paper?.12:.25,background:paper?'radial-gradient(ellipse at 20% 76%, #71604e 0%, transparent 43%), radial-gradient(ellipse at 82% 63%, #b29267 0%, transparent 36%)':'radial-gradient(ellipse at 20% 76%, #a5b9c0 0%, transparent 43%), radial-gradient(ellipse at 82% 63%, #8cabb9 0%, transparent 36%)',transform:`translate(${Math.sin(seconds*.14)*4}%, ${Math.cos(seconds*.11)*2}%)`}} />
      {Array.from({length:24},(_,i)=>{
        const x=(i*37.79+seconds*(.24+(i%3)*.12))%110-5;
        const y=(i*23.63-seconds*(.24+(i%4)*.08)+200)%110-5;
        return <div key={i} style={{position:'absolute',left:`${x}%`,top:`${y}%`,width:2+i%3,height:2+i%3,borderRadius:'50%',background:paper?'#30261c':accent,opacity:.12+(i%4)*.05}} />;
      })}
    </>}
    {treatment === 'diagram' && <VisualDiagram scene={scene} seconds={seconds} />}
    {(editorial || (chapter && paper)) && <AbsoluteFill style={{background:paper?(wide?'linear-gradient(90deg, rgba(237,229,211,.98) 0%, rgba(237,229,211,.95) 43%, rgba(237,229,211,.2) 69%, transparent 100%)':'linear-gradient(0deg, rgba(237,229,211,.99), rgba(237,229,211,.72) 65%, transparent)'):(wide?'linear-gradient(90deg, rgba(9,13,16,.98) 0%, rgba(9,13,16,.95) 43%, rgba(9,13,16,.2) 69%, transparent 100%)':'linear-gradient(0deg, rgba(9,13,16,.99), rgba(9,13,16,.72) 65%, transparent)')}} />}
    {chapter && <AbsoluteFill style={{justifyContent:'center',padding:'8%',opacity:reveal,transform:`translateY(${(1-reveal)*12}px)`}}>
      <div style={labelStyle}>{scene.kicker || 'A new chapter'}</div>
      <div style={{width:60,height:2,background:accent,marginTop:25}} />
      <h1 style={titleStyle}>{scene.title}</h1>
    </AbsoluteFill>}
    {editorial && <AbsoluteFill style={{justifyContent:'center',padding:wide?'7% 8%':'12% 8%',opacity:reveal}}>
      <div style={{width:wide?'43%':'100%'}}>
        <div style={labelStyle}>{scene.kicker || {quotation:'From the source',interpretation:'Interpretation',fiction:'Original fiction'}[scene.excerpt.kind]}</div>
        {scene.title && <div style={{...titleStyle,fontSize:width*(wide?.018:.045),maxWidth:'100%',margin:'18px 0'}}>{scene.title}</div>}
        <div style={{fontFamily:serif,color:textColor,fontSize:width*(wide?.027:.06),lineHeight:1.45,marginTop:30}}><Highlight excerpt={scene.excerpt} accent={accent} /></div>
        <div style={{...labelStyle,fontSize:width*(wide?.009:.021),letterSpacing:1,marginTop:35,color:paper?'#686052':'#a8a69f'}}>{scene.excerpt.source || (scene.excerpt.kind === 'fiction' ? 'Original fiction' : 'Commentary')}</div>
      </div>
    </AbsoluteFill>}
    {!chapter && !editorial && scene.title && <div style={{position:'absolute',top:'8%',left:'7%',opacity:reveal}}>
      {scene.kicker && <div style={labelStyle}>{scene.kicker}</div>}
      <div style={{...titleStyle,fontSize:width*(wide?.028:.06),maxWidth:'100%',marginTop:12}}>{scene.title}</div>
    </div>}
  </AbsoluteFill>;
}
