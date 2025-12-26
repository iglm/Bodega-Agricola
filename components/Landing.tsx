import React, { useState } from 'react';
import { ShieldCheck, User, CheckCircle, Lock, Mail, ChevronRight, Sprout, TrendingUp, ClipboardCheck, BookOpen } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
  onShowManual: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter, onShowManual }) => {
  const [showPrivacy, setShowPrivacy] = useState(false);

  if (showPrivacy) {
    return (
      <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-200 p-6 flex flex-col items-center justify-center transition-colors">
        <div className="max-w-2xl bg-white dark:bg-slate-800 p-8 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700">
          <h2 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mb-4">Política de Privacidad y Habeas Data</h2>
          <div className="space-y-4 text-sm text-slate-600 dark:text-slate-300 h-96 overflow-y-auto pr-2">
            <p><strong>Desarrollador:</strong> Lucas Mateo Tabares Franco</p>
            <p><strong>Aplicación:</strong> AgroBodega Pro</p>
            <p>
              De conformidad con la Ley Estatutaria 1581 de 2012 de Protección de Datos Personales y normas concordantes, 
              se informa al usuario que esta aplicación opera bajo un modelo <strong>100% OFFLINE (Local)</strong>.
            </p>
            <p>
              1. <strong>Almacenamiento de Datos:</strong> Todos los datos ingresados (inventarios, costos, movimientos) 
              se almacenan exclusivamente en la memoria interna de su dispositivo. No se envían a servidores externos ni a la nube.
            </p>
            <p>
              2. <strong>Responsabilidad:</strong> El usuario es el único responsable de la integridad de los datos. 
              Se recomienda realizar copias de seguridad mediante la función de "Exportar Excel" periódicamente.
            </p>
            <p>
              3. <strong>Propiedad Intelectual:</strong> El código fuente, diseño y lógica matemática de esta aplicación 
              son propiedad intelectual de Lucas Mateo Tabares Franco. Queda prohibida la ingeniería inversa, copia o distribución no autorizada.
            </p>
             <p>
              4. <strong>Leyes Citadas:</strong> Ley 1273 de 2009 (Delitos Informáticos), Ley 23 de 1982 (Derechos de Autor).
            </p>
          </div>
          <button 
            onClick={() => setShowPrivacy(false)}
            className="mt-6 w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl transition-colors"
          >
            Entendido, Volver
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-emerald-900 dark:bg-[#022c22] flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] transition-colors duration-500">
      <div className="max-w-md w-full space-y-6">
        
        {/* Header Icon */}
        <div className="flex flex-col items-center justify-center space-y-2 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-700 flex items-center justify-center shadow-lg border border-emerald-400/30">
            <Sprout className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white text-center">Control de Agroinsumos</h1>
          <p className="text-emerald-100/70 text-xs tracking-widest uppercase">Herramienta Técnica de Bodega</p>
        </div>

        {/* Developer Card */}
        <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-2xl transition-colors">
          <div className="p-6 border-b border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800/50">
            <div className="flex items-center space-x-4">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/50 border-2 border-emerald-500 flex items-center justify-center">
                <User className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-800 dark:text-white">Lucas Mateo Tabares Franco</h2>
                <div className="flex space-x-2 mt-1">
                  <span className="px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 text-[10px] font-semibold border border-emerald-200 dark:border-emerald-800">INGENIERO AGRÓNOMO</span>
                  <span className="px-2 py-0.5 rounded-md bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 text-[10px] font-semibold border border-blue-200 dark:border-blue-800">DESARROLLADOR</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase mb-3 flex items-center gap-2">
              <ClipboardCheck className="w-3 h-3" />
              Módulos Disponibles
            </div>
            
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col items-center text-center hover:border-emerald-500/50 transition-colors">
                <BookOpen className="w-5 h-5 text-emerald-600 dark:text-emerald-500 mb-2" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Inventario<br/>Detallado</span>
              </div>
              <div className="bg-slate-100 dark:bg-slate-900/50 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50 flex flex-col items-center text-center hover:border-emerald-500/50 transition-colors">
                <TrendingUp className="w-5 h-5 text-emerald-600 dark:text-emerald-500 mb-2" />
                <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">Cálculo de<br/>Costos</span>
              </div>
            </div>

            <button 
                onClick={onShowManual}
                className="w-full bg-slate-200/50 dark:bg-slate-700/50 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-600 text-slate-600 dark:text-slate-300 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all mb-2"
            >
              <BookOpen className="w-4 h-4" />
              Manual de Usuario / Ayuda
            </button>

            <button className="w-full bg-blue-50 dark:bg-blue-600/20 hover:bg-blue-100 dark:hover:bg-blue-600/30 border border-blue-200 dark:border-blue-500/50 text-blue-600 dark:text-blue-400 py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 transition-all">
              <Mail className="w-4 h-4" />
              Contactar / Soporte Técnico
              <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Security & Legal */}
        <div className="bg-white/90 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-slate-200 dark:border-slate-700 p-5 shadow-xl transition-colors">
          <div className="flex gap-3 mb-4">
            <Lock className="w-5 h-5 text-emerald-600 dark:text-emerald-500 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
              <span className="font-bold text-slate-800 dark:text-white">Privacidad y Seguridad:</span> Esta aplicación opera <span className="text-emerald-600 dark:text-emerald-400 font-bold">100% Offline</span>. 
              Sus datos permanecen exclusivamente en su dispositivo. Cumplimos con la Ley de Habeas Data y políticas de Google Play.
            </p>
          </div>
          
          <div className="flex gap-3 mb-6">
            <ShieldCheck className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
              Software protegido por Derechos de Autor. Prohibida su copia, ingeniería inversa o distribución no autorizada.
            </p>
          </div>

          <button 
            onClick={onEnter}
            className="group w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-500 hover:to-green-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-emerald-900/20 transform transition-all active:scale-[0.98] flex items-center justify-center gap-2"
          >
            INGRESAR A LA BODEGA
            <CheckCircle className="w-5 h-5 text-emerald-200 group-hover:text-white" />
          </button>
          
          <div className="mt-4 text-center">
            <button onClick={() => setShowPrivacy(true)} className="text-[10px] text-slate-500 hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors underline">
              Leer Política de Privacidad Completa
            </button>
            <p className="text-[9px] text-slate-400 dark:text-slate-600 mt-1">© 2025 Ing. Lucas Mateo Tabares Franco</p>
          </div>
        </div>

      </div>
    </div>
  );
};