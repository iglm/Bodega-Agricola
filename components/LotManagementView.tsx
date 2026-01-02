
import React, { useState, useMemo, useEffect } from 'react';
import { CostCenter, LaborLog, Movement, HarvestLog, PlannedLabor, Activity } from '../types';
import { formatCurrency, formatNumberInput, parseNumberInput } from '../services/inventoryService';
import { generateFarmStructurePDF, generateFarmStructureExcel } from '../services/reportService';
import { 
  MapPin, Ruler, TreePine, Calendar, Activity as ActivityIcon, 
  History, Sprout, Scissors, Save, X, AlertTriangle, 
  TrendingUp, Droplets, Pickaxe, CheckCircle2, MoreHorizontal,
  ArrowRight, Leaf, Target, Plus, Trash2, Sun, Zap, ShieldCheck,
  FileText, FileSpreadsheet, Clock, AlertCircle
} from 'lucide-react';
import { HeaderCard, Modal, EmptyState } from './UIElements';

interface LotManagementViewProps {
  costCenters: CostCenter[];
  laborLogs: LaborLog[];
  movements: Movement[];
  harvests: HarvestLog[];
  plannedLabors: PlannedLabor[];
  onUpdateLot: (lot: CostCenter) => void;
  onAddPlannedLabor: (labor: any) => void; 
  activities: Activity[]; 
  onAddCostCenter: (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string, associatedCrop?: string, cropAgeMonths?: number, associatedCropDensity?: number) => void;
  onDeleteCostCenter: (id: string) => void;
}

