
import { GoogleGenAI, Type } from "@google/genai";
import { AppState } from '../types';

// Initialize Gemini
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * ANALYST ENGINE
 * Uses Gemini to provide financial and agronomic insights based on farm data.
 */
export const getFarmAnalysis = async (data: AppState, query: string) => {
  try {
    const inventorySummary = data.inventory.map(i => `${i.name}: ${i.currentQuantity} ${i.baseUnit}`).join(', ');
    const activeLotes = data.costCenters.map(c => `${c.name} (${c.cropType || 'Var'}, ${c.area || 0}Ha, ${c.stage})`).join(', ');
    
    const totalLabor = data.laborLogs.reduce((acc, l) => acc + l.value, 0);
    const totalHarvest = data.harvests.reduce((acc, h) => acc + h.totalValue, 0);
    const totalInputs = data.movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
    const totalAdmin = data.financeLogs.filter(f => f.type === 'EXPENSE').reduce((acc, f) => acc + f.amount, 0);

    const systemInstruction = `Eres el Consultor Senior de AgroSuite 360. 
      Analiza los datos financieros y agronómicos proporcionados para dar respuestas estratégicas. 
      REGLAS:
      1. Sé profesional, directo y técnico.
      2. Usa Markdown (negritas para cifras importantes).
      3. Si detectas pérdidas (gastos > ingresos), sugiere reducir costos operativos o mejorar la eficiencia de recolección.
      4. No menciones que eres una IA. Eres el Ingeniero Agrónomo virtual.`;

    const prompt = `
      DATOS ACTUALES DE LA FINCA:
      - Lotes: ${activeLotes}
      - Inventario en Bodega: ${inventorySummary}
      - Costos de Mano de Obra: $${totalLabor}
      - Costos de Insumos Aplicados: $${totalInputs}
      - Gastos Administrativos: $${totalAdmin}
      - Ventas Totales: $${totalHarvest}
      
      PREGUNTA DEL PRODUCTOR: "${query}"
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        temperature: 0.7,
      }
    });

    return response.text || "Lo siento, no pude procesar el análisis. Intenta reformular la pregunta.";
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Error de comunicación con el consultor. Verifica tu conexión a internet.";
  }
};

/**
 * COMMAND PARSER ENGINE
 * Specialized in extracting entities from natural language to automate farm records.
 */
export interface ParsedCommand {
  action: 'ADD_LABOR' | 'ADD_MOVEMENT_IN' | 'ADD_MOVEMENT_OUT' | 'ADD_HARVEST' | 'UNKNOWN';
  data: {
    personName?: string;
    activityName?: string;
    lotName?: string;
    itemName?: string;
    quantity?: number;
    value?: number;
    unit?: string;
    cropName?: string;
    dateOffset?: number; // 0 for today, -1 for yesterday
  };
  confidence: string;
}

export const parseFarmCommand = async (
  text: string, 
  catalogs: { items: string[], people: string[], lotes: string[], activities: string[] }
): Promise<ParsedCommand> => {
  try {
    const systemInstruction = `Eres un asistente administrativo agrícola experto en extracción de entidades.
      Tu tarea es convertir frases de campo en registros estructurados JSON.
      
      ACCIONES DISPONIBLES:
      - ADD_LABOR: Para jornales o trabajos realizados.
      - ADD_MOVEMENT_IN: Para compras de insumos.
      - ADD_MOVEMENT_OUT: Para aplicaciones de insumos en lotes o máquinas.
      - ADD_HARVEST: Para ventas o recolección de cosecha.
      
      REGLAS DE EMPAREJAMIENTO:
      - Compara los nombres dichos por el usuario con los CATÁLOGOS proporcionados.
      - Si el usuario dice "ayer", pon dateOffset: -1.
      - Normaliza cantidades a números puros.`;

    const prompt = `
      TEXTO DEL USUARIO: "${text}"
      
      CATÁLOGOS EXISTENTES:
      - Insumos: ${catalogs.items.join(', ')}
      - Personal: ${catalogs.people.join(', ')}
      - Lotes: ${catalogs.lotes.join(', ')}
      - Labores: ${catalogs.activities.join(', ')}
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: {
              type: Type.STRING,
              description: 'Acción principal detectada',
            },
            data: {
              type: Type.OBJECT,
              properties: {
                personName: { type: Type.STRING, description: 'Nombre del trabajador' },
                activityName: { type: Type.STRING, description: 'Tipo de labor' },
                lotName: { type: Type.STRING, description: 'Lote o destino' },
                itemName: { type: Type.STRING, description: 'Producto químico o insumo' },
                quantity: { type: Type.NUMBER, description: 'Cantidad numérica' },
                value: { type: Type.NUMBER, description: 'Valor monetario o precio' },
                unit: { type: Type.STRING, description: 'Unidad (Kg, L, Bultos, etc)' },
                cropName: { type: Type.STRING, description: 'Producto cosechado' },
                dateOffset: { type: Type.INTEGER, description: 'Diferencia de días (0=hoy, -1=ayer)' }
              },
              required: [] // Allow optionality in data
            },
            confidence: {
              type: Type.STRING,
              description: 'Resumen humano de lo entendido (ej: "Registrando 2 bultos de Urea en Lote 1")'
            }
          },
          required: ['action', 'data', 'confidence']
        }
      }
    });

    const textOutput = response.text;
    if (!textOutput) throw new Error("Sin respuesta de la IA");
    
    return JSON.parse(textOutput) as ParsedCommand;

  } catch (error) {
    console.error("AI Command Parsing Error:", error);
    return { 
      action: 'UNKNOWN', 
      data: {}, 
      confidence: "No logré interpretar el comando. Por favor, intenta ser más específico." 
    };
  }
};
