
import React, { useState, useMemo } from 'react';
import { Machine, MaintenanceLog, RainLog, CostCenter, Personnel, Activity, SoilAnalysis, PPELog, WasteLog, Asset, BpaCriterion, PhenologyLog, PestLog } from '../types';
import { formatCurrency, generateId } from '../services/inventoryService';
import { Settings, Wrench, Droplets, Plus, Trash2, Fuel, PenTool, FileText, FileSpreadsheet, Download, Gauge, User, MapPin, Pickaxe, DollarSign, CheckCircle, ArrowRight, Tractor, Microscope, ShieldCheck, Recycle, Signature, UserCheck, ShieldAlert, FileCheck, Pencil, Globe, ClipboardList, Briefcase, Droplet, AlertTriangle, Bookmark, Shield, Zap, Info, Clock, CheckCircle2, Leaf, Bug, FlaskConical, Scale, Warehouse, HardHat, ChevronDown, ChevronUp, AlertCircle } from 'lucide-react';

interface ManagementViewProps {
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  costCenters: CostCenter[];
  personnel: Personnel[];
  activities: Activity[];
  soilAnalyses: SoilAnalysis[];
  ppeLogs: PPELog[];
  wasteLogs: WasteLog[];
  assets: Asset[];
  bpaChecklist: Record<string, boolean>;
  phenologyLogs: PhenologyLog[];
  pestLogs: PestLog[];
  onAddMachine: (m: Omit<Machine, 'id' | 'warehouseId'>) => void;
  onUpdateMachine: (machine: Machine) => void;
  onAddMaintenance: (m: Omit<MaintenanceLog, 'id' | 'warehouseId'>) => void;
  onDeleteMachine: (id: string) => void;
  onAddRain: (r: Omit<RainLog, 'id' | 'warehouseId'>) => void;
  onDeleteRain: (id: string) => void;
  onAddSoilAnalysis: (s: Omit<SoilAnalysis, 'id' | 'warehouseId'>) => void;
  onDeleteSoilAnalysis: (id: string) => void;
  onAddPPE: (p: Omit<PPELog, 'id' | 'warehouseId'>) => void;
  onDeletePPE: (id: string) => void;
  onAddWaste: (w: Omit<WasteLog, 'id' | 'warehouseId'>) => void;
  onDeleteWaste: (id: string) => void;
  onAddAsset: (a: Omit<Asset, 'id' | 'warehouseId'>) => void;
  onDeleteAsset: (id: string) => void;
  onToggleBpa: (code: string) => void;
  onAddPhenologyLog: (log: Omit<PhenologyLog, 'id' | 'warehouseId'>) => void;
  onDeletePhenologyLog: (id: string) => void;
  onAddPestLog: (log: Omit<PestLog, 'id' | 'warehouseId'>) => void;
  onDeletePestLog: (id: string) => void;
  isAdmin: boolean;
}

