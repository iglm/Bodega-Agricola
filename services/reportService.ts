
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx';
import { AppState, LaborLog, RainLog } from '../types';
import { convertToBase, formatCurrency, formatBaseQuantity, getCostPerGramOrMl } from './inventoryService';

// --- SHARED CONFIG ---
const BRAND_COLORS = {
    dark: [6, 78, 59], // Emerald 900
    primary: [5, 150, 105], // Emerald 600
    slate: [15, 23, 42], // Slate 900
    light: [236, 253, 245], // Emerald 50
    amber: [245, 158, 11], // Amber 500 for Labor
    yellow: [234, 179, 8], // Yellow for Harvest
    orange: [249, 115, 22], // Orange for Machinery
    blue: [37, 99, 235] // Blue for Rain
};

const addHeader = (doc: jsPDF, title: string, subtitle: string, warehouseName: string, themeColor: number[] = BRAND_COLORS.dark) => {
    const currentDate = new Date();
    
    // Top Banner
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.rect(0, 0, 210, 35, 'F'); 

    // App Name
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("AgroSuite 360", 14, 22);

    // Subtitle
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255); 
    doc.setFont("helvetica", "normal");
    doc.text(title, 14, 28);

    // Info Box
    doc.setFontSize(10);
    doc.text("Fecha:", 140, 15);
    doc.setFont("helvetica", "bold");
    doc.text(currentDate.toLocaleDateString(), 200, 15, { align: 'right' });
    
    doc.setFont("helvetica", "normal");
    doc.text("Sede:", 140, 20);
    doc.setFont("helvetica", "bold");
    doc.text(warehouseName, 200, 20, { align: 'right' });
    
    return 45; // Start Y for content
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
        doc.text('Generado por AgroSuite 360 - Ing. Lucas Mateo Tabares Franco', 14, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, 196, pageHeight - 10, { align: 'right' });
    }
};

// --- NEW: FIELD TEMPLATES (FOR ILLITERATE/MANUAL WORKERS) ---
export const generateFieldTemplates = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    // PAGE 1: LABOR (JORNALES)
    let yPos = addHeader(doc, "Planilla de Campo: Control de Jornales", "Llenar diariamente", activeWarehouseName, BRAND_COLORS.amber);
    
    // Helper Lists for Reference
    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text("Referencia Rápida (Trabajadores):", 14, yPos);
    let x = 14; 
    let y = yPos + 5;
    data.personnel.forEach((p, i) => {
        if(x > 180) { x = 14; y += 5; }
        doc.text(`• ${p.name}`, x, y);
        x += 50;
    });
    
    y += 8;
    doc.text("Referencia Rápida (Labores):", 14, y);
    x = 14; y += 5;
    data.activities.forEach((a, i) => {
        if(x > 180) { x = 14; y += 5; }
        doc.text(`• ${a.name}`, x, y);
        x += 50;
    });

    // Empty Grid for Writing
    const emptyRows = Array(15).fill(["", "", "", "", ""]);
    autoTable(doc, {
        startY: y + 10,
        head: [['Fecha', 'Nombre Trabajador', 'Labor Realizada', 'Lote / Sitio', 'Jornales (1, 0.5)']],
        body: emptyRows,
        theme: 'grid',
        styles: { fontSize: 11, minCellHeight: 12, valign: 'middle' },
        headStyles: { fillColor: [245, 158, 11], textColor: 255 }
    });

    // PAGE 2: HARVEST (COSECHAS)
    doc.addPage();
    yPos = addHeader(doc, "Planilla de Campo: Recolección y Cosecha", "Registro de Producción", activeWarehouseName, BRAND_COLORS.yellow);
    
    // Empty Grid
    const harvestRows = Array(15).fill(["", "", "", "Kg / Arrobas / Uni"]);
    autoTable(doc, {
        startY: yPos + 10,
        head: [['Fecha', 'Lote / Origen', 'Cultivo / Producto', 'Cantidad Recolectada']],
        body: harvestRows,
        theme: 'grid',
        styles: { fontSize: 11, minCellHeight: 12, valign: 'middle' },
        headStyles: { fillColor: [234, 179, 8], textColor: 255 }
    });

    addFooter(doc);
    doc.save(`Planillas_Campo_${activeWarehouseName}.pdf`);
};

