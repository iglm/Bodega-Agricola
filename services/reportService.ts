
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppState, LaborLog, HarvestLog, Movement, InventoryItem, Unit, Category, CostCenter, Personnel, Activity, PhenologyLog, PestLog, Machine, Asset, MaintenanceLog, RainLog, FinanceLog, SoilAnalysis, PPELog, WasteLog, AgendaEvent, CostClassification, Warehouse, PlannedLabor, Supplier, BudgetPlan, BudgetItem } from '../types';
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

/**
 * GENERA EL INFORME DE FACTIBILIDAD PDF PARA EL SIMULADOR 360
 */
export const generateSimulationPDF = (sim: any, params: any): void => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Estudio de Factibilidad Agronómica", "Proyección Financiera de Ciclo de Cultivo", "SIMULADOR 360", BRAND_COLORS.slate);
    
    // 1. Parámetros del Proyecto
    doc.setFontSize(10);
    doc.setTextColor(...BRAND_COLORS.slate);
    doc.setFont("helvetica", "bold");
    doc.text("1. PARÁMETROS TÉCNICOS DEL PROYECTO", 14, y);
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    const paramData = [
        ["Variedad Seleccionada:", params.varietyLabel, "Árboles Totales:", params.numTrees.toLocaleString()],
        ["Nivel Tecnológico:", params.techLabel, "Densidad Siembra:", `${params.density} á/Ha`],
        ["Área Proyectada:", `${sim.hectares.toFixed(2)} Ha`, "Factor Calidad:", `Base ${params.qualityFactor}`],
        ["Precio de Venta Base:", formatCurrency(parseFloat(params.marketPrice)), "Costo Recolección:", `${formatCurrency(parseFloat(params.harvestCostKg))}/Kg`]
    ];

    autoTable(doc, {
        startY: y + 5,
        body: paramData,
        theme: 'plain',
        styles: { fontSize: 8, cellPadding: 1 }
    });

    // 2. Dashboard de Resultados Financieros
    y = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("2. INDICADORES DE RENTABILIDAD (KPIs)", 14, y);

    autoTable(doc, {
        startY: y + 5,
        head: [['Indicador Económico', 'Valor Proyectado', 'Estado']],
        body: [
            ['Valor Presente Neto (VPN)', formatCurrency(sim.vpn), sim.vpn > 0 ? 'VIABLE' : 'NO VIABLE'],
            ['Índice de Retorno (ROI)', `${sim.roi.toFixed(1)}%`, sim.roi > 15 ? 'ALTO' : sim.roi > 0 ? 'MODERADO' : 'CRÍTICO'],
            ['Punto de Equilibrio (Payback)', sim.paybackYear ? `Año ${sim.paybackYear}` : 'Indeterminado', '-'],
            ['Inversión de Establecimiento', formatCurrency(sim.totalCapex), 'Capex Levante']
        ],
        headStyles: { fillColor: BRAND_COLORS.indigo },
        theme: 'grid'
    });

    // 3. Tabla de Flujo de Caja Maestro
    y = (doc as any).lastAutoTable.finalY + 15;
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("3. MATRIZ DE FLUJO DE CAJA ANUALIZADO (6 AÑOS)", 14, y);

    autoTable(doc, {
        startY: y + 5,
        head: [['Año', 'Prod. Kg', 'Ingreso Bruto', 'Recolección', 'Renovación', 'Sost+Deuda', 'Caja Neta']],
        body: sim.yearlyData.map((d: any) => [
            `Año ${d.year}`,
            Math.round(d.totalProductionKg).toLocaleString(),
            formatCurrency(d.totalIncome),
            `-${formatCurrency(d.harvestCost)}`,
            `-${formatCurrency(d.renovationReserve)}`,
            `-${formatCurrency(d.capex + d.opex + d.debtService)}`,
            formatCurrency(d.netCashFlow)
        ]),
        headStyles: { fillColor: BRAND_COLORS.slate },
        columnStyles: {
            6: { fontStyle: 'bold' }
        },
        alternateRowStyles: { fillColor: [245, 247, 250] }
    });

    // 4. Nota Técnica
    y = (doc as any).lastAutoTable.finalY + 15;
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100);
    const note = "Este informe es una proyección matemática determinista basada en los algoritmos de AgroBodega Pro. Los resultados dependen de la estabilidad climática y de mercado. El 'Fondo de Renovación' es una provisión contable para garantizar la sostenibilidad biológica del lote en el Año 5/6.";
    doc.text(note, 14, y, { maxWidth: 180 });

    addFooter(doc);
    doc.save(`Factibilidad_Agro_${params.varietyLabel.replace(/\s/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`);
};

