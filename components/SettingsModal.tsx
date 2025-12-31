

import React, { useState, useEffect } from 'react';
import { Supplier, CostCenter, Personnel, AppState, Activity, CostClassification } from '../types';
import { X, Users, MapPin, Plus, Trash2, Settings, Mail, Home, Phone, Briefcase, UserCheck, DollarSign, Database, Download, Upload, AlertTriangle, LandPlot, Pickaxe, HardDrive, Sprout, Leaf, Bookmark, Info, Scale, ShieldCheck, Zap, Gavel, FileText, Save, CheckCircle } from 'lucide-react';
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
  onAddCostCenter: (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string, associatedCrop?: string) => void;
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

  // Activity State
  const [actName, setActName] = useState('');
  const [actClass, setActClass] = useState<CostClassification>('JOINT');

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
        associatedCrop || undefined
    );
    setLoteName(''); setLoteBudget(''); setLoteArea(''); setLotePlants(''); setAssociatedCrop('');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    onAddSupplier(supName, supPhone, supEmail, supAddress);
    setSupName(''); setSupPhone(''); setSupEmail(''); setSupAddress('');
  };

  const handleAddPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perName.trim() || !onAddPersonnel) return;
    onAddPersonnel({
      name: perName, role: perRole, documentId: perDoc, phone: perPhone,
      emergencyContact: perEmergency, eps: perEps, arl: perArl, birthDate: perBirth
    });
    setPerName(''); setPerRole(''); setPerDoc(''); setPerPhone(''); setPerEmergency(''); setPerEps(''); setPerArl(false); setPerBirth('');
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
          
          {activeTab === 'proveedores' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleAddSupplier} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                <h4 className="text-emerald-500 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Proveedor</h4>
                <input type="text" value={supName} onChange={e => setSupName(e.target.value)} placeholder="Nombre del Proveedor" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                <div className="grid grid-cols-2 gap-3">
                    <input type="text" value={supPhone} onChange={e => setSupPhone(e.target.value)} placeholder="Teléfono" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                    <input type="email" value={supEmail} onChange={e => setSupEmail(e.target.value)} placeholder="Email" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                </div>
                <input type="text" value={supAddress} onChange={e => setSupAddress(e.target.value)} placeholder="Dirección" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Añadir Proveedor</button>
              </form>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {suppliers.map(s => (
                  <div key={s.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-bold text-white">{s.name}</p>
                        <p className="text-[10px] text-slate-400">{s.phone || 'Sin teléfono'}</p>
                      </div>
                    </div>
                    <button onClick={() => onDeleteSupplier(s.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'personal' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleAddPersonnel} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                  <h4 className="text-emerald-500 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Trabajador</h4>
                  <div className="grid grid-cols-2 gap-3">
                      <input type="text" value={perName} onChange={e => setPerName(e.target.value)} placeholder="Nombre Completo" className="col-span-2 w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                      <input type="text" value={perRole} onChange={e => setPerRole(e.target.value)} placeholder="Rol (Ej: Operario)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                      <input type="text" value={perDoc} onChange={e => setPerDoc(e.target.value)} placeholder="Documento ID" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                      <input type="tel" value={perPhone} onChange={e => setPerPhone(e.target.value)} placeholder="Teléfono" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                      <input type="tel" value={perEmergency} onChange={e => setPerEmergency(e.target.value)} placeholder="Contacto Emergencia" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                      <input type="text" value={perEps} onChange={e => setPerEps(e.target.value)} placeholder="EPS" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                      <input type="date" value={perBirth} onChange={e => setPerBirth(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                  </div>
                  <label className="flex items-center gap-3 p-3 bg-slate-900 rounded-xl border border-slate-700 cursor-pointer">
                      <input type="checkbox" checked={perArl} onChange={e => setPerArl(e.target.checked)} className="h-4 w-4 rounded text-emerald-500 bg-slate-800 border-slate-600 focus:ring-emerald-500"/>
                      <span className="text-sm font-bold text-white">Afiliado a ARL</span>
                  </label>
                  <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Añadir Trabajador</button>
              </form>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {personnel.map(p => (
                  <div key={p.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <UserCheck className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-bold text-white">{p.name}</p>
                        <p className="text-[10px] text-slate-400">{p.role}</p>
                      </div>
                    </div>
                    <button onClick={() => onDeletePersonnel && onDeletePersonnel(p.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'labores' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleAddActivity} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                <h4 className="text-emerald-500 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nueva Labor</h4>
                <input type="text" value={actName} onChange={e => setActName(e.target.value)} placeholder="Nombre de la Labor (Ej: Plateo)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                <select value={actClass} onChange={e => setActClass(e.target.value as CostClassification)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white">
                    <option value="JOINT">Costo Conjunto</option>
                    <option value="COFFEE">Solo Café</option>
                    <option value="PLANTAIN">Solo Plátano</option>
                    <option value="OTHER">Otro Cultivo</option>
                </select>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Añadir Labor</button>
              </form>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {activities.map(a => (
                  <div key={a.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <Pickaxe className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-bold text-white">{a.name}</p>
                        <p className="text-[10px] text-slate-400">{a.costClassification}</p>
                      </div>
                    </div>
                    <button onClick={() => onDeleteActivity && onDeleteActivity(a.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'lotes' && (
            <div className="space-y-6 animate-fade-in">
              <form onSubmit={handleAddLote} className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                <h4 className="text-emerald-500 text-xs uppercase font-black mb-2 flex items-center gap-2"><Plus className="w-4 h-4" /> Nuevo Lote / Centro de Costo</h4>
                <input type="text" value={loteName} onChange={e => setLoteName(e.target.value)} placeholder="Nombre del Lote" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" required />
                <div className="grid grid-cols-2 gap-3">
                  <input type="number" value={loteArea} onChange={e => setLoteArea(e.target.value)} placeholder="Área (Ha)" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                  <select value={loteCrop} onChange={e => setLoteCrop(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white">
                      {commonCrops.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <input type="number" value={lotePlants} onChange={e => setLotePlants(e.target.value)} placeholder="Nº de Plantas" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                  <input type="text" value={associatedCrop} onChange={e => setAssociatedCrop(e.target.value)} placeholder="Cultivo Asociado" className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-sm text-white" />
                </div>
                <button type="submit" className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl text-xs uppercase">Añadir Lote</button>
              </form>
              
              <div className="mt-4 bg-slate-900/50 p-4 rounded-2xl border border-slate-700 flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                  <p className="text-[10px] text-slate-400 leading-tight">
                      <strong>Guía Rápida:</strong> El registro de lluvias y mantenimientos se realiza desde la pestaña principal <strong>"Campo"</strong>. Aquí se configuran los lotes base.
                  </p>
              </div>

              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {costCenters.map(c => (
                  <div key={c.id} className="bg-slate-900/50 p-3 rounded-xl flex justify-between items-center">
                    <div className="flex items-center gap-3">
                      <MapPin className="w-4 h-4 text-slate-500" />
                      <div>
                        <p className="text-sm font-bold text-white">{c.name}</p>
                        <p className="text-[10px] text-slate-400">{c.area} Ha • {c.cropType}</p>
                      </div>
                    </div>
                    <button onClick={() => onDeleteCostCenter(c.id)} className="p-2 text-slate-500 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'legal' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                      <h4 className="text-emerald-500 text-xs uppercase font-black mb-4 flex items-center gap-2">
                          <ShieldCheck className="w-4 h-4" /> Centro de Transparencia
                      </h4>
                      <p className="text-xs text-slate-400 leading-relaxed font-medium">
                          Consulta en cualquier momento los términos legales, tu política de privacidad y tus derechos como usuario.
                      </p>
                      <button 
                          onClick={() => setShowLegalDetail(true)}
                          className="w-full bg-slate-950 border border-slate-700 p-6 rounded-3xl flex items-center justify-between hover:bg-slate-900 transition-all group"
                      >
                          <div className="flex items-center gap-4">
                              <FileText className="w-6 h-6 text-emerald-500" />
                              <div className="text-left">
                                  <p className="font-black text-sm text-white uppercase">Política de Privacidad</p>
                                  <p className="text-[9px] text-slate-500 font-bold">Habeas Data & Uso de Datos 2025</p> {/* Updated text */}
                              </div>
                          </div>
                          <Zap className="w-5 h-5 text-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>

                      <div className="bg-blue-900/10 p-4 rounded-2xl border border-blue-500/30 flex gap-3 items-start mt-4">
                          <Info className="w-5 h-5 text-blue-400 shrink-0" />
                          <p className="text-[9px] text-slate-400 leading-tight italic">
                              DatosFinca Viva se adhiere estrictamente a la Ley 1581 de 2012. Tus datos de finca son privados y se almacenan exclusivamente de forma local.
                          </p>
                      </div>
                  </div>
              </div>
          )}

          {activeTab === 'config' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-900/50 p-6 rounded-[2rem] border border-slate-700 space-y-4">
                      <h4 className="text-amber-500 text-xs uppercase font-black mb-4 flex items-center gap-2">
                          <Scale className="w-4 h-4" /> Costeo de Mano de Obra
                      </h4>
                      <p className="text-xs text-slate-400 font-medium">
                          Define el factor prestacional para calcular el costo real de la empresa por cada jornal pagado.
                      </p>
                      <div>
                          <label className="block text-xs font-black text-slate-400 uppercase ml-2">Factor Multiplicador</label>
                          <div className="flex items-center gap-2 mt-1">
                              <input 
                                  type="number"
                                  step="0.01"
                                  value={localFactor}
                                  onChange={(e) => setLocalFactor(parseFloat(e.target.value) || 1.0)}
                                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl p-4 text-amber-500 font-mono font-black text-lg outline-none focus:ring-2 focus:ring-amber-500"
                              />
                              <button onClick={handleSaveFactor} className="p-4 bg-emerald-600 text-white rounded-xl disabled:bg-slate-600">
                                  {factorSaved ? <CheckCircle className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                              </button>
                          </div>
                      </div>
                      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-700 flex items-start gap-3">
                         <Info className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
                         <p className="text-[9px] text-slate-400 leading-tight">
                             <strong>Guía:</strong> Factor <strong>1.0</strong> para jornal informal. Factor <strong>1.52</strong> para empresa formal (incluye parafiscales y prestaciones). Puede ajustarlo a su medida.
                         </p>
                      </div>
                  </div>
              </div>
          )}
        </div>
      </div>
      {showLegalDetail && <LegalComplianceModal onClose={() => setShowLegalDetail(false)} />}
    </div>
  );
};