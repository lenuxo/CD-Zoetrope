import type { DiscSettings } from './settings';

const f=(x: number)=>Number(x.toFixed(5));
function point(r: number,a: number){const rad=(a-90)*Math.PI/180;return [f(r*Math.cos(rad)),f(r*Math.sin(rad))].join(' ')}
function ring(R: number,r: number){return [R,r].map(x=>'M '+x+' 0 a '+x+' '+x+' 0 1 0 '+(-2*x)+' 0 a '+x+' '+x+' 0 1 0 '+(2*x)+' 0 Z').join(' ')}
function sector(R: number,r: number,a: number,b: number){return 'M '+point(R,a)+' A '+R+' '+R+' 0 0 1 '+point(R,b)+' L '+point(r,b)+' A '+r+' '+r+' 0 0 0 '+point(r,a)+' Z'}
export function layout(values: DiscSettings){
 const {outer,band,count,size}=values;
 const outerTrack=outer/2;
 const innerTrack=outerTrack-band;
 const repeats=values.repeats;
 const slots=count*repeats;
 const slotAngle=360/slots;
 const isBall=values.example==='ball';
 // At the lowest position the ball must fit within a wedge, with clearance.
 const halfAngle=Math.PI/slots;
 const maxBallRadius=((innerTrack-2-values.height)*Math.sin(halfAngle)-.35)/(1+Math.sin(halfAngle));
 const ballRadius=Math.min(values.diameter/2,Math.floor(maxBallRadius*100)/100);
 const anchor=innerTrack-(isBall?ballRadius+values.height:size/2)-2;
 const halfSlotWidth=(anchor-size/2)*Math.tan(Math.PI/slots);
 const fishWidthScale=Math.min(size/14,(halfSlotWidth-.35)/5.3);
 const referenceOffset=isBall?ballRadius+1:size/2+2;
 const referenceWidth=isBall?Math.min(9,2*((anchor-referenceOffset)*Math.tan(halfAngle)-.5)):2;
 return {anchor,innerTrack,outerTrack,repeats,slots,slotAngle,fishWidthScale,ballRadius,referenceOffset,referenceWidth,isBall};
}
export type DiscLayout = ReturnType<typeof layout>;

function fish(values: DiscSettings,frame: number,widthScale: number){
 const phase=2*Math.PI*frame/values.count;
 const sweep=values.jump/100;
 const tail=3.1*Math.sin(phase)*sweep;
 const waist=.95*Math.sin(phase-.65)*sweep;
 const fin=.55*Math.cos(phase)*sweep;
 // The head stays fixed while the waist bends into a broad, contrasting tail.
 return `<g transform="scale(${f(widthScale)} ${f(values.size/14)})">
 <path fill="#d14b2f" d="M -1.9 -2.8 Q ${-4.8-fin} -1.8 ${-3.65-fin} 1.35 L -1.2 -.3 Z M 1.9 -2.8 Q ${4.8-fin} -1.8 ${3.65-fin} 1.35 L 1.2 -.3 Z"/>
 <path fill="#d14b2f" d="M ${f(waist)} 2.1 Q ${f(tail*.55)} 3.9 ${f(tail+2.15)} 7 L ${f(tail)} 6.3 L ${f(tail-2.15)} 7 Q ${f(tail*.58)} 4.6 ${f(waist-.6)} 2.5 Z"/>
 <path fill="#162730" d="M 0 -7 C 2.5 -6.9 3 -4 2.05 -1.65 Q ${f(waist+1.6)} .5 ${f(tail*.57+.42)} 4.6 L ${f(tail*.57-.42)} 4.6 Q ${f(waist-1.6)} .5 -2.05 -1.65 C -3 -4 -2.5 -6.9 0 -7 Z"/>
 <path fill="#fff" d="M -1.3 -4.9 C -1.6 -5.6 1.6 -5.6 1.3 -4.9 C .95 -3.8 -.95 -3.8 -1.3 -4.9 Z"/>
 </g>`;
}
function frameArt(values: DiscSettings,frame: number,geometry: DiscLayout){
 if(!geometry.isBall) return fish(values,frame,geometry.fishWidthScale);
 const t=frame/values.count;
 const rise=4*t*(1-t)*values.height;
 return `<circle cx="0" cy="${f(-rise)}" r="${geometry.ballRadius}" fill="#000"/>`;
}
function referenceMark(y: number,width: number){
 return `<path d="M ${f(-width/2)} ${f(y)} h ${f(width)}" stroke-width=".8"/>`;
}
export const discSizeMm=120;
export const pngDpi=600;
export const pngSide=Math.round(discSizeMm/25.4*pngDpi);

export function disc(values: DiscSettings,showGuides=false,side=`${discSizeMm}mm`){
 const {inner,count}=values;
 const geometry=layout(values);
 const {outerTrack:R,innerTrack:r,slots,anchor,slotAngle,referenceOffset,referenceWidth,isBall}=geometry;
 const {direction}=values;
 const referenceRadius=anchor-referenceOffset;
 const name=isBall?'小球跳动':'游鱼';
 let marks='',frames='',references='',guides='';
 for(let i=0;i<slots;i++){
   const frame=(count-(direction*i)%count)%count;
   const angle=f(i*slotAngle);
   marks+=`<path d="${sector(R,r,i*slotAngle,(i+.5)*slotAngle)}"/>`;
   frames+=`<g data-frame="${frame+1}" transform="rotate(${angle}) translate(0 ${f(-anchor)})">${frameArt(values,frame,geometry)}</g>`;
   references+=`<g transform="rotate(${angle})">${referenceMark(-referenceRadius,referenceWidth)}</g>`;
   if(showGuides) guides+=`<g transform="rotate(${angle})"><path transform="rotate(${slotAngle/2})" d="M0 ${-r}V${f(-referenceRadius+1)}" stroke="#315acb" stroke-width=".1"/><text y="${f(-referenceRadius+3)}" text-anchor="middle" font-size="1.55" fill="#315acb">${String(frame+1).padStart(2,'0')}</text></g>`;
 }
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${side}" height="${side}" viewBox="-60 -60 120 120"><title>${name} · ${slots} 槽 / ${count} 帧</title><path fill="white" fill-rule="evenodd" d="${ring(R,inner/2)}"/><path fill="black" fill-rule="evenodd" d="${ring(R,r)}"/><g id="sync-white" fill="white">${marks}</g><g id="artwork">${frames}</g><g id="sync-reference" stroke="${isBall?'#000':'#162730'}">${references}</g>${showGuides?`<g id="layout-guides"><circle r="${anchor}" fill="none" stroke="#315acb" stroke-dasharray=".5 .8" stroke-width=".12"/>${guides}</g>`:''}</svg>`;
}
export function motionPreview(values: DiscSettings,frame: number,geometry: DiscLayout){
 if(geometry.isBall){
   const {referenceOffset,referenceWidth}=geometry;
   return `<svg viewBox="-14 -22 28 31" role="img" aria-label="小球跳动慢放"><rect x="-14" y="-22" width="28" height="31" fill="white"/>${frameArt(values,frame,geometry)}<g stroke="#000">${referenceMark(referenceOffset,referenceWidth)}</g></svg>`;
 }
 return `<svg viewBox="-11 -10 22 20" role="img" aria-label="游鱼摆尾慢放"><rect x="-11" y="-10" width="22" height="20" fill="white"/>${frameArt(values,frame,geometry)}</svg>`;
}