// --- NEW: EXCEL IMPORT TEMPLATE ---
export const generateExcelImportTemplate = () => {
    const wb = XLSX.utils.book_new();
    
    // Sheet 1: Jornales
    const wsLabor = XLSX.utils.aoa_to_sheet([
        ["Fecha", "Trabajador", "Labor", "Lote", "Valor", "Notas"],
        ["2024-01-01", "Nombre Exacto Aqui", "Nombre Labor Aqui", "Nombre Lote Aqui", 50000, "Opcional"],
        ["2024-01-02", "Juan Perez", "Guadaña", "Lote 1", 60000, ""]
    ]);
    XLSX.utils.book_append_sheet(wb, wsLabor, "Jornales (Importar)");

    // Sheet 2: Cosechas
    const wsHarvest = XLSX.utils.aoa_to_sheet([
        ["Fecha", "Lote", "Cultivo", "Cantidad", "Unidad", "ValorTotal", "Notas"],
        ["2024-01-01", "Lote 1", "Cafe", 100, "Kg", 500000, ""]
    ]);
    XLSX.utils.book_append_sheet(wb, wsHarvest, "Cosechas (Importar)");

    XLSX.writeFile(wb, "Plantilla_Carga_Masiva_AgroSuite.xlsx");
};

// ... [Keep existing export functions: generateOrderPDF, generatePDF, generateExcel, etc.] ...

