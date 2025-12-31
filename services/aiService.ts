
import { GoogleGenAI, Type } from "@google/genai";
import { AppState, Unit } from '../types';

// Ensure API_KEY is loaded from process.env
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export interface ParsedCommand {
  action: 'INVENTORY_IN' | 'INVENTORY_OUT' | 'LABOR' | 'HARVEST' | 'UNKNOWN';
  confidence: 'Alta' | 'Media' | 'Baja';
  explanation: string; // A natural language explanation of the parsed command
  data: {
    itemName?: string;
    quantity?: number;
    unit?: Unit;
    unitPrice?: number;
    invoiceNumber?: string;
    personName?: string;
    loteName?: string;
    activityName?: string;
    value?: number; // for labor log
    cropName?: string;
    totalValue?: number; // for harvest log
  };
}

/**
 * Provides a general analysis or answer based on farm data and a user prompt.
 */
export async function getFarmAnalysis(data: AppState, prompt: string): Promise<string> {
  // Create a simplified representation of the AppState for the AI to understand
  const relevantData = {
    activeWarehouse: data.warehouses.find(w => w.id === data.activeWarehouseId),
    inventorySummary: data.inventory.map(item => ({
      name: item.name,
      category: item.category,
      currentQuantity: item.currentQuantity,
      baseUnit: item.baseUnit,
      averageCost: item.averageCost,
    })),
    laborLogsSummary: data.laborLogs.slice(0, 5).map(log => ({ // last 5 logs
      personnelName: log.personnelName,
      activityName: log.activityName,
      costCenterName: log.costCenterName,
      value: log.value,
      paid: log.paid,
    })),
    harvestsSummary: data.harvests.slice(0, 5).map(h => ({ // last 5 harvests
      cropName: h.cropName,
      quantity: h.quantity,
      unit: h.unit,
      totalValue: h.totalValue,
    })),
    costCentersSummary: data.costCenters.map(cc => ({
      name: cc.name,
      area: cc.area,
      cropType: cc.cropType,
    }))
  };

  const contextPrompt = `Eres un consultor agrícola experto, amigable y servicial. Responde a las preguntas del usuario basándote en la siguiente información de la finca y en tus conocimientos generales. No inventes datos que no estén presentes o que no puedas inferir lógicamente. Proporciona análisis claros y accionables.\n\nDatos de la Finca: ${JSON.stringify(relevantData, null, 2)}\n\nPregunta del Usuario: ${prompt}`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: contextPrompt,
    config: { thinkingConfig: { thinkingBudget: 0 } }, // Prioritize speed for chat
  });

  return response.text || "No pude generar una respuesta. Inténtalo de nuevo.";
}

/**
 * Parses a natural language command into a structured ParsedCommand object.
 */
export async function parseFarmCommand(text: string, catalogs: { items: string[], people: string[], lotes: string[], activities: string[] }): Promise<ParsedCommand> {
  const prompt = `Analiza el siguiente comando en lenguaje natural y extráele la información para una operación agrícola.
  Las categorías de operaciones son: INVENTORY_IN (entrada de insumos), INVENTORY_OUT (salida/aplicación de insumos), LABOR (registro de jornal), HARVEST (registro de cosecha).
  Si la operación no coincide con ninguna, usa UNKNOWN.

  Catálogos disponibles para referenciar (usa el nombre más cercano):
  - Insumos (items): ${catalogs.items.join(', ')}
  - Personal (people): ${catalogs.people.join(', ')}
  - Lotes (lotes): ${catalogs.lotes.join(', ')}
  - Actividades (activities): ${catalogs.activities.join(', ')}

  Ejemplos de unidades para IN/OUT: 'Kilo', 'Bulto 50kg', 'Litro', 'Mililitro', 'Gramo', 'Unidad'.
  Ejemplos de unidades para HARVEST: 'Kg', 'Bulto', 'Caja', 'Unidad'.

  Considera que 'valor' o 'costo' para LABOR se refiere al 'value' del jornal.
  Considera que 'precio' para INVENTORY_IN se refiere al 'unitPrice' de la compra por la unidad especificada.

  El JSON de salida debe tener la siguiente estructura y tipos:
  \`\`\`json
  interface ParsedCommand {
    action: 'INVENTORY_IN' | 'INVENTORY_OUT' | 'LABOR' | 'HARVEST' | 'UNKNOWN';
    confidence: 'Alta' | 'Media' | 'Baja';
    explanation: string;
    data: {
      itemName?: string;
      quantity?: number;
      unit?: string; // Should be one of the Unit enum values or harvest units
      unitPrice?: number;
      invoiceNumber?: string;
      personName?: string;
      loteName?: string;
      activityName?: string;
      value?: number;
      cropName?: string;
      totalValue?: number;
    };
  }
  \`\`\`

  Comando del usuario: "${text}"`;

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview',
    contents: prompt,
    config: {
      responseMimeType: "application/json",
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
              unitPrice: { type: Type.NUMBER },
              invoiceNumber: { type: Type.STRING },
              personName: { type: Type.STRING },
              loteName: { type: Type.STRING },
              activityName: { type: Type.STRING },
              value: { type: Type.NUMBER },
              cropName: { type: Type.STRING },
              totalValue: { type: Type.NUMBER },
            },
            // propertyOrdering: should define order if desired, but not strictly required for parsing
          },
        },
        required: ["action", "confidence", "explanation", "data"],
      },
    },
  });

  try {
    const jsonStr = response.text.trim();
    const parsed = JSON.parse(jsonStr) as ParsedCommand;
    return parsed;
  } catch (e) {
    console.error("Error parsing AI command response:", e);
    return {
      action: 'UNKNOWN',
      confidence: 'Baja',
      explanation: 'No pude entender el comando. Inténtalo de nuevo con más claridad.',
      data: {},
    };
  }
}

