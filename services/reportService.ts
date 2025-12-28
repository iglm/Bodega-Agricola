import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import XLSX from 'xlsx';
import { AppState, LaborLog, RainLog, HarvestLog, Movement, InventoryItem } from '../types';
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

const addHeader = (doc: jsPDF, title: string, subtitle: string, warehouseName: string, themeColor: [number, number, number] = BRAND_COLORS.dark) => {
    const currentDate = new Date();
    
    // Top Banner
    doc.setFillColor(themeColor[0], themeColor[1], themeColor[2]);
    doc.rect(0, 0, 210, 35, 'F'); 

    // App Name
    doc.setFontSize(22);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text("AgroSuite 360", 14, 15);

    // Subtitle
    doc.setFontSize(14);
    doc.setTextColor(255, 255, 255); 
    doc.setFont("helvetica", "bold");
    doc.text(title, 14, 24);
    
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(subtitle, 14, 30);

    // Info Box
    doc.setFontSize(9);
    doc.text("Fecha Generación:", 140, 15);
    doc.setFont("helvetica", "bold");
    doc.text(currentDate.toLocaleDateString(), 196, 15, { align: 'right' });
    
    doc.setFont("helvetica", "normal");
    doc.text("Sede / Finca:", 140, 20);
    doc.setFont("helvetica", "bold");
    doc.text(warehouseName, 196, 20, { align: 'right' });
    
    return 40; // Start Y for content
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
        doc.text('Generado por AgroSuite 360 - Software de Gestión Agrícola Integral', 14, pageHeight - 10);
        doc.text(`Página ${i} de ${pageCount}`, 196, pageHeight - 10, { align: 'right' });
    }
};

// --- 1. COMPLETE FIELD TEMPLATES (PDF) ---
export const generateFieldTemplates = (data: AppState) => {
    const doc = new jsPDF();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';
    
    // PAGE 1: CONTROL DE JORNALES (LABOR)
    let yPos = addHeader(doc, "PLANILLA DE NOMINA Y LABORES", "Registro diario de actividades de campo", activeWarehouseName, BRAND_COLORS.amber);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("TRABAJADORES ACTIVOS (Referencia para llenado):", 14, yPos);
    
    let x = 14; let y = yPos + 5;
    data.personnel.forEach((p, i) => {
        if(x > 180) { x = 14; y += 4; }
        doc.text(`• ${p.name}`, x, y);
        x += 45;
    });
    
    autoTable(doc, {
        startY: y + 5,
        head: [['FECHA', 'TRABAJADOR', 'LABOR REALIZADA', 'LOTE / SITIO', 'JORNALES (1, 0.5) o VALOR']],
        body: Array(20).fill(["", "", "", "", ""]),
        theme: 'grid',
        styles: { fontSize: 10, minCellHeight: 10, valign: 'middle', lineColor: 200 },
        headStyles: { fillColor: BRAND_COLORS.amber, textColor: 255, fontStyle: 'bold' }
    });

    // PAGE 2: INVENTORY WITHDRAWALS (SALIDAS)
    doc.addPage();
    yPos = addHeader(doc, "BITÁCORA DE BODEGA", "Control de Salidas de Insumos y Fertilizantes", activeWarehouseName, BRAND_COLORS.red);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("LOTES Y DESTINOS (Referencia):", 14, yPos);
    x = 14; y = yPos + 5;
    data.costCenters.forEach((c, i) => {
        if(x > 180) { x = 14; y += 4; }
        doc.text(`• ${c.name}`, x, y);
        x += 45;
    });

    autoTable(doc, {
        startY: y + 5,
        head: [['FECHA', 'PRODUCTO / INSUMO', 'CANTIDAD', 'UNIDAD (Kg/L)', 'DESTINO (Lote)', 'RESPONSABLE']],
        body: Array(20).fill(["", "", "", "", "", ""]),
        theme: 'grid',
        styles: { fontSize: 10, minCellHeight: 10, valign: 'middle', lineColor: 200 },
        headStyles: { fillColor: BRAND_COLORS.red, textColor: 255, fontStyle: 'bold' }
    });

    // PAGE 3: HARVEST (COSECHAS)
    doc.addPage();
    yPos = addHeader(doc, "REGISTRO DE PRODUCCIÓN", "Control de Cosechas y Recolección", activeWarehouseName, BRAND_COLORS.yellow);
    
    autoTable(doc, {
        startY: yPos + 5,
        head: [['FECHA', 'LOTE / ORIGEN', 'CULTIVO / VARIEDAD', 'CANTIDAD (Kg/Arrobas)', 'PRECIO / VALOR TOTAL', 'OBSERVACIONES']],
        body: Array(20).fill(["", "", "", "", "", ""]),
        theme: 'grid',
        styles: { fontSize: 10, minCellHeight: 10, valign: 'middle', lineColor: 200 },
        headStyles: { fillColor: BRAND_COLORS.yellow, textColor: 255, fontStyle: 'bold' }
    });

    // PAGE 4: MACHINERY MAINTENANCE
    doc.addPage();
    yPos = addHeader(doc, "BITÁCORA DE MAQUINARIA", "Control de Combustible y Mantenimientos", activeWarehouseName, BRAND_COLORS.orange);
    
    doc.setFontSize(8);
    doc.setTextColor(100);
    doc.text("MAQUINARIA REGISTRADA:", 14, yPos);
    x = 14; y = yPos + 5;
    data.machines.forEach((m, i) => {
        if(x > 180) { x = 14; y += 4; }
        doc.text(`• ${m.name}`, x, y);
        x += 45;
    });

    autoTable(doc, {
        startY: y + 5,
        head: [['FECHA', 'MÁQUINA', 'TIPO (Diesel/Repuesto)', 'COSTO ($)', 'HORÓMETRO / KM', 'DESCRIPCIÓN']],
        body: Array(20).fill(["", "", "", "", "", ""]),
        theme: 'grid',
        styles: { fontSize: 10, minCellHeight: 10, valign: 'middle', lineColor: 200 },
        headStyles: { fillColor: BRAND_COLORS.orange, textColor: 255, fontStyle: 'bold' }
    });

    // PAGE 5: RAIN & FINANCES
    doc.addPage();
    yPos = addHeader(doc, "CONTROL ADMINISTRATIVO Y CLIMA", "Lluvias diarias y Gastos Generales", activeWarehouseName, BRAND_COLORS.blue);
    
    doc.setFontSize(11);
    doc.setTextColor(BRAND_COLORS.blue[0], BRAND_COLORS.blue[1], BRAND_COLORS.blue[2]);
    doc.setFont("helvetica", "bold");
    doc.text("1. REGISTRO PLUVIOMÉTRICO (LLUVIAS)", 14, yPos);
    
    // Split rain table into 3 columns to save space
    const rainRows = Array(10).fill(["", "", "", "", "", ""]);
    autoTable(doc, {
        startY: yPos + 5,
        head: [['FECHA', 'MM', 'FECHA', 'MM', 'FECHA', 'MM']],
        body: rainRows,
        theme: 'grid',
        styles: { fontSize: 9, minCellHeight: 7, halign: 'center' },
        headStyles: { fillColor: BRAND_COLORS.blue, halign: 'center' }
    });

    let finalY = (doc as any).lastAutoTable.finalY + 15;
    
    doc.setFontSize(11);
    doc.setTextColor(BRAND_COLORS.purple[0], BRAND_COLORS.purple[1], BRAND_COLORS.purple[2]);
    doc.text("2. GASTOS ADMINISTRATIVOS / GENERALES", 14, finalY);
    
    autoTable(doc, {
        startY: finalY + 5,
        head: [['FECHA', 'CONCEPTO (Luz, Impuesto, Etc)', 'VALOR ($)', 'NOTAS / DETALLES']],
        body: Array(10).fill(["", "", "", ""]),
        theme: 'grid',
        styles: { fontSize: 10, minCellHeight: 10 },
        headStyles: { fillColor: BRAND_COLORS.purple }
    });

    addFooter(doc);
    doc.save(`Plantillas_Campo_${activeWarehouseName.replace(/\s+/g, '_')}.pdf`);
};

