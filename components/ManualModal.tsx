
import React from 'react';
import { X, BookOpen, Calculator, Settings, TrendingUp, Calendar, Zap, Sprout, Tractor, Lock } from 'lucide-react';

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
              <h3 className="text-white font-bold text-lg leading-none">Manual de Usuario V4.0</h3>
              <p className="text-xs text-slate-400 mt-1">Suite de Gerencia Agrícola</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-8 text-slate-300">
          
          <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-r-lg">
             <h4 className="text-blue-400 font-bold mb-1">Novedades Versión Gerencial</h4>
             <ul className="list-disc list-inside text-sm text-slate-300">
                <li><strong>Módulo de Cosechas:</strong> Registro de producción e ingresos.</li>
                <li><strong>Gestión de Maquinaria:</strong> Hoja de vida y costos de mantenimiento.</li>
                <li><strong>Integración Total:</strong> Ahora puede enviar insumos desde la bodega directamente a una Máquina.</li>
             </ul>
          </div>

          {/* Section 1: Security */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Lock className="w-5 h-5 text-red-400" />
              1. Seguridad y Roles
            </h4>
            <div className="text-sm bg-slate-900/50 p-4 rounded-xl border border-slate-700">
              <p className="mb-2">El sistema cuenta con un <strong>PIN DE SEGURIDAD</strong>. Este debe ser configurado por el dueño o administrador.</p>
              <ul className="space-y-2 mt-2">
                  <li className="flex gap-2">
                      <span className="text-red-400 font-bold">Bloqueado (Sin PIN):</span>
                      <span>Operario solo puede ver inventario, registrar lluvias y ver tareas. No ve precios totales ni ganancias.</span>
                  </li>
                  <li className="flex gap-2">
                      <span className="text-emerald-400 font-bold">Desbloqueado (Con PIN):</span>
                      <span>Acceso a Configuración, Maestros, Eliminar registros, Ver utilidades financieras y Exportar datos.</span>
                  </li>
              </ul>
            </div>
          </section>

          {/* Section 2: Production */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Sprout className="w-5 h-5 text-yellow-500" />
              2. Producción y Cosechas
            </h4>
            <div className="text-sm">
                <p>
                    Fundamental para calcular la rentabilidad. Cada vez que recolecte o venda producto:
                </p>
                <ol className="list-decimal list-inside mt-2 space-y-1 text-slate-400">
                    <li>Vaya a la pestaña <strong>Producción</strong>.</li>
                    <li>Seleccione el Lote de origen (Ej: Lote Café Norte).</li>
                    <li>Ingrese la cantidad (Kg, Arrobas) y el <strong>Valor Total de Venta</strong>.</li>
                </ol>
                <p className="mt-2 text-emerald-400 text-xs italic">
                    El sistema cruzará automáticamente estos ingresos contra los gastos de insumos y mano de obra para decirle si el lote dio ganancia o pérdida.
                </p>
            </div>
          </section>

          {/* Section 3: Machinery */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Tractor className="w-5 h-5 text-orange-500" />
              3. Gestión de Maquinaria
            </h4>
            <div className="text-sm space-y-2">
                <p>Ahora puede llevar la hoja de vida de sus equipos (Tractores, Guadañas, Bombas).</p>
                <div className="grid md:grid-cols-2 gap-3">
                    <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                        <strong className="text-orange-300 block mb-1">Mantenimientos Directos</strong>
                        <p className="text-xs">En la pestaña <strong>Gestión {'>'} Maquinaria</strong>, registre cambios de aceite, reparaciones mecánicas o combustible comprado en bomba.</p>
                    </div>
                    <div className="bg-slate-700/30 p-3 rounded-lg border border-slate-600">
                        <strong className="text-purple-300 block mb-1">Repuestos de Bodega</strong>
                        <p className="text-xs">Al hacer una <strong>Salida de Inventario</strong>, cambie el interruptor de "¿Para dónde va?" a <strong>Maquinaria</strong>. El sistema descontará el repuesto de bodega y cargará el costo a la máquina seleccionada.</p>
                    </div>
                </div>
            </div>
          </section>

          {/* Section 4: Inventory & Costs */}
          <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <Calculator className="w-5 h-5 text-emerald-400" />
              4. Inventario y Costos (CPP)
            </h4>
            <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700/50 text-sm">
               <p className="mb-2">El sistema usa el método contable de <strong>Promedio Ponderado</strong>:</p>
               <div className="bg-black/30 p-3 rounded font-mono text-xs text-emerald-200/80 mb-2">
                  Ejemplo:<br/>
                  Tiene 10 kg a $10.000<br/>
                  Compra 10 kg nuevos a $12.000<br/>
                  ------------------------------------<br/>
                  Nuevo Costo Promedio = $11.000 / kg
               </div>
            </div>
          </section>

           {/* Section 5: Reports */}
           <section>
            <h4 className="text-white font-bold text-lg mb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-400" />
              5. Reportes Gerenciales
            </h4>
            <div className="text-sm">
                <p>En el botón <strong>Exportar (Descarga)</strong> encontrará los nuevos reportes:</p>
                <ul className="list-disc list-inside mt-2 text-slate-400 text-xs space-y-1">
                    <li><strong>Reporte de Cosechas:</strong> Resumen de ingresos por cultivo y fecha.</li>
                    <li><strong>Reporte de Maquinaria:</strong> Detalle de gastos por máquina (Repuestos + Mantenimientos).</li>
                    <li><strong>Estado de Resultados:</strong> (En pantalla Estadísticas) Vea la utilidad neta real del negocio.</li>
                </ul>
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
