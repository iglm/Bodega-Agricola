
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style'; // Changed to xlsx-js-style for styling support
import { AppState, LaborLog, RainLog, HarvestLog, Movement, InventoryItem, Category, Unit, MaintenanceLog, FinanceLog } from '../types';
import { convertToBase, formatCurrency, formatBaseQuantity, getCostPerGramOrMl } from './inventoryService';

// --- SHARED CONFIG ---
const BRAND_COLORS = {
    dark: [6, 78, 59] as [number, number, number], // Emerald 900
    primary: [5, 150, 105] as [number, number, number], // Emerald 600
    slate: [15, 23, 42] as [number, number, number], // Slate 900
    light: [236, 253, 245] as [number, number, number], // Emerald 50
    amber: [245, 158, 11] as [number, number, number], // Amber 500 for Labor
    yellow: [234, 179, 8] as [number, number, number], // Yellow for Harvest
    orange: [249, 115, 22] as [number, number, number], // Orange for Machinery
    blue: [37, 99, 235] as [number, number, number], // Blue for Rain
    red: [220, 38, 38] as [number, number, number], // Red for Withdrawals
    purple: [147, 51, 234] as [number, number, number] // Purple for Admin
};

const AUTHOR_NAME = "Lucas Mateo Tabares Franco";
const CONTACT_EMAIL = "mateotabares7@gmail.com";

