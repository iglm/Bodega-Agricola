import * as pdfjsLib from 'pdfjs-dist';

// Configuración del Worker (Asegurando compatibilidad de versión 5.4.530)
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    // Usamos un CDN estable para la versión instalada en package.json
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;
}

export interface SicaLot {
    id: string;
    area: number;
    trees: number;
    variety: string;
    cropType: string;
    density: number;
    age: number;
    sicaDate?: string;
    associatedCrop?: string;
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
 * Calcula meses desde una fecha DD-MM-YYYY hasta hoy
 */
const calculateMonthsDiff = (dateStr: string): number => {
    if (!dateStr) return 0;
    try {
        const parts = dateStr.match(/(\d{2})[\/-](\d{2})[\/-](\d{4})/);
        if (!parts) return 0;
        const date = new Date(parseInt(parts[3]), parseInt(parts[2]) - 1, parseInt(parts[1]));
        const now = new Date();
        const diff = (now.getFullYear() - date.getFullYear()) * 12 + (now.getMonth() - date.getMonth());
        return diff > 0 ? diff : 0;
    } catch { return 0; }
};

export const parseSicaPdf = async (file: File): Promise<SicaImportResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let fullText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            // Unimos con un espacio para evitar pegar palabras
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += ' ' + pageText;
        }

        console.log("SICA FULL TEXT EXTRACTED:", fullText.substring(0, 500)); // Debug

        // --- EXTRACCIÓN METADATOS (Header) ---
        const meta = {
            farmName: (fullText.match(/Finca:\s*([A-ZÁÉÍÓÚÑ0-9\s\.]+?)(?=\s+Tenencia|\s+Vereda|$)/i)?.[1] || 'Finca SICA').trim(),
            farmerName: (fullText.match(/Caficultor[\.:]?\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s+Doc|\s+Cédula|$)/i)?.[1] || 'Productor').trim(),
            vereda: (fullText.match(/Vereda:\s*([A-ZÁÉÍÓÚÑ0-9\s]+?)(?=\s+Área|$)/i)?.[1] || '').trim(),
            municipality: (fullText.match(/Municipio:\s*([A-ZÁÉÍÓÚÑ\s]+?)(?=\s+Caficultor|$)/i)?.[1] || '').trim(),
            sicaCode: (fullText.match(/Cod\. SICA:\s*([0-9]+)/i)?.[1] || '').trim(),
        };

        const lots: SicaLot[] = [];

        // --- EXTRACCIÓN DE LOTES (Estrategia de Ancla) ---
        // Buscamos el patrón: ID (3 dígitos) seguido de AREA (número decimal pequeño)
        const anchorRegex = /\b(\d{3})\s+(?:[^\d]{0,20})?(\d{1,3}[\.,]\d{1,2})\b/g;
        let match;

        while ((match = anchorRegex.exec(fullText)) !== null) {
            const id = match[1];
            const areaStr = match[2];
            const area = parseFloat(areaStr.replace(',', '.'));
            
            // Tomamos un "Chunk" de texto de 600 caracteres a partir de este punto para buscar el resto de datos
            const chunk = fullText.substring(match.index, match.index + 600);
            
            // --- BÚSQUEDA EN EL CHUNK ---
            
            // 1. Variedad: SOLO buscamos variedades de café.
            // Excluimos explícitamente PLATANO/BANANO de esta búsqueda.
            const varietyMatch = chunk.match(/(CASTILLO|COLOMBIA|CATURRA|CENICAFE|TABI|BOURBON|TIPICA|MARAGOGIPE|OTRAS VARIEDADES|GEISHA|JAVA)/i);
            const variety = varietyMatch ? varietyMatch[1].trim().toUpperCase() : 'VARIEDAD DESC.';
            
            // 2. Fecha Labor (Para edad) - Formato DD-MM-YYYY
            const dateMatch = chunk.match(/(\d{2}-\d{2}-\d{4})/);
            const dateStr = dateMatch ? dateMatch[1] : '';

            // 3. Arboles y Densidad
            // Buscamos números grandes (>50) en el chunk que NO sean parte de la fecha
            const numbers = chunk.match(/\b(\d{1,3}[\.,]\d{3}|\d{3,})\b/g) || [];
            
            const cleanNums = numbers
                .map(n => parseInt(n.replace(/[\.,]/g, '')))
                .filter(n => {
                    // Filtro: Si el número parece un año reciente (2010-2030), lo ignoramos
                    if (n >= 1990 && n <= 2030) return false; 
                    return true;
                });

            let trees = 0;
            let density = 0;

            if (cleanNums.length >= 2) {
                // Heurística SICA: Usualmente el primer número es Densidad, el segundo es Árboles
                density = cleanNums[0];
                trees = cleanNums[1];
                
                // Sanity Check: Si densidad es menor que árboles en un lote pequeño (<1ha), quizás están invertidos
                // (La densidad suele ser ~5000, los árboles pueden ser pocos)
                if (area < 1 && density < trees) {
                    const temp = density; density = trees; trees = temp;
                }
            } else if (cleanNums.length === 1) {
                // Solo un número, asumimos que son árboles y calculamos densidad
                trees = cleanNums[0];
                density = Math.round(trees / (area || 1));
            }

            // 4. Asocio (Buscar PLATANO o BANANO en el chunk)
            // Buscamos palabras clave de asocio.
            let associated = undefined;
            if (chunk.match(/(PLATANO|BANANO|MAIZ|FRIJOL|NOGAL|GUAMO)/i)) {
                 const asocioMatch = chunk.match(/(PLATANO|BANANO|MAIZ|FRIJOL)/i);
                 if (asocioMatch) associated = asocioMatch[1].toUpperCase();
            }

            // Validar que no sea basura (Area > 0)
            if (area > 0) {
                lots.push({
                    id,
                    area,
                    trees,
                    variety,
                    cropType: 'Café', // REGLA DE ORO: SIEMPRE CAFÉ EN SICA
                    density,
                    age: calculateMonthsDiff(dateStr),
                    sicaDate: dateStr,
                    associatedCrop: associated
                });
            }
        }

        return { meta, lots };

    } catch (error) {
        console.error("Error SICA Parse:", error);
        throw error;
    }
};