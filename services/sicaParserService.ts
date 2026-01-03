import * as pdfjsLib from 'pdfjs-dist';

// Configuración del Worker (Versión compatible instalada)
const pdfjs = (pdfjsLib as any).default || pdfjsLib;

if (typeof window !== 'undefined' && !pdfjs.GlobalWorkerOptions.workerSrc) {
    pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@5.4.530/build/pdf.worker.min.mjs`;
}

export interface SicaLot {
    id: string;
    area: number;
    plants: number;
    variety: string;
    density: number;
    age: number;
}

export interface SicaImportResult {
    meta: {
        farmName: string;
        farmCode: string;
        vereda: string;
        totalArea: number;
        coffeeArea: number;
    };
    lots: SicaLot[];
}

/**
 * Normaliza el texto crudo del PDF eliminando basura de formato y estandarizando números.
 */
const normalizeRawText = (text: string): string => {
    return text
        .replace(/"/g, '') // Elimina comillas dobles
        .replace(/\n/g, ' ') // Convierte saltos de línea en espacios para evitar cortes en valores
        .replace(/\s\s+/g, ' ') // Colapsa múltiples espacios
        .trim();
};

/**
 * Convierte strings de números formato ES-CO ("2,63" o "4.721") a Number estándar.
 */
const parseSicaNumber = (value: string | undefined): number => {
    if (!value) return 0;
    // Eliminamos puntos de miles y cambiamos coma decimal por punto
    const cleaned = value.replace(/\./g, '').replace(/,/g, '.');
    return parseFloat(cleaned) || 0;
};

/**
 * Calcula la edad en años (float) desde una fecha DD-MM-YYYY hasta hoy.
 */
const calculateLotAge = (dateString: string | undefined): number => {
    if (!dateString) return 0;
    try {
        const parts = dateString.match(/(\d{2})-(\d{2})-(\d{4})/);
        if (!parts) return 0;
        
        const day = parseInt(parts[1]);
        const month = parseInt(parts[2]) - 1;
        const year = parseInt(parts[3]);
        
        const birthDate = new Date(year, month, day);
        const today = new Date();
        
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        
        // Agregar decimales por meses transcurridos
        const monthsDiff = (today.getFullYear() - birthDate.getFullYear()) * 12 + (today.getMonth() - birthDate.getMonth());
        const totalYears = monthsDiff / 12;
        
        return parseFloat(totalYears.toFixed(1));
    } catch {
        return 0;
    }
};

export const parseSicaPdf = async (file: File): Promise<SicaImportResult> => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
        const pdf = await loadingTask.promise;
        
        let rawText = '';
        for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            rawText += textContent.items.map((item: any) => item.str).join(' ');
        }

        // 1. Validación de formato
        if (!rawText.includes("SISTEMA DE INFORMACION CAFETERA") && !rawText.includes("ASICA")) {
            throw new Error("El archivo no es un documento SICA válido de la Federación de Cafeteros.");
        }

        const cleanText = normalizeRawText(rawText);

        // 2. Extracción de Cabecera
        const meta = {
            farmCode: (cleanText.match(/Cod\. SICA:\s*(\d+)/i)?.[1] || '').trim(),
            farmName: (cleanText.match(/Finca:\s*([A-ZÁÉÍÓÚÑ0-9\s\.]+?)(?=\s+Tenencia|\s+Vereda|$)/i)?.[1] || '').trim(),
            vereda: (cleanText.match(/Vereda:\s*([A-ZÁÉÍÓÚÑ0-9\s]+?)(?=\s+Municipio|\s+Área|$)/i)?.[1] || '').trim(),
            totalArea: parseSicaNumber(cleanText.match(/Área total Finca \(ha\):\s*(\d+[\.,]\d+)/i)?.[1]),
            coffeeArea: parseSicaNumber(cleanText.match(/Área Café \(ha\):\s*(\d+[\.,]\d+)/i)?.[1]),
        };

        const lots: SicaLot[] = [];

        // 3. Extracción de Lotes (Tabla)
        // Buscamos el patrón: ID(3 digitos) + Area + Variedad + Densidad + Plantas + Fecha
        // El formato SICA suele ser posicional. Usamos un Regex de anclaje para la fila.
        const rowRegex = /\b(\d{3})\s+(\d+[\.,]\d+)\s+([A-ZÁÉÍÓÚÑ\s]+?)\s+(\d+[\.,]?\d*)\s+(\d+[\.,]?\d*)\s+(\d{2}-\d{2}-\d{4})\b/g;
        let match;

        while ((match = rowRegex.exec(cleanText)) !== null) {
            const id = match[1];
            const area = parseSicaNumber(match[2]);
            const variety = match[3].trim();
            const density = parseSicaNumber(match[4]);
            const plants = parseSicaNumber(match[5]);
            const dateStr = match[6];

            if (id && area > 0) {
                lots.push({
                    id,
                    area,
                    variety,
                    plants,
                    density,
                    age: calculateLotAge(dateStr)
                });
            }
        }

        return { meta, lots };

    } catch (error: any) {
        console.error("Error en SicaParser:", error);
        throw new Error(error.message || "Error desconocido procesando el PDF.");
    }
};