import { getProject, getVotacionesDiputado, getAsistenciaDiputado, getResumenActividad, getPeriodosDiputado, query, list, text } from '@/lib/camara';
export async function GET(request) {
  const params=new URL(request.url).searchParams;
  const kind=params.get('kind'), id=(params.get('id')||'').trim();
  if(kind==='resumen') { try { return Response.json({data:await getResumenActividad()}); } catch { return Response.json({error:'El servicio de la Cámara no está disponible en este momento.'},{status:502}); } }
  if(!/^\d{1,6}(-\d{2})?$/.test(id)) return Response.json({error:'Ingresa un boletín válido, por ejemplo 8575-05.'},{status:400});
  try {
    if(kind==='project') return Response.json({data:await getProject(id)});
    const periodo=params.get('periodo')||undefined;
    if(periodo&&!/^\d{1,3}$/.test(periodo)) return Response.json({error:'Periodo no válido.'},{status:400});
    if(kind==='diputado' && /^\d+$/.test(id)) return Response.json({data:await getVotacionesDiputado(Number(id),periodo)});
    if(kind==='asistencia' && /^\d+$/.test(id)) return Response.json({data:await getAsistenciaDiputado(Number(id),periodo)});
    if(kind==='periodos' && /^\d+$/.test(id)) return Response.json({data:await getPeriodosDiputado(Number(id))});
    // Solo congreso.cl informa qué se votó (artículo, trámite, informe), y únicamente para votaciones ligadas a un boletín.
    if(kind==='votacion' && /^\d+$/.test(id)) { const v=(await query('getVotacion_Detalle',{prmVotacionID:Number(id)}))?.Votacion; return Response.json({data:v?{articulo:v.Articulo||'',tramite:text(v.Tramite),informe:text(v.Informe),sesion:v.Sesion?.Numero||null}:null}); }
    if(kind==='votes') { const r=await query('getVotaciones_Boletin',{prmBoletin:id}); return Response.json({data:list(r?.Votaciones?.Votacion)}); }
    if(kind==='vote' && /^\d+$/.test(id)) {
      const r=await query('getVotacion_Detalle',{prmVotacionID:Number(id)}), v=r?.Votacion;
      return Response.json({data:v?{...v,votos:list(v.Votos?.Voto).map(v=>({nombre:[v.Diputado?.Nombre,v.Diputado?.Apellido_Paterno,v.Diputado?.Apellido_Materno].filter(Boolean).join(' '),opcion:text(v.Opcion)}))}:null});
    }
    return Response.json({error:'Consulta no válida.'},{status:400});
  } catch {return Response.json({error:'El servicio del Congreso no está disponible en este momento. Vuelve a intentar.'},{status:502});}
}
