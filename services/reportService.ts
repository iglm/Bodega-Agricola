
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppState, LaborLog, HarvestLog, Movement, InventoryItem, Unit, Category, CostCenter, Personnel, Activity, PhenologyLog, PestLog, Machine, Asset, MaintenanceLog, RainLog, FinanceLog, SoilAnalysis, PPELog, WasteLog, AgendaEvent, CostClassification, Warehouse, PlannedLabor, Supplier, BudgetPlan, BudgetItem } from '../types';
import { formatCurrency, generateId, convertToBase, getBaseUnitType, processInventoryMovement } from './inventoryService';

const BRAND_COLORS = {
    primary: [5, 150, 105] as [number, number, number], 
    slate: [15, 23, 42] as [number, number, number],   
    amber: [245, 158, 11] as [number, number, number], 
    red: [220, 38, 38] as [number, number, number],    
    indigo: [79, 70, 229] as [number, number, number], 
    purple: [147, 51, 234] as [number, number, number], 
};

const AUTHOR = "Lucas Mateo Tabares Franco";

const addHeader = (doc: jsPDF, title: string, subtitle: string, warehouse: string, color = BRAND_COLORS.primary): number => {
    doc.setFillColor(...color);
    doc.rect(0, 0, 210, 40, 'F'); 
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text(title.toUpperCase(), 105, 20, { align: 'center' });
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(`${subtitle} | Hacienda: ${warehouse}`, 105, 28, { align: 'center' });
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Software diseñado por: ${AUTHOR}`, 105, 35, { align: 'center' });
    return 50;
};

const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`DATOSFINCA VIVA - PROPIEDAD DE: ${AUTHOR} | Pág ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }
};

export const generateExcel = (data: AppState): void => {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().split('T')[0];
    
    const wsInv = XLSX.utils.json_to_sheet(data.inventory.map(i => ({
        'Insumo': i.name, 'Categoría': i.category, 'Stock': i.currentQuantity, 'Unidad': i.baseUnit, 'Costo Prom.': i.averageCost, 'Valorización': i.currentQuantity * i.averageCost
    })));
    XLSX.utils.book_append_sheet(wb, wsInv, "Stock_Actual");

    const wsMov = XLSX.utils.json_to_sheet(data.movements.map(m => ({
        'Fecha': m.date.split('T')[0], 'Tipo': m.type, 'Insumo': m.itemName, 'Cantidad': m.quantity, 'Unidad': m.unit, 'Costo Total': m.calculatedCost, 'Lote': m.costCenterName || 'N/A'
    })));
    XLSX.utils.book_append_sheet(wb, wsMov, "Kardex_7_Años");

    const wsHarvest = XLSX.utils.json_to_sheet(data.harvests.map(h => ({
        'Fecha': h.date, 'Lote': h.costCenterName, 'Producto': h.cropName, 'Cantidad': h.quantity, 'Unidad': h.unit, 'Venta Total': h.totalValue
    })));
    XLSX.utils.book_append_sheet(wb, wsHarvest, "Ventas_Historicas");

    XLSX.writeFile(wb, `HACIENDA_7_ANOS_FULL_${dateStr}.xlsx`);
};

export const generateGlobalReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Informe Gerencial 7 Años", "Balance de Ciclo Cafetero Completo", activeW?.name || "Sin Sede", BRAND_COLORS.slate);
    autoTable(doc, {
        startY: y,
        head: [['Indicador de Ciclo', 'Valor Acumulado (7 Años)']],
        body: [
            ['(+) Ingresos Brutos (Excelso + Pasilla)', formatCurrency(data.harvests.reduce((a,b)=>a+b.totalValue, 0))],
            ['(-) Inversión en Insumos (Bodega)', formatCurrency(data.movements.filter(m=>m.type==='OUT').reduce((a,b)=>a+b.calculatedCost, 0))],
            ['(-) Mano de Obra Estimada', formatCurrency(data.laborLogs.reduce((a,b)=>a+b.value, 0) * data.laborFactor)],
            ['(=) Utilidad Bruta de Ciclo', formatCurrency(data.harvests.reduce((a,b)=>a+b.totalValue, 0) - (data.movements.filter(m=>m.type==='OUT').reduce((a,b)=>a+b.calculatedCost, 0) + data.laborLogs.reduce((a,b)=>a+b.value, 0) * data.laborFactor))],
        ],
        theme: 'grid'
    });
    addFooter(doc);
    doc.save("Reporte_Ciclo_7Anos.pdf");
};

export const generatePDF = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Stock Bodega", "Inventario Actual", activeW?.name || "Sin Sede");
    autoTable(doc, { startY: y, head: [['Producto', 'Stock', 'Unidad', 'Costo Unit.', 'Total']], body: data.inventory.map(i => [i.name, i.currentQuantity, i.baseUnit, formatCurrency(i.averageCost), formatCurrency(i.currentQuantity * i.averageCost)]) });
    addFooter(doc);
    doc.save("Stock_Bodega.pdf");
};

