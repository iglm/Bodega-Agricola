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
  FileUp, RefreshCw, AlertOctagon, Calculator, MoveHorizontal, ArrowLeftRight,
  LayoutGrid, Triangle, MousePointer2, RefreshCcw, Info, BookOpen
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
  onAddCostCenter: (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string, associatedCrop?: string, cropAgeMonths?: number, associatedCropDensity?: number, associatedCropAge?: number, variety?: string) => void;
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
  
  // --- ZOCA TYPES STATE ---
  const [zocaType, setZocaType] = useState<'TRADICIONAL' | 'PULMON' | 'CALAVERA'>('TRADICIONAL');
  const [includeReseeding, setIncludeReseeding] = useState(false);

  // --- CREATE LOT STATES ---
  const [loteName, setLoteName] = useState('');
  const [loteBudget, setLoteBudget] = useState('');
  const [loteArea, setLoteArea] = useState('');
  const [loteStage, setLoteStage] = useState<'Produccion' | 'Levante' | 'Infraestructura'>('Produccion');
  const [lotePlants, setLotePlants] = useState('');
  const [loteDensity, setLoteDensity] = useState(''); 
  const [loteCrop, setLoteCrop] = useState('Café');
  const [loteVariety, setLoteVariety] = useState(''); 
  
  // --- DENSITY CALCULATOR STATE ---
  const [densityMode, setDensityMode] = useState<'DIRECT' | 'CALC'>('DIRECT');
  const [layoutType, setLayoutType] = useState<'SQUARE' | 'TRIANGLE'>('SQUARE');
  const [calcDistSurco, setCalcDistSurco] = useState('');
  const [calcDistPlanta, setCalcDistPlanta] = useState('');

  // Date & Age Logic Main Crop
  const [originType, setOriginType] = useState<'SIEMBRA_NUEVA' | 'RENOVACION_SIEMBRA' | 'ZOCA'>('SIEMBRA_NUEVA');
  const [startDate, setStartDate] = useState(''); // Fecha exacta
  const [calculatedAge, setCalculatedAge] = useState(0);

  // Associated Crop
  const [associatedCrop, setAssociatedCrop] = useState('Ninguno'); 
  const [customAssocName, setCustomAssocName] = useState(''); // Para "Otro"
  const [assocStartDate, setAssocStartDate] = useState('');
  const [assocCalculatedAge, setAssocCalculatedAge] = useState(0);
  const [associatedCropDensity, setAssociatedCropDensity] = useState('');
  const [associatedCropPlants, setAssociatedCropPlants] = useState(''); // Población asocio

  // Layout
  const [distSurco, setDistSurco] = useState('');
  const [distPlanta, setDistPlanta] = useState('');

  // --- EDIT STATES ---
  const [editName, setEditName] = useState('');
  const [editArea, setEditArea] = useState('');
  const [editPlants, setEditPlants] = useState('');
  const [editAge, setEditAge] = useState(''); // Mantiene edad en meses para visualización
  const [editCrop, setEditCrop] = useState('');
  const [editVariety, setEditVariety] = useState(''); 
  const [editDensity, setEditDensity] = useState(''); 
  const [editAssociatedCrop, setEditAssociatedCrop] = useState('');
  const [editCustomAssocName, setEditCustomAssocName] = useState('');
  const [editAssocAge, setEditAssocAge] = useState('');
  const [editAssocDensity, setEditAssocDensity] = useState('');

  const commonCrops = ['Café', 'Plátano', 'Banano', 'Cacao', 'Aguacate', 'Otro'];
  const associatedOptions = ['Ninguno', 'Plátano', 'Banano', 'Nogal', 'Guamo', 'Maíz', 'Frijol', 'Otro'];

  const getCropSpecs = (crop: string) => {
      const isMusaceae = crop === 'Plátano' || crop === 'Banano';
      if (isMusaceae) {
        return { label: 'Sitios / Plantas', densityLow: 1000, densityHigh: 3000, productionAge: 9, densityUnit: 'Sitios/Ha' };
      }
      return { label: 'Árboles', densityLow: 4000, densityHigh: 8000, productionAge: 18, densityUnit: 'Árb/Ha' };
  };

  const currentSpecs = getCropSpecs(loteCrop);

  // --- HELPER: PHENOLOGICAL STAGE ---
  const getPhenologicalStage = (crop: string, months: number): string | null => {
      // Lógica Café
      if (crop === 'Café' || crop === 'Cafe') {
          if (months <= 12) return 'Vegetativo / Almácigo';
          if (months <= 18) return 'Pre-producción / Floración';
          if (months <= 84) return 'Producción Plena'; // 7 Años
          return 'Senescencia / Renovar';
      }
      // Lógica Musáceas
      if (crop === 'Plátano' || crop === 'Banano') {
          if (months < 6) return 'Levante Vegetativo';
          if (months < 9) return 'Diferenciación Floral';
          return 'Producción / Racimo';
      }
      return null;
  };

  // --- HELPER: DATE CALCULATION ---
  const calculateMonths = (dateString: string): number => {
      if (!dateString) return 0;
      const start = new Date(dateString);
      const now = new Date();
      const diffMonths = (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth());
      return diffMonths > 0 ? diffMonths : 0;
  };

  // --- SYNC EFFECTS (CREATE) ---
  useEffect(() => {
      setCalculatedAge(calculateMonths(startDate));
  }, [startDate]);

  useEffect(() => {
      setAssocCalculatedAge(calculateMonths(assocStartDate));
  }, [assocStartDate]);

  // Sync Density Logic (Advanced Calculator)
  useEffect(() => {
      if (densityMode === 'CALC') {
          const surco = parseNumberInput(calcDistSurco);
          const planta = parseNumberInput(calcDistPlanta);
          
          if (layoutType === 'SQUARE') {
              // Cuadro / Rectángulo: 10,000 / (d1 * d2)
              if (surco > 0 && planta > 0) {
                  const dens = Math.round(10000 / (surco * planta));
                  setLoteDensity(formatNumberInput(dens));
              }
          } else {
              // Triángulo (Tresbolillo): (10,000 / d^2) * 1.154
              // Asumimos triángulo equilátero donde d = distancia entre sitios
              if (planta > 0) {
                  const dens = Math.round((10000 / (planta * planta)) * 1.154);
                  setLoteDensity(formatNumberInput(dens));
              }
          }
      }
  }, [calcDistSurco, calcDistPlanta, densityMode, layoutType]);

  // Sync Plants based on Density and Area
  useEffect(() => {
      const dens = parseNumberInput(loteDensity) || 0;
      const area = parseNumberInput(loteArea) || 0;
      if (dens > 0 && area > 0) setLotePlants(formatNumberInput(Math.round(dens * area)));
  }, [loteDensity, loteArea]);

  // Sync Density Associated
  useEffect(() => {
      const dens = parseNumberInput(associatedCropDensity) || 0;
      const area = parseNumberInput(loteArea) || 0;
      if (dens > 0 && area > 0) setAssociatedCropPlants(formatNumberInput(Math.round(dens * area)));
  }, [associatedCropDensity, loteArea]);

  // Determine Stage based on Age
  useEffect(() => {
      if (calculatedAge > 0) {
          if (calculatedAge < currentSpecs.productionAge) setLoteStage('Levante');
          else setLoteStage('Produccion');
      }
  }, [calculatedAge, currentSpecs]);

  // --- SYNC FUNCTIONS (EDIT) ---
  const handleEditDensityChange = (val: string) => {
      setEditDensity(val);
      const dens = parseNumberInput(val) || 0;
      const area = parseNumberInput(editArea) || 0;
      if (dens >= 0 && area > 0) setEditPlants(formatNumberInput(Math.round(dens * area)));
  };

  const handleEditPlantsChange = (val: string) => {
      setEditPlants(val);
      const plants = parseNumberInput(val) || 0;
      const area = parseNumberInput(editArea) || 0;
      if (plants >= 0 && area > 0) setEditDensity(formatNumberInput((plants / area).toFixed(0)));
  };
  
  const handleEditAreaChange = (val: string) => {
      setEditArea(val);
      const area = parseNumberInput(val) || 0;
      const dens = parseNumberInput(editDensity) || 0;
      if (area > 0 && dens > 0) {
          setEditPlants(formatNumberInput(Math.round(area * dens)));
      }
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteName.trim()) return;
    
    // Determinar nombre final del asocio
    let finalAssocName: string | undefined = undefined;
    if (associatedCrop !== 'Ninguno') {
        finalAssocName = associatedCrop === 'Otro' ? customAssocName : associatedCrop;
    }

    onAddCostCenter(
        loteName, 
        0, 
        parseNumberInput(loteArea) || 0, 
        loteStage, 
        parseNumberInput(lotePlants) || 0, 
        loteCrop, 
        finalAssocName, 
        calculatedAge, 
        associatedCrop !== 'Ninguno' ? (parseNumberInput(associatedCropDensity) || 0) : undefined, 
        associatedCrop !== 'Ninguno' ? assocCalculatedAge : undefined,
        loteVariety // Pass variety
    );
    
    // Reset
    setLoteName(''); setLoteArea(''); setLotePlants(''); setLoteDensity(''); setLoteVariety('');
    setAssociatedCrop('Ninguno'); setCustomAssocName(''); setStartDate(''); setAssocStartDate(''); setAssociatedCropDensity(''); 
    setCalcDistSurco(''); setCalcDistPlanta(''); setDensityMode('DIRECT'); setLayoutType('SQUARE');
    setOriginType('SIEMBRA_NUEVA');
    setShowCreateModal(false);
  };

  const handleSicaUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      try {
          const result = await parseSicaPdf(file);
          result.lots.forEach(lot => {
              const stage = lot.age >= 18 ? 'Produccion' : 'Levante';
              onAddCostCenter(
                  `Lote ${lot.id} - ${lot.variety}`, 
                  0, lot.area, stage, lot.trees, 'Café', 
                  lot.associatedCrop, lot.age, 
                  undefined, undefined,
                  lot.variety // Pass variety from SICA
              );
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
      setEditArea(formatNumberInput(lot.area));
      setEditPlants(formatNumberInput(lot.plantCount || '0'));
      setEditAge(lot.cropAgeMonths?.toString() || '0');
      setEditCrop(lot.cropType);
      setEditVariety(lot.variety || ''); // Initialize variety
      
      const initialDensity = lot.area > 0 ? (lot.plantCount || 0) / lot.area : 0;
      setEditDensity(formatNumberInput(initialDensity.toFixed(0)));

      // Lógica para detectar si es un cultivo "Otro"
      const isStandard = associatedOptions.includes(lot.associatedCrop || 'Ninguno');
      if (isStandard) {
          setEditAssociatedCrop(lot.associatedCrop || 'Ninguno');
          setEditCustomAssocName('');
      } else {
          setEditAssociatedCrop(lot.associatedCrop ? 'Otro' : 'Ninguno');
          setEditCustomAssocName(lot.associatedCrop || '');
      }

      setEditAssocAge(lot.associatedCropAge?.toString() || '0');
      setEditAssocDensity(formatNumberInput(lot.associatedCropDensity?.toString() || '0'));
      
      setIsEditing(false);
  };

  const handleSaveChanges = () => {
      if (!selectedLot) return;
      const newAge = parseInt(editAge) || 0;
      const specs = getCropSpecs(editCrop);
      const newStage: 'Produccion' | 'Levante' | 'Infraestructura' = newAge < specs.productionAge ? 'Levante' : 'Produccion';
      
      let finalAssocName: string | undefined = undefined;
      if (editAssociatedCrop !== 'Ninguno') {
          finalAssocName = editAssociatedCrop === 'Otro' ? editCustomAssocName : editAssociatedCrop;
      }

      const updatedLot: CostCenter = { 
          ...selectedLot, 
          name: editName, 
          area: parseNumberInput(editArea), 
          plantCount: parseNumberInput(editPlants), 
          cropAgeMonths: newAge, 
          stage: newStage, 
          cropType: editCrop, 
          variety: editVariety, // Save variety
          associatedCrop: finalAssocName,
          associatedCropAge: parseInt(editAssocAge) || undefined,
          associatedCropDensity: parseNumberInput(editAssocDensity) || undefined
      };
      onUpdateLot(updatedLot);
      setSelectedLot(updatedLot);
      setIsEditing(false);
  };

  const handleRenovation = (type: 'ZOCA' | 'SIEMBRA' | 'RENOVACION_SIEMBRA') => {
      if (!selectedLot) return;
      
      let detailMsg = '';
      if (type === 'ZOCA') {
          const zocaLabel = zocaType === 'TRADICIONAL' ? 'Tradicional (30cm)' : zocaType === 'PULMON' ? 'Pulmón' : 'Calavera';
          detailMsg = `Tipo: ${zocaLabel}. Se estima 18 meses para primera cosecha y ahorro del 50% en costos.`;
          
          if (includeReseeding) {
             const reseedingCount = Math.round((selectedLot.plantCount || 0) * 0.10);
             onAddPlannedLabor({
                 date: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Next month
                 activityName: 'Resiembra (10%)',
                 activityId: 'reseeding', 
                 costCenterId: selectedLot.id,
                 costCenterName: selectedLot.name,
                 targetArea: selectedLot.area,
                 technicalYield: 50, // Approx
                 unitCost: 0,
                 efficiency: 100,
                 calculatedPersonDays: 0,
                 calculatedTotalCost: 0,
                 notes: `Resiembra obligatoria del 10% (${reseedingCount} árboles) sugerida por renovación Zoca.`
             });
             detailMsg += " Se ha programado la tarea de Resiembra.";
          }
      } else if (type === 'RENOVACION_SIEMBRA') {
          detailMsg = 'Sustitución completa de cultivo. Alta inversión inicial. Se mantiene historial del lote.';
      } else {
          detailMsg = 'Siembra en lote nuevo (Expansión).';
      }

      const updatedLot: CostCenter = {
          ...selectedLot,
          stage: 'Levante',
          cropAgeMonths: 0, // Reset to 0 as specifically requested for Zoca/Renovation
          activationDate: undefined,
          assetValue: undefined,
          accumulatedCapex: 0
      };
      onUpdateLot(updatedLot);
      setShowRenovateModal(false);
      setSelectedLot(updatedLot);
      alert(`Lote renovado vía ${type}. ${detailMsg} El lote ha regresado a etapa de Levante (Edad 0).`);
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
              
              // LÓGICA DE DENSIDAD VS CICLO
              const isHighDensity = density >= 5500;
              // Ciclo Corto (Alta Densidad): 5-6 años (60-72 meses)
              // Ciclo Largo (Baja Densidad): Hasta 8 años (96 meses)
              const maxAge = isHighDensity ? 72 : 96;
              const warningAge = isHighDensity ? 60 : 84;
              
              let needsRenovation = age >= warningAge;
              
              const hasAssoc = lot.associatedCrop && lot.associatedCrop !== 'Ninguno';
              
              // Etapa fisiológica Café
              const mainStage = getPhenologicalStage(lot.cropType, age);

              return (
                  <div key={lot.id} onClick={() => handleOpenLot(lot)} className={`bg-white dark:bg-slate-800 p-5 rounded-[2rem] border transition-all cursor-pointer hover:shadow-xl active:scale-95 group relative overflow-hidden ${needsRenovation ? 'border-amber-500/50' : isLevante ? 'border-blue-500/30' : 'border-slate-200 dark:border-slate-700'}`}>
                      {needsRenovation && <div className="absolute top-0 right-0 bg-amber-500 text-white text-[8px] font-black px-3 py-1 rounded-bl-xl uppercase flex items-center gap-1 z-10"><Clock className="w-3 h-3" /> Renovación Sugerida</div>}
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
                      
                      {/* INFORMACIÓN PRINCIPAL */}
                      <div className={`grid ${hasAssoc ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mt-4`}>
                          <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl">
                              <div className="flex items-center gap-1 mb-1">
                                <TreePine className="w-3 h-3 text-emerald-500"/> 
                                <span className="text-[9px] font-black uppercase text-slate-500">{lot.cropType}</span>
                                {lot.variety && <span className="text-[9px] font-bold text-slate-400"> - {lot.variety}</span>}
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold">{age} Meses</p>
                              {/* Badge Etapa Fisiológica Café */}
                              {mainStage && <span className="text-[8px] bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-300 px-2 py-0.5 rounded-full font-black uppercase mt-1 inline-block">{mainStage}</span>}
                              <p className="text-xs font-black text-slate-800 dark:text-white mt-1">{formatNumberInput(lot.plantCount || 0)} <span className="text-[8px] font-normal">Árb.</span></p>
                          </div>
                          
                          {hasAssoc && (
                              <div className="bg-slate-50 dark:bg-slate-900/50 p-2 rounded-xl border-l-2 border-emerald-500/20">
                                  <div className="flex items-center gap-1 mb-1"><Leaf className="w-3 h-3 text-emerald-400"/> <span className="text-[9px] font-black uppercase text-slate-500">{lot.associatedCrop}</span></div>
                                  <p className="text-[10px] text-slate-400 font-bold">{lot.associatedCropAge || 0} Meses</p>
                                  {/* Badge Etapa Asocio */}
                                  {getPhenologicalStage(lot.associatedCrop || '', lot.associatedCropAge || 0) && (
                                      <span className="text-[8px] bg-emerald-900/30 text-emerald-500 px-2 py-0.5 rounded-full font-black uppercase mt-1 inline-block">{getPhenologicalStage(lot.associatedCrop || '', lot.associatedCropAge || 0)}</span>
                                  )}
                                  <p className="text-xs font-black text-slate-800 dark:text-white mt-1">{formatNumberInput(Math.round((lot.associatedCropDensity || 0) * (lot.area || 0)))} <span className="text-[8px] font-normal">Sitios</span></p>
                              </div>
                          )}
                      </div>
                  </div>
              );
          })}
      </div>

      {/* CREATE MODAL REVISADO */}
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Crear Nuevo Lote" icon={Plus} maxWidth="max-w-xl">
          <form onSubmit={handleCreateSubmit} className="space-y-5">
              
              {/* BLOQUE PRINCIPAL */}
              <div className="space-y-4">
                  <input type="text" value={loteName} onChange={e => setLoteName(e.target.value)} placeholder="Nombre del Lote (Ej: La Esperanza)" className="w-full bg-slate-900 border border-slate-700 rounded-2xl p-4 text-white font-bold focus:border-emerald-500 outline-none" required />
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Área (Ha)</label>
                        <input type="text" inputMode="decimal" value={loteArea} onChange={e => setLoteArea(formatNumberInput(e.target.value))} placeholder="0.0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm" required />
                    </div>
                    <div>
                        <div className="flex justify-between items-center px-1 mb-1">
                            <label className="text-[9px] font-black text-slate-500 uppercase">Densidad</label>
                            <button type="button" onClick={() => setDensityMode(densityMode === 'DIRECT' ? 'CALC' : 'DIRECT')} className="text-[9px] font-bold text-indigo-400 hover:text-indigo-300 uppercase flex items-center gap-1">
                                {densityMode === 'DIRECT' ? <Calculator className="w-3 h-3"/> : <MousePointer2 className="w-3 h-3"/>}
                                {densityMode === 'DIRECT' ? 'Asistente' : 'Manual'}
                            </button>
                        </div>
                        {densityMode === 'DIRECT' ? (
                            <input 
                                type="text" 
                                inputMode="decimal"
                                value={loteDensity} 
                                onChange={e => setLoteDensity(formatNumberInput(e.target.value))} 
                                placeholder="Árb/Ha (Ej: 5000)" 
                                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-white text-sm animate-fade-in" 
                                required 
                            />
                        ) : (
                            <div className="animate-fade-in space-y-2">
                                {/* Selector Tipo Arreglo */}
                                <div className="flex gap-1 bg-slate-950 p-1 rounded-xl">
                                    <button 
                                        type="button"
                                        onClick={() => setLayoutType('SQUARE')}
                                        className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 transition-all ${layoutType === 'SQUARE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-900'}`}
                                    >
                                        <LayoutGrid className="w-3 h-3" /> Cuadro
                                    </button>
                                    <button 
                                        type="button"
                                        onClick={() => setLayoutType('TRIANGLE')}
                                        className={`flex-1 py-1.5 text-[9px] font-bold uppercase rounded-lg flex items-center justify-center gap-1 transition-all ${layoutType === 'TRIANGLE' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-900'}`}
                                    >
                                        <Triangle className="w-3 h-3" /> Tresbolillo
                                    </button>
                                </div>

                                <div className="flex gap-2">
                                    {layoutType === 'SQUARE' ? (
                                        <>
                                            <div className="relative flex-1">
                                                <input type="text" inputMode="decimal" value={calcDistSurco} onChange={e => setCalcDistSurco(formatNumberInput(e.target.value))} placeholder="Calle (m)" className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl p-3 text-white text-xs text-center" />
                                                <MoveHorizontal className="absolute right-2 top-3 w-3 h-3 text-indigo-500/50" />
                                            </div>
                                            <div className="relative flex-1">
                                                <input type="text" inputMode="decimal" value={calcDistPlanta} onChange={e => setCalcDistPlanta(formatNumberInput(e.target.value))} placeholder="Palo (m)" className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl p-3 text-white text-xs text-center" />
                                                <ArrowLeftRight className="absolute right-2 top-3 w-3 h-3 text-indigo-500/50" />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="relative flex-1">
                                            <input type="text" inputMode="decimal" value={calcDistPlanta} onChange={e => setCalcDistPlanta(formatNumberInput(e.target.value))} placeholder="Distancia entre sitios (m)" className="w-full bg-slate-900 border border-indigo-500/50 rounded-xl p-3 text-white text-xs text-center" />
                                            <ArrowLeftRight className="absolute right-2 top-3 w-3 h-3 text-indigo-500/50" />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                        {densityMode === 'CALC' && loteDensity && (
                            <p className="text-[9px] text-indigo-400 text-center mt-1 font-bold">
                                Calculado: {loteDensity} Árb/Ha
                            </p>
                        )}
                    </div>
                  </div>

                  {/* POBLACIÓN CALCULADA */}
                  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center">
                      <span className="text-[10px] text-slate-400 font-bold uppercase">Población Total Café:</span>
                      <span className="text-lg font-mono font-black text-emerald-400">{lotePlants || 0}</span>
                  </div>
              </div>

              <hr className="border-slate-800" />

              {/* EDAD Y ORIGEN (SIEMBRA/ZOCA) */}
              <div className="bg-slate-900/50 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h5 className="text-[10px] text-indigo-400 font-black uppercase flex items-center gap-2"><Clock className="w-3 h-3"/> Origen y Edad del Café</h5>
                  
                  <div className="grid grid-cols-3 gap-1 bg-slate-950 p-1 rounded-xl">
                      <button type="button" onClick={() => setOriginType('SIEMBRA_NUEVA')} className={`py-2 text-[9px] font-black uppercase rounded-lg transition-all ${originType === 'SIEMBRA_NUEVA' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:text-white'}`}>Siembra Nueva</button>
                      <button type="button" onClick={() => setOriginType('RENOVACION_SIEMBRA')} className={`py-2 text-[9px] font-black uppercase rounded-lg transition-all ${originType === 'RENOVACION_SIEMBRA' ? 'bg-blue-600 text-white' : 'text-slate-500 hover:text-white'}`}>Renov. Siembra</button>
                      <button type="button" onClick={() => setOriginType('ZOCA')} className={`py-2 text-[9px] font-black uppercase rounded-lg transition-all ${originType === 'ZOCA' ? 'bg-amber-600 text-white' : 'text-slate-500 hover:text-white'}`}>Renov. Zoca</button>
                  </div>

                  <div className="flex gap-3 items-center">
                      <div className="flex-1">
                          <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Fecha {originType === 'ZOCA' ? 'Corte Zoca' : 'Siembra'}</label>
                          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold" required />
                      </div>
                      <div className="text-center px-4">
                          <p className="text-[9px] text-slate-500 font-black uppercase">Edad Actual</p>
                          <p className="text-xl font-black text-white">{calculatedAge} <span className="text-[10px] font-normal text-slate-400">Meses</span></p>
                      </div>
                  </div>
                  
                  {/* NEW: Variety Input for Coffee */}
                  {loteCrop === 'Café' && (
                      <div className="animate-fade-in-down">
                          <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Variedad de Café</label>
                          <input 
                              type="text" 
                              value={loteVariety} 
                              onChange={e => setLoteVariety(e.target.value)} 
                              placeholder="Ej: Castillo, Caturra, Borbón..." 
                              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold" 
                          />
                      </div>
                  )}

                  {/* Etapa Fisiológica Preview Create */}
                  {calculatedAge > 0 && getPhenologicalStage('Café', calculatedAge) && (
                      <div className="text-center bg-indigo-900/30 p-2 rounded-lg border border-indigo-500/30">
                          <p className="text-[9px] text-indigo-300 font-black uppercase">Etapa Fisiológica Estimada</p>
                          <p className="text-sm font-bold text-white">{getPhenologicalStage('Café', calculatedAge)}</p>
                      </div>
                  )}
              </div>

              {/* CULTIVOS ASOCIADOS */}
              <div className="bg-emerald-950/20 p-4 rounded-2xl border border-emerald-500/20 space-y-3">
                  <h5 className="text-[10px] text-emerald-400 font-black uppercase flex items-center gap-2"><Leaf className="w-3 h-3"/> Policultivo / Sombra</h5>
                  
                  <div>
                      <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Cultivo Asociado</label>
                      <select value={associatedCrop} onChange={e => setAssociatedCrop(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold">
                          {associatedOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                  </div>

                  {associatedCrop === 'Otro' && (
                      <div className="animate-fade-in-down">
                          <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Nombre del Cultivo</label>
                          <input type="text" value={customAssocName} onChange={e => setCustomAssocName(e.target.value)} placeholder="Ej: Lulo / Aguacate" className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold" required />
                      </div>
                  )}

                  {associatedCrop !== 'Ninguno' && (
                      <div className="grid grid-cols-2 gap-3 animate-fade-in-down">
                          <div>
                              <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Fecha Siembra Asocio</label>
                              <input type="date" value={assocStartDate} onChange={e => setAssocStartDate(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold" />
                              <div className="flex justify-between items-center mt-1">
                                  <span className="text-[9px] text-slate-400 font-bold">{assocCalculatedAge} Meses</span>
                                  {/* Mostrar etapa solo para Plátano/Banano */}
                                  {getPhenologicalStage(associatedCrop, assocCalculatedAge) && (
                                      <span className="text-[8px] bg-emerald-900 text-emerald-400 px-2 py-0.5 rounded-full font-black uppercase">{getPhenologicalStage(associatedCrop, assocCalculatedAge)}</span>
                                  )}
                              </div>
                          </div>
                          <div>
                              <label className="text-[9px] text-slate-500 uppercase font-bold ml-1">Densidad (Sitios/Ha)</label>
                              <input type="text" inputMode="decimal" value={associatedCropDensity} onChange={e => setAssociatedCropDensity(formatNumberInput(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white text-xs font-bold" placeholder="Ej: 200" />
                              <p className="text-[9px] text-right text-slate-400 mt-1">Total: {associatedCropPlants} Plantas</p>
                          </div>
                      </div>
                  )}
              </div>

              <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-black py-4 rounded-xl text-xs uppercase shadow-xl transition-all active:scale-95">Integrar Lote</button>
          </form>
      </Modal>

      {/* DETAIL MODAL MEJORADO */}
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
                                          <input disabled={!isEditing} type="text" inputMode="decimal" value={editArea} onChange={e=>handleEditAreaChange(formatNumberInput(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50 focus:border-indigo-500 outline-none" />
                                      </div>
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-500 uppercase">Población Café</label>
                                          <input disabled={!isEditing} type="text" inputMode="decimal" value={editPlants} onChange={e=>handleEditPlantsChange(formatNumberInput(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50 focus:border-indigo-500 outline-none" />
                                      </div>
                                  </div>

                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase">Densidad (Árb/Ha)</label>
                                      <div className="relative">
                                          <input 
                                              disabled={!isEditing} 
                                              type="text" 
                                              inputMode="decimal"
                                              value={editDensity} 
                                              onChange={e => handleEditDensityChange(formatNumberInput(e.target.value))} 
                                              className={`w-full bg-slate-950 border rounded-xl p-3 font-mono font-black text-center outline-none transition-all ${isEditing ? 'border-indigo-500/50 text-indigo-400 focus:ring-1 focus:ring-indigo-500' : 'border-slate-800 text-emerald-400 opacity-80'}`} 
                                          />
                                          {isEditing && <RefreshCw className="absolute right-3 top-3 w-4 h-4 text-indigo-500/50 animate-pulse" />}
                                      </div>
                                      {isEditing && <p className="text-[8px] text-slate-500 italic text-center mt-1">Sincroniza automáticamente con la Población.</p>}
                                  </div>

                                  <div className="space-y-1">
                                      <label className="text-[9px] font-black text-slate-500 uppercase">Edad Café (Meses)</label>
                                      <input disabled={!isEditing} type="number" value={editAge} onChange={e=>setEditAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50 focus:border-indigo-500 outline-none" />
                                      {getPhenologicalStage('Café', parseInt(editAge)) && (
                                          <p className="text-[8px] text-emerald-400 font-bold mt-1 uppercase text-center bg-slate-900/50 rounded py-1">{getPhenologicalStage('Café', parseInt(editAge))}</p>
                                      )}
                                  </div>

                                  {/* EDIT VARIETY */}
                                  {(editCrop === 'Café' || editVariety) && (
                                      <div className="space-y-1">
                                          <label className="text-[9px] font-black text-slate-500 uppercase">Variedad Café</label>
                                          <input 
                                              disabled={!isEditing} 
                                              type="text" 
                                              value={editVariety} 
                                              onChange={e => setEditVariety(e.target.value)} 
                                              placeholder="Variedad"
                                              className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50 focus:border-indigo-500 outline-none" 
                                          />
                                      </div>
                                  )}
                              
                                  {/* SECCIÓN ASOCIO EDITABLE */}
                                  <div className="pt-2 border-t border-slate-800 space-y-2">
                                      <label className="text-[9px] font-black text-emerald-500 uppercase">Cultivo Asociado</label>
                                      <select disabled={!isEditing} value={editAssociatedCrop} onChange={e => setEditAssociatedCrop(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded-lg p-2 text-white text-xs font-bold disabled:opacity-50">
                                          {associatedOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                                      </select>
                                      
                                      {editAssociatedCrop === 'Otro' && (
                                          <input disabled={!isEditing} type="text" value={editCustomAssocName} onChange={e => setEditCustomAssocName(e.target.value)} placeholder="Nombre Cultivo" className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-xs disabled:opacity-50" />
                                      )}

                                      {editAssociatedCrop !== 'Ninguno' && (
                                          <div className="grid grid-cols-2 gap-2 animate-fade-in">
                                              <div>
                                                  <label className="text-[8px] text-slate-500 uppercase font-bold">Edad (Meses)</label>
                                                  <input disabled={!isEditing} type="number" value={editAssocAge} onChange={e => setEditAssocAge(e.target.value)} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-xs" />
                                                  {/* Etapa Fisiológica solo Musáceas */}
                                                  {getPhenologicalStage(editAssociatedCrop === 'Otro' ? editCustomAssocName : editAssociatedCrop, parseInt(editAssocAge)) && (
                                                      <p className="text-[8px] text-emerald-400 font-bold mt-1 uppercase">{getPhenologicalStage(editAssociatedCrop === 'Otro' ? editCustomAssocName : editAssociatedCrop, parseInt(editAssocAge))}</p>
                                                  )}
                                              </div>
                                              <div>
                                                  <label className="text-[8px] text-slate-500 uppercase font-bold">Densidad</label>
                                                  <input disabled={!isEditing} type="text" inputMode="decimal" value={editAssocDensity} onChange={e => setEditAssocDensity(formatNumberInput(e.target.value))} className="w-full bg-slate-800 border border-slate-700 rounded p-2 text-white text-xs" />
                                              </div>
                                          </div>
                                      )}
                                  </div>
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
                          <div className="bg-emerald-900/10 border border-emerald-500/20 p-4 rounded-2xl"><p className="text-[10px] font-black text-emerald-600 uppercase">Producción Histórica</p><p className="text-xl font-mono font-black text-emerald-500">{formatNumberInput(lotMetrics.yield)} Kg</p></div>
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

      {/* RENOVAR MODAL MEJORADO */}
      <Modal isOpen={showRenovateModal} onClose={() => setShowRenovateModal(false)} title="Renovación de Lote" icon={Sprout} maxWidth="max-w-lg">
          <div className="space-y-6">
              
              {/* ZOCA SECTION WITH TECHNICAL DATA */}
              <div className="bg-slate-100 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800 space-y-4">
                  <div className="flex justify-between items-center">
                      <h5 className="text-sm text-slate-600 dark:text-white font-black uppercase flex items-center gap-2"><Scissors className="w-4 h-4 text-amber-500"/> Opción A: Zoca</h5>
                      <span className="text-[9px] bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-bold uppercase border border-emerald-200">Ahorro ~53.5%</span>
                  </div>
                  
                  {/* Technical Badge */}
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-100 dark:border-blue-500/20 flex gap-3 items-start">
                      <BookOpen className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
                      <div className="space-y-1">
                          <p className="text-[10px] font-bold text-blue-600 dark:text-blue-300 uppercase">Ficha Técnica Cenicafé</p>
                          <ul className="text-[9px] text-slate-500 dark:text-slate-400 space-y-1 list-disc list-inside">
                              <li>Tiempo a floración: <strong>11 meses</strong>.</li>
                              <li>Tiempo a cosecha plena: <strong>18 meses</strong>.</li>
                              <li>Ciclo productivo esperado: <strong>4 a 5 cosechas</strong>.</li>
                          </ul>
                      </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2">
                      <button onClick={() => setZocaType('TRADICIONAL')} className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${zocaType === 'TRADICIONAL' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-500' : 'border-slate-300 dark:border-slate-700 text-slate-500'}`}>Tradicional</button>
                      <button onClick={() => setZocaType('PULMON')} className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${zocaType === 'PULMON' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-500' : 'border-slate-300 dark:border-slate-700 text-slate-500'}`}>Pulmón</button>
                      <button onClick={() => setZocaType('CALAVERA')} className={`py-2 text-[9px] font-black uppercase rounded-lg border transition-all ${zocaType === 'CALAVERA' ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border-amber-500' : 'border-slate-300 dark:border-slate-700 text-slate-500'}`}>Calavera</button>
                  </div>
                  
                  {/* Reseeding Checkbox */}
                  <label className="flex items-center gap-3 p-3 bg-white dark:bg-slate-950 rounded-xl border border-slate-200 dark:border-slate-800 cursor-pointer hover:border-emerald-500/50 transition-colors">
                      <input 
                          type="checkbox" 
                          checked={includeReseeding} 
                          onChange={e => setIncludeReseeding(e.target.checked)} 
                          className="w-5 h-5 text-emerald-500 rounded focus:ring-emerald-500 border-gray-300"
                      />
                      <div>
                          <p className="text-[10px] font-bold text-slate-700 dark:text-slate-200 uppercase">Programar Resiembra (10%)</p>
                          <p className="text-[9px] text-slate-400">Compensar pérdidas por llaga macana.</p>
                      </div>
                  </label>

                  <button onClick={() => handleRenovation('ZOCA')} className="w-full bg-amber-600 hover:bg-amber-500 text-white font-black uppercase text-xs py-3 rounded-xl shadow-lg transition-all active:scale-95">
                      Confirmar Zoca (Reiniciar a Levante)
                  </button>
              </div>

              {/* RENOVATION BY SOWING SECTION */}
              <div className="bg-slate-100 dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <div className="flex justify-between items-center mb-3">
                      <h5 className="text-sm text-slate-600 dark:text-white font-black uppercase flex items-center gap-2"><RefreshCcw className="w-4 h-4 text-blue-500"/> Opción B: Renovación por Siembra</h5>
                      <span className="text-[8px] bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-bold uppercase border border-blue-200">Alta Inversión</span>
                  </div>
                  <p className="text-[9px] text-slate-500 mb-4 px-1">
                      Eliminación total de plantas viejas y resiembra. Se conserva el historial del lote pero reinicia el ciclo biológico.
                  </p>
                  <button onClick={() => handleRenovation('RENOVACION_SIEMBRA')} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black uppercase text-xs py-3 rounded-xl shadow-lg transition-all active:scale-95">
                      Confirmar Siembra (Lote Existente)
                  </button>
              </div>
          </div>
      </Modal>
    </div>
  );
};