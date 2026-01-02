
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Category, Unit, InventoryItem, Supplier } from '../types';
import { X, Save, Plus, Camera, Image as ImageIcon, Receipt, Users, FileText, Bookmark, ShieldCheck, Loader2, Info } from 'lucide-react';
import { convertToBase, getBaseUnitType, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { storageAdapter } from '../services/storageAdapter';
import { SecureImage } from './SecureImage';

// --- SUB-COMPONENTS ---

interface ImageUploaderProps {
  image: string | undefined;
  isProcessing: boolean;
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  label: string;
  className?: string; // Para controlar ancho/alto/aspecto
  icon?: React.ElementType;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ 
  image, 
  isProcessing, 
  onImageSelect, 
  label, 
  className = "w-24 h-24", 
  icon: Icon = Camera 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="shrink-0">
      <button 
        type="button"
        onClick={() => fileInputRef.current?.click()}
        aria-label={label || "Subir imagen"}
        className={`${className} rounded-3xl bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 hover:border-emerald-500 hover:text-emerald-500 transition-all cursor-pointer relative overflow-hidden group focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2 dark:focus:ring-offset-slate-900`}
      >
        {isProcessing ? (
          <div className="animate-spin rounded-full h-6 w-6 border-2 border-emerald-500 border-t-transparent" />
        ) : image ? (
          <SecureImage src={image} className="w-full h-full object-cover" alt="Preview" />
        ) : (
          <>
            <Icon className="w-8 h-8 mb-1" />
            <span className="text-[8px] font-black px-1 text-center">{label}</span>
          </>
        )}
      </button>
      <input 
        type="file" 
        ref={fileInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={onImageSelect}
        tabIndex={-1} // Evita foco en el input oculto
      />
    </div>
  );
};

interface MoneyInputProps {
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  required?: boolean;
  icon?: React.ElementType;
  textColorClass?: string;
  focusRingClass?: string;
}

const MoneyInput: React.FC<MoneyInputProps> = ({ 
  label, 
  value, 
  onChange, 
  placeholder = "0", 
  required = false, 
  icon: Icon,
  textColorClass = "text-slate-800 dark:text-white",
  focusRingClass = "focus:ring-emerald-500"
}) => {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1">
        {Icon && <Icon className="w-3 h-3" />} {label}
      </label>
      <input 
        type="text" 
        inputMode="decimal"
        value={value} 
        onChange={e => onChange(formatNumberInput(e.target.value))} 
        className={`w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 font-mono font-black outline-none focus:ring-2 transition-all ${textColorClass} ${focusRingClass}`} 
        placeholder={placeholder} 
        required={required}
      />
    </div>
  );
};

