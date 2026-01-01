
import React from 'react';
import { X, FileSpreadsheet, FileText, Download, ShoppingCart, Pickaxe, Sprout, Tractor, PieChart, Clipboard, GraduationCap, Crown, Lock, ShieldCheck, Calculator, Briefcase, FileCheck, Landmark, Thermometer, CloudRain, Shield, Recycle, FlaskConical, Map, ArrowRight } from 'lucide-react';
import { AppState } from '../types';
import { generateGlobalReport, generateFieldTemplates, generateExecutiveReport, generateExcel, generatePDF, generateLaborReport, generateHarvestReport, generateAgronomicDossier, generateSafetyReport } from '../services/reportService';

interface ExportModalProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onGenerateOrder: () => void;
  onExportLaborPDF: () => void;
  onExportLaborExcel: () => void;
  onExportHarvestPDF?: () => void;
  onExportMachineryPDF?: () => void;
  onClose: () => void;
  activeData?: AppState; 
  onShowSupport: () => void;
  isSupporter?: boolean;
}

export const ExportModal: React.FC<ExportModalProps> = ({ 
    onClose,
    activeData,
    onShowSupport,
    isSupporter
}) => {

  const handleProAction = (action: () => void) => {
      if (isSupporter) {
          action();
      } else {
          onShowSupport();
      }
  };

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
              <p className="text-emerald-100/80 text-[10px] font-bold uppercase tracking-widest mt-1 italic">Gestión Documental Pro - Lucas Mateo Tabares Franco</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-900/30">
            
            {/* PAQUETE DE DATOS MAESTROS */}
            <div className="bg-emerald-950/20 p-5 rounded-[2.5rem] border border-emerald-500/20 relative overflow-hidden">
                <div className="flex justify-between items-center mb-4">
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] flex items-center gap-2">
                        <FileSpreadsheet className="w-3 h-3" /> Base de Datos Completa (Excel)
                    </h4>
                    {!isSupporter && <Crown className="w-4 h-4 text-amber-500 animate-pulse" />}
                </div>
                
                <button 
                    onClick={() => handleProAction(() => generateExcel(activeData!))}
                    className="w-full p-5 bg-emerald-600 hover:bg-emerald-500 rounded-[2rem] flex items-center justify-between transition-all shadow-xl shadow-emerald-900/40 active:scale-95 group"
                >
                    <div className="flex items-center gap-4">
                        <div className="bg-white/20 p-3 rounded-2xl group-hover:scale-110 transition-transform">
                            <FileSpreadsheet className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                            <p className="text-sm font-black text-white uppercase">Descargar Libro Maestro</p>
                            <p className="text-[9px] text-emerald-100 uppercase font-bold italic">Bitácora Total (10 Pestañas)</p>
                        </div>
                    </div>
                    <ArrowRight className="w-5 h-5 text-white opacity-50" />
                </button>
            </div>

            {/* REPORTES TÉCNICOS POR MÓDULO */}
            <div className="space-y-4">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-4 flex items-center gap-2">
                    <FlaskConical className="w-3 h-3" /> Reportes Administrativos y Técnicos
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => generatePDF(activeData!)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl border border-slate-700 flex flex-col gap-2 transition-all">
                        <FileCheck className="w-5 h-5 text-emerald-400" />
                        <span className="text-[9px] font-black text-white uppercase text-left">Bodega Valorizada</span>
                    </button>
                    <button onClick={() => generateLaborReport(activeData!)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl border border-slate-700 flex flex-col gap-2 transition-all">
                        <Briefcase className="w-5 h-5 text-amber-400" />
                        <span className="text-[9px] font-black text-white uppercase text-left">Libro de Nómina</span>
                    </button>
                    <button onClick={() => generateHarvestReport(activeData!)} className="p-4 bg-slate-800 hover:bg-slate-700 rounded-3xl border border-slate-700 flex flex-col gap-2 transition-all">
                        <Sprout className="w-5 h-5 text-indigo-400" />
                        <span className="text-[9px] font-black text-white uppercase text-left">Bitácora Ventas</span>
                    </button>
                    <button onClick={() => handleProAction(() => generateGlobalReport(activeData!))} className="p-4 bg-indigo-900/20 hover:bg-indigo-900/30 rounded-3xl border border-indigo-500/30 flex flex-col gap-2 transition-all">
                        <Crown className="w-5 h-5 text-amber-400" />
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
                        onClick={() => handleProAction(() => generateAgronomicDossier(activeData!))}
                        className="w-full p-4 bg-blue-900/20 hover:bg-blue-900/30 rounded-3xl border border-blue-500/30 flex items-center gap-4 group transition-all"
                    >
                        <div className="p-3 bg-blue-500/20 rounded-2xl"><Thermometer className="w-6 h-6 text-blue-400" /></div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-white uppercase">Dossier Agronómico</p>
                            <p className="text-[8px] text-blue-300 font-bold uppercase italic">Suelos, Lluvias y Plagas</p>
                        </div>
                        {!isSupporter && <Lock className="ml-auto w-4 h-4 text-slate-600" />}
                    </button>

                    <button 
                        onClick={() => handleProAction(() => generateSafetyReport(activeData!))}
                        className="w-full p-4 bg-red-900/20 hover:bg-red-900/30 rounded-3xl border border-red-500/30 flex items-center gap-4 group transition-all"
                    >
                        <div className="p-3 bg-red-500/20 rounded-2xl"><Shield className="w-6 h-6 text-red-400" /></div>
                        <div className="text-left">
                            <p className="text-[11px] font-black text-white uppercase">Auditoría SST & Ambiental</p>
                            <p className="text-[8px] text-red-300 font-bold uppercase italic">EPP y Triple Lavado</p>
                        </div>
                        {!isSupporter && <Lock className="ml-auto w-4 h-4 text-slate-600" />}
                    </button>

                    <button 
                        onClick={() => handleProAction(() => generateFieldTemplates(activeData!))}
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