// LISTA ROBUSTA BASADA EN RES. ICA 082394
const BPA_TEMPLATE: BpaCriterion[] = [
  // 1. INFRAESTRUCTURA (INF)
  { id: '1', category: 'INFRASTRUCTURE', code: 'INF.01', label: 'Unidad sanitaria (baño) limpia, con agua, jabón, toallas y papel', isCritical: true, compliant: false },
  { id: '2', category: 'INFRASTRUCTURE', code: 'INF.02', label: 'Área de almacenamiento de insumos (Bodega) separada de vivienda', isCritical: true, compliant: false },
  { id: '3', category: 'INFRASTRUCTURE', code: 'INF.03', label: 'Bodega ventilada, con iluminación y piso impermeable', isCritical: false, compliant: false },
  { id: '4', category: 'INFRASTRUCTURE', code: 'INF.04', label: 'Estanterías de material no absorbente (No madera)', isCritical: false, compliant: false },
  { id: '5', category: 'INFRASTRUCTURE', code: 'INF.05', label: 'Área de dosificación y mezcla con kit de derrames (Arena/Aserrín)', isCritical: true, compliant: false },
  { id: '6', category: 'INFRASTRUCTURE', code: 'INF.06', label: 'Área de acopio temporal de cosecha techada y limpia', isCritical: true, compliant: false },
  
  // 2. INSUMOS Y QUÍMICOS (CH)
  { id: '7', category: 'CHEMICALS', code: 'CH.01', label: 'Uso exclusivo de plaguicidas con Registro ICA para el cultivo', isCritical: true, compliant: false },
  { id: '8', category: 'CHEMICALS', code: 'CH.02', label: 'Inventario de insumos actualizado (Kárdex)', isCritical: false, compliant: false },
  { id: '9', category: 'CHEMICALS', code: 'CH.03', label: 'Separación física: Fertilizantes lejos de Plaguicidas', isCritical: true, compliant: false },
  { id: '10', category: 'CHEMICALS', code: 'CH.04', label: 'Insumos vencidos identificados y separados', isCritical: true, compliant: false },
  
  // 3. SEGURIDAD Y SALUD EN EL TRABAJO (SST)
  { id: '11', category: 'SST', code: 'SST.01', label: 'Uso de EPP completo según etiqueta del producto aplicado', isCritical: true, compliant: false },
  { id: '12', category: 'SST', code: 'SST.02', label: 'Botiquín de primeros auxilios dotado y accesible', isCritical: false, compliant: false },
  { id: '13', category: 'SST', code: 'SST.03', label: 'Extintor multipropósito vigente y señalizado', isCritical: true, compliant: false },
  { id: '14', category: 'SST', code: 'SST.04', label: 'Capacitación a operarios en manejo seguro de agroquímicos', isCritical: true, compliant: false },
  { id: '15', category: 'SST', code: 'SST.05', label: 'Exámenes médicos ocupacionales (Colinesterasa) al día', isCritical: false, compliant: false },

  // 4. MEDIO AMBIENTE (ENV)
  { id: '16', category: 'ENVIRONMENT', code: 'ENV.01', label: 'Análisis de agua (Físico-químico y Microbiológico) < 1 año', isCritical: true, compliant: false },
  { id: '17', category: 'ENVIRONMENT', code: 'ENV.02', label: 'Práctica de Triple Lavado en envases vacíos', isCritical: true, compliant: false },
  { id: '18', category: 'ENVIRONMENT', code: 'ENV.03', label: 'Envases perforados y almacenados en centro de acopio temporal', isCritical: true, compliant: false },
  { id: '19', category: 'ENVIRONMENT', code: 'ENV.04', label: 'Protección de fuentes de agua (Zonas de barbecho)', isCritical: true, compliant: false },

  // 5. TRAZABILIDAD Y DOCUMENTACIÓN (TRA)
  { id: '20', category: 'TRACEABILITY', code: 'TRA.01', label: 'Plan de trazabilidad documentado (Lote -> Cliente)', isCritical: true, compliant: false },
  { id: '21', category: 'TRACEABILITY', code: 'TRA.02', label: 'Registros de aplicación respetando Periodos de Carencia (PC)', isCritical: true, compliant: false },
  { id: '22', category: 'TRACEABILITY', code: 'TRA.03', label: 'Asistencia técnica por Ingeniero Agrónomo (Visitas)', isCritical: false, compliant: false },
];