// --- 2. COMPLETE EXCEL IMPORT TEMPLATE ---
export const generateExcelImportTemplate = (data: AppState) => {
    const wb = XLSX.utils.book_new();
    const activeWarehouseName = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || 'Bodega';

    // A. INSTRUCTIONS SHEET
    const wsInstructions = XLSX.utils.aoa_to_sheet([
        ["GUÍA DE USO DE LA PLANTILLA AGROSUITE 360"],
        [""],
        ["1. ESTA ES SU BASE DE DATOS MÓVIL: Use este archivo para ingresar información masiva desde su PC."],
        ["2. NO CAMBIE EL NOMBRE DE LAS HOJAS (Pestañas inferiores). El sistema las busca por nombre exacto."],
        ["3. USE LA HOJA 'MAESTROS_REFERENCIA' para COPIAR Y PEGAR los nombres exactos de sus trabajadores y productos."],
        ["4. FORMATO FECHA: Use el formato AAAA-MM-DD (Ej: 2024-05-20) o el formato fecha de Excel."],
        ["5. VALORES: Ingrese solo números en columnas de precio o cantidad (Sin símbolos $ o texto)."],
    ]);
    // Style Instructions
    wsInstructions['!cols'] = [{ wch: 80 }];
    XLSX.utils.book_append_sheet(wb, wsInstructions, "Instrucciones");

    // B. REFERENCE SHEET (The "Garbage" Fixer - Contextual Data)
    const refHeader = ["TRABAJADORES", "LOTES / DESTINOS", "PRODUCTOS / INSUMOS", "MAQUINARIA", "LABORES"];
    const maxRows = Math.max(data.personnel.length, data.costCenters.length, data.inventory.length, data.machines.length, data.activities.length);
    const refData = [refHeader];
    
    for(let i=0; i<maxRows; i++) {
        refData.push([
            data.personnel[i]?.name || "",
            data.costCenters[i]?.name || "",
            data.inventory[i]?.name || "",
            data.machines[i]?.name || "",
            data.activities[i]?.name || ""
        ]);
    }
    const wsRef = XLSX.utils.aoa_to_sheet(refData);
    wsRef['!cols'] = [{ wch: 30 }, { wch: 30 }, { wch: 40 }, { wch: 30 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsRef, "MAESTROS_REFERENCIA");

    // C. JORNALES (LABOR)
    const wsLabor = XLSX.utils.aoa_to_sheet([
        ["Fecha", "Trabajador", "Labor", "Lote", "Valor", "Notas"],
        ["2024-01-01", "EJEMPLO: Juan Perez", "Guadaña", "Lote 1", 50000, "Dia completo"]
    ]);
    wsLabor['!cols'] = [{ wch: 15 }, { wch: 25 }, { wch: 20 }, { wch: 20 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsLabor, "Jornales_Nomina");

    // D. COSECHAS (HARVEST)
    const wsHarvest = XLSX.utils.aoa_to_sheet([
        ["Fecha", "Lote", "Cultivo", "Cantidad", "Unidad", "ValorTotal", "Notas"],
        ["2024-01-01", "Lote 1", "Cafe", 100, "Kg", 500000, "Primera pasilla"]
    ]);
    wsHarvest['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsHarvest, "Cosechas");

    // E. INVENTARIO (MOVEMENTS)
    const wsMov = XLSX.utils.aoa_to_sheet([
        ["Fecha", "Tipo (ENTRADA/SALIDA)", "Producto", "Cantidad", "Unidad", "Destino_Lote_o_Maquina", "Costo_Total", "Notas"],
        ["2024-01-01", "SALIDA", "Urea", 2, "Bulto 50kg", "Lote 1", 240000, "Abonada"],
        ["2024-01-02", "ENTRADA", "Glifosato", 1, "Litro", "", 45000, "Compra Agro"]
    ]);
    wsMov['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 10 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 30 }];
    XLSX.utils.book_append_sheet(wb, wsMov, "Inventario_Movimientos");

    // F. MAQUINARIA
    const wsMach = XLSX.utils.aoa_to_sheet([
        ["Fecha", "Maquina", "Tipo (Combustible/Reparacion)", "Costo", "Descripcion", "Horas_Km"],
        ["2024-01-01", "Tractor", "Combustible", 100000, "ACPM", 1500]
    ]);
    wsMach['!cols'] = [{ wch: 15 }, { wch: 20 }, { wch: 25 }, { wch: 15 }, { wch: 30 }, { wch: 10 }];
    XLSX.utils.book_append_sheet(wb, wsMach, "Maquinaria");

    // G. LLUVIAS
    const wsRain = XLSX.utils.aoa_to_sheet([
        ["Fecha", "Milimetros"],
        ["2024-01-01", 15],
        ["2024-01-02", 0]
    ]);
    wsRain['!cols'] = [{ wch: 15 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, wsRain, "Lluvias");

    // H. FINANZAS
    const wsFin = XLSX.utils.aoa_to_sheet([
        ["Fecha", "Tipo (INGRESO/GASTO)", "Categoria", "Monto", "Descripcion"],
        ["2024-01-01", "GASTO", "Servicios", 150000, "Pago Luz Casa Principal"]
    ]);
    wsFin['!cols'] = [{ wch: 15 }, { wch: 15 }, { wch: 20 }, { wch: 15 }, { wch: 40 }];
    XLSX.utils.book_append_sheet(wb, wsFin, "Gastos_Admin");

    // Save File
    XLSX.writeFile(wb, `Plantilla_Carga_Masiva_${activeWarehouseName.replace(/\s+/g, '_')}.xlsx`);
};

// --- EXISTING REPORT FUNCTIONS (KEPT FOR COMPATIBILITY) ---

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
    doc.text("Generado por AgroSuite 360", 105, 280, { align: 'center' });

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

    // Page 2: Introduction
    doc.addPage();
    let y = addHeader(doc, "VISIÓN GENERAL", "Filosofía y Alcance", "Manual Usuario");
    
    doc.setFontSize(12);
    doc.setTextColor(0, 0, 0);
    doc.setFont("helvetica", "bold");
    doc.text("Filosofía: Gerencia Total", 14, y + 10);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const text1 = "AgroSuite 360 transforma la agricultura tradicional en una empresa agroindustrial basada en datos. A diferencia de un simple cuaderno, este sistema cruza información de Insumos, Mano de Obra, Maquinaria y Gastos Administrativos para revelar el costo real de producción.";
    const splitText1 = doc.splitTextToSize(text1, 180);
    doc.text(splitText1, 14, y + 16);
    
    const y2 = y + 16 + (splitText1.length * 5);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Gestión Multi-Sede", 14, y2 + 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const text2 = "Ahora puede administrar múltiples fincas desde una sola aplicación. Cada finca tiene su propio inventario, personal y contabilidad independiente.";
    const splitText2 = doc.splitTextToSize(text2, 180);
    doc.text(splitText2, 14, y2 + 16);

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

    addFooter(doc);
    doc.save("Manual_AgroSuite360.pdf");
};