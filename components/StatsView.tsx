
import React, { useMemo, useState } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet, CalendarRange, Filter, Calendar, Percent, TrendingDown, Target } from 'lucide-react';

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
  // Date Range State
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth);
  const [useDateFilter, setUseDateFilter] = useState(true);

  // Helper to set ranges
  const setRange = (type: 'month' | '3months' | 'year' | 'today') => {
      const end = new Date();
      let start = new Date();
      
      switch(type) {
          case 'today':
              // Start and End are today
              break;
          case 'month':
              start = new Date(end.getFullYear(), end.getMonth(), 1);
              break;
          case '3months':
              start = new Date(end.getFullYear(), end.getMonth() - 2, 1);
              break;
          case 'year':
              start = new Date(end.getFullYear(), 0, 1);
              break;
      }
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setUseDateFilter(true);
  };

  // Filter Data based on Range
  const filterByDate = (dateString: string) => {
      if (!useDateFilter) return true;
      // Simple string comparison works for ISO YYYY-MM-DD
      return dateString >= startDate && dateString <= endDate;
  };

  const filteredMovements = useMemo(() => movements.filter(m => filterByDate(m.date)), [movements, startDate, endDate, useDateFilter]);
  const filteredLabor = useMemo(() => laborLogs.filter(l => filterByDate(l.date)), [laborLogs, startDate, endDate, useDateFilter]);
  const filteredHarvests = useMemo(() => harvests.filter(h => filterByDate(h.date)), [harvests, startDate, endDate, useDateFilter]);
  const filteredMaint = useMemo(() => maintenanceLogs.filter(m => filterByDate(m.date)), [maintenanceLogs, startDate, endDate, useDateFilter]);

  // 1. Calculate General Balance
  const financialSummary = useMemo(() => {
     const inventoryExpense = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
     const laborExpense = filteredLabor.reduce((acc, l) => acc + l.value, 0);
     const maintExpense = filteredMaint.reduce((acc, m) => acc + m.cost, 0);
     
     const totalExpenses = inventoryExpense + laborExpense + maintExpense;
     const totalIncome = filteredHarvests.reduce((acc, h) => acc + h.totalValue, 0);
     const profit = totalIncome - totalExpenses;

     // KPIs calculation
     // ROI = (Profit / Total Investment) * 100
     const roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;
     
     // Profit Margin = (Profit / Revenue) * 100
     const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

     return { inventoryExpense, laborExpense, maintExpense, totalExpenses, totalIncome, profit, roi, margin };
  }, [filteredMovements, filteredLabor, filteredMaint, filteredHarvests]);


  // 2. Calculate Expenses by Cost Center with Efficiency Metrics
  const expensesByCenter = useMemo(() => {
    const data: Record<string, { inventoryCost: number, laborCost: number, income: number }> = {};
    let totalGlobalExpense = 0;

    // Inventory Movements (OUT)
    filteredMovements.filter(m => m.type === 'OUT').forEach(m => {
        const key = m.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].inventoryCost += m.calculatedCost;
        if (m.costCenterId) totalGlobalExpense += m.calculatedCost;
    });

    // Labor Logs
    filteredLabor.forEach(l => {
        const key = l.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].laborCost += l.value;
        if (l.costCenterId) totalGlobalExpense += l.value;
    });

    // Harvest Income
    filteredHarvests.forEach(h => {
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
          
          // Lote ROI
          const lotRoi = totalLotCost > 0 ? (lotProfit / totalLotCost) * 100 : 0;

          return { 
              name, 
              ...values,
              totalLotCost,
              lotProfit,
              area,
              costPerHa,
              lotRoi,
              percent: totalGlobalExpense > 0 ? (totalLotCost / totalGlobalExpense) * 100 : 0 
          };
      })
      .filter(item => item.totalLotCost > 0 || item.income > 0)
      .sort((a, b) => b.totalLotCost - a.totalLotCost);
  }, [filteredMovements, costCenters, filteredLabor, filteredHarvests]);

  return (
    <div className="space-y-6 pb-20">
       <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center">
          <h2 className="text-white font-bold text-lg flex items-center justify-center gap-2">
             <BarChart3 className="w-5 h-5 text-purple-400" />
             Reporte Gerencial
          </h2>
          <p className="text-xs text-slate-400 mt-1">Estado de Resultados y Rentabilidad</p>
       </div>

       {/* FLEXIBLE DATE FILTERS */}
       <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
           
           <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className={`p-2 rounded-lg ${useDateFilter ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-200 text-slate-500'}`}>
                        <CalendarRange className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Rango de Fechas:</span>
                </div>
                
                <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg w-full sm:w-auto">
                    <button 
                        onClick={() => setUseDateFilter(false)} 
                        className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!useDateFilter ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}
                    >
                        Histórico
                    </button>
                    <button 
                        onClick={() => setRange('month')} 
                        className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${useDateFilter ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500'}`}
                    >
                        Filtrar
                    </button>
                </div>
           </div>
           
           {useDateFilter && (
               <div className="animate-fade-in pt-2 border-t border-slate-200 dark:border-slate-700">
                    
                    {/* Date Inputs */}
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Desde</label>
                            <input 
                                type="date" 
                                value={startDate}
                                onChange={(e) => setStartDate(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-xs font-bold outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Hasta</label>
                            <input 
                                type="date" 
                                value={endDate}
                                onChange={(e) => setEndDate(e.target.value)}
                                className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-xs font-bold outline-none"
                            />
                        </div>
                    </div>

                    {/* Quick Buttons */}
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button onClick={() => setRange('today')} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            Hoy
                        </button>
                        <button onClick={() => setRange('month')} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            Este Mes
                        </button>
                        <button onClick={() => setRange('3months')} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            Últimos 3 Meses
                        </button>
                        <button onClick={() => setRange('year')} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">
                            Este Año
                        </button>
                    </div>
               </div>
           )}
       </div>

       {/* BUSINESS INTELLIGENCE KPIs (NEW) */}
       <div className="grid grid-cols-2 gap-4">
           {/* ROI Card */}
           <div className={`p-4 rounded-xl border ${financialSummary.roi >= 0 ? 'bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200 dark:border-emerald-800' : 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-800'}`}>
                <div className="flex items-center gap-2 mb-2">
                    <Target className={`w-4 h-4 ${financialSummary.roi >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
                    <span className="text-xs font-bold uppercase text-slate-500">ROI (Retorno)</span>
                </div>
                <div className="flex items-baseline gap-1">
                    <span className={`text-2xl font-bold font-mono ${financialSummary.roi >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                        {financialSummary.roi.toFixed(1)}%
                    </span>
                    {financialSummary.roi > 0 && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                    {financialSummary.roi < 0 && <TrendingDown className="w-4 h-4 text-red-500" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">
                    {financialSummary.roi >= 0 
                        ? 'Estás recuperando la inversión y generando valor.' 
                        : 'Los costos superan a los ingresos en este periodo.'}
                </p>
           </div>

           {/* Margin Card */}
           <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                    <Percent className="w-4 h-4 text-blue-500" />
                    <span className="text-xs font-bold uppercase text-slate-500">Margen Neto</span>
                </div>
                <span className="text-2xl font-bold font-mono text-blue-600 dark:text-blue-400">
                    {financialSummary.margin.toFixed(1)}%
                </span>
                <p className="text-[10px] text-slate-400 leading-tight mt-1">
                    De cada $100 vendidos, te quedan ${financialSummary.margin.toFixed(0)} de utilidad real.
                </p>
           </div>
       </div>

       {/* FINANCIAL SUMMARY CARD */}
       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
           <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
               <Wallet className="w-4 h-4" /> 
               Balance {useDateFilter ? `(${startDate} al ${endDate})` : '(Histórico Total)'}
           </h3>
           
           <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-600 dark:text-slate-300">Ingresos (Cosechas)</span>
                   <span className="font-mono font-bold text-emerald-500">+ {formatCurrency(financialSummary.totalIncome)}</span>
               </div>
               <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
               <div className="flex justify-between items-center text-xs text-slate-500">
                   <span>Gastos Insumos (Salidas)</span>
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
                {expensesByCenter.length === 0 ? (
                    <div className="text-center py-6 text-slate-400 text-xs">
                        No hay movimientos registrados en este periodo.
                    </div>
                ) : (
                    expensesByCenter.map((item, idx) => (
                    <div key={idx} className="pb-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                        
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <span className="text-slate-800 dark:text-white font-bold text-base block">{item.name}</span>
                                <div className="flex gap-2 mt-1">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.lotProfit >= 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {item.lotProfit >= 0 ? 'Ganancia: ' : 'Pérdida: '} {formatCurrency(item.lotProfit)}
                                    </span>
                                    {item.lotRoi !== 0 && (
                                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${item.lotRoi >= 0 ? 'text-emerald-500 border-emerald-500/30' : 'text-red-500 border-red-500/30'}`}>
                                            ROI: {item.lotRoi.toFixed(0)}%
                                        </span>
                                    )}
                                </div>
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
                    ))
                )}
             </div>
       </div>
    </div>
  );
};