export const generateExcel = (data: AppState): void => {
    const wb = XLSX.utils.book_new();
    const dateStr = new Date().toISOString().split('T')[0];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.inventory.map(i => ({'Insumo': i.name, 'Categoría': i.category, 'Stock': i.currentQuantity, 'Unidad': i.baseUnit, 'Costo Prom.': i.averageCost, 'Valorización': i.currentQuantity * i.averageCost}))), "1_Inventario");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.movements.map(m => ({'Fecha': m.date.split('T')[0], 'Tipo': m.type, 'Insumo': m.itemName, 'Cantidad': m.quantity, 'Unidad': m.unit, 'Costo Total': m.calculatedCost, 'Lote': m.costCenterName || 'N/A', 'Proveedor': m.supplierName || ''}))), "2_Kardex_Historico");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(data.harvests.map(h => ({'Fecha': h.date, 'Lote': h.costCenterName, 'Producto': h.cropName, 'Cantidad': h.quantity, 'Unidad': h.unit, 'Venta Total': h.totalValue, 'Rendimiento': h.yieldFactor || ''}))), "3_Ventas");
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

export const generateExecutiveReport = (data: AppState) => {
    generateMasterPDF(data);
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
    
    const nextY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Monitoreo de Plagas y Enfermedades", 14, nextY);
    autoTable(doc, {
        startY: nextY + 5,
        head: [['Fecha', 'Lote', 'Problema', 'Incidencia']],
        body: data.pestLogs.map(p => [p.date.split('T')[0], p.costCenterId, p.pestOrDisease, p.incidence]),
    });
    
    addFooter(doc);
    doc.save("Dossier_Agronomico.pdf");
};

export const generateSafetyReport = (data: AppState) => {
    const doc = new jsPDF();
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
    let y = addHeader(doc, "Auditoría SST & Ambiental", "EPP y Gestión de Residuos", activeW?.name || "Sede", BRAND_COLORS.red);
    
    doc.setFont("helvetica", "bold");
    doc.text("Entregas de Elementos de Protección Personal", 14, y);
    autoTable(doc, {
        startY: y + 5,
        head: [['Fecha', 'Trabajador', 'Items Entregados']],
        body: data.ppeLogs.map(p => [p.date.split('T')[0], p.personnelName, p.items.join(', ')]),
    });

    const nextY = (doc as any).lastAutoTable.finalY + 15;
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
    addHeader(doc, "Planillas de Campo", "Formatos para Registro Manual", "Hacienda VIVA", BRAND_COLORS.slate);
    
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.text("Utilice estas planillas para la recolección física de datos en lotes:", 14, 60);
    
    const body = [
        ["1. Planilla de Aplicación de Insumos", "Registro de dosis, lote y operario."],
        ["2. Planilla de Nómina / Jornales", "Para firma de asistencia diaria."],
        ["3. Planilla de Cosecha", "Pesaje individual por recolector."],
        ["4. Bitácora de Maquinaria", "Horómetro y consumo de combustible."],
        ["5. Registro de Lluvias", "Control pluviométrico manual."]
    ];

    autoTable(doc, {
        startY: 70,
        head: [['Formato Sugerido', 'Objetivo de Trazabilidad']],
        body: body,
        theme: 'grid'
    });
    
    addFooter(doc);
    doc.save("Planillas_Campo_VIVA.pdf");
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
        head: [['Fecha', 'Lote', 'Producto', 'Cantidad', 'Valor Venta']],
        body: data.harvests.map(h => [h.date, h.costCenterName, h.cropName, `${h.quantity} ${h.unit}`, formatCurrency(h.totalValue)]),
        headStyles: { fillColor: BRAND_COLORS.indigo }
    });
    
    addFooter(doc);
    doc.save("Reporte_Ventas.pdf");
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

    const finalY = (doc as any).lastAutoTable.finalY + 30;
    doc.line(20, finalY, 90, finalY);
    doc.text("Firma del Trabajador", 20, finalY + 5);
    doc.text(`CC: _________________`, 20, finalY + 12);

    doc.line(120, finalY, 190, finalY);
    doc.text("Firma Empleador", 120, finalY + 5);
    
    addFooter(doc);
    doc.save(`Recibo_${personName.replace(/\s/g, '_')}.pdf`);
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

