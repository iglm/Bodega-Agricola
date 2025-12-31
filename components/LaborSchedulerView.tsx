
import React, { useState, useMemo, useEffect } from 'react';
import { PlannedLabor, CostCenter, Activity } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { CalendarRange, Plus, Calendar, Pickaxe, MapPin, Users, DollarSign, Calculator, Filter, CheckCircle2, Circle, Trash2, ArrowRight } from 'lucide-react';
import { HeaderCard, EmptyState, Modal } from './UIElements';

interface LaborSchedulerViewProps {
  plannedLabors: PlannedLabor[];
  costCenters: CostCenter[];
  activities: Activity[];
  onAddPlannedLabor: (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => void;
  onDeletePlannedLabor: (id: string) => void;
  onToggleComplete: (id: string) => void;
}

export const LaborSchedulerView: React.FC<LaborSchedulerViewProps> = ({
  plannedLabors,
  costCenters,
  activities,
  onAddPlannedLabor,
  onDeletePlannedLabor,
  onToggleComplete
}) => {
  const [showForm, setShowForm] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'all'>('all');
  
  // Form State
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityId, setActivityId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [targetArea, setTargetArea] = useState('');
  const [technicalYield, setTechnicalYield] = useState(''); // Ha / Jornal
  const [unitCost, setUnitCost] = useState('');
  const [efficiency, setEfficiency] = useState('100');
  
  // Derived Calculation for Form
  const projection = useMemo(() => {
      const area = parseFloat(targetArea) || 0;
      const performance = parseFloat(technicalYield) || 0; // Ha per Jornal
      const cost = parseFloat(unitCost) || 0;
      const eff = parseFloat(efficiency) || 100;
      
      if (area <= 0 || performance <= 0) return { jornales: 0, totalCost: 0, people: 0 };

      // Fórmula: Jornales = Area / (Rendimiento * (Eficiencia/100))
      const realPerformance = performance * (eff / 100);
      const totalJornales = area / realPerformance;
      const totalCost = totalJornales * cost;
      
      // Assume 1 day duration for people calculation initially
      const people = Math.ceil(totalJornales); 

      return { jornales: totalJornales, totalCost, people };
  }, [targetArea, technicalYield, unitCost, efficiency]);

  const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const activity = activities.find(a => a.id === activityId);
      const lot = costCenters.find(c => c.id === costCenterId);
      if (!activity || !lot) return;

      onAddPlannedLabor({
          date,
          activityId,
          activityName: activity.name,
          costCenterId,
          costCenterName: lot.name,
          targetArea: parseFloat(targetArea),
          technicalYield: parseFloat(technicalYield),
          unitCost: parseFloat(unitCost),
          efficiency: parseFloat(efficiency),
          calculatedPersonDays: projection.jornales,
          calculatedTotalCost: projection.totalCost
      });
      setShowForm(false);
      // Reset sensitive fields
      setTargetArea('');
      setTechnicalYield('');
  };

