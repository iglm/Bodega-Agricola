import React, { useState, useMemo, useEffect, useRef } from 'react';
import { CostCenter, LaborLog, Movement, HarvestLog, PlannedLabor, Activity } from '../types';
import { formatCurrency, formatNumberInput, parseNumberInput, convertToBase } from '../services/inventoryService';
import { generateFarmStructurePDF, generateFarmStructureExcel } from '../services/reportService';
import { parseSicaPdf } from '../services/sicaParserService';
import { 
  MapPin, Ruler, TreePine, Calendar, Activity as ActivityIcon, 
  History, Sprout, Scissors, Save, X, AlertTriangle, 
  TrendingUp, Droplets, Pickaxe, CheckCircle2, MoreHorizontal,
  ArrowRight, Leaf, Target, Plus, Trash2, Sun, Zap, ShieldCheck,
  FileText, FileSpreadsheet, Clock, AlertCircle, Flower2, AlignJustify,
  FileUp, RefreshCw
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
  onAddCostCenter: (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string, associatedCrop?: string, cropAgeMonths?: number, associatedCropDensity?: number, associatedCropAge?: number) => void;
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // --- CREATE LOT STATES ---
  const [loteName, setLoteName] = useState('');
  const [loteBudget, setLoteBudget] = useState('');
  const [loteArea, setLoteArea] = useState('');
  const [loteStage, setLoteStage] = useState<'Produccion' | 'Levante' | 'Infraestructura'>('Produccion');
  const [lotePlants, setLotePlants] = useState('');
  const [loteDensity, setLoteDensity] = useState(''); // Nuevo para creación
  const [loteCrop, setLoteCrop] = useState('Café');
  const [loteCropAge, setLoteCropAge] = useState('');
  
  const [associatedCrop, setAssociatedCrop] = useState(''); 
  const [associatedCropName, setAssociatedCropName] = useState(''); 
  const [associatedCropAge, setAssociatedCropAge] = useState('');
  const [associatedCropDensity, setAssociatedCropDensity] = useState('');

  const [distSurco, setDistSurco] = useState('');
  const [distPlanta, setDistPlanta] = useState('');

  // --- EDIT STATES ---
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editPlants, setEditPlants] = useState('');
  const [editAge, setEditAge] = useState('');
  const [editCrop, setEditCrop] = useState('');
  const [editAssociatedCrop, setEditAssociatedCrop] = useState('');
  const [editDensity, setEditDensity] = useState(''); 

  const commonCrops = ['Café', 'Plátano', 'Banano', 'Otro'];

  const getCropSpecs = (crop: string) => {
      const isMusaceae = crop === 'Plátano' || crop === 'Banano';
      if (isMusaceae) {
        return { label: 'Sitios / Plantas', densityLow: 1000, densityHigh: 3000, productionAge: 9, densityUnit: 'Sitios/Ha' };
      }
      return { label: 'Árboles', densityLow: 4000, densityHigh: 8000, productionAge: 18, densityUnit: 'Árb/Ha' };
  };

  const currentSpecs = getCropSpecs(loteCrop);

  // --- LOGIC: AUTO-SYNC FUNCTIONS ---
  
  // Sync for Edit Modal
  const handleEditDensityChange = (val: string) => {
      setEditDensity(val);
      const dens = parseFloat(val) || 0;
      const area = parseFloat(editArea) || 0;
      if (dens >= 0 && area > 0) {
          setEditPlants(Math.round(dens * area).toString());
      }
  };

  const handleEditPlantsChange = (val: string) => {
      setEditPlants(val);
      const plants = parseFloat(val) || 0;
      const area = parseFloat(editArea) || 0;
      if (plants >= 0 && area > 0) {
          setEditDensity((plants / area).toFixed(0));
      }
  };

  const handleEditAreaChange = (val: string) => {
      setEditArea(val);
      const area = parseFloat(val) || 0;
      const dens = parseFloat(editDensity) || 0;
      if (area > 0 && dens > 0) {
          setEditPlants(Math.round(area * dens).toString());
      }
  };

  // Sync for Create Modal
  const handleLoteDensityChange = (val: string) => {
      setLoteDensity(val);
      const dens = parseFloat(val) || 0;
      const area = parseFloat(loteArea) || 0;
      if (dens >= 0 && area > 0) {
          setLotePlants(Math.round(dens * area).toString());
      }
  };

  const handleLotePlantsChange = (val: string) => {
      setLotePlants(val);
      const plants = parseFloat(val) || 0;
      const area = parseFloat(loteArea) || 0;
      if (plants >= 0 && area > 0) {
          setLoteDensity((plants / area).toFixed(0));
      }
  };

  const handleLoteAreaChange = (val: string) => {
      setLoteArea(val);
      const area = parseFloat(val) || 0;
      const dens = parseFloat(loteDensity) || 0;
      if (area > 0 && dens > 0) {
          setLotePlants(Math.round(area * dens).toString());
      }
  };

  const calculatedDensityPerHa = useMemo(() => {
      const s = parseFloat(distSurco);
      const p = parseFloat(distPlanta);
      if (s > 0 && p > 0) return Math.round(10000 / (s * p));
      return 0;
  }, [distSurco, distPlanta]);

  // Update density based on spacing if changed
  useEffect(() => {
    if (calculatedDensityPerHa > 0) {
        setLoteDensity(calculatedDensityPerHa.toString());
        const area = parseFloat(loteArea) || 0;
        if (area > 0) setLotePlants(Math.round(calculatedDensityPerHa * area).toString());
    }
  }, [calculatedDensityPerHa, loteArea]);

  useEffect(() => {
      const age = parseInt(loteCropAge) || 0;
      if (loteCropAge !== '') {
          if (age < currentSpecs.productionAge) setLoteStage('Levante');
          else setLoteStage('Produccion');
      }
  }, [loteCropAge, currentSpecs]);

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteName.trim()) return;
    let finalAssociatedName = associatedCrop === 'Otro' ? associatedCropName : associatedCrop;
    onAddCostCenter(loteName, loteBudget ? parseNumberInput(loteBudget) : 0, loteArea ? parseFloat(loteArea) : undefined, loteStage, lotePlants ? parseInt(lotePlants) : undefined, loteCrop, finalAssociatedName || undefined, loteCropAge ? parseInt(loteCropAge) : undefined, associatedCropDensity ? parseInt(associatedCropDensity) : undefined, associatedCropAge ? parseInt(associatedCropAge) : undefined);
    setLoteName(''); setLoteBudget(''); setLoteArea(''); setLotePlants(''); setLoteDensity(''); setAssociatedCrop(''); setAssociatedCropName(''); setAssociatedCropAge(''); setAssociatedCropDensity(''); setDistSurco(''); setDistPlanta(''); setLoteCropAge('');
    setShowCreateModal(false);
  };

  const handleSicaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const result = await parseSicaPdf(file);
          result.lots.forEach(lot => {
              const stage = lot.age >= 1.5 ? 'Produccion' : 'Levante';
              // FIX: Corrected lot.plants to lot.trees as plants property does not exist on SicaLot
              onAddCostCenter(`Lote ${lot.id} - ${lot.variety}`, 0, lot.area, stage, lot.trees, 'Café', undefined, Math.round(lot.age * 12), lot.density, undefined);
          });
          alert(`✅ Importación Exitosa.`);
      } catch (error) { alert("❌ Error al procesar SICA."); }
  };

  const lotHistory = useMemo(() => {
    if (!selectedLot) return [];
    const labor = laborLogs.filter(l => l.costCenterId === selectedLot.id).map(l => ({ type: 'LABOR', date: l.date, title: l.activityName, value: l.value, icon: Pickaxe, color: 'text-amber-500' }));
    const inputs = movements.filter(m => m.costCenterId === selectedLot.id && m.type === 'OUT').map(m => ({ type: 'INPUT', date: m.date, title: `Aplicación ${m.itemName}`, value: m.calculatedCost, icon: Droplets, color: 'text-blue-500' }));
    const sales = harvests.filter(h => h.costCenterId === selectedLot.id).map(h => ({ type: 'HARVEST', date: h.date, title: `Cosecha ${h.quantity} ${h.unit}`, value: h.totalValue, icon: Target, color: 'text-emerald-500' }));
    return [...labor, ...inputs, ...sales].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [selectedLot, laborLogs, movements, harvests]);

  const lotMetrics = useMemo(() => {
      if (!selectedLot) return { yield: 0, cost: 0, unitCost: 0 };
      const totalCost = laborLogs.filter(l => l.costCenterId === selectedLot.id).reduce((a,b)=>a+b.value,0) + movements.filter(m => m.costCenterId === selectedLot.id && m.type === 'OUT').reduce((a,b)=>a+b.calculatedCost,0);
      const totalYield = harvests.filter(h => h.costCenterId === selectedLot.id).reduce((a,b)=>a+b.quantity,0);
      return { yield: totalYield, cost: totalCost, unitCost: totalYield > 0 ? totalCost / totalYield : 0 };
  }, [selectedLot, laborLogs, movements, harvests]);

  const handleOpenLot = (lot: CostCenter) => {
      setSelectedLot(lot);
      setEditName(lot.name);
      setEditArea(lot.area.toString());
      setEditPlants(lot.plantCount?.toString() || '0');
      setEditAge(lot.cropAgeMonths?.toString() || '0');
      setEditCrop(lot.cropType);
      setEditAssociatedCrop(lot.associatedCrop || '');
      const initialDensity = lot.area > 0 ? (lot.plantCount || 0) / lot.area : 0;
      setEditDensity(initialDensity.toFixed(0));
      setIsEditing(false);
  };

  const handleSaveChanges = () => {
      if (!selectedLot) return;
      const newAge = parseInt(editAge) || 0;
      const specs = getCropSpecs(editCrop);
      const newStage: 'Produccion' | 'Levante' | 'Infraestructura' = newAge < specs.productionAge ? 'Levante' : 'Produccion';
      const updatedLot: CostCenter = { ...selectedLot, name: editName, area: parseFloat(editArea), plantCount: parseInt(editPlants), cropAgeMonths: newAge, stage: newStage, cropType: editCrop, associatedCrop: editAssociatedCrop || undefined };
      onUpdateLot(updatedLot);
      setSelectedLot(updatedLot);
      setIsEditing(false);
  };

  // FIX: Implemented handleRenovation function which was missing
  const handleRenovation = (type: 'ZOCA' | 'SIEMBRA') => {
      if (!selectedLot) return;
      const updatedLot: CostCenter = {
          ...selectedLot,
          stage: 'Levante',
          cropAgeMonths: 0,
          activationDate: undefined,
          assetValue: undefined,
          accumulatedCapex: 0
      };
      onUpdateLot(updatedLot);
      setShowRenovateModal(false);
      setSelectedLot(updatedLot);
      alert(`Lote renovado vía ${type}. El lote ha regresado a etapa de Levante.`);
  };

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
        secondaryAction={
            <div className="flex gap-2">
                <button onClick={() => fileInputRef.current?.click()} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md transition-all shadow-lg active:scale-95"><FileUp className="w-5 h-5" /></button>
                <button onClick={() => generateFarmStructurePDF(costCenters)} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md transition-all shadow-lg active:scale-95"><FileText className="w-5 h-5" /></button>
                <button onClick={() => generateFarmStructureExcel(costCenters)} className="p-3 bg-white/20 hover:bg-white/30 rounded-xl text-white backdrop-blur-md transition-all shadow-lg active:scale-95"><FileSpreadsheet className="w-5 h-5" /></button>
            </div>
        }
      />
      
      <input type="file" ref={fileInputRef} className="hidden" accept=".pdf" onChange={handleSicaUpload} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button onClick={() => setShowCreateModal(true)} className="bg-slate-100 dark:bg-slate-900/50 p-5 rounded-[2rem] border border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center gap-2 group hover:border-emerald-500 transition-all min-h-[140px]">
              <div className="p-3 bg-white dark:bg-slate-800 rounded-full shadow-sm group-hover:scale-110 transition-transform"><Plus className="w-6 h-6 text-emerald-500" /></div>
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest group-hover:text-emerald-500">Crear Lote</p>
          </button>

          {costCenters.map(lot => {
              const density = (lot.plantCount || 0) / (lot.area || 1);
              const age = lot.cropAgeMonths || 0;
              const isLevante = lot.stage === 'Levante';
              const specs = getCropSpecs(lot.cropType);
              let needsRenovation = (density > specs.densityHigh && age > 60) || (age > (specs.productionAge + 72));
              return (
                  <div key={lot.id} onClick={() => handleOpenLot(lot)} className={`bg-white dark:bg-slate-800 p-5 rounded-[2rem] border transition-all cursor-pointer hover:shadow-xl active:scale-95 group relative overflow-hidden ${needsRenovation ? 'border-amber-500/50' : isLevante ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                      <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shadow-md ${isLevante ? 'bg-blue-500 text-white' : 'bg-emerald-500 text-white'}`}>{isLevante ? <Sprout className="w-5 h-5" /> : <TreePine className="w-5 h-5" />}</div>
                              <div>
                                  <h4 className="font-black text-slate-800 dark:text-white text-sm">{lot.name}</h4>
                                  <span className={`text-[9px] font-black px-2 py-0.5 rounded-full uppercase ${isLevante ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>{lot.stage}</span>
                              </div>
                          </div>
                          <MoreHorizontal className="text-slate-400 group-hover:text-slate-600 dark:group-hover:text-white" />
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase mt-4 bg-slate-50 dark:bg-slate-900/50 p-3 rounded-xl">
                          <div><span className="block text-[8px]">{lot.cropType}</span><span className="text-slate-800 dark:text-white text-sm">{age} Meses</span></div>
                          <div><span className="block text-[8px]">{specs.label}</span><span className="text-slate-800 dark:text-white text-sm">{lot.plantCount?.toLocaleString()}</span></div>
                      </div>
                  </div>
              );
          })}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Nuevo Lote" icon={Plus} maxWidth="max-w-xl">
          <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="bg-slate-950 p-5 rounded-[2rem] border border-slate-800 space-y-4 shadow-inner">
                  <h5 className="text-[10px] font-black text-indigo-400 uppercase flex items-center gap-2 tracking-widest"><Sun className="w-3 h-3"/> Arreglo Espacial</h5>
                  <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Dist. Surco (m)</label>
                          <input type="number" step="0.01" value={distSurco} onChange={e => setDistSurco(e.target.value)} placeholder="Ej: 1.5" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                      </div>
                      <div className="space-y-1">
                          <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Dist. Planta (m)</label>
                          <input type="number" step="0.01" value={distPlanta} onChange={e => setDistPlanta(e.target.value)} placeholder="Ej: 1.0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white outline-none focus:border-indigo-500" />
                      </div>
                  </div>
              </div>

              <input type="text" value={loteName} onChange={e => setLoteName(e.target.value)} placeholder="Nombre del Lote" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white focus:border-emerald-500" required />
              
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Área (Ha)</label>
                    <input type="number" step="0.01" value={loteArea} onChange={e => handleLoteAreaChange(e.target.value)} placeholder="0.0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                </div>
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-indigo-400 uppercase ml-2">Densidad (Árb/Ha)</label>
                    <input type="number" value={loteDensity} onChange={e => handleLoteDensityChange(e.target.value)} placeholder="0" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-indigo-400 font-mono font-black" />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Población Total ({currentSpecs.label})</label>
                <input type="number" value={lotePlants} onChange={e => handleLotePlantsChange(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white font-bold" placeholder="Calculado..." />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Cultivo Principal</label>
                    <select value={loteCrop} onChange={e => setLoteCrop(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-xs font-bold text-white">
                        {commonCrops.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                </div>
                <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase ml-1">Edad (Meses)</label><input type="number" value={loteCropAge} onChange={e => setLoteCropAge(e.target.value)} placeholder="0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" /></div>
              </div>

              <button type="submit" className="w-full bg-indigo-600 text-white font-black py-4 rounded-xl text-xs uppercase shadow-xl transition-all active:scale-95">Integrar Lote al Mapa</button>
          </form>
      </Modal>

      {/* DETAIL MODAL CON DENSIDAD EDITABLE SÍNCRONA */}
      <Modal isOpen={!!selectedLot} onClose={() => setSelectedLot(null)} title={isEditing ? 'Editando Lote' : (selectedLot?.name || 'Detalle Lote')} icon={MapPin} maxWidth="max-w-4xl">
          {selectedLot && (
              <div className="flex flex-col md:flex-row gap-6 h-full">
                  <div className="w-full md:w-1/3 space-y-6">
                      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-700 relative overflow-hidden shadow-xl">
                          <div className="relative z-10 space-y-4">
                              <div className="flex justify-between items-center mb-2">
                                  <h4 className="text-indigo-400 font-black text-xs uppercase flex items-center gap-2"><Ruler className="w-4 h-4"/> Configuración</h4>
                                  <button onClick={() => isEditing ? handleSaveChanges() : setIsEditing(true)} className={`p-2 px-4 rounded-xl transition-all font-black text-xs uppercase flex items-center gap-2 ${isEditing ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}>
                                      {isEditing ? <><Save className="w-4 h-4" /> Guardar</> : <><Pickaxe className="w-4 h-4" /> Editar</>}
                                  </button>
                              </div>

                              <div className="space-y-3">
                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase">Nombre Lote</label>
                                      <input disabled={!isEditing} value={editName} onChange={e=>setEditName(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold focus:border-indigo-500 outline-none disabled:opacity-50" />
                                  </div>
                                  
                                  <div className="grid grid-cols-2 gap-2">
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-500 uppercase">Área (Ha)</label>
                                          <input disabled={!isEditing} type="number" step="0.01" value={editArea} onChange={e=>handleEditAreaChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50 focus:border-indigo-500 outline-none" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-500 uppercase">Población</label>
                                          <input disabled={!isEditing} type="number" value={editPlants} onChange={e=>handleEditPlantsChange(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50 focus:border-indigo-500 outline-none" />
                                      </div>
                                  </div>

                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase">Densidad (Árb/Ha)</label>
                                      <div className="relative">
                                          <input 
                                              disabled={!isEditing} 
                                              type="number" 
                                              value={editDensity} 
                                              onChange={e => handleEditDensityChange(e.target.value)} 
                                              className={`w-full bg-slate-950 border rounded-xl p-3 font-mono font-black text-center outline-none transition-all ${isEditing ? 'border-indigo-500/50 text-indigo-400 focus:ring-1 focus:ring-indigo-500' : 'border-slate-800 text-emerald-400 opacity-80'}`} 
                                          />
                                          {isEditing && <RefreshCw className="absolute right-3 top-3 w-4 h-4 text-indigo-500/50 animate-pulse" />}
                                      </div>
                                      {isEditing && <p className="text-[8px] text-slate-500 italic text-center mt-1">Sincroniza automáticamente con la Población.</p>}
                                  </div>

                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase">Cultivo Principal</label>
                                      <select disabled={!isEditing} value={editCrop} onChange={e=>setEditCrop(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50 focus:border-indigo-500 outline-none">
                                          {commonCrops.map(c => <option key={c} value={c}>{c}</option>)}
                                      </select>
                                  </div>

                                  <div className="space-y-1"><label className="text-[9px] font-black text-slate-500 uppercase">Edad (Meses)</label><input disabled={!isEditing} type="number" value={editAge} onChange={e=>setEditAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50 focus:border-indigo-500 outline-none" /></div>
                              </div>
                          </div>
                      </div>
                      
                      <div className="bg-slate-100 dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 grid grid-cols-2 gap-3">
                          <button onClick={() => setShowRenovateModal(true)} className="py-3 bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900/50 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center gap-1"><Sprout className="w-4 h-4" /> Renovar</button>
                          <button onClick={() => { if(confirm('¿Eliminar lote?')) { onDeleteCostCenter(selectedLot.id); setSelectedLot(null); } }} className="py-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-900/50 rounded-xl text-[10px] font-black uppercase transition-all flex flex-col items-center justify-center gap-1"><Trash2 className="w-4 h-4" /> Eliminar</button>
                      </div>
                  </div>

                  <div className="w-full md:w-2/3 flex flex-col gap-6">
                      <div className="grid grid-cols-3 gap-4">
                          <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-emerald-600 uppercase">Producción Histórica</p><p className="text-xl font-mono font-black text-emerald-500">{formatNumberInput(lotMetrics.yield)} {selectedLot.cropType === 'Café' ? 'Kg' : 'Und'}</p></div>
                          <div className="bg-red-900/10 border border-red-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-red-600 uppercase">Costo Acumulado</p><p className="text-xl font-mono font-black text-red-500">{formatCurrency(lotMetrics.cost)}</p></div>
                          <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-2xl">
                              <p className="text-[10px] font-black text-blue-600 uppercase">Costo Unitario Real</p>
                              <p className="text-xl font-mono font-black text-blue-500">{lotMetrics.yield > 0 ? formatCurrency(lotMetrics.unitCost) : 'Sin Cosecha'}</p>
                          </div>
                      </div>
                      <div className="flex-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-3xl overflow-hidden flex flex-col">
                          <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                              <h4 className="font-black text-slate-700 dark:text-white text-sm uppercase flex items-center gap-2"><History className="w-4 h-4 text-indigo-500" /> Bitácora de Campo</h4>
                          </div>
                          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3 max-h-80">
                              {lotHistory.length === 0 ? <EmptyState icon={Leaf} message="Sin registros" /> : lotHistory.map((item, idx) => (
                                  <div key={idx} className="flex items-center gap-3 p-3 rounded-xl border border-transparent hover:border-slate-200 dark:hover:border-slate-700">
                                      <div className={`p-2 rounded-lg bg-slate-100 dark:bg-slate-900 ${item.color}`}><item.icon className="w-4 h-4" /></div>
                                      <div className="flex-1"><p className="text-xs font-bold text-slate-800 dark:text-white">{item.title}</p><p className="text-[9px] text-slate-400 uppercase font-bold">{new Date(item.date).toLocaleDateString()}</p></div>
                                      <p className="text-xs font-mono font-bold text-slate-600 dark:text-slate-300">{formatCurrency(item.value)}</p>
                                  </div>
                              ))}
                          </div>
                      </div>
                  </div>
              </div>
          )}
      </Modal>

      {/* RENOVAR MODAL (Snippet) */}
      <Modal isOpen={showRenovateModal} onClose={() => setShowRenovateModal(false)} title="Renovación de Lote" icon={Sprout}>
          <div className="grid grid-cols-2 gap-4">
              <button onClick={() => handleRenovation('ZOCA')} className="bg-slate-800 p-5 rounded-2xl border border-slate-600 text-center"><Scissors className="w-8 h-8 text-amber-500 mx-auto mb-2"/><p className="text-white font-black uppercase text-sm">Zoca</p></button>
              <button onClick={() => handleRenovation('SIEMBRA')} className="bg-slate-800 p-5 rounded-2xl border border-slate-600 text-center"><Sprout className="w-8 h-8 text-emerald-500 mx-auto mb-2"/><p className="text-white font-black uppercase text-sm">Siembra</p></button>
          </div>
      </Modal>
    </div>
  );
};