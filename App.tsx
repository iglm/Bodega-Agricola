
import React, { useState, useEffect, useMemo } from 'react';
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
import { SecurityModal } from './components/SecurityModal';
import { LaborView } from './components/LaborView'; 
import { LaborForm } from './components/LaborForm'; 
import { HarvestView } from './components/HarvestView'; 
import { ManagementView } from './components/ManagementView'; 
import { PayrollModal } from './components/PayrollModal'; // New

import { AppState, InventoryItem, Movement, Unit, Warehouse, Supplier, CostCenter, Personnel, Activity, LaborLog, HarvestLog, AgendaEvent, Machine, MaintenanceLog, RainLog } from './types';
import { loadData, saveData, convertToBase, getBaseUnitType, calculateCost, calculateWeightedAverageCost } from './services/inventoryService';
import { generateExcel, generatePDF, generateOrderPDF, generateLaborPDF, generateLaborExcel, generateHarvestPDF, generateMachineryPDF } from './services/reportService';
import { Plus, Download, Gift, Sprout, BookOpen, ChevronDown, Warehouse as WarehouseIcon, Save, Sun, Moon, Settings, BarChart3, Package, Database, ClipboardCheck, Lock, Unlock, Pickaxe, Tractor, HelpCircle } from 'lucide-react';

