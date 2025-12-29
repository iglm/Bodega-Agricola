
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Send, X, Bot, User, BrainCircuit, Loader2, Play, Camera, Image as ImageIcon, CheckCircle, AlertTriangle, Info, FileSearch, Zap } from 'lucide-react';
import { AppState } from '../types';
import { getFarmAnalysis, parseFarmCommand, analyzeFarmImage, processInvoiceVision, ParsedCommand } from '../services/aiService';
import { compressImage } from '../services/imageService';

interface AIAssistantProps {
  data: AppState;
  onExecuteCommand: (cmd: ParsedCommand) => void;
}

type Message = {
  id: string;
  role: 'user' | 'ai';
  text: string;
  image?: string;
  isCommand?: boolean;
  commandData?: ParsedCommand;
};

export const AIAssistant: React.FC<AIAssistantProps> = ({ data, onExecuteCommand }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'CHAT' | 'COMMAND' | 'VISION_OCR'>('CHAT');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<Message[]>([
    { id: '1', role: 'ai', text: '¡Hola! Soy tu consultor DatosFinca. Puedo analizar tu rentabilidad o digitalizar tus facturas con solo una foto.' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files?.[0]) {
          setIsCapturing(true);
          try {
            const compressed = await compressImage(e.target.files[0]);
            setSelectedImage(compressed);
            // Si estamos en modo OCR, disparamos automáticamente
            if (mode === 'VISION_OCR') {
                handleSendOCR(compressed, e.target.files[0].type);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setIsCapturing(false);
          }
      }
  };

  const handleSendOCR = async (imgBase64: string, mime: string) => {
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: "Digitalizando esta factura...", image: imgBase64 }]);
    setIsLoading(true);
    setSelectedImage(null);
    try {
        const command = await processInvoiceVision(imgBase64, mime);
        setMessages(prev => [...prev, { 
            id: (Date.now()+1).toString(), role: 'ai', 
            text: `**Factura Detectada:** ${command.explanation}. ¿Deseas cargar este insumo al inventario?`,
            isCommand: true, commandData: command
        }]);
    } catch (e) {
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: "Error procesando el OCR. Asegúrate de que la foto sea clara." }]);
    } finally { setIsLoading(false); }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim() && !selectedImage) return;

    const newMessage: Message = { 
        id: Date.now().toString(), 
        role: 'user', 
        text: textToSend || (selectedImage ? "Analiza esta imagen por favor." : ""), 
        image: selectedImage || undefined 
    };
    
    setMessages(prev => [...prev, newMessage]);
    const currentImage = selectedImage;
    const currentMode = mode;
    setInput(''); setSelectedImage(null); setIsLoading(true);

    try {
      if (currentImage) {
        const response = await analyzeFarmImage(currentImage, "image/jpeg", textToSend);
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: response }]);
      } else if (currentMode === 'CHAT') {
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
             setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: "No logré captar la instrucción administrativa." }]);
        } else {
             setMessages(prev => [...prev, { 
                 id: (Date.now()+1).toString(), role: 'ai', 
                 text: `**Inteligencia Agro:** ${command.explanation}. ¿Deseas que lo registre oficialmente?`,
                 isCommand: true, commandData: command
             }]);
        }
      }
    } catch (e) { 
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: 'Lo siento, tuve un problema de conexión.' }]); 
    } finally { setIsLoading(false); }
  };

  if (!isOpen) return (
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 bg-gradient-to-br from-indigo-600 to-purple-600 text-white p-5 rounded-3xl shadow-2xl transition-all hover:scale-110 active:scale-95 z-50 flex items-center gap-2">
        <Sparkles className="w-7 h-7" />
        <span className="hidden sm:inline font-black text-xs uppercase tracking-widest">Consultor IA</span>
      </button>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm pointer-events-none">
      <div className="pointer-events-auto bg-slate-900 w-full max-w-md h-[85vh] rounded-[2.5rem] border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        <div className="bg-slate-950 p-6 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-3">
                <div className="bg-indigo-500/20 p-2 rounded-xl border border-indigo-500/30"><Bot className="w-6 h-6 text-indigo-400" /></div>
                <div>
                    <h3 className="text-white font-black">Asistente DatosFinca</h3>
                    <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Digitalización Inteligente</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 transition-colors"><X className="w-6 h-6" /></button>
        </div>

        <div className="flex bg-slate-950 p-1.5 border-b border-slate-800 gap-1 overflow-x-auto scrollbar-hide">
            <button onClick={() => setMode('CHAT')} className={`shrink-0 px-4 py-3 text-[9px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${mode === 'CHAT' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>
                <BrainCircuit className="w-3 h-3" /> Análisis
            </button>
            <button onClick={() => setMode('VISION_OCR')} className={`shrink-0 px-4 py-3 text-[9px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${mode === 'VISION_OCR' ? 'bg-amber-600 text-white' : 'text-slate-500'}`}>
                <FileSearch className="w-3 h-3" /> OCR Factura
            </button>
            <button onClick={() => setMode('COMMAND')} className={`shrink-0 px-4 py-3 text-[9px] font-black uppercase rounded-2xl flex items-center gap-2 transition-all ${mode === 'COMMAND' ? 'bg-emerald-600 text-white' : 'text-slate-500'}`}>
                <Mic className="w-3 h-3" /> Dictado
            </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-900/50 custom-scrollbar">
            {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/20' : 'bg-slate-700 text-slate-300'}`}>
                        {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[85%] rounded-3xl p-4 text-sm shadow-sm transition-all ${msg.role === 'ai' ? 'bg-slate-800 text-slate-200 rounded-tl-none' : 'bg-indigo-600 text-white rounded-tr-none'}`}>
                        {msg.image && <img src={msg.image} className="w-full h-48 object-cover rounded-2xl mb-3 border border-white/10 shadow-lg" alt="Input" />}
                        <div className="leading-relaxed" dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                        
                        {msg.isCommand && (
                            <button 
                                onClick={() => { onExecuteCommand(msg.commandData!); setIsOpen(false); }}
                                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black py-4 rounded-2xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Zap className="w-4 h-4" /> Confirmar y Guardar
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex gap-3 animate-pulse">
                    <div className="w-8 h-8 rounded-xl bg-slate-800" />
                    <div className="bg-slate-800/50 p-4 rounded-3xl rounded-tl-none text-[10px] text-indigo-400 flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" /> Procesando...
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        <div className="p-6 bg-slate-950 border-t border-slate-800">
            <div className="flex gap-3 items-center bg-slate-900 p-2 rounded-[2rem] border border-slate-800 focus-within:border-indigo-500/50 transition-all">
                <button 
                    onClick={() => fileInputRef.current?.click()} 
                    disabled={isCapturing}
                    className={`p-4 rounded-[1.5rem] transition-all active:scale-90 ${mode === 'VISION_OCR' ? 'bg-amber-600 text-white' : 'bg-slate-800 text-slate-500'}`}
                    title="Analizar Foto"
                >
                    {isCapturing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Camera className="w-5 h-5" />}
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileSelect} />
                
                <input 
                    type="text" 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()} 
                    placeholder={mode === 'VISION_OCR' ? "Sube la foto de la factura..." : "Escribe o dicta..."} 
                    className="flex-1 bg-transparent border-none px-2 text-white text-sm focus:ring-0 outline-none placeholder-slate-600 font-medium" 
                />
                
                <button 
                    onClick={() => handleSend()} 
                    disabled={(!input.trim() && !selectedImage) || isLoading} 
                    className="p-4 rounded-[1.5rem] bg-indigo-600 text-white hover:bg-indigo-500 shadow-indigo-900/40"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};