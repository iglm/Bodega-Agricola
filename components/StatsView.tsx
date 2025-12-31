
import React, { useMemo, useState } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog, Machine, BudgetPlan } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet, CalendarRange, Filter, Calendar, Percent, TrendingDown, Target, Layers, CloudRain, Zap, Landmark, MousePointer2, Scale, AlertCircle, AlertTriangle, Leaf, Info, HelpCircle, Gauge, Timer, Globe, Tractor, ZapOff, CheckCircle, Calculator, ChevronRight, PieChart as PieIcon } from 'lucide-react';

interface StatsViewProps {
  laborFactor: number;
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  laborLogs?: LaborLog[];
  harvests?: HarvestLog[]; 
  maintenanceLogs?: MaintenanceLog[]; 
  rainLogs?: RainLog[];
  financeLogs?: FinanceLog[]; 
  machines?: Machine[];
  budgets?: BudgetPlan[]; // Added budgets prop
}

export const StatsView: React.FC<StatsViewProps> = ({ 
    laborFactor,
    movements, 
    suppliers, 
    costCenters,
    laborLogs = [],
    harvests = [],
    maintenanceLogs = [],
    rainLogs = [],
    financeLogs = [],
    machines = [],
    budgets = []
}) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];
  const currentYear = today.getFullYear();

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth);
  const [useDateFilter, setUseDateFilter] = useState(true);
  const [reportMode, setReportMode] = useState<'global' | 'benchmarking' | 'budget'>('global');

  const filterByDate = (dateString: string) => {
      if (!useDateFilter) return true;
      const date = new Date(dateString);
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include the whole end day
      return date >= start && date <= end;
  };

  const filteredMovements = useMemo(() => movements.filter(m => filterByDate(m.date)), [movements, startDate, endDate, useDateFilter]);
  const filteredLabor = useMemo(() => laborLogs.filter(l => filterByDate(l.date)), [laborLogs, startDate, endDate, useDateFilter]);
  const filteredHarvests = useMemo(() => harvests.filter(h => filterByDate(h.date)), [harvests, startDate, endDate, useDateFilter]);

  const laborEfficiency = useMemo(() => {
      const totalJornales = filteredLabor.length;
      const totalHours = totalJornales * 8; 
      const totalArea = costCenters.reduce((a,b) => a + (b.area || 0), 0);
      return totalArea > 0 ? totalHours / totalArea : 0;
  }, [filteredLabor, costCenters]);

  const laborAlertThreshold = 100;

  const financialSummary = useMemo(() => {
     const inventoryExpense = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
     const laborExpenseBase = filteredLabor.reduce((acc, l) => acc + l.value, 0);
     const laborExpenseReal = laborExpenseBase * laborFactor;
     const totalExpenses = inventoryExpense + laborExpenseReal;
     const harvestIncome = filteredHarvests.reduce((acc, h) => acc + h.totalValue, 0);
     const profit = harvestIncome - totalExpenses;
     return { inventoryExpense, laborExpenseReal, totalIncome: harvestIncome, profit, totalExpenses };
  }, [filteredMovements, filteredLabor, filteredHarvests, laborFactor]);

  // --- BUDGET EXECUTION LOGIC ---
  const budgetExecution = useMemo(() => {
      // 1. Get budgets for the current year (or selected logic)
      // For simplicity, we aggregate ALL active budgets for the current year
      const activeBudgets = budgets.filter(b => b.year === currentYear);
      
      const stats = costCenters.map(lot => {
          const lotBudget = activeBudgets.find(b => b.costCenterId === lot.id);
          
          // Calculate PLANNED
          let plannedLabor = 0;
          let plannedSupplies = 0;
          
          if (lotBudget) {
              lotBudget.items.forEach(item => {
                  const totalItemCost = item.unitCost * item.quantityPerHa * lot.area * item.months.length;
                  if (item.type === 'LABOR') plannedLabor += totalItemCost;
                  else plannedSupplies += totalItemCost;
              });
          }

          // Calculate EXECUTED (REAL) - Always cumulative for the year to compare with budget
          const realLabor = laborLogs
            .filter(l => l.costCenterId === lot.id && new Date(l.date).getFullYear() === currentYear)
            .reduce((sum, l) => sum + (l.value * laborFactor), 0);
            
          const realSupplies = movements
            .filter(m => m.costCenterId === lot.id && m.type === 'OUT' && new Date(m.date).getFullYear() === currentYear)
            .reduce((sum, m) => sum + m.calculatedCost, 0);

          return {
              lotName: lot.name,
              plannedLabor,
              realLabor,
              plannedSupplies,
              realSupplies,
              totalPlanned: plannedLabor + plannedSupplies,
              totalReal: realLabor + realSupplies
          };
      });

      // Filter out lots with 0 budget to clean up view
      return stats.filter(s => s.totalPlanned > 0);
  }, [budgets, costCenters, laborLogs, movements, currentYear, laborFactor]);

  // Calculate Global Budget Health
  const globalBudgetHealth = useMemo(() => {
      const totalPlanned = budgetExecution.reduce((acc, curr) => acc + curr.totalPlanned, 0);
      const totalReal = budgetExecution.reduce((acc, curr) => acc + curr.totalReal, 0);
      const percent = totalPlanned > 0 ? (totalReal / totalPlanned) * 100 : 0;
      return { totalPlanned, totalReal, percent };
  }, [budgetExecution]);


  return (
    <div className="space-y-6 pb-20 animate-fade-in">
       <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-700 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-2">
             <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Gauge className="w-6 h-6 text-white" /></div>
             <h2 className="text-white font-black text-2xl uppercase tracking-tighter">Tablero KPIs Agro</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Monitor de Eficiencia Técnica y Financiera</p>
       </div>

       {/* Top Metrics Grid - Updated to include Budget */}
       <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* 1. Labor Efficiency */}
            <div className={`p-6 rounded-[2.5rem] border shadow-xl transition-all ${laborEfficiency > laborAlertThreshold ? 'bg-red-950/20 border-red-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Timer className="w-4 h-4 text-indigo-400"/> Intensidad Laboral</p>
                <p className={`text-2xl font-mono font-black ${laborEfficiency > laborAlertThreshold ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{laborEfficiency.toFixed(1)} <span className="text-[10px] opacity-60">HH/Ha</span></p>
                {laborEfficiency > laborAlertThreshold && (
                    <div className="mt-3 flex items-center gap-1.5 text-red-500 text-[8px] font-black uppercase animate-pulse">
                        <AlertTriangle className="w-3 h-3"/> Alerta de Ineficiencia
                    </div>
                )}
            </div>

            {/* 2. Budget Health (NEW INTEGRATION) */}
            <div className={`p-6 rounded-[2.5rem] border shadow-xl transition-all ${globalBudgetHealth.percent > 100 ? 'bg-red-950/20 border-red-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Target className="w-4 h-4 text-blue-400"/> Salud Presupuestal</p>
                <div className="flex items-end justify-between">
                    <p className={`text-2xl font-mono font-black ${globalBudgetHealth.percent > 100 ? 'text-red-500' : 'text-emerald-500'}`}>
                        {globalBudgetHealth.percent.toFixed(0)}%
                    </p>
                    <p className="text-[9px] text-slate-500 font-bold mb-1 uppercase">Ejecutado</p>
                </div>
                
                <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-900 rounded-full mt-3 overflow-hidden">
                    <div 
                        className={`h-full ${globalBudgetHealth.percent > 100 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{width: `${Math.min(globalBudgetHealth.percent, 100)}%`}}
                    ></div>
                </div>
            </div>

            {/* 3. Labor Factor */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-amber-500"/> Factor {laborFactor}</p>
                <p className="text-2xl font-mono font-black text-amber-600">{((laborFactor - 1) * 100).toFixed(0)}% <span className="text-[10px] opacity-60">Carga</span></p>
                <p className="text-[8px] text-slate-500 font-bold mt-3 uppercase">{laborFactor > 1 ? 'Provisiones Legales (CST)' : 'Sin Carga Prestacional'}</p>
            </div>
       </div>

       <div className="flex p-1.5 bg-slate-200 dark:bg-slate-900 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
           <button onClick={() => setReportMode('global')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'global' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Balance Real</button>
           <button onClick={() => setReportMode('benchmarking')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'benchmarking' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Insumos</button>
           <button onClick={() => setReportMode('budget')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'budget' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Detalle Presupuesto</button>
       </div>

       {reportMode === 'global' && (
           <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 p-8 shadow-xl space-y-6">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest"><Scale className="w-4 h-4" /> Utilidad Operativa</h3>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-1 rounded-full uppercase">Neto Final</span>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-slate-500 font-bold text-sm">Ventas Brutas</span>
                        <span className="font-mono font-black text-emerald-600 text-xl">+ {formatCurrency(financialSummary.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-slate-500 font-bold text-sm">Gastos Operativos</span>
                            <p className="text-[8px] text-slate-400 font-black uppercase mt-1 italic">Factor {laborFactor} Aplicado</p>
                        </div>
                        <span className="font-mono font-black text-red-500 text-xl">- {formatCurrency(financialSummary.totalExpenses)}</span>
                    </div>
                    <div className="w-full h-px bg-slate-100 dark:bg-slate-700 my-4"></div>
                    <div className="flex justify-between items-center">
                        <span className="text-slate-800 dark:text-white font-black text-lg uppercase tracking-tighter">Utilidad Neta</span>
                        <span className={`text-3xl font-black font-mono ${financialSummary.profit >= 0 ? 'text-indigo-500' : 'text-red-500'}`}>
                            {formatCurrency(financialSummary.profit)}
                        </span>
                    </div>
                </div>
           </div>
       )}

       {reportMode === 'benchmarking' && (
           <div className="space-y-4">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-[0.2em]"><Zap className="w-4 h-4 text-amber-500"/> Eficiencia de Insumos</h4>
                    <div className="space-y-4">
                         <div className="flex justify-between items-center">
                             <span className="text-slate-600 font-bold text-xs">Participación Insumos/Ventas</span>
                             <span className="font-black text-lg text-slate-800 dark:text-white">
                                 {financialSummary.totalIncome > 0 ? ((financialSummary.inventoryExpense / financialSummary.totalIncome) * 100).toFixed(1) : 0}%
                             </span>
                         </div>
                         <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                             <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000" style={{width: `${Math.min((financialSummary.inventoryExpense / (financialSummary.totalIncome || 1)) * 100, 100)}%`}}></div>
                         </div>
                         <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-start gap-3">
                             <Info className="w-5 h-5 text-indigo-400 shrink-0" />
                             <p className="text-[9px] text-slate-500 font-medium leading-relaxed italic">
                                Según BPA, un gasto en fertilización que supere el 30% del ingreso bruto debe ser evaluado mediante análisis foliar para optimizar la absorción radicular.
                             </p>
                         </div>
                    </div>
                </div>
           </div>
       )}

       {reportMode === 'budget' && (
           <div className="space-y-6 animate-slide-up">
               {budgetExecution.length === 0 ? (
                   <div className="bg-slate-900/50 p-8 rounded-3xl border border-dashed border-slate-700 text-center">
                       <Calculator className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                       <p className="text-sm text-slate-400 font-bold">No hay presupuestos activos para {currentYear}.</p>
                       <p className="text-xs text-slate-500 mt-1">Crea uno en la pestaña "Presupuesto" para ver el análisis.</p>
                   </div>
               ) : (
                   budgetExecution.map((stat, idx) => {
                       const progress = (stat.totalReal / stat.totalPlanned) * 100;
                       const isOverBudget = progress > 100;
                       
                       return (
                           <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <h4 className="font-black text-slate-800 dark:text-white text-base">{stat.lotName}</h4>
                                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Ejecución Anual {currentYear}</p>
                                   </div>
                                   <div className={`px-3 py-1 rounded-full text-[10px] font-black uppercase border ${isOverBudget ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'}`}>
                                       {progress.toFixed(1)}% Ejecutado
                                   </div>
                               </div>

                               <div className="space-y-4">
                                   {/* Main Progress Bar */}
                                   <div className="w-full h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                       <div 
                                           className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                           style={{ width: `${Math.min(progress, 100)}%` }}
                                       ></div>
                                   </div>

                                   <div className="grid grid-cols-2 gap-4 pt-2">
                                       <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl">
                                           <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Presupuestado</p>
                                           <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(stat.totalPlanned)}</p>
                                       </div>
                                       <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-2xl border border-transparent hover:border-slate-300 dark:hover:border-slate-600 transition-all">
                                           <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Ejecutado Real</p>
                                           <p className={`text-sm font-mono font-black ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                                               {formatCurrency(stat.totalReal)}
                                           </p>
                                       </div>
                                   </div>

                                   {/* Detailed Breakdown */}
                                   <div className="pt-2 border-t border-slate-100 dark:border-slate-700/50">
                                       <div className="flex justify-between items-center text-[10px] mb-1">
                                           <span className="text-slate-500">Mano de Obra</span>
                                           <span className="font-mono text-slate-400">{formatCurrency(stat.realLabor)} <span className="text-slate-600">/ {formatCurrency(stat.plannedLabor)}</span></span>
                                       </div>
                                       <div className="flex justify-between items-center text-[10px]">
                                           <span className="text-slate-500">Insumos</span>
                                           <span className="font-mono text-slate-400">{formatCurrency(stat.realSupplies)} <span className="text-slate-600">/ {formatCurrency(stat.plannedSupplies)}</span></span>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       );
                   })
               )}
           </div>
       )}
    </div>
  );
};