function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  
  // NAVIGATION: 'inventory' | 'labor' | 'harvest' | 'management' | 'stats'
  const [currentTab, setCurrentTab] = useState<string>('inventory');
  
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
    rainLogs: []  
  });

  // Admin Security State
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Theme Management
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') || 'dark';
    }
    return 'dark';
  });

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // Modals state
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
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [showPayrollModal, setShowPayrollModal] = useState(false); // New
  const [historyModalItem, setHistoryModalItem] = useState<InventoryItem | null>(null);
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const loaded = loadData();
    if (loaded) {
        setData(loaded);
        if (!loaded.adminPin) {
          setIsAdminUnlocked(true);
        } else {
          setIsAdminUnlocked(false);
        }
    }
  }, []);

  // OPTIMIZATION: Debounced Save
  useEffect(() => {
    if (view === 'app') {
      setIsSaving(true);
      const handler = setTimeout(() => {
        saveData(data);
        setIsSaving(false);
      }, 500); 

      return () => {
        clearTimeout(handler);
      };
    }
  }, [data, view]);

  const activeInventory = useMemo(() => {
    return data.inventory.filter(i => i.warehouseId === data.activeWarehouseId);
  }, [data.inventory, data.activeWarehouseId]);

  const activeMovements = useMemo(() => {
    return data.movements.filter(m => m.warehouseId === data.activeWarehouseId);
  }, [data.movements, data.activeWarehouseId]);

  const currentWarehouse = useMemo(() => {
    return data.warehouses.find(w => w.id === data.activeWarehouseId);
  }, [data.warehouses, data.activeWarehouseId]);

  // -- HANDLERS FOR NEW MODULES --

  // Harvest
  const handleAddHarvest = (h: Omit<HarvestLog, 'id'>) => {
      const newH: HarvestLog = { ...h, id: crypto.randomUUID() };
      setData(prev => ({ ...prev, harvests: [...prev.harvests, newH] }));
  };
  const handleDeleteHarvest = (id: string) => {
      setData(prev => ({ ...prev, harvests: prev.harvests.filter(h => h.id !== id) }));
  };

  // Agenda
  const handleAddAgenda = (ev: Omit<AgendaEvent, 'id'>) => {
      setData(prev => ({ ...prev, agenda: [...prev.agenda, { ...ev, id: crypto.randomUUID() }] }));
  };
  const handleToggleAgenda = (id: string) => {
      setData(prev => ({
          ...prev,
          agenda: prev.agenda.map(a => a.id === id ? { ...a, completed: !a.completed } : a)
      }));
  };
  const handleDeleteAgenda = (id: string) => {
      setData(prev => ({ ...prev, agenda: prev.agenda.filter(a => a.id !== id) }));
  };

  // Machinery
  const handleAddMachine = (m: Omit<Machine, 'id'>) => {
      setData(prev => ({ ...prev, machines: [...prev.machines, { ...m, id: crypto.randomUUID() }] }));
  };
  const handleDeleteMachine = (id: string) => {
      setData(prev => ({ ...prev, machines: prev.machines.filter(m => m.id !== id) }));
  };
  const handleAddMaintenance = (l: Omit<MaintenanceLog, 'id'>) => {
      setData(prev => ({ ...prev, maintenanceLogs: [...prev.maintenanceLogs, { ...l, id: crypto.randomUUID() }] }));
  };

  // Rain
  const handleAddRain = (r: Omit<RainLog, 'id'>) => {
      setData(prev => ({ ...prev, rainLogs: [...prev.rainLogs, { ...r, id: crypto.randomUUID() }] }));
  };
  const handleDeleteRain = (id: string) => {
      setData(prev => ({ ...prev, rainLogs: prev.rainLogs.filter(r => r.id !== id) }));
  };


  // -- STANDARD HANDLERS --
  const handlePinSuccess = (pin: string) => {
    if (!data.adminPin) {
      setData(prev => ({ ...prev, adminPin: pin }));
      setIsAdminUnlocked(true);
      alert("PIN Creado Exitosamente.");
    } else {
      setIsAdminUnlocked(true);
    }
    setShowSecurityModal(false);
  };

  const handleLock = () => {
    if (data.adminPin) setIsAdminUnlocked(false);
    else setShowSecurityModal(true);
  };

  const handleCreateWarehouse = (name: string) => {
    const newId = crypto.randomUUID();
    const newWarehouse: Warehouse = { id: newId, name, created: new Date().toISOString() };
    setData(prev => ({ ...prev, warehouses: [...prev.warehouses, newWarehouse], activeWarehouseId: newId }));
  };

  const handleSwitchWarehouse = (id: string) => setData(prev => ({ ...prev, activeWarehouseId: id }));

  const handleDeleteWarehouse = (id: string) => {
    if (data.warehouses.length <= 1) return;
    const newWarehouses = data.warehouses.filter(w => w.id !== id);
    const newActiveId = data.activeWarehouseId === id ? newWarehouses[0].id : data.activeWarehouseId;
    setData(prev => ({ ...prev, warehouses: newWarehouses, activeWarehouseId: newActiveId }));
  };

  const handleAddSupplier = (name: string, phone: string, email: string, address: string) => {
     setData(prev => ({ ...prev, suppliers: [...prev.suppliers, { id: crypto.randomUUID(), name, phone, email, address }] }));
  };
  const handleDeleteSupplier = (id: string) => setData(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }));
  
  const handleAddCostCenter = (name: string, budget: number, area?: number) => {
     setData(prev => ({ ...prev, costCenters: [...prev.costCenters, { id: crypto.randomUUID(), name, budget, area }] }));
  };
  const handleDeleteCostCenter = (id: string) => setData(prev => ({ ...prev, costCenters: prev.costCenters.filter(c => c.id !== id) }));

  const handleAddPersonnel = (name: string, role: string) => {
      setData(prev => ({ ...prev, personnel: [...prev.personnel, { id: crypto.randomUUID(), name, role }] }));
  };
  const handleDeletePersonnel = (id: string) => setData(prev => ({ ...prev, personnel: prev.personnel.filter(p => p.id !== id) }));

  const handleAddActivity = (name: string) => {
      setData(prev => ({ ...prev, activities: [...(prev.activities || []), { id: crypto.randomUUID(), name }] }));
  };
  const handleDeleteActivity = (id: string) => setData(prev => ({ ...prev, activities: (prev.activities || []).filter(a => a.id !== id) }));

  const handleAddLaborLog = (logData: Omit<LaborLog, 'id'>) => {
      setData(prev => ({ ...prev, laborLogs: [...(prev.laborLogs || []), { ...logData, id: crypto.randomUUID(), paid: false }] }));
      setShowLaborForm(false);
  };
  const handleDeleteLaborLog = (id: string) => setData(prev => ({ ...prev, laborLogs: (prev.laborLogs || []).filter(l => l.id !== id) }));

  // NEW: Mark logs as paid
  const handleMarkAsPaid = (logIds: string[]) => {
      setData(prev => ({
          ...prev,
          laborLogs: prev.laborLogs.map(l => logIds.includes(l.id) ? { ...l, paid: true, paymentDate: new Date().toISOString() } : l)
      }));
  };

  const handleRestoreData = (newData: AppState) => {
    let safeData = { ...newData };
    if (!safeData.warehouses || safeData.warehouses.length === 0) {
        const id = crypto.randomUUID();
        safeData.warehouses = [{ id, name: 'Bodega Restaurada', created: new Date().toISOString() }];
        safeData.activeWarehouseId = id;
    }
    const activeExists = safeData.warehouses.find(w => w.id === safeData.activeWarehouseId);
    if (!activeExists) safeData.activeWarehouseId = safeData.warehouses[0].id;

    if (!safeData.activities) safeData.activities = [];
    if (!safeData.laborLogs) safeData.laborLogs = [];
    if (!safeData.harvests) safeData.harvests = [];
    if (!safeData.agenda) safeData.agenda = [];
    if (!safeData.machines) safeData.machines = [];
    if (!safeData.maintenanceLogs) safeData.maintenanceLogs = [];
    if (!safeData.rainLogs) safeData.rainLogs = [];
    
    saveData(safeData);
    setData(safeData);
    if (!safeData.adminPin) setIsAdminUnlocked(true); else setIsAdminUnlocked(false);
  };

  const handleAddItem = (newItem: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQty: number) => {
    const baseUnit = getBaseUnitType(newItem.lastPurchaseUnit);
    const initialStockBase = initialQty > 0 ? convertToBase(initialQty, newItem.lastPurchaseUnit) : 0;
    const baseInPurchase = convertToBase(1, newItem.lastPurchaseUnit);
    const initialAvgCost = newItem.lastPurchasePrice / baseInPurchase;
    const itemId = crypto.randomUUID();

    const item: InventoryItem = {
      ...newItem,
      id: itemId,
      warehouseId: data.activeWarehouseId,
      currentQuantity: initialStockBase,
      baseUnit,
      averageCost: initialAvgCost
    };

    let newMovements = [...data.movements];
    if (initialQty > 0) {
      const cost = calculateCost(initialQty, newItem.lastPurchaseUnit, newItem.lastPurchasePrice, newItem.lastPurchaseUnit);
      newMovements = [{
        id: crypto.randomUUID(),
        itemId: item.id,
        warehouseId: data.activeWarehouseId,
        itemName: item.name,
        type: 'IN',
        quantity: initialQty,
        unit: newItem.lastPurchaseUnit,
        calculatedCost: cost,
        date: new Date().toISOString(),
        notes: 'Inventario Inicial'
      }, ...newMovements];
    }
    
    setData(prev => ({ ...prev, inventory: [...prev.inventory, item], movements: newMovements }));
    setShowAddForm(false);
  };

  const handleRequestDelete = (id: string) => {
    if (!isAdminUnlocked) { setShowSecurityModal(true); return; }
    const item = data.inventory.find(i => i.id === id);
    if (item) setItemToDelete({ id: item.id, name: item.name });
  };

  const executeDelete = () => {
    if (!itemToDelete) return;
    setData(prev => ({
        ...prev,
        inventory: prev.inventory.filter(i => i.id !== itemToDelete.id),
        movements: prev.movements.filter(m => m.itemId !== itemToDelete.id)
    }));
    setItemToDelete(null);
  };

  const handleAddMovement = (movData: Omit<Movement, 'id' | 'date' | 'warehouseId'>, newUnitPrice?: number, newExpirationDate?: string) => {
    const baseQuantity = convertToBase(movData.quantity, movData.unit);
    let calculatedMovementCost = 0;

    const updatedInventory = data.inventory.map(item => {
      if (item.id === movData.itemId) {
        let newQty = item.currentQuantity;
        let newAvgCost = item.averageCost;
        let newLastPrice = item.lastPurchasePrice;
        let newLastUnit = item.lastPurchaseUnit;
        let newExpDate = item.expirationDate; 

        if (movData.type === 'IN') {
           if (newUnitPrice !== undefined) {
             const baseInNewUnit = convertToBase(1, movData.unit);
             const costPerBaseIncoming = newUnitPrice / baseInNewUnit;
             calculatedMovementCost = baseQuantity * costPerBaseIncoming;
             newAvgCost = calculateWeightedAverageCost(item.currentQuantity, item.averageCost, movData.quantity, movData.unit, newUnitPrice);
             newLastPrice = newUnitPrice;
             newLastUnit = movData.unit;
             if (newExpirationDate) newExpDate = newExpirationDate;
           } else {
             calculatedMovementCost = baseQuantity * item.averageCost;
           }
           newQty += baseQuantity;
        } else {
           calculatedMovementCost = baseQuantity * item.averageCost;
           newQty -= baseQuantity;
        }
        if (newQty < 0.1) newQty = 0;
        return { ...item, currentQuantity: Math.max(0, newQty), lastPurchasePrice: newLastPrice, lastPurchaseUnit: newLastUnit, averageCost: newAvgCost, expirationDate: newExpDate };
      }
      return item;
    });

    const newMovement: Movement = {
      ...movData,
      id: crypto.randomUUID(),
      warehouseId: data.activeWarehouseId, 
      date: new Date().toISOString(),
      calculatedCost: calculatedMovementCost
    };

    let updatedMaintenanceLogs = data.maintenanceLogs;

    // INTEGRATION: If movement is OUT and has machineId, create a MaintenanceLog
    if (movData.type === 'OUT' && movData.machineId) {
        const newMaintLog: MaintenanceLog = {
            id: crypto.randomUUID(),
            machineId: movData.machineId,
            date: new Date().toISOString(),
            type: 'Correctivo', // Defaulting to 'Correctivo' for spare parts/replacements
            cost: calculatedMovementCost,
            description: `Repuesto Inventario: ${movData.itemName} (${movData.quantity} ${movData.unit})`
        };
        updatedMaintenanceLogs = [...updatedMaintenanceLogs, newMaintLog];
    }

    setData({ 
        ...data, 
        inventory: updatedInventory, 
        movements: [newMovement, ...data.movements],
        maintenanceLogs: updatedMaintenanceLogs
    });
    setMovementModal(null);
  };

  const handleAuditAdjustment = (item: InventoryItem, realQty: number, notes: string) => {
    const diff = realQty - item.currentQuantity;
    if (diff === 0) return;
    const conversionFactor = convertToBase(1, item.lastPurchaseUnit);
    const diffInPurchaseUnits = Math.abs(diff) / conversionFactor;
    const type = diff > 0 ? 'IN' : 'OUT';
    const costPerPurchaseUnit = item.averageCost * conversionFactor;
    handleAddMovement({ itemId: item.id, itemName: item.name, type, quantity: diffInPurchaseUnits, unit: item.lastPurchaseUnit, calculatedCost: 0, notes }, type === 'IN' ? costPerPurchaseUnit : undefined);
  };

  const getExportData = (): AppState => ({ ...data, inventory: activeInventory, movements: activeMovements });

  if (view === 'landing') {
    return <Landing onEnter={() => setView('app')} onShowManual={() => setShowManual(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-3 py-2 transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-2">
          
          <div className="flex justify-between items-center">
            <div onClick={() => setShowWarehouses(true)} className="flex items-center gap-2 cursor-pointer group p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors">
                <div className="bg-emerald-600 p-1.5 rounded-lg shadow shadow-emerald-600/20 group-hover:scale-105 transition-transform">
                  <Sprout className="w-4 h-4 text-white" />
                </div>
                <div>
                  <h1 className="text-sm font-bold text-slate-800 dark:text-white leading-none flex items-center gap-1">
                    {currentWarehouse?.name || 'AgroBodega'}
                    <ChevronDown className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  </h1>
                  <span className="text-[10px] text-slate-500 dark:text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                      <div className={`w-1.5 h-1.5 rounded-full ${isSaving ? 'bg-yellow-500' : 'bg-emerald-500'} animate-pulse`}></div>
                      {isSaving ? 'GUARDANDO...' : 'ONLINE'}
                  </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button onClick={() => setShowManual(true)} className="p-1.5 rounded-lg transition-colors bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800" title="Manual de Ayuda">
                    <HelpCircle className="w-4 h-4" />
                </button>
                <button onClick={handleLock} className={`p-1.5 rounded-lg transition-colors border ${isAdminUnlocked ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent' : 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800'}`}>
                    {isAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>
                <button onClick={() => { if(!isAdminUnlocked) { setShowSecurityModal(true); return; } setShowDataModal(true); }} className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${!isAdminUnlocked ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 border-transparent' : 'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 hover:bg-orange-100 border-orange-200 dark:border-orange-800'}`}>
                    <Database className="w-4 h-4" />
                </button>
                <button onClick={toggleTheme} className="p-2 text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
          </div>

          {/* MAIN NAV TABS - EXPANDED */}
          <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-xl gap-1 overflow-x-auto">
             <button onClick={() => setCurrentTab('inventory')} className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${currentTab === 'inventory' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>
                <Package className="w-4 h-4" /> <span className="hidden sm:inline">Inventario</span>
             </button>
             <button onClick={() => setCurrentTab('labor')} className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${currentTab === 'labor' ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>
                <Pickaxe className="w-4 h-4" /> <span className="hidden sm:inline">Labores</span>
             </button>
             <button onClick={() => setCurrentTab('harvest')} className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${currentTab === 'harvest' ? 'bg-white dark:bg-slate-700 text-yellow-500 dark:text-yellow-400 shadow-sm' : 'text-slate-500'}`}>
                <Sprout className="w-4 h-4" /> <span className="hidden sm:inline">Producción</span>
             </button>
             <button onClick={() => setCurrentTab('management')} className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${currentTab === 'management' ? 'bg-white dark:bg-slate-700 text-indigo-500 dark:text-indigo-400 shadow-sm' : 'text-slate-500'}`}>
                <Tractor className="w-4 h-4" /> <span className="hidden sm:inline">Gestión</span>
             </button>
             {/* PROTECTED STATS TAB */}
             <button onClick={() => { if(!isAdminUnlocked) { setShowSecurityModal(true); return; } setCurrentTab('stats'); }} className={`flex-1 min-w-[60px] px-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${currentTab === 'stats' ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-white shadow-sm' : 'text-slate-500'}`}>
                {isAdminUnlocked ? <BarChart3 className="w-4 h-4" /> : <Lock className="w-4 h-4" />} 
                <span className="hidden sm:inline">Reportes</span>
             </button>
          </div>

          <div className="grid grid-cols-5 gap-2 pt-1">
             <button onClick={() => { if (!isAdminUnlocked) { setShowSecurityModal(true); return; } setShowSettings(true); }} className={`col-span-2 text-white p-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${isAdminUnlocked ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-400 cursor-not-allowed'}`}>
              {isAdminUnlocked ? <Settings className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-wide">Maestros</span>
            </button>
            <button onClick={() => setShowAuditModal(true)} className="col-span-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-indigo-100 transition-colors">
              <ClipboardCheck className="w-4 h-4" /> <span className="text-[9px] font-bold hidden sm:inline">Auditoría</span>
            </button>
            {/* PROTECTED EXPORT BUTTON */}
            <button onClick={() => { if(!isAdminUnlocked) { setShowSecurityModal(true); return; } setShowExport(true); }} className={`col-span-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-emerald-100 transition-colors ${!isAdminUnlocked ? 'opacity-50' : ''}`}>
              {isAdminUnlocked ? <Download className="w-4 h-4" /> : <Lock className="w-4 h-4" />} 
              <span className="text-[9px] font-bold hidden sm:inline">Reportes</span>
            </button>
            <button onClick={() => setShowSupport(true)} className="col-span-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800 p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-yellow-100 transition-colors">
              <Gift className="w-4 h-4" /> <span className="text-[9px] font-bold hidden sm:inline">Apoyar</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 pb-32">
        {currentTab === 'inventory' && (
             <Dashboard 
                inventory={activeInventory} 
                agenda={data.agenda || []}
                onAddMovement={(item, type) => setMovementModal({ item, type })} 
                onDelete={handleRequestDelete} 
                onViewHistory={(item) => setHistoryModalItem(item)} 
                isAdmin={isAdminUnlocked} 
             />
        )}
        
        {currentTab === 'labor' && (
             <LaborView 
                laborLogs={data.laborLogs || []} 
                personnel={data.personnel} 
                costCenters={data.costCenters} 
                activities={data.activities || []} 
                onAddLabor={() => { if (!isAdminUnlocked) { setShowSecurityModal(true); return; } setShowLaborForm(true); }} 
                onDeleteLabor={handleDeleteLaborLog} 
                isAdmin={isAdminUnlocked}
                onOpenPayroll={() => setShowPayrollModal(true)}
             />
        )}

        {currentTab === 'harvest' && (
             <HarvestView 
                harvests={data.harvests || []} 
                costCenters={data.costCenters} 
                onAddHarvest={handleAddHarvest} 
                onDeleteHarvest={handleDeleteHarvest} 
                isAdmin={isAdminUnlocked}
                // DATA LINKING: Passing movements and labor logs to calculate real-time investment
                allMovements={activeMovements}
                allLaborLogs={data.laborLogs || []}
             />
        )}

        {currentTab === 'management' && (
            <ManagementView 
                agenda={data.agenda || []}
                machines={data.machines || []}
                maintenanceLogs={data.maintenanceLogs || []}
                rainLogs={data.rainLogs || []}
                costCenters={data.costCenters}
                onAddEvent={handleAddAgenda}
                onToggleEvent={handleToggleAgenda}
                onDeleteEvent={handleDeleteAgenda}
                onAddMachine={handleAddMachine}
                onAddMaintenance={handleAddMaintenance}
                onDeleteMachine={handleDeleteMachine}
                onAddRain={handleAddRain}
                onDeleteRain={handleDeleteRain}
                isAdmin={isAdminUnlocked}
            />
        )}

        {currentTab === 'stats' && (
             <StatsView movements={activeMovements} suppliers={data.suppliers} costCenters={data.costCenters} laborLogs={data.laborLogs} harvests={data.harvests} maintenanceLogs={data.maintenanceLogs} />
        )}
      </main>

      {currentTab === 'inventory' && (
        <button onClick={() => setShowAddForm(true)} className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95 z-30 flex items-center justify-center mb-[env(safe-area-inset-bottom)]">
            <Plus className="w-8 h-8" />
        </button>
      )}

      {showAddForm && <InventoryForm onSave={handleAddItem} onCancel={() => setShowAddForm(false)} />}
      {showLaborForm && <LaborForm personnel={data.personnel} costCenters={data.costCenters} activities={data.activities || []} onSave={handleAddLaborLog} onCancel={() => setShowLaborForm(false)} onOpenSettings={() => { setShowLaborForm(false); setShowSettings(true); }} />}
      {movementModal && <MovementModal item={movementModal.item} type={movementModal.type} suppliers={data.suppliers} costCenters={data.costCenters} personnel={data.personnel} machines={data.machines} movements={activeMovements} onSave={handleAddMovement} onCancel={() => setMovementModal(null)} />}
      {showSettings && <SettingsModal suppliers={data.suppliers} costCenters={data.costCenters} personnel={data.personnel} activities={data.activities} onAddSupplier={handleAddSupplier} onDeleteSupplier={handleDeleteSupplier} onAddCostCenter={handleAddCostCenter} onDeleteCostCenter={handleDeleteCostCenter} onAddPersonnel={handleAddPersonnel} onDeletePersonnel={handleDeletePersonnel} onAddActivity={handleAddActivity} onDeleteActivity={handleDeleteActivity} onClose={() => setShowSettings(false)} />}
      {showDataModal && <DataModal fullState={data} onRestoreData={handleRestoreData} onClose={() => setShowDataModal(false)} />}
      {showAuditModal && <AuditModal inventory={activeInventory} onAdjust={handleAuditAdjustment} onClose={() => setShowAuditModal(false)} />}
      {showSecurityModal && <SecurityModal existingPin={data.adminPin} onSuccess={handlePinSuccess} onClose={() => setShowSecurityModal(false)} />}
      {showPayrollModal && <PayrollModal logs={data.laborLogs || []} personnel={data.personnel} onMarkAsPaid={handleMarkAsPaid} onClose={() => setShowPayrollModal(false)} warehouseName={currentWarehouse?.name || 'AgroBodega'} />}
      {showSupport && <SupportModal onClose={() => setShowSupport(false)} />}
      {showExport && (
          <ExportModal 
            onClose={() => setShowExport(false)} 
            onExportPDF={() => { generatePDF(getExportData()); setShowExport(false); }} 
            onExportExcel={() => { generateExcel(getExportData()); setShowExport(false); }} 
            onGenerateOrder={() => { generateOrderPDF(getExportData()); setShowExport(false); }} 
            onExportLaborPDF={() => { generateLaborPDF(getExportData()); setShowExport(false); }} 
            onExportLaborExcel={() => { generateLaborExcel(getExportData()); setShowExport(false); }}
            onExportHarvestPDF={() => { generateHarvestPDF(getExportData()); setShowExport(false); }}
            onExportMachineryPDF={() => { generateMachineryPDF(getExportData()); setShowExport(false); }}
            fullData={getExportData()}
        />
      )}
      {historyModalItem && <HistoryModal item={historyModalItem} movements={activeMovements.filter(m => m.itemId === historyModalItem.id)} onClose={() => setHistoryModalItem(null)} />}
      {itemToDelete && <DeleteModal itemName={itemToDelete.name} onConfirm={executeDelete} onCancel={() => setItemToDelete(null)} />}
      {showManual && <ManualModal onClose={() => setShowManual(false)} />}
      {showWarehouses && <WarehouseModal warehouses={data.warehouses} activeId={data.activeWarehouseId} onCreate={handleCreateWarehouse} onSwitch={handleSwitchWarehouse} onDelete={handleDeleteWarehouse} onClose={() => setShowWarehouses(false)} isAdmin={isAdminUnlocked} />}
    </div>
  );
}

export default App;
