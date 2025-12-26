import React, { useMemo, useState } from 'react';
import { InventoryItem, Category, Unit } from '../types';
import { getBaseUnitType, formatBaseQuantity, formatCurrency, getCostPerGramOrMl } from '../services/inventoryService';
import { Edit2, Trash2, TrendingDown, TrendingUp, DollarSign, Scale, Package, History, AlertTriangle, Image as ImageIcon, Search, X, Calendar, AlertCircle, CheckCircle, Lock } from 'lucide-react';

interface DashboardProps {
  inventory: InventoryItem[];
  onAddMovement: (item: InventoryItem, type: 'IN' | 'OUT') => void;
  onDelete: (id: string) => void;
  onViewHistory: (item: InventoryItem) => void;
  isAdmin?: boolean; // New prop
}

export const Dashboard: React.FC<DashboardProps> = ({ inventory, onAddMovement, onDelete, onViewHistory, isAdmin = true }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const totalValue = useMemo(() => {
    return inventory.reduce((acc, item) => {
      const costPerBase = getCostPerGramOrMl(item);
      return acc + (item.currentQuantity * costPerBase);
    }, 0);
  }, [inventory]);

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

  const getDaysUntilExpiration = (dateStr?: string) => {
      if (!dateStr) return null;
      const exp = new Date(dateStr);
      const now = new Date();
      const diffTime = exp.getTime() - now.getTime();
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24)); 
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Stats Card */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg transition-colors duration-300">
          <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 mb-1">
            <Package className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Total Items</span>
          </div>
          <p className="text-2xl font-bold text-slate-800 dark:text-white">{inventory.length}</p>
        </div>
        <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm dark:shadow-lg transition-colors duration-300 relative overflow-hidden group">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 mb-1">
            <DollarSign className="w-4 h-4" />
            <span className="text-xs font-bold uppercase">Valor Bodega</span>
          </div>
          {isAdmin ? (
             <p className="text-xl font-bold text-slate-800 dark:text-white truncate">{formatCurrency(totalValue)}</p>
          ) : (
             <div className="flex items-center gap-2 mt-1">
                <p className="text-xl font-bold text-slate-800 dark:text-white blur-sm select-none">$ 99.999.999</p>
                <Lock className="w-4 h-4 text-slate-400" />
             </div>
          )}
        </div>
      </div>

      {/* Smart Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search className="h-5 w-5 text-slate-400" />
        </div>
        <input
          type="text"
          className="block w-full pl-10 pr-10 py-3 border border-slate-200 dark:border-slate-700 rounded-xl leading-5 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm transition-colors shadow-sm"
          placeholder="Buscar por nombre, categoría..."
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

      {/* Inventory List */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-slate-800 dark:text-white flex items-center gap-2">
          <Scale className="w-5 h-5 text-emerald-600 dark:text-emerald-500" />
          Inventario {searchTerm && '(Filtrado)'}
        </h3>

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
                  
                  // Low Stock Check
                  const isLowStock = item.minStock && item.currentQuantity <= item.minStock;
                  
                  // Expiration Check
                  const daysToExpiry = getDaysUntilExpiration(item.expirationDate);
                  let expiryStatus: 'expired' | 'warning' | 'good' | null = null;
                  
                  if (daysToExpiry !== null) {
                      if (daysToExpiry <= 0) expiryStatus = 'expired';
                      else if (daysToExpiry <= 60) expiryStatus = 'warning';
                      else expiryStatus = 'good';
                  }
                  
                  // Calculate dynamic unit cost for display (e.g. price per gram/ml)
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
                             {/* Expiration Dot on Image */}
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
                                
                                {/* EXPIRATION INDICATOR */}
                                {expiryStatus && daysToExpiry !== null && (
                                    <div className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded w-fit ${
                                        expiryStatus === 'expired' ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300' :
                                        expiryStatus === 'warning' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/40 dark:text-yellow-400' :
                                        'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400'
                                    }`}>
                                        <Calendar className="w-3 h-3" />
                                        {expiryStatus === 'expired' ? `VENCIDO hace ${Math.abs(daysToExpiry)} días` : 
                                         expiryStatus === 'warning' ? `Vence en ${daysToExpiry} días` :
                                         `Vence en ${daysToExpiry} días`}
                                    </div>
                                )}
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
                            title={isAdmin ? "Eliminar" : "Bloqueado por PIN"}
                            disabled={!isAdmin}
                          >
                            {isAdmin ? <Trash2 className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
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