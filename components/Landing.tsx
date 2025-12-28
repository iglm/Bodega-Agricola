
import React, { useState } from 'react';
import { ShieldCheck, User, CheckCircle, Lock, Mail, Sprout, Scale, FileText, AlertTriangle, BookOpen, Gavel, Server } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
  onShowManual: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  const [accepted, setAccepted] = useState(false);

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] overflow-y-auto">
      <div className="max-w-5xl w-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col md:flex-row md:overflow-hidden md:max-h-[90vh] h-auto my-auto">
        
        {/* Left Panel: Brand & Developer Identity */}
        <div className="md:w-2/5 bg-gradient-to-br from-emerald-900 to-slate-900 p-8 flex flex-col justify-between relative overflow-hidden shrink-0">
            {/* Background Accents */}
            <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(circle_at_50%_120%,rgba(16,185,129,0.4),transparent)]"></div>
            
            <div className="relative z-10">
                <div className="w-20 h-20 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-900/50 mb-6">
                    <Sprout className="w-12 h-12 text-white" />
                </div>
                <h1 className="text-4xl font-black text-white tracking-tight mb-2">AgroBodega <span className="text-emerald-400">Pro</span></h1>
                <p className="text-emerald-200/80 font-medium text-sm mb-6">Suite de Gestión Agrícola Integral</p>
                
                <div className="space-y-4 hidden md:block">
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div className="p-2 bg-blue-500/20 rounded-lg">
                            <Server className="w-5 h-5 text-blue-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-xs">Offline-First Technology</p>
                            <p className="text-slate-400 text-[10px]">Sus datos nunca salen de su dispositivo.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 bg-white/5 p-3 rounded-xl border border-white/10 backdrop-blur-sm">
                        <div className="p-2 bg-purple-500/20 rounded-lg">
                            <Lock className="w-5 h-5 text-purple-400" />
                        </div>
                        <div>
                            <p className="text-white font-bold text-xs">Encriptación Local</p>
                            <p className="text-slate-400 text-[10px]">Seguridad de nivel bancario local.</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="relative z-10 mt-8 pt-8 border-t border-white/10">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest mb-3">Desarrollado por</p>
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-800 border-2 border-emerald-500 flex items-center justify-center shrink-0">
                        <User className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <h3 className="text-white font-bold text-sm">Lucas Mateo Tabares Franco</h3>
                        <div className="flex flex-col gap-0.5 mt-1">
                            <span className="text-[10px] text-emerald-300 bg-emerald-900/30 px-2 py-0.5 rounded w-fit border border-emerald-500/30">Ingeniero Agrónomo</span>
                            <span className="text-[10px] text-blue-300 bg-blue-900/30 px-2 py-0.5 rounded w-fit border border-blue-500/30">Desarrollador Full Stack</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* Right Panel: Legal Contract */}
        <div className="md:w-3/5 bg-slate-50 dark:bg-slate-950 flex flex-col h-full">
            <div className="p-6 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
                <h2 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
                    <Scale className="w-5 h-5 text-slate-500" />
                    Marco Legal y Términos de Uso
                </h2>
                <p className="text-xs text-slate-500 mt-1">Última actualización: Octubre 2023</p>
            </div>

            <div className="flex-1 overflow-y-auto p-6 text-xs text-justify leading-relaxed text-slate-600 dark:text-slate-400 font-serif space-y-4 custom-scrollbar bg-white dark:bg-slate-950 select-none min-h-[200px]">
                <div className="p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900/30 rounded-lg mb-4">
                    <p className="font-bold text-red-700 dark:text-red-400 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" /> AVISO IMPORTANTE DE RESPONSABILIDAD
                    </p>
                    <p className="mt-1 text-slate-700 dark:text-slate-300">
                        Este software es una herramienta de asistencia técnica y contable. El usuario asume total responsabilidad por la interpretación de los datos agronómicos y financieros. El desarrollador no se hace responsable por pérdidas de cosecha derivadas de decisiones basadas en esta herramienta.
                    </p>
                </div>

                <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1">1. PROPIEDAD INTELECTUAL Y DERECHOS DE AUTOR</h3>
                <p>
                    De conformidad con la <strong>Ley 23 de 1982</strong> y la Decisión 351 del Acuerdo de Cartagena, este software, incluyendo su código fuente, algoritmos, base de datos y diseño de interfaz, es propiedad intelectual exclusiva de <strong>LUCAS MATEO TABARES FRANCO</strong>.
                </p>
                <p>
                    <strong>Queda estrictamente prohibida:</strong> La reproducción, copia, distribución, ingeniería inversa, descompilación o modificación no autorizada de este software. La violación de estos términos constituye un delito bajo la <strong>Ley 1273 de 2009 (Delitos Informáticos)</strong>, acarreando sanciones penales y civiles.
                </p>

                <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 mt-4">2. POLÍTICA DE PRIVACIDAD Y HABEAS DATA</h3>
                <p>
                    En cumplimiento de la <strong>Ley Estatutaria 1581 de 2012</strong> y el Decreto 1377 de 2013, se informa que esta aplicación opera bajo una arquitectura de "Almacenamiento Local" (Local Storage).
                </p>
                <ul className="list-disc pl-4 space-y-1">
                    <li><strong>Soberanía de Datos:</strong> El desarrollador NO tiene acceso, no recolecta, ni transmite sus datos financieros o de inventario a servidores externos.</li>
                    <li><strong>Responsabilidad del Usuario:</strong> Es responsabilidad exclusiva del usuario realizar copias de seguridad (Backups) utilizando la función de exportación de la aplicación. La pérdida del dispositivo o el borrado de datos del navegador es irreversible sin un backup manual.</li>
                </ul>

                <h3 className="font-bold text-slate-900 dark:text-white border-b border-slate-200 dark:border-slate-800 pb-1 mt-4">3. LICENCIA DE USO</h3>
                <p>
                    Se otorga una licencia personal, intransferible, no exclusiva y revocable para el uso de AgroBodega Pro con fines de gestión agropecuaria. El uso indebido para fines ilícitos resultará en la terminación inmediata de esta licencia.
                </p>

                <div className="pt-4 mt-6 border-t border-slate-200 dark:border-slate-800 text-center italic text-slate-400">
                    <p>"La tecnología al servicio del campo colombiano"</p>
                    <p className="font-bold mt-1">Ing. Lucas Mateo Tabares Franco - Colombia</p>
                </div>
            </div>

            <div className="p-6 bg-slate-100 dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 shrink-0">
                <label className="flex items-start gap-3 cursor-pointer group mb-4 select-none bg-slate-200 dark:bg-slate-800/50 p-3 rounded-xl border border-transparent hover:border-slate-400 transition-all">
                    <div className="relative flex items-center pt-0.5">
                        <input 
                            type="checkbox" 
                            className="peer h-6 w-6 cursor-pointer appearance-none rounded border-2 border-slate-400 bg-white dark:bg-slate-800 checked:bg-emerald-500 checked:border-emerald-500 transition-all"
                            checked={accepted}
                            onChange={(e) => setAccepted(e.target.checked)}
                        />
                        <CheckCircle className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-white opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">
                        He leído y acepto los Términos Legales, Política de Privacidad y Derechos de Autor.
                    </span>
                </label>

                <button 
                    onClick={onEnter}
                    disabled={!accepted}
                    className={`w-full py-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
                        accepted 
                        ? 'bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer shadow-emerald-900/20 hover:scale-[1.02] active:scale-95' 
                        : 'bg-slate-300 dark:bg-slate-800 text-slate-500 dark:text-slate-600 cursor-not-allowed'
                    }`}
                >
                    {accepted ? (
                        <>
                            <Gavel className="w-5 h-5" /> INGRESAR AL SISTEMA
                        </>
                    ) : (
                        <>
                            <Lock className="w-4 h-4" /> DEBE ACEPTAR LOS TÉRMINOS
                        </>
                    )}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