export const generateOrderPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    let yPos = addHeader(doc, "Orden de Pedido Sugerida", "Reabastecimiento", activeWarehouseName);
    const lowStockItems = data.inventory.filter(item => {
        return item.minStock && item.currentQuantity <= item.minStock;
    });
    if (lowStockItems.length === 0) {
        doc.setFontSize(12);
        doc.setTextColor(100);
        doc.text("No hay ítems con stock bajo en este momento.", 14, yPos);
        doc.save("Orden_Pedido_Vacia.pdf");
        return;
    }
    doc.setFontSize(12);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.text("Ítems con Stock Crítico", 14, yPos);
    yPos += 5;
    const rows = lowStockItems.map(item => {
        const deficit = (item.minStock || 0) * 2 - item.currentQuantity;
        const suggestedQty = deficit > 0 ? deficit : 0;
        return [
            item.name,
            item.category,
            formatBaseQuantity(item.currentQuantity, item.baseUnit),
            formatBaseQuantity(item.minStock || 0, item.baseUnit),
            formatBaseQuantity(suggestedQty, item.baseUnit) + " (Sugerido)"
        ];
    });
    autoTable(doc, {
        startY: yPos,
        head: [['Producto', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Cantidad a Pedir']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [220, 38, 38] }, // Red header for alert
    });
    addFooter(doc);
    doc.save(`Pedido_Sugerido_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generatePDF = (data: AppState) => {
  const doc = new jsPDF();
  const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega Principal';
  let yPos = addHeader(doc, "Reporte General de Inventario", "Valoración CPP", activeWarehouseName);
  doc.setFontSize(14);
  doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
  doc.setFont("helvetica", "bold");
  doc.text("1. Valoración de Inventario (Costo Promedio)", 14, yPos);
  doc.setDrawColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 2, 105, yPos + 2);
  const inventoryRows = data.inventory.map(item => {
    const costPerBase = getCostPerGramOrMl(item);
    const totalValue = item.currentQuantity * costPerBase;
    const baseInDisplay = convertToBase(1, item.lastPurchaseUnit);
    const avgCostDisplay = costPerBase * baseInDisplay;
    return [
      item.name,
      item.category,
      formatBaseQuantity(item.currentQuantity, item.baseUnit),
      `${formatCurrency(avgCostDisplay)} / ${item.lastPurchaseUnit}`,
      formatCurrency(totalValue)
    ];
  });
  autoTable(doc, {
    startY: yPos + 8,
    head: [['Producto', 'Categoría', 'Stock', 'Costo Prom. Unit.', 'Valor Total']],
    body: inventoryRows,
    theme: 'grid',
    headStyles: { 
      fillColor: BRAND_COLORS.slate, 
      textColor: 255,
      fontStyle: 'bold',
      halign: 'center'
    },
    styles: { fontSize: 9, cellPadding: 3 },
    columnStyles: {
      4: { halign: 'right', fontStyle: 'bold', textColor: BRAND_COLORS.primary }
    },
  });
  const finalY = (doc as any).lastAutoTable.finalY || 100;
  let nextY = finalY + 15;
  if (nextY > 270) { doc.addPage(); nextY = 20; }
  doc.setFontSize(14);
  doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
  doc.setFont("helvetica", "bold");
  doc.text("2. Historial de Movimientos", 14, nextY);
  doc.line(14, nextY + 2, 80, nextY + 2);
  const movementRows = data.movements.map(m => {
    let details = '';
    if(m.type === 'IN') {
        details = m.supplierName ? `Prov: ${m.supplierName}` : '';
        if(m.invoiceNumber) details += `\nFact: ${m.invoiceNumber}`;
    } else {
        if (m.machineName) details = `MAQ: ${m.machineName}`;
        else details = m.costCenterName ? `LOTE: ${m.costCenterName}` : '';
        if(m.personnelName) details += `\nResp: ${m.personnelName}`;
    }
    return [
      new Date(m.date).toLocaleDateString(),
      m.type === 'IN' ? 'ENTRADA' : 'SALIDA',
      m.itemName,
      details,
      `${m.quantity} ${m.unit}`,
      formatCurrency(m.calculatedCost)
    ];
  });
  autoTable(doc, {
    startY: nextY + 8,
    head: [['Fecha', 'Tipo', 'Producto', 'Detalles', 'Cant.', 'Costo Real']],
    body: movementRows,
    theme: 'striped',
    headStyles: { fillColor: BRAND_COLORS.primary },
    styles: { fontSize: 8 },
    columnStyles: {
        5: { halign: 'right' }
    }
  });
  addFooter(doc);
  doc.save(`Reporte_Inventario_${activeWarehouseName}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateExcel = (data: AppState) => {
  const wb = XLSX.utils.book_new();
  const invHeader = [
    { v: "Producto", s: { font: { bold: true } } },
    { v: "Categoría", s: { font: { bold: true } } },
    { v: "Stock Base", s: { font: { bold: true } } },
    { v: "Costo Promedio (Calc)", s: { font: { bold: true } } },
    { v: "Valor Total", s: { font: { bold: true } } }
  ];
  const invBody = data.inventory.map(item => {
    const costPerBase = getCostPerGramOrMl(item);
    return [
      item.name,
      item.category,
      formatBaseQuantity(item.currentQuantity, item.baseUnit),
      costPerBase,
      item.currentQuantity * costPerBase
    ];
  });
  const wsInv = XLSX.utils.aoa_to_sheet([invHeader, ...invBody]);
  XLSX.utils.book_append_sheet(wb, wsInv, "Inventario CPP");
  const movHeader = ["Fecha", "Tipo", "Producto", "Tercero", "Responsable", "Cantidad", "Costo Op."];
  const movBody = data.movements.map(m => [
      new Date(m.date).toLocaleDateString(),
      m.type,
      m.itemName,
      m.type === 'IN' ? m.supplierName : (m.machineName || m.costCenterName),
      m.personnelName || '-',
      `${m.quantity} ${m.unit}`,
      m.calculatedCost
  ]);
  const wsMov = XLSX.utils.aoa_to_sheet([movHeader, ...movBody]);
  XLSX.utils.book_append_sheet(wb, wsMov, "Kardex");
  XLSX.writeFile(wb, `AgroBodega_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateLaborPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    let yPos = addHeader(doc, "Reporte de Mano de Obra", "Jornales y Labores", activeWarehouseName, BRAND_COLORS.amber);
    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Resumen de Jornales", 14, yPos);
    doc.setDrawColor(245, 158, 11);
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 2, 105, yPos + 2);
    const laborRows = (data.laborLogs || []).map(log => [
        new Date(log.date).toLocaleDateString(),
        log.personnelName,
        log.activityName,
        log.costCenterName,
        formatCurrency(log.value),
        log.paid ? 'PAGADO' : 'PENDIENTE'
    ]);
    const totalCost = (data.laborLogs || []).reduce((acc, log) => acc + log.value, 0);
    autoTable(doc, {
        startY: yPos + 8,
        head: [['Fecha', 'Trabajador', 'Labor', 'Lote / Destino', 'Valor', 'Estado']],
        body: laborRows,
        theme: 'striped',
        headStyles: { fillColor: [217, 119, 6] },
        styles: { fontSize: 8 },
        columnStyles: {
            4: { halign: 'right', fontStyle: 'bold' }
        },
        foot: [['', '', '', 'TOTAL', formatCurrency(totalCost), '']],
        footStyles: { fillColor: [251, 191, 36], textColor: 50, fontStyle: 'bold', halign: 'right' }
    });
    addFooter(doc);
    doc.save(`Reporte_Jornales_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateLaborExcel = (data: AppState) => {
    const wb = XLSX.utils.book_new();
    const header = [
        { v: "Fecha", s: { font: { bold: true } } },
        { v: "Trabajador", s: { font: { bold: true } } },
        { v: "Labor / Actividad", s: { font: { bold: true } } },
        { v: "Lote / Destino", s: { font: { bold: true } } },
        { v: "Valor Jornal", s: { font: { bold: true } } },
        { v: "Estado", s: { font: { bold: true } } }
    ];
    const body = (data.laborLogs || []).map(log => [
        new Date(log.date).toLocaleDateString(),
        log.personnelName,
        log.activityName,
        log.costCenterName,
        log.value,
        log.paid ? 'Pagado' : 'Pendiente'
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    XLSX.utils.book_append_sheet(wb, ws, "Jornales y Labores");
    XLSX.writeFile(wb, `AgroBodega_ManoObra_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generateRainPDF = (rainLogs: RainLog[], warehouseName: string) => {
    const doc = new jsPDF();
    let yPos = addHeader(doc, "Registro Pluviométrico", "Control de Lluvias", warehouseName, BRAND_COLORS.blue);
    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Precipitaciones", 14, yPos);
    doc.setDrawColor(37, 99, 235);
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 2, 105, yPos + 2);
    const rows = rainLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => [
        new Date(r.date).toLocaleDateString(),
        `${r.millimeters} mm`
    ]);
    const totalRain = rainLogs.reduce((acc, r) => acc + r.millimeters, 0);
    autoTable(doc, {
        startY: yPos + 8,
        head: [['Fecha', 'Milímetros (Lluvia)']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] },
        styles: { fontSize: 10, halign: 'center' },
        foot: [['TOTAL ACUMULADO', `${totalRain} mm`]],
        footStyles: { fillColor: [147, 197, 253], textColor: 0, fontStyle: 'bold' }
    });
    addFooter(doc);
    doc.save(`Reporte_Lluvias_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateRainExcel = (rainLogs: RainLog[]) => {
    const wb = XLSX.utils.book_new();
    const header = [
        { v: "Fecha", s: { font: { bold: true } } },
        { v: "Milímetros", s: { font: { bold: true } } }
    ];
    const body = rainLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => [
        new Date(r.date).toLocaleDateString(),
        r.millimeters
    ]);
    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    XLSX.utils.book_append_sheet(wb, ws, "Pluviometría");
    XLSX.writeFile(wb, `AgroBodega_Lluvias_${new Date().toISOString().split('T')[0]}.xlsx`);
};

export const generatePaymentReceipt = (workerName: string, logs: LaborLog[], warehouseName: string) => {
    if (!logs || logs.length === 0) return;
    const name = workerName || 'Trabajador';
    const doc = new jsPDF({
        unit: 'mm',
        format: [80, 200]
    });
    const total = logs.reduce((acc, l) => acc + (l.value || 0), 0);
    const date = new Date().toLocaleDateString();
    const safeText = (text: string, x: number, y: number, options?: any) => {
        try {
            doc.text(String(text), x, y, options);
        } catch (e) {
            console.warn("Text rendering error", e);
        }
    };
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    safeText("AgroSuite 360", 40, 5, { align: 'center' });
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    safeText("Comprobante de Pago", 40, 10, { align: 'center' });
    safeText("--------------------------------", 40, 13, { align: 'center' });
    doc.setFontSize(7);
    safeText(`Fecha: ${date}`, 5, 18);
    safeText(`Trabajador:`, 5, 22);
    doc.setFont("helvetica", "bold");
    safeText(name, 5, 26);
    let y = 32;
    doc.setFont("helvetica", "bold");
    safeText("Concepto", 5, y);
    safeText("Valor", 75, y, { align: 'right' });
    y += 2;
    doc.line(5, y, 75, y);
    y += 3;
    doc.setFont("helvetica", "normal");
    logs.forEach(log => {
        const laborName = (log.activityName || 'Labor').slice(0, 15);
        const dateStr = log.date ? new Date(log.date).toLocaleDateString().slice(0,5) : '--/--';
        safeText(`${dateStr} - ${laborName}`, 5, y);
        safeText(formatCurrency(log.value || 0), 75, y, { align: 'right' });
        y += 4;
        if (y > 190) {
            doc.addPage();
            y = 10;
        }
    });
    y += 2;
    doc.line(5, y, 75, y);
    y += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    safeText("TOTAL PAGADO", 5, y);
    safeText(formatCurrency(total), 75, y, { align: 'right' });
    y += 10;
    doc.setFontSize(6);
    safeText("Firma Recibido:", 5, y);
    doc.line(25, y, 75, y);
    y += 10;
    safeText("Desarrollado por:", 40, y, { align: 'center' });
    safeText("Lucas Mateo Tabares Franco", 40, y + 3, { align: 'center' });
    const safeFilename = name.replace(/[^a-zA-Z0-9]/g, '_');
    doc.save(`Pago_${safeFilename}_${new Date().toISOString().split('T')[0]}.pdf`);
}

export const generateHarvestPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    let yPos = addHeader(doc, "Reporte de Producción", "Cosechas e Ingresos", activeWarehouseName, BRAND_COLORS.yellow);
    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Recolección", 14, yPos);
    doc.setDrawColor(234, 179, 8);
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 2, 105, yPos + 2);
    const rows = (data.harvests || []).map(h => [
        new Date(h.date).toLocaleDateString(),
        h.costCenterName,
        h.cropName,
        `${h.quantity} ${h.unit}`,
        formatCurrency(h.totalValue)
    ]);
    const totalIncome = (data.harvests || []).reduce((acc, h) => acc + h.totalValue, 0);
    autoTable(doc, {
        startY: yPos + 8,
        head: [['Fecha', 'Lote / Origen', 'Cultivo', 'Cantidad', 'Valor Venta']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [202, 138, 4] },
        styles: { fontSize: 8 },
        columnStyles: {
            4: { halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] }
        },
        foot: [['', '', '', 'TOTAL INGRESOS', formatCurrency(totalIncome)]],
        footStyles: { fillColor: [254, 240, 138], textColor: 50, fontStyle: 'bold', halign: 'right' }
    });
    addFooter(doc);
    doc.save(`Reporte_Produccion_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateMachineryPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    let yPos = addHeader(doc, "Reporte de Maquinaria", "Mantenimiento y Costos", activeWarehouseName, BRAND_COLORS.orange);
    (data.machines || []).forEach(machine => {
        const logs = (data.maintenanceLogs || []).filter(l => l.machineId === machine.id);
        const totalMachineCost = logs.reduce((acc, l) => acc + l.cost, 0);
        if (yPos > 250) { doc.addPage(); yPos = 20; }
        doc.setFontSize(12);
        doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`Máquina: ${machine.name}`, 14, yPos);
        
        const rows = logs.map(l => [
            new Date(l.date).toLocaleDateString(),
            l.type,
            l.description,
            l.usageAmount ? `${l.usageAmount} h/km` : '-',
            formatCurrency(l.cost)
        ]);

        if (rows.length === 0) {
            doc.setFontSize(10);
            doc.setFont("helvetica", "italic");
            doc.text("Sin registros de mantenimiento.", 14, yPos + 6);
            yPos += 15;
        } else {
             autoTable(doc, {
                startY: yPos + 3,
                head: [['Fecha', 'Tipo', 'Descripción', 'Uso', 'Costo']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [234, 88, 12], fontSize: 8 },
                styles: { fontSize: 8 },
                columnStyles: { 4: { halign: 'right' } },
                foot: [['', '', '', 'TOTAL MÁQUINA', formatCurrency(totalMachineCost)]],
                footStyles: { fillColor: [255, 237, 213], textColor: 0, fontStyle: 'bold', halign: 'right' }
            });
            yPos = (doc as any).lastAutoTable.finalY + 10;
        }
    });
    if ((data.machines || []).length === 0) {
        doc.text("No hay maquinaria registrada.", 14, yPos);
    }
    addFooter(doc);
    doc.save(`Reporte_Maquinaria_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateGlobalReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    let yPos = addHeader(doc, "Informe Gerencial Unificado", "Estado Global de la Finca", activeWarehouseName, [59, 130, 246]); 
    
    // Income
    const harvestIncome = (data.harvests || []).reduce((acc, h) => acc + h.totalValue, 0);
    const otherIncome = (data.financeLogs || []).filter(f => f.type === 'INCOME').reduce((acc, f) => acc + f.amount, 0);
    const totalIncome = harvestIncome + otherIncome;

    // Expenses
    const totalLabor = (data.laborLogs || []).reduce((acc, l) => acc + l.value, 0);
    const totalInputs = data.movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
    const totalMaint = (data.maintenanceLogs || []).reduce((acc, m) => acc + m.cost, 0);
    const totalAdmin = (data.financeLogs || []).filter(f => f.type === 'EXPENSE').reduce((acc, f) => acc + f.amount, 0);
    
    const totalExpenses = totalLabor + totalInputs + totalMaint + totalAdmin;
    const netProfit = totalIncome - totalExpenses;

    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.setFont("helvetica", "bold");
    doc.text("1. Balance General (P&G)", 14, yPos);
    doc.line(14, yPos + 2, 105, yPos + 2);
    
    const summaryData = [
        ['(+) Ventas Cosecha', formatCurrency(harvestIncome)],
        ['(+) Otros Ingresos', formatCurrency(otherIncome)],
        ['(-) Costo Mano de Obra', formatCurrency(totalLabor)],
        ['(-) Costo Insumos', formatCurrency(totalInputs)],
        ['(-) Costo Maquinaria', formatCurrency(totalMaint)],
        ['(-) Gastos Administrativos', formatCurrency(totalAdmin)],
        ['UTILIDAD NETA REAL', formatCurrency(netProfit)]
    ];

    autoTable(doc, {
        startY: yPos + 8,
        head: [['Concepto', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] },
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        didParseCell: function(data) {
            if (data.row.index === 6 && data.column.index === 1) {
                if (netProfit >= 0) data.cell.styles.textColor = [22, 163, 74];
                else data.cell.styles.textColor = [220, 38, 38];
            }
        }
    });
    
    let nextY = (doc as any).lastAutoTable.finalY + 15;
    if (nextY > 260) { doc.addPage(); nextY = 20; }
    
    // Admin Details
    if ((data.financeLogs || []).length > 0) {
        doc.setFontSize(14);
        doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
        doc.text("2. Detalle Gastos Administrativos", 14, nextY);
        doc.line(14, nextY + 2, 80, nextY + 2);
        
        const adminRows = (data.financeLogs || [])
            .filter(f => f.type === 'EXPENSE')
            .slice(0, 10)
            .map(f => [
                new Date(f.date).toLocaleDateString(),
                f.category,
                f.description,
                formatCurrency(f.amount)
            ]);
            
        autoTable(doc, {
            startY: nextY + 8,
            head: [['Fecha', 'Categoría', 'Descripción', 'Valor']],
            body: adminRows,
            theme: 'striped',
            headStyles: { fillColor: [71, 85, 105] },
            columnStyles: { 3: { halign: 'right' } }
        });
        nextY = (doc as any).lastAutoTable.finalY + 15;
    }

    addFooter(doc);
    doc.save(`Informe_Gerencial_Unificado_${new Date().toISOString().split('T')[0]}.pdf`);
};

// ... [Keep Manual PDF Generator] ...
// --- MANUAL PDF GENERATOR (EXTENDED VERSION) ---
export const generateManualPDF = () => {
    const doc = new jsPDF();
    
    // Config
    const margin = 14;
    const pageWidth = 180;
    const lineHeight = 5;
    let y = 40;

    // Helper functions
    const addSectionTitle = (title: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        y += 5;
        doc.setFontSize(16);
        doc.setTextColor(6, 78, 59); // Emerald
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, y);
        y += 8;
        doc.setLineWidth(0.5);
        doc.setDrawColor(6, 78, 59);
        doc.line(margin, y-2, margin + 100, y-2);
        y += 5;
    };

    const addSubTitle = (title: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        y += 3;
        doc.setFontSize(12);
        doc.setTextColor(20, 20, 20);
        doc.setFont("helvetica", "bold");
        doc.text(title, margin, y);
        y += 6;
    };

    const addParagraph = (text: string) => {
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(text, pageWidth);
        
        if (y + splitText.length * lineHeight > 280) { doc.addPage(); y = 20; }
        
        doc.text(splitText, margin, y);
        y += splitText.length * lineHeight + 4;
    };

    const addBullet = (text: string) => {
        doc.setFontSize(10);
        doc.setTextColor(50, 50, 50);
        const splitText = doc.splitTextToSize(text, pageWidth - 5);
        if (y + splitText.length * lineHeight > 280) { doc.addPage(); y = 20; }
        doc.text("\u2022", margin, y);
        doc.text(splitText, margin + 5, y);
        y += splitText.length * lineHeight + 2;
    };

    const addBox = (type: 'info' | 'alert', text: string) => {
        doc.setFontSize(9);
        const splitText = doc.splitTextToSize(text, pageWidth - 10);
        const boxHeight = splitText.length * lineHeight + 10;
        
        if (y + boxHeight > 280) { doc.addPage(); y = 20; }
        
        if (type === 'info') {
            doc.setFillColor(239, 246, 255); // Light Blue
            doc.setDrawColor(59, 130, 246);
            doc.setTextColor(30, 64, 175);
        } else {
            doc.setFillColor(254, 242, 242); // Light Red
            doc.setDrawColor(239, 68, 68);
            doc.setTextColor(153, 27, 27);
        }
        
        doc.rect(margin, y, pageWidth, boxHeight, 'FD');
        doc.text(splitText, margin + 5, y + 7);
        y += boxHeight + 8;
    };

    // --- COVER PAGE ---
    doc.setFillColor(6, 78, 59);
    doc.rect(0, 0, 210, 297, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(32);
    doc.setFont("helvetica", "bold");
    doc.text("AgroSuite 360", 105, 100, { align: 'center' });
    doc.setFontSize(16);
    doc.setFont("helvetica", "normal");
    doc.text("Manual Oficial de Operación y Gestión", 105, 115, { align: 'center' });
    doc.setFontSize(12);
    doc.text("Versión 4.0 - Gerencia Total", 105, 125, { align: 'center' });
    doc.text("Ing. Lucas Mateo Tabares Franco", 105, 250, { align: 'center' });
    doc.addPage();

    // --- CONTENT ---
    addSectionTitle("1. Filosofía Gerencia Total");
    addParagraph("AgroSuite 360 no es solo una bodega; es un ERP agrícola completo. La diferencia entre un agricultor y un empresario del agro es que el segundo conoce sus 'Costos Ocultos'.");
    addBox("info", "REGLA DE ORO: La utilidad real es lo que queda después de pagar TODOS los gastos, incluyendo los administrativos (luz, impuestos, banco), no solo los insumos.");

    addSectionTitle("2. Gestión de Inventario (Costos Operativos)");
    addSubTitle("El Concepto de Costo Promedio Ponderado (CPP)");
    addParagraph("El sistema no usa el precio de la última compra para valorar su stock, sino un promedio matemático. Esto evita que fluctuaciones de precio distorsionen su contabilidad.");
    addBox("info", "Ejemplo: Si tiene 1 bulto de urea a $100.000 y compra otro a $120.000, el sistema valorará ambos a $110.000. Al gastar 1kg, descontará $2.200, no $2.000 ni $2.400.");

    addSectionTitle("3. Módulo de Finanzas (NUEVO)");
    addParagraph("Este es el cerebro financiero de la finca. Aquí se registran los movimientos que NO son insumos ni mano de obra directa.");
    addSubTitle("Gastos Administrativos (Overhead)");
    addBullet("Servicios Públicos (Luz, Agua, Internet de la oficina).");
    addBullet("Impuestos (Predial, Renta).");
    addBullet("Gastos Bancarios (Cuotas de manejo, intereses).");
    addBullet("Transporte de Gerencia (Gasolina camioneta).");
    addSubTitle("Otros Ingresos");
    addBullet("Venta de activos (Maquinaria vieja, madera, etc).");
    addBullet("Préstamos bancarios (Entrada de dinero).");

    addSectionTitle("4. Interpretación de Indicadores");
    addSubTitle("Margen Bruto vs. Utilidad Neta");
    addParagraph("El sistema ahora le muestra dos realidades:");
    addBullet("Margen Operativo: (Ventas - Insumos - Mano Obra). Dice si el cultivo es bueno.");
    addBullet("Utilidad Neta: (Margen Operativo - Gastos Administrativos). Dice si la EMPRESA es buena.");
    addBox("alert", "Si su Margen Operativo es positivo pero su Utilidad Neta es negativa, significa que su estructura administrativa es muy costosa para el tamaño de su producción.");

    addFooter(doc);
    doc.save("Manual_AgroSuite_360.pdf");
};
