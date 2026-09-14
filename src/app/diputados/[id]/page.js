import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getOverview, getVotacionesDiputado, getAsistenciaDiputado, getPeriodosDiputado } from '@/lib/camara';
import Foto from '@/components/Foto';
import PerfilDiputado from '@/components/PerfilDiputado';
export const dynamic = 'force-dynamic';
export default async function Diputado({ params, searchParams }) {
  const { id } = await params, { periodo } = await searchParams;
  if(!/^\d+$/.test(id)) notFound();
  const [overview,votos,asistencia,periodos]=await Promise.all([getOverview(),getVotacionesDiputado(Number(id)),getAsistenciaDiputado(Number(id)).catch(()=>null),getPeriodosDiputado(Number(id)).catch(()=>[])]);
  const person=overview.diputados.find(d=>String(d.id)===id);
  if(!person) notFound();
  // Si la fuente de periodos falla, se muestra solo el actual.
  const lista=periodos.length?periodos:[{...votos.periodo,partido:person.partido}];
  const solicitado=lista.find(p=>String(p.id)===periodo)?.id??votos.periodo.id;
  return <div className="profile-page"><header className="topbar"><Link href="/" className="text-link">← Volver al explorador</Link><a href={'https://www.camara.cl/diputados/detalle/votaciones_sala.aspx?prmID='+id} target="_blank" rel="noreferrer">Ficha en camara.cl ↗</a></header>
    <main id="contenido"><section className="profile-head"><Foto person={person} className="monogram portrait"/><div><div className="eyebrow">ACTIVIDAD EN SALA</div><h1>{person.nombreCompleto}</h1><p>{[person.partido,person.distrito&&'Distrito '+person.distrito].filter(Boolean).join(' · ')}{lista.length>1&&` · ${lista.length} periodos como diputado`}</p></div></section>
      <PerfilDiputado id={Number(id)} periodos={lista} inicial={{periodo:votos.periodo.id,votos,asistencia}} solicitado={solicitado}/></main></div>;
}
