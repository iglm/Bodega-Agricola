
import { GoogleGenAI, SchemaType } from "@google/genai";
import { AppState, InventoryItem, CostCenter, Personnel, Activity } from '../types';

// Initialize Gemini
// NOTE: In a real production app, calls should go through a backend proxy to hide the API KEY.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// --- IDEA B: ANALYST ---

export const getFarmAnalysis = async (data: AppState, query: string) => {
  try {
    // 1. Prepare Context (Summarize data to save tokens)
    const inventorySummary = data.inventory.map(i => `${i.name}: ${i.currentQuantity} ${i.baseUnit} ($${i.averageCost}/u)`).join(', ');
    const activeLotes = data.costCenters.map(c => `${c.name} (${c.cropType || 'Var'})`).join(', ');
    
    // Financial Snapshot (Last 30 days roughly)
    const totalLabor = data.laborLogs.reduce((acc, l) => acc + l.value, 0);
    const totalHarvest = data.harvests.reduce((acc, h) => acc + h.totalValue, 0);
    const totalInputs = data.movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);

    const prompt = `
      Actúa como un Ingeniero Agrónomo experto y Analista Financiero para la finca "AgroSuite".
      
      CONTEXTO DE DATOS:
      - Lotes Activos: ${activeLotes}
      - Inventario Resumido: ${inventorySummary}
      - Gasto Mano de Obra Histórico: $${totalLabor}
      - Gasto Insumos Histórico: $${totalInputs}
      - Ventas Cosecha Histórico: $${totalHarvest}
      
      PREGUNTA DEL USUARIO: "${query}"
      
      INSTRUCCIONES:
      - Responde de forma concisa, usando negritas para datos clave.
      - Si detectas pérdidas (Gastos > Ventas), da un consejo agronómico práctico.
      - No inventes datos que no estén en el contexto.
      - Usa formato Markdown.
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });

    return response.text;
  } catch (error) {
    console.error("AI Analysis Error:", error);
    return "Lo siento, no pude conectar con el servicio de inteligencia agronómica. Verifica tu conexión.";
  }
};

// --- IDEA C: NATURAL LANGUAGE COMMANDS ---

export interface ParsedCommand {
  action: 'ADD_LABOR' | 'ADD_MOVEMENT_IN' | 'ADD_MOVEMENT_OUT' | 'ADD_HARVEST' | 'UNKNOWN';
  data: any;
  confidence: string; // Explanatory text
}

export const parseFarmCommand = async (
  text: string, 
  catalogs: { items: string[], people: string[], lotes: string[], activities: string[] }
): Promise<ParsedCommand> => {
  try {
    const prompt = `
      Eres un asistente administrativo agrícola. Tu trabajo es interpretar comandos de voz/texto y convertirlos en JSON estructurado.
      
      CATÁLOGOS DISPONIBLES (Úsalos para "fuzzy matching"):
      - Items/Insumos: ${catalogs.items.join(', ')}
      - Personas: ${catalogs.people.join(', ')}
      - Lotes: ${catalogs.lotes.join(', ')}
      - Labores: ${catalogs.activities.join(', ')}

      COMANDO: "${text}"

      REGLAS:
      1. Identifica la intención: 
         - Gasto/Uso de insumo -> ADD_MOVEMENT_OUT
         - Compra de insumo -> ADD_MOVEMENT_IN
         - Jornal/Trabajo -> ADD_LABOR
         - Venta/Cosecha -> ADD_HARVEST
      2. Extrae cantidades y nombres. Trata de coincidir con los catálogos. Si no coincide exacto, usa el más parecido.
      3. Devuelve SOLO JSON válido.

      SCHEMA ESPERADO:
      {
        "action": "ADD_LABOR" | "ADD_MOVEMENT_OUT" | "...",
        "data": { ...campos específicos ... },
        "confidence": "Texto explicando qué entendiste"
      }
      
      Ejemplo Labor:
      Comando: "Ayer Juan Pérez hizo plateo en el lote 1 y le pagué 50 mil"
      JSON: { "action": "ADD_LABOR", "data": { "personName": "Juan Pérez", "activityName": "Plateo", "lotName": "Lote 1", "value": 50000 }, "confidence": "Registrando jornal de Juan..." }
      
      Ejemplo Salida:
      Comando: "Saqué dos bultos de urea para el lote nuevo"
      JSON: { "action": "ADD_MOVEMENT_OUT", "data": { "itemName": "Urea", "quantity": 2, "lotName": "Lote Nuevo" }, "confidence": "Registrando salida de 2 Urea..." }
    `;

    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const result = JSON.parse(response.text || '{}');
    return result as ParsedCommand;

  } catch (error) {
    console.error("AI Command Parsing Error:", error);
    return { action: 'UNKNOWN', data: {}, confidence: "Error procesando el comando." };
  }
};
