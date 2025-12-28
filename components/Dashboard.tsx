
import React, { useMemo, useState } from 'react';
import { InventoryItem, Category, Unit, AgendaEvent, HarvestLog, LaborLog, Movement, MaintenanceLog, FinanceLog } from '../types';
import { getBaseUnitType, formatBaseQuantity, formatCurrency, getCostPerGramOrMl } from '../services/inventoryService';
import { Edit2, Trash2, TrendingDown, TrendingUp, DollarSign, Scale, Package, History, AlertTriangle, Image as ImageIcon, Search, X, Calendar, ArrowRight, Bell, Wallet, PieChart, Activity } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  agenda?: AgendaEvent[];
  // Financial Data for Decision Making
  harvests?: HarvestLog[];
  laborLogs?: LaborLog[];
  movements?: Movement[];
  maintenanceLogs?: MaintenanceLog[];
  financeLogs?: FinanceLog[]; // Added
  
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
    isAdmin = true 
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // --- FINANCIAL INTELLIGENCE (DECISION MAKING) ---
  const financialStatus = useMemo(() => {
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();

      const isCurrentMonth = (dateStr: string) => {
          const d = new Date(dateStr);
          return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      };

      // 1. Calculate Monthly Income (Harvests + Other Income)
      const harvestIncome = harvests.filter(h => isCurrentMonth(h.date)).reduce((acc, h) => acc + h.totalValue, 0);
      const otherIncome = financeLogs.filter(f => f.type === 'INCOME' && isCurrentMonth(f.date)).reduce((acc, f) => acc + f.amount, 0);
      const totalIncome = harvestIncome + otherIncome;

      // 2. Calculate Monthly Expenses (Labor + Inputs + Maintenance + General Expenses)
      const laborExpense = laborLogs.filter(l => isCurrentMonth(l.date)).reduce((acc, l) => acc + l.value, 0);
      const inputsExpense = movements.filter(m => m.type === 'OUT' && isCurrentMonth(m.date)).reduce((acc, m) => acc + m.calculatedCost, 0);
      const maintExpense = maintenanceLogs.filter(m => isCurrentMonth(m.date)).reduce((acc, m) => acc + m.cost, 0);
      const generalExpense = financeLogs.filter(f => f.type === 'EXPENSE' && isCurrentMonth(f.date)).reduce((acc, f) => acc + f.amount, 0);

      const totalMonthlyExpense = laborExpense + inputsExpense + maintExpense + generalExpense;
      const netMonthly = totalIncome - totalMonthlyExpense;

      // 3. Inventory Valuation
      const warehouseValue = inventory.reduce((acc, item) => {
        const costPerBase = getCostPerGramOrMl(item);
        return acc + (item.currentQuantity * costPerBase);
      }, 0);

      return {
          monthlyIncome: totalIncome,
          totalMonthlyExpense,
          netMonthly,
          warehouseValue,
          generalExpense,
          isProfitable: netMonthly >= 0
      };
  }, [harvests, laborLogs, movements, maintenanceLogs, financeLogs, inventory]);

  // --- SMART ALERTS LOGIC ---
  const alerts = useMemo(() => {
      const today = new Date();
      const lowStock: InventoryItem[] = [];
      const expiring: { item: InventoryItem, days: number }[] = [];

      inventory.forEach(item => {
          // Check Low Stock
          if (item.minStock && item.currentQuantity <= item.minStock) {
              lowStock.push(item);
          }
          // Check Expiration
          if (item.expirationDate) {
              const exp = new Date(item.expirationDate);
              const diffTime = exp.getTime() - today.getTime();
              const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              if (days <= 60) { 
                  expiring.push({ item, days });
              }
          }
      });

      return { lowStock, expiring: expiring.sort((a,b) => a.days - b.days) };
  }, [inventory]);

  const pendingTasks = useMemo(() => {
      return agenda.filter(a => !a.completed).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(0, 3);
  }, [agenda]);

  // Filter Inventory based on Search Term
  const filteredInventory = useMemo(() => {
    if (!searchTerm.trim()) return inventory;
    const lowerTerm = searchTerm.toLowerCase();
    return inventory.filter(i => 
      i.name.toLowerCase().includes(lowerTerm) || 
      i.category.toLowerCase().includes(lowerTerm)
    );
  }, [inventory, searchTerm]);

  const categories = Object.values(Category);

  return (
    <div className="space-y-6 pb-20">
      
      {/* 1. FINANCIAL COMMAND CENTER (UPDATED) */}
      {isAdmin && !searchTerm && (
          <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl shadow-slate-900/20 border border-slate-700 animate-fade-in relative overflow-hidden">
              {/* Background Decoration */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
              
              <div className="flex justify-between items-start relative z-10 mb-4">
                  <div>
                      <h2 className="text-lg font-bold flex items-center gap-2 text-slate-100">
                          <Activity className="w-5 h-5 text-emerald-400" />
                          Flujo de Caja Real (Mes)
                      </h2>
                      <p className="text-xs text-slate-400 mt-0.5">Utilidad Neta (Operativa - Administrativa)</p>
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-bold border ${financialStatus.isProfitable ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50' : 'bg-red-500/20 text-red-300 border-red-500/50'}`}>
                      {financialStatus.isProfitable ? 'EN VERDE' : 'DÉFICIT'}
                  </div>
              </div>

              <div className="grid grid-cols-2 gap-4 relative z-10">
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><TrendingUp className="w-3 h-3 text-emerald-500"/> Ingresos Totales</p>
                      <p className="text-lg font-bold font-mono text-emerald-400">{formatCurrency(financialStatus.monthlyIncome)}</p>
                  </div>
                  <div className="bg-slate-800/50 p-3 rounded-xl border border-slate-700">
                      <p className="text-xs text-slate-400 mb-1 flex items-center gap-1"><TrendingDown className="w-3 h-3 text-red-500"/> Gastos Totales</p>
                      <p className="text-lg font-bold font-mono text-red-400">{formatCurrency(financialStatus.totalMonthlyExpense)}</p>
                  </div>
              </div>

              {financialStatus.generalExpense > 0 && (
                  <div className="mt-2 text-[10px] text-slate-400 bg-slate-800/30 p-1.5 rounded text-center border border-slate-700/50">
                      (Incluye {formatCurrency(financialStatus.generalExpense)} en gastos administrativos/generales)
                  </div>
              )}

              <div className="mt-3 pt-3 border-t border-slate-700 flex justify-between items-center relative z-10">
                  <span className="text-xs font-bold text-slate-400 uppercase">Utilidad Neta Mes</span>
                  <span className={`text-xl font-bold font-mono ${financialStatus.netMonthly >= 0 ? 'text-blue-300' : 'text-orange-400'}`}>
                      {financialStatus.netMonthly >= 0 ? '+' : ''} {formatCurrency(financialStatus.netMonthly)}
                  </span>
              </div>
          </div>
      )}

      {/* 2. ALERTS & AGENDA */}
      {(alerts.lowStock.length > 0 || alerts.expiring.length > 0 || pendingTasks.length > 0) && !searchTerm && (
          <div className="grid gap-3 sm:grid-cols-2 animate-fade-in">
              {/* Critical Alerts */}
              {(alerts.lowStock.length > 0 || alerts.expiring.length > 0) && (
                  <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl border border-red-200 dark:border-red-900/30">
                      <h4 className="text-red-700 dark:text-red-400 font-bold text-sm mb-2 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4" /> Alertas Inventario
                      </h4>
                      <div className="space-y-1">
                          {alerts.expiring.slice(0, 1).map(({item, days}) => (
                              <div key={item.id} className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
                                  <span>{item.name}</span>
                                  <span className="font-bold text-orange-500">Vence: {days} días</span>
                              </div>
                          ))}
                          {alerts.lowStock.slice(0, 2).map(item => (
                              <div key={item.id} className="flex justify-between items-center text-xs text-slate-700 dark:text-slate-300">
                                  <span>{item.name}</span>
                                  <span className="font-bold text-red-500">Stock Bajo</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}

              {/* Agenda Snapshot */}
              {pendingTasks.length > 0 && (
                  <div className="bg-indigo-50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/30">
                      <h4 className="text-indigo-700 dark:text-indigo-400 font-bold text-sm mb-2 flex items-center gap-2">
                          <Calendar className="w-4 h-4" /> Tareas Pendientes
                      </h4>
                      <div className="space-y-1">
                          {pendingTasks.slice(0,2).map(task => (
                              <div key={task.id} className="flex items-center gap-2 text-xs text-slate-700 dark:text-slate-300 truncate">
                                  <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 flex-shrink-0"></div>
                                  <span className="truncate">{task.title}</span>
                              </div>
                          ))}
                      </div>
                  </div>
              )}
          </div>
      )}

      {/* 3. WAREHOUSE VALUE STAT */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
          <div className="flex items-center gap-3">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-lg text-blue-600 dark:text-blue-400">
                  <Package className="w-5 h-5" />
              </div>
              <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-bold uppercase">Valor en Bodega</p>
                  <p className="text-sm text-slate-400">{inventory.length} Productos registrados</p>
              </div>
          </div>
          {isAdmin ? (
             <p className="text-lg font-bold text-slate-800 dark:text-white font-mono">{formatCurrency(financialStatus.warehouseValue)}</p>
          ) : (
             <p className="text-lg font-bold text-slate-800 dark:text-white font-mono blur-sm">$ ---</p>
          )}
      </div>

      {/* 4. SEARCH & LIST */}
      <div className="sticky top-[60px] z-20 bg-slate-100 dark:bg-slate-900 pt-2 pb-2">
        <div className="relative shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-slate-400" />
            </div>
            <input
            type="text"
            className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors"
            placeholder="Buscar insumo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
            <button 
                onClick={() => setSearchTerm('')}
                className="absolute inset-y-0 right-0 pr-3 flex items-center cursor-pointer text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
                <X className="h-4 w-4" />
            </button>
            )}
        </div>
      </div>

      {/* Inventory List */}
      <div className="space-y-4">
        {inventory.length === 0 ? (
          <div className="text-center py-10 bg-white/50 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700 transition-colors">
            <p className="text-slate-500 dark:text-slate-400">La bodega está vacía.</p>
            <p className="text-sm text-slate-400 dark:text-slate-500 mt-2">Agregue su primer insumo usando el botón +</p>
          </div>
        ) : filteredInventory.length === 0 ? (
          <div className="text-center py-8 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700">
             <Search className="w-8 h-8 mx-auto text-slate-400 mb-2" />
             <p className="text-slate-500 dark:text-slate-400">No se encontraron productos con "{searchTerm}"</p>
          </div>
        ) : (
          categories.map(cat => {
            const items = filteredInventory.filter(i => i.category === cat);
            if (items.length === 0) return null;

            return (
              <div key={cat} className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider pl-1">{cat}</h4>
                {items.map(item => {
                  const unitType = getBaseUnitType(item.lastPurchaseUnit);
                  const costPerBase = getCostPerGramOrMl(item);
                  const isLowStock = item.minStock && item.currentQuantity <= item.minStock;
                  
                  // Expiration Logic
                  let expiryStatus: 'expired' | 'warning' | 'good' | null = null;
                  if (item.expirationDate) {
                      const exp = new Date(item.expirationDate);
                      const now = new Date();
                      const diffTime = exp.getTime() - now.getTime();
                      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      if (days <= 0) expiryStatus = 'expired';
                      else if (days <= 60) expiryStatus = 'warning';
                      else expiryStatus = 'good';
                  }
                  
                  let unitCostDisplay = '';
                  if (unitType === 'g') {
                    unitCostDisplay = `${formatCurrency(costPerBase)} / g`;
                  } else if (unitType === 'ml') {
                    unitCostDisplay = `${formatCurrency(costPerBase)} / ml`;
                  }

                  return (
                    <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-xl border p-4 shadow-sm hover:border-emerald-500/30 transition-all duration-300 ${
                        isLowStock ? 'border-red-500/50 dark:border-red-500/50 shadow-red-100 dark:shadow-red-900/10' : 'border-slate-200 dark:border-slate-700'
                    }`}>
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex gap-3">
                           {/* Thumbnail */}
                           <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center overflow-hidden border border-slate-200 dark:border-slate-600 relative">
                             {item.image ? (
                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                             ) : (
                                <ImageIcon className="w-5 h-5 text-slate-400" />
                             )}
                             {expiryStatus === 'expired' && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse border border-white"></div>}
                             {expiryStatus === 'warning' && <div className="absolute top-1 right-1 w-2.5 h-2.5 bg-yellow-500 rounded-full border border-white"></div>}
                           </div>
                           
                           {/* Details */}
                           <div>
                            <div className="flex items-center gap-2">
                                <h5 className="font-bold text-slate-800 dark:text-white text-lg leading-tight">{item.name}</h5>
                                {isLowStock && (
                                    <span className="bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300 text-[9px] px-1.5 py-0.5 rounded font-bold border border-red-200 dark:border-red-800 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> BAJO
                                    </span>
                                )}
                            </div>
                            <div className="flex flex-col gap-0.5 mt-0.5">
                                <p className="text-xs text-slate-500 dark:text-slate-400">Ref: {item.lastPurchaseUnit} a {formatCurrency(item.lastPurchasePrice)}</p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <p className={`font-mono font-bold text-lg ${isLowStock ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                            {formatBaseQuantity(item.currentQuantity, unitType)}
                          </p>
                          <p className="text-[10px] text-slate-400 dark:text-slate-500">Stock Actual</p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/50">
                        <div className="text-xs text-blue-600 dark:text-blue-300 font-mono bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded">
                          Valor: {unitCostDisplay}
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => onViewHistory(item)}
                            className="p-2 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/50 border border-blue-200 dark:border-blue-800"
                            title="Ver Historial"
                          >
                            <History className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onAddMovement(item, 'IN')}
                            className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 border border-emerald-200 dark:border-emerald-800"
                            title="Entrada"
                          >
                            <TrendingUp className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => onAddMovement(item, 'OUT')}
                            className="p-2 rounded-lg bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/50 border border-red-200 dark:border-red-800"
                            title="Salida"
                          >
                            <TrendingDown className="w-4 h-4" />
                          </button>
                           <button 
                            onClick={() => onDelete(item.id)}
                            className={`p-2 rounded-lg border transition-colors ${isAdmin ? 'bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 hover:bg-red-500 hover:text-white border-slate-200 dark:border-slate-600 hover:border-red-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-300 dark:text-slate-600 cursor-not-allowed border-transparent'}`}
                            disabled={!isAdmin}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
