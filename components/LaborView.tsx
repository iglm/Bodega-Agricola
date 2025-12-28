
import React, { useState } from 'react';
import { LaborLog, Personnel, CostCenter, Activity } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { Plus, Users, MapPin, Calendar, Pickaxe, List, Wallet, Lock } from 'lucide-react';
import { LaborHistoryModal } from './LaborHistoryModal';
import { HeaderCard, EmptyState, InfoRow } from './UIElements';

interface LaborViewProps {
  laborLogs: LaborLog[];
  personnel: Personnel[];
  costCenters: CostCenter[];
  activities: Activity[];
  onAddLabor: () => void;
  onDeleteLabor: (id: string) => void;
  isAdmin: boolean;
  onOpenPayroll?: () => void;
}

export const LaborView: React.FC<LaborViewProps> = ({ 
  laborLogs, personnel, costCenters, activities, onAddLabor, onDeleteLabor, isAdmin, onOpenPayroll
}) => {
  const [showHistory, setShowHistory] = useState(false);
  const pendingCost = laborLogs.filter(l => !l.paid).reduce((acc, log) => acc + log.value, 0);

  return (
    <div className="space-y-6 pb-20">
       <HeaderCard 
          title="Mano de Obra"
          subtitle="Control de Jornales y Tareas"
          valueLabel="Deuda Pendiente"
          value={isAdmin ? formatCurrency(pendingCost) : "$ 0.000.000"}
          gradientClass="bg-gradient-to-r from-amber-600 to-orange-600 shadow-orange-900/20"
          icon={Users}
          onAction={onAddLabor}
          actionLabel="Registrar Jornal"
          actionIcon={Plus}
          actionColorClass="text-orange-700"
          secondaryAction={isAdmin && onOpenPayroll && (
              <button 
                  onClick={onOpenPayroll}
                  className="flex-1 bg-emerald-600 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-500 transition-colors shadow-lg active:scale-95"
              >
                  <Wallet className="w-5 h-5" />
                  Liquidar
              </button>
          )}
       />

       <div className="space-y-4">
          <div className="flex items-center justify-between">
             <h3 className="text-slate-800 dark:text-white font-bold flex items-center gap-2">
                <Pickaxe className="w-5 h-5 text-amber-500" />
                Registros Recientes
             </h3>
             <button 
                onClick={() => setShowHistory(true)}
                className="text-xs bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1 transition-colors font-bold"
             >
                <List className="w-3 h-3" /> Ver Todo
             </button>
          </div>

          {laborLogs.length === 0 ? (
             <EmptyState 
                icon={Users}
                message="No hay jornales registrados."
                submessage="Utilice el botón superior para agregar uno."
             />
          ) : (
             <div className="space-y-3">
                {laborLogs.slice().reverse().slice(0, 5).map(log => (
                   <div key={log.id} className={`p-4 rounded-xl border shadow-sm flex flex-col gap-2 transition-all ${log.paid ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-75' : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/50 hover:shadow-md'}`}>
                      <div className="flex justify-between items-start">
                         <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                            <Calendar className="w-3 h-3" />
                            {new Date(log.date).toLocaleDateString()}
                         </div>
                         <div className="flex items-center gap-2">
                            {log.paid && <span className="text-[9px] font-bold bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400 px-1.5 rounded border border-emerald-500/20">PAGADO</span>}
                            <span className="font-bold text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded text-sm">
                                {formatCurrency(log.value)}
                            </span>
                         </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center text-amber-600 font-bold text-xs border border-amber-200 dark:border-amber-800">
                              {log.personnelName.substring(0,2).toUpperCase()}
                          </div>
                          <div>
                              <p className="font-bold text-slate-800 dark:text-white">{log.personnelName}</p>
                              <p className="text-xs text-amber-600 dark:text-amber-500 font-medium">{log.activityName}</p>
                          </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-slate-700 mt-1 flex justify-between items-center">
                          <InfoRow icon={MapPin} text={log.costCenterName} iconColor="text-purple-500" />
                          {isAdmin && (
                             <button 
                                onClick={() => confirm('¿Eliminar registro?') && onDeleteLabor(log.id)}
                                className="text-xs text-red-400 hover:text-red-500 underline decoration-dotted"
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

       {showHistory && (
           <LaborHistoryModal 
              logs={laborLogs} personnel={personnel} costCenters={costCenters} activities={activities}
              onClose={() => setShowHistory(false)} onDelete={onDeleteLabor} isAdmin={isAdmin}
           />
       )}
    </div>
  );
};
