
import React, { useState, useRef } from 'react';
import { Category, Unit, InventoryItem, Supplier } from '../types';
import { X, Save, DollarSign, Package, Layers, AlertTriangle, Camera, Image as ImageIcon, Trash2, Calendar, Receipt, Users, FileText, Plus } from 'lucide-react';
import { convertToBase } from '../services/inventoryService';
import { compressImage } from '../services/imageService';

interface InventoryFormProps {
  suppliers: Supplier[];
  onSave: (
      item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, 
      initialQuantity: number,
      initialMovementDetails?: { supplierId?: string, invoiceNumber?: string, invoiceImage?: string }
  ) => void;
  onCancel: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ suppliers, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(Category.FERTILIZANTE);
  const [purchaseUnit, setPurchaseUnit] = useState<Unit>(Unit.BULTO_50KG);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [minStock, setMinStock] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  
  // Product Image
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Initial Purchase Details
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | undefined>(undefined);
  const [isProcessingInvoiceImg, setIsProcessingInvoiceImg] = useState(false);
  const invoiceInputRef = useRef<HTMLInputElement>(null);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, isInvoice: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      if (isInvoice) setIsProcessingInvoiceImg(true);
      else setIsProcessingImg(true);
      
      try {
        const compressed = await compressImage(e.target.files[0]);
        if (isInvoice) setInvoiceImage(compressed);
        else setImage(compressed);
      } catch (err) {
        console.error("Error compressing image", err);
        alert("Error al procesar la imagen. Intente con otra.");
      } finally {
        if (isInvoice) setIsProcessingInvoiceImg(false);
        else setIsProcessingImg(false);
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
    }, initQty, {
        supplierId: selectedSupplierId || undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceImage: invoiceImage || undefined
    });
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
          
          {/* Product Image Picker */}
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
                                <span className="text-[10px] font-bold text-center px-1">FOTO PRODUCTO</span>
                            </>
                        )}
                    </div>
                )}
                <input 
                    type="file" 
                    ref={fileInputRef} 
                    className="hidden" 
                    accept="image/*"
                    onChange={(e) => handleImageSelect(e, false)}
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

          {/* --- INITIAL STOCK SECTION --- */}
          <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-900/30 space-y-4">
             <div className="flex justify-between items-center">
                <label className="block text-xs font-bold text-blue-700 dark:text-blue-400 uppercase">Inventario Inicial (Opcional)</label>
             </div>
             <div className="flex items-center gap-2">
                <input 
                    type="number" 
                    value={initialQuantity}
                    onChange={e => setInitialQuantity(e.target.value)}
                    className="flex-1 bg-white dark:bg-slate-900 border border-blue-300 dark:border-blue-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none transition-colors font-bold"
                    placeholder="0"
                />
                <span className="text-sm font-bold text-slate-600 dark:text-slate-400 bg-white dark:bg-slate-900 px-3 py-3 rounded-lg border border-blue-200 dark:border-blue-700">
                    {purchaseUnit}
                </span>
             </div>

             {/* Transparency/Traceability Fields */}
             {/* Always visible but maybe semi-transparent if quantity is 0, to encourage entry */}
             <div className={`space-y-3 pt-3 border-t border-blue-200 dark:border-blue-800/50 transition-opacity ${!initialQuantity || initialQuantity === '0' ? 'opacity-50' : 'opacity-100'}`}>
                 <div className="flex items-center justify-between">
                    <p className="text-[10px] text-blue-600 dark:text-blue-300 font-bold uppercase flex items-center gap-1">
                        <Receipt className="w-3 h-3" /> Evidencia de Compra (Contabilidad)
                    </p>
                    {(!initialQuantity || initialQuantity === '0') && <span className="text-[9px] text-slate-400 italic">Ingrese cantidad arriba para activar</span>}
                 </div>
                 
                 {/* Supplier */}
                 <div>
                    <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Proveedor (Opcional)</label>
                    <select
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                        disabled={!initialQuantity || initialQuantity === '0'}
                        className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white outline-none text-xs disabled:cursor-not-allowed"
                    >
                        <option value="">-- Seleccionar o Dejar Vacio --</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    {suppliers.length === 0 && (
                        <p className="text-[9px] text-slate-400 mt-1">
                            * Puede registrar el insumo sin proveedor y editarlo luego en el historial.
                        </p>
                    )}
                 </div>

                 <div className="grid grid-cols-2 gap-3">
                     {/* Invoice Number */}
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">N° Factura (Opcional)</label>
                        <input 
                            type="text" 
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                            disabled={!initialQuantity || initialQuantity === '0'}
                            className="w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-2 text-slate-800 dark:text-white outline-none text-xs disabled:cursor-not-allowed"
                            placeholder="#12345"
                        />
                     </div>
                     
                     {/* Invoice Photo */}
                     <div>
                        <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Foto Recibo (Opcional)</label>
                        <div 
                            onClick={() => {
                                if(initialQuantity && initialQuantity !== '0') invoiceInputRef.current?.click()
                            }}
                            className={`w-full h-[38px] border border-dashed rounded-lg flex items-center justify-center transition-colors ${!initialQuantity || initialQuantity === '0' ? 'cursor-not-allowed bg-slate-100 dark:bg-slate-900/50' : 'cursor-pointer hover:border-blue-500'} ${invoiceImage ? 'bg-emerald-100 border-emerald-500 text-emerald-600' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-400'}`}
                        >
                            {isProcessingInvoiceImg ? (
                                <div className="animate-spin rounded-full h-3 w-3 border-2 border-blue-500 border-t-transparent"></div>
                            ) : invoiceImage ? (
                                <span className="text-[10px] font-bold flex items-center gap-1"><FileText className="w-3 h-3"/> LISTO</span>
                            ) : (
                                <span className="text-[10px] flex items-center gap-1"><Camera className="w-3 h-3"/> Subir</span>
                            )}
                        </div>
                        <input 
                            type="file" 
                            ref={invoiceInputRef} 
                            className="hidden" 
                            accept="image/*"
                            onChange={(e) => handleImageSelect(e, true)}
                        />
                     </div>
                 </div>
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
