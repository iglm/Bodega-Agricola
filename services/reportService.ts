
import { AppState, InventoryItem, LaborLog, HarvestLog, CostCenter, Personnel } from '../types';
import jsPDF from 'jspdf';
import autoTable, { UserOptions } from 'jspdf-autotable';
import { formatCurrency } from './inventoryService';

interface JsPDFWithAutoTable extends jsPDF {
  lastAutoTable: {
    finalY: number;
  };
}

const BRAND_COLORS = {
  primary: '#059669', // Emerald 600
  secondary: '#4f46e5', // Indigo 600
  amber: '#d97706',
  slate: '#475569'
};

// --- HELPER FUNCTIONS ---

const addHeader = (doc: jsPDF, title: string, subtitle: string, farmName: string, color: string) => {
  doc.setFillColor(color);
  doc.rect(0, 0, 210, 25, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text(title, 14, 15);
  
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`${subtitle} | ${farmName}`, 14, 21);
  
  doc.setTextColor(0, 0, 0);
  return 35;
};

const addFooter = (doc: jsPDF) => {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Generado por AgroBodega Pro © ${new Date().getFullYear()} - Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
  }
};

// --- EXPORT FUNCTIONS ---

export const generateExcel = (data: AppState) => {
  // Mock implementation for Excel export as creating a full XLSX file is complex without xlsx library.
  // In a real scenario, this would use 'xlsx' or 'exceljs'.
  // We will generate a CSV for each main table and zip them or just alert for now since we can't install packages.
  // Assuming basic CSV export for demonstration.
  
  const csvContent = "data:text/csv;charset=utf-8," 
      + "ID,Nombre,Categoria,Cantidad,CostoPromedio\n"
      + data.inventory.map(i => `${i.id},${i.name},${i.category},${i.currentQuantity},${i.averageCost}`).join("\n");
      
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", "inventario_agrobodega.csv");
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Alias for compatibility if needed, but we will update consumers
export const exportToExcel = generateExcel;

export const exportFieldSheet = (personnel: Personnel[], farmName: string) => {
  const doc = new jsPDF();
  let y = addHeader(doc, "Planilla de Campo", "Registro Manual de Labores", farmName, BRAND_COLORS.amber);
  
  const cols = ["Trabajador", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado", "Firma"];
  const rows = personnel.map(p => [p.name, "", "", "", "", "", "", ""]);
  
  autoTable(doc, {
    startY: y,
    head: [cols],
    body: rows,
    theme: 'grid',
    styles: { cellPadding: 3, fontSize: 9 },
    columnStyles: { 0: { cellWidth: 40 } }
  });
  
  addFooter(doc);
  doc.save("Planilla_Campo_Vacia.pdf");
};

export const generatePDF = (data: AppState) => {
  const doc = new jsPDF();
  const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
  let y = addHeader(doc, "Inventario Valorizado", "Reporte de Existencias", activeW?.name || "Sede", BRAND_COLORS.secondary);
  
  const rows = data.inventory.map(item => [
    item.name,
    item.category,
    `${item.currentQuantity.toFixed(2)} ${item.baseUnit}`,
    formatCurrency(item.averageCost),
    formatCurrency(item.currentQuantity * item.averageCost)
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['Producto', 'Categoría', 'Cantidad', 'Costo Unit (Prom)', 'Valor Total']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: BRAND_COLORS.secondary }
  });
  
  addFooter(doc);
  doc.save("Inventario_Valorizado.pdf");
};

export const generateLaborReport = (data: AppState) => {
  const doc = new jsPDF();
  const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
  let y = addHeader(doc, "Reporte de Nómina", "Historial de Pagos y Labores", activeW?.name || "Sede", BRAND_COLORS.primary);
  
  const rows = data.laborLogs.map(log => [
    new Date(log.date).toLocaleDateString(),
    log.personnelName,
    log.activityName,
    log.costCenterName,
    formatCurrency(log.value),
    log.paid ? 'Sí' : 'No'
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Trabajador', 'Labor', 'Lote', 'Valor', 'Pagado']],
    body: rows,
    theme: 'grid',
    headStyles: { fillColor: BRAND_COLORS.primary }
  });
  
  addFooter(doc);
  doc.save("Reporte_Nomina.pdf");
};

export const generateHarvestReport = (data: AppState) => {
  const doc = new jsPDF();
  const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
  let y = addHeader(doc, "Reporte de Cosecha", "Ventas y Producción", activeW?.name || "Sede", BRAND_COLORS.amber);
  
  const rows = data.harvests.map(h => [
    new Date(h.date).toLocaleDateString(),
    h.costCenterName,
    h.cropName,
    `${h.quantity} ${h.unit}`,
    formatCurrency(h.totalValue)
  ]);
  
  autoTable(doc, {
    startY: y,
    head: [['Fecha', 'Lote', 'Cultivo', 'Cantidad', 'Valor Venta']],
    body: rows,
    theme: 'striped',
    headStyles: { fillColor: BRAND_COLORS.amber }
  });
  
  addFooter(doc);
  doc.save("Reporte_Cosecha.pdf");
};

export const generateAgronomicDossier = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Dossier Agronómico", "Registros Fitosanitarios y Ambientales", activeW?.name || "Sede", BRAND_COLORS.primary);
    
    doc.setFont("helvetica", "bold");
    doc.text("Historial de Pluviometría (Lluvias)", 14, y + 10);
    autoTable(doc, {
        startY: y + 15,
        head: [['Fecha', 'Milímetros (mm)']],
        body: data.rainLogs.map(r => [new Date(r.date).toLocaleDateString(), `${r.millimeters} mm`]),
    });
    
    // Type casting to custom interface for type safety
    let nextY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
    doc.text("Monitoreo de Plagas y Enfermedades", 14, nextY);
    autoTable(doc, {
        startY: nextY + 5,
        head: [['Fecha', 'Lote', 'Problema', 'Incidencia']],
        body: data.pestLogs.map(p => [new Date(p.date).toLocaleDateString(), p.costCenterId, p.pestOrDisease, p.incidence]),
    });

    // Nueva tabla de Análisis de Suelos
    nextY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 15;
    doc.text("Análisis de Suelos", 14, nextY);
    autoTable(doc, {
        startY: nextY + 5,
        head: [['Fecha', 'Lote', 'pH', 'M.O. %', 'Costo']],
        body: data.soilAnalyses.map(s => [
            new Date(s.date).toLocaleDateString(), 
            s.costCenterName, 
            s.ph, 
            s.organicMatter,
            formatCurrency(s.cost || 0)
        ]),
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.amber }
    });
    
    addFooter(doc);
    doc.save("Dossier_Agronomico.pdf");
};

