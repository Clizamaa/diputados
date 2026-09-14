'use client';
export default function Error({reset}){return <main className="loading"><h1>No pudimos cargar el explorador</h1><p>Vuelve a intentar la conexión.</p><button onClick={reset}>Reintentar</button></main>;}
