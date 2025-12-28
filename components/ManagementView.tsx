
import React, { useState, useMemo } from 'react';
import { AgendaEvent, Machine, MaintenanceLog, RainLog, CostCenter } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { generateRainExcel, generateRainPDF } from '../services/reportService';
import { Calendar, CheckSquare, Settings, Wrench, Droplets, Plus, Trash2, Fuel, PenTool, FileText, FileSpreadsheet, Download } from 'lucide-react';

interface ManagementViewProps {
  agenda: AgendaEvent[];
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  costCenters: CostCenter[];
  // Actions
  onAddEvent: (e: Omit<AgendaEvent, 'id'>) => void;
  onToggleEvent: (id: string) => void;
  onDeleteEvent: (id: string) => void;
  onAddMachine: (m: Omit<Machine, 'id'>) => void;
  onAddMaintenance: (m: Omit<MaintenanceLog, 'id'>) => void;
  onDeleteMachine: (id: string) => void;
  onAddRain: (r: Omit<RainLog, 'id'>) => void;
  onDeleteRain: (id: string) => void;
  isAdmin: boolean;
}

export const ManagementView: React.FC<ManagementViewProps> = ({
    agenda, machines, maintenanceLogs, rainLogs, costCenters,
    onAddEvent, onToggleEvent, onDeleteEvent,
    onAddMachine, onAddMaintenance, onDeleteMachine,
    onAddRain, onDeleteRain, isAdmin
}) => {
  const [subTab, setSubTab] = useState<'agenda' | 'machinery' | 'rain'>('agenda');

  // Forms state
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  
  const [rainDate, setRainDate] = useState(new Date().toISOString().split('T')[0]);
  const [rainMm, setRainMm] = useState('');

  const [machineName, setMachineName] = useState('');
  const [maintType, setMaintType] = useState<'Preventivo' | 'Correctivo' | 'Combustible'>('Correctivo');
  const [maintCost, setMaintCost] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [selectedMachineId, setSelectedMachineId] = useState('');

  // AGENDA HANDLERS
  const handleAddEvent = (e: React.FormEvent) => {
      e.preventDefault();
      if(!eventTitle) return;
      onAddEvent({
          date: eventDate || new Date().toISOString().split('T')[0],
          title: eventTitle,
          completed: false
      });
      setEventTitle('');
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
          description: maintDesc
      });
      setMaintCost(''); setMaintDesc('');
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
                <div className="bg-indigo-900/20 p-4 rounded-xl border border-indigo-500/30">
                    <h3 className="text-indigo-400 font-bold mb-2 text-sm uppercase">Programar Tarea</h3>
                    <form onSubmit={handleAddEvent} className="flex gap-2">
                        <input 
                            type="date" 
                            value={eventDate}
                            onChange={e => setEventDate(e.target.value)}
                            className="bg-slate-900 border border-slate-600 rounded-lg px-2 py-2 text-white text-xs outline-none w-1/3"
                        />
                        <input 
                            type="text" 
                            value={eventTitle}
                            onChange={e => setEventTitle(e.target.value)}
                            placeholder="Ej: Fertilizar Lote 1"
                            className="flex-1 bg-slate-900 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm outline-none"
                        />
                        <button type="submit" className="bg-indigo-600 text-white p-2 rounded-lg">
                            <Plus className="w-5 h-5" />
                        </button>
                    </form>
                </div>

                <div className="space-y-2">
                    {agenda.length === 0 ? (
                        <p className="text-center text-slate-500 py-8">No hay tareas pendientes.</p>
                    ) : (
                        agenda.slice().reverse().map(ev => (
                            <div key={ev.id} className={`flex items-center p-3 rounded-xl border transition-colors ${ev.completed ? 'bg-slate-900/30 border-slate-800 opacity-60' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'}`}>
                                <button onClick={() => onToggleEvent(ev.id)} className={`mr-3 p-1 rounded ${ev.completed ? 'bg-emerald-500 text-white' : 'border-2 border-slate-400'}`}>
                                    {ev.completed && <CheckSquare className="w-4 h-4" />}
                                </button>
                                <div className="flex-1">
                                    <p className={`text-sm font-bold ${ev.completed ? 'line-through text-slate-500' : 'text-slate-800 dark:text-white'}`}>{ev.title}</p>
                                    <p className="text-xs text-slate-500">{new Date(ev.date).toLocaleDateString()}</p>
                                </div>
                                <button onClick={() => onDeleteEvent(ev.id)} className="text-slate-500 hover:text-red-400">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
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
                                    placeholder="Costo ($)"
                                    className="bg-slate-900 border border-slate-600 rounded-lg p-2 text-white text-sm flex-1"
                                />
                            </div>
                            <input 
                                type="text"
                                value={maintDesc}
                                onChange={e => setMaintDesc(e.target.value)}
                                placeholder="Descripción (Ej: Cambio de aceite)" 
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

                        return (
                            <div key={m.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                                <div className="p-4 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                                    <div>
                                        <h4 className="font-bold text-slate-800 dark:text-white">{m.name}</h4>
                                        <p className="text-xs text-orange-600 dark:text-orange-400 font-bold">Gasto Total: {formatCurrency(totalMaint)}</p>
                                    </div>
                                    <button onClick={() => onDeleteMachine(m.id)} className="text-slate-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                                </div>
                                <div className="p-2 space-y-1">
                                    {logs.length === 0 ? <p className="text-[10px] text-slate-500 text-center py-2">Sin mantenimientos</p> : 
                                        logs.map(l => (
                                            <div key={l.id} className="flex justify-between text-xs text-slate-600 dark:text-slate-300 p-2 border-b border-slate-100 dark:border-slate-700/50 last:border-0">
                                                <span>{new Date(l.date).toLocaleDateString()} - {l.description}</span>
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
