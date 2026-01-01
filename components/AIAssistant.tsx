
import React, { useState } from 'react';
import { AppState } from '../types';
import { analyzeFincaData } from '../services/aiService';
import { BrainCircuit, X, Sparkles, Loader2, Target, TrendingUp, ShieldCheck, ChevronRight, MessageSquareCode } from 'lucide-react';

interface AIAssistantProps {
  data: AppState;
  onClose: () => void;
}

export const AIAssistant: React.FC<AIAssistantProps> = ({ data, onClose }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleStartAnalysis = async () => {
    setLoading(true);
    const result = await analyzeFincaData(data);
    setAnalysis(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-xl p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-2xl rounded-[3rem] border border-indigo-500/30 shadow-[0_0_50px_rgba(99,102,241,0.2)] overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        <div className="bg-gradient-to-r from-indigo-900 via-slate-900 to-slate-900 p-8 flex justify-between items-center border-b border-indigo-500/20">
            <div className="flex items-center gap-4">
                <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-900/40">
                    <BrainCircuit className="w-8 h-8 text-white animate-pulse" />
                </div>
                <div>
                    <h3 className="text-white font-black text-2xl uppercase tracking-tighter">Finca-AI <span className="text-indigo-400 text-xs font-bold tracking-widest ml-2">POWERED BY GEMINI</span></h3>
                    <p className="text-indigo-200/50 text-[10px] font-black uppercase tracking-[0.2em]">Consultoría Estratégica Cognitiva</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 transition-all">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar space-y-6">
            {!analysis && !loading && (
                <div className="text-center space-y-8 py-10">
                    <div className="bg-indigo-950/20 p-8 rounded-[3rem] border border-indigo-500/20 inline-block">
                        <Sparkles className="w-12 h-12 text-indigo-400 mx-auto mb-4" />
                        <h4 className="text-white font-black text-xl mb-2 italic">¿Listo para el análisis masivo?</h4>
                        <p className="text-slate-400 text-sm max-w-sm mx-auto leading-relaxed font-medium">
                            Finca-AI revisará sus inventarios, nómina y ventas para encontrar oportunidades de ahorro y eficiencia.
                        </p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-left">
                        {[
                            { icon: Target, text: "Detección de sobrecostos" },
                            { icon: TrendingUp, text: "Proyección de utilidad" },
                            { icon: ShieldCheck, text: "Alerta de cumplimiento" },
                            { icon: MessageSquareCode, text: "Consejo estratégico real" }
                        ].map((item, i) => (
                            <div key={i} className="bg-slate-800/50 p-4 rounded-2xl border border-slate-700 flex items-center gap-3">
                                <item.icon className="w-4 h-4 text-indigo-400" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">{item.text}</span>
                            </div>
                        ))}
                    </div>

                    <button 
                        onClick={handleStartAnalysis}
                        className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-6 rounded-[2rem] text-sm uppercase tracking-widest shadow-2xl shadow-indigo-900/40 transition-all active:scale-95 flex items-center justify-center gap-3"
                    >
                        INICIAR CONSULTA ESTRATÉGICA
                    </button>
                </div>
            )}

            {loading && (
                <div className="flex flex-col items-center justify-center py-20 space-y-4">
                    <div className="relative">
                        <Loader2 className="w-16 h-16 text-indigo-500 animate-spin" />
                        <BrainCircuit className="w-6 h-6 text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                    </div>
                    <p className="text-indigo-400 font-black text-[10px] uppercase tracking-[0.3em] animate-pulse">Procesando KPIs de Bodega...</p>
                </div>
            )}

            {analysis && (
                <div className="animate-fade-in space-y-6">
                    <div className="bg-slate-950/80 p-8 rounded-[3rem] border border-indigo-500/20 leading-relaxed text-slate-200 font-medium text-sm whitespace-pre-wrap shadow-inner relative">
                        <div className="absolute top-4 right-4 bg-emerald-600/20 text-emerald-400 text-[8px] font-black px-2 py-1 rounded-lg border border-emerald-500/30">ANÁLISIS COMPLETADO</div>
                        {analysis}
                    </div>
                    
                    <div className="p-6 bg-indigo-900/10 rounded-[2rem] border border-indigo-500/20 flex gap-4 items-start">
                        <ShieldCheck className="w-6 h-6 text-indigo-400 shrink-0" />
                        <p className="text-[10px] text-indigo-300 italic leading-tight">
                            Este análisis se genera de forma segura y privada. Finca-AI no almacena sus datos fuera de esta sesión. Desarrollado por Lucas Mateo Tabares Franco.
                        </p>
                    </div>

                    <button 
                        onClick={() => setAnalysis(null)}
                        className="w-full py-4 rounded-2xl bg-slate-800 text-slate-400 font-black text-[10px] uppercase hover:text-white transition-all"
                    >
                        Realizar nuevo análisis
                    </button>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};
