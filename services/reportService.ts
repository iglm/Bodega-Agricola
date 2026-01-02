
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AppState, LaborLog, HarvestLog, Movement, InventoryItem, Unit, Category, CostCenter, Personnel, Activity, PhenologyLog, PestLog, Machine, Asset, MaintenanceLog, RainLog, FinanceLog, SoilAnalysis, PPELog, WasteLog, AgendaEvent, CostClassification, Warehouse, PlannedLabor, Supplier, BudgetPlan, BudgetItem } from '../types';
import { formatCurrency, generateId, convertToBase, getBaseUnitType, processInventoryMovement, parseNumberInput } from './inventoryService';

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
    const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId)?.name || "Hacienda Viva";
    
    const forms = [
        { title: "1. Registro de Recolección Diaria", head: [['Fecha', 'Lote', 'Recolector', 'Kilos/Arrobas', 'Factor', 'Firma']] },
        { title: "2. Aplicación de Agroinsumos", head: [['Fecha', 'Lote', 'Producto', 'Dosis/Tanque', 'Bomba N°', 'Aplicador']] },
        { title: "3. Monitoreo de Plagas y Enfermedades", head: [['Fecha', 'Lote', 'Plaga/Patógeno', 'Sitios Revisados', 'Incidencia %', 'Acción']] },
        { title: "4. Control de Arvenses (Malezas)", head: [['Fecha', 'Lote', 'Método (Quím/Mec)', 'Producto/Herramienta', 'Área', 'Operario']] },
        { title: "5. Registro de Pluviometría (Lluvias)", head: [['Fecha', 'Hora Lectura', 'Milímetros (mm)', 'Observaciones Clima', 'Responsable']] },
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
        
        let y = addHeader(doc, "Planillas de Control Técnico", form.title, activeW, BRAND_COLORS.slate);
        
        doc.setFontSize(8);
        doc.setTextColor(100);
        doc.text("Este formato es un documento de trazabilidad oficial. Favor diligenciar con letra clara y tinta negra.", 14, y - 5);

        autoTable(doc, {
            startY: y,
            head: form.head,
            body: Array(15).fill(Array(form.head[0].length).fill('')),
            theme: 'grid',
            headStyles: { fillColor: [40, 40, 40], fontSize: 8, fontStyle: 'bold' },
            styles: { fontSize: 8, cellPadding: 5, minCellHeight: 12 },
            columnStyles: {
                [form.head[0].length - 1]: { cellWidth: 30 }
            }
        });

        const finalY = (doc as any).lastAutoTable.finalY + 15;
        if (finalY < 270) {
            doc.setDrawColor(200);
            doc.line(14, finalY, 80, finalY);
            doc.line(130, finalY, 196, finalY);
            doc.setFontSize(7);
            doc.text("Firma del Responsable de Campo", 14, finalY + 5);
            doc.text("Visto Bueno Administración / Auditor", 130, finalY + 5);
        }
    });

    addFooter(doc);
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

