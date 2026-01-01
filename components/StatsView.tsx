
import React, { useMemo, useState } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog, Machine, BudgetPlan, PlannedLabor } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet, CalendarRange, Filter, Calendar, Percent, TrendingDown, Target, Layers, CloudRain, Zap, Landmark, MousePointer2, Scale, AlertCircle, AlertTriangle, Leaf, Info, HelpCircle, Gauge, Timer, Globe, Tractor, ZapOff, CheckCircle, Calculator, ChevronRight, PieChart as PieIcon, ArrowRight, Activity as ActivityIcon, Split } from 'lucide-react';

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
  budgets?: BudgetPlan[];
  plannedLabors?: PlannedLabor[];
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
    budgets = [],
    plannedLabors = []
}) => {
  const today = new Date();
  const firstDayOfYear = new Date(today.getFullYear(), 0, 1).toISOString().split('T')[0];
  const lastDayOfYear = new Date(today.getFullYear(), 11, 31).toISOString().split('T')[0];
  const currentYear = today.getFullYear();

  const [startDate, setStartDate] = useState<string>(firstDayOfYear);
  const [endDate, setEndDate] = useState<string>(lastDayOfYear);
  const [useDateFilter, setUseDateFilter] = useState(true);
  const [reportMode, setReportMode] = useState<'global' | 'benchmarking' | 'efficiency' | 'budget'>('global');

  const filterByDate = (dateString: string) => {
      if (!useDateFilter) return true;
      const date = new Date(dateString);
      const start = new Date(startDate);
      const end = new Date(endDate);
      start.setHours(0, 0, 0, 0);
      end.setHours(23, 59, 59, 999);
      return date >= start && date <= end;
  };

  const filteredMovements = useMemo(() => movements.filter(m => filterByDate(m.date)), [movements, startDate, endDate, useDateFilter]);
  const filteredLabor = useMemo(() => laborLogs.filter(l => filterByDate(l.date)), [laborLogs, startDate, endDate, useDateFilter]);
  const filteredHarvests = useMemo(() => harvests.filter(h => filterByDate(h.date)), [harvests, startDate, endDate, useDateFilter]);

  // --- MOTOR DE AUDITORÍA DE EFICIENCIA (IVE) ---
  const efficiencyAudit = useMemo(() => {
      if (!plannedLabors || plannedLabors.length === 0) return [];

      const analysis = plannedLabors.filter(p => p.completed).map(plan => {
          const matchingRealLogs = laborLogs.filter(l => 
              l.costCenterId === plan.costCenterId && 
              l.activityId === plan.activityId &&
              Math.abs(new Date(l.date).getTime() - new Date(plan.date).getTime()) < (15 * 24 * 60 * 60 * 1000)
          );

          const realJornales = matchingRealLogs.reduce((sum, l) => sum + (l.jornalesEquivalent || 1), 0);
          const plannedJornales = plan.calculatedPersonDays;
          
          const ive = plannedJornales > 0 ? (realJornales / plannedJornales) * 100 : 0;
          const costVariance = (realJornales * plan.unitCost) - plan.calculatedTotalCost;

          return {
              id: plan.id,
              name: plan.activityName,
              lot: plan.costCenterName,
              plannedJor: plannedJornales,
              realJor: realJornales,
              ive,
              costVariance,
              status: ive <= 105 ? 'EXCELENTE' : ive <= 120 ? 'DESVIACIÓN MÍNIMA' : 'CRÍTICO'
          };
      });

      return analysis;
  }, [plannedLabors, laborLogs]);

  const laborEfficiency = useMemo(() => {
      const totalJornales = filteredLabor.length;
      const totalHours = totalJornales * 8; 
      const totalArea = costCenters.reduce((a,b) => a + (b.area || 0), 0);
      return totalArea > 0 ? totalHours / totalArea : 0;
  }, [filteredLabor, costCenters]);

  const financialSummary = useMemo(() => {
     const inventoryExpense = filteredMovements.filter(m => m.type === 'OUT').reduce((acc, m) => acc + m.calculatedCost, 0);
     const laborExpenseBase = filteredLabor.reduce((acc, l) => acc + l.value, 0);
     const laborExpenseReal = laborExpenseBase * laborFactor;
     const totalExpenses = inventoryExpense + laborExpenseReal;
     const harvestIncome = filteredHarvests.reduce((acc, h) => acc + h.totalValue, 0);
     const profit = harvestIncome - totalExpenses;
     return { inventoryExpense, laborExpenseReal, totalIncome: harvestIncome, profit, totalExpenses };
  }, [filteredMovements, filteredLabor, filteredHarvests, laborFactor]);

  const budgetExecution = useMemo(() => {
      const activeBudgets = budgets.filter(b => b.year === currentYear);
      const stats = costCenters.map(lot => {
          const lotBudget = activeBudgets.find(b => b.costCenterId === lot.id);
          let plannedLabor = 0;
          let plannedSupplies = 0;
          if (lotBudget) {
              lotBudget.items.forEach(item => {
                  const totalItemCost = item.unitCost * item.quantityPerHa * lot.area * item.months.length;
                  if (item.type === 'LABOR') plannedLabor += totalItemCost;
                  else plannedSupplies += totalItemCost;
              });
          }
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
      return stats.filter(s => s.totalPlanned > 0);
  }, [budgets, costCenters, laborLogs, movements, currentYear, laborFactor]);

  const globalBudgetHealth = useMemo(() => {
      const totalPlanned = budgetExecution.reduce((acc, curr) => acc + curr.totalPlanned, 0);
      const totalReal = budgetExecution.reduce((acc, curr) => acc + curr.totalReal, 0);
      const percent = totalPlanned > 0 ? (totalReal / totalPlanned) * 100 : 0;
      return { totalPlanned, totalReal, percent };
  }, [budgetExecution]);

  const PieChartSVG: React.FC<{ data: { label: string; value: number; color: string }[] }> = ({ data }) => {
    const total = data.reduce((acc, d) => acc + d.value, 0);
    if (total === 0) return <div className="h-10 flex items-center justify-center text-slate-500 text-[10px] uppercase font-black">Sin Datos</div>;
    let cumulative = 0;
    const segments = data.map(d => {
        const percentage = d.value / total;
        const startAngle = (cumulative / total) * 360;
        cumulative += d.value;
        const endAngle = (cumulative / total) * 360;
        const largeArcFlag = percentage > 0.5 ? 1 : 0;
        const x1 = 50 + 40 * Math.cos(Math.PI * (startAngle - 90) / 180);
        const y1 = 50 + 40 * Math.sin(Math.PI * (startAngle - 90) / 180);
        const x2 = 50 + 40 * Math.cos(Math.PI * (endAngle - 90) / 180);
        const y2 = 50 + 40 * Math.sin(Math.PI * (endAngle - 90) / 180);
        return <path key={d.label} d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`} fill={d.color} stroke="#0f172a" strokeWidth="1" />;
    });
    return (
        <div className="flex items-center gap-6">
            <svg viewBox="0 0 100 100" className="w-20 h-20 drop-shadow-xl">{segments}</svg>
            <div className="space-y-1.5">
                {data.map(d => (
                    <div key={d.label} className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }} />
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-tighter">{d.label}: <span className="text-white font-mono">{((d.value / total) * 100).toFixed(0)}%</span></span>
                    </div>
                ))}
            </div>
        </div>
    );
  };

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
       <div className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col md:flex-row gap-4 items-center justify-between sticky top-[120px] z-30">
            <div className="flex items-center gap-3">
                <div className="p-2 bg-indigo-600 rounded-xl"><Calendar className="w-4 h-4 text-white" /></div>
                <div className="text-left">
                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Período de Análisis</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white mt-1">Año Fiscal {currentYear}</p>
                </div>
            </div>
            <div className="flex items-center gap-2 bg-slate-100 dark:bg-slate-900 p-1.5 rounded-2xl border dark:border-slate-700">
                <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-emerald-400 outline-none p-1" />
                <ArrowRight className="w-3 h-3 text-slate-400" />
                <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="bg-transparent border-none text-[10px] font-black text-slate-600 dark:text-emerald-400 outline-none p-1" />
            </div>
       </div>

       <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-700 text-center shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-6 opacity-5"><Globe className="w-40 h-40 text-white" /></div>
          <div className="relative z-10 flex flex-col items-center">
             <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Gauge className="w-6 h-6 text-white" /></div>
                <h2 className="text-white font-black text-2xl uppercase tracking-tighter italic">Tablero KPIs Agro</h2>
             </div>
             <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-[0.3em] bg-emerald-500/10 px-4 py-1 rounded-full border border-emerald-500/20">Monitor de Eficiencia 2025</p>
          </div>
       </div>

       <div className="flex p-1.5 bg-slate-200 dark:bg-slate-900 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
           <button onClick={() => setReportMode('global')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'global' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Balance Real</button>
           <button onClick={() => setReportMode('benchmarking')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'benchmarking' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Insumos</button>
           <button onClick={() => setReportMode('efficiency')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'efficiency' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Eficiencia (IVE)</button>
           <button onClick={() => setReportMode('budget')} className={`flex-1 min-w-[80px] py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'budget' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Presupuesto</button>
       </div>

       {reportMode === 'global' && (
           <div className="bg-white dark:bg-slate-800 rounded-[3rem] border border-slate-200 dark:border-slate-700 p-8 shadow-xl space-y-6 animate-slide-up">
                <div className="flex justify-between items-center">
                    <h3 className="text-xs font-black text-slate-500 uppercase flex items-center gap-2 tracking-widest"><Scale className="w-4 h-4" /> Utilidad Operativa Real</h3>
                    <span className="bg-emerald-500/10 text-emerald-500 text-[8px] font-black px-2 py-1 rounded-full uppercase">Neto del Período</span>
                </div>
                <div className="space-y-4">
                    <div className="flex justify-between items-end">
                        <span className="text-slate-500 font-bold text-sm">Ventas Brutas</span>
                        <span className="font-mono font-black text-emerald-600 text-xl">+ {formatCurrency(financialSummary.totalIncome)}</span>
                    </div>
                    <div className="flex justify-between items-end">
                        <div>
                            <span className="text-slate-500 font-bold text-sm">Gastos Operativos</span>
                            <p className="text-[8px] text-slate-400 font-black uppercase mt-1 italic">Mano de Obra + Insumos</p>
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
           <div className="space-y-4 animate-slide-up">
                <div className="bg-white dark:bg-slate-800 p-8 rounded-[3rem] border border-slate-200 dark:border-slate-700 shadow-xl space-y-6">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2 tracking-[0.2em]"><Zap className="w-4 h-4 text-amber-500"/> Eficiencia de Insumos</h4>
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex-1 space-y-4 w-full">
                            <div className="flex justify-between items-center">
                                <span className="text-slate-600 font-bold text-xs uppercase tracking-tighter">Participación Insumos/Ventas</span>
                                <span className="font-black text-2xl text-slate-800 dark:text-white">
                                    {financialSummary.totalIncome > 0 ? ((financialSummary.inventoryExpense / financialSummary.totalIncome) * 100).toFixed(1) : 0}%
                                </span>
                            </div>
                            <div className="w-full h-3 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden">
                                <div className="h-full bg-indigo-500 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(99,102,241,0.5)]" style={{width: `${Math.min((financialSummary.inventoryExpense / (financialSummary.totalIncome || 1)) * 100, 100)}%`}}></div>
                            </div>
                        </div>
                        <div className="w-full md:w-auto bg-slate-950/40 p-6 rounded-[2rem] border border-slate-700/50">
                            <PieChartSVG data={[
                                { label: 'Mano de Obra', value: financialSummary.laborExpenseReal, color: '#f59e0b' },
                                { label: 'Insumos', value: financialSummary.inventoryExpense, color: '#10b981' }
                            ]} />
                        </div>
                    </div>
                </div>
           </div>
       )}

       {reportMode === 'efficiency' && (
           <div className="space-y-6 animate-slide-up">
                <div className="bg-indigo-950/20 p-8 rounded-[3rem] border border-indigo-500/20 space-y-4">
                    <h3 className="text-indigo-400 font-black text-xs uppercase flex items-center gap-3 tracking-widest">
                        <ActivityIcon className="w-5 h-5" /> Auditoría de Desviación de Ejecución (IVE)
                    </h3>
                    <p className="text-[10px] text-slate-400 italic leading-tight">
                        Este índice compara los <strong>Jornales Planeados</strong> contra los <strong>Jornales Ejecutados</strong>. 
                        Un IVE superior al 100% indica que la labor fue menos eficiente de lo proyectado técnicamente.
                    </p>
                </div>

                {efficiencyAudit.length === 0 ? (
                    <div className="bg-slate-900/50 p-12 rounded-[2.5rem] border border-dashed border-slate-700 text-center">
                        <Split className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                        <p className="text-slate-500 font-bold uppercase text-xs">Sin labores finalizadas para auditar.</p>
                        <p className="text-[10px] text-slate-600 mt-2">Marque labores como 'Completadas' en el Programador para ver el análisis de desviación.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {efficiencyAudit.map((item) => (
                            <div key={item.id} className={`p-6 rounded-[2.5rem] border shadow-xl relative overflow-hidden transition-all ${item.ive > 115 ? 'bg-red-950/20 border-red-500/30' : 'bg-slate-900 border-slate-700'}`}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="font-black text-white text-lg italic">{item.name}</h4>
                                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest">{item.lot}</p>
                                    </div>
                                    <div className={`px-4 py-1.5 rounded-full text-[9px] font-black border ${item.ive <= 105 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                                        IVE: {item.ive.toFixed(1)}%
                                    </div>
                                </div>

                                <div className="grid grid-cols-3 gap-4 mb-4">
                                    <div className="bg-slate-950 p-3 rounded-2xl">
                                        <p className="text-[8px] text-slate-500 font-black uppercase">Plan Técnico</p>
                                        <p className="text-sm font-mono font-bold text-white">{item.plannedJor.toFixed(1)} Jor</p>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-2xl">
                                        <p className="text-[8px] text-slate-500 font-black uppercase">Real Pagado</p>
                                        <p className="text-sm font-mono font-bold text-white">{item.realJor.toFixed(1)} Jor</p>
                                    </div>
                                    <div className="bg-slate-950 p-3 rounded-2xl">
                                        <p className="text-[8px] text-slate-500 font-black uppercase">Fuga Dinero</p>
                                        <p className={`text-sm font-mono font-bold ${item.costVariance > 0 ? 'text-red-500' : 'text-emerald-500'}`}>{item.costVariance > 0 ? '+' : ''}{formatCurrency(item.costVariance)}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full ${item.ive <= 105 ? 'bg-emerald-500' : 'bg-red-500'} animate-pulse`} />
                                    <p className="text-[10px] text-slate-400 font-medium">
                                        <span className="font-black text-white">{item.status}:</span> {item.ive > 105 ? `Se requirieron ${(item.realJor - item.plannedJor).toFixed(1)} jornales adicionales para cubrir el área.` : 'La labor se ejecutó bajo los parámetros técnicos esperados.'}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
           </div>
       )}

       {reportMode === 'budget' && (
           <div className="space-y-6 animate-slide-up">
               {budgetExecution.length === 0 ? (
                   <div className="bg-slate-900/50 p-8 rounded-3xl border border-dashed border-slate-700 text-center">
                       <Calculator className="w-12 h-12 text-slate-500 mx-auto mb-3" />
                       <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">No hay presupuestos activos para {currentYear}</p>
                   </div>
               ) : (
                   budgetExecution.map((stat, idx) => {
                       const progress = (stat.totalReal / stat.totalPlanned) * 100;
                       const isOverBudget = progress > 100;
                       return (
                           <div key={idx} className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl relative overflow-hidden">
                               <div className="flex justify-between items-start mb-4">
                                   <div>
                                       <h4 className="font-black text-slate-800 dark:text-white text-base uppercase tracking-tighter italic">{stat.lotName}</h4>
                                       <p className="text-[10px] text-slate-500 font-bold uppercase mt-1 tracking-widest">Ejecución Anual {currentYear}</p>
                                   </div>
                                   <div className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase border ${isOverBudget ? 'bg-red-500/10 text-red-500 border-red-500/30' : 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'}`}>
                                       {progress.toFixed(1)}% Cumplimiento
                                   </div>
                               </div>
                               <div className="space-y-4">
                                   <div className="w-full h-4 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden border dark:border-slate-800 shadow-inner">
                                       <div className={`h-full transition-all duration-1000 ${isOverBudget ? 'bg-red-500' : 'bg-indigo-500'}`} style={{ width: `${Math.min(progress, 100)}%` }}></div>
                                   </div>
                                   <div className="grid grid-cols-2 gap-4 pt-2">
                                       <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                           <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Presupuestado</p>
                                           <p className="text-sm font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(stat.totalPlanned)}</p>
                                       </div>
                                       <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-2xl border border-slate-100 dark:border-slate-800">
                                           <p className="text-[9px] text-slate-400 font-black uppercase mb-1">Gasto Real</p>
                                           <p className={`text-sm font-mono font-black ${isOverBudget ? 'text-red-500' : 'text-emerald-500'}`}>
                                               {formatCurrency(stat.totalReal)}
                                           </p>
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
