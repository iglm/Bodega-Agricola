
import React, { useMemo, useState, useEffect } from 'react';
import { InventoryItem, AgendaEvent, HarvestLog, LaborLog, Movement, MaintenanceLog, FinanceLog, Unit, CostCenter } from '../types';
import { formatCurrency, formatBaseQuantity, calculatePriceForUnit } from '../services/inventoryService';
import { getStorageUsage } from '../services/imageService';
import { TrendingDown, TrendingUp, DollarSign, Package, AlertTriangle, Image as ImageIcon, Search, PieChart, Activity, Trash2, Calendar, Clock, Wallet, HeartPulse, HardDrive, Edit3, Save, Eraser, Pickaxe, Target, Plus, History, ChevronRight, CalendarRange, Info, Calculator, FileText, LayoutGrid, Zap, BarChart3, ArrowRight, Sprout, Coffee, RefreshCw } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  costCenters: CostCenter[]; // NEW PROP
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
  costCenters = [], // Default empty
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

  // --- AGRONOMIC HEALTH INDICATOR (OPTION A) ---
  const renovationAnalysis = useMemo(() => {
      const totalHa = costCenters.reduce((sum, c) => sum + (c.area || 0), 0);
      const renovationHa = costCenters.filter(c => c.stage === 'Levante').reduce((sum, c) => sum + (c.area || 0), 0);
      const productionHa = totalHa - renovationHa;
      const renovationPct = totalHa > 0 ? (renovationHa / totalHa) * 100 : 0;

      let status: 'CRITICAL' | 'OPTIMAL' | 'GROWTH' = 'OPTIMAL';
      let message = "Ciclo saludable.";
      let colorClass = "text-emerald-500";
      let bgClass = "bg-emerald-500";

      if (renovationPct < 10) {
          status = 'CRITICAL';
          message = "Alerta: Cafetal envejecido. Riesgo.";
          colorClass = "text-red-500";
          bgClass = "bg-red-500";
      } else if (renovationPct > 20) {
          status = 'GROWTH';
          message = "Fase de alta inversión.";
          colorClass = "text-indigo-400";
          bgClass = "bg-indigo-500";
      } else {
          message = "Renovación sostenible.";
      }

      return { totalHa, renovationHa, productionHa, renovationPct, status, message, colorClass, bgClass };
  }, [costCenters]);

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

  const filteredInventory = useMemo(() => inventory.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === 'Todos' || item.category === filterCategory;
    return matchesSearch && matchesCategory;
  }), [inventory, searchTerm, filterCategory]);

  const categories = useMemo(() => ['Todos', ...Array.from(new Set(inventory.map(i => String(i.category))))], [inventory]);

  return (
    <div className="space-y-8 pb-20 animate-fade-in">
      
      {/* SUMMARY DASHBOARD */}
      <div className="bg-slate-900 rounded-[2.5rem] p-6 md:p-8 border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 md:p-8 opacity-5">
              <Package className="w-32 h-32 md:w-48 md:h-48 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6 md:gap-8">
              <div className="text-center md:text-left">
                  <p className="text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-3 flex items-center justify-center md:justify-start gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" /> Valorización Activa Bodega
                  </p>
                  <p className="text-4xl md:text-5xl font-black text-white font-mono tracking-tighter">{formatCurrency(inventoryAnalytics.totalValue)}</p>
                  <p className="text-xs text-slate-500 font-bold uppercase mt-2 tracking-widest italic">Capital Operativo en Insumos</p>
              </div>
              <div className="flex gap-3 md:gap-4 w-full md:w-auto">
                  <div className="bg-slate-800/50 p-5 rounded-[2rem] border border-slate-700 text-center flex-1 md:min-w-[140px] backdrop-blur-sm">
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Items</p>
                      <p className="text-2xl font-black text-white">{inventory.length}</p>
                  </div>
                  <div className={`p-5 rounded-[2rem] border text-center flex-1 md:min-w-[140px] backdrop-blur-sm transition-all ${inventoryAnalytics.lowStockCount > 0 ? 'bg-red-900/20 border-red-500/40' : 'bg-slate-800/50 border-slate-700'}`}>
                      <p className="text-[10px] font-black text-slate-500 uppercase mb-1">Crítico</p>
                      <p className={`text-2xl font-black ${inventoryAnalytics.lowStockCount > 0 ? 'text-red-500 animate-pulse' : 'text-white'}`}>{inventoryAnalytics.lowStockCount}</p>
                  </div>
              </div>
          </div>
      </div>

      {/* --- NEW STRATEGIC INDICATOR: RENOVATION CYCLE --- */}
      {costCenters.length > 0 && (
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-xl flex flex-col md:flex-row gap-6 items-center">
              <div className="flex-1 space-y-3 w-full">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                      <RefreshCw className="w-5 h-5 text-emerald-500" /> Ciclo de Renovación
                  </h4>
                  <div className="flex justify-between items-end">
                      <p className={`text-3xl font-black font-mono ${renovationAnalysis.colorClass}`}>
                          {renovationAnalysis.renovationPct.toFixed(1)}% <span className="text-sm text-slate-400 font-bold">en Renovación</span>
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase text-right">
                          Total: {renovationAnalysis.totalHa.toFixed(1)} Ha
                      </p>
                  </div>
                  <div className="w-full h-5 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden flex border border-slate-200 dark:border-slate-800 relative">
                      {/* Renovation Bar */}
                      <div className={`h-full ${renovationAnalysis.bgClass} transition-all duration-1000 relative group`} style={{ width: `${renovationAnalysis.renovationPct}%` }}>
                          <div className="absolute inset-0 bg-white/20"></div>
                      </div>
                      {/* Production Bar */}
                      <div className="h-full bg-slate-300 dark:bg-slate-700 transition-all duration-1000" style={{ width: `${100 - renovationAnalysis.renovationPct}%` }}></div>
                      
                      {/* Ideal Zone Markers (10% - 20%) */}
                      <div className="absolute top-0 bottom-0 left-[10%] w-[10%] bg-emerald-500/10 border-x border-emerald-500/30 pointer-events-none"></div>
                  </div>
                  <div className="flex justify-between text-xs font-black uppercase text-slate-400">
                      <span className="flex items-center gap-1"><Sprout className="w-4 h-4"/> Levante: {renovationAnalysis.renovationHa.toFixed(1)} Ha</span>
                      <span className="flex items-center gap-1"><Coffee className="w-4 h-4"/> Producción: {renovationAnalysis.productionHa.toFixed(1)} Ha</span>
                  </div>
              </div>
              
              <div className={`p-5 rounded-3xl border w-full md:w-auto min-w-[220px] flex items-start gap-4 ${renovationAnalysis.status === 'CRITICAL' ? 'bg-red-50 dark:bg-red-900/10 border-red-200 dark:border-red-900/30' : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800'}`}>
                  <div className={`p-3 rounded-2xl ${renovationAnalysis.status === 'CRITICAL' ? 'bg-red-500 text-white' : 'bg-slate-200 dark:bg-slate-700 text-slate-500'}`}>
                      {renovationAnalysis.status === 'CRITICAL' ? <AlertTriangle className="w-6 h-6" /> : <Activity className="w-6 h-6" />}
                  </div>
                  <div>
                      <p className={`text-xs font-black uppercase ${renovationAnalysis.colorClass}`}>Diagnóstico</p>
                      <p className="text-sm text-slate-600 dark:text-slate-300 font-bold leading-tight mt-1">{renovationAnalysis.message}</p>
                  </div>
              </div>
          </div>
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4">
          <button onClick={onViewGlobalHistory} className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 flex items-center gap-4 active:scale-95 transition-all group hover:bg-slate-700">
              <div className="bg-indigo-600/20 p-3 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <FileText className="w-6 h-6" />
              </div>
              <div className="text-left">
                  <p className="text-sm font-black text-white uppercase">Kárdex Global</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tighter italic">Ver Movimientos</p>
              </div>
          </button>
          
          <div className="bg-white dark:bg-slate-800 p-6 rounded-[2rem] border border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-2xl border ${storage.percent > 80 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-700 text-slate-400'}`}>
                    <HardDrive className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                      <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Memoria Local</p>
                      <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden mt-1">
                          <div className={`h-full transition-all duration-1000 ${storage.percent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${storage.percent}%` }}></div>
                      </div>
                      <p className="text-[10px] font-mono text-slate-400 mt-1">{storage.used.toFixed(1)} MB</p>
                  </div>
              </div>
          </div>
      </div>

      {/* INVENTORY LIST */}
      <div className="space-y-5">
        <div className="flex flex-col gap-4 sticky top-[110px] sm:top-[120px] z-20 bg-slate-100/90 dark:bg-slate-950/90 backdrop-blur-xl pt-2 pb-2 transition-colors">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-800 p-5 rounded-3xl shadow-sm border border-slate-200 dark:border-slate-700">
              <Search className="w-6 h-6 text-slate-400" />
              <input type="text" placeholder="Buscar agroinsumo..." className="bg-transparent border-none outline-none text-base w-full text-slate-700 dark:text-white font-bold" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-6 py-3 rounded-2xl text-xs font-black whitespace-nowrap transition-all uppercase tracking-widest ${filterCategory === cat ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-900/40' : 'bg-white dark:bg-slate-800 text-slate-500 border border-slate-200 dark:border-slate-700'}`}>{cat}</button>
              ))}
            </div>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
            {filteredInventory.map((item) => {
                const isLowStock = item.minStock && item.currentQuantity <= item.minStock;
                const abcClass = inventoryAnalytics.abcMap[item.id] || 'C';
                const baseUnit = item.baseUnit;
                const costPerBase = item.averageCost;
                const costPerKgOrL = costPerBase * 1000;
                const costPerBulto = costPerBase * 50000;

                return (
                    <div key={item.id} className={`bg-white dark:bg-slate-800 rounded-[2.5rem] p-6 shadow-xl border transition-all hover:shadow-2xl relative group ${isLowStock ? 'border-red-500/40' : 'border-slate-200 dark:border-slate-700'}`}>
                        {/* ABC BADGE */}
                        <div className={`absolute top-5 right-5 text-[10px] font-black px-3 py-1.5 rounded-xl border flex items-center gap-1.5 ${abcClass === 'A' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500' : abcClass === 'B' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-500' : 'bg-slate-500/10 border-slate-500/30 text-slate-500'}`}>
                            <LayoutGrid className="w-3 h-3" /> CAT. {abcClass}
                        </div>

                        {isLowStock && (
                            <div className="absolute top-14 right-5 bg-red-600 text-white p-2 rounded-full shadow-lg z-10 animate-bounce">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                        )}
                        
                        <div className="flex gap-5 mb-6 mt-2">
                            <div className="w-24 h-24 rounded-[2rem] bg-slate-100 dark:bg-slate-900 flex-shrink-0 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-inner relative">
                                {item.image ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon className="w-12 h-12" /></div>}
                                {isLowStock && <div className="absolute inset-0 bg-red-600/10 border-2 border-red-500/30 rounded-[2rem]"></div>}
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-center">
                                <h3 className="font-black text-slate-800 dark:text-white text-xl leading-tight truncate">{item.name}</h3>
                                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mt-1 italic">{item.category}</p>
                                <div className="mt-3">
                                    <p className="text-[9px] text-slate-500 uppercase font-black tracking-tighter">Stock en Bodega</p>
                                    <p className={`text-3xl font-black font-mono tracking-tighter ${isLowStock ? 'text-red-500' : 'text-slate-800 dark:text-white'}`}>{formatBaseQuantity(item.currentQuantity, item.baseUnit)}</p>
                                </div>
                            </div>
                        </div>

                        {/* MATEMÁTICA DE COSTOS */}
                        <div className="bg-slate-50 dark:bg-slate-900/80 p-5 rounded-3xl border border-slate-100 dark:border-slate-700 space-y-3 mb-6">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-2">
                                <div className="flex items-center gap-2">
                                    <Calculator className="w-4 h-4 text-indigo-400" />
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Análisis Unitario</span>
                                </div>
                                <span className="text-xs font-mono font-bold text-slate-500">CPP: {formatCurrency(item.averageCost, 2)}</span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Valor {baseUnit === 'g' ? 'Gramo' : 'ml'}</p>
                                    <p className="text-base font-black text-indigo-500 font-mono">{formatCurrency(costPerBase, 2)}</p>
                                </div>
                                <div className="space-y-1 text-right">
                                    <p className="text-[10px] text-slate-500 font-bold uppercase">Valor {baseUnit === 'g' ? 'Kg' : 'Litro'}</p>
                                    <p className="text-base font-black text-indigo-500 font-mono">{formatCurrency(costPerKgOrL)}</p>
                                </div>
                            </div>

                            {baseUnit === 'g' && (
                                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Equivalencia Bulto (50kg)</p>
                                    </div>
                                    <p className="text-sm font-black text-white font-mono">{formatCurrency(costPerBulto)}</p>
                                </div>
                            )}
                        </div>

                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <button onClick={() => onAddMovement(item, 'IN')} className="flex-1 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs uppercase tracking-widest transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-2">
                                    <TrendingUp className="w-5 h-5" /> Entrada
                                </button>
                                <button onClick={() => onAddMovement(item, 'OUT')} className="flex-1 py-4 rounded-2xl bg-slate-200 dark:bg-slate-700 hover:bg-red-600 hover:text-white text-slate-700 dark:text-slate-300 font-black text-xs uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-2">
                                    <TrendingDown className="w-5 h-5" /> Salida
                                </button>
                            </div>
                            
                            <div className="flex gap-3">
                                <button 
                                    onClick={() => onViewHistory(item)} 
                                    className="flex-1 py-4 rounded-2xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 font-black text-xs uppercase tracking-widest transition-all hover:bg-indigo-600 hover:text-white flex items-center justify-center gap-2 active:scale-95 group/hist"
                                >
                                    <History className="w-5 h-5 group-hover/hist:rotate-[-45deg] transition-transform" /> Ver Kárdex
                                </button>
                                {isAdmin && (
                                    <button onClick={() => onDelete(item.id)} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900 text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-700 hover:border-red-500/30 transition-colors">
                                        <Trash2 className="w-5 h-5" />
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
