
import React from 'react';
import { X, FileSpreadsheet, FileText, Download, ShoppingCart, Pickaxe, Sprout, Tractor, PieChart, Clipboard, GraduationCap, Lock, ShieldCheck, Calculator, Briefcase, FileCheck, Landmark, Thermometer, CloudRain, Shield, Recycle, FlaskConical, Map, ArrowRight, FileDown, FileJson } from 'lucide-react';

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
}) => {

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-xl rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-8 relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-emerald-200/70 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
          
          <div className="flex items-center gap-4 mb-2">
            <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/20 shadow-lg">
              <Download className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black text-white leading-tight">Centro de Reportes</h3>
              <p className="text-emerald-100/80 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Gestión de Fincas • Lucas Mateo Tabares Franco</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-900/30">
            
            {/* PAQUETE DE DATOS MAESTROS - INTEGRADO */}
            <div className="bg-emerald-950/20 p-6 rounded-[2.5rem] border border-emerald-500/20 relative overflow-hidden space-y-4">
                <div className="flex justify-between items-center">
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FileSpreadsheet className="w-3 h-3" /> Base de Datos Completa (Libro Maestro)
                    </h4>
                </div>
                
                <div className="grid grid-cols-1 gap-2">
                    <button 
                        onClick={onExportExcel}
                        className="w-full p-4 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center justify-between transition-all shadow-xl active:scale-95 group"
                    >
                        <div className="flex items-center gap-4">
                            <FileSpreadsheet className="w-5 h-5 text-white" />
                            <div className="text-left">
                                <p className="text-xs font-black text-white uppercase">Exportar EXCEL (.xlsx)</p>
                                <p className="text-[8px] text-emerald-100 uppercase font-bold italic">Bitácora Total (10 Pestañas)</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white opacity-50" />
                    </button>

                    <button 
                        onClick={onExportMasterPDF}
                        className="w-full p-4 bg-indigo-600 hover:bg-indigo-500 rounded-2xl flex items-center justify-between transition-all shadow-xl active:scale-95 group"
                    >
                        <div className="flex items-center gap-4">
                            <FileDown className="w-5 h-5 text-white" />
                            <div className="text-left">
                                <p className="text-xs font-black text-white uppercase">Exportar PDF Consolidado</p>
                                <p className="text-[8px] text-indigo-100 uppercase font-bold italic">Reporte Gerencial Todo-en-uno</p>
                            </div>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white opacity-50" />
                    </button>
                </div>
            </div>

            {/* REPORTES TÉCNICOS POR MÓDULO */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                    <FlaskConical className="w-3 h-3" /> Reportes Administrativos y Técnicos
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onExportPDF} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl border border-slate-700 flex flex-col gap-2 transition-all">
                        <FileCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-[9px] font-black text-white uppercase text-left">Bodega Valorizada</span>
                    </button>
                    <button onClick={onExportLaborPDF} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl border border-slate-700 flex flex-col gap-2 transition-all">
                        <Briefcase className="w-5 h-5 text-amber-400" />
                        <span className="text-[9px] font-black text-white uppercase text-left">Libro de Nómina</span>
                    </button>
                    <button onClick={onExportHarvestPDF} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl border border-slate-700 flex flex-col gap-2 transition-all">
                        <Sprout className="w-5 h-5 text-indigo-400" />
                        <span className="text-[9px] font-black text-white uppercase text-left">Bitácora Ventas</span>
                    </button>
                    <button onClick={onExportGlobalReport} className="p-4 bg-indigo-900/20 hover:bg-indigo-900/30 rounded-3xl border border-indigo-500/30 flex flex-col gap-2 transition-all">
                        <PieChart className="w-5 h-5 text-amber-400" />
                        <span className="text-[9px] font-black text-white uppercase text-left">Balance Gerencial</span>
                    </button>
                </div>
            </div>

            {/* REPORTES DE CUMPLIMIENTO Y CAMPO */}
            <div className="space-y-3 pt-2">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                    <ShieldCheck className="w-3 h-3" /> Documentación para Auditorías
                </h4>
                
                <div className="grid grid-cols-1 gap-3">
                    <button 
                        onClick={onExportAgronomicDossier}
                        className="w-full p-4 bg-blue-900/20 hover:bg-blue-900/30 rounded-3xl border border-blue-500/30 flex items-center gap-4 group transition-all"
                    >
                        <div className="p-3 bg-blue-500/20 rounded-2xl"><Thermometer className="w-6 h-6 text-blue-400" /></div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-white uppercase">Dossier Agronómico</p>
                            <p className="text-[8px] text-blue-300 font-bold uppercase italic">Suelos, Lluvias y Plagas</p>
                        </div>
                    </button>

                    <button 
                        onClick={onExportSafetyReport}
                        className="w-full p-4 bg-red-900/20 hover:bg-red-900/30 rounded-3xl border border-red-500/30 flex items-center gap-4 group transition-all"
                    >
                        <div className="p-3 bg-red-500/20 rounded-2xl"><Shield className="w-6 h-6 text-red-400" /></div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-white uppercase">Auditoría SST & Ambiental</p>
                            <p className="text-[8px] text-red-300 font-bold uppercase italic">EPP y Triple Lavado</p>
                        </div>
                    </button>

                    <button 
                        onClick={onExportFieldTemplates}
                        className="w-full p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl border border-slate-700 flex items-center gap-4 group transition-all"
                    >
                        <div className="p-3 bg-slate-700 rounded-2xl"><Clipboard className="w-6 h-6 text-slate-400" /></div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-white uppercase">Planillas Físicas de Campo</p>
                            <p className="text-[8px] text-slate-500 font-bold uppercase italic">Para registro manual (12 formatos)</p>
                        </div>
                    </button>
                </div>
            </div>

            <div className="p-4 bg-slate-950 rounded-3xl border border-slate-800 text-center">
                <p className="text-[9px] text-slate-500 leading-tight italic">
                    Todos los reportes cumplen con la normativa ICA y estándares internacionales GlobalG.A.P. y Código 4C.
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};
