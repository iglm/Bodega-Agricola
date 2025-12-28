
import React, { useState } from 'react';
import { ShieldCheck, User, Lock, Server, Globe, Scale, AlertTriangle, LogIn, Sparkles, ExternalLink, ShieldAlert, X, FileText } from 'lucide-react';
import { User as UserType } from '../types';

interface LandingProps {
  onEnter: (user: UserType) => void;
  onShowManual: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  const [accepted, setAccepted] = useState(false);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleGoogleLogin = () => {
    if (!accepted) return;
    setIsLoggingIn(true);
    
    setTimeout(() => {
      const mockUser: UserType = {
        id: 'google_123',
        name: 'Productor AgroSuite',
        email: 'usuario@gmail.com',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AgroSuite'
      };
      onEnter(mockUser);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] overflow-y-auto">
      <div className="max-w-5xl w-full bg-slate-900 rounded-[2.5rem] shadow-2xl border border-slate-700 flex flex-col md:flex-row md:overflow-hidden md:max-h-[90vh] h-auto my-auto transition-all duration-300">
        
        {/* Panel Izquierdo */}
        <div className="md:w-2/5 bg-gradient-to-br from-indigo-900 via-slate-900 to-slate-900 p-8 flex flex-col justify-between relative overflow-hidden shrink-0 border-r border-slate-800">
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(99,102,241,0.4),transparent)]"></div>
            
            <div className="relative z-10">
                <div className="w-20 h-20 bg-indigo-600 rounded-3xl flex items-center justify-center shadow-lg shadow-indigo-900/50 mb-6">
                    <Globe className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight mb-2">AgroSuite <span className="text-indigo-400">360</span></h1>
                <p className="text-indigo-200/80 font-medium text-sm mb-6 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" /> Inteligencia Agrícola Certificada
                </p>
                
                <div className="space-y-4">
                    <div className="flex items-center gap-3 bg-white/5 p-4 rounded-2xl border border-white/10 backdrop-blur-sm">
                        <div className="p-2 bg-blue-500/20 rounded-xl"><Server className="w-5 h-5 text-blue-400" /></div>
                        <div>
                            <p className="text-white font-bold text-xs">Offline-First</p>
                            <p className="text-slate-400 text-[10px]">Tus datos financieros son privados y locales.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3 font-black">Desarrollador Oficial</p>
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-800 border border-indigo-500 flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="text-white font-bold text-xs">Lucas Mateo Tabares Franco</span>
                </div>
            </div>
        </div>

        {/* Panel Derecho */}
        <div className="md:w-3/5 bg-slate-50 dark:bg-slate-950 flex flex-col h-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0 flex justify-between items-center">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-indigo-500" />
                    Licencia y Privacidad
                </h2>
                <button 
                  onClick={() => setShowPrivacy(true)}
                  className="text-indigo-600 dark:text-indigo-400 text-[10px] font-black uppercase flex items-center gap-1 hover:underline"
                >
                  <ShieldCheck className="w-3 h-3" /> Ver Políticas
                </button>
            </div>

            <div className="flex-1 p-6 text-xs text-justify leading-relaxed text-slate-600 dark:text-slate-400 font-sans space-y-4 md:overflow-y-auto bg-white dark:bg-slate-950 select-none">
                <div className="p-4 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800 rounded-2xl mb-4 flex gap-3">
                    <ShieldAlert className="w-6 h-6 text-indigo-600 shrink-0" />
                    <div>
                        <p className="font-bold text-indigo-700 dark:text-indigo-400 uppercase text-[10px]">Protección de Datos</p>
                        <p className="mt-1 text-slate-700 dark:text-slate-300">
                            AgroSuite 360 no recolecta ni vende tus datos financieros a terceros. Toda la información se almacena de forma cifrada en tu dispositivo.
                        </p>
                    </div>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[10px]">1. Suscripciones</h3>
                <p>El Plan Pro es una suscripción mensual recurrente. El pago se cargará a tu cuenta de Google Play. Puedes cancelar en cualquier momento desde la configuración de tu cuenta de Google.</p>

