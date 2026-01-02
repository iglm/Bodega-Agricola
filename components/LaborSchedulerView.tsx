
import React, { useState, useMemo } from 'react';
import { PlannedLabor, CostCenter, Activity, BudgetPlan, LaborLog, Personnel } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { CalendarRange, Plus, Calendar, Pickaxe, MapPin, Users, DollarSign, Calculator, Filter, CheckCircle2, Circle, Trash2, ArrowRight, AlertTriangle, AlertCircle, Clock, Percent, Gauge, UserCheck, Square, CheckSquare } from 'lucide-react';
import { HeaderCard, EmptyState, Modal } from './UIElements';

interface LaborSchedulerViewProps {
  plannedLabors: PlannedLabor[];
  costCenters: CostCenter[];
  activities: Activity[];
  personnel: Personnel[]; // Inyectamos personal
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
  personnel,
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
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
  
  const projection = useMemo(() => {
      const area = parseFloat(targetArea) || 0;
      const yieldBase = parseFloat(technicalYield) || 0; 
      const cost = parseFloat(unitCost) || 0;
      const eff = parseFloat(efficiency) || 100;
      
      if (area <= 0 || yieldBase <= 0) return { jornales: 0, totalCost: 0, people: 0, hours: 0, costPerHa: 0 };

      const realYield = yieldBase * (eff / 100);
      const totalJornales = area / realYield;
      const totalHours = totalJornales * 8;
      const totalCost = totalJornales * cost;
      const costPerHa = area > 0 ? totalCost / area : 0;
      const people = Math.ceil(totalJornales); 

      return { jornales: totalJornales, totalCost, people, hours: totalHours, costPerHa };
  }, [targetArea, technicalYield, unitCost, efficiency]);

