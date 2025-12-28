
import React, { useMemo, useState } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet, CalendarRange, Filter, Calendar, Percent, TrendingDown, Target, Layers, CloudRain, Zap, Landmark, MousePointer2, Scale, AlertCircle, Leaf, Info } from 'lucide-react';

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
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth);
  const [useDateFilter, setUseDateFilter] = useState(true);
  const [reportMode, setReportMode] = useState<'global' | 'crop'>('global');
  const [selectedLotId, setSelectedLotId] = useState<string>('');

  const setRange = (type: 'month' | '3months' | 'year' | 'today') => {
      const end = new Date();
      let start = new Date();
      switch(type) {
          case 'today': break;
          case 'month': start = new Date(end.getFullYear(), end.getMonth(), 1); break;
          case '3months': start = new Date(end.getFullYear(), end.getMonth() - 2, 1); break;
          case 'year': start = new Date(end.getFullYear(), 0, 1); break;
      }
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      setUseDateFilter(true);
  };

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

  const financialSummary = useMemo(() => {
     const inventoryExpense = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
     const laborExpense = filteredLabor.reduce((acc, l) => acc + l.value, 0);
     const maintExpense = filteredMaint.filter(m => !m.description.startsWith('Repuesto Inventario')).reduce((acc, m) => acc + m.cost, 0);
     const generalExpense = filteredFinance.filter(f => f.type === 'EXPENSE').reduce((acc, f) => acc + f.amount, 0);
     const totalExpenses = inventoryExpense + laborExpense + maintExpense + generalExpense;
     const harvestIncome = filteredHarvests.reduce((acc, h) => acc + h.totalValue, 0);
     const otherIncome = filteredFinance.filter(f => f.type === 'INCOME').reduce((acc, f) => acc + f.amount, 0);
     const totalIncome = harvestIncome + otherIncome;
     const profit = totalIncome - totalExpenses;
     return { 
         inventoryExpense, laborExpense, maintExpense, generalExpense,
         totalExpenses, totalIncome, profit
     };
  }, [filteredMovements, filteredLabor, filteredMaint, filteredHarvests, filteredFinance]);

  // --- ENHANCED CROP ANALYSIS WITH COST BREAKDOWN ---
  const statsByCrop = useMemo(() => {
      const crops: Record<string, { income: number, inputs: number, labor: number, area: number }> = {};
      const totalArea = costCenters.reduce((acc, c) => acc + (c.area || 0), 0);
      const totalMachinery = filteredMaint.reduce((acc, m) => acc + m.cost, 0);
      const totalAdmin = filteredFinance.filter(f => f.type === 'EXPENSE').reduce((acc, f) => acc + f.amount, 0);

      const getCropName = (id?: string) => {
          if (!id) return 'General';
          return costCenters.find(c => c.id === id)?.cropType || 'Otros';
      };

      // Aggregate Base Data
      costCenters.forEach(c => {
          const name = c.cropType || 'Otros';
          if (!crops[name]) crops[name] = { income: 0, inputs: 0, labor: 0, area: 0 };
          crops[name].area += (c.area || 0);
      });

      filteredHarvests.forEach(h => {
          const name = getCropName(h.costCenterId);
          if (!crops[name]) crops[name] = { income: 0, inputs: 0, labor: 0, area: 0 };
          crops[name].income += h.totalValue;
      });

      filteredMovements.filter(m => m.type === 'OUT').forEach(m => {
          const name = getCropName(m.costCenterId);
          if (!crops[name]) crops[name] = { income: 0, inputs: 0, labor: 0, area: 0 };
          crops[name].inputs += m.calculatedCost;
      });

      filteredLabor.forEach(l => {
          const name = getCropName(l.costCenterId);
          if (!crops[name]) crops[name] = { income: 0, inputs: 0, labor: 0, area: 0 };
          crops[name].labor += l.value;
      });

      return Object.entries(crops).map(([name, data]) => {
          const proration = totalArea > 0 ? (data.area / totalArea) : 0;
          const allocatedMachinery = totalMachinery * proration;
          const allocatedAdmin = totalAdmin * proration;
          const totalExpense = data.inputs + data.labor + allocatedMachinery + allocatedAdmin;
          
          return {
              name,
              income: data.income,
              inputs: data.inputs,
              labor: data.labor,
              machinery: allocatedMachinery,
              admin: allocatedAdmin,
              totalExpense,
              profit: data.income - totalExpense,
              margin: data.income > 0 ? ((data.income - totalExpense) / data.income) * 100 : 0
          };
      }).sort((a, b) => b.totalExpense - a.totalExpense);
  }, [costCenters, filteredHarvests, filteredMovements, filteredLabor, filteredMaint, filteredFinance]);

  // --- STACKED BAR CHART SVG GENERATOR ---
  const renderStackedCostChart = () => {
      if (statsByCrop.length === 0) return null;
      
      const maxTotal = Math.max(...statsByCrop.map(c => c.totalExpense), 1);
      const chartWidth = 300;
      const barHeight = 24;
      const gap = 12;
      const labelSpace = 80;
      const totalHeight = statsByCrop.length * (barHeight + gap);

      return (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex justify-between items-center mb-4">
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Layers className="w-3 h-3" /> Distribución de Costos por Cultivo
                  </h4>
              </div>

              {/* Legend */}
              <div className="flex flex-wrap gap-x-4 gap-y-2 mb-4">
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                      <div className="w-2.5 h-2.5 rounded-sm bg-emerald-500"></div> INSUMOS
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                      <div className="w-2.5 h-2.5 rounded-sm bg-amber-500"></div> LABOR
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                      <div className="w-2.5 h-2.5 rounded-sm bg-orange-500"></div> MAQ.
                  </div>
                  <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-400">
                      <div className="w-2.5 h-2.5 rounded-sm bg-indigo-500"></div> ADMIN.
                  </div>
              </div>

              <svg width="100%" viewBox={`0 0 ${chartWidth + labelSpace} ${totalHeight}`} className="overflow-visible">
                  {statsByCrop.map((crop, i) => {
                      const y = i * (barHeight + gap);
                      const wInputs = (crop.inputs / maxTotal) * chartWidth;
                      const wLabor = (crop.labor / maxTotal) * chartWidth;
                      const wMach = (crop.machinery / maxTotal) * chartWidth;
                      const wAdmin = (crop.admin / maxTotal) * chartWidth;

                      return (
                          <g key={crop.name}>
                              {/* Label */}
                              <text x="0" y={y + barHeight/2 + 4} fill="#94a3b8" fontSize="10" fontWeight="bold">
                                  {crop.name.length > 12 ? crop.name.substring(0, 10) + '...' : crop.name}
                              </text>
                              
                              {/* Stacked Bars */}
                              <rect x={labelSpace} y={y} width={wInputs} height={barHeight} fill="#10b981" rx="2" />
                              <rect x={labelSpace + wInputs} y={y} width={wLabor} height={barHeight} fill="#f59e0b" rx="2" />
                              <rect x={labelSpace + wInputs + wLabor} y={y} width={wMach} height={barHeight} fill="#f97316" rx="2" />
                              <rect x={labelSpace + wInputs + wLabor + wMach} y={y} width={wAdmin} height={barHeight} fill="#6366f1" rx="2" />
                              
                              {/* Total Value Overlay */}
                              <text x={labelSpace + wInputs + wLabor + wMach + wAdmin + 5} y={y + barHeight/2 + 4} fill="#cbd5e1" fontSize="9" fontWeight="bold">
                                  {formatCurrency(crop.totalExpense)}
                              </text>
                          </g>
                      );
                  })}
              </svg>
          </div>
      );
  };

  const expensesByCenter = useMemo(() => {
    const data: Record<string, { inventoryCost: number, laborCost: number, income: number }> = {};
    filteredMovements.filter(m => m.type === 'OUT').forEach(m => {
        const key = m.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].inventoryCost += m.calculatedCost;
    });
    filteredLabor.forEach(l => {
        const key = l.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].laborCost += l.value;
    });
    filteredHarvests.forEach(h => {
        const key = h.costCenterId || 'unknown';
        if (!data[key]) data[key] = { inventoryCost: 0, laborCost: 0, income: 0 };
        data[key].income += h.totalValue;
    });
    return Object.entries(data)
      .map(([id, values]) => {
          const center = costCenters.find(c => c.id === id);
          const name = center ? center.name : (id === 'unknown' ? 'General / Sin Lote' : 'Lote Eliminado');
          const totalLotCost = values.inventoryCost + values.laborCost;
          const lotProfit = values.income - totalLotCost;
          return { name, ...values, totalLotCost, lotProfit };
      })
      .filter(item => item.totalLotCost > 0 || item.income > 0)
      .sort((a, b) => b.totalLotCost - a.totalLotCost);
  }, [filteredMovements, costCenters, filteredLabor, filteredHarvests]);

  const lotDetailedStats = useMemo(() => {
      const totalArea = costCenters.reduce((acc, c) => acc + (c.area || 0), 0);
      let targetArea = totalArea;
      let prorationFactor = 1;
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

      const directInputs = relevantMovements.reduce((sum, m) => sum + m.calculatedCost, 0);
      const directLabor = relevantLabor.reduce((sum, l) => sum + l.value, 0);
      const totalMachinery = filteredMaint.reduce((sum, m) => sum + m.cost, 0);
      const totalAdmin = filteredFinance.filter(f => f.type === 'EXPENSE').reduce((sum, f) => sum + f.amount, 0);
      const allocatedMachinery = totalMachinery * prorationFactor;
      const allocatedAdmin = totalAdmin * prorationFactor;
      const totalCost = directInputs + directLabor + allocatedMachinery + allocatedAdmin;

      let totalProductionKg = 0;
      relevantHarvests.forEach(h => {
          let kgFactor = 1;
          const u = h.unit.toLowerCase();
          if (u.includes('arroba')) kgFactor = 12.5;
          else if (u.includes('ton')) kgFactor = 1000;
          else if (u.includes('carga')) kgFactor = 125;
          else if (u.includes('bulto')) kgFactor = 50;
          else if (u.includes('canastilla')) kgFactor = 22;
          else if (u.includes('gramo')) kgFactor = 0.001;
          totalProductionKg += (h.quantity * kgFactor);
      });
      return { totalCost, totalProductionKg, costPerKg: totalProductionKg > 0 ? totalCost / totalProductionKg : 0 };
  }, [selectedLotId, costCenters, filteredMovements, filteredLabor, filteredMaint, filteredFinance, filteredHarvests]);

  return (
    <div className="space-y-6 pb-20">
       <div className="bg-slate-900 p-4 rounded-xl border border-slate-700 text-center">
          <h2 className="text-white font-bold text-lg flex items-center justify-center gap-2">
             <BarChart3 className="w-5 h-5 text-purple-400" /> Inteligencia de Negocio
          </h2>
          <p className="text-xs text-slate-400 mt-1">Análisis para Toma de Decisiones</p>
       </div>

       <div className="bg-slate-100 dark:bg-slate-800 p-3 rounded-xl border border-slate-200 dark:border-slate-700 space-y-3">
           <div className="flex flex-col sm:flex-row justify-between items-center gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    <div className={`p-2 rounded-lg ${useDateFilter ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-slate-200 text-slate-500'}`}>
                        <CalendarRange className="w-5 h-5" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 dark:text-slate-300">Rango de Análisis:</span>
                </div>
                <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-lg w-full sm:w-auto">
                    <button onClick={() => setUseDateFilter(false)} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${!useDateFilter ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500'}`}>Histórico</button>
                    <button onClick={() => setRange('month')} className={`flex-1 px-3 py-1.5 text-xs font-bold rounded-md transition-all ${useDateFilter ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-purple-400 shadow-sm' : 'text-slate-500'}`}>Filtrar</button>
                </div>
           </div>
           {useDateFilter && (
               <div className="animate-fade-in pt-2 border-t border-slate-200 dark:border-slate-700">
                    <div className="grid grid-cols-2 gap-3 mb-3">
                        <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-xs font-bold outline-none" />
                        <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-2 py-2 text-xs font-bold outline-none" />
                    </div>
               </div>
           )}
       </div>

       <div className="flex p-1 bg-slate-200 dark:bg-slate-800 rounded-lg">
           <button onClick={() => setReportMode('global')} className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${reportMode === 'global' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-white shadow' : 'text-slate-500'}`}><Landmark className="w-4 h-4" /> Resumen General</button>
           <button onClick={() => setReportMode('crop')} className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${reportMode === 'crop' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow' : 'text-slate-500'}`}><Leaf className="w-4 h-4" /> Detalle por Cultivo</button>
       </div>

       {reportMode === 'crop' && (
           <div className="space-y-4 animate-fade-in">
               {renderStackedCostChart()}
               
               <div className="grid gap-4 sm:grid-cols-2">
                   {statsByCrop.map(crop => (
                       <div key={crop.name} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                           <div className="flex justify-between items-start mb-3">
                               <h4 className="font-bold text-slate-800 dark:text-white">{crop.name}</h4>
                               <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${crop.profit >= 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-red-100 text-red-600'}`}>
                                   Margen: {crop.margin.toFixed(1)}%
                               </span>
                           </div>
                           <div className="space-y-1 text-xs">
                               <div className="flex justify-between text-slate-500"><span>Ventas</span><span className="text-emerald-500 font-bold">{formatCurrency(crop.income)}</span></div>
                               <div className="flex justify-between text-slate-500"><span>Costos Totales</span><span className="text-red-500 font-bold">{formatCurrency(crop.totalExpense)}</span></div>
                               <div className="border-t border-slate-100 dark:border-slate-700 my-1 pt-1 flex justify-between font-bold text-slate-700 dark:text-slate-200">
                                   <span>Utilidad Neta</span>
                                   <span className={crop.profit >= 0 ? 'text-blue-500' : 'text-red-500'}>{formatCurrency(crop.profit)}</span>
                               </div>
                           </div>
                       </div>
                   ))}
               </div>
           </div>
       )}

       {reportMode === 'global' && (
           <>
            <div className="bg-slate-800 p-1 rounded-2xl border border-indigo-500/50 shadow-xl overflow-hidden">
                <div className="bg-indigo-900/30 p-4 border-b border-indigo-500/30">
                    <h3 className="text-white font-bold text-lg flex items-center gap-2"><Scale className="w-5 h-5 text-indigo-400" /> Análisis de Rentabilidad Unitaria</h3>
                </div>
                <div className="p-4 bg-slate-900">
                    <select value={selectedLotId} onChange={(e) => setSelectedLotId(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-lg p-2 text-sm text-white outline-none mb-4">
                        <option value="">-- Promedio Global (Toda la Finca) --</option>
                        {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                    {lotDetailedStats.totalProductionKg > 0 ? (
                        <div className="grid gap-4">
                            <div className="bg-gradient-to-br from-slate-800 to-slate-900 p-4 rounded-xl border border-slate-700">
                                <h4 className="text-slate-400 text-xs font-bold uppercase mb-1">Costo de Producción por Kilo</h4>
                                <p className="text-3xl font-mono font-bold text-white">{formatCurrency(lotDetailedStats.costPerKg)}</p>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-8 bg-slate-800/50 rounded-xl border border-dashed border-slate-700">
                            <Sprout className="w-10 h-10 mx-auto text-slate-600 mb-2" />
                            <p className="text-slate-400 text-sm font-bold">No hay producción registrada</p>
                        </div>
                    )}
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 shadow-lg">
                <h3 className="text-sm font-bold text-slate-500 uppercase mb-4 flex items-center gap-2"><Wallet className="w-4 h-4" /> Balance General</h3>
                <div className="space-y-3 text-sm">
                    <div className="flex justify-between"><span>Ingresos Totales</span><span className="font-mono font-bold text-emerald-500">+ {formatCurrency(financialSummary.totalIncome)}</span></div>
                    <div className="flex justify-between"><span>Gastos Totales</span><span className="font-mono font-bold text-red-500">- {formatCurrency(financialSummary.totalExpenses)}</span></div>
                    <div className="w-full border-t border-slate-100 dark:border-slate-700 my-2"></div>
                    <div className="flex justify-between text-lg font-bold">
                        <span className="text-slate-800 dark:text-white">Utilidad Neta</span>
                        <span className={financialSummary.profit >= 0 ? 'text-blue-500' : 'text-red-500'}>{formatCurrency(financialSummary.profit)}</span>
                    </div>
                </div>
            </div>

            <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 space-y-4">
                <h3 className="text-sm font-bold text-slate-500 uppercase flex items-center gap-2"><MapPin className="w-4 h-4" /> Rentabilidad por Lote</h3>
                {expensesByCenter.map((item, idx) => (
                    <div key={idx} className="pb-3 border-b border-slate-100 dark:border-slate-700 last:border-0">
                        <div className="flex justify-between mb-2">
                            <span className="text-slate-800 dark:text-white font-bold">{item.name}</span>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${item.lotProfit >= 0 ? 'bg-blue-100 text-blue-600' : 'bg-red-100 text-red-600'}`}>
                                {formatCurrency(item.lotProfit)}
                            </span>
                        </div>
                        <div className="relative h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex text-[8px] font-bold text-white items-center">
                            <div style={{ width: '50%' }} className="h-full bg-red-500/20 flex justify-end items-center pr-2">-{formatCurrency(item.totalLotCost)}</div>
                            <div style={{ width: '50%' }} className="h-full bg-emerald-500/20 flex justify-start items-center pl-2">+{formatCurrency(item.income)}</div>
                        </div>
                    </div>
                ))}
            </div>
           </>
       )}
    </div>
  );
};