// --- EXTENSIVE DUMMY DATA GENERATOR (12-MONTH REAL COFFEE CYCLE WITH RENOVATION) ---
export const getCoffeeExampleData = (): AppState => {
    const id = "hacienda_real_demo";
    const warehouseId = id;
    
    // --- 1. CONFIGURATION (AGRONOMIC DATA) ---
    // Costs
    const JORNAL_VALUE = 140000;
    const PICKING_PRICE_PER_KG_CHERRY = 1200; 
    
    // Supplies Costs
    const FERTILIZER_PROD_PRICE = 130000; // 26-4-22 Production
    const FERTILIZER_RENOV_PRICE = 160000; // DAP/High Phosphorus for Renovation
    const HERBICIDE_PRICE = 30000;
    const INSECTICIDE_PRICE = 100000;
    
    // Sales Prices
    const COFFEE_PRICE_PER_CARGA = 2800000;
    const COFFEE_PRICE_PER_KG_CPS = COFFEE_PRICE_PER_CARGA / 125; 
    const CHERRY_TO_CPS_RATIO = 5; 
    
    // Areas (80/20 Rule)
    const HA_PRODUCTION = 4.0; // 80% Productive
    const HA_RENOVATION = 1.0; // 20% Investment (Zoca/Renovation) - ONLY EXPENSES
    
    // Doses
    const KG_FERT_PROD_YEAR = 1200; // kg/ha
    const KG_FERT_RENOV_YEAR = 400; // Less qty, different formula
    
    // 2. MASTER DATA
    const costCenters = [
        { id: "c1", warehouseId, name: "Lote 1 - La Esperanza (Producción)", area: HA_PRODUCTION, budget: 150000000, description: "Café Variedad Castillo - Edad 4 años" },
        { id: "c2", warehouseId, name: "Lote 2 - El Futuro (Renovación/Zoca)", area: HA_RENOVATION, budget: 25000000, description: "Zoca de 6 meses - Solo Inversión" },
        { id: "c3", warehouseId, name: "Infraestructura (Casa/Beneficio)", area: 0.5 }
    ];

    const personnel = [
        { id: "p1", warehouseId, name: "Lucas Tabares (Administrador)", role: "Administrador" },
        { id: "p2", warehouseId, name: "Maria Garcia (Alimentación)", role: "Cocina" },
        { id: "p3", warehouseId, name: "Jose Lopez (Contratista)", role: "Todero" },
        { id: "p4", warehouseId, name: "Cuadrilla Recolección #1", role: "Recolector" },
        { id: "p5", warehouseId, name: "Pedro Diaz (Guadañador)", role: "Todero" }
    ];

    const activities = [
        { id: "a1", warehouseId, name: "Recolección Café (Kg)" },
        { id: "a2", warehouseId, name: "Desyerba (Guadaña)" },
        { id: "a3", warehouseId, name: "Fertilización Edáfica" },
        { id: "a4", warehouseId, name: "Deschuponada / Poda" }, // Critical for Renovation
        { id: "a5", warehouseId, name: "Control Broca" },
        { id: "a6", warehouseId, name: "Administración" }
    ];

    const inventory: InventoryItem[] = [
        { id: "i1", warehouseId, name: "Fertilizante 26-4-22 (Producción)", category: Category.FERTILIZANTE, currentQuantity: 1500000, baseUnit: 'g', lastPurchasePrice: FERTILIZER_PROD_PRICE, lastPurchaseUnit: Unit.BULTO_50KG, averageCost: FERTILIZER_PROD_PRICE/50000 },
        { id: "i2", warehouseId, name: "DAP 18-46-0 (Renovación)", category: Category.FERTILIZANTE, currentQuantity: 200000, baseUnit: 'g', lastPurchasePrice: FERTILIZER_RENOV_PRICE, lastPurchaseUnit: Unit.BULTO_50KG, averageCost: FERTILIZER_RENOV_PRICE/50000 },
        { id: "i3", warehouseId, name: "Herbicida MataMaleza", category: Category.HERBICIDA, currentQuantity: 20000, baseUnit: 'ml', lastPurchasePrice: HERBICIDE_PRICE, lastPurchaseUnit: Unit.LITRO, averageCost: HERBICIDE_PRICE/1000 },
        { id: "i4", warehouseId, name: "Insecticida BrocaFin", category: Category.INSECTICIDA, currentQuantity: 1000, baseUnit: 'ml', lastPurchasePrice: INSECTICIDE_PRICE, lastPurchaseUnit: Unit.MILILITRO, averageCost: INSECTICIDE_PRICE/100 },
        { id: "i5", warehouseId, name: "Combustible (Gasolina)", category: Category.OTRO, currentQuantity: 15000, baseUnit: 'ml', lastPurchasePrice: 15000, lastPurchaseUnit: Unit.LITRO, averageCost: 15 }
    ];

    const machines = [
        { id: "m1", warehouseId, name: "Despulpadora Penagos" },
        { id: "m2", warehouseId, name: "Guadaña Stihl FS450" }
    ];

    // 3. SIMULATION LOOP (365 DAYS)
    const laborLogs: LaborLog[] = [];
    const rainLogs: RainLog[] = [];
    const harvests: HarvestLog[] = [];
    const movements: Movement[] = [];
    const maintenanceLogs: MaintenanceLog[] = [];
    const financeLogs: FinanceLog[] = [];

    const today = new Date();
    let currentMonthExpenses = 0;

    for (let i = 0; i <= 365; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - (365 - i)); 
        const dateStr = d.toISOString().split('T')[0];
        const month = d.getMonth(); 
        const day = d.getDate();
        const isSunday = d.getDay() === 0;

        let dailyExpense = 0;

        // --- A. RAIN ---
        if ([3, 4, 9, 10].includes(month) && Math.random() > 0.3) {
            rainLogs.push({ id: `rain_${i}`, warehouseId, date: dateStr, millimeters: Math.floor(Math.random() * 40) + 5 });
        }

        // --- B. LOT 1 (PRODUCTION) ACTIVITIES ---
        
        // Fertilization Lot 1 (Mar & Sep)
        if (day === 8 && (month === 2 || month === 8)) {
            const kgNeeded = (KG_FERT_PROD_YEAR / 2) * HA_PRODUCTION; 
            const bultos = kgNeeded / 50;
            const cost = bultos * FERTILIZER_PROD_PRICE;
            
            movements.push({
                id: `mov_fert_p_${i}`, warehouseId, date: dateStr, type: 'OUT',
                itemId: 'i1', itemName: "Fertilizante 26-4-22 (Producción)", quantity: bultos, unit: Unit.BULTO_50KG,
                calculatedCost: cost, costCenterId: "c1", costCenterName: "Lote 1 (Producción)", notes: `Abonada Semestral`
            });
            laborLogs.push({
                id: `l_fert_p_${i}`, warehouseId, date: dateStr, personnelId: "p3", personnelName: "Jose Lopez (Contratista)",
                activityId: "a3", activityName: "Fertilización Edáfica", costCenterId: "c1", costCenterName: "Lote 1 (Producción)",
                value: 1200000, notes: "Contrato Abonada Lote 1", paid: true
            });
            dailyExpense += (cost + 1200000);
        }

        // Harvest Lot 1 (Mitaca & Main)
        let harvestFactor = 0;
        if ([9, 10, 11].includes(month)) harvestFactor = 0.7 / 90; 
        else if ([3, 4].includes(month)) harvestFactor = 0.3 / 60; 

        if (harvestFactor > 0 && !isSunday && Math.random() > 0.2) {
            const annualYield = 1800 * HA_PRODUCTION; 
            const dailyKgCPS = (annualYield * harvestFactor) * (0.8 + Math.random() * 0.4);
            const dailyRevenue = dailyKgCPS * COFFEE_PRICE_PER_KG_CPS;
            
            const kgCherry = dailyKgCPS * CHERRY_TO_CPS_RATIO;
            const pickingCost = kgCherry * PICKING_PRICE_PER_KG_CHERRY;

            harvests.push({
                id: `h_${i}`, warehouseId, date: dateStr, costCenterId: "c1", costCenterName: "Lote 1 (Producción)",
                cropName: "Café Pergamino Seco", quantity: Math.round(dailyKgCPS), unit: "Kg",
                totalValue: Math.round(dailyRevenue), notes: "Recolección"
            });

            laborLogs.push({
                id: `l_pick_${i}`, warehouseId, date: dateStr, personnelId: "p4", personnelName: "Cuadrilla Recolección #1",
                activityId: "a1", activityName: "Recolección Café (Kg)", costCenterId: "c1", costCenterName: "Lote 1 (Producción)",
                value: Math.round(pickingCost), notes: `Pago ${Math.round(kgCherry)}kg Cereza`, paid: true
            });
            dailyExpense += pickingCost;
        }

        // --- C. LOT 2 (RENOVATION/ZOCA) ACTIVITIES ---
        // Note: NO HARVEST HERE. Only Expenses.

        // Fertilization Lot 2 (More frequent for growth? Let's say every 3 months)
        if (day === 15 && (month % 3 === 0)) {
            const kgNeeded = (KG_FERT_RENOV_YEAR / 4) * HA_RENOVATION; // Quarterly dose
            const bultos = Math.max(1, Math.round(kgNeeded / 50)); 
            const cost = bultos * FERTILIZER_RENOV_PRICE;

            movements.push({
                id: `mov_fert_r_${i}`, warehouseId, date: dateStr, type: 'OUT',
                itemId: 'i2', itemName: "DAP 18-46-0 (Renovación)", quantity: bultos, unit: Unit.BULTO_50KG,
                calculatedCost: cost, costCenterId: "c2", costCenterName: "Lote 2 (Renovación)", notes: `Abonada Crecimiento Zoca`
            });
            laborLogs.push({
                id: `l_fert_r_${i}`, warehouseId, date: dateStr, personnelId: "p3", personnelName: "Jose Lopez (Contratista)",
                activityId: "a3", activityName: "Fertilización Edáfica", costCenterId: "c2", costCenterName: "Lote 2 (Renovación)",
                value: 150000, notes: "Jornal abonada zoca", paid: true
            });
            dailyExpense += (cost + 150000);
        }

        // "Deschuponada" (Selecting shoots) - Critical for Zoca
        // Happens twice a year
        if (day === 20 && (month === 1 || month === 7)) {
            laborLogs.push({
                id: `l_desch_${i}`, warehouseId, date: dateStr, personnelId: "p5", personnelName: "Pedro Diaz (Guadañador)",
                activityId: "a4", activityName: "Deschuponada / Poda", costCenterId: "c2", costCenterName: "Lote 2 (Renovación)",
                value: 280000, notes: "Selección de chupones (2 jornales)", paid: true
            });
            dailyExpense += 280000;
        }

        // Weeding (Both Lots)
        if (day === 10 && (month % 2 === 0)) {
            // Lot 1 (Production)
            laborLogs.push({
                id: `l_weed_1_${i}`, warehouseId, date: dateStr, personnelId: "p5", personnelName: "Pedro Diaz",
                activityId: "a2", activityName: "Desyerba (Guadaña)", costCenterId: "c1", costCenterName: "Lote 1 (Producción)",
                value: 300000, paid: true
            });
            
            // Lot 2 (Renovation) - Needs more care, manual plateo usually
            laborLogs.push({
                id: `l_weed_2_${i}`, warehouseId, date: dateStr, personnelId: "p3", personnelName: "Jose Lopez",
                activityId: "a2", activityName: "Desyerba (Guadaña)", costCenterId: "c2", costCenterName: "Lote 2 (Renovación)",
                value: 140000, notes: "Plateo a mano zoca", paid: true
            });
            dailyExpense += 440000;
        }

        // --- TRACK EXPENSES & ADMIN ---
        currentMonthExpenses += dailyExpense;

        const tomorrow = new Date(d);
        tomorrow.setDate(d.getDate() + 1);
        if (tomorrow.getMonth() !== month || i === 365) {
            if (currentMonthExpenses > 0) {
                const adminCost = currentMonthExpenses * 0.10; 
                financeLogs.push({
                    id: `fin_admin_${month}`, warehouseId, date: dateStr, type: 'EXPENSE', category: 'Administracion',
                    amount: Math.round(adminCost), description: `Gastos Admin Mes ${month+1} (10%)`
                });
            }
            currentMonthExpenses = 0;
        }
    }

    return {
        warehouses: [{ id: warehouseId, name: "Hacienda El Cafetal (RENTA + ZOCA)", created: new Date().toISOString() }],
        activeWarehouseId: warehouseId,
        suppliers: [
            { id: "s1", warehouseId, name: "AgroInsumos del Centro" },
            { id: "s2", warehouseId, name: "Cooperativa de Caficultores" }
        ],
        costCenters,
        personnel,
        activities,
        inventory,
        machines,
        laborLogs,
        harvests,
        movements,
        maintenanceLogs,
        rainLogs,
        financeLogs,
        agenda: []
    };
};

