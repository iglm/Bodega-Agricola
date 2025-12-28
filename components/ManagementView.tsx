
import React, { useState, useMemo } from 'react';
import { AgendaEvent, Machine, MaintenanceLog, RainLog, CostCenter, Personnel, Activity } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { generateRainExcel, generateRainPDF } from '../services/reportService';
import { Calendar, CheckSquare, Settings, Wrench, Droplets, Plus, Trash2, Fuel, PenTool, FileText, FileSpreadsheet, Download, Gauge, User, MapPin, Pickaxe, DollarSign, CheckCircle, ArrowRight, Tractor } from 'lucide-react';

interface ManagementViewProps {
  agenda: AgendaEvent[];
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  costCenters: CostCenter[];
  personnel: Personnel[]; // New
  activities: Activity[]; // New
  // Actions
  onAddEvent: (e: Omit<AgendaEvent, 'id'>) => void;
  onToggleEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onConvertEvent?: (e: AgendaEvent, actualValue: number, machineCost?: number) => void; // Updated signature
  onAddMachine: (m: Omit<Machine, 'id'>) => void;
  onAddMaintenance: (m: Omit<MaintenanceLog, 'id'>) => void;
  onDeleteMachine: (id: string) => void;
  onAddRain: (r: Omit<RainLog, 'id'>) => void;
  onDeleteRain: (id: string) => void;
  isAdmin: boolean;
}

