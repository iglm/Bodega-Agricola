
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
    doc.text("AgroBodega Pro", 14, 22);

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
    doc.text("Bodega:", 140, 20);
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
        doc.text('Generado por AgroBodega Pro - Ing. Lucas Mateo Tabares Franco', 14, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, 196, pageHeight - 10, { align: 'right' });
    }
};

export const generateOrderPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    let yPos = addHeader(doc, "Orden de Pedido Sugerida", "Reabastecimiento", activeWarehouseName);

    // Filter items with low stock
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
        // Suggest purchasing enough to reach 2x min stock (simple logic)
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

  // --- SECTION 1: INVENTORY SNAPSHOT ---
  doc.setFontSize(14);
  doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
  doc.setFont("helvetica", "bold");
  doc.text("1. Valoración de Inventario (Costo Promedio)", 14, yPos);
  
  doc.setDrawColor(BRAND_COLORS.primary[0], BRAND_COLORS.primary[1], BRAND_COLORS.primary[2]);
  doc.setLineWidth(0.5);
  doc.line(14, yPos + 2, 105, yPos + 2);

  const inventoryRows = data.inventory.map(item => {
    // Use Average Cost for valuation
    const costPerBase = getCostPerGramOrMl(item);
    const totalValue = item.currentQuantity * costPerBase;
    
    // Convert avg cost to display unit (last purchase unit)
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

  // --- SECTION 2: MOVEMENTS ---
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
  // Same structure as before, but ensure AverageCost is used for valuation columns
  const wb = XLSX.utils.book_new();
  const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';

  // --- SHEET 1: INVENTARIO ---
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

  // --- SHEET 2: MOVIMIENTOS ---
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
    
    doc.setDrawColor(245, 158, 11); // Amber
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
        headStyles: { fillColor: [217, 119, 6] }, // Amber 600
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

// --- NEW RAIN REPORTS ---
export const generateRainPDF = (rainLogs: RainLog[], warehouseName: string) => {
    const doc = new jsPDF();
    let yPos = addHeader(doc, "Registro Pluviométrico", "Control de Lluvias", warehouseName, BRAND_COLORS.blue);

    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Precipitaciones", 14, yPos);
    
    doc.setDrawColor(37, 99, 235); // Blue
    doc.setLineWidth(0.5);
    doc.line(14, yPos + 2, 105, yPos + 2);

    const rows = rainLogs.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(r => [
        new Date(r.date).toLocaleDateString(),
        `${r.millimeters} mm`
    ]);

    // Calculate total rain (optional stat)
    const totalRain = rainLogs.reduce((acc, r) => acc + r.millimeters, 0);

    autoTable(doc, {
        startY: yPos + 8,
        head: [['Fecha', 'Milímetros (Lluvia)']],
        body: rows,
        theme: 'striped',
        headStyles: { fillColor: [37, 99, 235] }, // Blue 600
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

// --- PAYMENT SLIP GENERATOR ---
export const generatePaymentReceipt = (workerName: string, logs: LaborLog[], warehouseName: string) => {
    // Robust checks to prevent crashes
    if (!logs || logs.length === 0) return;
    const name = workerName || 'Trabajador';

    const doc = new jsPDF({
        unit: 'mm',
        format: [80, 200] // Thermal receipt format approximation
    });

    const total = logs.reduce((acc, l) => acc + (l.value || 0), 0);
    const date = new Date().toLocaleDateString();

    // Helper to safely add text
    const safeText = (text: string, x: number, y: number, options?: any) => {
        try {
            doc.text(String(text), x, y, options);
        } catch (e) {
            console.warn("Text rendering error", e);
        }
    };

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    safeText("AgroBodega Pro", 40, 5, { align: 'center' });
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
        // Truncate long strings to prevent layout break
        const laborName = (log.activityName || 'Labor').slice(0, 15);
        const dateStr = log.date ? new Date(log.date).toLocaleDateString().slice(0,5) : '--/--';
        
        safeText(`${dateStr} - ${laborName}`, 5, y);
        safeText(formatCurrency(log.value || 0), 75, y, { align: 'right' });
        y += 4;
        
        // Prevent writing off page
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

// --- NEW HARVEST REPORT ---
export const generateHarvestPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    let yPos = addHeader(doc, "Reporte de Producción", "Cosechas e Ingresos", activeWarehouseName, BRAND_COLORS.yellow);

    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Recolección", 14, yPos);
    
    doc.setDrawColor(234, 179, 8); // Yellow
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
        headStyles: { fillColor: [202, 138, 4] }, // Yellow 700
        styles: { fontSize: 8 },
        columnStyles: {
            4: { halign: 'right', fontStyle: 'bold', textColor: [21, 128, 61] } // Green text for income
        },
        foot: [['', '', '', 'TOTAL INGRESOS', formatCurrency(totalIncome)]],
        footStyles: { fillColor: [254, 240, 138], textColor: 50, fontStyle: 'bold', halign: 'right' }
    });

    addFooter(doc);
    doc.save(`Reporte_Produccion_${new Date().toISOString().split('T')[0]}.pdf`);
};

// --- NEW MACHINERY REPORT ---
export const generateMachineryPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    let yPos = addHeader(doc, "Reporte de Maquinaria", "Mantenimiento y Costos", activeWarehouseName, BRAND_COLORS.orange);

    // Iterate through each machine to create a section
    (data.machines || []).forEach(machine => {
        
        // Find Maint Logs
        const logs = (data.maintenanceLogs || []).filter(l => l.machineId === machine.id);
        const totalMachineCost = logs.reduce((acc, l) => acc + l.cost, 0);

        if (yPos > 250) { doc.addPage(); yPos = 20; }

        doc.setFontSize(12);
        doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
        doc.setFont("helvetica", "bold");
        doc.text(`Máquina: ${machine.name}`, 14, yPos);
        
        // Subtable
        const rows = logs.map(l => [
            new Date(l.date).toLocaleDateString(),
            l.type,
            l.description,
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
                head: [['Fecha', 'Tipo', 'Descripción', 'Costo']],
                body: rows,
                theme: 'grid',
                headStyles: { fillColor: [234, 88, 12], fontSize: 8 }, // Orange 600
                styles: { fontSize: 8 },
                columnStyles: { 3: { halign: 'right' } },
                foot: [['', '', 'TOTAL MÁQUINA', formatCurrency(totalMachineCost)]],
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

// --- NEW UNIFIED REPORT (GLOBAL) ---
export const generateGlobalReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    let yPos = addHeader(doc, "Informe Gerencial Unificado", "Estado Global de la Finca", activeWarehouseName, [59, 130, 246]); // Blue header

    // Calculate Global Financials
    const totalHarvest = (data.harvests || []).reduce((acc, h) => acc + h.totalValue, 0);
    const totalLabor = (data.laborLogs || []).reduce((acc, l) => acc + l.value, 0);
    const totalInputs = data.movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
    const totalMaint = (data.maintenanceLogs || []).reduce((acc, m) => acc + m.cost, 0);
    const totalExpenses = totalLabor + totalInputs + totalMaint;
    const netProfit = totalHarvest - totalExpenses;

    // --- SECTION 1: EXECUTIVE SUMMARY ---
    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.setFont("helvetica", "bold");
    doc.text("1. Resumen Ejecutivo (Balance Total)", 14, yPos);
    doc.line(14, yPos + 2, 105, yPos + 2);

    const summaryData = [
        ['Ingresos Totales (Cosechas)', formatCurrency(totalHarvest)],
        ['(-) Gastos Mano de Obra', formatCurrency(totalLabor)],
        ['(-) Gastos Insumos', formatCurrency(totalInputs)],
        ['(-) Gastos Maquinaria', formatCurrency(totalMaint)],
        ['UTILIDAD NETA', formatCurrency(netProfit)]
    ];

    autoTable(doc, {
        startY: yPos + 8,
        head: [['Concepto', 'Valor']],
        body: summaryData,
        theme: 'grid',
        headStyles: { fillColor: [30, 58, 138] }, // Dark Blue
        columnStyles: { 1: { halign: 'right', fontStyle: 'bold' } },
        didParseCell: function(data) {
            if (data.row.index === 4 && data.column.index === 1) {
                if (netProfit >= 0) data.cell.styles.textColor = [22, 163, 74];
                else data.cell.styles.textColor = [220, 38, 38];
            }
        }
    });

    // --- SECTION 2: HARVESTS ---
    let nextY = (doc as any).lastAutoTable.finalY + 15;
    if (nextY > 260) { doc.addPage(); nextY = 20; }
    
    doc.setFontSize(14);
    doc.setTextColor(BRAND_COLORS.slate[0], BRAND_COLORS.slate[1], BRAND_COLORS.slate[2]);
    doc.text("2. Resumen de Producción", 14, nextY);
    doc.line(14, nextY + 2, 80, nextY + 2);

    const harvestRows = (data.harvests || []).slice(0, 15).map(h => [ // Limit to last 15 to save space in summary
        new Date(h.date).toLocaleDateString(),
        h.cropName,
        h.costCenterName,
        formatCurrency(h.totalValue)
    ]);

    autoTable(doc, {
        startY: nextY + 8,
        head: [['Fecha', 'Cultivo', 'Lote', 'Valor']],
        body: harvestRows,
        theme: 'striped',
        headStyles: { fillColor: [202, 138, 4] },
        columnStyles: { 3: { halign: 'right' } }
    });

    if ((data.harvests || []).length > 15) {
        doc.setFontSize(8);
        doc.text("... (Se muestran las últimas 15 cosechas, exporte el reporte individual para ver todo)", 14, (doc as any).lastAutoTable.finalY + 5);
    }

    // --- SECTION 3: EXPENSES BY LOT (Consolidated) ---
    nextY = (doc as any).lastAutoTable.finalY + 15;
    if (nextY > 260) { doc.addPage(); nextY = 20; }

    doc.setFontSize(14);
    doc.text("3. Rentabilidad por Lote (Aproximada)", 14, nextY);
    doc.line(14, nextY + 2, 80, nextY + 2);

    // Helper logic similar to StatsView
    const expensesByCenter: Record<string, number> = {};
    const incomeByCenter: Record<string, number> = {};

    data.movements.filter(m => m.type === 'OUT').forEach(m => {
        const key = m.costCenterName || 'Sin Lote';
        expensesByCenter[key] = (expensesByCenter[key] || 0) + m.calculatedCost;
    });
    (data.laborLogs || []).forEach(l => {
        const key = l.costCenterName || 'Sin Lote';
        expensesByCenter[key] = (expensesByCenter[key] || 0) + l.value;
    });
    (data.harvests || []).forEach(h => {
        const key = h.costCenterName || 'Sin Lote';
        incomeByCenter[key] = (incomeByCenter[key] || 0) + h.totalValue;
    });

    // Merge keys
    const allKeys = Array.from(new Set([...Object.keys(expensesByCenter), ...Object.keys(incomeByCenter)]));
    const lotRows = allKeys.map(k => {
        const inc = incomeByCenter[k] || 0;
        const exp = expensesByCenter[k] || 0;
        return [k, formatCurrency(inc), formatCurrency(exp), formatCurrency(inc - exp)];
    });

    autoTable(doc, {
        startY: nextY + 8,
        head: [['Lote / Centro', 'Ingresos', 'Gastos (Insum+MO)', 'Utilidad']],
        body: lotRows,
        theme: 'grid',
        headStyles: { fillColor: [6, 78, 59] },
        columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' }, 3: { halign: 'right', fontStyle: 'bold' } }
    });

    addFooter(doc);
    doc.save(`Informe_Gerencial_Unificado_${new Date().toISOString().split('T')[0]}.pdf`);
};

// --- MANUAL PDF GENERATOR ---
export const generateManualPDF = () => {
    const doc = new jsPDF();
    const currentDate = new Date();
    
    // Header
    doc.setFillColor(6, 78, 59); // Emerald 900
    doc.rect(0, 0, 210, 30, 'F');
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("AgroBodega Pro", 14, 20);
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text("Manual de Usuario & Guía de Gestión", 200, 20, { align: 'right' });

    let y = 40;
    const pageWidth = 180;
    const lineHeight = 5;

    const addSectionTitle = (title: string) => {
        if (y > 270) { doc.addPage(); y = 20; }
        doc.setFontSize(16);
        doc.setTextColor(6, 78, 59); // Emerald
        doc.setFont("helvetica", "bold");
        doc.text(title, 14, y);
        y += 8;
        doc.setLineWidth(0.5);
        doc.setDrawColor(6, 78, 59);
        doc.line(14, y-2, 100, y-2);
        y += 5;
    };

    const addParagraph = (text: string) => {
        doc.setFontSize(10);
        doc.setTextColor(20, 20, 20);
        doc.setFont("helvetica", "normal");
        const splitText = doc.splitTextToSize(text, pageWidth);
        if (y + splitText.length * lineHeight > 280) { doc.addPage(); y = 20; }
        doc.text(splitText, 14, y);
        y += splitText.length * lineHeight + 5;
    };

    const addBox = (title: string, text: string) => {
        doc.setFontSize(10);
        const splitText = doc.splitTextToSize(text, pageWidth - 10);
        const boxHeight = splitText.length * lineHeight + 15;
        
        if (y + boxHeight > 280) { doc.addPage(); y = 20; }
        
        doc.setFillColor(240, 253, 244); // Light Green
        doc.setDrawColor(22, 163, 74); // Green Border
        doc.rect(14, y, pageWidth, boxHeight, 'FD');
        
        doc.setTextColor(22, 101, 52);
        doc.setFont("helvetica", "bold");
        doc.text(title, 19, y + 8);
        
        doc.setTextColor(50, 50, 50);
        doc.setFont("helvetica", "normal");
        doc.text(splitText, 19, y + 14);
        
        y += boxHeight + 10;
    };

    // INTRO
    addSectionTitle("Guía Técnica de Cultivos");
    addParagraph("Este manual detalla el manejo administrativo para los cultivos principales soportados por AgroBodega Pro.");

    // CULTIVO 1: CAFÉ
    addSectionTitle("1. Cultivo de Café");
    addParagraph("El manejo del café se divide en Recolección (Mano de obra variable) y Beneficio (Maquinaria).");
    addBox("Recolección (Jornales)", 
    "- En temporada, NO registre jornales por día. Use 'Valor Jornal' para el total pagado por kilos.\n" +
    "- Ejemplo: 'Juan Pérez recogió 100kg a $850 el kilo'.\n" +
    "- Valor a ingresar: $85.000.\n" +
    "- Nota: '100kg recolección lote 1'.");
    
    // CULTIVO 2: AGUACATE
    addSectionTitle("2. Cultivo de Aguacate Hass");
    addParagraph("El aguacate requiere un control estricto de insumos foliares y ventas para exportación.");
    addBox("Fertilización Foliar",
    "- Use la calculadora de dosis en la app.\n" +
    "- Ingrese el producto y la cantidad total gastada en la fumigada.\n" +
    "- El sistema descontará automáticamente del inventario usando el costo promedio.");
    addBox("Venta / Exportación",
    "- Registre el ingreso total de la venta.\n" +
    "- En notas, especifique si hubo rechazo o el porcentaje de calibres (Ej: 60% calibre 18).");

    // CULTIVO 3: PLÁTANO
    addSectionTitle("3. Cultivo de Plátano / Banano");
    addParagraph("El flujo de caja es semanal. Es vital registrar cada corte para ver la rentabilidad real.");
    addBox("Labores Culturales",
    "- Deshije, Deshoje, Embolse.\n" +
    "- Estas labores suelen pagarse por contrato o al día.\n" +
    "- Registrelo en la pestaña 'Mano de Obra' seleccionando la labor correspondiente.");

    // MODULE 4
    addSectionTitle("4. Análisis Financiero (KPIs)");
    addParagraph("Cómo leer los indicadores de la pestaña Reportes:");
    
    addBox("ROI (Retorno de Inversión)", 
    "Responde a: '¿Por cada $1.000 pesos invertidos, cuántos recuperé?'\n" +
    "ROI Positivo = Ganancia.\nROI Negativo = Pérdida.");

    addBox("Margen Neto", 
    "Porcentaje de ganancia libre después de gastos.\n" +
    "Ejemplo: Si vende 1 millón y su margen es 30%, le quedaron $300.000 libres.");

    addFooter(doc);
    doc.save("Manual_AgroBodega_Pro_Cultivos.pdf");
};