// ... [Existing PDF Helper Functions] ...
const addHeader = (doc: jsPDF, title: string, subtitle: string, warehouseName: string, themeColor: [number, number, number] = BRAND_COLORS.dark) => {
    const currentDate = new Date();
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.rect(0, 0, 210, 35, 'F'); 
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("AgroSuite 360", 14, 15);
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255); 
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 24);
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 14, 30);
    doc.setFontSize(9);
    doc.text("Fecha Generación:", 140, 15);
    doc.setFont("helvetica", "bold");
    doc.text(currentDate.toLocaleDateString(), 196, 15, { align: 'right' });
    doc.setFont("helvetica", "normal");
    doc.text("Sede / Finca:", 140, 20);
    doc.setFont("helvetica", "bold");
    doc.text(warehouseName, 196, 20, { align: 'right' });
    return 40;
};

const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    for(let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        const pageHeight = doc.internal.pageSize.height;
        doc.setDrawColor(200);
        doc.setLineWidth(0.1);
        doc.line(14, pageHeight - 15, 196, pageHeight - 15);
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.setFont("helvetica", "normal");
        doc.text(`Desarrollado por ${AUTHOR_NAME} - ${CONTACT_EMAIL} - Derechos Reservados`, 14, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, 196, pageHeight - 10, { align: 'right' });
    }
};

// ... [Existing PDF Generator Functions remain unchanged] ...
export const generateFieldTemplates = (data: AppState, prefillData: boolean = false) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    const titlePrefix = prefillData ? "EJEMPLO DE LLENADO - " : "";

    let yPos = addHeader(doc, `${titlePrefix}PLANILLA DE NOMINA`, "Registro diario de actividades de campo", activeWarehouseName, BRAND_COLORS.amber);
    
    // Header for Personnel
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("TRABAJADORES ACTIVOS (Referencia para llenado):", 14, yPos);
    let x = 14; let y = yPos + 5;
    data.personnel.forEach((p, i) => {
        if(x > 180) { x = 14; y += 4; }
        doc.text(`• ${p.name}`, x, y);
        x += 45;
    });

    // Body Data (Prefilled or Empty)
    let bodyData = Array(20).fill(["", "", "", "", ""]);
    if (prefillData && data.laborLogs.length > 0) {
        // Take last 30 logs for the example to not overwhelm the PDF
        bodyData = data.laborLogs.slice(0, 40).map(l => [
            l.date,
            l.personnelName,
            l.activityName,
            l.costCenterName,
            formatCurrency(l.value)
        ]);
    }

    autoTable(doc, {
        startY: y + 5,
        head: [['FECHA', 'TRABAJADOR', 'LABOR REALIZADA', 'LOTE / SITIO', 'JORNALES (1, 0.5) o VALOR']],
        body: bodyData,
        theme: 'grid',
        styles: { fontSize: 8, minCellHeight: 8, valign: 'middle', lineColor: 200, fontStyle: prefillData ? 'italic' : 'normal', textColor: prefillData ? [80,80,80] : [0,0,0] },
        headStyles: { fillColor: BRAND_COLORS.amber, textColor: 255, fontStyle: 'bold' }
    });

    doc.addPage();
    yPos = addHeader(doc, `${titlePrefix}BITÁCORA DE BODEGA`, "Control de Salidas de Insumos y Fertilizantes", activeWarehouseName, BRAND_COLORS.red);
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("LOTES Y DESTINOS (Referencia):", 14, yPos);
    x = 14; y = yPos + 5;
    data.costCenters.forEach((c, i) => {
        if(x > 180) { x = 14; y += 4; }
        doc.text(`• ${c.name}`, x, y);
        x += 45;
    });

    let invBody = Array(20).fill(["", "", "", "", "", ""]);
    if (prefillData && data.movements.length > 0) {
        invBody = data.movements.slice(0, 30).map(m => [
            m.date,
            m.itemName,
            m.quantity,
            m.unit,
            m.costCenterName || m.machineName || 'General',
            'Mayordomo'
        ]);
    }

    autoTable(doc, {
        startY: y + 5,
        head: [['FECHA', 'PRODUCTO / INSUMO', 'CANTIDAD', 'UNIDAD (Kg/L)', 'DESTINO (Lote)', 'RESPONSABLE']],
        body: invBody,
        theme: 'grid',
        styles: { fontSize: 8, minCellHeight: 8, valign: 'middle', lineColor: 200, fontStyle: prefillData ? 'italic' : 'normal', textColor: prefillData ? [80,80,80] : [0,0,0] },
        headStyles: { fillColor: BRAND_COLORS.red, textColor: 255, fontStyle: 'bold' }
    });

    // Harvest Page
    doc.addPage();
    yPos = addHeader(doc, `${titlePrefix}REGISTRO DE PRODUCCIÓN`, "Control de Cosechas", activeWarehouseName, BRAND_COLORS.yellow);
    let harvBody = Array(20).fill(["", "", "", "", "", ""]);
    if (prefillData && data.harvests.length > 0) {
        harvBody = data.harvests.slice(0, 30).map(h => [
            h.date,
            h.costCenterName,
            h.cropName,
            `${h.quantity}`,
            formatCurrency(h.totalValue),
            h.notes
        ]);
    }
    autoTable(doc, {
        startY: yPos + 5,
        head: [['FECHA', 'LOTE / ORIGEN', 'CULTIVO', 'KG/UNIDAD', 'VALOR ESTIMADO', 'NOTAS']],
        body: harvBody,
        theme: 'grid',
        styles: { fontSize: 8, minCellHeight: 8, valign: 'middle', lineColor: 200, fontStyle: prefillData ? 'italic' : 'normal', textColor: prefillData ? [80,80,80] : [0,0,0] },
        headStyles: { fillColor: BRAND_COLORS.yellow, textColor: 255, fontStyle: 'bold' }
    });
    
    addFooter(doc);
    doc.save(`Plantillas_${prefillData ? 'EJEMPLO_' : ''}${activeWarehouseName.replace(/\s+/g, '_')}.pdf`);
};

