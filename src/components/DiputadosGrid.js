'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

export default function DiputadosGrid({ diputados }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredDiputados, setFilteredDiputados] = useState(diputados);

  useEffect(() => {
    const lowercasedFilter = searchTerm.toLowerCase();
    const filteredData = diputados.filter((diputado) => {
      return (
        diputado.nombreCompleto.toLowerCase().includes(lowercasedFilter) ||
        diputado.partido.toLowerCase().includes(lowercasedFilter)
      );
    });
    setFilteredDiputados(filteredData);
  }, [searchTerm, diputados]);

  return (
    <div>
      <div className="mb-12 max-w-md mx-auto">
        <input
          type="text"
          placeholder="Buscar por nombre o partido..."
          className="w-full px-4 py-3 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-full shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {filteredDiputados && filteredDiputados.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredDiputados.map((diputado) => (
            <div key={diputado.id} className="group bg-white dark:bg-gray-800 rounded-lg shadow-md hover:shadow-xl transition-shadow duration-300 overflow-hidden">
              <div className="relative h-48 bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <Image
                  src={diputado.fotoUrl}
                  alt={`Foto de ${diputado.nombreCompleto}`}
                  layout="fill"
                  objectFit="contain"
                  className="transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              <div className="p-4">
                <h3 className="text-lg font-bold truncate">{diputado.nombreCompleto}</h3>
                <p className="text-gray-700 dark:text-gray-300 truncate">{diputado.partido}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-xl text-gray-600 dark:text-gray-400">No se encontraron diputados con ese criterio.</p>
        </div>
      )}
    </div>
  );
}
