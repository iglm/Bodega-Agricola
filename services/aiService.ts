
import { GoogleGenAI, Type } from "@google/genai";
import { AppState } from '../types';

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * ANALYST ENGINE
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
      Analiza los datos proporcionados con rigor financiero y agronómico.
      REGLAS:
      1. Sé profesional y técnico. 
      2. Usa Markdown para destacar cifras.
      3. Sugiere correcciones basadas en rentabilidad.`;

    const prompt = `DATOS ACTUALES:
      - Lotes: ${activeLotes}
      - Inventario: ${inventorySummary}
      - Costos Labor: $${totalLabor}
      - Costos Insumos: $${totalInputs}
      - Gastos Admin: $${totalAdmin}
      - Ventas Totales: $${totalHarvest}
      
      PREGUNTA DEL PRODUCTOR: "${query}"`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: { systemInstruction, temperature: 0.7 }
    });

    return response.text || "No pude procesar el análisis.";
  } catch (error) {
    return "Error de comunicación con el consultor AI.";
  }
};

/**
 * MULTIMODAL VISION ENGINE
 */
export const analyzeFarmImage = async (base64Image: string, mimeType: string, userPrompt?: string) => {
  try {
    const defaultPrompt = `
      Eres el Ojo Digital de AgroSuite 360. 
      - Si es una FACTURA/RECIBO: Extrae productos, cantidades y precios totales. Formatea como tabla.
      - Si es un CULTIVO/PLAGA: Identifica posibles problemas fitosanitarios y da una recomendación orgánica y una química.
      - Si es MAQUINARIA: Sugiere puntos de mantenimiento preventivo.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: {
        parts: [
          { inlineData: { data: base64Image.split(',')[1], mimeType } },
          { text: userPrompt || "Analiza esta imagen para un productor agrícola." }
        ]
      },
      config: {
        systemInstruction: defaultPrompt,
        temperature: 0.4 // Lower temperature for more factual analysis
      }
    });
    
    return response.text || "La IA no pudo interpretar la imagen claramente.";
  } catch (error) {
    console.error("Vision Error:", error);
    return "Error procesando la imagen. Asegúrate de que sea nítida y tenga buena luz.";
  }
};

/**
 * COMMAND PARSER
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
    dateOffset?: number;
  };
  confidence: string;
}

export const parseFarmCommand = async (
  text: string, 
  catalogs: { items: string[], people: string[], lotes: string[], activities: string[] }
): Promise<ParsedCommand> => {
  try {
    const systemInstruction = `Asistente administrativo agrícola. Extrae entidades JSON de frases de campo.`;
    const prompt = `TEXTO: "${text}". CATÁLOGOS: Insumos: ${catalogs.items.join(', ')}. Personal: ${catalogs.people.join(', ')}. Lotes: ${catalogs.lotes.join(', ')}. Labores: ${catalogs.activities.join(', ')}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            action: { type: Type.STRING, enum: ['ADD_LABOR', 'ADD_MOVEMENT_IN', 'ADD_MOVEMENT_OUT', 'ADD_HARVEST', 'UNKNOWN'] },
            data: {
              type: Type.OBJECT,
              properties: {
                personName: { type: Type.STRING },
                activityName: { type: Type.STRING },
                lotName: { type: Type.STRING },
                itemName: { type: Type.STRING },
                quantity: { type: Type.NUMBER },
                value: { type: Type.NUMBER },
                unit: { type: Type.STRING },
                cropName: { type: Type.STRING },
                dateOffset: { type: Type.INTEGER }
              }
            },
            confidence: { type: Type.STRING }
          },
          required: ['action', 'data', 'confidence']
        }
      }
    });

    return JSON.parse(response.text) as ParsedCommand;
  } catch (error) {
    return { action: 'UNKNOWN', data: {}, confidence: "Error de interpretación." };
  }
};
