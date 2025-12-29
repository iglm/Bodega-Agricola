
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx-js-style'; 
import { AppState, LaborLog, HarvestLog, Movement, InventoryItem, Unit, Category, CostCenter, Personnel, Activity, PhenologyLog, PestLog } from '../types';
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
    doc.rect(0, 0, 210, 45, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(22);
    doc.text(title, 105, 20, { align: 'center' });
    doc.setFontSize(10);
    doc.text(`${subtitle} | Sede: ${warehouse}`, 105, 30, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`AgroSuite 360 - Dossier Técnico v2.5`, 105, 38, { align: 'center' });
    return 50;
};

const addFooter = (doc: jsPDF) => {
    const pageCount = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(150);
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.text(`Página ${i} de ${pageCount} | Generado por AgroSuite 360 © 2025`, 105, 290, { align: 'center' });
    }
};

// --- MOTOR DE INGENIERÍA DE DATOS SQL RELACIONAL ---

export const generateSQLDump = (data: AppState) => {
    const fileName = `AgroSuite360_MasterBackup_${new Date().toISOString().split('T')[0]}.sql`;
    let sql = `-- =============================================================================\n`;
    sql += `-- AGROSUITE 360 - RELATIONAL DATABASE EXPORT (SQLITE COMPATIBLE)\n`;
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

export const generateExecutiveReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    addHeader(doc, "DOSSIER ESTRATÉGICO", "Reporte de Gestión Gerencial", activeW?.name || "");
    // TODO: Add content for SWOT, KPIs, etc.
    addFooter(doc);
    doc.save(`Reporte_Gerencial_${activeW?.name}.pdf`);
};

export const generatePDF = (data: AppState) => {
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
    doc.save("Inventario_AgroSuite.pdf");
};

