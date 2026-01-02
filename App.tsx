
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
import { HarvestView } from './components/HarvestView'; 
import { AgendaView } from './components/AgendaView';
import { StrategicView } from './components/StrategicView';
import { BiologicalAssetsView } from './components/BiologicalAssetsView';
import { BudgetView } from './components/BudgetView'; 
import { SimulatorView } from './components/SimulatorView'; 
import { ManagementView } from './components/ManagementView';
import { HistoryModal } from './components/HistoryModal';
import { DeleteModal } from './components/DeleteModal';
import { PayrollModal } from './components/PayrollModal';
import { SecurityModal } from './components/SecurityModal';
import { Notification } from './components/Notification';
import { LaborSchedulerView } from './components/LaborSchedulerView';
import { AppState, InventoryItem, Movement, User, Unit, LaborLog, Asset, Personnel, PhenologyLog, PestLog, MaintenanceLog, Machine, PlannedLabor, CostCenter, BudgetPlan } from './types';
import { processInventoryMovement, generateId, getBaseUnitType, loadDataFromLocalStorage, saveDataToLocalStorage } from './services/inventoryService';
import { dbService } from './services/db'; 
import { getDemoData, generateExcel, generatePDF, generateLaborReport, generateHarvestReport } from './services/reportService';
import { Package, Pickaxe, Target, Tractor, Database, Settings, Globe, ChevronDown, Download, Plus, TrendingUp, HelpCircle, Calendar, Zap, CalendarRange, Sprout, Calculator, Lightbulb, LayoutGrid, Sun, Moon, Loader2 } from 'lucide-react';

