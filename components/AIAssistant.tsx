
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Send, X, Bot, User, BrainCircuit, Loader2, Play, Pause, TrendingUp, Wallet, Package } from 'lucide-react';
import { AppState } from '../types';
import { getFarmAnalysis, parseFarmCommand, ParsedCommand } from '../services/aiService';

interface AIAssistantProps {
  data: AppState;
  onExecuteCommand: (cmd: ParsedCommand) => void;
}

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  isCommand?: boolean;
  commandData?: ParsedCommand;
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ data, onExecuteCommand }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'CHAT' | 'COMMAND'>('CHAT');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: '¡Hola! Soy tu copiloto agronómico de AgroSuite 360. Puedo analizar tu rentabilidad o registrar tus trabajos de campo por voz. ¿Qué necesitas saber?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-CO';
      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: textToSend }]);
    setInput(''); setIsLoading(true);

    try {
      if (mode === 'CHAT') {
        const response = await getFarmAnalysis(data, textToSend);
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: response }]);
      } else {
        const catalogs = {
            items: data.inventory.map(i => i.name),
            people: data.personnel.map(p => p.name),
            lotes: data.costCenters.map(c => c.name),
            activities: data.activities.map(a => a.name)
        };
        const command = await parseFarmCommand(textToSend, catalogs);
        if (command.action === 'UNKNOWN') {
             setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: "No logré captar el comando. Intenta algo como: 'Ayer Juan aplicó 2 bultos de urea en el Lote 1'." }]);
        } else {
             setMessages(prev => [...prev, { 
                 id: (Date.now()+1).toString(), role: 'ai', 
                 text: `He entendido esto: ${command.confidence}. ¿Deseas que lo registre oficialmente?`,
                 isCommand: true, commandData: command
             }]);
        }
      }
    } catch (e) { setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: 'Error de conexión con el núcleo de IA.' }]); }
    finally { setIsLoading(false); }
  };

  const quickPrompts = [
      { text: "¿Soy rentable este mes?", icon: TrendingUp, mode: 'CHAT' as const },
      { text: "¿Qué insumos tengo bajos?", icon: Package, mode: 'CHAT' as const },
      { text: "¿Cuánto debo en nómina?", icon: Wallet, mode: 'CHAT' as const }
  ];

  if (!isOpen) return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-5 rounded-3xl shadow-2xl shadow-purple-900/40 transition-all hover:scale-110 active:scale-95 z-50 animate-bounce-slow">
        <Sparkles className="w-7 h-7" />
      </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 w-full max-w-md h-[85vh] rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30"><Bot className="w-6 h-6 text-indigo-400" /></div>
                <div>
                    <h3 className="text-white font-black">Agro-Intelligence</h3>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Consultor Gemini 2.5 Pro</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex bg-slate-950 p-1.5 border-b border-slate-800 gap-1">
            <button onClick={() => setMode('CHAT')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl flex items-center justify-center gap-2 transition-all ${mode === 'CHAT' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'text-slate-500'}`}>
                <BrainCircuit className="w-4 h-4" /> Analista
            </button>
            <button onClick={() => setMode('COMMAND')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-2xl flex items-center justify-center gap-2 transition-all ${mode === 'COMMAND' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/20' : 'text-slate-500'}`}>
                <Mic className="w-4 h-4" /> Comandos de Voz
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50 custom-scrollbar">
            {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-indigo-600 text-white' : 'bg-slate-700 text-slate-300'}`}>
                        {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[85%] rounded-3xl p-4 text-sm leading-relaxed shadow-sm ${msg.role === 'ai' ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                        <div className="prose prose-invert prose-sm" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                        {msg.isCommand && msg.commandData && (
                            <button onClick={() => onExecuteCommand(msg.commandData!)} className="mt-4 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-2xl text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-emerald-900/20">
                                <Play className="w-3 h-3" /> Confirmar Registro
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-slate-800 flex items-center justify-center text-indigo-400"><Bot className="w-4 h-4"/></div>
                    <div className="bg-slate-800/50 p-4 rounded-3xl flex items-center gap-2 border border-slate-700">
                        <Loader2 className="w-4 h-4 animate-spin text-indigo-400" />
                        <span className="text-[10px] font-black text-slate-500 uppercase">Analizando...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* QUICK SUGGESTIONS */}
        {!isLoading && messages.length < 5 && (
            <div className="px-6 py-2 bg-slate-900 flex gap-2 overflow-x-auto scrollbar-hide">
                {quickPrompts.map((q, i) => (
                    <button key={i} onClick={() => { setMode(q.mode); handleSend(q.text); }} className="whitespace-nowrap bg-slate-800 border border-slate-700 text-slate-300 px-4 py-2 rounded-full text-[10px] font-black uppercase hover:bg-indigo-600 hover:text-white transition-all flex items-center gap-1.5">
                        <q.icon className="w-3 h-3" /> {q.text}
                    </button>
                ))}
            </div>
        )}

        <div className="p-6 bg-slate-950 border-t border-slate-800">
            <div className="flex gap-3 items-center bg-slate-900 p-2 rounded-[2rem] border border-slate-800 focus-within:border-indigo-500/50 transition-all">
                <button onClick={() => { setIsListening(!isListening); isListening ? recognitionRef.current?.stop() : recognitionRef.current?.start(); }} className={`p-4 rounded-[1.5rem] transition-all ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-500 hover:text-white'}`}>
                    {isListening ? <Pause className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder={mode === 'CHAT' ? "Consulta inteligente..." : "Dicta tu reporte..."} className="flex-1 bg-transparent border-none px-2 text-white text-sm focus:ring-0 outline-none font-medium placeholder-slate-600" />
                <button onClick={() => handleSend()} disabled={!input.trim() || isLoading} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-4 rounded-[1.5rem] transition-all shadow-lg shadow-indigo-900/20 active:scale-90">
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};
