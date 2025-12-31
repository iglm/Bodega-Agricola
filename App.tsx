import React, { useState, useEffect, useCallback } from 'react';
import { AppState, InventoryItem, Movement, Unit, User, Category, PlannedLabor, BudgetPlan, CostCenter } from './types';
import { dbService } from './services/db';
import { loadDataFromLocalStorage, processInventoryMovement, generateId, saveDataToLocalStorage } from './services/inventoryService';
import { getDemoData } from './services/reportService';

import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { InventoryForm } from './components/InventoryForm';
import { MovementModal } from './components/MovementModal';
import { HistoryModal } from './components/HistoryModal';
import { SettingsModal } from './components/SettingsModal';
import { WarehouseModal } from './components/WarehouseModal';
import { ExportModal } from './components/ExportModal';
import { SupportModal } from './components/SupportModal';
import { DeleteModal } from './components/DeleteModal';
import { AuditModal } from './components/AuditModal';
import { ManualModal } from './components/ManualModal';
import { Notification } from './components/Notification';
import { LaborView } from './components/LaborView';
import { LaborForm } from './components/LaborForm';
import { PayrollModal } from './components/PayrollModal';
import { HarvestView } from './components/HarvestView';
import { FinanceView } from './components/FinanceView';
import { ManagementView } from './components/ManagementView';
import { StrategicView } from './components/StrategicView';
import { AgendaView } from './components/AgendaView';
import { DataModal } from './components/DataModal';
import { SecurityModal } from './components/SecurityModal';
import { StatsView } from './components/StatsView';
import { LaborSchedulerView } from './components/LaborSchedulerView';
import { BudgetView } from './components/BudgetView';
import { BiologicalAssetsView } from './components/BiologicalAssetsView';

import { 
  Menu, BarChart3, Package, Users, Sprout, DollarSign, Settings, 
  /* Added FileText import here */
  LogOut, ClipboardList, Target, ShieldCheck, Database, Lock, CalendarRange, Calculator, TreePine,
  Wallet, Warehouse, FileText
} from 'lucide-react';

