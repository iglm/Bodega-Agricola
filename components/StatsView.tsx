import React, { useMemo } from 'react';
import { Movement, Supplier, CostCenter, LaborLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package } from 'lucide-react';

interface StatsViewProps {
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  laborLogs?: LaborLog[]; // NEW
}

export const StatsView: React.FC<StatsViewProps> = ({ 
    movements, 
    suppliers, 
    costCenters,
    laborLogs = [] // Default empty
}) => {
  
  // Calculate Expenses by Cost Center with Efficiency Metrics
  const expensesByCenter = useMemo(() => {
    const data: Record<string, { inventoryCost: number, laborCost: number }> = {};
    let totalGlobalExpense = 0;

    // 1. Sum Inventory Movements (OUT)
    movements.filter(m => m.type === 'OUT').forEach(m => {
        const key = m.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0 };
        
        data[key].inventoryCost += m.calculatedCost;
        if (m.costCenterId) totalGlobalExpense += m.calculatedCost;
    });

    // 2. Sum Labor Logs (NEW)
    laborLogs.forEach(l => {
        const key = l.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0 };

        data[key].laborCost += l.value;
        if (l.costCenterId) totalGlobalExpense += l.value;
    });
    
    // Transform to Display Data
    return Object.entries(data)
      .map(([id, values]) => {
          const center = costCenters.find(c => c.id === id);
          const name = center ? center.name : (id === 'unknown' ? 'Gastos Generales / Sin Lote' : 'Lote Eliminado');
          const area = center?.area;
          
          const totalLotCost = values.inventoryCost + values.laborCost;
          const costPerHa = area && area > 0 ? totalLotCost / area : 0;

          return { 
              name, 
              ...values,
              totalLotCost,
              area,
              costPerHa,
              percent: totalGlobalExpense > 0 ? (totalLotCost / totalGlobalExpense) * 100 : 0 
          };
      })
      .filter(item => item.totalLotCost > 0)
      .sort((a, b) => b.totalLotCost - a.totalLotCost);
  }, [movements, costCenters, laborLogs]);

  // Calculate Purchases by Supplier
  const purchasesBySupplier = useMemo(() => {
    const data: Record<string, number> = {};
    let totalPurchase = 0;

    movements.filter(m => m.type === 'IN' && m.supplierName).forEach(m => {
        const name = m.supplierName || 'Sin Asignar';
        data[name] = (data[name] || 0) + m.calculatedCost;
        totalPurchase += m.calculatedCost;
    });

    return Object.entries(data)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({
          name,
          value,
          percent: totalPurchase > 0 ? (value / totalPurchase) * 100 : 0
      }));
  }, [movements]);

  return (
    <div className="space-y-6 pb-20">
       <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center">
          <h2 className="text-white font-bold text-lg flex items-center justify-center gap-2">
             <BarChart3 className="w-5 h-5 text-purple-400" />
             Estadísticas & Costos Reales
          </h2>
          <p className="text-xs text-slate-400 mt-1">Insumos + Mano de Obra</p>
       </div>

       {/* COST CENTERS CHART */}
       <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
             <MapPin className="w-4 h-4" /> Costo Total de Producción por Lote
          </h3>
          
          {expensesByCenter.length === 0 ? (
             <div className="p-6 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-600">
                No hay datos de salidas ni jornales registrados.
             </div>
          ) : (
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                {expensesByCenter.map((item, idx) => (
                   <div key={idx} className="pb-4 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                      
                      {/* Title & Total */}
                      <div className="flex justify-between items-end mb-2">
                         <div>
                            <span className="text-slate-800 dark:text-white font-bold text-base block">{item.name}</span>
                            {item.area && (
                                <span className="text-[10px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 rounded">
                                    {item.area} Ha
                                </span>
                            )}
                         </div>
                         <div className="text-right">
                             <span className="text-slate-800 dark:text-white font-mono font-bold text-sm block">
                                 {formatCurrency(item.totalLotCost)}
                             </span>
                             {item.costPerHa > 0 && (
                                 <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold block">
                                     {formatCurrency(item.costPerHa)} / Ha
                                 </span>
                             )}
                         </div>
                      </div>

                      {/* Split Bar: Inventory vs Labor */}
                      <div className="w-full h-4 bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden flex mb-1">
                          {item.inventoryCost > 0 && (
                              <div 
                                style={{ width: `${(item.inventoryCost / item.totalLotCost) * 100}%` }}
                                className="h-full bg-purple-500"
                              ></div>
                          )}
                          {item.laborCost > 0 && (
                              <div 
                                style={{ width: `${(item.laborCost / item.totalLotCost) * 100}%` }}
                                className="h-full bg-amber-500"
                              ></div>
                          )}
                      </div>

                      {/* Legend */}
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 px-1">
                          <span className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                              Insumos: {formatCurrency(item.inventoryCost)}
                          </span>
                          <span className="flex items-center gap-1">
                              <div className="w-2 h-2 rounded-full bg-amber-500"></div>
                              Jornales: {formatCurrency(item.laborCost)}
                          </span>
                      </div>

                   </div>
                ))}
             </div>
          )}
       </div>

       {/* SUPPLIERS CHART */}
       <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
             <Users className="w-4 h-4" /> Compras por Proveedor
          </h3>
          
          {purchasesBySupplier.length === 0 ? (
             <div className="p-6 text-center text-slate-400 bg-white dark:bg-slate-800 rounded-xl border border-dashed border-slate-600">
                No hay datos de compras asignadas a proveedores.
             </div>
          ) : (
             <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                {purchasesBySupplier.map((item, idx) => (
                   <div key={item.name}>
                      <div className="flex justify-between text-sm mb-1">
                         <span className="text-slate-700 dark:text-slate-200 font-medium">{item.name}</span>
                         <span className="text-slate-600 dark:text-slate-400 font-mono">{formatCurrency(item.value)}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2.5 overflow-hidden">
                         <div 
                            className="bg-blue-500 h-2.5 rounded-full" 
                            style={{ width: `${item.percent}%` }}
                         ></div>
                      </div>
                      <div className="text-right text-[10px] text-slate-400 mt-0.5">{item.percent.toFixed(1)}%</div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};
