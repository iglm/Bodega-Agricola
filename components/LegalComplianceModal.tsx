
import React, { useState } from 'react';
import { X, ShieldCheck, Scale, FileText, Gavel, UserCheck, Lock, Book, ShieldAlert, CheckCircle2, AlertCircle, Info, Database } from 'lucide-react';

interface LegalComplianceModalProps {
  onClose: () => void;
}

export const LegalComplianceModal: React.FC<LegalComplianceModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'privacy' | 'copyright' | 'terms' | 'consumer'>('privacy');

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/95 backdrop-blur-xl p-2 sm:p-4 animate-fade-in">
      <div className="bg-slate-950 w-full max-w-5xl h-[90vh] rounded-[3rem] border border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        <div className="p-8 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-600/20 p-3 rounded-2xl border border-emerald-500/30">
                    <Gavel className="w-8 h-8 text-emerald-500" />
                </div>
                <div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Políticas y Privacidad</h3>
                    <p className="text-[10px] text-emerald-400 uppercase tracking-widest font-black">Cumplimiento Google Play Store 2025</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-all">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex bg-slate-950 p-1.5 border-b border-slate-800 gap-1 overflow-x-auto scrollbar-hide shrink-0">
            <button onClick={() => setActiveTab('privacy')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'privacy' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <ShieldCheck className="w-4 h-4" /> Política de Privacidad
            </button>
            <button onClick={() => setActiveTab('copyright')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'copyright' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <FileText className="w-4 h-4" /> Propiedad Intelectual
            </button>
            <button onClick={() => setActiveTab('terms')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'terms' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <ShieldAlert className="w-4 h-4" /> Términos de Uso
            </button>
            <button onClick={() => setActiveTab('consumer')} className={`shrink-0 px-6 py-4 text-[10px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${activeTab === 'consumer' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
                <Scale className="w-4 h-4" /> Estatuto del Consumidor
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-8 bg-slate-900/30">
            
            {activeTab === 'privacy' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Lock className="w-5 h-5 text-blue-500" /> Declaración de Seguridad de Datos
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-blue-900/20 rounded-2xl border border-blue-500/30">
                                <Database className="w-8 h-8 text-blue-400 shrink-0" />
                                <p className="font-bold">DatosFinca Viva es una aplicación "Local-First". Esto significa que el 100% de los datos que ingresas se almacenan exclusivamente en la memoria interna de tu dispositivo (IndexedDB).</p>
                            </div>
                            <p><strong>1. Recolección de Datos:</strong> No recolectamos, no transmitimos ni vendemos ninguna información personal, financiera o de ubicación a servidores externos ni a terceros.</p>
                            <p><strong>2. Uso de Permisos:</strong> La aplicación solicita permiso de cámara únicamente para permitirte adjuntar fotografías a tus registros de inventario o facturas. Estas fotos permanecen en tu dispositivo.</p>
                            <p><strong>3. Gestión de Datos:</strong> Tú tienes el control total. Puedes ver, editar o eliminar tus datos en cualquier momento. Al desinstalar la aplicación o limpiar el caché del navegador, todos tus datos serán eliminados permanentemente.</p>
                            <p><strong>4. Eliminación de Datos:</strong> En el menú "Centro de Datos", encontrarás una opción para borrar toda la información del dispositivo de forma instantánea.</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'copyright' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Book className="w-5 h-5 text-purple-500" /> Derechos de Autor (Ley 23 de 1982)
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Autor y Titular:</strong> Lucas Mateo Tabares Franco es el creador exclusivo de "DatosFinca Viva" y "AgroBodega Pro".</p>
                            <p><strong>Protección:</strong> El código fuente, la lógica de cálculo (CPP, VPN/TIR) y los diseños de interfaz están protegidos por leyes nacionales e internacionales de propiedad intelectual. Se prohíbe cualquier intento de ingeniería inversa, copia o distribución no autorizada del software.</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'terms' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <AlertCircle className="w-5 h-5 text-amber-500" /> Términos y Condiciones
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Herramienta de Apoyo:</strong> La aplicación es un sistema de soporte a la decisión. El usuario es el único responsable de la veracidad de los datos ingresados y de las acciones tomadas basadas en los análisis del sistema.</p>
                            <p><strong>Responsabilidad de Respaldo:</strong> Al ser una app local, el usuario es responsable de generar sus propios backups (archivos JSON) para prevenir la pérdida de datos por daño del hardware.</p>
                        </div>
                    </section>
                </div>
            )}

            {activeTab === 'consumer' && (
                <div className="space-y-6 animate-fade-in text-slate-300">
                    <section className="space-y-4">
                        <h4 className="text-white font-black uppercase text-base flex items-center gap-2">
                            <Scale className="w-5 h-5 text-emerald-500" /> Estatuto del Consumidor
                        </h4>
                        <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-800 text-xs leading-relaxed space-y-4">
                            <p><strong>Garantía de Software:</strong> Se garantiza la funcionalidad de la aplicación según sus especificaciones técnicas. Ante fallos técnicos, el canal de contacto oficial es: <strong>lucas.tabares@gmail.com</strong>.</p>
                            <p><strong>Pagos y Reembolsos:</strong> Cualquier suscripción premium (PRO) es gestionada a través de Google Play Store, y se rige por sus políticas de reembolso y el derecho al retracto vigente en la legislación local.</p>
                        </div>
                    </section>
                </div>
            )}

        </div>

        <div className="p-8 bg-slate-950 border-t border-slate-800 flex flex-col sm:flex-row gap-4 items-center justify-between shrink-0">
            <div className="flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-emerald-500" />
                <p className="text-[10px] text-slate-500 font-bold uppercase">Versión del Sistema: 1.0.0 (Estable)</p>
            </div>
            <button onClick={onClose} className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-500 text-white font-black py-4 px-10 rounded-2xl text-[11px] uppercase tracking-widest shadow-xl shadow-emerald-900/40 transition-all active:scale-95">
                ACEPTAR Y CONTINUAR
            </button>
        </div>

      </div>
    </div>
  );
};
