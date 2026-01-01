
import React, { useMemo, useState, useEffect } from 'react';
import { InventoryItem, AgendaEvent, HarvestLog, LaborLog, Movement, MaintenanceLog, FinanceLog, Unit } from '../types';
import { formatCurrency, getCostPerGramOrMl, formatBaseQuantity, calculatePriceForUnit } from '../services/inventoryService';
import { getStorageUsage } from '../services/imageService';
import { TrendingDown, TrendingUp, DollarSign, Package, AlertTriangle, Image as ImageIcon, Search, PieChart, Activity, Trash2, Calendar, Clock, Wallet, HeartPulse, HardDrive, Edit3, Save, Eraser, Pickaxe, Target, Plus, History, ChevronRight, CalendarRange, Info, Calculator } from 'lucide-react';

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
  onViewGlobalHistory?: () => void;
  isAdmin?: boolean; 
}

export const Dashboard: React.FC<DashboardProps> = ({ 
  inventory = [], 
  harvests = [],
  laborLogs = [],
  movements = [],
  onAddMovement, 
  onDelete, 
  onViewHistory,
  onViewGlobalHistory,
  isAdmin
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('Todos');
  
  const storage = useMemo(() => getStorageUsage(), []);

  const kpis = useMemo(() => {
      const totalValue = inventory.reduce((acc, item) => acc + (item.currentQuantity * item.averageCost), 0);
      const lowStockCount = inventory.filter(i => i.minStock && i.currentQuantity <= i.minStock).length;
      return { totalValue, lowStockCount };
  }, [inventory]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(inventory.map(i => String(i.category))))], [inventory]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* SUMMARY DASHBOARD */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Package className="w-32 h-32 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Valor Total en Bodega</p>
                  <p className="text-4xl font-black text-white font-mono tracking-tighter">{formatCurrency(kpis.totalValue)}</p>
              </div>
              <div className="flex gap-4">
                  <div className="bg-slate-800 p-4 rounded-3xl border border-slate-700 text-center min-w-[120px]">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Productos</p>
                      <p className="text-xl font-black text-white">{inventory.length}</p>
                  </div>
                  <div className={`p-4 rounded-3xl border text-center min-w-[120px] ${kpis.lowStockCount > 0 ? 'bg-red-900/20 border-red-500/30' : 'bg-slate-800 border-slate-700'}`}>
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Stock Bajo</p>
                      <p className={`text-xl font-black ${kpis.lowStockCount > 0 ? 'text-red-500' : 'text-white'}`}>{kpis.lowStockCount}</p>
                  </div>
              </div>
          </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3">
          <button onClick={onViewGlobalHistory} className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center gap-3 active:scale-95 transition-all group">
              <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                  <History className="w-5 h-5" />
              </div>
              <div className="text-left">
                  <p className="text-xs font-black text-slate-700 dark:text-white uppercase">Kárdex Global</p>
                  <p className="text-[9px] text-slate-400">Ver Movimientos</p>
              </div>
          </button>
          
          <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-2">
                  <HardDrive className={`w-4 h-4 ${storage.percent > 80 ? 'text-red-400 animate-pulse' : 'text-slate-400'}`} />
                  <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Memoria Local</p>
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
        <div className="flex flex-col gap-3 sticky top-[120px] z-20 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-md pt-2 pb-2 transition-colors">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Buscar agroinsumo..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-5 py-2 rounded-xl text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-widest ${filterCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{cat}</button>
              ))}
            </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
            {filteredInventory.map((item) => {
                const isLowStock = item.minStock && item.currentQuantity <= item.minStock;
                const baseUnit = item.baseUnit;
                const costPerBase = item.averageCost;
                const costPerKgOrL = costPerBase * 1000;
                const costPerBulto = costPerBase * 50000;

                return (
                    <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-[2rem] p-5 shadow-xl border transition-all hover:shadow-2xl relative group ${isLowStock ? 'border-red-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                        {isLowStock && (
                            <div className="absolute -top-2 -right-2 bg-red-600 text-white p-1.5 rounded-full shadow-lg z-10 animate-bounce">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        )}
                        
                        <div className="flex gap-4 mb-4">
                            <div className="w-20 h-20 rounded-2xl bg-slate-100 dark:bg-slate-900 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner">
                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-10 h-10" /></div>}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex justify-between items-start">
                                    <h3 className="font-black text-slate-800 dark:text-white text-lg leading-tight truncate">{item.name}</h3>
                                    <button onClick={() => onViewHistory(item)} className="p-1.5 bg-slate-100 dark:bg-slate-700 rounded-lg text-slate-400 hover:text-indigo-500 transition-colors"><History className="w-4 h-4" /></button>
                                </div>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">{item.category}</p>
                                <div className="mt-2">
                                    <p className="text-[8px] text-slate-400 uppercase font-black">Stock en Bodega</p>
                                    <p className={`text-lg font-black font-mono tracking-tighter ${isLowStock ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatBaseQuantity(item.currentQuantity, item.baseUnit)}</p>
                                </div>
                            </div>
                        </div>

                        {/* MATEMÁTICA DE COSTOS (INTELIGENTE) */}
                        <div className="bg-slate-50 dark:bg-slate-900/80 p-4 rounded-2xl border border-slate-100 dark:border-slate-700 space-y-2 mb-4">
                            <div className="flex items-center gap-2 mb-2">
                                <Calculator className="w-3 h-3 text-indigo-400" />
                                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Análisis de Costeo</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2">
                                <div>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase">Valor {baseUnit === 'g' ? 'Gramo' : 'ml'}</p>
                                    <p className="text-xs font-black text-indigo-400 font-mono">{formatCurrency(costPerBase, 2)}</p>
                                </div>
                                <div>
                                    <p className="text-[8px] text-slate-500 font-bold uppercase">Valor {baseUnit === 'g' ? 'Kg' : 'Litro'}</p>
                                    <p className="text-xs font-black text-indigo-400 font-mono">{formatCurrency(costPerKgOrL)}</p>
                                </div>
                            </div>

                            {baseUnit === 'g' && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <p className="text-[8px] text-slate-500 font-bold uppercase">Ref. Bulto (50kg)</p>
                                    <p className="text-xs font-black text-white font-mono">{formatCurrency(costPerBulto)}</p>
                                </div>
                            )}
                        </div>

                        <div className="flex gap-2">
                            <button onClick={() => onAddMovement(item, 'IN')} className="flex-1 p-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-900/20 active:scale-95">Entrada</button>
                            <button onClick={() => onAddMovement(item, 'OUT')} className="flex-1 p-3 rounded-xl bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95">Salida</button>
                            {isAdmin && (
                                <button onClick={() => onDelete(item.id)} className="p-3 rounded-xl bg-slate-100 dark:bg-slate-900 text-slate-400 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
