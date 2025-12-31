
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style'; 
import { AppState, LaborLog, HarvestLog, Movement, InventoryItem, Unit, Category, CostCenter, Personnel, Activity, PhenologyLog, PestLog, Machine, Asset, MaintenanceLog, RainLog, FinanceLog, SoilAnalysis, PPELog, WasteLog, AgendaEvent, CostClassification, Warehouse, PlannedLabor, BpaCriterion } from '../types';
import { formatCurrency, generateId, convertToBase, getBaseUnitType, processInventoryMovement } from './inventoryService';

const BRAND_COLORS = {
    primary: [5, 150, 105] as [number, number, number], // Emerald 600
    slate: [15, 23, 42] as [number, number, number],   // Slate 900
    amber: [245, 158, 11] as [number, number, number], // Amber 500
    red: [220, 38, 38] as [number, number, number],    // Red 600
    indigo: [79, 70, 229] as [number, number, number], // Indigo 600
    purple: [147, 51, 234] as [number, number, number], // Purple 600
};

const AUTHOR = "Lucas Mateo Tabares Franco";

const addHeader = (doc: jsPDF, title: string, subtitle: string, warehouse: string, color = BRAND_COLORS.primary): number => {
    doc.setFillColor(...color);
    doc.rect(0, 0, 210, 40, 'F'); // Reduced height slightly
    
    // Logo placeholder text
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(24);
    doc.text(title.toUpperCase(), 105, 20, { align: 'center' });
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`${subtitle} | Sede: ${warehouse}`, 105, 28, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setTextColor(200, 200, 200);
    doc.text(`Generado: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`, 105, 35, { align: 'center' });
    
    return 50;
};

const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`DatosFinca Viva | ${AUTHOR} | Pág ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }
};

// --- REPORTES DE AUDITORÍA BPA ---
export const generateBpaReport = (
    warehouseName: string,
    standard: string,
    score: number,
    isCriticalFail: boolean,
    criteria: BpaCriterion[]
): void => {
    const doc = new jsPDF();
    const statusColor = isCriticalFail ? BRAND_COLORS.red : BRAND_COLORS.primary;
    const statusText = isCriticalFail ? "NO CONFORME (CRÍTICO)" : "PRE-AUDITORÍA APROBADA";
    
    let y = addHeader(doc, "INFORME DE AUDITORÍA", `Estándar: ${standard}`, warehouseName, statusColor);

    // 1. Resumen Ejecutivo
    doc.setFontSize(14);
    doc.setTextColor(0,0,0);
    doc.text("1. Resumen de Cumplimiento", 14, y);
    y += 8;

    doc.setFillColor(isCriticalFail ? 254 : 240, isCriticalFail ? 242 : 253, isCriticalFail ? 242 : 244);
    doc.setDrawColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.roundedRect(14, y, 182, 30, 3, 3, 'FD');

    doc.setFontSize(20);
    doc.setTextColor(statusColor[0], statusColor[1], statusColor[2]);
    doc.text(`${score.toFixed(1)}%`, 20, y + 12);
    
    doc.setFontSize(10);
    doc.text("Índice de Cumplimiento", 20, y + 18);

    doc.setFontSize(16);
    doc.text(statusText, 100, y + 12);
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(isCriticalFail ? "Se han detectado fallos en Puntos Mayores/Críticos." : "El predio cumple con los umbrales mínimos del estándar.", 100, y + 18);

    y += 40;

    // 2. Detalle de Criterios
    doc.setFontSize(14);
    doc.setTextColor(0,0,0);
    doc.text("2. Lista de Verificación Detallada", 14, y);
    y += 5;

    // Agrupar filas
    const rows = criteria.map(c => [
        c.category,
        c.code,
        c.label,
        c.complianceLevel === 'MAJOR' ? 'MAYOR' : 'MENOR',
        c.compliant ? 'CUMPLE' : 'NO CUMPLE'
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Categoría', 'Código', 'Criterio de Control', 'Nivel', 'Estado']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.slate },
        columnStyles: {
            0: { fontStyle: 'bold', cellWidth: 35 },
            2: { cellWidth: 'auto' },
            3: { halign: 'center', cellWidth: 20 },
            4: { halign: 'center', fontStyle: 'bold', cellWidth: 25 }
        },
        didParseCell: (data) => {
            if (data.section === 'body') {
                if (data.column.index === 3 && data.cell.raw === 'MAYOR') {
                    data.cell.styles.textColor = [220, 38, 38]; // Red text for Major
                }
                if (data.column.index === 4) {
                    if (data.cell.raw === 'NO CUMPLE') {
                        data.cell.styles.fillColor = [254, 226, 226]; // Light Red bg
                        data.cell.styles.textColor = [220, 38, 38];
                    } else {
                        data.cell.styles.textColor = [22, 163, 74]; // Green text
                    }
                }
            }
        }
    });

    // Firma
    const finalY = (doc as any).lastAutoTable.finalY + 30;
    if (finalY < 250) {
        doc.line(14, finalY, 80, finalY);
        doc.setFontSize(9);
        doc.setTextColor(100);
        doc.text("Firma del Auditor Interno / Productor", 14, finalY + 5);
        
        doc.line(110, finalY, 190, finalY);
        doc.text("Firma del Responsable Agrícola", 110, finalY + 5);
    }

    addFooter(doc);
    doc.save(`Auditoria_${standard}_${new Date().toISOString().split('T')[0]}.pdf`);
};

// --- MOTOR DE INGENIERÍA DE DATOS SQL RELACIONAL ---
export const generateSQLDump = (data: AppState): void => {
    const fileName = `DatosFinca_Viva_MasterBackup_${new Date().toISOString().split('T')[0]}.sql`;
    let sql = `-- =============================================================================\n`;
    sql += `-- DATOSFINCA VIVA - RELATIONAL DATABASE EXPORT (SQLITE COMPATIBLE)\n`;
    sql += `-- Exportado por: ${AUTHOR}\n`;
    sql += `-- Factor Prestacional Aplicado: ${data.laborFactor}\n`;
    sql += `-- =============================================================================\n\n`;

    // DDL - Estructura Relacional
    sql += `-- 1. INFRAESTRUCTURA Y LOTES\n`;
    sql += `CREATE TABLE IF NOT EXISTS fincas (id TEXT PRIMARY KEY, nombre TEXT, creada TEXT);\n`;
    sql += `CREATE TABLE IF NOT EXISTS lotes (id TEXT PRIMARY KEY, finca_id TEXT, nombre TEXT, area_ha REAL, cultivo TEXT, asociado TEXT, etapa TEXT, FOREIGN KEY(finca_id) REFERENCES fincas(id));\n\n`;

    sql += `-- 2. INVENTARIO Y COSTEO CPP\n`;
    sql += `CREATE TABLE IF NOT EXISTS insumos (id TEXT PRIMARY KEY, finca_id TEXT, nombre TEXT, categoria TEXT, unidad_base TEXT, stock REAL, costo_promedio REAL, pc_dias INTEGER);\n`;
    sql += `CREATE TABLE IF NOT EXISTS movimientos (id TEXT PRIMARY KEY, insumo_id TEXT, tipo TEXT, cantidad REAL, unidad TEXT, costo_total REAL, fecha TEXT, lote_id TEXT, pc_aplicado INTEGER);\n\n`;

    sql += `-- 3. TALENTO HUMANO Y NÓMINA\n`;
    sql += `CREATE TABLE IF NOT EXISTS personal (id TEXT PRIMARY KEY, nombre TEXT, rol TEXT, documento TEXT);\n`;
    sql += `CREATE TABLE IF NOT EXISTS nomina (id TEXT PRIMARY KEY, personal_id TEXT, lote_id TEXT, fecha TEXT, valor_base REAL, factor_legal REAL DEFAULT ${data.laborFactor}, costo_real REAL GENERATED ALWAYS AS (valor_base * factor_legal) VIRTUAL);\n\n`;

    sql += `-- 4. PRODUCCIÓN Y SEGURIDAD ALIMENTARIA\n`;
    sql += `CREATE TABLE IF NOT EXISTS aplicaciones (id TEXT PRIMARY KEY, lote_id TEXT, insumo_id TEXT, fecha_aplicacion TEXT, pc_dias INTEGER, fecha_seguridad TEXT);\n`;
    sql += `CREATE TABLE IF NOT EXISTS cosechas (id TEXT PRIMARY KEY, lote_id TEXT, producto TEXT, cantidad REAL, valor_venta REAL, fecha TEXT);\n\n`;

    const escape = (str: string | undefined) => str ? `'${str.replace(/'/g, "''")}'` : 'NULL';

    data.warehouses.forEach(w => { sql += `INSERT INTO fincas VALUES ('${w.id}', ${escape(w.name)}, '${w.created}');\n`; });
    data.costCenters.forEach(c => { sql += `INSERT INTO lotes VALUES ('${c.id}', '${c.warehouseId}', ${escape(c.name)}, ${c.area}, ${escape(c.cropType)}, ${escape(c.associatedCrop)}, '${c.stage}');\n`; });
    data.inventory.forEach(i => { sql += `INSERT INTO insumos VALUES ('${i.id}', '${i.warehouseId}', ${escape(i.name)}, '${i.category}', '${i.baseUnit}', ${i.currentQuantity}, ${i.averageCost}, ${i.safetyIntervalDays || 0});\n`; });
    data.movements.forEach(m => { sql += `INSERT INTO movimientos VALUES ('${m.id}', '${m.itemId}', '${m.type}', ${m.quantity}, '${m.unit}', ${m.calculatedCost}, '${m.date}', ${escape(m.costCenterId)}, ${m.phiApplied || 0});\n`; });
    data.laborLogs.forEach(l => { sql += `INSERT INTO nomina (id, personal_id, lote_id, fecha, valor_base) VALUES ('${l.id}', '${l.personnelId}', '${l.costCenterId}', '${l.date}', ${l.value});\n`; });
    data.harvests.forEach(h => { sql += `INSERT INTO cosechas VALUES ('${h.id}', '${h.costCenterId}', ${escape(h.cropName)}, ${h.quantity}, ${h.totalValue}, '${h.date}');\n`; });

    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
};

