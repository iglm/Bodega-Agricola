
import React, { useState } from 'react';
import { X, BookOpen, Calculator, TrendingUp, Sprout, Pickaxe, Package, BarChart3, ArrowRight, HelpCircle, Download, DollarSign, Tractor, Umbrella, Globe, Database, FileText } from 'lucide-react';
import { generateManualPDF } from '../services/reportService';

interface ManualModalProps {
  onClose: () => void;
}

type Section = 'intro' | 'modules' | 'finance' | 'tips' | 'data';

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  const [activeSection, setActiveSection] = useState<Section>('intro');

  const renderContent = () => {
    switch (activeSection) {
      case 'intro':
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="bg-gradient-to-br from-emerald-900 to-slate-900 p-6 rounded-2xl border border-emerald-500/30 text-center relative overflow-hidden">
              <div className="relative z-10">
                <h4 className="text-3xl font-black text-white mb-2 tracking-tight">AgroSuite <span className="text-emerald-400">360</span></h4>
                <p className="text-emerald-200 font-medium">Sistema de Gerencia Agrícola Integral</p>
                <div className="mt-4 inline-block bg-white/10 px-3 py-1 rounded-full text-xs text-white border border-white/20">
                    Versión 4.0: Gestión Multi-Finca & Finanzas
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <h5 className="font-bold text-white flex items-center gap-2 border-b border-slate-700 pb-2">
                <Globe className="w-5 h-5 text-blue-500" />
                Filosofía: Gerencia Total
              </h5>
              <p className="text-sm text-slate-300 leading-relaxed text-justify">
                  AgroSuite 360 transforma la agricultura tradicional en una empresa agroindustrial basada en datos. 
                  A diferencia de un simple cuaderno, este sistema cruza información de <strong>Insumos, Mano de Obra, Maquinaria y Gastos Administrativos</strong> para revelarle el costo real de producción por kilo.
              </p>
              
              <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <h6 className="font-bold text-emerald-400 text-xs mb-1">Margen Operativo</h6>
                      <p className="text-[10px] text-slate-400">¿El cultivo es rentable por sí solo? (Ventas - Costos Directos).</p>
                  </div>
                  <div className="bg-slate-800 p-3 rounded-lg border border-slate-700">
                      <h6 className="font-bold text-blue-400 text-xs mb-1">Utilidad Neta Real</h6>
                      <p className="text-[10px] text-slate-400">¿La empresa es rentable? (Margen Op. - Gastos Admin).</p>
                  </div>
              </div>
            </div>

            <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30 mt-4">
               <p className="text-sm text-slate-300 flex gap-3 items-start">
                  <HelpCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <span>
                    <strong>Gestión Multi-Sede:</strong><br/>
                    Ahora puede administrar múltiples fincas desde una sola aplicación. Use el selector en la parte superior izquierda (Icono <Globe className="w-3 h-3 inline"/>) para cambiar entre propiedades. Cada finca tiene su propio inventario, personal y contabilidad independiente.
                  </span>
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
                    <Package className="w-5 h-5" /> 1. Inventario Inteligente (CPP)
                </h4>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                    <p className="text-sm text-slate-300">
                        El sistema utiliza el método de <strong>Costo Promedio Ponderado</strong>. No importa si compró fertilizante caro ayer y barato hoy; el sistema promedia el valor del inventario para estabilizar sus costos de producción.
                    </p>
                    <div className="flex items-center gap-2 text-xs bg-slate-900/50 p-3 rounded border border-slate-700">
                        <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                        <span className="text-slate-400">Unidades Exactas:</span>
                        <span className="text-slate-200">El sistema convierte automáticamente Bultos a Gramos y Litros a Mililitros para dosis exactas.</span>
                    </div>
                </div>
             </div>

             {/* 2. MANO DE OBRA */}
             <div>
                <h4 className="text-lg font-bold text-amber-500 flex items-center gap-2 mb-3">
                    <Pickaxe className="w-5 h-5" /> 2. Nómina y Labores
                </h4>
                <div className="bg-slate-800 p-4 rounded-xl border border-slate-700 space-y-3">
                    <p className="text-sm text-slate-300">
                        Registre cada jornal o contrato. Puede asignar labores a <strong>Lotes específicos</strong> para saber cuánto le cuesta mantener cada sector de la finca.
                    </p>
                    <ul className="list-disc list-inside text-xs text-slate-400 space-y-1">
                        <li>Control de deudas a trabajadores (Liquidación).</li>
                        <li>Generación de comprobantes de pago PDF.</li>
                        <li>Historial detallado por trabajador.</li>
                    </ul>
                </div>
             </div>

             {/* 3. MAQUINARIA & LLUVIAS */}
             <div>
                <h4 className="text-lg font-bold text-orange-500 flex items-center gap-2 mb-3">
                    <Tractor className="w-5 h-5" /> 3. Gestión Técnica
                </h4>
                <div className="grid md:grid-cols-2 gap-4">
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <h5 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Tractor className="w-4 h-4 text-orange-400"/> Maquinaria</h5>
                        <p className="text-xs text-slate-400">
                            Cree sus máquinas (Tractores, Guadañas). Registre mantenimientos, repuestos y combustible. El sistema prorratea estos costos indirectos entre los lotes productivos.
                        </p>
                    </div>
                    <div className="bg-slate-800 p-3 rounded-xl border border-slate-700">
                        <h5 className="text-sm font-bold text-white mb-1 flex items-center gap-2"><Umbrella className="w-4 h-4 text-blue-400"/> Pluviometría</h5>
                        <p className="text-xs text-slate-400">
                            Registre los milímetros de lluvia diarios. El sistema genera gráficas para correlacionar clima vs. producción.
                        </p>
                    </div>
                </div>
             </div>

          </div>
        );

      case 'finance':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-6 h-6 text-indigo-400" />
                    El Cerebro Financiero
                </h4>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <h5 className="font-bold text-indigo-300 mb-3 uppercase text-xs">Más allá de los insumos</h5>
                    <p className="text-sm text-slate-300 mb-4">
                        Una finca quiebra a menudo por los "gastos invisibles" que no se anotan en el cuaderno de campo. AgroSuite 360 incluye un módulo exclusivo para:
                    </p>
                    <div className="space-y-2">
                        <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded border border-slate-700">
                            <div className="p-1.5 bg-red-900/30 rounded text-red-400"><DollarSign className="w-4 h-4"/></div>
                            <div>
                                <p className="text-xs font-bold text-white">Gastos Administrativos</p>
                                <p className="text-[10px] text-slate-400">Impuestos, servicios públicos, gasolina de gerencia, planes de celular.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 p-2 bg-slate-900/50 rounded border border-slate-700">
                            <div className="p-1.5 bg-emerald-900/30 rounded text-emerald-400"><TrendingUp className="w-4 h-4"/></div>
                            <div>
                                <p className="text-xs font-bold text-white">Otros Ingresos</p>
                                <p className="text-[10px] text-slate-400">Venta de madera, alquiler de maquinaria, préstamos bancarios.</p>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="bg-slate-800 p-5 rounded-xl border border-slate-700">
                    <h5 className="font-bold text-purple-300 mb-3 uppercase text-xs">Prorrateo Automático</h5>
                    <p className="text-sm text-slate-400">
                        ¿Cómo saber si el "Lote 1" es rentable si la factura de la luz es general?
                        <br/><br/>
                        El sistema distribuye automáticamente los costos administrativos y de maquinaria entre sus lotes basándose en el área (hectáreas) de cada uno. Esto le da una visión de <strong>Micro-Gerencia</strong> por lote.
                    </p>
                </div>
            </div>
        );

      case 'data':
        return (
            <div className="space-y-6 animate-fade-in">
                <h4 className="text-xl font-bold text-white flex items-center gap-2">
                    <Database className="w-6 h-6 text-orange-400" />
                    Seguridad y Datos
                </h4>

                <div className="bg-orange-900/10 p-5 rounded-xl border border-orange-500/30">
                    <h5 className="font-bold text-orange-400 mb-2 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4" /> Política Offline-First
                    </h5>
                    <p className="text-sm text-slate-300 leading-relaxed">
                        AgroSuite 360 está diseñada para el campo profundo. 
                        <strong> Sus datos viven en su dispositivo, no en la nube.</strong> 
                        Esto garantiza velocidad y privacidad total, pero requiere responsabilidad.
                    </p>
                </div>

                <div className="space-y-4">
                    <h5 className="font-bold text-white text-sm">Protocolo de Seguridad Recomendado:</h5>
                    
                    <div className="flex gap-4 items-start">
                        <div className="bg-slate-800 p-3 rounded-lg text-center min-w-[80px]">
                            <span className="block text-2xl font-bold text-emerald-500">1</span>
                            <span className="text-[10px] text-slate-400 uppercase">Semanal</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-200">Exportar Backup JSON</p>
                            <p className="text-xs text-slate-400">
                                Vaya a <span className="text-orange-400">Base de Datos</span> (icono naranja arriba) y descargue la "Copia de Seguridad". Envíese ese archivo por WhatsApp o correo.
                            </p>
                        </div>
                    </div>

                    <div className="flex gap-4 items-start">
                        <div className="bg-slate-800 p-3 rounded-lg text-center min-w-[80px]">
                            <span className="block text-2xl font-bold text-blue-500">2</span>
                            <span className="text-[10px] text-slate-400 uppercase">Mensual</span>
                        </div>
                        <div>
                            <p className="text-sm font-bold text-slate-200">Reporte Gerencial PDF</p>
                            <p className="text-xs text-slate-400">
                                Genere el "Informe Unificado" en la sección de Reportes y guárdelo como evidencia contable del mes.
                            </p>
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
                <BookOpen className="w-8 h-8 text-emerald-500" />
                <span className="font-bold text-white hidden md:block">Manual Oficial</span>
            </div>
            
            <div className="flex-1 overflow-y-auto py-4 space-y-1">
                <button onClick={() => setActiveSection('intro')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'intro' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <Globe className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Visión General</span>
                </button>
                <button onClick={() => setActiveSection('modules')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'modules' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <Sprout className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Módulos Operativos</span>
                </button>
                <button onClick={() => setActiveSection('finance')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'finance' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <DollarSign className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Finanzas & Admin</span>
                </button>
                <button onClick={() => setActiveSection('data')} className={`w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-slate-800 transition-colors ${activeSection === 'data' ? 'bg-slate-800 border-r-4 border-emerald-500' : 'text-slate-400'}`}>
                    <Database className="w-5 h-5" />
                    <span className="hidden md:block text-sm font-bold">Seguridad de Datos</span>
                </button>
            </div>

            <div className="p-4 border-t border-slate-800">
                <button onClick={generateManualPDF} className="w-full bg-emerald-700 hover:bg-emerald-600 text-white p-3 rounded-lg flex flex-col md:flex-row items-center justify-center gap-2 text-xs font-bold transition-colors shadow-lg shadow-emerald-900/20">
                    <FileText className="w-4 h-4" />
                    <span className="hidden md:block">Bajar Manual PDF</span>
                </button>
            </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col h-full bg-slate-900">
             {/* Header Mobile/Desktop */}
             <div className="p-4 border-b border-slate-800 flex justify-between items-center bg-slate-900">
                 <h3 className="text-white font-bold text-lg flex items-center gap-2">
                    {activeSection === 'intro' && 'Filosofía y Alcance'}
                    {activeSection === 'modules' && 'Guía de Operación Diaria'}
                    {activeSection === 'finance' && 'Control de Costos Ocultos'}
                    {activeSection === 'data' && 'Protocolos de Seguridad'}
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
