import React from 'react';
import { X, Medal, Shield, Star, Coffee } from 'lucide-react';

interface SupportModalProps {
  onClose: () => void;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-lg rounded-2xl overflow-hidden shadow-2xl transform transition-all animate-slide-up">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 flex justify-between items-center border-b border-slate-700">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-yellow-500/20 flex items-center justify-center">
              <Medal className="w-5 h-5 text-yellow-500" />
            </div>
            <h3 className="text-white font-bold">Sostenibilidad del Software</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 bg-slate-50 dark:bg-slate-800">
          <p className="text-sm text-slate-600 dark:text-slate-300 mb-6 leading-relaxed">
            <span className="font-bold text-slate-900 dark:text-white">AgroBodega Pro</span> es una herramienta desarrollada para potenciar la eficiencia del campo. 
            Si esta aplicación aporta valor a su gestión técnica, considere realizar un aporte voluntario para garantizar futuras actualizaciones.
          </p>

          <div className="space-y-4">
            {/* Tier 1 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 hover:border-emerald-500 transition-colors cursor-pointer group shadow-sm">
              <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Coffee className="w-6 h-6 text-blue-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Apoyo Básico</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Contribuir a un café para el desarrollador.</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">
                $1.00 USD
              </div>
            </div>

            {/* Tier 2 - Recommended */}
            <div className="relative bg-emerald-50 dark:bg-slate-900 p-4 rounded-xl border-2 border-emerald-500 flex items-center gap-4 cursor-pointer shadow-md">
              <div className="absolute -top-2.5 right-4 bg-emerald-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
                RECOMENDADO
              </div>
              <div className="w-10 h-10 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                <Shield className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-900 dark:text-white text-sm">Apoyo Destacado</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400">Ayuda a desarrollar funciones de mapas y estadísticas.</p>
              </div>
              <div className="bg-emerald-100 dark:bg-emerald-900/50 px-3 py-1 rounded-lg text-xs font-bold text-emerald-800 dark:text-emerald-300">
                $3.00 USD
              </div>
            </div>

            {/* Tier 3 */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-4 hover:border-yellow-500 transition-colors cursor-pointer group shadow-sm">
              <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <Star className="w-6 h-6 text-yellow-600 dark:text-yellow-500" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-slate-800 dark:text-white text-sm">Patrocinador Gold</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400">Su aporte garantiza que la app siga sin publicidad.</p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1 rounded-lg text-xs font-bold text-slate-700 dark:text-slate-200">
                $5.00 USD
              </div>
            </div>
          </div>

          <div className="mt-6 flex justify-center items-center gap-2 text-[10px] text-slate-400">
            <Shield className="w-3 h-3" />
            Transacción segura vía Google Play Store
          </div>
        </div>
      </div>
    </div>
  );
};