// --- SIMULATOR REPORTS (WITH ROI) ---
export const generateSimulatorPDF = (data: any): void => {
    const doc = new jsPDF();
    let y = addHeader(doc, "SIMULACIÓN FINANCIERA", "Proyección Fenológica de Flujo de Caja", "Escenario Proyectado", BRAND_COLORS.indigo);

    // 1. Parámetros del Cultivo
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("1. Parámetros de la Simulación", 14, y);
    y += 5;

    autoTable(doc, {
        startY: y,
        head: [['Parámetro', 'Valor Configurado', 'Unidad']],
        body: [
            ['Cantidad de Árboles', data.parameters.totalTrees.toLocaleString(), 'Árboles'],
            ['Densidad de Siembra', data.parameters.density.toLocaleString(), 'Arb/Ha'],
            ['Precio Carga (125Kg)', formatCurrency(data.parameters.coffeeLoadPrice), 'COP'],
            ['Costo Jornal', formatCurrency(data.parameters.jornalValue), 'COP'],
            ['Costo Recolección', formatCurrency(data.parameters.harvestCostPerKg), 'Por Kg Cereza'],
            ['Factor Conversión', `${data.parameters.yieldConversion} : 1`, 'Kg Cereza / Kg CPS'],
            ['Meta Mensual', formatCurrency(data.reverseCalc.goal), 'COP Libre']
        ],
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.slate },
        styles: { fontSize: 9 }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // 2. Resumen de Ejecución
    doc.setFontSize(12);
    doc.text("2. Proyección a 7 Años (Ciclo Completo)", 14, y);
    y += 5;

    // FIX: data values are already totals, do NOT multiply by totalTrees again
    const rows = data.calculation.yearlyData.map((row: any) => [
        `Año ${row.year}`,
        row.label,
        formatCurrency(row.income), 
        formatCurrency(row.totalCost),
        formatCurrency(row.profit)
    ]);

    autoTable(doc, {
        startY: y,
        head: [['Año', 'Etapa', 'Ingreso Bruto', 'Costos Totales', 'Utilidad Neta']],
        body: rows,
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.indigo },
        columnStyles: { 
            2: { halign: 'right', textColor: [22, 163, 74] }, // Emerald
            3: { halign: 'right', textColor: [220, 38, 38] }, // Red
            4: { halign: 'right', fontStyle: 'bold' } 
        },
        // FIX: Summing raw totals directly
        foot: [['', 'TOTAL ACUMULADO', formatCurrency(data.calculation.yearlyData.reduce((a:number, b:any) => a + b.income, 0)), 
               formatCurrency(data.calculation.yearlyData.reduce((a:number, b:any) => a + b.totalCost, 0)), 
               formatCurrency(data.calculation.globalAccumulated)]],
        footStyles: { fillColor: BRAND_COLORS.slate, textColor: 255, fontStyle: 'bold' }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // 3. INDICADORES FINANCIEROS (NEW SECTION)
    doc.setFontSize(12);
    doc.text("3. Indicadores Financieros Estratégicos", 14, y);
    y += 5;

    // FIX: Changed data.calculation.roi to data.calculation.annualizedROI
    autoTable(doc, {
        startY: y,
        head: [['Indicador', 'Valor', 'Interpretación']],
        body: [
            ['Retorno Inversión (ROI)', `${data.calculation.annualizedROI.toFixed(1)} %`, `Retorno efectivo anual proyectado`],
            ['Margen Neto Global', `${data.calculation.netMargin.toFixed(1)} %`, 'Porcentaje de utilidad sobre ventas totales'],
            ['Costo Producción (Carga)', formatCurrency(data.calculation.costPerCarga), 'Punto de equilibrio por carga producida'],
            ['Año Recuperación (Payback)', data.calculation.paybackYear > 0 ? `Año ${data.calculation.paybackYear}` : 'N/A', 'Momento en que la inversión se paga sola'],
            ['Inversión Máxima (Peak)', formatCurrency(data.calculation.maxInvestment), 'Capital de trabajo máximo requerido']
        ],
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.purple },
        columnStyles: { 1: { fontStyle: 'bold', halign: 'center' } }
    });

    y = (doc as any).lastAutoTable.finalY + 15;

    // 4. Resultado Ingeniería Inversa
    doc.setFillColor(240, 253, 244); // Emerald 50
    doc.setDrawColor(22, 163, 74);
    doc.roundedRect(14, y, 180, 35, 3, 3, 'FD');
    
    doc.setFontSize(11);
    doc.setTextColor(22, 163, 74);
    doc.text("ANÁLISIS DE VIABILIDAD PARA LA META", 20, y + 10);
    
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Para lograr una utilidad mensual libre de ${formatCurrency(data.reverseCalc.goal)}, el modelo sugiere:`, 20, y + 20);
    
    doc.setFont("helvetica", "bold");
    doc.text(`• Sembrar: ${data.reverseCalc.trees.toLocaleString()} Árboles`, 20, y + 28);
    doc.text(`• Área Requerida: ${data.reverseCalc.area.toFixed(1)} Hectáreas`, 100, y + 28);

    addFooter(doc);
    doc.save("Simulacion_Financiera_Cafetera.pdf");
};

export const generateSimulatorExcel = (data: any): void => {
    const wb = XLSX.utils.book_new();
    
    // 1. Sheet Data Construction
    const ws_data = [
        ["DATOSFINCA VIVA - MODELO DE SIMULACIÓN FINANCIERA"],
        [`Fecha Generación: ${new Date().toLocaleDateString()}`],
        [""],
        ["PARÁMETROS DEL CULTIVO"],
        ["Variable", "Valor", "Unidad"],
        ["Árboles Totales", data.parameters.totalTrees, "Und"],
        ["Densidad", data.parameters.density, "Arb/Ha"],
        ["Precio Carga", data.parameters.coffeeLoadPrice, "COP"],
        ["Costo Jornal", data.parameters.jornalValue, "COP"],
        ["Costo Fertilizante", data.parameters.fertilizerPriceBulto, "COP/Bulto"],
        ["Factor Conversión", data.parameters.yieldConversion, "Kg Cereza / Kg CPS"],
        [""],
        ["PROYECCIÓN DE FLUJO DE CAJA (7 AÑOS)"],
        ["Año", "Etapa Fenológica", "Producción (Cargas)", "Ingreso Global ($)", "Egreso Global ($)", "Utilidad Neta ($)", "Margen (%)"],
    ];

    // Add Table Rows
    data.calculation.yearlyData.forEach((row: any) => {
        // FIX: data values are already totals, do NOT multiply by totalTrees again
        const income = row.income;
        const cost = row.totalCost;
        const profit = row.profit;
        const margin = income > 0 ? (profit / income) : 0;
        
        ws_data.push([
            row.year,
            row.label,
            row.yieldCargas.toFixed(1), // yieldCargas is total
            income,
            cost,
            profit,
            margin
        ]);
    });

    // Add Footer Stats (Updated with new metrics)
    ws_data.push(["", "", "", "", "", "", ""]);
    ws_data.push(["RESUMEN DE INDICADORES"]);
    ws_data.push(["Utilidad Total Ciclo", data.calculation.globalAccumulated]);
    // FIX: roi -> annualizedROI
    ws_data.push(["ROI (Retorno s/ Inversión)", data.calculation.annualizedROI / 100]); // Percent format
    ws_data.push(["Margen Neto Global", data.calculation.netMargin / 100]); // Percent format
    ws_data.push(["Costo Producción / Carga", data.calculation.costPerCarga]);
    ws_data.push(["Año Recuperación (Payback)", data.calculation.paybackYear]);
    ws_data.push(["Inversión Máxima Req.", data.calculation.maxInvestment]);

    const ws = XLSX.utils.aoa_to_sheet(ws_data);

    // Styles
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "4F46E5" } } }; // Indigo
    const subHeaderStyle = { font: { bold: true, color: { rgb: "4F46E5" } } };
    const currencyFormat = { numFmt: '"$"#,##0' };
    const percentFormat = { numFmt: '0.00%' };

    // Apply Styles
    ws['A1'].s = { font: { bold: true, sz: 14 } };
    ws['A4'].s = subHeaderStyle;
    ws['A13'].s = subHeaderStyle;
    ws['A23'].s = subHeaderStyle;

    // Apply to Parameter Headers
    ['A5', 'B5', 'C5'].forEach(ref => { if(ws[ref]) ws[ref].s = headerStyle; });
    // Apply to Main Table Headers
    ['A14', 'B14', 'C14', 'D14', 'E14', 'F14', 'G14'].forEach(ref => { if(ws[ref]) ws[ref].s = headerStyle; });

    // Apply Formats to Data Columns
    const range = XLSX.utils.decode_range(ws['!ref']!);
    for (let R = 14; R <= 20; ++R) { // Rows for years 1-7 (approx)
        ['D', 'E', 'F'].forEach(C => {
            const cellRef = XLSX.utils.encode_cell({c: XLSX.utils.decode_col(C), r: R});
            if (ws[cellRef]) ws[cellRef].s = currencyFormat;
        });
        const pctRef = XLSX.utils.encode_cell({c: 6, r: R}); // Column G
        if (ws[pctRef]) ws[pctRef].s = percentFormat;
    }

    // Formats for Footer Summary
    // B25 (ROI) and B26 (Margin)
    if(ws['B25']) ws['B25'].s = percentFormat;
    if(ws['B26']) ws['B26'].s = percentFormat;
    // Currency
    ['B24', 'B27', 'B29'].forEach(ref => { if(ws[ref]) ws[ref].s = currencyFormat; });

    // Column Widths
    ws['!cols'] = [{wch: 10}, {wch: 25}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 12}];

    XLSX.utils.book_append_sheet(wb, ws, "Simulación Financiera");
    XLSX.writeFile(wb, `Simulacion_Agro_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// --- EXECUTIVE REPORT (DOSSIER GERENCIAL) ---
export const generateExecutiveReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    const activeId = data.activeWarehouseId;
    let y = addHeader(doc, "DOSSIER GERENCIAL", "Estado Financiero y Operativo", activeW?.name || "");

    // 1. RESUMEN FINANCIERO (P&G Simplificado)
    const income = data.harvests.filter(h => h.warehouseId === activeId).reduce((sum, h) => sum + h.totalValue, 0);
    const laborCost = data.laborLogs.filter(l => l.warehouseId === activeId).reduce((sum, l) => sum + l.value, 0) * data.laborFactor;
    const supplyCost = data.movements.filter(m => m.warehouseId === activeId && m.type === 'OUT').reduce((sum, m) => sum + m.calculatedCost, 0);
    const adminCost = data.financeLogs.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + f.amount, 0);
    
    const totalCost = laborCost + supplyCost + adminCost;
    const netProfit = income - totalCost;
    const margin = income > 0 ? (netProfit / income) * 100 : 0;

    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.text("1. Estado de Resultados (P&G)", 14, y);
    y += 5;

    autoTable(doc, {
        startY: y,
        head: [['Concepto', 'Valor', '% Participación']],
        body: [
            ['INGRESOS OPERACIONALES (Ventas)', formatCurrency(income), '100%'],
            ['(-) Mano de Obra Real (Inc. Carga)', formatCurrency(laborCost), income > 0 ? `${((laborCost/income)*100).toFixed(1)}%` : '-'],
            ['(-) Insumos Aplicados', formatCurrency(supplyCost), income > 0 ? `${((supplyCost/income)*100).toFixed(1)}%` : '-'],
            ['(-) Gastos Administrativos', formatCurrency(adminCost), income > 0 ? `${((adminCost/income)*100).toFixed(1)}%` : '-'],
            ['(=) UTILIDAD NETA OPERATIVA', formatCurrency(netProfit), `${margin.toFixed(1)}%`]
        ],
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.slate },
        footStyles: { fillColor: netProfit >= 0 ? BRAND_COLORS.primary : BRAND_COLORS.red },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' }, 2: { halign: 'center' } }
    });

    // 2. ESTADO DE CERTIFICACIONES (RADAR)
    y = (doc as any).lastAutoTable.finalY + 15;
    doc.text("2. Estado de Cumplimiento Normativo (BPA / 4C / GLOBALG.A.P)", 14, y);
    y += 5;

    // Calcular porcentajes
    const checklist = data.bpaChecklist || {};
    // Mock simple counts based on checked items vs assumed totals (or count total keys available in code)
    // For this report, we count checked items.
    const totalChecks = Object.keys(checklist).length; // This is naive, ideally compare against templates
    const checked = Object.values(checklist).filter(v => v).length;
    
    // Use dummy totals for the report if no checklist exists yet to avoid 0/0
    const icaTotal = 20; 
    const ggTotal = 35;
    const code4cTotal = 25;
    
    const icaCount = Object.keys(checklist).filter(k => !k.startsWith('GG') && !k.startsWith('4C')).filter(k => checklist[k]).length;
    const ggCount = Object.keys(checklist).filter(k => k.startsWith('GG')).filter(k => checklist[k]).length;
    const code4cCount = Object.keys(checklist).filter(k => k.startsWith('4C')).filter(k => checklist[k]).length;

    autoTable(doc, {
        startY: y,
        head: [['Norma / Estándar', 'Criterios Cumplidos', 'Estado Auditabilidad']],
        body: [
            ['Res. ICA 30021 (BPA Colombia)', `${icaCount} / ${icaTotal}`, icaCount > 15 ? 'Listo para Auditoría' : 'En Implementación'],
            ['GLOBALG.A.P. IFA v6', `${ggCount} / ${ggTotal}`, ggCount > 30 ? 'Listo para Auditoría' : 'Brechas Mayores'],
            ['Código de Conducta 4C v4.1', `${code4cCount} / ${code4cTotal}`, code4cCount > 20 ? 'Certificable' : 'Mejora Continua Req.']
        ],
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.indigo }
    });

    // 3. ANÁLISIS DE COSTOS POR LOTE
    y = (doc as any).lastAutoTable.finalY + 15;
    doc.text("3. Rentabilidad por Centro de Costo (Lote)", 14, y);
    y += 5;

    const lotRows = data.costCenters.filter(c => c.warehouseId === activeId).map(lot => {
        const sales = data.harvests.filter(h => h.costCenterId === lot.id).reduce((s, h) => s + h.totalValue, 0);
        const costs = data.laborLogs.filter(l => l.costCenterId === lot.id).reduce((s, l) => s + l.value, 0) * data.laborFactor +
                      data.movements.filter(m => m.costCenterId === lot.id && m.type === 'OUT').reduce((s, m) => s + m.calculatedCost, 0);
        const profit = sales - costs;
        return [lot.name, `${lot.area} Ha`, formatCurrency(sales), formatCurrency(costs), formatCurrency(profit)];
    });

    autoTable(doc, {
        startY: y,
        head: [['Lote', 'Área', 'Ventas', 'Costos Directos', 'Margen Contribución']],
        body: lotRows,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.amber },
        columnStyles: { 2: { halign: 'right' }, 3: { halign: 'right' }, 4: { halign: 'right', fontStyle: 'bold' } }
    });

    addFooter(doc);
    doc.save(`Dossier_Gerencial_DatosFinca_${activeW?.name}.pdf`);
};

