'use client';
import { useState } from 'react';
// camara.cl bloquea las descargas desde servidores (Cloudflare), pero sirve las fotos al navegador: se enlazan directo, sin next/image.
export default function Foto({person,className='monogram'}){
  const [error,setError]=useState(false);
  const iniciales=person.nombreCompleto.split(' ').slice(0,2).map(n=>n[0]).join('');
  return <span className={className}>{error?iniciales:<img src={'https://www.camara.cl/img.aspx?prmID=GRCL'+person.id} alt="" loading="lazy" ref={i=>{if(i?.complete&&!i.naturalWidth)setError(true);}} onError={()=>setError(true)}/>}</span>;
}