export const LotManagementView: React.FC<LotManagementViewProps> = ({
  costCenters,
  laborLogs,
  movements,
  harvests,
  plannedLabors,
  onUpdateLot,
  onAddPlannedLabor,
  activities,
  onAddCostCenter,
  onDeleteCostCenter
}) => {
  const [selectedLot, setSelectedLot] = useState<CostCenter | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showRenovateModal, setShowRenovateModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Create Lot States (Mirrored from SettingsModal)
  const [loteName, setLoteName] = useState('');
  const [loteBudget, setLoteBudget] = useState('');
  const [loteArea, setLoteArea] = useState('');
  const [loteStage, setLoteStage] = useState<'Produccion' | 'Levante' | 'Infraestructura'>('Produccion');
  const [lotePlants, setLotePlants] = useState('');
  const [loteCrop, setLoteCrop] = useState('Café');
  const [associatedCrop, setAssociatedCrop] = useState('');
  const [loteCropAge, setLoteCropAge] = useState('');
  const [associatedCropDensity, setAssociatedCropDensity] = useState('');
  const [distSurco, setDistSurco] = useState('');
  const [distPlanta, setDistPlanta] = useState('');

  // Edit States
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editPlants, setEditPlants] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editCrop, setEditCrop] = useState('');

  const commonCrops = ['Café', 'Cacao', 'Plátano', 'Banano', 'Aguacate', 'Cítricos', 'Maíz', 'Caña', 'Otro'];

  // Density Calc for Creation
  const calculatedDensityPerHa = useMemo(() => {
      const s = parseFloat(distSurco);
      const p = parseFloat(distPlanta);
      if (s > 0 && p > 0) return Math.round(10000 / (s * p));
      return 0;
  }, [distSurco, distPlanta]);

  useEffect(() => {
      const a = parseFloat(loteArea);
      if (calculatedDensityPerHa > 0 && a > 0) {
          const plants = Math.round(calculatedDensityPerHa * a);
          setLotePlants(plants.toString());
      }
  }, [calculatedDensityPerHa, loteArea]);

  // --- LOGIC: AUTO STAGE SELECTION BASED ON AGE ---
  useEffect(() => {
      const age = parseInt(loteCropAge) || 0;
      // Si la edad es mayor a 0, aplicamos la lógica. Si está vacío, dejamos manual.
      if (loteCropAge !== '') {
          if (age < 18) {
              setLoteStage('Levante');
          } else {
              setLoteStage('Produccion');
          }
      }
  }, [loteCropAge]);

  const displayDensity = calculatedDensityPerHa > 0 
      ? calculatedDensityPerHa 
      : (parseFloat(lotePlants) > 0 && parseFloat(loteArea) > 0 ? parseFloat(lotePlants) / parseFloat(loteArea) : 0);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteName.trim()) return;
    onAddCostCenter(
        loteName, 
        loteBudget ? parseNumberInput(loteBudget) : 0,
        loteArea ? parseFloat(loteArea) : undefined,
        loteStage,
        lotePlants ? parseInt(lotePlants) : undefined,
        loteCrop,
        associatedCrop || undefined,
        loteCropAge ? parseInt(loteCropAge) : undefined,
        associatedCropDensity ? parseInt(associatedCropDensity) : undefined
    );
    // Reset and close
    setLoteName(''); setLoteBudget(''); setLoteArea(''); setLotePlants(''); setAssociatedCrop('');
    setDistSurco(''); setDistPlanta(''); setLoteCropAge(''); setAssociatedCropDensity('');
    setShowCreateModal(false);
  };

  // Derived Data for Selected Lot
  const lotHistory = useMemo(() => {
    if (!selectedLot) return [];
    
    const labor = laborLogs
        .filter(l => l.costCenterId === selectedLot.id)
        .map(l => ({ type: 'LABOR', date: l.date, title: l.activityName, value: l.value, icon: Pickaxe, color: 'text-amber-500' }));
    
    const inputs = movements
        .filter(m => m.costCenterId === selectedLot.id && m.type === 'OUT')
        .map(m => ({ type: 'INPUT', date: m.date, title: `Aplicación ${m.itemName}`, value: m.calculatedCost, icon: Droplets, color: 'text-blue-500' }));
    
    const sales = harvests
        .filter(h => h.costCenterId === selectedLot.id)
        .map(h => ({ type: 'HARVEST', date: h.date, title: `Cosecha ${h.quantity} ${h.unit}`, value: h.totalValue, icon: Target, color: 'text-emerald-500' }));

    return [...labor, ...inputs, ...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedLot, laborLogs, movements, harvests]);

  const lotMetrics = useMemo(() => {
      if (!selectedLot) return { yield: 0, cost: 0 };
      const totalCost = laborLogs.filter(l => l.costCenterId === selectedLot.id).reduce((a,b)=>a+b.value,0) + 
                        movements.filter(m => m.costCenterId === selectedLot.id && m.type === 'OUT').reduce((a,b)=>a+b.calculatedCost,0);
      const totalYield = harvests.filter(h => h.costCenterId === selectedLot.id).reduce((a,b)=>a+b.quantity,0);
      return { yield: totalYield, cost: totalCost };
  }, [selectedLot, laborLogs, movements, harvests]);

  const handleOpenLot = (lot: CostCenter) => {
      setSelectedLot(lot);
      setEditName(lot.name);
      setEditArea(lot.area.toString());
      setEditPlants(lot.plantCount?.toString() || '0');
      setEditAge(lot.cropAgeMonths?.toString() || '0');
      setEditCrop(lot.cropType);
      setIsEditing(false);
  };

  const handleSaveChanges = () => {
      if (!selectedLot) return;
      
      // Auto-update stage logic on edit as well
      const newAge = parseInt(editAge) || 0;
      let newStage = selectedLot.stage;
      if (newAge < 18) newStage = 'Levante';
      else if (newAge >= 18 && selectedLot.stage !== 'Infraestructura') newStage = 'Produccion';

      const updatedLot: CostCenter = {
          ...selectedLot,
          name: editName,
          area: parseFloat(editArea),
          plantCount: parseInt(editPlants),
          cropAgeMonths: newAge,
          stage: newStage,
          cropType: editCrop,
      };
      onUpdateLot(updatedLot);
      setSelectedLot(updatedLot);
      setIsEditing(false);
  };

  const handleDelete = () => {
      if (!selectedLot) return;
      onDeleteCostCenter(selectedLot.id);
      setSelectedLot(null);
  };

  const handleRenovation = (type: 'ZOCA' | 'SIEMBRA') => {
      if (!selectedLot) return;
      
      const newLot: CostCenter = {
          ...selectedLot,
          stage: 'Levante', 
          cropAgeMonths: 0, 
          activationDate: undefined, 
          accumulatedCapex: 0, 
      };

      if (type === 'SIEMBRA') {
          newLot.plantCount = parseInt(editPlants); 
          newLot.cropType = editCrop;
      } 

      onUpdateLot(newLot);
      setSelectedLot(newLot);
      setShowRenovateModal(false);
      alert(`Lote renovado por ${type}. El estado ha cambiado a LEVANTE.`);
  };

  const currentDensity = (selectedLot?.plantCount || 0) / (selectedLot?.area || 1);
  const projectedDensity = (parseInt(editPlants) || 0) / (parseFloat(editArea) || 1);

  return (
    <div className="space-y-6 pb-24 animate-fade-in">
      <HeaderCard 
        title="Gestión Integral de Lotes"
        subtitle="Gemelo Digital de Campo"
        valueLabel="Área Total Finca"
        value={`${costCenters.reduce((a,b)=>a+b.area,0).toFixed(1)} Ha`}
        gradientClass="bg-gradient-to-r from-emerald-800 to-slate-900"
        icon={MapPin}
        onAction={() => setShowCreateModal(true)}
        actionLabel="Nuevo Lote"
        actionIcon={Plus}
        actionColorClass="bg-emerald-500 text-white hover:bg-emerald-400"
        secondaryAction={
            <div className="flex gap-2">
                <button 
                    onClick={() => generateFarmStructurePDF(costCenters)} 
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md transition-all shadow-lg active:scale-95"
                    title="Descargar Estructura (PDF)"
                >
                    <FileText className="w-5 h-5" />
                </button>
                <button 
                    onClick={() => generateFarmStructureExcel(costCenters)} 
                    className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md transition-all shadow-lg active:scale-95"
                    title="Descargar Estructura (Excel)"
                >
                    <FileSpreadsheet className="w-5 h-5" />
                </button>
            </div>
        }
      />

      {/* GRID DE LOTES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          
          {/* Add New Card */}
          <button 
            onClick={() => setShowCreateModal(true)}
            className="bg-slate-100 dark:bg-slate-900/50 p-5 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 group hover:border-emerald-500 transition-all min-h-[140px]"
          >
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform">
                  <Plus className="w-6 h-6 text-emerald-500" />
              </div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-500">Crear Lote</p>
          </button>

          {costCenters.map(lot => {
              const density = (lot.plantCount || 0) / (lot.area || 1);
              const age = lot.cropAgeMonths || 0;
              const isLevante = lot.stage === 'Levante';
              
              // --- RENOVATION LOGIC ---
              // 1. If density > 7000 (high density) -> Renovate after 60 months (5 years)
              // 2. Standard density -> Renovate after 84 months (7 years)
              let needsRenovation = false;
              let renovationReason = '';

              if (density > 7000 && age > 60) {
                  needsRenovation = true;
                  renovationReason = 'Cierre Calles (Alta Densidad)';
              } else if (age > 84) {
                  needsRenovation = true;
                  renovationReason = 'Cultivo Envejecido (>7 años)';
              }

              return (
                  <div 
                    key={lot.id} 
                    onClick={() => handleOpenLot(lot)}
                    className={`bg-white dark:bg-slate-800 p-5 rounded-[2rem] border transition-all cursor-pointer hover:shadow-xl active:scale-95 group relative overflow-hidden ${needsRenovation ? 'border-amber-500/50 dark:border-amber-500/50' : isLevante ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-700'}`}
                  >
                      {needsRenovation && (
                          <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1 z-10">
                              <Clock className="w-3 h-3" /> Renovación Sugerida
                          </div>
                      )}

                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${isLevante ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>
                                  {isLevante ? <Sprout className="w-5 h-5" /> : <TreePine className="w-5 h-5" />}
                              </div>
                              <div>
                                  <h4 className="font-black text-slate-800 dark:text-white text-sm">{lot.name}</h4>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${isLevante ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                                      {lot.stage}
                                  </span>
                              </div>
                          </div>
                          {!needsRenovation && <MoreHorizontal className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                          <div>
                              <span className="block text-[8px]">Edad</span>
                              <span className={`text-sm ${needsRenovation ? 'text-amber-500' : 'text-slate-800 dark:text-white'}`}>{age} Meses</span>
                          </div>
                          <div>
                              <span className="block text-[8px]">Población</span>
                              <span className="text-slate-800 dark:text-white text-sm">{lot.plantCount?.toLocaleString()}</span>
                          </div>
                      </div>

                      {needsRenovation && (
                          <div className="mt-2 text-[9px] text-amber-600 font-bold bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg flex items-center gap-2">
                              <AlertCircle className="w-3 h-3" /> {renovationReason}
                          </div>
                      )}
                  </div>
              );
          })}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Nuevo Lote" icon={Plus} maxWidth="max-w-xl">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
              {/* OPTIMIZADOR DE DENSIDAD */}
              <div className="bg-slate-950 p-5 rounded-[2rem] border border-slate-800 space-y-4 shadow-inner">
                  <h5 className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-2 tracking-widest"><Sun className="w-3 h-3"/> Optimizador de Arreglo Espacial</h5>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Dist. Surco (m)</label>
                          <input type="number" step="0.01" value={distSurco} onChange={e => setDistSurco(e.target.value)} placeholder="Ej: 1.5" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Dist. Planta (m)</label>
                          <input type="number" step="0.01" value={distPlanta} onChange={e => setDistPlanta(e.target.value)} placeholder="Ej: 1.0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none" />
                      </div>
                  </div>

                  {displayDensity > 0 && (
                      <div className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${displayDensity < 4500 ? 'bg-red-950/20 border-red-500/30' : displayDensity > 8000 ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-emerald-950/20 border-emerald-500/30'}`}>
                          <div className={`p-2 rounded-xl ${displayDensity < 4500 ? 'bg-red-600' : displayDensity > 8000 ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                              {displayDensity < 4500 ? <AlertTriangle className="w-5 h-5 text-white" /> : displayDensity > 8000 ? <Zap className="w-5 h-5 text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
                          </div>
                          <div>
                              <p className={`text-[10px] font-black uppercase ${displayDensity < 4500 ? 'text-red-400' : displayDensity > 8000 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                  Densidad: {displayDensity.toLocaleString(undefined, {maximumFractionDigits: 0})} árb/Ha
                              </p>
                              <p className="text-[9px] text-slate-400 leading-tight mt-1">
                                  {displayDensity < 4500 ? 'Inviabilidad Económica: El árbol no intercepta suficiente luz solar (IAF subóptimo).' : 
                                   displayDensity > 8000 ? 'Alto Rendimiento: Ciclo de vida corto. Requiere Zoca al 5to año por cierre de calles.' : 
                                   'Modelo Equilibrado: Recomendado para variedades de porte medio/alto.'}
                              </p>
                          </div>
                      </div>
                  )}
              </div>

              <input type="text" value={loteName} onChange={e => setLoteName(e.target.value)} placeholder="Nombre del Lote (Ej: La Ladera)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
              <input type="text" inputMode="decimal" value={loteBudget} onChange={e => setLoteBudget(formatNumberInput(e.target.value))} placeholder="Presupuesto Anual ($)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Área (Hectáreas)</label>
                    <input type="number" value={loteArea} onChange={e => setLoteArea(e.target.value)} placeholder="0.0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Población Total</label>
                    <input type="number" value={lotePlants} onChange={e => setLotePlants(e.target.value)} className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl p-3 text-sm text-indigo-400 font-bold" readOnly={calculatedDensityPerHa > 0} placeholder="Calculado..." />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Cultivo Principal</label>
                    <select value={loteCrop} onChange={e => setLoteCrop(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white">
                        {commonCrops.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Edad Cultivo (Meses)</label>
                  <input type="number" value={loteCropAge} onChange={e => setLoteCropAge(e.target.value)} placeholder="Ej: 24" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                </div>
              </div>
              
              <div className="bg-slate-900 p-3 rounded-xl border border-slate-700">
                  <div className="flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-black uppercase">Etapa Automática</span>
                      <span className={`text-xs font-black px-2 py-1 rounded-lg uppercase ${loteStage === 'Levante' ? 'bg-blue-600 text-white' : 'bg-emerald-600 text-white'}`}>{loteStage}</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mt-1">
                      {parseInt(loteCropAge) < 18 ? 'Menor a 18 meses: Etapa de Inversión.' : 'Mayor a 18 meses: Etapa Productiva.'}
                  </p>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Cultivo de Asocio (Sombra)</label>
                      <input type="text" value={associatedCrop} onChange={e => setAssociatedCrop(e.target.value)} placeholder="Ej: Plátano" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Densidad Asocio (sitios/Ha)</label>
                      <input type="number" value={associatedCropDensity} onChange={e => setAssociatedCropDensity(e.target.value)} placeholder="Ej: 200" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                  </div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl text-xs uppercase shadow-xl transition-all active:scale-95">Integrar Lote al Mapa</button>
          </form>
      </Modal>

      {/* DETAIL MODAL */}
      <Modal isOpen={!!selectedLot} onClose={() => setSelectedLot(null)} title={selectedLot?.name || 'Detalle Lote'} icon={MapPin} maxWidth="max-w-4xl">
          {selectedLot && (
              <div className="flex flex-col md:flex-row gap-6 h-full">
                  
                  {/* COLUMNA IZQUIERDA: ESTRUCTURA Y EDICIÓN */}
                  <div className="w-full md:w-1/3 space-y-6">
                      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 relative overflow-hidden">
                          <div className="relative z-10 space-y-4">
                              <div className="flex justify-between items-center">
                                  <h4 className="text-white font-black text-sm uppercase flex items-center gap-2"><Ruler className="w-4 h-4 text-indigo-400"/> Estructura</h4>
                                  <div className="flex gap-2">
                                      <button onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)} className={`p-2 rounded-xl transition-all ${isEditing ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-400 hover:text-white'}`}>
                                          {isEditing ? <Save className="w-4 h-4" /> : <Pickaxe className="w-4 h-4" />}
                                      </button>
                                      <button onClick={handleDelete} className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-red-500 transition-colors">
                                          <Trash2 className="w-4 h-4" />
                                      </button>
                                  </div>
                              </div>

                              <div className="space-y-3">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase">Nombre Lote</label>
                                      <input disabled={!isEditing} value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50" />
                                  </div>
                                  <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-500 uppercase">Área (Ha)</label>
                                          <input disabled={!isEditing} type="number" value={editArea} onChange={e=>setEditArea(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-500 uppercase">Árboles</label>
                                          <input disabled={!isEditing} type="number" value={editPlants} onChange={e=>setEditPlants(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50" />
                                      </div>
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase">Densidad (Calc)</label>
                                      <div className={`w-full p-2 rounded-lg text-xs font-black border ${isEditing ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-950 border-slate-800 text-emerald-400'}`}>
                                          {isEditing ? projectedDensity.toFixed(0) : currentDensity.toFixed(0)} Arb/Ha
                                      </div>
                                  </div>
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase">Edad (Meses)</label>
                                      <input disabled={!isEditing} type="number" value={editAge} onChange={e=>setEditAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50" />
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="bg-slate-100 dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800">
                          <h4 className="text-slate-500 font-black text-xs uppercase mb-3 flex items-center gap-2"><Scissors className="w-4 h-4"/> Ciclo de Vida</h4>
                          <button 
                            onClick={() => setShowRenovateModal(true)}
                            className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-xs font-black uppercase shadow-lg active:scale-95 transition-all flex items-center justify-center gap-2"
                          >
                              <Sprout className="w-4 h-4" /> Renovar Lote
                          </button>
                      </div>
                  </div>

                  {/* COLUMNA DERECHA: HISTORIAL E INTEGRACIÓN */}
                  <div className="w-full md:w-2/3 flex flex-col gap-6">
                      
                      {/* KPI CARDS */}
                      <div className="grid grid-cols-2 gap-4">
                          <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-2xl">
                              <p className="text-[10px] font-black text-emerald-600 uppercase">Producción Histórica</p>
                              <p className="text-xl font-mono font-black text-emerald-500">{formatNumberInput(lotMetrics.yield)} Kg</p>
                          </div>
                          <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-2xl">
                              <p className="text-[10px] font-black text-red-600 uppercase">Costo Acumulado</p>
                              <p className="text-xl font-mono font-black text-red-500">{formatCurrency(lotMetrics.cost)}</p>
                          </div>
                      </div>

                      {/* TABS DE HISTORIAL */}
                      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                              <h4 className="font-black text-slate-700 dark:text-white text-sm uppercase flex items-center gap-2">
                                  <History className="w-4 h-4 text-indigo-500" /> Bitácora de Campo
                              </h4>
                              <span className="text-[9px] font-bold text-slate-400 bg-slate-200 dark:bg-slate-800 px-2 py-1 rounded-full">{lotHistory.length} Eventos</span>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 max-h-80">
                              {lotHistory.length === 0 ? (
                                  <EmptyState icon={Leaf} message="Sin registros en este lote" />
                              ) : (
                                  lotHistory.map((item, idx) => (
                                      <div key={idx} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                          <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900 ${item.color}`}>
                                              <item.icon className="w-4 h-4" />
                                          </div>
                                          <div className="flex-1">
                                              <p className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</p>
                                              <p className="text-[9px] text-slate-400 uppercase font-bold">{new Date(item.date).toLocaleDateString()}</p>
                                          </div>
                                          <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{formatCurrency(item.value)}</p>
                                      </div>
                                  ))
                              )}
                          </div>
                      </div>

                      {/* QUICK ACTION */}
                      <div className="grid grid-cols-2 gap-3">
                          <button className="py-3 rounded-xl border border-dashed border-slate-400 text-slate-500 hover:text-indigo-500 hover:border-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all text-xs font-black uppercase flex items-center justify-center gap-2">
                              <Calendar className="w-4 h-4" /> Programar Labor
                          </button>
                          <button className="py-3 rounded-xl border border-dashed border-slate-400 text-slate-500 hover:text-emerald-500 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-xs font-black uppercase flex items-center justify-center gap-2">
                              <Droplets className="w-4 h-4" /> Aplicar Insumo
                          </button>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

      {/* MODAL DE RENOVACIÓN */}
      <Modal isOpen={showRenovateModal} onClose={() => setShowRenovateModal(false)} title="Renovación de Lote" icon={Sprout}>
          <div className="space-y-6">
              <div className="bg-amber-100 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200 text-xs">
                  <p className="font-bold flex items-center gap-2 mb-1"><AlertTriangle className="w-4 h-4"/> Advertencia</p>
                  <p>Renovar el lote reiniciará su <strong>Edad a 0 meses</strong> y cambiará la etapa a <strong>Levante</strong>. El historial financiero se mantiene, pero se inicia un nuevo ciclo de inversión (CAPEX).</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleRenovation('ZOCA')} className="bg-slate-800 hover:bg-slate-700 p-5 rounded-2xl border border-slate-600 text-center group active:scale-95 transition-all">
                      <Scissors className="w-8 h-8 text-amber-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-black uppercase text-sm">Por Zoca</p>
                      <p className="text-[9px] text-slate-400 mt-1">Mantiene densidad y variedad. Menor costo.</p>
                  </button>
                  <button onClick={() => handleRenovation('SIEMBRA')} className="bg-slate-800 hover:bg-slate-700 p-5 rounded-2xl border border-slate-600 text-center group active:scale-95 transition-all">
                      <Sprout className="w-8 h-8 text-emerald-500 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-white font-black uppercase text-sm">Siembra Nueva</p>
                      <p className="text-[9px] text-slate-400 mt-1">Permite cambiar densidad y variedad. Mayor inversión.</p>
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};
