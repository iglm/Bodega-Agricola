
import React, { useState } from 'react';
import { LaborLog, Personnel, CostCenter, Activity } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { Plus, Users, MapPin, Calendar, Pickaxe, List, Wallet, FileText, ShieldCheck, Signature, Clock } from 'lucide-react';
import { LaborHistoryModal } from './LaborHistoryModal';
import { HeaderCard, EmptyState, Modal } from './UIElements';

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
  const [showContractModal, setShowContractModal] = useState(false);
  const pendingCost = laborLogs.filter(l => !l.paid).reduce((acc, log) => acc + log.value, 0);

  const generateContractDraft = (person: Personnel) => {
      const text = `CONTRATO DE OBRA O LABOR - AGROSUITE 360\n\nEMPLEADOR: [Nombre Finca]\nTRABAJADOR: ${person.name}\nID: ${person.documentId || '[Pendiente]'}\n\nOBJETO: Realización de labores agrícolas en el lote asignado.\nREMUNERACIÓN: A convenir por jornal o tarea.\n\nEste documento sirve como borrador inicial según normativa vigente.`;
      const blob = new Blob([text], {type: 'text/plain'});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Borrador_Contrato_${person.name}.txt`;
      a.click();
  };

  return (
    <div className="space-y-6 pb-20">
       <HeaderCard 
          title="Gestión de Personal"
          subtitle="Legalidad y Nómina"
          valueLabel="Deuda Nómina"
          value={isAdmin ? formatCurrency(pendingCost) : "$ 0.000.000"}
          gradientClass="bg-gradient-to-r from-amber-600 to-orange-700"
          icon={Users}
          onAction={onAddLabor}
          actionLabel="Registrar Jornal"
          actionIcon={Plus}
          secondaryAction={isAdmin && (
              <button 
                  onClick={() => setShowContractModal(true)}
                  className="flex-1 bg-white/20 backdrop-blur-md text-white font-black py-3 rounded-xl flex items-center justify-center gap-2 border border-white/30"
              >
                  <FileText className="w-5 h-5" />
                  Contratos
              </button>
          )}
       />

       {/* Resumen de Nómina y Liquidación */}
       <div className="flex gap-2">
            <button onClick={onOpenPayroll} className="flex-1 bg-emerald-600 text-white font-black py-4 rounded-3xl shadow-lg flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest active:scale-95 transition-all">
                <Wallet className="w-5 h-5" /> Liquidar Pendientes
            </button>
       </div>

       <div className="space-y-4">
          <h3 className="text-slate-800 dark:text-white font-black text-sm uppercase flex items-center gap-2 px-2">
             <Pickaxe className="w-5 h-5 text-amber-500" /> Registros de Campo
          </h3>

          {laborLogs.length === 0 ? (
             <EmptyState icon={Users} message="Sin labores registradas." />
          ) : (
             <div className="space-y-3">
                {laborLogs.slice().reverse().slice(0, 5).map(log => (
                   <div key={log.id} className={`p-5 rounded-[2.5rem] border shadow-sm space-y-3 transition-all ${log.paid ? 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800' : 'bg-white dark:bg-slate-800 border-amber-200 dark:border-amber-900/30'}`}>
                      <div className="flex justify-between items-center">
                         <span className="text-[10px] text-slate-400 font-bold uppercase">{new Date(log.date).toLocaleDateString()}</span>
                         <div className="flex items-center gap-2">
                             {log.hoursWorked && (
                                 <span className="text-[9px] bg-blue-100 text-blue-600 px-2 py-0.5 rounded-full font-black flex items-center gap-1">
                                     <Clock className="w-3 h-3" /> {log.hoursWorked} Hrs
                                 </span>
                             )}
                             <span className="font-black text-slate-800 dark:text-white bg-slate-100 dark:bg-slate-700 px-3 py-1 rounded-full text-xs">
                                 {formatCurrency(log.value)}
                             </span>
                         </div>
                      </div>
                      <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-amber-500 text-white flex items-center justify-center font-black text-xs">{log.personnelName[0]}</div>
                          <div>
                              <p className="font-black text-slate-800 dark:text-white text-sm">{log.personnelName}</p>
                              <p className="text-[10px] text-amber-600 font-bold uppercase">{log.activityName} • {log.costCenterName}</p>
                          </div>
                      </div>
                   </div>
                ))}
             </div>
          )}
       </div>

       {/* MODAL DE CONTRATOS LEGALES */}
       <Modal isOpen={showContractModal} onClose={() => setShowContractModal(false)} title="Blindaje Legal Laboral" icon={ShieldCheck}>
           <div className="space-y-4">
               <div className="bg-blue-900/10 p-4 rounded-2xl border border-blue-500/20 text-[11px] text-blue-300 italic">
                   "Según el Libro Blanco de Contratación, definir la labor evita demandas ante la UGPP."
               </div>
               {personnel.map(p => (
                   <div key={p.id} className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex justify-between items-center">
                       <div>
                           <p className="text-white font-bold text-sm">{p.name}</p>
                           <p className="text-[9px] text-slate-500 uppercase">{p.role}</p>
                       </div>
                       <button onClick={() => generateContractDraft(p)} className="p-2 bg-indigo-600 rounded-xl text-white hover:bg-indigo-500 transition-colors">
                           <Signature className="w-5 h-5" />
                       </button>
                   </div>
               ))}
           </div>
       </Modal>

       {showHistory && (
           <LaborHistoryModal 
              logs={laborLogs} personnel={personnel} costCenters={costCenters} activities={activities}
              onClose={() => setShowHistory(false)} onDelete={onDeleteLabor} isAdmin={isAdmin}
           />
       )}
    </div>
  );
};
