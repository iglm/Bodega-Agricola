
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { InventoryItem, Unit, Movement, Supplier, CostCenter, Personnel, Machine, Category } from '../types';
import { getBaseUnitType, convertToBase, formatBaseQuantity, formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { X, TrendingUp, TrendingDown, DollarSign, FileText, AlertTriangle, Users, MapPin, Image as ImageIcon, Tag, UserCheck, ShieldCheck, Calculator } from 'lucide-react';

interface MovementModalProps {
  item: InventoryItem;
  type: 'IN' | 'OUT';
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel?: Personnel[];
  movements?: Movement[];
  onSave: (movement: Omit<Movement, 'id' | 'date' | 'warehouseId'>, newUnitPrice?: number, newExpirationDate?: string) => void;
  onCancel: () => void;
}

export const MovementModal: React.FC<MovementModalProps> = ({ 
  item, type, suppliers, costCenters, personnel = [],
  onSave, onCancel
}) => {
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState<Unit>(item.lastPurchaseUnit);
  const [manualUnitPrice, setManualUnitPrice] = useState<string>(formatNumberInput(item.lastPurchasePrice));
  const [notes, setNotes] = useState('');
  const [expirationDate, setExpirationDate] = useState<string>(item.expirationDate || '');
  const [selectedSupplierId, setSelectedSupplierId] = useState('');
  const [selectedPersonnelId, setSelectedPersonnelId] = useState('');
  const [selectedCostCenterId, setSelectedCostCenterId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const isOut = type === 'OUT';
  const baseType = getBaseUnitType(item.lastPurchaseUnit);

  const compatibleUnits = useMemo(() => 
    Object.values(Unit).filter(u => getBaseUnitType(u) === baseType), 
  [baseType]);

  useEffect(() => {
    if (!compatibleUnits.includes(unit)) {
      if (baseType === 'g') setUnit(Unit.KILO);
      else if (baseType === 'ml') setUnit(Unit.LITRO);
      else setUnit(Unit.UNIDAD);
    }
  }, [compatibleUnits, baseType]);

  const mathPreview = useMemo(() => {
    const qtyNum = parseNumberInput(quantity);
    const priceNum = parseNumberInput(manualUnitPrice);
    if (qtyNum <= 0) return { total: 0, costPerBase: 0 };

    if (isOut) {
        const baseAmount = convertToBase(qtyNum, unit);
        return { total: baseAmount * item.averageCost, costPerBase: item.averageCost };
    } else {
        const total = qtyNum * priceNum;
        const baseQty = convertToBase(qtyNum, unit);
        return { total, costPerBase: total / baseQty };
    }
  }, [quantity, unit, manualUnitPrice, isOut, item.averageCost]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyInput = parseNumberInput(quantity);
    const priceInput = parseNumberInput(manualUnitPrice);
    
    if (qtyInput <= 0) return;

    if (isOut) {
        const reqBaseQty = convertToBase(qtyInput, unit);
        if (reqBaseQty > (item.currentQuantity + 0.0001)) {
            setError(`Stock insuficiente. Máx: ${formatBaseQuantity(item.currentQuantity, item.baseUnit)}`);
            return;
        }
    }

    const supplierName = suppliers.find(s => s.id === selectedSupplierId)?.name;
    const costCenterName = costCenters.find(c => c.id === selectedCostCenterId)?.name;
    const personnelName = personnel.find(p => p.id === selectedPersonnelId)?.name;

    onSave({
      itemId: item.id, itemName: item.name, type, quantity: qtyInput, unit, calculatedCost: mathPreview.total,
      notes: notes.trim(), supplierId: selectedSupplierId || undefined, supplierName,
      costCenterId: isOut ? selectedCostCenterId : undefined, costCenterName: isOut ? costCenterName : undefined,
      personnelId: selectedPersonnelId || undefined, personnelName
    }, !isOut ? priceInput : undefined, !isOut ? expirationDate : undefined);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/90 backdrop-blur-md flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-slate-900 w-full max-w-md rounded-[2.5rem] border border-slate-800 shadow-2xl overflow-hidden animate-slide-up max-h-[95vh] flex flex-col">
        
        <div className={`p-6 border-b border-slate-800 flex justify-between items-center ${isOut ? 'bg-red-950/20' : 'bg-emerald-950/20'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl ${isOut ? 'bg-red-600' : 'bg-emerald-600'} text-white shadow-lg`}>
                {isOut ? <TrendingDown className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
            </div>
            <div>
                <h3 className="text-white font-black text-xl">{isOut ? 'Salida de Bodega' : 'Nueva Compra'}</h3>
                <p className="text-[10px] text-slate-400 uppercase font-black tracking-widest">{item.name}</p>
            </div>
          </div>
          <button onClick={onCancel} className="text-slate-500 hover:text-white p-2 hover:bg-slate-800 rounded-full transition-all"><X className="w-6 h-6" /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto custom-scrollbar">
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Cantidad</label>
              <input 
                type="text" 
                inputMode="decimal"
                value={quantity} 
                onChange={e => setQuantity(formatNumberInput(e.target.value))} 
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-mono font-black text-lg outline-none focus:ring-2 focus:ring-indigo-500" 
                placeholder="0" 
                required 
                autoFocus 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Unidad</label>
              <select value={unit} onChange={e => setUnit(e.target.value as Unit)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-black text-xs h-[58px]">
                {compatibleUnits.map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>

          {!isOut ? (
              <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Precio por {unit}</label>
                    <input 
                        type="text" 
                        inputMode="decimal"
                        value={manualUnitPrice} 
                        onChange={e => setManualUnitPrice(formatNumberInput(e.target.value))} 
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-emerald-500 font-mono font-black text-lg outline-none focus:ring-2 focus:ring-emerald-500" 
                        placeholder="0" 
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><Users className="w-3 h-3"/> Proveedor</label>
                    <select value={selectedSupplierId} onChange={e => setSelectedSupplierId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold text-xs">
                        <option value="">Seleccionar Proveedor...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                  </div>
              </div>
          ) : (
              <div className="space-y-4">
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><MapPin className="w-3 h-3"/> Destino / Lote</label>
                      <select value={selectedCostCenterId} onChange={e => setSelectedCostCenterId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold text-xs" required>
                          <option value="">¿A qué lote va?</option>
                          {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                  </div>
                  <div className="space-y-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><UserCheck className="w-3 h-3"/> Aplicador / Responsable</label>
                      <select value={selectedPersonnelId} onChange={e => setSelectedPersonnelId(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-white font-bold text-xs">
                          <option value="">¿Quién lo retira?</option>
                          {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                      </select>
                  </div>
              </div>
          )}

          {error && <div className="bg-red-900/40 border border-red-500 p-3 rounded-xl text-red-200 text-[10px] font-black uppercase flex items-center gap-2 animate-shake"><AlertTriangle className="w-4 h-4" /> {error}</div>}

          <div className="bg-indigo-950/40 rounded-3xl p-5 border border-indigo-500/20 space-y-4">
             <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest flex items-center gap-2"><Calculator className="w-4 h-4" /> Desglose Matemático</span>
                <span className="bg-indigo-500 text-white text-[8px] font-black px-2 py-1 rounded-full uppercase">Pre-Visualización</span>
             </div>
             
             <div className="flex justify-between items-end">
                <div>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Costo Total del Movimiento</p>
                    <p className="text-2xl font-mono font-black text-white">{formatCurrency(mathPreview.total)}</p>
                </div>
                <div className="text-right">
                    <p className="text-[9px] text-slate-500 font-bold uppercase">Valor por {baseType === 'g' ? 'Gramo' : 'ml'}</p>
                    <p className="text-sm font-mono font-black text-indigo-400">{formatCurrency(mathPreview.costPerBase, 2)}</p>
                </div>
             </div>
          </div>

          <button type="submit" disabled={!!error || !quantity} className={`w-full py-5 rounded-[2rem] font-black text-white text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 ${isOut ? 'bg-red-600 hover:bg-red-500' : 'bg-emerald-600 hover:bg-emerald-500'} disabled:opacity-50 disabled:bg-slate-800`}>
            {isOut ? 'CONFIRMAR SALIDA DE BODEGA' : 'REGISTRAR COMPRA Y AJUSTAR CPP'}
          </button>
        </form>
      </div>
    </div>
  );
};
