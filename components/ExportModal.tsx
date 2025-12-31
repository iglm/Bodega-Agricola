

import React from 'react';
import { X, FileSpreadsheet, FileText, Download, ShoppingCart, Pickaxe, Sprout, Tractor, PieChart, Clipboard, GraduationCap, Crown, Lock, ShieldCheck } from 'lucide-react';
import { AppState } from '../types';
import { generateGlobalReport, generateFieldTemplates, generateExecutiveReport } from '../services/reportService';

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
    onExportPDF, 
    onExportExcel, 
    onGenerateOrder, 
    onExportLaborPDF,
    onExportLaborExcel,
    onExportHarvestPDF,
    onExportMachineryPDF,
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
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[95vh]">
        
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 relative flex-shrink-0">
          <button onClick={onClose} className="absolute top-4 right-4 text-emerald-200/70 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
          
          <div className="flex items-center gap-3 mb-2">
            <div className="bg-white/10 p-2 rounded-lg backdrop-blur-sm border border-white/20">
              <Download className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Centro de Reportes</h3>
              <p className="text-emerald-100/80 text-xs mt-0.5">Gestión Documental de Finca</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar bg-slate-900/30">
            
            <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <FileText className="w-3 h-3" /> Reportes Básicos (Gratis)
                </h4>
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={onExportPDF} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group">
                        <FileText className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-white">Stock Bodega</span>
                    </button>
                    <button onClick={onGenerateOrder} className="p-3 bg-slate-700 hover:bg-slate-600 rounded-xl flex flex-col items-center justify-center gap-1 transition-colors group">
                        <ShoppingCart className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold text-white">Pedido Sugerido</span>
                    </button>
                </div>
            </div>

            <div className="space-y-3 bg-emerald-900/10 p-4 rounded-2xl border border-emerald-500/20 relative">
                {!isSupporter && (
                    <div className="absolute -top-2 -right-2">
                         <div className="bg-amber-500 text-amber-950 p-1 rounded-full shadow-lg border-2 border-slate-900 animate-bounce">
                             <Crown className="w-4 h-4" />
                         </div>
                    </div>
                )}
                
                <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <Crown className="w-3 h-3" /> Reportes Gerenciales (Pro)
                </h4>
                
                <div className="grid grid-cols-2 gap-3">
                    <button onClick={() => handleProAction(onExportExcel)} className="p-3 bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 border border-slate-700 relative overflow-hidden group">
                        {!isSupporter && <Lock className="absolute top-2 right-2 w-3 h-3 text-slate-600" />}
                        <FileSpreadsheet className={`w-5 h-5 ${isSupporter ? 'text-emerald-400' : 'text-slate-500'}`} />
                        <span className={`text-[10px] font-bold ${isSupporter ? 'text-white' : 'text-slate-500'}`}>Exportar Excel</span>
                    </button>
                    
                    <button onClick={() => handleProAction(() => generateGlobalReport(activeData!))} className="p-3 bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 border border-slate-700 relative overflow-hidden">
                        {!isSupporter && <Lock className="absolute top-2 right-2 w-3 h-3 text-slate-600" />}
                        <PieChart className={`w-5 h-5 ${isSupporter ? 'text-purple-400' : 'text-slate-500'}`} />
                        <span className={`text-[10px] font-bold ${isSupporter ? 'text-white' : 'text-slate-500'}`}>Informe Global</span>
                    </button>

                    <button onClick={() => handleProAction(() => generateExecutiveReport(activeData!))} className="p-3 bg-slate-800 rounded-xl flex flex-col items-center justify-center gap-1 border border-slate-700 relative overflow-hidden col-span-2">
                        {!isSupporter && <Lock className="absolute top-2 right-2 w-3 h-3 text-slate-600" />}
                        <ShieldCheck className={`w-5 h-5 ${isSupporter ? 'text-blue-400' : 'text-slate-500'}`} />
                        <span className={`text-[10px] font-bold ${isSupporter ? 'text-white' : 'text-slate-500'}`}>Informe de Auditoría Técnica (Dossier)</span>
                    </button>
                </div>

                {!isSupporter && (
                    <button 
                        onClick={onShowSupport}
                        className="w-full mt-2 bg-emerald-600 hover:bg-emerald-500 text-white text-[10px] font-black uppercase py-2 rounded-lg transition-all"
                    >
                        Desbloquear Funciones Pro
                    </button>
                )}
            </div>

            <div className="space-y-3">
                <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                    <Clipboard className="w-3 h-3" /> Auxiliares de Campo
                </h4>
                <button 
                    onClick={() => handleProAction(() => generateFieldTemplates(activeData!, false))}
                    className="w-full p-4 bg-slate-800 rounded-xl border border-slate-700 flex items-center gap-4 group"
                >
                    <div className="p-2 bg-amber-500/10 rounded-lg group-hover:bg-amber-500/20 transition-colors">
                        <FileText className="w-6 h-6 text-amber-500" />
                    </div>
                    <div className="text-left">
                        <p className="text-xs font-bold text-white">Imprimir Planillas Físicas</p>
                        <p className="text-[9px] text-slate-500">Para llevar registro a mano en el lote.</p>
                    </div>
                    {!isSupporter && <Lock className="ml-auto w-4 h-4 text-slate-600" />}
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};