export const generateSimulationPDF = (simulation: any, params: any) => {
    const doc = new jsPDF();
    let y = addHeader(doc, "Simulación de Rentabilidad", "Proyección Financiera a 6 Años", "Planificación Estratégica", BRAND_COLORS.purple);
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text("Parámetros de Entrada", 14, y);
    
    autoTable(doc, {
        startY: y + 5,
        head: [['Parámetro', 'Valor']],
        body: [
            ['Variedad/Estrategia', params.varietyLabel],
            ['Árboles Totales', params.numTrees.toLocaleString()],
            ['Densidad (árb/Ha)', params.density.toLocaleString()],
            ['Área Total (Ha)', (params.numTrees / params.density).toFixed(2)],
            ['Precio Mercado (@)', formatCurrency(parseNumberInput(params.marketPrice))],
            ['Costo Cosecha (Kg)', formatCurrency(parseFloat(params.harvestCostKg))],
            ['Capital Inicial', formatCurrency(simulation.initCap)]
        ],
        theme: 'striped',
        headStyles: { fillColor: BRAND_COLORS.purple }
    });

    const nextY = (doc as any).lastAutoTable.finalY + 15;
    doc.text("Resultados Financieros (KPIs)", 14, nextY);
    autoTable(doc, {
        startY: nextY + 5,
        head: [['KPI', 'Resultado']],
        body: [
            ['Valor Presente Neto (VPN)', formatCurrency(simulation.vpn)],
            ['TIR / ROI Estimado', `${simulation.roi.toFixed(2)}%`],
            ['Punto de Equilibrio', simulation.paybackYear ? `Año ${simulation.paybackYear}` : 'No alcanza'],
            ['Capex Total (Establecimiento)', formatCurrency(simulation.totalCapex)]
        ],
        theme: 'grid',
        headStyles: { fillColor: BRAND_COLORS.slate }
    });

    doc.addPage();
    y = addHeader(doc, "Flujo de Caja Detallado", "Proyección Anualizada", "Planificación Estratégica", BRAND_COLORS.purple);
    
    autoTable(doc, {
        startY: y,
        head: [['Año', 'Hito', 'Ingresos', 'Costos', 'Flujo Neto']],
        body: simulation.yearlyData.map((y: any) => [
            y.year,
            y.label,
            formatCurrency(y.totalIncome),
            formatCurrency(y.totalExpenses),
            formatCurrency(y.netCashFlow)
        ]),
        headStyles: { fillColor: BRAND_COLORS.purple }
    });

    addFooter(doc);
    doc.save(`Simulacion_Viabilidad_${params.varietyLabel.replace(/ /g,"_")}.pdf`);
};

