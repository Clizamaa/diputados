import * as soap from 'soap';
import { XMLParser } from 'fast-xml-parser';
import { DISTRITOS } from './distritos.js';
export const SOURCE = 'https://opendata.congreso.cl';
const CAMARA = 'https://opendata.camara.cl/camaradiputados/WServices';
let client;
export const list = v => v == null ? [] : Array.isArray(v) ? v : [v];
export const text = v => v == null ? '' : typeof v === 'object' ? String(v.$value ?? '') : String(v);
const name = d => [d.Nombre,d.Nombre2,d.Apellido_Paterno??d.ApellidoPaterno,d.Apellido_Materno??d.ApellidoMaterno].filter(Boolean).join(' ').replace(/\s+/g,' ').trim();
export async function query(method, params = {}) {
  client ??= soap.createClientAsync(SOURCE+'/wscamaradiputados.asmx?WSDL', {wsdl_options:{timeout:15000}}).catch(e => {client=undefined;throw e;});
  const c = await client;
  const [result] = await c[method+'Async'](params,{timeout:15000});
  return JSON.parse(JSON.stringify(result));
}
async function camara(path, revalidate=3600) {
  const response=await fetch(CAMARA+path,{signal:AbortSignal.timeout(15000),next:{revalidate}});
  if(!response.ok) throw new Error('Cámara no disponible');
  return new XMLParser().parse(await response.text());
}
// opendata.congreso.cl declara Militancia_Actual, distrito y correo, pero los entrega vacíos.
// El servicio de la Cámara (mismos IDs) sí publica el historial de militancias; el distrito no lo publica ninguno (ver distritos.js).
export async function getPartidos() {
  const parsed=await camara('/WSDiputado.asmx/retornarDiputadosPeriodoActual'), now=new Date().toISOString().slice(0,19);
  return new Map(list(parsed?.DiputadosPeriodoColeccion?.DiputadoPeriodo).map(({Diputado:d})=>{
    const ms=list(d?.Militancias?.Militancia).sort((a,b)=>String(b.FechaInicio).localeCompare(String(a.FechaInicio)));
    const m=ms.find(m=>m.FechaInicio<=now&&(!m.FechaTermino||m.FechaTermino>=now))||ms[0];
    return [Number(d?.Id),m?.Partido?.Nombre||''];
  }));
}
// La Cámara tarda en cargar la composición de las comisiones de un periodo nuevo y arrastra integrantes del anterior
// sin fecha de término. Solo se cuentan incorporaciones desde el inicio del periodo actual: la sección se completa sola
// cuando la fuente se actualice.
export async function getComisiones() {
  const periodo=(await camara('/WSLegislativo.asmx/retornarPeriodoLegislativoActual'))?.PeriodoLegislativo;
  if(!periodo?.Id) throw new Error('Periodo no disponible');
  const inicio=String(periodo.FechaInicio), comisiones=list((await camara('/WSComision.asmx/retornarComisionesXPeriodo?prmPeriodoId='+periodo.Id))?.ComisionesColeccion?.Comision), detalles=[];
  for(let i=0;i<comisiones.length;i+=8) detalles.push(...await Promise.all(comisiones.slice(i,i+8).map(c=>camara('/WSComision.asmx/retornarComision?prmComisionId='+c.Id).then(r=>r?.Comision,()=>null))));
  return comisiones.map((c,i)=>({id:c.Id,nombre:c.NombreWeb||c.Nombre,tipo:text(c.Tipo),correo:c.Correo||'',presidente:c.Presidente?{id:Number(c.Presidente.Id),nombre:name(c.Presidente)}:null,integrantes:list(detalles[i]?.Integrantes?.DiputadoIntegrante).filter(x=>!x.FechaTermino&&String(x.FechaInicio)>=inicio).map(x=>({id:Number(x.Diputado?.Id),nombre:name(x.Diputado||{})}))}));
}
// ── Periodos legislativos ──
const raiz=x=>Object.values(x||{}).find(v=>v&&typeof v==='object');
const recientes=(a,b)=>String(b.Fecha??b.FechaInicio).localeCompare(String(a.Fecha??a.FechaInicio));
async function enTandas(items,fn,n=8){for(let i=0;i<items.length;i+=n) await Promise.all(items.slice(i,i+n).map(fn));}
// Comparte una actualización en curso entre consultas simultáneas y la repite como máximo una vez por hora.
function memo(fn) {
  let m;
  return ()=>{if(!m||Date.now()-m.at>3600e3){const promise=fn();m={promise,at:Date.now()};promise.catch(()=>{m=undefined;});}return m.promise;};
}
const indicePeriodos=memo(async()=>{
  const [actual,todos]=await Promise.all([camara('/WSLegislativo.asmx/retornarPeriodoLegislativoActual'),camara('/WSLegislativo.asmx/retornarPeriodosLegislativos',86400)]);
  const idActual=Number(actual?.PeriodoLegislativo?.Id);
  return list(raiz(todos)?.PeriodoLegislativo).map(p=>({id:Number(p.Id),nombre:text(p.Nombre),inicio:String(p.FechaInicio),termino:String(p.FechaTermino||''),legislaturas:list(p.Legislaturas?.Legislatura).map(l=>l.Id),actual:Number(p.Id)===idActual})).filter(p=>p.legislaturas.length).sort((a,b)=>b.inicio.localeCompare(a.inicio));
});
async function periodoLegislativo(id) {
  const ps=await indicePeriodos(), p=id?ps.find(p=>p.id===Number(id)):ps.find(p=>p.actual)||ps[0];
  if(!p) throw new Error('Periodo no encontrado');
  return p;
}
// Partido en un periodo: la militancia más reciente que se cruza con sus fechas.
function partidoEn(d,p) {
  const fin=p.termino||'9999', ms=list(d?.Militancias?.Militancia).filter(m=>String(m.FechaInicio)<=fin&&(!m.FechaTermino||String(m.FechaTermino)>=p.inicio)).sort(recientes);
  return ms[0]?.Partido?.Nombre||'';
}
const miembros=new Map();
function miembrosPeriodo(p) {
  const m=miembros.get(p.id);
  if(m&&!(p.actual&&Date.now()-m.at>3600e3)) return m.promise;
  const promise=camara('/WSDiputado.asmx/retornarDiputadosXPeriodo?prmPeriodoID='+p.id,p.actual?3600:7*86400).then(r=>new Map(list(raiz(r)?.DiputadoPeriodo).map(({Diputado:d})=>[Number(d?.Id),partidoEn(d,p)])));
  miembros.set(p.id,{promise,at:Date.now()});
  promise.catch(()=>miembros.delete(p.id));
  return promise;
}
export async function getPeriodosDiputado(id) {
  const ps=await indicePeriodos();
  const res=await Promise.all(ps.map(p=>miembrosPeriodo(p).then(m=>m.has(id)?{id:p.id,nombre:p.nombre,actual:p.actual,partido:m.get(id)}:null,()=>null)));
  return res.filter(Boolean);
}
// ── Votaciones y asistencia por periodo ──
// La API no permite consultar por diputado: se guarda el detalle de cada votación y sesión como pares [id diputado, código]
// en un Int32Array. Un periodo antiguo (~6.000 votaciones × 155 diputados) ocupa así unos pocos MB en memoria.
// Los detalles no cambian (salvo justificaciones recientes), así que se reutilizan entre actualizaciones y periodos.
const detalleVotos=new Map(), OPCIONES=[], detalleAsistencia=new Map(), JUSTIFICACIONES=[];
const codigo=(tabla,s)=>{let i=tabla.indexOf(s);if(i<0)i=tabla.push(s)-1;return i;};
function buscar(pares,id){for(let i=0;i<pares.length;i+=2)if(pares[i]===id)return pares[i+1];return -1;}
function pares(items,fn){const a=new Int32Array(items.length*2);items.forEach((x,i)=>{const [id,c]=fn(x);a[i*2]=id;a[i*2+1]=c;});return a;}
async function votacionesPeriodo(p) {
  const fin=p.termino||'9999', anios=[];
  for(let a=Number(p.inicio.slice(0,4));a<=Math.min(Number(fin.slice(0,4)),new Date().getFullYear());a++) anios.push(a);
  const lista=(await Promise.all(anios.map(a=>camara('/WSLegislativo.asmx/retornarVotacionesXAnno?prmAnno='+a,p.actual?3600:7*86400).then(r=>list(r?.VotacionesColeccion?.Votacion))))).flat().filter(v=>String(v.Fecha)>=p.inicio&&String(v.Fecha)<=fin).sort(recientes);
  await enTandas(lista.filter(v=>!detalleVotos.has(v.Id)),v=>camara('/WSLegislativo.asmx/retornarVotacionDetalle?prmVotacionId='+v.Id,30*86400).then(r=>{detalleVotos.set(v.Id,pares(list(r?.Votacion?.Votos?.Voto),x=>[Number(x.Diputado?.Id),codigo(OPCIONES,text(x.OpcionVoto))]));},()=>{}));
  return lista;
}
// Código de asistencia: 0 asiste, 1 no asiste sin justificación, 2+ índice de la justificación en JUSTIFICACIONES.
async function asistenciaPeriodo(p) {
  const fin=p.termino||'9999', reciente=p.actual?new Date(Date.now()-14*864e5).toISOString().slice(0,10):'9999';
  const sesiones=(await Promise.all(p.legislaturas.map(l=>camara('/WSSala.asmx/retornarSesionesXLegislatura?prmLegislaturaId='+l,p.actual?3600:7*86400).then(r=>list(r?.SesionesSalaColeccion?.Sesion))))).flat().filter(s=>text(s.Estado)==='Celebrada'&&String(s.FechaInicio)>=p.inicio&&String(s.FechaInicio)<=fin).sort(recientes);
  // Las justificaciones pueden registrarse días después: las sesiones recientes se vuelven a consultar.
  await enTandas(sesiones.filter(s=>!detalleAsistencia.has(s.Id)||String(s.FechaInicio)>=reciente),s=>camara('/WSSala.asmx/retornarSesionAsistencia?prmSesionId='+s.Id,String(s.FechaInicio)>=reciente?3600:30*86400).then(r=>{detalleAsistencia.set(s.Id,pares(list(r?.SesionSala?.ListadoAsistencia?.Asistencia),x=>{const j=text(x.Justificacion?.Nombre);return [Number(x.Diputado?.Id),text(x.TipoAsistencia)==='Asiste'?0:j?codigo(JUSTIFICACIONES,j)+2:1];}));},()=>{}));
  return sesiones;
}
// El periodo actual se refresca cada hora; uno pasado no cambia, así que se reconstruye como mucho una vez al día.
const indices=new Map();
function indice(tipo,p,fn) {
  const k=tipo+':'+p.id, m=indices.get(k);
  if(m&&Date.now()-m.at<(p.actual?3600e3:864e5)) return m.promise;
  const promise=fn(p);
  indices.set(k,{promise,at:Date.now()});
  promise.catch(()=>indices.delete(k));
  return promise;
}
const resumenPeriodo=p=>({id:p.id,nombre:p.nombre,actual:p.actual});
export async function getAsistenciaDiputado(id,periodoId) {
  const p=await periodoLegislativo(periodoId), sesiones=await indice('asistencia',p,asistenciaPeriodo), resumen={asiste:0,justificada:0,injustificada:0}, registro=[];
  let sinDetalle=0;
  for(const s of sesiones){
    const a=detalleAsistencia.get(s.Id);
    if(!a){sinDetalle++;continue;}
    const c=buscar(a,id);
    if(c<0) continue;
    const estado=c===0?'asiste':c>1?'justificada':'injustificada';
    resumen[estado]++;
    registro.push({id:s.Id,numero:s.Numero,fecha:String(s.FechaInicio),tipo:text(s.Tipo),estado,justificacion:c>1?JUSTIFICACIONES[c-2]:''});
  }
  return {periodo:resumenPeriodo(p),resumen,sesiones:registro,total:sesiones.length,sinDetalle};
}
export async function getVotacionesDiputado(id,periodoId) {
  const p=await periodoLegislativo(periodoId), lista=await indice('votos',p,votacionesPeriodo), resumen={}, votaciones=[];
  let sinDetalle=0;
  for(const v of lista){
    const a=detalleVotos.get(v.Id);
    if(!a){sinDetalle++;continue;}
    const c=buscar(a,id);
    if(c<0) continue;
    const opcion=OPCIONES[c];
    resumen[opcion]=(resumen[opcion]||0)+1;
    votaciones.push({id:v.Id,fecha:String(v.Fecha),descripcion:text(v.Descripcion),resultado:text(v.Resultado),tipo:text(v.Tipo),quorum:text(v.Quorum),si:Number(v.TotalSi)||0,no:Number(v.TotalNo)||0,abst:Number(v.TotalAbstencion)||0,disp:Number(v.TotalDispensado)||0,opcion});
  }
  return {periodo:resumenPeriodo(p),resumen,votaciones,total:lista.length,sinDetalle};
}
// Resumen liviano de todos los diputados del periodo actual para las tarjetas: sale de los índices ya cargados.
export async function getResumenActividad() {
  const p=await periodoLegislativo(), [lista,sesiones]=await Promise.all([indice('votos',p,votacionesPeriodo),indice('asistencia',p,asistenciaPeriodo)]), r={};
  const fila=id=>r[id]??={sesiones:0,asiste:0,justificadas:0,votaciones:0,emitidas:0};
  for(const s of sesiones){const a=detalleAsistencia.get(s.Id)||[];for(let i=0;i<a.length;i+=2){const f=fila(a[i]);f.sesiones++;if(a[i+1]===0)f.asiste++;else if(a[i+1]>1)f.justificadas++;}}
  for(const v of lista){const a=detalleVotos.get(v.Id)||[];for(let i=0;i<a.length;i+=2){const f=fila(a[i]);f.votaciones++;if(OPCIONES[a[i+1]]!=='No Vota')f.emitidas++;}}
  // Las justificadas viajan aparte: una licencia médica larga no debe leerse como ausentismo en la tarjeta.
  return Object.fromEntries(Object.entries(r).map(([id,f])=>[id,{asistencia:f.sesiones?Math.round(f.asiste*100/f.sesiones):null,participacion:f.votaciones?Math.round(f.emitidas*100/f.votaciones):null,sesiones:f.sesiones,justificadas:f.justificadas}]));
}
export async function getOverview() {
  periodoLegislativo().then(p=>{indice('votos',p,votacionesPeriodo).catch(()=>{});indice('asistencia',p,asistenciaPeriodo).catch(()=>{});},()=>{});
  const results = await Promise.allSettled([query('getDiputados_Vigentes'),getComisiones(),query('getPeriodoLegislativoActual'),getPartidos()]);
  const [d,c,p,partidos] = results.map(r=>r.status==='fulfilled'?r.value:null);
  const diputados=list(d?.Diputados?.Diputado).map(d=>({id:d.DIPID,nombreCompleto:name(d),partido:partidos?.get(Number(d.DIPID))||'No informado',distrito:DISTRITOS.get(Number(d.DIPID))??null,sexo:text(d.Sexo),nacimiento:d.Fecha_Nacimiento||null,correo:''})).sort((a,b)=>a.nombreCompleto.localeCompare(b.nombreCompleto,'es'));
  const vigentes=new Set(diputados.map(d=>Number(d.id)));
  return {
    diputados,
    comisiones:list(c).map(c=>({...c,presidente:vigentes.has(c.presidente?.id)?c.presidente.nombre:'',integrantes:c.integrantes.filter(i=>vigentes.has(i.id))})),
    periodo:p?.PeriodoLegislativo?.Nombre||null,errors:results.slice(0,2).map((r,i)=>r.status==='rejected'?['diputados','comisiones'][i]:null).filter(Boolean),updatedAt:new Date().toISOString()
  };
}
export async function getProject(boletin) {
  const url='https://tramitacion.senado.cl/wspublico/tramitacion.php?boletin='+boletin.split('-')[0];
  const response=await fetch(url,{signal:AbortSignal.timeout(15000),next:{revalidate:300}});
  if(!response.ok) throw new Error('Senado no disponible');
  const parsed=new XMLParser().parse(await response.text());
  const project=list(parsed?.proyectos?.proyecto)[0];
  return project?.descripcion?.titulo?{...project.descripcion,tramites:list(project.tramitacion?.tramite).reverse(),source:url}:null;
}
