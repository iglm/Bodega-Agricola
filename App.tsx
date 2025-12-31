
import React, { useState, useEffect, useMemo } from 'react';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { StatsView } from './components/StatsView';
import { InventoryForm } from './components/InventoryForm';
import { MovementModal } from './components/MovementModal';
import { ExportModal } from './components/ExportModal';
import { ManualModal } from './components/ManualModal';
import { WarehouseModal } from './components/WarehouseModal';
import { SettingsModal } from './components/SettingsModal';
import { DataModal } from './components/DataModal';
import { LaborView } from './components/LaborView'; 
import { LaborForm } from './components/LaborForm'; 
import { HarvestView } from './components/HarvestView'; 
import { ManagementView } from './components/ManagementView'; 
import { AgendaView } from './components/AgendaView';
import { StrategicView } from './components/StrategicView';
import { BiologicalAssetsView } from './components/BiologicalAssetsView';
import { BudgetView } from './components/BudgetView'; // NEW IMPORT
import { HistoryModal } from './components/HistoryModal';
import { DeleteModal } from './components/DeleteModal';
import { PayrollModal } from './components/PayrollModal';
import { SecurityModal } from './components/SecurityModal';
import { Notification } from './components/Notification';
import { SupportModal } from './components/SupportModal';
import { LaborSchedulerView } from './components/LaborSchedulerView';
import { AppState, InventoryItem, Movement, User, Unit, SWOT, LaborLog, CostClassification, Asset, Personnel, PhenologyLog, PestLog, MaintenanceLog, Machine, PlannedLabor, CostCenter, BudgetPlan } from './types';
import { processInventoryMovement, generateId, getBaseUnitType, convertToBase, loadDataFromLocalStorage, saveDataToLocalStorage } from './services/inventoryService';
import { dbService } from './services/db'; 
import { getDemoData, generateExcel, generatePDF, generateExecutiveReport, generateLaborReport, generateHarvestReport, generateFinancialReport, generateBudgetReport } from './services/reportService';
import { Package, Pickaxe, Target, Tractor, Database, Settings, Globe, ChevronDown, Download, Plus, TrendingUp, HelpCircle, Calendar, Zap, CalendarRange, Loader2, AlertTriangle, ShieldCheck, Sprout, Calculator } from 'lucide-react';