  const togglePerson = (id: string) => {
    setSelectedPersonnelIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

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
          calculatedTotalCost: projection.totalCost,
          assignedPersonnelIds: selectedPersonnelIds
      });
      setShowForm(false);
      setTargetArea('');
      setTechnicalYield('');
      setSelectedPersonnelIds([]);
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
            subtitle="Gestión Táctica de Campo"
            valueLabel="Costo Proyectado"
            value={formatCurrency(totals.cost)}
            gradientClass="bg-gradient-to-r from-violet-600 to-fuchsia-700"
            icon={CalendarRange}
            onAction={() => setShowForm(true)}
            actionLabel="Programar Labor"
            actionIcon={Plus}
        />

        <div className="flex gap-1 bg-slate-200 dark:bg-slate-900 p-1 rounded-2xl">
            {['day', 'week', 'month', 'all'].map(p => (
                <button key={p} onClick={() => setFilterPeriod(p as any)} className={`flex-1 py-2 text-[10px] font-black uppercase rounded-xl transition-all ${filterPeriod === p ? 'bg-violet-600 text-white shadow-lg' : 'text-slate-500'}`}>
                    {p === 'day' ? 'Hoy' : p === 'week' ? 'Semana' : p === 'month' ? 'Mes' : 'Todo'}
                </button>
            ))}
        </div>

        <div className="space-y-4">
            {filteredLabors.length === 0 ? (
                <EmptyState icon={Calendar} message="No hay labores programadas." />
            ) : (
                filteredLabors.map(l => (
                    <div key={l.id} className={`p-5 rounded-[2rem] border shadow-sm transition-all ${l.completed ? 'bg-slate-100 dark:bg-slate-900/50 opacity-60' : 'bg-white dark:bg-slate-800 border-violet-200 dark:border-violet-900/30'}`}>
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
                                <p className="text-[10px] text-violet-500 font-bold uppercase">{l.calculatedPersonDays.toFixed(1)} Jor</p>
                            </div>
                        </div>

                        {l.assignedPersonnelIds && l.assignedPersonnelIds.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                                {l.assignedPersonnelIds.map(pid => {
                                    const p = personnel.find(x => x.id === pid);
                                    return <span key={pid} className="text-[8px] bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-black uppercase">{p?.name || '...'}</span>;
                                })}
                            </div>
                        )}
                        
                        <div className="flex items-center justify-between border-t border-slate-100 dark:border-slate-700 pt-3 mt-3">
                            <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium">
                                <span>Rend: {l.technicalYield} Ha/Jor</span>
                                <span className="text-indigo-400">Eficiencia: {l.efficiency}%</span>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => onToggleComplete(l.id)} className={`p-2 rounded-lg transition-colors ${l.completed ? 'text-emerald-500 bg-emerald-100' : 'text-slate-400 hover:text-emerald-500'}`}>
                                    {l.completed ? <CheckCircle2 className="w-5 h-5"/> : <Circle className="w-5 h-5"/>}
                                </button>
                                <button onClick={() => onDeletePlannedLabor(l.id)} className="p-2 text-slate-400 hover:text-red-500">
                                    <Trash2 className="w-5 h-5"/>
                                </button>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>

        <Modal isOpen={showForm} onClose={() => setShowForm(false)} title="Programación de Labor Futura" icon={Calculator} maxWidth="max-w-2xl">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Fecha Ejecución</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Lote</label>
                        <select value={costCenterId} onChange={e => setCostCenterId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required>
                            <option value="">Lote...</option>
                            {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 uppercase">Labor Táctica</label>
                    <select value={activityId} onChange={e => setActivityId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-4 text-white text-sm font-black" required>
                        <option value="">Seleccionar Labor...</option>
                        {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                    </select>
                </div>

                <div className="bg-slate-900/50 p-5 rounded-[2rem] border border-slate-700 space-y-4">
                    <h5 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2"><Gauge className="w-3 h-3 text-indigo-400"/> Metas y Rendimiento</h5>
                    <div className="grid grid-cols-3 gap-3">
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase block text-center">Área (Ha)</label>
                            <input type="number" step="0.1" value={targetArea} onChange={e => setTargetArea(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-center font-bold" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase block text-center">Rendimiento</label>
                            <input type="number" step="0.01" value={technicalYield} onChange={e => setTechnicalYield(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-white text-center font-bold" required />
                        </div>
                        <div className="space-y-1">
                            <label className="text-[8px] font-black text-slate-500 uppercase block text-center">Costo Jor.</label>
                            <input type="number" value={unitCost} onChange={e => setUnitCost(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-emerald-400 text-center font-bold" required />
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2 flex items-center gap-2"><Users className="w-4 h-4 text-indigo-400"/> Personal Asignado (Opcional)</label>
                    <div className="max-h-32 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-2 space-y-1 custom-scrollbar">
                        {personnel.map(p => (
                            <div key={p.id} onClick={() => togglePerson(p.id)} className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${selectedPersonnelIds.includes(p.id) ? 'bg-indigo-900/30 text-white' : 'text-slate-400 hover:bg-slate-800'}`}>
                                {selectedPersonnelIds.includes(p.id) ? <CheckSquare className="w-4 h-4 text-indigo-400" /> : <Square className="w-4 h-4" />}
                                <span className="text-xs font-bold uppercase">{p.name}</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-indigo-900/20 p-5 rounded-[2.5rem] border border-indigo-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-[9px] text-indigo-300 font-black uppercase">Presupuesto Proyectado</p>
                        <p className="text-2xl font-mono font-black text-white">{formatCurrency(projection.totalCost)}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-[9px] text-indigo-300 font-black uppercase">Jornales</p>
                        <p className="text-2xl font-mono font-black text-white">{projection.jornales.toFixed(2)}</p>
                    </div>
                </div>

                <button type="submit" className="w-full bg-violet-600 hover:bg-violet-500 text-white font-black py-5 rounded-[2rem] shadow-xl active:scale-95 transition-all text-xs uppercase tracking-widest">
                    PROGRAMAR LABOR TÁCTICA
                </button>
            </form>
        </Modal>
    </div>
  );
};
