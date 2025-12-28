
import React, { useState, useMemo } from 'react';
import { HarvestLog, CostCenter, Movement, LaborLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { Sprout, Plus, MapPin, DollarSign, Calendar, TrendingUp, AlertCircle, Info, Save } from 'lucide-react';
import { HeaderCard, EmptyState, Modal, InfoRow } from './UIElements';

interface HarvestViewProps {
  harvests: HarvestLog[];
  costCenters: CostCenter[];
  onAddHarvest: (h: Omit<HarvestLog, 'id'>) => void;
  onDeleteHarvest: (id: string) => void;
  isAdmin: boolean;
  allMovements?: Movement[];
  allLaborLogs?: LaborLog[];
}

export const HarvestView: React.FC<HarvestViewProps> = ({ 
    harvests, costCenters, onAddHarvest, onDeleteHarvest, isAdmin, allMovements = [], allLaborLogs = []
}) => {
  const [showForm, setShowForm] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [costCenterId, setCostCenterId] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Kg');
  const [totalValue, setTotalValue] = useState('');
  const [notes, setNotes] = useState('');

  const selectedLot = useMemo(() => costCenters.find(c => c.id === costCenterId), [costCenterId, costCenters]);
  const isLevante = selectedLot?.stage === 'Levante';

  const selectedLotInvestment = useMemo(() => {
      if (!costCenterId) return null;
      const inputCost = allMovements.filter(m => m.costCenterId === costCenterId && m.type === 'OUT').reduce((sum, m) => sum + m.calculatedCost, 0);
      const laborCost = allLaborLogs.filter(l => l.costCenterId === costCenterId).reduce((sum, l) => sum + l.value, 0);
      const previousIncome = harvests.filter(h => h.costCenterId === costCenterId).reduce((sum, h) => sum + h.totalValue, 0);
      return { totalSpent: inputCost + laborCost, inputCost, laborCost, previousIncome };
  }, [costCenterId, allMovements, allLaborLogs, harvests]);

  const totalRevenue = harvests.reduce((acc, h) => acc + h.totalValue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLot) return;
    onAddHarvest({ date, costCenterId, costCenterName: selectedLot.name, cropName, quantity: parseFloat(quantity), unit, totalValue: parseFloat(totalValue), notes: notes.trim() });
    setShowForm(false);
    setQuantity(''); setTotalValue(''); setNotes(''); setCostCenterId('');
  };

  return (
    <div className="space-y-6 pb-20">
        <HeaderCard 
            title="Producción"
            subtitle="Registro de Cosechas e Ingresos"
            valueLabel="Ingreso Total"
            value={isAdmin ? formatCurrency(totalRevenue) : "$ 0.000.000"}
            gradientClass="bg-gradient-to-r from-yellow-500 to-amber-500 shadow-yellow-900/20"
            icon={Sprout}
            onAction={() => isAdmin ? setShowForm(true) : alert('Requiere acceso administrativo')}
            actionLabel="Registrar Cosecha"
            actionIcon={Plus}
            actionColorClass="text-yellow-700"
        />

        <div className="space-y-4">
            <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                Historial de Recolección
            </h3>
            
            {harvests.length === 0 ? (
                <EmptyState icon={Sprout} message="No hay cosechas registradas." />
            ) : (
                harvests.slice().reverse().map(h => (
                    <div key={h.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2 hover:shadow-md transition-all">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <Calendar className="w-3 h-3" />
                                {new Date(h.date).toLocaleDateString()}
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-sm border border-emerald-500/20">
                                + {formatCurrency(h.totalValue)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                             <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">{h.cropName}</h4>
                                <InfoRow icon={MapPin} text={h.costCenterName} iconColor="text-purple-500" />
                             </div>
                             <div className="text-right">
                                 <span className="block font-bold text-slate-700 dark:text-slate-300 text-lg">
                                     {h.quantity} <span className="text-xs font-normal opacity-70">{h.unit}</span>
                                 </span>
                             </div>
                        </div>
                        {isAdmin && (
                            <div className="border-t border-slate-100 dark:border-slate-700 pt-2 mt-1 text-right">
                                <button onClick={() => confirm('¿Eliminar cosecha?') && onDeleteHarvest(h.id)} className="text-xs text-red-400 underline decoration-dotted">Eliminar</button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>

        <Modal 
            isOpen={showForm} 
            onClose={() => setShowForm(false)} 
            title="Nueva Cosecha"
            icon={Sprout}
            iconColorClass="text-yellow-500"
            headerColorClass="bg-yellow-600/20"
        >
            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Lote / Origen</label>
                    <select 
                        value={costCenterId}
                        onChange={e => setCostCenterId(e.target.value)}
                        className={`w-full bg-slate-900 border rounded-lg p-3 text-white outline-none transition-colors ${isLevante ? 'border-amber-500 focus:border-amber-400' : 'border-slate-600 focus:border-yellow-500'}`}
                        required
                    >
                        <option value="">Seleccionar Lote...</option>
                        {costCenters.map(c => (
                            <option key={c.id} value={c.id} className={c.stage === 'Levante' ? 'text-amber-500 font-bold' : ''}>
                                {c.name} {c.stage === 'Levante' ? '⚠️ (EN LEVANTE)' : ''}
                            </option>
                        ))}
                    </select>
                </div>

                {isLevante && (
                    <div className="bg-amber-900/30 p-3 rounded-lg border border-amber-500/50 animate-pulse flex gap-3 items-center">
                        <AlertCircle className="w-6 h-6 text-amber-500 flex-shrink-0" />
                        <div className="text-[10px] text-amber-200 leading-tight">
                            <p className="font-bold text-amber-400 uppercase">Aviso: Lote en Levante</p>
                            <p>Las ventas se restarán del costo de inversión.</p>
                        </div>
                    </div>
                )}

                {selectedLotInvestment && (
                    <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 space-y-2">
                        <div className="flex items-center gap-2 text-[10px] font-bold text-slate-500 uppercase border-b border-slate-700 pb-1">
                            <Info className="w-3 h-3" /> Estado Financiero del Lote
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div><p className="text-slate-500 text-[10px]">Inversión</p><p className="text-red-400 font-mono font-bold">{formatCurrency(selectedLotInvestment.totalSpent)}</p></div>
                            <div className="text-right"><p className="text-slate-500 text-[10px]">Ventas</p><p className="text-emerald-400 font-mono font-bold">{formatCurrency(selectedLotInvestment.previousIncome)}</p></div>
                        </div>
                    </div>
                )}

                <div>
                    <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cultivo / Producto</label>
                    <input type="text" value={cropName} onChange={e => setCropName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-yellow-500" placeholder="Ej: Café Pergamino" required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cantidad</label>
                        <input type="number" value={quantity} onChange={e => setQuantity(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none focus:border-yellow-500" placeholder="0" required />
                    </div>
                    <div>
                        <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Unidad</label>
                        <select value={unit} onChange={e => setUnit(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none">
                            <option>Kg</option><option>Arrobas</option><option>Toneladas</option><option>Bultos</option><option>Canastillas</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="text-xs font-bold text-emerald-400 uppercase mb-1 flex items-center gap-1"><DollarSign className="w-3 h-3" /> Valor Total Venta (COP)</label>
                    <input type="number" value={totalValue} onChange={e => setTotalValue(e.target.value)} className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-3 text-white outline-none font-mono text-lg focus:ring-1 focus:ring-emerald-500" placeholder="0" required />
                </div>
                <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2 shadow-lg active:scale-95 transition-all">
                    <Save className="w-5 h-5" /> Guardar
                </button>
            </form>
        </Modal>
    </div>
  );
};