// --- OTROS REPORTES ---
export const generatePDF = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "INVENTARIO BODEGA", "Cierre de Existencias y Valoración", activeW?.name || "");
    
    autoTable(doc, {
        startY: y,
        head: [['Producto', 'Categoría', 'Stock', 'Costo Promedio', 'Valor Total']],
        body: data.inventory.map(i => [
            i.name,
            i.category,
            `${i.currentQuantity.toFixed(2)} ${i.baseUnit}`,
            formatCurrency(i.averageCost),
            formatCurrency(i.currentQuantity * i.averageCost)
        ]),
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.slate }
    });
    addFooter(doc);
    doc.save("Inventario_DatosFinca.pdf");
};

export const generateLaborReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "REPORTE DE NÓMINA", "Costeo Detallado de Mano de Obra", activeW?.name || "", BRAND_COLORS.amber);
    const totalCost = data.laborLogs.reduce((sum, log) => sum + log.value, 0);

    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Trabajador', 'Labor', 'Lote', 'Costo Base']],
        body: data.laborLogs.map(l => [l.date, l.personnelName, l.activityName, l.costCenterName, formatCurrency(l.value)]),
        foot: [['', '', '', 'Total Base', formatCurrency(totalCost)]],
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.slate },
        footStyles: { fillColor: BRAND_COLORS.slate, textColor: 255, fontStyle: 'bold' }
    });
    addFooter(doc);
    doc.save(`Reporte_Nomina_${activeW?.name}.pdf`);
};

