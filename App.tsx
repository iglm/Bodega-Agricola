
/**
 * AgroSuite 360 - Sistema de Gestión Agrícola Integral
 * 
 * @author Lucas Mateo Tabares Franco
 * @copyright 2025 Lucas Mateo Tabares Franco. Todos los derechos reservados.
 */

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Landing } from './components/Landing';
import { Dashboard } from './components/Dashboard';
import { StatsView } from './components/StatsView';
import { InventoryForm } from './components/InventoryForm';
import { MovementModal } from './components/MovementModal';
import { SupportModal } from './components/SupportModal';
import { ExportModal } from './components/ExportModal';
import { HistoryModal } from './components/HistoryModal';
import { DeleteModal } from './components/DeleteModal';
import { ManualModal } from './components/ManualModal';
import { WarehouseModal } from './components/WarehouseModal';
import { SettingsModal } from './components/SettingsModal';
import { AuditModal } from './components/AuditModal';
import { DataModal } from './components/DataModal';
import { LaborView } from './components/LaborView'; 
import { LaborForm } from './components/LaborForm'; 
import { HarvestView } from './components/HarvestView'; 
import { ManagementView } from './components/ManagementView'; 
import { FinanceView } from './components/FinanceView'; 
import { PayrollModal } from './components/PayrollModal';
import { AIAssistant } from './components/AIAssistant';

import { AppState, InventoryItem, Movement, Unit, Warehouse, Supplier, CostCenter, Personnel, Activity, LaborLog, HarvestLog, AgendaEvent, Machine, MaintenanceLog, RainLog, FinanceLog, User } from './types';
import { loadData, saveData, saveDataNow, convertToBase, getBaseUnitType, calculateCost, calculateWeightedAverageCost, processInventoryMovement } from './services/inventoryService';
import { generateExcel, generatePDF, generateOrderPDF, generateLaborPDF, generateLaborExcel, generateHarvestPDF, generateMachineryPDF } from './services/reportService';
import { ParsedCommand } from './services/aiService';
import { Plus, Download, Gift, Sprout, BookOpen, ChevronDown, Warehouse as WarehouseIcon, Save, Sun, Moon, Settings, BarChart3, Package, Database, ClipboardCheck, Pickaxe, Tractor, HelpCircle, Globe, Landmark, FileSpreadsheet, User as UserIcon, LogOut, Crown, Calendar, CheckCircle, Star, ShieldAlert, Trash2, Mail, ShieldCheck } from 'lucide-react';

