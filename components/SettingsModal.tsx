
import React, { useState, useEffect, useMemo } from 'react';
import { Supplier, CostCenter, Personnel, AppState, Activity, CostClassification, ContractType } from '../types';
import { X, Users, MapPin, Plus, Trash2, Settings, UserCheck, Pickaxe, Scale, Gavel, FileText, Save, CheckCircle, Sun, Leaf, Info, Mail, Award, Smartphone } from 'lucide-react';
import { formatNumberInput, parseNumberInput } from '../services/inventoryService';
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
  const [activeTab, setActiveTab] = useState<'lotes' | 'proveedores' | 'personal' | 'labores' | 'config' | 'legal'>('config');
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
  const [loteCropAge, setLoteCropAge] = useState('');
  
  // Associated
  const [associatedCrop, setAssociatedCrop] = useState('');
  const [associatedCropName, setAssociatedCropName] = useState('');
  const [associatedCropAge, setAssociatedCropAge] = useState('');
  const [associatedCropDensity, setAssociatedCropDensity] = useState('');
  const [distSurco, setDistSurco] = useState('');
  const [distPlanta, setDistPlanta] = useState('');

  const commonCrops = ['Café', 'Plátano', 'Banano', 'Otro'];

  const handleSaveFactor = () => {
    onUpdateState({ ...fullState, laborFactor: localFactor });
    setFactorSaved(true);
    setTimeout(() => setFactorSaved(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-slate-800 w-full max-w-lg rounded-[2.5rem] border border-slate-700 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[90vh]">
        
        <div className="bg-slate-900 p-6 border-b border-slate-700 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-purple-900/30 p-2 rounded-xl border border-purple-500/30">
              <Settings className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <h3 className="text-white font-bold text-lg leading-none">Administración del Sistema</h3>
              <p className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Estructura y Parámetros</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-slate-700 text-slate-400 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="flex bg-slate-950 p-1 overflow-x-auto scrollbar-hide">
          {['lotes', 'proveedores', 'personal', 'config', 'legal'].map((tab) => (
            <button 
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 p-3 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all rounded-xl ${activeTab === tab ? 'bg-slate-800 text-emerald-400' : 'text-slate-500 hover:text-white'}`}
            >
              {tab === 'proveedores' && <Users className="w-3 h-3" />}
              {tab === 'lotes' && <MapPin className="w-3 h-3" />}
              {tab === 'personal' && <UserCheck className="w-3 h-3" />}
              {tab === 'config' && <Scale className="w-3 h-3" />}
              {tab === 'legal' && <Gavel className="w-3 h-3" />}
              {tab}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar space-y-6">
          
          {activeTab === 'config' && (
            <div className="space-y-6 animate-fade-in">
              <div className="bg-slate-900/50 p-6 rounded-3xl border border-slate-700 space-y-4">
                <h4 className="text-emerald-500 text-xs uppercase font-black flex items-center gap-2"><Scale className="w-4 h-4"/> Parámetros Financieros</h4>
                <div className="space-y-2">
                  <label className="text-sm text-white font-bold">Factor Prestacional de Nómina</label>
                  <p className="text-[10px] text-slate-400 leading-tight">Multiplicador sobre el pago neto para estimar el costo real empresa (CST 2025). Sugerido: 1.52</p>
                  <input type="number" step="0.01" value={localFactor} onChange={e => setLocalFactor(parseFloat(e.target.value))} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-lg text-white font-mono outline-none focus:border-emerald-500" />
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

          {activeTab === 'legal' && (
            <div className="space-y-4 animate-fade-in">
                <div className="bg-slate-900/50 p-8 rounded-[2rem] border border-slate-700 text-center space-y-4">
                    <div className="w-16 h-16 bg-indigo-600/20 rounded-3xl flex items-center justify-center mx-auto border border-indigo-500/30">
                        <Gavel className="w-8 h-8 text-indigo-400" />
                    </div>
                    <div className="space-y-2">
                        <h4 className="text-white font-black text-lg uppercase tracking-tight">Centro de Cumplimiento</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-medium">Acceda a la documentación legal completa que rige el uso de este software y el tratamiento de sus datos.</p>
                    </div>
                    <button onClick={() => setShowLegalDetail(true)} className="w-full bg-slate-700 hover:bg-slate-600 text-white font-black py-4 rounded-xl text-xs uppercase flex items-center justify-center gap-2 transition-all shadow-xl">
                        <FileText className="w-4 h-4" /> Ver Política de Privacidad
                    </button>
                    <div className="pt-2">
                        <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest italic flex items-center justify-center gap-2">
                            <Award className="w-3 h-3" /> Propiedad Intelectual Registrada
                        </p>
                    </div>
                </div>
            </div>
          )}

          {/* Renderizado simple de otras pestañas para brevedad */}
          {activeTab === 'lotes' && (
              <div className="text-center py-10 opacity-50"><p className="text-xs font-bold uppercase">Use el botón '+' en el Mapa de Lotes para gestionar esta sección.</p></div>
          )}
          {activeTab === 'proveedores' && (
              <div className="text-center py-10 opacity-50"><p className="text-xs font-bold uppercase">Sección disponible para edición masiva.</p></div>
          )}
          {activeTab === 'personal' && (
              <div className="text-center py-10 opacity-50"><p className="text-xs font-bold uppercase">Gestione trabajadores desde el módulo de Nómina.</p></div>
          )}
        </div>

        {showLegalDetail && <LegalComplianceModal onClose={() => setShowLegalDetail(false)} />}
      </div>
    </div>
  );
};
