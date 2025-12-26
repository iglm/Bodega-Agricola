import React, { useState, useRef } from 'react';
import { Category, Unit, InventoryItem } from '../types';
import { X, Save, DollarSign, Package, Layers, AlertTriangle, Camera, Image as ImageIcon, Trash2, Calendar } from 'lucide-react';
import { convertToBase } from '../services/inventoryService';
import { compressImage } from '../services/imageService';

interface InventoryFormProps {
  // Updated: Omit 'averageCost' as it is calculated by the service/app logic, not input by user
  onSave: (item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number) => void;
  onCancel: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(Category.FERTILIZANTE);
  const [purchaseUnit, setPurchaseUnit] = useState<Unit>(Unit.BULTO_50KG);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [minStock, setMinStock] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingImg(true);
      try {
        const compressed = await compressImage(e.target.files[0]);
        setImage(compressed);
      } catch (err) {
        console.error("Error compressing image", err);
        alert("Error al procesar la imagen. Intente con otra.");
      } finally {
        setIsProcessingImg(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purchasePrice) return;
    
    // Default to 0 if empty
    const initQty = initialQuantity ? Number(initialQuantity) : 0;
    
    // Calculate minStock in base unit
    let minStockBase = undefined;
    if (minStock && parseFloat(minStock) > 0) {
        minStockBase = convertToBase(parseFloat(minStock), purchaseUnit);
    }

    onSave({
      name,
      category,
      lastPurchaseUnit: purchaseUnit,
      lastPurchasePrice: Number(purchasePrice),
      minStock: minStockBase,
      minStockUnit: minStock ? purchaseUnit : undefined,
      description: '',
      expirationDate: expirationDate || undefined,
      image
    }, initQty);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-slide-up transition-colors duration-300 max-h-[90vh] overflow-y-auto custom-scrollbar">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-2">
             <div className="bg-emerald-100 dark:bg-emerald-900/30 p-2 rounded-lg">
                <Package className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
             </div>
             <h3 className="text-slate-800 dark:text-white font-bold text-lg">Nuevo Insumo</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          
          {/* Image Picker */}
          <div className="flex justify-center">
             <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                {image ? (
                    <div className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-emerald-500 shadow-lg relative">
                        <img src={image} alt="Preview" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="text-white w-6 h-6" />
                        </div>
                        <button 
                            type="button"
                            onClick={(e) => { e.stopPropagation(); setImage(undefined); }}
                            className="absolute top-1 right-1 bg-red-600 rounded-full p-1 text-white hover:bg-red-700"
                        >
                            <Trash2 className="w-3 h-3" />
                        </button>
                    </div>
                ) : (
                    <div className="w-24 h-24 rounded-2xl bg-slate-100 dark:bg-slate-900 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all">
                        {isProcessingImg ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent"></div>
                        ) : (
                            <>
                                <Camera className="w-8 h-8 mb-1" />
                                <span className="text-[10px] font-bold">AGREGAR FOTO</span>
                            </>
                        )}
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageSelect}
                />
             </div>
          </div>

          {/* Name */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Nombre del Producto</label>
            <input 
              type="text" 
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-colors"
              placeholder="Ej: Urea, Glifosato, Cal..."
              required
              autoFocus
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              {/* Category */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Layers className="w-3 h-3" /> Categoría
                </label>
                <select 
                  value={category}
                  onChange={e => setCategory(e.target.value as Category)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
                >
                  {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {/* Unit */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Package className="w-3 h-3" /> Presentación
                </label>
                <select 
                  value={purchaseUnit}
                  onChange={e => setPurchaseUnit(e.target.value as Unit)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
                >
                  {Object.values(Unit).map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
          </div>

          {/* Expiration */}
          <div>
             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Fecha de Vencimiento (Opcional)
             </label>
             <input 
                type="date" 
                value={expirationDate}
                onChange={e => setExpirationDate(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-emerald-500 transition-colors"
             />
          </div>

          {/* Price */}
          <div>
             <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Costo de Compra (Por {purchaseUnit})
             </label>
             <input 
                type="number" 
                value={purchasePrice}
                onChange={e => setPurchasePrice(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors font-mono"
                placeholder="0"
                required
             />
             <p className="text-[10px] text-slate-500 mt-1">Este será el precio base para calcular el valor del inventario.</p>
          </div>

          {/* Admin Alert Config */}
          <div className="bg-yellow-50 dark:bg-yellow-900/10 p-3 rounded-xl border border-yellow-200 dark:border-yellow-900/30">
             <label className="block text-xs font-bold text-yellow-700 dark:text-yellow-500 uppercase mb-1 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Alerta Stock Bajo (Opcional)
             </label>
             <div className="flex items-center gap-2">
                 <input 
                    type="number" 
                    value={minStock}
                    onChange={e => setMinStock(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white outline-none transition-colors text-sm"
                    placeholder="Ej: 5"
                 />
                 <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                     {purchaseUnit}
                 </span>
             </div>
             <p className="text-[10px] text-slate-500 dark:text-slate-500 mt-1">El sistema avisará cuando quede menos de esta cantidad.</p>
          </div>

          {/* Initial Stock */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-700">
             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Inventario Inicial (Opcional)</label>
             <div className="flex items-center gap-2">
                 <input 
                    type="number" 
                    value={initialQuantity}
                    onChange={e => setInitialQuantity(e.target.value)}
                    className="flex-1 bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none transition-colors"
                    placeholder="0"
                 />
                 <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-3 rounded-lg border border-slate-200 dark:border-slate-700">
                     {purchaseUnit}
                 </span>
             </div>
          </div>

          <button 
            type="submit"
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-2 shadow-lg shadow-emerald-900/20"
          >
            <Save className="w-5 h-5" />
            Guardar Insumo
          </button>

        </form>
      </div>
    </div>
  );
};