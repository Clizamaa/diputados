'use client';
import { useState, useEffect } from 'react';
import { HistorialVotos } from './Votaciones';
import { HistorialAsistencia } from './Asistencia';
const pestanas=[['votaciones','Votaciones en sala'],['asistencia','Asistencia a sala']];
async function api(kind,id,periodo){
  const r=await fetch('/api/congreso?'+new URLSearchParams({kind,id:String(id),periodo:String(periodo)}));
  const j=await r.json();
  if(!r.ok) throw new Error(j.error);
  return j.data;
}
function SinDatos({children}){return <div className="empty"><h3>Sin registros individuales</h3><p>{children}</p></div>;}
// El periodo actual llega renderizado desde el servidor; los anteriores se piden al elegirlos y se conservan en memoria.
export default function PerfilDiputado({id,periodos,inicial,solicitado}){
  const [tab,setTab]=useState('votaciones'),[periodo,setPeriodo]=useState(solicitado),[error,setError]=useState('');
  const [datos,setDatos]=useState({[inicial.periodo]:{votos:inicial.votos,asistencia:inicial.asistencia}});
  // La pestaña se lee del hash después de montar (#asistencia desde la ficha) para no desalinear el render del servidor.
  useEffect(()=>{
    const leer=()=>{const h=location.hash.slice(1);if(pestanas.some(p=>p[0]===h))setTab(h);};
    leer();addEventListener('hashchange',leer);return()=>removeEventListener('hashchange',leer);
  },[]);
  useEffect(()=>{
    if(datos[periodo]) return;
    let vivo=true;
    setError('');
    Promise.allSettled([api('diputado',id,periodo),api('asistencia',id,periodo)]).then(([v,a])=>{
      if(!vivo) return;
      if(v.status==='rejected') return setError(v.reason?.message||'No fue posible cargar el periodo.');
      setDatos(d=>({...d,[periodo]:{votos:v.value,asistencia:a.status==='fulfilled'?a.value:null}}));
    });
    return()=>{vivo=false;};
  },[periodo,id,datos]);
  const elegirTab=k=>{setTab(k);history.replaceState(null,'','#'+k);};
  const elegirPeriodo=p=>{
    setPeriodo(p.id);
    const u=new URL(location.href);
    if(p.actual) u.searchParams.delete('periodo'); else u.searchParams.set('periodo',p.id);
    history.replaceState(null,'',u);
  };
  const sel=periodos.find(p=>p.id===periodo), actual=datos[periodo];
  return <>
    {periodos.length>1&&<div className="period-switch" role="group" aria-label="Periodo legislativo"><span>Periodo</span>{periodos.map(p=><button key={p.id} aria-pressed={periodo===p.id} onClick={()=>elegirPeriodo(p)}>{p.nombre}{p.actual&&<small>actual</small>}</button>)}</div>}
    {sel&&!sel.actual&&<p className="period-note">Periodo {sel.nombre} · Partido en ese periodo: <b>{sel.partido||'No informado'}</b>. El distrito solo está disponible para el periodo actual.</p>}
    <div className="profile-tabs" role="tablist" aria-label="Actividad en sala">{pestanas.map(([k,l])=><button key={k} role="tab" id={'tab-'+k} aria-selected={tab===k} aria-controls={'panel-'+k} onClick={()=>elegirTab(k)}>{l}</button>)}</div>
    <div role="tabpanel" id={'panel-'+tab} aria-labelledby={'tab-'+tab} aria-busy={!actual}>
      {error?<p className="notice" role="alert">{error}</p>
        :!actual?<div className="history-summary period-loading"><p><b>Preparando el periodo {sel?.nombre}…</b></p><p className="caption">La primera consulta de un periodo anterior puede tardar uno o dos minutos: se revisan miles de votaciones y sesiones de sala. Después queda guardado.</p><div className="skeleton small"/></div>
        :tab==='votaciones'?(actual.votos.votaciones.length?<HistorialVotos key={'v'+periodo} data={actual.votos}/>:<SinDatos>{actual.votos.total?`La fuente no registra votos de esta persona en las ${actual.votos.total} votaciones de sala del periodo.`:'Los datos abiertos de la Cámara no incluyen votaciones de sala para este periodo: se publican desde 2002.'}</SinDatos>)
        :actual.asistencia?(actual.asistencia.sesiones.length?<HistorialAsistencia key={'a'+periodo} data={actual.asistencia}/>:<SinDatos>{actual.asistencia.total?`La Cámara registra ${actual.asistencia.total} sesiones de sala en este periodo, pero no publica la asistencia individual de cada una.`:'No hay sesiones de sala registradas para este periodo.'}</SinDatos>)
        :<p className="notice" role="alert">No fue posible cargar la asistencia de este periodo. Vuelve a intentar.</p>}
    </div>
  </>;
}