/**
 * GENERADOR DE MANUAL TÉCNICO Y DE USUARIO
 * Diseñado específicamente para registro en la DNDA.
 */
export const generateManualPDF = () => {
    const doc = new jsPDF();
    const dateNow = new Date().toLocaleDateString();
    
    // PORTADA
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
    doc.text("Versión del Código: 2.0.0-PRO", 105, 170, { align: 'center' });
    doc.text("Sede: Colombia - 2025", 105, 180, { align: 'center' });

    // PÁGINA 2: MARCO LEGAL Y AUTORÍA
    doc.addPage();
    let y = addHeader(doc, "Marco Legal y Propiedad Intelectual", "Soporte para Dirección Nacional de Derechos de Autor", "VIVA CORE");
    
    doc.setTextColor(0);
    doc.setFontSize(10);
    const legalText = `
    El presente software, denominado "DATOSFINCA VIVA", es una obra de software original protegida por la legislación nacional e internacional vigente. 
    
    1. TITULARIDAD: Lucas Mateo Tabares Franco es el autor y titular exclusivo de los derechos morales y patrimoniales.
    2. LEGISLACIÓN APLICABLE: Ley 23 de 1982, Ley 1581 de 2012 (Habeas Data) y Ley 1915 de 2018.
    3. PROTECCIÓN TECNOLÓGICA: La aplicación incorpora algoritmos de cálculo de CPP y auditoría IVE protegidos contra ingeniería inversa.
    4. PRIVACIDAD: Los datos se almacenan bajo el paradigma "Local-First" en el dispositivo del usuario, garantizando la soberanía de la información agrícola.
    `;
    doc.text(legalText, 14, y + 10, { maxWidth: 180 });

    // PÁGINA 3: DESCRIPCIÓN TÉCNICA
    doc.addPage();
    y = addHeader(doc, "Arquitectura Técnica", "Especificaciones del Sistema", "TECH STACK");
    
    autoTable(doc, {
        startY: y + 10,
        head: [['Componente', 'Tecnología / Método']],
        body: [
            ['Lenguaje Núcleo', 'TypeScript / React 19'],
            ['Gestión de Estado', 'React Hooks (UseState / UseMemo)'],
            ['Base de Datos', 'IndexedDB (Alta Capacidad) + LocalStorage (Relay)'],
            ['Algoritmo Inventario', 'Costo Promedio Ponderado (CPP)'],
            ['Algoritmo Nómina', 'Factor Prestacional Variable'],
            ['Seguridad', 'PIN Administrativo Encriptado Localmente'],
            ['Reportes', 'Generación Dinámica PDF/Excel (Client-side)']
        ]
    });

    // PÁGINA 4: MANUAL DE USUARIO - MÓDULOS
    doc.addPage();
    y = addHeader(doc, "Manual de Operación", "Guía para el Administrador de Finca", "USER GUIDE");
    
    const modules = [
        ["Bodega Inteligente", "Permite registrar compras y salidas al gramo. Calcula automáticamente el valor de cada aplicación en campo."],
        ["Nómina Legal", "Genera recibos de pago firmables en PDF. Incluye carga social del 52% (opcional)."],
        ["Programador IVE", "Índice de Ejecución: Compara jornales planeados vs reales para detectar robos o ineficiencias."],
        ["Radar BPA", "Checklist basado en Res. ICA 082394 para certificación de predio exportador."],
        ["Simulador Real", "Modelado de flujos de caja a 6 años para cultivos de Café y Plátano."]
    ];

    autoTable(doc, {
        startY: y + 10,
        head: [['Módulo', 'Función Crítica']],
        body: modules,
        theme: 'grid'
    });

    addFooter(doc);
    doc.save(`MANUAL_TECNICO_DATOSFINCA_VIVA_${new Date().getFullYear()}.pdf`);
};

