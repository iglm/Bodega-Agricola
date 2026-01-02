
import React, { useMemo } from 'react';
import { InventoryItem, Movement, CostCenter } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { Package, Search, Activity, HardDrive } from 'lucide-react';
import { useDashboardAnalytics } from '../hooks/useDashboardAnalytics';
import { InventoryCard } from './dashboard/InventoryCard';
import { RenovationIndicator } from './dashboard/RenovationIndicator';

interface DashboardProps {
  inventory: InventoryItem[];
  costCenters: CostCenter[];
  movements: Movement[];
  onAddMovement: (item: InventoryItem, type: 'IN' | 'OUT') => void;
  onDelete: (id: string) => void;
  onViewHistory: (item: InventoryItem) => void;
  onViewGlobalHistory?: () => void;
  isAdmin?: boolean; 
}

const DashboardBase: React.FC<DashboardProps> = ({ 
  inventory = [],
  costCenters = [], 
  movements = [],
  onAddMovement, 
  onDelete, 
  onViewHistory,
  onViewGlobalHistory,
  isAdmin
}) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [filterCategory, setFilterCategory] = React.useState<string>('Todos');
  
  // --- BUSINESS LOGIC HOOK ---
  const { renovationAnalysis, inventoryAnalytics, storage } = useDashboardAnalytics(inventory, costCenters, movements);

  // --- UI FILTERING LOGIC ---
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

      {/* --- STRATEGIC INDICATOR: RENOVATION CYCLE --- */}
      {costCenters.length > 0 && (
          <RenovationIndicator analysis={renovationAnalysis} />
      )}

      {/* QUICK ACTIONS */}
      <div className="grid grid-cols-2 gap-4">
          <button onClick={onViewGlobalHistory} className="bg-slate-800 p-6 rounded-[2rem] border border-slate-700 flex items-center gap-4 active:scale-95 transition-all group hover:bg-slate-700">
              <div className="bg-indigo-600/20 p-3 rounded-2xl text-indigo-400 border border-indigo-500/20">
                  <Activity className="w-6 h-6" />
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
            {filteredInventory.map((item) => (
                <InventoryCard
                    key={item.id}
                    item={item}
                    abcClass={inventoryAnalytics.abcMap[item.id] || 'C'}
                    isLowStock={!!(item.minStock && item.currentQuantity <= item.minStock)}
                    onAddMovement={onAddMovement}
                    onViewHistory={onViewHistory}
                    onDelete={onDelete}
                    isAdmin={isAdmin}
                />
            ))}
        </div>
      </div>
    </div>
  );
};

export const Dashboard = React.memo(DashboardBase);
