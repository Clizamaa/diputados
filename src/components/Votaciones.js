'use client';
import { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ArrowRight, ArrowLeft, ArrowUpRight, MagnifyingGlass, CaretDown } from '@phosphor-icons/react';
export const opciones=[['Afirmativo','A favor'],['En Contra','En contra'],['Abstención','Abstención'],['No Vota','No vota']];
const POR_PAGINA=25;
const etiqueta=o=>opciones.find(x=>x[0]===o)?.[1]||o;
// Las fechas de la Cámara vienen en hora de Chile sin zona: se formatean desde el texto para no depender del huso del navegador.
export const dia=(s,dateStyle='medium')=>new Intl.DateTimeFormat('es-CL',{dateStyle,timeZone:'UTC'}).format(new Date(s.slice(0,10)+'T00:00:00Z'));
// "3-Creacion Comision Investigadora" → "Creacion Comision Investigadora"; "1-Otros" no dice nada por sí solo.
const boletin=v=>{const d=v.descripcion.replace(/^Boletín N°\s*/,'Boletín ').replace(/^\d+-/,'');return d==='Otros'?'Otra votación de sala':d||'Votación '+v.id;};
const numeroBoletin=v=>v.descripcion.match(/Boletín N°\s*(\d+-\d+)/)?.[1];
const informado=s=>String(s||'').replace(/[\s/]/g,'')?String(s).trim():'';
// Muchas votaciones comparten boletín: cada proyecto se consulta una sola vez por visita.
const proyectos=new Map();
function proyecto(b){
  if(!proyectos.has(b)) proyectos.set(b,fetch('/api/congreso?'+new URLSearchParams({kind:'project',id:b})).then(async r=>{const j=await r.json();if(!r.ok)throw new Error(j.error);return j.data;}).catch(e=>{proyectos.delete(b);throw e;}));
  return proyectos.get(b);
}
function ProyectoResumen({b}){
  const [data,setData]=useState(),[error,setError]=useState('');
  useEffect(()=>{let vivo=true;proyecto(b).then(d=>vivo&&setData(d),e=>vivo&&setError(e.message));return()=>{vivo=false;};},[b]);
  if(error) return <p className="caption">{error}</p>;
  if(data===undefined) return <p className="caption">Consultando el proyecto…</p>;
  if(!data) return <p className="caption">El Senado no registra información para este boletín.</p>;
  return <><p className="peek-title">{data.titulo}</p><dl><dt>Estado</dt><dd>{informado(data.estado)||'No informado'}</dd><dt>Etapa</dt><dd>{[data.etapa,data.subetapa].map(informado).filter(Boolean).join(' · ')||'No informada'}</dd><dt>Ingreso</dt><dd>{[data.fecha_ingreso,data.iniciativa].map(informado).filter(Boolean).join(' · ')||'No informado'}</dd></dl></>;
}
function QueSeVoto({id}){
  const [data,setData]=useState();
  useEffect(()=>{let vivo=true;fetch('/api/congreso?'+new URLSearchParams({kind:'votacion',id:String(id)})).then(r=>r.ok?r.json():{data:null}).then(j=>vivo&&setData(j.data),()=>vivo&&setData(null));return()=>{vivo=false;};},[id]);
  if(!data?.articulo) return null;
  const etapa=[data.tramite,data.informe].filter(Boolean).join(' · ').toLowerCase();
  return <div className="vote-what"><small>Qué se votó{etapa?' · '+etapa:''}</small>{data.articulo}</div>;
}
// La materia de resoluciones, acuerdos y otras votaciones solo aparece en camara.cl, que bloquea las consultas desde servidores: se enlaza.
function DetalleVotacion({v,b,id}){
  const desde=usePathname(), total=v.si+v.no+v.abst;
  return <div className="project-peek" id={id} aria-live="polite">
    {b?<><ProyectoResumen b={b}/><QueSeVoto id={v.id}/></>:<p className="caption">Los datos abiertos de la Cámara no incluyen la materia de esta votación. Puedes leerla en su sitio.</p>}
    {total>0&&<><div className="votes-bar small" role="img" aria-label={`Resultado en sala: ${v.si} a favor, ${v.no} en contra, ${v.abst} abstenciones`}>{[['Afirmativo',v.si],['En Contra',v.no],['Abstención',v.abst]].map(([k,n])=>n?<span key={k} data-opcion={k} style={{flexGrow:n}}/>:null)}</div><p className="vote-tally">Sala: {v.si} a favor · {v.no} en contra · {v.abst} abstenciones{v.disp?` · ${v.disp} dispensados`:''}{v.quorum?` · ${v.quorum}`:''} · <b>{v.resultado}</b></p></>}
    <div className="peek-links">{b&&<Link className="text-link" href={`/proyectos/${b}?desde=${encodeURIComponent(desde)}`}>Ver tramitación completa<ArrowRight size={14}/></Link>}<a className="text-link" href={'https://www.camara.cl/legislacion/sala_sesiones/votacion_detalle.aspx?prmIdVotacion='+v.id} target="_blank" rel="noreferrer">Ver votación en camara.cl<ArrowUpRight size={14}/></a></div>
  </div>;
}
function Fila({v,hora}){
  const [abierto,setAbierto]=useState(false), panel='votacion-'+v.id;
  return <div className="vote-item"><div className="vote-row"><div><time dateTime={v.fecha}>{hora?v.fecha.slice(11,16):dia(v.fecha)}</time><p><button className="boletin-link" aria-expanded={abierto} aria-controls={panel} onClick={()=>setAbierto(a=>!a)}>{boletin(v)}<CaretDown size={12}/></button><small>{v.tipo} · {v.resultado}</small></p></div><strong data-opcion={v.opcion}>{etiqueta(v.opcion)}</strong></div>{abierto&&<DetalleVotacion v={v} b={numeroBoletin(v)} id={panel}/>}</div>;
}
export function ResumenVotos({data}){
  const total=data.votaciones.length;
  return <div className="votes-overview"><div className="votes-bar" role="img" aria-label={opciones.map(([k,l])=>`${l}: ${data.resumen[k]||0}`).join(', ')}>{opciones.map(([k])=>data.resumen[k]?<span key={k} data-opcion={k} style={{flexGrow:data.resumen[k]}}/>:null)}</div><ul className="votes-legend">{opciones.map(([k,l])=><li key={k} data-opcion={k}><i/>{l}<b>{data.resumen[k]||0}</b><small>{total?Math.round((data.resumen[k]||0)*100/total):0}%</small></li>)}</ul></div>;
}
export function HistorialVotos({data}){
  const [opcion,setOpcion]=useState(''),[tipo,setTipo]=useState(''),[q,setQ]=useState(''),[pagina,setPagina]=useState(1);
  const tipos=useMemo(()=>[...new Set(data.votaciones.map(v=>v.tipo))].sort(),[data]);
  const filtradas=useMemo(()=>data.votaciones.filter(v=>(!opcion||v.opcion===opcion)&&(!tipo||v.tipo===tipo)&&(!q.trim()||v.descripcion.toLowerCase().includes(q.trim().toLowerCase()))),[data,opcion,tipo,q]);
  const paginas=Math.max(1,Math.ceil(filtradas.length/POR_PAGINA)), visibles=filtradas.slice((pagina-1)*POR_PAGINA,pagina*POR_PAGINA);
  const dias=[];
  for(const v of visibles){const d=v.fecha.slice(0,10);if(dias.at(-1)?.[0]!==d)dias.push([d,[]]);dias.at(-1)[1].push(v);}
  const filtrar=f=>{f();setPagina(1);};
  const ir=p=>{setPagina(p);document.getElementById('historial')?.scrollIntoView({behavior:'smooth'});};
  return <section className="history" id="historial">
    <div className="history-summary"><ResumenVotos data={data}/><p className="caption">Participación registrada en {data.votaciones.length} de {data.total} votaciones de sala del periodo{data.sinDetalle?` · ${data.sinDetalle} sin detalle disponible`:''}.</p></div>
    <div className="chips" role="group" aria-label="Filtrar por voto">{[['','Todas',data.votaciones.length],...opciones.map(([k,l])=>[k,l,data.resumen[k]||0])].map(([k,l,n])=><button key={k||'todas'} className="chip" aria-pressed={opcion===k} onClick={()=>filtrar(()=>setOpcion(k))}>{l}<span>{n}</span></button>)}</div>
    <div className="filters"><label className="search-field"><span>Buscar boletín</span><div><MagnifyingGlass size={20}/><input value={q} onChange={e=>filtrar(()=>setQ(e.target.value))} placeholder="Ej. 17757"/></div></label><label><span>Tipo de votación</span><select value={tipo} onChange={e=>filtrar(()=>setTipo(e.target.value))}><option value="">Todos los tipos</option>{tipos.map(t=><option key={t}>{t}</option>)}</select></label><button className="clear" onClick={()=>filtrar(()=>{setOpcion('');setTipo('');setQ('');})}>Limpiar filtros</button></div>
    <div className="results-label" aria-live="polite"><b>{filtradas.length}</b> votaciones <span>Más recientes primero</span></div>
    {dias.map(([d,vs])=><div className="history-day" key={d}><h4>{dia(d,'full')}<span>{vs.length} {vs.length===1?'votación':'votaciones'}</span></h4><div className="history-card">{vs.map(v=><Fila key={v.id} v={v} hora/>)}</div></div>)}
    {!filtradas.length&&<div className="empty"><MagnifyingGlass size={32}/><h3>Sin votaciones con estos filtros</h3><p>Prueba con otra opción de voto o limpia la búsqueda.</p></div>}
    {paginas>1&&<div className="pagination"><span>{(pagina-1)*POR_PAGINA+1}–{Math.min(pagina*POR_PAGINA,filtradas.length)} de {filtradas.length} votaciones</span><div><button aria-label="Página anterior" disabled={pagina===1} onClick={()=>ir(pagina-1)}><ArrowLeft size={18}/></button><span>{pagina} / {paginas}</span><button aria-label="Página siguiente" disabled={pagina===paginas} onClick={()=>ir(pagina+1)}><ArrowRight size={18}/></button></div></div>}
  </section>;
}
