
import React, { useState, useMemo } from 'react';
import { HarvestLog, CostCenter, Movement } from '../types';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
// Added Gauge to the import list to fix the "Cannot find name 'Gauge'" error
import { Sprout, Plus, Target, AlertTriangle, ShieldX, Clock, ShieldCheck, Info, Users, BarChart3, Scissors, Bug, Trash2, AlertCircle, MapPin, Calendar, DollarSign, Calculator, Percent, TrendingDown, Gauge } from 'lucide-react';
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
  const [showQualityTool, setShowQualityTool] = useState(false);
  
  // Form States
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [costCenterId, setCostCenterId] = useState('');
  const [totalValue, setTotalValue] = useState('');
  const [yieldFactor, setYieldFactor] = useState('');
  const [collectorsCount, setCollectorsCount] = useState('1');
  const [greenPct, setGreenPct] = useState('0');
  const [pestPct, setPestPct] = useState('0');
  const [qty1, setQty1] = useState(''); 
  const [qty2, setQty2] = useState(''); 
  const [qty3, setQty3] = useState(''); 

  // Quality Audit Tool States
  const [sampleTotal, setSampleTotal] = useState('100');
  const [sampleBroca, setSampleBroca] = useState('0');
  const [potentialPrice, setPotentialPrice] = useState('1850000');

  const qualityAnalysis = useMemo(() => {
      const broca = parseFloat(pestPct) || 0;
      const factor = parseFloat(yieldFactor) || 94;
      const totalKgs = parseNumberInput(qty1) + parseNumberInput(qty2) + parseNumberInput(qty3);
      
      // Lucro Cesante Estimado (Basado en castigo de precio ~1% por cada % de broca > 2%)
      const pricePerKg = parseNumberInput(totalValue) / (totalKgs || 1);
      const lossPerKg = broca > 2 ? pricePerKg * ((broca - 2) / 100) : 0;
      const totalLoss = totalKgs * lossPerKg;

      return { totalLoss, factorAlert: factor > 94 };
  }, [pestPct, yieldFactor, qty1, qty2, qty3, totalValue]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selectedLot = costCenters.find(c => c.id === costCenterId);
    if (!selectedLot) return;
    
    const vQty1 = parseNumberInput(qty1);
    const vQty2 = parseNumberInput(qty2);
    const vQty3 = parseNumberInput(qty3);
    const totalQty = vQty1 + vQty2 + vQty3;

    onAddHarvest({ 
        date, costCenterId, costCenterName: selectedLot.name, cropName: 'Café CPS', 
        quantity: totalQty, unit: 'Kg', totalValue: parseNumberInput(totalValue),
        quality1Qty: vQty1 || undefined, 
        quality2Qty: vQty2 || undefined, 
        wasteQty: vQty3 || undefined,
        yieldFactor: parseNumberInput(yieldFactor) || undefined,
        collectorsCount: parseInt(collectorsCount) || undefined,
        greenPercentage: parseFloat(greenPct) || 0,
        pestPercentage: parseFloat(pestPct) || 0,
        brocaLossValue: qualityAnalysis.totalLoss
    });
    setShowForm(false);
  };

  return (
    <div className="space-y-6 pb-20">
        <HeaderCard 
            title="Producción y Calidad"
            subtitle="Auditoría de Cosecha"
            valueLabel="Valor Ventas"
            value={formatCurrency(harvests.reduce((a,b)=>a+b.totalValue, 0))}
            gradientClass="bg-gradient-to-r from-emerald-600 to-teal-700"
            icon={Target}
            onAction={() => setShowForm(true)}
            actionLabel="Registrar Venta"
            actionIcon={Plus}
            secondaryAction={
                <button onClick={() => setShowQualityTool(true)} className="p-4 bg-white/20 rounded-xl text-white backdrop-blur-md">
                    <Calculator className="w-5 h-5" />
                </button>
            }
        />

        {/* ANALÍTICA DE CALIDAD ACUMULADA */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-red-950/20 p-6 rounded-[2.5rem] border border-red-500/20 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">Lucro Cesante x Broca</p>
                    <p className="text-2xl font-mono font-black text-white">{formatCurrency(harvests.reduce((a,b)=>a+(b.brocaLossValue || 0), 0))}</p>
                    <p className="text-[8px] text-slate-500 font-bold mt-1">DINERO PERDIDO POR CALIDAD</p>
                </div>
                <Bug className="w-10 h-10 text-red-500 opacity-20" />
            </div>
            <div className="bg-indigo-950/20 p-6 rounded-[2.5rem] border border-indigo-500/20 flex items-center justify-between">
                <div>
                    <p className="text-[10px] text-indigo-400 font-black uppercase tracking-widest mb-1">Rendimiento Promedio</p>
                    <p className="text-2xl font-mono font-black text-white">{harvests.length > 0 ? (harvests.reduce((a,b)=>a+(b.yieldFactor || 94), 0) / harvests.length).toFixed(1) : '94.0'}</p>
                    <p className="text-[8px] text-slate-500 font-bold mt-1">FACTOR CPS A EXCELSO</p>
                </div>
                {/* Gauge icon is now imported correctly */}
                <Gauge className="w-10 h-10 text-indigo-500 opacity-20" />
            </div>
        </div>

        <div className="space-y-4">
            {harvests.length === 0 ? (
                <EmptyState icon={Sprout} message="No hay registros de cosecha." />
            ) : (
                harvests.slice().reverse().map(h => (
                    <div key={h.id} className="bg-white dark:bg-slate-800 p-5 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm relative group">
                        <div className="flex justify-between items-center">
                            <div>
                                <h4 className="font-black text-slate-800 dark:text-white text-base">{h.costCenterName} • {h.date}</h4>
                                <div className="flex items-center gap-2 mt-1">
                                    <span className="text-[10px] text-emerald-600 font-bold uppercase">{h.quantity} {h.unit}</span>
                                    {h.yieldFactor && <span className={`text-[9px] px-2 py-0.5 rounded-full font-black ${h.yieldFactor > 94 ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>FACTOR: {h.yieldFactor}</span>}
                                </div>
                            </div>
                            <p className="text-emerald-600 font-black text-sm">{formatCurrency(h.totalValue)}</p>
                        </div>
                        {h.brocaLossValue! > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 flex items-center gap-2">
                                <AlertTriangle className="w-3 h-3 text-red-500" />
                                <span className="text-[9px] text-red-400 font-black uppercase">Pérdida por Broca: {formatCurrency(h.brocaLossValue || 0)}</span>
                            </div>
                        )}
                        {isAdmin && <button onClick={() => onDeleteHarvest(h.id)} className="absolute right-4 top-1/2 -translate-y-1/2 p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"><Trash2 className="w-4 h-4"/></button>}
                    </div>
                ))
            )}
        </div>

        {/* MODAL REGISTRO VENTA */}
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Venta y Auditoría Física" icon={Target} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Lote Origen</label>
                        <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xs font-bold" required>
                            <option value="">Lote...</option>
                            {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Fecha</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-xs font-bold" required />
                    </div>
                </div>

                <div className="bg-slate-950/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                    <h5 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest text-center">Calidad Física del Lote</h5>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 text-center">
                            <label className="text-[8px] font-black text-slate-500 uppercase">Factor Rendimiento</label>
                            <input type="number" step="0.1" value={yieldFactor} onChange={e => setYieldFactor(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-center font-mono font-bold" placeholder="94" />
                        </div>
                        <div className="space-y-1 text-center">
                            <label className="text-[8px] font-black text-red-500 uppercase">% Broca</label>
                            <input type="number" step="0.1" value={pestPct} onChange={e => setPestPct(e.target.value)} className="w-full bg-slate-900 border border-red-500/20 rounded-xl p-3 text-red-400 text-center font-mono font-bold" />
                        </div>
                        <div className="space-y-1 text-center">
                            <label className="text-[8px] font-black text-emerald-500 uppercase">Recolectores</label>
                            <input type="number" value={collectorsCount} onChange={e => setCollectorsCount(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-emerald-400 text-center font-mono font-bold" />
                        </div>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-black text-emerald-500 uppercase ml-2">Valor de la Venta Bruta</label>
                    <input type="text" inputMode="decimal" value={formatNumberInput(totalValue)} onChange={e => setTotalValue(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border border-emerald-500/30 rounded-2xl p-6 text-emerald-500 text-4xl font-black font-mono outline-none" placeholder="$ 0" required />
                </div>

                <div className="p-4 bg-red-900/10 rounded-2xl border border-red-500/20 flex items-center justify-between">
                    <span className="text-[10px] text-slate-500 font-black uppercase">Castigo por Broca Estimado:</span>
                    <span className="text-sm font-black text-red-500 font-mono">{formatCurrency(qualityAnalysis.totalLoss)}</span>
                </div>

                <button type="submit" className="w-full py-5 rounded-[2rem] bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all">REGISTRAR VENTA Y CALIDAD</button>
            </form>
        </Modal>

        {/* MODAL CALCULADORA LUCRO CESANTE */}
        <Modal isOpen={showQualityTool} onClose={() => setShowQualityTool(false)} title="Audit de Lucro Cesante" icon={Bug}>
            <div className="space-y-6">
                <p className="text-xs text-slate-400 italic">Mida cuánto dinero deja de ganar por cada punto porcentual de infestación de Broca.</p>
                <div className="space-y-4">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase">Precio Mercado (Carga)</label>
                        <input type="text" value={formatNumberInput(potentialPrice)} onChange={e => setPotentialPrice(parseNumberInput(e.target.value).toString())} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white font-mono" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Gramos Brocados</label>
                            <input type="number" value={sampleBroca} onChange={e => setSampleBroca(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-center" />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-black text-slate-500 uppercase">Muestra Total (g)</label>
                            <input type="number" value={sampleTotal} onChange={e => setSampleTotal(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-center" />
                        </div>
                    </div>
                </div>

                <div className="bg-red-950/40 p-6 rounded-3xl border border-red-500/30 text-center space-y-2">
                    <p className="text-[10px] text-red-400 font-black uppercase tracking-widest">Impacto en Precio</p>
                    <p className="text-3xl font-black text-white font-mono">-{((parseFloat(sampleBroca)/parseFloat(sampleTotal || '1'))*100).toFixed(1)}%</p>
                    <p className="text-[9px] text-slate-400 leading-tight">Usted pierde aproximadamente <span className="text-white">{formatCurrency(parseNumberInput(potentialPrice) * (parseFloat(sampleBroca)/parseFloat(sampleTotal || '1')))}</span> por cada carga vendida con esta infestación.</p>
                </div>

                <div className="bg-indigo-900/10 p-4 rounded-2xl border border-indigo-500/20 text-[10px] text-slate-400 italic">
                    "Referente Cenicafé: Un castigo del 5% en calidad es equivalente a perder el fertilizante de un año entero."
                </div>
            </div>
        </Modal>
    </div>
  );
};
