
import React, { useRef, useState } from 'react';
import { AppState } from '../types';
import { X, Database, Download, Upload, AlertTriangle, ShieldCheck, Loader2, CheckCircle, FileJson, Info, Trash2 } from 'lucide-react';

interface DataModalProps {
  fullState: AppState;
  onRestoreData: (data: AppState) => void;
  onClose: () => void;
}

export const DataModal: React.FC<DataModalProps> = ({ fullState, onRestoreData, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreError, setRestoreError] = useState<string | null>(null);
  
  const handleDownloadBackup = () => {
    const jsonString = JSON.stringify(fullState, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `CopiaSeguridad_AgroBodega_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleClearData = () => {
      const confirmText = "PELIGRO: Esta acción eliminará permanentemente TODOS los datos de la aplicación (Fincas, Inventarios, Nómina, etc).\n\nPara continuar, escriba 'ELIMINAR TODO' abajo.";
      const userInput = prompt(confirmText);
      
      if (userInput === 'ELIMINAR TODO') {
          localStorage.clear();
          window.location.reload();
      } else if (userInput !== null) {
          alert("Confirmación incorrecta. No se borraron los datos.");
      }
  };

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setRestoreError(null);

    if (!confirm("⚠️ ADVERTENCIA CRÍTICA ⚠️\n\nEsta acción BORRARÁ TODOS los datos actuales y los reemplazará con el archivo seleccionado.\n\n¿Está 100% seguro de continuar?")) {
        if (fileInputRef.current) fileInputRef.current.value = ''; 
        return;
    }

    setIsRestoring(true);

    setTimeout(() => {
        const reader = new FileReader();
        
        reader.onload = (event) => {
            try {
                const result = event.target?.result as string;
                const parsed = JSON.parse(result);
                
                const hasWarehouses = parsed && Array.isArray(parsed.warehouses);
                const hasInventory = parsed && Array.isArray(parsed.inventory);
                
                if (hasWarehouses && hasInventory) {
                    onRestoreData(parsed as AppState);
                    alert("✅ ¡Base de datos restaurada correctamente!");
                    onClose();
                } else {
                    throw new Error("El archivo no tiene el formato correcto.");
                }
            } catch (err: any) {
                console.error(err);
                setRestoreError(`Error: ${err.message || "Archivo corrupto o inválido"}`);
            } finally {
                setIsRestoring(false);
                if (fileInputRef.current) fileInputRef.current.value = '';
            }
        };

        reader.onerror = () => {
            setRestoreError("Error de lectura del archivo.");
            setIsRestoring(false);
        };

        reader.readAsText(file);
    }, 100);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-lg border border-orange-500/30">
                    <Database className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-xl">Gestión de Datos</h3>
                    <p className="text-xs text-slate-400">Copias de Seguridad y Privacidad</p>
                </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
            
            <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-700/50">
                <h4 className="text-orange-500 font-bold text-sm flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Importante
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                    Sus datos viven <strong>exclusivamente en este dispositivo</strong>. 
                </p>
            </div>

            <div className="space-y-3">
                <h4 className="text-emerald-400 text-sm uppercase font-bold flex items-center gap-2">
                    <Download className="w-4 h-4" /> Exportar / Guardar
                </h4>
                <button 
                    onClick={handleDownloadBackup}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-900/20 group"
                >
                    <ShieldCheck className="w-5 h-5 text-white" />
                    Descargar Backup (.JSON)
                </button>
            </div>

            <div className="space-y-3">
                <h4 className="text-blue-400 text-sm uppercase font-bold flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Importar / Restaurar
                </h4>
                
                {isRestoring ? (
                    <div className="w-full bg-slate-700 border border-slate-500 text-slate-300 py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 animate-pulse cursor-wait">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        Procesando...
                    </div>
                ) : (
                    <label className={`w-full bg-slate-700 hover:bg-slate-600 border border-slate-500 text-slate-300 hover:text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-colors cursor-pointer group ${restoreError ? 'border-red-500' : ''}`}>
                        <FileJson className="w-5 h-5" />
                        Seleccionar Archivo
                        <input 
                            ref={fileInputRef}
                            type="file" 
                            accept=".json"
                            onClick={(e) => { e.currentTarget.value = ''; }}
                            onChange={handleRestoreFileChange}
                            className="hidden" 
                        />
                    </label>
                )}
            </div>

            <div className="pt-4 border-t border-slate-700/50">
                <h4 className="text-red-500 text-sm uppercase font-bold flex items-center gap-2 mb-3">
                    <Trash2 className="w-4 h-4" /> Privacidad y Eliminación
                </h4>
                <button 
                    onClick={handleClearData}
                    className="w-full bg-red-900/20 hover:bg-red-900/40 text-red-400 border border-red-500/30 py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-3 transition-colors"
                >
                    Borrar todos los datos de la App
                </button>
                <p className="text-[10px] text-slate-500 mt-2 text-center">
                    Cumplimiento de políticas de protección de datos personales.
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};
