
import React, { useRef } from 'react';
import { X, FileSpreadsheet, FileText, Download, ShoppingCart, Pickaxe, Sprout, Tractor, PieChart, Upload, Clipboard, GraduationCap } from 'lucide-react';
import { AppState } from '../types';
import { generateGlobalReport, generateFieldTemplates, generateExcelImportTemplate, getCoffeeExampleData } from '../services/reportService';
import { processExcelImport, saveData } from '../services/inventoryService';

interface ExportModalProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onGenerateOrder: () => void;
  onExportLaborPDF: () => void;
  onExportLaborExcel: () => void;
  onExportHarvestPDF?: () => void;
  onExportMachineryPDF?: () => void;
  onClose: () => void;
  fullData?: AppState; 
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
    fullData
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleGlobalReport = () => {
      if (fullData) {
          generateGlobalReport(fullData);
          onClose();
      } else {
          alert("Datos no disponibles para reporte unificado.");
      }
  };

  const handleDownloadFieldTemplates = () => {
      if (fullData) {
          generateFieldTemplates(fullData, false);
      }
  };

  const handleDownloadExcelTemplate = () => {
      if (fullData) {
        generateExcelImportTemplate(fullData, false);
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
      if (!file || !fullData) return;

      if (!confirm("Se procesará el archivo Excel y se agregarán los nuevos registros a su base de datos. ¿Desea continuar?")) {
          if (fileInputRef.current) fileInputRef.current.value = '';
          return;
      }

      processExcelImport(file, fullData).then(result => {
          alert(result.message);
          if (result.success && result.newState) {
              // We need to trigger a global state update. 
              // Since this component doesn't have setState, we save to LocalStorage and reload page to reflect changes safely.
              saveData(result.newState);
              window.location.reload(); 
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
            <h3 className="text-xl font-bold text-white">Centro de Gestión</h3>
          </div>
          <p className="text-emerald-100/80 text-xs ml-1">Reportes y Trabajo de Campo Offline</p>
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
                <h4 className="text-sm font-bold text-blue-400 uppercase flex items-center gap-2 border-b border-blue-500/20 pb-2 mb-2">
                    <GraduationCap className="w-4 h-4" /> Zona de Aprendizaje
                </h4>
                <p className="text-[10px] text-slate-300 mb-2 leading-tight">
                    ¿Dudas sobre cómo llenar las plantillas? Descargue ejemplos con datos ficticios de café.
                </p>
                <div className="grid grid-cols-2 gap-3">
                    <button 
                        onClick={handleDownloadExampleExcel}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
                    >
                        <span className="text-blue-400 font-bold text-[10px] text-center group-hover:text-white mb-1">Excel Relleno</span>
                        <FileSpreadsheet className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                    </button>
                    <button 
                        onClick={handleDownloadExamplePDF}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900 border border-slate-700 rounded-xl hover:bg-slate-800 hover:border-blue-500/50 transition-all group"
                    >
                        <span className="text-blue-400 font-bold text-[10px] text-center group-hover:text-white mb-1">PDF Relleno</span>
                        <FileText className="w-4 h-4 text-slate-500 group-hover:text-blue-400" />
                    </button>
                </div>
            </div>

            {/* UNIFIED REPORT BUTTON */}
            {fullData && (
                <div>
                    <button 
                        onClick={handleGlobalReport}
                        className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg shadow-blue-900/40 hover:scale-[1.02] transition-transform group"
                    >
                        <div className="flex items-center gap-4">
                            <div className="bg-white/20 p-2 rounded-lg">
                                <PieChart className="w-6 h-6 text-white" />
                            </div>
                            <div className="text-left">
                                <h4 className="text-white font-bold text-sm uppercase">Informe Gerencial Unificado</h4>
                                <p className="text-blue-100 text-[10px]">Todo en uno (Finanzas, Lotes, Cosechas)</p>
                            </div>
                        </div>
                        <FileText className="w-5 h-5 text-blue-200" />
                    </button>
                </div>
            )}

            <div className="border-t border-slate-700"></div>

            {/* SECTION 1: INVENTORY */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-emerald-400 uppercase flex items-center gap-2">
                    <Download className="w-4 h-4" /> Inventario & Insumos
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {/* PDF Option */}
                    <button 
                        onClick={onExportPDF}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-red-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-red-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="text-slate-300 group-hover:text-white font-bold text-[10px]">Reporte PDF</span>
                    </button>

                    {/* Excel Option */}
                    <button 
                        onClick={onExportExcel}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-emerald-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-emerald-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-slate-300 group-hover:text-white font-bold text-[10px]">Excel Completo</span>
                    </button>
                </div>

                {/* Order Generation */}
                <button 
                    onClick={onGenerateOrder}
                    className="w-full flex items-center justify-between p-3 bg-blue-900/20 border border-blue-500/30 rounded-xl hover:bg-blue-900/40 hover:border-blue-500/60 transition-all group"
                >
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                             <ShoppingCart className="w-4 h-4 text-blue-400" />
                        </div>
                        <div className="text-left">
                            <h4 className="text-white font-bold text-xs">Pedido Sugerido</h4>
                            <p className="text-xs text-slate-400">Items en stock bajo</p>
                        </div>
                    </div>
                </button>
            </div>

            <div className="border-t border-slate-700"></div>

            {/* SECTION 2: PRODUCTION & MACHINERY (NEW) */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-yellow-400 uppercase flex items-center gap-2">
                    <Sprout className="w-4 h-4" /> Producción y Maquinaria
                </h4>
                <div className="grid grid-cols-2 gap-3">
                     {/* Harvest PDF */}
                     <button 
                        onClick={onExportHarvestPDF}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-yellow-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-yellow-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Sprout className="w-4 h-4 text-yellow-500" />
                        </div>
                        <span className="text-slate-300 group-hover:text-white font-bold text-[10px]">Cosechas (PDF)</span>
                    </button>

                    {/* Machinery PDF */}
                    <button 
                        onClick={onExportMachineryPDF}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-orange-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-orange-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <Tractor className="w-4 h-4 text-orange-500" />
                        </div>
                        <span className="text-slate-300 group-hover:text-white font-bold text-[10px]">Maquinaria (PDF)</span>
                    </button>
                </div>
            </div>

            <div className="border-t border-slate-700"></div>

            {/* SECTION 3: LABOR */}
            <div className="space-y-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase flex items-center gap-2">
                    <Pickaxe className="w-4 h-4" /> Mano de Obra
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    {/* Labor PDF */}
                    <button 
                        onClick={onExportLaborPDF}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-red-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-red-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <FileText className="w-4 h-4 text-red-500" />
                        </div>
                        <span className="text-slate-300 group-hover:text-white font-bold text-[10px]">Reporte PDF</span>
                    </button>

                    {/* Labor Excel */}
                    <button 
                        onClick={onExportLaborExcel}
                        className="flex flex-col items-center justify-center p-3 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-emerald-500/50 transition-all group"
                    >
                        <div className="w-8 h-8 bg-emerald-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                        </div>
                        <span className="text-slate-300 group-hover:text-white font-bold text-[10px]">Excel Completo</span>
                    </button>
                </div>
            </div>
            
             <div className="mt-2 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                 <p className="text-[10px] text-slate-500 text-center">
                     Los reportes se generan y descargan localmente en su dispositivo.
                 </p>
             </div>
        </div>
      </div>
    </div>
  );
};