export const generateLaborReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Libro de Nómina", "Historial Pagos", activeW?.name || "Sin Sede", BRAND_COLORS.amber);
    autoTable(doc, { startY: y, head: [['Fecha', 'Trabajador', 'Labor', 'Valor']], body: data.laborLogs.slice(-100).map(l => [l.date, l.personnelName, l.activityName, formatCurrency(l.value)]) });
    doc.save("Nomina.pdf");
};

export const generateHarvestReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Reporte Cosechas", "Ventas y Producción", activeW?.name || "Sin Sede", BRAND_COLORS.indigo);
    autoTable(doc, { startY: y, head: [['Fecha', 'Lote', 'Producto', 'Total']], body: data.harvests.slice(-60).map(h => [h.date, h.costCenterName, h.cropName, formatCurrency(h.totalValue)]) });
    doc.save("Cosechas.pdf");
};

export const generatePaymentReceipt = (name: string, logs: LaborLog[], warehouseName: string): void => {
    const doc = new jsPDF();
    addHeader(doc, "RECIBO PAGO", "Comprobante Nómina", warehouseName, BRAND_COLORS.amber);
    doc.save(`Recibo_${name}.pdf`);
};

export const generateFieldTemplates = (data: AppState): void => {
    const doc = new jsPDF();
    addHeader(doc, "FORMATO CAMPO", "Registro Diario", "GENERAL", BRAND_COLORS.amber);
    doc.save("Planillas_Fisicas.pdf");
};

export const generateAgronomicDossier = (data: AppState): void => {
    const doc = new jsPDF();
    addHeader(doc, "DOSSIER AGRONOMICO", "Clima y Sanidad", "GENERAL", BRAND_COLORS.indigo);
    doc.save("Dossier_Agronomico.pdf");
};

export const generateSafetyReport = (data: AppState): void => {
    const doc = new jsPDF();
    addHeader(doc, "AUDITORIA SST", "EPP y Residuos", "GENERAL", BRAND_COLORS.red);
    doc.save("Auditoria_SST.pdf");
};

export const generateSQLDump = (data: AppState): void => {
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Backup_7Anos_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
};

export const generateExecutiveReport = (data: AppState) => generateGlobalReport(data);
export const generateManualPDF = () => {};
export const generateFinancialReport = (data: AppState) => {};
export const generateBudgetReport = (data: AppState) => {};
export const generateSimulatorPDF = (data: any) => {};
export const generateSimulatorExcel = (data: any) => {};