function App() {
  const [session, setSession] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState('inventory');
  
  // --- INICIALIZACIÓN SINCRÓNICA (MODO SEGURO) ---
  // Cargamos los datos inmediatamente para evitar la pantalla azul.
  const [data, setData] = useState<AppState>(() => {
      try {
          return loadDataFromLocalStorage();
      } catch (error) {
          console.error("Error crítico inicializando:", error);
          return getDemoData(); // Fallback final
      }
  });
  
  // Ya no usamos isLoading true por defecto, la app carga instantáneamente
  const [isLoading, setIsLoading] = useState(false); 

  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  // Security State
  const [secureAction, setSecureAction] = useState<(() => void) | null>(null);

  // --- ESTRATEGIA DE GUARDADO HÍBRIDO (DOBLE RESPALDO) ---
  useEffect(() => {
    if (!data) return;

    const handler = setTimeout(() => {
      // 1. Guardado Sincrónico (Rápido y Seguro)
      saveDataToLocalStorage(data);
      
      // 2. Guardado Asincrónico (Robusto - Segundo Plano)
      dbService.saveState(data).catch(err => console.warn("Fallo guardado IDB (No crítico):", err));
    }, 500); // 500ms debounce delay

    return () => {
      clearTimeout(handler);
    };
  }, [data]);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);
  
  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
  };

  // Modales Visibility
  const [showAddForm, setShowAddForm] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [showSupport, setShowSupport] = useState(false);
  
  const [movementModal, setMovementModal] = useState<{item: InventoryItem, type: 'IN' | 'OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  // Guard clause simplified
  if (!data) return null;

  const activeId = data.activeWarehouseId;
  const currentW = useMemo(() => data.warehouses.find(w => w.id === activeId), [data.warehouses, activeId]);

  const requestSecureAction = (action: () => void) => {
    setSecureAction(() => action);
  };
  
  const handlePinSuccess = (pin: string) => {
    if (!data.adminPin) {
      setData(prev => ({ ...prev, adminPin: pin }));
    }
    if (secureAction) {
      secureAction();
    }
    setSecureAction(null);
  };

  const handleDeleteItem = (id: string) => {
    setData(prev => ({
      ...prev,
      inventory: prev.inventory.filter(i => i.id !== id),
      movements: prev.movements.filter(m => m.itemId !== id)
    }));
    setDeleteItem(null);
  };

  const handleUpdateSWOT = (swot: SWOT) => {
    setData(prev => ({ ...prev, swot }));
  };

  const handleToggleBpa = (code: string) => {
    setData(prev => ({
      ...prev,
      bpaChecklist: { ...prev.bpaChecklist, [code]: !prev.bpaChecklist[code] }
    }));
  };

  const handleAddAsset = (asset: Omit<Asset, 'id' | 'warehouseId'>) => {
    setData(prev => ({
      ...prev,
      assets: [...(prev.assets || []), { ...asset, id: generateId(), warehouseId: activeId }]
    }));
  };
  
  const handleUpdateMachine = (machine: Machine) => {
      setData(prev => ({ ...prev, machines: prev.machines.map(m => m.id === machine.id ? machine : m) }));
  };

  const handleDeleteAsset = (id: string) => {
    setData(prev => ({
      ...prev,
      assets: prev.assets.filter(a => a.id !== id)
    }));
  };

  const handleLoadDemoData = () => {
    const demoData = getDemoData();
    setData(demoData);
    setSession({
      id: 'user_demo_datosfinca',
      name: 'Usuario Demo',
      email: 'demo@datosfinca.com',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=DatosFincaVivaDemo'
    });
    setView('app');
    showNotification('Datos de demostración cargados. ¡Explora el potencial!', 'success');
  };

  // --- NEW AGRONOMY HANDLERS ---
  const handleAddPhenologyLog = (log: Omit<PhenologyLog, 'id'|'warehouseId'>) => setData(prev => ({ ...prev, phenologyLogs: [...prev.phenologyLogs, { ...log, id: generateId(), warehouseId: activeId }] }));
  const handleDeletePhenologyLog = (id: string) => setData(prev => ({ ...prev, phenologyLogs: prev.phenologyLogs.filter(p => p.id !== id) }));
  const handleAddPestLog = (log: Omit<PestLog, 'id'|'warehouseId'>) => setData(prev => ({ ...prev, pestLogs: [...prev.pestLogs, { ...log, id: generateId(), warehouseId: activeId }] }));
  const handleDeletePestLog = (id: string) => setData(prev => ({ ...prev, pestLogs: prev.pestLogs.filter(p => p.id !== id) }));
  const handleAddMaintenance = (log: Omit<MaintenanceLog, 'id'|'warehouseId'>) => setData(prev => ({...prev, maintenanceLogs: [...prev.maintenanceLogs, {...log, id: generateId(), warehouseId: activeId}]}));

  // --- NEW SCHEDULER HANDLERS ---
  const handleAddPlannedLabor = (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => {
      setData(prev => ({
          ...prev,
          plannedLabors: [...(prev.plannedLabors || []), { ...labor, id: generateId(), warehouseId: activeId, completed: false }]
      }));
      showNotification('Labor programada exitosamente', 'success');
  };

  const handleDeletePlannedLabor = (id: string) => {
      setData(prev => ({
          ...prev,
          plannedLabors: prev.plannedLabors.filter(l => l.id !== id)
      }));
  };

  const handleTogglePlannedLabor = (id: string) => {
      setData(prev => ({
          ...prev,
          plannedLabors: prev.plannedLabors.map(l => l.id === id ? { ...l, completed: !l.completed } : l)
      }));
  };

  // --- COST CENTER / LOT UPDATES ---
  const handleUpdateCostCenter = (updatedLot: CostCenter) => {
      setData(prev => ({
          ...prev,
          costCenters: prev.costCenters.map(c => c.id === updatedLot.id ? updatedLot : c)
      }));
      showNotification('Lote actualizado exitosamente', 'success');
  };

  // --- BUDGET HANDLERS ---
  const handleSaveBudget = (budget: BudgetPlan) => {
      // Check if budget exists to update or add
      const exists = data.budgets?.find(b => b.id === budget.id);
      let newBudgets = data.budgets || [];
      
      if (exists) {
          newBudgets = newBudgets.map(b => b.id === budget.id ? budget : b);
      } else {
          newBudgets = [...newBudgets, budget];
      }

      setData(prev => ({ ...prev, budgets: newBudgets }));
  };

  const handleSaveNewItem = (
    item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>,
    initialQuantity: number,
    initialMovementDetails?: { supplierId?: string, invoiceNumber?: string, invoiceImage?: string },
    initialUnit?: Unit
  ) => {
      const baseUnit = getBaseUnitType(item.lastPurchaseUnit);
      
      const newItem: InventoryItem = {
          ...item,
          id: generateId(),
          warehouseId: activeId,
          baseUnit: baseUnit,
          currentQuantity: 0,
          averageCost: 0
      };
  
      let updatedInventory = [...data.inventory, newItem];
      let newMovements = [...data.movements];
  
      if (initialQuantity > 0 && initialUnit) {
          const initialMovement: Omit<Movement, 'id' | 'date' | 'warehouseId'> = {
              itemId: newItem.id,
              itemName: newItem.name,
              type: 'IN',
              quantity: initialQuantity,
              unit: initialUnit,
              calculatedCost: 0, // Recalculated by processInventoryMovement
              supplierId: initialMovementDetails?.supplierId,
              supplierName: data.suppliers.find(s => s.id === initialMovementDetails?.supplierId)?.name,
              invoiceNumber: initialMovementDetails?.invoiceNumber,
              invoiceImage: initialMovementDetails?.invoiceImage,
              notes: 'Saldo inicial'
          };
  
          const { updatedInventory: invWithMovement, movementCost } = processInventoryMovement(
              updatedInventory, 
              initialMovement, 
              item.lastPurchasePrice,
              item.expirationDate
          );
          
          updatedInventory = invWithMovement;
          const completeMovement: Movement = {
              ...initialMovement,
              id: generateId(),
              warehouseId: activeId,
              date: new Date().toISOString(),
              calculatedCost: movementCost
          };
          newMovements = [completeMovement, ...newMovements];
      }
  
      setData(prev => ({
          ...prev,
          inventory: updatedInventory,
          movements: newMovements
      }));
  
      setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      
      {notification && (
          <Notification 
              message={notification.message} 
              type={notification.type} 
              onClose={() => setNotification(null)} 
          />
      )}

      {/* PANTALLA DE INICIO */}
      {view === 'landing' && (
        <Landing 
            onEnter={(u) => { setSession(u); setView('app'); }} 
            onShowManual={() => setShowManual(true)} 
            onRestoreBackup={() => requestSecureAction(() => setShowData(true))}
            onLoadDemoData={handleLoadDemoData}
        />
      )}

      {/* APLICACIÓN PRINCIPAL */}
      {view === 'app' && data && (
        <>
          <header className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 sticky top-0 z-40 px-4 py-2 pt-10 sm:pt-2">
            <div className="max-w-4xl mx-auto flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <button onClick={() => setShowWarehouses(true)} className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <div className="p-1.5 bg-emerald-600 rounded-lg shadow-lg"><Globe className="w-4 h-4 text-white" /></div>
                        <div className="text-left"><h1 className="text-sm font-black flex items-center gap-1">DatosFinca Viva <ChevronDown className="w-3 h-3" /></h1><span className="text-[9px] text-slate-500 uppercase font-black">{currentW?.name}</span></div>
                    </button>
                    <div className="flex gap-1">
                        <button onClick={() => setShowManual(true)} className="p-2 text-slate-400 hover:text-emerald-500 transition-colors" title="Ayuda"><HelpCircle className="w-5 h-5" /></button>
                        <button onClick={() => requestSecureAction(() => setShowData(true))} className="p-2 text-orange-500 hover:text-orange-400 transition-colors" title="Datos"><Database className="w-5 h-5" /></button>
                        <button onClick={() => setShowSettings(true)} className="p-2 text-slate-500 hover:text-slate-400 transition-colors" title="Maestros y Configuración"><Settings className="w-5 h-5" /></button>
                        <button onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} className="p-2 hover:scale-110 transition-transform">
                            {theme === 'dark' ? '🌞' : '🌙'}
                        </button>
                    </div>
                </div>
                <div className="flex bg-slate-200 dark:bg-slate-950 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-hide">
                    {[
                        { id: 'inventory', label: 'Bodega', icon: Package },
                        { id: 'labor', label: 'Personal', icon: Pickaxe },
                        { id: 'scheduler', label: 'Programar', icon: CalendarRange }, 
                        { id: 'harvest', label: 'Ventas', icon: Target },
                        { id: 'management', label: 'Campo', icon: Tractor },
                        { id: 'assets', label: 'Activos Bio', icon: Sprout },
                        { id: 'budget', label: 'Presupuesto', icon: Calculator }, // NEW TAB
                        { id: 'agenda', label: 'Agenda', icon: Calendar },
                        { id: 'strategic', label: 'Estrategia', icon: TrendingUp },
                        { id: 'stats', label: 'KPIs', icon: Database }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex-1 min-w-[72px] py-2 rounded-xl text-[9px] font-black uppercase flex flex-col items-center gap-1 transition-all ${currentTab === tab.id ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm' : 'text-slate-500'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
                    ))}
                </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto p-4 pb-40">
            {currentTab === 'inventory' && <Dashboard inventory={data.inventory.filter(i=>i.warehouseId === activeId)} laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)} harvests={data.harvests.filter(h=>h.warehouseId === activeId)} movements={data.movements.filter(m=>m.warehouseId === activeId)} onAddMovement={(i, t) => setMovementModal({item:i, type:t})} onDelete={(id) => requestSecureAction(() => { const item = data.inventory.find(i => i.id === id); if (item) setDeleteItem(item); })} onViewHistory={(item) => setHistoryItem(item)} isAdmin={true} />}
            {currentTab === 'labor' && <LaborView laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)} personnel={data.personnel.filter(p=>p.warehouseId === activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId === activeId)} activities={data.activities.filter(a=>a.warehouseId === activeId)} onAddLabor={()=>setShowLaborForm(true)} onDeleteLabor={(id) => setData(prev=>({...prev, laborLogs: prev.laborLogs.filter(l=>l.id!==id)}))} isAdmin={true} onOpenPayroll={()=>setShowPayroll(true)} />}
            {currentTab === 'scheduler' && <LaborSchedulerView 
                plannedLabors={data.plannedLabors ? data.plannedLabors.filter(l=>l.warehouseId===activeId) : []} 
                costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} 
                activities={data.activities.filter(a=>a.warehouseId===activeId)} 
                onAddPlannedLabor={handleAddPlannedLabor} 
                onDeletePlannedLabor={handleDeletePlannedLabor} 
                onToggleComplete={handleTogglePlannedLabor}
                // PASSED FOR BUDGET CHECK
                budgets={data.budgets || []}
                laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)}
                laborFactor={data.laborFactor}
            />}
            {currentTab === 'harvest' && <HarvestView harvests={data.harvests.filter(h=>h.warehouseId === activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId === activeId)} onAddHarvest={(h)=>setData(prev=>({...prev, harvests: [...prev.harvests, {...h, id: generateId(), warehouseId: activeId}]}))} onDeleteHarvest={(id) => setData(prev=>({...prev, harvests: prev.harvests.filter(h=>h.id !== id)}))} isAdmin={true} allMovements={data.movements} />}
            {currentTab === 'management' && <ManagementView machines={data.machines.filter(m=>m.warehouseId===activeId)} onUpdateMachine={handleUpdateMachine} maintenanceLogs={data.maintenanceLogs.filter(m=>m.warehouseId===activeId)} rainLogs={data.rainLogs.filter(r=>r.warehouseId===activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} personnel={data.personnel.filter(p=>p.warehouseId===activeId)} activities={data.activities.filter(a=>a.warehouseId===activeId)} soilAnalyses={data.soilAnalyses.filter(s=>s.warehouseId===activeId)} ppeLogs={data.ppeLogs.filter(p=>p.warehouseId===activeId)} wasteLogs={data.wasteLogs.filter(w=>w.warehouseId===activeId)} assets={data.assets.filter(a=>a.warehouseId===activeId)} bpaChecklist={data.bpaChecklist} onAddMachine={(m)=>setData(prev=>({...prev, machines:[...prev.machines,{...m, id:generateId(), warehouseId:activeId}]}))} onAddMaintenance={handleAddMaintenance} onDeleteMachine={(id)=>setData(prev=>({...prev, machines: prev.machines.filter(m=>m.id!==id)}))} onAddRain={(r)=>setData(prev=>({...prev, rainLogs:[...prev.rainLogs,{...r, id:generateId(), warehouseId:activeId}]}))} onDeleteRain={(id)=>setData(prev=>({...prev, rainLogs: prev.rainLogs.filter(r=>r.id!==id)}))} onAddSoilAnalysis={(s)=>setData(prev=>({...prev, soilAnalyses:[...prev.soilAnalyses,{...s, id:generateId(), warehouseId:activeId}]}))} onDeleteSoilAnalysis={(id)=>setData(prev=>({...prev, soilAnalyses: prev.soilAnalyses.filter(s=>s.id!==id)}))} onAddPPE={(p)=>setData(prev=>({...prev, ppeLogs:[...prev.ppeLogs,{...p, id:generateId(), warehouseId:activeId}]}))} onDeletePPE={(id)=>setData(prev=>({...prev, ppeLogs: prev.ppeLogs.filter(p=>p.id!==id)}))} onAddWaste={(w)=>setData(prev=>({...prev, wasteLogs:[...prev.wasteLogs,{...w, id:generateId(), warehouseId:activeId}]}))} onDeleteWaste={(id)=>setData(prev=>({...prev, wasteLogs: prev.wasteLogs.filter(w=>w.id!==id)}))} onAddAsset={handleAddAsset} onDeleteAsset={handleDeleteAsset} onToggleBpa={handleToggleBpa} isAdmin={true} phenologyLogs={data.phenologyLogs.filter(p=>p.warehouseId===activeId)} onAddPhenologyLog={handleAddPhenologyLog} onDeletePhenologyLog={handleDeletePhenologyLog} pestLogs={data.pestLogs.filter(p=>p.warehouseId===activeId)} onAddPestLog={handleAddPestLog} onDeletePestLog={handleDeletePestLog} />}
            {currentTab === 'assets' && <BiologicalAssetsView costCenters={data.costCenters.filter(c=>c.warehouseId === activeId)} movements={data.movements.filter(m=>m.warehouseId === activeId)} laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)} laborFactor={data.laborFactor} onUpdateLot={handleUpdateCostCenter} />}
            {/* NEW TAB RENDER WITH REAL DATA FOR CONTROL */}
            {currentTab === 'budget' && <BudgetView 
                budgets={data.budgets || []} 
                costCenters={data.costCenters.filter(c=>c.warehouseId === activeId)} 
                activities={data.activities.filter(a=>a.warehouseId === activeId)} 
                inventory={data.inventory.filter(i=>i.warehouseId === activeId)} 
                warehouseId={activeId} 
                onSaveBudget={handleSaveBudget} 
                // Passing real data for comparisons
                laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)}
                movements={data.movements.filter(m=>m.warehouseId === activeId)}
                laborFactor={data.laborFactor}
            />}
            {currentTab === 'agenda' && <AgendaView agenda={data.agenda.filter(a => a.warehouseId === activeId)} onAddEvent={(e) => setData(prev => ({ ...prev, agenda: [...prev.agenda, { ...e, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), completed: false }] }))} onToggleEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.map(a => a.id === id ? { ...a, completed: !a.completed } : a) }))} onDeleteEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }))} />}
            {currentTab === 'strategic' && <StrategicView data={data} onUpdateSWOT={handleUpdateSWOT} />}
            {currentTab === 'stats' && <StatsView 
                laborFactor={data.laborFactor} 
                movements={data.movements.filter(m=>m.warehouseId===activeId)} 
                suppliers={data.suppliers.filter(s=>s.warehouseId===activeId)} 
                costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} 
                laborLogs={data.laborLogs.filter(l=>l.warehouseId===activeId)} 
                harvests={data.harvests.filter(h=>h.warehouseId===activeId)} 
                maintenanceLogs={data.maintenanceLogs.filter(m=>m.warehouseId===activeId)} 
                rainLogs={data.rainLogs.filter(r=>r.warehouseId===activeId)} 
                machines={data.machines.filter(m=>m.warehouseId===activeId)} 
                budgets={data.budgets || []} 
            />}
            
            <div className="fixed bottom-6 left-6 flex gap-2 z-30">
                <button onClick={() => setShowExport(true)} className="p-4 bg-slate-800 text-white rounded-3xl shadow-2xl border border-slate-700 active:scale-90 transition-all"><Download className="w-6 h-6" /></button>
            </div>
            
            {currentTab === 'inventory' && <button onClick={() => setShowAddForm(true)} className="fixed bottom-6 right-6 bg-emerald-600 text-white p-5 rounded-3xl shadow-2xl active:scale-95 transition-all z-30 mr-20 sm:mr-0"><Plus className="w-8 h-8" /></button>}
          </main>
        </>
      )}

      {/* MODALES GLOBALES (Renderizados siempre por encima de todo) */}
      <div className="z-[100] relative">
          {secureAction && <SecurityModal existingPin={data?.adminPin} onSuccess={handlePinSuccess} onClose={() => setSecureAction(null)} />}
          {showManual && <ManualModal onClose={() => setShowManual(false)} />}
          {showData && data && <DataModal fullState={data} onRestoreData={(d) => { setData(d); setShowData(false); }} onClose={() => setShowData(false)} onShowNotification={showNotification} />}
          {showSettings && data && <SettingsModal 
              suppliers={data.suppliers.filter(s=>s.warehouseId===activeId)} 
              costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} 
              personnel={data.personnel.filter(p=>p.warehouseId===activeId)} 
              activities={data.activities.filter(a=>a.warehouseId===activeId)} 
              fullState={data} onUpdateState={(newState) => setData(newState)}
              onAddSupplier={(n,p,e,a) => setData(prev=>({...prev, suppliers:[...prev.suppliers,{id:generateId(),warehouseId:activeId,name:n,phone:p,email:e,address:a}]}))} 
              onDeleteSupplier={(id) => setData(prev=>({...prev, suppliers: prev.suppliers.filter(s=>s.id!==id)}))} 
              onAddCostCenter={(n,b,a,s,pc,ct,ac) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac}]}))} 
              onDeleteCostCenter={(id) => setData(prev=>({...prev, costCenters: prev.costCenters.filter(c=>c.id!==id)}))} 
              onAddPersonnel={(p) => setData(prev=>({...prev, personnel:[...prev.personnel,{...p, id:generateId(),warehouseId:activeId}]}))} 
              onDeletePersonnel={(id) => setData(prev=>({...prev, personnel: prev.personnel.filter(p=>p.id!==id)}))} 
              onAddActivity={(n, cls) => setData(prev=>({...prev, activities:[...prev.activities,{id:generateId(),warehouseId:activeId,name:n,costClassification:cls}]}))} 
              onDeleteActivity={(id) => setData(prev=>({...prev, activities: prev.activities.filter(a=>a.id!==id)}))} 
              onClose={() => setShowSettings(false)} 
          />}
          {showPayroll && data && <PayrollModal logs={data.laborLogs.filter(l => l.warehouseId === activeId)} personnel={data.personnel.filter(p => p.warehouseId === activeId)} warehouseName={currentW?.name || ""} laborFactor={data.laborFactor} onMarkAsPaid={(ids) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l) }))} onClose={() => setShowPayroll(false)} />}
          {showAddForm && data && <InventoryForm suppliers={data.suppliers.filter(s=>s.warehouseId===activeId)} onSave={handleSaveNewItem} onCancel={() => setShowAddForm(false)} />}
          {movementModal && data && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={data.suppliers.filter(s=>s.warehouseId===activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} personnel={data.personnel.filter(p=>p.warehouseId===activeId)} machines={data.machines.filter(m=>m.warehouseId===activeId)} onSave={(mov, price, exp) => { const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, mov, price, exp); setData(prev => ({ ...prev, inventory: updatedInventory, movements: [{ ...mov, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost }, ...prev.movements] })); setMovementModal(null); }} onCancel={() => setMovementModal(null)} />}
          {historyItem && data && <HistoryModal item={historyItem} movements={data.movements.filter(m => m.itemId === historyItem.id)} onClose={() => setHistoryItem(null)} />}
          {deleteItem && <DeleteModal itemName={deleteItem.name} onConfirm={() => handleDeleteItem(deleteItem.id)} onCancel={() => setDeleteItem(null)} />}
          {showWarehouses && data && <WarehouseModal warehouses={data.warehouses} activeId={activeId} onSwitch={(id) => setData(prev=>({...prev, activeWarehouseId: id}))} onCreate={(n) => setData(prev=>({...prev, warehouses: [...prev.warehouses, {id: generateId(), name: n, created: new Date().toISOString()}]}))} onDelete={(id) => setData(prev=>({...prev, warehouses: prev.warehouses.filter(w=>w.id!==id)}))} onClose={() => setShowWarehouses(false)} />}
          {showExport && data && <ExportModal onExportPDF={() => generatePDF(data)} onExportExcel={() => generateExcel(data)} onGenerateOrder={() => {alert('Función PRO: No implementada.')}} onExportLaborPDF={() => generateLaborReport(data)} onExportLaborExcel={() => {alert('Función PRO: No implementada.')}} onExportHarvestPDF={() => generateHarvestReport(data)} onClose={() => setShowExport(false)} activeData={data} onShowSupport={() => setShowSupport(true)} isSupporter={true} />}
          {showLaborForm && data && <LaborForm personnel={data.personnel.filter(p=>p.warehouseId===activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} activities={data.activities.filter(a=>a.warehouseId===activeId)} onSave={(l)=> { setData(prev=>({...prev, laborLogs: [...prev.laborLogs, {...l, id: generateId(), warehouseId: activeId, paid: false}]})); setShowLaborForm(false); }} onCancel={()=>setShowLaborForm(false)} onOpenSettings={()=>setShowSettings(true)} />}
          {showSupport && <SupportModal onClose={() => setShowSupport(false)} onUpgrade={() => {}} isSupporter={false} />}
      </div>

    </div>
  );
}

export default App;
