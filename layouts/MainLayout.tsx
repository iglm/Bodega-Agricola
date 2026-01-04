
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Tractor, Package, Target, CalendarRange, Sprout, ClipboardList, Bug, Leaf, 
  Briefcase, Pickaxe, Calculator, Database, Lightbulb, Settings, LayoutGrid, 
  Settings2, Globe, ChevronDown, HelpCircle, Sun, Moon, Download, Plus,
  LayoutDashboard, Users, Wallet, BarChart3, Menu, X as XIcon, MoreHorizontal
} from 'lucide-react';
import { useData } from '../contexts/DataContext';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { generateId, processInventoryMovement } from '../services/inventoryService';
import { 
    generatePDF, generateExcel, generateLaborReport, generateHarvestReport, 
    generateMasterPDF, generateGlobalReport, generateAgronomicDossier, 
    generateSafetyReport, generateFieldTemplates, generateFarmStructurePDF, 
    generateFarmStructureExcel
} from '../services/reportService';

import { Dashboard } from '../components/Dashboard';
import { StatsView } from '../components/StatsView';
import { InventoryForm } from '../components/InventoryForm';
import { MovementModal } from '../components/MovementModal';
import { ExportModal } from '../components/ExportModal';
import { ManualModal } from '../components/ManualModal';
import { WarehouseModal } from '../components/WarehouseModal';
import { SettingsModal } from '../components/SettingsModal';
import { DataModal } from '../components/DataModal';
import { LaborView } from '../components/LaborView'; 
import { HarvestView } from '../components/HarvestView'; 
import { AgendaView } from '../components/AgendaView';
import { BiologicalAssetsView } from '../components/BiologicalAssetsView';
import { BudgetView } from '../components/BudgetView'; 
import { SimulatorView } from '../components/SimulatorView'; 
import { ManagementView } from '../components/ManagementView';
import { LotManagementView } from '../components/LotManagementView';
import { SanitaryView } from '../components/SanitaryView';
import { HistoryModal } from '../components/HistoryModal';
import { DeleteModal } from '../components/DeleteModal';
import { PayrollModal } from '../components/PayrollModal';
import { LaborSchedulerView } from '../components/LaborSchedulerView';
import { LaborForm } from '../components/LaborForm'; 
import { FinanceView } from '../components/FinanceView';
import { InventoryItem, CostClassification, Personnel } from '../types';

