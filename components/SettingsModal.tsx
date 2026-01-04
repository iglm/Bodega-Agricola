
import React, { useState } from 'react';
import { Supplier, CostCenter, Personnel, AppState, Activity, CostClassification, ContractType } from '../types';
import { X, Users, MapPin, Plus, Trash2, Settings, UserCheck, Pickaxe, Scale, Gavel, FileText, Save, CheckCircle, Smartphone, Mail, Phone, AtSign, Briefcase, Sprout, LayoutGrid, ScrollText, HeartPulse, Clock, Contact } from 'lucide-react';

interface SettingsModalProps {
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel?: Personnel[];
  activities?: Activity[]; 
  fullState: AppState;
  onUpdateState: (data: AppState) => void;
  onAddSupplier: (name: string, phone: string, email: string, address: string) => void;
  onDeleteSupplier: (id: string) => void;
  onAddCostCenter: (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string, associatedCrop?: string, cropAgeMonths?: number, associatedCropDensity?: number, associatedCropAge?: number) => void;
  onDeleteCostCenter: (id: string) => void;
  onAddPersonnel?: (person: Omit<Personnel, 'id' | 'warehouseId'>) => void;
  onDeletePersonnel?: (id: string) => void;
  onAddActivity?: (name: string, classification?: CostClassification) => void; 
  onDeleteActivity?: (id: string) => void; 
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  suppliers, costCenters, personnel = [], activities = [], fullState,
  onUpdateState, onAddSupplier, onDeleteSupplier, onAddCostCenter, onDeleteCostCenter,
  onAddPersonnel, onDeletePersonnel, onAddActivity, onDeleteActivity, onClose
}) => {
  const [activeTab, setActiveTab] = useState<'lotes' | 'proveedores' | 'personal' | 'labores' | 'config' | 'legal'>('proveedores');
  const [localFactor, setLocalFactor] = useState(fullState.laborFactor);
  const [factorSaved, setFactorSaved] = useState(false);
  
  // --- FORMS STATE ---
  // Suppliers
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  
  // Personnel Detailed Form
  const [persName, setPersName] = useState('');
  const [persRole, setPersRole] = useState('Trabajador');
  const [persPhone, setPersPhone] = useState('');
  const [persAge, setPersAge] = useState('');
  const [persEps, setPersEps] = useState('');
  const [persEmergPhone, setPersEmergPhone] = useState('');
  const [persEmergRel, setPersEmergRel] = useState('');
  const [persContractType, setPersContractType] = useState<ContractType>('OBRA_LABOR');
  const [persDurationUnit, setPersDurationUnit] = useState<'DIAS' | 'MESES' | 'INDEFINIDO'>('MESES');
  const [persDurationVal, setPersDurationVal] = useState('');

  // Activities
  const [actName, setActName] = useState('');
  const [actClass, setActClass] = useState<CostClassification>('JOINT');

  // Lots (Quick Add)
  const [lotName, setLotName] = useState('');

  const handleSaveFactor = () => {
    onUpdateState({ ...fullState, laborFactor: localFactor });
    setFactorSaved(true);
    setTimeout(() => setFactorSaved(false), 2000);
  };

  const handleAddSup = (e: React.FormEvent) => {
      e.preventDefault();
      if(!supName) return;
      onAddSupplier(supName, supPhone, '', ''); // Email/Address optional for quick add
      setSupName(''); setSupPhone('');
  };

  const handleAddPers = (e: React.FormEvent) => {
      e.preventDefault();
      if(!persName || !onAddPersonnel) return;
      
      onAddPersonnel({ 
          name: persName, 
          role: persRole,
          phone: persPhone,
          age: parseInt(persAge) || undefined,
          eps: persEps,
          emergencyPhone: persEmergPhone,
          emergencyRelation: persEmergRel,
          contractType: persContractType,
          contractDurationUnit: persContractType === 'INDEFINIDO' ? 'INDEFINIDO' : persDurationUnit,
          contractDurationValue: persContractType === 'INDEFINIDO' ? undefined : (parseInt(persDurationVal) || 0)
      });
      
      // Reset Form
      setPersName(''); setPersPhone(''); setPersAge(''); setPersEps('');
      setPersEmergPhone(''); setPersEmergRel(''); setPersContractType('OBRA_LABOR');
      setPersDurationVal(''); setPersDurationUnit('MESES');
  };

  const handleAddAct = (e: React.FormEvent) => {
      e.preventDefault();
      if(!actName || !onAddActivity) return;
      onAddActivity(actName, actClass);
      setActName('');
  };

  const handleAddLot = (e: React.FormEvent) => {
      e.preventDefault();
      if(!lotName) return;
      // Defaults for quick add
      onAddCostCenter(lotName, 0, 0, 'Produccion', 0, 'Café', 'Ninguno', 0);
      setLotName('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-2xl rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center shrink-0">
          <div className="flex items-center gap-3">
            <div className="bg-purple-900/30 p-2 rounded-xl border border-purple-500/30">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">Maestros del Sistema</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Gestión de Catálogos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* TABS SCROLLABLE */}
        <div className="bg-slate-950 p-2 overflow-x-auto scrollbar-hide shrink-0">
          <div className="flex gap-1 min-w-max">
            {[
                { id: 'proveedores', icon: Users, label: 'Proveedores' },
                { id: 'personal', icon: UserCheck, label: 'Personal' },
                { id: 'labores', icon: Pickaxe, label: 'Labores' },
                { id: 'lotes', icon: MapPin, label: 'Lotes' },
                { id: 'config', icon: Scale, label: 'Parámetros' },
                { id: 'legal', icon: Gavel, label: 'Legal' }
            ].map((tab) => (
                <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-4 py-2 text-[10px] font-black uppercase flex items-center gap-2 transition-all rounded-xl ${activeTab === tab.id ? 'bg-slate-800 text-emerald-400 border border-slate-700' : 'text-slate-500 hover:text-white hover:bg-slate-900'}`}
                >
                <tab.icon className="w-3 h-3" />
                {tab.label}
                </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-slate-900/50 space-y-6">
          
          {/* --- TAB: PROVEEDORES --- */}
          {activeTab === 'proveedores' && (
              <div className="space-y-6 animate-fade-in">
                  <form onSubmit={handleAddSup} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-3 items-end">
                      <div className="flex-1 w-full space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Nombre Empresa / Persona</label>
                          <input value={supName} onChange={e=>setSupName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-sm outline-none focus:border-emerald-500" placeholder="Ej: Agroinsumos del Café" required />
                      </div>
                      <div className="w-full md:w-1/3 space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Teléfono</label>
                          <input value={supPhone} onChange={e=>setSupPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-sm outline-none focus:border-emerald-500" placeholder="Opcional" />
                      </div>
                      <button type="submit" className="w-full md:w-auto p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-500 transition-colors"><Plus className="w-5 h-5" /></button>
                  </form>

                  <div className="space-y-2">
                      {suppliers.map(s => (
                          <div key={s.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 group">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400"><Briefcase className="w-4 h-4"/></div>
                                  <div>
                                      <p className="text-sm font-bold text-white">{s.name}</p>
                                      {s.phone && <p className="text-[10px] text-slate-400 flex items-center gap-1"><Phone className="w-3 h-3"/> {s.phone}</p>}
                                  </div>
                              </div>
                              <button onClick={() => { if(confirm('¿Eliminar proveedor?')) onDeleteSupplier(s.id); }} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                      ))}
                      {suppliers.length === 0 && <p className="text-center text-xs text-slate-500 py-4">No hay proveedores registrados.</p>}
                  </div>
              </div>
          )}

          {/* --- TAB: PERSONAL (ACTUALIZADO) --- */}
          {activeTab === 'personal' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-slate-800 p-5 rounded-3xl border border-slate-700 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                          <UserCheck className="w-5 h-5 text-indigo-400" />
                          <h4 className="text-xs font-black text-white uppercase tracking-widest">Nuevo Trabajador</h4>
                      </div>
                      
                      {/* 1. Datos Básicos */}
                      <div className="grid grid-cols-2 gap-3">
                          <div className="col-span-2 md:col-span-1 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Nombre Completo</label>
                              <input value={persName} onChange={e=>setPersName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-xs outline-none focus:border-indigo-500" placeholder="Ej: Juan Pérez" required />
                          </div>
                          <div className="col-span-1 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Edad</label>
                              <input type="number" value={persAge} onChange={e=>setPersAge(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-xs outline-none focus:border-indigo-500" placeholder="Años" />
                          </div>
                          <div className="col-span-1 space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Rol</label>
                              <select value={persRole} onChange={e=>setPersRole(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-xs outline-none focus:border-indigo-500">
                                  <option>Trabajador</option>
                                  <option>Mayordomo</option>
                                  <option>Administrador</option>
                                  <option>Contratista</option>
                              </select>
                          </div>
                      </div>

                      {/* 2. Salud y Contacto */}
                      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-700/50">
                          <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><HeartPulse className="w-3 h-3"/> EPS</label>
                              <input value={persEps} onChange={e=>setPersEps(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-xs outline-none focus:border-indigo-500" placeholder="Ej: Sura / Nueva EPS" />
                          </div>
                          <div className="space-y-1">
                              <label className="text-[9px] font-bold text-slate-500 uppercase ml-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Celular</label>
                              <input value={persPhone} onChange={e=>setPersPhone(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-xs outline-none focus:border-indigo-500" placeholder="3xx xxx xxxx" />
                          </div>
                      </div>

                      {/* 3. Emergencia */}
                      <div className="bg-slate-900/50 p-3 rounded-2xl border border-slate-700 space-y-3">
                          <label className="text-[9px] font-black text-red-400 uppercase flex items-center gap-1"><Contact className="w-3 h-3"/> Contacto de Emergencia</label>
                          <div className="grid grid-cols-2 gap-3">
                              <input value={persEmergPhone} onChange={e=>setPersEmergPhone(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2 text-white text-xs outline-none focus:border-red-500" placeholder="Teléfono" />
                              <input value={persEmergRel} onChange={e=>setPersEmergRel(e.target.value)} className="w-full bg-slate-800 border border-slate-600 rounded-xl p-2 text-white text-xs outline-none focus:border-red-500" placeholder="Parentesco (Ej: Esposa)" />
                          </div>
                      </div>

                      {/* 4. Contratación Legal */}
                      <div className="space-y-3 pt-2 border-t border-slate-700/50">
                          <label className="text-[9px] font-bold text-emerald-500 uppercase ml-1 flex items-center gap-1"><Gavel className="w-3 h-3"/> Tipo de Contrato (Norma Colombia)</label>
                          <select value={persContractType} onChange={e=>setPersContractType(e.target.value as ContractType)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-xs font-bold outline-none focus:border-emerald-500">
                              <option value="OBRA_LABOR">Obra o Labor (Duración de la tarea)</option>
                              <option value="FIJO">Término Fijo</option>
                              <option value="INDEFINIDO">Término Indefinido</option>
                              <option value="PRESTACION_SERVICIOS">Prestación de Servicios</option>
                          </select>

                          {persContractType !== 'INDEFINIDO' && (
                              <div className="flex gap-2 items-center bg-slate-900 p-2 rounded-xl border border-slate-700">
                                  <Clock className="w-4 h-4 text-slate-400 ml-1" />
                                  <input type="number" value={persDurationVal} onChange={e=>setPersDurationVal(e.target.value)} className="flex-1 bg-transparent text-white text-sm font-bold outline-none text-center border-b border-slate-600 focus:border-emerald-500" placeholder="0" />
                                  <select value={persDurationUnit} onChange={e=>setPersDurationUnit(e.target.value as any)} className="bg-slate-800 text-slate-300 text-[10px] font-bold uppercase rounded-lg p-1 border-none outline-none">
                                      <option value="DIAS">Días</option>
                                      <option value="MESES">Meses</option>
                                  </select>
                              </div>
                          )}
                      </div>

                      <button onClick={handleAddPers} disabled={!persName} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3 rounded-xl text-xs uppercase shadow-lg transition-all active:scale-95 disabled:opacity-50">
                          Guardar Trabajador
                      </button>
                  </div>

                  <div className="space-y-2">
                      {personnel.map(p => (
                          <div key={p.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 group">
                              <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs">{p.name[0]}</div>
                                  <div>
                                      <p className="text-sm font-bold text-white">{p.name}</p>
                                      <p className="text-[10px] text-slate-400 uppercase flex items-center gap-1">
                                          {p.role} • {p.contractType === 'PRESTACION_SERVICIOS' ? 'OPS' : 'Laboral'}
                                      </p>
                                  </div>
                              </div>
                              <button onClick={() => { if(onDeletePersonnel && confirm('¿Eliminar trabajador?')) onDeletePersonnel(p.id); }} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                      ))}
                      {personnel.length === 0 && <p className="text-center text-xs text-slate-500 py-4">No hay personal registrado.</p>}
                  </div>
              </div>
          )}

          {/* --- TAB: LABORES --- */}
          {activeTab === 'labores' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-blue-900/10 p-3 rounded-xl border border-blue-500/20 text-[10px] text-blue-300">
                      <p>Defina las actividades estandarizadas para el registro rápido de jornales.</p>
                  </div>
                  <form onSubmit={handleAddAct} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex flex-col md:flex-row gap-3 items-end">
                      <div className="flex-1 w-full space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Nombre Labor</label>
                          <input value={actName} onChange={e=>setActName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-sm outline-none focus:border-emerald-500" placeholder="Ej: Guadaña / Plateo" required />
                      </div>
                      <div className="w-full md:w-1/3 space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Clasificación Costo</label>
                          <select value={actClass} onChange={e=>setActClass(e.target.value as CostClassification)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-sm outline-none focus:border-emerald-500">
                              <option value="JOINT">General (Distribuido)</option>
                              <option value="COFFEE">Exclusivo Café</option>
                              <option value="PLANTAIN">Exclusivo Plátano</option>
                              <option value="OTHER">Otros</option>
                          </select>
                      </div>
                      <button type="submit" className="w-full md:w-auto p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-500 transition-colors"><Plus className="w-5 h-5" /></button>
                  </form>

                  <div className="space-y-2">
                      {activities.map(a => (
                          <div key={a.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-xl border border-slate-700/50 hover:border-slate-600 group">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-amber-900/20 rounded-lg text-amber-500"><ScrollText className="w-4 h-4"/></div>
                                  <div>
                                      <p className="text-sm font-bold text-white">{a.name}</p>
                                      <p className="text-[10px] text-slate-400 uppercase">{a.costClassification === 'JOINT' ? 'Costo Compartido' : `Directo: ${a.costClassification}`}</p>
                                  </div>
                              </div>
                              <button onClick={() => { if(onDeleteActivity && confirm('¿Eliminar labor?')) onDeleteActivity(a.id); }} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- TAB: LOTES --- */}
          {activeTab === 'lotes' && (
              <div className="space-y-6 animate-fade-in">
                  <div className="bg-indigo-900/10 p-3 rounded-xl border border-indigo-500/20 text-[10px] text-indigo-300 flex gap-2">
                      <LayoutGrid className="w-4 h-4 shrink-0" />
                      <p>Para editar áreas, densidades y detalles técnicos, utilice el módulo principal <strong>"Gestión Lotes"</strong> en el menú Operativo.</p>
                  </div>
                  
                  <form onSubmit={handleAddLot} className="bg-slate-800 p-4 rounded-2xl border border-slate-700 flex gap-3 items-end">
                      <div className="flex-1 space-y-1">
                          <label className="text-[9px] font-bold text-slate-500 uppercase ml-1">Nombre Nuevo Lote</label>
                          <input value={lotName} onChange={e=>setLotName(e.target.value)} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-2 text-white text-sm outline-none focus:border-emerald-500" placeholder="Ej: Lote El Mango" required />
                      </div>
                      <button type="submit" className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-500 transition-colors"><Plus className="w-5 h-5" /></button>
                  </form>

                  <div className="grid grid-cols-1 gap-2">
                      {costCenters.map(c => (
                          <div key={c.id} className="flex justify-between items-center p-3 bg-slate-800 rounded-xl border border-slate-700/50">
                              <div className="flex items-center gap-3">
                                  <div className="p-2 bg-emerald-900/20 rounded-lg text-emerald-500"><Sprout className="w-4 h-4"/></div>
                                  <div>
                                      <p className="text-sm font-bold text-white">{c.name}</p>
                                      <p className="text-[10px] text-slate-400 uppercase">{c.area} Ha • {c.cropType}</p>
                                  </div>
                              </div>
                              <button onClick={() => { if(confirm('¿Eliminar lote? Esto afectará los históricos.')) onDeleteCostCenter(c.id); }} className="p-2 text-slate-500 hover:text-red-500 hover:bg-red-900/20 rounded-lg transition-colors"><Trash2 className="w-4 h-4"/></button>
                          </div>
                      ))}
                  </div>
              </div>
          )}

          {/* --- TAB: CONFIG --- */}
          {activeTab === 'config' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-800 p-6 rounded-3xl border border-slate-700 space-y-4">
                <h4 className="text-emerald-500 text-xs uppercase font-black flex items-center gap-2"><Scale className="w-4 h-4"/> Parámetros Financieros</h4>
                <div className="space-y-2">
                  <label className="text-sm text-white font-bold">Factor Prestacional de Nómina</label>
                  <p className="text-[10px] text-slate-400 leading-tight">Multiplicador sobre el pago neto para estimar el costo real empresa (CST 2025). Sugerido: 1.52</p>
                  <input type="number" step="0.01" value={localFactor} onChange={e => setLocalFactor(parseFloat(e.target.value))} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3 text-lg text-white font-mono outline-none focus:border-emerald-500" />
                </div>
                <button onClick={handleSaveFactor} className="w-full bg-emerald-600 text-white font-black py-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
                  {factorSaved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />} {factorSaved ? 'Guardado' : 'Guardar Parámetros'}
                </button>
              </div>

              {/* SECCIÓN DE TRANSPARENCIA PARA TIENDA */}
              <div className="bg-slate-950/50 p-6 rounded-3xl border border-slate-800 space-y-4">
                  <h4 className="text-slate-400 text-[10px] uppercase font-black tracking-widest flex items-center gap-2"><Smartphone className="w-4 h-4" /> Información de la Aplicación</h4>
                  <div className="space-y-3">
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase">Desarrollador:</span>
                          <span className="text-white font-black italic">Lucas Mateo Tabares Franco</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase">Soporte Técnico:</span>
                          <span className="text-indigo-400 font-bold flex items-center gap-1"><Mail className="w-3 h-3"/> lucas.tabares@gmail.com</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                          <span className="text-slate-500 font-bold uppercase">Versión:</span>
                          <span className="text-slate-400 font-mono">1.0.0 Stable</span>
                      </div>
                  </div>
              </div>
            </div>
          )}

          {/* --- TAB: LEGAL --- */}
          {activeTab === 'legal' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-800 p-8 rounded-[2rem] border border-slate-700 text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/30">
                        <Gavel className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-white font-black text-lg uppercase tracking-tight">Centro de Cumplimiento</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Acceda a la documentación legal completa que rige el uso de este software y el tratamiento de sus datos.</p>
                    </div>
                    <div className="pt-2">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic flex items-center justify-center gap-2">
                            <Scale className="w-3 h-3" /> Propiedad Intelectual Registrada
                        </p>
                    </div>
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