function App() {
  // 1. TODOS LOS HOOKS DEBEN IR AL PRINCIPIO (Regla de Hooks)
  const [session, setSession] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState('inventory');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  
  const [data, setData] = useState<AppState>(() => ({
      warehouses: [], activeWarehouseId: '', inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], plannedLabors: [], budgets: [], assets: [], laborFactor: 1.0
  }));
  
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'dark');
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [secureAction, setSecureAction] = useState<(() => void) | null>(null);

  const [showAddForm, setShowAddForm] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showData, setShowData] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showPayroll, setShowPayroll] = useState(false);
  const [showGlobalHistory, setShowGlobalHistory] = useState(false);
  
  const [movementModal, setMovementModal] = useState<{item: InventoryItem, type: 'IN' | 'OUT'} | null>(null);
  const [historyItem, setHistoryItem] = useState<InventoryItem | null>(null);
  const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);

  const activeId = data.activeWarehouseId;
  const currentW = useMemo(() => data.warehouses.find(w => w.id === activeId), [data.warehouses, activeId]);

  // 2. EFECTOS DE PERSISTENCIA (SISTEMA ANTI-PÉRDIDA)
  useEffect(() => {
    const initData = async () => {
        try {
            const savedState = await dbService.loadState();
            if (savedState && savedState.activeWarehouseId) {
                setData(savedState);
            } else {
                const legacy = loadDataFromLocalStorage();
                setData(legacy);
            }
        } catch (e) {
            console.error("Error cargando DB local:", e);
        } finally {
            setIsDataLoaded(true);
        }
    };
    initData();
  }, []);

  useEffect(() => {
    if (!isDataLoaded || !data.activeWarehouseId) return;
    saveDataToLocalStorage(data);
    dbService.saveState(data).catch(err => console.warn("Guardado asíncrono:", err));
  }, [data, isDataLoaded]);

  useEffect(() => {
    document.documentElement.className = theme;
    localStorage.setItem('theme', theme);
  }, [theme]);

  // 3. RETORNO TEMPRANO SOLO DESPUÉS DE DECLARAR TODOS LOS HOOKS
  if (!isDataLoaded) {
      return (
          <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center gap-4">
              <Loader2 className="w-12 h-12 text-emerald-500 animate-spin" />
              <p className="text-emerald-400 font-black text-xs uppercase tracking-widest">Asegurando Base de Datos Local...</p>
          </div>
      );
  }

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
      setNotification({ message, type });
  };

  const requestSecureAction = (action: () => void) => { setSecureAction(() => action); };
  const handlePinSuccess = (pin: string) => { if (!data.adminPin) { setData(prev => ({ ...prev, adminPin: pin })); } if (secureAction) { secureAction(); } setSecureAction(null); };
  const handleDeleteItem = (id: string) => { setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== id), movements: prev.movements.filter(m => m.itemId !== id) })); setDeleteItem(null); };
  const handleLoadDemoData = () => { const demoData = getDemoData(); setData(demoData); setSession({ id: 'user_demo', name: 'Usuario Demo', email: 'demo@agrobodega.com', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=AgroPro' }); setView('app'); showNotification('Datos demo cargados.', 'success'); };
  const handleAddPlannedLabor = (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => { setData(prev => ({ ...prev, plannedLabors: [...(prev.plannedLabors || []), { ...labor, id: generateId(), warehouseId: activeId, completed: false }] })); showNotification('Labor programada.', 'success'); };
  const handleUpdateCostCenter = (updatedLot: CostCenter) => { setData(prev => ({ ...prev, costCenters: prev.costCenters.map(c => c.id === updatedLot.id ? updatedLot : c) })); showNotification('Lote actualizado.', 'success'); };
  const handleSaveBudget = (budget: BudgetPlan) => { const exists = data.budgets?.find(b => b.id === budget.id); let newBudgets = data.budgets || []; if (exists) { newBudgets = newBudgets.map(b => b.id === budget.id ? budget : b); } else { newBudgets = [...newBudgets, budget]; } setData(prev => ({ ...prev, budgets: newBudgets })); };

  // --- INTEGRIDAD REFERENCIAL 360° (ANTI-CRASH) ---

  // 1. Eliminación de Lotes (Centros de Costo)
  const handleDeleteCostCenter = (id: string) => {
      const deps = {
          labor: data.laborLogs.filter(l => l.costCenterId === id).length,
          harvests: data.harvests.filter(h => h.costCenterId === id).length,
          movements: data.movements.filter(m => m.costCenterId === id).length,
          planned: (data.plannedLabors || []).filter(p => p.costCenterId === id).length,
          budgets: (data.budgets || []).filter(b => b.costCenterId === id).length,
          others: (data.phenologyLogs || []).filter(p => p.costCenterId === id).length + (data.pestLogs || []).filter(p => p.costCenterId === id).length + (data.soilAnalyses || []).filter(s => s.costCenterId === id).length
      };
      const totalDeps = Object.values(deps).reduce((a, b) => a + b, 0);

      if (totalDeps > 0) {
          const message = `⚠️ ALERTA DE INTEGRIDAD:\n\nEste lote tiene ${totalDeps} registros vinculados:\n- ${deps.harvests} Ventas/Cosechas\n- ${deps.labor} Pagos de Nómina\n- ${deps.movements} Insumos Aplicados\n\nPROTOCOLO DE SEGURIDAD:\n1. Los registros financieros (Ventas/Nómina) NO SE BORRARÁN para proteger su contabilidad histórica. Se marcarán como "Lote Eliminado".\n2. Las planificaciones futuras y registros técnicos sí se eliminarán.\n\n¿Confirma la eliminación?`;
          if (!confirm(message)) return;
      } else {
          if (!confirm("¿Está seguro de eliminar este Lote?")) return;
      }

      setData(prev => ({
          ...prev,
          costCenters: prev.costCenters.filter(c => c.id !== id),
          // Soft-Delete para Financieros (Preserva la contabilidad)
          laborLogs: prev.laborLogs.map(l => l.costCenterId === id ? { ...l, costCenterId: 'deleted', costCenterName: `${l.costCenterName} (Eliminado)` } : l),
          harvests: prev.harvests.map(h => h.costCenterId === id ? { ...h, costCenterId: 'deleted', costCenterName: `${h.costCenterName} (Eliminado)` } : h),
          movements: prev.movements.map(m => m.costCenterId === id ? { ...m, costCenterId: undefined, costCenterName: `${m.costCenterName} (Eliminado)` } : m),
          // Hard-Delete para Operativos (Limpieza)
          plannedLabors: (prev.plannedLabors || []).filter(p => p.costCenterId !== id),
          budgets: (prev.budgets || []).filter(b => b.costCenterId !== id),
          phenologyLogs: (prev.phenologyLogs || []).filter(p => p.costCenterId !== id),
          pestLogs: (prev.pestLogs || []).filter(p => p.costCenterId !== id),
          soilAnalyses: (prev.soilAnalyses || []).filter(s => s.costCenterId !== id)
      }));
      showNotification('Lote eliminado. Historial financiero preservado.', 'success');
  };

  // 2. Eliminación de Personal
  const handleDeletePersonnel = (id: string) => {
      const pendingPay = data.laborLogs.filter(l => l.personnelId === id && !l.paid).length;
      if (pendingPay > 0) {
          alert(`⛔ NO SE PUEDE ELIMINAR:\n\nEste trabajador tiene ${pendingPay} jornales pendientes de pago. Liquide la deuda antes de retirarlo del sistema.`);
          return;
      }

      const historyCount = data.laborLogs.filter(l => l.personnelId === id).length;
      if (historyCount > 0) {
          if (!confirm(`Este trabajador tiene ${historyCount} registros históricos de nómina.\n\nEl sistema conservará estos registros para cuadre de caja, pero el perfil será eliminado de la lista activa.\n\n¿Confirmar retiro?`)) return;
      } else {
          if (!confirm("¿Eliminar trabajador?")) return;
      }

      setData(prev => ({
          ...prev,
          personnel: prev.personnel.filter(p => p.id !== id),
          laborLogs: prev.laborLogs.map(l => l.personnelId === id ? { ...l, personnelId: 'deleted', personnelName: `${l.personnelName} (Retirado)` } : l),
          movements: prev.movements.map(m => m.personnelId === id ? { ...m, personnelId: undefined, personnelName: `${m.personnelName} (Retirado)` } : m),
          plannedLabors: (prev.plannedLabors || []).map(p => p.assignedPersonnelIds?.includes(id) ? { ...p, assignedPersonnelIds: p.assignedPersonnelIds.filter(pid => pid !== id) } : p)
      }));
      showNotification('Trabajador retirado correctamente.', 'success');
  };

  // 3. Eliminación de Actividades
  const handleDeleteActivity = (id: string) => {
      const usage = data.laborLogs.filter(l => l.activityId === id).length;
      if (usage > 0) {
          if (!confirm(`Esta labor se ha usado en ${usage} registros de pago.\n\nSe conservará el historial contable, pero la labor ya no estará disponible para nuevos registros.\n\n¿Proceder?`)) return;
      } else {
          if (!confirm("¿Eliminar labor?")) return;
      }

      setData(prev => ({
          ...prev,
          activities: prev.activities.filter(a => a.id !== id),
          laborLogs: prev.laborLogs.map(l => l.activityId === id ? { ...l, activityId: 'deleted', activityName: `${l.activityName} (Obsolescente)` } : l),
          plannedLabors: (prev.plannedLabors || []).filter(p => p.activityId !== id) // Eliminar planificaciones futuras de esta labor
      }));
      showNotification('Labor eliminada del catálogo.', 'success');
  };

  const handleSaveNewItem = (item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails?: { supplierId?: string, invoiceNumber?: string, invoiceImage?: string }, initialUnit?: Unit) => {
      const baseUnit = getBaseUnitType(item.lastPurchaseUnit);
      const newItem: InventoryItem = { ...item, id: generateId(), warehouseId: activeId, baseUnit: baseUnit, currentQuantity: 0, averageCost: 0 };
      let updatedInventory = [...data.inventory, newItem];
      let newMovements = [...data.movements];
      if (initialQuantity > 0 && initialUnit) {
          const initialMovement: Omit<Movement, 'id' | 'date' | 'warehouseId'> = { itemId: newItem.id, itemName: newItem.name, type: 'IN', quantity: initialQuantity, unit: initialUnit, calculatedCost: 0, supplierId: initialMovementDetails?.supplierId, supplierName: data.suppliers.find(s => s.id === initialMovementDetails?.supplierId)?.name, invoiceNumber: initialMovementDetails?.invoiceNumber, invoiceImage: initialMovementDetails?.invoiceImage, notes: 'Saldo inicial' };
          const { updatedInventory: invWithMovement, movementCost } = processInventoryMovement(updatedInventory, initialMovement, item.lastPurchasePrice, item.expirationDate);
          updatedInventory = invWithMovement;
          const completeMovement: Movement = { ...initialMovement, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost };
          newMovements = [completeMovement, ...newMovements];
      }
      setData(prev => ({ ...prev, inventory: updatedInventory, movements: newMovements }));
      setShowAddForm(false);
  };

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-100 transition-colors duration-300">
      {notification && <Notification message={notification.message} type={notification.type} onClose={() => setNotification(null)} />}
      {view === 'landing' && (
        <Landing onEnter={(u) => { setSession(u); setView('app'); }} onShowManual={() => setShowManual(false)} onLoadDemoData={handleLoadDemoData} />
      )}
      {view === 'app' && data && (
        <>
          <header className="bg-white/95 dark:bg-slate-900/90 backdrop-blur-md border-b-2 border-slate-300 dark:border-slate-800 sticky top-0 z-40 px-4 py-2 pt-10 sm:pt-2">
            <div className="max-w-4xl mx-auto flex flex-col gap-2">
                <div className="flex justify-between items-center">
                    <button onClick={() => setShowWarehouses(true)} className="flex items-center gap-2 p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
                        <div className="p-1.5 bg-emerald-600 rounded-lg shadow-lg"><Globe className="w-4 h-4 text-white" /></div>
                        <div className="text-left"><h1 className="text-sm font-black flex items-center gap-1 text-slate-900 dark:text-white">DatosFinca Viva <ChevronDown className="w-3 h-3" /></h1><span className="text-[9px] text-slate-500 uppercase font-black">{currentW?.name || 'Seleccionar Finca'}</span></div>
                    </button>
                    <div className="flex gap-1 items-center">
                        <button onClick={() => setShowManual(true)} className="p-2 text-slate-500 dark:text-slate-400 hover:text-emerald-500 transition-colors"><HelpCircle className="w-5 h-5" /></button>
                        <button onClick={() => requestSecureAction(() => setShowData(true))} className="p-2 text-orange-600 hover:text-orange-400 transition-colors"><Database className="w-5 h-5" /></button>
                        <button onClick={() => setShowSettings(true)} className="p-2 text-slate-600 dark:text-slate-400 hover:text-slate-800 transition-colors"><Settings className="w-5 h-5" /></button>
                        <button 
                          onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')} 
                          className="flex items-center gap-2 px-3 py-1.5 bg-slate-200 dark:bg-slate-800 rounded-full border border-slate-300 dark:border-slate-700 active:scale-95 transition-all"
                        >
                          {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-500" /> : <Moon className="w-4 h-4 text-slate-700" />}
                          <span className="text-[9px] font-black uppercase text-slate-600 dark:text-slate-300">{theme === 'dark' ? 'Modo Sol' : 'Modo Noche'}</span>
                        </button>
                    </div>
                </div>
                <div className="flex bg-slate-300 dark:bg-slate-950 p-1 rounded-2xl gap-1 overflow-x-auto scrollbar-hide border border-slate-400 dark:border-transparent">
                    {[
                        { id: 'inventory', label: 'Bodega', icon: Package },
                        { id: 'labor', label: 'Personal', icon: Pickaxe },
                        { id: 'scheduler', label: 'Programar', icon: CalendarRange }, 
                        { id: 'harvest', label: 'Ventas', icon: Target },
                        { id: 'simulator', label: 'Simulador', icon: Lightbulb }, 
                        { id: 'management', label: 'Campo', icon: Tractor },
                        { id: 'assets', label: 'Activos Bio', icon: Sprout },
                        { id: 'budget', label: 'Presupuesto', icon: Calculator }, 
                        { id: 'stats', label: 'KPIs', icon: Database }
                    ].map(tab => (
                        <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex-1 min-w-[72px] py-2 rounded-xl text-[9px] font-black uppercase flex flex-col items-center gap-1 transition-all ${currentTab === tab.id ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-emerald-400 shadow-md ring-1 ring-slate-400 dark:ring-transparent' : 'text-slate-600 dark:text-slate-500'}`}><tab.icon className="w-4 h-4" />{tab.label}</button>
                    ))}
                </div>
            </div>
          </header>

          <main className="max-w-4xl mx-auto p-4 pb-40">
            {currentTab === 'inventory' && <Dashboard inventory={data.inventory.filter(i=>i.warehouseId === activeId)} laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)} harvests={data.harvests.filter(h=>h.warehouseId === activeId)} movements={data.movements.filter(m=>m.warehouseId === activeId)} onAddMovement={(i, t) => setMovementModal({item:i, type:t})} onDelete={(id) => requestSecureAction(() => { const item = data.inventory.find(i => i.id === id); if (item) setDeleteItem(item); })} onViewHistory={(item) => setHistoryItem(item)} onViewGlobalHistory={() => setShowGlobalHistory(true)} isAdmin={true} />}
            {currentTab === 'labor' && <LaborView laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)} personnel={data.personnel.filter(p=>p.warehouseId === activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId === activeId)} activities={data.activities.filter(a=>a.warehouseId === activeId)} onAddLabor={()=>showNotification("Vaya a 'Programar' para registrar labores con rendimiento técnico.", "error")} onDeleteLabor={(id) => setData(prev=>({...prev, laborLogs: prev.laborLogs.filter(l=>l.id!==id)}))} isAdmin={true} onOpenPayroll={()=>setShowPayroll(true)} />}
            {currentTab === 'scheduler' && <LaborSchedulerView plannedLabors={data.plannedLabors ? data.plannedLabors.filter(l=>l.warehouseId===activeId) : []} costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} activities={data.activities.filter(a=>a.warehouseId===activeId)} personnel={data.personnel.filter(p=>p.warehouseId===activeId)} onAddPlannedLabor={handleAddPlannedLabor} onDeletePlannedLabor={(id) => setData(prev=>({...prev, plannedLabors: prev.plannedLabors.filter(l=>l.id!==id)}))} onToggleComplete={(id)=>setData(prev=>({...prev, plannedLabors: prev.plannedLabors.map(l=>l.id===id?{...l, completed:!l.completed}:l)}))} budgets={data.budgets || []} laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)} laborFactor={data.laborFactor} />}
            {currentTab === 'harvest' && <HarvestView harvests={data.harvests.filter(h=>h.warehouseId === activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId === activeId)} onAddHarvest={(h)=>setData(prev=>({...prev, harvests: [...prev.harvests, {...h, id: generateId(), warehouseId: activeId}]}))} onDeleteHarvest={(id) => setData(prev=>({...prev, harvests: prev.harvests.filter(h=>h.id !== id)}))} isAdmin={true} allMovements={data.movements} />}
            {currentTab === 'simulator' && <SimulatorView />} 
            {currentTab === 'management' && <ManagementView machines={data.machines.filter(m=>m.warehouseId===activeId)} maintenanceLogs={data.maintenanceLogs.filter(m=>m.warehouseId===activeId)} rainLogs={data.rainLogs.filter(r=>r.warehouseId===activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} personnel={data.personnel.filter(p=>p.warehouseId===activeId)} activities={data.activities.filter(a=>a.warehouseId===activeId)} soilAnalyses={data.soilAnalyses.filter(s=>s.warehouseId===activeId)} ppeLogs={data.ppeLogs.filter(p=>p.warehouseId===activeId)} wasteLogs={data.wasteLogs.filter(w=>w.warehouseId===activeId)} assets={data.assets.filter(a=>a.warehouseId===activeId)} bpaChecklist={data.bpaChecklist} phenologyLogs={data.phenologyLogs.filter(l=>l.warehouseId===activeId)} pestLogs={data.pestLogs.filter(l=>l.warehouseId===activeId)} onAddMachine={(m) => setData(prev=>({...prev, machines: [...prev.machines, {...m, id: generateId(), warehouseId: activeId}]}))} onUpdateMachine={(m) => setData(prev=>({...prev, machines: prev.machines.map(x=>x.id===m.id?m:x)}))} onAddMaintenance={(m) => setData(prev=>({...prev, maintenanceLogs: [...prev.maintenanceLogs, {...m, id: generateId(), warehouseId: activeId}]}))} onDeleteMachine={(id) => setData(prev=>({...prev, machines: prev.machines.filter(m=>m.id!==id)}))} onAddRain={(r) => setData(prev=>({...prev, rainLogs: [...prev.rainLogs, {...r, id: generateId(), warehouseId: activeId}]}))} onDeleteRain={(id) => setData(prev=>({...prev, rainLogs: prev.rainLogs.filter(r=>r.id!==id)}))} onAddSoilAnalysis={(s) => setData(prev=>({...prev, soilAnalyses: [...prev.soilAnalyses, {...s, id: generateId(), warehouseId: activeId}]}))} onDeleteSoilAnalysis={(id) => setData(prev=>({...prev, soilAnalyses: prev.soilAnalyses.filter(s=>s.id!==id)}))} onAddPPE={(p) => setData(prev=>({...prev, ppeLogs: [...prev.ppeLogs, {...p, id: generateId(), warehouseId: activeId}]}))} onDeletePPE={(id) => setData(prev=>({...prev, ppeLogs: prev.ppeLogs.filter(p=>p.id!==id)}))} onAddWaste={(w) => setData(prev=>({...prev, wasteLogs: [...prev.wasteLogs, {...w, id: generateId(), warehouseId: activeId}]}))} onDeleteWaste={(id) => setData(prev=>({...prev, wasteLogs: prev.wasteLogs.filter(w=>w.id!==id)}))} onAddAsset={(a) => setData(prev=>({...prev, assets: [...prev.assets, {...a, id: generateId(), warehouseId: activeId}]}))} onDeleteAsset={(id) => setData(prev=>({...prev, assets: prev.assets.filter(a=>a.id!==id)}))} onToggleBpa={(code) => setData(prev=>({...prev, bpaChecklist: {...prev.bpaChecklist, [code]: !prev.bpaChecklist[code]}}))} onAddPhenologyLog={(log) => setData(prev=>({...prev, phenologyLogs: [...prev.phenologyLogs, {...log, id: generateId(), warehouseId: activeId}]}))} onDeletePhenologyLog={(id) => setData(prev=>({...prev, phenologyLogs: prev.phenologyLogs.filter(l=>l.id!==id)}))} onAddPestLog={(log) => setData(prev=>({...prev, pestLogs: [...prev.pestLogs, {...log, id: generateId(), warehouseId: activeId}]}))} onDeletePestLog={(id) => setData(prev=>({...prev, pestLogs: prev.pestLogs.filter(l=>l.id!==id)}))} isAdmin={true} />}
            {currentTab === 'assets' && <BiologicalAssetsView costCenters={data.costCenters.filter(c=>c.warehouseId === activeId)} movements={data.movements.filter(m=>m.warehouseId === activeId)} laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)} laborFactor={data.laborFactor} onUpdateLot={handleUpdateCostCenter} />}
            {currentTab === 'budget' && <BudgetView budgets={data.budgets || []} costCenters={data.costCenters.filter(c=>c.warehouseId === activeId)} activities={data.activities.filter(a=>a.warehouseId === activeId)} inventory={data.inventory.filter(i=>i.warehouseId === activeId)} warehouseId={activeId} onSaveBudget={handleSaveBudget} laborLogs={data.laborLogs.filter(l=>l.warehouseId === activeId)} movements={data.movements.filter(m=>m.warehouseId === activeId)} laborFactor={data.laborFactor} />}
            {currentTab === 'agenda' && <AgendaView agenda={data.agenda.filter(a => a.warehouseId === activeId)} onAddEvent={(e) => setData(prev => ({ ...prev, agenda: [...prev.agenda, { ...e, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), completed: false }] }))} onToggleEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.map(a => a.id === id ? { ...a, completed: !a.completed } : a) }))} onDeleteEvent={(id) => setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }))} />}
            {currentTab === 'stats' && <StatsView laborFactor={data.laborFactor} movements={data.movements.filter(m=>m.warehouseId===activeId)} suppliers={data.suppliers.filter(s=>s.warehouseId===activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} laborLogs={data.laborLogs.filter(l=>l.warehouseId===activeId)} harvests={data.harvests.filter(h=>h.warehouseId===activeId)} maintenanceLogs={data.maintenanceLogs.filter(m=>m.warehouseId===activeId)} rainLogs={data.rainLogs.filter(r=>r.warehouseId===activeId)} machines={data.machines.filter(m=>m.warehouseId===activeId)} budgets={data.budgets || []} plannedLabors={data.plannedLabors || []} />}
            
            <div className="fixed bottom-6 left-6 flex gap-2 z-30">
                <button onClick={() => setShowExport(true)} className="p-4 bg-slate-800 text-white rounded-3xl shadow-2xl border-2 border-slate-600 active:scale-90 transition-all"><Download className="w-6 h-6" /></button>
            </div>
            {currentTab === 'inventory' && <button onClick={() => setShowAddForm(true)} className="fixed bottom-6 right-6 bg-emerald-600 text-white p-5 rounded-3xl shadow-2xl border-2 border-emerald-400 active:scale-95 transition-all z-30 mr-20 sm:mr-0"><Plus className="w-8 h-8" /></button>}
          </main>
        </>
      )}

      <div className="z-[100] relative">
          {secureAction && <SecurityModal existingPin={data?.adminPin} onSuccess={handlePinSuccess} onClose={() => setSecureAction(null)} />}
          {showManual && <ManualModal onClose={() => setShowManual(false)} />}
          {showData && data && <DataModal fullState={data} onRestoreData={(d) => { setData(d); setShowData(false); }} onClose={() => setShowData(false)} onShowNotification={showNotification} />}
          {/* PASAR FUNCIONES DE INTEGRIDAD REFERENCIAL AL MODAL DE CONFIGURACIÓN */}
          {showSettings && data && <SettingsModal suppliers={data.suppliers.filter(s=>s.warehouseId===activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} personnel={data.personnel.filter(p=>p.warehouseId===activeId)} activities={data.activities.filter(a=>a.warehouseId===activeId)} fullState={data} onUpdateState={(newState) => setData(newState)} onAddSupplier={(n,p,e,a) => setData(prev=>({...prev, suppliers:[...prev.suppliers,{id:generateId(),warehouseId:activeId,name:n,phone:p,email:e,address:a}]}))} onDeleteSupplier={(id) => setData(prev=>({...prev, suppliers: prev.suppliers.filter(s=>s.id!==id)}))} onAddCostCenter={(n,b,a,s,pc,ct,ac) => setData(prev=>({...prev, costCenters:[...prev.costCenters,{id:generateId(),warehouseId:activeId,name:n,budget:b,area:a || 0,stage:s,plantCount:pc, cropType:ct || 'Café',associatedCrop:ac}]}))} onDeleteCostCenter={handleDeleteCostCenter} onAddPersonnel={(p) => setData(prev=>({...prev, personnel:[...prev.personnel,{...p, id:generateId(),warehouseId:activeId}]}))} onDeletePersonnel={handleDeletePersonnel} onAddActivity={(n, cls) => setData(prev=>({...prev, activities:[...prev.activities,{id:generateId(),warehouseId:activeId,name:n,costClassification:cls}]}))} onDeleteActivity={handleDeleteActivity} onClose={() => setShowSettings(false)} />}
          {showPayroll && data && <PayrollModal logs={data.laborLogs.filter(l => l.warehouseId === activeId)} personnel={data.personnel.filter(p => p.warehouseId === activeId)} warehouseName={currentW?.name || ""} laborFactor={data.laborFactor} onMarkAsPaid={(ids) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l) }))} onClose={() => setShowPayroll(false)} />}
          {showAddForm && data && <InventoryForm suppliers={data.suppliers.filter(s=>s.warehouseId===activeId)} onSave={handleSaveNewItem} onCancel={() => setShowAddForm(false)} />}
          {movementModal && data && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={data.suppliers.filter(s=>s.warehouseId===activeId)} costCenters={data.costCenters.filter(c=>c.warehouseId===activeId)} personnel={data.personnel.filter(p=>p.warehouseId===activeId)} onSave={(mov, price, exp) => { const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, mov, price, exp); setData(prev => ({ ...prev, inventory: updatedInventory, movements: [{ ...mov, id: generateId(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost }, ...prev.movements] })); setMovementModal(null); }} onCancel={() => setMovementModal(null)} />}
          {historyItem && data && <HistoryModal item={historyItem} movements={data.movements.filter(m => m.itemId === historyItem.id)} onClose={() => setHistoryItem(null)} />}
          {showGlobalHistory && data && <HistoryModal item={{ name: 'Historial Bodega Global' } as any} movements={data.movements.filter(m => m.warehouseId === activeId)} onClose={() => setShowGlobalHistory(false)} />}
          {deleteItem && <DeleteModal itemName={deleteItem.name} onConfirm={() => handleDeleteItem(deleteItem.id)} onCancel={() => setDeleteItem(null)} />}
          {showWarehouses && data && <WarehouseModal warehouses={data.warehouses} activeId={activeId} onSwitch={(id) => setData(prev=>({...prev, activeWarehouseId: id}))} onCreate={(n) => setData(prev=>({...prev, warehouses: [...prev.warehouses, {id: generateId(), name: n, created: new Date().toISOString(), ownerId: session?.id || 'local_user'}]}))} onDelete={(id) => setData(prev=>({...prev, warehouses: prev.warehouses.filter(w=>w.id!==id)}))} onClose={() => setShowWarehouses(false)} />}
          {showExport && data && <ExportModal onExportPDF={() => generatePDF(data)} onExportExcel={() => generateExcel(data)} onGenerateOrder={() => {alert('Orden generada.')}} onExportLaborPDF={() => generateLaborReport(data)} onExportLaborExcel={() => {alert('Excel nómina generado.')}} onExportHarvestPDF={() => generateHarvestReport(data)} onClose={() => setShowExport(false)} activeData={data} />}
      </div>
    </div>
  );
}

export default App;
