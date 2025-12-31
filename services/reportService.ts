
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style'; 
import { AppState, LaborLog, HarvestLog, Movement, InventoryItem, Unit, Category, CostCenter, Personnel, Activity, PhenologyLog, PestLog, Machine, Asset, MaintenanceLog, RainLog, FinanceLog, SoilAnalysis, PPELog, WasteLog, AgendaEvent, CostClassification, Warehouse, PlannedLabor } from '../types';
import { formatCurrency, generateId, convertToBase, getBaseUnitType, processInventoryMovement } from './inventoryService';

const BRAND_COLORS = {
    primary: [5, 150, 105] as [number, number, number],
    slate: [15, 23, 42] as [number, number, number],
    amber: [245, 158, 11] as [number, number, number],
    red: [220, 38, 38] as [number, number, number],
    indigo: [79, 70, 229] as [number, number, number],
    purple: [147, 51, 234] as [number, number, number], // FIX: Corrected array literal
};

const AUTHOR = "Lucas Mateo Tabares Franco";

const addHeader = (doc: jsPDF, title: string, subtitle: string, warehouse: string, color = BRAND_COLORS.primary): number => {
    doc.setFillColor(...color);
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(title, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${subtitle} | Sede: ${warehouse}`, 105, 30, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`DatosFinca Viva - Documento Técnico v2.5`, 105, 38, { align: 'center' }); // Updated name
    return 50;
};

const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount} | Generado por DatosFinca Viva © 2025`, 105, 290, { align: 'center' }); // Updated name
    }
};

// --- MOTOR DE INGENIERÍA DE DATOS SQL RELACIONAL ---

// Fix: Explicitly declare the return type as 'void'
export const generateSQLDump = (data: AppState): void => {
    const fileName = `DatosFinca_Viva_MasterBackup_${new Date().toISOString().split('T')[0]}.sql`; // Updated name
    let sql = `-- =============================================================================\n`;
    sql += `-- DATOSFINCA VIVA - RELATIONAL DATABASE EXPORT (SQLITE COMPATIBLE)\n`; // Updated name
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

    // DML - Inserción de Datos
    sql += `-- INSERCIÓN DE DATOS DE FINCA\n`;
    data.warehouses.forEach(w => {
        sql += `INSERT INTO fincas VALUES ('${w.id}', ${escape(w.name)}, '${w.created}');\n`;
    });

    data.costCenters.forEach(c => {
        sql += `INSERT INTO lotes VALUES ('${c.id}', '${c.warehouseId}', ${escape(c.name)}, ${c.area}, ${escape(c.cropType)}, ${escape(c.associatedCrop)}, '${c.stage}');\n`;
    });

    data.inventory.forEach(i => {
        sql += `INSERT INTO insumos VALUES ('${i.id}', '${i.warehouseId}', ${escape(i.name)}, '${i.category}', '${i.baseUnit}', ${i.currentQuantity}, ${i.averageCost}, ${i.safetyIntervalDays || 0});\n`;
    });

    data.movements.forEach(m => {
        sql += `INSERT INTO movimientos VALUES ('${m.id}', '${m.itemId}', '${m.type}', ${m.quantity}, '${m.unit}', ${m.calculatedCost}, '${m.date}', ${escape(m.costCenterId)}, ${m.phiApplied || 0});\n`;
        
        // Si es una salida con PC, registrar en aplicaciones para blindaje
        if (m.type === 'OUT' && m.phiApplied) {
            const safeDate = new Date(m.date);
            safeDate.setDate(safeDate.getDate() + m.phiApplied);
            sql += `INSERT INTO aplicaciones VALUES ('APP_${m.id}', '${m.costCenterId}', '${m.itemId}', '${m.date.split('T')[0]}', ${m.phiApplied}, '${safeDate.toISOString().split('T')[0]}');\n`;
        }
    });

    data.laborLogs.forEach(l => {
        sql += `INSERT INTO nomina (id, personal_id, lote_id, fecha, valor_base) VALUES ('${l.id}', '${l.personnelId}', '${l.costCenterId}', '${l.date}', ${l.value});\n`;
    });

    data.harvests.forEach(h => {
        sql += `INSERT INTO cosechas VALUES ('${h.id}', '${h.costCenterId}', ${escape(h.cropName)}, ${h.quantity}, ${h.totalValue}, '${h.date}');\n`;
    });

    // Generar archivo
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
};

// Fix: Explicitly declare the return type as 'void'
export const generateExecutiveReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    addHeader(doc, "DOSSIER ESTRATÉGICO", "Reporte de Gestión Gerencial", activeW?.name || "");
    // TODO: Add content for SWOT, KPIs, etc.
    addFooter(doc);
    doc.save(`Reporte_Gerencial_${activeW?.name}.pdf`);
};

