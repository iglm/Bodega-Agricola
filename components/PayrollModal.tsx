
import React, { useState, useMemo } from 'react';
import { LaborLog, Personnel } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { generatePaymentReceipt } from '../services/reportService';
import { X, CheckCircle, AlertTriangle, Printer, Wallet, UserCheck, Loader2, ShieldCheck, Scale, Briefcase } from 'lucide-react';

interface PayrollModalProps {
  logs: LaborLog[];
  personnel: Personnel[];
  onMarkAsPaid: (logIds: string[]) => void;
  onClose: () => void;
  warehouseName: string;
  laborFactor: number;
}

export const PayrollModal: React.FC<PayrollModalProps> = ({ logs, personnel, onMarkAsPaid, onClose, warehouseName, laborFactor }) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  const unpaidLogs = useMemo(() => logs.filter(l => !l.paid), [logs]);
  
  const debtByPerson = useMemo<Record<string, number>>(() => {
    const debt: Record<string, number> = {};
    unpaidLogs.forEach(l => {
        debt[l.personnelId] = (debt[l.personnelId] || 0) + l.value;
    });
    return debt;
  }, [unpaidLogs]);

  const totalGlobalDebtBase = (Object.values(debtByPerson) as number[]).reduce((a, b) => a + b, 0);
  const totalGlobalDebtReal = totalGlobalDebtBase * laborFactor;

  const selectedLogs = useMemo(() => {
      return unpaidLogs.filter(l => l.personnelId === selectedPersonId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [unpaidLogs, selectedPersonId]);

  const totalSelectedBase = selectedLogs.reduce((acc, l) => acc + l.value, 0);
  const totalSelectedReal = totalSelectedBase * laborFactor;
  const provicionesSociales = totalSelectedReal - totalSelectedBase;

  const selectedPersonName = personnel.find(p => p.id === selectedPersonId)?.name || 'Desconocido';

  const handlePay = async () => {
    if (!selectedPersonId || selectedLogs.length === 0) return;
    
    if (confirm(`¿Confirmar liquidación de ${formatCurrency(totalSelectedBase)} a ${selectedPersonName}? Se generará el comprobante de pago.`)) {
        setIsProcessing(true);
        try {
            generatePaymentReceipt(selectedPersonName, selectedLogs, warehouseName);
            await new Promise(resolve => setTimeout(resolve, 800));
            const ids = selectedLogs.map(l => l.id);
            onMarkAsPaid(ids);
            setSelectedPersonId('');
        } catch (error) {
            console.error(error);
            alert("Error en PDF. El pago se marcará en el sistema de todos modos.");
            const ids = selectedLogs.map(l => l.id);
            onMarkAsPaid(ids);
        } finally { setIsProcessing(false); }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-5xl rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden flex flex-col h-[90vh] animate-slide-up">
        
        <div className="bg-emerald-900 p-6 flex justify-between items-center border-b border-emerald-800">
            <div className="flex items-center gap-4">
                <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/30">
                    <Wallet className="w-7 h-7 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-white font-black text-xl">Gestión de Nómina</h3>
                    <p className="text-emerald-200/70 text-xs font-bold uppercase tracking-widest">Liquidación Consolidada DatosFinca Viva</p>
                </div>
            </div>
            <button onClick={onClose} className="p-3 hover:bg-emerald-800 rounded-full text-emerald-200 transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            
            <div className="w-full md:w-80 bg-slate-900/50 border-r border-slate-700 overflow-y-auto custom-scrollbar p-4 space-y-4">
                <div className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl border border-slate-700 shadow-xl">
                    <p className="text-[10px] text-slate-400 uppercase font-black mb-1">Costo Total Real (Empresa)</p>
                    <p className="text-2xl font-mono font-black text-white">{formatCurrency(totalGlobalDebtReal)}</p>
                    <div className={`mt-2 flex items-center gap-2 text-[9px] font-bold px-2 py-1 rounded-lg ${laborFactor > 1 ? 'text-emerald-400 bg-emerald-900/20' : 'text-amber-400 bg-amber-900/20'}`}>
                        <ShieldCheck className="w-3 h-3" /> Factor Laboral {laborFactor} Activo
                    </div>
                </div>

                <p className="text-[10px] text-slate-500 font-black uppercase px-2">Listado de Personal</p>
                
                {Object.keys(debtByPerson).length === 0 ? (
                    <div className="p-8 text-center text-slate-500 text-sm">
                        <CheckCircle className="w-10 h-10 mx-auto mb-4 opacity-20" />
                        Todo el personal está al día.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {personnel.filter(p => ((debtByPerson[p.id] as number) || 0) > 0).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPersonId(p.id)}
                                    className={`w-full text-left p-4 rounded-2xl border transition-all ${selectedPersonId === p.id ? 'bg-emerald-600 border-emerald-500 shadow-lg' : 'bg-slate-800 border-slate-700 hover:border-slate-600'}`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className={`font-black text-sm ${selectedPersonId === p.id ? 'text-white' : 'text-slate-200'}`}>{p.name}</span>
                                        <span className={`font-mono text-xs font-black ${selectedPersonId === p.id ? 'text-emerald-100' : 'text-emerald-500'}`}>{formatCurrency(debtByPerson[p.id])}</span>
                                    </div>
                                    <p className={`text-[9px] font-bold uppercase ${selectedPersonId === p.id ? 'text-emerald-200' : 'text-slate-500'}`}>{unpaidLogs.filter(l => l.personnelId === p.id).length} Jornales por liquidar</p>
                                </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="flex-1 bg-slate-800 p-6 flex flex-col overflow-hidden">
                {selectedPersonId ? (
                    <div className="flex flex-col h-full animate-fade-in">
                        <div className="flex justify-between items-start mb-6">
                            <div>
                                <h4 className="text-white font-black text-2xl flex items-center gap-3">
                                    <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-sm">{selectedPersonName[0]}</div>
                                    {selectedPersonName}
                                </h4>
                                <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Liquidación Consolidada</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-3 gap-3 mb-6">
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[9px] text-slate-500 font-black uppercase mb-1">Valor Pagado (Neto)</p>
                                <p className="text-lg font-black text-slate-300 font-mono">{formatCurrency(totalSelectedBase)}</p>
                            </div>
                            <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700">
                                <p className="text-[9px] text-indigo-400 font-black uppercase mb-1">Carga Social / Prest.</p>
                                <p className={`text-lg font-black font-mono ${laborFactor > 1 ? 'text-indigo-400' : 'text-slate-600'}`}>+{formatCurrency(provicionesSociales)}</p>
                            </div>
                            <div className="bg-emerald-900/20 p-4 rounded-2xl border border-emerald-500/30">
                                <p className="text-[9px] text-emerald-500 font-black uppercase mb-1">Costo Real Finca</p>
                                <p className="text-lg font-black text-emerald-500 font-mono">{formatCurrency(totalSelectedReal)}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-950/50 rounded-3xl border border-slate-700 p-4 mb-6">
                            <table className="w-full text-left">
                                <thead className="text-[9px] text-slate-500 uppercase font-black border-b border-slate-800">
                                    <tr><th className="p-3">Fecha</th><th className="p-3">Labor Realizada</th><th className="p-3 text-right">Valor Neto</th></tr>
                                </thead>
                                <tbody className="divide-y divide-slate-800">
                                    {selectedLogs.map(log => (
                                        <tr key={log.id} className="text-slate-300 hover:bg-slate-800/30 group">
                                            <td className="p-3 font-mono text-xs">{new Date(log.date).toLocaleDateString()}</td>
                                            <td className="p-3">
                                                <div className="text-xs font-bold text-slate-200">{log.activityName}</div>
                                                <div className="text-[9px] text-slate-500 uppercase">{log.costCenterName}</div>
                                            </td>
                                            <td className="p-3 text-right font-mono font-black text-emerald-500">{formatCurrency(log.value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="bg-amber-900/10 p-4 rounded-2xl border border-amber-700/30 flex gap-4 items-center">
                                <AlertTriangle className="w-8 h-8 text-amber-500 shrink-0" />
                                <div className="text-[10px]">
                                    <p className="text-amber-400 font-black uppercase">Información de Pago</p>
                                    <p className="text-slate-400">Factor {laborFactor} aplicado. {laborFactor > 1 ? 'Cálculo incluye provisiones legales del CST.' : 'Registro basado únicamente en el valor pactado informalmente.'}</p>
                                </div>
                            </div>
                            <button 
                                onClick={handlePay}
                                disabled={isProcessing}
                                className={`w-full font-black py-5 rounded-[2rem] flex items-center justify-center gap-3 shadow-2xl transition-all active:scale-95 ${isProcessing ? 'bg-slate-700 text-slate-400' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-900/40'}`}
                            >
                                {isProcessing ? <Loader2 className="w-6 h-6 animate-spin" /> : <><Printer className="w-6 h-6" /> LIQUIDAR Y GENERAR PDF</>}
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-600 space-y-4">
                        <Scale className="w-20 h-20 opacity-10" />
                        <div className="text-center">
                            <p className="font-black uppercase text-xs tracking-widest">Selector de Liquidación</p>
                            <p className="text-[10px] mt-2 max-w-xs mx-auto">Seleccione un trabajador para procesar su pago consolidado.</p>
                        </div>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};