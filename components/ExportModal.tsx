
import React, { useRef } from 'react';
import { X, FileSpreadsheet, FileText, Download, ShoppingCart, Pickaxe, Sprout, Tractor, PieChart, Upload, Clipboard, GraduationCap } from 'lucide-react';
import { AppState } from '../types';
import { generateGlobalReport, generateFieldTemplates, generateExcelImportTemplate, getCoffeeExampleData } from '../services/reportService';
import { processExcelImport } from '../services/inventoryService';

interface ExportModalProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onGenerateOrder: () => void;
  onExportLaborPDF: () => void;
  onExportLaborExcel: () => void;
  onExportHarvestPDF?: () => void;
  onExportMachineryPDF?: () => void;
  onClose: () => void;
  activeData?: AppState; // Data for the current farm (for reports)
  globalState?: AppState; // Full application state (for imports/database ops)
  onImportSuccess: (newState: AppState) => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ 
    onExportPDF, 
    onExportExcel, 
    onGenerateOrder, 
    onExportLaborPDF,
    onExportLaborExcel,
    onExportHarvestPDF,
    onExportMachineryPDF,
    onClose,
    activeData,
    globalState,
    onImportSuccess
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGlobalReport = () => {
      if (activeData) {
          generateGlobalReport(activeData);
          onClose();
      } else {
          alert("Datos no disponibles para reporte unificado.");
      }
  };

  const handleDownloadFieldTemplates = () => {
      if (activeData) {
          generateFieldTemplates(activeData, false);
      }
  };

  const handleDownloadExcelTemplate = () => {
      if (activeData) {
        generateExcelImportTemplate(activeData, false);
      }
  };

  const handleDownloadExampleExcel = () => {
      const exampleData = getCoffeeExampleData();
      generateExcelImportTemplate(exampleData, true);
  };

  const handleDownloadExamplePDF = () => {
      const exampleData = getCoffeeExampleData();
      generateFieldTemplates(exampleData, true);
  };

  const handleUploadExcel = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      // Use globalState to ensure we don't overwrite other farms' data during import
      const targetState = globalState || activeData; 
      
      if (!file || !targetState) return;

      if (!confirm("Se procesará el archivo Excel y se agregarán los nuevos registros a su base de datos. ¿Desea continuar?")) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      processExcelImport(file, targetState).then(result => {
          alert(result.message);
          if (result.success && result.newState) {
              onImportSuccess(result.newState);
          }
          if (fileInputRef.current) fileInputRef.current.value = '';
      });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 relative flex-shrink-0">
          <button 
            onClick={onClose} 
            className="absolute top-4 right-4 text-emerald-200/70 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Centro de Gestión</h3>
              <p className="text-emerald-100/80 text-xs mt-0.5">
                  Exportando datos de: <strong>{activeData?.warehouses.find(w => w.id === activeData.activeWarehouseId)?.name || 'Finca Actual'}</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
            
            {/* SECTION: FIELD WORK (OFFLINE) */}
            <div className="space-y-3 bg-amber-900/20 p-4 rounded-xl border border-amber-500/30 shadow-lg shadow-amber-900/10">
                <h4 className="text-sm font-bold text-amber-500 uppercase flex items-center gap-2 border-b border-amber-500/20 pb-2 mb-2">
                    <Clipboard className="w-4 h-4" /> Plantillas & Carga Masiva
                </h4>
                <p className="text-[10px] text-slate-300 mb-2 leading-tight">
                    Descargue plantillas inteligentes con sus datos actuales para trabajar offline y subir masivamente.
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleDownloadFieldTemplates}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-amber-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-amber-900/40 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <FileText className="w-4 h-4 text-amber-500" />
                        </div>
                        <span className="text-slate-300 font-bold text-[10px] text-center group-hover:text-white">Imprimir Planillas PDF</span>
                    </button>

                    <button 
                        onClick={handleDownloadExcelTemplate}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-emerald-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-emerald-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-slate-300 font-bold text-[10px] text-center group-hover:text-white">Bajar Plantilla Excel</span>
                    </button>
                </div>

                <label className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-500 text-white py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-colors cursor-pointer group mt-2 shadow-sm hover:shadow-md">
                    <Upload className="w-4 h-4 group-hover:animate-bounce" />
                    Subir Excel Diligenciado
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".xlsx, .xls"
                        onChange={handleUploadExcel}
                        className="hidden" 
                    />
                </label>
            </div>

            {/* SECTION: EXAMPLES (NEW) */}
            <div className="space-y-3 bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                <h4 className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2 mb-2">
                    <GraduationCap className="w-4 h-4" /> Ejemplos de Llenado
                </h4>
                <p className="text-[10px] text-slate-300 mb-2 leading-tight">
                    ¿No sabe cómo empezar? Descargue estos archivos con datos ficticios de una finca cafetera para entender cómo estructurar su información.
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleDownloadExamplePDF}
                        className="flex items-center justify-center gap-2 p-2 bg-slate-900/50 border border-slate-700 hover:border-blue-500 rounded-lg text-xs font-bold text-slate-300 transition-colors"
                    >
                        <FileText className="w-3 h-3 text-blue-400" /> PDF Ejemplo
                    </button>
                    <button 
                        onClick={handleDownloadExampleExcel}
                        className="flex items-center justify-center gap-2 p-2 bg-slate-900/50 border border-slate-700 hover:border-green-500 rounded-lg text-xs font-bold text-slate-300 transition-colors"
                    >
                        <FileSpreadsheet className="w-3 h-3 text-green-500" /> Excel Ejemplo
                    </button>
                </div>
            </div>

            {/* SECTION: EXPORTS */}
            <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-slate-400 uppercase border-b border-slate-700 pb-1">Exportar Reportes Oficiales</h4>
                
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onExportPDF} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                        <FileText className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-white">Inventario PDF</span>
                    </button>
                    
                    <button onClick={onExportExcel} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                        <span className="text-[10px] font-bold text-white">Todo a Excel</span>
                    </button>

                    <button onClick={onGenerateOrder} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                        <ShoppingCart className="w-5 h-5 text-red-400" />
                        <span className="text-[10px] font-bold text-white">Pedido Sugerido</span>
                    </button>

                    <button onClick={handleGlobalReport} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                        <PieChart className="w-5 h-5 text-purple-400" />
                        <span className="text-[10px] font-bold text-white">Informe Gerencial</span>
                    </button>

                    <button onClick={onExportLaborPDF} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                        <Pickaxe className="w-5 h-5 text-amber-400" />
                        <span className="text-[10px] font-bold text-white">Jornales PDF</span>
                    </button>

                    <button onClick={onExportHarvestPDF} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                        <Sprout className="w-5 h-5 text-yellow-400" />
                        <span className="text-[10px] font-bold text-white">Cosechas PDF</span>
                    </button>

                    <button onClick={onExportMachineryPDF} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors">
                        <Tractor className="w-5 h-5 text-orange-400" />
                        <span className="text-[10px] font-bold text-white">Maquinaria PDF</span>
                    </button>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
};