// --- 2. PROFESSIONAL & SECURE EXCEL IMPORT TEMPLATE ---
export const generateExcelImportTemplate = (data: AppState, prefillData: boolean = false) => {
    const wb = XLSX.utils.book_new();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';

    // Helper to Create Styled Locked Header Row
    const createStyledHeader = (headers: string[], colorHex: string) => {
        return headers.map(h => ({
            v: h,
            t: 's',
            s: {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: colorHex } },
                alignment: { horizontal: "center", vertical: "center" },
                border: { top: {style:'thin'}, bottom: {style:'medium'}, right: {style:'thin'} },
                protection: { locked: true } // Header is LOCKED
            }
        }));
    };

    // Helper for Copyright Row (Locked)
    const createCopyrightRow = () => {
        return [{
            v: `PROPIEDAD INTELECTUAL DE ${AUTHOR_NAME.toUpperCase()} - NO MODIFICAR ESTRUCTURA`,
            t: 's',
            s: {
                font: { bold: true, color: { rgb: "991B1B" }, sz: 10 },
                fill: { fgColor: { rgb: "FEF3C7" } },
                alignment: { horizontal: "center" },
                protection: { locked: true }
            }
        }];
    };

    // Helper for Unlocked Data Cells
    const createUnlockedCell = (val: any) => ({
        v: val,
        t: typeof val === 'number' ? 'n' : 's',
        s: {
            protection: { locked: false } // User can edit this
        }
    });

    const createExampleRow = (values: any[]) => {
        return values.map(v => ({
            v: v,
            t: typeof v === 'number' ? 'n' : 's',
            s: {
                font: { italic: true, color: { rgb: "666666" } },
                fill: { fgColor: { rgb: "F3F4F6" } },
                protection: { locked: false } // Example can be overwritten
            }
        }));
    };

    // Function to apply sheet protection
    const protectSheet = (ws: any) => {
        ws['!protect'] = {
            password: "AgroSuiteSecure", // Prevent accidental structure changes
            selectLockedCells: false, // User cannot select locked headers
            selectUnlockedCells: true, // User CAN select data area
            formatCells: false,
            formatColumns: false,
            formatRows: false,
            insertColumns: false, // Critical: prevent breaking import logic
            insertRows: true, // Allow adding data rows
            deleteColumns: false,
            deleteRows: true,
            sort: true,
            autoFilter: true
        };
    };

    // --- SHEET 0: LEGAL COVER (PORTADA) ---
    const legalTitle = prefillData ? "AGROSUITE 360 - ARCHIVO DE EJEMPLO (NO IMPORTAR)" : "AGROSUITE 360 - HERRAMIENTA ADMINISTRATIVA OFICIAL";
    const legalColor = prefillData ? "EA580C" : "064E3B"; // Orange for Example, Green for Official

    const wsLegal = XLSX.utils.aoa_to_sheet([
        [{ v: legalTitle, s: { font: { bold: true, sz: 20, color: { rgb: legalColor } } } }],
        [""],
        [{ v: "INFORMACIÓN DE PROPIEDAD INTELECTUAL Y LEGAL", s: { font: { bold: true, sz: 14 } } }],
        [""],
        [{ v: "AUTOR Y DESARROLLADOR:", s: { font: { bold: true } } }, { v: AUTHOR_NAME }],
        [{ v: "CONTACTO DE SOPORTE:", s: { font: { bold: true } } }, { v: CONTACT_EMAIL }],
        [""],
        [{ v: prefillData ? "MODO EJEMPLO:" : "ADVERTENCIA LEGAL (LEY 23 DE 1982 / LEY 1273 DE 2009):", s: { font: { bold: true, color: { rgb: "991B1B" } } } }],
        [{ v: prefillData ? "Este archivo contiene datos ficticios masivos para servir como guía." : "Este archivo Excel es una extensión funcional del software AgroSuite 360." }],
        [{ v: "Su estructura lógica y diseño son propiedad intelectual exclusiva de Lucas Mateo Tabares Franco." }],
        [{ v: "Queda estrictamente prohibida su distribución, venta o modificación estructural sin autorización escrita." }],
        [""],
        [{ v: "INSTRUCCIONES PARA EL USUARIO:", s: { font: { bold: true } } }],
        [{ v: "1. Las celdas de encabezado están BLOQUEADAS para proteger la integridad de los datos." }],
        [{ v: "2. Ingrese su información únicamente en las celdas blancas debajo de los encabezados." }],
        [{ v: "3. No cambie el nombre de las pestañas." }]
    ]);
    wsLegal['!cols'] = [{ wch: 70 }, { wch: 40 }];
    // Lock everything on legal sheet
    wsLegal['!protect'] = { password: "legal", selectLockedCells: true, selectUnlockedCells: false }; 
    XLSX.utils.book_append_sheet(wb, wsLegal, "LICENCIA_USO");

    // B. REFERENCE SHEET
    const refHeader = createStyledHeader(["TRABAJADORES (Copiar)", "LOTES / DESTINOS (Copiar)", "PRODUCTOS / INSUMOS (Copiar)", "MAQUINARIA (Copiar)", "LABORES (Copiar)"], "4B5563"); 
    const maxRows = Math.max(data.personnel.length, data.costCenters.length, data.inventory.length, data.machines.length, data.activities.length);
    const refData: any[] = [createCopyrightRow(), refHeader];
    
    for(let i=0; i<maxRows; i++) {
        refData.push([
            { v: data.personnel[i]?.name || "", s: { fill: { fgColor: { rgb: "E5E7EB" } }, protection: {locked: true} } },
            { v: data.costCenters[i]?.name || "", s: { fill: { fgColor: { rgb: "E5E7EB" } }, protection: {locked: true} } },
            { v: data.inventory[i]?.name || "", s: { fill: { fgColor: { rgb: "E5E7EB" } }, protection: {locked: true} } },
            { v: data.machines[i]?.name || "", s: { fill: { fgColor: { rgb: "E5E7EB" } }, protection: {locked: true} } },
            { v: data.activities[i]?.name || "", s: { fill: { fgColor: { rgb: "E5E7EB" } }, protection: {locked: true} } }
        ]);
    }
    const wsRef = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(wsRef, refData, { origin: "A1" });
    wsRef['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 30 }, { wch: 30 }];
    if(!wsRef['!merges']) wsRef['!merges'] = [];
    wsRef['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
    wsRef['!protect'] = { password: "ref", selectLockedCells: true, selectUnlockedCells: false }; // Read only
    XLSX.utils.book_append_sheet(wb, wsRef, "MAESTROS_COPIAR_AQUI");

    // Helper: Map data to rows if prefill is true, otherwise return example row
    const getSheetData = (headers: any[], exampleRow: any[], dataArray: any[], mapper: (item: any) => any[]) => {
        const rows = [createCopyrightRow(), headers];
        if (prefillData && dataArray.length > 0) {
            dataArray.forEach(item => {
                const mapped = mapper(item);
                rows.push(mapped.map(val => createUnlockedCell(val)));
            });
        } else {
            rows.push(exampleRow);
        }
        return rows;
    };

    // C. JORNALES (LABOR)
    const laborHeaders = createStyledHeader(["Fecha (AAAA-MM-DD)", "Trabajador (Nombre Exacto)", "Labor (Nombre Exacto)", "Lote (Nombre Exacto)", "Valor ($)", "Notas"], "D97706");
    const laborEx = createExampleRow(["2024-05-01", "EJ: Juan Perez", "Guadaña", "Lote 1", 50000, "Dia completo - BORRAR ESTA FILA"]);
    
    const laborRows = getSheetData(laborHeaders, laborEx, data.laborLogs, (l) => [l.date, l.personnelName, l.activityName, l.costCenterName, l.value, l.notes]);
    
    const wsLabor = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(wsLabor, laborRows, { origin: "A1" });
    wsLabor['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 40 }];
    if(!wsLabor['!merges']) wsLabor['!merges'] = [];
    wsLabor['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
    protectSheet(wsLabor);
    XLSX.utils.book_append_sheet(wb, wsLabor, "Jornales_Nomina");

    // D. COSECHAS
    const harvestHeaders = createStyledHeader(["Fecha", "Lote (Origen)", "Cultivo (Producto)", "Cantidad", "Unidad (Kg/Arr)", "ValorTotal ($)", "Notas"], "CA8A04");
    const harvestEx = createExampleRow(["2024-05-01", "Lote 1", "Cafe", 100, "Kg", 500000, "Pasilla - BORRAR"]);
    
    const harvestRows = getSheetData(harvestHeaders, harvestEx, data.harvests, (h) => [h.date, h.costCenterName, h.cropName, h.quantity, h.unit, h.totalValue, h.notes]);

    const wsHarvest = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(wsHarvest, harvestRows, { origin: "A1" });
    wsHarvest['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 }];
    if(!wsHarvest['!merges']) wsHarvest['!merges'] = [];
    wsHarvest['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 6 } });
    protectSheet(wsHarvest);
    XLSX.utils.book_append_sheet(wb, wsHarvest, "Cosechas");

    // E. INVENTARIO
    const movHeaders = createStyledHeader(["Fecha", "Tipo (ENTRADA/SALIDA)", "Producto (Exacto)", "Cantidad", "Unidad", "Destino_Lote_o_Maquina", "Costo_Total ($)", "Notas"], "059669");
    const movEx = createExampleRow(["2024-05-01", "SALIDA", "Urea", 2, "Bulto 50kg", "Lote 1", 240000, "Abonada - BORRAR"]);
    
    const movRows = getSheetData(movHeaders, movEx, data.movements, (m) => [m.date, m.type === 'IN' ? 'ENTRADA' : 'SALIDA', m.itemName, m.quantity, m.unit, m.costCenterName || m.machineName || 'General', m.calculatedCost, m.notes]);

    const wsMov = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(wsMov, movRows, { origin: "A1" });
    wsMov['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 30 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }];
    if(!wsMov['!merges']) wsMov['!merges'] = [];
    wsMov['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 7 } });
    protectSheet(wsMov);
    XLSX.utils.book_append_sheet(wb, wsMov, "Inventario_Movimientos");

    // F. MAQUINARIA
    const machHeaders = createStyledHeader(["Fecha", "Maquina (Nombre)", "Tipo (Combustible/Repuesto)", "Costo ($)", "Descripcion", "Horas_Km"], "EA580C");
    const machEx = createExampleRow(["2024-05-01", "Tractor", "Combustible", 100000, "ACPM", 1500]);
    
    const machRows = getSheetData(machHeaders, machEx, data.maintenanceLogs, (m) => {
        const mName = data.machines.find(mac => mac.id === m.machineId)?.name || 'Maquina';
        return [m.date, mName, m.type, m.cost, m.description, m.usageAmount];
    });

    const wsMach = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(wsMach, machRows, { origin: "A1" });
    wsMach['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 10 }];
    if(!wsMach['!merges']) wsMach['!merges'] = [];
    wsMach['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
    protectSheet(wsMach);
    XLSX.utils.book_append_sheet(wb, wsMach, "Maquinaria");

    // G. LLUVIAS
    const rainHeaders = createStyledHeader(["Fecha", "Milimetros"], "2563EB");
    const rainEx = createExampleRow(["2024-05-01", 15]);
    
    const rainRows = getSheetData(rainHeaders, rainEx, data.rainLogs, (r) => [r.date, r.millimeters]);

    const wsRain = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(wsRain, rainRows, { origin: "A1" });
    wsRain['!cols'] = [{ wch: 15 }, { wch: 15 }];
    if(!wsRain['!merges']) wsRain['!merges'] = [];
    wsRain['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 1 } });
    protectSheet(wsRain);
    XLSX.utils.book_append_sheet(wb, wsRain, "Lluvias");

    // H. FINANZAS
    const finHeaders = createStyledHeader(["Fecha", "Tipo (INGRESO/GASTO)", "Categoria", "Monto ($)", "Descripcion"], "7C3AED");
    const finEx = createExampleRow(["2024-05-01", "GASTO", "Servicios", 150000, "Pago Luz"]);
    
    const finRows = getSheetData(finHeaders, finEx, data.financeLogs, (f) => [f.date, f.type, f.category, f.amount, f.description]);

    const wsFin = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(wsFin, finRows, { origin: "A1" });
    wsFin['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 40 }];
    if(!wsFin['!merges']) wsFin['!merges'] = [];
    wsFin['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } });
    protectSheet(wsFin);
    XLSX.utils.book_append_sheet(wb, wsFin, "Gastos_Admin");

    // Save File
    XLSX.writeFile(wb, `Plantilla_${prefillData ? 'EJEMPLO_' : ''}Carga_Masiva.xlsx`);
};

export const generatePDF = (data: AppState) => {
  const doc = new jsPDF();
  const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
  
  let y = addHeader(doc, "REPORTE DE INVENTARIO", "Estado actual de Bodega", activeWarehouseName);

  const inventoryData = data.inventory.map(item => {
    const unitType = item.baseUnit === 'unit' ? 'Und' : item.baseUnit === 'g' ? 'g/kg' : 'ml/L';
    const totalValue = item.currentQuantity * getCostPerGramOrMl(item);
    return [
      item.name,
      item.category,
      `${formatBaseQuantity(item.currentQuantity, item.baseUnit)}`,
      formatCurrency(totalValue)
    ];
  });

  autoTable(doc, {
    startY: y + 5,
    head: [['Producto', 'Categoría', 'Stock Actual', 'Valor Est.']],
    body: inventoryData,
    theme: 'striped',
    headStyles: { fillColor: BRAND_COLORS.primary }
  });

  const totalWarehouseValue = data.inventory.reduce((acc, item) => acc + (item.currentQuantity * getCostPerGramOrMl(item)), 0);
  
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(`Valor Total Bodega: ${formatCurrency(totalWarehouseValue)}`, 14, finalY);

  addFooter(doc);
  doc.save(`Inventario_${activeWarehouseName}.pdf`);
};

export const generateOrderPDF = (data: AppState) => {
  const doc = new jsPDF();
  const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
  
  const lowStockItems = data.inventory.filter(i => i.minStock && i.currentQuantity <= i.minStock);
  if (lowStockItems.length === 0) {
      alert("No hay productos con stock bajo para generar pedido.");
      return;
  }

  let y = addHeader(doc, "PEDIDO SUGERIDO", "Productos con Stock Bajo", activeWarehouseName);

  const orderData = lowStockItems.map(item => {
      const deficit = (item.minStock || 0) - item.currentQuantity;
      // Convert deficit back to purchase unit for easier ordering
      const purchaseUnitFactor = convertToBase(1, item.lastPurchaseUnit);
      const deficitInPurchaseUnit = deficit > 0 ? Math.ceil(deficit / purchaseUnitFactor) : 0;

      return [
          item.name,
          formatBaseQuantity(item.currentQuantity, item.baseUnit),
          formatBaseQuantity(item.minStock || 0, item.baseUnit),
          `${deficitInPurchaseUnit} ${item.lastPurchaseUnit}`
      ];
  });

  autoTable(doc, {
      startY: y + 5,
      head: [['Producto', 'Actual', 'Mínimo', 'A Pedir (Sugerido)']],
      body: orderData,
      theme: 'grid',
      headStyles: { fillColor: [220, 38, 38] } // Red for alert
  });

  addFooter(doc);
  doc.save(`Pedido_Sugerido_${activeWarehouseName}.pdf`);
};

export const generateGlobalReport = (data: AppState) => {
    // Similar to stats view but in PDF
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    addHeader(doc, "INFORME GERENCIAL UNIFICADO", "Resumen Financiero y Operativo", activeWarehouseName);
    
    doc.setFontSize(10);
    doc.text("Este reporte detallado está en desarrollo. Use los reportes individuales por ahora.", 14, 50);
    
    addFooter(doc);
    doc.save(`Informe_Gerencial_${activeWarehouseName}.pdf`);
};

export const generateExcel = (data: AppState) => {
  const wb = XLSX.utils.book_new();
  const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';

  // Inventory Sheet
  const wsInv = XLSX.utils.json_to_sheet(data.inventory.map(i => ({
      Nombre: i.name,
      Categoria: i.category,
      Stock_Base: i.currentQuantity,
      Unidad_Base: i.baseUnit,
      Costo_Promedio_Base: i.averageCost,
      Ultimo_Precio_Compra: i.lastPurchasePrice,
      Unidad_Compra: i.lastPurchaseUnit
  })));
  XLSX.utils.book_append_sheet(wb, wsInv, "Inventario");

  // Movements Sheet
  const wsMov = XLSX.utils.json_to_sheet(data.movements.map(m => ({
      Fecha: new Date(m.date).toLocaleDateString(),
      Tipo: m.type,
      Producto: m.itemName,
      Cantidad: m.quantity,
      Unidad: m.unit,
      Costo_Total: m.calculatedCost,
      Destino: m.costCenterName || m.machineName || 'Bodega',
      Notas: m.notes
  })));
  XLSX.utils.book_append_sheet(wb, wsMov, "Movimientos");

  // Labor Sheet
  const wsLab = XLSX.utils.json_to_sheet(data.laborLogs.map(l => ({
      Fecha: new Date(l.date).toLocaleDateString(),
      Trabajador: l.personnelName,
      Labor: l.activityName,
      Lote: l.costCenterName,
      Valor: l.value,
      Pagado: l.paid ? 'SI' : 'NO'
  })));
  XLSX.utils.book_append_sheet(wb, wsLab, "Mano_Obra");

  // Harvest Sheet
  const wsHar = XLSX.utils.json_to_sheet(data.harvests.map(h => ({
      Fecha: new Date(h.date).toLocaleDateString(),
      Lote: h.costCenterName,
      Cultivo: h.cropName,
      Cantidad: h.quantity,
      Unidad: h.unit,
      Valor_Venta: h.totalValue
  })));
  XLSX.utils.book_append_sheet(wb, wsHar, "Ventas_Cosecha");

  XLSX.writeFile(wb, `Reporte_Completo_${activeWarehouseName}.xlsx`);
};

export const generateLaborPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    let y = addHeader(doc, "REPORTE DE MANO DE OBRA", "Historial de Jornales y Pagos", activeWarehouseName, BRAND_COLORS.amber);

    const rows = data.laborLogs.map(l => [
        new Date(l.date).toLocaleDateString(),
        l.personnelName,
        l.activityName,
        l.costCenterName,
        formatCurrency(l.value),
        l.paid ? 'PAGADO' : 'PENDIENTE'
    ]);

    autoTable(doc, {
        startY: y + 5,
        head: [['Fecha', 'Trabajador', 'Labor', 'Lote', 'Valor', 'Estado']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.amber }
    });

    const total = data.laborLogs.reduce((acc, l) => acc + l.value, 0);
    const pending = data.laborLogs.filter(l => !l.paid).reduce((acc, l) => acc + l.value, 0);

    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Total Mano de Obra: ${formatCurrency(total)}`, 14, finalY);
    doc.text(`Total Pendiente Pago: ${formatCurrency(pending)}`, 14, finalY + 6);

    addFooter(doc);
    doc.save(`Mano_Obra_${activeWarehouseName}.pdf`);
};

export const generateLaborExcel = (data: AppState) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data.laborLogs.map(l => ({
        Fecha: l.date,
        Trabajador: l.personnelName,
        Labor: l.activityName,
        Lote: l.costCenterName,
        Valor: l.value,
        Notas: l.notes,
        Estado: l.paid ? 'PAGADO' : 'PENDIENTE'
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Jornales");
    XLSX.writeFile(wb, "Reporte_Jornales.xlsx");
};

export const generateHarvestPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    let y = addHeader(doc, "REPORTE DE COSECHAS", "Historial de Producción", activeWarehouseName, BRAND_COLORS.yellow);

    const rows = data.harvests.map(h => [
        new Date(h.date).toLocaleDateString(),
        h.costCenterName,
        h.cropName,
        `${h.quantity} ${h.unit}`,
        formatCurrency(h.totalValue)
    ]);

    autoTable(doc, {
        startY: y + 5,
        head: [['Fecha', 'Lote', 'Cultivo', 'Cantidad', 'Venta Total']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.yellow, textColor: [50, 50, 50] } // Dark text for yellow bg
    });

    const total = data.harvests.reduce((acc, h) => acc + h.totalValue, 0);
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.text(`Total Ingresos Cosecha: ${formatCurrency(total)}`, 14, finalY);

    addFooter(doc);
    doc.save(`Cosechas_${activeWarehouseName}.pdf`);
};

export const generateMachineryPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    let y = addHeader(doc, "REPORTE DE MAQUINARIA", "Gastos y Mantenimiento", activeWarehouseName, BRAND_COLORS.orange);

    const rows = data.maintenanceLogs.map(m => {
        const machineName = data.machines.find(mac => mac.id === m.machineId)?.name || 'Máquina Eliminada';
        return [
            new Date(m.date).toLocaleDateString(),
            machineName,
            m.type,
            m.description,
            formatCurrency(m.cost)
        ];
    });

    autoTable(doc, {
        startY: y + 5,
        head: [['Fecha', 'Máquina', 'Tipo', 'Detalle', 'Costo']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.orange }
    });

    addFooter(doc);
    doc.save(`Maquinaria_${activeWarehouseName}.pdf`);
};

export const generateRainPDF = (rainLogs: RainLog[], warehouseName: string) => {
    const doc = new jsPDF();
    let y = addHeader(doc, "REPORTE PLUVIOMÉTRICO", "Registro de Lluvias", warehouseName, BRAND_COLORS.blue);

    const rows = rainLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => [
        new Date(r.date).toLocaleDateString(),
        `${r.millimeters} mm`
    ]);

    autoTable(doc, {
        startY: y + 5,
        head: [['Fecha', 'Precipitación']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.blue }
    });

    const totalRain = rainLogs.reduce((acc, r) => acc + r.millimeters, 0);
    let finalY = (doc as any).lastAutoTable.finalY + 10;
    doc.text(`Total Lluvia Registrada: ${totalRain} mm`, 14, finalY);

    addFooter(doc);
    doc.save(`Lluvias_${warehouseName}.pdf`);
};

export const generateRainExcel = (rainLogs: RainLog[]) => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rainLogs.map(r => ({
        Fecha: r.date,
        Milimetros: r.millimeters
    })));
    XLSX.utils.book_append_sheet(wb, ws, "Lluvias");
    XLSX.writeFile(wb, "Reporte_Lluvias.xlsx");
};

export const generatePaymentReceipt = (workerName: string, logs: LaborLog[], warehouseName: string) => {
    const doc = new jsPDF();
    const total = logs.reduce((acc, l) => acc + l.value, 0);
    const date = new Date().toLocaleDateString();

    // Custom Receipt Header
    doc.setFillColor(5, 150, 105);
    doc.rect(0, 0, 210, 40, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.text("COMPROBANTE DE PAGO", 105, 20, { align: 'center' });
    doc.setFontSize(12);
    doc.text(warehouseName, 105, 30, { align: 'center' });

    doc.setTextColor(0, 0, 0);
    doc.setFontSize(12);
    doc.text(`Beneficiario: ${workerName}`, 14, 55);
    doc.text(`Fecha de Pago: ${date}`, 14, 62);
    doc.text(`Total Pagado: ${formatCurrency(total)}`, 14, 69);

    const rows = logs.map(l => [
        new Date(l.date).toLocaleDateString(),
        l.activityName,
        l.costCenterName,
        l.notes || '-',
        formatCurrency(l.value)
    ]);

    autoTable(doc, {
        startY: 80,
        head: [['Fecha', 'Labor', 'Lote', 'Detalle', 'Valor']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.primary },
        foot: [['', '', '', 'TOTAL', formatCurrency(total)]],
        footStyles: { fillColor: [240, 240, 240], textColor: 0, fontStyle: 'bold' }
    });

    // Signatures
    const finalY = (doc as any).lastAutoTable.finalY + 40;
    doc.line(20, finalY, 80, finalY);
    doc.text("Firma Quien Paga", 30, finalY + 5);

    doc.line(120, finalY, 180, finalY);
    doc.text("Firma Beneficiario", 130, finalY + 5);

    doc.setFontSize(8);
    doc.text(`Generado por AgroSuite 360 - ${AUTHOR_NAME}`, 105, 280, { align: 'center' });

    doc.save(`Recibo_Pago_${workerName}_${date}.pdf`);
};

export const generateManualPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date().toLocaleDateString();

    // Cover Page
    doc.setFillColor(6, 78, 59); // Emerald 900
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.text("AgroSuite 360", 105, 100, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(52, 211, 153); // Emerald 400
    doc.text("Manual Oficial de Usuario", 105, 115, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text(`Versión 4.0 - Generado el ${currentDate}`, 105, 130, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Desarrollado por Ing. ${AUTHOR_NAME}`, 105, 270, { align: 'center' });
    doc.text(`Contacto: ${CONTACT_EMAIL}`, 105, 275, { align: 'center' });

    // Page 2: Introduction
    doc.addPage();
    let y = addHeader(doc, "VISIÓN GENERAL", "Filosofía y Alcance", "Manual Usuario");
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Filosofía: Gerencia Total", 14, y + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const text1 = "AgroSuite 360 transforma la agricultura tradicional en una empresa agroindustrial basada en datos. A diferencia de un simple cuaderno, este sistema cruza información de Insumos, Mano de Obra, Maquinaria y Gastos Administrativos para revelar el costo real de producción por kilo.";
    const splitText1 = doc.splitTextToSize(text1, 180);
    doc.text(splitText1, 14, y + 16);
    
    const y2 = y + 16 + (splitText1.length * 5);

    // LEGAL SECTION
    doc.setFillColor(254, 226, 226); // Red 50
    doc.rect(14, y2 + 5, 180, 40, 'F');
    doc.setTextColor(185, 28, 28); // Red 700
    doc.setFont("helvetica", "bold");
    doc.text("AVISO LEGAL Y DERECHOS DE AUTOR", 20, y2 + 15);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const legalText = `Este software y su código fuente son propiedad intelectual exclusiva de ${AUTHOR_NAME}. Queda prohibida su copia, ingeniería inversa o distribución no autorizada. El uso indebido será sancionado conforme a la Ley 23 de 1982 y Ley 1273 de 2009 sobre Delitos Informáticos en Colombia.`;
    const splitLegal = doc.splitTextToSize(legalText, 160);
    doc.text(splitLegal, 20, y2 + 22);

    // Page 3: Modules
    doc.addPage();
    y = addHeader(doc, "MÓDULOS OPERATIVOS", "Guía de Operación", "Manual Usuario");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("1. Inventario Inteligente (CPP)", 14, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("El sistema utiliza el método de Costo Promedio Ponderado para estabilizar costos.", 14, y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("2. Nómina y Labores", 14, y + 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Registro de jornales y contratos asignados a Lotes específicos.", 14, y + 36);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("3. Gestión Técnica", 14, y + 50);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Control de Maquinaria, Mantenimientos y Pluviometría.", 14, y + 56);

    // Page 4: Finance
    doc.addPage();
    y = addHeader(doc, "FINANZAS Y COSTOS OCULTOS", "Control Administrativo", "Manual Usuario");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Gastos Administrativos", 14, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const text3 = "Impuestos, servicios públicos, gasolina de gerencia, etc. Estos costos se prorratean automáticamente entre los lotes productivos según su área (si se define).";
    const splitText3 = doc.splitTextToSize(text3, 180);
    doc.text(splitText3, 14, y + 16);

    // Page 5: Tips (New)
    doc.addPage();
    y = addHeader(doc, "TIPS DE EXPERTO", "Manejo de Inversión", "Manual Usuario");
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Manejo de Lotes Improductivos (Renovación/Zocas)", 14, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const textTip = "En toda finca agrícola (especialmente Café), una parte del área siempre está en renovación (Zoca o Siembra Nueva). Estos lotes generan gastos pero CERO ingresos.\n\nPara manejarlos en AgroSuite 360:\n1. Cree un 'Destino' separado llamado 'Lote Renovación'.\n2. Asigne todos los gastos de siembra, fertilizante de arraigo y desyerbas a este lote.\n3. En los Reportes, verá que este lote tiene pérdidas. ESTO ES CORRECTO. Le permitirá saber cuánto le cuesta levantar una hectárea hasta producción.";
    const splitTip = doc.splitTextToSize(textTip, 180);
    doc.text(splitTip, 14, y + 16);

    addFooter(doc);
    doc.save("Manual_AgroSuite360.pdf");
};