// Fix: Explicitly declare the return type as 'void'
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
    doc.save("Inventario_DatosFinca.pdf"); // Updated name
};

// Fix: Explicitly declare the return type as 'void'
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

    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFontSize(10);
    doc.text(`Costo Real Empresa (Factor ${data.laborFactor}): ${formatCurrency(totalCost * data.laborFactor)}`, 14, y);

    addFooter(doc);
    doc.save(`Reporte_Nomina_${activeW?.name}.pdf`);
};

// Fix: Explicitly declare the return type as 'void'
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

// Fix: Explicitly declare the return type as 'void'
export const generateFinancialReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "ESTADO DE RESULTADOS (P&G)", "Análisis de Rentabilidad Operativa", activeW?.name || "", [71, 85, 105]); // Indigo color
    
    const income = data.harvests.reduce((sum, h) => sum + h.totalValue, 0);
    const laborCost = data.laborLogs.reduce((sum, l) => sum + l.value, 0) * data.laborFactor;
    const supplyCost = data.movements.filter(m => m.type === 'OUT').reduce((sum, m) => sum + m.calculatedCost, 0);
    const totalCosts = laborCost + supplyCost;
    const profit = income - totalCosts;

    autoTable(doc, {
        startY: y,
        head: [['Concepto', 'Tipo', 'Valor']],
        body: [
            ['Ingresos por Cosecha', 'Ingreso', formatCurrency(income)],
            ['Costo Mano de Obra (Real)', 'Egreso', `-${formatCurrency(laborCost)}`],
            ['Costo Insumos Aplicados', 'Egreso', `-${formatCurrency(supplyCost)}`],
        ],
        foot: [['', 'Utilidad Operativa', formatCurrency(profit)]],
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.slate },
        footStyles: { fillColor: profit > 0 ? BRAND_COLORS.primary : BRAND_COLORS.red, textColor: 255, fontStyle: 'bold' },
        didParseCell: (data) => {
            if (data.section === 'body') {
                data.cell.styles.textColor = data.row.raw[1] === 'Ingreso' ? BRAND_COLORS.primary : BRAND_COLORS.red;
            }
        }
    });

    addFooter(doc);
    doc.save(`Reporte_Financiero_${activeW?.name}.pdf`);
};

// NEW: Budget Execution Report
export const generateBudgetReport = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "CONTROL PRESUPUESTAL", "Ejecución vs. Planeación", activeW?.name || "", [79, 70, 229]); // Indigo
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

        // Calculated Planned
        let planned = 0;
        lotBudget.items.forEach(i => {
            planned += i.unitCost * i.quantityPerHa * lot.area * i.months.length;
        });

        // Calculate Real
        const realLabor = data.laborLogs
            .filter(l => l.costCenterId === lot.id && new Date(l.date).getFullYear() === currentYear)
            .reduce((sum, l) => sum + (l.value * data.laborFactor), 0);
        
        const realSupplies = data.movements
            .filter(m => m.costCenterId === lot.id && m.type === 'OUT' && new Date(m.date).getFullYear() === currentYear)
            .reduce((sum, m) => sum + m.calculatedCost, 0);
        
        const totalReal = realLabor + realSupplies;
        const diff = planned - totalReal;
        const percent = planned > 0 ? (totalReal / planned) * 100 : 0;

        return [
            lot.name,
            formatCurrency(planned),
            formatCurrency(totalReal),
            formatCurrency(diff),
            `${percent.toFixed(1)}%`
        ];
    }).filter(row => row !== null);

    autoTable(doc, {
        startY: y,
        head: [['Lote / Centro de Costo', 'Presupuestado', 'Ejecutado Real', 'Diferencia (Saldo)', '% Ejecución']],
        body: rows as any[], // Typing cast for simplicity
        theme: 'grid',
        headStyles: { fillColor: [79, 70, 229] },
        didParseCell: (data) => {
            // Highlight over budget rows
            if (data.section === 'body' && data.column.index === 4) {
                const val = parseFloat(data.cell.raw.toString().replace('%',''));
                if (val > 100) data.cell.styles.textColor = [220, 38, 38]; // Red
                else data.cell.styles.textColor = [5, 150, 105]; // Green
            }
        }
    });

    addFooter(doc);
    doc.save(`Reporte_Presupuesto_${activeW?.name}.pdf`);
};

