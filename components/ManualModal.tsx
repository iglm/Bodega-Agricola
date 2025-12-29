
import React, { useState } from 'react';
import { X, BookOpen, Calculator, TrendingUp, Sprout, Pickaxe, Package, BarChart3, ArrowRight, HelpCircle, Download, DollarSign, Tractor, Umbrella, Globe, Database, FileText, Sparkles, Mic, BrainCircuit, Target, Lightbulb, Scale, PieChart, Leaf, Gauge, Microscope, ShieldCheck, Signature, Recycle, Gem, Coins, Timer, Camera, Info, Loader2, FileDown, Lock } from 'lucide-react';
import { generateManualPDF } from '../services/reportService';

interface ManualModalProps {
  onClose: () => void;
}

type Section = 'intro' | 'modules' | 'finance' | 'technical' | 'ai' | 'compliance' | 'enterprise';

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<Section>('intro');
  const [isDownloading, setIsDownloading] = useState(false);

  const renderContent = () => {
    switch (activeSection) {
      case 'intro':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-8 rounded-[3rem] border border-emerald-500/30 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-4xl font-black text-white mb-2 tracking-tight">Guía <span className="text-emerald-400">360</span></h4>
                <p className="text-emerald-200 font-bold text-sm uppercase tracking-widest">Transformación Digital del Campo</p>
                <div className="mt-6 inline-flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full text-[10px] text-white border border-white/20 uppercase font-black">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" /> Sistema Certificado 2025
                </div>
              </div>
            </div>

            <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700">
                <h5 className="font-black text-white flex items-center gap-2 mb-4 uppercase text-xs tracking-widest">
                  <Gauge className="w-5 h-5 text-indigo-400" /> Propósito de DatosFinca Viva
                </h5>
                <p className="text-sm text-slate-300 leading-relaxed text-justify mb-4 font-medium">
                    Esta no es una simple libreta de registros. Es un **ERP Agrícola** diseñado para que el productor deje de ser solo un agricultor y se convierta en un **Gerente de Negocios**. Cada dato registrado alimenta un motor financiero que le dirá si su finca es realmente rentable.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-indigo-500/10 p-4 rounded-3xl border border-indigo-500/20">
                        <p className="text-[10px] font-black text-indigo-400 uppercase mb-1">Visión de Campo</p>
                        <p className="text-[11px] text-slate-400">Control de insumos, análisis de suelos y rendimientos por lote.</p>
                    </div>
                    <div className="bg-emerald-500/10 p-4 rounded-3xl border border-emerald-500/20">
                        <p className="text-[10px] font-black text-emerald-400 uppercase mb-1">Visión de Negocio</p>
                        <p className="text-[11px] text-slate-400">Amortización de activos, blindaje legal y rentabilidad real.</p>
                    </div>
                </div>
            </div>
          </div>
        );

      case 'finance':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                    <Scale className="w-6 h-6 text-amber-500" /> Control de Costos Laborales
                </h4>
                <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-amber-500/20 space-y-4">
                    <p className="text-xs text-slate-300 font-bold uppercase leading-relaxed">
                        Entendemos que cada finca es un mundo. Usted decide cómo costear:
                    </p>
                    <div className="space-y-3">
                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                            <span className="text-[10px] font-black text-amber-500 uppercase">1. Jornal Seco (Factor 1.0)</span>
                            <p className="text-[11px] text-slate-400 mt-1">Ideal para pagos informales. La app solo cuenta lo que usted paga al trabajador sin extras.</p>
                        </div>
                        <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                            <span className="text-[10px] font-black text-emerald-500 uppercase">2. Carga Legal (Factor 1.52)</span>
                            <p className="text-[11px] text-slate-400 mt-1">Calcula el costo real de una empresa agroindustrial formal (Prestaciones, Salud, Pensión).</p>
                        </div>
                    </div>
                </div>
            </div>
        );

      case 'modules':
        return (
          <div className="space-y-8 animate-fade-in">
             <div className="space-y-4">
                <h4 className="text-lg font-black text-emerald-400 flex items-center gap-2 uppercase tracking-tighter">
                    <Package className="w-6 h-6" /> Gestión de Bodega (CPP)
                </h4>
                <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 space-y-3">
                    <p className="text-sm text-slate-300 font-medium">
                        El módulo de bodega calcula el **Costo Promedio Ponderado**. Esto significa que si compras Urea a diferentes precios, la app sabrá exactamente cuánto vale tu inventario actual en tiempo real.
                    </p>
                    <ul className="space-y-2">
                        <li className="text-[11px] text-slate-400 flex gap-2"><ArrowRight className="w-3 h-3 text-emerald-500 shrink-0"/> <strong>Entradas:</strong> Registre facturas, tome fotos del comprobante para auditoría.</li>
                        <li className="text-[11px] text-slate-400 flex gap-2"><ArrowRight className="w-3 h-3 text-emerald-500 shrink-0"/> <strong>Salidas:</strong> Asigne el insumo a un lote. Esto genera el costo directo del cultivo.</li>
                    </ul>
                </div>
             </div>

             <div className="space-y-4">
                <h4 className="text-lg font-black text-amber-500 flex items-center gap-2 uppercase tracking-tighter">
                    <Pickaxe className="w-6 h-6" /> Nómina y Personal
                </h4>
                <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-slate-700 space-y-3">
                    <p className="text-sm text-slate-300 font-medium">
                        Administre jornales y tareas con facilidad. Genere el **Recibo de Pago PDF** firmado para protegerse de pleitos ante la UGPP.
                    </p>
                </div>
             </div>
          </div>
        );

      case 'enterprise':
        return (
          <div className="space-y-6 animate-fade-in">
              <h4 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                  <Lock className="w-6 h-6 text-indigo-400" /> Privacidad y Seguridad Local
              </h4>

              <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-indigo-500/20 space-y-4">
                  <div className="flex items-center gap-3">
                      <ShieldCheck className="w-8 h-8 text-indigo-400" />
                      <div>
                          <h5 className="font-black text-white text-sm uppercase">Datos Local-First</h5>
                          <p className="text-[10px] text-indigo-400 font-bold uppercase">Usted es el dueño</p>
                      </div>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed font-medium">
                      REGLA DE ORO: Sus datos NO viven en nuestra nube. Se guardan en su teléfono. Esto garantiza que sus costos y ventas sean un secreto profesional. Si borra la app o pierde el teléfono sin haber descargado un backup, los datos se pierden. ¡Use la función de Backup JSON semanalmente!
                  </p>
              </div>
          </div>
        );

      case 'ai':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-black text-white flex items-center gap-2 uppercase tracking-tighter">
                    <Sparkles className="w-6 h-6 text-purple-400" /> Inteligencia Artificial
                </h4>
                <div className="bg-slate-800 p-6 rounded-[2.5rem] border border-purple-500/20 space-y-4">
                    <div className="flex items-center gap-3">
                        <BrainCircuit className="w-8 h-8 text-purple-400" />
                        <h5 className="font-black text-white text-sm uppercase">Asistente Gemini 3.0</h5>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-medium">
                        Nuestra IA utiliza visión artificial para digitalizar su finca.
                    </p>
                    <ul className="space-y-3">
                        <li className="bg-slate-900/50 p-3 rounded-xl border border-slate-700 flex items-start gap-3">
                            <Camera className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                            <span className="text-[10px] text-slate-400"><strong>OCR Vision:</strong> Tome foto a la factura de agroquímicos y la app cargará los productos automáticamente.</span>
                        </li>
                    </ul>
                </div>
            </div>
        );
        
      default:
        return null;
    }
  };

  const handleDownloadManual = () => {
    setIsDownloading(true);
    try {
        generateManualPDF();
    } catch (e) {
        console.error(e);
        alert("Error generando el PDF. Intente de nuevo.");
    } finally {
        setTimeout(() => setIsDownloading(false), 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-[3rem] border border-slate-700 shadow-2xl flex flex-col md:flex-row overflow-hidden animate-slide-up">
        
        {/* Sidebar Navigation */}
        <div className="w-full md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
            <div className="p-6 border-b border-slate-800 flex items-center gap-3">
                <div className="p-2 bg-emerald-600 rounded-2xl shadow-lg shadow-emerald-600/20"><BookOpen className="w-6 h-6 text-white" /></div>
                <span className="font-black text-white text-sm uppercase tracking-tighter">Manual DatosFinca Viva</span>
            </div>
            
            <div className="flex-1 overflow-x-auto md:overflow-y-auto py-4 space-y-1 flex md:flex-col scrollbar-hide">
                <button onClick={() => setActiveSection('intro')} className={`shrink-0 w-auto md:w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'intro' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <Globe className="w-5 h-5" />
                    <span className="text-xs font-black uppercase tracking-widest">Inicio</span>
                </button>
                <button onClick={() => setActiveSection('finance')} className={`shrink-0 w-auto md:w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'finance' ? 'bg-slate-800 border-r-4 border-amber-500' : 'text-slate-400'}`}>
                    <Scale className="w-5 h-5 text-amber-500" />
                    <span className="text-xs font-black uppercase tracking-widest">Costeo</span>
                </button>
                <button onClick={() => setActiveSection('modules')} className={`shrink-0 w-auto md:w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'modules' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <Package className="w-5 h-5 text-emerald-400" />
                    <span className="text-xs font-black uppercase tracking-widest">Operación</span>
                </button>
                <button onClick={() => setActiveSection('ai')} className={`shrink-0 w-auto md:w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'ai' ? 'bg-slate-800 border-r-4 border-purple-500' : 'text-slate-400'}`}>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="text-xs font-black uppercase tracking-widest">Inteligencia</span>
                </button>
                <button onClick={() => setActiveSection('enterprise')} className={`shrink-0 w-auto md:w-full text-left px-6 py-4 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'enterprise' ? 'bg-slate-800 border-r-4 border-indigo-500' : 'text-slate-400'}`}>
                    <Lock className="w-5 h-5 text-indigo-400" />
                    <span className="text-xs font-black uppercase tracking-widest">Seguridad</span>
                </button>
            </div>

            <div className="p-6 border-t border-slate-800">
                <button 
                    onClick={handleDownloadManual} 
                    disabled={isDownloading}
                    className={`w-full p-4 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase transition-all shadow-lg border border-slate-700 ${isDownloading ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-800 hover:bg-slate-700 text-white'}`}
                >
                    {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileDown className="w-4 h-4 text-emerald-400" />}
                    {isDownloading ? 'Generando...' : 'Descargar Manual PDF'}
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full bg-slate-900/50">
             <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                 <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    <Info className="w-4 h-4 text-emerald-500" /> Documentación DatosFinca Viva
                 </h3>
                 <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
             </div>

             <div className="flex-1 overflow-y-auto p-6 md:p-12 custom-scrollbar select-text">
                 {renderContent()}
             </div>
        </div>

      </div>
    </div>
  );
};