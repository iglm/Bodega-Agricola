
import React, { useState, useMemo, useEffect } from 'react';
import { BudgetPlan, CostCenter, Activity, InventoryItem, BudgetItem, LaborLog, Movement } from '../types';
import { formatCurrency, generateId } from '../services/inventoryService';
import { Calculator, Plus, Trash2, Save, Calendar, TrendingUp, Pickaxe, Package, ArrowRight, BarChart3, AlertCircle, CheckCircle2, Target, Gauge } from 'lucide-react';
import { HeaderCard, Modal } from './UIElements';

interface BudgetViewProps {
  budgets: BudgetPlan[];
  costCenters: CostCenter[];
  activities: Activity[];
  inventory: InventoryItem[];
  warehouseId: string;
  onSaveBudget: (budget: BudgetPlan) => void;
  // New props for Control Logic
  laborLogs?: LaborLog[];
  movements?: Movement[];
  laborFactor?: number;
}

export const BudgetView: React.FC<BudgetViewProps> = ({
  budgets,
  costCenters,
  activities,
  inventory,
  warehouseId,
  onSaveBudget,
  laborLogs = [],
  movements = [],
  laborFactor = 1.0
}) => {
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [selectedLotId, setSelectedLotId] = useState(costCenters[0]?.id || '');
  const [viewMode, setViewMode] = useState<'plan' | 'control'>('plan');
  
  // Local state for editing the budget
  const [activeBudget, setActiveBudget] = useState<BudgetPlan | null>(null);
  
  // UI States for adding items
  const [showAddItem, setShowAddItem] = useState(false);
  const [addItemType, setAddItemType] = useState<'LABOR' | 'SUPPLY'>('LABOR');
  const [selectedConceptId, setSelectedConceptId] = useState('');
  const [unitCost, setUnitCost] = useState('');
  const [qtyPerHa, setQtyPerHa] = useState('');
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);

  // Load or Create Budget when selection changes
  useEffect(() => {
    if (!selectedLotId) return;
    
    const existing = budgets.find(b => b.warehouseId === warehouseId && b.year === selectedYear && b.costCenterId === selectedLotId);
    
    if (existing) {
        setActiveBudget(JSON.parse(JSON.stringify(existing))); // Deep copy to edit
    } else {
        // Create new empty draft
        setActiveBudget({
            id: generateId(),
            warehouseId,
            year: selectedYear,
            costCenterId: selectedLotId,
            items: []
        });
    }
  }, [selectedYear, selectedLotId, budgets, warehouseId]);

  const selectedLot = costCenters.find(c => c.id === selectedLotId);
  const lotArea = selectedLot?.area || 1;

  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  // --- LOGIC ---

  const handleAddItem = (e: React.FormEvent) => {
      e.preventDefault();
      if (!activeBudget || !selectedConceptId || !qtyPerHa || !unitCost || selectedMonths.length === 0) return;

      const conceptName = addItemType === 'LABOR' 
          ? activities.find(a => a.id === selectedConceptId)?.name 
          : inventory.find(i => i.id === selectedConceptId)?.name;

      const newItem: BudgetItem = {
          id: generateId(),
          type: addItemType,
          conceptId: selectedConceptId,
          conceptName: conceptName || 'Desconocido',
          unitCost: parseFloat(unitCost),
          quantityPerHa: parseFloat(qtyPerHa),
          months: selectedMonths
      };

      setActiveBudget({
          ...activeBudget,
          items: [...activeBudget.items, newItem]
      });

      // Reset Form
      setShowAddItem(false);
      setUnitCost('');
      setQtyPerHa('');
      setSelectedMonths([]);
      setSelectedConceptId('');
  };

  const handleRemoveItem = (itemId: string) => {
      if (!activeBudget) return;
      setActiveBudget({
          ...activeBudget,
          items: activeBudget.items.filter(i => i.id !== itemId)
      });
  };

  const toggleMonth = (idx: number) => {
      setSelectedMonths(prev => prev.includes(idx) ? prev.filter(m => m !== idx) : [...prev, idx]);
  };

  const handleSaveChanges = () => {
      if (activeBudget) {
          onSaveBudget(activeBudget);
          alert('Presupuesto guardado exitosamente.');
      }
  };

  // --- PLAN CALCULATIONS ---
  const planSummary = useMemo(() => {
      if (!activeBudget) return { totalLabor: 0, totalSupplies: 0, monthlyFlow: Array(12).fill(0) };

      let totalLabor = 0;
      let totalSupplies = 0;
      const monthlyFlow = Array(12).fill(0);

      activeBudget.items.forEach(item => {
          const costPerEvent = item.unitCost * item.quantityPerHa * lotArea;
          
          item.months.forEach(monthIdx => {
              monthlyFlow[monthIdx] += costPerEvent;
              if (item.type === 'LABOR') totalLabor += costPerEvent;
              else totalSupplies += costPerEvent;
          });
      });

      return { totalLabor, totalSupplies, monthlyFlow };
  }, [activeBudget, lotArea]);

  const grandTotalPlanned = planSummary.totalLabor + planSummary.totalSupplies;
  const maxMonthly = Math.max(...planSummary.monthlyFlow) || 1; // For chart scaling

  // --- CONTROL (EXECUTION) CALCULATIONS ---
  const executionData = useMemo(() => {
      if (!selectedLotId) return { realLabor: 0, realSupplies: 0, totalReal: 0, percentExecuted: 0 };

      // Calculate Real Labor Cost
      const realLabor = laborLogs
        .filter(l => l.costCenterId === selectedLotId && new Date(l.date).getFullYear() === selectedYear)
        .reduce((sum, l) => sum + (l.value * laborFactor), 0);

      // Calculate Real Supplies Cost
      const realSupplies = movements
        .filter(m => m.costCenterId === selectedLotId && m.type === 'OUT' && new Date(m.date).getFullYear() === selectedYear)
        .reduce((sum, m) => sum + m.calculatedCost, 0);

      const totalReal = realLabor + realSupplies;
      const percentExecuted = grandTotalPlanned > 0 ? (totalReal / grandTotalPlanned) * 100 : 0;

      return { realLabor, realSupplies, totalReal, percentExecuted };
  }, [laborLogs, movements, selectedLotId, selectedYear, laborFactor, grandTotalPlanned]);


  if (!selectedLot) return <div className="p-8 text-center text-slate-500">Seleccione un lote para comenzar.</div>;

  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <HeaderCard 
            title={viewMode === 'plan' ? "Presupuesto Anual" : "Control de Ejecución"}
            subtitle="Planificación Financiera de Cultivos"
            valueLabel={viewMode === 'plan' ? "Presupuesto Total" : "Ejecutado Real"}
            value={viewMode === 'plan' ? formatCurrency(grandTotalPlanned) : formatCurrency(executionData.totalReal)}
            gradientClass="bg-gradient-to-r from-slate-700 to-slate-900"
            icon={Calculator}
            onAction={viewMode === 'plan' ? handleSaveChanges : () => {}}
            actionLabel={viewMode === 'plan' ? "Guardar Cambios" : `${executionData.percentExecuted.toFixed(1)}% Ejecutado`}
            actionIcon={viewMode === 'plan' ? Save : Gauge}
            actionColorClass={viewMode === 'control' && executionData.percentExecuted > 100 ? "text-red-500" : undefined}
        />

        {/* CONTROLS BAR */}
        <div className="bg-white dark:bg-slate-800 p-4 rounded-3xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex gap-4 items-center w-full md:w-auto">
                <div className="relative">
                    <Calendar className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <select 
                        value={selectedYear} 
                        onChange={e => setSelectedYear(parseInt(e.target.value))}
                        className="pl-10 pr-4 py-2 bg-slate-100 dark:bg-slate-900 rounded-xl font-bold text-slate-700 dark:text-white border-none outline-none appearance-none cursor-pointer"
                    >
                        <option value={currentYear}>{currentYear}</option>
                        <option value={currentYear + 1}>{currentYear + 1}</option>
                    </select>
                </div>
                <div className="h-8 w-px bg-slate-300 dark:bg-slate-700"></div>
                <select 
                    value={selectedLotId} 
                    onChange={e => setSelectedLotId(e.target.value)}
                    className="flex-1 py-2 bg-transparent font-black text-lg text-slate-800 dark:text-white border-none outline-none cursor-pointer"
                >
                    {costCenters.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
            </div>
            
            {/* MODE SWITCHER */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-900 rounded-xl">
                <button 
                    onClick={() => setViewMode('plan')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'plan' ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow' : 'text-slate-400'}`}
                >
                    <Target className="w-4 h-4" /> Planificación
                </button>
                <button 
                    onClick={() => setViewMode('control')}
                    className={`px-4 py-2 rounded-lg text-xs font-black uppercase transition-all flex items-center gap-2 ${viewMode === 'control' ? 'bg-indigo-600 text-white shadow' : 'text-slate-400'}`}
                >
                    <Gauge className="w-4 h-4" /> Control (Real)
                </button>
            </div>
        </div>

        {/* --- VIEW MODE: PLANNING --- */}
        {viewMode === 'plan' && (
            <div className="space-y-6 animate-slide-up">
                {/* CASH FLOW CHART */}
                <div className="bg-slate-900 p-6 rounded-[2.5rem] border border-slate-700 shadow-xl overflow-x-auto">
                    <h4 className="text-white font-black text-xs uppercase mb-6 flex items-center gap-2 tracking-widest">
                        <TrendingUp className="w-4 h-4 text-emerald-500" /> Flujo de Caja Proyectado
                    </h4>
                    <div className="flex items-end gap-2 h-32 min-w-[600px]">
                        {planSummary.monthlyFlow.map((amount, idx) => {
                            const heightPercent = (amount / maxMonthly) * 100;
                            return (
                                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group relative">
                                    <div className="w-full bg-slate-800 rounded-t-lg relative overflow-hidden h-full">
                                        <div 
                                            className="absolute bottom-0 left-0 right-0 bg-emerald-500 transition-all duration-500 group-hover:bg-emerald-400" 
                                            style={{ height: `${heightPercent}%` }}
                                        ></div>
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-500 uppercase">{months[idx]}</span>
                                    {amount > 0 && (
                                        <div className="absolute -top-8 bg-slate-800 text-white text-[9px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity font-mono whitespace-nowrap z-10 border border-slate-700">
                                            {formatCurrency(amount)}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* DETAILS GRID */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* LABORS COLUMN */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <Pickaxe className="w-5 h-5 text-amber-500" /> Presupuesto Labores
                            </h3>
                            <button 
                                onClick={() => { setAddItemType('LABOR'); setShowAddItem(true); }}
                                className="p-2 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-500 rounded-xl hover:bg-amber-200 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>
                        
                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {activeBudget?.items.filter(i => i.type === 'LABOR').length === 0 && (
                                <div className="p-6 text-center text-xs text-slate-400">Sin labores planificadas.</div>
                            )}
                            {activeBudget?.items.filter(i => i.type === 'LABOR').map(item => (
                                <div key={item.id} className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{item.conceptName}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {item.quantityPerHa} Jornales/Ha x {formatCurrency(item.unitCost)}
                                        </p>
                                        <div className="flex gap-1 mt-2">
                                            {item.months.sort((a,b)=>a-b).map(m => (
                                                <span key={m} className="px-1.5 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-[8px] font-black rounded uppercase">
                                                    {months[m]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black font-mono text-slate-700 dark:text-slate-300 text-sm">
                                            {formatCurrency(item.unitCost * item.quantityPerHa * lotArea * item.months.length)}
                                        </p>
                                        <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs font-black text-slate-500 uppercase">
                                <span>Total Mano de Obra</span>
                                <span className="text-amber-500 font-mono text-base">{formatCurrency(planSummary.totalLabor)}</span>
                            </div>
                        </div>
                    </div>

                    {/* SUPPLIES COLUMN */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center">
                            <h3 className="font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-emerald-500" /> Presupuesto Insumos
                            </h3>
                            <button 
                                onClick={() => { setAddItemType('SUPPLY'); setShowAddItem(true); }}
                                className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-500 rounded-xl hover:bg-emerald-200 transition-colors"
                            >
                                <Plus className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 overflow-hidden">
                            {activeBudget?.items.filter(i => i.type === 'SUPPLY').length === 0 && (
                                <div className="p-6 text-center text-xs text-slate-400">Sin insumos planificados.</div>
                            )}
                            {activeBudget?.items.filter(i => i.type === 'SUPPLY').map(item => (
                                <div key={item.id} className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-start hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors group">
                                    <div>
                                        <p className="font-bold text-slate-800 dark:text-white text-sm">{item.conceptName}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">
                                            {item.quantityPerHa} Und/Ha x {formatCurrency(item.unitCost)}
                                        </p>
                                        <div className="flex gap-1 mt-2">
                                            {item.months.sort((a,b)=>a-b).map(m => (
                                                <span key={m} className="px-1.5 py-0.5 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 text-[8px] font-black rounded uppercase">
                                                    {months[m]}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className="font-black font-mono text-slate-700 dark:text-slate-300 text-sm">
                                            {formatCurrency(item.unitCost * item.quantityPerHa * lotArea * item.months.length)}
                                        </p>
                                        <button onClick={() => handleRemoveItem(item.id)} className="text-slate-300 hover:text-red-500 mt-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))}
                            <div className="p-4 bg-slate-50 dark:bg-slate-900 flex justify-between items-center text-xs font-black text-slate-500 uppercase">
                                <span>Total Insumos</span>
                                <span className="text-emerald-500 font-mono text-base">{formatCurrency(planSummary.totalSupplies)}</span>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        )}

        {/* --- VIEW MODE: CONTROL (EXECUTION) --- */}
        {viewMode === 'control' && (
            <div className="space-y-6 animate-slide-up">
                
                {/* EXECUTION SUMMARY */}
                <div className="bg-slate-900 p-8 rounded-[3rem] border border-slate-700 shadow-xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-6 opacity-5">
                        <BarChart3 className="w-48 h-48 text-white" />
                    </div>
                    <div className="relative z-10">
                        <h4 className="text-white font-black uppercase tracking-widest text-xs mb-6 flex items-center gap-2">
                            <Gauge className="w-5 h-5 text-indigo-400" /> Estado del Presupuesto {selectedYear}
                        </h4>
                        
                        <div className="mb-6">
                            <div className="flex justify-between items-end mb-2">
                                <span className={`text-4xl font-black ${executionData.percentExecuted > 100 ? 'text-red-500' : 'text-emerald-400'}`}>
                                    {executionData.percentExecuted.toFixed(1)}%
                                </span>
                                <span className="text-slate-400 text-xs font-bold uppercase mb-1">Del Presupuesto Ejecutado</span>
                            </div>
                            <div className="w-full h-4 bg-slate-800 rounded-full overflow-hidden border border-slate-700">
                                <div 
                                    className={`h-full transition-all duration-1000 ${executionData.percentExecuted > 100 ? 'bg-red-500' : 'bg-indigo-500'}`} 
                                    style={{ width: `${Math.min(executionData.percentExecuted, 100)}%` }}
                                ></div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase font-black">Planificado (Meta)</p>
                                <p className="text-xl font-mono font-bold text-slate-300">{formatCurrency(grandTotalPlanned)}</p>
                            </div>
                            <div className="bg-slate-950/50 p-4 rounded-2xl border border-slate-800">
                                <p className="text-[10px] text-slate-500 uppercase font-black">Ejecutado (Real)</p>
                                <p className={`text-xl font-mono font-bold ${executionData.totalReal > grandTotalPlanned ? 'text-red-400' : 'text-emerald-400'}`}>
                                    {formatCurrency(executionData.totalReal)}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* DETAILED COMPARISON */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    
                    {/* LABOR CONTROL */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <Pickaxe className="w-5 h-5 text-amber-500" /> Mano de Obra
                            </h4>
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${executionData.realLabor > planSummary.totalLabor ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {planSummary.totalLabor > 0 ? ((executionData.realLabor / planSummary.totalLabor) * 100).toFixed(0) : 0}% Uso
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Planificado:</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(planSummary.totalLabor)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Real (Con Factor {laborFactor}):</span>
                                <span className={`font-mono font-black ${executionData.realLabor > planSummary.totalLabor ? 'text-red-500' : 'text-amber-500'}`}>
                                    {formatCurrency(executionData.realLabor)}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mt-2">
                                <div 
                                    className={`h-full ${executionData.realLabor > planSummary.totalLabor ? 'bg-red-500' : 'bg-amber-500'}`} 
                                    style={{ width: `${Math.min((executionData.realLabor / (planSummary.totalLabor || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                    {/* SUPPLIES CONTROL */}
                    <div className="bg-white dark:bg-slate-800 p-6 rounded-[2.5rem] border border-slate-200 dark:border-slate-700 shadow-sm">
                        <div className="flex justify-between items-center mb-4">
                            <h4 className="font-black text-slate-700 dark:text-white flex items-center gap-2">
                                <Package className="w-5 h-5 text-emerald-500" /> Insumos
                            </h4>
                            <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${executionData.realSupplies > planSummary.totalSupplies ? 'bg-red-100 text-red-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                {planSummary.totalSupplies > 0 ? ((executionData.realSupplies / planSummary.totalSupplies) * 100).toFixed(0) : 0}% Uso
                            </span>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Planificado:</span>
                                <span className="font-mono font-bold text-slate-700 dark:text-slate-300">{formatCurrency(planSummary.totalSupplies)}</span>
                            </div>
                            <div className="flex justify-between text-xs">
                                <span className="text-slate-500">Real (Salidas de Bodega):</span>
                                <span className={`font-mono font-black ${executionData.realSupplies > planSummary.totalSupplies ? 'text-red-500' : 'text-emerald-500'}`}>
                                    {formatCurrency(executionData.realSupplies)}
                                </span>
                            </div>
                            <div className="w-full h-2 bg-slate-100 dark:bg-slate-900 rounded-full overflow-hidden mt-2">
                                <div 
                                    className={`h-full ${executionData.realSupplies > planSummary.totalSupplies ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                    style={{ width: `${Math.min((executionData.realSupplies / (planSummary.totalSupplies || 1)) * 100, 100)}%` }}
                                ></div>
                            </div>
                        </div>
                    </div>

                </div>
            </div>
        )}

        {/* MODAL TO ADD ITEM */}
        <Modal 
            isOpen={showAddItem} 
            onClose={() => setShowAddItem(false)} 
            title={addItemType === 'LABOR' ? 'Añadir Labor Planificada' : 'Añadir Insumo Planificado'} 
            icon={addItemType === 'LABOR' ? Pickaxe : Package}
        >
            <form onSubmit={handleAddItem} className="space-y-5">
                
                <div className="space-y-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Concepto</label>
                    <select 
                        value={selectedConceptId} 
                        onChange={e => setSelectedConceptId(e.target.value)} 
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm"
                        required
                    >
                        <option value="">Seleccionar...</option>
                        {addItemType === 'LABOR' 
                            ? activities.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
                            : inventory.map(i => <option key={i.id} value={i.id}>{i.name}</option>)
                        }
                    </select>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Cantidad por Ha</label>
                        <input 
                            type="number" 
                            step="0.01" 
                            value={qtyPerHa} 
                            onChange={e => setQtyPerHa(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm"
                            placeholder={addItemType === 'LABOR' ? 'Ej: 4 Jornales' : 'Ej: 2 Litros'}
                            required
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Costo Unitario</label>
                        <input 
                            type="number" 
                            value={unitCost} 
                            onChange={e => setUnitCost(e.target.value)} 
                            className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm"
                            placeholder="$"
                            required
                        />
                    </div>
                </div>

                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <label className="text-[10px] font-black text-slate-500 uppercase mb-3 block">Meses de Ejecución</label>
                    <div className="grid grid-cols-4 gap-2">
                        {months.map((m, idx) => (
                            <button
                                key={idx}
                                type="button"
                                onClick={() => toggleMonth(idx)}
                                className={`py-2 rounded-lg text-[10px] font-black uppercase transition-all ${selectedMonths.includes(idx) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-800 text-slate-500 hover:bg-slate-700'}`}
                            >
                                {m}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="p-3 bg-indigo-900/20 rounded-xl border border-indigo-500/20 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] text-indigo-300 font-bold uppercase">Costo Total Calculado</p>
                        <p className="text-[9px] text-slate-400">{lotArea} Ha x {selectedMonths.length} Meses</p>
                    </div>
                    <p className="text-xl font-mono font-black text-white">
                        {formatCurrency(
                            (parseFloat(unitCost) || 0) * (parseFloat(qtyPerHa) || 0) * lotArea * selectedMonths.length
                        )}
                    </p>
                </div>

                <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl shadow-lg active:scale-95 transition-all">
                    AGREGAR AL PRESUPUESTO
                </button>
            </form>
        </Modal>
    </div>
  );
};
