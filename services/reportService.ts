import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppState, LaborLog, HarvestLog, Movement, InventoryItem, Unit, Category, CostCenter, Personnel, Activity, PhenologyLog, PestLog, Machine, Asset, MaintenanceLog, RainLog, FinanceLog, SoilAnalysis, PPELog, WasteLog, AgendaEvent, CostClassification, Warehouse, PlannedLabor, Supplier, BudgetPlan, BudgetItem } from '../types';
import { formatCurrency, generateId, convertToBase, getBaseUnitType, processInventoryMovement, parseNumberInput } from './inventoryService';

// --- TYPE DEFINITIONS FOR ROBUSTNESS ---

// Extensión de tipo para soportar la propiedad inyectada por jspdf-autotable de forma segura
interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

// Interfaces específicas para el reporte de simulación (antes eran any)
interface SimulationYear {
  year: number;
  label: string;
  totalIncome: number;
  totalExpenses: number;
  netCashFlow: number;
  cumulativeFlow: number;
}

interface SimulationData {
  initCap: number;
  vpn: number;
  roi: number;
  paybackYear: number | null;
  totalCapex: number;
  yearlyData: SimulationYear[];
}

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
        doc.text(`DATOSFINCA VIVA - PROPIEDAD INTELECTUAL: ${AUTHOR} | Pág ${i} de ${pageCount}`, 105, 290, { align: 'center' });
    }
};

// --- NEW FUNCTIONS FOR FARM STRUCTURE REPORT ---

export const generateFarmStructureExcel = (costCenters: CostCenter[]): void => {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().split('T')[0];
    
    // Transform data
    const data = costCenters.map(c => {
        const density = c.area > 0 ? Math.round((c.plantCount || 0) / c.area) : 0;
        return {
            'Nombre Lote': c.name,
            'Área (Hectáreas)': c.area,
            'Etapa Productiva': c.stage as string,
            'Cultivo Principal': c.cropType,
            'Variedad/Detalle': '', // Placeholder for future use
            'Cultivo Asocio': c.associatedCrop || 'Ninguno',
            'Densidad Asocio (sitios/Ha)': c.associatedCropDensity || 0,
            'Edad del Cultivo (Meses)': c.cropAgeMonths || 0,
            'Población Total (Árboles)': c.plantCount || 0,
            'Densidad Calc. (Árb/Ha)': density,
            'Estado Densidad': density < 4000 ? 'Baja' : density > 8000 ? 'Alta' : 'Óptima'
        };
    });

    // Calculate Totals
    const totalArea = costCenters.reduce((sum, c) => sum + (c.area || 0), 0);
    const totalTrees = costCenters.reduce((sum, c) => sum + (c.plantCount || 0), 0);
    
    // Append Totals Row
    data.push({
        'Nombre Lote': 'TOTAL HACIENDA',
        'Área (Hectáreas)': totalArea,
        'Etapa Productiva': '',
        'Cultivo Principal': '',
        'Variedad/Detalle': '',
        'Cultivo Asocio': '',
        'Densidad Asocio (sitios/Ha)': 0,
        'Edad del Cultivo (Meses)': 0,
        'Población Total (Árboles)': totalTrees,
        'Densidad Calc. (Árb/Ha)': totalArea > 0 ? Math.round(totalTrees / totalArea) : 0,
        'Estado Densidad': ''
    });

    const ws = XLSX.utils.json_to_sheet(data);
    
    // Auto-width adjustment (Simple approximation)
    const wscols = [
        {wch: 25}, {wch: 15}, {wch: 15}, {wch: 20}, {wch: 15}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 20}, {wch: 15}
    ];
    ws['!cols'] = wscols;

    XLSX.utils.book_append_sheet(wb, ws, "Estructura_Finca");
    XLSX.writeFile(wb, `ESTRUCTURA_FINCA_${dateStr}.xlsx`);
};

