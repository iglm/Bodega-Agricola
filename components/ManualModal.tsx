
import React, { useState } from 'react';
/* Added Leaf to the imports from lucide-react to resolve "Cannot find name 'Leaf'" error on line 88 */
import { X, BookOpen, Calculator, TrendingUp, Sprout, Pickaxe, Package, BarChart3, ArrowRight, HelpCircle, Download, DollarSign, Tractor, Umbrella, Globe, Database, FileText, Sparkles, Mic, BrainCircuit, Target, Lightbulb, Scale, PieChart, Leaf } from 'lucide-react';
import { generateManualPDF } from '../services/reportService';

interface ManualModalProps {
  onClose: () => void;
}

type Section = 'intro' | 'modules' | 'finance' | 'tips' | 'data' | 'ai' | 'cases';

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<Section>('intro');

  const renderContent = () => {
    switch (activeSection) {
      case 'intro':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 p-6 rounded-2xl border border-indigo-500/30 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-3xl font-black text-white mb-2 tracking-tight">AgroSuite <span className="text-indigo-400">360</span></h4>
                <p className="text-indigo-200 font-medium text-sm">Tu Centro de Comando Agroindustrial</p>
                <div className="mt-4 inline-block bg-white/10 px-3 py-1 rounded-full text-[10px] text-white border border-white/20 uppercase font-black tracking-widest">
                    Manual Versión 5.0
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                <Target className="w-5 h-5 text-indigo-500" />
                El Salto de Productor a Empresario
              </h5>
              <p className="text-sm text-slate-300 leading-relaxed text-justify">
                  AgroSuite 360 no es solo un registro; es una herramienta de <strong>Ingeniería Financiera</strong>. En el agro moderno, el éxito no depende de cuánto cosechas, sino de cuánto te cuesta producir cada kilo. 
                  Este manual te enseñará a usar los datos para optimizar tu rentabilidad.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <h6 className="font-bold text-emerald-400 text-[10px] uppercase mb-1">Costo de Producción</h6>
                      <p className="text-[10px] text-slate-400 leading-tight">Saber el costo exacto por kilo te permite negociar mejores precios de venta.</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <h6 className="font-bold text-blue-400 text-[10px] uppercase mb-1">Margen de Seguridad</h6>
                      <p className="text-[10px] text-slate-400 leading-tight">Calcula cuánto puedes bajar tus precios en crisis sin entrar en pérdida.</p>
                  </div>
              </div>
            </div>

            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 mt-4">
               <p className="text-sm text-slate-300 flex gap-3 items-start">
                  <Globe className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Soporte Multi-Finca:</strong><br/>
                    Puedes administrar varias propiedades (Ej: "Finca El Recreo" y "Finca La Esperanza") de forma independiente. Cambia entre ellas desde el menú superior.
                  </span>
               </p>
            </div>
          </div>
        );

      case 'cases':
        return (
          <div className="space-y-6 animate-fade-in">
              <h4 className="text-lg font-black text-white flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-yellow-400" /> Casos de Uso Reales
              </h4>

              {/* CAFÉ */}
              <div className="bg-slate-800 p-5 rounded-2xl border-l-4 border-l-amber-600 border border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-black text-amber-500 uppercase text-xs">Escenario: Producción de Café</h5>
                    <Sprout className="w-4 h-4 text-amber-600" />
                  </div>
                  <p className="text-xs text-slate-300 mb-3 italic">"¿Cuánto me cuesta recolectar un kilo de café cereza vs el precio del mercado?"</p>
                  <ul className="space-y-2">
                      <li className="text-[10px] text-slate-400 flex gap-2"><ArrowRight className="w-3 h-3 text-amber-500 shrink-0"/> <strong>Mano de Obra:</strong> Registra la recolección como labor diaria ligada al peso. El sistema te dirá el costo por kilo recolectado.</li>
                      <li className="text-[10px] text-slate-400 flex gap-2"><ArrowRight className="w-3 h-3 text-amber-500 shrink-0"/> <strong>Insumos:</strong> Registra las abonadas por Lote. Cruza esto con las ventas para ver qué lote responde mejor a la fertilización.</li>
                  </ul>
              </div>

              {/* AGUACATE */}
              <div className="bg-slate-800 p-5 rounded-2xl border-l-4 border-l-emerald-600 border border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-black text-emerald-500 uppercase text-xs">Escenario: Aguacate Hass (Levante)</h5>
                    <Leaf className="w-4 h-4 text-emerald-600" />
                  </div>
                  <p className="text-xs text-slate-300 mb-3 italic">"Tengo 3 años de inversión sin ventas aún. ¿Cuánto capital llevo invertido?"</p>
                  <ul className="space-y-2">
                      <li className="text-[10px] text-slate-400 flex gap-2"><ArrowRight className="w-3 h-3 text-emerald-500 shrink-0"/> <strong>Estado 'Levante':</strong> Configura tus lotes nuevos en etapa 'Levante'. Todos los gastos se acumulan como inversión de capital.</li>
                      <li className="text-[10px] text-slate-400 flex gap-2"><ArrowRight className="w-3 h-3 text-emerald-500 shrink-0"/> <strong>Mantenimiento:</strong> Registra el control de Phytophthora y podas como costos directos para saber el valor de tu activo biológico.</li>
                  </ul>
              </div>

              {/* PLATANO / BANANO */}
              <div className="bg-slate-800 p-5 rounded-2xl border-l-4 border-l-yellow-500 border border-slate-700">
                  <div className="flex justify-between items-center mb-3">
                    <h5 className="font-black text-yellow-500 uppercase text-xs">Escenario: Plátano / Banano</h5>
                    <Target className="w-4 h-4 text-yellow-500" />
                  </div>
                  <p className="text-xs text-slate-300 mb-3 italic">"¿El costo del embolse y el desije está dentro de mi presupuesto?"</p>
                  <ul className="space-y-2">
                      <li className="text-[10px] text-slate-400 flex gap-2"><ArrowRight className="w-3 h-3 text-yellow-500 shrink-0"/> <strong>Inventario:</strong> Controla el stock de bolsas y cintas. El sistema te avisará cuando falten insumos para el próximo embolse.</li>
                      <li className="text-[10px] text-slate-400 flex gap-2"><ArrowRight className="w-3 h-3 text-yellow-500 shrink-0"/> <strong>Maquinaria:</strong> Registra el uso de bombas de espalda para ver el rendimiento por hectárea en control de Sigatoka.</li>
                  </ul>
              </div>
          </div>
        );

      case 'finance':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-indigo-400" />
                    Conceptos de Negocio Agrícola
                </h4>

                <div className="grid gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h5 className="font-bold text-indigo-300 mb-1 uppercase text-[10px]">Punto de Equilibrio (Break-even)</h5>
                        <p className="text-xs text-slate-400">
                            Es la cantidad mínima de cosecha que debes vender para cubrir todos tus gastos. Superar este punto significa que ya estás ganando dinero real.
                        </p>
                    </div>
                    
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h5 className="font-bold text-emerald-300 mb-1 uppercase text-[10px]">ROI (Retorno de Inversión)</h5>
                        <p className="text-xs text-slate-400">
                            Calcula cuánto dinero te devuelve cada peso invertido en fertilizante. Si inviertes $1M y tu venta sube $1.5M, tu ROI es del 50%.
                        </p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h5 className="font-bold text-red-300 mb-1 uppercase text-[10px]">Depreciación de Maquinaria</h5>
                        <p className="text-xs text-slate-400">
                            Tus máquinas (guadañas, tractores) se desgastan. Registra sus mantenimientos para entender que una máquina vieja sin mantenimiento aumenta tu costo de producción.
                        </p>
                    </div>
                </div>

                <div className="bg-indigo-900/20 p-5 rounded-xl border border-indigo-500/30">
                    <h5 className="font-bold text-indigo-400 mb-2 flex items-center gap-2 text-xs uppercase">Prorrateo: La clave del detalle</h5>
                    <p className="text-[10px] text-slate-400 leading-relaxed">
                        AgroSuite 360 toma gastos generales (como el recibo de la luz o el sueldo del administrador) y los divide entre tus lotes según su tamaño. Así sabrás si el "Lote de la Esquina" es rentable por sí mismo.
                    </p>
                </div>
            </div>
        );

      case 'modules':
        return (
          <div className="space-y-8 animate-fade-in">
             
             {/* 1. INVENTARIO */}
             <div>
                <h4 className="text-lg font-bold text-emerald-400 flex items-center gap-2 mb-3">
                    <Package className="w-5 h-5" /> 1. Inventario (Método CPP)
                </h4>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                    <p className="text-sm text-slate-300">
                        Usamos el <strong>Costo Promedio Ponderado</strong>. Si compraste Urea a $100k y luego a $120k, el sistema calcula un costo medio dinámico para que tus proyecciones de rentabilidad sean realistas.
                    </p>
                </div>
             </div>

             {/* 2. MANO DE OBRA */}
             <div>
                <h4 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-3">
                    <Pickaxe className="w-5 h-5" /> 2. Nómina y Liquidación
                </h4>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                    <p className="text-sm text-slate-300">
                        Lleva el control de qué le debes a cada trabajador. Al pagar, puedes generar un <strong>Comprobante de Pago PDF</strong> que sirve como evidencia legal de la labor realizada.
                    </p>
                </div>
             </div>

             {/* 3. GESTION TECNICA */}
             <div>
                <h4 className="text-lg font-bold text-blue-500 flex items-center gap-2 mb-3">
                    <Umbrella className="w-5 h-5" /> 3. Clima y Maquinaria
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <h5 className="text-xs font-bold text-white mb-1 uppercase">Pluviometría</h5>
                        <p className="text-[10px] text-slate-400">Anota los milímetros de lluvia. Crucial para saber cuándo fertilizar o prever plagas por humedad.</p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <h5 className="text-xs font-bold text-white mb-1 uppercase">Maquinaria</h5>
                        <p className="text-[10px] text-slate-400">Controla horas de uso y consumo de combustible de tus equipos.</p>
                    </div>
                </div>
             </div>
          </div>
        );

      case 'ai':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-400" />
                    Asistente Agro-Inteligente
                </h4>

                <div className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 p-5 rounded-xl border border-indigo-500/30">
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Ahora puedes tomar fotos a tus <strong>facturas de insumos</strong> y Gemini extraerá automáticamente los productos y precios.
                    </p>
                </div>

                <div className="grid gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h5 className="font-bold text-indigo-300 mb-2 flex items-center gap-2 text-sm">
                            <BrainCircuit className="w-4 h-4" /> Visión en Campo
                        </h5>
                        <p className="text-xs text-slate-400">
                            Toma foto a una planta enferma y pregúntale: "¿Qué tiene esta planta?". La IA buscará patrones fitosanitarios para ayudarte.
                        </p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h5 className="font-bold text-emerald-400 mb-2 flex items-center gap-2 text-sm">
                            <Mic className="w-4 h-4" /> Comandos de Campo
                        </h5>
                        <p className="text-xs text-slate-400">
                            Dile: "Ayer compré 10 bultos de abono" y la IA preparará el registro por ti. Ideal para manos sucias en el campo.
                        </p>
                    </div>
                </div>
            </div>
        );

      case 'data':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-6 h-6 text-orange-400" />
                    Seguridad Offline-First
                </h4>

                <div className="bg-orange-900/10 p-5 rounded-xl border border-orange-500/30">
                    <h5 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Privacidad Absoluta
                    </h5>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        Tus registros financieros <strong>no suben a la nube</strong>. Están en tu teléfono. Si pierdes el teléfono sin un backup, pierdes la información. 
                    </p>
                </div>

                <div className="space-y-4">
                    <h5 className="font-bold text-white text-xs uppercase tracking-widest">Protocolo Sugerido:</h5>
                    <div className="flex gap-4 items-start bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <div className="bg-indigo-600 p-2 rounded-lg"><Download className="w-4 h-4 text-white"/></div>
                        <div>
                            <p className="text-sm font-bold text-slate-200">Backup Semanal</p>
                            <p className="text-[10px] text-slate-400">Ve a Base de Datos > Descargar Backup. Guárdalo en tu Google Drive personal o envíalo por WhatsApp a un familiar.</p>
                        </div>
                    </div>
                </div>
            </div>
        );
        
      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/95 backdrop-blur-md p-2 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-5xl h-[90vh] rounded-2xl border border-slate-700 shadow-2xl flex overflow-hidden animate-slide-up">
        
        {/* Sidebar Navigation */}
        <div className="w-20 md:w-64 bg-slate-950 border-r border-slate-800 flex flex-col flex-shrink-0">
            <div className="p-4 border-b border-slate-800 flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-600/20"><BookOpen className="w-6 h-6 text-white" /></div>
                <span className="font-black text-white hidden md:block text-sm uppercase tracking-tighter">Manual de Usuario</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-1">
                <button onClick={() => setActiveSection('intro')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'intro' ? 'bg-slate-800 border-r-4 border-indigo-500' : 'text-slate-400'}`}>
                    <Globe className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Visión Estratégica</span>
                </button>
                <button onClick={() => setActiveSection('cases')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'cases' ? 'bg-slate-800 border-r-4 border-yellow-500' : 'text-slate-400'}`}>
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    <span className="hidden md:block text-sm font-bold">Ejemplos Reales</span>
                </button>
                <button onClick={() => setActiveSection('modules')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'modules' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <Sprout className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Guía de Módulos</span>
                </button>
                <button onClick={() => setActiveSection('ai')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'ai' ? 'bg-slate-800 border-r-4 border-purple-500' : 'text-slate-400'}`}>
                    <Sparkles className="w-5 h-5 text-purple-400" />
                    <span className="hidden md:block text-sm font-bold text-purple-400">Inteligencia Artificial</span>
                </button>
                <button onClick={() => setActiveSection('finance')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'finance' ? 'bg-slate-800 border-r-4 border-blue-500' : 'text-slate-400'}`}>
                    <PieChart className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Finanzas y Admin</span>
                </button>
                <button onClick={() => setActiveSection('data')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'data' ? 'bg-slate-800 border-r-4 border-orange-500' : 'text-slate-400'}`}>
                    <Database className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Seguridad de Datos</span>
                </button>
            </div>

            <div className="p-4 border-t border-slate-800">
                <button onClick={generateManualPDF} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-3 rounded-lg flex flex-col md:flex-row items-center justify-center gap-2 text-[10px] font-black uppercase transition-colors shadow-lg border border-slate-700">
                    <FileText className="w-4 h-4 text-emerald-400" />
                    <span className="hidden md:block">Bajar PDF Oficial</span>
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full bg-slate-900/50">
             {/* Header Mobile/Desktop */}
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-950">
                 <h3 className="text-white font-black text-xs uppercase tracking-widest flex items-center gap-2">
                    {activeSection === 'intro' && 'Filosofía Agroindustrial'}
                    {activeSection === 'cases' && 'Flujos de Trabajo por Cultivo'}
                    {activeSection === 'modules' && 'Manual Operativo'}
                    {activeSection === 'finance' && 'Gerencia y Costos'}
                    {activeSection === 'data' && 'Protocolos de Respaldo'}
                    {activeSection === 'ai' && 'Uso de IA Multimodal'}
                 </h3>
                 <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-4 md:p-10 custom-scrollbar select-text">
                 {renderContent()}
             </div>
        </div>

      </div>
    </div>
  );
};
