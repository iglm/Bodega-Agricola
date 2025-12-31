

import React, { useState } from 'react';
import { X, Medal, Shield, Star, Check, Crown, Zap, Rocket, Calendar, CreditCard } from 'lucide-react';

interface SupportModalProps {
  onClose: () => void;
  onUpgrade: () => void;
  isSupporter?: boolean;
}

export const SupportModal: React.FC<SupportModalProps> = ({ onClose, onUpgrade, isSupporter }) => {
  const [loading, setLoading] = useState(false);

  const handleUpgrade = () => {
    setLoading(true);
    // Simulación de pasarela de suscripciones Play Store
    setTimeout(() => {
      onUpgrade();
      setLoading(false);
      alert("¡BIENVENIDO A PRO! 🚀 Tu suscripción mensual de DatosFinca Viva ha sido activada.");
      onClose();
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-[2.5rem] overflow-hidden shadow-2xl border border-slate-700 animate-slide-up flex flex-col md:flex-row h-auto max-h-[90vh]">
        
        {/* Lado Izquierdo: Beneficios Premium */}
        <div className="md:w-5/12 bg-gradient-to-br from-indigo-700 via-indigo-900 to-slate-950 p-8 text-white relative overflow-hidden">
            <div className="absolute -right-10 -bottom-10 opacity-10">
                <Crown className="w-48 h-48" />
            </div>
            
            <div className="relative z-10">
                <div className="w-12 h-12 bg-indigo-500/30 rounded-2xl flex items-center justify-center mb-6 border border-indigo-400/30">
                    <Star className="w-7 h-7 text-yellow-400 animate-pulse" />
                </div>
                <h3 className="text-2xl font-black leading-tight mb-4">Plan<br/>Profesional</h3>
                
                <ul className="space-y-4">
                    {[
                        "Reportes PDF/Excel Gerenciales",
                        "Gestión de Múltiples Fincas",
                        "Exportación de Nómina Masiva",
                        "Soporte Técnico Prioritario",
                        "Sin Anuncios Publicitarios"
                    ].map((item, i) => (
                        <li key={i} className="flex items-start gap-3 text-[11px] font-bold text-indigo-100">
                            <div className="mt-0.5 p-0.5 bg-yellow-500 rounded-full"><Check className="w-2.5 h-2.5 text-indigo-900" /></div>
                            {item}
                        </li>
                    ))}
                </ul>

                <div className="mt-10 pt-6 border-t border-white/10">
                    <p className="text-[9px] uppercase font-black tracking-widest text-indigo-300 flex items-center gap-1.5 mb-1">
                        <Calendar className="w-3 h-3" /> Suscripción Mensual
                    </p>
                    <p className="text-3xl font-black">$ 4.99 <span className="text-xs font-normal text-indigo-300">/ mes</span></p>
                </div>
            </div>
        </div>

        {/* Lado Derecho: Acción de Compra */}
        <div className="md:w-7/12 p-8 flex flex-col justify-between bg-slate-900">
          <div className="flex justify-between items-start mb-6">
              <div className="space-y-1">
                  <h4 className="text-slate-100 font-bold text-xl">Lleva tu campo al 360</h4>
                  <p className="text-xs text-slate-400">Desbloquea el poder total de los datos agrícolas.</p>
              </div>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-800 text-slate-500">
                <X className="w-6 h-6" />
              </button>
          </div>

          <div className="space-y-3 mb-8">
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                      <Shield className="w-6 h-6" />
                  </div>
                  <div className="text-[10px]">
                      <p className="text-slate-200 font-bold">Transacción Segura</p>
                      <p className="text-slate-500">Procesado por el sistema de pagos de Google Play.</p>
                  </div>
              </div>
              <div className="bg-slate-800/40 p-4 rounded-2xl border border-slate-700/50 flex gap-4 items-center">
                  <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                      <CreditCard className="w-6 h-6" />
                  </div>
                  <div className="text-[10px]">
                      <p className="text-slate-200 font-bold">Gestión de Suscripción</p>
                      <p className="text-slate-500">Cancela en cualquier momento desde tu cuenta Google.</p>
                  </div>
              </div>
          </div>

          <div className="space-y-4">
              <button 
                onClick={handleUpgrade}
                disabled={isSupporter || loading}
                className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${isSupporter ? 'bg-indigo-900/50 text-indigo-300 border border-indigo-500/30' : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-900/40'}`}
              >
                {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : isSupporter ? <><Medal className="w-5 h-5"/> SUSCRIPCIÓN ACTIVA</> : <><Rocket className="w-5 h-5"/> SUSCRIBIRME POR $4.99 / MES</>}
              </button>
              
              {!isSupporter && (
                  <p className="text-[9px] text-center text-slate-500 font-medium px-6 leading-tight italic">
                      Al presionar "Suscribirme", aceptas los términos de servicio y la política de privacidad de DatosFinca Viva. El cobro es recurrente cada 30 días.
                  </p>
              )}
          </div>
        </div>
      </div>
    </div>
  );
};