/**
 * Analyzes a general image with an optional text prompt.
 */
export async function analyzeFarmImage(base64Image: string, mimeType: string, prompt?: string): Promise<string> {
  const contents = [
    {
      inlineData: {
        mimeType: mimeType,
        data: base64Image,
      },
    },
    {
      text: prompt || "Describe esta imagen y su relevancia para una finca agrícola."
    }
  ];

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image', // General image model
    contents: { parts: contents },
    config: { thinkingConfig: { thinkingBudget: 0 } },
  });

  return response.text || "No pude analizar la imagen. Inténtalo de nuevo.";
}

/**
 * Processes an invoice image using OCR and extracts structured data for inventory.
 */
export async function processInvoiceVision(imgBase64: string, mime: string): Promise<ParsedCommand> {
  const prompt = `Extrae la siguiente información de la factura en la imagen. Si no puedes encontrar un dato, déjalo como null o ausente.
  Necesito:
  - Nombre del item (itemName): El nombre del producto principal o más claro.
  - Cantidad (quantity): La cantidad numérica comprada.
  - Unidad (unit): La unidad de medida (ej: 'Bulto 50kg', 'Litro', 'Kilo', 'Unidad'). Usa la más aproximada.
  - Precio unitario (unitPrice): El precio pagado por la unidad de compra.
  - Número de factura (invoiceNumber): El número de referencia de la factura.

  El JSON de salida debe tener la siguiente estructura y tipos:
  \`\`\`json
  interface ParsedCommand {
    action: 'INVENTORY_IN';
    confidence: 'Alta' | 'Media' | 'Baja';
    explanation: string;
    data: {
      itemName?: string;
      quantity?: number;
      unit?: string; // Should be one of the Unit enum values
      unitPrice?: number;
      invoiceNumber?: string;
    };
  }
  \`\`\`
  Genera una breve explicación en 'explanation' sobre lo que se detectó.`;

  const contents = {
    parts: [
      { text: prompt },
      { inlineData: { mimeType: mime, data: imgBase64 } },
    ],
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3-flash-preview', // Or gemini-2.5-flash-image if preferred for vision tasks
    contents: contents,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          action: { type: Type.STRING, enum: ["INVENTORY_IN"] }, // Fixed action type to literal
          confidence: { type: Type.STRING, enum: ["Alta", "Media", "Baja"] },
          explanation: { type: Type.STRING },
          data: {
            type: Type.OBJECT,
            properties: {
              itemName: { type: Type.STRING },
              quantity: { type: Type.NUMBER },
              unit: { type: Type.STRING }, // Use string for now, conversion can happen later
              unitPrice: { type: Type.NUMBER },
              invoiceNumber: { type: Type.STRING },
            },
          },
        },
        required: ["action", "confidence", "explanation", "data"],
      },
    },
  });

  try {
    const jsonStr = response.text.trim();
    const parsed = JSON.parse(jsonStr) as ParsedCommand;
    // Ensure the action is INVENTORY_IN as expected for this function
    if (parsed.action !== 'INVENTORY_IN') {
        throw new Error('AI did not return an INVENTORY_IN action for invoice OCR.');
    }
    return parsed;
  } catch (e) {
    console.error("Error parsing AI invoice OCR response:", e);
    return {
      action: 'UNKNOWN',
      confidence: 'Baja',
      explanation: 'No pude extraer la información de la factura. Asegúrate de que la imagen sea clara y tenga texto visible.',
      data: {},
    };
  }
}
