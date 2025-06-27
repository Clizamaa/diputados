import Image from 'next/image';
import { getDiputadosVigentes } from '@/lib/camara';
import DiputadosGrid from '@/components/DiputadosGrid';

export default async function Home() {
  const diputados = await getDiputadosVigentes();

  return (
    <div className="container mx-auto px-4 sm:px-8 py-8">
      <section className="text-center py-12">
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-gray-900 dark:text-white">
          Diputadas y Diputados de Chile
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-400">
          Explora la información actualizada de los representantes en la Cámara de Diputadas y Diputados.
        </p>
      </section>

      <section>
        {diputados && diputados.length > 0 ? (
          <DiputadosGrid diputados={diputados} />
        ) : (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-200">No se pudieron cargar los datos</h2>
            <p className="mt-2 text-gray-600 dark:text-gray-400">Inténtalo de nuevo más tarde. El servicio de la Cámara puede estar temporalmente no disponible.</p>
          </div>
        )}
      </section>
    </div>
  );
}
