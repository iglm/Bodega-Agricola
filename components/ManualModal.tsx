import React from 'react';
import { X, BookOpen, Calculator, Scale, ShieldCheck, Tag, Users, Image as ImageIcon, Settings, UserCheck, TrendingUp, Calendar, Zap } from 'lucide-react';

interface ManualModalProps {
  onClose: () => void;
}

export const ManualModal: React.FC<ManualModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-3xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-900/30 p-2 rounded-lg border border-emerald-500/30">
              <BookOpen className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">Manual de Usuario V3.1</h3>
              <p className="text-xs text-slate-400 mt-1">Guía Administrativa y Operativa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8 text-slate-300">
          
          <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
             <h4 className="text-blue-400 font-bold mb-1">Novedades Recientes</h4>
             <ul className="list-disc list-inside text-sm text-slate-300">
                <li><strong>Semáforo de Vencimientos:</strong> Control visual de fechas de caducidad.</li>
                <li><strong>Calculadora de Dosis:</strong> Herramienta matemática para salidas de campo.</li>
                <li><strong>Presupuestos por Lote:</strong> Control financiero de costos por destino.</li>
             </ul>
          </div>

          {/* Section 1: Setup */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-400" />
              1. Administración de Maestros
            </h4>
            <div className="space-y-3 text-sm">
              <p>Antes de operar, configure los actores del sistema en el botón grande morado <strong>"MAESTROS"</strong>:</p>
              
              <div className="grid md:grid-cols-2 gap-3">
                <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                  <strong className="text-blue-300 block mb-1">Personal (Nuevo)</strong>
                  <p>Registre a los trabajadores (Mayordomos, Aplicadores) autorizados para retirar insumos. Esto permite trazabilidad de quién retiró el producto.</p>
                </div>

                <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                  <strong className="text-purple-300 block mb-1">Destinos y Presupuestos</strong>
                  <p>Al crear un Lote (ej: "Lote Maíz"), asigne un <strong>Presupuesto Máximo</strong>. El sistema le avisará con una barra roja si los gastos acumulados superan el dinero asignado.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Section 2: WAC */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              2. Costo Promedio Ponderado (CPP)
            </h4>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-sm">
               <p className="mb-2">El sistema calcula automáticamente el valor real del inventario:</p>
               <div className="bg-black/30 p-3 rounded font-mono text-xs text-emerald-200/80 mb-2">
                  Ejemplo:<br/>
                  Tiene 10 kg a $10.000<br/>
                  Compra 10 kg nuevos a $12.000<br/>
                  ------------------------------------<br/>
                  Nuevo Costo Promedio = $11.000 / kg
               </div>
               <p>
                 Al hacer una <strong>Salida</strong>, el costo se descuenta usando este promedio ($11.000). Esto garantiza que el valor de la bodega sea financieramente exacto.
               </p>
            </div>
          </section>

          {/* Section 3: Field Tools (NEW) */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Zap className="w-5 h-5 text-orange-400" />
              3. Herramientas de Campo (Nuevo)
            </h4>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
                <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                    <strong className="text-red-300 block mb-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> Control de Vencimientos
                    </strong>
                    <p>En el tablero principal, observe los indicadores de color en las fotos:</p>
                    <ul className="list-disc list-inside mt-2 text-slate-400 text-xs space-y-1">
                        <li><span className="text-red-400 font-bold">ROJO:</span> Producto Vencido. Priorizar uso o descarte.</li>
                        <li><span className="text-yellow-400 font-bold">AMARILLO:</span> Vence en menos de 60 días.</li>
                        <li><span className="text-emerald-400 font-bold">VERDE:</span> Producto Fresco.</li>
                    </ul>
                </div>

                <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                    <strong className="text-blue-300 block mb-1 flex items-center gap-1">
                        <Calculator className="w-3 h-3" /> Calculadora de Dosis
                    </strong>
                    <p>Al registrar una salida (gasto), pulse el botón <strong>"Calculadora de Dosis"</strong>.</p>
                    <p className="mt-2 text-xs text-slate-400">
                        Solo ingrese la <strong>Dosis (cc/gr)</strong> y el <strong>N° de Bombadas</strong>. El sistema hará la matemática y descontará la cantidad exacta en Litros o Kilos.
                    </p>
                </div>
            </div>
          </section>

          {/* Section 4: Orders */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-yellow-500" />
              4. Generador de Pedidos
            </h4>
            <div className="text-sm">
                <p>
                    Vaya al botón de <strong>Exportar (Descarga)</strong>. Encontrará la opción: 
                    <span className="text-blue-400 font-bold mx-1">Generar Pedido Sugerido</span>.
                </p>
                <p className="mt-2 text-slate-400">
                    Esto crea un PDF automático analizando qué productos están por debajo del "Stock Mínimo" y sugiere cuánto comprar para reabastecer la bodega.
                </p>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="bg-slate-900 p-4 border-t border-slate-700 flex justify-between items-center">
            <p className="text-[10px] text-slate-500">Desarrollado por Lucas Mateo Tabares Franco</p>
            <button 
                onClick={onClose}
                className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2 rounded-lg text-sm font-bold transition-colors"
            >
                Entendido
            </button>
        </div>

      </div>
    </div>
  );
};