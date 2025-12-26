import React, { useRef } from 'react';
import { AppState } from '../types';
import { X, Database, Download, Upload, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DataModalProps {
  fullState: AppState;
  onRestoreData: (data: AppState) => void;
  onClose: () => void;
}

export const DataModal: React.FC<DataModalProps> = ({ fullState, onRestoreData, onClose }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
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

  const handleRestoreFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!confirm("ADVERTENCIA CRÍTICA: Esta acción BORRARÁ TODOS los datos actuales y los reemplazará con el archivo seleccionado. ¿Está 100% seguro?")) {
        if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result as string;
            const parsed = JSON.parse(result);
            
            // Basic structure validation
            if (parsed && Array.isArray(parsed.warehouses) && Array.isArray(parsed.inventory)) {
                onRestoreData(parsed as AppState);
                
                // Reset input to allow re-importing same file if needed
                if (fileInputRef.current) fileInputRef.current.value = '';
                
                // Requested Success Message
                alert("Importación completada exitosamente. Sus datos han sido actualizados.");
                onClose();
            } else {
                throw new Error("Estructura de archivo inválida. Faltan almacenes o inventario.");
            }
        } catch (err) {
            console.error(err);
            alert("Error: El archivo seleccionado no es válido o está corrupto.");
            if (fileInputRef.current) fileInputRef.current.value = ''; // Reset input on error
        }
    };
    reader.readAsText(file);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-orange-500/20 p-2 rounded-lg border border-orange-500/30 animate-pulse">
                    <Database className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-xl">Gestión de Datos</h3>
                    <p className="text-xs text-slate-400">Copias de Seguridad y Restauración</p>
                </div>
            </div>
            <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
            
            {/* Warning Card */}
            <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-700/50">
                <h4 className="text-orange-500 font-bold text-sm flex items-center gap-2 mb-2">
                    <AlertTriangle className="w-4 h-4" /> Importante
                </h4>
                <p className="text-xs text-slate-300 leading-relaxed">
                    Sus datos viven <strong>exclusivamente en este dispositivo</strong>. 
                    Si pierde el teléfono o borra los datos del navegador, perderá su inventario.
                    <br/><br/>
                    <span className="text-white font-bold">Recomendación:</span> Descargue una copia cada semana y guárdela en la nube (Google Drive, WhatsApp, Correo).
                </p>
            </div>

            {/* Download */}
            <div className="space-y-3">
                <h4 className="text-emerald-400 text-sm uppercase font-bold flex items-center gap-2">
                    <Download className="w-4 h-4" /> Exportar / Guardar
                </h4>
                <button 
                    onClick={handleDownloadBackup}
                    className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-colors shadow-lg shadow-emerald-900/20 group"
                >
                    <div className="bg-white/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <ShieldCheck className="w-5 h-5 text-white" />
                    </div>
                    Descargar Copia de Seguridad
                </button>
            </div>

            <div className="border-t border-slate-700/50"></div>

            {/* Restore */}
            <div className="space-y-3">
                <h4 className="text-blue-400 text-sm uppercase font-bold flex items-center gap-2">
                    <Upload className="w-4 h-4" /> Importar / Restaurar
                </h4>
                <label className="w-full bg-slate-700 hover:bg-slate-600 border border-slate-500 text-slate-300 hover:text-white py-4 rounded-xl text-sm font-bold flex items-center justify-center gap-3 transition-colors cursor-pointer group">
                    <div className="bg-black/20 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                        <Database className="w-5 h-5" />
                    </div>
                    Seleccionar Archivo (.json)
                    <input 
                        ref={fileInputRef}
                        type="file" 
                        accept=".json"
                        onChange={handleRestoreFileChange}
                        className="hidden" 
                    />
                </label>
                <p className="text-[10px] text-slate-500 text-center">
                    Solo use archivos generados previamente por esta aplicación.
                </p>
            </div>

        </div>
      </div>
    </div>
  );
};