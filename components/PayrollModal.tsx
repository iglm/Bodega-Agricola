
import React, { useState, useMemo } from 'react';
import { LaborLog, Personnel } from '../types';
import { formatCurrency } from '../services/inventoryService';
import { generatePaymentReceipt } from '../services/reportService';
import { X, CheckCircle, AlertTriangle, Printer, Wallet, UserCheck, Loader2 } from 'lucide-react';

interface PayrollModalProps {
  logs: LaborLog[];
  personnel: Personnel[];
  onMarkAsPaid: (logIds: string[]) => void;
  onClose: () => void;
  warehouseName: string;
}

export const PayrollModal: React.FC<PayrollModalProps> = ({ logs, personnel, onMarkAsPaid, onClose, warehouseName }) => {
  const [selectedPersonId, setSelectedPersonId] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Get only unpaid logs
  const unpaidLogs = useMemo(() => logs.filter(l => !l.paid), [logs]);
  
  // Calculate total debt grouped by person
  const debtByPerson = useMemo<Record<string, number>>(() => {
    const debt: Record<string, number> = {};
    unpaidLogs.forEach(l => {
        debt[l.personnelId] = (debt[l.personnelId] || 0) + l.value;
    });
    return debt;
  }, [unpaidLogs]);

  const totalGlobalDebt = (Object.values(debtByPerson) as number[]).reduce((a, b) => a + b, 0);

  // Get logs for the selected person
  const selectedLogs = useMemo(() => {
      return unpaidLogs.filter(l => l.personnelId === selectedPersonId).sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }, [unpaidLogs, selectedPersonId]);

  const totalSelectedDebt = selectedLogs.reduce((acc, l) => acc + l.value, 0);
  const selectedPersonName = personnel.find(p => p.id === selectedPersonId)?.name || 'Desconocido';

  const handlePay = async () => {
    if (!selectedPersonId || selectedLogs.length === 0) return;
    
    if (confirm(`¿Confirmar pago de ${formatCurrency(totalSelectedDebt)} a ${selectedPersonName}?`)) {
        setIsProcessing(true);
        try {
            // 1. Generate PDF (Wrapped in try catch)
            generatePaymentReceipt(selectedPersonName, selectedLogs, warehouseName);
            
            // Artificial delay to ensure browser handles the download stream before React re-renders/unmounts
            await new Promise(resolve => setTimeout(resolve, 800));

            // 2. Mark in DB
            const ids = selectedLogs.map(l => l.id);
            onMarkAsPaid(ids);
            
            // 3. Reset
            setSelectedPersonId('');
        } catch (error) {
            console.error("Error generating receipt", error);
            alert("Hubo un error generando el recibo PDF, pero el pago se registrará en el sistema.");
            // Still mark as paid if PDF fails, to avoid data inconsistency
            const ids = selectedLogs.map(l => l.id);
            onMarkAsPaid(ids);
        } finally {
            setIsProcessing(false);
        }
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-4xl rounded-2xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up">
        
        {/* Header */}
        <div className="bg-emerald-900 p-4 flex justify-between items-center border-b border-emerald-800">
            <div className="flex items-center gap-3">
                <div className="bg-emerald-500/20 p-2 rounded-lg border border-emerald-500/30">
                    <Wallet className="w-6 h-6 text-emerald-400" />
                </div>
                <div>
                    <h3 className="text-white font-bold text-xl">Liquidación de Nómina</h3>
                    <p className="text-emerald-200/70 text-sm">Gestión de pagos a trabajadores</p>
                </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-emerald-800 rounded-full text-emerald-200 hover:text-white transition-colors">
                <X className="w-6 h-6" />
            </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            
            {/* Sidebar: List of People with Debts */}
            <div className="w-full md:w-1/3 bg-slate-900/50 border-r border-slate-700 overflow-y-auto custom-scrollbar p-2">
                <div className="p-3 mb-2 bg-slate-800 rounded-xl border border-slate-700">
                    <p className="text-xs text-slate-400 uppercase font-bold">Deuda Total Pendiente</p>
                    <p className="text-2xl font-mono font-bold text-white">{formatCurrency(totalGlobalDebt)}</p>
                </div>

                <p className="text-xs text-slate-500 font-bold uppercase mb-2 px-2">Trabajadores con Saldo</p>
                
                {Object.keys(debtByPerson).length === 0 ? (
                    <div className="p-4 text-center text-slate-500 text-sm">
                        <CheckCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        ¡Estás al día! No hay pagos pendientes.
                    </div>
                ) : (
                    <div className="space-y-2">
                        {personnel
                            .filter(p => ((debtByPerson[p.id] as number) || 0) > 0)
                            .map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPersonId(p.id)}
                                    className={`w-full text-left p-3 rounded-xl border transition-all ${
                                        selectedPersonId === p.id 
                                        ? 'bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-900/50' 
                                        : 'bg-slate-800 border-slate-700 hover:border-slate-500'
                                    }`}
                                >
                                    <div className="flex justify-between items-center">
                                        <span className={`font-bold text-sm ${selectedPersonId === p.id ? 'text-white' : 'text-slate-300'}`}>
                                            {p.name}
                                        </span>
                                        <span className={`font-mono text-xs ${selectedPersonId === p.id ? 'text-emerald-100' : 'text-emerald-500'}`}>
                                            {formatCurrency((debtByPerson[p.id] as number) || 0)}
                                        </span>
                                    </div>
                                    <p className={`text-[10px] mt-1 ${selectedPersonId === p.id ? 'text-emerald-200' : 'text-slate-500'}`}>
                                        {unpaidLogs.filter(l => l.personnelId === p.id).length} Jornales pendientes
                                    </p>
                                </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Main Content: Logs Detail */}
            <div className="flex-1 bg-slate-800 p-4 flex flex-col overflow-hidden">
                {selectedPersonId ? (
                    <>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h4 className="text-white font-bold text-lg flex items-center gap-2">
                                    <UserCheck className="w-5 h-5 text-blue-400" />
                                    {selectedPersonName}
                                </h4>
                                <p className="text-slate-400 text-xs">Detalle de jornales a pagar</p>
                            </div>
                            <div className="text-right">
                                <p className="text-slate-400 text-[10px] uppercase font-bold">Total a Pagar</p>
                                <p className="text-2xl font-bold text-emerald-400 font-mono">{formatCurrency(totalSelectedDebt)}</p>
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-900/50 rounded-xl border border-slate-700 p-2 mb-4">
                            <table className="w-full text-left text-sm">
                                <thead className="text-xs text-slate-500 uppercase font-bold border-b border-slate-700">
                                    <tr>
                                        <th className="p-2">Fecha</th>
                                        <th className="p-2">Labor</th>
                                        <th className="p-2">Lote</th>
                                        <th className="p-2 text-right">Valor</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-700/50">
                                    {selectedLogs.map(log => (
                                        <tr key={log.id} className="text-slate-300 hover:bg-slate-800/50">
                                            <td className="p-2 font-mono text-xs">{new Date(log.date).toLocaleDateString()}</td>
                                            <td className="p-2">{log.activityName}</td>
                                            <td className="p-2 text-xs text-slate-500">{log.costCenterName}</td>
                                            <td className="p-2 text-right font-mono font-bold text-emerald-500">{formatCurrency(log.value)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="bg-amber-900/20 p-3 rounded-lg border border-amber-700/30 mb-4 flex gap-3 items-center">
                            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                            <p className="text-xs text-amber-200">
                                Al confirmar, se descargará un PDF (recibo) y los registros desaparecerán de esta lista.
                            </p>
                        </div>

                        <button 
                            onClick={handlePay}
                            disabled={isProcessing}
                            className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 shadow-lg shadow-emerald-900/20 transition-all ${isProcessing ? 'bg-slate-700 text-slate-400 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 text-white active:scale-[0.98]'}`}
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Procesando Pago...
                                </>
                            ) : (
                                <>
                                    <Printer className="w-5 h-5" />
                                    Generar Recibo y Marcar Pagado
                                </>
                            )}
                        </button>
                    </>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-500">
                        <Wallet className="w-16 h-16 mb-4 opacity-20" />
                        <p>Seleccione un trabajador de la lista</p>
                        <p className="text-xs mt-2">para ver el detalle y realizar el pago.</p>
                    </div>
                )}
            </div>

        </div>
      </div>
    </div>
  );
};
