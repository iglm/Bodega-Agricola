
import React, { useMemo } from 'react';
import { InventoryItem, AgendaEvent, HarvestLog, LaborLog, Movement, MaintenanceLog, FinanceLog } from '../types';
import { formatCurrency, getCostPerGramOrMl, formatBaseQuantity } from '../services/inventoryService';
import { TrendingDown, TrendingUp, DollarSign, Package, AlertTriangle, Image as ImageIcon, Search, PieChart, Activity, Trash2, Calendar, Clock, Wallet } from 'lucide-react';

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
  agenda = [],
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

  const alerts = useMemo(() => {
    const today = new Date();
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(today.getDate() + 30);

    const expired = inventory.filter(i => i.expirationDate && new Date(i.expirationDate) < today);
    const nearExpiration = inventory.filter(i => i.expirationDate && new Date(i.expirationDate) >= today && new Date(i.expirationDate) <= thirtyDaysFromNow);
    const lowStock = inventory.filter(i => i.minStock && i.currentQuantity <= i.minStock);
    const pendingDebt = laborLogs.filter(l => !l.paid).reduce((acc, l) => acc + l.value, 0);

    return { expired, nearExpiration, lowStock, pendingDebt };
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
      const incomeOther = financeLogs.filter(f => f.type === 'INCOME' && isThisMonth(f.date)).reduce((acc, f) => acc + f.amount, 0);
      const expenseLabor = laborLogs.filter(l => isThisMonth(l.date)).reduce((acc, l) => acc + l.value, 0);
      const expenseInputs = movements.filter(m => m.type === 'OUT' && isThisMonth(m.date)).reduce((acc, m) => acc + m.calculatedCost, 0);
      const expenseMaint = maintenanceLogs.filter(m => isThisMonth(m.date)).reduce((acc, m) => acc + m.cost, 0);
      const expenseAdmin = financeLogs.filter(f => f.type === 'EXPENSE' && isThisMonth(f.date)).reduce((acc, f) => acc + f.amount, 0);

      return {
          totalInventoryValue,
          netMonthly: (incomeHarvest + incomeOther) - (expenseLabor + expenseInputs + expenseMaint + expenseAdmin)
      };
  }, [inventory, harvests, laborLogs, movements, maintenanceLogs, financeLogs]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = useMemo(() => {
    return ['Todos', ...Array.from(new Set(inventory.map(i => String(i.category))))];
  }, [inventory]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* ALERTS SECTION */}
      {(alerts.expired.length > 0 || alerts.lowStock.length > 0 || alerts.pendingDebt > 0) && (
        <div className="space-y-2">
            <h3 className="text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest px-1">Alertas Prioritarias</h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                {alerts.pendingDebt > 0 && (
                    <div className="min-w-[180px] bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-3 rounded-2xl flex items-center gap-3">
                        <div className="bg-amber-500 p-2 rounded-xl text-white"><Wallet className="w-4 h-4" /></div>
                        <div>
                            <p className="text-[9px] font-bold text-amber-600 dark:text-amber-400 uppercase">Deuda Nómina</p>
                            <p className="text-sm font-black text-amber-900 dark:text-amber-100">{formatCurrency(alerts.pendingDebt)}</p>
                        </div>
                    </div>
                )}
                {alerts.expired.length > 0 && (
                    <div className="min-w-[180px] bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 p-3 rounded-2xl flex items-center gap-3">
                        <div className="bg-red-500 p-2 rounded-xl text-white"><AlertTriangle className="w-4 h-4" /></div>
                        <div>
                            <p className="text-[9px] font-bold text-red-600 dark:text-red-400 uppercase">Vencidos</p>
                            <p className="text-sm font-black text-red-900 dark:text-red-100">{alerts.expired.length} Productos</p>
                        </div>
                    </div>
                )}
                {alerts.lowStock.length > 0 && (
                    <div className="min-w-[180px] bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 p-3 rounded-2xl flex items-center gap-3">
                        <div className="bg-orange-500 p-2 rounded-xl text-white"><Package className="w-4 h-4" /></div>
                        <div>
                            <p className="text-[9px] font-bold text-orange-600 dark:text-orange-400 uppercase">Stock Bajo</p>
                            <p className="text-sm font-black text-orange-900 dark:text-orange-100">{alerts.lowStock.length} Insumos</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
      )}

      {/* KPI CARDS */}
      <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                  <DollarSign className="w-4 h-4 text-emerald-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Valor en Bodega</span>
              </div>
              <p className="text-2xl font-black text-slate-800 dark:text-white font-mono">
                  {formatCurrency(kpis.totalInventoryValue)}
              </p>
          </div>

          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm">
              <div className="flex items-center gap-2 mb-1">
                  <PieChart className="w-4 h-4 text-blue-500" />
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider">Balance Mes</span>
              </div>
              <p className={`text-2xl font-black font-mono ${kpis.netMonthly >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-red-500'}`}>
                  {formatCurrency(kpis.netMonthly)}
              </p>
          </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sticky top-[60px] z-20 bg-slate-100 dark:bg-slate-900 pt-2 pb-1 transition-colors">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400" />
              <input 
                type="text" 
                placeholder="Buscar insumo..." 
                className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-white font-medium"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className={`px-5 py-2 rounded-xl text-xs font-black whitespace-nowrap transition-all ${
                    filterCategory === cat 
                      ? 'bg-emerald-600 text-white' 
                      : 'bg-white dark:bg-slate-800 text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
                  }`}
                >
                  {cat.toUpperCase()}
                </button>
              ))}
            </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
            {filteredInventory.length === 0 ? (
                <div className="col-span-full text-center py-20 bg-white/50 dark:bg-slate-800/50 rounded-3xl border-2 border-dashed border-slate-200 dark:border-slate-700">
                    <Package className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">No hay resultados</p>
                </div>
            ) : (
                filteredInventory.map((item) => {
                    const isLowStock = item.minStock && item.currentQuantity <= item.minStock;
                    const isExpired = item.expirationDate && new Date(item.expirationDate) < new Date();
                    const totalVal = item.currentQuantity * getCostPerGramOrMl(item);

                    return (
                        <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-3xl p-5 shadow-sm border transition-all hover:shadow-xl group ${isExpired ? 'border-red-500/30' : isLowStock ? 'border-orange-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                            
                            <div className="flex gap-4">
                                <div onClick={() => onViewHistory(item)} className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 flex-shrink-0 overflow-hidden cursor-pointer border border-slate-100 dark:border-slate-700 relative">
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-700">
                                            <ImageIcon className="w-10 h-10" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 min-w-0">
                                    <h3 className="font-black text-slate-800 dark:text-white truncate text-lg">{item.name}</h3>
                                    <span className="text-[10px] font-black text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-0.5 rounded-full uppercase">
                                        {item.category}
                                    </span>
                                    
                                    <div className="mt-4 flex items-end justify-between">
                                        <div>
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Disponible</p>
                                            <p className={`text-xl font-black ${isLowStock ? 'text-orange-500' : isExpired ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                                {formatBaseQuantity(item.currentQuantity, item.baseUnit)}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-slate-400 uppercase font-black tracking-tighter">Valor</p>
                                            <p className="text-xl font-mono font-black text-emerald-600">
                                                {formatCurrency(totalVal)}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between">
                                 <div className="flex gap-2">
                                    <button onClick={() => onAddMovement(item, 'IN')} className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 hover:bg-emerald-600 hover:text-white transition-all">
                                        <TrendingUp className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onAddMovement(item, 'OUT')} className="p-3 rounded-2xl bg-red-50 dark:bg-red-900/30 text-red-600 hover:bg-red-600 hover:text-white transition-all">
                                        <TrendingDown className="w-4 h-4" />
                                    </button>
                                    <button onClick={() => onViewHistory(item)} className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-900/30 text-blue-600 hover:bg-blue-600 hover:text-white transition-all">
                                        <Activity className="w-4 h-4" />
                                    </button>
                                 </div>

                                 {isAdmin && (
                                    <button onClick={() => onDelete(item.id)} className="p-3 rounded-2xl hover:bg-red-50 dark:hover:bg-red-900/30 text-slate-300 hover:text-red-500 transition-all">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                 )}
                            </div>
                        </div>
                    );
                })
            )}
        </div>
      </div>
    </div>
  );
};
