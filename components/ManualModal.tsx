
import React from 'react';
import { X, BookOpen, Calculator, Settings, TrendingUp, Calendar, Zap, Sprout, Tractor, Lock, Wallet, MousePointerClick, Coffee, Activity } from 'lucide-react';

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
              <h3 className="text-white font-bold text-lg leading-none">Guía de Gestión Cafetera</h3>
              <p className="text-xs text-slate-400 mt-1">Manual Técnico y Análisis Empresarial</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8 text-slate-300">
          
          <div className="bg-gradient-to-r from-emerald-900/40 to-slate-900 p-4 rounded-xl border-l-4 border-emerald-500">
             <h4 className="text-emerald-400 font-bold mb-2 flex items-center gap-2">
                 <Coffee className="w-4 h-4" /> Caso de Estudio: Finca "La Esperanza"
             </h4>
             <p className="text-sm text-slate-300">
                 Este manual utiliza ejemplos reales basados en una finca cafetera colombiana para explicar cómo ingresar datos y, lo más importante, <strong>cómo analizarlos para ganar más dinero.</strong>
             </p>
          </div>

          {/* Module 1: Insumos */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              1. Control de Costos (Inventario)
            </h4>
            <div className="text-sm space-y-3">
                <p>El error #1 es no saber cuánto vale aplicar una bomba de fumigación. El sistema usa <strong>Promedio Ponderado</strong> para solucionar esto.</p>
                
                <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700">
                    <strong className="text-blue-300 block mb-1">Ejemplo Real:</strong>
                    <ul className="list-disc list-inside text-slate-400 space-y-1">
                        <li>Compra 10 litros de Fertilizante Foliar a $40.000 c/u.</li>
                        <li>A la semana, el precio sube y compra 5 litros a $50.000.</li>
                        <li>El sistema recalcula automáticamente: Su costo promedio ya no es $40.000, ahora es <strong>$43.333 por litro</strong>.</li>
                    </ul>
                    <p className="mt-2 text-xs text-slate-500 italic">
                        Al sacar el producto para el "Lote El Guamo", el sistema descontará el valor exacto ($43.333), permitiéndole saber el costo real de la fertilización.
                    </p>
                </div>
            </div>
          </section>

          {/* Module 2: Labores */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-400" />
              2. Mano de Obra y Nómina
            </h4>
            <div className="text-sm space-y-3">
                <p>Registre cada jornal diariamente, aunque pague quincenalmente. Esto evita "fugas" de dinero y olvidos.</p>
                <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                        <strong className="text-amber-300 block mb-1">Ejemplo: Plateo</strong>
                        <p className="text-xs">
                            Don Pedro envía a "Juan" a platear el "Lote 1". Registra el jornal en la app ($60.000). El sistema carga ese costo al Lote 1 automáticamente.
                        </p>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                        <strong className="text-amber-300 block mb-1">Ejemplo: Recolección</strong>
                        <p className="text-xs">
                            Si paga por kilos, registre en "Valor Jornal" el total del día (Ej: 100kg a $800 = $80.000). En notas escriba "100kg recolección".
                        </p>
                    </div>
                </div>
            </div>
          </section>

          {/* Module 3: Production */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-yellow-500" />
              3. Producción (Ingresos)
            </h4>
            <div className="text-sm bg-slate-900/50 p-4 rounded-xl border border-slate-700">
               <p className="mb-2">Para saber si una finca es negocio, hay que registrar cada venta.</p>
               <ol className="list-decimal list-inside space-y-2 text-slate-400">
                   <li>Vende 2 cargas de café pergamino seco.</li>
                   <li>Va a la pestaña <strong>Producción</strong>.</li>
                   <li>Selecciona el lote de origen (Ej: Lote La Cañada).</li>
                   <li>Ingresa el valor total de la venta (Ej: $3.800.000).</li>
               </ol>
               <p className="mt-2 text-emerald-400 text-xs font-bold">
                   ¡Importante! Sin este paso, el sistema le dirá que está perdiendo dinero, porque solo vería gastos.
               </p>
            </div>
          </section>

           {/* Module 4: KPIs (New Analysis) */}
           <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              4. Análisis Empresarial (KPIs)
            </h4>
            <div className="text-sm space-y-4">
                <p>En la pestaña <strong>Reportes</strong>, encontrará dos nuevos indicadores vitales para la toma de decisiones:</p>
                
                {/* ROI Explanation */}
                <div className="flex gap-3">
                    <div className="bg-purple-500/20 p-2 h-fit rounded-lg">
                        <TrendingUp className="w-5 h-5 text-purple-400" />
                    </div>
                    <div>
                        <h5 className="font-bold text-white">ROI (Retorno de Inversión)</h5>
                        <p className="text-slate-400 text-xs mt-1">
                            Responde a: <em>"¿Por cada $1.000 pesos que metí a la finca, cuántos recuperé?"</em>
                        </p>
                        <ul className="text-xs text-slate-500 list-disc list-inside mt-1 bg-black/20 p-2 rounded">
                            <li><strong>ROI Positivo (Ej: 20%):</strong> El negocio es sano. Ganó 20 centavos por cada peso invertido.</li>
                            <li><strong>ROI Negativo (Ej: -10%):</strong> Cuidado. Está gastando más de lo que produce. Revise costos de fertilización o mano de obra.</li>
                        </ul>
                    </div>
                </div>

                {/* Margin Explanation */}
                <div className="flex gap-3">
                    <div className="bg-blue-500/20 p-2 h-fit rounded-lg">
                        <Wallet className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                        <h5 className="font-bold text-white">Margen Neto</h5>
                        <p className="text-slate-400 text-xs mt-1">
                            Responde a: <em>"De la plata que recibí por el café, ¿cuánto es realmente ganancia libre?"</em>
                        </p>
                        <p className="text-xs text-slate-500 mt-1">
                            Si vende $1.000.000 y su margen es 30%, significa que $700.000 se fueron en gastos y le quedaron $300.000 libres.
                        </p>
                    </div>
                </div>

                <div className="mt-2 bg-slate-700/30 p-2 rounded border border-slate-600">
                    <p className="text-xs text-slate-300">
                        <MousePointerClick className="w-3 h-3 inline mr-1" />
                        <strong>Consejo de Experto:</strong> Use el filtro de fechas para comparar su ROI en época de cosecha (debe ser alto) vs. época de sostenimiento (será negativo, y es normal). Lo importante es que el <strong>Anual</strong> sea positivo.
                    </p>
                </div>
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
                Entendido, ir a la App
            </button>
        </div>

      </div>
    </div>
  );
};