// --- MOTOR DE SIMULACIÓN DE 7 AÑOS (RENOVACIÓN ANUAL 14.2% - CICLO COMPLETO) ---
export const getDemoData = (): AppState => {
    const warehouseId = generateId();
    const supplierId = generateId();
    
    // 1. DEFINICIÓN DE 7 LOTES (100 Ha / 7 = 14.2 Ha por lote para rotación anual)
    const lotSize = 14.28;
    const lotModels = [1, 2, 3, 4, 5, 6, 7].map(i => ({
        id: generateId(), 
        warehouseId, 
        name: `Lote ${i} (Etapa ${i})`, 
        area: lotSize, 
        stage: (i <= 2 ? 'Levante' : 'Produccion') as any,
        cropType: 'Café',
        startAge: i // Edad relativa al inicio de la simulación
    }));

    const workers = ["Alberto Páez", "Carlos Ruiz", "Dora Cano", "Wilson Tabares", "Héctor Gómez"].map(name => ({
        id: generateId(), warehouseId, name, role: 'Operario'
    }));

    const activityId = generateId();
    const activities = [
        { id: activityId, warehouseId, name: 'Mantenimiento General', costClassification: 'COFFEE' as CostClassification },
        { id: generateId(), warehouseId, name: 'Cosecha', costClassification: 'COFFEE' as CostClassification }
    ];

    const itemData = [
        { name: 'Urea 46%', cat: Category.FERTILIZANTE, unit: Unit.BULTO_50KG, price: 155000, base: 'g' },
        { name: 'DAP 18-46-0', cat: Category.FERTILIZANTE, unit: Unit.BULTO_50KG, price: 215000, base: 'g' },
        { name: 'Amistar Top', cat: Category.FUNGICIDA, unit: Unit.LITRO, price: 198000, base: 'ml' }
    ];

    const inventory = itemData.map(d => ({
        id: generateId(), warehouseId, name: d.name, category: d.cat, currentQuantity: 0,
        baseUnit: d.base as any, averageCost: 0, lastPurchasePrice: d.price, lastPurchaseUnit: d.unit, minStock: 500000
    }));

    const today = new Date();
    const startOfSimulation = new Date();
    startOfSimulation.setFullYear(today.getFullYear() - 7); 

    const demoState: AppState = {
        warehouses: [{ id: warehouseId, name: 'Hacienda Los Andes (100 Ha - 7 Años)', created: startOfSimulation.toISOString(), ownerId: 'demo' }],
        activeWarehouseId: warehouseId,
        inventory: inventory,
        movements: [],
        suppliers: [{ id: supplierId, warehouseId, name: 'Central de Insumos', phone: '3101234567' }],
        costCenters: lotModels.map(({startAge, ...rest}) => rest),
        personnel: workers,
        activities,
        laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], plannedLabors: [], budgets: [], bpaChecklist: {}, assets: [], laborFactor: 1.52
    };

    // --- MOTOR DE TIEMPO (PASO A PASO 7 AÑOS) ---
    const yieldCurve: Record<number, number> = { 1: 0, 2: 0, 3: 0.40, 4: 0.90, 5: 1.05, 6: 0.85, 7: 0.60 };
    let curr = new Date(startOfSimulation);

    while (curr <= today) {
        const dStr = curr.toISOString().split('T')[0];
        const month = curr.getMonth();
        const year = curr.getFullYear();

        // 1. COMPRAS TRIMESTRALES (ENTRADAS BODEGA)
        if (curr.getDate() === 1 && [0, 3, 6, 9].includes(month)) {
            inventory.forEach(item => {
                const qty = 80 + Math.random() * 40; 
                const cost = qty * item.lastPurchasePrice;
                demoState.movements.push({
                    id: generateId(), warehouseId, itemId: item.id, itemName: item.name, type: 'IN',
                    quantity: qty, unit: item.lastPurchaseUnit, calculatedCost: cost, date: dStr
                });
                const itm = demoState.inventory.find(i => i.id === item.id)!;
                const baseQty = convertToBase(qty, item.lastPurchaseUnit);
                itm.averageCost = ((itm.currentQuantity * itm.averageCost) + cost) / (itm.currentQuantity + baseQty || 1);
                itm.currentQuantity += baseQty;
            });
        }

        // 2. APLICACIONES MENSUALES (SALIDAS BODEGA VINCULADAS A LOTE)
        if (curr.getDate() === 15) {
            lotModels.forEach(lot => {
                const item = demoState.inventory[0];
                const qtyOut = 30000; // 30kg por lote al mes
                if (item.currentQuantity > qtyOut) {
                    demoState.movements.push({
                        id: generateId(), warehouseId, itemId: item.id, itemName: item.name, type: 'OUT',
                        quantity: qtyOut, unit: Unit.GRAMO, calculatedCost: qtyOut * item.averageCost, 
                        date: dStr, costCenterId: lot.id, costCenterName: lot.name
                    });
                    item.currentQuantity -= qtyOut;
                }
            });
        }

        // 3. COSECHAS SEMESTRALES (EXCELSO + PASILLA)
        if (curr.getDate() === 28 && [4, 10].includes(month)) {
            lotModels.forEach(lot => {
                const simYear = year - startOfSimulation.getFullYear() + 1;
                const currentAge = ((lot.startAge + simYear - 2) % 7) + 1;
                const factor = yieldCurve[currentAge] || 0;

                if (factor > 0) {
                    const qtyExcelso = (3800 * lot.area * factor) / 2; 
                    const priceExcelso = 2350000; // Precio competitivo para que Simulator sea > 0
                    const valExcelso = (qtyExcelso / 125) * priceExcelso;

                    demoState.harvests.push({
                        id: generateId(), warehouseId, date: dStr, costCenterId: lot.id, costCenterName: lot.name,
                        cropName: 'Café Pergamino Seco (Excelso)', quantity: qtyExcelso, unit: 'Kg', totalValue: valExcelso
                    });

                    // Pasilla técnica (6.8% masa)
                    const qtyPasilla = qtyExcelso * 0.068;
                    const valPasilla = (qtyPasilla / 125) * (priceExcelso * 0.22);
                    demoState.harvests.push({
                        id: generateId(), warehouseId, date: dStr, costCenterId: lot.id, costCenterName: lot.name,
                        cropName: 'Pasilla de Finca', quantity: qtyPasilla, unit: 'Kg', totalValue: valPasilla
                    });
                }
            });
        }

        // 4. JORNALES (VINCULADOS A LOTE)
        if (curr.getDay() !== 0) {
            const lot = lotModels[curr.getDate() % 7];
            workers.forEach(w => {
                demoState.laborLogs.push({
                    id: generateId(), warehouseId, date: dStr, personnelId: w.id, personnelName: w.name,
                    activityId, activityName: 'Labores de Ciclo',
                    costCenterId: lot.id, costCenterName: lot.name, value: 85000, paid: true
                });
            });
        }

        curr.setDate(curr.getDate() + 1);
    }

    // 5. POBLAR PRESUPUESTO 2025 Y 2026 (Para eliminar los ceros en 'Presupuesto')
    [2025, 2026].forEach(y => {
        lotModels.forEach(lot => {
            const bItems: BudgetItem[] = [
                { id: generateId(), type: 'LABOR', conceptId: activityId, conceptName: 'Mantenimiento', unitCost: 85000, quantityPerHa: 12, months: [1, 3, 5, 7, 9, 11] },
                { id: generateId(), type: 'SUPPLY', conceptId: inventory[0].id, conceptName: 'Fertilizante', unitCost: 155000, quantityPerHa: 8, months: [2, 8] }
            ];
            demoState.budgets.push({ id: generateId(), warehouseId, year: y, costCenterId: lot.id, items: bItems });
        });
    });

    return demoState;
};
