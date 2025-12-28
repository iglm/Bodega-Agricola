
import React, { useState } from 'react';
import { X, BookOpen, Calculator, Settings, TrendingUp, Sprout, Pickaxe, Package, BarChart3, ChevronRight, CheckCircle, HelpCircle, Download, ArrowRight, DollarSign, Users, Tractor } from 'lucide-react';
import { generateManualPDF } from '../services/reportService';

interface ManualModalProps {
  onClose: () => void;
}

type Section = 'intro' | 'inventory' | 'labor' | 'production' | 'analysis' | 'crops';

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<Section>('intro');
  const [activeCrop, setActiveCrop] = useState<'cafe' | 'aguacate' | 'platano'>('cafe');

  const renderContent = () => {
    switch (activeSection) {
      case 'intro':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 text-center">
              <h4 className="text-2xl font-bold text-white mb-2">Bienvenido a AgroBodega Pro</h4>
              <p className="text-slate-300">Su asistente digital para convertir la finca en una empresa rentable.</p>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" />
                Flujo de Trabajo Exitoso
              </h5>
              {/* Visual Flowchart using CSS */}
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-bold text-slate-300">
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 flex-1 w-full text-center hover:border-blue-500 transition-colors">
                  <Package className="w-6 h-6 mx-auto mb-2 text-blue-500" />
                  1. Comprar Insumos
                  <br /><span className="text-[10px] text-slate-500 font-normal">(Entradas Almacén)</span>
                </div>
                <ArrowRight className="hidden md:block text-slate-600" />
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 flex-1 w-full text-center hover:border-amber-500 transition-colors">
                  <Pickaxe className="w-6 h-6 mx-auto mb-2 text-amber-500" />
                  2. Ejecutar Labores
                  <br /><span className="text-[10px] text-slate-500 font-normal">(Registrar Jornales)</span>
                </div>
                <ArrowRight className="hidden md:block text-slate-600" />
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-600 flex-1 w-full text-center hover:border-yellow-500 transition-colors">
                  <Sprout className="w-6 h-6 mx-auto mb-2 text-yellow-500" />
                  3. Vender Cosecha
                  <br /><span className="text-[10px] text-slate-500 font-normal">(Registrar Ingresos)</span>
                </div>
              </div>
            </div>

            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
               <p className="text-sm text-slate-300 flex gap-3">
                  <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0" />
                  <span>
                    <strong>¿Por qué usar esta app?</strong><br/>
                    Muchos agricultores solo anotan lo que venden, pero olvidan anotar "pequeños" gastos como combustible, repuestos o el jornal de medio día. Al final del año, no saben por qué no hay dinero. Esta app captura <strong>todo</strong> para darle el costo real de producir un kilo de su producto.
                  </span>
               </p>
            </div>
          </div>
        );

      case 'crops':
        return (
          <div className="space-y-6 animate-fade-in">
             <div className="flex gap-2 overflow-x-auto pb-2">
                <button 
                  onClick={() => setActiveCrop('cafe')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${activeCrop === 'cafe' ? 'bg-red-900/50 text-red-200 border border-red-500' : 'bg-slate-800 text-slate-400'}`}
                >
                  ☕ Cultivo de Café
                </button>
                <button 
                  onClick={() => setActiveCrop('aguacate')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${activeCrop === 'aguacate' ? 'bg-emerald-900/50 text-emerald-200 border border-emerald-500' : 'bg-slate-800 text-slate-400'}`}
                >
                  🥑 Aguacate Hass
                </button>
                <button 
                  onClick={() => setActiveCrop('platano')}
                  className={`px-4 py-2 rounded-lg font-bold text-xs flex items-center gap-2 transition-all ${activeCrop === 'platano' ? 'bg-yellow-900/50 text-yellow-200 border border-yellow-500' : 'bg-slate-800 text-slate-400'}`}
                >
                  🍌 Plátano / Banano
                </button>
             </div>

             {activeCrop === 'cafe' && (
                <div className="space-y-4">
                    <h4 className="text-xl font-bold text-white">Gestión Cafetera</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h5 className="font-bold text-amber-500 mb-2 flex items-center gap-2"><Pickaxe className="w-4 h-4"/> Recolección (Jornales)</h5>
                            <p className="text-xs text-slate-400 mb-3">En temporada, se paga por kilos recolectados, no por día.</p>
                            {/* Mock UI */}
                            <div className="bg-slate-900 p-3 rounded border border-slate-600 text-xs">
                                <div className="mb-2"><span className="text-slate-500">Labor:</span> <span className="text-white">Recolección</span></div>
                                <div className="mb-2"><span className="text-slate-500">Valor Jornal:</span> <span className="text-emerald-400">$ 85.000</span></div>
                                <div className="text-[10px] text-slate-500 italic border-t border-slate-700 pt-1">
                                    Nota: "Juan Pérez recogió 100kg a $850 el kilo"
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h5 className="font-bold text-red-400 mb-2 flex items-center gap-2"><Settings className="w-4 h-4"/> Beneficio (Maquinaria)</h5>
                            <p className="text-xs text-slate-400 mb-3">Registre el gasto de la despulpadora.</p>
                            {/* Mock UI */}
                            <div className="bg-slate-900 p-3 rounded border border-slate-600 text-xs">
                                <div className="mb-2"><span className="text-slate-500">Máquina:</span> <span className="text-white">Despulpadora #1</span></div>
                                <div className="mb-2"><span className="text-slate-500">Tipo:</span> <span className="text-orange-400">Combustible / Energía</span></div>
                                <div className="mb-2"><span className="text-slate-500">Costo:</span> <span className="text-white">$ 20.000</span></div>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {activeCrop === 'aguacate' && (
                <div className="space-y-4">
                    <h4 className="text-xl font-bold text-white">Gestión Aguacatera</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h5 className="font-bold text-blue-400 mb-2 flex items-center gap-2"><Package className="w-4 h-4"/> Insumos Foliares</h5>
                            <p className="text-xs text-slate-400 mb-3">El aguacate requiere aplicaciones precisas. Use la calculadora de dosis.</p>
                            {/* Mock UI */}
                            <div className="bg-slate-900 p-3 rounded border border-slate-600 text-xs">
                                <div className="mb-2"><span className="text-slate-500">Producto:</span> <span className="text-white">Fertilizante Foliar K</span></div>
                                <div className="mb-2 flex justify-between">
                                    <span>Salida:</span>
                                    <span className="text-red-400 font-bold">- 2 Litros</span>
                                </div>
                                <div className="text-[10px] text-blue-400 mt-1">
                                    * La app calcula el costo exacto basado en el precio de compra.
                                </div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h5 className="font-bold text-yellow-500 mb-2 flex items-center gap-2"><Sprout className="w-4 h-4"/> Venta Exportación</h5>
                            <p className="text-xs text-slate-400 mb-3">Registre ventas por calibres si es necesario en las notas.</p>
                            {/* Mock UI */}
                            <div className="bg-slate-900 p-3 rounded border border-slate-600 text-xs">
                                <div className="mb-2"><span className="text-slate-500">Cultivo:</span> <span className="text-white">Aguacate Hass</span></div>
                                <div className="mb-2"><span className="text-slate-500">Cantidad:</span> <span className="text-white">2.5 Toneladas</span></div>
                                <div className="mb-2"><span className="text-slate-500">Valor Total:</span> <span className="text-emerald-400 font-bold font-mono">$ 12.500.000</span></div>
                            </div>
                        </div>
                    </div>
                </div>
             )}

             {activeCrop === 'platano' && (
                <div className="space-y-4">
                    <h4 className="text-xl font-bold text-white">Gestión Plátano / Banano</h4>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h5 className="font-bold text-amber-500 mb-2 flex items-center gap-2"><Pickaxe className="w-4 h-4"/> Labores Culturales</h5>
                            <p className="text-xs text-slate-400 mb-3">Deshije, Deshoje y Embolse son costos altos.</p>
                            {/* Mock UI */}
                            <div className="bg-slate-900 p-3 rounded border border-slate-600 text-xs">
                                <div className="mb-2"><span className="text-slate-500">Labor:</span> <span className="text-white">Deshije y Plateo</span></div>
                                <div className="mb-2"><span className="text-slate-500">Lote:</span> <span className="text-purple-400">Lote El Río</span></div>
                                <div className="mb-2"><span className="text-slate-500">Valor:</span> <span className="text-white">$ 60.000 (Jornal)</span></div>
                            </div>
                        </div>

                        <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                            <h5 className="font-bold text-yellow-500 mb-2 flex items-center gap-2"><Sprout className="w-4 h-4"/> Venta Semanal</h5>
                            <p className="text-xs text-slate-400 mb-3">El plátano da flujo de caja constante. Registre cada corte.</p>
                            {/* Mock UI */}
                            <div className="bg-slate-900 p-3 rounded border border-slate-600 text-xs">
                                <div className="mb-2"><span className="text-slate-500">Producto:</span> <span className="text-white">Plátano Dominico</span></div>
                                <div className="mb-2"><span className="text-slate-500">Cantidad:</span> <span className="text-white">40 Canastillas</span></div>
                                <div className="mb-2"><span className="text-slate-500">Total Venta:</span> <span className="text-emerald-400 font-bold">$ 1.200.000</span></div>
                            </div>
                        </div>
                    </div>
                </div>
             )}
          </div>
        );

      case 'inventory':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <Calculator className="w-6 h-6 text-blue-400" />
                    Matemática de Inventario
                </h4>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <h5 className="font-bold text-blue-300 mb-3">1. Conversión de Unidades Inteligente</h5>
                    <div className="flex items-center gap-4 text-xs text-slate-300 bg-slate-900/50 p-4 rounded-lg">
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-1">1</div>
                            <div className="uppercase font-bold text-blue-500">Bulto (50kg)</div>
                        </div>
                        <ArrowRight className="w-6 h-6 text-slate-500" />
                        <div className="text-center">
                            <div className="text-2xl font-bold text-white mb-1">50.000</div>
                            <div className="uppercase font-bold text-emerald-500">Gramos</div>
                        </div>
                    </div>
                    <p className="mt-3 text-sm text-slate-400">
                        La app guarda todo en gramos o mililitros internamente. Si usted gasta "200 gramos" de un bulto, el sistema descuenta exactamente esa fracción.
                    </p>
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <h5 className="font-bold text-purple-300 mb-3">2. Costo Promedio Ponderado</h5>
                    <p className="text-sm text-slate-400 mb-4">
                        Si compra insumos a diferentes precios, ¿cuál es el costo real? El sistema lo promedia.
                    </p>
                    {/* Visual Bar Graph CSS */}
                    <div className="space-y-2 text-xs">
                        <div className="flex items-center gap-2">
                            <div className="w-20 text-right text-slate-400">Compra 1</div>
                            <div className="flex-1 bg-blue-900/30 h-6 rounded relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-blue-500" style={{width: '60%'}}></div>
                                <span className="absolute top-1 left-2 text-white font-bold drop-shadow-md">$40.000</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="w-20 text-right text-slate-400">Compra 2</div>
                            <div className="flex-1 bg-blue-900/30 h-6 rounded relative overflow-hidden">
                                <div className="absolute top-0 left-0 h-full bg-blue-400" style={{width: '80%'}}></div>
                                <span className="absolute top-1 left-2 text-white font-bold drop-shadow-md">$50.000 (Más caro)</span>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-600">
                            <div className="w-20 text-right text-purple-300 font-bold">PROMEDIO</div>
                            <div className="flex-1 bg-purple-900/30 h-8 rounded relative overflow-hidden border border-purple-500">
                                <div className="absolute top-0 left-0 h-full bg-purple-500" style={{width: '70%'}}></div>
                                <span className="absolute top-2 left-2 text-white font-bold drop-shadow-md">$45.000 (Costo Real)</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );

      case 'analysis':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-6 h-6 text-purple-400" />
                    Interpretación de Ganancias (KPIs)
                </h4>

                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h5 className="font-bold text-emerald-400 mb-2">ROI (Retorno Inversión)</h5>
                        <div className="h-32 flex items-end justify-center gap-4 bg-slate-900/50 rounded-lg p-4 border border-slate-800">
                            {/* Visual Bars */}
                            <div className="flex flex-col items-center gap-1 w-12">
                                <div className="w-full bg-slate-600 h-16 rounded-t"></div>
                                <span className="text-[9px] text-slate-400">Gasto</span>
                            </div>
                            <div className="flex flex-col items-center gap-1 w-12">
                                <div className="w-full bg-emerald-500 h-24 rounded-t relative">
                                    <div className="absolute -top-6 left-1/2 transform -translate-x-1/2 bg-white text-emerald-700 text-[9px] font-bold px-1 rounded">+20%</div>
                                </div>
                                <span className="text-[9px] text-emerald-400 font-bold">Venta</span>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">
                            Si el ROI es positivo (barras verdes más altas), usted está ganando dinero por cada peso invertido.
                        </p>
                    </div>

                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h5 className="font-bold text-blue-400 mb-2">Margen Neto</h5>
                        <div className="relative h-32 bg-slate-900/50 rounded-lg overflow-hidden border border-slate-800 flex items-center justify-center">
                            <div className="w-32 h-32 rounded-full border-8 border-slate-700 relative">
                                <div className="absolute inset-0 rounded-full border-8 border-blue-500 border-t-transparent border-l-transparent transform rotate-45"></div>
                                <div className="absolute inset-0 flex items-center justify-center flex-col">
                                    <span className="text-2xl font-bold text-white">30%</span>
                                    <span className="text-[8px] text-slate-400">LIBRE</span>
                                </div>
                            </div>
                        </div>
                        <p className="text-xs text-slate-400 mt-3">
                            Es el porcentaje de dinero que le queda limpio después de pagar trabajadores, insumos y mantenimiento.
                        </p>
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
                <BookOpen className="w-8 h-8 text-emerald-500" />
                <span className="font-bold text-white hidden md:block">Manual Pro</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-1">
                <button onClick={() => setActiveSection('intro')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'intro' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <CheckCircle className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Inicio y Flujo</span>
                </button>
                <button onClick={() => setActiveSection('crops')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'crops' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <Sprout className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Casos por Cultivo</span>
                </button>
                <button onClick={() => setActiveSection('inventory')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'inventory' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <Calculator className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Costos Insumos</span>
                </button>
                <button onClick={() => setActiveSection('analysis')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'analysis' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <BarChart3 className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Análisis Financiero</span>
                </button>
            </div>

            <div className="p-4 border-t border-slate-800">
                <button onClick={generateManualPDF} className="w-full bg-slate-800 hover:bg-slate-700 text-white p-2 rounded-lg flex flex-col md:flex-row items-center justify-center gap-2 text-xs font-bold transition-colors border border-slate-700">
                    <Download className="w-4 h-4" />
                    <span className="hidden md:block">Descargar PDF</span>
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full bg-slate-900">
             {/* Header Mobile/Desktop */}
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                 <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    {activeSection === 'intro' && 'Introducción'}
                    {activeSection === 'crops' && 'Guía Práctica por Cultivo'}
                    {activeSection === 'inventory' && 'Cálculo de Costos'}
                    {activeSection === 'analysis' && 'Indicadores de Rentabilidad'}
                 </h3>
                 <button onClick={onClose} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-full text-slate-400 hover:text-white transition-colors">
                    <X className="w-5 h-5" />
                 </button>
             </div>

             {/* Scrollable Content */}
             <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
                 {renderContent()}
             </div>
        </div>

      </div>
    </div>
  );
};
