
import React, { useMemo, useState } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet, CalendarRange, Filter, Calendar, Percent, TrendingDown, Target, Layers, CloudRain, Zap, Landmark, MousePointer2 } from 'lucide-react';

interface StatsViewProps {
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  laborLogs?: LaborLog[];
  harvests?: HarvestLog[]; 
  maintenanceLogs?: MaintenanceLog[]; 
  rainLogs?: RainLog[];
  financeLogs?: FinanceLog[]; 
}

export const StatsView: React.FC<StatsViewProps> = ({ 
    movements, 
    suppliers, 
    costCenters,
    laborLogs = [],
    harvests = [],
    maintenanceLogs = [],
    rainLogs = [],
    financeLogs = []
}) => {
  // Date Range State
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth);
  const [useDateFilter, setUseDateFilter] = useState(true);
  
  // Lot Analysis State
  const [selectedLotId, setSelectedLotId] = useState<string>('');

  // Helper to set ranges
  const setRange = (type: 'month' | '3months' | 'year' | 'today') => {
      const end = new Date();
      let start = new Date();
      
      switch(type) {
          case 'today':
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
      return dateString >= startDate && dateString <= endDate;
  };

  const filteredMovements = useMemo(() => movements.filter(m => filterByDate(m.date)), [movements, startDate, endDate, useDateFilter]);
  const filteredLabor = useMemo(() => laborLogs.filter(l => filterByDate(l.date)), [laborLogs, startDate, endDate, useDateFilter]);
  const filteredHarvests = useMemo(() => harvests.filter(h => filterByDate(h.date)), [harvests, startDate, endDate, useDateFilter]);
  const filteredMaint = useMemo(() => maintenanceLogs.filter(m => filterByDate(m.date)), [maintenanceLogs, startDate, endDate, useDateFilter]);
  const filteredRain = useMemo(() => rainLogs.filter(r => filterByDate(r.date)), [rainLogs, startDate, endDate, useDateFilter]);
  const filteredFinance = useMemo(() => financeLogs.filter(f => filterByDate(f.date)), [financeLogs, startDate, endDate, useDateFilter]);

  // 1. Calculate General Balance
  const financialSummary = useMemo(() => {
     // Operational Costs
     const inventoryExpense = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
     const laborExpense = filteredLabor.reduce((acc, l) => acc + l.value, 0);
     const maintExpense = filteredMaint.reduce((acc, m) => acc + m.cost, 0);
     
     // Overhead Costs
     const generalExpense = filteredFinance.filter(f => f.type === 'EXPENSE').reduce((acc, f) => acc + f.amount, 0);
     
     const totalExpenses = inventoryExpense + laborExpense + maintExpense + generalExpense;
     
     // Income
     const harvestIncome = filteredHarvests.reduce((acc, h) => acc + h.totalValue, 0);
     const otherIncome = filteredFinance.filter(f => f.type === 'INCOME').reduce((acc, f) => acc + f.amount, 0);
     const totalIncome = harvestIncome + otherIncome;

     const profit = totalIncome - totalExpenses;

     const roi = totalExpenses > 0 ? (profit / totalExpenses) * 100 : 0;
     const margin = totalIncome > 0 ? (profit / totalIncome) * 100 : 0;

     // Breakdown percentages
     const pInputs = totalExpenses > 0 ? (inventoryExpense / totalExpenses) * 100 : 0;
     const pLabor = totalExpenses > 0 ? (laborExpense / totalExpenses) * 100 : 0;
     const pMaint = totalExpenses > 0 ? (maintExpense / totalExpenses) * 100 : 0;
     const pAdmin = totalExpenses > 0 ? (generalExpense / totalExpenses) * 100 : 0;

     return { 
         inventoryExpense, laborExpense, maintExpense, generalExpense,
         totalExpenses, totalIncome, profit, roi, margin,
         pInputs, pLabor, pMaint, pAdmin
     };
  }, [filteredMovements, filteredLabor, filteredMaint, filteredHarvests, filteredFinance]);


  // 2. Calculate Expenses by Cost Center (General Table)
  const expensesByCenter = useMemo(() => {
    const data: Record<string, { inventoryCost: number, laborCost: number, income: number }> = {};
    let totalGlobalExpense = 0;

    filteredMovements.filter(m => m.type === 'OUT').forEach(m => {
        const key = m.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].inventoryCost += m.calculatedCost;
        if (m.costCenterId) totalGlobalExpense += m.calculatedCost;
    });

    filteredLabor.forEach(l => {
        const key = l.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].laborCost += l.value;
        if (l.costCenterId) totalGlobalExpense += l.value;
    });

    filteredHarvests.forEach(h => {
        const key = h.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].income += h.totalValue;
    });
    
    return Object.entries(data)
      .map(([id, values]) => {
          const center = costCenters.find(c => c.id === id);
          const name = center ? center.name : (id === 'unknown' ? 'Gastos Generales / Sin Lote' : 'Lote Eliminado');
          const area = center?.area || 0;
          
          const totalLotCost = values.inventoryCost + values.laborCost;
          const lotProfit = values.income - totalLotCost;
          const costPerHa = area > 0 ? totalLotCost / area : 0;
          const lotRoi = totalLotCost > 0 ? (lotProfit / totalLotCost) * 100 : 0;

          return { 
              name, 
              ...values,
              totalLotCost,
              lotProfit,
              area,
              costPerHa,
              lotRoi
          };
      })
      .filter(item => item.totalLotCost > 0 || item.income > 0)
      .sort((a, b) => b.totalLotCost - a.totalLotCost);
  }, [filteredMovements, costCenters, filteredLabor, filteredHarvests]);

  // 3. Climate Correlation Data
  const correlationData = useMemo(() => {
      const monthlyStats: Record<string, { rain: number, income: number }> = {};
      const getMonthKey = (dateStr: string) => dateStr.substring(0, 7); 

      filteredRain.forEach(r => {
          const k = getMonthKey(r.date);
          if(!monthlyStats[k]) monthlyStats[k] = { rain: 0, income: 0 };
          monthlyStats[k].rain += r.millimeters;
      });

      filteredHarvests.forEach(h => {
          const k = getMonthKey(h.date);
          if(!monthlyStats[k]) monthlyStats[k] = { rain: 0, income: 0 };
          monthlyStats[k].income += h.totalValue;
      });

      return Object.entries(monthlyStats)
        .sort((a,b) => a[0].localeCompare(b[0]))
        .map(([key, val]) => ({ month: key, ...val }));
  }, [filteredRain, filteredHarvests]);

  // 4. LOT SPECIFIC STACKED CHART DATA (NEW)
  const lotDetailedStats = useMemo(() => {
      if (!selectedLotId) return null;

      // Calculate Proration Factor based on Area
      const totalArea = costCenters.reduce((acc, c) => acc + (c.area || 0), 0);
      const selectedLot = costCenters.find(c => c.id === selectedLotId);
      const lotArea = selectedLot?.area || 0;
      
      // If total area is 0, avoid division by zero. If lot area is 0, factor is 0.
      const prorationFactor = totalArea > 0 ? (lotArea / totalArea) : 0;

      const monthlyData: Record<string, { inputs: number, labor: number, machinery: number, admin: number, revenue: number }> = {};

      const getMonthKey = (dateStr: string) => dateStr.substring(0, 7); // YYYY-MM

      // A. Direct Inputs
      filteredMovements.forEach(m => {
          if (m.type === 'OUT' && m.costCenterId === selectedLotId) {
              const k = getMonthKey(m.date);
              if (!monthlyData[k]) monthlyData[k] = { inputs: 0, labor: 0, machinery: 0, admin: 0, revenue: 0 };
              monthlyData[k].inputs += m.calculatedCost;
          }
      });

      // B. Direct Labor
      filteredLabor.forEach(l => {
          if (l.costCenterId === selectedLotId) {
              const k = getMonthKey(l.date);
              if (!monthlyData[k]) monthlyData[k] = { inputs: 0, labor: 0, machinery: 0, admin: 0, revenue: 0 };
              monthlyData[k].labor += l.value;
          }
      });

      // C. Indirect Machinery (Prorated)
      filteredMaint.forEach(m => {
          const k = getMonthKey(m.date);
          if (!monthlyData[k]) monthlyData[k] = { inputs: 0, labor: 0, machinery: 0, admin: 0, revenue: 0 };
          monthlyData[k].machinery += (m.cost * prorationFactor);
      });

      // D. Indirect Admin (Prorated)
      filteredFinance.forEach(f => {
          if (f.type === 'EXPENSE') {
              const k = getMonthKey(f.date);
              if (!monthlyData[k]) monthlyData[k] = { inputs: 0, labor: 0, machinery: 0, admin: 0, revenue: 0 };
              monthlyData[k].admin += (f.amount * prorationFactor);
          }
      });

      // E. Revenue
      filteredHarvests.forEach(h => {
          if (h.costCenterId === selectedLotId) {
              const k = getMonthKey(h.date);
              if (!monthlyData[k]) monthlyData[k] = { inputs: 0, labor: 0, machinery: 0, admin: 0, revenue: 0 };
              monthlyData[k].revenue += h.totalValue;
          }
      });

      const chartData = Object.entries(monthlyData)
        .sort((a,b) => a[0].localeCompare(b[0]))
        .map(([month, data]) => {
            const totalCost = data.inputs + data.labor + data.machinery + data.admin;
            return { month, ...data, totalCost };
        });

      return {
          chartData,
          lotName: selectedLot?.name || 'Desconocido',
          prorationFactor
      };

  }, [selectedLotId, costCenters, filteredMovements, filteredLabor, filteredMaint, filteredFinance, filteredHarvests]);


  return (
    <div className="space-y-6 pb-20">
       <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center">
          <h2 className="text-white font-bold text-lg flex items-center justify-center gap-2">
             <BarChart3 className="w-5 h-5 text-purple-400" />
             Inteligencia de Negocio
          </h2>
          <p className="text-xs text-slate-400 mt-1">Análisis para Toma de Decisiones</p>
       </div>

       {/* FLEXIBLE DATE FILTERS */}
       <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
           {/* (Date Filter UI - same as before) */}
           <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className={`p-2 rounded-lg ${useDateFilter ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-200 text-slate-500'}`}>
                        <CalendarRange className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Rango de Análisis:</span>
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
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Desde</label>
                            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-xs font-bold outline-none" />
                        </div>
                        <div>
                            <label className="text-[10px] text-slate-500 font-bold uppercase ml-1">Hasta</label>
                            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-xs font-bold outline-none" />
                        </div>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        <button onClick={() => setRange('today')} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Hoy</button>
                        <button onClick={() => setRange('month')} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Este Mes</button>
                        <button onClick={() => setRange('3months')} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Últimos 3 Meses</button>
                        <button onClick={() => setRange('year')} className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 rounded-lg text-[10px] font-bold text-slate-600 dark:text-slate-300 whitespace-nowrap">Este Año</button>
                    </div>
               </div>
           )}
       </div>

       {/* COST STRUCTURE VISUALIZATION (GLOBAL) */}
       <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
           <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase mb-4 flex items-center gap-2">
               <Layers className="w-4 h-4" /> Estructura de Costos (Global)
           </h3>
           <div className="flex h-8 w-full rounded-full overflow-hidden bg-slate-100 dark:bg-slate-900">
               {financialSummary.pLabor > 0 && (
                   <div style={{ width: `${financialSummary.pLabor}%` }} className="bg-amber-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500">
                       {financialSummary.pLabor > 10 && `${financialSummary.pLabor.toFixed(0)}%`}
                   </div>
               )}
               {financialSummary.pInputs > 0 && (
                   <div style={{ width: `${financialSummary.pInputs}%` }} className="bg-emerald-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500">
                        {financialSummary.pInputs > 10 && `${financialSummary.pInputs.toFixed(0)}%`}
                   </div>
               )}
               {financialSummary.pMaint > 0 && (
                   <div style={{ width: `${financialSummary.pMaint}%` }} className="bg-orange-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500">
                        {financialSummary.pMaint > 10 && `${financialSummary.pMaint.toFixed(0)}%`}
                   </div>
               )}
               {financialSummary.pAdmin > 0 && (
                   <div style={{ width: `${financialSummary.pAdmin}%` }} className="bg-slate-500 h-full flex items-center justify-center text-[10px] font-bold text-white transition-all duration-500">
                        {financialSummary.pAdmin > 10 && `${financialSummary.pAdmin.toFixed(0)}%`}
                   </div>
               )}
           </div>
           
           <div className="flex justify-between mt-3 text-xs flex-wrap gap-2">
               <div className="flex items-center gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-amber-500"></div>
                   <span className="text-slate-600 dark:text-slate-300">Mano de Obra</span>
               </div>
               <div className="flex items-center gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                   <span className="text-slate-600 dark:text-slate-300">Insumos</span>
               </div>
               <div className="flex items-center gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-orange-500"></div>
                   <span className="text-slate-600 dark:text-slate-300">Maquinaria</span>
               </div>
               <div className="flex items-center gap-1.5">
                   <div className="w-3 h-3 rounded-full bg-slate-500"></div>
                   <span className="text-slate-600 dark:text-slate-300">Administrativo</span>
               </div>
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
                   <span className="text-slate-600 dark:text-slate-300">Ingresos (Cosechas + Otros)</span>
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
               <div className="flex justify-between items-center text-xs text-slate-500">
                   <span>Gastos Administrativos</span>
                   <span>- {formatCurrency(financialSummary.generalExpense)}</span>
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

        {/* --- STACKED BAR CHART: COST BREAKDOWN PER LOT (NEW) --- */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-md">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                        <MousePointer2 className="w-4 h-4 text-indigo-500" />
                        Micro-Gerencia por Lote
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                        Desglose mensual de costos directos e indirectos (prorrateados).
                    </p>
                </div>
            </div>

            {/* LOT SELECTOR */}
            <div className="mb-4">
                <select 
                    value={selectedLotId}
                    onChange={(e) => setSelectedLotId(e.target.value)}
                    className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-sm text-slate-700 dark:text-white outline-none focus:border-indigo-500"
                >
                    <option value="">-- Seleccionar Lote para Analizar --</option>
                    {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>

            {selectedLotId && lotDetailedStats && lotDetailedStats.chartData.length > 0 ? (
                <div className="mt-4">
                    {/* PRORATION INFO */}
                    <div className="text-[10px] text-slate-500 mb-4 bg-slate-50 dark:bg-slate-900/50 p-2 rounded border border-slate-200 dark:border-slate-700">
                        <span className="font-bold">Nota Contable:</span> Los costos de Maquinaria y Administrativos se estiman prorrateando el 
                        <span className="font-bold text-indigo-500"> {(lotDetailedStats.prorationFactor * 100).toFixed(1)}% </span> 
                        del gasto global (según área del lote).
                    </div>

                    {/* CHART CONTAINER */}
                    <div className="w-full overflow-x-auto">
                        <div className="min-w-[300px] h-64 flex items-end gap-2 pb-6 relative">
                            {/* Y-Axis Grid Lines (Simplified) */}
                            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-10">
                                <div className="border-t border-slate-500 w-full"></div>
                                <div className="border-t border-slate-500 w-full"></div>
                                <div className="border-t border-slate-500 w-full"></div>
                                <div className="border-t border-slate-500 w-full"></div>
                            </div>

                            {lotDetailedStats.chartData.map((data, idx) => {
                                const maxMonthlyCost = Math.max(...lotDetailedStats.chartData.map(d => d.totalCost));
                                const heightScale = maxMonthlyCost > 0 ? 200 / maxMonthlyCost : 0; // Scale to 200px max height

                                return (
                                    <div key={idx} className="flex-1 flex flex-col items-center group relative min-w-[40px]">
                                        {/* Total Label on Hover */}
                                        <div className="absolute bottom-full mb-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-800 text-white text-[9px] p-1 rounded z-10 whitespace-nowrap pointer-events-none">
                                            Total: {formatCurrency(data.totalCost)}
                                        </div>

                                        {/* STACKED BAR */}
                                        <div className="w-full max-w-[30px] flex flex-col-reverse rounded-t-sm overflow-hidden bg-slate-100 dark:bg-slate-700 relative">
                                            {/* 1. Inputs (Emerald) */}
                                            {data.inputs > 0 && (
                                                <div 
                                                    style={{ height: `${data.inputs * heightScale}px` }} 
                                                    className="w-full bg-emerald-500 hover:bg-emerald-400 transition-colors"
                                                    title={`Insumos: ${formatCurrency(data.inputs)}`}
                                                ></div>
                                            )}
                                            {/* 2. Labor (Amber) */}
                                            {data.labor > 0 && (
                                                <div 
                                                    style={{ height: `${data.labor * heightScale}px` }} 
                                                    className="w-full bg-amber-500 hover:bg-amber-400 transition-colors"
                                                    title={`Mano de Obra: ${formatCurrency(data.labor)}`}
                                                ></div>
                                            )}
                                            {/* 3. Machinery (Orange) */}
                                            {data.machinery > 0 && (
                                                <div 
                                                    style={{ height: `${data.machinery * heightScale}px` }} 
                                                    className="w-full bg-orange-500 hover:bg-orange-400 transition-colors"
                                                    title={`Maquinaria (Est): ${formatCurrency(data.machinery)}`}
                                                ></div>
                                            )}
                                            {/* 4. Admin (Slate/Blue) */}
                                            {data.admin > 0 && (
                                                <div 
                                                    style={{ height: `${data.admin * heightScale}px` }} 
                                                    className="w-full bg-slate-500 hover:bg-slate-400 transition-colors"
                                                    title={`Admin (Est): ${formatCurrency(data.admin)}`}
                                                ></div>
                                            )}
                                        </div>

                                        {/* X-Axis Label */}
                                        <span className="text-[9px] text-slate-500 mt-2 transform -rotate-45 origin-top-left translate-y-1">
                                            {data.month}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* LEGEND */}
                    <div className="flex flex-wrap justify-center gap-3 mt-2">
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                            <span className="text-[10px] text-slate-500">Insumos</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                            <span className="text-[10px] text-slate-500">Mano Obra</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                            <span className="text-[10px] text-slate-500">Maquinaria</span>
                        </div>
                        <div className="flex items-center gap-1">
                            <div className="w-2 h-2 bg-slate-500 rounded-full"></div>
                            <span className="text-[10px] text-slate-500">Admin</span>
                        </div>
                    </div>

                </div>
            ) : selectedLotId ? (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    No hay datos de costos para este lote en el rango de fechas seleccionado.
                </div>
            ) : (
                <div className="text-center py-8 text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                    Seleccione un lote arriba para ver el desglose detallado.
                </div>
            )}
        </div>

        {/* --- CLIMATE CORRELATION ANALYSIS --- */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg overflow-hidden">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
                        <Zap className="w-4 h-4 text-yellow-500" /> 
                        Correlación Lluvia vs Producción
                    </h3>
                    <p className="text-[10px] text-slate-400 mt-1">
                        ¿Cómo afecta el clima a sus ingresos mensuales?
                    </p>
                </div>
            </div>

            {correlationData.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs italic">
                    Sin datos suficientes para correlacionar.
                </div>
            ) : (
                <div className="space-y-4">
                    {correlationData.map(item => (
                        <div key={item.month} className="flex flex-col gap-1">
                            <span className="text-xs font-bold text-slate-600 dark:text-slate-300">{item.month}</span>
                            <div className="flex items-center gap-2">
                                {/* Rain Bar */}
                                <div className="flex-1 flex items-center gap-2">
                                    <CloudRain className="w-3 h-3 text-blue-400" />
                                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-900 rounded-r-full relative">
                                        <div 
                                            className="h-full bg-blue-500 rounded-r-full" 
                                            style={{ width: `${Math.min((item.rain / 500) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-blue-500 w-10 text-right">{item.rain}mm</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {/* Income Bar */}
                                <div className="flex-1 flex items-center gap-2">
                                    <Sprout className="w-3 h-3 text-emerald-400" />
                                    <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-900 rounded-r-full relative">
                                        <div 
                                            className="h-full bg-emerald-500 rounded-r-full" 
                                            style={{ width: `${Math.min((item.income / 10000000) * 100, 100)}%` }} // Scaling logic (e.g., 10M max visual)
                                        ></div>
                                    </div>
                                    <span className="text-[10px] text-emerald-500 w-16 text-right">{formatCurrency(item.income)}</span>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
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
                    <div key={idx} className="pb-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-800 dark:text-white font-bold text-base block">{item.name}</span>
                                    {item.area > 0 && <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-700 px-1 rounded">{item.area} Ha</span>}
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.lotProfit >= 0 ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        {item.lotProfit >= 0 ? 'Ganancia: ' : 'Pérdida: '} {formatCurrency(item.lotProfit)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* Visual Bar: Income vs Expense */}
                        <div className="relative h-6 bg-slate-100 dark:bg-slate-900 rounded-md overflow-hidden flex text-[10px] font-bold text-white items-center mt-2">
                            <div style={{ width: '50%' }} className="h-full bg-red-500/20 flex justify-end items-center pr-2 border-r border-slate-500/20">
                                <span className="text-red-500">{formatCurrency(item.totalLotCost)}</span>
                            </div>
                            <div style={{ width: '50%' }} className="h-full bg-emerald-500/20 flex justify-start items-center pl-2">
                                <span className="text-emerald-500">{formatCurrency(item.income)}</span>
                            </div>
                        </div>
                        
                        {/* Metrics per Hectare (If Area exists) */}
                        {item.area > 0 && (
                            <div className="mt-2 flex justify-end">
                                <span className="text-[9px] text-slate-400 bg-slate-100 dark:bg-slate-900 px-2 py-0.5 rounded">
                                    Costo/Ha: {formatCurrency(item.costPerHa)}
                                </span>
                            </div>
                        )}
                    </div>
                    ))
                )}
             </div>
       </div>
    </div>
  );
};
