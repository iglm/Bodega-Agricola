
import { GoogleGenAI, Type } from "@google/genai";
import { AppState } from '../types';

export interface ParsedCommand {
  action: 'INVENTORY_IN' | 'INVENTORY_OUT' | 'LABOR' | 'HARVEST' | 'UNKNOWN';
  confidence: 'Alta' | 'Media' | 'Baja';
  data: any;
  explanation: string;
}

// Fix: Always initialize GoogleGenAI with a fresh instance using named parameters
const getAI = () => new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Fix: Implemented missing parseFarmCommand to handle dictation and logic parsing
 * for AIAssistant component.
 */
export const parseFarmCommand = async (prompt: string, catalogs: any): Promise<ParsedCommand> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Instrucción: "${prompt}". Contexto de catálogos: ${JSON.stringify(catalogs)}`,
    config: {
      responseMimeType: "application/json",
      systemInstruction: "Eres un intérprete de comandos para AgroSuite 360. Identifica la acción (INVENTORY_IN, INVENTORY_OUT, LABOR, HARVEST) y extrae los parámetros (itemName, quantity, personnelName, etc.). Usa los catálogos provistos para normalizar los nombres.",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          confidence: { type: Type.STRING },
          explanation: { type: Type.STRING },
          data: { type: Type.OBJECT }
        },
        required: ["action", "confidence", "explanation", "data"]
      }
    }
  });

  try {
    return JSON.parse(response.text || '{}') as ParsedCommand;
  } catch (e) {
    return { action: 'UNKNOWN', confidence: 'Baja', data: {}, explanation: "Error al interpretar el comando." };
  }
};

export const getFarmAnalysis = async (data: AppState, prompt: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: `Datos Actuales del ERP:\n- Lotes: ${data.costCenters.length}\n- Insumos: ${data.inventory.length}\n- Factor Laboral: ${data.laborFactor}\n\nConsulta del Usuario: ${prompt}`,
    config: { 
      systemInstruction: "Eres el Director Técnico de AgroSuite 360. Analiza los datos proporcionados para optimizar la rentabilidad por lote y el cumplimiento de BPA ICA. Tus respuestas deben ser cortas, técnicas y accionables." 
    }
  });
  return response.text;
};

export const analyzeFarmImage = async (base64: string, mimeType: string, prompt?: string) => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { 
        parts: [
            { inlineData: { data: base64.split(',')[1], mimeType: mimeType } },
            { text: prompt || "Analiza esta imagen agrícola. Si es una planta, busca plagas. Si es una factura, extrae valores." }
        ] 
    },
    config: {
        systemInstruction: "Eres un Ingeniero Agrónomo experto. Proporciona diagnósticos precisos basados en la imagen visual."
    }
  });
  return response.text;
};

export const processInvoiceVision = async (base64: string, mimeType: string): Promise<ParsedCommand> => {
  const ai = getAI();
  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: { 
        parts: [
            { inlineData: { data: base64.split(',')[1], mimeType: mimeType } },
            { text: "Extrae los datos de esta factura de agroquímicos." }
        ] 
    },
    config: {
      responseMimeType: "application/json",
      systemInstruction: "Analiza la factura y devuelve un JSON para cargar en AgroSuite 360. Debe incluir action='INVENTORY_IN', explanation, y data (itemName, quantity, unit, unitPrice).",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING },
          confidence: { type: Type.STRING },
          explanation: { type: Type.STRING },
          data: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING },
              unitPrice: { type: Type.NUMBER }
            }
          }
        },
        required: ["action", "explanation", "data"]
      }
    }
  });
  
  try {
    return JSON.parse(response.text || '{}') as ParsedCommand;
  } catch (e) {
    return { action: 'UNKNOWN', confidence: 'Baja', data: {}, explanation: "Error al procesar JSON de la IA." };
  }
};