// --- MAIN COMPONENT ---

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
  // State: Identification
  const [name, setName] = useState('');
  const [category, setCategory] = useState<Category>(Category.FERTILIZANTE);
  const [image, setImage] = useState<string | undefined>(undefined);
  const [isProcessingImg, setIsProcessingImg] = useState(false);

  // State: Units & Pricing
  const [purchaseUnit, setPurchaseUnit] = useState<Unit>(Unit.BULTO_50KG);
  const [purchasePrice, setPurchasePrice] = useState('');
  const [minStock, setMinStock] = useState('');
  
  // State: Safety
  const [expirationDate, setExpirationDate] = useState('');
  const [safetyDays, setSafetyDays] = useState('');

  // State: Initial Stock Logic
  const [initialQuantity, setInitialQuantity] = useState('');
  const [initialUnit, setInitialUnit] = useState<Unit>(Unit.BULTO_50KG);
  
  // State: Supplier & Invoice
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [invoiceImage, setInvoiceImage] = useState<string | undefined>(undefined);
  const [isProcessingInvoiceImg, setIsProcessingInvoiceImg] = useState(false);

  // Logic
  const showSafetyFields = [Category.INSECTICIDA, Category.FUNGICIDA, Category.HERBICIDA].includes(category);

  const availableUnits = useMemo(() => {
      if (category === Category.FERTILIZANTE) return [Unit.BULTO_50KG, Unit.KILO, Unit.GRAMO];
      return Object.values(Unit).filter(u => u !== Unit.BULTO_50KG);
  }, [category]);

  useEffect(() => {
      if (category === Category.FERTILIZANTE) setPurchaseUnit(Unit.BULTO_50KG);
      else if (purchaseUnit === Unit.BULTO_50KG) setPurchaseUnit(Unit.LITRO);
  }, [category]);

  useEffect(() => {
      const baseType = getBaseUnitType(purchaseUnit);
      if (getBaseUnitType(initialUnit) !== baseType) {
        if (baseType === 'g') setInitialUnit(Unit.KILO);
        else if (baseType === 'ml') setInitialUnit(Unit.LITRO);
        else setInitialUnit(Unit.UNIDAD);
      }
  }, [purchaseUnit, initialUnit]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>, isInvoice: boolean = false) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      isInvoice ? setIsProcessingInvoiceImg(true) : setIsProcessingImg(true);
      
      try {
        const imageId = await storageAdapter.saveImage(file);
        isInvoice ? setInvoiceImage(imageId) : setImage(imageId);
      } catch (err) { 
        console.error("Error al procesar imagen:", err);
        alert("Error al procesar la imagen. Intente nuevamente."); 
      } finally { 
        isInvoice ? setIsProcessingInvoiceImg(false) : setIsProcessingImg(false); 
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !purchasePrice) return;
    
    const priceVal = parseNumberInput(purchasePrice);
    const initQtyVal = parseNumberInput(initialQuantity);
    const minStockVal = parseNumberInput(minStock);
    
    let minStockBase = minStockVal ? convertToBase(minStockVal, purchaseUnit) : undefined;

    onSave({
      name, category, lastPurchaseUnit: purchaseUnit,
      lastPurchasePrice: priceVal,
      minStock: minStockBase, minStockUnit: minStock ? purchaseUnit : undefined,
      description: '', 
      expirationDate: showSafetyFields ? (expirationDate || undefined) : undefined, 
      safetyIntervalDays: showSafetyFields ? (safetyDays ? parseInt(safetyDays) : undefined) : undefined,
      image // UUID from storageAdapter
    }, initQtyVal, {
        supplierId: selectedSupplierId || undefined,
        invoiceNumber: invoiceNumber || undefined,
        invoiceImage: invoiceImage // UUID from storageAdapter
    }, initialUnit);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-slide-up max-h-[95vh] flex flex-col">
        
        {/* Header */}
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
          <button 
            type="button"
            onClick={onCancel} 
            className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400 transition-colors focus:outline-none focus:ring-2 focus:ring-emerald-500"
            aria-label="Cerrar formulario"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar pb-10">
          
          {/* SECCIÓN 1: IDENTIFICACIÓN */}
          <div className="space-y-4">
              <div className="flex items-center gap-2 mb-2">
                  <Bookmark className="w-4 h-4 text-emerald-500" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Identificación</h4>
              </div>
              <div className="flex gap-4 items-start">
                  <ImageUploader 
                    image={image} 
                    isProcessing={isProcessingImg} 
                    onImageSelect={(e) => handleImageSelect(e, false)} 
                    label="FOTO" 
                  />
                  
                  <div className="flex-1 space-y-4">
                      <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-800 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500 transition-all" placeholder="Nombre (Ej: Urea / 10-30-10)" required autoFocus />
                      <div className="grid grid-cols-2 gap-3">
                          <select value={category} onChange={e => setCategory(e.target.value as Category)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500">
                              {Object.values(Category).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                          <select value={purchaseUnit} onChange={e => setPurchaseUnit(e.target.value as Unit)} className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl p-3 text-xs font-bold text-slate-600 dark:text-slate-300 outline-none focus:ring-2 focus:ring-emerald-500">
                              {availableUnits.map(u => <option key={u} value={u}>{u}</option>)}
                          </select>
                      </div>
                  </div>
              </div>
          </div>

          {/* SECCIÓN 2: COSTOS Y SEGURIDAD */}
          <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800 space-y-5">
              <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-blue-500" />
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest">Seguridad Alimentaria (PHI)</h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MoneyInput 
                    label="Precio Compra" 
                    value={purchasePrice} 
                    onChange={setPurchasePrice} 
                    placeholder="$ 0" 
                    textColorClass="text-emerald-600" 
                    focusRingClass="focus:ring-emerald-500" 
                    required 
                  />
                  
                  {showSafetyFields && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-blue-500 uppercase ml-2">Días Carencia (BPA)</label>
                        <input type="number" value={safetyDays} onChange={e => setSafetyDays(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-blue-200 dark:border-blue-800 rounded-2xl p-4 text-blue-600 font-mono font-black outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: 15" />
                    </div>
                  )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <MoneyInput 
                    label="Stock Mínimo" 
                    value={minStock} 
                    onChange={setMinStock} 
                    placeholder="Ej: 5" 
                    textColorClass="text-orange-500" 
                    focusRingClass="focus:ring-orange-500" 
                  />
                  
                  {showSafetyFields && (
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Vencimiento</label>
                        <input type="date" value={expirationDate} onChange={e => setExpirationDate(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-slate-600 dark:text-white font-bold outline-none focus:ring-2 focus:ring-emerald-500" />
                    </div>
                  )}
              </div>
          </div>
          
          {/* SECCIÓN 3: COMPRA INICIAL */}
          <div className="bg-indigo-50 dark:bg-indigo-900/10 p-6 rounded-[2rem] border border-indigo-100 dark:border-indigo-900/30 space-y-4">
              <h4 className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest flex items-center gap-2">
                  <Receipt className="w-4 h-4" /> Datos de Compra Inicial
              </h4>
              
              <div className="flex gap-2">
                  <div className="flex-1">
                    <MoneyInput 
                      label="Cant. Actual" 
                      value={initialQuantity} 
                      onChange={setInitialQuantity} 
                      placeholder="0" 
                      textColorClass="text-indigo-700 dark:text-indigo-300" 
                      focusRingClass="focus:ring-indigo-500" 
                    />
                  </div>
                  <div className="w-1/3 pt-5">
                    <select value={initialUnit} onChange={e => setInitialUnit(e.target.value as Unit)} className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-xs font-black text-slate-500 outline-none h-[58px] focus:ring-2 focus:ring-indigo-500">
                        {Object.values(Unit).filter(u => getBaseUnitType(u) === getBaseUnitType(purchaseUnit)).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Users className="w-3 h-3" /> Proveedor (Opcional)</label>
                <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-slate-800 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none">
                  <option value="">Sin Proveedor</option>
                  {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><FileText className="w-3 h-3" /> Factura (Opcional)</label>
                    <input type="text" value={invoiceNumber} onChange={e => setInvoiceNumber(e.target.value)} className="w-full bg-white dark:bg-slate-900 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-4 text-slate-800 dark:text-white font-bold text-xs focus:ring-2 focus:ring-indigo-500 outline-none" placeholder="N° Factura" />
                  </div>
                  <div className="space-y-1">
                     <label className="text-[10px] font-black text-slate-400 uppercase ml-2 flex items-center gap-1"><Camera className="w-3 h-3" /> Foto Factura</label>
                     <ImageUploader 
                        image={invoiceImage} 
                        isProcessing={isProcessingInvoiceImg} 
                        onImageSelect={(e) => handleImageSelect(e, true)} 
                        label="SUBIR FOTO" 
                        className="w-full h-[58px]"
                        icon={Loader2} 
                     />
                  </div>
              </div>
          </div>

          <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-5 rounded-3xl flex items-center justify-center gap-3 transition-all shadow-xl shadow-emerald-900/30 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-500/50">
            <Save className="w-6 h-6" /> GUARDAR PRODUCTO
          </button>
        </form>
      </div>
    </div>
  );
};
