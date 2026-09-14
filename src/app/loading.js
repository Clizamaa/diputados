export default function Loading(){return <main className="loading" aria-busy="true"><p>Consultando los datos del Congreso…</p>{[1,2,3].map(i=><div className="skeleton" key={i}/>)}</main>;}
