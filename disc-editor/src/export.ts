import { pngDpi, pngSide } from './disc';

export function download(blob: Blob,name: string){
 const url=URL.createObjectURL(blob);
 const link=document.createElement('a');
 link.href=url;
 link.download=name;
 link.click();
 setTimeout(()=>URL.revokeObjectURL(url),2000);
}

// Record the intended print scale in the PNG's pHYs chunk (pixels per meter).
async function withPngResolution(blob: Blob,dpi: number){
 const png=new DataView(await blob.arrayBuffer());
 const chunk=new Uint8Array(21);
 const data=new DataView(chunk.buffer);
 const physType=0x70485973;
 const pixelsPerMeter=Math.round(dpi/.0254);
 data.setUint32(0,9);
 data.setUint32(4,physType);
 data.setUint32(8,pixelsPerMeter);
 data.setUint32(12,pixelsPerMeter);
 chunk[16]=1;
 let crc=0xffffffff;
 for(const byte of chunk.subarray(4,17)){
   crc^=byte;
   for(let bit=0;bit<8;bit++) crc=(crc>>>1)^((crc&1)?0xedb88320:0);
 }
 data.setUint32(17,crc^0xffffffff);

 // Replace the encoder's resolution if present, otherwise insert after IHDR.
 const afterHeader=8+12+png.getUint32(8);
 let offset=afterHeader;
 while(offset+12<=png.byteLength){
   const length=12+png.getUint32(offset);
   const type=png.getUint32(offset+4);
   if(type===physType) return new Blob([blob.slice(0,offset),chunk,blob.slice(offset+length)],{type:'image/png'});
   if(type===0x49444154) break; // IDAT
   offset+=length;
 }
 return new Blob([blob.slice(0,afterHeader),chunk,blob.slice(afterHeader)],{type:'image/png'});
}

export async function renderPng(svg: Blob){
 const url=URL.createObjectURL(svg);
 try {
   const image=new Image();
   const loaded=new Promise<void>((resolve,reject)=>{
     image.onload=()=>resolve();
     image.onerror=()=>reject(new Error('Unable to load disc artwork'));
   });
   image.src=url;
   await loaded;
   const canvas=document.createElement('canvas');
   canvas.width=canvas.height=pngSide;
   const context=canvas.getContext('2d');
   if (!context) throw new Error('Unable to create a canvas context');
   context.drawImage(image,0,0,pngSide,pngSide);
   const png=await new Promise<Blob>((resolve,reject)=>{
     canvas.toBlob(blob=>blob?resolve(blob):reject(new Error('Unable to encode PNG')),'image/png');
   });
   return await withPngResolution(png,pngDpi);
 } finally {
   URL.revokeObjectURL(url);
 }
}