export const generateFarmStructurePDF = (costCenters: CostCenter[]): void => {
    const doc = new jsPDF();
    const dateStr = new Date().toISOString().split('T')[0];
    let y = addHeader(doc, "Estructura de la Finca", "Censo de Lotes y Población", "Reporte Técnico", BRAND_COLORS.indigo);
    
    const rows = costCenters.map(c => {
        const density = c.area > 0 ? Math.round((c.plantCount || 0) / c.area) : 0;
        return [
            c.name,
            `${c.area.toFixed(2)} Ha`,
            c.cropType,
            c.associatedCrop || '-',
            `${c.cropAgeMonths || 0} Meses`,
            (c.plantCount || 0).toLocaleString(),
            density.toLocaleString(),
            c.stage
        ];
    });

    // Totals
    const totalArea = costCenters.reduce((sum, c) => sum + (c.area || 0), 0);
    const totalTrees = costCenters.reduce((sum, c) => sum + (c.plantCount || 0), 0);
    const avgDensity = totalArea > 0 ? Math.round(totalTrees / totalArea) : 0;

    autoTable(doc, { 
        startY: y + 5, 
        head: [['Lote', 'Área', 'Cultivo', 'Asocio', 'Edad', 'Población', 'Densidad', 'Etapa']], 
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.indigo },
        styles: { fontSize: 8, halign: 'center' },
        columnStyles: {
            0: { halign: 'left', fontStyle: 'bold' }
        },
        foot: [[
            'TOTALES', 
            `${totalArea.toFixed(2)} Ha`, 
            '-', 
            '-', 
            '-', 
            totalTrees.toLocaleString(), 
            `~${avgDensity}`, 
            '-'
        ]],
        footStyles: { fillColor: BRAND_COLORS.slate, fontStyle: 'bold', textColor: 255 }
    });

    addFooter(doc);
    doc.save(`ESTRUCTURA_FINCA_${dateStr}.pdf`);
};

// --- EXISTING EXPORTS ---

export const generateExcel = (data: AppState): void => {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.inventory.map(i => ({'Insumo': i.name, 'Categoría': i.category, 'Stock': i.currentQuantity, 'Unidad': i.baseUnit, 'Costo Prom.': i.averageCost, 'Valorización': i.currentQuantity * i.averageCost}))), "1_Inventario");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.movements.map(m => ({'Fecha': m.date.split('T')[0], 'Tipo': m.type, 'Insumo': m.itemName, 'Cantidad': m.quantity, 'Unidad': m.unit, 'Costo Total': m.calculatedCost, 'Lote': m.costCenterName || 'N/A', 'Proveedor': m.supplierName || ''}))), "2_Kardex_Historico");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.harvests.map(h => ({
        'Fecha': h.date, 
        'Lote': h.costCenterName, 
        'Producto': h.cropName, 
        'Cantidad': h.quantity, 
        'Unidad': h.unit, 
        'Venta Total': h.totalValue, 
        'Rendimiento Factor': h.yieldFactor || '',
        'Recolectores': h.collectorsCount || 1,
        'Eff (Kg/H/D)': h.collectorsCount ? (h.quantity / h.collectorsCount).toFixed(1) : h.quantity,
        '% Verdes': h.greenPercentage || 0,
        '% Broca': h.pestPercentage || 0,
        '% Defectos': h.defectPercentage || 0
    }))), "3_Ventas_Calidad");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.costCenters.map(c => ({'Nombre': c.name, 'Area (Ha)': c.area, 'Etapa': c.stage, 'Cultivo': c.cropType, 'Población': c.plantCount}))), "7_Lotes_Estructura");
    XLSX.writeFile(wb, `LIBRO_MAESTRO_100HA_${dateStr}.xlsx`);
};