// Fix: Explicitly declare the return type as 'void'
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
            if (ws[address]) {
                ws[address].s = headerStyle;
            }
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
    
    // Add Budget Sheet
    const budgetItemsFlat = data.budgets?.flatMap(b => b.items.map(i => ({
        ...i, 
        planId: b.id, 
        year: b.year, 
        costCenterId: b.costCenterId,
        months: i.months.join(',')
    }))) || [];
    addSheet(budgetItemsFlat, "9. Detalle Presupuesto");

    XLSX.writeFile(wb, `Reporte_Integral_${warehouseName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// Fix: Explicitly declare the return type as 'void'
export const generateManualPDF = (): void => {
    const doc = new jsPDF();
    const margin = 15;
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;
    let y = 0;

    const checkPageBreak = (currentY: number, requiredSpace: number = 30) => {
        if (currentY > pageHeight - requiredSpace) {
            addFooter(doc);
            doc.addPage();
            return 20;
        }
        return currentY;
    };

    const addTitle = (text: string, yPos: number, size: number = 16, color: [number, number, number] = BRAND_COLORS.primary) => {
        yPos = checkPageBreak(yPos);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(size);
        doc.setTextColor(...color);
        doc.text(text, margin, yPos);
        return yPos + (size * 0.5);
    };

    const addParagraph = (text: string, yPos: number, size: number = 10, indent: number = 0) => {
        yPos = checkPageBreak(yPos);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(size);
        doc.setTextColor(50, 50, 50);
        const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2) - indent);
        doc.text(splitText, margin + indent, yPos);
        return yPos + (splitText.length * (size * 0.4));
    };

    const addListItem = (text: string, yPos: number) => {
        yPos = checkPageBreak(yPos);
        doc.setFontSize(10);
        doc.setTextColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
        doc.text("•", margin, yPos);
        doc.setTextColor(50, 50, 50);
        const splitText = doc.splitTextToSize(text, pageWidth - (margin * 2) - 5);
        doc.text(splitText, margin + 5, yPos);
        return yPos + (splitText.length * 5);
    }
    
    // --- COVER PAGE ---
    doc.setFillColor(...BRAND_COLORS.primary);
    doc.rect(0, 0, pageWidth, pageHeight, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(36);
    doc.text("DATOSFINCA VIVA", pageWidth / 2, 100, { align: 'center' }); // Updated name
    doc.setFontSize(14);
    doc.text("Descripción del Programa", pageWidth / 2, 115, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("La Revolución Digital del Agro Colombiano", pageWidth / 2, 125, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Versión 2.5 | © 2025 ${AUTHOR}`, pageWidth / 2, 250, { align: 'center' });
    doc.addPage();
    y = 20;

    // --- PAGE 1: EXECUTIVE SUMMARY ---
    y = addTitle("1. Resumen Ejecutivo: La Finca como Empresa", y);
    y = addParagraph("DatosFinca Viva es un Sistema de Planificación de Recursos Empresariales (ERP) diseñado para el sector agrícola, que opera bajo una filosofía de 'Dato-Decisión'. Su propósito es empoderar al productor para que transcienda la gestión operativa y adopte un rol de gerente estratégico, fundamentando cada acción en un análisis financiero robusto y en tiempo real.", y + 5); // Updated name
    y = addParagraph("El sistema se distingue por su arquitectura de seguridad 'Local-First', garantizando que los datos sensibles del negocio (costos, nómina, rentabilidad) residen exclusivamente en su dispositivo. Este enfoque no solo asegura la máxima confidencialidad, sino que también otorga al productor la soberanía total sobre su información, en cumplimiento con la Ley 1581 de Habeas Data.", y + 5);
    y = addParagraph("La propuesta de valor se centra en tres pilares: Rigor Financiero, Análisis de Datos y Cumplimiento Normativo, convirtiendo la recolección de datos de campo en una ventaja competitiva tangible.", y + 5);
    doc.addPage();
    y = 20;

    // --- PAGE 2: CORE FINANCIAL ENGINE ---
    y = addTitle("2. El Motor Financiero: Precisión Contable", y);
    y = addTitle("2.1 Costo Promedio Ponderado (CPP)", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("A diferencia de los sistemas de registro tradicionales, DatosFinca Viva implementa el CPP, el método contable estándar para la valoración de inventarios. Cuando se ingresa una nueva compra de un insumo a un precio diferente, el sistema recalcula automáticamente el costo real de cada unidad en bodega. Esto asegura que el costo asignado a cada lote en una aplicación sea financieramente exacto, eliminando distorsiones en el cálculo de la rentabilidad.", y + 5); // Updated name
    y = addTitle("2.2 Costeo Dual de Mano de Obra (Factor Laboral)", y + 10, 12, BRAND_COLORS.slate);
    y = addParagraph("Reconociendo las diversas realidades contractuales del campo, la app ofrece un sistema de costeo dual:", y + 5);
    y = addListItem("Factor 1.0 (Costo Directo): Registra el valor exacto pagado al trabajador, ideal para modelos de jornal informal.", y + 8);
    y = addListItem("Factor 1.52 (Costo Empresarial): Proyecta el costo real de un empleado formal, incluyendo el 'salario emocional' (prestaciones, parafiscales, seguridad social). Este factor es configurable y permite al productor simular su transición a un modelo empresarial formal, entendiendo su impacto en la estructura de costos.", y + 5);
    doc.addPage();
    y = 20;

    // --- PAGES 3-6: MODULE GUIDES ---
    y = addTitle("3. Módulo de Bodega: El Corazón del Costeo", y, 16, BRAND_COLORS.slate);
    y = addParagraph("Controla el flujo de insumos y su impacto financiero.", y+5);
    y = addListItem("Entradas (IN): Se registran las compras, actualizando el CPP del producto. Permite adjuntar una foto de la factura como soporte para auditorías.", y+8);
    y = addListItem("Salidas (OUT): Se asignan insumos a un Centro de Costo (Lote). El sistema debita el stock y carga el costo preciso al cultivo, alimentando el Estado de Resultados por Lote.", y+5);
    y = addListItem("Blindaje BPA (PHI): Al dar salida a agroquímicos, se registra el Periodo de Carencia (PC). El sistema cruzará esta información con las fechas de cosecha para emitir alertas de inocuidad.", y+5);
    doc.addPage(); y = 20;
    
    y = addTitle("4. Módulo de Personal: Trazabilidad y Legalidad", y, 16, BRAND_COLORS.amber);
    y = addParagraph("Gestiona el recurso humano, el costo más significativo de la operación agrícola.", y+5);
    y = addListItem("Registro de Jornales: Asocia cada pago a un trabajador, una labor y un lote, permitiendo un análisis granular de la eficiencia.", y+8);
    y = addListItem("Liquidación de Nómina: Consolida los jornales pendientes por trabajador y genera un Recibo de Pago en PDF con un clic. Este documento es un soporte legal ante posibles reclamaciones y requerimientos de la UGPP.", y + 5);
    doc.addPage(); y = 20;

    y = addTitle("5. Módulo de Ventas: De la Cosecha al Ingreso", y);
    y = addParagraph("Cierra el ciclo productivo, conectando la producción con la rentabilidad.", y+5);
    y = addListItem("Trazabilidad por Lote: Cada venta se vincula a su lote de origen, requisito indispensable para certificaciones de calidad.", y+8);
    y = addListItem("Escáner de Seguridad Alimentaria: Antes de confirmar el registro, el sistema verifica si el lote tiene Periodos de Carencia activos. Si existe un riesgo, emite una alerta crítica para prevenir la venta de producto contaminado, protegiendo al consumidor y la reputación de la finca.", y+5);
    doc.addPage(); y = 20;
    
    y = addTitle("6. Módulo de Campo: Activos y Cumplimiento", y, 16, BRAND_COLORS.indigo);
    y = addParagraph("Administra la infraestructura y el cumplimiento normativo.", y+5);
    y = addListItem("Depreciación de Activos: Permite registrar maquinaria e infraestructura con su valor de compra y vida útil. La app calcula automáticamente la depreciación mensual, un costo no monetario que a menudo se ignora, pero que es fundamental para entender la rentabilidad neta y planificar la reinversión a largo plazo.", y+8);
    y = addListItem("Radar BPA/ICA: Un checklist interactivo basado en la normativa colombiana (Res. 082394) que permite autoevaluar el nivel de cumplimiento y detectar brechas críticas para la certificación.", y+5);
    doc.addPage(); y = 20;

    // --- PAGE 7: BI ENGINE ---
    y = addTitle("7. Motor de Análisis de Datos", y);
    y = addParagraph("El tablero de control gerencial que convierte los datos operativos en inteligencia accionable. Opera en tres niveles:", y+5);
    y = addTitle("7.1 Performance", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Calcula el Estado de Resultados (P&G) para cada lote, revelando la utilidad operativa y el margen de rentabilidad. Identifica cuáles son los 'lotes estrella' y cuáles operan a pérdida.", y+5, 5);
    y = addTitle("7.2 Data Mining", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Esta funcionalidad analítica permite identificar patrones y correlaciones en los datos registrados. Por ejemplo, puede sugerir un lote donde la relación costo-insumo/ingreso-venta es anómalamente alta, lo que podría indicar una sobre-fertilización o un problema de absorción de nutrientes que requiere una revisión técnica en campo.", y+5, 5);
    y = addTitle("7.3 Benchmarking", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Compara indicadores clave de la finca, como el porcentaje de participación de la mano de obra en los costos totales, contra promedios técnicos de la región (Ej: datos de Evaluaciones Agropecuarias para Caldas). Esto ofrece una medida objetiva de la competitividad y eficiencia de la operación.", y+5, 5);
    doc.addPage(); y = 20;
    
    // --- PAGE 8: AI ASSISTANT --- (REMOVED CONTENT)
    y = addTitle("8. Automatización de Procesos: Eficiencia sin IA", y, 16, BRAND_COLORS.purple);
    y = addParagraph("La aplicación optimiza la captura y el análisis de datos a través de funcionalidades automatizadas que no requieren de inteligencia artificial externa:", y+5);
    y = addListItem("Detección de Datos en Facturas: Utiliza el escaneo de imágenes para identificar y pre-rellenar campos en los registros de compras, agilizando el ingreso de insumos al inventario.", y+8);
    y = addListItem("Asistencia de Registro por Voz: Permite dictar información para crear registros de operaciones, facilitando la captura de datos directamente en campo.", y+5);
    y = addListItem("Alertas de Seguridad Alimentaria: Automatiza el cruce de fechas de aplicación de agroquímicos con fechas de cosecha para emitir alertas de Periodo de Carencia (PC), garantizando la inocuidad de los productos.", y+5);
    doc.addPage(); y = 20;

    // --- PAGE 9: DATA MANAGEMENT ---
    y = addTitle("9. Centro de Datos: Soberanía y Escalabilidad", y, 16, BRAND_COLORS.amber);
    y = addParagraph("La gestión de datos se basa en la portabilidad y la seguridad, ofreciendo dos formatos de exportación con propósitos distintos:", y+5);
    y = addTitle("9.1 Backup Rápido (JSON)", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Crea una 'fotografía' completa de todos los datos de su cuenta. Su única función es la portabilidad y la restauración: permite mover toda la información a un nuevo dispositivo (mediante importación) o recuperarla tras un reinicio de la aplicación.", y+5, 5);
    y = addTitle("9.2 Exportación Relacional (SQL)", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Genera un volcado de la base de datos en un formato estándar compatible con sistemas de análisis externos como Power BI, Tableau o bases de datos corporativas. Este archivo está diseñado para la escalabilidad, auditorías profundas y la integración con otros sistemas empresariales. No puede ser restaurado directamente en la app.", y+5, 5);
    doc.addPage(); y = 20;

    // --- PAGE 10: LEGAL & COMPLIANCE ---
    y = addTitle("10. Cumplimiento Normativo: Marco Colombia", y);
    y = addParagraph("DatosFinca Viva ha sido desarrollado con un profundo conocimiento del marco legal colombiano para ofrecer seguridad jurídica al productor:", y+5); // Updated name
    y = addListItem("Ley 1581 de 2012 (Habeas Data): La arquitectura 'Local-First' es la máxima garantía de cumplimiento, ya que sus datos personales residen exclusivamente en su dispositivo, sin transferencia a servidores de terceros de DatosFinca Viva.", y+8); // Updated name
    y = addListItem("Ley 23 de 1982 (Derechos de Autor): El software está protegido y su uso se rige por una licencia personal e intransferible.", y+5);
    y = addListItem("Ley 1480 de 2011 (Estatuto del Consumidor): Se garantizan los derechos de retracto y reversión de pago en las suscripciones a través de las plataformas oficiales (Google Play Store).", y+5);
    y = addListItem("Normativa ICA y UGPP: Las funcionalidades de la app, como el registro de PHI y la generación de recibos de pago, están diseñadas para generar los soportes documentales exigidos por estas entidades de control.", y+5);

    addFooter(doc);
    doc.save("Descripcion_Programa_DatosFinca_Viva.pdf");
};

// Fix: Explicitly declare the return type as 'void'
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
        body: logs.map(l => [
            new Date(l.date).toLocaleDateString(), 
            l.activityName, 
            l.costCenterName, 
            formatCurrency(l.value)
        ]),
        foot: [['', '', 'Total Neto', formatCurrency(total)]],
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.slate },
        footStyles: { fillColor: BRAND_COLORS.slate, textColor: 255, fontStyle: 'bold' }
    });

    y = (doc as any).lastAutoTable.finalY + 20;
    doc.text("Recibí a satisfacción:", 15, y);
    doc.line(15, y + 20, 100, y + 20); // Signature line
    doc.text(name, 15, y + 25);
    doc.text(`C.C. [Documento]`, 15, y + 30);

    addFooter(doc);
    doc.save(`Recibo_Pago_${name.replace(/\s/g, '_')}.pdf`);
};

// Fix: Explicitly declare the return type as 'void'
export const generateGlobalReport = (data: AppState): void => generateExecutiveReport(data);
// Fix: Explicitly declare the return type as 'void'
export const generateFieldTemplates = (data: AppState, b: boolean): void => {
    const doc = new jsPDF();
    addHeader(doc, "PLANILLAS DE CAMPO", "Registro Manual de Labores", "BPA ICA");
    // TODO: Add printable forms
    addFooter(doc);
    doc.save("Planillas_Fisicas.pdf");
};

export const getDemoData = (): AppState => {
  // --- CONFIGURACIÓN DE LA FINCA DEMO ---
  const WAREHOUSE_ID = 'demo_finca_los_naranjos_v2';
  const FARM_SIZE_HA = 10;
  const JORNAL_VALUE = 60000;
  const HARVEST_COST_PER_KG_CHERRY = 1100; // Basado en FNC 2024
  const SALE_PRICE_PER_CARGA_CPS = 1950000;
  const KG_FERTILIZER_PER_HA_YEAR = 830; // Basado en FNC 2024
  
  // --- ENTIDADES MAESTRAS ---
  // Fix: Added ownerId to warehouse object
  const warehouse: Warehouse = { id: WAREHOUSE_ID, name: "Finca Demo 'Los Naranjos'", created: new Date().toISOString(), ownerId: 'demo_user_id' };
  
  const costCenters: CostCenter[] = [
    { id: 'lote_castillo_1', warehouseId: WAREHOUSE_ID, name: 'Lote 1: Castillo', area: 3, stage: 'Produccion', cropType: 'Café', plantCount: 21000 }, // 7000 p/ha
    { id: 'lote_caturra_2', warehouseId: WAREHOUSE_ID, name: 'Lote 2: Caturra', area: 2.5, stage: 'Produccion', cropType: 'Café', plantCount: 16250 }, // 6500 p/ha
    { id: 'lote_geisha_3', warehouseId: WAREHOUSE_ID, name: 'Lote 3: Geisha', area: 2, stage: 'Produccion', cropType: 'Café', plantCount: 12000 }, // 6000 p/ha
    { id: 'lote_levante_4', warehouseId: WAREHOUSE_ID, name: 'Lote 4: Renovación', area: 2.5, stage: 'Levante', cropType: 'Café', plantCount: 20000 }, // 8000 p/ha
  ];

  const suppliers = [
      { id: 'sup_finca_union', warehouseId: WAREHOUSE_ID, name: 'La Finca Unión S.A.S', phone: '3104567890', email: 'ventas@fincaunion.com', address: 'Calle 10 # 5-20, Manizales' },
      { id: 'sup_agro_quimicos', warehouseId: WAREHOUSE_ID, name: 'AgroQuímicos del Eje', phone: '3201234567', email: 'info@agroquimicos.com', address: 'Carrera 23 # 7-15, Pereira' },
  ];

  const personnel = [
      { id: 'per_juan', warehouseId: WAREHOUSE_ID, name: 'Juan Pérez', role: 'Operario de Campo', documentId: '123456789', phone: '3001112233', birthDate: '1985-04-15' },
      { id: 'per_maria', warehouseId: WAREHOUSE_ID, name: 'María García', role: 'Cosechadora', documentId: '987654321', phone: '3004445566', birthDate: '1990-07-20' },
  ];

  const activities: Activity[] = [
      // Fix: Use string literals for CostClassification values
      { id: 'act_plateo', warehouseId: WAREHOUSE_ID, name: 'Plateo', costClassification: 'COFFEE' },
      { id: 'act_fertilizacion', warehouseId: WAREHOUSE_ID, name: 'Fertilización', costClassification: 'JOINT' },
      { id: 'act_cosecha', warehouseId: WAREHOUSE_ID, name: 'Cosecha', costClassification: 'COFFEE' },
      { id: 'act_aplicacion_fung', warehouseId: WAREHOUSE_ID, name: 'Aplicación Fungicida', costClassification: 'COFFEE' },
      { id: 'act_siembra', warehouseId: WAREHOUSE_ID, name: 'Siembra y Resiembra', costClassification: 'JOINT' },
  ];

  const machines: Machine[] = [
      { id: 'mac_guada', warehouseId: WAREHOUSE_ID, name: 'Guadañadora Stihl FS280', brand: 'Stihl', purchaseDate: '2022-03-01', purchaseValue: 1800000, expectedLifeHours: 1500 },
      { id: 'mac_bomba', warehouseId: WAREHOUSE_ID, name: 'Bomba de Espalda STIHL SG20', brand: 'Stihl', purchaseDate: '2023-01-10', purchaseValue: 500000, capacityTheoretical: 20, dischargeRateLitersPerMin: 1.5, avgSpeedKmh: 3 },
  ];

  const assets: Asset[] = [
      { id: 'ass_despulpadora', warehouseId: WAREHOUSE_ID, name: 'Despulpadora Penagos', purchasePrice: 5000000, lifespanYears: 10, purchaseDate: '2021-06-01', category: 'MAQUINARIA' },
      { id: 'ass_beneficiadero', warehouseId: WAREHOUSE_ID, name: 'Beneficiadero', purchasePrice: 30000000, lifespanYears: 20, purchaseDate: '2020-01-01', category: 'INFRAESTRUCTURA' },
  ];

  // --- DATOS DE INVENTARIO Y MOVIMIENTOS (Históricos) ---
  const inventory: InventoryItem[] = [
      {
          id: 'inv_urea', warehouseId: WAREHOUSE_ID, name: 'Urea', category: Category.FERTILIZANTE,
          currentQuantity: convertToBase(2, Unit.BULTO_50KG), baseUnit: 'g',
          averageCost: 120000 / 50000, // 2.4 COP/g
          lastPurchasePrice: 120000, lastPurchaseUnit: Unit.BULTO_50KG,
          minStock: convertToBase(0.5, Unit.BULTO_50KG), minStockUnit: Unit.BULTO_50KG,
          image: '', description: 'Fertilizante nitrogenado.', expirationDate: '2025-12-31'
      },
      {
          id: 'inv_fungicida_amistar', warehouseId: WAREHOUSE_ID, name: 'Amistar Top', category: Category.FUNGICIDA,
          currentQuantity: convertToBase(1.5, Unit.LITRO), baseUnit: 'ml',
          averageCost: 180000 / 1000, // 180 COP/ml
          lastPurchasePrice: 180000, lastPurchaseUnit: Unit.LITRO,
          minStock: convertToBase(0.2, Unit.LITRO), minStockUnit: Unit.LITRO,
          image: '', description: 'Fungicida para roya y otras enfermedades.', expirationDate: '2026-06-30', safetyIntervalDays: 14
      },
      {
          id: 'inv_insecticida_karate', warehouseId: WAREHOUSE_ID, name: 'Karate Zeon', category: Category.INSECTICIDA,
          currentQuantity: convertToBase(0.5, Unit.LITRO), baseUnit: 'ml',
          averageCost: 90000 / 1000, // 90 COP/ml
          lastPurchasePrice: 90000, lastPurchaseUnit: Unit.LITRO,
          minStock: convertToBase(0.1, Unit.LITRO), minStockUnit: Unit.LITRO,
          image: '', description: 'Insecticida de amplio espectro.', expirationDate: '2025-11-01', safetyIntervalDays: 7
      }
  ];

  const movements: Movement[] = [
      // Urea IN
      { id: generateId(), warehouseId: WAREHOUSE_ID, itemId: 'inv_urea', itemName: 'Urea', type: 'IN', quantity: 5, unit: Unit.BULTO_50KG, calculatedCost: 5 * 120000, date: '2024-01-15T10:00:00Z', supplierId: 'sup_finca_union', supplierName: 'La Finca Unión S.A.S', invoiceNumber: 'INV001', notes: 'Compra inicial' },
      { id: generateId(), warehouseId: WAREHOUSE_ID, itemId: 'inv_urea', itemName: 'Urea', type: 'OUT', quantity: 1, unit: Unit.BULTO_50KG, calculatedCost: 1 * 50000 * (120000 / 50000), date: '2024-02-01T14:30:00Z', costCenterId: 'lote_castillo_1', costCenterName: 'Lote 1: Castillo', personnelId: 'per_juan', personnelName: 'Juan Pérez', outputCode: 'APL001' },
      // Amistar Top IN
      { id: generateId(), warehouseId: WAREHOUSE_ID, itemId: 'inv_fungicida_amistar', itemName: 'Amistar Top', type: 'IN', quantity: 2, unit: Unit.LITRO, calculatedCost: 2 * 180000, date: '2024-03-10T09:00:00Z', supplierId: 'sup_agro_quimicos', supplierName: 'AgroQuímicos del Eje', invoiceNumber: 'INV002', notes: 'Compra de fungicida' },
      { id: generateId(), warehouseId: WAREHOUSE_ID, itemId: 'inv_fungicida_amistar', itemName: 'Amistar Top', type: 'OUT', quantity: 0.5, unit: Unit.LITRO, calculatedCost: 0.5 * 1000 * (180000 / 1000), date: '2024-04-05T11:00:00Z', costCenterId: 'lote_caturra_2', costCenterName: 'Lote 2: Caturra', personnelId: 'per_juan', personnelName: 'Juan Pérez', outputCode: 'APL002', phiApplied: 14 },
      // Karate Zeon IN
      { id: generateId(), warehouseId: WAREHOUSE_ID, itemId: 'inv_insecticida_karate', itemName: 'Karate Zeon', type: 'IN', quantity: 1, unit: Unit.LITRO, calculatedCost: 1 * 90000, date: '2024-05-20T10:00:00Z', supplierId: 'sup_agro_quimicos', supplierName: 'AgroQuímicos del Eje', invoiceNumber: 'INV003', notes: 'Compra de insecticida' },
  ];

  // --- DATOS DE JORNALES Y COSECHAS ---
  const laborLogs: LaborLog[] = [
      { id: generateId(), warehouseId: WAREHOUSE_ID, date: '2024-01-16', personnelId: 'per_juan', personnelName: 'Juan Pérez', activityId: 'act_plateo', activityName: 'Plateo', costCenterId: 'lote_castillo_1', costCenterName: 'Lote 1: Castillo', value: JORNAL_VALUE, paid: true },
      { id: generateId(), warehouseId: WAREHOUSE_ID, date: '2024-01-16', personnelId: 'per_maria', personnelName: 'María García', activityId: 'act_plateo', activityName: 'Plateo', costCenterId: 'lote_castillo_1', costCenterName: 'Lote 1: Castillo', value: JORNAL_VALUE, paid: true },
      { id: generateId(), warehouseId: WAREHOUSE_ID, date: '2024-02-02', personnelId: 'per_juan', personnelName: 'Juan Pérez', activityId: 'act_fertilizacion', activityName: 'Fertilización', costCenterId: 'lote_castillo_1', costCenterName: 'Lote 1: Castillo', value: JORNAL_VALUE, paid: false },
  ];

  const harvests: HarvestLog[] = [
      { id: generateId(), warehouseId: WAREHOUSE_ID, costCenterId: 'lote_castillo_1', costCenterName: 'Lote 1: Castillo', date: '2024-04-20', cropName: 'Café Cereza', quantity: 1500, unit: 'Kg', totalValue: 1500 * HARVEST_COST_PER_KG_CHERRY, quality1Qty: 1000, quality2Qty: 400, wasteQty: 100, yieldFactor: 90 },
      { id: generateId(), warehouseId: WAREHOUSE_ID, costCenterId: 'lote_caturra_2', costCenterName: 'Lote 2: Caturra', date: '2024-05-10', cropName: 'Café Cereza', quantity: 1200, unit: 'Kg', totalValue: 1200 * HARVEST_COST_PER_KG_CHERRY, quality1Qty: 800, quality2Qty: 300, wasteQty: 100, yieldFactor: 88 },
  ];

  const maintenanceLogs: MaintenanceLog[] = [];
  const rainLogs: RainLog[] = [];
  const financeLogs: FinanceLog[] = [];
  const soilAnalyses: SoilAnalysis[] = [];
  const ppeLogs: PPELog[] = [];
  const wasteLogs: WasteLog[] = [];
  const agenda: AgendaEvent[] = [];
  const phenologyLogs: PhenologyLog[] = [];
  const pestLogs: PestLog[] = [];
  const bpaChecklist: Record<string, boolean> = {};

  const plannedLabors: PlannedLabor[] = [
      {
          id: 'plan_labor_1',
          warehouseId: WAREHOUSE_ID,
          activityId: 'act_fertilizacion',
          activityName: 'Fertilización',
          costCenterId: 'lote_castillo_1',
          costCenterName: 'Lote 1: Castillo',
          date: new Date().toISOString().split('T')[0],
          targetArea: 3,
          technicalYield: 1.5, // Ha/Jornal
          unitCost: JORNAL_VALUE,
          efficiency: 95,
          calculatedPersonDays: 2.1,
          calculatedTotalCost: 2.1 * JORNAL_VALUE,
          completed: false
      }
  ];

  // Fix: Return a complete AppState object
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
      machines,
      maintenanceLogs,
      rainLogs,
      financeLogs,
      soilAnalyses,
      ppeLogs,
      wasteLogs,
      agenda,
      phenologyLogs,
      pestLogs,
      plannedLabors,
      budgets: [], // Adding budgets property
      swot: {
          f: 'Finca tecnificada con datos reales.',
          o: 'Optimizar costos con análisis de rentabilidad.',
          d: 'Curva de aprendizaje de la App.',
          a: 'Volatilidad de precios del café.'
      },
      bpaChecklist,
      assets,
      laborFactor: 1.0, // Default for demo
      adminPin: '1234' // Default PIN for demo
  };
};
