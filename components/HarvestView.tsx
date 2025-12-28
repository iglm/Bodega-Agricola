
import React, { useState } from 'react';
import { HarvestLog, CostCenter } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { Sprout, Plus, MapPin, DollarSign, Calendar, X, Save, TrendingUp } from 'lucide-react';

interface HarvestViewProps {
  harvests: HarvestLog[];
  costCenters: CostCenter[];
  onAddHarvest: (h: Omit<HarvestLog, 'id'>) => void;
  onDeleteHarvest: (id: string) => void;
  isAdmin: boolean;
}

export const HarvestView: React.FC<HarvestViewProps> = ({ harvests, costCenters, onAddHarvest, onDeleteHarvest, isAdmin }) => {
  const [showForm, setShowForm] = useState(false);
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [costCenterId, setCostCenterId] = useState('');
  const [cropName, setCropName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [unit, setUnit] = useState('Kg');
  const [totalValue, setTotalValue] = useState('');
  const [notes, setNotes] = useState('');

  const totalRevenue = harvests.reduce((acc, h) => acc + h.totalValue, 0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const lot = costCenters.find(c => c.id === costCenterId);
    if (!lot) return;

    onAddHarvest({
        date,
        costCenterId,
        costCenterName: lot.name,
        cropName,
        quantity: parseFloat(quantity),
        unit,
        totalValue: parseFloat(totalValue),
        notes: notes.trim()
    });
    setShowForm(false);
    // Reset
    setQuantity(''); setTotalValue(''); setNotes('');
  };

  return (
    <div className="space-y-6 pb-20">
        
        {/* Header Summary */}
        <div className="bg-gradient-to-r from-yellow-500 to-amber-500 rounded-2xl p-6 text-white shadow-xl shadow-yellow-900/20">
            <div className="flex justify-between items-start mb-4">
                <div>
                    <h2 className="text-2xl font-bold flex items-center gap-2">
                        <Sprout className="w-6 h-6 text-yellow-100" />
                        Producción
                    </h2>
                    <p className="text-yellow-100 text-sm mt-1">Registro de Cosechas e Ingresos</p>
                </div>
                <div className="text-right">
                    <p className="text-yellow-100 text-xs font-bold uppercase">Ingreso Total</p>
                    {isAdmin ? (
                        <p className="text-3xl font-bold font-mono mt-1">{formatCurrency(totalRevenue)}</p>
                    ) : (
                        <p className="text-2xl font-bold font-mono blur-sm">$ 0.000.000</p>
                    )}
                </div>
            </div>
            <button 
                onClick={() => isAdmin ? setShowForm(true) : alert('Requiere acceso administrativo')}
                className="w-full bg-white text-yellow-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-yellow-50 transition-colors shadow-lg"
            >
                <Plus className="w-5 h-5" />
                Registrar Cosecha
            </button>
        </div>

        {/* Harvest List */}
        <div className="space-y-4">
            <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-yellow-500" />
                Historial de Recolección
            </h3>
            
            {harvests.length === 0 ? (
                <div className="text-center py-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                    <Sprout className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                    <p className="text-slate-500 dark:text-slate-400">No hay cosechas registradas.</p>
                </div>
            ) : (
                harvests.slice().reverse().map(h => (
                    <div key={h.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                        <div className="flex justify-between items-start">
                            <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                <Calendar className="w-3 h-3" />
                                {new Date(h.date).toLocaleDateString()}
                            </div>
                            <span className="font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded text-sm">
                                + {formatCurrency(h.totalValue)}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                             <div>
                                <h4 className="font-bold text-slate-800 dark:text-white text-lg">{h.cropName}</h4>
                                <div className="flex items-center gap-2 text-xs text-slate-500">
                                    <MapPin className="w-3 h-3 text-purple-500" />
                                    {h.costCenterName}
                                </div>
                             </div>
                             <div className="text-right">
                                 <span className="block font-bold text-slate-700 dark:text-slate-300 text-lg">
                                     {h.quantity} <span className="text-xs font-normal">{h.unit}</span>
                                 </span>
                             </div>
                        </div>
                        {isAdmin && (
                            <div className="border-t border-slate-100 dark:border-slate-700 pt-2 mt-1 text-right">
                                <button onClick={() => onDeleteHarvest(h.id)} className="text-xs text-red-400 underline">Eliminar</button>
                            </div>
                        )}
                    </div>
                ))
            )}
        </div>

        {/* Modal Form */}
        {showForm && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                <div className="bg-slate-800 w-full max-w-md rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
                    <div className="bg-yellow-600/20 p-4 border-b border-yellow-600/30 flex justify-between items-center">
                        <h3 className="text-yellow-500 font-bold flex items-center gap-2">
                            <Sprout className="w-5 h-5" /> Nueva Cosecha
                        </h3>
                        <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-white">
                            <X className="w-6 h-6" />
                        </button>
                    </div>
                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Lote / Origen</label>
                            <select 
                                value={costCenterId}
                                onChange={e => setCostCenterId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none"
                                required
                            >
                                <option value="">Seleccionar Lote...</option>
                                {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cultivo / Producto</label>
                            <input 
                                type="text" 
                                value={cropName}
                                onChange={e => setCropName(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none"
                                placeholder="Ej: Café Pergamino Seco"
                                required
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Cantidad</label>
                                <input 
                                    type="number" 
                                    value={quantity}
                                    onChange={e => setQuantity(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none"
                                    placeholder="0"
                                    required
                                />
                            </div>
                            <div>
                                <label className="text-xs font-bold text-slate-400 uppercase mb-1 block">Unidad</label>
                                <select 
                                    value={unit}
                                    onChange={e => setUnit(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-600 rounded-lg p-3 text-white outline-none"
                                >
                                    <option>Kg</option>
                                    <option>Arrobas</option>
                                    <option>Toneladas</option>
                                    <option>Bultos</option>
                                    <option>Canastillas</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="text-xs font-bold text-emerald-400 uppercase mb-1 flex items-center gap-1">
                                <DollarSign className="w-3 h-3" /> Valor Total Venta (COP)
                            </label>
                            <input 
                                type="number" 
                                value={totalValue}
                                onChange={e => setTotalValue(e.target.value)}
                                className="w-full bg-slate-900 border border-emerald-500/50 rounded-lg p-3 text-white outline-none font-mono text-lg"
                                placeholder="0"
                                required
                            />
                        </div>
                        <button type="submit" className="w-full bg-yellow-600 hover:bg-yellow-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-2">
                            <Save className="w-5 h-5" /> Guardar Cosecha
                        </button>
                    </form>
                </div>
            </div>
        )}
    </div>
  );
};
