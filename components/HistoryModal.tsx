import React from 'react';
import { InventoryItem, Movement } from '../types';
import { formatCurrency, convertToBase, getBaseUnitType, formatBaseQuantity } from '../services/inventoryService';
import { X, TrendingUp, TrendingDown, Calendar, History, FileText, Tag, Camera, ArrowUpRight, ArrowDownRight, Minus, LineChart, Users } from 'lucide-react';

interface HistoryModalProps {
  item: InventoryItem;
  movements: Movement[];
  onClose: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({ item, movements, onClose }) => {
  const [showImage, setShowImage] = React.useState<string | null>(null);

  // Price Trend Analysis
  // Filter only entries that have a price (cost > 0)
  // Reverse to get chronological order (Oldest -> Newest) for the graph
  const entries = movements
    .filter(m => m.type === 'IN' && m.calculatedCost > 0)
    .reverse(); 

  let minPrice = 0, maxPrice = 0, avgPrice = 0, trend: 'up' | 'down' | 'stable' = 'stable';
  let priceHistory: number[] = [];

  if (entries.length > 0) {
     priceHistory = entries.map(e => e.calculatedCost / e.quantity);
     minPrice = Math.min(...priceHistory);
     maxPrice = Math.max(...priceHistory);
     avgPrice = priceHistory.reduce((a, b) => a + b, 0) / priceHistory.length;
     
     // Trend: Compare last price (newest) vs avg
     const lastPrice = priceHistory[priceHistory.length - 1]; 
     if (lastPrice > avgPrice * 1.05) trend = 'up';
     else if (lastPrice < avgPrice * 0.95) trend = 'down';
  }

  // --- SUPPLIER INTELLIGENCE (NEW) ---
  // Calculates average price per supplier to help decision making
  const supplierStats = React.useMemo(() => {
    const stats: Record<string, { totalCost: number; totalBaseQty: number; count: number }> = {};
    
    entries.forEach(e => {
        const name = e.supplierName || 'Desconocido';
        const baseQty = convertToBase(e.quantity, e.unit);
        
        if (!stats[name]) stats[name] = { totalCost: 0, totalBaseQty: 0, count: 0 };
        
        stats[name].totalCost += e.calculatedCost;
        stats[name].totalBaseQty += baseQty;
        stats[name].count += 1;
    });

    return Object.entries(stats).map(([name, data]) => {
        // Cost per base unit (g/ml)
        const costPerBase = data.totalBaseQty > 0 ? data.totalCost / data.totalBaseQty : 0;
        // Convert back to Purchase Unit for display
        const displayConversion = convertToBase(1, item.lastPurchaseUnit);
        
        return {
            name,
            avgPrice: costPerBase * displayConversion,
            count: data.count
        };
    }).sort((a, b) => a.avgPrice - b.avgPrice); // Sort cheapest first
  }, [entries, item.lastPurchaseUnit]);


  // Generate SVG Sparkline Points
  const getSparklinePoints = () => {
      if (priceHistory.length < 2) return "";
      const height = 40;
      const width = 200; // arbitrary unit width
      const range = maxPrice - minPrice || 1; // Avoid divide by zero
      
      return priceHistory.map((price, i) => {
          const x = (i / (priceHistory.length - 1)) * width;
          // Invert Y because SVG 0 is top
          const y = height - ((price - minPrice) / range) * height; 
          return `${x},${y}`;
      }).join(" ");
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-2xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[85vh] animate-slide-up">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-blue-900/30 p-2 rounded-lg border border-blue-500/30">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">Historial de Movimientos</h3>
              <p className="text-xs text-slate-400 mt-1">{item.name} ({item.category})</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content Container */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
            
            {/* PRICE TREND ANALYSIS GRAPH */}
            {entries.length > 1 && (
                <div className="bg-slate-900/50 p-4 border-b border-slate-700">
                    <div className="flex justify-between items-center mb-2">
                        <h4 className="text-xs text-slate-400 font-bold uppercase flex items-center gap-1">
                            <LineChart className="w-3 h-3" /> Tendencia de Precios (Compras)
                        </h4>
                        <div className="flex items-center gap-2 text-xs">
                            {trend === 'up' && <div className="flex items-center text-red-400 font-bold"><ArrowUpRight className="w-4 h-4 mr-1"/> Alza</div>}
                            {trend === 'down' && <div className="flex items-center text-emerald-400 font-bold"><ArrowDownRight className="w-4 h-4 mr-1"/> Baja</div>}
                            {trend === 'stable' && <div className="flex items-center text-blue-400 font-bold"><Minus className="w-4 h-4 mr-1"/> Estable</div>}
                        </div>
                    </div>
                    
                    {/* SVG Graph */}
                    <div className="relative h-12 w-full flex items-end overflow-hidden mb-2">
                        <svg className="w-full h-full" viewBox="0 0 200 45" preserveAspectRatio="none">
                            {/* Gradient Fill */}
                            <defs>
                                <linearGradient id="gradient" x1="0" x2="0" y1="0" y2="1">
                                    <stop offset="0%" stopColor="#34d399" stopOpacity="0.3" />
                                    <stop offset="100%" stopColor="#34d399" stopOpacity="0" />
                                </linearGradient>
                            </defs>
                            <polyline 
                                fill="none" 
                                stroke="#34d399" 
                                strokeWidth="2" 
                                points={getSparklinePoints()} 
                                strokeLinecap="round" 
                                strokeLinejoin="round"
                            />
                            <polygon 
                                fill="url(#gradient)" 
                                points={`0,45 ${getSparklinePoints()} 200,45`} 
                                opacity="0.5"
                            />
                        </svg>
                    </div>

                    <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>Mín: {formatCurrency(minPrice)}</span>
                        <span>Prom: {formatCurrency(avgPrice)}</span>
                        <span>Máx: {formatCurrency(maxPrice)}</span>
                    </div>
                </div>
            )}

            {/* SUPPLIER INTELLIGENCE TABLE (NEW) */}
            {supplierStats.length > 0 && (
                 <div className="p-4 bg-slate-800 border-b border-slate-700">
                     <h4 className="text-xs text-emerald-400 font-bold uppercase flex items-center gap-1 mb-2">
                         <Users className="w-3 h-3" /> Comparativa de Proveedores
                     </h4>
                     <div className="bg-slate-900/50 rounded-lg border border-slate-700/50 overflow-hidden">
                         <table className="w-full text-xs text-left">
                             <thead className="bg-slate-900 text-slate-400 font-bold uppercase">
                                 <tr>
                                     <th className="p-2">Proveedor</th>
                                     <th className="p-2 text-center">Compras</th>
                                     <th className="p-2 text-right">Precio Promedio</th>
                                 </tr>
                             </thead>
                             <tbody className="divide-y divide-slate-700/50">
                                 {supplierStats.map((s, idx) => (
                                     <tr key={s.name} className={idx === 0 ? 'bg-emerald-900/10' : ''}>
                                         <td className="p-2 text-slate-200">
                                             {s.name}
                                             {idx === 0 && <span className="ml-2 text-[9px] bg-emerald-600 text-white px-1 rounded">MEJOR PRECIO</span>}
                                         </td>
                                         <td className="p-2 text-center text-slate-400">{s.count}</td>
                                         <td className="p-2 text-right font-mono text-emerald-300">
                                             {formatCurrency(s.avgPrice)} <span className="text-[9px] text-slate-500">/ {item.lastPurchaseUnit}</span>
                                         </td>
                                     </tr>
                                 ))}
                             </tbody>
                         </table>
                     </div>
                 </div>
            )}

            {/* Content List */}
            <div className="p-4">
            {movements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-slate-500 opacity-60">
                <History className="w-12 h-12 mb-3" />
                <p>No hay movimientos registrados para este ítem.</p>
                </div>
            ) : (
                <div className="space-y-3">
                {movements.map((mov) => {
                    const isIn = mov.type === 'IN';
                    const dateObj = new Date(mov.date);
                    
                    return (
                    <div key={mov.id} className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4 flex items-center justify-between hover:border-slate-600 transition-colors">
                        
                        {/* Left: Icon & Date */}
                        <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                            isIn 
                            ? 'bg-emerald-900/20 border-emerald-500/30 text-emerald-500' 
                            : 'bg-red-900/20 border-red-500/30 text-red-500'
                        }`}>
                            {isIn ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                        </div>
                        
                        <div>
                            <div className="flex items-center gap-2 mb-0.5">
                            <span className={`text-sm font-bold ${isIn ? 'text-emerald-400' : 'text-red-400'}`}>
                                {isIn ? 'ENTRADA' : 'SALIDA'}
                            </span>
                            
                            {/* Admin Codes */}
                            {isIn && mov.invoiceNumber && (
                                <span className="text-[10px] bg-emerald-900/40 text-emerald-300 px-1.5 py-0.5 rounded border border-emerald-800 flex items-center gap-1">
                                    <FileText className="w-3 h-3" /> Fact: {mov.invoiceNumber}
                                </span>
                            )}
                            {!isIn && mov.outputCode && (
                                <span className="text-[10px] bg-purple-900/40 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 flex items-center gap-1">
                                    <Tag className="w-3 h-3" /> {mov.outputCode}
                                </span>
                            )}
                            {/* Image Indicator */}
                            {mov.invoiceImage && (
                                <button 
                                    onClick={() => setShowImage(mov.invoiceImage || null)}
                                    className="text-[10px] bg-blue-900/40 text-blue-300 px-1.5 py-0.5 rounded border border-blue-800 flex items-center gap-1 hover:bg-blue-800"
                                >
                                    <Camera className="w-3 h-3" /> Ver Foto
                                </button>
                            )}
                            </div>
                            <div className="flex items-center gap-1 text-xs text-slate-500">
                            <Calendar className="w-3 h-3" />
                            {dateObj.toLocaleDateString()} &bull; {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </div>
                            {mov.notes && (
                                <p className="text-xs text-slate-400 mt-1 italic">
                                "{mov.notes}"
                                </p>
                            )}
                        </div>
                        </div>

                        {/* Right: Quantity & Cost */}
                        <div className="text-right">
                        <p className="text-white font-bold text-lg">
                            {isIn ? '+' : '-'}{mov.quantity} <span className="text-sm font-normal text-slate-400">{mov.unit}</span>
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                            Coste: {formatCurrency(mov.calculatedCost)}
                        </p>
                        </div>

                    </div>
                    );
                })}
                </div>
            )}
            </div>
        </div>

        {/* Footer Summary */}
        <div className="bg-slate-900 p-4 border-t border-slate-700 flex justify-between items-center text-xs text-slate-400 flex-shrink-0">
          <span>Total Movimientos: {movements.length}</span>
          <span>ID: {item.id.slice(0,8)}...</span>
        </div>

      </div>

      {/* Image Preview Overlay */}
      {showImage && (
          <div className="absolute inset-0 z-[60] bg-black/95 flex items-center justify-center p-4" onClick={() => setShowImage(null)}>
              <div className="relative max-w-3xl max-h-full">
                  <img src={showImage} alt="Factura" className="max-w-full max-h-[80vh] rounded-lg shadow-2xl border border-slate-700" />
                  <button onClick={() => setShowImage(null)} className="absolute -top-10 right-0 text-white hover:text-red-400">
                      <X className="w-8 h-8" />
                  </button>
                  <p className="text-center text-slate-400 mt-2 text-sm">Toca cualquier lugar para cerrar</p>
              </div>
          </div>
      )}
    </div>
  );
};