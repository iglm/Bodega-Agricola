
import React, { useMemo } from 'react';
import { InventoryItem, AgendaEvent, HarvestLog, LaborLog, Movement, MaintenanceLog, FinanceLog } from '../types';
import { formatCurrency, getCostPerGramOrMl, formatBaseQuantity } from '../services/inventoryService';
import { TrendingDown, TrendingUp, DollarSign, Package, AlertTriangle, Image as ImageIcon, Search, PieChart, Activity, Briefcase, Trash2 } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  agenda?: AgendaEvent[];
  // Financial Data
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
  inventory, 
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

  // --- KPI CALCULATIONS ---
  const kpis = useMemo(() => {
      // 1. Total Inventory Value
      const totalInventoryValue = inventory.reduce((acc, item) => {
          const cost = getCostPerGramOrMl(item);
          return acc + (item.currentQuantity * cost);
      }, 0);

      // 2. Monthly Cash Flow (Simple estimate based on current month data)
      const currentMonth = new Date().getMonth();
      const currentYear = new Date().getFullYear();
      
      const isThisMonth = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      };

      const incomeHarvest = harvests.filter(h => isThisMonth(h.date)).reduce((acc, h) => acc + h.totalValue, 0);
      const incomeOther = financeLogs.filter(f => f.type === 'INCOME' && isThisMonth(f.date)).reduce((acc, f) => acc + f.amount, 0);
      
      const expenseLabor = laborLogs.filter(l => isThisMonth(l.date)).reduce((acc, l) => acc + l.value, 0);
      const expenseInputs = movements.filter(m => m.type === 'OUT' && isThisMonth(m.date)).reduce((acc, m) => acc + m.calculatedCost, 0); // Approx cost of used inputs
      const expenseMaint = maintenanceLogs.filter(m => isThisMonth(m.date)).reduce((acc, m) => acc + m.cost, 0);
      const expenseAdmin = financeLogs.filter(f => f.type === 'EXPENSE' && isThisMonth(f.date)).reduce((acc, f) => acc + f.amount, 0);

      const netMonthly = (incomeHarvest + incomeOther) - (expenseLabor + expenseInputs + expenseMaint + expenseAdmin);

      // 3. Pending Tasks
      const pendingTasks = agenda.filter(a => !a.completed).length;

      return {
          totalInventoryValue,
          netMonthly,
          pendingTasks,
          incomeMonthly: incomeHarvest + incomeOther,
          expenseMonthly: expenseLabor + expenseInputs + expenseMaint + expenseAdmin
      };
  }, [inventory, harvests, laborLogs, movements, maintenanceLogs, financeLogs, agenda]);


  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = ['Todos', ...new Set(inventory.map(i => i.category))];

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* FINANCIAL SUMMARY CARDS */}
      <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                          <DollarSign className="w-4 h-4 text-emerald-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Valor Bodega</span>
                  </div>
                  <p className="text-xl font-bold text-white font-mono">
                      {formatCurrency(kpis.totalInventoryValue)}
                  </p>
              </div>
              {/* Decor */}
              <div className="absolute -right-4 -bottom-4 opacity-10">
                  <Package className="w-24 h-24 text-emerald-500" />
              </div>
          </div>

          <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 shadow-lg relative overflow-hidden">
              <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 bg-blue-500/20 rounded-lg">
                          <Activity className="w-4 h-4 text-blue-400" />
                      </div>
                      <span className="text-xs font-bold text-slate-400 uppercase">Flujo Caja (Mes)</span>
                  </div>
                  <p className={`text-xl font-bold font-mono ${kpis.netMonthly >= 0 ? 'text-blue-400' : 'text-red-400'}`}>
                      {kpis.netMonthly > 0 ? '+' : ''}{formatCurrency(kpis.netMonthly)}
                  </p>
              </div>
              <div className="absolute -right-4 -bottom-4 opacity-10">
                  <PieChart className="w-24 h-24 text-blue-500" />
              </div>
          </div>
      </div>

      {/* QUICK STATS ROW */}
      <div className="flex gap-3 overflow-x-auto pb-2">
          <div className="min-w-[120px] bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Tareas Pendientes</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {kpis.pendingTasks} <Briefcase className="w-3 h-3 text-slate-400"/>
              </span>
          </div>
          <div className="min-w-[120px] bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Items Bajos</span>
              <span className="text-lg font-bold text-red-500 flex items-center gap-1">
                  {inventory.filter(i => i.minStock && i.currentQuantity <= i.minStock).length} <AlertTriangle className="w-3 h-3"/>
              </span>
          </div>
          <div className="min-w-[120px] bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 flex flex-col justify-center">
              <span className="text-[10px] text-slate-500 font-bold uppercase">Total Items</span>
              <span className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                  {inventory.length} <Package className="w-3 h-3 text-slate-400"/>
              </span>
          </div>
      </div>

      {/* INVENTORY LIST HEADER & FILTERS */}
      <div className="sticky top-[60px] z-20 bg-slate-100 dark:bg-slate-900 pb-2 pt-1 transition-colors">
        <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 mb-3">
          <Search className="w-5 h-5 text-slate-400 ml-1" />
          <input 
            type="text" 
            placeholder="Buscar insumo..." 
            className="bg-transparent border-none outline-none text-slate-800 dark:text-white text-sm w-full placeholder-slate-400"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                filterCategory === cat 
                  ? 'bg-slate-800 dark:bg-white text-white dark:text-slate-900 shadow-md transform scale-105' 
                  : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* INVENTORY GRID */}
      <div className="grid gap-4 sm:grid-cols-2">
        {filteredInventory.length === 0 ? (
            <div className="col-span-full text-center py-10 opacity-50">
                <Package className="w-12 h-12 mx-auto mb-2 text-slate-400" />
                <p className="text-slate-500">No se encontraron insumos.</p>
            </div>
        ) : (
            filteredInventory.map((item) => {
                const isLowStock = item.minStock && item.currentQuantity <= item.minStock;
                const totalVal = item.currentQuantity * getCostPerGramOrMl(item);

                return (
                    <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-2xl p-4 shadow-sm border transition-all relative overflow-hidden group ${isLowStock ? 'border-red-500/50 shadow-red-500/10' : 'border-slate-200 dark:border-slate-700 hover:border-emerald-500/50'}`}>
                        
                        {/* Low Stock Indicator */}
                        {isLowStock && (
                            <div className="absolute top-0 right-0 bg-red-500 text-white text-[9px] font-bold px-2 py-1 rounded-bl-lg z-10 flex items-center gap-1">
                                <AlertTriangle className="w-3 h-3" /> BAJO STOCK
                            </div>
                        )}

                        <div className="flex gap-4">
                            {/* Image / Icon */}
                            <div onClick={() => onViewHistory(item)} className="w-16 h-16 rounded-xl bg-slate-100 dark:bg-slate-900 flex-shrink-0 overflow-hidden cursor-pointer border border-slate-100 dark:border-slate-700 relative">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                                        <ImageIcon className="w-8 h-8" />
                                    </div>
                                )}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                                    <Search className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-md" />
                                </div>
                            </div>

                            {/* Details */}
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-bold text-slate-800 dark:text-white truncate pr-2 text-base">{item.name}</h3>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">{item.category}</p>
                                
                                <div className="flex items-end justify-between">
                                    <div>
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Disponible</p>
                                        <p className={`text-lg font-bold ${isLowStock ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>
                                            {formatBaseQuantity(item.currentQuantity, item.baseUnit)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Valor Est.</p>
                                        <p className="text-lg font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                            {formatCurrency(totalVal)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Actions Footer */}
                        <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center justify-between gap-2">
                             <div className="flex gap-2">
                                <button 
                                    onClick={() => onAddMovement(item, 'IN')}
                                    className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                                    title="Registrar Entrada / Compra"
                                >
                                    <TrendingUp className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onAddMovement(item, 'OUT')}
                                    className="p-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors"
                                    title="Registrar Salida / Gasto"
                                >
                                    <TrendingDown className="w-4 h-4" />
                                </button>
                                <button 
                                    onClick={() => onViewHistory(item)}
                                    className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors"
                                    title="Ver Historial"
                                >
                                    <Activity className="w-4 h-4" />
                                </button>
                             </div>

                             {isAdmin && (
                                <button 
                                    onClick={() => onDelete(item.id)}
                                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-400 hover:text-red-500 transition-colors"
                                    title="Eliminar Insumo"
                                >
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
  );
};