export const ManagementView: React.FC<ManagementViewProps> = ({
    agenda, machines, maintenanceLogs, rainLogs, costCenters, personnel, activities,
    onAddEvent, onToggleEvent, onDeleteEvent, onConvertEvent,
    onAddMachine, onAddMaintenance, onDeleteMachine,
    onAddRain, onDeleteRain, isAdmin
}) => {
  const [subTab, setSubTab] = useState<'agenda' | 'machinery' | 'rain'>('agenda');

  // Agenda Forms state
  const [eventDate, setEventDate] = useState(new Date().toISOString().split('T')[0]);
  const [eventPersonId, setEventPersonId] = useState('');
  const [eventActivityId, setEventActivityId] = useState('');
  const [eventLotId, setEventLotId] = useState('');
  const [eventMachineId, setEventMachineId] = useState(''); // New Machine Link
  const [eventCost, setEventCost] = useState('');
  const [eventDesc, setEventDesc] = useState('');

  // Execution State (Converting Task to Log)
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);
  const [actualTaskCost, setActualTaskCost] = useState(''); // Labor Cost
  const [actualMachineCost, setActualMachineCost] = useState(''); // Machine Cost (Fuel/Usage)
  
  const [rainDate, setRainDate] = useState(new Date().toISOString().split('T')[0]);
  const [rainMm, setRainMm] = useState('');

  const [machineName, setMachineName] = useState('');
  const [maintType, setMaintType] = useState<'Preventivo' | 'Correctivo' | 'Combustible'>('Correctivo');
  const [maintCost, setMaintCost] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintUsage, setMaintUsage] = useState(''); // New: Hours/Km
  const [selectedMachineId, setSelectedMachineId] = useState('');

  // AGENDA HANDLERS
  const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      
      const person = personnel.find(p => p.id === eventPersonId);
      const activity = activities.find(a => a.id === eventActivityId);
      const lot = costCenters.find(c => c.id === eventLotId);
      const machine = machines.find(m => m.id === eventMachineId);

      // Basic title construction if no specific description
      let title = eventDesc;
      if (!title) {
          if (activity && lot) title = `${activity.name} en ${lot.name}`;
          else if (activity) title = activity.name;
          else title = "Tarea General";
      }

      onAddEvent({
          date: eventDate,
          title: title,
          description: eventDesc,
          completed: false,
          personnelId: eventPersonId || undefined,
          personnelName: person?.name,
          activityId: eventActivityId || undefined,
          activityName: activity?.name,
          costCenterId: eventLotId || undefined,
          costCenterName: lot?.name,
          machineId: eventMachineId || undefined,
          machineName: machine?.name,
          estimatedCost: eventCost ? parseFloat(eventCost) : undefined
      });

      // Reset
      setEventDesc(''); setEventCost('');
  };

  const handleExecuteTask = (e: AgendaEvent) => {
      if (completingTaskId === e.id) {
          // Confirm
          if (onConvertEvent && actualTaskCost) {
              const machineCost = actualMachineCost ? parseFloat(actualMachineCost) : 0;
              onConvertEvent(e, parseFloat(actualTaskCost), machineCost);
              
              setCompletingTaskId(null);
              setActualTaskCost('');
              setActualMachineCost('');
          }
      } else {
          // Open confirm mode
          setCompletingTaskId(e.id);
          setActualTaskCost(e.estimatedCost ? e.estimatedCost.toString() : '');
          setActualMachineCost('');
      }
  };

  // RAIN HANDLERS
  const handleAddRain = (e: React.FormEvent) => {
      e.preventDefault();
      if(!rainMm) return;
      onAddRain({
          date: rainDate,
          millimeters: parseFloat(rainMm)
      });
      setRainMm('');
  };

  // RAIN CHART DATA LOGIC
  const rainChartData = useMemo(() => {
      const data = rainLogs.slice().sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).slice(-10);
      if (data.length === 0) return null;
      
      const maxMm = Math.max(...data.map(d => d.millimeters), 10);
      const height = 100;
      const barWidth = 10;
      const gap = 20;
      const totalWidth = data.length * (barWidth + gap);

      return { data, maxMm, height, barWidth, gap, totalWidth };
  }, [rainLogs]);

  // MACHINE HANDLERS
  const handleCreateMachine = (e: React.FormEvent) => {
      e.preventDefault();
      if(!machineName) return;
      onAddMachine({ name: machineName });
      setMachineName('');
  };

  const handleCreateMaintenance = (e: React.FormEvent) => {
      e.preventDefault();
      if(!selectedMachineId || !maintCost) return;
      onAddMaintenance({
          machineId: selectedMachineId,
          date: new Date().toISOString().split('T')[0],
          type: maintType,
          cost: parseFloat(maintCost),
          description: maintDesc,
          usageAmount: maintUsage ? parseFloat(maintUsage) : undefined
      });
      setMaintCost(''); setMaintDesc(''); setMaintUsage('');
  };

  return (
    <div className="space-y-6 pb-20">
        
        {/* SUB-TABS NAVIGATION */}
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl">
            <button 
                onClick={() => setSubTab('agenda')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${subTab === 'agenda' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}
            >
                <Calendar className="w-4 h-4" /> Agenda
            </button>
            <button 
                onClick={() => setSubTab('machinery')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${subTab === 'machinery' ? 'bg-white dark:bg-slate-700 text-orange-600 dark:text-orange-400 shadow-sm' : 'text-slate-500'}`}
            >
                <Settings className="w-4 h-4" /> Maquinaria
            </button>
            <button 
                onClick={() => setSubTab('rain')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-all ${subTab === 'rain' ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-sm' : 'text-slate-500'}`}
            >
                <Droplets className="w-4 h-4" /> Lluvias
            </button>
        </div>

        {/* --- AGENDA VIEW --- */}
        {subTab === 'agenda' && (
            <div className="space-y-4 animate-fade-in">
                
                {/* Advanced Task Planner */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <h3 className="text-indigo-600 dark:text-indigo-400 font-bold mb-3 text-sm uppercase flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Programar Labor
                    </h3>
                    <form onSubmit={handleAddEvent} className="space-y-3">
                        <div className="flex gap-3">
                            <input 
                                type="date" 
                                value={eventDate}
                                onChange={e => setEventDate(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white text-xs outline-none w-1/3 font-bold"
                            />
                            <select 
                                value={eventPersonId}
                                onChange={e => setEventPersonId(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white text-xs outline-none flex-1"
                            >
                                <option value="">- Quién (Personal) -</option>
                                {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-3">
                            <select 
                                value={eventActivityId}
                                onChange={e => setEventActivityId(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white text-xs outline-none flex-1"
                            >
                                <option value="">- Qué (Actividad) -</option>
                                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                            </select>
                            <select 
                                value={eventLotId}
                                onChange={e => setEventLotId(e.target.value)}
                                className="bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white text-xs outline-none flex-1"
                            >
                                <option value="">- Dónde (Lote) -</option>
                                {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                        </div>

                        {/* Machine Link */}
                        <div className="flex gap-3">
                            <select 
                                value={eventMachineId}
                                onChange={e => setEventMachineId(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white text-xs outline-none"
                            >
                                <option value="">- Maquinaria (Opcional) -</option>
                                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                        </div>

                        <div className="flex gap-3 items-center">
                            <input 
                                type="text" 
                                value={eventDesc}
                                onChange={e => setEventDesc(e.target.value)}
                                placeholder="Descripción / Detalles adicionales..."
                                className="flex-1 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-slate-800 dark:text-white text-sm outline-none"
                            />
                            <div className="w-24 relative">
                                <span className="absolute left-2 top-2 text-slate-400 text-xs">$</span>
                                <input 
                                    type="number"
                                    value={eventCost}
                                    onChange={e => setEventCost(e.target.value)}
                                    placeholder="Est. Costo"
                                    className="w-full pl-4 bg-slate-100 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg py-2 text-slate-800 dark:text-white text-xs outline-none"
                                />
                            </div>
                        </div>

                        <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2 rounded-lg text-sm transition-colors shadow-sm">
                            Agendar Tarea
                        </button>
                    </form>
                </div>

                <div className="space-y-2 pb-10">
                    <h4 className="text-xs font-bold text-slate-500 uppercase ml-1">Próximas Labores</h4>
                    {agenda.length === 0 ? (
                        <p className="text-center text-slate-400 py-8 bg-slate-100 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                            No hay tareas pendientes.
                        </p>
                    ) : (
                        agenda.slice().sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map(ev => {
                            const isExecutionMode = completingTaskId === ev.id;
                            const isSmartTask = ev.personnelId && ev.activityId && ev.costCenterId; // Can be auto-converted

                            return (
                                <div key={ev.id} className={`flex flex-col p-3 rounded-xl border transition-all ${ev.completed ? 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 shadow-sm'}`}>
                                    
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className={`text-sm font-bold ${ev.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}`}>
                                                    {ev.title}
                                                </span>
                                                {ev.estimatedCost && !ev.completed && (
                                                    <span className="text-[10px] bg-slate-100 dark:bg-slate-900 text-slate-500 px-1.5 py-0.5 rounded border border-slate-300 dark:border-slate-700">
                                                        Est: {formatCurrency(ev.estimatedCost)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-2 text-xs text-slate-500 dark:text-slate-400">
                                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(ev.date).toLocaleDateString()}</span>
                                                {ev.personnelName && <span className="flex items-center gap-1"><User className="w-3 h-3 text-blue-400" /> {ev.personnelName}</span>}
                                                {ev.costCenterName && <span className="flex items-center gap-1"><MapPin className="w-3 h-3 text-purple-400" /> {ev.costCenterName}</span>}
                                                {ev.machineName && <span className="flex items-center gap-1"><Tractor className="w-3 h-3 text-orange-400" /> {ev.machineName}</span>}
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {/* EXECUTE / COMPLETE BUTTON */}
                                            {!ev.completed && (
                                                <button 
                                                    onClick={() => isSmartTask ? handleExecuteTask(ev) : onToggleEvent(ev.id)}
                                                    className={`p-2 rounded-lg transition-colors ${
                                                        isExecutionMode 
                                                        ? 'bg-amber-100 text-amber-600' 
                                                        : 'bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40'
                                                    }`}
                                                    title={isSmartTask ? "Ejecutar y crear Jornal" : "Marcar como hecha"}
                                                >
                                                    {isSmartTask ? <Pickaxe className="w-4 h-4" /> : <CheckSquare className="w-4 h-4" />}
                                                </button>
                                            )}
                                            
                                            {/* DELETE */}
                                            <button onClick={() => onDeleteEvent(ev.id)} className="p-2 text-slate-400 hover:text-red-500 transition-colors">
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                    </div>

                                    {/* CONFIRMATION DRAWER FOR SMART TASKS */}
                                    {isExecutionMode && (
                                        <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-700 animate-fade-in bg-slate-50 dark:bg-slate-900/30 p-2 rounded-lg">
                                            <p className="text-[10px] text-slate-500 font-bold uppercase mb-2">Confirmar Ejecución</p>
                                            
                                            <div className="flex flex-col gap-2 mb-2">
                                                <div>
                                                    <label className="text-[10px] text-slate-400 block">Pago Mano de Obra ($)</label>
                                                    <input 
                                                        type="number" 
                                                        value={actualTaskCost}
                                                        onChange={(e) => setActualTaskCost(e.target.value)}
                                                        className="w-full bg-white dark:bg-slate-900 border border-emerald-500 rounded-lg px-2 py-1.5 text-sm font-bold text-emerald-600 outline-none"
                                                        autoFocus
                                                        placeholder="Valor Jornal"
                                                    />
                                                </div>
                                                
                                                {/* CONDITIONAL MACHINE COST INPUT */}
                                                {ev.machineId && (
                                                    <div>
                                                        <label className="text-[10px] text-slate-400 block">Gasto Maquinaria (Gasolina/Uso) ($)</label>
                                                        <input 
                                                            type="number" 
                                                            value={actualMachineCost}
                                                            onChange={(e) => setActualMachineCost(e.target.value)}
                                                            className="w-full bg-white dark:bg-slate-900 border border-orange-500 rounded-lg px-2 py-1.5 text-sm font-bold text-orange-600 outline-none"
                                                            placeholder="Opcional"
                                                        />
                                                    </div>
                                                )}
                                            </div>

                                            <button 
                                                onClick={() => handleExecuteTask(ev)}
                                                disabled={!actualTaskCost}
                                                className="w-full bg-emerald-600 text-white px-3 py-2 rounded-lg font-bold text-xs flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                            >
                                                Confirmar y Guardar <ArrowRight className="w-3 h-3" />
                                            </button>
                                            
                                            <p className="text-[9px] text-slate-400 mt-2 text-center">
                                                Se creará: 1 Jornal {ev.machineId ? '+ 1 Registro Mantenimiento' : ''}
                                            </p>
                                        </div>
                                    )}

                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        )}

        {/* --- MACHINERY VIEW --- */}
        {subTab === 'machinery' && (
            <div className="space-y-6 animate-fade-in">
                
                {/* 1. Create Machine */}
                <div className="bg-orange-900/20 p-4 rounded-xl border border-orange-500/30 flex gap-2 items-center">
                     <Settings className="w-5 h-5 text-orange-500" />
                     <input 
                        type="text" 
                        value={machineName} 
                        onChange={e => setMachineName(e.target.value)}
                        placeholder="Nombre Nueva Máquina (Ej: Guadaña 1)"
                        className="flex-1 bg-transparent border-b border-orange-500/50 text-white text-sm outline-none placeholder-slate-500"
                     />
                     <button onClick={handleCreateMachine} className="text-orange-500 font-bold text-xs uppercase">Crear</button>
                </div>

                {/* 2. Add Maintenance */}
                {machines.length > 0 && (
                    <div className="bg-slate-800 p-4 rounded-xl border border-slate-700">
                        <h3 className="text-slate-300 font-bold mb-3 text-xs uppercase flex items-center gap-2">
                            <Wrench className="w-4 h-4" /> Registrar Mantenimiento / Gasto
                        </h3>
                        <div className="space-y-3">
                            <select 
                                value={selectedMachineId} 
                                onChange={e => setSelectedMachineId(e.target.value)}
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm"
                            >
                                <option value="">Seleccionar Máquina...</option>
                                {machines.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                            </select>
                            <div className="flex gap-2">
                                <select 
                                    value={maintType} 
                                    onChange={e => setMaintType(e.target.value as any)}
                                    className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm w-1/3"
                                >
                                    <option>Correctivo</option>
                                    <option>Preventivo</option>
                                    <option>Combustible</option>
                                </select>
                                <input 
                                    type="number" 
                                    value={maintCost}
                                    onChange={e => setMaintCost(e.target.value)}
                                    placeholder="Costo Total ($)"
                                    className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm flex-1"
                                />
                            </div>
                            <div className="flex gap-2">
                                <div className="flex-1 relative">
                                    <Gauge className="absolute left-2 top-2.5 w-4 h-4 text-slate-500" />
                                    <input 
                                        type="number"
                                        value={maintUsage}
                                        onChange={e => setMaintUsage(e.target.value)}
                                        placeholder="Horas / Km (Uso Actual)" 
                                        className="w-full bg-slate-900 border border-slate-600 rounded-lg py-2 pl-8 pr-2 text-white text-sm"
                                    />
                                </div>
                            </div>
                            <input 
                                type="text"
                                value={maintDesc}
                                onChange={e => setMaintDesc(e.target.value)}
                                placeholder="Descripción (Ej: Cambio de aceite, Tanqueada)" 
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm"
                            />
                            <button onClick={handleCreateMaintenance} className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-2 rounded-lg text-sm">
                                Guardar Gasto
                            </button>
                        </div>
                    </div>
                )}

                {/* 3. List Machines & Logs */}
                <div className="space-y-4">
                    {machines.map(m => {
                        const logs = maintenanceLogs.filter(l => l.machineId === m.id);
                        const totalMaint = logs.reduce((acc, l) => acc + l.cost, 0);
                        
                        // Calculate usage stats if available
                        const usageLogs = logs.filter(l => l.usageAmount !== undefined).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
                        const lastUsage = usageLogs.length > 0 ? usageLogs[usageLogs.length - 1].usageAmount : 0;

                        return (
                            <div key={m.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="p-4 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white">{m.name}</h4>
                                        <div className="flex gap-3 text-xs mt-1">
                                            <span className="text-orange-600 dark:text-orange-400 font-bold">Gasto Total: {formatCurrency(totalMaint)}</span>
                                            {lastUsage ? <span className="text-slate-500 font-mono bg-slate-200 dark:bg-slate-800 px-1.5 rounded">{lastUsage} Hrs/Km</span> : null}
                                        </div>
                                    </div>
                                    <button onClick={() => onDeleteMachine(m.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <div className="p-2 space-y-1">
                                    {logs.length === 0 ? <p className="text-[10px] text-slate-500 text-center py-2">Sin mantenimientos</p> : 
                                        logs.map(l => (
                                            <div key={l.id} className="flex justify-between items-center text-xs text-slate-600 dark:text-slate-300 p-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                                                <div>
                                                    <span className="block font-bold">{l.type} - {new Date(l.date).toLocaleDateString()}</span>
                                                    <span className="text-[10px] text-slate-400">{l.description} {l.usageAmount ? `(${l.usageAmount} h)` : ''}</span>
                                                </div>
                                                <span className="font-mono font-bold">{formatCurrency(l.cost)}</span>
                                            </div>
                                        ))
                                    }
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* --- RAIN VIEW --- */}
        {subTab === 'rain' && (
            <div className="space-y-6 animate-fade-in">
                
                {/* Reports Header (NEW) */}
                <div className="flex justify-between items-center bg-slate-100 dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
                    <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2">
                        <Download className="w-4 h-4" /> Reportes Lluvia
                    </h4>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => generateRainPDF(rainLogs, "Bodega Principal")}
                            className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-2 rounded-lg hover:scale-105 transition-transform"
                            title="Descargar PDF"
                        >
                            <FileText className="w-4 h-4" />
                        </button>
                        <button 
                            onClick={() => generateRainExcel(rainLogs)}
                            className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 p-2 rounded-lg hover:scale-105 transition-transform"
                            title="Descargar Excel"
                        >
                            <FileSpreadsheet className="w-4 h-4" />
                        </button>
                    </div>
                </div>

                {/* Add Rain Form */}
                <div className="bg-blue-900/20 p-4 rounded-xl border border-blue-500/30">
                    <h3 className="text-blue-400 font-bold mb-2 text-sm uppercase flex items-center gap-2">
                        <Droplets className="w-4 h-4" /> Registrar Lluvia
                    </h3>
                    <form onSubmit={handleAddRain} className="flex gap-2 items-center">
                        <input 
                            type="date" 
                            value={rainDate}
                            onChange={e => setRainDate(e.target.value)}
                            className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-xs outline-none"
                        />
                        <div className="flex-1 relative">
                             <input 
                                type="number" 
                                value={rainMm}
                                onChange={e => setRainMm(e.target.value)}
                                placeholder="0"
                                className="w-full bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none text-center font-bold font-mono text-lg"
                             />
                             <span className="absolute right-3 top-2.5 text-xs text-slate-500 font-bold">mm</span>
                        </div>
                        <button type="submit" className="bg-blue-600 text-white p-2.5 rounded-lg">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                {/* REAL SVG Rain Chart (Improved) */}
                <div className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700">
                    <h4 className="text-xs text-slate-500 uppercase font-bold mb-4">Gráfico Real (Últimos 10 registros)</h4>
                    
                    {rainChartData ? (
                        <div className="w-full overflow-x-auto pb-2">
                            <div className="min-w-[300px]">
                                <svg 
                                    viewBox={`0 0 ${rainChartData.totalWidth + 20} ${rainChartData.height + 30}`} 
                                    className="w-full h-32 overflow-visible"
                                >
                                    {/* Y Axis Line */}
                                    <line x1="0" y1="0" x2="0" y2={rainChartData.height} stroke="#64748b" strokeWidth="1" />
                                    
                                    {/* Bars */}
                                    {rainChartData.data.map((d, i) => {
                                        const barHeight = (d.millimeters / rainChartData.maxMm) * rainChartData.height;
                                        const x = i * (rainChartData.barWidth + rainChartData.gap) + 10;
                                        const y = rainChartData.height - barHeight;
                                        
                                        return (
                                            <g key={i}>
                                                {/* Tooltip hint / Value top */}
                                                <text 
                                                    x={x + rainChartData.barWidth/2} 
                                                    y={y - 5} 
                                                    textAnchor="middle" 
                                                    fill="#3b82f6" 
                                                    fontSize="10" 
                                                    fontWeight="bold"
                                                >
                                                    {d.millimeters}
                                                </text>
                                                
                                                {/* Bar */}
                                                <rect 
                                                    x={x} 
                                                    y={y} 
                                                    width={rainChartData.barWidth} 
                                                    height={barHeight} 
                                                    fill="url(#rainGradient)" 
                                                    rx="2"
                                                />
                                                
                                                {/* Date Label */}
                                                <text 
                                                    x={x + rainChartData.barWidth/2} 
                                                    y={rainChartData.height + 15} 
                                                    textAnchor="middle" 
                                                    fill="#94a3b8" 
                                                    fontSize="8"
                                                    transform={`rotate(0, ${x + rainChartData.barWidth/2}, ${rainChartData.height + 15})`}
                                                >
                                                    {new Date(d.date).getDate()}/{new Date(d.date).getMonth()+1}
                                                </text>
                                            </g>
                                        );
                                    })}
                                    
                                    {/* Gradient Definition */}
                                    <defs>
                                        <linearGradient id="rainGradient" x1="0" x2="0" y1="0" y2="1">
                                            <stop offset="0%" stopColor="#3b82f6" />
                                            <stop offset="100%" stopColor="#1d4ed8" />
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </div>
                        </div>
                    ) : (
                        <div className="h-32 flex items-center justify-center text-slate-400 text-xs italic bg-slate-50 dark:bg-slate-900/50 rounded-lg">
                            Sin datos suficientes para graficar
                        </div>
                    )}
                </div>

                {/* Rain List */}
                <div className="space-y-1">
                    {rainLogs.slice().reverse().map(r => (
                        <div key={r.id} className="flex justify-between items-center bg-slate-100 dark:bg-slate-900/50 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-mono">
                                {new Date(r.date).toLocaleDateString()}
                            </span>
                            <span className="font-bold text-blue-600 dark:text-blue-400 text-lg">
                                {r.millimeters} mm
                            </span>
                            <button onClick={() => onDeleteRain(r.id)} className="text-slate-400 hover:text-red-500">
                                <Trash2 className="w-4 h-4" />
                            </button>
                        </div>
                    ))}
                </div>

            </div>
        )}

    </div>
  );
};
