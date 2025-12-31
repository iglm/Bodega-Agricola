
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category, Unit, InventoryItem, Supplier } from '../types';
import { X, Save, DollarSign, Package, Layers, AlertTriangle, Camera, Image as ImageIcon, Trash2, Calendar, Receipt, Users, FileText, Plus, CheckCircle, Info, Tag, Bookmark, ShieldCheck, Loader2 } from 'lucide-react';
import { convertToBase, getBaseUnitType } from '../services/inventoryService';
import { compressImage } from '../services/imageService';

interface InventoryFormProps {
  suppliers: Supplier[];
  onSave: (
      item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, 
      initialQuantity: number,
      initialMovementDetails?: { supplierId?: string, invoiceNumber?: string, invoiceImage?: string },
      initialUnit?: Unit
  ) => void;
  onCancel: () => void;
}

export const InventoryForm: React.FC<InventoryFormProps> = ({ suppliers, onSave, onCancel }) => {
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(Category.FERTILIZANTE);
  const [purchaseUnit, setPurchaseUnit] = useState<Unit>(Unit.BULTO_50KG);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [initialQuantity, setInitialQuantity] = useState('');
  const [initialUnit, setInitialUnit] = useState<Unit>(Unit.BULTO_50KG);
  const [minStock, setMinStock] = useState('');
  const [expirationDate, setExpirationDate] = useState('');
  const [safetyDays, setSafetyDays] = useState('');
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const invoiceFileInputRef = useRef<HTMLInputElement>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | undefined>(undefined);
  const [isProcessingInvoiceImg, setIsProcessingInvoiceImg] = useState(false);

  // Solo mostramos campos de seguridad (Carencia/Vencimiento) para agroquímicos puros
  const showSafetyFields = [Category.INSECTICIDA, Category.FUNGICIDA, Category.HERBICIDA].includes(category);

  // --- LÓGICA INTELIGENTE DE UNIDADES ---
  const availableUnits = useMemo(() => {
      if (category === Category.FERTILIZANTE) {
          // Fertilizantes: Solo Bulto, Kilo, Gramo
          return [Unit.BULTO_50KG, Unit.KILO, Unit.GRAMO];
      } else {
          // Otros (Agroquímicos): Todo MENOS Bulto
          return Object.values(Unit).filter(u => u !== Unit.BULTO_50KG);
      }
  }, [category]);

  // Efecto para cambiar la unidad por defecto cuando cambia la categoría
  useEffect(() => {
      if (category === Category.FERTILIZANTE) {
          setPurchaseUnit(Unit.BULTO_50KG);
      } else {
          // Si cambiamos a agroquímicos y estaba en bulto, pasamos a Litro (común en venenos)
          if (purchaseUnit === Unit.BULTO_50KG) {
              setPurchaseUnit(Unit.LITRO);
          }
      }
  }, [category]);

  // Efecto para sincronizar la unidad inicial con la unidad de compra
  useEffect(() => {
      const baseType = getBaseUnitType(purchaseUnit);
      // Ensure initialUnit is compatible with the selected purchaseUnit's base type
      if (getBaseUnitType(initialUnit) !== baseType) {
        if (baseType === 'g') setInitialUnit(Unit.KILO);
        else if (baseType === 'ml') setInitialUnit(Unit.LITRO);
        else setInitialUnit(Unit.UNIDAD);
      }
  }, [purchaseUnit, initialUnit]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, isInvoice: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      isInvoice ? setIsProcessingInvoiceImg(true) : setIsProcessingImg(true);
      try {
        const compressed = await compressImage(e.target.files[0]);
        isInvoice ? setInvoiceImage(compressed) : setImage(compressed);
      } catch (err) { alert("Error al procesar la imagen."); }
      finally { isInvoice ? setIsProcessingInvoiceImg(false) : setIsProcessingImg(false); }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purchasePrice) return;
    const initQty = initialQuantity ? Number(initialQuantity) : 0;
    let minStockBase = minStock ? convertToBase(parseFloat(minStock), purchaseUnit) : undefined;

    onSave({
      name, category, lastPurchaseUnit: purchaseUnit,
      lastPurchasePrice: Number(purchasePrice),
      minStock: minStockBase, minStockUnit: minStock ? purchaseUnit : undefined,
      description: '', 
      // Solo guardamos datos de seguridad si la categoría lo requiere
      expirationDate: showSafetyFields ? (expirationDate || undefined) : undefined, 
      safetyIntervalDays: showSafetyFields ? (safetyDays ? parseInt(safetyDays) : undefined) : undefined,
      image
    }, initQty, {
        supplierId: selectedSupplierId || undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceImage: invoiceImage || undefined
    }, initialUnit);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[95vh] flex flex-col">
        
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
             <div className="bg-emerald-500 p-3 rounded-2xl text-white shadow-lg shadow-emerald-500/20">
                <Plus className="w-6 h-6" />
             </div>
             <div>
                <h3 className="text-slate-800 dark:text-white font-black text-xl">Nuevo Producto</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Gestión de Insumos</p>
             </div>
          </div>
          <button onClick={onCancel} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-10">
          
          <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <Bookmark className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identificación</h4>
              </div>
              <div className="flex gap-4 items-start">
                  <div className="shrink-0">
                    <div onClick={() => fileInputRef.current?.click()} className="w-24 h-24 rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer relative overflow-hidden group">
                        {isProcessingImg ? <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" /> : 
                         image ? <img src={image} className="w-full h-full object-cover" /> : 
                         <><Camera className="w-8 h-8 mb-1" /><span className="text-[8px] font-black px-1 text-center">FOTO</span></>}
                    </div>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={e => handleImageSelect(e, false)} />
                  </div>
                  <div className="flex-1 space-y-4">
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Nombre (Ej: Urea / 10-30-10)" required autoFocus />
                      <div className="grid grid-cols-2 gap-3">
                          <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none">
                              {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select value={purchaseUnit} onChange={e => setPurchaseUnit(e.target.value as Unit)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none">
                              {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                      </div>
                  </div>
              </div>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Seguridad Alimentaria (PHI)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Precio Compra</label>
                      <input type="number" value={purchasePrice} onChange={e => setPurchasePrice(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-emerald-600 font-mono font-black outline-none focus:ring-2 focus:ring-emerald-500" placeholder="$ 0" required />
                  </div>
                  
                  {/* SOLO MOSTRAR DÍAS DE CARENCIA PARA AGROQUÍMICOS (INSECTICIDAS, FUNGICIDAS, HERBICIDAS) */}
                  {showSafetyFields && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-500 uppercase ml-2">Días Carencia (BPA)</label>
                        <input type="number" value={safetyDays} onChange={e => setSafetyDays(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-blue-600 font-mono font-black outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 15" />
                    </div>
                  )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Stock Mínimo</label>
                      <input type="number" value={minStock} onChange={e => setMinStock(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-orange-500 font-mono font-black outline-none focus:ring-2 focus:ring-orange-500" placeholder="Ej: 5" />
                  </div>
                  
                  {/* SOLO MOSTRAR VENCIMIENTO PARA AGROQUÍMICOS */}
                  {showSafetyFields && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Vencimiento</label>
                        <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-600 dark:text-white font-bold outline-none" />
                    </div>
                  )}
              </div>
          </div>
          
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 space-y-4">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Datos de Compra Inicial
              </h4>
              
              <div className="flex gap-2">
                  <input type="number" value={initialQuantity} onChange={e => setInitialQuantity(e.target.value)} className="flex-1 bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-indigo-700 dark:text-indigo-300 font-black outline-none" placeholder="Cant. Actual" />
                  <select value={initialUnit} onChange={e => setInitialUnit(e.target.value as Unit)} className="bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-xs font-black text-slate-500 outline-none">
                      {Object.values(Unit).filter(u => getBaseUnitType(u) === getBaseUnitType(purchaseUnit)).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Users className="w-3 h-3" /> Proveedor (Opcional)</label>
                <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-slate-800 dark:text-white font-bold text-xs">
                  <option value="">Sin Proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Factura (Opcional)</label>
                    <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-slate-800 dark:text-white font-bold text-xs" placeholder="N° Factura" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Foto Factura</label>
                     <div onClick={() => invoiceFileInputRef.current?.click()} className="w-full h-[58px] rounded-2xl bg-white dark:bg-slate-900 border-2 border-dashed border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-400 hover:border-indigo-500 hover:text-indigo-500 transition-all cursor-pointer relative overflow-hidden group">
                        {isProcessingInvoiceImg ? <Loader2 className="w-5 h-5 animate-spin" /> : 
                         invoiceImage ? <img src={invoiceImage} className="w-full h-full object-cover" /> : 
                         <span className="text-[9px] font-black">SUBIR FOTO</span>}
                     </div>
                     <input type="file" ref={invoiceFileInputRef} className="hidden" accept="image/*" onChange={e => handleImageSelect(e, true)} />
                  </div>
              </div>
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/30 active:scale-95">
            <Save className="w-6 h-6" /> GUARDAR PRODUCTO
          </button>
        </form>
      </div>
    </div>
  );
};
