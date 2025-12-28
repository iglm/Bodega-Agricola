
import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Mic, Send, X, Bot, User, BrainCircuit, Loader2, Play, Pause } from 'lucide-react';
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
    { id: '1', role: 'ai', text: '¡Hola! Soy tu copiloto agronómico. Puedo analizar tus finanzas o registrar datos por ti. ¿En qué te ayudo hoy?' }
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition;
      recognitionRef.current = new SpeechRecognition();
      recognitionRef.current.continuous = false;
      recognitionRef.current.lang = 'es-CO';
      recognitionRef.current.interimResults = false;

      recognitionRef.current.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleSend(transcript); // Auto-send on voice end
      };

      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const toggleListening = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      setIsListening(true);
      recognitionRef.current?.start();
    }
  };

  const handleSend = async (textOverride?: string) => {
    const textToSend = textOverride || input;
    if (!textToSend.trim()) return;

    // Add User Message
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: textToSend };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      if (mode === 'CHAT') {
        // Idea B: Analysis
        const response = await getFarmAnalysis(data, textToSend);
        setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: response }]);
      } else {
        // Idea C: Command Parsing
        const catalogs = {
            items: data.inventory.map(i => i.name),
            people: data.personnel.map(p => p.name),
            lotes: data.costCenters.map(c => c.name),
            activities: data.activities.map(a => a.name)
        };
        
        const command = await parseFarmCommand(textToSend, catalogs);
        
        if (command.action === 'UNKNOWN') {
             setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: "No entendí la acción. Intenta: 'Compré 5 bultos de urea' o 'Juan trabajó en el lote 1'." }]);
        } else {
             setMessages(prev => [...prev, { 
                 id: (Date.now()+1).toString(), 
                 role: 'ai', 
                 text: `Entendido: ${command.confidence}. ¿Confirmar ejecución?`,
                 isCommand: true,
                 commandData: command
             }]);
        }
      }
    } catch (e) {
      setMessages(prev => [...prev, { id: (Date.now()+1).toString(), role: 'ai', text: 'Error de conexión con Gemini.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const executePendingCommand = (cmd: ParsedCommand) => {
      onExecuteCommand(cmd);
      setMessages(prev => [...prev, { id: Date.now().toString(), role: 'ai', text: '✅ ¡Acción ejecutada correctamente!' }]);
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white p-4 rounded-full shadow-lg shadow-purple-900/30 transition-transform hover:scale-105 active:scale-95 z-30 animate-bounce-slow"
      >
        <Sparkles className="w-6 h-6" />
      </button>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center pointer-events-none p-4">
      <div className="pointer-events-auto bg-slate-900 w-full max-w-md h-[80vh] rounded-2xl border border-slate-700 shadow-2xl flex flex-col overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-slate-950 p-4 border-b border-slate-800 flex justify-between items-center">
            <div className="flex items-center gap-2">
                <div className="bg-indigo-500/20 p-2 rounded-lg">
                    <Bot className="w-5 h-5 text-indigo-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold">Agro-Intelligence</h3>
                    <p className="text-[10px] text-slate-400">Powered by Gemini</p>
                </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-slate-400 hover:text-white"><X className="w-6 h-6" /></button>
        </div>

        {/* Modes */}
        <div className="flex bg-slate-950 p-1 border-b border-slate-800">
            <button 
                onClick={() => setMode('CHAT')}
                className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 ${mode === 'CHAT' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <BrainCircuit className="w-4 h-4" /> Analista
            </button>
            <button 
                onClick={() => setMode('COMMAND')}
                className={`flex-1 py-2 text-xs font-bold rounded flex items-center justify-center gap-2 ${mode === 'COMMAND' ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:text-slate-300'}`}
            >
                <Mic className="w-4 h-4" /> Comandos de Voz
            </button>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-900/90 custom-scrollbar">
            {messages.map(msg => (
                <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'ai' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-slate-700 text-slate-300'}`}>
                        {msg.role === 'ai' ? <Sparkles className="w-4 h-4" /> : <User className="w-4 h-4" />}
                    </div>
                    <div className={`max-w-[80%] rounded-xl p-3 text-sm leading-relaxed ${msg.role === 'ai' ? 'bg-slate-800 text-slate-200' : 'bg-indigo-600 text-white'}`}>
                        <div dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<b>$1</b>').replace(/\n/g, '<br/>') }} />
                        
                        {msg.isCommand && msg.commandData && (
                            <button 
                                onClick={() => msg.commandData && executePendingCommand(msg.commandData)}
                                className="mt-3 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                            >
                                <Play className="w-3 h-3" /> Ejecutar Acción
                            </button>
                        )}
                    </div>
                </div>
            ))}
            {isLoading && (
                <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400"><Bot className="w-4 h-4"/></div>
                    <div className="bg-slate-800 p-3 rounded-xl flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                        <span className="text-xs text-slate-400">Pensando...</span>
                    </div>
                </div>
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 bg-slate-950 border-t border-slate-800">
            <div className="flex gap-2">
                <button 
                    onClick={toggleListening}
                    className={`p-3 rounded-xl transition-colors ${isListening ? 'bg-red-500 text-white animate-pulse' : 'bg-slate-800 text-slate-400 hover:text-white'}`}
                >
                    {isListening ? <Pause className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
                <input 
                    type="text" 
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                    placeholder={mode === 'CHAT' ? "Pregunta sobre tu finca..." : "Ej: 'Compré 10 bultos de cal'..."}
                    className="flex-1 bg-slate-800 border-none rounded-xl px-4 text-white text-sm focus:ring-2 focus:ring-indigo-500 outline-none"
                />
                <button 
                    onClick={() => handleSend()}
                    disabled={!input.trim() || isLoading}
                    className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white p-3 rounded-xl transition-colors"
                >
                    <Send className="w-5 h-5" />
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};