interface MainLayoutProps {
  onShowNotification: (msg: string, type: 'success' | 'error') => void;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ onShowNotification }) => {
  const { data, setData, actions } = useData();
  const { session } = useAuth();
  const { theme, toggleTheme } = useTheme();
  
  // --- NAVIGATION STATE ---
  const [activeModule, setActiveModule] = useState<'RESUMEN' | 'BODEGA' | 'CAMPO' | 'NOMINA' | 'GERENCIA'>('RESUMEN');
  const [subTab, setSubTab] = useState<string>('default');

  // Reset subtab when module changes
  useEffect(() => {
      switch(activeModule) {
          case 'RESUMEN': setSubTab('dashboard'); break;
          case 'BODEGA': setSubTab('inventory'); break;
          case 'CAMPO': setSubTab('lots'); break;
          case 'NOMINA': setSubTab('labor'); break;
          case 'GERENCIA': setSubTab('finance'); break;
      }
  }, [activeModule]);
  
  // UI States (Modals)
  const [showAddForm, setShowAddForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false); 
  
  // Item specific modals
  const [movementModal, setMovementModal] = useState<{item: InventoryItem, type: 'IN' | 'OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const activeId = data.activeWarehouseId;
  const currentW = useMemo(() => data.warehouses.find(w => w.id === activeId), [data.warehouses, activeId]);

  // --- MEMOIZED DATA SLICES ---
  const activeInventory = useMemo(() => data.inventory.filter(i => i.warehouseId === activeId), [data.inventory, activeId]);
  const activeCostCenters = useMemo(() => data.costCenters.filter(c => c.warehouseId === activeId), [data.costCenters, activeId]);
  const activeLaborLogs = useMemo(() => data.laborLogs.filter(l => l.warehouseId === activeId), [data.laborLogs, activeId]);
  const activeHarvests = useMemo(() => data.harvests.filter(h => h.warehouseId === activeId), [data.harvests, activeId]);
  const activeMovements = useMemo(() => data.movements.filter(m => m.warehouseId === activeId), [data.movements, activeId]);
  const activePlannedLabors = useMemo(() => data.plannedLabors ? data.plannedLabors.filter(l => l.warehouseId === activeId) : [], [data.plannedLabors, activeId]);
  const activeActivities = useMemo(() => data.activities.filter(a => a.warehouseId === activeId), [data.activities, activeId]);
  const activePersonnel = useMemo(() => data.personnel.filter(p => p.warehouseId === activeId), [data.personnel, activeId]);
  const activeSuppliers = useMemo(() => data.suppliers.filter(s => s.warehouseId === activeId), [data.suppliers, activeId]);
  const activeBudgets = useMemo(() => data.budgets || [], [data.budgets]); 
  const activeMachines = useMemo(() => data.machines.filter(m => m.warehouseId === activeId), [data.machines, activeId]);
  const activeMaintenance = useMemo(() => data.maintenanceLogs.filter(m => m.warehouseId === activeId), [data.maintenanceLogs, activeId]);
  const activeRain = useMemo(() => data.rainLogs.filter(r => r.warehouseId === activeId), [data.rainLogs, activeId]);
  const activeSoil = useMemo(() => data.soilAnalyses.filter(s => s.warehouseId === activeId), [data.soilAnalyses, activeId]);
  const activePPE = useMemo(() => data.ppeLogs.filter(p => p.warehouseId === activeId), [data.ppeLogs, activeId]);
  const activeWaste = useMemo(() => data.wasteLogs.filter(w => w.warehouseId === activeId), [data.wasteLogs, activeId]);
  const activeAssets = useMemo(() => data.assets.filter(a => a.warehouseId === activeId), [data.assets, activeId]);
  const activePhenology = useMemo(() => data.phenologyLogs.filter(l => l.warehouseId === activeId), [data.phenologyLogs, activeId]);
  const activePests = useMemo(() => data.pestLogs.filter(l => l.warehouseId === activeId), [data.pestLogs, activeId]);
  const activeAgenda = useMemo(() => data.agenda.filter(a => a.warehouseId === activeId), [data.agenda, activeId]);
  const activeFinance = useMemo(() => data.financeLogs.filter(f => f.warehouseId === activeId), [data.financeLogs, activeId]);

  // --- CALLBACKS ---
  const handleDashboardAddMovement = useCallback((i: InventoryItem, t: 'IN' | 'OUT') => setMovementModal({item: i, type: t}), []);
  const handleDashboardDelete = useCallback((id: string) => {
    const item = data.inventory.find(i => i.id === id);
    if (item) setDeleteItem(item);
  }, [data.inventory]);
  const handleDashboardHistory = useCallback((item: InventoryItem) => setHistoryItem(item), []);
  const handleDashboardGlobalHistory = useCallback(() => setShowGlobalHistory(true), []);

  // --- QUICK ADD HANDLERS ---
  const handleAddCostCenterQuick = (name: string) => {
      setData(prev => ({ ...prev, costCenters: [...prev.costCenters, { id: generateId(), warehouseId: activeId, name, area: 0, stage: 'Produccion', cropType: 'Café', plantCount: 0 }] }));
      onShowNotification(`Lote "${name}" creado.`, 'success');
  };
  const handleAddPersonnelQuick = (name: string) => {
      setData(prev => ({ ...prev, personnel: [...prev.personnel, { id: generateId(), warehouseId: activeId, name, role: 'Trabajador' }] }));
      onShowNotification(`Trabajador "${name}" registrado.`, 'success');
  };
  const handleAddSupplierQuick = (name: string, taxId?: string, creditDays?: number) => {
      setData(prev => ({ ...prev, suppliers: [...prev.suppliers, { id: generateId(), warehouseId: activeId, name, taxId, creditDays }] }));
      onShowNotification(`Proveedor "${name}" añadido.`, 'success');
  };
  const handleAddActivityQuick = (name: string, classification: CostClassification = 'JOINT') => {
      setData(prev => ({ ...prev, activities: [...prev.activities, { id: generateId(), warehouseId: activeId, name, costClassification: classification }] }));
      onShowNotification(`Labor "${name}" creada.`, 'success');
  };
  const handleSaveMovement = (mov: any, price?: number, exp?: string) => {
      if(!movementModal) return;
      const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, mov, price, exp); 
      setData(prev => ({ ...prev, inventory: updatedInventory, movements: [{ ...mov, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost }, ...prev.movements] })); 
      setMovementModal(null);
  };

  // --- RENDER HELPERS ---
  const renderSubTabs = (options: {id: string, label: string, icon: any}[]) => (
      <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1.5 rounded-2xl gap-2 overflow-x-auto scrollbar-hide mb-6 border border-slate-200 dark:border-slate-800 sticky top-16 z-20 backdrop-blur-sm">
          {options.map(opt => (
              <button 
                  key={opt.id}
                  onClick={() => setSubTab(opt.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase whitespace-nowrap transition-all ${subTab === opt.id ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800'}`}
              >
                  <opt.icon className="w-3.5 h-3.5" />
                  {opt.label}
              </button>
          ))}
      </div>
  );

  return (
    <>
      {/* 1. HEADER MINIMALISTA */}
      <header className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 py-3 pt-safe-top">
        <div className="max-w-5xl mx-auto flex justify-between items-center">
            <button onClick={() => setShowWarehouses(true)} className="flex items-center gap-3 group">
                <div className="w-9 h-9 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg flex items-center justify-center text-white group-active:scale-95 transition-transform">
                    <Globe className="w-5 h-5" />
                </div>
                <div className="text-left">
                    <h1 className="text-sm font-black text-slate-900 dark:text-white leading-none">AgroBodega <span className="text-emerald-500">Pro</span></h1>
                    <div className="flex items-center gap-1 mt-0.5">
                        <p className="text-[9px] font-bold text-slate-500 uppercase tracking-wider">{currentW?.name || 'Seleccionar Finca'}</p>
                        <ChevronDown className="w-3 h-3 text-slate-400" />
                    </div>
                </div>
            </button>
            <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-amber-500 transition-colors">
                    {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                </button>
                <button onClick={() => setShowSettings(true)} className="p-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-indigo-500 transition-colors">
                    <Settings className="w-4 h-4" />
                </button>
            </div>
        </div>
      </header>

      {/* 2. MAIN CONTENT AREA */}
      <main className="max-w-5xl mx-auto p-4 pb-32 min-h-screen">
        
        {/* --- MODULE: RESUMEN (HOME) --- */}
        {activeModule === 'RESUMEN' && (
            <div className="animate-fade-in">
                <StatsView 
                    laborFactor={data.laborFactor} 
                    movements={activeMovements} 
                    suppliers={activeSuppliers} 
                    costCenters={activeCostCenters} 
                    laborLogs={activeLaborLogs} 
                    harvests={activeHarvests} 
                    maintenanceLogs={activeMaintenance} 
                    rainLogs={activeRain} 
                    machines={activeMachines} 
                    budgets={activeBudgets} 
                    plannedLabors={activePlannedLabors} 
                />
            </div>
        )}

        {/* --- MODULE: BODEGA (OPERATIVO) --- */}
        {activeModule === 'BODEGA' && (
            <div className="animate-fade-in">
                {renderSubTabs([
                    { id: 'inventory', label: 'Inventario', icon: Package },
                    { id: 'harvest', label: 'Ventas Cosecha', icon: Target },
                    { id: 'history', label: 'Kárdex Global', icon: ClipboardList }
                ])}
                
                {subTab === 'inventory' && (
                    <Dashboard 
                        inventory={activeInventory} 
                        costCenters={activeCostCenters} 
                        movements={activeMovements}
                        personnel={activePersonnel}
                        machines={activeMachines}
                        maintenanceLogs={activeMaintenance}
                        suppliers={activeSuppliers}
                        onAddMovement={handleDashboardAddMovement} 
                        onDelete={handleDashboardDelete} 
                        onViewHistory={handleDashboardHistory} 
                        onViewGlobalHistory={handleDashboardGlobalHistory} 
                        onOpenExport={() => setShowExport(true)}
                        isAdmin={true} 
                    />
                )}
                {subTab === 'harvest' && (
                    <HarvestView harvests={activeHarvests} costCenters={activeCostCenters} onAddHarvest={(h)=>setData(prev=>({...prev, harvests: [...prev.harvests, {...h, id: generateId(), warehouseId: activeId}]}))} onDeleteHarvest={(id) => setData(prev=>({...prev, harvests: prev.harvests.filter(h=>h.id !== id)}))} onAddCostCenter={handleAddCostCenterQuick} isAdmin={true} allMovements={data.movements} />
                )}
                {subTab === 'history' && (
                    <div className="text-center py-10">
                        <button onClick={() => setShowGlobalHistory(true)} className="bg-slate-800 text-white px-6 py-3 rounded-xl font-bold uppercase text-xs flex items-center gap-2 mx-auto">
                            <ClipboardList className="w-4 h-4" /> Abrir Historial Completo
                        </button>
                    </div>
                )}
            </div>
        )}

        {/* --- MODULE: CAMPO (AGRONOMIA) --- */}
        {activeModule === 'CAMPO' && (
            <div className="animate-fade-in">
                {renderSubTabs([
                    { id: 'lots', label: 'Lotes', icon: LayoutGrid },
                    { id: 'scheduler', label: 'Programación', icon: CalendarRange },
                    { id: 'sanitary', label: 'Sanidad', icon: Bug },
                    { id: 'weather', label: 'Bitácora', icon: Leaf },
                    { id: 'assets', label: 'Activos', icon: Sprout },
                ])}

                {subTab === 'lots' && <LotManagementView costCenters={activeCostCenters} laborLogs={activeLaborLogs} movements={activeMovements} harvests={activeHarvests} plannedLabors={activePlannedLabors} onUpdateLot={actions.updateCostCenter} onAddPlannedLabor={actions.addPlannedLabor} activities={activeActivities} onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge, variety, pid) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge, variety, parentId: pid}]}))} onDeleteCostCenter={actions.deleteCostCenter} />}
                {subTab === 'scheduler' && <LaborSchedulerView plannedLabors={activePlannedLabors} costCenters={activeCostCenters} activities={activeActivities} personnel={activePersonnel} onAddPlannedLabor={actions.addPlannedLabor} onDeletePlannedLabor={(id) => setData(prev=>({...prev, plannedLabors: prev.plannedLabors.filter(l=>l.id!==id)}))} onToggleComplete={(id)=>setData(prev=>({...prev, plannedLabors: prev.plannedLabors.map(l=>l.id===id?{...l, completed:!l.completed}:l)}))} onAddActivity={handleAddActivityQuick} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={handleAddPersonnelQuick} budgets={activeBudgets} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} />}
                {subTab === 'sanitary' && <SanitaryView costCenters={activeCostCenters} pestLogs={activePests} onSaveLog={(l)=>setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...l, id: generateId(), warehouseId: activeId}]}))} />}
                {subTab === 'weather' && <ManagementView machines={activeMachines} maintenanceLogs={activeMaintenance} rainLogs={activeRain} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} soilAnalyses={activeSoil} ppeLogs={activePPE} wasteLogs={activeWaste} assets={activeAssets} bpaChecklist={data.bpaChecklist} phenologyLogs={activePhenology} pestLogs={activePests} onAddMachine={(m) => setData(prev=>({...prev, machines: [...prev.machines, {...m, id: generateId(), warehouseId: activeId}]}))} onUpdateMachine={(m) => setData(prev=>({...prev, machines: prev.machines.map(x=>x.id===m.id?m:x)}))} onAddMaintenance={(m) => setData(prev=>({...prev, maintenanceLogs: [...prev.maintenanceLogs, {...m, id: generateId(), warehouseId: activeId}]}))} onDeleteMachine={(id) => setData(prev=>({...prev, machines: prev.machines.filter(m=>m.id!==id)}))} onAddRain={(r) => setData(prev=>({...prev, rainLogs: [...prev.rainLogs, {...r, id: generateId(), warehouseId: activeId}]}))} onDeleteRain={(id) => setData(prev=>({...prev, rainLogs: prev.rainLogs.filter(r=>r.id!==id)}))} onAddSoilAnalysis={(s) => setData(prev=>({...prev, soilAnalyses: [...prev.soilAnalyses, {...s, id: generateId(), warehouseId: activeId}]}))} onDeleteSoilAnalysis={(id) => setData(prev=>({...prev, soilAnalyses: prev.soilAnalyses.filter(s=>s.id!==id)}))} onAddPPE={(p) => setData(prev=>({...prev, ppeLogs: [...prev.ppeLogs, {...p, id: generateId(), warehouseId: activeId}]}))} onDeletePPE={(id) => setData(prev=>({...prev, ppeLogs: prev.ppeLogs.filter(p=>p.id!==id)}))} onAddWaste={(w) => setData(prev=>({...prev, wasteLogs: [...prev.wasteLogs, {...w, id: generateId(), warehouseId: activeId}]}))} onDeleteWaste={(id) => setData(prev=>({...prev, wasteLogs: prev.wasteLogs.filter(w=>w.id!==id)}))} onAddAsset={(a) => setData(prev=>({...prev, assets: [...prev.assets, {...a, id: generateId(), warehouseId: activeId}]}))} onDeleteAsset={(id) => setData(prev=>({...prev, assets: prev.assets.filter(a=>a.id!==id)}))} onToggleBpa={(code) => setData(prev=>({...prev, bpaChecklist: {...prev.bpaChecklist, [code]: !prev.bpaChecklist[code]}}))} onAddPhenologyLog={(log) => setData(prev=>({...prev, phenologyLogs: [...prev.phenologyLogs, {...log, id: generateId(), warehouseId: activeId}]}))} onDeletePhenologyLog={(id) => setData(prev=>({...prev, phenologyLogs: prev.phenologyLogs.filter(l=>l.id!==id)}))} onAddPestLog={(log) => setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...log, id: generateId(), warehouseId: activeId}]}))} onDeletePestLog={(id) => setData(prev=>({...prev, pestLogs: prev.pestLogs.filter(l=>l.id!==id)}))} isAdmin={true} />}
                {subTab === 'assets' && <BiologicalAssetsView costCenters={activeCostCenters} movements={activeMovements} laborLogs={activeLaborLogs} laborFactor={data.laborFactor} onUpdateLot={actions.updateCostCenter} />}
            </div>
        )}

        {/* --- MODULE: NOMINA --- */}
        {activeModule === 'NOMINA' && (
            <div className="animate-fade-in">
                {renderSubTabs([
                    { id: 'labor', label: 'Jornales', icon: Pickaxe },
                    { id: 'agenda', label: 'Agenda', icon: CalendarRange },
                ])}
                {subTab === 'labor' && <LaborView laborLogs={activeLaborLogs} personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onAddLabor={() => setShowLaborForm(true)} onDeleteLabor={(id) => setData(prev=>({...prev, laborLogs: prev.laborLogs.filter(l=>l.id!==id)}))} isAdmin={true} onOpenPayroll={()=>setShowPayroll(true)} />}
                {subTab === 'agenda' && <AgendaView agenda={activeAgenda} onAddEvent={(e) => setData(prev => ({ ...prev, agenda: [...prev.agenda, { ...e, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), completed: false }] }))} onToggleEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.map(a => a.id === id ? { ...a, completed: !a.completed } : a) }))} onDeleteEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }))} />}
            </div>
        )}

        {/* --- MODULE: GERENCIA --- */}
        {activeModule === 'GERENCIA' && (
            <div className="animate-fade-in">
                {renderSubTabs([
                    { id: 'finance', label: 'Caja Menor', icon: Wallet },
                    { id: 'budget', label: 'Presupuesto', icon: Calculator },
                    { id: 'simulator', label: 'Simulador', icon: Lightbulb },
                    { id: 'config', label: 'Avanzado', icon: Settings },
                ])}
                {subTab === 'finance' && <FinanceView financeLogs={activeFinance} onAddTransaction={(t) => setData(prev => ({...prev, financeLogs: [...prev.financeLogs, {...t, id: generateId(), warehouseId: activeId}]}))} onDeleteTransaction={(id) => setData(prev => ({...prev, financeLogs: prev.financeLogs.filter(f => f.id !== id)}))} />}
                {subTab === 'budget' && <BudgetView budgets={activeBudgets} costCenters={activeCostCenters} activities={activeActivities} inventory={activeInventory} warehouseId={activeId} onSaveBudget={actions.saveBudget} laborLogs={activeLaborLogs} movements={activeMovements} laborFactor={data.laborFactor} onAddCostCenter={handleAddCostCenterQuick} />}
                {subTab === 'simulator' && <SimulatorView />}
                {subTab === 'config' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button onClick={() => setShowSettings(true)} className="p-6 bg-slate-800 rounded-3xl border border-slate-700 hover:border-indigo-500 group transition-all text-left">
                            <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Settings2 className="w-6 h-6 text-white"/></div>
                            <h3 className="text-white font-black uppercase text-sm">Configuración Maestra</h3>
                            <p className="text-slate-400 text-xs mt-1">Lotes, Personal y Labores</p>
                        </button>
                        <button onClick={() => setShowData(true)} className="p-6 bg-slate-800 rounded-3xl border border-slate-700 hover:border-orange-500 group transition-all text-left">
                            <div className="w-12 h-12 bg-orange-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Database className="w-6 h-6 text-white"/></div>
                            <h3 className="text-white font-black uppercase text-sm">Centro de Datos</h3>
                            <p className="text-slate-400 text-xs mt-1">Copias de Seguridad y Restauración</p>
                        </button>
                        <button onClick={() => setShowManual(true)} className="p-6 bg-slate-800 rounded-3xl border border-slate-700 hover:border-emerald-500 group transition-all text-left">
                            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><HelpCircle className="w-6 h-6 text-white"/></div>
                            <h3 className="text-white font-black uppercase text-sm">Manual de Usuario</h3>
                            <p className="text-slate-400 text-xs mt-1">Guías y Documentación</p>
                        </button>
                        <button onClick={() => setShowExport(true)} className="p-6 bg-slate-800 rounded-3xl border border-slate-700 hover:border-blue-500 group transition-all text-left">
                            <div className="w-12 h-12 bg-blue-600 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform"><Download className="w-6 h-6 text-white"/></div>
                            <h3 className="text-white font-black uppercase text-sm">Exportar Reportes</h3>
                            <p className="text-slate-400 text-xs mt-1">PDF y Excel</p>
                        </button>
                    </div>
                )}
            </div>
        )}

      </main>

      {/* 3. BOTTOM NAVIGATION BAR */}
      <nav className="fixed bottom-6 left-4 right-4 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-3xl shadow-2xl z-50 px-2 py-3 flex justify-between items-center max-w-lg mx-auto">
          {[
              { id: 'RESUMEN', icon: LayoutDashboard, label: 'Inicio' },
              { id: 'BODEGA', icon: Package, label: 'Bodega' },
              { id: 'CAMPO', icon: Sprout, label: 'Campo' },
              { id: 'NOMINA', icon: Users, label: 'Nómina' },
              { id: 'GERENCIA', icon: BarChart3, label: 'Gestión' },
          ].map((item) => (
              <button 
                  key={item.id}
                  onClick={() => setActiveModule(item.id as any)}
                  className={`flex flex-col items-center gap-1 w-full relative group transition-all duration-300 ${activeModule === item.id ? 'text-emerald-400' : 'text-slate-500 hover:text-slate-300'}`}
              >
                  {/* Indicator Line */}
                  {activeModule === item.id && (
                      <span className="absolute -top-3 w-8 h-1 bg-emerald-500 rounded-b-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"></span>
                  )}
                  <item.icon className={`w-6 h-6 transition-transform ${activeModule === item.id ? 'scale-110 -translate-y-1' : ''}`} />
                  <span className={`text-[9px] font-black uppercase tracking-tight ${activeModule === item.id ? 'opacity-100' : 'opacity-60'}`}>{item.label}</span>
              </button>
          ))}
      </nav>

      {/* 4. CONTEXTUAL FLOATING ACTION BUTTON (FAB) */}
      {/* Show context-specific add buttons above the nav bar */}
      <div className="fixed bottom-28 right-6 z-40 flex flex-col gap-3">
          {activeModule === 'BODEGA' && subTab === 'inventory' && (
              <button onClick={() => setShowAddForm(true)} className="w-14 h-14 bg-emerald-600 rounded-2xl shadow-xl shadow-emerald-900/40 text-white flex items-center justify-center border-2 border-emerald-400 active:scale-95 transition-all animate-bounce-subtle">
                  <Plus className="w-8 h-8" />
              </button>
          )}
          {activeModule === 'NOMINA' && subTab === 'labor' && (
              <button onClick={() => setShowLaborForm(true)} className="w-14 h-14 bg-amber-600 rounded-2xl shadow-xl shadow-amber-900/40 text-white flex items-center justify-center border-2 border-amber-400 active:scale-95 transition-all">
                  <Plus className="w-8 h-8" />
              </button>
          )}
      </div>

      {/* MODALS LAYER */}
      <div className="z-[100] relative">
          {showManual && <ManualModal onClose={() => setShowManual(false)} />}
          {showData && data && <DataModal fullState={data} onRestoreData={(d) => { setData(d); setShowData(false); }} onClose={() => setShowData(false)} onShowNotification={onShowNotification} onLoadDemoData={() => { actions.loadDemoData(); setShowData(false); }} />}
          
          {(showSettings) && data && (
            <SettingsModal 
                suppliers={activeSuppliers} 
                costCenters={activeCostCenters} 
                personnel={activePersonnel} 
                activities={activeActivities} 
                fullState={data} 
                onUpdateState={(newState) => setData(newState)} 
                onAddSupplier={(n,p,e,a) => setData(prev=>({...prev, suppliers:[...prev.suppliers,{id:generateId(),warehouseId:activeId,name:n,phone:p,email:e,address:a}]}))} 
                onDeleteSupplier={(id) => setData(prev=>({...prev, suppliers: prev.suppliers.filter(s=>s.id!==id)}))} 
                onAddCostCenter={(n,b,a,s,pc,ct,ac,age,density, assocAge, variety) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac, cropAgeMonths: age, associatedCropDensity: density, associatedCropAge: assocAge, variety}]}))} 
                onDeleteCostCenter={actions.deleteCostCenter} 
                onAddPersonnel={handleAddPersonnelQuick} 
                onDeletePersonnel={actions.deletePersonnel} 
                onAddActivity={(n, cls) => setData(prev=>({...prev, activities:[...prev.activities,{id:generateId(),warehouseId:activeId,name:n,costClassification:cls}]}))} 
                onDeleteActivity={actions.deleteActivity} 
                onClose={handleCloseSettings} 
            />
          )}

          {showPayroll && data && <PayrollModal logs={activeLaborLogs} personnel={activePersonnel} warehouseName={currentW?.name || ""} laborFactor={data.laborFactor} onMarkAsPaid={(ids) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l) }))} onClose={() => setShowPayroll(false)} />}
          {showAddForm && data && <InventoryForm suppliers={activeSuppliers} inventory={activeInventory} onSave={(item, qty, details, unit) => { actions.saveNewItem(item, qty, details, unit); setShowAddForm(false); }} onCancel={() => setShowAddForm(false)} onAddSupplier={handleAddSupplierQuick} />}
          {movementModal && data && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} onSave={handleSaveMovement} onCancel={() => setMovementModal(null)} onAddSupplier={handleAddSupplierQuick} onAddCostCenter={handleAddCostCenterQuick} onAddPersonnel={handleAddPersonnelQuick} />}
          {historyItem && data && <HistoryModal item={historyItem} movements={data.movements.filter(m => m.itemId === historyItem.id)} onClose={() => setHistoryItem(null)} />}
          {showGlobalHistory && data && <HistoryModal item={{ name: 'Historial Bodega Global' } as any} movements={activeMovements} onClose={() => setShowGlobalHistory(false)} />}
          {deleteItem && <DeleteModal itemName={deleteItem.name} onConfirm={() => { setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== deleteItem.id), movements: prev.movements.filter(m => m.itemId !== deleteItem.id) })); setDeleteItem(null); }} onCancel={() => setDeleteItem(null)} />}
          {showWarehouses && data && <WarehouseModal warehouses={data.warehouses} activeId={activeId} onSwitch={(id) => setData(prev=>({...prev, activeWarehouseId: id}))} onCreate={(n) => setData(prev=>({...prev, warehouses: [...prev.warehouses, {id: generateId(), name: n, created: new Date().toISOString(), ownerId: session?.id || 'local_user'}]}))} onDelete={(id) => setData(prev=>({...prev, warehouses: prev.warehouses.filter(w=>w.id!==id)}))} onClose={() => setShowWarehouses(false)} />}
          {showExport && data && <ExportModal 
              onClose={() => setShowExport(false)}
              onExportExcel={() => { generateExcel(data); localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString()); }}
              onExportMasterPDF={() => { generateMasterPDF(data); localStorage.setItem('LAST_BACKUP_TIMESTAMP', new Date().toISOString()); }}
              onExportPDF={() => generatePDF(data)}
              onExportLaborPDF={() => generateLaborReport(data)}
              onExportHarvestPDF={() => generateHarvestReport(data)}
              onExportGlobalReport={() => generateGlobalReport(data)}
              onExportAgronomicDossier={() => generateAgronomicDossier(data)}
              onExportSafetyReport={() => generateSafetyReport(data)}
              onExportFieldTemplates={() => generateFieldTemplates(data)}
              onExportStructurePDF={() => generateFarmStructurePDF(data.costCenters)}
              onExportStructureExcel={() => generateFarmStructureExcel(data.costCenters)}
          />}
          {showLaborForm && data && (
            <LaborForm 
              personnel={activePersonnel} 
              costCenters={activeCostCenters} 
              activities={activeActivities} 
              onSave={(log) => { 
                setData(prev => ({ ...prev, laborLogs: [...prev.laborLogs, { ...log, id: generateId(), warehouseId: activeId, paid: false }] })); 
                setShowLaborForm(false); 
                onShowNotification("Jornal registrado correctamente", 'success'); 
              }} 
              onCancel={() => setShowLaborForm(false)} 
              onOpenSettings={() => { setShowLaborForm(false); setShowSettings(true); }} 
              onAddPersonnel={handleAddPersonnelQuick}
              onAddCostCenter={handleAddCostCenterQuick}
              onAddActivity={(name) => handleAddActivityQuick(name, 'JOINT')}
            />
          )}
      </div>
    </>
  );
};