export const generateMasterPDF = (data: AppState): void => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Libro Maestro Consolidado", "Reporte Integral de Gestión 360", activeW?.name || "Sede", BRAND_COLORS.slate);
    
    autoTable(doc, { 
        startY: y + 5, 
        head: [['Concepto Gerencial', 'Valor Acumulado']], 
        body: [
            ['Ventas Totales (Ingresos)', formatCurrency(data.harvests.reduce((a,b)=>a+b.totalValue, 0))],
            ['Costo Insumos Aplicados', formatCurrency(data.movements.filter(m=>m.type==='OUT').reduce((a,b)=>a+b.calculatedCost,0))],
            ['Costo Mano de Obra (Neto)', formatCurrency(data.laborLogs.reduce((a,b)=>a+b.value, 0))],
            ['Costo Mano de Obra (Real c/ Carga)', formatCurrency(data.laborLogs.reduce((a,b)=>a+b.value, 0) * data.laborFactor)]
        ], 
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.slate }
    });

    addFooter(doc);
    doc.save(`REPORTE_GERENCIAL_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateGlobalReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Balance Gerencial Global", "Consolidado de Operaciones", activeW?.name || "Sede", BRAND_COLORS.amber);
    
    autoTable(doc, {
        startY: y,
        head: [['Módulo', 'Indicador', 'Valor']],
        body: [
            ['Inventario', 'Valorización en Bodega', formatCurrency(data.inventory.reduce((a,b)=>a+(b.currentQuantity*b.averageCost),0))],
            ['Nómina', 'Pendiente de Pago', formatCurrency(data.laborLogs.filter(l=>!l.paid).reduce((a,b)=>a+b.value,0))],
            ['Producción', 'Ventas Brutas Acumuladas', formatCurrency(data.harvests.reduce((a,b)=>a+b.totalValue, 0))],
        ],
        headStyles: { fillColor: BRAND_COLORS.amber }
    });
    
    addFooter(doc);
    doc.save("Balance_Gerencial.pdf");
};

export const generateAgronomicDossier = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Dossier Agronómico", "Registros Fitosanitarios y Ambientales", activeW?.name || "Sede", BRAND_COLORS.primary);
    
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Pluviometría (Lluvias)", 14, y);
    autoTable(doc, {
        startY: y + 5,
        head: [['Fecha', 'Milímetros (mm)']],
        body: data.rainLogs.map(r => [r.date.split('T')[0], `${r.millimeters} mm`]),
    });
    
    // Type casting to custom interface for type safety
    const nextY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
    doc.text("Monitoreo de Plagas y Enfermedades", 14, nextY);
    autoTable(doc, {
        startY: nextY + 5,
        head: [['Fecha', 'Lote', 'Problema', 'Incidencia']],
        body: data.pestLogs.map(p => [p.date.split('T')[0], p.costCenterId, p.pestOrDisease, p.incidence]),
    });
    
    addFooter(doc);
    doc.save("Dossier_Agronomico.pdf");
};

export const generatePDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Stock Bodega Valorizado", "Inventario Actual", activeW?.name || "Principal");
    
    autoTable(doc, { 
        startY: y, 
        head: [['Producto', 'Stock Actual', 'CPP', 'Total']], 
        body: data.inventory.map(i => [
            i.name, 
            `${i.currentQuantity} ${i.baseUnit}`, 
            formatCurrency(i.averageCost, 2), 
            formatCurrency(i.currentQuantity * i.averageCost)
        ]),
        headStyles: { fillColor: BRAND_COLORS.primary }
    });
    
    addFooter(doc);
    doc.save("Inventario_Bodega.pdf");
};

export const generateLaborReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Consolidado de Nómina", "Historial de Pagos y Jornales", activeW?.name || "Sede", BRAND_COLORS.amber);
    
    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Trabajador', 'Labor', 'Lote', 'Valor']],
        body: data.laborLogs.map(l => [l.date, l.personnelName, l.activityName, l.costCenterName, formatCurrency(l.value)]),
        headStyles: { fillColor: BRAND_COLORS.amber }
    });
    
    addFooter(doc);
    doc.save("Reporte_Nomina.pdf");
};

export const generateHarvestReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Bitácora de Ventas", "Producción y Salidas de Cosecha", activeW?.name || "Sede", BRAND_COLORS.indigo);
    
    autoTable(doc, {
        startY: y,
        head: [['Fecha', 'Lote', 'Producto', 'Cantidad', 'Valor Venta', 'Eficiencia']],
        body: data.harvests.map(h => [
            h.date, 
            h.costCenterName, 
            h.cropName, 
            `${h.quantity} ${h.unit}`, 
            formatCurrency(h.totalValue),
            h.collectorsCount ? `${(h.quantity/h.collectorsCount).toFixed(1)} Kg/H` : '-'
        ]),
        headStyles: { fillColor: BRAND_COLORS.indigo }
    });
    
    addFooter(doc);
    doc.save("Reporte_Ventas.pdf");
};

export const generateSafetyReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Auditoría de Seguridad y Ambiente", "Registro de EPP y Residuos", activeW?.name || "Sede", BRAND_COLORS.red);
    
    doc.setFont("helvetica", "bold");
    doc.text("Entrega de Elementos de Protección Personal (EPP)", 14, y);
    autoTable(doc, {
        startY: y + 5,
        head: [['Fecha', 'Trabajador', 'Elementos']],
        body: data.ppeLogs.map(p => [p.date.split('T')[0], p.personnelName, p.items.join(', ')]),
    });
    
    // Type casting to custom interface for type safety
    const nextY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
    doc.text("Gestión de Residuos y Triple Lavado", 14, nextY);
    autoTable(doc, {
        startY: nextY + 5,
        head: [['Fecha', 'Descripción', 'Cantidad', 'Triple Lavado']],
        body: data.wasteLogs.map(w => [w.date.split('T')[0], w.itemDescription, w.quantity, w.tripleWashed ? 'SÍ' : 'NO']),
    });
    
    addFooter(doc);
    doc.save("Reporte_Seguridad_Ambiental.pdf");
};

export const generateFieldTemplates = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || "Hacienda Viva";
    
    const forms = [
        { title: "1. Registro de Recolección (Diario)", head: [['Fecha', 'Lote', 'Recolector', 'Kilos/Arrobas', 'Factor', 'Firma']] },
        { title: "2. Aplicación de Agroinsumos", head: [['Fecha', 'Lote', 'Producto', 'Dosis/Tanque', 'Bomba N°', 'Aplicador']] },
        { title: "3. Monitoreo de Broca y Roya", head: [['Fecha', 'Lote', 'Sitios', 'Ramas Totales', 'Ramas Afectadas', 'Incidencia %']] },
        { title: "4. Control de Arvenses (Malezas)", head: [['Fecha', 'Lote', 'Método (Quím/Mec)', 'Producto/Herramienta', 'Área', 'Operario']] },
        { title: "5. Registro Pluviométrico (Lluvias)", head: [['Fecha', 'Hora Lectura', 'Milímetros (mm)', 'Observaciones Clima', 'Responsable']] },
        { title: "6. Labores Culturales (Poda/Deshije)", head: [['Fecha', 'Lote', 'Labor Realizada', 'N° Árboles/Surcos', 'Avance %', 'Trabajador']] },
        { title: "7. Entrega de EPP y Seguridad", head: [['Fecha', 'Trabajador', 'Elemento Entregado', 'Estado (N/R)', 'Vencimiento', 'Firma']] },
        { title: "8. Limpieza y Desinfección de Equipos", head: [['Fecha', 'Equipo/Herramienta', 'Detergente/Desinfectante', 'Método', 'Operario', 'Verificó']] },
        { title: "9. Mantenimiento de Maquinaria", head: [['Fecha', 'Máquina', 'Horómetro/Km', 'Actividad (Prev/Corr)', 'Repuestos', 'Técnico']] },
        { title: "10. Gestión de Residuos y Triple Lavado", head: [['Fecha', 'Producto Vaciado', 'Cantidad Envases', '¿Triple Lavado?', '¿Perforado?', 'Responsable']] },
        { title: "11. Registro de Floración y Fenología", head: [['Fecha', 'Lote', 'Evento (Nudo/Flor/Fruto)', 'Intensidad', 'Cosecha Est.', 'Anotó']] },
        { title: "12. Control de Asistencia y Jornales", head: [['Fecha', 'Nombre Trabajador', 'Hora Entrada', 'Hora Salida', 'Labor Principal', 'Firma']] }
    ];

    forms.forEach((form, index) => {
        if (index > 0) doc.addPage();
        
        // Header
        doc.setFillColor(...BRAND_COLORS.slate);
        doc.rect(0, 0, 210, 30, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont("helvetica", "bold");
        doc.setFontSize(14);
        doc.text("Planilla de Campo - Registro Físico", 105, 15, { align: 'center' });
        doc.setFontSize(10);
        doc.text(`Finca: ${activeW} | Formato: ${form.title}`, 105, 25, { align: 'center' });
        
        let y = 40;
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Este formato es un documento de trazabilidad oficial. Favor diligenciar con letra clara y tinta negra para posterior digitalización en la App.", 14, y - 5);

        autoTable(doc, {
            startY: y,
            head: form.head,
            body: Array(15).fill(Array(form.head[0].length).fill('')),
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], fontSize: 9, fontStyle: 'bold', halign: 'center' },
            styles: { fontSize: 9, cellPadding: 6, minCellHeight: 12, lineColor: [200, 200, 200] },
            columnStyles: {
                [form.head[0].length - 1]: { cellWidth: 35 } // Make signature column wider
            }
        });

        // Type casting to custom interface for type safety
        const finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 20;
        
        // Signature box at the bottom
        if (finalY < 250) {
            doc.setDrawColor(150);
            doc.line(20, finalY, 90, finalY);
            doc.line(120, finalY, 190, finalY);
            doc.setFontSize(8);
            doc.setTextColor(50);
            doc.text("Firma del Responsable de Campo / Mayordomo", 55, finalY + 5, { align: 'center' });
            doc.text("Visto Bueno Administración / Auditor", 155, finalY + 5, { align: 'center' });
        }
        
        addFooter(doc);
    });

    doc.save(`PAQUETE_PLANILLAS_CAMPO_12_FORMATOS_${new Date().getFullYear()}.pdf`);
};

export const generateExecutiveReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Informe Ejecutivo de Gestión", "Análisis de Alto Nivel", activeW?.name || "Sede", BRAND_COLORS.indigo);
    
    const totalSales = data.harvests.reduce((a,b)=>a+b.totalValue, 0);
    const totalCosts = data.movements.filter(m=>m.type==='OUT').reduce((a,b)=>a+b.calculatedCost,0) + 
                       (data.laborLogs.reduce((a,b)=>a+b.value, 0) * data.laborFactor);

    autoTable(doc, {
        startY: y,
        head: [['Indicador', 'Valor']],
        body: [
            ['Ingresos Totales', formatCurrency(totalSales)],
            ['Costos Operativos Totales', formatCurrency(totalCosts)],
            ['Utilidad Operativa Estimada', formatCurrency(totalSales - totalCosts)],
            ['Eficiencia Global de Campo', totalCosts > 0 ? `${((totalSales/totalCosts)*100).toFixed(1)}%` : '0%']
        ],
        headStyles: { fillColor: BRAND_COLORS.indigo }
    });
    
    addFooter(doc);
    doc.save("Informe_Ejecutivo.pdf");
};

export const generatePaymentReceipt = (personName: string, logs: LaborLog[], warehouseName: string) => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Comprobante de Pago", "Liquidación de Mano de Obra", warehouseName, BRAND_COLORS.primary);
    
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`Páguese a: ${personName}`, 20, y);
    doc.text(`Fecha de Emisión: ${new Date().toLocaleDateString()}`, 20, y + 10);
    
    const total = logs.reduce((a,b) => a + b.value, 0);

    autoTable(doc, {
        startY: y + 20,
        head: [['Fecha', 'Labor Realizada', 'Lote', 'Valor']],
        body: logs.map(l => [l.date, l.activityName, l.costCenterName, formatCurrency(l.value)]),
        foot: [['', '', 'TOTAL A PAGAR:', formatCurrency(total)]],
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.primary }
    });

    // Type casting to custom interface for type safety
    const finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 30;
    doc.line(20, finalY, 90, finalY);
    doc.text("Firma del Trabajador", 20, finalY + 5);
    doc.text(`CC: _________________`, 20, finalY + 12);
    doc.line(120, finalY, 190, finalY);
    doc.text("Firma Empleador", 120, finalY + 5);
    
    addFooter(doc);
    doc.save(`Recibo_${personName.replace(/\s/g, '_')}.pdf`);
};

export const generateSimulationPDF = (sim: any, params: any) => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Proyección Financiera 2025", `Escenario: ${params.varietyLabel}`, "Simulación", BRAND_COLORS.indigo);
    
    doc.setFontSize(10);
    doc.text(`Árboles: ${params.numTrees} | Densidad: ${params.density} | Precio Base: ${formatCurrency(params.marketPrice)}`, 14, y + 5);
    
    // Convert generic objects to arrays for autoTable
    const rows = sim.yearlyData.map((d: any) => [
        d.year,
        d.label,
        formatCurrency(d.totalIncome),
        formatCurrency(d.totalExpenses),
        formatCurrency(d.netCashFlow),
        formatCurrency(d.cumulativeFlow)
    ]);

    autoTable(doc, {
        startY: y + 15,
        head: [['Año', 'Fase', 'Ingresos', 'Egresos', 'Flujo Neto', 'Acumulado']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.indigo }
    });

    // Results Box
    const nextY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 10;
    doc.setFillColor(240, 240, 240);
    doc.rect(14, nextY, 180, 30, 'F');
    doc.setTextColor(0);
    doc.setFontSize(12);
    doc.text(`VPN: ${formatCurrency(sim.vpn)}`, 20, nextY + 10);
    doc.text(`TIR Estimada: ${sim.roi.toFixed(2)}% (ROI Simple)`, 20, nextY + 20);
    doc.text(`Recuperación: Año ${sim.paybackYear || 'N/A'}`, 100, nextY + 10);

    addFooter(doc);
    doc.save("Simulacion_Financiera.pdf");
};

export const generateSQLDump = (d: AppState) => {
    const sql = `-- Backup AgroBodega Pro\n-- Autor: Lucas Mateo Tabares Franco\n-- Fecha: ${new Date().toISOString()}\n\n`;
    const blob = new Blob([sql], {type: 'text/sql'});
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = "Backup_Local.sql";
    a.click();
};

export const generateManualPDF = () => {
    const doc = new jsPDF();
    const dateNow = new Date().toLocaleDateString();
    doc.setFillColor(...BRAND_COLORS.slate);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(32);
    doc.text("DATOSFINCA VIVA", 105, 100, { align: 'center' });
    doc.setFontSize(14);
    doc.text("SOFTWARE DE INTELIGENCIA AGRÍCOLA 360", 105, 115, { align: 'center' });
    doc.setDrawColor(255, 255, 255);
    doc.line(40, 130, 170, 130);
    doc.setFontSize(12);
    doc.text(`Autor: ${AUTHOR}`, 105, 150, { align: 'center' });
    doc.text(`Fecha de Edición: ${dateNow}`, 105, 160, { align: 'center' });
    doc.addPage();
    let y = addHeader(doc, "Marco Legal y Propiedad Intelectual", "Soporte para Dirección Nacional de Derechos de Autor", "VIVA CORE");
    doc.setTextColor(0);
    doc.setFontSize(10);
    const legalText = `
    1. TITULARIDAD: Lucas Mateo Tabares Franco es el autor y titular exclusivo.
    2. LEGISLACIÓN APLICABLE: Ley 23 de 1982, Ley 1581 de 2012 (Habeas Data).
    3. PRIVACIDAD: Los datos se almacenan bajo el paradigma "Local-First".
    `;
    doc.text(legalText, 14, y + 10, { maxWidth: 180 });
    addFooter(doc);
    doc.save(`MANUAL_TECNICO_DATOSFINCA_VIVA_${new Date().getFullYear()}.pdf`);
};

export const generateSpecsPDF = () => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Ficha Técnica y Funcional", "Prompt Maestro de Diseño", "VIVA CORE", BRAND_COLORS.indigo);
    doc.setFontSize(10);
    doc.setTextColor(0);

    const fullText = `
    1. RESUMEN GENERAL Y ARQUITECTURA
    
    Tipo de App: Web App Progresiva (PWA) optimizada para móviles.
    Stack Tecnológico: React 19, TypeScript, Vite, Tailwind CSS.
    Persistencia de Datos: Arquitectura "Local-First" usando IndexedDB (vía librería idb) para almacenamiento masivo y manejo de imágenes, con respaldo en localStorage. Funciona 100% Offline.
    Librerías Clave: jspdf (reportes PDF), xlsx (exportación Excel), lucide-react (iconos), recharts (gráficos).

    2. MÓDULOS PRINCIPALES Y FUNCIONES

    A. Gestión de Inventario y Bodega (El Corazón Matemático)
    El sistema gestiona insumos agrícolas con alta precisión matemática.
    - Conversión de Unidades Inteligente: Maneja unidades de compra (Bulto 50kg, Galón, Litro) vs. unidades de consumo (Gramo, Mililitro).
    - Cálculo de Costos (CPP): Implementa el Costo Promedio Ponderado.
      * Lógica: Si compraste Urea a precios diferentes, el sistema promedia el valor del stock actual.
      * Desglose: Al sacar un insumo, calcula el costo exacto. (Ej: Si un bulto de 50kg costó $120.000, y sacas 1kg, el sistema registra una salida de costo $2.400).
    - Categorías: Fertilizantes, Herbicidas, Fungicidas, Insecticidas, EPP, Herramientas.
    - Kárdex: Historial inmutable de entradas (compras con foto de factura) y salidas (asignadas a un lote específico).
    - Alertas: Stock mínimo y semáforos de inventario.

    B. Gestión de Lotes (Centros de Costo)
    - Estructura: Creación de lotes con nombre, área (Hectáreas), número de árboles y cultivo principal.
    - Ciclo de Vida (NIC 41):
      * Etapa Levante (CAPEX): Los costos se acumulan como inversión (Activo Biológico).
      * Etapa Producción (OPEX): El activo se activa y comienza a amortizarse; los costos se vuelven gastos operativos.
    - Diagnóstico de Densidad: Calcula árboles/hectárea y sugiere si la densidad es óptima, baja (pérdida de potencial) o alta (requiere renovación pronta).

    C. Nómina y Labores (Recursos Humanos)
    - Registro de Jornales: Asignación de labores (ej: "Plateo", "Recolección") a trabajadores en lotes específicos.
    - Cálculo de Rendimiento: Permite ingresar el área trabajada para calcular la eficiencia (Ej: Ha/Jornal o Kg/Día).
    - Factor Prestacional: Configurable (ej: 1.52 para Colombia) para calcular el costo real empresa vs. el pago neto al trabajador.
    - Liquidación: Generación de colillas de pago en PDF y control de saldos pendientes ("Deuda de Nómina").

    D. Cosecha y Ventas (Ingresos)
    - Registro de Producción: Ingreso de Kilos cosechados por lote.
    - Control de Calidad (Broca/Factor): Calculadora integrada para determinar el porcentaje de afectación y castigo en el precio.
    - Tipos de Cultivo: Formulario dinámico que cambia si es Café (Factor, Broca) o Plátano/Frutas (Calidad 1ra, 2da, Rechazo).
    - Ingresos: Registro del valor total de la venta para cruzar contra costos.

    E. Inteligencia Financiera y Estratégica (Simulador)
    - Simulador de Proyectos: Calculadora de VPN (Valor Presente Neto) y TIR (Tasa Interna de Retorno) proyectada a 6 años.
    - Análisis de Flujo de Caja: Proyección de ingresos vs. gastos operativos y CAPEX. Detecta meses de iliquidez ("Meses de crisis").
    - Punto de Equilibrio: Calcula cuánto debe producir un lote para pagar sus costos.
    - Costo por Arroba: Determina el costo de producción unitario (Ej: Costo por Carga de Café) para comparar con el precio de mercado.

    F. Gestión Técnica y Cumplimiento (BPA)
    - Lluvias (Pluviometría): Registro diario de milímetros de agua.
    - Maquinaria: Bitácora de mantenimientos y costos de operación.
    - Sanidad: Monitoreo de plagas y enfermedades.
    - Fenología: Registro de etapas (Floración) para proyectar la cosecha futura (T+8 meses).
    - Seguridad (SST): Registro de entrega de EPP y gestión de residuos (triple lavado).

    3. REPORTES Y EXPORTACIÓN
    El sistema genera documentos profesionales para auditoría y gestión:
    - Libro Maestro (Excel): Exporta TODA la base de datos en múltiples pestañas.
    - PDFs Gerenciales: Informe Ejecutivo, Inventario Valorizado, Comprobantes de Egreso, Dossier Agronómico.
    - Backup: Generación de archivos JSON y SQL para respaldo local.

    4. INTERFAZ DE USUARIO (UI/UX)
    - Diseño: Estilo "Glassmorphism" oscuro/claro (Dark Mode).
    - Navegación intuitiva con menús táctiles grandes para trabajo en campo.
    
    5. REQUISITOS LEGALES
    - Cumplimiento de leyes de Habeas Data y Derechos de Autor (Lucas Mateo Tabares Franco).
    `;

    const splitText = doc.splitTextToSize(fullText, 180);
    
    let currentY = y + 10;
    splitText.forEach((line: string) => {
        if (currentY > 280) {
            doc.addPage();
            currentY = 20;
        }
        doc.text(line, 15, currentY);
        currentY += 5;
    });

    addFooter(doc);
    doc.save(`FICHA_TECNICA_DATOSFINCA_VIVA.pdf`);
};

export const getDemoData = (): AppState => {
    const id = generateId();
    return {
        warehouses: [{ id, name: 'Finca Demo', created: new Date().toISOString(), ownerId: 'demo_user' }],
        activeWarehouseId: id,
        inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], 
        activities: [], laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], 
        rainLogs: [], financeLogs: [], soilAnalyses: [], ppeLogs: [], wasteLogs: [], 
        agenda: [], phenologyLogs: [], pestLogs: [], plannedLabors: [], budgets: [], 
        assets: [], bpaChecklist: {}, laborFactor: 1.0
    };
};