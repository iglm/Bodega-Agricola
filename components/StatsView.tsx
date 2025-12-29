
import React, { useMemo, useState } from 'react';
import { Movement, Supplier, CostCenter, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog, Machine } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { PieChart, TrendingUp, BarChart3, MapPin, Users, Ruler, Sprout, Pickaxe, Package, Wrench, Wallet, CalendarRange, Filter, Calendar, Percent, TrendingDown, Target, Layers, CloudRain, Zap, Landmark, MousePointer2, Scale, AlertCircle, AlertTriangle, Leaf, Info, HelpCircle, Gauge, Timer, Globe, Tractor, ZapOff, CheckCircle } from 'lucide-react';

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
    machines = []
}) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [startDate, setStartDate] = useState<string>(firstDayOfMonth);
  const [endDate, setEndDate] = useState<string>(lastDayOfMonth);
  const [useDateFilter, setUseDateFilter] = useState(true);
  const [reportMode, setReportMode] = useState<'global' | 'benchmarking'>('global');

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

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
       <div className="bg-slate-900 p-8 rounded-[3.5rem] border border-slate-700 text-center shadow-2xl">
          <div className="flex items-center justify-center gap-3 mb-2">
             <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg"><Gauge className="w-6 h-6 text-white" /></div>
             <h2 className="text-white font-black text-2xl uppercase tracking-tighter">Tablero KPIs Agro</h2>
          </div>
          <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Monitor de Eficiencia Técnica y Financiera</p>
       </div>

       <div className="grid grid-cols-2 gap-4">
            <div className={`p-6 rounded-[2.5rem] border shadow-xl transition-all ${laborEfficiency > laborAlertThreshold ? 'bg-red-950/20 border-red-500/50' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Timer className="w-4 h-4 text-indigo-400"/> Intensidad Laboral</p>
                <p className={`text-2xl font-mono font-black ${laborEfficiency > laborAlertThreshold ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{laborEfficiency.toFixed(1)} <span className="text-[10px] opacity-60">HH/Ha</span></p>
                {laborEfficiency > laborAlertThreshold && (
                    <div className="mt-3 flex items-center gap-1.5 text-red-500 text-[8px] font-black uppercase animate-pulse">
                        <AlertTriangle className="w-3 h-3"/> Alerta de Ineficiencia
                    </div>
                )}
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl">
                <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center gap-1.5"><Wallet className="w-4 h-4 text-emerald-500"/> Factor {laborFactor}</p>
                <p className="text-2xl font-mono font-black text-emerald-600">{((laborFactor - 1) * 100).toFixed(0)}% <span className="text-[10px] opacity-60">Extra</span></p>
                <p className="text-[8px] text-slate-500 font-bold mt-3 uppercase">{laborFactor > 1 ? 'Provisiones de Ley CST' : 'Costo Directo Pagado'}</p>
            </div>
       </div>

       <div className="flex p-1.5 bg-slate-200 dark:bg-slate-900 rounded-2xl gap-1">
           <button onClick={() => setReportMode('global')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'global' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Balance Real</button>
           <button onClick={() => setReportMode('benchmarking')} className={`flex-1 py-3 text-[10px] font-black uppercase rounded-xl transition-all ${reportMode === 'benchmarking' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>Monitor Insumos</button>
       </div>

       {reportMode === 'global' ? (
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
       ) : (
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
    </div>
  );
};
