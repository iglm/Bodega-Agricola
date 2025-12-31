
import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { 
  X, 
  Database, 
  Download, 
  Upload, 
  ShieldCheck, 
  CheckCircle, 
  Info, 
  Trash2, 
  Server, 
  BarChart3, 
  Zap, 
  Terminal,
  FileJson,
  DatabaseZap,
  Gem,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { generateSQLDump } from '../services/reportService';
import { dbService } from '../services/db';

interface DataModalProps {
  fullState: AppState;
  onRestoreData: (data: AppState) => void;
  onClose: () => void;
  onShowNotification: (message: string, type: 'success' | 'error') => void;
}

export const DataModal: React.FC<DataModalProps> = ({ fullState, onRestoreData, onClose, onShowNotification }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  
  const handleDownloadBackup = () => {
    try {
        const activeWarehouse = fullState.warehouses.find(w => w.id === fullState.activeWarehouseId);
        const warehouseName = activeWarehouse ? activeWarehouse.name.replace(/[^a-z0-9]/gi, '_').toLowerCase() : 'finca';
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Backup_${warehouseName}_${dateStr}.json`;

        const jsonString = JSON.stringify(fullState, null, 2);
        const blob = new Blob([jsonString], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            onShowNotification("Backup JSON descargado correctamente.", 'success');
        }, 100);
    } catch (err) { onShowNotification("Error al generar el backup: " + err, 'error'); }
  };

  const handleClearData = async () => {
      const userInput = prompt("PELIGRO: Esta acción eliminará permanentemente TODOS los datos de la base de datos de alta capacidad. Para continuar, escriba 'ELIMINAR TODO'.");
      if (userInput === 'ELIMINAR TODO') {
          await dbService.clearDatabase();
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!confirm("⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEsta acción REEMPLAZARÁ todos los datos actuales. ¿Desea continuar?")) return;

    setIsRestoring(true);
    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const parsed = JSON.parse(event.target?.result as string);
            onRestoreData(parsed as AppState);
            onShowNotification("Datos restaurados correctamente.", 'success');
            onClose();
        } catch (err) { onShowNotification("Archivo de backup no válido o corrupto.", 'error'); }
        finally { setIsRestoring(false); }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-xl rounded-[3rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-950 p-8 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-4">
                <div className="bg-orange-500/20 p-3 rounded-2xl border border-orange-500/30">
                    <DatabaseZap className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Centro de Datos</h3>
                    <p className="text-[10px] text-orange-400 uppercase tracking-widest font-black">Robustez y Escalabilidad</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-8 space-y-8 overflow-y-auto custom-scrollbar">
            
            {/* ESTRATEGIA PROFESIONAL SQL */}
            <div className="space-y-4 bg-gradient-to-br from-indigo-950/40 to-slate-900 p-8 rounded-[3rem] border border-indigo-500/30 relative overflow-hidden group">
                <div className="absolute top-4 right-4 bg-indigo-500 text-white text-[8px] font-black px-3 py-1 rounded-full uppercase tracking-widest">Recomendado</div>
                <div className="relative z-10">
                    <div className="flex items-center gap-3 mb-4">
                        <Gem className="w-6 h-6 text-indigo-400 animate-pulse" />
                        <h4 className="text-white text-base uppercase font-black tracking-tight">Exportación de Datos (SQL)</h4>
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed mb-6 font-medium">
                        Para auditorías, migración a servidores o análisis masivo en Power BI/Tableau. Este archivo es universal pero no se puede restaurar aquí.
                    </p>
                    
                    <button 
                        onClick={() => generateSQLDump(fullState)}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white p-5 rounded-2xl flex items-center justify-between transition-all shadow-xl shadow-indigo-900/40 active:scale-95"
                    >
                        <div className="flex items-center gap-4">
                            <Terminal className="w-6 h-6 text-indigo-200" />
                            <div className="text-left">
                                <p className="text-sm font-black uppercase">Descargar .SQL</p>
                                <p className="text-[9px] text-indigo-200 uppercase font-bold">Para análisis externo</p>
                            </div>
                        </div>
                        <ArrowRight className="w-5 h-5 text-white" />
                    </button>
                </div>
            </div>

            {/* TRANSPORTE RÁPIDO JSON */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4 flex flex-col">
                    <h4 className="text-emerald-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <FileJson className="w-4 h-4" /> Backup Inversionista (JSON)
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-tight flex-1">Copia exacta de la base de datos local para enviar a socios y restaurar en otro celular.</p>
                    <button onClick={handleDownloadBackup} className="w-full bg-slate-800 hover:bg-emerald-600 text-white py-4 rounded-xl text-[10px] font-black uppercase transition-all">Descargar .JSON</button>
                </div>

                <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 space-y-4 flex flex-col">
                    <h4 className="text-blue-500 text-[10px] uppercase font-black tracking-widest flex items-center gap-2">
                        <Upload className="w-4 h-4" /> Restaurar Backup
                    </h4>
                    <p className="text-[10px] text-slate-500 leading-tight flex-1">Carga un archivo .json para visualizar la finca de un socio o recuperar datos.</p>
                    <label className={`block w-full text-white py-4 rounded-xl text-[10px] font-black uppercase transition-all text-center ${isRestoring ? 'bg-slate-700 cursor-not-allowed' : 'bg-slate-800 hover:bg-blue-600 cursor-pointer'}`}>
                        {isRestoring ? (
                           <span className="flex items-center justify-center gap-2">
                               <Loader2 className="w-4 h-4 animate-spin" /> Restaurando...
                           </span>
                        ) : 'Cargar .JSON'}
                        <input ref={fileInputRef} type="file" accept=".json" onChange={handleRestoreFileChange} className="hidden" disabled={isRestoring} />
                    </label>
                </div>
            </div>

            <div className="flex gap-4 items-start p-6 bg-slate-950 rounded-[2rem] border border-slate-800">
                <Info className="w-6 h-6 text-slate-600 shrink-0" />
                <p className="text-[10px] text-slate-500 leading-relaxed font-medium italic">
                    <span className="text-orange-500 font-black">SEGURIDAD LOCAL:</span> DatosFinca Viva no almacena datos en la nube. Usted es responsable de descargar sus respaldos. Use JSON para mover datos entre dispositivos y SQL para análisis profesional.
                </p>
            </div>

            <div className="pt-6">
                <button onClick={handleClearData} className="text-[10px] font-black text-red-500 uppercase hover:text-red-400 transition-colors flex items-center gap-2 mx-auto">
                    <Trash2 className="w-4 h-4" /> Borrar Datos Locales de este Dispositivo
                </button>
            </div>

        </div>
      </div>
    </div>
  );
};
