
import React, { useState, useMemo } from 'react';
import { HarvestLog, CostCenter, Movement } from '../types';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { Sprout, Plus, Target, AlertTriangle, ShieldX, Clock, ShieldCheck, Info } from 'lucide-react';
import { HeaderCard, EmptyState, Modal } from './UIElements';

interface HarvestViewProps {
  harvests: HarvestLog[];
  costCenters: CostCenter[];
  onAddHarvest: (h: Omit<HarvestLog, 'id' | 'warehouseId'>) => void;
  onDeleteHarvest: (id: string) => void;
  isAdmin: boolean;
  allMovements?: Movement[];
}

export const HarvestView: React.FC<HarvestViewProps> = ({ 
    harvests, costCenters, onAddHarvest, onDeleteHarvest, isAdmin, allMovements = []
}) => {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [costCenterId, setCostCenterId] = useState('');
  const [cropName, setCropName] = useState('Café Pergamino Seco');
  const [unit, setUnit] = useState('Kg');
  const [totalValue, setTotalValue] = useState('');
  const [notes, setNotes] = useState('');
  const [yieldFactor, setYieldFactor] = useState('');

  const [qty1, setQty1] = useState(''); 
  const [qty2, setQty2] = useState(''); 
  const [qty3, setQty3] = useState(''); 

  const safetyRadar = useMemo(() => {
      if (!costCenterId) return null;
      
      const lotMovements = allMovements.filter(m => m.costCenterId === costCenterId && m.type === 'OUT');
      
      const violations = lotMovements.filter(m => m.phiApplied && m.phiApplied > 0).map(m => {
          const appDate = new Date(m.date);
          const safeDate = new Date(appDate);
          safeDate.setDate(safeDate.getDate() + (m.phiApplied || 0));
          
          const harvestDateRequested = new Date(date);
          const timeDiff = safeDate.getTime() - harvestDateRequested.getTime();
          const daysToWait = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
          
          return {
              product: m.itemName,
              applied: m.date.split('T')[0],
              phi: m.phiApplied,
              safeDate: safeDate.toISOString().split('T')[0],
              daysToWait,
              isViolated: daysToWait > 0
          };
      }).filter(v => v.isViolated);

      return violations;
  }, [costCenterId, allMovements, date]);

  const selectedLot = useMemo(() => costCenters.find(c => c.id === costCenterId), [costCenterId, costCenters]);
  
  const vQty1 = parseNumberInput(qty1);
  const vQty2 = parseNumberInput(qty2);
  const vQty3 = parseNumberInput(qty3);
  const totalQty = vQty1 + vQty2 + vQty3;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot || totalQty <= 0) return;
    
    if (safetyRadar && safetyRadar.length > 0) {
        if (!confirm(`⚠️ BLOQUEO SANITARIO CRÍTICO ⚠️\n\nEl lote "${selectedLot.name}" tiene periodos de carencia activos. Cosechar ahora viola la Res. ICA 082394 y pone en riesgo la salud del consumidor.\n\n¿Desea registrar esta cosecha bajo su responsabilidad legal?`)) {
            return;
        }
    }
    
    onAddHarvest({ 
        date, costCenterId, costCenterName: selectedLot.name, cropName, 
        quantity: totalQty, unit, totalValue: parseNumberInput(totalValue), notes: notes.trim(),
        quality1Qty: vQty1 || undefined, 
        quality2Qty: vQty2 || undefined, 
        wasteQty: vQty3 || undefined,
        yieldFactor: parseNumberInput(yieldFactor) || undefined
    });
    setShowForm(false);
    setQty1(''); setQty2(''); setQty3(''); setTotalValue(''); setYieldFactor('');
  };

  return (
    <div className="space-y-6 pb-20">
        <HeaderCard 
            title="Producción y Calidad"
            subtitle="Trazabilidad Cosecha"
            valueLabel="Ventas Totales"
            value={isAdmin ? formatCurrency(harvests.reduce((a,b)=>a+b.totalValue, 0)) : "$ 0.000.000"}
            gradientClass="bg-gradient-to-r from-emerald-600 to-teal-700"
            icon={Target}
            onAction={() => setShowForm(true)}
            actionLabel="Registrar Venta"
            actionIcon={Plus}
        />

        <div className="space-y-4">
            {harvests.length === 0 ? (
                <EmptyState icon={Sprout} message="No hay registros de cosecha." />
            ) : (
                harvests.slice().reverse().map(h => (
                    <div key={h.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm flex justify-between items-center">
                        <div>
                            <h4 className="font-black text-slate-800 dark:text-white text-base">{h.cropName}</h4>
                            <p className="text-[10px] text-slate-500 font-bold uppercase">{h.costCenterName} • {h.date}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-emerald-600 font-black text-sm">{formatCurrency(h.totalValue)}</p>
                            <p className="text-[10px] text-slate-400 font-bold">{h.quantity} {h.unit}</p>
                        </div>
                    </div>
                ))
            )}
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Nueva Cosecha" icon={Target}>
            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Lote Origen</label>
                    <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white text-xs font-bold" required>
                        <option value="">Seleccionar Lote...</option>
                        {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {safetyRadar && safetyRadar.length > 0 && (
                    <div className="bg-red-950/40 border-2 border-red-500 p-5 rounded-[2.5rem] space-y-3 animate-shake">
                        <div className="flex items-center gap-2 text-red-500">
                            <ShieldX className="w-6 h-6 shrink-0" />
                            <div>
                                <h5 className="font-black text-xs uppercase tracking-tight">Periodo de Carencia Activo</h5>
                                <p className="text-[8px] text-red-300 font-bold uppercase">Riesgo de Trazas Químicas</p>
                            </div>
                        </div>
                        <div className="space-y-2">
                            {safetyRadar.map(v => (
                                <div key={v.product} className="flex justify-between items-center bg-red-900/40 p-3 rounded-xl border border-red-500/20">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] text-white font-black uppercase">{v.product}</span>
                                        <span className="text-[8px] text-red-400 font-bold">Aplicación: {v.applied}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-sm font-black text-white">{v.daysToWait} días</span>
                                        <p className="text-[8px] text-red-400 font-bold uppercase">Faltantes</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex items-start gap-2 p-2 bg-red-600/10 rounded-lg">
                            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                            <p className="text-[9px] text-slate-300 leading-tight italic">
                                La normativa exige respetar el PC para garantizar la inocuidad. Esta acción generará una bandera roja en su auditoría BPA.
                            </p>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Fecha de Recolección</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white text-xs font-bold" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Producto</label>
                        <input type="text" value={cropName} onChange={e => setCropName(e.target.value)} placeholder="Ej: Café Pergamino Seco" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white text-xs font-bold" required />
                    </div>
                </div>

                <div className="bg-slate-900/50 p-5 rounded-[2.5rem] border border-slate-700 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase text-center tracking-widest flex items-center justify-center gap-2">
                        <ShieldCheck className="w-4 h-4 text-emerald-500" /> Trazabilidad y Calidad ({unit})
                    </h5>
                    <div className="grid grid-cols-3 gap-2">
                        <div className="space-y-1">
                            <label className="text-[8px] text-emerald-500 font-black uppercase text-center block">Pergamino (Exportación)</label>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={formatNumberInput(qty1)} 
                                onChange={e => setQty1(parseNumberInput(e.target.value).toString())} 
                                placeholder="0" 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-white font-black text-sm outline-none focus:ring-1 focus:ring-emerald-500" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] text-amber-500 font-black uppercase text-center block">Consumo (Nacional)</label>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={formatNumberInput(qty2)} 
                                onChange={e => setQty2(parseNumberInput(e.target.value).toString())} 
                                placeholder="0" 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-white font-black text-sm outline-none focus:ring-1 focus:ring-amber-500" 
                            />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] text-red-500 font-black uppercase text-center block">Pasilla (Subproducto)</label>
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={formatNumberInput(qty3)} 
                                onChange={e => setQty3(parseNumberInput(e.target.value).toString())} 
                                placeholder="0" 
                                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-center text-white font-black text-sm outline-none focus:ring-1 focus:ring-red-500" 
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-emerald-500 uppercase ml-2">Precio Total Venta</label>
                        <input 
                            type="text" 
                            inputMode="decimal"
                            value={formatNumberInput(totalValue)} 
                            onChange={e => setTotalValue(parseNumberInput(e.target.value).toString())} 
                            placeholder="$ 0" 
                            className="w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-4 text-emerald-500 font-mono font-black text-lg outline-none" 
                            required 
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Factor Rendimiento</label>
                        <input 
                            type="text" 
                            inputMode="decimal"
                            value={formatNumberInput(yieldFactor)} 
                            onChange={e => setYieldFactor(parseNumberInput(e.target.value).toString())} 
                            placeholder="Ej: 94" 
                            className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-mono font-black text-lg outline-none" 
                        />
                        <p className="text-[9px] text-slate-500 px-2">Porcentaje de almendra sana.</p>
                    </div>
                </div>

                <button 
                    type="submit" 
                    className={`w-full py-5 rounded-[2rem] font-black text-xs uppercase tracking-widest transition-all shadow-xl active:scale-95 ${safetyRadar && safetyRadar.length > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-emerald-600 text-white'}`}
                >
                    {safetyRadar && safetyRadar.length > 0 ? 'COSECHAR CON RIESGO SANITARIO' : 'CONFIRMAR COSECHA SEGURA'}
                </button>
            </form>
        </Modal>
    </div>
  );
};
