import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/camara';
export const dynamic = 'force-dynamic';
const informado=s=>String(s||'').replace(/[\s/]/g,'')?String(s).trim():'';
export default async function Proyecto({ params, searchParams }) {
  const { boletin } = await params, { desde } = await searchParams;
  if(!/^\d{1,6}-\d{2}$/.test(boletin)) notFound();
  const p=await getProject(boletin);
  if(!p) notFound();
  // Solo se vuelve a rutas internas conocidas, para no convertir ?desde= en una redirección abierta.
  const volver=typeof desde==='string'&&/^\/(diputados\/\d+)?$/.test(desde)?desde:'/';
  const campos=[['Estado',p.estado],['Etapa',p.etapa],['Subetapa',p.subetapa],['Ingreso',p.fecha_ingreso],['Iniciativa',p.iniciativa],['Cámara de origen',p.camara_origen],['Urgencia',p.urgencia_actual],['Ley N°',p.leynro]].map(([k,v])=>[k,informado(v)]).filter(([,v])=>v);
  return <div className="profile-page"><header className="topbar"><Link href={volver} className="text-link">← Volver</Link><a href={p.source} target="_blank" rel="noreferrer">Registro en el Senado ↗</a></header>
    <main id="contenido"><div className="eyebrow">PROYECTO DE LEY · BOLETÍN {p.boletin}</div><h1 className="project-title">{p.titulo}</h1>
      <article className="project-result"><div className="project-meta">{campos.map(([k,v])=><div key={k}><small>{k}</small><strong>{v}</strong></div>)}</div>
        {p.link_mensaje_mocion&&<a className="text-link" href={p.link_mensaje_mocion} target="_blank" rel="noreferrer">{p.iniciativa==='Mensaje'?'Texto del mensaje':'Texto de la moción'} original ↗</a>}
        <h3>Tramitación</h3><div className="timeline">{p.tramites.map((t,i)=><div key={i}><time>{t.FECHA}</time><p>{t.DESCRIPCIONTRAMITE}<small>{t.CAMARATRAMITE} · {t.ETAPDESCRIPCION}</small></p></div>)}</div>
      </article></main></div>;
}
