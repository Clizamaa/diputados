import * as soap from 'soap';

// New, working WSDL endpoint
const WSDL_URL = 'https://opendata.camara.cl/camaradiputados/WServices/WSDiputado.asmx?WSDL';

export async function getDiputadosVigentes() {
  try {
    const client = await soap.createClientAsync(WSDL_URL);
    // The new method is 'retornarDiputadosAsync'
    const result = await client.retornarDiputadosAsync();

    // The data structure is different in this new service
    const diputados = result[0]?.retornarDiputadosResult?.Diputado;

    if (!diputados) {
      console.error('Could not find diputados in the API response:', result);
      return [];
    }

    // Map the new, richer data structure
    return diputados.map(diputado => {
      const militanciaActual = diputado.Militancias?.Militancia?.slice(-1)[0];
      const nombreCompleto = `${diputado.Nombre} ${diputado.ApellidoPaterno} ${diputado.ApellidoMaterno}`.trim().replace(/\s+/g, ' ');

      return {
        id: diputado.Id,
        nombreCompleto: nombreCompleto,
        partido: militanciaActual?.Partido?.Alias || 'Independiente',
        // Note: Region and Distrito are not available in this endpoint.
        // The photo URL pattern is a guess based on the previous one.
        fotoUrl: `https://www.camara.cl/img.aspx?prmID=GRCL${diputado.Id}`
      };
    });

  } catch (error) {
    console.error('Error fetching data from new SOAP API:', error);
    return [];
  }
}
