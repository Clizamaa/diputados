'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { X, ArrowRight, ArrowUpRight, Envelope } from '@phosphor-icons/react';
import Foto from './Foto';
import { ResumenVotos } from './Votaciones';
const pct=(n,t)=>t?Math.round(n*100/t):0;
// La fecha de nacimiento llega como medianoche de Chile en UTC: se lee en UTC para no correr el día.
const fecha=s=>new Intl.DateTimeFormat('es-CL',{dateStyle:'long',timeZone:'UTC'}).format(new Date(s));
function edad(s){
  const n=new Date(s), h=new Date();
  let e=h.getUTCFullYear()-n.getUTCFullYear();
  if(h.getUTCMonth()<n.getUTCMonth()||(h.getUTCMonth()===n.getUTCMonth()&&h.getUTCDate()<n.getUTCDate())) e--;
  return e;
}
const asistencias=[['asiste','Asistió'],['justificada','Justificada'],['injustificada','Sin justificar']];
function useActividad(kind,id){
  const [estado,setEstado]=useState({});
  useEffect(()=>{
    let vivo=true;
    setEstado({});
    fetch('/api/congreso?'+new URLSearchParams({kind,id:String(id)})).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);return j.data;}).then(data=>vivo&&setEstado({data}),e=>vivo&&setEstado({error:e.message}));
    return()=>{vivo=false;};
  },[kind,id]);
  return estado;
}
function Kpi({titulo,valor,detalle}){
  return <div className="kpi"><small>{titulo}</small><b>{valor??'—'}</b><span>{detalle??'Consultando…'}</span></div>;
}
export default function FichaDiputado({person,committees,onClose}){
  const ref=useRef(null);
  useEffect(()=>{const d=ref.current;d.showModal();return()=>d.close();},[]);
  const asistencia=useActividad('asistencia',person.id), votos=useActividad('diputado',person.id), periodos=useActividad('periodos',person.id);
  const a=asistencia.data, v=votos.data, perfil='/diputados/'+person.id;
  const related=committees.filter(c=>c.integrantes.some(i=>i.id===person.id));
  const sesiones=a?.sesiones.length||0, faltas=a?a.resumen.justificada+a.resumen.injustificada:0;
  const total=v?.votaciones.length||0, emitidas=total-(v?.resumen['No Vota']||0);
  return <dialog ref={ref} className="ficha" aria-labelledby="ficha-titulo" onCancel={onClose} onClick={e=>{if(e.target===ref.current)onClose();}}>
    <button className="ficha-close" aria-label="Cerrar ficha" onClick={onClose}><X size={20}/></button>
    <header className="ficha-hero"><Foto person={person} className="monogram ficha-foto"/><div><div className="eyebrow">{person.sexo==='Femenino'?'DIPUTADA':'DIPUTADO'}{person.distrito?' · DISTRITO '+person.distrito:''}</div><h2 id="ficha-titulo">{person.nombreCompleto}</h2><span className="badge">{person.partido}</span></div></header>
    <div className="ficha-body">
      <section className="ficha-kpis" aria-label="Resumen del periodo">
        <Kpi titulo="Asistencia a sala" valor={a&&(sesiones?pct(a.resumen.asiste,sesiones)+'%':'—')} detalle={a&&(sesiones?`${a.resumen.asiste} de ${sesiones} sesiones`:'Sin registros')}/>
        <Kpi titulo="Participación en votaciones" valor={v&&(total?pct(emitidas,total)+'%':'—')} detalle={v&&(total?`Votó en ${emitidas} de ${total}`:'Sin registros')}/>
        <Kpi titulo="Inasistencias" valor={a&&faltas} detalle={a&&(!faltas?'Ninguna en el periodo':a.resumen.injustificada?`${a.resumen.injustificada} sin justificar`:'Todas justificadas')}/>
      </section>
      <section className="ficha-card" aria-labelledby="ficha-asistencia"><header><h3 id="ficha-asistencia">Asistencia a sala</h3>{sesiones>0&&<Link className="text-link" href={perfil+'#asistencia'}>Ver sesiones<ArrowRight size={14}/></Link>}</header>
        {asistencia.error?<p className="caption">{asistencia.error}</p>:!a?<div className="skeleton tiny"/>:sesiones?<><div className="votes-bar" role="img" aria-label={asistencias.map(([k,l])=>`${l}: ${a.resumen[k]}`).join(', ')}>{asistencias.map(([k])=>a.resumen[k]?<span key={k} data-asis={k} style={{flexGrow:a.resumen[k]}}/>:null)}</div><ul className="votes-legend">{asistencias.map(([k,l])=><li key={k} data-asis={k}><i/>{l}<b>{a.resumen[k]}</b></li>)}</ul></>:<p className="caption">La fuente no registra asistencia de esta persona en el periodo.</p>}
      </section>
      <section className="ficha-card" aria-labelledby="ficha-votos"><header><h3 id="ficha-votos">Cómo vota</h3>{total>0&&<Link className="text-link" href={perfil+'#votaciones'}>Ver votaciones<ArrowRight size={14}/></Link>}</header>
        {votos.error?<p className="caption">{votos.error}</p>:!v?<><div className="skeleton tiny"/><p className="caption">La primera consulta del día puede tardar hasta un minuto.</p></>:total?<ResumenVotos data={v}/>:<p className="caption">La fuente no registra votaciones de esta persona en el periodo.</p>}
      </section>
      <section className="ficha-datos" aria-labelledby="ficha-datos"><h3 id="ficha-datos">Datos</h3>
        <dl><dt>Partido</dt><dd>{person.partido}</dd><dt>Distrito</dt><dd>{person.distrito?'Distrito '+person.distrito:'No informado'}</dd><dt>Nacimiento</dt><dd>{person.nacimiento?`${fecha(person.nacimiento)} · ${edad(person.nacimiento)} años`:'No informado'}</dd><dt>Comisiones</dt><dd>{related.length?related.map(c=>c.nombre).join(', '):'La Cámara aún no publica las comisiones del periodo.'}</dd>{periodos.data?.length>1&&<><dt>Periodos</dt><dd className="period-links">{periodos.data.map((p,i)=><span key={p.id}>{i>0&&' · '}<Link href={perfil+(p.actual?'':'?periodo='+p.id)}>{p.nombre}</Link></span>)}</dd></>}</dl>
      </section>
      <p className="caption">Fuentes: datos abiertos de la Cámara de Diputadas y Diputados y del Congreso Nacional, periodo legislativo actual. Un campo vacío no implica ausencia de actividad.</p>
    </div>
    <footer className="ficha-foot"><Link className="primary" href={perfil}>Ver perfil completo<ArrowRight size={16}/></Link><a className="secondary" href={'https://www.camara.cl/diputados/detalle/votaciones_sala.aspx?prmID='+person.id} target="_blank" rel="noreferrer">camara.cl<ArrowUpRight size={15}/></a>{person.correo&&<a className="secondary" href={'mailto:'+person.correo} aria-label="Enviar correo"><Envelope size={16}/></a>}</footer>
  </dialog>;
}
