import React, { useState } from 'react';
import { Personnel, CostCenter, Activity, LaborLog } from '../types';
import { X, Save, DollarSign, Calendar, User, MapPin, Pickaxe, AlertCircle } from 'lucide-react';

interface LaborFormProps {
  personnel: Personnel[];
  costCenters: CostCenter[];
  activities: Activity[];
  onSave: (log: Omit<LaborLog, 'id'>) => void;
  onCancel: () => void;
  onOpenSettings: () => void; // To redirect user if lists are empty
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
  const [personnelId, setPersonnelId] = useState('');
  const [costCenterId, setCostCenterId] = useState('');
  const [activityId, setActivityId] = useState('');
  const [value, setValue] = useState('');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!personnelId || !costCenterId || !activityId || !value) return;

    const selectedPerson = personnel.find(p => p.id === personnelId);
    const selectedCenter = costCenters.find(c => c.id === costCenterId);
    const selectedActivity = activities.find(a => a.id === activityId);

    if (!selectedPerson || !selectedCenter || !selectedActivity) return;

    onSave({
      date,
      personnelId,
      personnelName: selectedPerson.name,
      costCenterId,
      costCenterName: selectedCenter.name,
      activityId,
      activityName: selectedActivity.name,
      value: parseFloat(value),
      notes: notes.trim()
    });
  };

  const missingMasters = personnel.length === 0 || costCenters.length === 0 || activities.length === 0;

  return (
    <div className="fixed inset-0 z-40 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white dark:bg-slate-800 w-full max-w-md rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl overflow-hidden animate-slide-up">
        
        {/* Header */}
        <div className="bg-amber-50 dark:bg-amber-900/20 p-4 border-b border-amber-200 dark:border-amber-800 flex justify-between items-center">
          <div className="flex items-center gap-2">
             <div className="bg-amber-100 dark:bg-amber-900/30 p-2 rounded-lg">
                <Pickaxe className="w-5 h-5 text-amber-600 dark:text-amber-500" />
             </div>
             <h3 className="text-slate-800 dark:text-white font-bold text-lg">Registrar Jornal</h3>
          </div>
          <button onClick={onCancel} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          
          {/* Missing Masters Warning */}
          {missingMasters && (
              <div className="bg-red-50 dark:bg-red-900/20 p-3 rounded-xl border border-red-200 dark:border-red-800 flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-bold">
                      <AlertCircle className="w-4 h-4" />
                      Faltan datos en Maestros
                  </div>
                  <p className="text-[10px] text-slate-500 dark:text-slate-400">
                      Para registrar un jornal necesitas tener creados: Trabajadores, Lotes y Labores.
                  </p>
                  <button 
                    type="button"
                    onClick={() => { onCancel(); onOpenSettings(); }}
                    className="text-xs bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 py-2 rounded-lg font-bold"
                  >
                      Ir a Crear Maestros
                  </button>
              </div>
          )}

          {/* Date */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Calendar className="w-3 h-3" /> Fecha
            </label>
            <input 
              type="date" 
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none focus:ring-2 focus:ring-amber-500 transition-colors"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
              {/* Personnel */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <User className="w-3 h-3" /> Trabajador
                </label>
                <select 
                  value={personnelId}
                  onChange={e => setPersonnelId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>

              {/* Cost Center */}
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> Lote / Destino
                </label>
                <select 
                  value={costCenterId}
                  onChange={e => setCostCenterId(e.target.value)}
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
                  required
                >
                  <option value="">Seleccionar...</option>
                  {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
          </div>

          {/* Activity */}
          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1 flex items-center gap-1">
                <Pickaxe className="w-3 h-3" /> Labor Realizada
            </label>
            <select 
                value={activityId}
                onChange={e => setActivityId(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm transition-colors"
                required
            >
                <option value="">Seleccionar Labor...</option>
                {activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>

          {/* Value */}
          <div>
             <label className="block text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase mb-1 flex items-center gap-1">
                <DollarSign className="w-3 h-3" /> Valor Jornal / Costo Tarea
             </label>
             <input 
                type="number" 
                value={value}
                onChange={e => setValue(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-emerald-500/30 rounded-lg p-3 text-slate-800 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-colors font-mono text-lg"
                placeholder="0"
                required
             />
          </div>

          {/* Notes */}
          <div>
             <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-1">
                Notas (Opcional)
             </label>
             <textarea 
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg p-3 text-slate-800 dark:text-white outline-none text-sm resize-none"
                placeholder="Detalles adicionales..."
                rows={2}
             />
          </div>

          <button 
            type="submit"
            disabled={missingMasters || !value}
            className="w-full bg-amber-600 hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all mt-2 shadow-lg shadow-amber-900/20"
          >
            <Save className="w-5 h-5" />
            Guardar Registro
          </button>

        </form>
      </div>
    </div>
  );
};
