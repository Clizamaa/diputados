'use client';
import { ArrowUpRight } from '@phosphor-icons/react';
import Foto from './Foto';
// actividad: undefined mientras carga el resumen; null si la fuente no tiene registros de esta persona.
function Dato({etiqueta,valor,cargando}){
  return <div><small>{etiqueta}</small>{cargando?<b className="stat-loading" aria-label="Cargando"/>:<b>{valor??'—'}</b>}</div>;
}
export default function TarjetaDiputado({d,actividad,index,onOpen}){
  const cargando=actividad===undefined, pct=v=>v==null?null:v+'%';
  return <button className="person-card" onClick={onOpen} style={{'--index':index}}>
    <div className="person-top"><Foto person={d} className="monogram card-foto"/><div className="person-id"><h3>{d.nombreCompleto}</h3><p><i aria-hidden="true"/>{d.partido==='No informado'?'Partido no informado':d.partido}</p></div><ArrowUpRight className="person-arrow" size={18} aria-hidden="true"/></div>
    <div className="person-stats"><Dato etiqueta="Distrito" valor={d.distrito}/><Dato etiqueta="Asistencia" valor={pct(actividad?.asistencia)} cargando={cargando}/><Dato etiqueta="Votó en" valor={pct(actividad?.participacion)} cargando={cargando}/></div>
    {actividad?.sesiones>0&&actividad.justificadas/actividad.sesiones>=.25&&<p className="person-note">{actividad.justificadas} inasistencias justificadas</p>}
  </button>;
}
