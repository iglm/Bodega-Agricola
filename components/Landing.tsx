
import React from 'react';
import { ShieldCheck, User, CheckCircle, Lock, Mail, Sprout, Scale, ScrollText, BookOpen, Code } from 'lucide-react';

interface LandingProps {
  onEnter: () => void;
  onShowManual: () => void;
}

export const Landing: React.FC<LandingProps> = ({ onEnter }) => {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
      <div className="max-w-4xl w-full bg-slate-900 rounded-2xl shadow-2xl border border-slate-700 flex flex-col max-h-[95vh] overflow-hidden">
        
        {/* Header: Developer & App Info */}
        <div className="p-6 bg-slate-800/50 border-b border-slate-700 flex flex-col md:flex-row items-center justify-between gap-6 flex-shrink-0">
            
            {/* App Brand */}
            <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-green-800 flex items-center justify-center shadow-lg border border-emerald-500/30">
                    <Sprout className="w-8 h-8 text-white" />
                </div>
                <div>
                    <h1 className="text-2xl font-black text-white tracking-tight">AgroBodega Pro</h1>
                    <p className="text-emerald-400 text-xs uppercase font-bold tracking-wider">Gestión Técnica & Financiera</p>
                </div>
            </div>

            {/* Developer Info */}
            <div className="flex items-center gap-4 bg-slate-800 p-3 rounded-xl border border-slate-700/50 shadow-sm">
                <div className="w-12 h-12 rounded-full bg-slate-700 border-2 border-emerald-500 flex items-center justify-center overflow-hidden relative">
                    <User className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h2 className="text-sm font-bold text-white">Lucas Mateo Tabares Franco</h2>
                    <div className="flex flex-col text-[10px] text-slate-400 font-medium space-y-0.5">
                        <span className="flex items-center gap-1.5"><BookOpen className="w-3 h-3 text-emerald-500"/> Ingeniero Agrónomo</span>
                        <span className="flex items-center gap-1.5"><Code className="w-3 h-3 text-blue-500"/> Desarrollador Full Stack</span>
                    </div>
                </div>
            </div>

        </div>

        {/* Scrollable Legal Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar bg-slate-50 dark:bg-slate-900 text-slate-300 shadow-inner">
            
            <div className="max-w-3xl mx-auto space-y-8">
                
                {/* Intro / Services Note */}
                <div className="bg-emerald-900/10 p-4 rounded-xl border border-emerald-900/30 text-center">
                    <p className="text-emerald-400 font-bold text-sm uppercase tracking-wide">Soluciones Tecnológicas para el Agro</p>
                    <p className="text-xs text-slate-400 mt-2 leading-relaxed max-w-2xl mx-auto">
                        Esta aplicación combina el conocimiento técnico agronómico con desarrollo de software avanzado para optimizar la rentabilidad de su finca.
                        Desarrollada para funcionar 100% offline, garantizando que su información permanezca segura en su dispositivo.
                    </p>
                </div>

                {/* Legal Framework Title */}
                <div className="flex items-center gap-3 border-b border-slate-700 pb-3">
                    <Scale className="w-6 h-6 text-slate-400" />
                    <h3 className="text-lg font-bold text-white">Marco Legal y Términos de Uso</h3>
                </div>

                {/* Legal Content */}
                <div className="text-xs text-justify leading-relaxed space-y-6 font-serif text-slate-400 select-none">
                    
                    <div className="p-4 bg-slate-800 rounded-lg border border-slate-700">
                        <p className="font-bold text-slate-200 text-center text-sm">
                            CONTRATO DE LICENCIA DE USUARIO FINAL (EULA)
                        </p>
                        <p className="text-center mt-1 text-[10px] text-slate-500">Lea detenidamente los siguientes términos antes de ingresar.</p>
                    </div>

                    <section>
                        <h4 className="font-bold text-slate-200 text-sm mb-2 border-b border-slate-700 pb-1 w-fit">
                            CAPÍTULO I: PROPIEDAD INTELECTUAL
                        </h4>
                        <p className="mb-2">
                            <strong>ARTÍCULO 1. TITULARIDAD.</strong> De conformidad con la <strong>Ley 23 de 1982</strong> (Sobre Derechos de Autor en Colombia) y la Decisión 351 del Acuerdo de Cartagena, se declara que el software <strong>"AgroBodega Pro"</strong>, incluyendo su código fuente, estructura de base de datos, algoritmos de cálculo agronómico, diseño de interfaz gráfica (UI) y experiencia de usuario (UX), es propiedad intelectual exclusiva e inalienable del Ingeniero <strong>LUCAS MATEO TABARES FRANCO</strong> (en adelante, "EL AUTOR").
                        </p>
                        <p>
                            <strong>ARTÍCULO 2. RESTRICCIONES.</strong> Queda estrictamente prohibido al usuario, bajo pena de las sanciones civiles y penales estipuladas en el Código Penal Colombiano (Artículos 270, 271 y 272 sobre violación a los derechos morales y patrimoniales de autor):
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>Realizar ingeniería inversa, descompilación, desensamblaje o cualquier intento de derivar el código fuente.</li>
                            <li>Modificar, adaptar, traducir o crear trabajos derivados basados en el Software.</li>
                            <li>Alquilar, arrendar, prestar, revender, sublicenciar o distribuir el Software a terceros sin autorización escrita del AUTOR.</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-200 text-sm mb-2 border-b border-slate-700 pb-1 w-fit">
                            CAPÍTULO II: HABEAS DATA Y PRIVACIDAD
                        </h4>
                        <p className="mb-2">
                            <strong>ARTÍCULO 3. ARQUITECTURA DE DATOS.</strong> En cumplimiento estricto de la <strong>Ley Estatutaria 1581 de 2012</strong> y el Decreto Reglamentario 1377 de 2013, se informa que esta aplicación opera bajo una arquitectura de "Almacenamiento Local Descentralizado" (Local Storage).
                        </p>
                        <p className="mb-2">
                            <strong>ARTÍCULO 4. PRIVACIDAD ABSOLUTA.</strong> El AUTOR certifica que:
                        </p>
                        <ul className="list-disc pl-5 mt-1 space-y-1">
                            <li>La aplicación <strong>NO</strong> transmite datos a servidores externos ni nubes controladas por el desarrollador.</li>
                            <li>Toda la información financiera, inventarios y costos reside física y exclusivamente en su dispositivo.</li>
                            <li>El AUTOR no tiene capacidad técnica para acceder a sus datos comerciales.</li>
                        </ul>
                    </section>

                    <section>
                        <h4 className="font-bold text-slate-200 text-sm mb-2 border-b border-slate-700 pb-1 w-fit">
                            CAPÍTULO III: LIMITACIÓN DE RESPONSABILIDAD
                        </h4>
                        <p className="mb-2">
                            <strong>ARTÍCULO 5. EXCLUSIÓN DE GARANTÍAS (AS-IS).</strong> El software se entrega "TAL CUAL". El AUTOR no garantiza que el funcionamiento sea ininterrumpido o libre de errores.
                        </p>
                        <p>
                            <strong>ARTÍCULO 6. RESPONSABILIDAD DEL USUARIO.</strong> El USUARIO asume total responsabilidad por la interpretación de los cálculos agronómicos y la realización de copias de seguridad (Backups) periódicas.
                        </p>
                    </section>

                    <div className="pt-4 border-t border-slate-700 text-center">
                        <p className="font-bold text-slate-200">ING. LUCAS MATEO TABARES FRANCO</p>
                        <p>Matrícula Profesional Vigente</p>
                        <p>Colombia - 2025</p>
                    </div>

                </div>
            </div>

        </div>

        {/* Footer Actions */}
        <div className="p-6 bg-slate-800/50 border-t border-slate-700 flex flex-col gap-3 flex-shrink-0">
            <div className="flex items-center gap-2 justify-center text-[10px] text-slate-500 mb-2">
                <ScrollText className="w-3 h-3" />
                <span>Al hacer clic en "Aceptar e Ingresar", usted confirma haber leído y entendido los términos legales expuestos.</span>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
                <button className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-600 text-slate-300 hover:bg-slate-700 transition-colors text-sm font-bold">
                    <Mail className="w-4 h-4" /> Contactar Soporte
                </button>
                <button 
                    onClick={onEnter}
                    className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 hover:from-emerald-500 hover:to-emerald-400 text-white shadow-lg shadow-emerald-900/30 transition-all transform active:scale-[0.98] text-sm font-bold"
                >
                    <CheckCircle className="w-5 h-5" /> ACEPTAR E INGRESAR
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
