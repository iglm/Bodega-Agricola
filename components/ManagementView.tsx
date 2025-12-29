
import React, { useState, useMemo } from 'react';
import { Machine, MaintenanceLog, RainLog, CostCenter, Personnel, Activity, SoilAnalysis, PPELog, WasteLog, Asset, BpaCriterion, PhenologyLog, PestLog } from '../types';
import { formatCurrency, generateId } from '../services/inventoryService';
import { Settings, Wrench, Droplets, Plus, Trash2, Fuel, PenTool, FileText, FileSpreadsheet, Download, Gauge, User, MapPin, Pickaxe, DollarSign, CheckCircle, ArrowRight, Tractor, Microscope, ShieldCheck, Recycle, Signature, UserCheck, ShieldAlert, FileCheck, Pencil, Globe, ClipboardList, Briefcase, Droplet, AlertTriangle, Bookmark, Shield, Zap, Info, Clock, CheckCircle2, Leaf, Bug } from 'lucide-react';

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

const BPA_TEMPLATE: BpaCriterion[] = [
  { id: '1', category: 'CHEMICALS', code: 'CH.01', label: 'Bodega de químicos ventilada y con llave', isCritical: true, compliant: false },
  { id: '2', category: 'CHEMICALS', code: 'CH.02', label: 'Registro de aplicaciones (Res. 082394)', isCritical: true, compliant: false },
  { id: '3', category: 'SST', code: 'SST.01', label: 'Uso de EPP según etiqueta de producto', isCritical: true, compliant: false },
  { id: '4', category: 'SST', code: 'SST.02', label: 'Botiquín de primeros auxilios dotado', isCritical: false, compliant: false },
  { id: '5', category: 'ENVIRONMENT', code: 'ENV.01', label: 'Triple lavado y perforación de envases', isCritical: true, compliant: false },
  { id: '6', category: 'TRACEABILITY', code: 'TRA.01', label: 'Registros de cosecha diarios por lote', isCritical: true, compliant: false },
  { id: '7', category: 'INFRASTRUCTURE', code: 'INF.01', label: 'Instalaciones sanitarias limpias y con agua', isCritical: true, compliant: false },
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
  const [toolWidth, setToolWidth] = useState('');
  const [toolSpeed, setToolSpeed] = useState('');
  const [toolTank, setToolTank] = useState('');
  const [toolDose, setToolDose] = useState('');


  const bpaSummary = useMemo(() => {
    const criteria = BPA_TEMPLATE.map(c => ({ ...c, compliant: !!bpaChecklist[c.code] }));
    const total = criteria.length;
    const compliant = criteria.filter(c => c.compliant).length;
    const criticalFail = criteria.some(c => c.isCritical && !c.compliant);
    return { criteria, percent: (compliant / total) * 100, criticalFail };
  }, [bpaChecklist]);

  const toolCalculations = useMemo(() => {
      const discharge = parseFloat(toolDischarge);
      const width = parseFloat(toolWidth);
      const speed = parseFloat(toolSpeed);
      if (!discharge || !width || !speed) return { LHa: 0, productPerTank: 0 };
      
      const LHa = (discharge * 600) / (width * speed);
      const tank = parseFloat(toolTank);
      const dose = parseFloat(toolDose);
      
      let productPerTank = 0;
      if (LHa > 0 && tank > 0 && dose > 0) {
          productPerTank = (tank * dose) / LHa;
      }

      return { LHa, productPerTank };
  }, [toolDischarge, toolWidth, toolSpeed, toolTank, toolDose]);

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
  
  const handleSaveCalibration = () => {
      const machine = machines.find(m => m.id === toolMachineId);
      if (!machine) return;
      const updatedMachine = { ...machine, dischargeRateLitersPerMin: parseFloat(toolDischarge), avgSpeedKmh: parseFloat(toolSpeed) };
      onUpdateMachine(updatedMachine);
      alert("Calibración guardada!");
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
                <div className={`p-8 rounded-[3rem] text-center border-2 transition-all ${bpaSummary.criticalFail ? 'bg-red-950/20 border-red-500/50' : 'bg-emerald-950/20 border-emerald-500/50'}`}>
                    <h3 className="font-black text-xl flex items-center justify-center gap-2 uppercase tracking-tighter mb-4"><Globe className={`w-6 h-6 ${bpaSummary.criticalFail ? 'text-red-500' : 'text-emerald-500'}`} /> Radar Certificación BPA</h3>
                    <div className="relative w-32 h-32 mx-auto mb-4">
                        <svg className="w-full h-full transform -rotate-90"><circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-800" /><circle cx="64" cy="64" r="58" stroke="currentColor" strokeWidth="8" fill="transparent" strokeDasharray={364} strokeDashoffset={364 - (364 * bpaSummary.percent / 100)} className={bpaSummary.criticalFail ? 'text-red-500' : 'text-emerald-500'} /></svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-3xl font-black text-white">{bpaSummary.percent.toFixed(0)}%</span></div>
                    </div>
                    {bpaSummary.criticalFail && (<div className="bg-red-500 text-white text-[10px] font-black px-4 py-2 rounded-full inline-flex items-center gap-2 animate-bounce"><AlertTriangle className="w-4 h-4" /> REQUERIMIENTOS MAYORES INCUMPLIDOS</div>)}
                    <p className="text-[10px] text-slate-400 mt-4 uppercase font-bold">Res. ICA 082394 de 2020</p>
                </div>
                <div className="space-y-3">
                    {bpaSummary.criteria.map(c => (<div key={c.code} onClick={() => onToggleBpa(c.code)} className={`p-5 rounded-[2rem] border transition-all cursor-pointer flex items-center justify-between group ${c.compliant ? 'bg-emerald-900/10 border-emerald-500/30 shadow-emerald-900/20' : 'bg-slate-900 border-slate-700'}`}><div className="flex gap-4 items-center"><div className={`p-3 rounded-2xl ${c.compliant ? 'bg-emerald-500 text-white' : 'bg-slate-800 text-slate-500 group-hover:bg-slate-700'}`}>{c.compliant ? <CheckCircle2 className="w-5 h-5" /> : <div className="w-5 h-5 border-2 border-current rounded-full" />}</div><div><div className="flex items-center gap-2"><span className="text-[9px] font-black text-slate-500">{c.code}</span>{c.isCritical && <span className="text-[8px] bg-red-500 text-white px-1.5 rounded uppercase font-black">Fundamental</span>}</div><p className={`text-sm font-bold ${c.compliant ? 'text-white' : 'text-slate-400'}`}>{c.label}</p></div></div><ArrowRight className={`w-4 h-4 transition-transform ${c.compliant ? 'text-emerald-500' : 'text-slate-600 group-hover:translate-x-1'}`} /></div>))}
                </div>
            </div>
        )}

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
                    <h4 className="text-amber-400 text-xs uppercase font-black mb-2 flex items-center gap-2"><Tractor className="w-4 h-4" /> Calibración y Dosificación</h4>
                     
                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 mb-2">1. Calibración del Equipo</h5>
                         <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            <input value={toolDischarge} onChange={e=>setToolDischarge(e.target.value)} placeholder="L/min Boquilla" className="bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white" />
                            <input value={toolWidth} onChange={e=>setToolWidth(e.target.value)} placeholder="Ancho Faja (m)" className="bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white" />
                            <input value={toolSpeed} onChange={e=>setToolSpeed(e.target.value)} placeholder="Velocidad (Km/h)" className="bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white" />
                         </div>
                         <div className="mt-4 p-4 rounded-2xl bg-amber-950/50 border border-amber-500/20 text-center">
                            <p className="text-[10px] uppercase font-black text-amber-500">Gasto de Agua (L/Ha)</p>
                            <p className="text-2xl font-mono font-black text-white">{toolCalculations.LHa.toFixed(1)}</p>
                         </div>
                    </div>

                    <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700">
                        <h5 className="text-[10px] font-black uppercase text-slate-400 mb-2">2. Mezcla de Tanque</h5>
                         <div className="grid grid-cols-2 gap-3">
                            <input value={toolTank} onChange={e=>setToolTank(e.target.value)} placeholder="Tanque (L)" className="bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white" />
                            <input value={toolDose} onChange={e=>setToolDose(e.target.value)} placeholder="Dosis (L o Kg / Ha)" className="bg-slate-800 border border-slate-600 rounded-xl p-3 text-sm text-white" />
                         </div>
                          <div className="mt-4 p-4 rounded-2xl bg-emerald-950/50 border border-emerald-500/20 text-center">
                            <p className="text-[10px] uppercase font-black text-emerald-500">Producto por Tanque (L o Kg)</p>
                            <p className="text-2xl font-mono font-black text-white">{toolCalculations.productPerTank.toFixed(2)}</p>
                         </div>
                    </div>

                 </div>
            </div>
        )}

    </div>
  );
};
