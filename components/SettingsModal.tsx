import React, { useState, useEffect } from 'react';
import { Supplier, CostCenter, Personnel, AppState, Activity } from '../types';
import { X, Users, MapPin, Plus, Trash2, Settings, Mail, Home, Phone, Briefcase, UserCheck, DollarSign, Database, Download, Upload, AlertTriangle, LandPlot, Pickaxe, HardDrive } from 'lucide-react';
import { formatCurrency } from '../services/inventoryService';

interface SettingsModalProps {
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel?: Personnel[];
  activities?: Activity[]; // New prop
  
  // Data Management
  fullState?: AppState;
  onRestoreData?: (data: AppState) => void;

  onAddSupplier: (name: string, phone: string, email: string, address: string) => void;
  onDeleteSupplier: (id: string) => void;
  onAddCostCenter: (name: string, budget: number, area?: number) => void;
  onDeleteCostCenter: (id: string) => void;
  onAddPersonnel?: (name: string, role: string) => void;
  onDeletePersonnel?: (id: string) => void;
  onAddActivity?: (name: string) => void; // New
  onDeleteActivity?: (id: string) => void; // New
  onClose: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  suppliers,
  costCenters,
  personnel = [],
  activities = [],
  fullState,
  onRestoreData,
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
  const [activeTab, setActiveTab] = useState<'lotes' | 'proveedores' | 'personal' | 'labores'>('proveedores');
  const [storageUsage, setStorageUsage] = useState<number>(0); // MB
  const [storagePercent, setStoragePercent] = useState<number>(0);
  
  // Lotes State
  const [loteName, setLoteName] = useState('');
  const [loteBudget, setLoteBudget] = useState('');
  const [loteArea, setLoteArea] = useState('');

  // Supplier State
  const [supName, setSupName] = useState('');
  const [supPhone, setSupPhone] = useState('');
  const [supEmail, setSupEmail] = useState('');
  const [supAddress, setSupAddress] = useState('');

  // Personnel State
  const [perName, setPerName] = useState('');
  const [perRole, setPerRole] = useState('');

  // Activity State
  const [actName, setActName] = useState('');

  // Calculate Storage Usage
  useEffect(() => {
    if (typeof window !== 'undefined') {
        let total = 0;
        for (let x in localStorage) {
            if (Object.prototype.hasOwnProperty.call(localStorage, x)) {
                total += (localStorage[x].length * 2);
            }
        }
        const usedMB = total / 1024 / 1024;
        setStorageUsage(usedMB);
        // Estimate 5MB limit for typical mobile browser localstorage
        setStoragePercent(Math.min((usedMB / 5) * 100, 100));
    }
  }, []);

