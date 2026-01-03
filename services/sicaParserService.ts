
import * as pdfjsLib from 'pdfjs-dist';

// Configuración del Worker para Vite/Navegador
// Se maneja la importación por defecto o nombrada para compatibilidad
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://esm.sh/pdfjs-dist@3.11.174/build/pdf.worker.min.js`;
}

export interface SicaLot {
    id: string;         // Nro de Lote
    name?: string;      // Generated name used in the app
    area: number;       // Hectáreas
    trees: number;      // Número de árboles
    variety: string;    // Variedad (Castillo, Colombia, etc)
    density: number;    // Árboles/Ha
    age: number;        // Edad en meses
    plantingDate?: string; // Fecha si disponible
}

export interface SicaImportResult {
    meta: {
        farmName: string;
        farmerName: string;
        vereda: string;
        municipality: string;
        sicaCode: string;
    };
    lots: SicaLot[];
}

/**
 * Normaliza números desde formatos string (ej: "1.200,50" -> 1200.50)
 */
const parseNumber = (str: string): number => {
    if (!str) return 0;
    // Eliminar puntos de miles si existen y hay una coma decimal después
    // Caso 1: 1.500 (mil quinientos) -> 1500
    // Caso 2: 1,50 (uno punto cincuenta) -> 1.5
    // Estrategia SICA usual: 1,50 para area, 2.500 para árboles
    
    let clean = str.trim();
    if (clean.includes(',') && clean.includes('.')) {
        // Formato mixto (ej: 1.200,50), asumimos . miles , decimal
        clean = clean.replace(/\./g, '').replace(',', '.');
    } else if (clean.includes(',')) {
        // Solo coma, asumimos decimal
        clean = clean.replace(',', '.');
    } else {
        // Solo punto, podría ser miles (2.500 arboles) o decimal (1.5 ha)
        // Contexto: Si es arboles (>500) es miles, si es area (<100) es decimal?
        // Simplificación: Asumir punto como miles si hay 3 digitos despues, o decimal si no.
        // Mejor enfoque: Remover todo no numérico excepto el último separador.
        // Dado que SICA suele usar coma para decimales en reportes PDF generados:
        // clean = clean; 
    }
    // Limpieza agresiva para PDF: 
    // Si parece coordenada o area pequeña: 1,50 -> 1.5
    // Si parece arboles: 2.500 -> 2500
    
    // Intento genérico seguro:
    return parseFloat(clean.replace(/\./g, '').replace(',', '.'));
};

export const parseSicaPdf = async (file: File): Promise<SicaImportResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';

        // Extracción de texto página por página
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            
            // Unir items con un espacio simple para mantener flujo de lectura
            const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
            
            fullText += pageText + '\n';
        }

        console.log("SICA RAW TEXT:", fullText.substring(0, 500)); // Debug

        // --- EXTRACCIÓN DE METADATOS (Header) ---
        const meta = {
            farmName: (fullText.match(/Finca:\s*([A-ZÁÉÍÓÚÑ0-9\s\.]+?)(?=\s+Vereda|\s+Municipio|\s+Caficultor|$)/i)?.[1] || 'Finca Desconocida').trim(),
            farmerName: (fullText.match(/Caficultor:\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s+Cédula|\s+Cod|$)/i)?.[1] || 'Productor').trim(),
            vereda: (fullText.match(/Vereda:\s*([A-ZÁÉÍÓÚÑ0-9\s]+?)(?=\s+Municipio|\s+Finca|$)/i)?.[1] || '').trim(),
            municipality: (fullText.match(/Municipio:\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s+Depto|$)/i)?.[1] || '').trim(),
            sicaCode: (fullText.match(/SICA:\s*([0-9\-]+)/i)?.[1] || '').trim(),
        };

        // --- EXTRACCIÓN DE LOTES (Tabla) ---
        const lots: SicaLot[] = [];

        // Regex para filas de la tabla.
        // Patrón esperado aproximado en una línea de texto extraído:
        // "1 1,50 3.500 CASTILLO 5.000 24"
        // Grupo 1: ID (1-3 digitos)
        // Grupo 2: Area (decimal con , o .)
        // Grupo 3: Arboles (entero con . o ,)
        // Grupo 4: Variedad (Texto)
        // Grupo 5: Densidad (entero)
        // Grupo 6: Edad (entero, opcional)
        
        const rowRegex = /(\d{1,3})\s+(\d+[\.,]\d{1,2})\s+(\d+[\.,]?\d*)\s+([A-ZÁÉÍÓÚÑ\s\(\)\-\.]+?)\s+(\d+[\.,]?\d*)\s+(\d+[\.,]?\d*)/gi;

        let match;
        while ((match = rowRegex.exec(fullText)) !== null) {
            const [_, idStr, areaStr, treesStr, varietyStr, densityStr, ageStr] = match;

            // Filtro de ruido: La variedad suele estar en mayúsculas y no contener palabras clave de cabecera
            if (varietyStr.includes("AREA") || varietyStr.includes("LOTE")) continue;

            const area = parseFloat(areaStr.replace(',', '.'));
            // Arboles suele venir como 3.500 o 3500. Quitamos puntos.
            const trees = parseInt(treesStr.replace(/[\.,]/g, ''));
            const density = parseInt(densityStr.replace(/[\.,]/g, ''));
            const age = parseInt(ageStr.replace(/[\.,]/g, ''));

            // Validación básica de integridad de datos agrícolas
            if (area > 0 && trees > 0) {
                lots.push({
                    id: idStr,
                    area,
                    trees,
                    variety: varietyStr.trim(),
                    density,
                    age,
                    name: `Lote ${idStr}` // Nombre por defecto
                });
            }
        }

        return { meta, lots };

    } catch (error) {
        console.error("Error parsing SICA PDF:", error);
        throw new Error("No se pudo procesar el archivo SICA. Verifique que sea un PDF válido y no esté protegido.");
    }
};