export const ManagementView: React.FC<ManagementViewProps> = ({
    machines, maintenanceLogs, rainLogs, costCenters, personnel, activities,
    soilAnalyses, ppeLogs, wasteLogs, assets, bpaChecklist, phenologyLogs, pestLogs,
    onAddMachine, onUpdateMachine, onAddMaintenance, onDeleteMachine,
    onAddRain, onDeleteRain,
    onAddSoilAnalysis, onDeleteSoilAnalysis,
    onAddPPE, onDeletePPE,
    onAddWaste, onDeleteWaste,
    onAddAsset, onDeleteAsset, onToggleBpa,
    onAddPhenologyLog, onDeletePhenologyLog,
    onAddPestLog, onDeletePestLog,
    isAdmin
}) => {
  const [subTab, setSubTab] = useState<'audit' | 'assets' | 'agronomy' | 'sst' | 'tools'>('audit');
  // State for collapsible sections
  const [expandedCategory, setExpandedCategory] = useState<string | null>('INFRASTRUCTURE');

  // Forms State
  const [assetName, setAssetName] = useState('');
  const [assetPrice, setAssetPrice] = useState('');
  const [assetLife, setAssetLife] = useState('10');
  const [assetCat, setAssetCat] = useState<'MAQUINARIA' | 'HERRAMIENTA' | 'INFRAESTRUCTURA'>('MAQUINARIA');

  const [maintMachineId, setMaintMachineId] = useState('');
  const [maintCost, setMaintCost] = useState('');
  const [maintDesc, setMaintDesc] = useState('');
  const [maintHours, setMaintHours] = useState('');
  const [maintFuel, setMaintFuel] = useState('');

  const [rainMm, setRainMm] = useState('');
  const [phenoLotId, setPhenoLotId] = useState('');
  const [phenoStage, setPhenoStage] = useState<'Floración' | 'Cuajado' | 'Llenado' | 'Maduración'>('Floración');
  const [pestLotId, setPestLotId] = useState('');
  const [pestName, setPestName] = useState('');
  const [pestIncidence, setPestIncidence] = useState<'Baja' | 'Media' | 'Alta'>('Baja');

  // SST Forms State
  const [ppePersonnelId, setPpePersonnelId] = useState('');
  const [ppeItems, setPpeItems] = useState('');
  const [wasteDescription, setWasteDescription] = useState('');
  const [wasteQty, setWasteQty] = useState('');
  const [wasteTripleWashed, setWasteTripleWashed] = useState(true);

  // Tools State
  const [toolMachineId, setToolMachineId] = useState('');
  const [toolDischarge, setToolDischarge] = useState('');
  const [toolDischargeUnit, setToolDischargeUnit] = useState<'L' | 'ml' | 'cc'>('L'); 
  const [toolWidth, setToolWidth] = useState('');
  const [toolSpeed, setToolSpeed] = useState('');
  const [toolTank, setToolTank] = useState('');
  const [toolDose, setToolDose] = useState('');
  const [toolDoseUnit, setToolDoseUnit] = useState<'L' | 'ml' | 'cc' | 'Kg' | 'g'>('cc');


  const bpaSummary = useMemo(() => {
    const criteria = BPA_TEMPLATE.map(c => ({ ...c, compliant: !!bpaChecklist[c.code] }));
    const total = criteria.length;
    const compliant = criteria.filter(c => c.compliant).length;
    const criticalFail = criteria.some(c => c.isCritical && !c.compliant);
    
    // Agrupar por categoría
    const grouped = {
        'INFRASTRUCTURE': criteria.filter(c => c.category === 'INFRASTRUCTURE'),
        'CHEMICALS': criteria.filter(c => c.category === 'CHEMICALS'),
        'SST': criteria.filter(c => c.category === 'SST'),
        'ENVIRONMENT': criteria.filter(c => c.category === 'ENVIRONMENT'),
        'TRACEABILITY': criteria.filter(c => c.category === 'TRACEABILITY'),
    };

    return { criteria, percent: (compliant / total) * 100, criticalFail, grouped };
  }, [bpaChecklist]);

  const toolCalculations = useMemo(() => {
      let dischargeLmin = parseFloat(toolDischarge);
      if (toolDischargeUnit === 'ml' || toolDischargeUnit === 'cc') {
          dischargeLmin = dischargeLmin / 1000;
      }

      const width = parseFloat(toolWidth);
      const speed = parseFloat(toolSpeed);
      
      if (!dischargeLmin || !width || !speed) return { LHa: 0, productPerTank: 0 };
      
      const LHa = (dischargeLmin * 600) / (width * speed);
      
      const tank = parseFloat(toolTank);
      const dose = parseFloat(toolDose);
      
      let productPerTank = 0;
      if (LHa > 0 && tank > 0 && dose > 0) {
          productPerTank = (tank / LHa) * dose;
      }

      return { LHa, productPerTank };
  }, [toolDischarge, toolDischargeUnit, toolWidth, toolSpeed, toolTank, toolDose]);

  const handleAddRain = (e: React.FormEvent) => { e.preventDefault(); if(rainMm) { onAddRain({date: new Date().toISOString(), millimeters: parseFloat(rainMm)}); setRainMm(''); } };
  const handleAddPheno = (e: React.FormEvent) => { e.preventDefault(); if(phenoLotId) { onAddPhenologyLog({date: new Date().toISOString(), costCenterId: phenoLotId, stage: phenoStage}); setPhenoLotId(''); } };
  const handleAddPest = (e: React.FormEvent) => { e.preventDefault(); if(pestLotId && pestName) { onAddPestLog({date: new Date().toISOString(), costCenterId: pestLotId, pestOrDisease: pestName, incidence: pestIncidence}); setPestLotId(''); setPestName(''); } };
  const handleAddMaintenance = (e: React.FormEvent) => { e.preventDefault(); if(maintMachineId && maintDesc) { onAddMaintenance({date: new Date().toISOString(), machineId: maintMachineId, description: maintDesc, cost: parseFloat(maintCost) || 0, hoursWorked: parseFloat(maintHours) || undefined, fuelUsedLiters: parseFloat(maintFuel) || undefined }); setMaintMachineId(''); setMaintCost(''); setMaintDesc(''); setMaintHours(''); setMaintFuel(''); } };
  const handleAddAssetSubmit = (e: React.FormEvent) => { e.preventDefault(); if (!assetName || !assetPrice) return; onAddAsset({ name: assetName, purchasePrice: parseFloat(assetPrice), lifespanYears: parseInt(assetLife), category: assetCat, purchaseDate: new Date().toISOString().split('T')[0] }); setAssetName(''); setAssetPrice(''); };
  
  const handleAddPPEsubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ppePersonnelId || !ppeItems) return;
    const person = personnel.find(p => p.id === ppePersonnelId);
    if (!person) return;
    onAddPPE({ date: new Date().toISOString(), personnelId: ppePersonnelId, personnelName: person.name, items: ppeItems.split(',').map(s => s.trim()) });
    setPpePersonnelId(''); setPpeItems('');
  };
  
  const handleAddWasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wasteDescription || !wasteQty) return;
    onAddWaste({ date: new Date().toISOString(), itemDescription: wasteDescription, quantity: parseFloat(wasteQty), tripleWashed: wasteTripleWashed });
    setWasteDescription(''); setWasteQty(''); setWasteTripleWashed(true);
  };

  const getCategoryLabel = (cat: string) => {
      switch(cat) {
          case 'INFRASTRUCTURE': return { label: 'Infraestructura & Instalaciones', icon: Warehouse, color: 'text-indigo-500' };
          case 'CHEMICALS': return { label: 'Bodega de Insumos', icon: FlaskConical, color: 'text-purple-500' };
          case 'SST': return { label: 'Seguridad y Salud (SST)', icon: HardHat, color: 'text-amber-500' };
          case 'ENVIRONMENT': return { label: 'Gestión Ambiental', icon: Leaf, color: 'text-emerald-500' };
          case 'TRACEABILITY': return { label: 'Trazabilidad y Registros', icon: ClipboardList, color: 'text-blue-500' };
          default: return { label: cat, icon: Info, color: 'text-slate-500' };
      }
  };
  
  return (
    <div className="space-y-6 pb-20 animate-fade-in">
        <div className="flex bg-slate-200 dark:bg-slate-800 p-1 rounded-xl overflow-x-auto scrollbar-hide gap-1 sticky top-[120px] z-30 shadow-md">
            <button onClick={() => setSubTab('audit')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'audit' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500'}`}><ShieldCheck className="w-3 h-3" /> Radar BPA</button>
            <button onClick={() => setSubTab('assets')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'assets' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500'}`}><Briefcase className="w-3 h-3" /> Activos</button>
            <button onClick={() => setSubTab('agronomy')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'agronomy' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-500'}`}><Leaf className="w-3 h-3" /> Agronomía</button>
            <button onClick={() => setSubTab('sst')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'sst' ? 'bg-red-600 text-white shadow-lg' : 'text-slate-500'}`}><Signature className="w-3 h-3" /> SST/Ambiental</button>
            <button onClick={() => setSubTab('tools')} className={`shrink-0 px-4 py-2 rounded-lg text-[10px] font-black uppercase flex items-center gap-2 transition-all ${subTab === 'tools' ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}><Wrench className="w-3 h-3" /> Herramientas</button>
        </div>

        {subTab === 'audit' && (
            <div className="space-y-6 animate-fade-in">
                {/* RADAR CHART AND SUMMARY - BIGGER AND BOLDER */}
                <div className={`p-8 rounded-[3rem] border-4 transition-all relative overflow-hidden ${bpaSummary.criticalFail ? 'bg-slate-900 border-red-500/30' : 'bg-slate-900 border-emerald-500/30'}`}>
                    <div className="relative z-10 flex flex-col items-center">
                        <h3 className="font-black text-2xl flex items-center justify-center gap-3 uppercase tracking-tighter mb-6 text-white">
                            <Globe className={`w-8 h-8 ${bpaSummary.criticalFail ? 'text-red-500' : 'text-emerald-500'}`} /> 
                            Radar Certificación
                        </h3>
                        
                        <div className="relative w-48 h-48 mx-auto mb-6">
                            <svg className="w-full h-full transform -rotate-90 drop-shadow-2xl">
                                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" className="text-slate-800" />
                                <circle cx="96" cy="96" r="88" stroke="currentColor" strokeWidth="12" fill="transparent" strokeDasharray={552} strokeDashoffset={552 - (552 * bpaSummary.percent / 100)} className={`transition-all duration-1000 ${bpaSummary.criticalFail ? 'text-red-500' : 'text-emerald-500'}`} strokeLinecap="round" />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className="text-5xl font-black text-white">{bpaSummary.percent.toFixed(0)}%</span>
                                <span className="text-[10px] text-slate-400 font-bold uppercase mt-1">Cumplimiento</span>
                            </div>
                        </div>

                        {bpaSummary.criticalFail ? (
                            <div className="bg-red-500/20 border border-red-500 text-red-200 px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse">
                                <AlertTriangle className="w-6 h-6 text-red-500" />
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase">Certificación en Riesgo</p>
                                    <p className="text-[10px]">Existen Puntos Críticos Fallidos</p>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-200 px-6 py-3 rounded-2xl flex items-center gap-3">
                                <CheckCircle className="w-6 h-6 text-emerald-500" />
                                <div className="text-left">
                                    <p className="font-black text-xs uppercase">Camino a la Certificación</p>
                                    <p className="text-[10px]">Sin puntos críticos pendientes</p>
                                </div>
                            </div>
                        )}
                        <p className="text-[10px] text-slate-500 mt-6 uppercase font-bold tracking-widest">Auditoría Res. ICA 082394</p>
                    </div>
                </div>

                {/* ACCORDION LIST */}
                <div className="space-y-4">
                    {Object.entries(bpaSummary.grouped).map(([catKey, items]) => {
                        const style = getCategoryLabel(catKey);
                        const Icon = style.icon;
                        const isExpanded = expandedCategory === catKey;
                        const typedItems = items as BpaCriterion[];
                        
                        const compliantCount = typedItems.filter(i => i.compliant).length;
                        const totalCount = typedItems.length;
                        const progress = (compliantCount / totalCount) * 100;
                        const hasCriticalFail = typedItems.some(i => i.isCritical && !i.compliant);

                        return (
                            <div key={catKey} className={`rounded-[2rem] border overflow-hidden transition-all duration-300 ${isExpanded ? 'bg-slate-900 border-slate-700 shadow-xl' : 'bg-slate-900/50 border-slate-800'}`}>
                                <button 
                                    onClick={() => setExpandedCategory(isExpanded ? null : catKey)}
                                    className="w-full p-5 flex items-center justify-between"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`p-3 rounded-xl ${isExpanded ? 'bg-slate-800' : 'bg-slate-800/50'}`}>
                                            <Icon className={`w-6 h-6 ${style.color}`} />
                                        </div>
                                        <div className="text-left">
                                            <h4 className={`text-sm font-black uppercase tracking-wide text-white`}>
                                                {style.label}
                                            </h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                                                    <div className={`h-full ${style.color.replace('text-', 'bg-')}`} style={{width: `${progress}%`}}></div>
                                                </div>
                                                <span className="text-[10px] font-mono text-slate-400">{compliantCount}/{totalCount}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {hasCriticalFail && !isExpanded && (
                                            <div className="bg-red-500/20 p-2 rounded-full animate-pulse">
                                                <AlertCircle className="w-4 h-4 text-red-500" />
                                            </div>
                                        )}
                                        {isExpanded ? <ChevronUp className="w-5 h-5 text-slate-500" /> : <ChevronDown className="w-5 h-5 text-slate-500" />}
                                    </div>
                                </button>

                                {isExpanded && (
                                    <div className="p-5 pt-0 border-t border-slate-800/50 space-y-3 animate-fade-in-down">
                                        <div className="h-4"></div> {/* Spacer */}
                                        {typedItems.map(c => (
                                            <div 
                                                key={c.code} 
                                                onClick={() => onToggleBpa(c.code)} 
                                                className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-start gap-4 group ${c.compliant ? 'bg-emerald-950/20 border-emerald-500/20' : 'bg-slate-950 border-slate-800 hover:border-slate-600'}`}
                                            >
                                                <div className={`mt-0.5 p-1 rounded-full shrink-0 border ${c.compliant ? 'bg-emerald-500 border-emerald-500 text-white' : 'bg-transparent border-slate-600 text-transparent'}`}>
                                                    <CheckCircle2 className="w-3 h-3" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-[9px] font-black text-slate-500">{c.code}</span>
                                                        {c.isCritical && <span className="text-[8px] bg-red-500/20 text-red-400 px-2 py-0.5 rounded border border-red-500/30 uppercase font-black tracking-wider">Fundamental</span>}
                                                    </div>
                                                    <p className={`text-xs font-bold leading-snug ${c.compliant ? 'text-emerald-100 line-through decoration-emerald-500/50' : 'text-slate-300'}`}>{c.label}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        )}

        {/* ... (OTHER TABS - ASSETS, AGRONOMY, SST, TOOLS - SAME AS BEFORE) ... */}
        {subTab === 'assets' && (
            <div className="space-y-6 animate-fade-in">
                { /* Asset Management and Maintenance Forms */ }
                <form onSubmit={handleAddAssetSubmit} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                  <h4 className="text-indigo-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Activo Fijo</h4>
                  <input value={assetName} onChange={e => setAssetName(e.target.value)} placeholder="Nombre (Ej: Despulpadora)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                  <div className="grid grid-cols-2 gap-3">
                      <input type="number" value={assetPrice} onChange={e => setAssetPrice(e.target.value)} placeholder="Costo Adquisición" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                      <select value={assetLife} onChange={e => setAssetLife(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"><option value="5">5 Años</option><option value="10">10 Años</option><option value="20">20 Años</option></select>
                  </div>
                  <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Añadir Activo</button>
                </form>
                
                <form onSubmit={handleAddMaintenance} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                   <h4 className="text-amber-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Mantenimiento</h4>
                   <select value={maintMachineId} onChange={e=>setMaintMachineId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"><option value="">Seleccionar Máquina</option>{machines.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}</select>
                   <input value={maintDesc} onChange={e=>setMaintDesc(e.target.value)} placeholder="Descripción (Ej: Cambio de aceite)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                   <div className="grid grid-cols-3 gap-3">
                       <input type="number" value={maintCost} onChange={e=>setMaintCost(e.target.value)} placeholder="Costo $" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                       <input type="number" value={maintHours} onChange={e=>setMaintHours(e.target.value)} placeholder="Horas Uso" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                       <input type="number" value={maintFuel} onChange={e=>setMaintFuel(e.target.value)} placeholder="Combustible (L)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                   </div>
                   <button type="submit" className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Guardar Mantenimiento</button>
                </form>
            </div>
        )}

        {subTab === 'agronomy' && (
            <div className="space-y-6 animate-fade-in">
                 {/* Quick Entry Forms */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <form onSubmit={handleAddRain} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700"><h4 className="text-blue-400 text-xs uppercase font-black flex items-center gap-2 mb-2"><Droplets className="w-4 h-4"/> Pluviometría</h4><div className="flex gap-2"><input type="number" value={rainMm} onChange={e=>setRainMm(e.target.value)} placeholder="mm de Lluvia" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white" required /><button type="submit" className="bg-blue-600 text-white p-2 rounded-xl"><Plus/></button></div></form>
                    <form onSubmit={handleAddPheno} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700"><h4 className="text-emerald-400 text-xs uppercase font-black flex items-center gap-2 mb-2"><Leaf className="w-4 h-4"/> Fenología</h4><div className="flex gap-2"><select value={phenoLotId} onChange={e=>setPhenoLotId(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"><option value="">Lote...</option>{costCenters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><button type="submit" className="bg-emerald-600 text-white p-2 rounded-xl"><Plus/></button></div></form>
                </div>
                 <form onSubmit={handleAddPest} className="bg-slate-900/50 p-4 rounded-2xl border border-slate-700 space-y-2"><h4 className="text-red-400 text-xs uppercase font-black flex items-center gap-2"><Bug className="w-4 h-4"/> Monitoreo Plagas</h4><div className="flex gap-2"><select value={pestLotId} onChange={e=>setPestLotId(e.target.value)} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"><option value="">Lote...</option>{costCenters.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select><input type="text" value={pestName} onChange={e=>setPestName(e.target.value)} placeholder="Plaga/Enfermedad" className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-2 text-sm text-white" required /><button type="submit" className="bg-red-600 text-white p-2 rounded-xl"><Plus/></button></div></form>
            </div>
        )}

        {subTab === 'sst' && (
            <div className="space-y-6 animate-fade-in">
                <form onSubmit={handleAddPPEsubmit} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                    <h4 className="text-red-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Signature className="w-4 h-4" /> Registro de EPP</h4>
                    <select value={ppePersonnelId} onChange={e => setPpePersonnelId(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white"><option value="">Seleccionar Trabajador</option>{personnel.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
                    <input type="text" value={ppeItems} onChange={e => setPpeItems(e.target.value)} placeholder="Items (Ej: Guantes, Careta, Overol)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                    <button type="submit" className="w-full bg-red-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Registrar Entrega</button>
                </form>

                <form onSubmit={handleAddWasteSubmit} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                    <h4 className="text-emerald-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Recycle className="w-4 h-4" /> Trazabilidad de Residuos</h4>
                    <input type="text" value={wasteDescription} onChange={e => setWasteDescription(e.target.value)} placeholder="Descripción (Ej: Envases Amistar 1L)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                    <input type="number" value={wasteQty} onChange={e => setWasteQty(e.target.value)} placeholder="Cantidad" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                    <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700 cursor-pointer">
                        <input type="checkbox" checked={wasteTripleWashed} onChange={e => setWasteTripleWashed(e.target.checked)} className="h-5 w-5 rounded text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500"/>
                        <span className="text-sm font-bold text-white flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-500"/> ¿Triple Lavado y Perforado?</span>
                    </label>
                    <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Registrar Disposición</button>
                </form>

                 <div className="space-y-3">
                    {wasteLogs.slice().reverse().map(log => <div key={log.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center text-xs"><p className="text-slate-300">{log.quantity} x {log.itemDescription}</p><span className="text-emerald-400 font-bold">{log.tripleWashed && "TRIPLE LAVADO"}</span></div>)}
                    {ppeLogs.slice().reverse().map(log => <div key={log.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center text-xs"><p className="text-slate-300">{log.personnelName}</p><span className="text-slate-400">{log.items.join(', ')}</span></div>)}
                 </div>
            </div>
        )}
        
        {subTab === 'tools' && (
            <div className="space-y-6 animate-fade-in">
                 <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                    <h4 className="text-amber-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Tractor className="w-4 h-4" /> Calibración y Dosificación Inteligente</h4>
                     
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 relative">
                        <div className="absolute -top-3 -right-3 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">PASO 1</div>
                        <h5 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2">
                            <Gauge className="w-3 h-3" /> Calibración del Equipo
                        </h5>
                         <div className="space-y-3">
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Descarga Boquilla</label>
                                <div className="flex">
                                    <input value={toolDischarge} onChange={e=>setToolDischarge(e.target.value)} placeholder="0.0" className="flex-1 bg-slate-800 border-y border-l border-slate-600 rounded-l-xl p-3 text-sm text-white font-mono" />
                                    <select value={toolDischargeUnit} onChange={e => setToolDischargeUnit(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded-r-xl px-2 text-xs text-amber-500 font-bold outline-none">
                                        <option value="L">L/min</option>
                                        <option value="ml">ml/min</option>
                                        <option value="cc">cc/min</option>
                                    </select>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Ancho Faja (m)</label>
                                    <input value={toolWidth} onChange={e=>setToolWidth(e.target.value)} placeholder="Metros" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white font-mono" />
                                </div>
                                <div>
                                    <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Velocidad (Km/h)</label>
                                    <input value={toolSpeed} onChange={e=>setToolSpeed(e.target.value)} placeholder="Km/h" className="w-full bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white font-mono" />
                                </div>
                            </div>
                         </div>
                         <div className="mt-4 p-4 rounded-2xl bg-amber-950/50 border border-amber-500/20 text-center flex items-center justify-between">
                            <div className="text-left">
                                <p className="text-[10px] uppercase font-black text-amber-500">Gasto de Agua</p>
                                <p className="text-[9px] text-slate-500">Volumen de aplicación</p>
                            </div>
                            <p className="text-3xl font-mono font-black text-white">{toolCalculations.LHa.toFixed(1)} <span className="text-xs text-amber-500">L/Ha</span></p>
                         </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 relative">
                        <div className="absolute -top-3 -right-3 bg-emerald-600 text-white text-[8px] font-black px-2 py-1 rounded-lg shadow-lg">PASO 2</div>
                        <h5 className="text-[10px] font-black uppercase text-slate-400 mb-3 flex items-center gap-2">
                            <FlaskConical className="w-3 h-3" /> Preparación de Mezcla
                        </h5>
                         <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Tamaño Tanque</label>
                                <div className="flex items-center bg-slate-800 border border-slate-600 rounded-xl px-3">
                                    <input value={toolTank} onChange={e=>setToolTank(e.target.value)} placeholder="0" className="w-full bg-transparent border-none p-3 pl-0 text-sm text-white font-mono outline-none" />
                                    <span className="text-xs text-slate-500 font-bold">Lts</span>
                                </div>
                            </div>
                            <div>
                                <label className="text-[9px] text-slate-500 font-bold uppercase ml-1">Dosis Recomendada</label>
                                <div className="flex">
                                    <input value={toolDose} onChange={e=>setToolDose(e.target.value)} placeholder="0.0" className="flex-1 bg-slate-800 border-y border-l border-slate-600 rounded-l-xl p-3 text-sm text-white font-mono w-full min-w-0" />
                                    <select value={toolDoseUnit} onChange={e => setToolDoseUnit(e.target.value as any)} className="bg-slate-800 border border-slate-600 rounded-r-xl px-1 text-[10px] text-emerald-500 font-bold outline-none max-w-[60px]">
                                        <option value="cc">cc/Ha</option>
                                        <option value="ml">ml/Ha</option>
                                        <option value="L">L/Ha</option>
                                        <option value="g">g/Ha</option>
                                        <option value="Kg">Kg/Ha</option>
                                    </select>
                                </div>
                            </div>
                         </div>
                          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 text-center">
                            <p className="text-[10px] uppercase font-black text-emerald-500 mb-1">Producto a agregar al Tanque</p>
                            <p className="text-3xl font-mono font-black text-white">{toolCalculations.productPerTank.toFixed(1)} <span className="text-lg text-emerald-400">{toolDoseUnit}</span></p>
                            <p className="text-[9px] text-slate-500 mt-1 italic">Calculado automáticamente según el gasto de agua.</p>
                         </div>
                    </div>

                 </div>
            </div>
        )}

    </div>
  );
};