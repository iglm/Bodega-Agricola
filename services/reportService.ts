
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style'; 
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

// --- HELPER FUNCTIONS ---

const addHeader = (doc: jsPDF, title: string, subtitle: string, warehouseName: string, color: [number, number, number] = BRAND_COLORS.primary): number => {
    doc.setFillColor(...color);
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(title, 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 105, 28, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(warehouseName, 105, 36, { align: 'center' });

    return 45; // Return Y position for content start
};

const addFooter = (doc: jsPDF) => {
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Generado por AgroSuite 360 - ${AUTHOR_NAME}`, 105, 290, { align: 'center' });
        doc.text(`Página ${i} de ${pageCount}`, 200, 290, { align: 'right' });
    }
};

// --- INTERNAL CALCULATION ENGINE (HIDDEN FROM UI) ---
// Based on real agronomic performance data provided (Private Logic)
const PERFORMANCE_RATES = {
    // Siembra & Renovacion
    AHOYADO: 700, // hoyos/jornal
    SIEMBRA: 600, // colinos/jornal
    ZOQUEO_CORTE: 3150, // arboles/jornal
    SELECCION_CHUPONES: 1050, // arboles/jornal
    
    // Mantenimiento Levante (0-12 meses)
    LEVANTE_PLATEO: 900, // arboles/jornal
    LEVANTE_FERT: 1950, // arboles/jornal
    
    // Mantenimiento Producción
    PROD_PLATEO: 1250, // arboles/jornal
    PROD_FERT: 3150, // arboles/jornal
    
    // General
    GUADANA_HA: 2.5, // jornales por Hectárea
    RECOLECCION_PROM: 80 // kg cereza por jornal
};

// --- REALISTIC DATA SIMULATION ---
export const getCoffeeExampleData = (): AppState => {
    const id = "hacienda_real_v4";
    const warehouseId = id;
    
    // 1. CONFIGURATION
    const JORNAL_VALUE = 65000; // Costo día + prestaciones aprox
    const PICKING_PRICE_PER_KG = 1200; 
    
    const FERTILIZER_PROD_PRICE = 165000; // Bulto 50kg
    const FERTILIZER_RENOV_PRICE = 180000; // DAP
    
    // Lote Configuration
    const HA_PRODUCTION = 5.0; // 5 Hectares
    const DENSITY = 5500; // Trees per Ha
    const TOTAL_TREES_PROD = HA_PRODUCTION * DENSITY; // 27,500 trees

    const HA_RENOVATION = 1.0; // 1 Hectare (Zoca)
    const TOTAL_TREES_RENOV = HA_RENOVATION * DENSITY; // 5,500 trees
    
    // 2. MASTER DATA (Updated with CropTypes)
    const costCenters = [
        { id: "c1", warehouseId, name: "Lote La Cima (Producción)", area: HA_PRODUCTION, budget: 180000000, description: `Café Castillo (${TOTAL_TREES_PROD.toLocaleString()} árboles)`, stage: 'Produccion' as const, plantCount: TOTAL_TREES_PROD, cropType: "Café" },
        { id: "c2", warehouseId, name: "Lote El Bajo (Zoca/Renov)", area: HA_RENOVATION, budget: 35000000, description: `Zoca Reciente (${TOTAL_TREES_RENOV.toLocaleString()} árboles)`, stage: 'Levante' as const, plantCount: TOTAL_TREES_RENOV, cropType: "Café" },
        { id: "c3", warehouseId, name: "Cultivo Plátano Asociado", area: 2.0, budget: 15000000, description: "Barreras vivas", stage: 'Produccion' as const, cropType: "Plátano" },
        { id: "c4", warehouseId, name: "Infraestructura y Casa", area: 0.2, stage: 'Infraestructura' as const, cropType: "Infraestructura" }
    ];

    const personnel = [
        { id: "p1", warehouseId, name: "Carlos Administrador", role: "Administrador" },
        { id: "p2", warehouseId, name: "Cuadrilla Contratistas", role: "Contratista" },
        { id: "p3", warehouseId, name: "Juan 'Guadaña'", role: "Todero" },
        { id: "p4", warehouseId, name: "Recolectores Temporada", role: "Recolector" }
    ];

    const activities = [
        { id: "a1", warehouseId, name: "Recolección" },
        { id: "a2", warehouseId, name: "Guadaña General" },
        { id: "a3", warehouseId, name: "Fertilización Edáfica" },
        { id: "a4", warehouseId, name: "Deschuponada" }, 
        { id: "a5", warehouseId, name: "Plateo Manual" },
        { id: "a6", warehouseId, name: "Administración" }
    ];

    const inventory: InventoryItem[] = [
        { id: "i1", warehouseId, name: "Producción 25-4-24", category: Category.FERTILIZANTE, currentQuantity: 2000000, baseUnit: 'g', lastPurchasePrice: FERTILIZER_PROD_PRICE, lastPurchaseUnit: Unit.BULTO_50KG, averageCost: FERTILIZER_PROD_PRICE/50000 },
        { id: "i2", warehouseId, name: "DAP (Inicio)", category: Category.FERTILIZANTE, currentQuantity: 500000, baseUnit: 'g', lastPurchasePrice: FERTILIZER_RENOV_PRICE, lastPurchaseUnit: Unit.BULTO_50KG, averageCost: FERTILIZER_RENOV_PRICE/50000 },
        { id: "i3", warehouseId, name: "Glifosato", category: Category.HERBICIDA, currentQuantity: 20000, baseUnit: 'ml', lastPurchasePrice: 45000, lastPurchaseUnit: Unit.LITRO, averageCost: 45 },
        { id: "i4", warehouseId, name: "Broca-Fin", category: Category.INSECTICIDA, currentQuantity: 5000, baseUnit: 'ml', lastPurchasePrice: 120000, lastPurchaseUnit: Unit.LITRO, averageCost: 120 }
    ];

    const machines = [
        { id: "m1", warehouseId, name: "Despulpadora" },
        { id: "m2", warehouseId, name: "Guadaña Stihl" }
    ];

    // 3. SIMULATION LOOP (180 DAYS BACK)
    const laborLogs: LaborLog[] = [];
    const rainLogs: RainLog[] = [];
    const harvests: HarvestLog[] = [];
    const movements: Movement[] = [];
    const maintenanceLogs: MaintenanceLog[] = [];
    const financeLogs: FinanceLog[] = [];

    const today = new Date();

    for (let i = 0; i <= 180; i++) {
        const d = new Date(today);
        d.setDate(today.getDate() - (180 - i)); 
        const dateStr = d.toISOString().split('T')[0];
        const month = d.getMonth(); // 0-11
        const day = d.getDate();
        const isSunday = d.getDay() === 0;

        // --- RAIN SIMULATION ---
        // Rainy months: April(3), May(4), Oct(9), Nov(10)
        let rainChance = 0.3;
        if ([3,4,9,10].includes(month)) rainChance = 0.7;
        
        if (Math.random() < rainChance) {
            rainLogs.push({ id: `rain_${i}`, warehouseId, date: dateStr, millimeters: Math.floor(Math.random() * 50) + 2 });
        }

        // --- LOT 1: PRODUCTION ACTIVITIES (COFFEE) ---
        
        // Fertilization (Every 4 months roughly)
        if (day === 10 && (month % 4 === 0)) {
            // Material Calculation: 120g per tree
            const dosePerTree = 120; 
            const totalKg = (TOTAL_TREES_PROD * dosePerTree) / 1000;
            const bultos = Math.ceil(totalKg / 50);
            
            // Labor Calculation (Using Hidden Table Logic: 3150 trees/jornal)
            const jornalesNeeded = TOTAL_TREES_PROD / PERFORMANCE_RATES.PROD_FERT; // 27500 / 3150 = ~8.7
            const laborCost = Math.ceil(jornalesNeeded) * JORNAL_VALUE;

            movements.push({
                id: `mov_fert_p_${i}`, warehouseId, date: dateStr, type: 'OUT',
                itemId: 'i1', itemName: "Producción 25-4-24", quantity: bultos, unit: Unit.BULTO_50KG,
                calculatedCost: bultos * FERTILIZER_PROD_PRICE, costCenterId: "c1", costCenterName: "Lote La Cima", notes: `Abonada Producción`
            });
            
            laborLogs.push({
                id: `l_fert_p_${i}`, warehouseId, date: dateStr, personnelId: "p2", personnelName: "Cuadrilla Contratistas",
                activityId: "a3", activityName: "Fertilización Edáfica", costCenterId: "c1", costCenterName: "Lote La Cima",
                value: laborCost, notes: `Contrato Abonada (${Math.ceil(jornalesNeeded)} jornales calc)`, paid: true
            });
        }

        // Weeding (Guadaña) - Every 2 months
        if (day === 15 && (month % 2 === 0)) {
            // Using Hidden Table: 2.5 jornales/ha
            const jornalesNeeded = HA_PRODUCTION * PERFORMANCE_RATES.GUADANA_HA; // 5 * 2.5 = 12.5
            const cost = jornalesNeeded * JORNAL_VALUE;

            laborLogs.push({
                id: `l_weed_p_${i}`, warehouseId, date: dateStr, personnelId: "p3", personnelName: "Juan 'Guadaña'",
                activityId: "a2", activityName: "Guadaña General", costCenterId: "c1", costCenterName: "Lote La Cima",
                value: cost, notes: `Guadaña General (${jornalesNeeded} jornales)`, paid: true
            });
            // Fuel cost
            movements.push({
                id: `mov_fuel_${i}`, warehouseId, date: dateStr, type: 'OUT',
                itemId: 'i3', itemName: "Gasolina (Generico)", quantity: 5, unit: Unit.LITRO, // Simulated
                calculatedCost: 5 * 15000, machineId: "m2", machineName: "Guadaña Stihl", notes: "Combustible Guadaña" 
            });
        }

        // Harvest (Mainly Oct-Nov and Apr-May)
        if (!isSunday && ([3,4,9,10].includes(month)) && Math.random() > 0.4) {
            // Simulating a picking day
            const pickers = 5;
            const avgKg = PERFORMANCE_RATES.RECOLECCION_PROM; // 80kg
            const dailyKgCherry = pickers * avgKg * (0.8 + Math.random() * 0.4); // Random fluctuation
            
            const pickingCost = dailyKgCherry * PICKING_PRICE_PER_KG;
            const revenue = (dailyKgCherry / 5) * 22000; // Approx CPS conversion and price

            harvests.push({
                id: `h_${i}`, warehouseId, date: dateStr, costCenterId: "c1", costCenterName: "Lote La Cima",
                cropName: "Café Cereza", quantity: Math.round(dailyKgCherry), unit: "Kg",
                totalValue: Math.round(revenue), notes: "Recolección diaria"
            });

            laborLogs.push({
                id: `l_pick_${i}`, warehouseId, date: dateStr, personnelId: "p4", personnelName: "Recolectores Temporada",
                activityId: "a1", activityName: "Recolección", costCenterId: "c1", costCenterName: "Lote La Cima",
                value: Math.round(pickingCost), notes: `Pago ${Math.round(dailyKgCherry)}kg`, paid: true
            });
        }

        // --- LOT 3: PLANTAIN (PLANTAIN) ---
        // Occasional harvest, low maintenance
        if (day === 25 && (month % 2 === 0)) {
             harvests.push({
                id: `h_plat_${i}`, warehouseId, date: dateStr, costCenterId: "c3", costCenterName: "Cultivo Plátano Asociado",
                cropName: "Plátano", quantity: 500, unit: "Kg",
                totalValue: 500 * 2500, notes: "Corte de racimos"
            });
        }

        // --- LOT 2: RENOVATION ACTIVITIES (High Expense, Zero Income) ---
        
        // Deschuponada (Selection of shoots) - Once in this period
        if (day === 20 && month === 5) { // Arbitrary date
             // Using Hidden Table: 1050 trees/jornal
             const jornalesNeeded = TOTAL_TREES_RENOV / PERFORMANCE_RATES.SELECCION_CHUPONES; // 5500 / 1050 = ~5.2
             const cost = Math.ceil(jornalesNeeded) * JORNAL_VALUE;

             laborLogs.push({
                id: `l_desc_r_${i}`, warehouseId, date: dateStr, personnelId: "p2", personnelName: "Cuadrilla Contratistas",
                activityId: "a4", activityName: "Deschuponada", costCenterId: "c2", costCenterName: "Lote El Bajo",
                value: cost, notes: "Selección de chupones principales", paid: true
            });
        }

        // Plateo Manual (Crucial for small trees) - Every month
        if (day === 5) {
            // Using Hidden Table: 900 trees/jornal (Levante)
            const jornalesNeeded = TOTAL_TREES_RENOV / PERFORMANCE_RATES.LEVANTE_PLATEO; // 5500 / 900 = ~6.1
            const cost = Math.ceil(jornalesNeeded) * JORNAL_VALUE;

            laborLogs.push({
                id: `l_plat_r_${i}`, warehouseId, date: dateStr, personnelId: "p2", personnelName: "Cuadrilla Contratistas",
                activityId: "a5", activityName: "Plateo Manual", costCenterId: "c2", costCenterName: "Lote El Bajo",
                value: cost, notes: "Plateo a mano (Cuidado Zoca)", paid: true
            });
        }

        // --- ADMIN COSTS ---
        if (day === 28) {
            financeLogs.push({
                id: `fin_admin_${i}`, warehouseId, date: dateStr, type: 'EXPENSE', category: 'Servicios',
                amount: 120000, description: "Pago Energía Eléctrica"
            });
            
            // Admin Salary Part-time
            laborLogs.push({
                id: `l_admin_${i}`, warehouseId, date: dateStr, personnelId: "p1", personnelName: "Carlos Administrador",
                activityId: "a6", activityName: "Administración", costCenterId: "c4", costCenterName: "Infraestructura",
                value: 800000, notes: "Mensualidad Administración", paid: true
            });
        }
    }

    return {
        warehouses: [{ id: warehouseId, name: "Hacienda El Cafetal (Simulación)", created: new Date().toISOString() }],
        activeWarehouseId: warehouseId,
        suppliers: [
            { id: "s1", warehouseId, name: "AgroInsumos del Pueblo" },
            { id: "s2", warehouseId, name: "Cooperativa Cafetera" }
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

export const generateExcelImportTemplate = (data: AppState, prefillData: boolean = false) => {
    const wb = XLSX.utils.book_new();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';

    const createStyledHeader = (headers: string[], colorHex: string) => {
        return headers.map(h => ({
            v: h,
            t: 's',
            s: {
                font: { bold: true, color: { rgb: "FFFFFF" } },
                fill: { fgColor: { rgb: colorHex } },
                alignment: { horizontal: "center", vertical: "center" },
                border: { top: {style:'thin'}, bottom: {style:'medium'}, right: {style:'thin'} },
                protection: { locked: true } 
            }
        }));
    };

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

    const createUnlockedCell = (val: any) => ({
        v: val,
        t: typeof val === 'number' ? 'n' : 's',
        s: {
            protection: { locked: false } 
        }
    });

    const createExampleRow = (values: any[]) => {
        return values.map(v => ({
            v: v,
            t: typeof v === 'number' ? 'n' : 's',
            s: {
                font: { italic: true, color: { rgb: "666666" } },
                fill: { fgColor: { rgb: "F3F4F6" } },
                protection: { locked: false } 
            }
        }));
    };

    const protectSheet = (ws: any) => {
        ws['!protect'] = {
            password: "AgroSuiteSecure",
            selectLockedCells: false, 
            selectUnlockedCells: true, 
            formatCells: false,
            formatColumns: false,
            formatRows: false,
            insertColumns: false, 
            insertRows: true,
            deleteColumns: false,
            deleteRows: true,
            sort: true,
            autoFilter: true
        };
    };

    const legalTitle = prefillData ? "AGROSUITE 360 - ARCHIVO DE EJEMPLO (NO IMPORTAR)" : "AGROSUITE 360 - HERRAMIENTA ADMINISTRATIVA OFICIAL";
    const legalColor = prefillData ? "EA580C" : "064E3B"; 

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
    wsLegal['!protect'] = { password: "legal", selectLockedCells: true, selectUnlockedCells: false }; 
    XLSX.utils.book_append_sheet(wb, wsLegal, "LICENCIA_USO");

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
    wsRef['!protect'] = { password: "ref", selectLockedCells: true, selectUnlockedCells: false }; 
    XLSX.utils.book_append_sheet(wb, wsRef, "MAESTROS_COPIAR_AQUI");

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

    const laborHeaders = createStyledHeader(["Fecha (AAAA-MM-DD)", "Trabajador (Nombre Exacto)", "Labor (Nombre Exacto)", "Lote (Nombre Exacto)", "Valor ($)", "Notas"], "D97706");
    const laborEx = createExampleRow(["2024-05-01", "EJ: Juan Perez", "Guadaña", "Lote 1", 50000, "Ref: 3.5 jornales/ha"]);
    
    const laborRows = getSheetData(laborHeaders, laborEx, data.laborLogs, (l) => [l.date, l.personnelName, l.activityName, l.costCenterName, l.value, l.notes]);
    
    const wsLabor = XLSX.utils.aoa_to_sheet([]);
    XLSX.utils.sheet_add_aoa(wsLabor, laborRows, { origin: "A1" });
    wsLabor['!cols'] = [{ wch: 15 }, { wch: 30 }, { wch: 25 }, { wch: 25 }, { wch: 15 }, { wch: 40 }];
    if(!wsLabor['!merges']) wsLabor['!merges'] = [];
    wsLabor['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 5 } });
    protectSheet(wsLabor);
    XLSX.utils.book_append_sheet(wb, wsLabor, "Jornales_Nomina");

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

    XLSX.writeFile(wb, `Plantilla_${prefillData ? 'EJEMPLO_' : ''}Carga_Masiva.xlsx`);
};

export const generatePDF = (data: AppState) => {
  const doc = new jsPDF();
  const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
  
  let y = addHeader(doc, "REPORTE DE INVENTARIO", "Estado actual de Bodega", activeWarehouseName);

  const inventoryData = data.inventory.map(item => {
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
      headStyles: { fillColor: [220, 38, 38] } 
  });

  addFooter(doc);
  doc.save(`Pedido_Sugerido_${activeWarehouseName}.pdf`);
};

export const generateGlobalReport = (data: AppState) => {
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

  const wsLab = XLSX.utils.json_to_sheet(data.laborLogs.map(l => ({
      Fecha: new Date(l.date).toLocaleDateString(),
      Trabajador: l.personnelName,
      Labor: l.activityName,
      Lote: l.costCenterName,
      Valor: l.value,
      Pagado: l.paid ? 'SI' : 'NO'
  })));
  XLSX.utils.book_append_sheet(wb, wsLab, "Mano_Obra");

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
        headStyles: { fillColor: BRAND_COLORS.yellow, textColor: [50, 50, 50] } 
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

    doc.setFillColor(6, 78, 59); 
    doc.rect(0, 0, 210, 297, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(30);
    doc.setFont("helvetica", "bold");
    doc.text("AgroSuite 360", 105, 100, { align: 'center' });
    
    doc.setFontSize(16);
    doc.setTextColor(52, 211, 153); 
    doc.text("Manual Oficial de Usuario", 105, 115, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setTextColor(200, 200, 200);
    doc.text(`Versión 4.5 - Generado el ${currentDate}`, 105, 130, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Desarrollado por Ing. ${AUTHOR_NAME}`, 105, 270, { align: 'center' });
    doc.text(`Contacto: ${CONTACT_EMAIL}`, 105, 275, { align: 'center' });

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

    doc.setFillColor(254, 226, 226); 
    doc.rect(14, y2 + 5, 180, 40, 'F');
    doc.setTextColor(185, 28, 28); 
    doc.setFont("helvetica", "bold");
    doc.text("AVISO LEGAL Y DERECHOS DE AUTOR", 20, y2 + 15);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    const legalText = `Este software y su código fuente son propiedad intelectual exclusiva de ${AUTHOR_NAME}. Queda prohibida su copia, ingeniería inversa o distribución no autorizada. El uso indebido será sancionado conforme a la Ley 23 de 1982 y Ley 1273 de 2009 sobre Delitos Informáticos en Colombia.`;
    const splitLegal = doc.splitTextToSize(legalText, 160);
    doc.text(splitLegal, 20, y2 + 22);

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

    doc.addPage();
    y = addHeader(doc, "INTELIGENCIA ARTIFICIAL (GEMINI)", "Nuevo Módulo", "Manual Usuario", BRAND_COLORS.purple);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Analista Financiero", 14, y + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Pregunte directamente a sus datos. Ejemplo: '¿Por qué bajó mi rentabilidad este mes?'. La IA analizará sus registros de gastos y ventas para darle una respuesta escrita.", 14, y + 16);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Comandos de Voz", 14, y + 30);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Use el micrófono para registrar datos sin tocar la pantalla. Diga: 'Ayer gasté 3 jornales en el Lote 1'. El sistema detectará automáticamente el trabajador, la labor y el costo si ya están configurados.", 14, y + 36);

    addFooter(doc);
    doc.save("Manual_AgroSuite360.pdf");
};