export const generateHarvestReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "REPORTE DE COSECHA", "Producción y Ventas por Lote", activeW?.name || "");
    const totalValue = data.harvests.reduce((sum, h) => sum + h.totalValue, 0);

    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Lote', 'Producto', 'Cantidad', 'Calidad 1', 'Calidad 2', 'Rechazo', 'Venta Total']],
        body: data.harvests.map(h => [h.date, h.costCenterName, h.cropName, `${h.quantity} ${h.unit}`, h.quality1Qty || 0, h.quality2Qty || 0, h.wasteQty || 0, formatCurrency(h.totalValue)]),
        foot: [['', '', '', '', '', '', 'Total Ventas', formatCurrency(totalValue)]],
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.slate },
        footStyles: { fillColor: BRAND_COLORS.slate, textColor: 255, fontStyle: 'bold' }
    });
    addFooter(doc);
    doc.save(`Reporte_Cosechas_${activeW?.name}.pdf`);
};

export const generateBudgetReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "CONTROL PRESUPUESTAL", "Ejecución vs. Planeación", activeW?.name || "", [79, 70, 229]);
    const currentYear = new Date().getFullYear();
    const activeBudgets = data.budgets?.filter(b => b.year === currentYear) || [];
    
    if (activeBudgets.length === 0) {
        doc.text("No hay presupuestos activos para el año actual.", 14, y + 10);
        doc.save(`Reporte_Presupuesto_${activeW?.name}.pdf`);
        return;
    }

    const rows = data.costCenters.map(lot => {
        const lotBudget = activeBudgets.find(b => b.costCenterId === lot.id);
        if (!lotBudget) return null;
        let planned = 0;
        lotBudget.items.forEach(i => { planned += i.unitCost * i.quantityPerHa * lot.area * i.months.length; });
        const realLabor = data.laborLogs.filter(l => l.costCenterId === lot.id && new Date(l.date).getFullYear() === currentYear).reduce((sum, l) => sum + (l.value * data.laborFactor), 0);
        const realSupplies = data.movements.filter(m => m.costCenterId === lot.id && m.type === 'OUT' && new Date(m.date).getFullYear() === currentYear).reduce((sum, m) => sum + m.calculatedCost, 0);
        const totalReal = realLabor + realSupplies;
        const diff = planned - totalReal;
        const percent = planned > 0 ? (totalReal / planned) * 100 : 0;
        return [lot.name, formatCurrency(planned), formatCurrency(totalReal), formatCurrency(diff), `${percent.toFixed(1)}%`];
    }).filter(row => row !== null);

    autoTable(doc, {
        startY: y,
        head: [['Lote / Centro de Costo', 'Presupuestado', 'Ejecutado Real', 'Diferencia (Saldo)', '% Ejecución']],
        body: rows as any[],
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 4) {
                const val = parseFloat(data.cell.raw.toString().replace('%',''));
                if (val > 100) data.cell.styles.textColor = [220, 38, 38];
                else data.cell.styles.textColor = [5, 150, 105];
            }
        }
    });
    addFooter(doc);
    doc.save(`Reporte_Presupuesto_${activeW?.name}.pdf`);
};

