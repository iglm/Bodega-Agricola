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
import { LaborView } from './components/LaborView'; // NEW
import { LaborForm } from './components/LaborForm'; // NEW
import { AppState, InventoryItem, Movement, Unit, Warehouse, Supplier, CostCenter, Personnel, Activity, LaborLog } from './types';
import { loadData, saveData, convertToBase, getBaseUnitType, calculateCost, calculateWeightedAverageCost } from './services/inventoryService';
import { generateExcel, generatePDF, generateOrderPDF } from './services/reportService';
import { Plus, Download, Gift, Sprout, BookOpen, ChevronDown, Warehouse as WarehouseIcon, Save, Sun, Moon, Settings, BarChart3, Package, Database, ClipboardCheck, Lock, Unlock, Pickaxe } from 'lucide-react';

function App() {
  const [view, setView] = useState<'landing' | 'app'>('landing');
  const [currentTab, setCurrentTab] = useState<'inventory' | 'labor' | 'stats'>('inventory'); // Updated Tab
  
  const [data, setData] = useState<AppState>({ 
    warehouses: [], 
    activeWarehouseId: '', 
    inventory: [], 
    movements: [],
    suppliers: [],
    costCenters: [],
    personnel: [],
    activities: [], // New
    laborLogs: []   // New
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
  const [showLaborForm, setShowLaborForm] = useState(false); // NEW
  const [movementModal, setMovementModal] = useState<{ item: InventoryItem, type: 'IN' | 'OUT' } | null>(null);
  const [showSupport, setShowSupport] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showWarehouses, setShowWarehouses] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showDataModal, setShowDataModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showSecurityModal, setShowSecurityModal] = useState(false);
  const [historyModalItem, setHistoryModalItem] = useState<InventoryItem | null>(null);
  
  // Delete confirmation state
  const [itemToDelete, setItemToDelete] = useState<{ id: string, name: string } | null>(null);

  useEffect(() => {
    const loaded = loadData();
    if (loaded) {
        setData(loaded);
        // If no PIN is set, admin is unlocked by default. If PIN exists, locked.
        if (!loaded.adminPin) {
          setIsAdminUnlocked(true);
        } else {
          setIsAdminUnlocked(false);
        }
    }
  }, []);

  // OPTIMIZATION: Debounced Save to protect Android storage
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

  // Derived state: Filter items for the active warehouse
  const activeInventory = useMemo(() => {
    return data.inventory.filter(i => i.warehouseId === data.activeWarehouseId);
  }, [data.inventory, data.activeWarehouseId]);

  const activeMovements = useMemo(() => {
    return data.movements.filter(m => m.warehouseId === data.activeWarehouseId);
  }, [data.movements, data.activeWarehouseId]);

  const currentWarehouse = useMemo(() => {
    return data.warehouses.find(w => w.id === data.activeWarehouseId);
  }, [data.warehouses, data.activeWarehouseId]);

  // -- Security Management --
  const handlePinSuccess = (pin: string) => {
    if (!data.adminPin) {
      // Setting up new PIN
      setData(prev => ({ ...prev, adminPin: pin }));
      setIsAdminUnlocked(true); // Auto unlock after creation
      alert("PIN Creado Exitosamente. Ahora las funciones críticas están protegidas.");
    } else {
      // Unlocking
      setIsAdminUnlocked(true);
    }
    setShowSecurityModal(false);
  };

  const handleLock = () => {
    if (data.adminPin) {
      setIsAdminUnlocked(false);
    } else {
      // If no PIN, clicking lock opens setup
      setShowSecurityModal(true);
    }
  };

  // -- Warehouse Management --

  const handleCreateWarehouse = (name: string) => {
    const newId = crypto.randomUUID();
    const newWarehouse: Warehouse = {
      id: newId,
      name,
      created: new Date().toISOString()
    };
    
    setData(prev => ({
      ...prev,
      warehouses: [...prev.warehouses, newWarehouse],
      activeWarehouseId: newId // Switch to new immediately
    }));
  };

  const handleSwitchWarehouse = (id: string) => {
    setData(prev => ({ ...prev, activeWarehouseId: id }));
  };

  const handleDeleteWarehouse = (id: string) => {
    if (data.warehouses.length <= 1) return;
    const newWarehouses = data.warehouses.filter(w => w.id !== id);
    const newActiveId = data.activeWarehouseId === id ? newWarehouses[0].id : data.activeWarehouseId;
    const newInventory = data.inventory.filter(i => i.warehouseId !== id);
    const newMovements = data.movements.filter(m => m.warehouseId !== id);

    setData({
      ...data,
      warehouses: newWarehouses,
      activeWarehouseId: newActiveId,
      inventory: newInventory,
      movements: newMovements
    });
  };

  // -- Admin Management (Suppliers/Cost Centers/Personnel) --
  const handleAddSupplier = (name: string, phone: string, email: string, address: string) => {
     const newSup: Supplier = { id: crypto.randomUUID(), name, phone, email, address };
     setData(prev => ({ ...prev, suppliers: [...prev.suppliers, newSup] }));
  };
  const handleDeleteSupplier = (id: string) => {
     setData(prev => ({ ...prev, suppliers: prev.suppliers.filter(s => s.id !== id) }));
  };
  
  const handleAddCostCenter = (name: string, budget: number, area?: number) => {
     const newCenter: CostCenter = { id: crypto.randomUUID(), name, budget, area };
     setData(prev => ({ ...prev, costCenters: [...prev.costCenters, newCenter] }));
  };
  const handleDeleteCostCenter = (id: string) => {
     setData(prev => ({ ...prev, costCenters: prev.costCenters.filter(c => c.id !== id) }));
  };

  const handleAddPersonnel = (name: string, role: string) => {
      const newPer: Personnel = { id: crypto.randomUUID(), name, role };
      setData(prev => ({ ...prev, personnel: [...prev.personnel, newPer] }));
  };
  const handleDeletePersonnel = (id: string) => {
      setData(prev => ({ ...prev, personnel: prev.personnel.filter(p => p.id !== id) }));
  };

  // NEW: Activity Management
  const handleAddActivity = (name: string) => {
      const newAct: Activity = { id: crypto.randomUUID(), name };
      setData(prev => ({ ...prev, activities: [...(prev.activities || []), newAct] }));
  };
  const handleDeleteActivity = (id: string) => {
      setData(prev => ({ ...prev, activities: (prev.activities || []).filter(a => a.id !== id) }));
  };

  // NEW: Labor Logs Management
  const handleAddLaborLog = (logData: Omit<LaborLog, 'id'>) => {
      const newLog: LaborLog = { ...logData, id: crypto.randomUUID() };
      setData(prev => ({ ...prev, laborLogs: [...(prev.laborLogs || []), newLog] }));
      setShowLaborForm(false);
  };
  const handleDeleteLaborLog = (id: string) => {
      setData(prev => ({ ...prev, laborLogs: (prev.laborLogs || []).filter(l => l.id !== id) }));
  };


  // -- Data Restoration --
  const handleRestoreData = (newData: AppState) => {
    // 1. Sanitize Data BEFORE setting state
    let safeData = { ...newData };

    // Ensure warehouses exists
    if (!safeData.warehouses || safeData.warehouses.length === 0) {
        const id = crypto.randomUUID();
        safeData.warehouses = [{ id, name: 'Bodega Restaurada', created: new Date().toISOString() }];
        safeData.activeWarehouseId = id;
    }

    // Ensure activeWarehouseId is valid
    const activeExists = safeData.warehouses.find(w => w.id === safeData.activeWarehouseId);
    if (!activeExists) {
        safeData.activeWarehouseId = safeData.warehouses[0].id;
    }

    // Ensure arrays exist
    if (!safeData.activities) safeData.activities = [];
    if (!safeData.laborLogs) safeData.laborLogs = [];
    
    // 2. Commit to storage and state
    saveData(safeData);
    setData(safeData);
    
    // 3. Update security state based on restored data
    if (!safeData.adminPin) {
        setIsAdminUnlocked(true);
    } else {
        setIsAdminUnlocked(false);
    }
  };


  // -- Inventory Management --

  const handleAddItem = (newItem: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQty: number) => {
    const baseUnit = getBaseUnitType(newItem.lastPurchaseUnit);
    
    // Calculate initial stock in base units
    const initialStockBase = initialQty > 0 ? convertToBase(initialQty, newItem.lastPurchaseUnit) : 0;
    
    // Calculate initial average cost
    // Formula: PurchasePrice / QuantityOfBaseUnitsInPurchaseUnit
    const baseInPurchase = convertToBase(1, newItem.lastPurchaseUnit);
    const initialAvgCost = newItem.lastPurchasePrice / baseInPurchase;

    const itemId = crypto.randomUUID();

    const item: InventoryItem = {
      ...newItem, // newItem includes expirationDate if passed from form
      id: itemId,
      warehouseId: data.activeWarehouseId, // Assign to current warehouse
      currentQuantity: initialStockBase,
      baseUnit,
      averageCost: initialAvgCost
    };

    let newMovements = [...data.movements];

    if (initialQty > 0) {
      const cost = calculateCost(initialQty, newItem.lastPurchaseUnit, newItem.lastPurchasePrice, newItem.lastPurchaseUnit);
      
      const initMovement: Movement = {
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
      };
      newMovements = [initMovement, ...newMovements];
    }
    
    setData(prev => ({
      ...prev,
      inventory: [...prev.inventory, item],
      movements: newMovements
    }));
    setShowAddForm(false);
  };

  const handleRequestDelete = (id: string) => {
    if (!isAdminUnlocked) {
        setShowSecurityModal(true);
        return;
    }
    const item = data.inventory.find(i => i.id === id);
    if (item) {
      setItemToDelete({ id: item.id, name: item.name });
    }
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

  // --- CORE LOGIC: MOVEMENTS & WEIGHTED AVERAGE COST & EXPIRATION ---
  const handleAddMovement = (movData: Omit<Movement, 'id' | 'date' | 'warehouseId'>, newUnitPrice?: number, newExpirationDate?: string) => {
    const baseQuantity = convertToBase(movData.quantity, movData.unit);
    
    let calculatedMovementCost = 0;

    // Update inventory stock, Price and Expiration if applicable
    const updatedInventory = data.inventory.map(item => {
      if (item.id === movData.itemId) {
        let newQty = item.currentQuantity;
        let newAvgCost = item.averageCost;
        let newLastPrice = item.lastPurchasePrice;
        let newLastUnit = item.lastPurchaseUnit;
        let newExpDate = item.expirationDate; 

        if (movData.type === 'IN') {
           // --- ENTRADA (Update Average Cost) ---
           
           if (newUnitPrice !== undefined) {
             const baseInNewUnit = convertToBase(1, movData.unit);
             const costPerBaseIncoming = newUnitPrice / baseInNewUnit;
             calculatedMovementCost = baseQuantity * costPerBaseIncoming;

             newAvgCost = calculateWeightedAverageCost(
                item.currentQuantity,
                item.averageCost,
                movData.quantity,
                movData.unit,
                newUnitPrice
             );

             newLastPrice = newUnitPrice;
             newLastUnit = movData.unit;
             
             if (newExpirationDate) {
                newExpDate = newExpirationDate;
             }
           } else {
             calculatedMovementCost = baseQuantity * item.averageCost;
           }
           
           newQty += baseQuantity;

        } else {
           // --- SALIDA (Use Average Cost) ---
           calculatedMovementCost = baseQuantity * item.averageCost;
           newQty -= baseQuantity;
        }
        
        // Floating point fix
        if (newQty < 0.1) newQty = 0;

        return { 
          ...item, 
          currentQuantity: Math.max(0, newQty),
          lastPurchasePrice: newLastPrice,
          lastPurchaseUnit: newLastUnit,
          averageCost: newAvgCost,
          expirationDate: newExpDate
        };
      }
      return item;
    });

    const newMovement: Movement = {
      ...movData,
      id: crypto.randomUUID(),
      warehouseId: data.activeWarehouseId, 
      date: new Date().toISOString(),
      calculatedCost: calculatedMovementCost // Override with precise accounting cost
    };

    setData({
      ...data,
      inventory: updatedInventory,
      movements: [newMovement, ...data.movements]
    });
    setMovementModal(null);
  };

  const handleAuditAdjustment = (item: InventoryItem, realQty: number, notes: string) => {
    const diff = realQty - item.currentQuantity;
    if (diff === 0) return;

    const conversionFactor = convertToBase(1, item.lastPurchaseUnit);
    const diffInPurchaseUnits = Math.abs(diff) / conversionFactor;

    const type = diff > 0 ? 'IN' : 'OUT';
    
    const adjustmentMovement: Omit<Movement, 'id' | 'date' | 'warehouseId'> = {
        itemId: item.id,
        itemName: item.name,
        type: type,
        quantity: diffInPurchaseUnits,
        unit: item.lastPurchaseUnit,
        calculatedCost: 0, // Will be calc'd
        notes: notes
    };

    const costPerPurchaseUnit = item.averageCost * conversionFactor;

    handleAddMovement(adjustmentMovement, type === 'IN' ? costPerPurchaseUnit : undefined);
  };

  // Helper for Reports
  const getExportData = (): AppState => {
    return {
        ...data,
        inventory: activeInventory,
        movements: activeMovements
    };
  };

  if (view === 'landing') {
    return <Landing onEnter={() => setView('app')} onShowManual={() => setShowManual(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900 text-slate-900 dark:text-slate-100 font-sans transition-colors duration-300">
      {/* Header */}
      <header className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700 sticky top-0 z-30 px-3 py-2 transition-colors duration-300">
        <div className="max-w-4xl mx-auto space-y-2">
          
          {/* TOP ROW: Warehouse & Theme & DATA */}
          <div className="flex justify-between items-center">
             {/* Warehouse Selector */}
            <div 
                onClick={() => setShowWarehouses(true)}
                className="flex items-center gap-2 cursor-pointer group p-1 -ml-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700/50 transition-colors"
            >
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
                {/* ADMIN LOCK BUTTON */}
                <button
                    onClick={handleLock}
                    className={`p-1.5 rounded-lg transition-colors border ${isAdminUnlocked 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-transparent' 
                      : 'bg-red-50 dark:bg-red-900/20 text-red-500 border-red-200 dark:border-red-800'}`}
                    title={isAdminUnlocked ? "Sistema Desbloqueado" : "Sistema Protegido"}
                >
                    {isAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </button>

                {/* STANDALONE DATA BUTTON */}
                <button
                    onClick={() => {
                        if(!isAdminUnlocked) { setShowSecurityModal(true); return; }
                        setShowDataModal(true);
                    }}
                    className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1.5 ${
                        !isAdminUnlocked ? 'opacity-50 cursor-not-allowed bg-slate-200 dark:bg-slate-800 text-slate-400 border-transparent' : 
                        'bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-500 hover:bg-orange-100 border-orange-200 dark:border-orange-800'
                    }`}
                    title="Copias de Seguridad"
                >
                    <Database className="w-4 h-4" />
                    <span className="text-[10px] font-bold uppercase hidden sm:inline">Datos</span>
                </button>

                <button
                  onClick={toggleTheme}
                  className="p-2 text-slate-600 dark:text-slate-300 bg-slate-200/50 dark:bg-slate-700/50 rounded-lg hover:bg-slate-300/50 dark:hover:bg-slate-600/50 transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
            </div>
          </div>

          {/* SECOND ROW: Navigation Tabs */}
          <div className="flex bg-slate-200 dark:bg-slate-900/50 p-1 rounded-xl gap-1">
             <button 
                onClick={() => setCurrentTab('inventory')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    currentTab === 'inventory' 
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
             >
                <Package className="w-4 h-4" />
                <span className="hidden sm:inline">Inventario</span>
             </button>
             <button 
                onClick={() => setCurrentTab('labor')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    currentTab === 'labor' 
                    ? 'bg-white dark:bg-slate-700 text-amber-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
             >
                <Pickaxe className="w-4 h-4" />
                <span className="hidden sm:inline">Mano de Obra</span>
             </button>
             <button 
                onClick={() => setCurrentTab('stats')}
                className={`flex-1 px-2 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                    currentTab === 'stats' 
                    ? 'bg-white dark:bg-slate-700 text-purple-600 dark:text-white shadow-sm' 
                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                }`}
             >
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Estadísticas</span>
             </button>
          </div>

          {/* THIRD ROW: Critical Actions */}
          <div className="grid grid-cols-5 gap-2 pt-1">
             
             {/* MAIN CONFIG BUTTON */}
             <button 
               onClick={() => {
                  if (!isAdminUnlocked) {
                    setShowSecurityModal(true);
                    return;
                  }
                  setShowSettings(true);
               }}
               className={`col-span-2 text-white p-2 rounded-lg flex items-center justify-center gap-2 shadow-sm transition-all active:scale-95 ${
                 isAdminUnlocked ? 'bg-purple-600 hover:bg-purple-700' : 'bg-slate-400 cursor-not-allowed'
               }`}
               title={isAdminUnlocked ? "Gestionar Maestros" : "Requiere Desbloqueo"}
            >
              {isAdminUnlocked ? <Settings className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
              <span className="text-xs font-bold uppercase tracking-wide">Maestros</span>
            </button>
            
            {/* AUDIT */}
            <button 
               onClick={() => setShowAuditModal(true)}
               className="col-span-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800 p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
               title="Auditoría / Conteo Físico"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span className="text-[9px] font-bold hidden sm:inline">Auditoría</span>
              <span className="text-[9px] font-bold sm:hidden">Audit</span>
            </button>
            
            {/* EXPORT */}
            <button 
              onClick={() => setShowExport(true)}
              className="col-span-1 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
              title="Exportar Reportes"
            >
              <Download className="w-4 h-4" />
              <span className="text-[9px] font-bold hidden sm:inline">Reportes</span>
              <span className="text-[9px] font-bold sm:hidden">Reps</span>
            </button>

            {/* SUPPORT */}
            <button 
               onClick={() => setShowSupport(true)}
               className="col-span-1 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-600 dark:text-yellow-500 border border-yellow-200 dark:border-yellow-800 p-2 rounded-lg flex flex-col items-center justify-center gap-0.5 hover:bg-yellow-100 dark:hover:bg-yellow-900/40 transition-colors"
               title="Apoyar Proyecto"
            >
              <Gift className="w-4 h-4" />
              <span className="text-[9px] font-bold hidden sm:inline">Apoyar</span>
              <span className="text-[9px] font-bold sm:hidden">Gift</span>
            </button>

          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        {currentTab === 'inventory' && (
             <Dashboard 
                inventory={activeInventory} 
                onAddMovement={(item, type) => setMovementModal({ item, type })}
                onDelete={handleRequestDelete}
                onViewHistory={(item) => setHistoryModalItem(item)}
                isAdmin={isAdminUnlocked} // Pass admin state
            />
        )}
        
        {currentTab === 'labor' && (
             <LaborView 
                laborLogs={data.laborLogs || []}
                personnel={data.personnel}
                costCenters={data.costCenters}
                activities={data.activities || []}
                onAddLabor={() => {
                   if (!isAdminUnlocked) { setShowSecurityModal(true); return; }
                   setShowLaborForm(true);
                }}
                onDeleteLabor={handleDeleteLaborLog}
                isAdmin={isAdminUnlocked}
             />
        )}

        {currentTab === 'stats' && (
             <StatsView 
                movements={activeMovements}
                suppliers={data.suppliers}
                costCenters={data.costCenters}
                laborLogs={data.laborLogs} // Pass labor logs to stats
             />
        )}
      </main>

      {/* Floating Action Button - Context Aware */}
      {currentTab === 'inventory' && (
        <button 
            onClick={() => setShowAddForm(true)}
            className="fixed bottom-6 right-6 bg-emerald-600 hover:bg-emerald-700 text-white p-4 rounded-full shadow-lg shadow-emerald-600/30 transition-transform hover:scale-105 active:scale-95 z-30 flex items-center justify-center"
        >
            <Plus className="w-8 h-8" />
        </button>
      )}

      {/* Modals */}
      {showAddForm && (
        <InventoryForm 
          onSave={handleAddItem} 
          onCancel={() => setShowAddForm(false)} 
        />
      )}

      {/* New Labor Form */}
      {showLaborForm && (
        <LaborForm 
          personnel={data.personnel}
          costCenters={data.costCenters}
          activities={data.activities || []}
          onSave={handleAddLaborLog}
          onCancel={() => setShowLaborForm(false)}
          onOpenSettings={() => {
             setShowLaborForm(false);
             setShowSettings(true);
          }}
        />
      )}

      {movementModal && (
        <MovementModal 
          item={movementModal.item}
          type={movementModal.type}
          suppliers={data.suppliers}
          costCenters={data.costCenters}
          personnel={data.personnel} 
          movements={activeMovements} 
          onSave={handleAddMovement}
          onCancel={() => setMovementModal(null)}
        />
      )}

      {showSettings && (
        <SettingsModal 
          suppliers={data.suppliers}
          costCenters={data.costCenters}
          personnel={data.personnel} 
          activities={data.activities}
          onAddSupplier={handleAddSupplier}
          onDeleteSupplier={handleDeleteSupplier}
          onAddCostCenter={handleAddCostCenter}
          onDeleteCostCenter={handleDeleteCostCenter}
          onAddPersonnel={handleAddPersonnel}
          onDeletePersonnel={handleDeletePersonnel}
          onAddActivity={handleAddActivity}
          onDeleteActivity={handleDeleteActivity}
          onClose={() => setShowSettings(false)}
        />
      )}

      {showDataModal && (
        <DataModal 
          fullState={data}
          onRestoreData={handleRestoreData}
          onClose={() => setShowDataModal(false)}
        />
      )}

      {showAuditModal && (
        <AuditModal 
            inventory={activeInventory}
            onAdjust={handleAuditAdjustment}
            onClose={() => setShowAuditModal(false)}
        />
      )}
      
      {showSecurityModal && (
        <SecurityModal 
            existingPin={data.adminPin}
            onSuccess={handlePinSuccess}
            onClose={() => setShowSecurityModal(false)}
        />
      )}

      {showSupport && (
        <SupportModal onClose={() => setShowSupport(false)} />
      )}

      {showExport && (
        <ExportModal 
          onClose={() => setShowExport(false)}
          onExportPDF={() => {
            generatePDF(getExportData());
            setShowExport(false);
          }}
          onExportExcel={() => {
            generateExcel(getExportData());
            setShowExport(false);
          }}
          onGenerateOrder={() => {
            generateOrderPDF(getExportData());
            setShowExport(false);
          }}
        />
      )}

      {historyModalItem && (
        <HistoryModal 
          item={historyModalItem}
          movements={activeMovements.filter(m => m.itemId === historyModalItem.id)}
          onClose={() => setHistoryModalItem(null)}
        />
      )}

      {itemToDelete && (
        <DeleteModal 
          itemName={itemToDelete.name}
          onConfirm={executeDelete}
          onCancel={() => setItemToDelete(null)}
        />
      )}

      {showManual && (
        <ManualModal onClose={() => setShowManual(false)} />
      )}

      {showWarehouses && (
        <WarehouseModal 
          warehouses={data.warehouses}
          activeId={data.activeWarehouseId}
          onCreate={handleCreateWarehouse}
          onSwitch={handleSwitchWarehouse}
          onDelete={handleDeleteWarehouse}
          onClose={() => setShowWarehouses(false)}
          isAdmin={isAdminUnlocked} // PASSED ADMIN STATE TO WAREHOUSE MODAL
        />
      )}
    </div>
  );
}

export default App;