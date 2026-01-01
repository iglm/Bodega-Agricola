
import { GoogleGenAI } from "@google/genai";
import { AppState } from "../types";
import { formatCurrency } from "./inventoryService";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeFincaData = async (data: AppState): Promise<string> => {
    try {
        // Preparamos un resumen compacto para el prompt (Token efficient)
        const inventoryValue = data.inventory.reduce((a, b) => a + (b.currentQuantity * b.averageCost), 0);
        const totalSales = data.harvests.reduce((a, b) => a + b.totalValue, 0);
        const totalExpenses = data.movements.filter(m => m.type === 'OUT').reduce((a, b) => a + b.calculatedCost, 0) + 
                             (data.laborLogs.reduce((a, b) => a + b.value, 0) * data.laborFactor);
        
        const context = `
            Resumen Financiero Finca:
            - Valor en Bodega: ${formatCurrency(inventoryValue)}
            - Ventas Totales: ${formatCurrency(totalSales)}
            - Gastos Totales (Insumos + Nómina): ${formatCurrency(totalExpenses)}
            - Margen Neto: ${formatCurrency(totalSales - totalExpenses)}
            - Número de Lotes: ${data.costCenters.length}
            - Cultivos: ${Array.from(new Set(data.costCenters.map(c => c.cropType))).join(', ')}
            - Labor Factor (Carga Social): ${data.laborFactor}
        `;

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Actúa como un experto Consultor Senior en Agronegocios y Finanzas. 
            Analiza los siguientes datos reales de una finca y genera un reporte estratégico de máximo 300 palabras.
            Divide tu respuesta en: 
            1. Salud Financiera (Breve). 
            2. Fugas de Capital Detectadas (Basado en gastos vs ventas). 
            3. Recomendación Maestra para el productor.
            Datos: ${context}`,
            config: {
                systemInstruction: "Eres Finca-AI, el consultor experto de la aplicación AgroBodega Pro, desarrollada por Lucas Mateo Tabares Franco. Hablas de forma profesional, clara y enfocada en aumentar la rentabilidad del agricultor."
            }
        });

        return response.text || "No se pudo generar el análisis en este momento.";
    } catch (error) {
        console.error("Gemini Error:", error);
        return "Error de conexión con el motor de inteligencia. Verifique su conexión a internet.";
    }
};
