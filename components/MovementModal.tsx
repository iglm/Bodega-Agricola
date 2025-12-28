
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, Unit, Movement, Supplier, CostCenter, Personnel, Machine } from '../types';
import { getBaseUnitType, convertToBase, calculateCost, formatCurrency, formatBaseQuantity } from '../services/inventoryService';
import { compressImage } from '../services/imageService';
import { X, TrendingUp, TrendingDown, ArrowRight, DollarSign, FileText, AlertTriangle, Users, MapPin, Receipt, Image as ImageIcon, Tag, Settings, UserCheck, Calculator, Calendar, Camera, Trash2, Tractor } from 'lucide-react';

interface MovementModalProps {
  item: InventoryItem;
  type: 'IN' | 'OUT';
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel?: Personnel[];
  machines?: Machine[]; // New prop
  movements?: Movement[];
  onSave: (movement: Omit<Movement, 'id' | 'date' | 'warehouseId'>, newUnitPrice?: number, newExpirationDate?: string) => void;
  onCancel: () => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({ 
  item, 
  type, 
  suppliers, 
  costCenters, 
  personnel = [],
  machines = [],
  movements = [],
  onSave, 
  onCancel 
}) => {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit>(item.lastPurchaseUnit);
  
  const [manualUnitPrice, setManualUnitPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [expirationDate, setExpirationDate] = useState<string>(item.expirationDate || '');

  const [invoiceImage, setInvoiceImage] = useState<string | undefined>(undefined);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(null);
  
  // Admin fields
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');

  // Destination Logic (New Switch)
  const [destinationType, setDestinationType] = useState<'lote' | 'machine'>('lote');
  const [selectedCostCenterId, setSelectedCostCenterId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');

  // Calculator State
  const [showCalculator, setShowCalculator] = useState(false);
  const [calcDose, setCalcDose] = useState('');
  const [calcAmount, setCalcAmount] = useState('');

  const [previewCost, setPreviewCost] = useState<number>(0);

  const isOut = type === 'OUT';
  const baseType = getBaseUnitType(item.lastPurchaseUnit);
  const MAX_NOTES_LENGTH = 200;
  
  const EPSILON = 0.1;

  const compatibleUnits = Object.values(Unit).filter(u => {
     const t = getBaseUnitType(u);
     if (baseType === 'unit') return t === 'unit';
     if (baseType === 'g') return t === 'g';
     if (baseType === 'ml') return t === 'ml';
     return false;
  });

  // Budget Logic (Only applies if destination is LOTE)
  const budgetInfo = useMemo(() => {
    if (!isOut || destinationType !== 'lote' || !selectedCostCenterId) return null;
    const center = costCenters.find(c => c.id === selectedCostCenterId);
    if (!center || !center.budget) return null;

    const spent = movements
        .filter(m => m.costCenterId === selectedCostCenterId && m.type === 'OUT')
        .reduce((sum, m) => sum + m.calculatedCost, 0);
    
    const projectedTotal = spent + previewCost;
    const percentage = (projectedTotal / center.budget) * 100;

    return {
        budget: center.budget,
        spent,
        projectedTotal,
        percentage,
        isOver: projectedTotal > center.budget
    };
  }, [isOut, destinationType, selectedCostCenterId, movements, costCenters, previewCost]);


  // Initialize
  useEffect(() => {
    if (!isOut && unit === item.lastPurchaseUnit) {
      setManualUnitPrice(item.lastPurchasePrice.toString());
    } else if (!isOut) {
      setManualUnitPrice(''); 
    }

    if (isOut && !outputCode) {
        const code = 'SAL-' + Math.random().toString(36).substr(2, 6).toUpperCase();
        setOutputCode(code);
    }
  }, [unit, isOut, item]);

  // Real-time validation & Cost Calculation
  useEffect(() => {
    const qtyNum = parseFloat(quantity);
    setError(null);
    
    if (!isNaN(qtyNum) && qtyNum > 0) {
      if (isOut) {
        const requestedBaseAmount = convertToBase(qtyNum, unit);
        if (requestedBaseAmount > item.currentQuantity + EPSILON) {
            const availableReadable = formatBaseQuantity(item.currentQuantity, item.baseUnit);
            setError(`Stock insuficiente. Disponible: ${availableReadable}`);
        }
        
        if (item.averageCost) {
            const baseAmount = convertToBase(qtyNum, unit);
            setPreviewCost(baseAmount * item.averageCost);
        } else {
            const cost = calculateCost(qtyNum, unit, item.lastPurchasePrice, item.lastPurchaseUnit);
            setPreviewCost(cost);
        }

      } else {
        const priceNum = parseFloat(manualUnitPrice);
        if (!isNaN(priceNum)) {
          setPreviewCost(qtyNum * priceNum);
        } else {
          setPreviewCost(0);
        }
      }
    } else {
      setPreviewCost(0);
    }
  }, [quantity, unit, manualUnitPrice, isOut, item]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsProcessingImg(true);
      try {
        const compressed = await compressImage(e.target.files[0]);
        setInvoiceImage(compressed);
      } catch (err) {
        console.error("Error compressing image", err);
        alert("Error al procesar la imagen.");
      } finally {
        setIsProcessingImg(false);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum <= 0) return;
    if (isOut) {
        const requestedBaseAmount = convertToBase(qtyNum, unit);
        if (requestedBaseAmount > item.currentQuantity + EPSILON) return;
        // Destination Validation REMOVED - Made Optional
    }
    if (error) return;

    const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name;
    const costCenterName = costCenters.find(c => c.id === selectedCostCenterId)?.name;
    const personnelName = personnel.find(p => p.id === selectedPersonnelId)?.name;
    const machineName = machines.find(m => m.id === selectedMachineId)?.name;

    const priceToSave = !isOut ? parseFloat(manualUnitPrice) : undefined;
    const dateToSave = !isOut && expirationDate ? expirationDate : undefined;

    onSave({
      itemId: item.id,
      itemName: item.name,
      type,
      quantity: Number(quantity),
      unit,
      calculatedCost: previewCost,
      notes: notes.trim(),
      invoiceNumber: !isOut ? invoiceNumber.trim() : undefined,
      invoiceImage: !isOut ? invoiceImage : undefined,
      outputCode: isOut ? outputCode.trim() : undefined,
      supplierId: selectedSupplierId || undefined,
      supplierName,
      costCenterId: (isOut && destinationType === 'lote') ? selectedCostCenterId : undefined,
      costCenterName: (isOut && destinationType === 'lote') ? costCenterName : undefined,
      machineId: (isOut && destinationType === 'machine') ? selectedMachineId : undefined,
      machineName: (isOut && destinationType === 'machine') ? machineName : undefined,
      personnelId: selectedPersonnelId || undefined,
      personnelName
    }, priceToSave, dateToSave);
  };

  const applyCalculatedDose = () => {
    const dose = parseFloat(calcDose);
    const amount = parseFloat(calcAmount);
    if (!isNaN(dose) && !isNaN(amount)) {
        setQuantity((dose * amount).toFixed(2));
        setShowCalculator(false);
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-slide-up transition-colors duration-300 max-h-[95vh] overflow-y-auto custom-scrollbar relative">
        <div className={`p-4 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center ${isOut ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'} sticky top-0 z-10`}>
          <div className="flex items-center gap-2">
            {isOut ? <TrendingDown className="text-red-500" /> : <TrendingUp className="text-emerald-500" />}
            <h3 className="text-slate-800 dark:text-white font-bold text-lg">{isOut ? 'Registrar Salida / Gasto' : 'Registrar Entrada / Compra'}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Visual Confirmation */}
          <div className="bg-slate-100 dark:bg-slate-900 p-3 rounded-lg border border-slate-200 dark:border-slate-700 transition-colors flex items-center gap-3">
             {item.image ? (
                <img src={item.image} alt="Product" className="w-12 h-12 rounded-lg object-cover border border-slate-300 dark:border-slate-600" />
             ) : (
                <div className="w-12 h-12 rounded-lg bg-slate-200 dark:bg-slate-800 flex items-center justify-center text-slate-400">
                    <ImageIcon className="w-6 h-6" />
                </div>
             )}
             <div>
                <p className="text-slate-500 dark:text-slate-400 text-xs uppercase mb-1">Confirmar Producto</p>
                <p className="text-slate-800 dark:text-white font-bold leading-none">{item.name}</p>
                {isOut && item.averageCost && (
                     <p className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-1 font-mono">
                         Costo Promedio: {formatCurrency(item.averageCost * (getBaseUnitType(unit) === 'g' ? 1000 : 1000))} / Kg-L
                     </p>
                )}
             </div>
          </div>

          {/* CALCULATOR TOOL (Only Output) */}
          {isOut && (
             <div className="flex justify-end">
                <button 
                    type="button" 
                    onClick={() => setShowCalculator(!showCalculator)}
                    className="text-xs font-bold text-blue-500 hover:text-blue-400 flex items-center gap-1 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded"
                >
                    <Calculator className="w-3 h-3" />
                    Calculadora de Dosis
                </button>
             </div>
          )}

          {/* CALCULATOR PANEL */}
          {showCalculator && (
             <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl border border-blue-200 dark:border-blue-800 animate-fade-in space-y-3">
                 <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase">Calculadora de Campo</h4>
                 <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400">Dosis por Unidad (cc/gr)</label>
                        <input 
                            type="number" 
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-sm"
                            placeholder="Ej: 200"
                            value={calcDose}
                            onChange={(e) => setCalcDose(e.target.value)}
                        />
                    </div>
                    <div>
                        <label className="text-[10px] text-slate-500 dark:text-slate-400">N° Bombadas / Ha</label>
                        <input 
                            type="number" 
                            className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded p-1.5 text-sm"
                            placeholder="Ej: 15"
                            value={calcAmount}
                            onChange={(e) => setCalcAmount(e.target.value)}
                        />
                    </div>
                 </div>
                 <div className="flex justify-between items-center bg-blue-100 dark:bg-blue-900/30 p-2 rounded">
                     <span className="text-xs font-bold text-blue-800 dark:text-blue-300">
                        Total: {(!isNaN(parseFloat(calcDose)) && !isNaN(parseFloat(calcAmount))) ? (parseFloat(calcDose) * parseFloat(calcAmount)) : 0}
                     </span>
                     <button 
                        type="button"
                        onClick={applyCalculatedDose}
                        className="bg-blue-600 text-white text-xs px-2 py-1 rounded hover:bg-blue-500"
                     >
                        Aplicar
                     </button>
                 </div>
             </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Cantidad</label>
              <input 
                type="number" 
                value={quantity}
                onChange={e => setQuantity(e.target.value)}
                className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-3 text-slate-800 dark:text-white outline-none focus:border-blue-500 ${error ? 'border-red-500 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'} transition-colors`}
                placeholder="0.00"
                step="0.01"
                autoFocus={!showCalculator} 
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">Unidad</label>
              <select 
                value={unit}
                onChange={e => setUnit(e.target.value as Unit)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
              >
                {compatibleUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {/* New Price Input - Only for Entries */}
          {!isOut && (
            <div className="animate-fade-in space-y-3">
               
               {/* EXPIRATION DATE */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Nueva Fecha Vencimiento
                  </label>
                  <input 
                      type="date" 
                      value={expirationDate}
                      onChange={e => setExpirationDate(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                  />
               </div>

               <div className="grid grid-cols-2 gap-4">
                   <div>
                        <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1 flex items-center gap-1">
                            <DollarSign className="w-3 h-3" />
                            Precio Unitario
                        </label>
                        <input 
                            type="number" 
                            value={manualUnitPrice}
                            onChange={e => setManualUnitPrice(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-emerald-500/50 rounded-lg p-3 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                            placeholder="0"
                            required={!isOut}
                        />
                   </div>
                   <div>
                        <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                            <Receipt className="w-3 h-3" />
                            Factura #
                        </label>
                        <input 
                            type="text" 
                            value={invoiceNumber}
                            onChange={e => setInvoiceNumber(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                            placeholder="Opcional"
                        />
                   </div>
               </div>
               
               {/* INVOICE PHOTO UPLOAD (NEW) */}
               <div>
                 <label className="block text-xs font-bold text-blue-500 uppercase mb-1 flex items-center gap-1">
                     <Camera className="w-3 h-3" /> Foto Factura / Recibo
                 </label>
                 
                 <div className="flex items-center gap-3">
                     {invoiceImage ? (
                         <div className="relative w-full h-24 bg-slate-900 rounded-lg overflow-hidden border border-slate-600 group">
                             <img src={invoiceImage} alt="Factura" className="w-full h-full object-contain" />
                             <button 
                                type="button" 
                                onClick={() => setInvoiceImage(undefined)}
                                className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full shadow-lg"
                             >
                                 <Trash2 className="w-4 h-4" />
                             </button>
                         </div>
                     ) : (
                         <div 
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full h-16 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg flex flex-col items-center justify-center text-slate-400 hover:border-blue-500 hover:text-blue-500 cursor-pointer transition-colors"
                         >
                            {isProcessingImg ? (
                                <div className="animate-spin rounded-full h-5 w-5 border-2 border-blue-500 border-t-transparent"></div>
                            ) : (
                                <>
                                    <Camera className="w-5 h-5 mb-1" />
                                    <span className="text-[10px]">ADJUNTAR FOTO</span>
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

               {/* Supplier Selection */}
               <div className="bg-slate-50 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-700">
                 <label className="block text-xs font-bold text-blue-500 uppercase mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Seleccionar Proveedor
                 </label>
                 
                 {suppliers.length > 0 ? (
                    <select
                        value={selectedSupplierId}
                        onChange={e => setSelectedSupplierId(e.target.value)}
                        className="w-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors mb-2"
                    >
                        <option value="">-- Seleccionar de la lista --</option>
                        {suppliers.map(s => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                 ) : (
                    <div className="text-xs text-orange-500 mb-2 p-2 bg-orange-50 dark:bg-orange-900/10 rounded border border-orange-200 dark:border-orange-800 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>No hay proveedores creados.</span>
                    </div>
                 )}
               </div>
            </div>
          )}

          {/* Cost Center / Machine / Personnel Selection - Only for Out */}
          {isOut && (
              <div className="space-y-4">
                 
                 {/* Output Code */}
                 <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                        <Tag className="w-3 h-3" />
                        Código de Salida / Consecutivo
                    </label>
                    <input 
                        type="text" 
                        value={outputCode}
                        onChange={e => setOutputCode(e.target.value)}
                        className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg p-3 text-slate-800 dark:text-white outline-none font-mono text-sm"
                        placeholder="Generando..."
                    />
                 </div>

                 {/* Personnel Selection */}
                 <div>
                     <label className="block text-xs font-bold text-blue-500 uppercase mb-1 flex items-center gap-1">
                        <UserCheck className="w-3 h-3" /> Responsable (Opcional)
                     </label>
                     <select
                            value={selectedPersonnelId}
                            onChange={e => setSelectedPersonnelId(e.target.value)}
                            className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
                     >
                            <option value="">-- Sin Responsable --</option>
                            {personnel.map(p => (
                                <option key={p.id} value={p.id}>{p.name}</option>
                            ))}
                     </select>
                     {personnel.length === 0 && <p className="text-[10px] text-slate-400 mt-1">Puede crear responsables en Maestros.</p>}
                 </div>

                 {/* DESTINATION TOGGLE (LOTE vs MACHINE) */}
                 <div>
                    <label className="block text-xs font-bold text-purple-500 uppercase mb-2 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> Destino (Opcional)
                    </label>
                    
                    <div className="flex p-1 bg-slate-200 dark:bg-slate-900 rounded-lg mb-3">
                        <button 
                            type="button"
                            onClick={() => { setDestinationType('lote'); setSelectedMachineId(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${destinationType === 'lote' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                        >
                            <MapPin className="w-3 h-3" /> Lote / Cultivo
                        </button>
                        <button 
                            type="button"
                            onClick={() => { setDestinationType('machine'); setSelectedCostCenterId(''); }}
                            className={`flex-1 py-2 text-xs font-bold rounded-md flex items-center justify-center gap-2 transition-all ${destinationType === 'machine' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-white shadow-sm' : 'text-slate-500'}`}
                        >
                            <Tractor className="w-3 h-3" /> Maquinaria
                        </button>
                    </div>

                    {/* SELECTOR FOR LOTE */}
                    {destinationType === 'lote' && (
                        <>
                            {costCenters.length === 0 ? (
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        No hay Lotes/Destinos creados
                                    </p>
                                </div>
                            ) : (
                                <select
                                    value={selectedCostCenterId}
                                    onChange={e => setSelectedCostCenterId(e.target.value)}
                                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
                                >
                                    <option value="">-- Ninguno / General --</option>
                                    {costCenters.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            )}

                            {/* BUDGET WARNING VISUALIZATION (ONLY FOR LOTE) */}
                            {budgetInfo && (
                                <div className={`mt-3 p-3 rounded-lg border ${budgetInfo.isOver ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800' : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}`}>
                                    <div className="flex justify-between items-center text-xs mb-1">
                                        <span className="font-bold text-slate-600 dark:text-slate-300">Presupuesto Lote</span>
                                        <span className={budgetInfo.isOver ? 'text-red-600 font-bold' : 'text-slate-500'}>
                                            {formatCurrency(budgetInfo.projectedTotal)} / {formatCurrency(budgetInfo.budget)}
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                        <div 
                                            className={`h-2 rounded-full transition-all duration-500 ${budgetInfo.isOver ? 'bg-red-500' : 'bg-purple-500'}`}
                                            style={{ width: `${Math.min(budgetInfo.percentage, 100)}%` }}
                                        ></div>
                                    </div>
                                    {budgetInfo.isOver && (
                                        <p className="text-[10px] text-red-500 mt-1 font-bold flex items-center gap-1">
                                            <AlertTriangle className="w-3 h-3" /> PRESUPUESTO EXCEDIDO
                                        </p>
                                    )}
                                </div>
                            )}
                        </>
                    )}

                    {/* SELECTOR FOR MACHINE */}
                    {destinationType === 'machine' && (
                        <>
                             {machines.length === 0 ? (
                                <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg border border-orange-200 dark:border-orange-800">
                                    <p className="text-xs text-orange-600 dark:text-orange-400 font-bold flex items-center gap-2">
                                        <AlertTriangle className="w-4 h-4" />
                                        No hay Máquinas creadas
                                    </p>
                                    <p className="text-[10px] text-slate-500 mt-1">Cree máquinas en la pestaña Gestión.</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    <select
                                        value={selectedMachineId}
                                        onChange={e => setSelectedMachineId(e.target.value)}
                                        className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
                                    >
                                        <option value="">-- Ninguna / General --</option>
                                        {machines.map(m => (
                                            <option key={m.id} value={m.id}>{m.name}</option>
                                        ))}
                                    </select>
                                    <p className="text-[10px] text-emerald-500 font-bold flex items-center gap-1 bg-emerald-900/10 p-2 rounded border border-emerald-900/20">
                                        <Tractor className="w-3 h-3" /> 
                                        El costo se registrará automáticamente como mantenimiento de la máquina.
                                    </p>
                                </div>
                            )}
                        </>
                    )}

                 </div>
              </div>
          )}

          {/* Notes Input */}
          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                <FileText className="w-3 h-3" />
                Notas / Detalles
              </label>
              <span className={`text-[10px] font-mono ${
                notes.length >= MAX_NOTES_LENGTH ? 'text-red-400 font-bold' : 
                notes.length >= MAX_NOTES_LENGTH * 0.9 ? 'text-yellow-500' : 'text-slate-400'
              }`}>
                {notes.length}/{MAX_NOTES_LENGTH}
              </span>
            </div>
            <textarea 
              value={notes}
              onChange={e => setNotes(e.target.value)}
              maxLength={MAX_NOTES_LENGTH}
              className={`w-full bg-slate-50 dark:bg-slate-900 border rounded-lg p-3 text-slate-800 dark:text-white outline-none focus:border-blue-500 text-sm resize-none transition-colors ${
                notes.length >= MAX_NOTES_LENGTH ? 'border-red-500/50 focus:border-red-500' : 'border-slate-300 dark:border-slate-700'
              }`}
              placeholder={isOut ? "Ej: Aplicación semanal..." : "Ej: Comentario adicional..."}
              rows={2}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-500/50 p-3 rounded-lg flex items-center gap-2 text-red-600 dark:text-red-300 text-xs animate-pulse">
                <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                <span className="font-semibold">{error}</span>
            </div>
          )}

          {/* Smart Math Display */}
          <div className="bg-slate-100 dark:bg-slate-900/50 rounded-xl p-4 border border-dashed border-slate-300 dark:border-slate-600 transition-colors">
            <div className="flex justify-between items-center text-sm mb-2">
              <span className="text-slate-500 dark:text-slate-400">
                  {isOut ? 'Costo Contable Salida:' : 'Valor Entrada:'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300 text-sm">
              <span>{quantity || 0} {unit}</span>
              <ArrowRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
              <span className={`font-bold font-mono text-lg ${isOut ? 'text-red-500 dark:text-red-400' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatCurrency(previewCost)}
              </span>
            </div>
            {isOut && (
                <p className="text-[10px] text-slate-400 mt-1 italic text-right">
                    Calculado usando Costo Promedio Ponderado
                </p>
            )}
          </div>

          <button 
            type="submit"
            disabled={!!error || !quantity || (!isOut && !manualUnitPrice)}
            className={`w-full py-3 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-colors ${
              isOut ? 'bg-red-600 hover:bg-red-700' : 'bg-emerald-600 hover:bg-emerald-700'
            } ${!!error || !quantity ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isOut ? 'Confirmar Salida' : 'Confirmar Entrada'}
          </button>
        </form>
      </div>
    </div>
  );
};
