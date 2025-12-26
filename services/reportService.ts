import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx';
import { AppState } from '../types';
import { convertToBase, formatCurrency, formatBaseQuantity, getCostPerGramOrMl } from './inventoryService';

// --- SHARED CONFIG ---
const BRAND_COLORS = {
    dark: [6, 78, 59], // Emerald 900
    primary: [5, 150, 105], // Emerald 600
    slate: [15, 23, 42], // Slate 900
    light: [236, 253, 245], // Emerald 50
    amber: [245, 158, 11] // Amber 500 for Labor
};

const addHeader = (doc: jsPDF, title: string, subtitle: string, warehouseName: string, isLabor = false) => {
    const currentDate = new Date();
    
    // Top Banner
    if (isLabor) {
        doc.setFillColor(180, 83, 9); // Amber/Orange Dark
    } else {
        doc.setFillColor(BRAND_COLORS.dark[0], BRAND_COLORS.dark[1], BRAND_COLORS.dark[2]);
    }
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
        doc.text('Generado por AgroBodega Pro', 14, pageHeight - 10);
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
        details = m.costCenterName ? `Dest: ${m.costCenterName}` : '';
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
      m.type === 'IN' ? m.supplierName : m.costCenterName,
      m.personnelName || '-',
      `${m.quantity} ${m.unit}`,
      m.calculatedCost
  ]);
  const wsMov = XLSX.utils.aoa_to_sheet([movHeader, ...movBody]);
  XLSX.utils.book_append_sheet(wb, wsMov, "Kardex");

  XLSX.writeFile(wb, `AgroBodega_Inventario_${new Date().toISOString().split('T')[0]}.xlsx`);
};

// --- NEW: LABOR REPORTS ---

export const generateLaborPDF = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    let yPos = addHeader(doc, "Reporte de Mano de Obra", "Jornales y Labores", activeWarehouseName, true);
  
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
        log.notes || '-'
    ]);

    const totalCost = (data.laborLogs || []).reduce((acc, log) => acc + log.value, 0);

    autoTable(doc, {
        startY: yPos + 8,
        head: [['Fecha', 'Trabajador', 'Labor', 'Lote / Destino', 'Valor', 'Notas']],
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
        { v: "Notas", s: { font: { bold: true } } }
    ];

    const body = (data.laborLogs || []).map(log => [
        new Date(log.date).toLocaleDateString(),
        log.personnelName,
        log.activityName,
        log.costCenterName,
        log.value,
        log.notes || ''
    ]);

    const ws = XLSX.utils.aoa_to_sheet([header, ...body]);
    XLSX.utils.book_append_sheet(wb, ws, "Jornales y Labores");

    XLSX.writeFile(wb, `AgroBodega_ManoObra_${new Date().toISOString().split('T')[0]}.xlsx`);
};