export const generateExcel = (data: AppState): void => {
    const wb = XLSX.utils.book_new();
    const activeId = data.activeWarehouseId;
    const warehouseName = data.warehouses.find(w => w.id === activeId)?.name || 'Activa';
    const headerStyle = { font: { bold: true, color: { rgb: "FFFFFF" } }, fill: { fgColor: { rgb: "065f46" } } };
    const addSheet = (sheetData: any[], sheetName: string) => {
        if (sheetData.length === 0) return; 
        const ws = XLSX.utils.json_to_sheet(sheetData);
        const range = XLSX.utils.decode_range(ws['!ref']!);
        for (let C = range.s.c; C <= range.e.c; ++C) {
            const address = XLSX.utils.encode_cell({ r: 0, c: C });
            if (ws[address]) ws[address].s = headerStyle;
        }
        XLSX.utils.book_append_sheet(wb, ws, sheetName);
    };
    addSheet(data.inventory.filter(i => i.warehouseId === activeId), "1. Inventario CPP");
    addSheet(data.movements.filter(m => m.warehouseId === activeId), "2. Movimientos Kárdex");
    addSheet(data.laborLogs.filter(l => l.warehouseId === activeId), "3. Nómina de Campo");
    addSheet(data.harvests.filter(h => h.warehouseId === activeId), "4. Cosechas y Ventas");
    addSheet(data.costCenters.filter(c => c.warehouseId === activeId), "5. Lotes (Centros Costo)");
    addSheet(data.personnel.filter(p => p.warehouseId === activeId), "6. Personal");
    addSheet(data.assets.filter(a => a.warehouseId === activeId), "7. Activos Fijos");
    addSheet(data.maintenanceLogs.filter(m => m.warehouseId === activeId), "8. Mantenimientos");
    const budgetItemsFlat = data.budgets?.flatMap(b => b.items.map(i => ({...i, planId: b.id, year: b.year, costCenterId: b.costCenterId, months: i.months.join(',')}))) || [];
    addSheet(budgetItemsFlat, "9. Detalle Presupuesto");
    XLSX.writeFile(wb, `Reporte_Integral_${warehouseName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generatePaymentReceipt = (name: string, logs: LaborLog[], warehouseName: string): void => {
    const doc = new jsPDF();
    let y = addHeader(doc, "RECIBO DE PAGO", `Liquidación para ${name}`, warehouseName, BRAND_COLORS.amber);
    const total = logs.reduce((sum, log) => sum + log.value, 0);
    doc.setFontSize(10);
    doc.setTextColor(50, 50, 50);
    doc.text(`Fecha de Liquidación: ${new Date().toLocaleDateString()}`, 15, y);
    doc.text(`Total a Pagar: ${formatCurrency(total)}`, 15, y + 7);
    y += 20;
    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Labor', 'Lote', 'Valor']],
        body: logs.map(l => [new Date(l.date).toLocaleDateString(), l.activityName, l.costCenterName, formatCurrency(l.value)]),
        foot: [['', '', 'Total Neto', formatCurrency(total)]],
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.slate },
        footStyles: { fillColor: BRAND_COLORS.slate, textColor: 255, fontStyle: 'bold' }
    });
    y = (doc as any).lastAutoTable.finalY + 20;
    doc.text("Recibí a satisfacción:", 15, y);
    doc.line(15, y + 20, 100, y + 20); 
    doc.text(name, 15, y + 25);
    doc.text(`C.C. [Documento]`, 15, y + 30);
    addFooter(doc);
    doc.save(`Recibo_Pago_${name.replace(/\s/g, '_')}.pdf`);
};

export const generateFieldTemplates = (data: AppState, b: boolean): void => {
    const doc = new jsPDF();
    addHeader(doc, "PLANILLAS DE CAMPO", "Registro Manual de Labores", "BPA ICA");
    doc.setFontSize(12); doc.text("Planilla de Cosecha Semanal", 14, 60);
    autoTable(doc, { startY: 65, head: [['Trabajador', 'Lunes', 'Martes', 'Miér', 'Jueves', 'Viernes', 'Sábado', 'Total Kg']], body: [['', '', '', '', '', '', '', '']], theme: 'grid' });
    addFooter(doc);
    doc.save("Planillas_Fisicas.pdf");
};

export const generateManualPDF = (): void => {
    const doc = new jsPDF();
    let y = addHeader(doc, "MANUAL DE USUARIO", "Guía de Uso DatosFinca Viva", "Documentación Oficial");
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("1. Introducción al Sistema", 14, y);
    y += 7;
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const introText = "DatosFinca Viva es un sistema integral de gestión agrícola (ERP) que permite llevar el control total de una finca desde el dispositivo móvil, funcionando 100% offline y con almacenamiento local seguro.";
    const splitIntro = doc.splitTextToSize(introText, 180);
    doc.text(splitIntro, 14, y);
    y += (splitIntro.length * 5) + 5;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("2. Módulos Principales", 14, y);
    y += 7;

    const modules = [
        ["Bodega e Inventario", "Control de insumos con Costo Promedio Ponderado (CPP)."],
        ["Gestión de Personal", "Registro de jornales, cuadrillas y liquidación de nómina."],
        ["Cosecha y Ventas", "Registro de producción por lote y calidad (Pergamino, Pasilla)."],
        ["Labores de Campo", "Programación y ejecución de actividades agronómicas."],
        ["Finanzas y Costos", "Análisis de rentabilidad, P&G y flujo de caja."]
    ];

    autoTable(doc, {
        startY: y,
        head: [['Módulo', 'Descripción']],
        body: modules,
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.primary },
        styles: { fontSize: 10 }
    });
    
    y = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("3. Seguridad y Datos", 14, y);
    y += 7;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    const secText = "El sistema opera bajo una política 'Local-First'. Los datos residen en el dispositivo del usuario. Se recomienda realizar copias de seguridad (Backup JSON) periódicamente desde el menú de configuración.";
    const splitSec = doc.splitTextToSize(secText, 180);
    doc.text(splitSec, 14, y);

    addFooter(doc);
    doc.save("Manual_Usuario_DatosFinca_Viva.pdf");
};

// Stub for now
export const generateFinancialReport = (data: AppState) => generateExecutiveReport(data);
export const generateGlobalReport = (data: AppState) => generateExecutiveReport(data);

export const getDemoData = (): AppState => {
  const WAREHOUSE_ID = 'demo_finca_esperanza_v3';
  const TODAY = new Date();
  
  // --- 1. MASTER DATA ---
  const warehouse: Warehouse = { id: WAREHOUSE_ID, name: "Finca La Esperanza", created: new Date().toISOString(), ownerId: 'demo_user' };
  
  const suppliers = [
      { id: 'sup1', warehouseId: WAREHOUSE_ID, name: 'Agroinsumos del Café', phone: '3105551234', address: 'Plaza Principal' },
      { id: 'sup2', warehouseId: WAREHOUSE_ID, name: 'Cooperativa de Caficultores', phone: '3125556789', address: 'Km 2 Vía al Valle' }
  ];

  const personnel: Personnel[] = [
      { id: 'p1', warehouseId: WAREHOUSE_ID, name: 'José Martínez', role: 'Mayordomo', documentId: '1053123456', phone: '3201112233' },
      { id: 'p2', warehouseId: WAREHOUSE_ID, name: 'Carlos Pérez', role: 'Recolector', documentId: '98765432' },
      { id: 'p3', warehouseId: WAREHOUSE_ID, name: 'Ana López', role: 'Varios/Cocina', documentId: '12345678' },
      { id: 'p4', warehouseId: WAREHOUSE_ID, name: 'Pedro Gómez', role: 'Contratista Podas', documentId: '87654321' }
  ];

  const costCenters: CostCenter[] = [
      { id: 'lot1', warehouseId: WAREHOUSE_ID, name: 'Lote 1 - El Guayabo', area: 3.5, stage: 'Produccion', cropType: 'Café', plantCount: 15000, productionArea: 3.5 },
      { id: 'lot2', warehouseId: WAREHOUSE_ID, name: 'Lote 2 - La Peña', area: 1.8, stage: 'Levante', cropType: 'Café', plantCount: 8000, accumulatedCapex: 12500000 },
      { id: 'lot3', warehouseId: WAREHOUSE_ID, name: 'Lote 3 - El Bajo', area: 1.0, stage: 'Produccion', cropType: 'Plátano', plantCount: 1000 }
  ];

  const activities: Activity[] = [
      { id: 'act1', warehouseId: WAREHOUSE_ID, name: 'Recolección', costClassification: 'COFFEE' },
      { id: 'act2', warehouseId: WAREHOUSE_ID, name: 'Fertilización', costClassification: 'JOINT' },
      { id: 'act3', warehouseId: WAREHOUSE_ID, name: 'Plateo (Guadaña)', costClassification: 'JOINT' },
      { id: 'act4', warehouseId: WAREHOUSE_ID, name: 'Fumigación Broca', costClassification: 'COFFEE' },
      { id: 'act5', warehouseId: WAREHOUSE_ID, name: 'Mantenimiento Beneficio', costClassification: 'JOINT' }
  ];

  // --- 2. INVENTORY & MOVEMENTS ---
  let inventory: InventoryItem[] = [
      { id: 'inv1', warehouseId: WAREHOUSE_ID, name: 'Urea', category: Category.FERTILIZANTE, baseUnit: 'g', currentQuantity: 0, averageCost: 0, lastPurchasePrice: 135000, lastPurchaseUnit: Unit.BULTO_50KG },
      { id: 'inv2', warehouseId: WAREHOUSE_ID, name: 'DAP 18-46-0', category: 'Fertilizante' as Category, baseUnit: 'g', currentQuantity: 0, averageCost: 0, lastPurchasePrice: 180000, lastPurchaseUnit: Unit.BULTO_50KG },
      { id: 'inv3', warehouseId: WAREHOUSE_ID, name: 'Glifosato', category: 'Herbicida' as Category, baseUnit: 'ml', currentQuantity: 0, averageCost: 0, lastPurchasePrice: 45000, lastPurchaseUnit: Unit.LITRO, safetyIntervalDays: 15 },
      { id: 'inv4', warehouseId: WAREHOUSE_ID, name: 'Verdadero 600', category: 'Fungicida' as Category, baseUnit: 'g', currentQuantity: 0, averageCost: 0, lastPurchasePrice: 85000, lastPurchaseUnit: Unit.KILO, safetyIntervalDays: 21 },
      { id: 'inv5', warehouseId: WAREHOUSE_ID, name: 'BrocaX', category: 'Insecticida' as Category, baseUnit: 'ml', currentQuantity: 0, averageCost: 0, lastPurchasePrice: 120000, lastPurchaseUnit: Unit.LITRO, safetyIntervalDays: 30 }
  ];

  let movements: Movement[] = [];

  // Simulate buying stock 3 months ago
  const buyStock = (itemIdx: number, qty: number, price: number, dateOffset: number, supplierIdx: number) => {
      const item = inventory[itemIdx];
      const date = new Date(TODAY);
      date.setDate(date.getDate() - dateOffset);
      
      const mov: Movement = {
          id: generateId(),
          warehouseId: WAREHOUSE_ID,
          itemId: item.id,
          itemName: item.name,
          type: 'IN',
          quantity: qty,
          unit: item.lastPurchaseUnit,
          calculatedCost: qty * price,
          date: date.toISOString(),
          supplierId: suppliers[supplierIdx].id,
          supplierName: suppliers[supplierIdx].name,
          invoiceNumber: `FACT-${Math.floor(Math.random() * 10000)}`
      };
      
      const res = processInventoryMovement(inventory, mov, price);
      inventory = res.updatedInventory;
      movements.push(mov);
  };

  buyStock(0, 20, 130000, 90, 0); // 20 Bultos Urea
  buyStock(1, 15, 175000, 85, 1); // 15 Bultos DAP
  buyStock(2, 10, 42000, 80, 0); // 10 Litros Glifo
  buyStock(0, 10, 140000, 45, 1); // 10 Bultos Urea (Precio subió)
  buyStock(4, 5, 125000, 30, 0); // 5 Litros BrocaX

  // Simulate usage (Outputs)
  const useStock = (itemIdx: number, qty: number, lotIdx: number, dateOffset: number, note: string) => {
      const item = inventory[itemIdx];
      const date = new Date(TODAY);
      date.setDate(date.getDate() - dateOffset);
      
      const unit = item.lastPurchaseUnit === Unit.BULTO_50KG ? Unit.KILO : item.lastPurchaseUnit; // Use smaller unit for output
      const qtyBase = convertToBase(qty, unit); // e.g., 50kg
      const cost = qtyBase * item.averageCost;

      const mov: Movement = {
          id: generateId(),
          warehouseId: WAREHOUSE_ID,
          itemId: item.id,
          itemName: item.name,
          type: 'OUT',
          quantity: qty,
          unit: unit,
          calculatedCost: cost,
          date: date.toISOString(),
          costCenterId: costCenters[lotIdx].id,
          costCenterName: costCenters[lotIdx].name,
          notes: note,
          phiApplied: item.safetyIntervalDays
      };

      const res = processInventoryMovement(inventory, mov);
      inventory = res.updatedInventory;
      movements.push(mov);
  };

  useStock(0, 500, 0, 70, "Abonada Lote Producción"); // 500kg Urea
  useStock(1, 200, 1, 60, "Abonada Levante"); 
  useStock(2, 2, 0, 50, "Control Maleza"); // 2 Litros Glifo
  useStock(4, 1, 0, 10, "Control Broca Foco"); // 1 Litro Insecticida (Recent!)

  // --- 3. LABOR LOGS (MASSIVE) ---
  const laborLogs: LaborLog[] = [];
  
  // Loop last 12 weeks
  for (let i = 0; i < 12; i++) {
      const weekDate = new Date(TODAY);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      const dateStr = weekDate.toISOString();

      // Mayordomo (Fixed Salary-ish)
      laborLogs.push({
          id: generateId(), warehouseId: WAREHOUSE_ID, date: dateStr, personnelId: 'p1', personnelName: 'José Martínez',
          activityId: 'act5', activityName: 'Administración', costCenterId: 'lot1', costCenterName: 'General',
          value: 450000, paid: true, notes: 'Semana Mayordomía'
      });

      // Recolector (Harvest Season Logic)
      if (i < 8) { // Peak harvest was 2 months ago
          laborLogs.push({
              id: generateId(), warehouseId: WAREHOUSE_ID, date: dateStr, personnelId: 'p2', personnelName: 'Carlos Pérez',
              activityId: 'act1', activityName: 'Recolección', costCenterId: 'lot1', costCenterName: 'Lote 1 - El Guayabo',
              value: Math.floor(Math.random() * 300000) + 200000, paid: true, notes: 'Pago al Kilo'
          });
      }

      // HOURLY LABOR EXAMPLE (New Feature)
      if (i % 2 === 0) {
          laborLogs.push({
              id: generateId(), warehouseId: WAREHOUSE_ID, date: dateStr, personnelId: 'p4', personnelName: 'Pedro Gómez',
              activityId: 'act3', activityName: 'Mantenimiento', costCenterId: 'lot2', costCenterName: 'Lote 2 - La Peña',
              value: 120000, paid: true, 
              hoursWorked: 8, hourlyRate: 15000, // 8 hours * 15k
              notes: 'Poda de Formación por Horas'
          });
      }
  }

  // --- 4. HARVESTS ---
  const harvests: HarvestLog[] = [];
  // Simulate 8 weeks of harvest
  for (let i = 0; i < 8; i++) {
      const weekDate = new Date(TODAY);
      weekDate.setDate(weekDate.getDate() - (i * 7) - 10);
      
      const kg = Math.floor(Math.random() * 500) + 200; // 200-700kg per week
      const price = 2400000 / 125; // Base price per kg roughly
      
      harvests.push({
          id: generateId(), warehouseId: WAREHOUSE_ID, date: weekDate.toISOString(),
          costCenterId: 'lot1', costCenterName: 'Lote 1 - El Guayabo', cropName: 'Café Cereza',
          quantity: kg, unit: 'Kg', totalValue: kg * price,
          notes: `Pase Semana ${i+1}`
      });
  }

  // --- 5. RAIN & OTHERS ---
  const rainLogs: RainLog[] = [];
  for (let i = 0; i < 30; i++) {
      if (Math.random() > 0.5) {
          const d = new Date(TODAY);
          d.setDate(d.getDate() - i);
          rainLogs.push({
              id: generateId(), warehouseId: WAREHOUSE_ID, date: d.toISOString(),
              millimeters: Math.floor(Math.random() * 50)
          });
      }
  }

  const financeLogs: FinanceLog[] = [
      { id: 'fin1', warehouseId: WAREHOUSE_ID, date: new Date().toISOString(), type: 'EXPENSE', category: 'Servicios', amount: 150000, description: 'Energía Eléctrica Beneficio' },
      { id: 'fin2', warehouseId: WAREHOUSE_ID, date: new Date().toISOString(), type: 'EXPENSE', category: 'Impuestos', amount: 450000, description: 'Predial Parcial' }
  ];

  return {
      warehouses: [warehouse],
      activeWarehouseId: WAREHOUSE_ID,
      inventory,
      movements,
      suppliers,
      costCenters,
      personnel,
      activities,
      laborLogs,
      harvests,
      machines: [],
      maintenanceLogs: [],
      rainLogs,
      financeLogs,
      soilAnalyses: [],
      ppeLogs: [],
      wasteLogs: [],
      agenda: [],
      phenologyLogs: [],
      pestLogs: [],
      plannedLabors: [],
      budgets: [],
      swot: { f:'Suelos volcánicos ricos.', o:'Precios internacionales al alza.', d:'Vías de acceso en mal estado.', a:'Fenómeno del Niño.' },
      bpaChecklist: { '1.1': true, '1.2': true, '3.1': true }, // Some checked items
      assets: [],
      laborFactor: 1.0,
      adminPin: '1234' // Default demo pin
  };
};
