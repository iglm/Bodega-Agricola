
import React, { useMemo, useState, useEffect } from 'react';
import { InventoryItem, AgendaEvent, HarvestLog, LaborLog, Movement, MaintenanceLog, FinanceLog } from '../types';
import { formatCurrency, getCostPerGramOrMl, formatBaseQuantity } from '../services/inventoryService';
import { getStorageUsage } from '../services/imageService';
import { TrendingDown, TrendingUp, DollarSign, Package, AlertTriangle, Image as ImageIcon, Search, PieChart, Activity, Trash2, Calendar, Clock, Wallet, HeartPulse, HardDrive, Edit3, Save, Eraser, Pickaxe, Target, Plus } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  agenda?: AgendaEvent[];
  harvests?: HarvestLog[];
  laborLogs?: LaborLog[];
  movements?: Movement[];
  maintenanceLogs?: MaintenanceLog[];
  financeLogs?: FinanceLog[];
  onAddMovement: (item: InventoryItem, type: 'IN' | 'OUT') => void;
  onDelete: (id: string) => void;
  onViewHistory: (item: InventoryItem) => void;
  isAdmin?: boolean; 
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  inventory = [], 
  harvests = [],
  laborLogs = [],
  movements = [],
  maintenanceLogs = [],
  financeLogs = [],
  onAddMovement, 
  onDelete, 
  onViewHistory,
  isAdmin
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('Todos');
  
  // Scratchpad State
  const [scratchpad, setScratchpad] = useState(() => localStorage.getItem('dashboard_scratchpad') || '');
  const [isSavingNote, setIsSavingNote] = useState(false);

  useEffect(() => {
      const handler = setTimeout(() => {
          localStorage.setItem('dashboard_scratchpad', scratchpad);
          setIsSavingNote(false);
      }, 1000);
      return () => clearTimeout(handler);
  }, [scratchpad]);

  const handleNoteChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      setScratchpad(e.target.value);
      setIsSavingNote(true);
  };

  const storage = useMemo(() => getStorageUsage(), [inventory, movements]);

  const alerts = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);
    const expired = inventory.filter(i => i.expirationDate && new Date(i.expirationDate) < today);
    const lowStock = inventory.filter(i => i.minStock && i.currentQuantity <= i.minStock);
    const pendingDebt = laborLogs.filter(l => !l.paid).reduce((acc, l) => acc + l.value, 0);
    return { expired, lowStock, pendingDebt };
  }, [inventory, laborLogs]);

  const kpis = useMemo(() => {
      const totalInventoryValue = inventory.reduce((acc, item) => acc + (item.currentQuantity * getCostPerGramOrMl(item)), 0);
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      const isThisMonth = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      };

      const incomeHarvest = harvests.filter(h => isThisMonth(h.date)).reduce((acc, h) => acc + h.totalValue, 0);
      const expenseLabor = laborLogs.filter(l => isThisMonth(l.date)).reduce((acc, l) => acc + l.value, 0);
      const expenseInputs = movements.filter(m => m.type === 'OUT' && isThisMonth(m.date)).reduce((acc, m) => acc + m.calculatedCost, 0);
      const totalIncome = incomeHarvest;
      const totalExpense = expenseLabor + expenseInputs;

      return { totalInventoryValue, netMonthly: totalIncome - totalExpense, totalIncome, totalExpense };
  }, [inventory, harvests, laborLogs, movements]);

  const renderHealthRing = () => {
      const { totalIncome, totalExpense } = kpis;
      const total = totalIncome + totalExpense || 1;
      const incomePerc = (totalIncome / total) * 100;
      const radius = 15;
      const circumference = 2 * Math.PI * radius;
      const offset = circumference - (incomePerc / 100) * circumference;

      return (
          <div className="flex items-center gap-3">
              <div className="relative w-12 h-12">
                  <svg className="w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-red-500/20" />
                      <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="4" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} className="text-emerald-500" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                      <HeartPulse className="w-3 h-3 text-white opacity-40" />
                  </div>
              </div>
              <div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Salud Mensual</p>
                  <p className={`text-sm font-black ${kpis.netMonthly >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                      {kpis.netMonthly >= 0 ? 'Rentable' : 'En Pérdida'}
                  </p>
              </div>
          </div>
      );
  };

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(inventory.map(i => String(i.category))))], [inventory]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* SUMMARY DASHBOARD */}
      <div className="bg-slate-800 rounded-[2.5rem] p-6 border border-slate-700 shadow-2xl shadow-emerald-900/10 relative overflow-hidden">
          <div className="flex justify-between items-center mb-6">
              {renderHealthRing()}
              <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Balance Neto</p>
                  <p className={`text-xl font-black font-mono ${kpis.netMonthly >= 0 ? 'text-white' : 'text-red-400'}`}>
                      {formatCurrency(kpis.netMonthly)}
                  </p>
              </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                      <DollarSign className="w-3 h-3 text-emerald-500" />
                      <span className="text-[8px] font-black text-slate-500 uppercase">En Bodega</span>
                  </div>
                  <p className="text-sm font-black text-slate-200">{formatCurrency(kpis.totalInventoryValue)}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-3xl border border-slate-700/50">
                  <div className="flex items-center gap-2 mb-1">
                      <Wallet className="w-3 h-3 text-amber-500" />
                      <span className="text-[8px] font-black text-slate-500 uppercase">Deuda Nómina</span>
                  </div>
                  <p className="text-sm font-black text-slate-200">{formatCurrency(alerts.pendingDebt)}</p>
              </div>
          </div>

          {/* BITÁCORA DE CAMPO (SCRATCHPAD) */}
          <div className="mt-4 pt-4 border-t border-slate-700/50">
              <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-2">
                      <Edit3 className="w-3 h-3 text-indigo-400" />
                      <span className="text-[9px] font-black text-indigo-300 uppercase tracking-widest">Bitácora Rápida</span>
                  </div>
                  {isSavingNote && <span className="text-[8px] text-slate-500 animate-pulse">Guardando...</span>}
              </div>
              <textarea 
                  value={scratchpad}
                  onChange={handleNoteChange}
                  placeholder="Pega aquí los reportes de WhatsApp o notas rápidas de campo..."
                  className="w-full bg-slate-900/80 border border-slate-700 rounded-xl p-3 text-xs text-slate-300 placeholder-slate-600 focus:border-indigo-500 outline-none resize-none h-20 font-medium"
              />
          </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3">
          <button onClick={() => (document.getElementById('root')?.querySelector('button[aria-label="Nueva Tarea"]') as HTMLElement)?.click() /* Hacky but works for demo, better to use context */} className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3 active:scale-95 transition-transform group">
              <div className="bg-indigo-100 dark:bg-indigo-900/30 p-2 rounded-xl text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
                  <Calendar className="w-5 h-5" />
              </div>
              <div className="text-left">
                  <p className="text-xs font-black text-slate-700 dark:text-white uppercase">Agenda</p>
                  <p className="text-[9px] text-slate-400">Ver Tareas</p>
              </div>
          </button>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <HardDrive className={`w-4 h-4 ${storage.percent > 80 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                  <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase">Espacio</p>
                      <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                          <div className={`h-full transition-all duration-1000 ${storage.percent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${storage.percent}%` }}></div>
                      </div>
                  </div>
              </div>
              <span className="text-[9px] font-mono text-slate-400">{storage.used.toFixed(1)}MB</span>
          </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sticky top-[60px] z-20 bg-slate-100 dark:bg-slate-900 pt-2 pb-1 transition-colors">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Buscar insumo..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${filterCategory === cat ? 'bg-emerald-600 text-white' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{cat.toUpperCase()}</button>
              ))}
            </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
            {filteredInventory.map((item) => {
                const isLowStock = item.minStock && item.currentQuantity <= item.minStock;
                const totalVal = item.currentQuantity * getCostPerGramOrMl(item);
                return (
                    <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border transition-all hover:shadow-xl relative group ${isLowStock ? 'border-orange-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                        {isAdmin && (
                            <button 
                                onClick={(e) => { e.stopPropagation(); onDelete(item.id); }} 
                                className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity p-2"
                                title="Eliminar Ítem"
                            >
                                <Trash2 className="w-4 h-4" />
                            </button>
                        )}
                        <div className="flex gap-4">
                            <div onClick={() => onViewHistory(item)} className="w-16 h-16 rounded-2xl bg-slate-100 dark:bg-slate-900 flex-shrink-0 overflow-hidden cursor-pointer border dark:border-slate-700 transition-transform active:scale-90">
                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-8 h-8" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <h3 className="font-black text-slate-800 dark:text-white truncate pr-6">{item.name}</h3>
                                <div className="flex items-end justify-between mt-2">
                                    <div>
                                        <p className="text-[8px] text-slate-400 uppercase font-black">Stock Actual</p>
                                        <p className={`text-sm font-black ${isLowStock ? 'text-orange-500' : 'text-slate-800 dark:text-white'}`}>{formatBaseQuantity(item.currentQuantity, item.baseUnit)}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[8px] text-slate-400 uppercase font-black">Valoración</p>
                                        <p className="text-sm font-mono font-black text-emerald-600">{formatCurrency(totalVal)}</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="mt-4 pt-4 border-t dark:border-slate-700 flex gap-2">
                            <button onClick={() => onAddMovement(item, 'IN')} className="flex-1 p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 font-black text-[10px] uppercase transition-colors hover:bg-emerald-100">Entrada</button>
                            <button onClick={() => onAddMovement(item, 'OUT')} className="flex-1 p-3 rounded-xl bg-red-50 dark:bg-red-900/30 text-red-600 font-black text-[10px] uppercase transition-colors hover:bg-red-100">Salida</button>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
