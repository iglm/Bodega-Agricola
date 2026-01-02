
import React, { useState, useEffect } from 'react';
import { Supplier, CostCenter, Personnel, AppState, Activity, CostClassification } from '../types';
import { X, Users, MapPin, Plus, Trash2, Settings, Mail, Home, Phone, Briefcase, UserCheck, DollarSign, Database, Download, Upload, AlertTriangle, LandPlot, Pickaxe, HardDrive, Sprout, Leaf, Bookmark, Info, Scale, ShieldCheck, Zap, Gavel, FileText, Save, CheckCircle, Ruler, Sun, CloudSun, AlertCircle } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';
import { LegalComplianceModal } from './LegalComplianceModal';

interface SettingsModalProps {
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel?: Personnel[];
  activities?: Activity[]; 
  fullState: AppState;
  onUpdateState: (data: AppState) => void;
  onAddSupplier: (name: string, phone: string, email: string, address: string) => void;
  onDeleteSupplier: (id: string) => void;
  onAddCostCenter: (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string, associatedCrop?: string, cropAgeMonths?: number, associatedCropDensity?: number) => void;
  onDeleteCostCenter: (id: string) => void;
  onAddPersonnel?: (person: Omit<Personnel, 'id' | 'warehouseId'>) => void;
  onDeletePersonnel?: (id: string) => void;
  onAddActivity?: (name: string, classification?: CostClassification) => void; 
  onDeleteActivity?: (id: string) => void; 
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  suppliers,
  costCenters,
  personnel = [],
  activities = [],
  fullState,
  onUpdateState,
  onAddSupplier,
  onDeleteSupplier,
  onAddCostCenter,
  onDeleteCostCenter,
  onAddPersonnel,
  onDeletePersonnel,
  onAddActivity,
  onDeleteActivity,
  onClose
}) => {
  const [activeTab, setActiveTab] = useState<'lotes' | 'proveedores' | 'personal' | 'labores' | 'config' | 'legal'>('proveedores');
  const [showLegalDetail, setShowLegalDetail] = useState(false);
  const [localFactor, setLocalFactor] = useState(fullState.laborFactor);
  const [factorSaved, setFactorSaved] = useState(false);
  
  // Lotes State
  const [loteName, setLoteName] = useState('');
  const [loteBudget, setLoteBudget] = useState('');
  const [loteArea, setLoteArea] = useState('');
  const [loteStage, setLoteStage] = useState<'Produccion' | 'Levante' | 'Infraestructura'>('Produccion');
  const [lotePlants, setLotePlants] = useState('');
  const [loteCrop, setLoteCrop] = useState('Café');
  const [associatedCrop, setAssociatedCrop] = useState('');
  const [loteCropAge, setLoteCropAge] = useState('');
  const [associatedCropDensity, setAssociatedCropDensity] = useState('');

  // Distancia de Siembra
  const [distSurco, setDistSurco] = useState('');
  const [distPlanta, setDistPlanta] = useState('');

  // Diagnóstico Agronómico
  const densityDiagnostic = useEffect(() => {
      const s = parseFloat(distSurco);
      const p = parseFloat(distPlanta);
      const a = parseFloat(loteArea);
      if (s > 0 && p > 0 && a > 0) {
          const plants = Math.round((a * 10000) / (s * p));
          setLotePlants(plants.toString());
      }
  }, [distSurco, distPlanta, loteArea]);

  const currentDensity = parseFloat(lotePlants) / (parseFloat(loteArea) || 1);

  const handleAddLote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteName.trim()) return;
    onAddCostCenter(
        loteName, 
        loteBudget ? parseFloat(loteBudget) : 0,
        loteArea ? parseFloat(loteArea) : undefined,
        loteStage,
        lotePlants ? parseInt(lotePlants) : undefined,
        loteCrop,
        associatedCrop || undefined,
        loteCropAge ? parseInt(loteCropAge) : undefined,
        associatedCropDensity ? parseInt(associatedCropDensity) : undefined
    );
    setLoteName(''); setLoteBudget(''); setLoteArea(''); setLotePlants(''); setAssociatedCrop('');
    setDistSurco(''); setDistPlanta('');
    setLoteCropAge('');
    setAssociatedCropDensity('');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    onAddSupplier(supName, supPhone, supEmail, supAddress);
    setSupName(''); setSupPhone(''); setSupEmail(''); setSupAddress('');
  };

  // Supplier State
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Personnel State
  const [perName, setPerName] = useState('');
  const [perRole, setPerRole] = useState('');
  const [perDoc, setPerDoc] = useState('');
  const [perPhone, setPerPhone] = useState('');
  const [perEmergency, setPerEmergency] = useState('');
  const [perEps, setPerEps] = useState('');
  const [perArl, setPerArl] = useState(false);
  const [perBirth, setPerBirth] = useState('');
  const [perDisability, setPerDisability] = useState('');

  // Activity State
  const [actName, setActName] = useState('');
  const [actClass, setActClass] = useState<CostClassification>('JOINT');

  const handleAddPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perName.trim() || !onAddPersonnel) return;
    onAddPersonnel({
      name: perName, role: perRole, documentId: perDoc, phone: perPhone,
      emergencyContact: perEmergency, eps: perEps, arl: perArl, birthDate: perBirth,
      disability: perDisability || undefined
    });
    setPerName(''); setPerRole(''); setPerDoc(''); setPerPhone(''); setPerEmergency(''); setPerEps(''); setPerArl(false); setPerBirth(''); setPerDisability('');
  }

  const handleAddActivity = (e: React.FormEvent) => {
      e.preventDefault();
      if (!actName.trim() || !onAddActivity) return;
      onAddActivity(actName, actClass);
      setActName(''); setActClass('JOINT');
  }

  const handleSaveFactor = () => {
    onUpdateState({ ...fullState, laborFactor: localFactor });
    setFactorSaved(true);
    setTimeout(() => setFactorSaved(false), 2000);
  };

  const commonCrops = ['Café', 'Cacao', 'Plátano', 'Banano', 'Aguacate', 'Cítricos', 'Maíz', 'Caña', 'Otro'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-lg rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-purple-900/30 p-2 rounded-xl border border-purple-500/30">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">Configuración de Maestros</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Estructura de Unidad Productiva</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex bg-slate-950 p-1 overflow-x-auto scrollbar-hide">
          {['proveedores', 'lotes', 'personal', 'labores', 'config', 'legal'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 p-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all rounded-xl ${activeTab === tab ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-white'}`}
            >
              {tab === 'proveedores' && <Users className="w-3 h-3" />}
              {tab === 'lotes' && <MapPin className="w-3 h-3" />}
              {tab === 'personal' && <UserCheck className="w-3 h-3" />}
              {tab === 'labores' && <Pickaxe className="w-3 h-3" />}
              {tab === 'config' && <Scale className="w-3 h-3" />}
              {tab === 'legal' && <Gavel className="w-3 h-3" />}
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          {activeTab === 'lotes' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleAddLote} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                <h4 className="text-emerald-500 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Lote</h4>
                
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

                    {currentDensity > 0 && (
                        <div className={`p-4 rounded-2xl border flex items-start gap-4 transition-all ${currentDensity < 4500 ? 'bg-red-950/20 border-red-500/30' : currentDensity > 8000 ? 'bg-indigo-950/20 border-indigo-500/30' : 'bg-emerald-950/20 border-emerald-500/30'}`}>
                            <div className={`p-2 rounded-xl ${currentDensity < 4500 ? 'bg-red-600' : currentDensity > 8000 ? 'bg-indigo-600' : 'bg-emerald-600'}`}>
                                {currentDensity < 4500 ? <AlertTriangle className="w-5 h-5 text-white" /> : currentDensity > 8000 ? <Zap className="w-5 h-5 text-white" /> : <ShieldCheck className="w-5 h-5 text-white" />}
                            </div>
                            <div>
                                <p className={`text-[10px] font-black uppercase ${currentDensity < 4500 ? 'text-red-400' : currentDensity > 8000 ? 'text-indigo-400' : 'text-emerald-400'}`}>
                                    Densidad: {currentDensity.toLocaleString()} á/Ha
                                </p>
                                <p className="text-[9px] text-slate-400 leading-tight mt-1">
                                    {currentDensity < 4500 ? 'Inviabilidad Económica: El árbol no intercepta suficiente luz solar (IAF subóptimo).' : 
                                     currentDensity > 8000 ? 'Alto Rendimiento: Ciclo de vida corto. Requiere Zoca al 5to año por cierre de calles.' : 
                                     'Modelo Equilibrado: Recomendado para variedades de porte medio/alto.'}
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <input type="text" value={loteName} onChange={e => setLoteName(e.target.value)} placeholder="Nombre del Lote (Ej: La Ladera)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                <input type="number" value={loteBudget} onChange={e => setLoteBudget(e.target.value)} placeholder="Presupuesto Anual ($)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-slate-500 uppercase ml-1">Área (Hectáreas)</label>
                      <input type="number" value={loteArea} onChange={e => setLoteArea(e.target.value)} placeholder="0.0" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                  </div>
                  <div className="space-y-1">
                      <label className="text-[9px] font-black text-indigo-400 uppercase ml-1">Población Total</label>
                      <input type="number" value={lotePlants} onChange={e => setLotePlants(e.target.value)} className="w-full bg-slate-950 border border-indigo-500/30 rounded-xl p-3 text-sm text-indigo-400 font-bold" readOnly />
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

              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {costCenters.map(c => (
                  <div key={c.id} className="bg-slate-900/50 p-4 rounded-2xl flex justify-between items-center border border-slate-700/50">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-slate-800 rounded-xl"><MapPin className="w-4 h-4 text-slate-500" /></div>
                      <div>
                        <p className="text-sm font-bold text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-400 font-bold uppercase">{c.area} Ha • {c.cropType}</p>
                      </div>
                    </div>
                    <button onClick={() => onDeleteCostCenter(c.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'proveedores' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleAddSupplier} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-3">
                 <h4 className="text-emerald-500 text-xs uppercase font-black flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Proveedor</h4>
                 <input type="text" value={supName} onChange={e => setSupName(e.target.value)} placeholder="Nombre del Proveedor" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" required />
                 <input type="text" value={supPhone} onChange={e => setSupPhone(e.target.value)} placeholder="Teléfono" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                 <input type="email" value={supEmail} onChange={e => setSupEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                 <input type="text" value={supAddress} onChange={e => setSupAddress(e.target.value)} placeholder="Dirección" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                 <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg text-xs uppercase">Guardar Proveedor</button>
              </form>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {suppliers.map(s => (
                  <div key={s.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50">
                    <div>
                      <p className="text-sm font-bold text-white">{s.name}</p>
                      <p className="text-xs text-slate-400">{s.phone}</p>
                    </div>
                    <button onClick={() => onDeleteSupplier(s.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'personal' && onAddPersonnel && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleAddPersonnel} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-emerald-500 text-xs uppercase font-black flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Trabajador</h4>
                <div className="grid grid-cols-2 gap-2">
                    <input type="text" value={perName} onChange={e => setPerName(e.target.value)} placeholder="Nombre Completo" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" required />
                    <input type="text" value={perRole} onChange={e => setPerRole(e.target.value)} placeholder="Cargo (Ej: Operario)" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" required />
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <input type="date" value={perBirth} onChange={e => setPerBirth(e.target.value)} placeholder="Fecha Nacimiento" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                    <input type="text" value={perDisability} onChange={e => setPerDisability(e.target.value)} placeholder="Discapacidad (Opcional)" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg text-xs uppercase">Guardar Trabajador</button>
              </form>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {personnel.map(p => (
                  <div key={p.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50">
                    <div><p className="text-sm font-bold text-white">{p.name}</p><p className="text-xs text-slate-400">{p.role}</p></div>
                    <button onClick={() => onDeletePersonnel && onDeletePersonnel(p.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'labores' && onAddActivity && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleAddActivity} className="bg-slate-900/50 p-4 rounded-xl border border-slate-700 space-y-3">
                <h4 className="text-emerald-500 text-xs uppercase font-black flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Labor</h4>
                <input type="text" value={actName} onChange={e => setActName(e.target.value)} placeholder="Nombre de la Labor" className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white" required />
                <select value={actClass} onChange={e => setActClass(e.target.value as CostClassification)} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white">
                    <option value="JOINT">Costo Conjunto</option><option value="COFFEE">Costo Café</option><option value="PLANTAIN">Costo Plátano</option><option value="OTHER">Otro</option>
                </select>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg text-xs uppercase">Guardar Labor</button>
              </form>
              <div className="space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                {activities.map(a => (<div key={a.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center border border-slate-700/50"><div><p className="text-sm font-bold text-white">{a.name}</p></div><button onClick={() => onDeleteActivity && onDeleteActivity(a.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 className="w-4 h-4" /></button></div>))}
              </div>
            </div>
          )}

          {activeTab === 'config' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 space-y-4">
                <h4 className="text-emerald-500 text-xs uppercase font-black flex items-center gap-2"><Scale className="w-4 h-4"/> Parámetros de Rentabilidad</h4>
                <div className="space-y-2">
                  <label className="text-sm text-white font-bold">Factor Prestacional de Nómina</label>
                  <p className="text-xs text-slate-400">Multiplicador sobre el pago neto para estimar el costo real (con carga social). Colombia: 1.52</p>
                  <input type="number" step="0.01" value={localFactor} onChange={e => setLocalFactor(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-lg text-white font-mono" />
                </div>
                <button onClick={handleSaveFactor} className="w-full bg-emerald-600 text-white font-bold py-3 rounded-lg text-xs uppercase flex items-center justify-center gap-2">
                  {factorSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />} {factorSaved ? 'Guardado' : 'Guardar Factor'}
                </button>
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900/50 p-6 rounded-xl border border-slate-700 space-y-4">
                    <h4 className="text-emerald-500 text-xs uppercase font-black flex items-center gap-2"><Gavel className="w-4 h-4"/> Cumplimiento y Soporte</h4>
                    <button onClick={() => setShowLegalDetail(true)} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-bold py-3 rounded-lg text-xs uppercase flex items-center justify-center gap-2">
                        <FileText className="w-4 h-4" /> Ver Marco Jurídico Completo
                    </button>
                </div>
            </div>
          )}
        </div>

        {showLegalDetail && <LegalComplianceModal onClose={() => setShowLegalDetail(false)} />}
      </div>
    </div>
  );
};
