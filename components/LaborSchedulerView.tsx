
import React, { useState, useMemo, useEffect } from 'react';
import { PlannedLabor, CostCenter, Activity, BudgetPlan, LaborLog } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { CalendarRange, Plus, Calendar, Pickaxe, MapPin, Users, DollarSign, Calculator, Filter, CheckCircle2, Circle, Trash2, ArrowRight, AlertTriangle, AlertCircle, Clock, Percent, Gauge } from 'lucide-react';
import { HeaderCard, EmptyState, Modal } from './UIElements';

interface LaborSchedulerViewProps {
  plannedLabors: PlannedLabor[];
  costCenters: CostCenter[];
  activities: Activity[];
  onAddPlannedLabor: (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => void;
  onDeletePlannedLabor: (id: string) => void;
  onToggleComplete: (id: string) => void;
  budgets?: BudgetPlan[];
  laborLogs?: LaborLog[];
  laborFactor?: number;
}

export const LaborSchedulerView: React.FC<LaborSchedulerViewProps> = ({
  plannedLabors,
  costCenters,
  activities,
  onAddPlannedLabor,
  onDeletePlannedLabor,
  onToggleComplete,
  budgets = [],
  laborLogs = [],
  laborFactor = 1.0
}) => {
  const [showForm, setShowForm] = useState(false);
  const [filterPeriod, setFilterPeriod] = useState<'day' | 'week' | 'month' | 'all'>('all');
  
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [activityId, setActivityId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [targetArea, setTargetArea] = useState('');
  const [technicalYield, setTechnicalYield] = useState(''); 
  const [unitCost, setUnitCost] = useState('');
  const [efficiency, setEfficiency] = useState('100');
  
  const projection = useMemo(() => {
      const area = parseFloat(targetArea) || 0;
      const yieldBase = parseFloat(technicalYield) || 0; 
      const cost = parseFloat(unitCost) || 0;
      const eff = parseFloat(efficiency) || 100;
      
      if (area <= 0 || yieldBase <= 0) return { jornales: 0, totalCost: 0, people: 0, hours: 0, costPerHa: 0 };

      // Rendimiento ajustado por eficiencia
      const realYield = yieldBase * (eff / 100);
      
      // Fórmula Maestra: Jornales = Area / Rendimiento Ajustado
      const totalJornales = area / realYield;
      const totalHours = totalJornales * 8;
      const totalCost = totalJornales * cost;
      const costPerHa = area > 0 ? totalCost / area : 0;
      const people = Math.ceil(totalJornales); 

      return { jornales: totalJornales, totalCost, people, hours: totalHours, costPerHa };
  }, [targetArea, technicalYield, unitCost, efficiency]);

  const budgetCheck = useMemo(() => {
      if (!costCenterId) return null;
      const year = new Date(date).getFullYear();
      const selectedLot = costCenters.find(c => c.id === costCenterId);
      const budget = budgets.find(b => b.costCenterId === costCenterId && b.year === year);
      if (!budget) return { status: 'no-budget' };

      let totalBudgetLimit = 0;
      budget.items.forEach(item => {
          if (item.type === 'LABOR') {
              totalBudgetLimit += item.unitCost * item.quantityPerHa * (selectedLot?.area || 1) * item.months.length;
          }
      });

      const executed = laborLogs
          .filter(l => l.costCenterId === costCenterId && new Date(l.date).getFullYear() === year)
          .reduce((sum, l) => sum + (l.value * laborFactor), 0);

      const committed = plannedLabors
          .filter(l => l.costCenterId === costCenterId && !l.completed && new Date(l.date).getFullYear() === year)
          .reduce((sum, l) => sum + l.calculatedTotalCost, 0);

      const remaining = totalBudgetLimit - executed - committed;
      const newCost = projection.totalCost;
      const isOver = newCost > remaining;
      const percentUsed = totalBudgetLimit > 0 ? ((executed + committed + newCost) / totalBudgetLimit) * 100 : 0;

      return { status: 'active', totalBudgetLimit, executed, committed, remaining, newCost, isOver, percentUsed };
  }, [costCenterId, date, budgets, laborLogs, plannedLabors, projection.totalCost, laborFactor, costCenters]);


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
          calculatedHours: projection.hours,
          calculatedTotalCost: projection.totalCost
      });
      setShowForm(false);
      setTargetArea('');
      setTechnicalYield('');
  };

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

  const totals = useMemo(() => {
      return filteredLabors.reduce((acc, l) => ({
          hectares: acc.hectares + l.targetArea,
          jornales: acc.jornales + l.calculatedPersonDays,
          hours: acc.hours + (l.calculatedHours || 0),
          cost: acc.cost + l.calculatedTotalCost
      }), { hectares: 0, jornales: 0, hours: 0, cost: 0 });
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-slate-800 p-4 rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-between">
                <div className="flex gap-1">
                    <button onClick={() => setFilterPeriod('day')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${filterPeriod === 'day' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Hoy</button>
                    <button onClick={() => setFilterPeriod('week')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${filterPeriod === 'week' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Semana</button>
                    <button onClick={() => setFilterPeriod('month')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${filterPeriod === 'month' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Mes</button>
                    <button onClick={() => setFilterPeriod('all')} className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase transition-colors ${filterPeriod === 'all' ? 'bg-violet-600 text-white' : 'bg-slate-100 dark:bg-slate-900 text-slate-500'}`}>Todo</button>
                </div>
            </div>
            
            <div className="bg-slate-900 p-4 rounded-[2rem] border border-slate-700 flex justify-around items-center">
                <div className="text-center">
                    <p className="text-[8px] text-slate-400 uppercase font-black">Área Total</p>
                    <p className="text-sm text-white font-black">{totals.hectares.toFixed(1)} Ha</p>
                </div>
                <div className="w-px h-6 bg-slate-700"></div>
                <div className="text-center">
                    <p className="text-[8px] text-slate-400 uppercase font-black">Días/Hombre</p>
                    <p className="text-sm text-emerald-400 font-black">{totals.jornales.toFixed(1)} Jor | {totals.hours.toFixed(0)} Hr</p>
                </div>
            </div>
        </div>

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
                                <p className="font-mono font-black text-slate-700 dark:text-white text-sm">{formatCurrency(l.calculatedTotalCost)}</p>
                                <p className="text-[10px] text-violet-500 font-bold uppercase">{l.calculatedPersonDays.toFixed(2)} Días/Hombre</p>
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                                <span>Rend Plan: {l.technicalYield} Ha/Jor</span>
                                <span className="text-indigo-400">Eficiencia: {l.efficiency}%</span>
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

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Planificación Técnica" icon={Calculator} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                
                <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Calendar className="w-3 h-3"/> Fecha y Lugar</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Programada</label>
                            <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Lote Objetivo</label>
                            <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required>
                                <option value="">Seleccionar Lote...</option>
                                {costCenters.map(c => <option key={c.id} value={c.id}>{c.name} ({c.area} Ha)</option>)}
                            </select>
                        </div>
                    </div>
                </div>

                <div className="space-y-3">
                    <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Pickaxe className="w-3 h-3"/> Configuración de la Tarea</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Labor</label>
                            <select value={activityId} onChange={e => setActivityId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required>
                                <option value="">Seleccionar Labor...</option>
                                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-[10px] font-bold text-violet-400 uppercase">Hectáreas a Intervenir</label>
                            <input type="number" step="0.1" value={targetArea} onChange={e => setTargetArea(e.target.value)} placeholder="0.0" className="w-full bg-slate-900 border border-violet-500/30 rounded-xl p-3 text-white font-black text-sm outline-none focus:ring-1 focus:ring-violet-500" required />
                        </div>
                    </div>
                </div>

                <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Gauge className="w-3 h-3 text-indigo-400"/> Parámetros de Rendimiento</h5>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1 text-center">
                            <label className="text-[8px] font-black text-slate-500 uppercase block">Rend (Ha/Jor)</label>
                            <input type="number" step="0.01" value={technicalYield} onChange={e => setTechnicalYield(e.target.value)} placeholder="0.5" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-sm text-center font-mono font-bold" required />
                        </div>
                        <div className="space-y-1 text-center">
                            <label className="text-[8px] font-black text-slate-500 uppercase block">Costo Neto Jornal</label>
                            <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} placeholder="$" className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 text-sm text-center font-mono font-bold" required />
                        </div>
                        <div className="space-y-1 text-center">
                            <label className="text-[8px] font-black text-indigo-400 uppercase block">Eficiencia (%)</label>
                            <input type="number" value={efficiency} onChange={e => setEfficiency(e.target.value)} className="w-full bg-slate-950 border border-indigo-900/30 rounded-xl p-3 text-indigo-400 text-sm text-center font-mono font-bold" />
                        </div>
                    </div>
                </div>

                <div className="bg-violet-900/20 p-6 rounded-[2.5rem] border border-violet-500/30 space-y-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-[9px] text-violet-300 font-black uppercase">Costo por Hectárea</p>
                            <p className="text-2xl font-black text-white font-mono">{formatCurrency(projection.costPerHa)}</p>
                        </div>
                        <div className="text-right">
                            <p className="text-[9px] text-violet-300 font-black uppercase">Total Días/Hombre</p>
                            <p className="text-2xl font-black text-white font-mono">{projection.jornales.toFixed(2)}</p>
                        </div>
                    </div>

                    <div className="bg-slate-950/40 p-4 rounded-2xl flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="p-2 bg-emerald-500/20 rounded-lg"><Clock className="w-4 h-4 text-emerald-500" /></div>
                             <div>
                                 <p className="text-[8px] text-slate-500 font-black uppercase">Tiempo Estimado Equipo</p>
                                 <p className="text-sm font-black text-white">{(projection.hours).toFixed(0)} Horas Totales</p>
                             </div>
                         </div>
                         <div className="text-right">
                             <p className="text-[8px] text-slate-500 font-black uppercase">Presupuesto Total</p>
                             <p className="text-lg font-black text-emerald-400">{formatCurrency(projection.totalCost)}</p>
                         </div>
                    </div>

                    {budgetCheck && (
                        <div className={`p-4 rounded-2xl border flex items-start gap-4 ${
                            budgetCheck.status === 'no-budget' ? 'bg-slate-900 border-slate-700' :
                            budgetCheck.isOver ? 'bg-red-950/40 border-red-500/40' :
                            'bg-emerald-950/40 border-emerald-500/40'
                        }`}>
                            {budgetCheck.status === 'no-budget' ? (
                                <>
                                    <AlertCircle className="w-5 h-5 text-slate-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-slate-400 uppercase">Sin Presupuesto Definido</p>
                                        <p className="text-[9px] text-slate-500 mt-1">No existe un plan anual para este lote.</p>
                                    </div>
                                </>
                            ) : budgetCheck.isOver ? (
                                <>
                                    <AlertTriangle className="w-5 h-5 text-red-500 shrink-0 mt-0.5 animate-pulse" />
                                    <div>
                                        <p className="text-[10px] font-black text-red-400 uppercase">Excede Disponibilidad</p>
                                        <p className="text-[9px] text-red-200/70 mt-1 leading-tight italic">
                                            Diferencia: {formatCurrency(budgetCheck.newCost - budgetCheck.remaining)}. Se requiere ajuste presupuestal.
                                        </p>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-[10px] font-black text-emerald-400 uppercase">Viable Financieramente</p>
                                        <p className="text-[9px] text-emerald-200/70 mt-1">Gasto dentro del límite proyectado ({formatCurrency(budgetCheck.remaining)} disp.).</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-5 rounded-[2rem] shadow-2xl shadow-violet-900/40 active:scale-95 transition-all text-xs uppercase tracking-widest">
                    PROGRAMAR DÍAS/HOMBRE
                </button>
            </form>
        </Modal>
    </div>
  );
};
