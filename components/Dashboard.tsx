
import React, { useMemo, useState, useEffect } from 'react';
import { InventoryItem, AgendaEvent, HarvestLog, LaborLog, Movement, MaintenanceLog, FinanceLog, Unit } from '../types';
import { formatCurrency, formatBaseQuantity, calculatePriceForUnit } from '../services/inventoryService';
import { getStorageUsage } from '../services/imageService';
import { TrendingDown, TrendingUp, DollarSign, Package, AlertTriangle, Image as ImageIcon, Search, PieChart, Activity, Trash2, Calendar, Clock, Wallet, HeartPulse, HardDrive, Edit3, Save, Eraser, Pickaxe, Target, Plus, History, ChevronRight, CalendarRange, Info, Calculator, FileText, LayoutGrid, Zap, BarChart3, ArrowRight } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  agenda?: AgendaEvent[];
  harvests?: HarvestLog[];
  laborLogs?: LaborLog[];
  movements?: Movement[];
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

  // --- MOTOR DE INTELIGENCIA DE INVENTARIOS (ABC & IDLE CAPITAL) ---
  const inventoryAnalytics = useMemo(() => {
      const totalValue = inventory.reduce((acc, item) => acc + (item.currentQuantity * item.averageCost), 0);
      const lowStockCount = inventory.filter(i => i.minStock && i.currentQuantity <= i.minStock).length;

      // 1. Clasificación ABC
      const sortedByValue = [...inventory]
        .map(item => ({ ...item, stockValue: item.currentQuantity * item.averageCost }))
        .sort((a, b) => b.stockValue - a.stockValue);

      let accumulatedValue = 0;
      const abcMap: Record<string, 'A' | 'B' | 'C'> = {};
      
      sortedByValue.forEach(item => {
          accumulatedValue += item.stockValue;
          const percent = (accumulatedValue / (totalValue || 1)) * 100;
          if (percent <= 80) abcMap[item.id] = 'A';
          else if (percent <= 95) abcMap[item.id] = 'B';
          else abcMap[item.id] = 'C';
      });

      // 2. Capital Inmovilizado (> 45 días sin salida)
      const thresholdDate = new Date();
      thresholdDate.setDate(thresholdDate.getDate() - 45);
      
      let idleCapitalValue = 0;
      inventory.forEach(item => {
          const lastOut = movements
            .filter(m => m.itemId === item.id && m.type === 'OUT')
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
          
          if (item.currentQuantity > 0) {
              if (!lastOut || new Date(lastOut.date) < thresholdDate) {
                  idleCapitalValue += (item.currentQuantity * item.averageCost);
              }
          }
      });

      return { totalValue, lowStockCount, abcMap, idleCapitalValue };
  }, [inventory, movements]);

  const filteredInventory = inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(inventory.map(i => String(i.category))))], [inventory]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
      
      {/* SUMMARY DASHBOARD */}
      <div className="bg-slate-900 rounded-[2.5rem] p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5">
              <Package className="w-48 h-48 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2 flex items-center justify-center md:justify-start gap-2">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" /> Valorización Activa Bodega
                  </p>
                  <p className="text-5xl font-black text-white font-mono tracking-tighter">{formatCurrency(inventoryAnalytics.totalValue)}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase mt-2 tracking-widest italic">Capital Operativo en Insumos</p>
              </div>
              <div className="flex gap-4">
                  <div className="bg-slate-800/50 p-5 rounded-[2rem] border border-slate-700 text-center min-w-[130px] backdrop-blur-sm">
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Items Totales</p>
                      <p className="text-2xl font-black text-white">{inventory.length}</p>
                  </div>
                  <div className={`p-5 rounded-[2rem] border text-center min-w-[130px] backdrop-blur-sm transition-all ${inventoryAnalytics.lowStockCount > 0 ? 'bg-red-900/20 border-red-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
                      <p className="text-[8px] font-black text-slate-500 uppercase mb-1">Stock Crítico</p>
                      <p className={`text-2xl font-black ${inventoryAnalytics.lowStockCount > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{inventoryAnalytics.lowStockCount}</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- INTELLIGENCE PANEL (ABC & IDLE CAPITAL) --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-indigo-950/20 p-6 rounded-[2.5rem] border border-indigo-500/20 flex items-center justify-between group">
              <div className="space-y-1">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-4 h-4" /> Capital Inmovilizado
                  </p>
                  <p className="text-2xl font-mono font-black text-white">{formatCurrency(inventoryAnalytics.idleCapitalValue)}</p>
                  <p className="text-[8px] text-slate-500 font-bold uppercase italic">Sin rotación en los últimos 45 días</p>
              </div>
              <div className="bg-indigo-600/20 p-4 rounded-3xl border border-indigo-500/30 group-hover:scale-110 transition-transform">
                  <TrendingDown className="w-8 h-8 text-indigo-400" />
              </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-800 flex flex-col justify-center space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <BarChart3 className="w-4 h-4 text-emerald-500" /> Análisis de Pareto (ABC)
              </p>
              <div className="w-full h-3 bg-slate-950 rounded-full overflow-hidden flex border border-slate-800">
                  <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: '80%' }} title="Tipo A (80% Valor)" />
                  <div className="h-full bg-indigo-500 transition-all duration-1000" style={{ width: '15%' }} title="Tipo B (15% Valor)" />
                  <div className="h-full bg-slate-700 transition-all duration-1000" style={{ width: '5%' }} title="Tipo C (5% Valor)" />
              </div>
              <div className="flex justify-between text-[8px] font-black uppercase tracking-tighter text-slate-500">
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500"/> Insumos A</span>
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-indigo-500"/> Insumos B</span>
                  <span className="flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-slate-700"/> Insumos C</span>
              </div>
          </div>
      </div>

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-3">
          <button onClick={onViewGlobalHistory} className="bg-slate-800 p-5 rounded-3xl border border-slate-700 flex items-center gap-4 active:scale-95 transition-all group hover:bg-slate-700">
              <div className="bg-indigo-600/20 p-3 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                  <p className="text-xs font-black text-white uppercase">Kárdex Global</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase tracking-tighter italic">Log de Movimientos</p>
              </div>
          </button>
          
          <div className="bg-white dark:bg-slate-800 p-5 rounded-3xl border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-3">
                  <div className={`p-3 rounded-2xl border ${storage.percent > 80 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-tighter">Memoria Local</p>
                      <div className="w-16 h-1 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                          <div className={`h-full transition-all duration-1000 ${storage.percent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${storage.percent}%` }}></div>
                      </div>
                      <p className="text-[9px] font-mono text-slate-400 mt-1">{storage.used.toFixed(1)}MB / 5MB</p>
                  </div>
              </div>
          </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="space-y-4">
        <div className="flex flex-col gap-3 sticky top-[120px] z-20 bg-slate-100/80 dark:bg-slate-950/80 backdrop-blur-md pt-2 pb-2 transition-colors">
            <div className="flex items-center gap-3 bg-white dark:bg-slate-800 p-4 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Search className="w-5 h-5 text-slate-400" />
              <input type="text" placeholder="Buscar agroinsumo..." className="bg-transparent border-none outline-none text-sm w-full text-slate-700 dark:text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-5 py-2.5 rounded-xl text-[10px] font-black whitespace-nowrap transition-all uppercase tracking-widest ${filterCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{cat}</button>
              ))}
            </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
            {filteredInventory.map((item) => {
                const isLowStock = item.minStock && item.currentQuantity <= item.minStock;
                const abcClass = inventoryAnalytics.abcMap[item.id] || 'C';
                const baseUnit = item.baseUnit;
                const costPerBase = item.averageCost;
                const costPerKgOrL = costPerBase * 1000;
                const costPerBulto = costPerBase * 50000;

                return (
                    <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-xl border transition-all hover:shadow-2xl relative group ${isLowStock ? 'border-red-500/40' : 'border-slate-200 dark:border-slate-700'}`}>
                        {/* ABC BADGE - SOLICITADO */}
                        <div className={`absolute top-4 right-4 text-[9px] font-black px-2 py-1 rounded-lg border flex items-center gap-1 ${abcClass === 'A' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : abcClass === 'B' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : 'bg-slate-500/10 border-slate-500/30 text-slate-500'}`}>
                            <LayoutGrid className="w-3 h-3" /> CATEGORÍA {abcClass}
                        </div>

                        {isLowStock && (
                            <div className="absolute top-12 right-4 bg-red-600 text-white p-1.5 rounded-full shadow-lg z-10 animate-bounce">
                                <AlertTriangle className="w-4 h-4" />
                            </div>
                        )}
                        
                        <div className="flex gap-5 mb-6">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-900 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative">
                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-12 h-12" /></div>}
                                {isLowStock && <div className="absolute inset-0 bg-red-600/10 border-2 border-red-500/30 rounded-[2rem]"></div>}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h3 className="font-black text-slate-800 dark:text-white text-xl leading-tight truncate">{item.name}</h3>
                                <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">{item.category}</p>
                                <div className="mt-3">
                                    <p className="text-[8px] text-slate-500 uppercase font-black tracking-tighter">Stock en Bodega</p>
                                    <p className={`text-2xl font-black font-mono tracking-tighter ${isLowStock ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatBaseQuantity(item.currentQuantity, item.baseUnit)}</p>
                                </div>
                            </div>
                        </div>

                        {/* MATEMÁTICA DE COSTOS PROBADA */}
                        <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-3 mb-6">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis Unitario</span>
                                </div>
                                <span className="text-[9px] font-mono font-bold text-slate-500">CPP: {formatCurrency(item.averageCost, 2)}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">Valor {baseUnit === 'g' ? 'Gramo' : 'ml'}</p>
                                    <p className="text-sm font-black text-indigo-500 font-mono">{formatCurrency(costPerBase, 2)}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[9px] text-slate-500 font-bold uppercase">Valor {baseUnit === 'g' ? 'Kg' : 'Litro'}</p>
                                    <p className="text-sm font-black text-indigo-500 font-mono">{formatCurrency(costPerKgOrL)}</p>
                                </div>
                            </div>

                            {baseUnit === 'g' && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        <p className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">Equivalencia Bulto (50kg)</p>
                                    </div>
                                    <p className="text-sm font-black text-white font-mono">{formatCurrency(costPerBulto)}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-2">
                            <div className="flex gap-2">
                                <button onClick={() => onAddMovement(item, 'IN')} className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2">
                                    <TrendingUp className="w-4 h-4" /> Entrada
                                </button>
                                <button onClick={() => onAddMovement(item, 'OUT')} className="flex-1 py-4 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 font-black text-[10px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <TrendingDown className="w-4 h-4" /> Salida
                                </button>
                            </div>
                            
                            <div className="flex gap-2">
                                <button 
                                    onClick={() => onViewHistory(item)} 
                                    className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-[10px] uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-2 active:scale-95 group/hist"
                                >
                                    <History className="w-4 h-4 group-hover/hist:rotate-[-45deg] transition-transform" /> Ver Kárdex del Insumo
                                </button>
                                {isAdmin && (
                                    <button onClick={() => onDelete(item.id)} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 hover:border-red-500/30 transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
      </div>
    </div>
  );
};