  const handleAddLote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!loteName.trim()) return;
    onAddCostCenter(
        loteName, 
        loteBudget ? parseFloat(loteBudget) : 0,
        loteArea ? parseFloat(loteArea) : undefined
    );
    setLoteName('');
    setLoteBudget('');
    setLoteArea('');
  };

  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supName.trim()) return;
    onAddSupplier(supName, supPhone, supEmail, supAddress);
    setSupName('');
    setSupPhone('');
    setSupEmail('');
    setSupAddress('');
  };

  const handleAddPersonnel = (e: React.FormEvent) => {
    e.preventDefault();
    if (!perName.trim() || !onAddPersonnel) return;
    onAddPersonnel(perName, perRole);
    setPerName('');
    setPerRole('');
  }

  const handleAddActivity = (e: React.FormEvent) => {
      e.preventDefault();
      if (!actName.trim() || !onAddActivity) return;
      onAddActivity(actName);
      setActName('');
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-lg rounded-2xl border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-4 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-purple-900/30 p-2 rounded-lg border border-purple-500/30">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">Administración de Maestros</h3>
              <div className="flex items-center gap-2 mt-1">
                  <HardDrive className="w-3 h-3 text-slate-500" />
                  <div className="w-20 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                      <div 
                        className={`h-full ${storagePercent > 80 ? 'bg-red-500' : 'bg-emerald-500'}`} 
                        style={{ width: `${storagePercent}%` }}
                      ></div>
                  </div>
                  <span className="text-[9px] text-slate-400">{storageUsage.toFixed(2)} MB usados</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-slate-700 text-slate-400 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-700 overflow-x-auto">
          <button 
            onClick={() => setActiveTab('proveedores')}
            className={`flex-1 p-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors min-w-[90px] ${activeTab === 'proveedores' ? 'bg-slate-800 text-emerald-400 border-b-2 border-emerald-500' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <Users className="w-3 h-3" />
            Prov.
          </button>
          <button 
            onClick={() => setActiveTab('lotes')}
            className={`flex-1 p-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors min-w-[90px] ${activeTab === 'lotes' ? 'bg-slate-800 text-purple-400 border-b-2 border-purple-500' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <MapPin className="w-3 h-3" />
            Destinos
          </button>
          <button 
            onClick={() => setActiveTab('personal')}
            className={`flex-1 p-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors min-w-[90px] ${activeTab === 'personal' ? 'bg-slate-800 text-blue-400 border-b-2 border-blue-500' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <UserCheck className="w-3 h-3" />
            Personal
          </button>
          <button 
            onClick={() => setActiveTab('labores')}
            className={`flex-1 p-3 text-xs font-bold flex items-center justify-center gap-2 transition-colors min-w-[90px] ${activeTab === 'labores' ? 'bg-slate-800 text-amber-400 border-b-2 border-amber-500' : 'bg-slate-900 text-slate-400 hover:text-white'}`}
          >
            <Pickaxe className="w-3 h-3" />
            Labores
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
          
          {/* --- SUPPLIERS TAB --- */}
          {activeTab === 'proveedores' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <h4 className="text-emerald-400 text-xs uppercase font-bold mb-3 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Registrar Nuevo Proveedor
                    </h4>
                    <form onSubmit={handleAddSupplier} className="space-y-3">
                        <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Nombre / Razón Social *</label>
                            <input 
                                type="text" 
                                value={supName}
                                onChange={(e) => setSupName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                placeholder="Ej: Agroinsumos del Norte S.A.S"
                                autoFocus
                            />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 flex items-center gap-1"><Phone className="w-3 h-3"/> Teléfono</label>
                                <input 
                                    type="text" 
                                    value={supPhone}
                                    onChange={(e) => setSupPhone(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                    placeholder="Opcional"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 flex items-center gap-1"><Mail className="w-3 h-3"/> Email</label>
                                <input 
                                    type="email" 
                                    value={supEmail}
                                    onChange={(e) => setSupEmail(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                    placeholder="Opcional"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 flex items-center gap-1"><Home className="w-3 h-3"/> Dirección</label>
                            <input 
                                type="text" 
                                value={supAddress}
                                onChange={(e) => setSupAddress(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-emerald-500 outline-none"
                                placeholder="Opcional (Ej: Km 5 Vía al Llano)"
                            />
                        </div>

                        <button 
                            type="submit"
                            disabled={!supName}
                            className="w-full bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2 mt-2"
                        >
                            <Plus className="w-4 h-4" />
                            Guardar Proveedor
                        </button>
                    </form>
                </div>

                <div className="space-y-2">
                    <h4 className="text-slate-500 text-xs uppercase font-bold mb-2">
                        Proveedores Registrados ({suppliers.length})
                    </h4>
                    {suppliers.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
                            No hay proveedores. Regístrelos para usarlos en Entradas.
                        </p>
                    ) : (
                        suppliers.map(s => (
                            <div key={s.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 rounded-full bg-blue-900/50 flex items-center justify-center flex-shrink-0 text-blue-400">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-slate-200 text-sm font-bold truncate">{s.name}</p>
                                        <p className="text-slate-500 text-xs truncate">
                                            {[s.phone, s.address].filter(Boolean).join(' • ') || 'Sin detalles'}
                                        </p>
                                    </div>
                                </div>
                                <button onClick={() => onDeleteSupplier(s.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}

          {/* --- LOTES TAB --- */}
          {activeTab === 'lotes' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <h4 className="text-purple-400 text-xs uppercase font-bold mb-3 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Crear Nuevo Destino / Lote
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-2">Lugares de destino del gasto (Ej: Lote 1, Invernadero).</p>
                    <form onSubmit={handleAddLote} className="flex flex-col gap-3">
                        <div>
                             <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Nombre del Lugar *</label>
                             <input 
                                type="text" 
                                value={loteName}
                                onChange={(e) => setLoteName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                                placeholder="Ej: Lote Maíz Norte"
                                autoFocus
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 flex items-center gap-1">
                                    <DollarSign className="w-3 h-3" /> Presupuesto (COP)
                                </label>
                                <input 
                                    type="number" 
                                    value={loteBudget}
                                    onChange={(e) => setLoteBudget(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                                    placeholder="Ej: 5000000"
                                />
                            </div>
                            <div>
                                <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 flex items-center gap-1">
                                    <LandPlot className="w-3 h-3" /> Área (Hectáreas)
                                </label>
                                <input 
                                    type="number" 
                                    value={loteArea}
                                    onChange={(e) => setLoteArea(e.target.value)}
                                    className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-purple-500 outline-none"
                                    placeholder="Ej: 10.5"
                                    step="0.1"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] text-slate-500 mt-1">El área se usará para calcular indicadores de eficiencia.</p>

                        <button 
                            type="submit"
                            disabled={!loteName}
                            className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Destino
                        </button>
                    </form>
                </div>

                <div className="space-y-2">
                    <h4 className="text-slate-500 text-xs uppercase font-bold mb-2">
                        Listado Actual ({costCenters.length})
                    </h4>
                    {costCenters.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
                            No hay destinos creados.
                        </p>
                    ) : (
                        costCenters.map(c => (
                            <div key={c.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                                <div className="flex flex-col">
                                    <div className="flex items-center gap-2">
                                        <MapPin className="w-4 h-4 text-purple-500" />
                                        <span className="text-slate-200 text-sm font-bold">{c.name}</span>
                                    </div>
                                    <div className="flex items-center gap-3 mt-1">
                                        {c.budget && c.budget > 0 && (
                                            <span className="text-[10px] text-slate-500 bg-slate-800 px-1.5 py-0.5 rounded border border-slate-700">
                                                Ppto: {formatCurrency(c.budget)}
                                            </span>
                                        )}
                                        {c.area && c.area > 0 && (
                                            <span className="text-[10px] text-emerald-500 bg-emerald-900/20 px-1.5 py-0.5 rounded border border-emerald-900/30">
                                                {c.area} Ha
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <button onClick={() => onDeleteCostCenter(c.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}

           {/* --- PERSONAL TAB --- */}
           {activeTab === 'personal' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <h4 className="text-blue-400 text-xs uppercase font-bold mb-3 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Registrar Trabajador / Responsable
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-2">Personas autorizadas para retirar insumos o trabajar jornales.</p>
                    <form onSubmit={handleAddPersonnel} className="space-y-3">
                        <div>
                             <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Nombre Completo *</label>
                             <input 
                                type="text" 
                                value={perName}
                                onChange={(e) => setPerName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                placeholder="Ej: Juan Pérez"
                                autoFocus
                            />
                        </div>
                        <div>
                             <label className="text-[10px] text-slate-400 uppercase font-bold ml-1 flex items-center gap-1">
                                <Briefcase className="w-3 h-3" /> Cargo (Opcional)
                             </label>
                             <input 
                                type="text" 
                                value={perRole}
                                onChange={(e) => setPerRole(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-blue-500 outline-none"
                                placeholder="Ej: Aplicador, Mayordomo"
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!perName}
                            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Persona
                        </button>
                    </form>
                </div>

                <div className="space-y-2">
                    <h4 className="text-slate-500 text-xs uppercase font-bold mb-2">
                        Personal Registrado ({personnel.length})
                    </h4>
                    {personnel.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
                            No hay personal registrado.
                        </p>
                    ) : (
                        personnel.map(p => (
                            <div key={p.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <UserCheck className="w-4 h-4 text-blue-500" />
                                    <div>
                                        <p className="text-slate-200 text-sm font-bold">{p.name}</p>
                                        <p className="text-slate-500 text-xs">{p.role || 'Sin Cargo'}</p>
                                    </div>
                                </div>
                                {onDeletePersonnel && (
                                    <button onClick={() => onDeletePersonnel(p.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}

           {/* --- LABORES (ACTIVITIES) TAB --- */}
           {activeTab === 'labores' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900/50 p-4 rounded-xl border border-slate-700">
                    <h4 className="text-amber-400 text-xs uppercase font-bold mb-3 flex items-center gap-2">
                        <Plus className="w-3 h-3" /> Registrar Tipo de Labor
                    </h4>
                    <p className="text-[10px] text-slate-400 mb-2">Actividades estándar para jornales (Ej: Guadaña, Fumigación).</p>
                    <form onSubmit={handleAddActivity} className="space-y-3">
                        <div>
                             <label className="text-[10px] text-slate-400 uppercase font-bold ml-1">Nombre de la Labor *</label>
                             <input 
                                type="text" 
                                value={actName}
                                onChange={(e) => setActName(e.target.value)}
                                className="w-full bg-slate-800 border border-slate-600 rounded-lg px-3 py-2 text-white text-sm focus:border-amber-500 outline-none"
                                placeholder="Ej: Plateo"
                                autoFocus
                            />
                        </div>
                        <button 
                            type="submit"
                            disabled={!actName}
                            className="w-full bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-bold flex items-center justify-center gap-2"
                        >
                            <Plus className="w-4 h-4" />
                            Agregar Labor
                        </button>
                    </form>
                </div>

                <div className="space-y-2">
                    <h4 className="text-slate-500 text-xs uppercase font-bold mb-2">
                        Labores Disponibles ({activities.length})
                    </h4>
                    {activities.length === 0 ? (
                        <p className="text-slate-500 text-sm text-center py-4 bg-slate-900/30 rounded-lg border border-dashed border-slate-700">
                            No hay labores creadas.
                        </p>
                    ) : (
                        activities.map(a => (
                            <div key={a.id} className="flex items-center justify-between p-3 bg-slate-900 rounded-lg border border-slate-800 hover:border-slate-600 transition-colors">
                                <div className="flex items-center gap-3">
                                    <Pickaxe className="w-4 h-4 text-amber-500" />
                                    <div>
                                        <p className="text-slate-200 text-sm font-bold">{a.name}</p>
                                    </div>
                                </div>
                                {onDeleteActivity && (
                                    <button onClick={() => onDeleteActivity(a.id)} className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/20 rounded-lg transition-colors">
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
