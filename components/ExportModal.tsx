
import React from 'react';
import { X, FileSpreadsheet, FileText, Download, Sprout, Briefcase, PieChart, Clipboard, ShieldCheck, Thermometer, Shield, FileCheck, ArrowRight, FileDown, Layers, MapPin, Table } from 'lucide-react';

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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-4xl rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 to-slate-800 p-8 relative flex-shrink-0 border-b border-slate-700">
          <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-emerald-600/20 p-3 rounded-2xl backdrop-blur-sm border border-emerald-500/30 shadow-lg">
              <Download className="w-8 h-8 text-emerald-500" />
            </div>
            <div>
              <h3 className="text-3xl font-black text-white leading-tight tracking-tight">Centro de Exportación</h3>
              <p className="text-emerald-400/80 text-xs font-bold uppercase tracking-widest mt-1">Inteligencia de Datos & Reportes Certificados</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* 1. INFRAESTRUCTURA Y CENSO (NUEVO) */}
                <div className="bg-slate-800 rounded-[2rem] border border-slate-700 p-6 space-y-4 shadow-lg hover:border-slate-600 transition-colors">
                    <h4 className="text-xs font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <MapPin className="w-4 h-4" /> 1. Estructura & Censo
                    </h4>
                    <p className="text-[10px] text-slate-400 leading-tight mb-2">
                        Inventario de activos fijos, lotes, poblaciones y densidades de siembra. La radiografía de la finca.
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={onExportStructurePDF} className="p-3 bg-slate-900 hover:bg-indigo-900/30 rounded-xl border border-slate-700 hover:border-indigo-500/50 transition-all text-left group">
                            <FileText className="w-5 h-5 text-indigo-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] font-black text-white uppercase">Reporte Técnico PDF</p>
                            <p className="text-[9px] text-slate-500">Resumen Ejecutivo</p>
                        </button>
                        <button onClick={onExportStructureExcel} className="p-3 bg-slate-900 hover:bg-emerald-900/30 rounded-xl border border-slate-700 hover:border-emerald-500/50 transition-all text-left group">
                            <Table className="w-5 h-5 text-emerald-500 mb-2 group-hover:scale-110 transition-transform" />
                            <p className="text-[10px] font-black text-white uppercase">Matriz Excel</p>
                            <p className="text-[9px] text-slate-500">Datos Editables</p>
                        </button>
                    </div>
                </div>

                {/* 2. CONTABILIDAD Y FINANZAS */}
                <div className="bg-slate-800 rounded-[2rem] border border-slate-700 p-6 space-y-4 shadow-lg hover:border-slate-600 transition-colors">
                    <h4 className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <FileSpreadsheet className="w-4 h-4" /> 2. Contabilidad (Libro Maestro)
                    </h4>
                    
                    <button onClick={onExportExcel} className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center justify-between transition-all shadow-xl active:scale-95 group mb-2">
                        <div className="flex items-center gap-3">
                            <FileDown className="w-5 h-5 text-white" />
                            <div className="text-left">
                                <p className="text-xs font-black text-white uppercase">Descargar Libro Maestro (.xlsx)</p>
                                <p className="text-[9px] text-emerald-100 font-bold opacity-80">Inventario + Ventas + Nómina + Costos</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white opacity-50" />
                    </button>

                    <div className="grid grid-cols-2 gap-3">
                        <button onClick={onExportLaborPDF} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg text-left transition-colors">
                            <Briefcase className="w-4 h-4 text-amber-500" />
                            <div><p className="text-[10px] font-bold text-slate-200 uppercase">Libro de Nómina</p></div>
                        </button>
                        <button onClick={onExportHarvestPDF} className="flex items-center gap-2 p-2 hover:bg-slate-700 rounded-lg text-left transition-colors">
                            <Sprout className="w-4 h-4 text-emerald-500" />
                            <div><p className="text-[10px] font-bold text-slate-200 uppercase">Bitácora Ventas</p></div>
                        </button>
                    </div>
                </div>

                {/* 3. TÉCNICO Y OPERATIVO */}
                <div className="bg-slate-800 rounded-[2rem] border border-slate-700 p-6 space-y-4 shadow-lg hover:border-slate-600 transition-colors">
                    <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Layers className="w-4 h-4" /> 3. Técnico & Operativo
                    </h4>
                    <div className="grid grid-cols-1 gap-2">
                        <button onClick={onExportPDF} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all group">
                            <div className="flex items-center gap-3">
                                <FileCheck className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-bold text-slate-200 uppercase">Inventario Valorizado (Bodega)</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400" />
                        </button>
                        <button onClick={onExportAgronomicDossier} className="flex items-center justify-between p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-blue-500/50 transition-all group">
                            <div className="flex items-center gap-3">
                                <Thermometer className="w-4 h-4 text-blue-400" />
                                <span className="text-[10px] font-bold text-slate-200 uppercase">Dossier Agronómico (Clima/Plagas)</span>
                            </div>
                            <ArrowRight className="w-3 h-3 text-slate-600 group-hover:text-blue-400" />
                        </button>
                    </div>
                </div>

                {/* 4. AUDITORÍA Y CAMPO (PLANILLAS) */}
                <div className="bg-slate-800 rounded-[2rem] border border-slate-700 p-6 space-y-4 shadow-lg hover:border-slate-600 transition-colors">
                    <h4 className="text-xs font-black text-amber-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                        <Clipboard className="w-4 h-4" /> 4. Auditoría & Campo
                    </h4>
                    
                    <button 
                        onClick={onExportFieldTemplates}
                        className="w-full p-4 bg-slate-700 hover:bg-slate-600 rounded-2xl flex items-center gap-4 transition-all shadow-md group border border-slate-600"
                    >
                        <div className="p-2 bg-white/10 rounded-xl"><Clipboard className="w-5 h-5 text-white" /></div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-white uppercase">Planillas Físicas (12 Formatos)</p>
                            <p className="text-[9px] text-slate-400 italic">Para registro manual en campo (Sin señal)</p>
                        </div>
                    </button>

                    <button onClick={onExportSafetyReport} className="flex items-center gap-3 p-2 hover:bg-slate-700 rounded-lg text-left transition-colors opacity-70 hover:opacity-100">
                        <Shield className="w-4 h-4 text-red-400" />
                        <span className="text-[10px] font-bold text-slate-300 uppercase">Informe de Seguridad (SST) & Ambiental</span>
                    </button>
                </div>

            </div>

            <div className="mt-6 p-4 bg-slate-950 rounded-2xl border border-slate-800 text-center">
                <p className="text-[9px] text-slate-500 font-medium italic">
                    "La información generada cumple con los estándares ICA y GlobalG.A.P. para la trazabilidad documental."
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};
