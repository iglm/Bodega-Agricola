import React from 'react';
import { X, FileSpreadsheet, FileText, Download, CheckCircle, ShoppingCart } from 'lucide-react';

interface ExportModalProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onGenerateOrder: () => void; // New prop
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({ onExportPDF, onExportExcel, onGenerateOrder, onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-gradient-to-r from-emerald-900 to-emerald-800 p-6 relative">
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
            <h3 className="text-xl font-bold text-white">Centro de Reportes</h3>
          </div>
          <p className="text-emerald-100/80 text-xs ml-1">Seleccione el formato deseado</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
            
            <div className="grid grid-cols-2 gap-4">
                {/* PDF Option */}
                <button 
                    onClick={onExportPDF}
                    className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-red-500/50 transition-all group"
                >
                    <div className="w-10 h-10 bg-red-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <FileText className="w-5 h-5 text-red-500" />
                    </div>
                    <span className="text-white font-bold text-xs">Inventario PDF</span>
                </button>

                {/* Excel Option */}
                <button 
                    onClick={onExportExcel}
                    className="flex flex-col items-center justify-center p-4 bg-slate-900/50 border border-slate-700 rounded-xl hover:bg-slate-700 hover:border-emerald-500/50 transition-all group"
                >
                    <div className="w-10 h-10 bg-emerald-900/20 rounded-full flex items-center justify-center mb-2 group-hover:scale-110 transition-transform">
                        <FileSpreadsheet className="w-5 h-5 text-emerald-500" />
                    </div>
                    <span className="text-white font-bold text-xs">Excel Completo</span>
                </button>
            </div>

            {/* NEW: Order Generation */}
            <button 
                onClick={onGenerateOrder}
                className="w-full flex items-center justify-between p-4 bg-blue-900/20 border border-blue-500/30 rounded-xl hover:bg-blue-900/40 hover:border-blue-500/60 transition-all group"
            >
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform">
                         <ShoppingCart className="w-5 h-5 text-blue-400" />
                    </div>
                    <div className="text-left">
                        <h4 className="text-white font-bold text-sm">Generar Pedido Sugerido</h4>
                        <p className="text-[10px] text-slate-400">Crea un PDF con items en stock bajo</p>
                    </div>
                </div>
                <CheckCircle className="w-5 h-5 text-blue-500 opacity-50 group-hover:opacity-100" />
            </button>
            
             <div className="mt-4 bg-slate-900/50 p-3 rounded-lg border border-slate-700/50">
                 <p className="text-[10px] text-slate-500 text-center">
                     Los reportes incluyen valoración por Costo Promedio Ponderado.
                 </p>
             </div>
        </div>
      </div>
    </div>
  );
};