  // Filter Logic
  const filteredLabors = useMemo(() => {
      const today = new Date();
      today.setHours(0,0,0,0);
      
      return plannedLabors.filter(l => {
          const lDate = new Date(l.date);
          lDate.setHours(0,0,0,0);
          
          if (filterPeriod === 'day') return lDate.getTime() === today.getTime();
          if (filterPeriod === 'week') {
              const nextWeek = new Date(today);
              nextWeek.setDate(today.getDate() + 7);
              return lDate >= today && lDate <= nextWeek;
          }
          if (filterPeriod === 'month') return lDate.getMonth() === today.getMonth() && lDate.getFullYear() === today.getFullYear();
          return true;
      }).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [plannedLabors, filterPeriod]);

  // Totals
  const totals = useMemo(() => {
      return filteredLabors.reduce((acc, l) => ({
          hectares: acc.hectares + l.targetArea,
          jornales: acc.jornales + l.calculatedPersonDays,
          cost: acc.cost + l.calculatedTotalCost
      }), { hectares: 0, jornales: 0, cost: 0 });
  }, [filteredLabors]);

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <HeaderCard 
            title="Programador de Labores"
            subtitle="Planificación Táctica de Campo"
            valueLabel="Costo Proyectado"
            value={formatCurrency(totals.cost)}
            gradientClass="bg-gradient-to-r from-violet-600 to-fuchsia-700"
            icon={CalendarRange}
            onAction={() => setShowForm(true)}
            actionLabel="Programar Labor"
            actionIcon={Plus}
        />

        {/* Filters & Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div className="flex gap-2">
                    <button onClick={() => setFilterPeriod('day')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors ${filterPeriod === 'day' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Hoy</button>
                    <button onClick={() => setFilterPeriod('week')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors ${filterPeriod === 'week' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Semana</button>
                    <button onClick={() => setFilterPeriod('month')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors ${filterPeriod === 'month' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Mes</button>
                    <button onClick={() => setFilterPeriod('all')} className={`px-4 py-2 rounded-xl text-xs font-black uppercase transition-colors ${filterPeriod === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Todo</button>
                </div>
            </div>
            
            <div className="bg-slate-900 p-4 rounded-[2rem] border border-slate-700 flex justify-around items-center">
                <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Área Total</p>
                    <p className="text-lg text-white font-black">{totals.hectares.toFixed(1)} Ha</p>
                </div>
                <div className="w-px h-8 bg-slate-700"></div>
                <div className="text-center">
                    <p className="text-[10px] text-slate-400 uppercase font-black">Jornales Req.</p>
                    <p className="text-lg text-emerald-400 font-black">{totals.jornales.toFixed(1)}</p>
                </div>
            </div>
        </div>

        {/* List */}
        <div className="space-y-4">
            {filteredLabors.length === 0 ? (
                <EmptyState icon={Calendar} message="No hay labores programadas en este período." />
            ) : (
                filteredLabors.map(l => (
                    <div key={l.id} className={`p-5 rounded-[2rem] border shadow-sm transition-all group ${l.completed ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border-violet-200 dark:border-violet-900/30'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-xs ${l.completed ? 'bg-slate-400' : 'bg-violet-600'}`}>
                                    {new Date(l.date).getDate()}
                                </div>
                                <div>
                                    <h4 className={`font-black text-sm ${l.completed ? 'text-slate-500 line-through' : 'text-slate-800 dark:text-white'}`}>{l.activityName}</h4>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase flex items-center gap-1">
                                        <MapPin className="w-3 h-3" /> {l.costCenterName} • {l.targetArea} Ha
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="font-mono font-black text-slate-700 dark:text-slate-300 text-sm">{formatCurrency(l.calculatedTotalCost)}</p>
                                <p className="text-[10px] text-violet-500 font-bold uppercase">{l.calculatedPersonDays.toFixed(1)} Jornales</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                                <span>Rend: {l.technicalYield} Ha/Jornal</span>
                                <span>Efic: {l.efficiency}%</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onToggleComplete(l.id)} className={`p-2 rounded-lg transition-colors ${l.completed ? 'text-emerald-500 bg-emerald-100' : 'text-slate-400 hover:text-emerald-500 hover:bg-emerald-50'}`}>
                                    {l.completed ? <CheckCircle2 className="w-5 h-5"/> : <Circle className="w-5 h-5"/>}
                                </button>
                                <button onClick={() => onDeletePlannedLabor(l.id)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                    <Trash2 className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        {/* Modal Form */}
        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Programar Labor" icon={CalendarRange} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                {/* 1. Contexto */}
                <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><MapPin className="w-3 h-3"/> Ubicación y Fecha</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Fecha Programada</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Lote Objetivo</label>
                            <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required>
                                <option value="">Seleccionar Lote...</option>
                                {costCenters.map(c => <option key={c.id} value={c.id}>{c.name} ({c.area} Ha)</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                {/* 2. Labor y Dimensiones */}
                <div className="space-y-3">
                    <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Pickaxe className="w-3 h-3"/> Definición de la Labor</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-400 uppercase">Actividad</label>
                            <select value={activityId} onChange={e => setActivityId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required>
                                <option value="">Seleccionar Labor...</option>
                                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-violet-400 uppercase">Hectáreas a Trabajar</label>
                            <input type="number" step="0.1" value={targetArea} onChange={e => setTargetArea(e.target.value)} placeholder="0.0" className="w-full bg-slate-900 border border-violet-500/50 rounded-xl p-3 text-white font-black text-sm focus:ring-1 focus:ring-violet-500" required />
                        </div>
                    </div>
                </div>

                {/* 3. Indicadores Técnicos */}
                <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 space-y-4">
                    <h5 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calculator className="w-3 h-3"/> Indicadores Técnicos</h5>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">Rendimiento (Ha/Jornal)</label>
                            <input type="number" step="0.01" value={technicalYield} onChange={e => setTechnicalYield(e.target.value)} placeholder="Ej: 0.5" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-sm text-center" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">Costo Unit. Jornal</label>
                            <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="$" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-sm text-center" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[9px] font-bold text-slate-400 uppercase block">Eficiencia (%)</label>
                            <input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} placeholder="100" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-2 text-white text-sm text-center" />
                        </div>
                    </div>
                </div>

                {/* 4. Resultado Proyectado */}
                <div className="bg-violet-900/20 p-5 rounded-2xl border border-violet-500/30 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-violet-300 font-bold uppercase">Personal Estimado (1 Día)</p>
                        <p className="text-2xl font-black text-white flex items-center gap-2"><Users className="w-5 h-5"/> {projection.people}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] text-violet-300 font-bold uppercase">Costo Total Mano de Obra</p>
                        <p className="text-2xl font-black text-white font-mono">{formatCurrency(projection.totalCost)}</p>
                        <p className="text-[9px] text-slate-400 font-bold uppercase mt-1">{projection.jornales.toFixed(2)} Jornales Totales</p>
                    </div>
                </div>

                <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-4 rounded-xl shadow-xl shadow-violet-900/40 active:scale-95 transition-all">
                    GUARDAR PLANIFICACIÓN
                </button>
            </form>
        </Modal>
    </div>
  );
};
