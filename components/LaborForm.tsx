
import React, { useState } from 'react';
import { Personnel, CostCenter, Activity, LaborLog } from '../types';
import { X, Save, DollarSign, Calendar, User, MapPin, Pickaxe, AlertCircle, Users, CheckSquare, Square } from 'lucide-react';

interface LaborFormProps {
  personnel: Personnel[];
  costCenters: CostCenter[];
  activities: Activity[];
  onSave: (log: Omit<LaborLog, 'id' | 'warehouseId' | 'paid'>) => void;
  onCancel: () => void;
  onOpenSettings: () => void;
}

export const LaborForm: React.FC<LaborFormProps> = ({ 
  personnel, 
  costCenters, 
  activities, 
  onSave, 
  onCancel,
  onOpenSettings
}) => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedPersonnelIds, setSelectedPersonnelIds] = useState<string[]>([]);
  const [costCenterId, setCostCenterId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const togglePerson = (id: string) => {
    setSelectedPersonnelIds(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const selectAll = () => {
    if (selectedPersonnelIds.length === personnel.length) {
      setSelectedPersonnelIds([]);
    } else {
      setSelectedPersonnelIds(personnel.map(p => p.id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPersonnelIds.length === 0 || !costCenterId || !activityId || !value) return;

    const selectedCenter = costCenters.find(c => c.id === costCenterId);
    const selectedActivity = activities.find(a => a.id === activityId);

    if (!selectedCenter || !selectedActivity) return;

    // Create a log for EACH selected person (Batch Processing)
    selectedPersonnelIds.forEach(personId => {
        const person = personnel.find(p => p.id === personId);
        if (person) {
            onSave({
                date,
                personnelId: personId,
                personnelName: person.name,
                costCenterId,
                costCenterName: selectedCenter.name,
                activityId,
                activityName: selectedActivity.name,
                value: parseFloat(value),
                notes: notes.trim()
            });
        }
    });
  };

  const missingMasters = personnel.length === 0 || costCenters.length === 0 || activities.length === 0;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-[2rem] border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-5 border-b border-amber-200 dark:border-amber-800 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
             <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-xl">
                <Users className="w-5 h-5 text-amber-600 dark:text-amber-500" />
             </div>
             <div>
                <h3 className="text-slate-800 dark:text-white font-black text-lg leading-none">Registrar Jornal</h3>
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-1">Modo Cuadrilla / Individual</p>
             </div>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-5 custom-scrollbar">
          
          {/* Missing Masters Warning */}
          {missingMasters && (
              <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-200 dark:border-red-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-black">
                      <AlertCircle className="w-4 h-4" />
                      Faltan datos en Maestros
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Para registrar un jornal necesitas tener creados: Trabajadores, Lotes y Labores.
                  </p>
                  <button 
                    type="button"
                    onClick={() => { onCancel(); onOpenSettings(); }}
                    className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 py-3 rounded-xl font-bold mt-1"
                  >
                      Ir a Crear Maestros
                  </button>
              </div>
          )}

          {/* Date & Activity Group */}
          <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Fecha
                </label>
                <input 
                  type="date" 
                  value={date}
                  onChange={e => setDate(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors font-bold text-xs"
                  required
                />
              </div>
              <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Lote Destino
                </label>
                <select 
                  value={costCenterId}
                  onChange={e => setCostCenterId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white outline-none text-xs font-bold transition-colors"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
          </div>

          {/* Activity Selection */}
          <div>
            <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Pickaxe className="w-3 h-3" /> Labor Realizada
            </label>
            <select 
                value={activityId}
                onChange={e => setActivityId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white outline-none text-sm font-bold transition-colors"
                required
            >
                <option value="">Seleccionar Labor...</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Personnel Selection (Multi-Select) */}
          <div className="space-y-2">
             <div className="flex justify-between items-center">
                 <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase flex items-center gap-1">
                    <Users className="w-3 h-3" /> Personal ({selectedPersonnelIds.length})
                 </label>
                 <button type="button" onClick={selectAll} className="text-[10px] text-amber-500 font-bold hover:text-amber-400">
                    {selectedPersonnelIds.length === personnel.length ? 'Deseleccionar' : 'Todos'}
                 </button>
             </div>
             <div className="max-h-40 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-2 space-y-1">
                 {personnel.map(p => {
                     const isSelected = selectedPersonnelIds.includes(p.id);
                     return (
                         <div 
                            key={p.id} 
                            onClick={() => togglePerson(p.id)}
                            className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-amber-100 dark:bg-amber-900/30' : 'hover:bg-slate-200 dark:hover:bg-slate-800'}`}
                         >
                             {isSelected ? <CheckSquare className="w-4 h-4 text-amber-600 dark:text-amber-500" /> : <Square className="w-4 h-4 text-slate-400" />}
                             <span className={`text-xs font-bold ${isSelected ? 'text-amber-900 dark:text-amber-100' : 'text-slate-600 dark:text-slate-400'}`}>{p.name}</span>
                         </div>
                     )
                 })}
                 {personnel.length === 0 && <p className="text-center text-[10px] text-slate-400 py-4">No hay personal registrado.</p>}
             </div>
          </div>

          {/* Value & Notes */}
          <div className="space-y-3">
             <div>
                <label className="block text-[10px] font-black text-emerald-600 dark:text-emerald-400 uppercase mb-1 flex items-center gap-1">
                    <DollarSign className="w-3 h-3" /> Costo Unitario (Por Persona)
                </label>
                <input 
                    type="number" 
                    value={value}
                    onChange={e => setValue(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-emerald-500/30 rounded-xl p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors font-mono text-lg font-black"
                    placeholder="0"
                    required
                />
             </div>

             <div>
                <label className="block text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase mb-1">
                    Notas (Opcional)
                </label>
                <textarea 
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-xl p-3 text-slate-800 dark:text-white outline-none text-xs font-medium resize-none"
                    placeholder="Detalles adicionales..."
                    rows={2}
                />
             </div>
          </div>

        </form>

        <div className="p-5 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50 shrink-0">
            <button 
                onClick={handleSubmit}
                disabled={missingMasters || !value || selectedPersonnelIds.length === 0}
                className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-black py-4 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-900/20 active:scale-95"
            >
                <Save className="w-5 h-5" />
                {selectedPersonnelIds.length > 1 ? `REGISTRAR (${selectedPersonnelIds.length}) JORNALES` : 'GUARDAR REGISTRO'}
            </button>
        </div>

      </div>
    </div>
  );
};