export const getDemoData = (): AppState => {
    const warehouseId = generateId();
    const today = new Date();
    const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
    const lastMonth = new Date(today); lastMonth.setMonth(today.getMonth() - 1);

    const activities: Activity[] = [
        { id: 'act_recol', warehouseId, name: 'Recolección de Café', costClassification: 'COFFEE' },
        { id: 'act_benef', warehouseId, name: 'Beneficio de Café', costClassification: 'COFFEE' },
        { id: 'act_fert', warehouseId, name: 'Fertilización Lotes Producción', costClassification: 'JOINT' },
        { id: 'act_pest', warehouseId, name: 'Control Plagas y Enfermedades', costClassification: 'JOINT' },
        { id: 'act_arv', warehouseId, name: 'Control de Arvenses (Malezas)', costClassification: 'JOINT' },
        { id: 'act_reno', warehouseId, name: 'Renovación (Zoca o Siembra)', costClassification: 'COFFEE' },
        { id: 'act_admin', warehouseId, name: 'Gastos Administrativos', costClassification: 'JOINT' }
    ];

    const costCenters: CostCenter[] = [];
    for(let i=1; i<=10; i++) {
        costCenters.push({
            id: `lot_${i}`, 
            warehouseId, 
            name: `Lote ${i} - Seccion ${i}`, 
            area: 10.0, 
            stage: i > 8 ? 'Levante' : 'Produccion', 
            cropType: 'Café', 
            plantCount: 80000, 
            associatedCrop: i % 3 === 0 ? 'Plátano' : undefined
        });
    }

    const personnel: Personnel[] = [
        { id: 'per_admin', warehouseId, name: 'Carlos Mario (Administrador)', role: 'Admin' },
        { id: 'per_mayo', warehouseId, name: 'Luis Fernando (Mayordomo)', role: 'Mayordomo' },
        { id: 'per_op1', warehouseId, name: 'Juan Diego (Operario)', role: 'Operario' },
        { id: 'per_op2', warehouseId, name: 'Andrés Felipe (Operario)', role: 'Operario' }
    ];

    const inventory: InventoryItem[] = [
        { 
            id: 'inv_fert1', warehouseId, name: 'Fertilizante Cafetero (17-6-18)', category: Category.FERTILIZANTE, 
            currentQuantity: 45000000, baseUnit: 'g', averageCost: 3400 / 1000, 
            lastPurchasePrice: 170000, lastPurchaseUnit: Unit.BULTO_50KG 
        },
        { 
            id: 'inv_pest1', warehouseId, name: 'Insecticida Broca', category: Category.INSECTICIDA, 
            currentQuantity: 50000, baseUnit: 'ml', averageCost: 120, 
            lastPurchasePrice: 120000, lastPurchaseUnit: Unit.LITRO, safetyIntervalDays: 15
        }
    ];

    const laborLogs: LaborLog[] = [];
    const totalDemoBudget = 100000000;

    const distributions = [
        { act: activities[0], px: 0.49, val: 49000000 }, 
        { act: activities[2], px: 0.14, val: 14000000 }, 
        { act: activities[4], px: 0.11, val: 11000000 }, 
        { act: activities[5], px: 0.08, val: 8000000 },  
        { act: activities[3], px: 0.07, val: 7000000 },  
        { act: activities[6], px: 0.07, val: 7000000 },  
        { act: activities[1], px: 0.04, val: 4000000 }   
    ];

    distributions.forEach(d => {
        laborLogs.push({
            id: generateId(), warehouseId, date: lastMonth.toISOString().split('T')[0],
            personnelId: personnel[2].id, personnelName: personnel[2].name,
            activityId: d.act.id, activityName: d.act.name,
            costCenterId: costCenters[0].id, costCenterName: costCenters[0].name,
            value: d.val, paid: true
        });
    });

    const harvests: HarvestLog[] = [];
    costCenters.filter(c => c.stage === 'Produccion').forEach(c => {
        const yieldLoads = 15.5; 
        harvests.push({
            id: generateId(), warehouseId, costCenterId: c.id, costCenterName: c.name,
            date: yesterday.toISOString().split('T')[0], cropName: 'Café CPS',
            quantity: yieldLoads * 125 * c.area, unit: 'Kg', 
            totalValue: yieldLoads * c.area * 1850000, 
            yieldFactor: 94
        });
    });

    return {
        warehouses: [{ id: warehouseId, name: 'Hacienda Valle 100Ha', created: today.toISOString(), ownerId: 'demo' }],
        activeWarehouseId: warehouseId,
        inventory, movements: [], suppliers: [], costCenters, personnel, activities, laborLogs, harvests, machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], plannedLabors: [], budgets: [], bpaChecklist: {}, assets: [], laborFactor: 1.52 
    };
};
