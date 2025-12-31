

import React, { useState } from 'react';
import { ShieldCheck, User, Server, Globe, Scale, LogIn, Sparkles, ShieldAlert, X, FileText, Lock, Database, HelpCircle, CheckCircle2, Gavel, Zap } from 'lucide-react';
import { User as UserType } from '../types';
import { LegalComplianceModal } from './LegalComplianceModal';

interface LandingProps {
  onEnter: (user: UserType) => void;
  onShowManual: () => void;
  onRestoreBackup?: () => void;
  onLoadDemoData: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter, onShowManual, onRestoreBackup, onLoadDemoData }) => {
  const [accepted, setAccepted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [isDemoLoading, setIsDemoLoading] = useState(false);
  const [showLegal, setShowLegal] = useState(false);

  const handleGoogleLogin = () => {
    if (!accepted || isLoggingIn || isDemoLoading) return;
    setIsLoggingIn(true);
    setTimeout(() => {
      const mockUser: UserType = {
        id: 'user_datosfinca_viva',
        name: 'Productor DatosFinca',
        email: 'gestor@datosfinca.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DatosFincaViva'
      };
      onEnter(mockUser);
    }, 800);
  };

  const handleDemoLogin = () => {
    if (!accepted || isLoggingIn || isDemoLoading) return;
    setIsDemoLoading(true);
    setTimeout(() => {
      onLoadDemoData();
    }, 800);
  };

  return (
    <div className="fixed inset-0 bg-slate-950 flex flex-col overflow-hidden select-none">
      <div className="absolute inset-0 opacity-10 pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>

      <div className="relative z-10 p-6 pt-12 flex items-center justify-between bg-gradient-to-b from-slate-900 to-transparent">
          <div className="flex items-center gap-3">
              <div className="bg-emerald-600 p-2.5 rounded-2xl shadow-lg shadow-emerald-900/40">
                  <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                  <h1 className="text-2xl font-black text-white tracking-tight leading-none">DatosFinca <span className="text-emerald-400">Viva</span></h1>
                  <p className="text-[9px] text-emerald-300 font-bold uppercase tracking-widest mt-1 italic">Intelligence by Lucas Mateo Tabares Franco</p>
              </div>
          </div>
          <div className="flex gap-2">
              <button onClick={() => setShowLegal(true)} className="p-2.5 bg-blue-500/10 border border-blue-500/20 text-blue-500 rounded-xl" title="Marco Legal Colombia">
                  <Gavel className="w-5 h-5" />
              </button>
              <button onClick={onRestoreBackup} className="p-2.5 bg-orange-500/10 border border-orange-500/20 text-orange-500 rounded-xl" title="Restaurar Backup">
                  <Database className="w-5 h-5" />
              </button>
              <button onClick={onShowManual} className="p-2.5 bg-slate-800 border border-slate-700 text-slate-400 rounded-xl">
                  <HelpCircle className="w-5 h-5" />
              </button>
          </div>
      </div>

      <div className="flex-1 overflow-y-auto px-6 pt-4 pb-40 custom-scrollbar relative z-10">
          <div className="space-y-6">
              <div className="bg-emerald-900/10 border border-emerald-500/20 p-5 rounded-[2rem] flex gap-4 items-start">
                  <ShieldCheck className="w-8 h-8 text-emerald-500 shrink-0" />
                  <div>
                      <p className="text-xs font-black text-emerald-400 uppercase tracking-tighter">Seguridad Local-First</p>
                      <p className="text-[11px] text-slate-400 leading-relaxed mt-1">Sus datos financieros, costos y nómina se almacenan exclusivamente en este dispositivo. Cumplimos con la Ley 1581 de 2012 de Habeas Data Colombiana.</p>
                  </div>
              </div>

              <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] px-2 flex items-center gap-2">
                      <FileText className="w-3 h-3" /> Transparencia Legal
                  </h3>
                  <div className="bg-slate-900/50 border border-slate-800 p-5 rounded-[2rem] space-y-4">
                      <p className="text-[11px] text-slate-300 leading-relaxed text-justify">
                        DatosFinca Viva opera bajo el marco jurídico colombiano. El usuario es responsable del uso de la información para fines fiscales y legales.
                      </p>
                      <ul className="space-y-3">
                          <li className="flex gap-3 text-[10px] text-slate-400 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Derechos de Autor (Ley 23 de 1982).
                          </li>
                          <li className="flex gap-3 text-[10px] text-slate-400 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Protección de Datos Personales (SIC).
                          </li>
                          <li className="flex gap-3 text-[10px] text-slate-400 font-medium">
                              <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" /> Comercio Electrónico (Ley 1480 de 2011).
                          </li>
                      </ul>
                  </div>
              </div>
          </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 pb-10 bg-slate-950/90 backdrop-blur-xl border-t border-slate-800 z-50">
          <label className="flex items-center gap-4 cursor-pointer mb-5 group">
              <div className="relative">
                  <input 
                      type="checkbox" 
                      className="peer h-7 w-7 rounded-xl border-2 border-slate-700 checked:bg-emerald-600 checked:border-emerald-600 transition-all cursor-pointer appearance-none" 
                      checked={accepted} 
                      onChange={(e) => setAccepted(e.target.checked)} 
                  />
                  <CheckCircle2 className="absolute inset-0 w-7 h-7 text-white scale-0 peer-checked:scale-75 transition-transform pointer-events-none" />
              </div>
              <span className={`text-[11px] font-black uppercase tracking-tight transition-colors ${accepted ? 'text-emerald-400' : 'text-slate-500'}`}>
                  He leído y acepto los términos y políticas legales
              </span>
          </label>

          <button 
              onClick={handleGoogleLogin} 
              disabled={!accepted || isLoggingIn || isDemoLoading} 
              className={`w-full py-5 rounded-[2.5rem] font-black text-sm flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 ${ (accepted && !isLoggingIn && !isDemoLoading) ? 'bg-emerald-600 text-white shadow-emerald-900/40 hover:bg-emerald-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
          >
              {isLoggingIn ? (
                  <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                  <><LogIn className="w-6 h-6" /> ENTRAR A DATOSFINCA VIVA</>
              )}
          </button>
          <button 
            onClick={handleDemoLogin}
            disabled={!accepted || isLoggingIn || isDemoLoading}
            className={`w-full text-center mt-4 text-xs font-black uppercase tracking-widest transition-all ${ (accepted && !isLoggingIn && !isDemoLoading) ? 'text-emerald-400 hover:opacity-80' : 'text-slate-600 cursor-not-allowed'}`}
          >
            <span className="flex items-center justify-center gap-2">
                {isDemoLoading ? (
                  <div className="h-4 w-4 border-2 border-emerald-400 border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <><Zap className="w-4 h-4" /> Explorar con Datos de Demostración</>
                )}
            </span>
          </button>
          <p className="text-[10px] text-slate-600 text-center mt-2 px-4">
              Al explorar con datos de demostración, se reemplazarán los datos guardados en este dispositivo.
          </p>
      </div>

      {showLegal && <LegalComplianceModal onClose={() => setShowLegal(false)} />}
    </div>
  );
};