                <h3 className="font-bold text-slate-900 dark:text-white uppercase text-[10px]">2. Responsabilidad de Backup</h3>
                <p>Al ser una base de datos local, la aplicación ofrece herramientas de exportación. El usuario es responsable de realizar copias de seguridad periódicas.</p>
            </div>

            <div className="p-6 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <label className="flex items-start gap-3 cursor-pointer mb-6 select-none">
                    <input 
                        type="checkbox" 
                        className="mt-1 h-5 w-5 rounded border-2 border-slate-400 bg-white dark:bg-slate-800 checked:bg-indigo-500 transition-all cursor-pointer"
                        checked={accepted}
                        onChange={(e) => setAccepted(e.target.checked)}
                    />
                    <span className="text-[11px] text-slate-600 dark:text-slate-400 font-medium">
                        He leído y acepto la <button onClick={() => setShowPrivacy(true)} className="text-indigo-600 font-bold hover:underline">Política de Privacidad</button> y los términos de suscripción mensual de AgroSuite 360.
                    </span>
                </label>

                <button 
                    onClick={handleGoogleLogin}
                    disabled={!accepted || isLoggingIn}
                    className={`w-full py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 transition-all shadow-xl ${
                        accepted && !isLoggingIn
                        ? 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/20 active:scale-95' 
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 cursor-not-allowed opacity-50'
                    }`}
                >
                    {isLoggingIn ? (
                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    ) : (
                        <>
                            <LogIn className="w-5 h-5" />
                            INGRESAR CON GOOGLE PLAY
                        </>
                    )}
                </button>
            </div>
        </div>
      </div>

      {/* Modal de Políticas para cumplimiento Google */}
      {showPrivacy && (
          <div className="fixed inset-0 z-[110] bg-slate-950/90 flex items-center justify-center p-4">
              <div className="bg-slate-900 border border-slate-700 w-full max-w-2xl h-[80vh] rounded-3xl overflow-hidden flex flex-col shadow-2xl">
                  <div className="p-6 border-b border-slate-800 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <FileText className="w-5 h-5 text-indigo-400" />
                        <h4 className="text-white font-bold">Documentación Legal</h4>
                      </div>
                      <button onClick={() => setShowPrivacy(false)} className="text-slate-400 hover:text-white p-2 bg-slate-800 rounded-full"><X className="w-5 h-5" /></button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-8 text-sm text-slate-300 space-y-6 text-justify custom-scrollbar">
                      <h5 className="text-indigo-400 font-bold uppercase text-xs">Política de Privacidad</h5>
                      <p>AgroSuite 360 ("nosotros") respeta su privacidad. Nuestra aplicación funciona principalmente de forma local (Offline-First). No recopilamos datos financieros, inventarios o nóminas en servidores externos.</p>
                      <p><strong>Recopilación de Datos:</strong> Solo procesamos datos a través de la API de Google Gemini cuando el usuario utiliza activamente el Asistente de IA. Estos datos son efímeros y se rigen por las políticas de privacidad de Google Cloud.</p>
                      <h5 className="text-indigo-400 font-bold uppercase text-xs">Eliminación de Datos</h5>
                      <p>De acuerdo con las regulaciones internacionales de protección de datos (GDPR/CPRA) y las políticas de Google Play, el usuario tiene derecho a eliminar su cuenta y todos los datos asociados desde el menú de Configuración > Datos en cualquier momento.</p>
                      <h5 className="text-indigo-400 font-bold uppercase text-xs">Condiciones de Suscripción</h5>
                      <p>Las suscripciones se gestionan íntegramente a través de Google Play Billing. Al suscribirse, usted autoriza a Google a realizar cargos mensuales a su método de pago registrado hasta que cancele la suscripción.</p>
                  </div>
                  <div className="p-6 bg-slate-950 border-t border-slate-800 text-center">
                      <p className="text-[10px] text-slate-500 font-mono">AgroSuite 360 - Registro de Autor 2025. Todos los derechos reservados.</p>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};
