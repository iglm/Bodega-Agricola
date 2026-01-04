
import React, { useRef } from 'react';
import { X, FileSpreadsheet, FileText, Download, Sprout, Briefcase, PieChart, Clipboard, ShieldCheck, Thermometer, Shield, FileCheck, ArrowRight, FileDown, Layers, MapPin, Table, Book, BarChart4, Archive, Users, Tractor, DollarSign, Printer, Upload } from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { generateExcel, exportFieldSheet } from '../services/reportService';

interface ExportModalProps {
  onClose: () => void;
  onExportExcel: () => void;
  onExportMasterPDF: () => void;
  onExportPDF: () => void;
  onExportLaborPDF: () => void;
  onExportHarvestPDF: () => void;
  onExportGlobalReport: () => void;
  onExportAgronomicDossier: () => void;
  onExportSafetyReport: () => void;
  onExportFieldTemplates: () => void;
  onExportStructurePDF: () => void;
  onExportStructureExcel: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ 
    onClose,
    onExportExcel,
    onExportMasterPDF,
    onExportPDF,
    onExportLaborPDF,
    onExportHarvestPDF,
    onExportGlobalReport,
    onExportAgronomicDossier,
    onExportSafetyReport,
    onExportFieldTemplates,
    onExportStructurePDF,
    onExportStructureExcel
}) => {
  const { data, setData } = useData();
  const activeW = data.warehouses.find(w => w.id === data.activeWarehouseId);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExportCostNotebook = () => {
      generateExcel(data);
  };

  const handleExportFieldSheet = () => {
      exportFieldSheet(data.personnel, activeW?.name || 'Sede Principal');
  };

  // Función unificada: Genera el JSON exacto que pide el Restore
  const handleDownloadFullBackup = () => {
      try {
          const warehouseName = activeW ? activeW.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'finca';
          const dateStr = new Date().toISOString().split('T')[0];
          const fileName = `Backup_AgroBodega_${warehouseName}_${dateStr}.json`;

          const jsonString = JSON.stringify(data, null, 2);
          const blob = new Blob([jsonString], { type: "application/json" });
          const url = URL.createObjectURL(blob);
          
          const link = document.createElement("a");
          link.href = url;
          link.download = fileName;
          document.body.appendChild(link);
          link.click();
          
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          
          // Marca de seguridad
          localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString());
      } catch (error) {
          console.error("Error generando backup:", error);
          alert("Error al generar el archivo de respaldo.");
      }
  };

  const handleRestore = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("⚠️ ATENCIÓN: Al restaurar una copia de seguridad, SE SOBRESCRIBIRÁN TODOS LOS DATOS ACTUALES de este dispositivo.\n\n¿Está seguro de continuar con la importación?")) {
        // Reset input so change event can fire again if user cancels and tries same file
        e.target.value = '';
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        
        // Validación básica de integridad
        if (!json.inventory || !json.costCenters || !Array.isArray(json.inventory)) {
            throw new Error("El archivo no tiene el formato de backup válido.");
        }

        setData(json);
        alert("✅ Copia de seguridad restaurada exitosamente.");
        onClose();
      } catch (err) {
        console.error(err);
        alert("❌ Error al restaurar: El archivo está corrupto o no es compatible.");
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-5xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        
        {/* Header de Alto Nivel */}
        <div className="bg-slate-950 p-8 border-b border-slate-800 flex justify-between items-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 via-indigo-500 to-amber-500"></div>
          <div className="flex items-center gap-5 z-10">
            <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 shadow-xl">
              <BarChart4 className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white leading-none tracking-tight">Centro de Reportes</h3>
              <p className="text-slate-400 text-sm font-medium mt-1">Exportación de datos para auditoría y gestión.</p>
            </div>
          </div>
          <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-all z-10 active:scale-90">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-8 bg-slate-900">
            
            {/* SECCIÓN 1: FINANZAS & CONTABILIDAD (DESTACADA) */}
            <div className="mb-10">
                <h4 className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <DollarSign className="w-4 h-4" /> Contabilidad Agrícola
                </h4>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* TARJETA PREMIUM: CUADERNO DE COSTOS */}
                    <button 
                        onClick={handleExportCostNotebook}
                        className="col-span-1 lg:col-span-2 relative overflow-hidden bg-gradient-to-br from-emerald-900/40 to-slate-800 rounded-[2.5rem] border border-emerald-500/30 p-1 group hover:border-emerald-500/60 transition-all shadow-2xl active:scale-[0.99]"
                    >
                        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/graphy.png')] opacity-10"></div>
                        <div className="relative bg-slate-900/50 backdrop-blur-sm rounded-[2.3rem] p-6 sm:p-8 flex flex-col sm:flex-row items-center gap-6">
                            <div className="bg-emerald-500 p-4 rounded-3xl shadow-lg shadow-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
                                <Book className="w-8 h-8 text-white" />
                            </div>
                            <div className="flex-1 text-left">
                                <h5 className="text-xl font-black text-white mb-1 group-hover:text-emerald-300 transition-colors">Cuaderno de Costos (.xlsx)</h5>
                                <p className="text-sm text-slate-300 font-medium leading-relaxed">
                                    Genera el libro contable oficial con pestañas separadas para <strong>Nómina, Insumos y Ventas</strong>. Formato optimizado para bancos y Federación Nacional.
                                </p>
                            </div>
                            <div className="bg-slate-800 p-3 rounded-full border border-slate-600 group-hover:bg-emerald-600 group-hover:border-emerald-500 transition-colors">
                                <ArrowRight className="w-6 h-6 text-white" />
                            </div>
                        </div>
                    </button>

                    {/* Reportes Secundarios Finanzas */}
                    <div onClick={onExportMasterPDF} className="bg-slate-800 hover:bg-slate-750 p-6 rounded-[2rem] border border-slate-700 hover:border-slate-600 cursor-pointer transition-all group flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl text-indigo-400 group-hover:text-white group-hover:bg-indigo-600 transition-colors"><FileText className="w-6 h-6"/></div>
                        <div>
                            <h5 className="font-bold text-white text-base">Resumen Gerencial PDF</h5>
                            <p className="text-xs text-slate-400 mt-1">Informe ejecutivo para toma de decisiones rápidas.</p>
                        </div>
                    </div>

                    {/* BACKUP COMPLETO (JSON) */}
                    <div onClick={handleDownloadFullBackup} className="bg-slate-800 hover:bg-slate-750 p-6 rounded-[2rem] border border-slate-700 hover:border-slate-600 cursor-pointer transition-all group flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl text-slate-400 group-hover:text-white group-hover:bg-slate-600 transition-colors"><Archive className="w-6 h-6"/></div>
                        <div>
                            <h5 className="font-bold text-white text-base">Backup Completo (JSON)</h5>
                            <p className="text-xs text-slate-400 mt-1">Descargar archivo compatible para restaurar.</p>
                        </div>
                    </div>

                    {/* RESTAURAR BACKUP */}
                    <div onClick={() => fileInputRef.current?.click()} className="bg-slate-800 hover:bg-slate-750 p-6 rounded-[2rem] border border-slate-700 hover:border-slate-600 cursor-pointer transition-all group flex items-start gap-4">
                        <div className="p-3 bg-slate-900 rounded-2xl text-blue-400 group-hover:text-white group-hover:bg-blue-600 transition-colors"><Upload className="w-6 h-6"/></div>
                        <div>
                            <h5 className="font-bold text-white text-base">Cargar / Restaurar Backup</h5>
                            <p className="text-xs text-slate-400 mt-1">Subir archivo .json y restaurar datos en la app.</p>
                        </div>
                        <input 
                            type="file" 
                            ref={fileInputRef} 
                            onChange={handleRestore} 
                            accept=".json" 
                            className="hidden" 
                        />
                    </div>
                </div>
            </div>

            {/* SECCIÓN 2: CAMPO Y NÓMINA */}
            <div className="mb-10">
                <h4 className="text-xs font-black text-amber-500 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Tractor className="w-4 h-4" /> Operaciones de Campo
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <button onClick={onExportLaborPDF} className="bg-slate-800 p-5 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 hover:bg-slate-750 text-left transition-all group">
                        <Users className="w-6 h-6 text-amber-500 mb-3 group-hover:scale-110 transition-transform origin-left" />
                        <p className="font-black text-slate-200 text-sm">Reporte de Nómina</p>
                        <p className="text-[10px] text-slate-500 mt-1">Historial de pagos y jornales.</p>
                    </button>

                    <button onClick={onExportHarvestPDF} className="bg-slate-800 p-5 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 hover:bg-slate-750 text-left transition-all group">
                        <Sprout className="w-6 h-6 text-amber-500 mb-3 group-hover:scale-110 transition-transform origin-left" />
                        <p className="font-black text-slate-200 text-sm">Control Cosecha</p>
                        <p className="text-[10px] text-slate-500 mt-1">Kilos recolectados y ventas.</p>
                    </button>

                    <button onClick={handleExportFieldSheet} className="bg-slate-800 p-5 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 hover:bg-slate-750 text-left transition-all group">
                        <Printer className="w-6 h-6 text-indigo-400 group-hover:text-amber-500 mb-3 group-hover:scale-110 transition-transform origin-left" />
                        <p className="font-black text-slate-200 text-sm">Imprimir Planilla en Blanco</p>
                        <p className="text-[10px] text-slate-500 mt-1">PDF con lista de trabajadores para llenar a mano.</p>
                    </button>

                    <button onClick={onExportFieldTemplates} className="bg-slate-800 p-5 rounded-[2rem] border border-slate-700 hover:border-amber-500/50 hover:bg-slate-750 text-left transition-all group">
                        <Clipboard className="w-6 h-6 text-slate-400 group-hover:text-amber-500 mb-3 group-hover:scale-110 transition-transform origin-left" />
                        <p className="font-black text-slate-200 text-sm">Planillas Genéricas</p>
                        <p className="text-[10px] text-slate-500 mt-1">Formatos estándar para imprimir.</p>
                    </button>
                </div>
            </div>

            {/* SECCIÓN 3: BODEGA Y TÉCNICO */}
            <div>
                <h4 className="text-xs font-black text-blue-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                    <Layers className="w-4 h-4" /> Bodega & Técnico
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <button onClick={onExportPDF} className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 hover:bg-slate-750 transition-colors group">
                        <div className="p-2 bg-blue-900/30 rounded-xl text-blue-400"><FileCheck className="w-5 h-5" /></div>
                        <div className="text-left">
                            <p className="font-bold text-slate-200 text-sm">Inventario Valorizado</p>
                            <p className="text-[10px] text-slate-500">Stock actual y costo promedio.</p>
                        </div>
                    </button>

                    <button onClick={onExportAgronomicDossier} className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 hover:bg-slate-750 transition-colors group">
                        <div className="p-2 bg-blue-900/30 rounded-xl text-blue-400"><Thermometer className="w-5 h-5" /></div>
                        <div className="text-left">
                            <p className="font-bold text-slate-200 text-sm">Dossier Agronómico</p>
                            <p className="text-[10px] text-slate-500">Lluvias, plagas y suelos.</p>
                        </div>
                    </button>

                    <button onClick={onExportSafetyReport} className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 hover:bg-slate-750 transition-colors group">
                        <div className="p-2 bg-red-900/20 rounded-xl text-red-400"><ShieldCheck className="w-5 h-5" /></div>
                        <div className="text-left">
                            <p className="font-bold text-slate-200 text-sm">Informe SST / Ambiental</p>
                            <p className="text-[10px] text-slate-500">Entregas EPP y Residuos.</p>
                        </div>
                    </button>

                    <button onClick={onExportStructureExcel} className="flex items-center gap-4 bg-slate-800 p-4 rounded-2xl border border-slate-700 hover:bg-slate-750 transition-colors group">
                        <div className="p-2 bg-emerald-900/20 rounded-xl text-emerald-400"><MapPin className="w-5 h-5" /></div>
                        <div className="text-left">
                            <p className="font-bold text-slate-200 text-sm">Censo de Lotes</p>
                            <p className="text-[10px] text-slate-500">Matriz de estructura en Excel.</p>
                        </div>
                    </button>
                </div>
            </div>

        </div>
        
        {/* Footer Informativo */}
        <div className="bg-slate-950 p-4 text-center border-t border-slate-800">
            <p className="text-[10px] text-slate-600 font-medium">
                Todos los reportes generados cumplen con los estándares de trazabilidad ICA y GlobalG.A.P.
            </p>
        </div>

      </div>
    </div>
  );
};
