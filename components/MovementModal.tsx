
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, Unit, Movement, Supplier, CostCenter, Personnel, Machine, Category } from '../types';
import { getBaseUnitType, convertToBase, calculateCost, formatCurrency, formatBaseQuantity } from '../services/inventoryService';
import { compressImage } from '../services/imageService';
import { X, TrendingUp, TrendingDown, ArrowRight, DollarSign, FileText, AlertTriangle, Users, MapPin, Receipt, Image as ImageIcon, Tag, Settings, UserCheck, Calculator, Calendar, Camera, Trash2, Tractor, Maximize, Microscope, CheckCircle, ShieldCheck, Clock } from 'lucide-react';

interface MovementModalProps {
  item: InventoryItem;
  type: 'IN' | 'OUT';
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel?: Personnel[];
  machines?: Machine[]; 
  movements?: Movement[];
  onSave: (movement: Omit<Movement, 'id' | 'date' | 'warehouseId'>, newUnitPrice?: number, newExpirationDate?: string) => void;
  onCancel: () => void;
  allSoilAnalyses?: any[];
}

export const MovementModal: React.FC<MovementModalProps> = ({ 
  item, type, suppliers, costCenters, personnel = [], machines = [], movements = [],
  onSave, onCancel, allSoilAnalyses = []
}) => {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit>(item.lastPurchaseUnit);
  const [manualUnitPrice, setManualUnitPrice] = useState<string>('');
  const [notes, setNotes] = useState('');
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [outputCode, setOutputCode] = useState('');
  const [expirationDate, setExpirationDate] = useState<string>(item.expirationDate || '');
  const [phiDays, setPhiDays] = useState<string>(item.safetyIntervalDays?.toString() || '');
  const [invoiceImage, setInvoiceImage] = useState<string | undefined>(undefined);
  const [isProcessingImg, setIsProcessingImg] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [destinationType, setDestinationType] = useState<'lote' | 'machine'>('lote');
  const [selectedCostCenterId, setSelectedCostCenterId] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');
  const [previewCost, setPreviewCost] = useState<number>(0);

  const isOut = type === 'OUT';
  const baseType = getBaseUnitType(item.lastPurchaseUnit);
  
  const soilRecommendation = useMemo(() => {
      if (!isOut || item.category !== Category.FERTILIZANTE || !selectedCostCenterId) return null;
      return allSoilAnalyses
          .filter(s => s.costCenterId === selectedCostCenterId)
          .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }, [isOut, item.category, selectedCostCenterId, allSoilAnalyses]);

  const compatibleUnits = Object.values(Unit).filter(u => getBaseUnitType(u) === baseType);

  useEffect(() => {
    if (!isOut && unit === item.lastPurchaseUnit) setManualUnitPrice(item.lastPurchasePrice.toString());
    if (isOut && !outputCode) setOutputCode('SAL-' + Math.random().toString(36).substr(2, 6).toUpperCase());
  }, [unit, isOut, item]);

  useEffect(() => {
    const qtyNum = parseFloat(quantity);
    if (!isNaN(qtyNum) && qtyNum > 0) {
      const baseAmount = convertToBase(qtyNum, unit);
      if (isOut) {
          if (baseAmount > (item.currentQuantity + 0.0001)) {
              setError(`Máximo disponible: ${formatBaseQuantity(item.currentQuantity, item.baseUnit)}`);
          } else { setError(null); }
          setPreviewCost(baseAmount * (item.averageCost || 0));
      } else {
          setPreviewCost(qtyNum * (parseFloat(manualUnitPrice) || 0));
      }
    } else { setPreviewCost(0); }
  }, [quantity, unit, manualUnitPrice, isOut, item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (error) return;
    const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name;
    const costCenterName = costCenters.find(c => c.id === selectedCostCenterId)?.name;
    const personnelName = personnel.find(p => p.id === selectedPersonnelId)?.name;
    const machineName = machines.find(m => m.id === selectedMachineId)?.name;

    onSave({
      itemId: item.id, itemName: item.name, type, quantity: Number(quantity), unit, calculatedCost: previewCost,
      notes: notes.trim(), invoiceNumber: !isOut ? invoiceNumber.trim() : undefined, invoiceImage: !isOut ? invoiceImage : undefined,
      outputCode: isOut ? outputCode.trim() : undefined, supplierId: selectedSupplierId || undefined, supplierName,
      costCenterId: (isOut && destinationType === 'lote') ? selectedCostCenterId : undefined,
      costCenterName: (isOut && destinationType === 'lote') ? costCenterName : undefined,
      machineId: (isOut && destinationType === 'machine') ? selectedMachineId : undefined,
      machineName: (isOut && destinationType === 'machine') ? machineName : undefined,
      personnelId: selectedPersonnelId || undefined, personnelName,
      phiApplied: isOut ? parseInt(phiDays) : undefined
    }, !isOut ? parseFloat(manualUnitPrice) : undefined, !isOut ? expirationDate : undefined);
  };

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-slide-up max-h-[95vh] overflow-y-auto custom-scrollbar">
        
        <div className={`p-6 border-b border-slate-200 dark:border-slate-700 flex justify-between items-center ${isOut ? 'bg-red-50 dark:bg-red-900/20' : 'bg-emerald-50 dark:bg-emerald-900/20'}`}>
          <div className="flex items-center gap-2">
            {isOut ? <TrendingDown className="text-red-500" /> : <TrendingUp className="text-emerald-500" />}
            <h3 className="text-slate-800 dark:text-white font-black text-xl">{isOut ? 'Salida / Aplicación' : 'Entrada / Compra'}</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 bg-white dark:bg-slate-700 rounded-full"><X className="w-5 h-5" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex items-center gap-3">
             <div className="w-14 h-14 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center border dark:border-slate-700 overflow-hidden shrink-0">
                {item.image ? <img src={item.image} className="w-full h-full object-cover" /> : <ImageIcon className="text-slate-400" />}
             </div>
             <div><p className="text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase">Insumo</p><p className="text-slate-800 dark:text-white font-bold">{item.name}</p></div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Cantidad</label>
              <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 text-slate-800 dark:text-white font-mono font-black outline-none focus:ring-2 focus:ring-emerald-500" placeholder="0.00" step="0.01" required />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Unidad</label>
              <select value={unit} onChange={e => setUnit(e.target.value as Unit)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 text-slate-800 dark:text-white font-bold text-xs">
                {compatibleUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {isOut && (
              <div className="space-y-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-purple-500 uppercase ml-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> Destino / Lote</label>
                      <select value={selectedCostCenterId} onChange={e => setSelectedCostCenterId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-white font-bold text-sm outline-none focus:ring-2 focus:ring-purple-500" required={isOut}>
                          <option value="">Seleccionar Lote...</option>
                          {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  </div>
                  
                  {/* PHI / PC CAPTURE */}
                  {(item.category === Category.INSECTICIDA || item.category === Category.FUNGICIDA || item.category === Category.HERBICIDA) && (
                      <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-2xl space-y-2">
                          <label className="text-[10px] font-black text-amber-500 uppercase flex items-center gap-1">
                              <ShieldCheck className="w-4 h-4" /> Periodo de Carencia (PC) - Días
                          </label>
                          <input 
                              type="number" 
                              value={phiDays} 
                              onChange={e => setPhiDays(e.target.value)} 
                              className="w-full bg-white dark:bg-slate-900 border border-amber-500/30 rounded-xl p-3 text-amber-600 font-black text-xs outline-none focus:ring-2 focus:ring-amber-500"
                              placeholder="Días para cosecha segura"
                          />
                          <p className="text-[8px] text-slate-500 italic">Este valor bloqueará cosechas en este lote hasta el vencimiento del PC.</p>
                      </div>
                  )}

                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-blue-500 uppercase ml-2 flex items-center gap-1"><UserCheck className="w-3 h-3"/> Operario / Aplicador</label>
                      <select value={selectedPersonnelId} onChange={e => setSelectedPersonnelId(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-4 text-slate-800 dark:text-white font-bold text-sm">
                          <option value="">Sin Responsable</option>
                          {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>
              </div>
          )}

          {!isOut && (
              <div className="space-y-1">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Precio Unitario Factura</label>
                  <input type="number" value={manualUnitPrice} onChange={e => setManualUnitPrice(e.target.value)} className="w-full bg-slate-50 dark:bg-slate-900 border rounded-xl p-4 text-emerald-600 font-mono font-black" placeholder="0" />
              </div>
          )}

          {error && <div className="bg-red-900/20 border border-red-500/50 p-3 rounded-xl text-red-400 text-[10px] font-bold flex items-center gap-2 uppercase animate-shake"><AlertTriangle className="w-4 h-4" /> {error}</div>}

          <div className="bg-indigo-900/10 rounded-2xl p-5 border border-indigo-500/20">
            <div className="flex justify-between items-center mb-1"><span className="text-slate-400 text-[10px] font-black uppercase">Valorización del Movimiento</span></div>
            <div className="flex items-center gap-3"><span className="text-lg font-mono font-black text-white">{formatCurrency(previewCost)}</span></div>
          </div>

          <button type="submit" disabled={!!error || !quantity} className={`w-full py-4 rounded-2xl font-black text-white text-sm shadow-xl transition-all active:scale-95 ${isOut ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'} disabled:opacity-50`}>
            {isOut ? 'REGISTRAR APLICACIÓN' : 'REGISTRAR COMPRA'}
          </button>
        </form>
      </div>
    </div>
  );
};