export const generateLaborReport = (data: AppState) => {
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

export const generateHarvestReport = (data: AppState) => {
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

export const generateFinancialReport = (data: AppState) => {
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


export const generateExcel = (data: AppState) => {
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

    XLSX.writeFile(wb, `Reporte_Integral_${warehouseName}_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateManualPDF = () => {
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
    doc.text("AGROSUITE 360", pageWidth / 2, 100, { align: 'center' });
    doc.setFontSize(14);
    doc.text("Dossier Técnico-Comercial", pageWidth / 2, 115, { align: 'center' });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("La Revolución Digital del Agro Colombiano", pageWidth / 2, 125, { align: 'center' });
    doc.setFontSize(8);
    doc.text(`Versión 2.5 | © 2025 ${AUTHOR}`, pageWidth / 2, 250, { align: 'center' });
    doc.addPage();
    y = 20;

    // --- PAGE 1: EXECUTIVE SUMMARY ---
    y = addTitle("1. Resumen Ejecutivo: La Finca como Empresa", y);
    y = addParagraph("AgroSuite 360 es un Sistema de Planificación de Recursos Empresariales (ERP) diseñado para el sector agrícola, que opera bajo una filosofía de 'Dato-Decisión'. Su propósito es empoderar al productor para que transcienda la gestión operativa y adopte un rol de gerente estratégico, fundamentando cada acción en un análisis financiero robusto y en tiempo real.", y + 5);
    y = addParagraph("El sistema se distingue por su arquitectura de seguridad 'Local-First', garantizando que los datos sensibles del negocio (costos, nómina, rentabilidad) residan exclusivamente en el dispositivo del usuario. Este enfoque no solo asegura la máxima confidencialidad, sino que también otorga al productor la soberanía total sobre su información, en cumplimiento con la Ley 1581 de Habeas Data.", y + 5);
    y = addParagraph("La propuesta de valor se centra en tres pilares: Rigor Financiero, Inteligencia de Negocios y Cumplimiento Normativo, convirtiendo la recolección de datos de campo en una ventaja competitiva tangible.", y + 5);
    doc.addPage();
    y = 20;

    // --- PAGE 2: CORE FINANCIAL ENGINE ---
    y = addTitle("2. El Motor Financiero: Precisión Contable", y);
    y = addTitle("2.1 Costo Promedio Ponderado (CPP)", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("A diferencia de los sistemas de registro tradicionales, AgroSuite 360 implementa el CPP, el método contable estándar para la valoración de inventarios. Cuando se ingresa una nueva compra de un insumo a un precio diferente, el sistema recalcula automáticamente el costo real de cada unidad en bodega. Esto asegura que el costo asignado a cada lote en una aplicación sea financieramente exacto, eliminando distorsiones en el cálculo de la rentabilidad.", y + 5);
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
    y = addListItem("Liquidación de Nómina: Consolida los jornales pendientes por trabajador y genera un Recibo de Pago en PDF con un clic. Este documento es un soporte legal ante posibles reclamaciones y requerimientos de la UGPP.", y+5);
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
    y = addTitle("7. Motor de Inteligencia de Negocios (BI)", y);
    y = addParagraph("El tablero de control gerencial que convierte los datos operativos en inteligencia accionable. Opera en tres niveles:", y+5);
    y = addTitle("7.1 Performance", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Calcula el Estado de Resultados (P&G) para cada lote, revelando la utilidad operativa y el margen de rentabilidad. Identifica cuáles son los 'lotes estrella' y cuáles operan a pérdida.", y+5, 5);
    y = addTitle("7.2 Data Mining", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("La IA analiza correlaciones en los datos. Por ejemplo, puede identificar un lote donde la relación costo-insumo/ingreso-venta es anómalamente alta, sugiriendo una posible sobre-fertilización o un problema de absorción de nutrientes que requiere una revisión técnica.", y+5, 5);
    y = addTitle("7.3 Benchmarking", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Compara indicadores clave de la finca, como el porcentaje de participación de la mano de obra en los costos totales, contra promedios técnicos de la región (Ej: datos de Evaluaciones Agropecuarias para Caldas). Esto ofrece una medida objetiva de la competitividad y eficiencia de la operación.", y+5, 5);
    doc.addPage(); y = 20;
    
    // --- PAGE 8: AI ASSISTANT ---
    y = addTitle("8. Asistente IA Gemini: Eficiencia Exponencial", y, 16, BRAND_COLORS.purple);
    y = addParagraph("Integrado con la tecnología de Google, el asistente optimiza la captura y análisis de datos:", y+5);
    y = addListItem("Análisis (Chat): Permite al usuario hacer preguntas en lenguaje natural como '¿Cuál fue el lote más rentable el mes pasado?' o '¿Qué trabajador ha acumulado más jornales?'.", y+8);
    y = addListItem("OCR Visión de Facturas: Utiliza la cámara para leer una factura de insumos. La IA extrae los productos, cantidades y precios, y prepara el registro para ser cargado al inventario con un solo clic, eliminando la digitación manual.", y+5);
    y = addListItem("Dictado de Comandos: Permite registrar operaciones con la voz. El usuario puede decir 'Registrar jornal para Juan en Lote 1, plateo, 60 mil pesos', y la IA estructurará el comando para su confirmación.", y+5);
    doc.addPage(); y = 20;

    // --- PAGE 9: DATA MANAGEMENT ---
    y = addTitle("9. Centro de Datos: Soberanía y Escalabilidad", y, 16, BRAND_COLORS.amber);
    y = addParagraph("La gestión de datos se basa en la portabilidad y la seguridad, ofreciendo dos formatos de exportación con propósitos distintos:", y+5);
    y = addTitle("9.1 Backup Rápido (JSON)", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Crea una 'fotografía' completa de todos los datos de la aplicación en un archivo ligero. Su única función es la portabilidad y la restauración: permite mover toda la información a un nuevo dispositivo o recuperarla tras un formateo.", y+5, 5);
    y = addTitle("9.2 Exportación Relacional (SQL)", y + 5, 12, BRAND_COLORS.slate);
    y = addParagraph("Genera un volcado de la base de datos en un formato estándar compatible con sistemas de análisis externos como Power BI, Tableau o bases de datos corporativas. Este archivo está diseñado para la escalabilidad, auditorías profundas y la integración con otros sistemas empresariales. No puede ser restaurado directamente en la app.", y+5, 5);
    doc.addPage(); y = 20;

    // --- PAGE 10: LEGAL & COMPLIANCE ---
    y = addTitle("10. Cumplimiento Normativo: Marco Colombia", y);
    y = addParagraph("AgroSuite 360 ha sido desarrollado con un profundo conocimiento del marco legal colombiano para ofrecer seguridad jurídica al productor:", y+5);
    y = addListItem("Ley 1581 de 2012 (Habeas Data): La arquitectura 'Local-First' es la máxima garantía de cumplimiento, ya que no existe una transferencia de datos personales a servidores de terceros.", y+8);
    y = addListItem("Ley 23 de 1982 (Derechos de Autor): El software está protegido y su uso se rige por una licencia personal e intransferible.", y+5);
    y = addListItem("Ley 1480 de 2011 (Estatuto del Consumidor): Se garantizan los derechos de retracto y reversión de pago en las suscripciones a través de las plataformas oficiales (Google Play Store).", y+5);
    y = addListItem("Normativa ICA y UGPP: Las funcionalidades de la app, como el registro de PHI y la generación de recibos de pago, están diseñadas para generar los soportes documentales exigidos por estas entidades de control.", y+5);

    addFooter(doc);
    doc.save("Dossier_Tecnico_AgroSuite360.pdf");
};

export const generatePaymentReceipt = (name: string, logs: LaborLog[], warehouseName: string) => {
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

export const generateGlobalReport = (data: AppState) => generateExecutiveReport(data);
export const generateFieldTemplates = (data: AppState, b: boolean) => {
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
  const warehouse = { id: WAREHOUSE_ID, name: "Finca Demo 'Los Naranjos'", created: new Date().toISOString() };
  
  const costCenters: CostCenter[] = [
    { id: 'lote_castillo_1', warehouseId: WAREHOUSE_ID, name: 'Lote 1: Castillo', area: 3, stage: 'Produccion', cropType: 'Café', plantCount: 21000 }, // 7000 p/ha
    { id: 'lote_caturra_2', warehouseId: WAREHOUSE_ID, name: 'Lote 2: Caturra', area: 2.5, stage: 'Produccion', cropType: 'Café', plantCount: 16250 }, // 6500 p/ha
    { id: 'lote_geisha_3', warehouseId: WAREHOUSE_ID, name: 'Lote 3: Geisha', area: 2, stage: 'Produccion', cropType: 'Café', plantCount: 12000 }, // 6000 p/ha
    { id: 'lote_levante_4', warehouseId: WAREHOUSE_ID, name: 'Lote 4: Renovación', area: 2.5, stage: 'Levante', cropType: 'Café', plantCount: 20000 }, // 8000 p/ha
  ];

  const personnel: Personnel[] = [
    { id: 'p_gerente', warehouseId: WAREHOUSE_ID, name: 'Carlos Gerente', role: 'Administrador' },
    { id: 'p_op_1', warehouseId: WAREHOUSE_ID, name: 'Juan Valdéz', role: 'Operario' },
    { id: 'p_op_2', warehouseId: WAREHOUSE_ID, name: 'María Cosechadora', role: 'Operario' }
  ];

  const activities: Activity[] = [
    { id: 'act_recol', warehouseId: WAREHOUSE_ID, name: 'Recolección de Café', costClassification: 'COFFEE' },
    { id: 'act_beneficio', warehouseId: WAREHOUSE_ID, name: 'Beneficio y Secado', costClassification: 'COFFEE' },
    { id: 'act_fert_eda', warehouseId: WAREHOUSE_ID, name: 'Fertilización Edafica', costClassification: 'COFFEE' },
    { id: 'act_fert_fol', warehouseId: WAREHOUSE_ID, name: 'Fertilización Foliar', costClassification: 'COFFEE' },
    { id: 'act_ctrl_broca', warehouseId: WAREHOUSE_ID, name: 'Control de Broca', costClassification: 'COFFEE' },
    { id: 'act_ctrl_roya', warehouseId: WAREHOUSE_ID, name: 'Control de Roya', costClassification: 'COFFEE' },
    { id: 'act_plateo', warehouseId: WAREHOUSE_ID, name: 'Plateo Manual', costClassification: 'COFFEE' },
    { id: 'act_machete', warehouseId: WAREHOUSE_ID, name: 'Control Arvenses (Machete)', costClassification: 'COFFEE' },
    { id: 'act_guadana', warehouseId: WAREHOUSE_ID, name: 'Control Arvenses (Guadaña)', costClassification: 'COFFEE' },
    { id: 'act_siembra', warehouseId: WAREHOUSE_ID, name: 'Siembra / Resiembra', costClassification: 'COFFEE' },
    { id: 'act_deschuponada', warehouseId: WAREHOUSE_ID, name: 'Deschuponada', costClassification: 'COFFEE' },
    { id: 'act_admin', warehouseId: WAREHOUSE_ID, name: 'Administración General', costClassification: 'JOINT' }
  ];
  
  const suppliers = [{id: 'sup_agro_regional', warehouseId: WAREHOUSE_ID, name: 'Agroinsumos del Centro'}];
  
  // --- ESTADO INICIAL DEL INVENTARIO ---
  let inventory: InventoryItem[] = [
    { id: 'inv_fert_prod', warehouseId: WAREHOUSE_ID, name: 'Fertilizante Producción 25-4-24', category: Category.FERTILIZANTE, currentQuantity: 0, baseUnit: 'g', averageCost: 0, lastPurchasePrice: 175000, lastPurchaseUnit: Unit.BULTO_50KG, safetyIntervalDays: 0 },
    { id: 'inv_fungicida', warehouseId: WAREHOUSE_ID, name: 'Fungicida Amistar Top', category: Category.FUNGICIDA, currentQuantity: 0, baseUnit: 'ml', averageCost: 0, lastPurchasePrice: 120000, lastPurchaseUnit: Unit.LITRO, safetyIntervalDays: 15 },
    { id: 'inv_herbicida', warehouseId: WAREHOUSE_ID, name: 'Herbicida Glifosato', category: Category.HERBICIDA, currentQuantity: 0, baseUnit: 'ml', averageCost: 0, lastPurchasePrice: 45000, lastPurchaseUnit: Unit.LITRO, safetyIntervalDays: 30 }
  ];
  let movements: Movement[] = [];

  // --- LÓGICA DE GENERACIÓN DE DATOS PARA 1 AÑO ---
  const laborLogs: LaborLog[] = [];
  const harvests: HarvestLog[] = [];
  
  const today = new Date();
  
  for (let i = 365; i > 0; i--) {
      const currentDate = new Date(today);
      currentDate.setDate(today.getDate() - i);
      const dayOfYear = Math.floor((currentDate.getTime() - new Date(currentDate.getFullYear(), 0, 0).getTime()) / 86400000);
      
      const productionLots = costCenters.filter(c => c.stage === 'Produccion');

      // 1. FERTILIZACIÓN (Cada 90 días)
      if (dayOfYear % 90 === 1) {
          const fert = inventory.find(inv => inv.id === 'inv_fert_prod')!;
          const bultosNeeded = Math.ceil((KG_FERTILIZER_PER_HA_YEAR * FARM_SIZE_HA / 4) / 50);
          const { updatedInventory, movementCost } = processInventoryMovement(inventory, { itemId: fert.id, itemName: fert.name, type: 'IN', quantity: bultosNeeded, unit: Unit.BULTO_50KG, calculatedCost: 0, notes: "Compra trimestral." }, fert.lastPurchasePrice);
          inventory = updatedInventory;
          movements.push({ id: generateId(), warehouseId: WAREHOUSE_ID, date: currentDate.toISOString(), itemId: fert.id, itemName: fert.name, type: 'IN', quantity: bultosNeeded, unit: Unit.BULTO_50KG, calculatedCost: movementCost, notes: "Compra trimestral." });
          
          productionLots.forEach(lot => {
              const bultosPerLot = (KG_FERTILIZER_PER_HA_YEAR * lot.area / 4) / 50;
              const { updatedInventory: invPostApp, movementCost: costApp } = processInventoryMovement(inventory, { itemId: fert.id, itemName: fert.name, type: 'OUT', quantity: bultosPerLot, unit: Unit.BULTO_50KG, calculatedCost: 0, costCenterId: lot.id });
              inventory = invPostApp;
              movements.push({ id: generateId(), warehouseId: WAREHOUSE_ID, date: currentDate.toISOString(), itemId: fert.id, itemName: fert.name, type: 'OUT', quantity: bultosPerLot, unit: Unit.BULTO_50KG, calculatedCost: costApp, costCenterId: lot.id, costCenterName: lot.name });
              
              const jornales = lot.area * 1.5; // ITEC: 1.5 jornales/ha
              laborLogs.push({ id: generateId(), warehouseId: WAREHOUSE_ID, date: currentDate.toISOString(), personnelId: 'p_op_1', personnelName: 'Juan Valdéz', activityId: 'act_fert_eda', activityName: 'Fertilización Edafica', costCenterId: lot.id, costCenterName: lot.name, value: jornales * JORNAL_VALUE, paid: false });
          });
      }

      // 2. CONTROL DE ARVENSES (Cada 60 días)
      if (dayOfYear % 60 === 1) {
          productionLots.forEach(lot => {
              const jornales = lot.area * 6.5; // ITEC: 6.5 jornales/ha/vez
              laborLogs.push({ id: generateId(), warehouseId: WAREHOUSE_ID, date: currentDate.toISOString(), personnelId: 'p_op_2', personnelName: 'María Cosechadora', activityId: 'act_machete', activityName: 'Control Arvenses (Machete)', costCenterId: lot.id, costCenterName: lot.name, value: jornales * JORNAL_VALUE, paid: false });
          });
      }
      
      // 3. DESCHUPONADA (Cada 120 días)
      if (dayOfYear % 120 === 5) {
        productionLots.forEach(lot => {
            const jornales = lot.area * 3.5; // ITEC: 3.5 jornales/ha/vez
            laborLogs.push({ id: generateId(), warehouseId: WAREHOUSE_ID, date: currentDate.toISOString(), personnelId: 'p_op_1', personnelName: 'Juan Valdéz', activityId: 'act_deschuponada', activityName: 'Deschuponada', costCenterId: lot.id, costCenterName: lot.name, value: jornales * JORNAL_VALUE, paid: false });
        });
      }
      
      // 4. COSECHA (Picos en Abril-Mayo y Oct-Nov)
      const month = currentDate.getMonth();
      const isMainHarvest = (month >= 9 && month <= 10);
      const isMitaHarvest = (month >= 3 && month <= 4);
      if (isMainHarvest || isMitaHarvest) {
          productionLots.forEach(lot => {
              if (Math.random() > 0.4) return;
              
              const dailyYieldKgHa = isMainHarvest ? (13.6 * 125 * 0.7) / 60 : (13.6 * 125 * 0.3) / 60;
              const kgCherry = dailyYieldKgHa * lot.area * (0.8 + Math.random() * 0.4);
              
              const kgCps = (kgCherry / 5.1);
              const cargasCps = kgCps / 125;
              const ventaTotal = cargasCps * SALE_PRICE_PER_CARGA_CPS;

              const qty1 = kgCps * 0.95;
              const qty2 = kgCps * 0.03;
              const qty3 = kgCps * 0.02;
              const totalKg = qty1 + qty2 + qty3;
              const yieldFactor = 88 + Math.random() * 6;

              harvests.push({ 
                  id: generateId(), warehouseId: WAREHOUSE_ID, costCenterId: lot.id, costCenterName: lot.name, 
                  date: currentDate.toISOString(), cropName: 'Café Pergamino Seco', 
                  quantity: totalKg, unit: 'kg', totalValue: ventaTotal, 
                  quality1Qty: qty1, quality2Qty: qty2, wasteQty: qty3,
                  yieldFactor: parseFloat(yieldFactor.toFixed(1))
              });

              const recoleccionCost = kgCherry * HARVEST_COST_PER_KG_CHERRY;
              laborLogs.push({ id: generateId(), warehouseId: WAREHOUSE_ID, date: currentDate.toISOString(), personnelId: 'p_op_2', personnelName: 'María Cosechadora', activityId: 'act_recol', activityName: 'Recolección de Café', costCenterId: lot.id, costCenterName: lot.name, value: recoleccionCost, paid: false });
          });
      }
  }

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
    rainLogs: [],
    financeLogs: [],
    soilAnalyses: [],
    ppeLogs: [],
    wasteLogs: [],
    agenda: [{id: generateId(), warehouseId: WAREHOUSE_ID, date: new Date().toISOString(), title: 'Revisar datos de demostración', completed: false}],
    phenologyLogs: [],
    pestLogs: [],
    laborFactor: 1.52,
    swot: { f: 'Finca tecnificada con datos reales.', o: 'Optimizar costos con análisis de rentabilidad.', d: 'Curva de aprendizaje de la App.', a: 'Volatilidad de precios del café.' },
    bpaChecklist: {},
    assets: [],
    adminPin: '1234'
  };
};
