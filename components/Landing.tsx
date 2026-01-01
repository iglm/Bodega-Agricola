
import React, { useState } from 'react';
import { ShieldCheck, Globe, LogIn, FileText, CheckCircle2, Gavel, Zap, Lock, Award, ShieldAlert, Package, Calculator, BarChart3 } from 'lucide-react';
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

  const AUTHOR = "Lucas Mateo Tabares Franco";

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
      
      {/* BACKGROUND ORBS */}
      <div className="absolute -top-24 -left-24 w-96 h-96 bg-emerald-600/20 rounded-full blur-[120px]"></div>
      <div className="absolute -bottom-24 -right-24 w-96 h-96 bg-blue-600/20 rounded-full blur-[120px]"></div>

      <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-8 text-center">
          <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-[3rem] shadow-2xl shadow-emerald-900/40 mb-8 animate-slide-up">
              <Package className="w-16 h-16 text-white" />
          </div>
          
          <h1 className="text-5xl font-black text-white tracking-tighter leading-none animate-slide-up" style={{ animationDelay: '0.1s' }}>
              AgroBodega <span className="text-emerald-500">Pro</span>
          </h1>
          <p className="text-[10px] text-emerald-400 font-black uppercase tracking-[0.4em] mt-4 mb-2 animate-slide-up" style={{ animationDelay: '0.2s' }}>
              Software de Inteligencia de Insumos
          </p>
          <div className="bg-slate-900/50 border border-slate-800 px-4 py-1.5 rounded-full inline-flex items-center gap-2 mb-12 animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <Award className="w-3 h-3 text-emerald-500" />
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest italic">Desarrollado por {AUTHOR}</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-2xl mb-12 animate-slide-up" style={{ animationDelay: '0.4s' }}>
              <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 flex flex-col items-center gap-2">
                  <Calculator className="w-6 h-6 text-indigo-400" />
                  <p className="text-[10px] font-black text-white uppercase">Cálculo Atómico</p>
                  <p className="text-[9px] text-slate-500 leading-tight">Costeo exacto por gramo y mililitro.</p>
              </div>
              <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 flex flex-col items-center gap-2">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                  <p className="text-[10px] font-black text-white uppercase">Informes Excel</p>
                  <p className="text-[9px] text-slate-500 leading-tight">Exportación total para contabilidad.</p>
              </div>
              <div className="bg-slate-900/40 p-5 rounded-[2rem] border border-slate-800 flex flex-col items-center gap-2">
                  <Lock className="w-6 h-6 text-blue-400" />
                  <p className="text-[10px] font-black text-white uppercase">100% Offline</p>
                  <p className="text-[9px] text-slate-500 leading-tight">Privacidad total bajo Ley 1581.</p>
              </div>
          </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-8 pb-12 bg-slate-950/80 backdrop-blur-2xl border-t border-slate-800 z-50">
          <div className="max-w-md mx-auto space-y-6">
              <label className="flex items-start gap-4 cursor-pointer group">
                  <div className="relative mt-1">
                      <input 
                          type="checkbox" 
                          className="peer h-6 w-6 rounded-xl border-2 border-slate-700 checked:bg-emerald-600 checked:border-emerald-600 transition-all cursor-pointer appearance-none" 
                          checked={accepted} 
                          onChange={(e) => setAccepted(e.target.checked)} 
                      />
                      <CheckCircle2 className="absolute inset-0 w-6 h-6 text-white scale-0 peer-checked:scale-75 transition-transform pointer-events-none" />
                  </div>
                  <div className="flex-1">
                      <p className={`text-[10px] font-black uppercase tracking-tight transition-colors ${accepted ? 'text-emerald-400' : 'text-slate-500'}`}>
                          Acepto términos, política de privacidad y derechos de autor de {AUTHOR}
                      </p>
                      <p className="text-[8px] text-slate-600 uppercase font-bold mt-1">
                          Cumplimiento Ley 1581 de 2012 (Habeas Data) & Ley 23 de 1982
                      </p>
                  </div>
              </label>

              <div className="flex flex-col gap-3">
                  <button 
                      onClick={handleGoogleLogin} 
                      disabled={!accepted || isLoggingIn || isDemoLoading} 
                      className={`w-full py-5 rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 transition-all shadow-2xl active:scale-95 ${ (accepted && !isLoggingIn && !isDemoLoading) ? 'bg-emerald-600 text-white shadow-emerald-900/40 hover:bg-emerald-500' : 'bg-slate-800 text-slate-600 cursor-not-allowed'}`}
                  >
                      {isLoggingIn ? (
                          <div className="h-6 w-6 border-4 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : (
                          <><LogIn className="w-6 h-6" /> ENTRAR A LA BODEGA</>
                      )}
                  </button>
                  
                  <button 
                    onClick={handleDemoLogin}
                    disabled={!accepted || isLoggingIn || isDemoLoading}
                    className={`w-full text-center py-2 text-[10px] font-black uppercase tracking-[0.2em] transition-all ${ (accepted && !isLoggingIn && !isDemoLoading) ? 'text-emerald-400 hover:opacity-80' : 'text-slate-600 cursor-not-allowed'}`}
                  >
                    <span className="flex items-center justify-center gap-2">
                        {isDemoLoading ? <Zap className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3" />}
                        Explorar con Datos de Prueba
                    </span>
                  </button>
              </div>

              <div className="flex justify-center gap-6 pt-4 border-t border-slate-900">
                  <button onClick={() => setShowLegal(true)} className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                      <Gavel className="w-3 h-3" /> Marco Jurídico
                  </button>
                  <button onClick={onShowManual} className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1.5 hover:text-white transition-colors">
                      <FileText className="w-3 h-3" /> Guía de Usuario
                  </button>
              </div>
          </div>
      </div>

      {showLegal && <LegalComplianceModal onClose={() => setShowLegal(false)} />}
    </div>
  );
};
