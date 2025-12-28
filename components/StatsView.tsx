
import React, { useMemo, useState } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet, CalendarRange, Filter, Calendar, Percent, TrendingDown, Target, Layers, CloudRain, Zap, Landmark, MousePointer2, Scale, AlertCircle, Leaf } from 'lucide-react';

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
  
  // View Toggle: 'Global' | 'Crop'
  const [reportMode, setReportMode] = useState<'global' | 'crop'>('global');
  
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


  // 2. Calculate Expenses by CROP TYPE (New Feature)
  const statsByCrop = useMemo(() => {
      const crops: Record<string, { income: number, expense: number }> = {};
      
      // Helper to find crop by cost center id
      const getCrop = (id?: string) => {
          if (!id) return 'General';
          const cc = costCenters.find(c => c.id === id);
          return cc?.cropType || 'Otros';
      };

      // Aggregate Income
      filteredHarvests.forEach(h => {
          const crop = getCrop(h.costCenterId);
          if (!crops[crop]) crops[crop] = { income: 0, expense: 0 };
          crops[crop].income += h.totalValue;
      });

      // Aggregate Expenses (Inputs)
      filteredMovements.filter(m => m.type === 'OUT').forEach(m => {
          const crop = getCrop(m.costCenterId);
          if (!crops[crop]) crops[crop] = { income: 0, expense: 0 };
          crops[crop].expense += m.calculatedCost;
      });

      // Aggregate Expenses (Labor)
      filteredLabor.forEach(l => {
          const crop = getCrop(l.costCenterId);
          if (!crops[crop]) crops[crop] = { income: 0, expense: 0 };
          crops[crop].expense += l.value;
      });

      return Object.entries(crops).map(([name, data]) => ({
          name,
          ...data,
          profit: data.income - data.expense,
          margin: data.income > 0 ? ((data.income - data.expense) / data.income) * 100 : 0
      })).sort((a, b) => b.income - a.income);

  }, [costCenters, filteredHarvests, filteredMovements, filteredLabor]);


  // 3. Calculate Expenses by Cost Center (General Table)
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

  // 4. LOT SPECIFIC ANALYSIS (UNIT COST & BREAK-EVEN)
  const lotDetailedStats = useMemo(() => {
      // Logic to determine which data to use: Selected Lot OR All Data (Global Average)
      
      const totalArea = costCenters.reduce((acc, c) => acc + (c.area || 0), 0);
      let targetArea = totalArea;
      let prorationFactor = 1; // Default global = 100%

      let relevantMovements = filteredMovements.filter(m => m.type === 'OUT');
      let relevantLabor = filteredLabor;
      let relevantHarvests = filteredHarvests;

      if (selectedLotId) {
          const selectedLot = costCenters.find(c => c.id === selectedLotId);
          targetArea = selectedLot?.area || 0;
          prorationFactor = totalArea > 0 ? (targetArea / totalArea) : 0;

          relevantMovements = filteredMovements.filter(m => m.type === 'OUT' && m.costCenterId === selectedLotId);
          relevantLabor = filteredLabor.filter(l => l.costCenterId === selectedLotId);
          relevantHarvests = filteredHarvests.filter(h => h.costCenterId === selectedLotId);
      }

      // Costs
      const directInputs = relevantMovements.reduce((sum, m) => sum + m.calculatedCost, 0);
      const directLabor = relevantLabor.reduce((sum, l) => sum + l.value, 0);
      
      // Indirect Costs (Prorated)
      const totalMachinery = filteredMaint.reduce((sum, m) => sum + m.cost, 0);
      const totalAdmin = filteredFinance.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + f.amount, 0);
      
      const allocatedMachinery = totalMachinery * prorationFactor;
      const allocatedAdmin = totalAdmin * prorationFactor;

      const totalCost = directInputs + directLabor + allocatedMachinery + allocatedAdmin;

      // Production (Normalize to KG)
      let totalProductionKg = 0;
      relevantHarvests.forEach(h => {
          let kgFactor = 1;
          const u = h.unit.toLowerCase();
          if (u.includes('arroba')) kgFactor = 12.5;
          else if (u.includes('ton')) kgFactor = 1000;
          else if (u.includes('carga')) kgFactor = 125;
          else if (u.includes('bulto')) kgFactor = 50; // Approx standard
          else if (u.includes('canastilla')) kgFactor = 22; // Coffee cherry approx
          else if (u.includes('gramo')) kgFactor = 0.001;
          
          totalProductionKg += (h.quantity * kgFactor);
      });

      const costPerKg = totalProductionKg > 0 ? totalCost / totalProductionKg : 0;
      
      return {
          totalCost,
          totalProductionKg,
          costPerKg,
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

       {/* VIEW TOGGLE: GLOBAL vs CROP */}
       <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
           <button 
                onClick={() => setReportMode('global')}
                className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${reportMode === 'global' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow' : 'text-slate-500'}`}
           >
                <Landmark className="w-4 h-4" /> Global / Por Lote
           </button>
           <button 
                onClick={() => setReportMode('crop')}
                className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${reportMode === 'crop' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow' : 'text-slate-500'}`}
           >
                <Leaf className="w-4 h-4" /> Por Tipo de Cultivo
           </button>
       </div>

       {/* --- NEW SECTION: UNIT COST & BREAK-EVEN ANALYSIS --- */}
       <div className="bg-slate-800 p-1 rounded-2xl border border-indigo-500/50 shadow-xl shadow-indigo-900/20 overflow-hidden">
           <div className="bg-indigo-900/30 p-4 border-b border-indigo-500/30">
               <h3 className="text-white font-bold text-lg flex items-center gap-2">
                   <Scale className="w-5 h-5 text-indigo-400" /> 
                   Análisis de Rentabilidad Unitaria
               </h3>
               <p className="text-xs text-indigo-200 mt-1">Datos reales basados en su producción y gastos.</p>
           </div>

           <div className="p-4 bg-slate-900">
               {/* LOT SELECTOR */}
               <div className="mb-4">
                    <label className="text-[10px] text-slate-400 font-bold uppercase mb-1 block">Filtrar por Lote (Recomendado)</label>
                    <select 
                        value={selectedLotId}
                        onChange={(e) => setSelectedLotId(e.target.value)}
                        className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none focus:border-indigo-500"
                    >
                        <option value="">-- Promedio Global (Toda la Finca) --</option>
                        {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
               </div>

               {lotDetailedStats.totalProductionKg > 0 ? (
                   <div className="grid gap-4">
                       {/* CARD 1: COST OF PRODUCTION */}
                       <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700">
                           <div className="flex justify-between items-start mb-2">
                               <h4 className="text-slate-400 text-xs font-bold uppercase">¿Cuánto me vale producir 1 Kilo?</h4>
                               <Package className="w-4 h-4 text-emerald-500" />
                           </div>
                           <p className="text-3xl font-mono font-bold text-white mb-1">
                               {formatCurrency(lotDetailedStats.costPerKg)}
                           </p>
                           <p className="text-[10px] text-slate-500">
                               Basado en {lotDetailedStats.totalProductionKg.toFixed(1)} Kg producidos en este periodo.
                           </p>
                       </div>

                       {/* CARD 2: BREAK-EVEN PRICE */}
                       <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900 p-4 rounded-xl border border-indigo-500/50 relative overflow-hidden">
                           <div className="absolute top-0 right-0 p-2 opacity-10">
                               <Target className="w-24 h-24 text-indigo-500" />
                           </div>
                           <div className="relative z-10">
                               <div className="flex justify-between items-start mb-2">
                                   <h4 className="text-indigo-300 text-xs font-bold uppercase">Punto de Equilibrio (Precio Mínimo)</h4>
                                   <Target className="w-4 h-4 text-indigo-400" />
                               </div>
                               <p className="text-3xl font-mono font-bold text-white mb-2">
                                   {formatCurrency(lotDetailedStats.costPerKg)}
                               </p>
                               <div className="bg-red-500/20 text-red-200 text-xs p-2 rounded border border-red-500/30 inline-block">
                                   <AlertCircle className="w-3 h-3 inline mr-1" />
                                   Si vende por debajo de este precio, <strong>PIERDE DINERO.</strong>
                               </div>
                           </div>
                       </div>
                   </div>
               ) : (
                   <div className="text-center py-8 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                       <Sprout className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                       <p className="text-slate-400 text-sm font-bold">No hay producción registrada</p>
                       <p className="text-xs text-slate-500 mt-1">Registre cosechas en este periodo para calcular el costo por Kilo.</p>
                   </div>
               )}
           </div>
       </div>

       {/* FINANCIAL SUMMARY CARD */}
       <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
           <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2">
               <Wallet className="w-4 h-4" /> 
               Balance General {useDateFilter ? `(${startDate} al ${endDate})` : '(Histórico Total)'}
           </h3>
           
           <div className="space-y-3">
               <div className="flex justify-between items-center text-sm">
                   <span className="text-slate-600 dark:text-slate-300">Ingresos Totales</span>
                   <span className="font-mono font-bold text-emerald-500">+ {formatCurrency(financialSummary.totalIncome)}</span>
               </div>
               <div className="w-full border-t border-slate-100 dark:border-slate-700"></div>
               <div className="flex justify-between items-center text-lg">
                   <span className="font-bold text-slate-800 dark:text-white">Utilidad Neta</span>
                   <span className={`font-mono font-bold ${financialSummary.profit >= 0 ? 'text-blue-500' : 'text-red-500'}`}>
                       {formatCurrency(financialSummary.profit)}
                   </span>
               </div>
           </div>
       </div>

       {/* PROFITABILITY BY LOT OR CROP */}
       <div className="space-y-3">
          <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-2">
             {reportMode === 'global' ? <Sprout className="w-4 h-4" /> : <Leaf className="w-4 h-4" />}
             {reportMode === 'global' ? 'Rentabilidad por Lote' : 'Consolidado por Tipo de Cultivo'}
          </h3>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-6">
                
                {/* MODE 1: BY LOT (Default) */}
                {reportMode === 'global' && expensesByCenter.map((item, idx) => (
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
                    </div>
                ))}

                {/* MODE 2: BY CROP (New) */}
                {reportMode === 'crop' && statsByCrop.map((item, idx) => (
                    <div key={idx} className="pb-3 border-b border-slate-100 dark:border-slate-700/50 last:border-0 last:pb-0">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="flex items-center gap-2">
                                    <span className="text-slate-800 dark:text-white font-bold text-base block">{item.name}</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mt-2">
                                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.profit >= 0 ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                                        Margen: {item.margin.toFixed(1)}%
                                    </span>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`font-mono font-bold ${item.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                    {formatCurrency(item.profit)}
                                </p>
                                <p className="text-[10px] text-slate-400">Utilidad Neta</p>
                            </div>
                        </div>
                        {/* Comparison Bars */}
                        <div className="grid grid-cols-2 gap-1 mt-2 text-[10px] font-bold text-white">
                             <div className="bg-red-500/80 rounded px-2 py-1 flex justify-between items-center">
                                 <span>Gasto</span>
                                 <span>{formatCurrency(item.expense)}</span>
                             </div>
                             <div className="bg-emerald-500/80 rounded px-2 py-1 flex justify-between items-center">
                                 <span>Venta</span>
                                 <span>{formatCurrency(item.income)}</span>
                             </div>
                        </div>
                    </div>
                ))}

                {((reportMode === 'global' && expensesByCenter.length === 0) || (reportMode === 'crop' && statsByCrop.length === 0)) && (
                    <div className="text-center py-6 text-slate-400 text-xs">
                        No hay movimientos registrados en este periodo.
                    </div>
                )}
             </div>
       </div>
    </div>
  );
};