export const generatePaymentReceipt = (personName: string, logs: LaborLog[], farmName: string) => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Comprobante de Pago", `Liquidación: ${personName}`, farmName, BRAND_COLORS.primary);
    
    const total = logs.reduce((sum, l) => sum + l.value, 0);
    
    doc.setFontSize(12);
    doc.text(`Beneficiario: ${personName}`, 14, y + 10);
    doc.text(`Fecha Emisión: ${new Date().toLocaleDateString()}`, 14, y + 16);
    doc.text(`Total Pagado: ${formatCurrency(total)}`, 14, y + 22);
    
    const rows = logs.map(l => [
        new Date(l.date).toLocaleDateString(),
        l.activityName,
        l.costCenterName,
        formatCurrency(l.value)
    ]);
    
    autoTable(doc, {
        startY: y + 30,
        head: [['Fecha', 'Labor', 'Ubicación', 'Valor']],
        body: rows,
        theme: 'grid',
        foot: [['', '', 'TOTAL', formatCurrency(total)]],
        footStyles: { fillColor: [220, 220, 220], textColor: [0,0,0], fontStyle: 'bold' }
    });
    
    const finalY = (doc as JsPDFWithAutoTable).lastAutoTable.finalY + 40;
    doc.line(20, finalY, 90, finalY);
    doc.text("Firma Recibido (Trabajador)", 25, finalY + 5);
    
    doc.line(120, finalY, 190, finalY);
    doc.text("Firma Pagador (Administrador)", 125, finalY + 5);
    
    addFooter(doc);
    doc.save(`Pago_${personName.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateSimulationPDF = () => {
    alert("Generación de PDF de Simulación no implementada en esta versión.");
};

export const generateSQLDump = (data: AppState) => {
    const sql = `-- SQL Dump for AgroBodega Pro
-- Generated: ${new Date().toISOString()}

CREATE TABLE inventory (id TEXT PRIMARY KEY, name TEXT, current_qty REAL, avg_cost REAL);
${data.inventory.map(i => `INSERT INTO inventory VALUES ('${i.id}', '${i.name}', ${i.currentQuantity}, ${i.averageCost});`).join('\n')}

CREATE TABLE labor_logs (id TEXT PRIMARY KEY, date TEXT, value REAL, activity TEXT);
${data.laborLogs.map(l => `INSERT INTO labor_logs VALUES ('${l.id}', '${l.date}', ${l.value}, '${l.activityName}');`).join('\n')}
`;
    const blob = new Blob([sql], { type: 'text/sql' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `backup_agrobodega_${new Date().toISOString().split('T')[0]}.sql`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// Placeholders for other requested exports
export const generateMasterPDF = (data: AppState) => generateGlobalReport(data);
export const generateGlobalReport = (data: AppState) => {
    const doc = new jsPDF();
    addHeader(doc, "Informe Gerencial Global", "Resumen Ejecutivo", "AgroBodega Pro", BRAND_COLORS.secondary);
    doc.text("Resumen no disponible en esta vista preliminar.", 14, 50);
    addFooter(doc);
    doc.save("Reporte_Global.pdf");
};
export const generateSafetyReport = (data: AppState) => {
    const doc = new jsPDF();
    addHeader(doc, "Reporte SST y Ambiental", "Seguridad y Salud", "AgroBodega Pro", BRAND_COLORS.primary);
    
    // PPE LOGS
    doc.text("Entregas de EPP", 14, 45);
    autoTable(doc, {
        startY: 50,
        head: [['Fecha', 'Trabajador', 'Items']],
        body: data.ppeLogs.map(p => [new Date(p.date).toLocaleDateString(), p.personnelName, p.items.join(', ')])
    });
    
    doc.save("Reporte_SST.pdf");
};
export const generateFieldTemplates = (data: AppState) => {
    const doc = new jsPDF();
    addHeader(doc, "Planillas de Campo", "Formatos en Blanco", "AgroBodega Pro", BRAND_COLORS.slate);
    doc.text("Formato para impresión y diligenciamiento manual.", 14, 50);
    doc.save("Plantillas_Campo.pdf");
};
export const generateFarmStructurePDF = (costCenters: CostCenter[]) => {
    const doc = new jsPDF();
    addHeader(doc, "Estructura de Finca", "Censo de Lotes", "AgroBodega Pro", BRAND_COLORS.secondary);
    
    const rows = costCenters.map(c => [c.name, c.area + ' Ha', c.cropType, c.plantCount || 0, c.stage]);
    autoTable(doc, {
        startY: 40,
        head: [['Lote', 'Área', 'Cultivo', 'Población', 'Etapa']],
        body: rows
    });
    doc.save("Estructura_Finca.pdf");
};
export const generateFarmStructureExcel = (costCenters: CostCenter[]) => {
    // Mock csv
    const csv = "Nombre,Area,Cultivo,Poblacion,Etapa\n" + costCenters.map(c => `${c.name},${c.area},${c.cropType},${c.plantCount},${c.stage}`).join('\n');
    const blob = new Blob([csv], {type: 'text/csv'});
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "estructura_finca.csv";
    link.click();
};
export const generateManualPDF = () => {
    const doc = new jsPDF();
    addHeader(doc, "Manual de Usuario", "Guía Técnica", "AgroBodega Pro", BRAND_COLORS.slate);
    doc.text("Este manual describe el funcionamiento del sistema...", 14, 50);
    doc.save("Manual_Usuario.pdf");
};
export const generateSpecsPDF = () => {
    const doc = new jsPDF();
    addHeader(doc, "Ficha Técnica", "Especificaciones del Sistema", "AgroBodega Pro", BRAND_COLORS.slate);
    doc.text("Especificaciones técnicas del software...", 14, 50);
    doc.save("Ficha_Tecnica.pdf");
};

export const getDemoData = (): AppState => {
    return {
        warehouses: [{ id: 'demo-w', name: 'Finca La Demo', created: new Date().toISOString(), ownerId: 'demo' }],
        activeWarehouseId: 'demo-w',
        inventory: [
            { id: 'i1', warehouseId: 'demo-w', name: 'Urea', category: 'FERTILIZANTE' as any, currentQuantity: 50000, baseUnit: 'g', averageCost: 2.5, lastPurchasePrice: 125000, lastPurchaseUnit: 'BULTO_50KG' as any },
            { id: 'i2', warehouseId: 'demo-w', name: 'Glifosato', category: 'HERBICIDA' as any, currentQuantity: 5000, baseUnit: 'ml', averageCost: 35, lastPurchasePrice: 35000, lastPurchaseUnit: 'LITRO' as any }
        ],
        movements: [],
        suppliers: [{ id: 's1', warehouseId: 'demo-w', name: 'Agroinsumos del Café', creditDays: 30 }],
        costCenters: [
            { id: 'c1', warehouseId: 'demo-w', name: 'Lote El Plan', area: 2.5, stage: 'Produccion', cropType: 'Café', plantCount: 12000, cropAgeMonths: 48 },
            { id: 'c2', warehouseId: 'demo-w', name: 'Lote La Loma', area: 1.5, stage: 'Levante', cropType: 'Café', plantCount: 8000, cropAgeMonths: 12 }
        ],
        personnel: [
            { id: 'p1', warehouseId: 'demo-w', name: 'Juan Perez', role: 'Administrador' },
            { id: 'p2', warehouseId: 'demo-w', name: 'Maria Gomez', role: 'Recolectora' }
        ],
        activities: [
            { id: 'a1', warehouseId: 'demo-w', name: 'Fertilización', costClassification: 'JOINT' },
            { id: 'a2', warehouseId: 'demo-w', name: 'Recolección', costClassification: 'COFFEE' }
        ],
        laborLogs: [],
        harvests: [],
        machines: [],
        maintenanceLogs: [],
        rainLogs: [],
        financeLogs: [],
        soilAnalyses: [],
        ppeLogs: [],
        wasteLogs: [],
        agenda: [],
        phenologyLogs: [],
        pestLogs: [],
        plannedLabors: [],
        budgets: [],
        assets: [],
        bpaChecklist: {},
        laborFactor: 1.52,
        clients: [],
        salesContracts: [],
        sales: []
    };
};