const App: React.FC = () => {
  const [data, setData] = useState<AppState | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [showNotification, setShowNotification] = useState<{msg: string, type: 'success'|'error'} | null>(null);
  
  // Modals
  const [showInventoryForm, setShowInventoryForm] = useState(false);
  const [showMovementModal, setShowMovementModal] = useState<{ item: InventoryItem, type: 'IN' | 'OUT' } | null>(null);
  const [showHistoryModal, setShowHistoryModal] = useState<InventoryItem | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showWarehouseModal, setShowWarehouseModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState<{ id: string, name: string } | null>(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isSupporter, setIsSupporter] = useState(false); // Mock subscription status

  // --- INITIALIZATION ---
  useEffect(() => {
    const init = async () => {
      try {
        const stored = await dbService.loadState();
        setData(stored);
        
        // Simple auth persistence mock
        const savedUser = localStorage.getItem('df_user');
        if (savedUser) {
            setCurrentUser(JSON.parse(savedUser));
            // Check for security pin
            if (stored.adminPin) {
                setShowSecurityModal(true);
            } else {
                setIsAuthenticated(true);
            }
        }
      } catch (e) {
        console.error("Failed to load", e);
      } finally {
        setIsLoading(false);
      }
    };
    init();
  }, []);

  // --- SAVE STATE ---
  const saveData = useCallback(async (newData: AppState) => {
    setData(newData);
    await dbService.saveState(newData);
  }, []);

  const notify = (msg: string, type: 'success'|'error' = 'success') => {
      setShowNotification({ msg, type });
  };

  // --- HANDLERS ---

  const handleLogin = (user: User) => {
      setCurrentUser(user);
      localStorage.setItem('df_user', JSON.stringify(user));
      if (data?.adminPin) {
          setShowSecurityModal(true);
      } else {
          setIsAuthenticated(true);
      }
  };

  const handleLogout = () => {
      setCurrentUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('df_user');
      setCurrentTab('dashboard');
  };

  const handleSecuritySuccess = (pin: string) => {
      if (!data) return;
      if (!data.adminPin) {
          saveData({ ...data, adminPin: pin });
          notify('PIN de seguridad configurado.', 'success');
      }
      setIsAuthenticated(true);
      setShowSecurityModal(false);
  };

  // Inventory Logic
  const handleAddItem = (itemData: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQty: number, details?: any, initialUnit?: Unit) => {
      if (!data) return;
      const newItem: InventoryItem = {
          ...itemData,
          id: generateId(),
          warehouseId: data.activeWarehouseId,
          baseUnit: 'g', // Logic will adjust based on category in real app, simplified here
          currentQuantity: 0,
          averageCost: 0
      };
      
      // Initial Movement
      let updatedInventory = [...data.inventory, newItem];
      let newMovements = [...data.movements];

      if (initialQty > 0 && initialUnit) {
          const mov: Movement = {
              id: generateId(),
              warehouseId: data.activeWarehouseId,
              itemId: newItem.id,
              itemName: newItem.name,
              type: 'IN',
              quantity: initialQty,
              unit: initialUnit,
              calculatedCost: initialQty * newItem.lastPurchasePrice,
              date: new Date().toISOString(),
              supplierId: details?.supplierId,
              invoiceNumber: details?.invoiceNumber,
              invoiceImage: details?.invoiceImage
          };
          const res = processInventoryMovement(updatedInventory, mov, newItem.lastPurchasePrice);
          updatedInventory = res.updatedInventory;
          newMovements.push(mov);
      }

      saveData({ ...data, inventory: updatedInventory, movements: newMovements });
      setShowInventoryForm(false);
      notify('Producto creado correctamente.');
  };

  const handleAddMovement = (movData: Omit<Movement, 'id' | 'date' | 'warehouseId'>, newPrice?: number, newExp?: string) => {
      if (!data) return;
      const movement: Movement = {
          ...movData,
          id: generateId(),
          date: new Date().toISOString(),
          warehouseId: data.activeWarehouseId
      };
      
      const res = processInventoryMovement(data.inventory, movement, newPrice, newExp);
      
      saveData({
          ...data,
          inventory: res.updatedInventory,
          movements: [...data.movements, movement]
      });
      setShowMovementModal(null);
      notify('Movimiento registrado.');
  };

  const handleDeleteItem = () => {
      if (!data || !showDeleteModal) return;
      const updatedInventory = data.inventory.filter(i => i.id !== showDeleteModal.id);
      saveData({ ...data, inventory: updatedInventory });
      setShowDeleteModal(null);
      notify('Producto eliminado.');
  };

  // Labor Logic
  const handleAddLabor = (logData: Omit<typeof data.laborLogs[0], 'id' | 'warehouseId' | 'paid'>) => {
      if (!data) return;
      const newLog = {
          ...logData,
          id: generateId(),
          warehouseId: data.activeWarehouseId,
          paid: false
      };
      saveData({ ...data, laborLogs: [...data.laborLogs, newLog] });
      setShowLaborForm(false);
      notify('Jornal registrado.');
  };

  const handleMarkPaid = (ids: string[]) => {
      if (!data) return;
      const updatedLogs = data.laborLogs.map(l => ids.includes(l.id) ? { ...l, paid: true } : l);
      saveData({ ...data, laborLogs: updatedLogs });
      setShowPayrollModal(false);
      notify('Pago registrado correctamente.');
  };

  // Generic Handlers
  const activeId = data?.activeWarehouseId || '';
  
  if (isLoading) return <div className="h-screen w-screen bg-slate-950 flex items-center justify-center text-emerald-500 font-black animate-pulse">CARGANDO SISTEMA...</div>;

  if (!isAuthenticated || !currentUser) {
      return (
        <Landing 
            onEnter={handleLogin} 
            onShowManual={() => setShowManualModal(true)} 
            onRestoreBackup={() => { /* Handled in DataModal usually, but for landing we can show a prompt or simplified modal */ 
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e: any) => {
                    const file = e.target.files[0];
                    if(file){
                        const reader = new FileReader();
                        reader.onload = (ev) => {
                            try {
                                const parsed = JSON.parse(ev.target?.result as string);
                                saveData(parsed);
                                setIsAuthenticated(true);
                                setCurrentUser({ id: 'restored', name: 'Usuario Restaurado', email: 'backup@local' });
                            } catch(err) { alert("Archivo corrupto"); }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            }}
            onLoadDemoData={() => {
                const demo = getDemoData();
                saveData(demo);
                setCurrentUser({ id: 'demo', name: 'Usuario Demo', email: 'demo@datosfinca.com' });
                setIsAuthenticated(true);
            }}
        />
      );
  }

  if (!data) return null;

  // Filtered Data for Active Warehouse
  const activeInventory = data.inventory.filter(i => i.warehouseId === activeId);
  const activeMovements = data.movements.filter(m => m.warehouseId === activeId);
  const activeLabor = data.laborLogs.filter(l => l.warehouseId === activeId);
  const activeHarvests = data.harvests.filter(h => h.warehouseId === activeId);
  const activeFinance = data.financeLogs.filter(f => f.warehouseId === activeId);
  const activeAgenda = data.agenda.filter(a => a.warehouseId === activeId);
  
  const activeSuppliers = data.suppliers.filter(s => s.warehouseId === activeId);
  const activeCostCenters = data.costCenters.filter(c => c.warehouseId === activeId);
  const activePersonnel = data.personnel.filter(p => p.warehouseId === activeId);
  const activeActivities = data.activities.filter(a => a.warehouseId === activeId);
  const activeMachines = data.machines.filter(m => m.warehouseId === activeId);
  const activeBudgets = data.budgets?.filter(b => b.warehouseId === activeId) || [];

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden font-sans">
      
      {/* Sidebar Desktop */}
      <div className={`hidden md:flex flex-col w-64 bg-slate-900 border-r border-slate-800 transition-all z-20`}>
          <div className="p-6 border-b border-slate-800 flex items-center gap-3">
              <div className="bg-emerald-600 p-2 rounded-xl">
                  <Sprout className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-white font-black text-lg tracking-tight">DatosFinca <span className="text-emerald-400">Viva</span></h1>
          </div>
          
          <div className="flex-1 overflow-y-auto py-4 space-y-1 custom-scrollbar">
              {[
                  { id: 'dashboard', icon: BarChart3, label: 'Resumen' },
                  { id: 'inventory', icon: Package, label: 'Bodega' },
                  { id: 'field', icon: Users, label: 'Campo & Nómina' },
                  { id: 'scheduler', icon: CalendarRange, label: 'Planificador', badge: data.plannedLabors.filter(l => !l.completed && l.warehouseId === activeId).length },
                  { id: 'harvest', icon: Target, label: 'Cosecha' },
                  { id: 'strategic', icon: Calculator, label: 'Estrategia' },
                  { id: 'budgets', icon: DollarSign, label: 'Presupuesto' },
                  { id: 'management', icon: Settings, label: 'Gestión Técnica' },
                  { id: 'bioassets', icon: TreePine, label: 'Activos Biológicos' },
                  { id: 'finance', icon: Wallet, label: 'Finanzas Admin' },
              ].map(item => (
                  <button 
                    key={item.id}
                    onClick={() => setCurrentTab(item.id)}
                    className={`w-full px-6 py-3 flex items-center justify-between text-sm font-bold transition-all border-r-4 ${currentTab === item.id ? 'bg-slate-800 text-emerald-400 border-emerald-500' : 'text-slate-400 border-transparent hover:text-white hover:bg-slate-800/50'}`}
                  >
                      <div className="flex items-center gap-3">
                          <item.icon className="w-5 h-5" />
                          {item.label}
                      </div>
                      {item.badge ? <span className="bg-emerald-600 text-white text-[10px] px-2 py-0.5 rounded-full">{item.badge}</span> : null}
                  </button>
              ))}
          </div>

          <div className="p-4 border-t border-slate-800 space-y-2">
              <button onClick={() => setShowDataModal(true)} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors">
                  <Database className="w-4 h-4" /> Datos & Backup
              </button>
              <button onClick={handleLogout} className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold text-red-400 hover:text-red-300 rounded-xl hover:bg-red-900/20 transition-colors">
                  <LogOut className="w-4 h-4" /> Cerrar Sesión
              </button>
          </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          
          {/* Header Mobile/Desktop */}
          <div className="bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 p-4 flex justify-between items-center z-10 shadow-sm">
              <div className="flex items-center gap-3">
                  <button className="md:hidden p-2 text-slate-500" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
                      <Menu className="w-6 h-6" />
                  </button>
                  <h2 className="text-xl font-black text-slate-800 dark:text-white uppercase tracking-tight truncate">
                      {currentTab === 'dashboard' ? 'Tablero Principal' : 
                       currentTab === 'inventory' ? 'Bodega de Insumos' : 
                       currentTab === 'field' ? 'Gestión de Campo' : 
                       currentTab === 'scheduler' ? 'Programación' :
                       currentTab === 'harvest' ? 'Producción' :
                       currentTab === 'strategic' ? 'Inteligencia' :
                       currentTab === 'budgets' ? 'Presupuesto' :
                       currentTab === 'bioassets' ? 'Activos Biológicos' :
                       currentTab === 'management' ? 'Gestión Técnica' : 'Finanzas'}
                  </h2>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={() => setShowWarehouseModal(true)} className="flex items-center gap-2 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-emerald-500 transition-colors">
                      <Warehouse className="w-4 h-4 text-emerald-500" />
                      <span className="hidden sm:inline">{data.warehouses.find(w => w.id === activeId)?.name}</span>
                  </button>
                  <button onClick={() => setShowExportModal(true)} className="p-2 bg-emerald-600 text-white rounded-xl shadow-lg hover:bg-emerald-500 active:scale-95 transition-all">
                      <FileText className="w-5 h-5" />
                  </button>
                  <button onClick={() => setShowSettingsModal(true)} className="p-2 bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-300 dark:hover:bg-slate-700 transition-all">
                      <Settings className="w-5 h-5" />
                  </button>
              </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-4 md:p-6 custom-scrollbar bg-slate-50 dark:bg-slate-950 pb-24">
              
              {currentTab === 'dashboard' && (
                  <div className="space-y-6">
                      <StatsView 
                          laborFactor={data.laborFactor}
                          movements={activeMovements}
                          suppliers={activeSuppliers}
                          costCenters={activeCostCenters}
                          laborLogs={activeLabor}
                          harvests={activeHarvests}
                          financeLogs={activeFinance}
                          budgets={activeBudgets}
                      />
                      <Dashboard 
                          inventory={activeInventory}
                          harvests={activeHarvests}
                          laborLogs={activeLabor}
                          movements={activeMovements}
                          financeLogs={activeFinance}
                          onAddMovement={(item, type) => setShowMovementModal({ item, type })}
                          onDelete={(id) => setShowDeleteModal({ id, name: 'Producto' })}
                          onViewHistory={(item) => setShowHistoryModal(item)}
                          isAdmin={true}
                      />
                  </div>
              )}

              {currentTab === 'inventory' && (
                  <>
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="font-black text-slate-500 uppercase text-sm tracking-widest">Existencias</h3>
                          <div className="flex gap-2">
                              <button onClick={() => setShowAuditModal(true)} className="bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2">
                                  <ClipboardList className="w-4 h-4" /> Auditoría
                              </button>
                              <button onClick={() => setShowInventoryForm(true)} className="bg-emerald-600 text-white px-4 py-2 rounded-xl text-xs font-black uppercase flex items-center gap-2 shadow-lg shadow-emerald-900/20">
                                  <Package className="w-4 h-4" /> Nuevo Insumo
                              </button>
                          </div>
                      </div>
                      <Dashboard 
                          inventory={activeInventory} 
                          harvests={[]} laborLogs={[]} movements={[]} financeLogs={[]}
                          onAddMovement={(item, type) => setShowMovementModal({ item, type })}
                          onDelete={(id) => { const item = activeInventory.find(i => i.id === id); if(item) setShowDeleteModal({id, name: item.name}); }}
                          onViewHistory={(item) => setShowHistoryModal(item)}
                          isAdmin={true}
                      />
                  </>
              )}

              {currentTab === 'field' && (
                  <div className="space-y-6">
                      <AgendaView 
                          agenda={activeAgenda} 
                          onAddEvent={(e) => saveData({...data, agenda: [...data.agenda, { id: generateId(), warehouseId: activeId, date: new Date().toISOString(), title: e.title, completed: false }]})}
                          onToggleEvent={(id) => saveData({...data, agenda: data.agenda.map(a => a.id === id ? {...a, completed: !a.completed} : a)})}
                          onDeleteEvent={(id) => saveData({...data, agenda: data.agenda.filter(a => a.id !== id)})}
                      />
                      <LaborView 
                          laborLogs={activeLabor} 
                          personnel={activePersonnel} 
                          costCenters={activeCostCenters} 
                          activities={activeActivities}
                          onAddLabor={() => setShowLaborForm(true)}
                          onDeleteLabor={(id) => saveData({...data, laborLogs: data.laborLogs.filter(l => l.id !== id)})}
                          isAdmin={true}
                          onOpenPayroll={() => setShowPayrollModal(true)}
                      />
                  </div>
              )}

              {currentTab === 'scheduler' && (
                  <LaborSchedulerView 
                      plannedLabors={data.plannedLabors.filter(l => l.warehouseId === activeId)}
                      costCenters={activeCostCenters}
                      activities={activeActivities}
                      onAddPlannedLabor={(labor) => saveData({ ...data, plannedLabors: [...data.plannedLabors, { ...labor, id: generateId(), warehouseId: activeId, completed: false }] })}
                      onDeletePlannedLabor={(id) => saveData({ ...data, plannedLabors: data.plannedLabors.filter(l => l.id !== id) })}
                      onToggleComplete={(id) => saveData({ ...data, plannedLabors: data.plannedLabors.map(l => l.id === id ? { ...l, completed: !l.completed } : l) })}
                      budgets={activeBudgets}
                      laborLogs={activeLabor}
                      personnel={activePersonnel}
                      laborFactor={data.laborFactor}
                  />
              )}

              {currentTab === 'harvest' && (
                  <HarvestView 
                      harvests={activeHarvests}
                      costCenters={activeCostCenters}
                      onAddHarvest={(h) => saveData({...data, harvests: [...data.harvests, { ...h, id: generateId(), warehouseId: activeId }]})}
                      onDeleteHarvest={(id) => saveData({...data, harvests: data.harvests.filter(h => h.id !== id)})}
                      isAdmin={true}
                      allMovements={activeMovements}
                  />
              )}

              {currentTab === 'finance' && (
                  <FinanceView 
                      financeLogs={activeFinance}
                      onAddTransaction={(t) => saveData({...data, financeLogs: [...data.financeLogs, { ...t, id: generateId(), warehouseId: activeId }]})}
                      onDeleteTransaction={(id) => saveData({...data, financeLogs: data.financeLogs.filter(f => f.id !== id)})}
                  />
              )}

              {currentTab === 'management' && (
                  <ManagementView 
                      machines={activeMachines}
                      maintenanceLogs={data.maintenanceLogs.filter(m => m.warehouseId === activeId)}
                      rainLogs={data.rainLogs.filter(r => r.warehouseId === activeId)}
                      costCenters={activeCostCenters}
                      personnel={activePersonnel}
                      activities={activeActivities}
                      soilAnalyses={data.soilAnalyses.filter(s => s.warehouseId === activeId)}
                      ppeLogs={data.ppeLogs.filter(p => p.warehouseId === activeId)}
                      wasteLogs={data.wasteLogs.filter(w => w.warehouseId === activeId)}
                      assets={data.assets.filter(a => a.warehouseId === activeId)}
                      bpaChecklist={data.bpaChecklist || {}}
                      phenologyLogs={data.phenologyLogs.filter(p => p.warehouseId === activeId)}
                      pestLogs={data.pestLogs.filter(p => p.warehouseId === activeId)}
                      onAddMachine={(m) => saveData({...data, machines: [...data.machines, { ...m, id: generateId(), warehouseId: activeId }]})}
                      onUpdateMachine={(m) => saveData({...data, machines: data.machines.map(mac => mac.id === m.id ? m : mac)})}
                      onDeleteMachine={(id) => saveData({...data, machines: data.machines.filter(m => m.id !== id)})}
                      onAddMaintenance={(m) => saveData({...data, maintenanceLogs: [...data.maintenanceLogs, { ...m, id: generateId(), warehouseId: activeId }]})}
                      onAddRain={(r) => saveData({...data, rainLogs: [...data.rainLogs, { ...r, id: generateId(), warehouseId: activeId }]})}
                      onDeleteRain={(id) => saveData({...data, rainLogs: data.rainLogs.filter(r => r.id !== id)})}
                      onAddSoilAnalysis={(s) => saveData({...data, soilAnalyses: [...data.soilAnalyses, { ...s, id: generateId(), warehouseId: activeId }]})}
                      onDeleteSoilAnalysis={(id) => saveData({...data, soilAnalyses: data.soilAnalyses.filter(s => s.id !== id)})}
                      onAddPPE={(p) => saveData({...data, ppeLogs: [...data.ppeLogs, { ...p, id: generateId(), warehouseId: activeId }]})}
                      onDeletePPE={(id) => saveData({...data, ppeLogs: data.ppeLogs.filter(p => p.id !== id)})}
                      onAddWaste={(w) => saveData({...data, wasteLogs: [...data.wasteLogs, { ...w, id: generateId(), warehouseId: activeId }]})}
                      onDeleteWaste={(id) => saveData({...data, wasteLogs: data.wasteLogs.filter(w => w.id !== id)})}
                      onAddAsset={(a) => saveData({...data, assets: [...data.assets, { ...a, id: generateId(), warehouseId: activeId }]})}
                      onDeleteAsset={(id) => saveData({...data, assets: data.assets.filter(a => a.id !== id)})}
                      onToggleBpa={(code) => saveData({...data, bpaChecklist: { ...data.bpaChecklist, [code]: !data.bpaChecklist[code] }})}
                      onAddPhenologyLog={(log) => saveData({...data, phenologyLogs: [...data.phenologyLogs, { ...log, id: generateId(), warehouseId: activeId }]})}
                      onDeletePhenologyLog={(id) => saveData({...data, phenologyLogs: data.phenologyLogs.filter(l => l.id !== id)})}
                      onAddPestLog={(log) => saveData({...data, pestLogs: [...data.pestLogs, { ...log, id: generateId(), warehouseId: activeId }]})}
                      onDeletePestLog={(id) => saveData({...data, pestLogs: data.pestLogs.filter(l => l.id !== id)})}
                      isAdmin={true}
                  />
              )}

              {currentTab === 'strategic' && (
                  <StrategicView 
                      data={data}
                      onUpdateSWOT={(swot) => saveData({...data, swot})}
                  />
              )}

              {currentTab === 'budgets' && (
                  <BudgetView 
                      budgets={data.budgets || []}
                      costCenters={activeCostCenters}
                      activities={activeActivities}
                      inventory={activeInventory}
                      warehouseId={activeId}
                      onSaveBudget={(budget) => {
                          const existing = data.budgets?.findIndex(b => b.id === budget.id);
                          let newBudgets = data.budgets ? [...data.budgets] : [];
                          if (existing !== undefined && existing !== -1) {
                              newBudgets[existing] = budget;
                          } else {
                              newBudgets.push(budget);
                          }
                          saveData({ ...data, budgets: newBudgets });
                      }}
                      laborLogs={activeLabor}
                      movements={activeMovements}
                      laborFactor={data.laborFactor}
                  />
              )}

              {currentTab === 'bioassets' && (
                  <BiologicalAssetsView 
                      costCenters={activeCostCenters}
                      movements={activeMovements}
                      laborLogs={activeLabor}
                      laborFactor={data.laborFactor}
                      onUpdateLot={(updatedLot) => {
                          saveData({
                              ...data,
                              costCenters: data.costCenters.map(c => c.id === updatedLot.id ? updatedLot : c)
                          });
                      }}
                  />
              )}

          </div>

          {/* Mobile Bottom Nav */}
          <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 p-2 flex justify-around z-20">
              <button onClick={() => setCurrentTab('dashboard')} className={`p-2 rounded-xl ${currentTab === 'dashboard' ? 'text-emerald-500' : 'text-slate-400'}`}><BarChart3 className="w-6 h-6"/></button>
              <button onClick={() => setCurrentTab('inventory')} className={`p-2 rounded-xl ${currentTab === 'inventory' ? 'text-emerald-500' : 'text-slate-400'}`}><Package className="w-6 h-6"/></button>
              <button onClick={() => setCurrentTab('field')} className={`p-2 rounded-xl ${currentTab === 'field' ? 'text-emerald-500' : 'text-slate-400'}`}><Users className="w-6 h-6"/></button>
              <button onClick={() => setCurrentTab('harvest')} className={`p-2 rounded-xl ${currentTab === 'harvest' ? 'text-emerald-500' : 'text-slate-400'}`}><Target className="w-6 h-6"/></button>
              <button onClick={() => setIsSidebarOpen(true)} className="p-2 rounded-xl text-slate-400"><Menu className="w-6 h-6"/></button>
          </div>

          {/* Mobile Sidebar */}
          {isSidebarOpen && (
              <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}>
                  <div className="absolute top-0 bottom-0 left-0 w-64 bg-slate-900 p-4" onClick={e => e.stopPropagation()}>
                      <div className="mb-6 flex items-center gap-3">
                          <Sprout className="w-8 h-8 text-emerald-500" />
                          <h2 className="text-white font-black text-xl">Menú</h2>
                      </div>
                      <div className="space-y-2">
                          {[
                              { id: 'dashboard', icon: BarChart3, label: 'Resumen' },
                              { id: 'inventory', icon: Package, label: 'Bodega' },
                              { id: 'field', icon: Users, label: 'Campo' },
                              { id: 'scheduler', icon: CalendarRange, label: 'Planificador' },
                              { id: 'harvest', icon: Target, label: 'Cosecha' },
                              { id: 'strategic', icon: Calculator, label: 'Estrategia' },
                              { id: 'budgets', icon: DollarSign, label: 'Presupuesto' },
                              { id: 'management', icon: Settings, label: 'Gestión' },
                              { id: 'finance', icon: Wallet, label: 'Finanzas' },
                          ].map(item => (
                              <button 
                                key={item.id}
                                onClick={() => { setCurrentTab(item.id); setIsSidebarOpen(false); }}
                                className="w-full flex items-center gap-3 text-slate-400 p-3 hover:text-white hover:bg-slate-800 rounded-xl"
                              >
                                  <item.icon className="w-5 h-5" /> {item.label}
                              </button>
                          ))}
                          <div className="h-px bg-slate-800 my-2"></div>
                          <button onClick={() => { setShowDataModal(true); setIsSidebarOpen(false); }} className="w-full flex items-center gap-3 text-slate-400 p-3 hover:text-white"><Database className="w-5 h-5"/> Datos</button>
                          <button onClick={handleLogout} className="w-full flex items-center gap-3 text-red-400 p-3 hover:bg-red-900/20 rounded-xl"><LogOut className="w-5 h-5"/> Salir</button>
                      </div>
                  </div>
              </div>
          )}

          {/* Modals */}
          {showInventoryForm && (
              <InventoryForm 
                  suppliers={activeSuppliers}
                  onSave={handleAddItem}
                  onCancel={() => setShowInventoryForm(false)}
              />
          )}
          
          {showMovementModal && (
              <MovementModal 
                  item={showMovementModal.item}
                  type={showMovementModal.type}
                  suppliers={activeSuppliers}
                  costCenters={activeCostCenters}
                  personnel={activePersonnel}
                  machines={activeMachines}
                  movements={activeMovements}
                  allSoilAnalyses={data.soilAnalyses}
                  onSave={(m, p, e) => handleAddMovement(m, p, e)}
                  onCancel={() => setShowMovementModal(null)}
              />
          )}

          {showHistoryModal && (
              <HistoryModal 
                  item={showHistoryModal}
                  movements={activeMovements.filter(m => m.itemId === showHistoryModal.id)}
                  onClose={() => setShowHistoryModal(null)}
              />
          )}

          {showWarehouseModal && (
              <WarehouseModal 
                  warehouses={data.warehouses}
                  activeId={activeId}
                  onSwitch={(id) => saveData({ ...data, activeWarehouseId: id })}
                  onCreate={(name) => {
                      const newId = generateId();
                      saveData({ ...data, warehouses: [...data.warehouses, { id: newId, name, created: new Date().toISOString(), ownerId: currentUser.id }], activeWarehouseId: newId });
                  }}
                  onDelete={(id) => {
                      // Cascading delete
                      const newWarehouses = data.warehouses.filter(w => w.id !== id);
                      saveData({
                          ...data,
                          warehouses: newWarehouses,
                          activeWarehouseId: newWarehouses[0].id,
                          inventory: data.inventory.filter(i => i.warehouseId !== id),
                          movements: data.movements.filter(m => m.warehouseId !== id),
                          laborLogs: data.laborLogs.filter(l => l.warehouseId !== id),
                          harvests: data.harvests.filter(h => h.warehouseId !== id),
                          costCenters: data.costCenters.filter(c => c.warehouseId !== id),
                          personnel: data.personnel.filter(p => p.warehouseId !== id),
                          // ... delete other related data
                      });
                  }}
                  onClose={() => setShowWarehouseModal(false)}
              />
          )}

          {showSettingsModal && (
              <SettingsModal 
                  suppliers={activeSuppliers}
                  costCenters={activeCostCenters}
                  personnel={activePersonnel}
                  activities={activeActivities}
                  fullState={data}
                  onUpdateState={saveData}
                  onAddSupplier={(name, phone, email, address) => saveData({ ...data, suppliers: [...data.suppliers, { id: generateId(), warehouseId: activeId, name, phone, email, address }] })}
                  onDeleteSupplier={(id) => saveData({ ...data, suppliers: data.suppliers.filter(s => s.id !== id) })}
                  onAddCostCenter={(name, budget, area, stage, plantCount, cropType, associatedCrop) => saveData({ ...data, costCenters: [...data.costCenters, { id: generateId(), warehouseId: activeId, name, budget, area: area || 0, stage: stage || 'Produccion', plantCount, cropType: cropType || 'Café', associatedCrop }] })}
                  onDeleteCostCenter={(id) => saveData({ ...data, costCenters: data.costCenters.filter(c => c.id !== id) })}
                  onAddPersonnel={(p) => saveData({ ...data, personnel: [...data.personnel, { ...p, id: generateId(), warehouseId: activeId }] })}
                  onDeletePersonnel={(id) => saveData({ ...data, personnel: data.personnel.filter(p => p.id !== id) })}
                  onAddActivity={(name, classification) => saveData({ ...data, activities: [...data.activities, { id: generateId(), warehouseId: activeId, name, costClassification: classification }] })}
                  onDeleteActivity={(id) => saveData({ ...data, activities: data.activities.filter(a => a.id !== id) })}
                  onClose={() => setShowSettingsModal(false)}
              />
          )}

          {showExportModal && (
              <ExportModal 
                  onClose={() => setShowExportModal(false)}
                  onExportPDF={() => { /* Logic integrated in modal or separate */ }}
                  onExportExcel={() => { /* Logic */ }}
                  onGenerateOrder={() => { /* Logic */ }}
                  onExportLaborPDF={() => { /* Logic */ }}
                  onExportLaborExcel={() => { /* Logic */ }}
                  activeData={data}
                  onShowSupport={() => setShowSupportModal(true)}
                  isSupporter={isSupporter}
              />
          )}

          {showSupportModal && (
              <SupportModal 
                  onClose={() => setShowSupportModal(false)}
                  onUpgrade={() => { setIsSupporter(true); notify('¡Gracias por tu apoyo!', 'success'); }}
                  isSupporter={isSupporter}
              />
          )}

          {showDeleteModal && (
              <DeleteModal 
                  itemName={showDeleteModal.name}
                  onConfirm={handleDeleteItem}
                  onCancel={() => setShowDeleteModal(null)}
              />
          )}

          {showAuditModal && (
              <AuditModal 
                  inventory={activeInventory}
                  onAdjust={(item, realQty, notes) => {
                      const diff = realQty - item.currentQuantity;
                      if (diff !== 0) {
                          const mov: Movement = {
                              id: generateId(),
                              warehouseId: activeId,
                              itemId: item.id,
                              itemName: item.name,
                              type: diff > 0 ? 'IN' : 'OUT',
                              quantity: Math.abs(diff),
                              unit: item.baseUnit === 'unit' ? Unit.UNIDAD : item.baseUnit === 'g' ? Unit.GRAMO : Unit.MILILITRO, // Adjusted base
                              calculatedCost: Math.abs(diff) * item.averageCost,
                              date: new Date().toISOString(),
                              notes: notes,
                              outputCode: 'AUDIT-ADJ'
                          };
                          const res = processInventoryMovement(data.inventory, mov);
                          saveData({ ...data, inventory: res.updatedInventory, movements: [...data.movements, mov] });
                          notify('Inventario ajustado.');
                      }
                  }}
                  onClose={() => setShowAuditModal(false)}
              />
          )}

          {showManualModal && <ManualModal onClose={() => setShowManualModal(false)} />}

          {showLaborForm && (
              <LaborForm 
                  personnel={activePersonnel}
                  costCenters={activeCostCenters}
                  activities={activeActivities}
                  onSave={handleAddLabor}
                  onCancel={() => setShowLaborForm(false)}
                  onOpenSettings={() => { setShowLaborForm(false); setShowSettingsModal(true); }}
              />
          )}

          {showPayrollModal && (
              <PayrollModal 
                  logs={activeLabor}
                  personnel={activePersonnel}
                  onMarkAsPaid={handleMarkPaid}
                  onClose={() => setShowPayrollModal(false)}
                  warehouseName={data.warehouses.find(w => w.id === activeId)?.name || ''}
                  laborFactor={data.laborFactor}
              />
          )}

          {showDataModal && (
              <DataModal 
                  fullState={data}
                  onRestoreData={(d) => { saveData(d); }}
                  onClose={() => setShowDataModal(false)}
                  onShowNotification={(msg, type) => notify(msg, type)}
              />
          )}

          {showSecurityModal && (
              <SecurityModal 
                  existingPin={data.adminPin}
                  onSuccess={(pin) => handleSecuritySuccess(pin)}
                  onClose={() => { if (!isAuthenticated) handleLogout(); else setShowSecurityModal(false); }}
              />
          )}

          {showNotification && (
              <Notification 
                  message={showNotification.msg} 
                  type={showNotification.type} 
                  onClose={() => setShowNotification(null)} 
              />
          )}

      </div>
    </div>
  );
};

export default App;