'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight, ArrowLeft } from '@phosphor-icons/react';
import { dia } from './Votaciones';
const estados=[['asiste','Asistió','Asistió'],['justificada','Inasistencia justificada','Justificada'],['injustificada','Inasistencia sin justificar','Sin justificar']];
const POR_PAGINA=25;
const pct=(n,t)=>t?Math.round(n*100/t):0;
export function ResumenAsistencia({data}){
  const r=data.resumen, t=data.sesiones.length;
  return <div className="attendance-overview"><p className="attendance-rate"><b>{pct(r.asiste,t)}%</b>de asistencia a sala<span>{r.asiste} de {t} sesiones celebradas en el periodo</span></p>
    <div className="votes-bar" role="img" aria-label={estados.map(([k,l])=>`${l}: ${r[k]}`).join(', ')}>{estados.map(([k])=>r[k]?<span key={k} data-asis={k} style={{flexGrow:r[k]}}/>:null)}</div>
    <ul className="votes-legend">{estados.map(([k,l])=><li key={k} data-asis={k}><i/>{l}<b>{r[k]}</b></li>)}</ul></div>;
}
export function HistorialAsistencia({data}){
  const [estado,setEstado]=useState(''),[pagina,setPagina]=useState(1);
  const filtradas=useMemo(()=>data.sesiones.filter(s=>!estado||s.estado===estado),[data,estado]);
  const paginas=Math.max(1,Math.ceil(filtradas.length/POR_PAGINA)), visibles=filtradas.slice((pagina-1)*POR_PAGINA,pagina*POR_PAGINA);
  const ir=p=>{setPagina(p);document.getElementById('historial-asistencia')?.scrollIntoView({behavior:'smooth'});};
  return <section className="history" id="historial-asistencia">
    <div className="history-summary"><ResumenAsistencia data={data}/><p className="caption">Sesiones de sala celebradas desde el inicio del periodo. Las inasistencias justificadas (licencia médica, permiso, misión oficial, entre otras) son las que la Cámara registra con un motivo.{data.sinDetalle?` ${data.sinDetalle} sesiones sin detalle disponible.`:''}</p></div>
    <div className="chips" role="group" aria-label="Filtrar por asistencia">{[['','Todas',data.sesiones.length],...estados.map(([k,,c])=>[k,c,data.resumen[k]])].map(([k,l,n])=><button key={k||'todas'} className="chip" aria-pressed={estado===k} onClick={()=>{setEstado(k);setPagina(1);}}>{l}<span>{n}</span></button>)}</div>
    <div className="results-label" aria-live="polite"><b>{filtradas.length}</b> sesiones <span>Más recientes primero</span></div>
    {visibles.length>0&&<div className="history-card">{visibles.map(s=><div className="vote-item" key={s.id}><div className="vote-row"><div><time dateTime={s.fecha}>{dia(s.fecha)} · {s.fecha.slice(11,16)}</time><p>Sesión n° {s.numero}<small>{s.tipo}{s.justificacion?' · '+s.justificacion:''}</small></p></div><strong data-asis={s.estado}>{estados.find(e=>e[0]===s.estado)[2]}</strong></div></div>)}</div>}
    {!filtradas.length&&<div className="empty"><h3>Sin sesiones con este filtro</h3><p>Prueba con otra opción.</p></div>}
    {paginas>1&&<div className="pagination"><span>{(pagina-1)*POR_PAGINA+1}–{Math.min(pagina*POR_PAGINA,filtradas.length)} de {filtradas.length} sesiones</span><div><button aria-label="Página anterior" disabled={pagina===1} onClick={()=>ir(pagina-1)}><ArrowLeft size={18}/></button><span>{pagina} / {paginas}</span><button aria-label="Página siguiente" disabled={pagina===paginas} onClick={()=>ir(pagina+1)}><ArrowRight size={18}/></button></div></div>}
  </section>;
}
