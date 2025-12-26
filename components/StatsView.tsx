import React, { useMemo } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet } from 'lucide-react';

interface StatsViewProps {
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  laborLogs?: LaborLog[];
  harvests?: HarvestLog[]; // New
  maintenanceLogs?: MaintenanceLog[]; // New
}

export const StatsView: React.FC<StatsViewProps> = ({ 
    movements, 
    suppliers, 
    costCenters,
    laborLogs = [],
    harvests = [],
    maintenanceLogs = []
}) => {
  
  // 1. Calculate General Balance
  const financialSummary = useMemo(() => {
     const inventoryExpense = movements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
     const laborExpense = laborLogs.reduce((acc, l) => acc + l.value, 0);
     const maintExpense = maintenanceLogs.reduce((acc, m) => acc + m.cost, 0);
     
     const totalExpenses = inventoryExpense + laborExpense + maintExpense;
     const totalIncome = harvests.reduce((acc, h) => acc + h.totalValue, 0);
     const profit = totalIncome - totalExpenses;

     return { inventoryExpense, laborExpense, maintExpense, totalExpenses, totalIncome, profit };
  }, [movements, laborLogs, maintenanceLogs, harvests]);


  // 2. Calculate Expenses by Cost Center with Efficiency Metrics
  const expensesByCenter = useMemo(() => {
    const data: Record<string, { inventoryCost: number, laborCost: number, income: number }> = {};
    let totalGlobalExpense = 0;

    // Inventory Movements (OUT)
    movements.filter(m => m.type === 'OUT').forEach(m => {
        const key = m.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].inventoryCost += m.calculatedCost;
        if (m.costCenterId) totalGlobalExpense += m.calculatedCost;
    });

    // Labor Logs
    laborLogs.forEach(l => {
        const key = l.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].laborCost += l.value;
        if (l.costCenterId) totalGlobalExpense += l.value;
    });

    // Harvest Income
    harvests.forEach(h => {
        const key = h.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].income += h.totalValue;
    });
    
    // Transform to Display Data
    return Object.entries(data)
      .map(([id, values]) => {
          const center = costCenters.find(c => c.id === id);
          const name = center ? center.name : (id === 'unknown' ? 'Gastos Generales / Sin Lote' : 'Lote Eliminado');
          const area = center?.area;
          
          const totalLotCost = values.inventoryCost + values.laborCost;
          const lotProfit = values.income - totalLotCost;
          const costPerHa = area && area > 0 ? totalLotCost / area : 0;

          return { 
              name, 
              ...values,
              totalLotCost,
              lotProfit,
              area,
              costPerHa,
              percent: totalGlobalExpense > 0 ? (totalLotCost / totalGlobalExpense) * 100 : 0 
          };
      })
      .filter(item => item.totalLotCost > 0 || item.income > 0)
      .sort((a, b) => b.totalLotCost - a.totalLotCost);
  }, [movements, costCenters, laborLogs, harvests]);

  return (
    <div className="space-y-6 pb-20">
       <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center">
          <h2 className="text-white font-bold text-lg flex items-center justify-center gap-2">
             <BarChart3 className="w-5 h-5 text-purple-400" />
             Reporte Gerencial
          </h2>
          <p className="text-xs text-slate-400 mt-1">Estado de Resultados</p>
       </div>

       {/* FINANCIAL SUMMARY CARD */}
       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
           <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
               <Wallet className="w-4 h-4" /> Balance General
           </h3>
           
           <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-600 dark:text-slate-300">Ingresos (Cosechas)</span>
                   <span className="font-mono font-bold text-emerald-500">+ {formatCurrency(financialSummary.totalIncome)}</span>
               </div>
               <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
               <div className="flex justify-between items-center text-xs text-slate-500">
                   <span>Gastos Insumos</span>
                   <span>- {formatCurrency(financialSummary.inventoryExpense)}</span>
               </div>
               <div className="flex justify-between items-center text-xs text-slate-500">
                   <span>Gastos Mano de Obra</span>
                   <span>- {formatCurrency(financialSummary.laborExpense)}</span>
               </div>
               <div className="flex justify-between items-center text-xs text-slate-500">
                   <span>Gastos Maquinaria</span>
                   <span>- {formatCurrency(financialSummary.maintExpense)}</span>
               </div>
               <div className="w-full border-t border-slate-200 dark:border-slate-600 my-2"></div>
               
               <div className="flex justify-between items-center text-lg">
                   <span className="font-bold text-slate-800 dark:text-white">Utilidad Neta</span>
                   <span className={`font-mono font-bold ${financialSummary.profit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                       {formatCurrency(financialSummary.profit)}
                   </span>
               </div>
           </div>
       </div>

       {/* PROFITABILITY BY LOT */}
       <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
             <Sprout className="w-4 h-4" /> Rentabilidad por Lote
          </h3>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
                {expensesByCenter.map((item, idx) => (
                   <div key={idx} className="pb-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                      
                      <div className="flex justify-between items-start mb-2">
                         <div>
                            <span className="text-slate-800 dark:text-white font-bold text-base block">{item.name}</span>
                            <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${item.lotProfit >= 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                {item.lotProfit >= 0 ? 'Ganancia: ' : 'Pérdida: '} {formatCurrency(item.lotProfit)}
                            </span>
                         </div>
                      </div>

                      {/* Visual Bar: Income vs Expense */}
                      <div className="relative h-6 bg-slate-100 dark:bg-slate-900 rounded-md overflow-hidden flex text-[10px] font-bold text-white items-center">
                          {/* Expense Bar */}
                          <div style={{ width: '50%' }} className="h-full bg-red-500/20 flex justify-end items-center pr-2 border-r border-slate-500/20">
                              <span className="text-red-500">{formatCurrency(item.totalLotCost)}</span>
                          </div>
                          {/* Income Bar */}
                          <div style={{ width: '50%' }} className="h-full bg-emerald-500/20 flex justify-start items-center pl-2">
                              <span className="text-emerald-500">{formatCurrency(item.income)}</span>
                          </div>
                      </div>
                      <div className="flex justify-between text-[9px] text-slate-400 mt-1 px-1">
                          <span>GASTOS</span>
                          <span>INGRESOS</span>
                      </div>

                   </div>
                ))}
             </div>
       </div>
    </div>
  );
};
