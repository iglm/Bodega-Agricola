import React from 'react';
import { LaborLog, Personnel, CostCenter, Activity } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { Plus, Users, MapPin, Calendar, Pickaxe, TrendingUp, Search, Lock } from 'lucide-react';

interface LaborViewProps {
  laborLogs: LaborLog[];
  personnel: Personnel[];
  costCenters: CostCenter[];
  activities: Activity[];
  onAddLabor: () => void;
  onDeleteLabor: (id: string) => void;
  isAdmin: boolean;
}

export const LaborView: React.FC<LaborViewProps> = ({ 
  laborLogs, 
  onAddLabor, 
  onDeleteLabor,
  isAdmin 
}) => {
  
  // Quick Stats
  const totalCost = laborLogs.reduce((acc, log) => acc + log.value, 0);
  const totalLogs = laborLogs.length;

  return (
    <div className="space-y-6 pb-20">
       
       {/* Header Card */}
       <div className="bg-gradient-to-r from-amber-600 to-orange-600 rounded-2xl p-6 text-white shadow-xl shadow-orange-900/20">
          <div className="flex justify-between items-start mb-4">
             <div>
                <h2 className="text-2xl font-bold flex items-center gap-2">
                   <Users className="w-6 h-6 text-orange-200" />
                   Mano de Obra
                </h2>
                <p className="text-orange-100 text-sm mt-1">Control de Jornales y Tareas</p>
             </div>
             <div className="text-right">
                <p className="text-orange-200 text-xs font-bold uppercase">Gasto Total Acumulado</p>
                {isAdmin ? (
                   <p className="text-3xl font-bold font-mono mt-1">{formatCurrency(totalCost)}</p>
                ) : (
                   <div className="flex items-center justify-end gap-1 mt-1">
                      <Lock className="w-4 h-4 text-orange-200" />
                      <p className="text-2xl font-bold font-mono blur-sm">$ 0.000.000</p>
                   </div>
                )}
             </div>
          </div>
          
          <button 
            onClick={onAddLabor}
            className="w-full bg-white text-orange-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-orange-50 transition-colors shadow-lg"
          >
             <Plus className="w-5 h-5" />
             Registrar Nuevo Jornal
          </button>
       </div>

       {/* List of Logs */}
       <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                <Pickaxe className="w-5 h-5 text-amber-500" />
                Registros Recientes
             </h3>
             <span className="text-xs text-slate-500 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">{totalLogs} Registros</span>
          </div>

          {laborLogs.length === 0 ? (
             <div className="text-center py-10 bg-slate-100 dark:bg-slate-800/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <Users className="w-12 h-12 mx-auto text-slate-300 mb-2" />
                <p className="text-slate-500 dark:text-slate-400">No hay jornales registrados.</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">Utilice el botón superior para agregar uno.</p>
             </div>
          ) : (
             <div className="space-y-3">
                {laborLogs.slice().reverse().map(log => (
                   <div key={log.id} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col gap-2">
                      {/* Top Row: Date & Cost */}
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(log.date).toLocaleDateString()}
                         </div>
                         <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-sm">
                             {formatCurrency(log.value)}
                         </span>
                      </div>
                      
                      {/* Middle: Person & Activity */}
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-bold text-xs">
                              {log.personnelName.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                              <p className="font-bold text-slate-800 dark:text-white">{log.personnelName}</p>
                              <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">{log.activityName}</p>
                          </div>
                      </div>

                      {/* Bottom: Location & Notes */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-1 flex justify-between items-center">
                          <div className="flex items-center gap-1 text-xs text-slate-500">
                              <MapPin className="w-3 h-3" />
                              {log.costCenterName}
                          </div>
                          {isAdmin && (
                             <button 
                                onClick={() => {
                                   if(confirm('¿Eliminar este registro de jornal?')) onDeleteLabor(log.id);
                                }}
                                className="text-xs text-red-400 hover:text-red-500 underline"
                             >
                                Eliminar
                             </button>
                          )}
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>
    </div>
  );
};