export const getDemoData = (): AppState => {
    // --- 1. SETUP MULTI-FINCA ---
    const w1_id = 'wh_main_hacienda';
    const w2_id = 'wh_el_mirador';
    const warehouses: Warehouse[] = [
        { id: w1_id, name: 'Hacienda Principal (120Ha)', created: new Date().toISOString(), ownerId: 'demo_master' },
        { id: w2_id, name: 'Finca El Mirador (85Ha)', created: new Date().toISOString(), ownerId: 'demo_master' },
    ];
    const activeWarehouseId = w1_id;

    // --- 2. MAESTROS (PERSONNEL, ACTIVITIES, SUPPLIERS) ---
    const personnel: Personnel[] = Array.from({ length: 50 }, (_, i) => ({
        id: `per_${i+1}`, warehouseId: w1_id, name: `Operario ${i+1}`, role: 'Operario de Campo'
    }));
    personnel.push({id: 'per_admin', warehouseId: w1_id, name: 'Jefe de Campo', role: 'Administrador'});
    personnel.push({id: 'per_mayor', warehouseId: w1_id, name: 'Mayordomo Finca', role: 'Supervisor'});


    const activities: Activity[] = [
        { id: 'act_recol', warehouseId: w1_id, name: 'Recolección de Café', costClassification: 'COFFEE' },
        { id: 'act_fert_prod', warehouseId: w1_id, name: 'Fertilización Lotes Producción', costClassification: 'COFFEE' },
        { id: 'act_fert_lev', warehouseId: w1_id, name: 'Fertilización Lotes Levante', costClassification: 'COFFEE' },
        { id: 'act_pest', warehouseId: w1_id, name: 'Control Fitosanitario (Fung/Ins)', costClassification: 'COFFEE' },
        { id: 'act_arv', warehouseId: w1_id, name: 'Control de Arvenses (Malezas)', costClassification: 'JOINT' },
        { id: 'act_renov', warehouseId: w1_id, name: 'Renovación por Zoca', costClassification: 'COFFEE' },
        { id: 'act_platano', warehouseId: w1_id, name: 'Mantenimiento Plátano', costClassification: 'PLANTAIN' },
        { id: 'act_admin', warehouseId: w1_id, name: 'Administrativo', costClassification: 'JOINT' }
    ];

    const suppliers: Supplier[] = [
        { id: 'sup_1', warehouseId: w1_id, name: 'Agroinsumos del Café S.A.S', phone: '3101234567' },
        { id: 'sup_2', warehouseId: w1_id, name: 'Fertilizantes de Colombia', phone: '3129876543' }
    ];

    // --- 3. ESTRUCTURA DE LOTES (COST CENTERS) ---
    const costCenters: CostCenter[] = [];
    for (let i = 1; i <= 15; i++) {
        const isLevante = i > 12;
        const area = 7 + Math.random() * 2;
        const density = isLevante ? 7800 : (i % 3 === 0 ? 5500 : 7200);
        costCenters.push({
            id: `lot_w1_${i}`, warehouseId: w1_id, name: `Lote ${i}`, area: parseFloat(area.toFixed(1)),
            stage: isLevante ? 'Levante' : 'Produccion', cropType: 'Café',
            associatedCrop: 'Plátano', plantCount: Math.round(area * density)
        });
    }
    const lotToActivate = costCenters.find(c => c.name === 'Lote 1');
    if(lotToActivate) {
        lotToActivate.assetValue = 18000000 * lotToActivate.area;
        lotToActivate.activationDate = new Date(new Date().setFullYear(new Date().getFullYear() - 2)).toISOString();
        lotToActivate.amortizationDuration = 7;
    }
    for (let i = 1; i <= 8; i++) {
        const area = 10 + Math.random() * 2;
        costCenters.push({
            id: `lot_w2_${i}`, warehouseId: w2_id, name: `Lote M${i}`, area: parseFloat(area.toFixed(1)),
            stage: 'Produccion', cropType: 'Café', plantCount: Math.round(area * 7000)
        });
    }

    // --- 4. INVENTARIO COMPLEJO Y AMPLIO ---
    const inventory: InventoryItem[] = [
        // Fertilizantes
        { id: 'inv_urea', warehouseId: w1_id, name: 'Urea (46-0-0)', category: Category.FERTILIZANTE, currentQuantity: 1500 * 1000, baseUnit: 'g', averageCost: 3.2, lastPurchasePrice: 160000, lastPurchaseUnit: Unit.BULTO_50KG, minStock: 500 * 1000 },
        { id: 'inv_dap', warehouseId: w1_id, name: 'DAP (18-46-0)', category: Category.FERTILIZANTE, currentQuantity: 2500 * 1000, baseUnit: 'g', averageCost: 4.1, lastPurchasePrice: 205000, lastPurchaseUnit: Unit.BULTO_50KG },
        { id: 'inv_kcl', warehouseId: w1_id, name: 'Cloruro de Potasio (KCL)', category: Category.FERTILIZANTE, currentQuantity: 800 * 1000, baseUnit: 'g', averageCost: 2.9, lastPurchasePrice: 145000, lastPurchaseUnit: Unit.BULTO_50KG },
        { id: 'inv_menores', warehouseId: w1_id, name: 'Fuente Menores (B, Zn, Mg)', category: Category.FERTILIZANTE, currentQuantity: 250 * 1000, baseUnit: 'g', averageCost: 5.5, lastPurchasePrice: 130000, lastPurchaseUnit: Unit.KILO, minStock: 50 * 1000 },
        // Fitosanitarios
        { id: 'inv_fung_amistar', warehouseId: w1_id, name: 'Amistar Top (Fungicida)', category: Category.FUNGICIDA, currentQuantity: 30 * 1000, baseUnit: 'ml', averageCost: 180, lastPurchasePrice: 180000, lastPurchaseUnit: Unit.LITRO, safetyIntervalDays: 21 },
        { id: 'inv_fung_cobre', warehouseId: w1_id, name: 'Oxicloruro de Cobre (Roya)', category: Category.FUNGICIDA, currentQuantity: 15 * 1000, baseUnit: 'g', averageCost: 45, lastPurchasePrice: 45000, lastPurchaseUnit: Unit.KILO, safetyIntervalDays: 15 },
        { id: 'inv_ins_lorsban', warehouseId: w1_id, name: 'Lorsban (Clorpirifos Broca)', category: Category.INSECTICIDA, currentQuantity: 5 * 1000, baseUnit: 'ml', averageCost: 95, lastPurchasePrice: 95000, lastPurchaseUnit: Unit.LITRO, safetyIntervalDays: 45, minStock: 2 * 1000 },
        { id: 'inv_herb_glifo', warehouseId: w1_id, name: 'Glifosato 480SL', category: Category.HERBICIDA, currentQuantity: 80 * 1000, baseUnit: 'ml', averageCost: 25, lastPurchasePrice: 100000, lastPurchaseUnit: Unit.GALON, safetyIntervalDays: 30 },
        { id: 'inv_herb_paraquat', warehouseId: w1_id, name: 'Paraquat (Gramoxone)', category: Category.HERBICIDA, currentQuantity: 20 * 1000, baseUnit: 'ml', averageCost: 45, lastPurchasePrice: 180000, lastPurchaseUnit: Unit.GALON, safetyIntervalDays: 40 },
        // Otros
        { id: 'inv_bio', warehouseId: w1_id, name: 'Bioestimulante Marino', category: Category.BIOESTIMULANTE, currentQuantity: 15 * 1000, baseUnit: 'ml', averageCost: 90, lastPurchasePrice: 90000, lastPurchaseUnit: Unit.LITRO },
        { id: 'inv_coad', warehouseId: w1_id, name: 'Adherente No Iónico (Coadyuvante)', category: Category.OTRO, currentQuantity: 10 * 1000, baseUnit: 'ml', averageCost: 30, lastPurchasePrice: 30000, lastPurchaseUnit: Unit.LITRO },
        { id: 'inv_bioabono', warehouseId: w1_id, name: 'Compost Orgánico Certificado', category: Category.BIOABONO, currentQuantity: 5000 * 1000, baseUnit: 'g', averageCost: 1.2, lastPurchasePrice: 60000, lastPurchaseUnit: Unit.BULTO_50KG },
        // Sede 2
        { id: 'inv_w2_urea', warehouseId: w2_id, name: 'Urea (46-0-0)', category: Category.FERTILIZANTE, currentQuantity: 800 * 1000, baseUnit: 'g', averageCost: 3.3, lastPurchasePrice: 165000, lastPurchaseUnit: Unit.BULTO_50KG }
    ];

    // --- 5. GENERACIÓN DE HISTÓRICOS ---
    const movements: Movement[] = [];
    const laborLogs: LaborLog[] = [];
    const harvests: HarvestLog[] = [];
    const rainLogs: RainLog[] = [];
    const phenologyLogs: PhenologyLog[] = [];
    const pestLogs: PestLog[] = [];
    
    const today = new Date();
    for (let i = 180; i > 0; i--) {
        const date = new Date(today);
        date.setDate(today.getDate() - i);
        const dateStr = date.toISOString();

        if (Math.random() > 0.4) rainLogs.push({ id: generateId(), warehouseId: w1_id, date: dateStr, millimeters: Math.random() * 25 });
        
        if (i % 15 === 0) {
            const productionLots = costCenters.filter(c => c.stage === 'Produccion' && c.warehouseId === w1_id);
            const fert = inventory.find(inv => inv.id === 'inv_dap')!;
            const lot = productionLots[i % productionLots.length];
            movements.push({
                id: generateId(), warehouseId: w1_id, itemId: fert.id, itemName: fert.name, type: 'OUT',
                quantity: 1.5, unit: Unit.BULTO_50KG, calculatedCost: 1.5 * 50000 * fert.averageCost,
                date: dateStr, costCenterId: lot.id, costCenterName: lot.name
            });
            const fertActivity = activities.find(a => a.id === 'act_fert_prod')!;
            for(let k=0; k<3; k++) {
                const worker = personnel[k];
                laborLogs.push({
                    id: generateId(), warehouseId: w1_id, date: dateStr.split('T')[0], personnelId: worker.id, personnelName: worker.name,
                    activityId: fertActivity.id, activityName: fertActivity.name, costCenterId: lot.id, costCenterName: lot.name,
                    value: 80000, paid: Math.random() > 0.3
                });
            }
        }
        
        if (date.getMonth() >= 9 && date.getMonth() <= 11) {
            if (i % 5 === 0) {
                const lot = costCenters.filter(c => c.stage === 'Produccion' && c.warehouseId === w1_id)[i % 5];
                const qty = 800 + Math.random() * 500;
                const collectors = 5 + Math.floor(Math.random() * 5);
                const pestPct = lot.plantCount! < 6000 * lot.area ? 3.5 : 1.5;
                harvests.push({
                    id: generateId(), warehouseId: w1_id, costCenterId: lot.id, costCenterName: lot.name,
                    date: dateStr.split('T')[0], cropName: 'Café Pergamino Seco', quantity: qty, unit: 'Kg',
                    totalValue: qty * 14800, collectorsCount: collectors,
                    yieldFactor: 92 + Math.random() * 2, pestPercentage: pestPct + Math.random(),
                    brocaLossValue: (qty * 14800) * (pestPct/100) * 0.5
                });
            }
        }
        
        if (i > 150 && i < 160) {
             const lot = costCenters.filter(c => c.stage === 'Produccion' && c.warehouseId === w1_id)[0];
             phenologyLogs.push({ id: generateId(), warehouseId: w1_id, costCenterId: lot.id, date: dateStr, stage: 'Floración'});
        }
    }
    
    // --- 6. DATOS DE CUMPLIMIENTO Y PLANIFICACIÓN ---
    const ppeLogs: PPELog[] = [{
        id: generateId(), warehouseId: w1_id, personnelId: personnel[0].id, personnelName: personnel[0].name,
        date: new Date().toISOString(), items: ['Guantes de Nitrilo', 'Careta de Protección']
    }];
    const wasteLogs: WasteLog[] = [{
        id: generateId(), warehouseId: w1_id, date: new Date().toISOString(), itemDescription: 'Envases de Amistar Top 1L',
        quantity: 5, tripleWashed: true
    }];
    const nextWeekDate = new Date(today);
    nextWeekDate.setDate(today.getDate() + 7);
    const plannedLabors: PlannedLabor[] = [{
        id: generateId(), warehouseId: w1_id, completed: false, date: nextWeekDate.toISOString().split('T')[0],
        activityId: 'act_arv', activityName: 'Control de Arvenses (Malezas)',
        costCenterId: costCenters[0].id, costCenterName: costCenters[0].name,
        targetArea: 5, technicalYield: 0.5, unitCost: 75000, efficiency: 90,
        calculatedPersonDays: 11.1, calculatedTotalCost: 833333
    }];
    const budgetItems: BudgetItem[] = [
        { id: generateId(), type: 'LABOR', conceptId: 'act_fert_prod', conceptName: 'Fertilización', quantityPerHa: 10, unitCost: 80000, months: [2, 5, 8] },
        { id: generateId(), type: 'SUPPLY', conceptId: 'inv_dap', conceptName: 'DAP', quantityPerHa: 8, unitCost: 205000, months: [2, 5, 8] }
    ];
    const budgets: BudgetPlan[] = [{
        id: generateId(), warehouseId: w1_id, year: today.getFullYear(), costCenterId: costCenters[0].id, items: budgetItems
    }];

    // --- 7. ENSAMBLAJE FINAL ---
    return {
        warehouses, activeWarehouseId, inventory, movements, suppliers, costCenters,
        personnel, activities, laborLogs, harvests, rainLogs, phenologyLogs, pestLogs,
        ppeLogs, wasteLogs, plannedLabors, budgets,
        machines: [], maintenanceLogs: [], financeLogs: [], soilAnalyses: [], agenda: [],
        bpaChecklist: {}, assets: [], laborFactor: 1.52
    };
};