function App() {
  const [session, setSession] = useState<User | null>(null);
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState<string>('inventory');
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  
  const [data, setData] = useState<AppState>({ 
    warehouses: [], 
    activeWarehouseId: '', 
    inventory: [], 
    movements: [],
    suppliers: [],
    costCenters: [],
    personnel: [],
    activities: [], 
    laborLogs: [],
    harvests: [], 
    agenda: [],   
    machines: [], 
    maintenanceLogs: [], 
    rainLogs: [],
    financeLogs: [],
    isSupporter: false
  });

  const [isSaving, setIsSaving] = useState(false);
  const isFirstRender = useRef(true);

  // --- PERSISTENCE ---
  useEffect(() => {
    if (view === 'app') {
      if (isFirstRender.current) {
        isFirstRender.current = false;
        return;
      }
      setIsSaving(true);
      saveData(data);
      const timer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(timer);
    }
  }, [data, view]);

  useEffect(() => {
      const handleBeforeUnload = () => { if (view === 'app') saveDataNow(data); };
      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [data, view]);

  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || 'dark');

  useEffect(() => {
    const root = window.document.documentElement;
    theme === 'dark' ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const [showAddForm, setShowAddForm] = useState(false);
  const [showLaborForm, setShowLaborForm] = useState(false); 
  const [movementModal, setMovementModal] = useState<{ item: InventoryItem, type: 'IN' | 'OUT' } | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false); 
  const [historyModalItem, setHistoryModalItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const loaded = loadData();
    if (loaded) {
        setData(loaded);
    }
  }, []);

  const handleLogin = (user: User) => {
    setSession({ ...user, isSupporter: data.isSupporter, subscriptionExpiry: data.subscriptionExpiry });
    setView('app');
  };

  const handleLogout = () => {
    setSession(null);
    setView('landing');
    setShowProfileMenu(false);
  };

  /**
   * REQUISITO PLAY STORE: ELIMINACIÓN DE CUENTA Y DATOS
   * Esta función garantiza que el usuario tenga control total sobre su información.
   */
  const handleDeleteAccount = () => {
      const confirmed = window.confirm(
        "⚠️ SOLICITUD DE ELIMINACIÓN DE CUENTA ⚠️\n\n" +
        "Esta acción eliminará de forma irreversible:\n" +
        "- Todos tus registros financieros e inventarios.\n" +
        "- Configuraciones de fincas y personal.\n" +
        "- Tu sesión de usuario vinculada.\n\n" +
        "¿Deseas proceder con la eliminación total de tus datos?"
      );
      
      if (confirmed) {
          localStorage.clear();
          window.location.reload();
      }
  };

  const handleUpgrade = () => {
      const nextMonth = new Date();
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      const expiry = nextMonth.toISOString().split('T')[0];
      
      setData(prev => ({ ...prev, isSupporter: true, subscriptionExpiry: expiry }));
      if (session) setSession({ ...session, isSupporter: true, subscriptionExpiry: expiry });
  };

  const activeId = data.activeWarehouseId;
  const activeInventory = useMemo(() => data.inventory.filter(i => i.warehouseId === activeId), [data.inventory, activeId]);
  const activeMovements = useMemo(() => data.movements.filter(m => m.warehouseId === activeId), [data.movements, activeId]);
  const activeSuppliers = useMemo(() => data.suppliers.filter(s => s.warehouseId === activeId), [data.suppliers, activeId]);
  const activeCostCenters = useMemo(() => data.costCenters.filter(c => c.warehouseId === activeId), [data.costCenters, activeId]);
  const activePersonnel = useMemo(() => data.personnel.filter(p => p.warehouseId === activeId), [data.personnel, activeId]);
  const activeActivities = useMemo(() => data.activities.filter(a => a.warehouseId === activeId), [data.activities, activeId]);
  const activeLaborLogs = useMemo(() => data.laborLogs.filter(l => l.warehouseId === activeId), [data.laborLogs, activeId]);
  const activeHarvests = useMemo(() => data.harvests.filter(h => h.warehouseId === activeId), [data.harvests, activeId]);
  const activeAgenda = useMemo(() => data.agenda.filter(a => a.warehouseId === activeId), [data.agenda, activeId]);
  const activeMachines = useMemo(() => data.machines.filter(m => m.warehouseId === activeId), [data.machines, activeId]);
  const activeMaintenance = useMemo(() => data.maintenanceLogs.filter(m => m.warehouseId === activeId), [data.maintenanceLogs, activeId]);
  const activeRainLogs = useMemo(() => data.rainLogs.filter(r => r.warehouseId === activeId), [data.rainLogs, activeId]);
  const activeFinanceLogs = useMemo(() => data.financeLogs.filter(f => f.warehouseId === activeId), [data.financeLogs, activeId]);

  const currentWarehouse = useMemo(() => data.warehouses.find(w => w.id === data.activeWarehouseId), [data.warehouses, data.activeWarehouseId]);

  const handleAddHarvest = (h: Omit<HarvestLog, 'id'>) => {
      const newH: HarvestLog = { ...h, id: crypto.randomUUID(), warehouseId: activeId };
      setData(prev => ({ ...prev, harvests: [...prev.harvests, newH] }));
  };
  const handleDeleteHarvest = (id: string) => setData(prev => ({ ...prev, harvests: prev.harvests.filter(h => h.id !== id) }));

  const handleAddAgenda = (ev: Omit<AgendaEvent, 'id'>) => setData(prev => ({ ...prev, agenda: [...prev.agenda, { ...ev, id: crypto.randomUUID(), warehouseId: activeId }] }));
  const handleToggleAgenda = (id: string) => setData(prev => ({ ...prev, agenda: prev.agenda.map(a => a.id === id ? { ...a, completed: !a.completed } : a) }));
  const handleDeleteAgenda = (id: string) => setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }));

  const handleConvertEvent = (event: AgendaEvent, laborValue: number, machineValue?: number) => {
      const todayDate = new Date().toISOString().split('T')[0];
      const updates: Partial<AppState> = { agenda: data.agenda.map(a => a.id === event.id ? { ...a, completed: true } : a) };
      if (event.personnelId && event.costCenterId && event.activityId) {
          updates.laborLogs = [...data.laborLogs, { id: crypto.randomUUID(), warehouseId: activeId, date: todayDate, personnelId: event.personnelId, personnelName: event.personnelName || 'Desconocido', activityId: event.activityId, activityName: event.activityName || 'Labor', costCenterId: event.costCenterId, costCenterName: event.costCenterName || 'Lote', value: laborValue, notes: `Programado: ${event.description || ''}`, paid: false }];
      }
      if (event.machineId && machineValue && machineValue > 0) {
          updates.maintenanceLogs = [...data.maintenanceLogs, { id: crypto.randomUUID(), warehouseId: activeId, machineId: event.machineId, date: todayDate, type: 'Combustible', cost: machineValue, description: `Uso labor: ${event.activityName}` }];
      }
      setData(prev => ({ ...prev, ...updates }));
  };

  const handleAddMachine = (m: Omit<Machine, 'id'>) => setData(prev => ({ ...prev, machines: [...prev.machines, { ...m, id: crypto.randomUUID(), warehouseId: activeId }] }));
  const handleDeleteMachine = (id: string) => setData(prev => ({ ...prev, machines: prev.machines.filter(m => m.id !== id) }));
  const handleAddMaintenance = (l: Omit<MaintenanceLog, 'id'>) => setData(prev => ({ ...prev, maintenanceLogs: [...prev.maintenanceLogs, { ...l, id: crypto.randomUUID(), warehouseId: activeId }] }));
  const handleAddRain = (r: Omit<RainLog, 'id'>) => setData(prev => ({ ...prev, rainLogs: [...prev.rainLogs, { ...r, id: crypto.randomUUID(), warehouseId: activeId }] }));
  const handleDeleteRain = (id: string) => setData(prev => ({ ...prev, rainLogs: prev.rainLogs.filter(r => r.id !== id) }));
  const handleAddTransaction = (t: Omit<FinanceLog, 'id'>) => setData(prev => ({ ...prev, financeLogs: [...(prev.financeLogs || []), { ...t, id: crypto.randomUUID(), warehouseId: activeId }] }));
  const handleDeleteTransaction = (id: string) => setData(prev => ({ ...prev, financeLogs: (prev.financeLogs || []).filter(f => f.id !== id) }));
  const handleCreateWarehouse = (name: string) => { 
      if (!data.isSupporter && data.warehouses.length >= 1) {
          setShowSupport(true);
          return;
      }
      const newId = crypto.randomUUID(); 
      setData(prev => ({ ...prev, warehouses: [...prev.warehouses, { id: newId, name, created: new Date().toISOString() }], activeWarehouseId: newId })); 
  };
  const handleSwitchWarehouse = (id: string) => setData(prev => ({ ...prev, activeWarehouseId: id }));
  const handleDeleteWarehouse = (id: string) => { if (data.warehouses.length <= 1) return; const newWarehouses = data.warehouses.filter(w => w.id !== id); setData(prev => ({ ...prev, warehouses: newWarehouses, activeWarehouseId: data.activeWarehouseId === id ? newWarehouses[0].id : data.activeWarehouseId })); };
  const handleAddSupplier = (name: string, phone: string, email: string, address: string) => setData(prev => ({ ...prev, suppliers: [...prev.suppliers, { id: crypto.randomUUID(), warehouseId: activeId, name, phone, email, address }] }));
  const handleDeleteSupplier = (id: string) => setData(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }));
  const handleAddCostCenter = (name: string, budget: number, area?: number, stage?: 'Produccion' | 'Levante' | 'Infraestructura', plantCount?: number, cropType?: string) => setData(prev => ({ ...prev, costCenters: [...prev.costCenters, { id: crypto.randomUUID(), warehouseId: activeId, name, budget, area, stage, plantCount, cropType }] }));
  const handleDeleteCostCenter = (id: string) => setData(prev => ({ ...prev, costCenters: prev.costCenters.filter(c => c.id !== id) }));
  const handleAddPersonnel = (name: string, role: string) => setData(prev => ({ ...prev, personnel: [...prev.personnel, { id: crypto.randomUUID(), warehouseId: activeId, name, role }] }));
  const handleDeletePersonnel = (id: string) => setData(prev => ({ ...prev, personnel: prev.personnel.filter(p => p.id !== id) }));
  const handleAddActivity = (name: string) => setData(prev => ({ ...prev, activities: [...(prev.activities || []), { id: crypto.randomUUID(), warehouseId: activeId, name }] }));
  const handleDeleteActivity = (id: string) => setData(prev => ({ ...prev, activities: (prev.activities || []).filter(a => a.id !== id) }));
  const handleAddLaborLog = (logData: Omit<LaborLog, 'id'>) => { setData(prev => ({ ...prev, laborLogs: [...(prev.laborLogs || []), { ...logData, id: crypto.randomUUID(), warehouseId: activeId, paid: false }] })); setShowLaborForm(false); };
  const handleDeleteLaborLog = (id: string) => setData(prev => ({ ...prev, laborLogs: (prev.laborLogs || []).filter(l => l.id !== id) }));
  const handleMarkAsPaid = (logIds: string[]) => setData(prev => ({ ...prev, laborLogs: prev.laborLogs.map(l => logIds.includes(l.id) ? { ...l, paid: true, paymentDate: new Date().toISOString() } : l) }));

  const handleRestoreData = (newData: AppState) => {
    let safeData = { ...newData };
    if (!safeData.warehouses || safeData.warehouses.length === 0) { const id = crypto.randomUUID(); safeData.warehouses = [{ id, name: 'Finca Principal', created: new Date().toISOString() }]; safeData.activeWarehouseId = id; }
    saveDataNow(safeData); setData(safeData);
  };

  const handleAddItem = (newItem: any, initialQty: number, details: any, initialUnit: any) => {
    const baseUnit = getBaseUnitType(newItem.lastPurchaseUnit);
    const initialStockBase = initialQty > 0 ? convertToBase(initialQty, initialUnit || newItem.lastPurchaseUnit) : 0;
    const itemId = crypto.randomUUID();
    const item: InventoryItem = { ...newItem, id: itemId, warehouseId: activeId, currentQuantity: initialStockBase, baseUnit, averageCost: newItem.lastPurchasePrice / convertToBase(1, newItem.lastPurchaseUnit) };
    let newMovements = [...data.movements];
    if (initialQty > 0) {
      newMovements = [{ id: crypto.randomUUID(), itemId, warehouseId: activeId, itemName: item.name, type: 'IN', quantity: initialQty, unit: initialUnit || item.lastPurchaseUnit, calculatedCost: calculateCost(initialQty, initialUnit || item.lastPurchaseUnit, item.lastPurchasePrice, item.lastPurchaseUnit), date: new Date().toISOString(), notes: 'Inventario Inicial', ...details }, ...newMovements];
    }
    setData(prev => ({ ...prev, inventory: [...prev.inventory, item], movements: newMovements }));
    setShowAddForm(false);
  };

  const handleRequestDelete = (id: string) => { const item = data.inventory.find(i => i.id === id); if (item) setItemToDelete({ id: item.id, name: item.name }); };
  const executeDelete = () => { if (!itemToDelete) return; setData(prev => ({ ...prev, inventory: prev.inventory.filter(i => i.id !== itemToDelete.id), movements: prev.movements.filter(m => m.itemId !== itemToDelete.id) })); setItemToDelete(null); };

  const handleAddMovement = (movData: any, newPrice?: number, newExp?: string) => {
    const { updatedInventory, movementCost } = processInventoryMovement(data.inventory, movData, newPrice, newExp);
    const newMovement: Movement = { ...movData, id: crypto.randomUUID(), warehouseId: activeId, date: new Date().toISOString(), calculatedCost: movementCost };
    setData({ ...data, inventory: updatedInventory, movements: [newMovement, ...data.movements] });
    setMovementModal(null);
  };

  const handleAuditAdjustment = (item: InventoryItem, realQty: number, notes: string) => {
    const diff = realQty - item.currentQuantity;
    if (diff === 0) return;
    const type = diff > 0 ? 'IN' : 'OUT';
    handleAddMovement({ itemId: item.id, itemName: item.name, type, quantity: Math.abs(diff) / convertToBase(1, item.lastPurchaseUnit), unit: item.lastPurchaseUnit, calculatedCost: 0, notes }, type === 'IN' ? item.averageCost * convertToBase(1, item.lastPurchaseUnit) : undefined);
  };

  const handleAICommand = (cmd: ParsedCommand) => {
      if (!data.isSupporter) {
          setShowSupport(true);
          return;
      }
      const today = new Date(); if (cmd.data.dateOffset) today.setDate(today.getDate() + cmd.data.dateOffset);
      const targetDate = today.toISOString().split('T')[0];
      const normalize = (s: string) => s ? s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") : "";
      switch(cmd.action) {
          case 'ADD_LABOR': {
              const person = activePersonnel.find(p => normalize(p.name).includes(normalize(cmd.data.personName || ''))) || activePersonnel[0];
              const act = activeActivities.find(a => normalize(a.name).includes(normalize(cmd.data.activityName || ''))) || activeActivities[0];
              const lot = activeCostCenters.find(c => normalize(c.name).includes(normalize(cmd.data.lotName || ''))) || activeCostCenters[0];
              if(person && act && lot) handleAddLaborLog({ date: targetDate, personnelId: person.id, personnelName: person.name, activityId: act.id, activityName: act.name, costCenterId: lot.id, costCenterName: lot.name, value: cmd.data.value || 0, notes: 'IA Command' });
              break;
          }
          case 'ADD_MOVEMENT_OUT': {
              const item = activeInventory.find(i => normalize(i.name).includes(normalize(cmd.data.itemName || '')));
              if(item) handleAddMovement({ itemId: item.id, itemName: item.name, type: 'OUT', quantity: cmd.data.quantity || 1, unit: item.lastPurchaseUnit, calculatedCost: 0, notes: 'IA Command' });
              break;
          }
      }
  };

  const getExportData = (): AppState => ({ ...data, inventory: activeInventory, movements: activeMovements, suppliers: activeSuppliers, costCenters: activeCostCenters, personnel: activePersonnel, activities: activeActivities, laborLogs: activeLaborLogs, harvests: activeHarvests, maintenanceLogs: activeMaintenance, rainLogs: activeRainLogs, financeLogs: activeFinanceLogs, agenda: activeAgenda });

  if (view === 'landing') return <Landing onEnter={handleLogin} onShowManual={() => setShowManual(true)} />;

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-3 py-2">
        <div className="max-w-4xl mx-auto space-y-2">
          
          <div className="flex justify-between items-center">
            <div onClick={() => setShowWarehouses(true)} className="flex items-center gap-2 cursor-pointer group p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                <div className={`p-1.5 rounded-lg shadow transition-transform group-hover:scale-105 ${data.isSupporter ? 'bg-indigo-600 shadow-indigo-600/20' : 'bg-emerald-600 shadow-emerald-600/20'}`}>
                  <Globe className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-none flex items-center gap-1">
                    AgroSuite 360
                    <ChevronDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </h1>
                  <span className="text-[9px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5 uppercase tracking-wider">
                      <div className={`w-1 h-1 rounded-full ${isSaving ? 'bg-yellow-500' : 'bg-emerald-500'} animate-pulse`}></div>
                      {currentWarehouse?.name || 'Sede'}
                  </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                {!data.isSupporter && (
                    <button onClick={() => setShowSupport(true)} className="hidden sm:flex items-center gap-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 border border-amber-500/30 px-2 py-1 rounded-full transition-all animate-pulse">
                        <Crown className="w-3.5 h-3.5" />
                        <span className="text-[9px] font-black uppercase">Plan Pro $4.99/mes</span>
                    </button>
                )}
                <button onClick={toggleTheme} className="p-2 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
                <div className="relative">
                    <button 
                        onClick={() => setShowProfileMenu(!showProfileMenu)}
                        className={`flex items-center gap-2 p-1 pr-3 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 transition-all border ${data.isSupporter ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-slate-100 dark:bg-slate-900/50 border-slate-200 dark:border-slate-700'}`}
                    >
                        <div className={`w-8 h-8 rounded-full overflow-hidden border flex items-center justify-center ${data.isSupporter ? 'bg-indigo-500 border-indigo-600' : 'bg-emerald-500 border-emerald-600'}`}>
                            {session?.avatar ? <img src={session.avatar} alt="User" /> : <UserIcon className="w-4 h-4 text-white" />}
                        </div>
                        <div className="hidden sm:flex flex-col items-start leading-tight">
                            <span className="text-xs font-black truncate max-w-[100px]">{session?.name?.split(' ')[0]}</span>
                            <span className={`text-[8px] font-bold uppercase ${data.isSupporter ? 'text-indigo-600' : 'text-slate-500'}`}>{data.isSupporter ? 'Agro Pro' : 'Plan Base'}</span>
                        </div>
                    </button>
                    {showProfileMenu && (
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-fade-in">
                            <div className="px-4 py-2 border-b border-slate-100 dark:border-slate-700">
                                <p className="text-xs font-black truncate">{session?.name}</p>
                                <p className="text-[9px] text-slate-500 truncate">{session?.email}</p>
                            </div>
                            <div className="py-2">
                                <button onClick={() => { setShowManual(true); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><HelpCircle className="w-4 h-4" /> Manual Usuario</button>
                                <button onClick={() => { setShowDataModal(true); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><Database className="w-4 h-4" /> Base de Datos</button>
                                <a href={`mailto:mateotabares7@gmail.com?subject=Soporte AgroSuite 360 - User: ${session?.email}`} className="w-full text-left px-4 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2">
                                    <Mail className="w-4 h-4" /> Soporte Técnico
                                </a>
                                {data.isSupporter ? (
                                    <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-700 mt-1">
                                        <p className="text-[8px] font-black text-indigo-600 uppercase flex items-center gap-1"><CheckCircle className="w-2 h-2"/> Suscripción Pro Activa</p>
                                        <p className="text-[8px] text-slate-400 mt-0.5 flex items-center gap-1"><Calendar className="w-2 h-2"/> Renovación: {data.subscriptionExpiry}</p>
                                    </div>
                                ) : (
                                    <button onClick={() => { setShowSupport(true); setShowProfileMenu(false); }} className="w-full text-left px-4 py-2 text-xs font-bold text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20 flex items-center gap-2"><Crown className="w-4 h-4" /> Pasar a Pro ($4.99)</button>
                                )}
                                <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center gap-2"><LogOut className="w-4 h-4" /> Cerrar Sesión</button>
                                    <button onClick={handleDeleteAccount} className="w-full text-left px-4 py-2 text-xs font-bold text-red-500 hover:bg-red-900/20 flex items-center gap-2 transition-colors"><Trash2 className="w-4 h-4" /> Eliminar Cuenta y Datos</button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
          </div>

          <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-xl gap-1 overflow-x-auto scrollbar-hide">
             {[
               { id: 'inventory', label: 'Bodega', icon: Package, color: 'emerald' },
               { id: 'labor', label: 'Personal', icon: Pickaxe, color: 'amber' },
               { id: 'harvest', label: 'Ventas', icon: Sprout, color: 'yellow' },
               { id: 'management', label: 'Campo', icon: Tractor, color: 'indigo' },
               { id: 'finance', label: 'Cuentas', icon: Landmark, color: 'slate' },
               { id: 'stats', label: 'Reportes', icon: BarChart3, color: 'purple' }
             ].map(tab => (
                <button key={tab.id} onClick={() => setCurrentTab(tab.id)} className={`flex-1 min-w-[70px] px-2 py-2 rounded-lg text-[10px] font-black uppercase flex flex-col items-center justify-center gap-1 transition-all ${currentTab === tab.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm scale-[1.02]' : 'text-slate-500'}`}>
                    <tab.icon className={`w-4 h-4 ${currentTab === tab.id ? `text-${tab.color}-500` : ''}`} />
                    {tab.label}
                </button>
             ))}
          </div>

          <div className="grid grid-cols-5 gap-2 pt-1 pb-1">
             <button onClick={() => setShowSettings(true)} className="col-span-2 text-white p-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 bg-slate-800 hover:bg-slate-700 border border-slate-700">
              <Settings className="w-3.5 h-3.5" />
              <span className="text-[10px] font-black uppercase">Configurar</span>
            </button>
            <button onClick={() => setShowAuditModal(true)} className="col-span-1 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-0.5 hover:bg-slate-50">
              <ClipboardCheck className="w-3.5 h-3.5 text-indigo-500" /> <span className="text-[8px] font-black uppercase hidden sm:inline">Auditar</span>
            </button>
            <button onClick={() => setShowExport(true)} className="col-span-1 bg-white dark:bg-slate-800 p-2 rounded-lg border border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center gap-0.5 hover:bg-slate-50">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-500" /> <span className="text-[8px] font-black uppercase hidden sm:inline">Excel</span>
            </button>
            <button onClick={() => setShowSupport(true)} className={`col-span-1 p-2 rounded-lg border flex flex-col items-center justify-center gap-0.5 transition-all ${data.isSupporter ? 'bg-indigo-600 text-white border-indigo-700 shadow-lg shadow-indigo-500/20' : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:bg-slate-50'}`}>
              {data.isSupporter ? <Star className="w-3.5 h-3.5 text-yellow-300" /> : <Gift className="w-3.5 h-3.5 text-red-500" />}
              <span className="text-[8px] font-black uppercase hidden sm:inline">{data.isSupporter ? 'Pro' : 'Apoyar'}</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-32">
        {currentTab === 'inventory' && <Dashboard inventory={activeInventory} agenda={activeAgenda} harvests={activeHarvests} laborLogs={activeLaborLogs} movements={activeMovements} maintenanceLogs={activeMaintenance} financeLogs={activeFinanceLogs} onAddMovement={(item, type) => setMovementModal({ item, type })} onDelete={handleRequestDelete} onViewHistory={setHistoryModalItem} isAdmin={true} />}
        {currentTab === 'labor' && <LaborView laborLogs={activeLaborLogs} personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onAddLabor={() => setShowLaborForm(true)} onDeleteLabor={handleDeleteLaborLog} isAdmin={true} onOpenPayroll={() => setShowPayrollModal(true)} />}
        {currentTab === 'harvest' && <HarvestView harvests={activeHarvests} costCenters={activeCostCenters} onAddHarvest={handleAddHarvest} onDeleteHarvest={handleDeleteHarvest} isAdmin={true} allMovements={activeMovements} allLaborLogs={activeLaborLogs} />}
        {currentTab === 'management' && <ManagementView agenda={activeAgenda} machines={activeMachines} maintenanceLogs={activeMaintenance} rainLogs={activeRainLogs} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} onAddEvent={handleAddAgenda} onToggleEvent={handleToggleAgenda} onDeleteEvent={handleDeleteAgenda} onConvertEvent={handleConvertEvent} onAddMachine={handleAddMachine} onAddMaintenance={handleAddMaintenance} onDeleteMachine={handleDeleteMachine} onAddRain={handleAddRain} onDeleteRain={handleDeleteRain} isAdmin={true} />}
        {currentTab === 'finance' && <FinanceView financeLogs={activeFinanceLogs} onAddTransaction={handleAddTransaction} onDeleteTransaction={handleDeleteTransaction} />}
        {currentTab === 'stats' && <StatsView movements={activeMovements} suppliers={activeSuppliers} costCenters={activeCostCenters} laborLogs={activeLaborLogs} harvests={activeHarvests} maintenanceLogs={activeMaintenance} financeLogs={activeFinanceLogs} rainLogs={activeRainLogs} />}
      </main>

      {currentTab === 'inventory' && (
        <button onClick={() => setShowAddForm(true)} className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-500 text-white p-4 rounded-3xl shadow-2xl shadow-emerald-900/30 transition-all hover:scale-110 active:scale-95 z-30 mb-[env(safe-area-inset-bottom)]">
            <Plus className="w-8 h-8" />
        </button>
      )}

      <AIAssistant data={getExportData()} onExecuteCommand={handleAICommand} />

      {showAddForm && <InventoryForm suppliers={activeSuppliers} onSave={handleAddItem} onCancel={() => setShowAddForm(false)} />}
      {showLaborForm && <LaborForm personnel={activePersonnel} costCenters={activeCostCenters} activities={activeActivities} onSave={handleAddLaborLog} onCancel={() => setShowLaborForm(false)} onOpenSettings={() => { setShowLaborForm(false); setShowSettings(true); }} />}
      {movementModal && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} machines={activeMachines} movements={activeMovements} onSave={handleAddMovement} onCancel={() => setMovementModal(null)} />}
      {showSettings && <SettingsModal suppliers={activeSuppliers} costCenters={activeCostCenters} personnel={activePersonnel} activities={activeActivities} onAddSupplier={handleAddSupplier} onDeleteSupplier={handleDeleteSupplier} onAddCostCenter={handleAddCostCenter} onDeleteCostCenter={handleDeleteCostCenter} onAddPersonnel={handleAddPersonnel} onDeletePersonnel={handleDeletePersonnel} onAddActivity={handleAddActivity} onDeleteActivity={handleDeleteActivity} onClose={() => setShowSettings(false)} />}
      {showDataModal && <DataModal fullState={data} onRestoreData={handleRestoreData} onClose={() => setShowDataModal(false)} />}
      {showAuditModal && <AuditModal inventory={activeInventory} onAdjust={handleAuditAdjustment} onClose={() => setShowAuditModal(false)} />}
      {showPayrollModal && <PayrollModal logs={activeLaborLogs} personnel={activePersonnel} onMarkAsPaid={handleMarkAsPaid} onClose={() => setShowPayrollModal(false)} warehouseName={currentWarehouse?.name || 'AgroSuite'} />}
      {showSupport && <SupportModal isSupporter={data.isSupporter} onUpgrade={handleUpgrade} onClose={() => setShowSupport(false)} />}
      {showExport && <ExportModal isSupporter={data.isSupporter} onShowSupport={() => { setShowExport(false); setShowSupport(true); }} onClose={() => setShowExport(false)} onExportPDF={() => { generatePDF(getExportData()); setShowExport(false); }} onExportExcel={() => { generateExcel(getExportData()); setShowExport(false); }} onGenerateOrder={() => { generateOrderPDF(getExportData()); setShowExport(false); }} onExportLaborPDF={() => { generateLaborPDF(getExportData()); setShowExport(false); }} onExportLaborExcel={() => { generateLaborExcel(getExportData()); setShowExport(false); }} onExportHarvestPDF={() => { generateHarvestPDF(getExportData()); setShowExport(false); }} onExportMachineryPDF={() => { generateMachineryPDF(getExportData()); setShowExport(false); }} activeData={getExportData()} />}
      {historyModalItem && <HistoryModal item={historyModalItem} movements={activeMovements.filter(m => m.itemId === historyModalItem.id)} onClose={() => setHistoryModalItem(null)} />}
      {itemToDelete && <DeleteModal itemName={itemToDelete.name} onConfirm={executeDelete} onCancel={() => setItemToDelete(null)} />}
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}
      {showWarehouses && <WarehouseModal warehouses={data.warehouses} activeId={data.activeWarehouseId} onCreate={handleCreateWarehouse} onSwitch={handleSwitchWarehouse} onDelete={handleDeleteWarehouse} onClose={() => setShowWarehouses(false)} isAdmin={true} />}
    </div>
  );
}

export default App;
