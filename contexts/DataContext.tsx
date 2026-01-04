
import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { 
  AppState, CostCenter, InventoryItem, NewInventoryItem, BudgetPlan, PlannedLabor, Unit, 
  InitialMovementDetails, Movement, Supplier, Personnel, Activity, 
  HarvestLog, RainLog, FinanceLog, SoilAnalysis, PPELog, WasteLog, 
  AgendaEvent, PhenologyLog, PestLog, Asset, Client, SalesContract, Sale, LaborLog, LaborInput,
  Warehouse, SWOT, CostClassification 
} from '../types';
import { generateId, processInventoryMovement, getBaseUnitType } from '../services/inventoryService';
import { getDemoData } from '../services/reportService';
import { useNotification } from './NotificationContext';
import { persistenceManager } from '../services/PersistenceManager';

// --- INTERFACES DE ACCIÓN ESTRICTAS ---

interface DataActions {
  loadDemoData: () => void;
  deleteCostCenter: (id: string) => void;
  deletePersonnel: (id: string) => void;
  deleteActivity: (id: string) => void;
  saveNewItem: (item: NewInventoryItem, qty: number, details?: InitialMovementDetails, unit?: Unit) => void;
  addLaborLog: (log: LaborInput) => void;
  addPlannedLabor: (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => void;
  updateCostCenter: (lot: CostCenter) => void;
  saveBudget: (budget: BudgetPlan) => void;
}

interface CoreContextType {
  warehouses: Warehouse[];
  activeWarehouseId: string;
  laborFactor: number;
  swot?: SWOT;
  setCore: (update: any) => void;
}

interface InventoryContextType {
  inventory: InventoryItem[];
  movements: Movement[];
  suppliers: Supplier[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  setMovements: React.Dispatch<React.SetStateAction<Movement[]>>;
  setSuppliers: React.Dispatch<React.SetStateAction<Supplier[]>>;
  actions: { 
    saveNewItem: (item: NewInventoryItem, qty: number, details?: InitialMovementDetails, unit?: Unit) => void 
  };
}

interface OperationsContextType {
  costCenters: CostCenter[];
  personnel: Personnel[];
  activities: Activity[];
  laborLogs: LaborLog[];
  harvests: HarvestLog[];
  rainLogs: RainLog[];
  pestLogs: PestLog[];
  phenologyLogs: PhenologyLog[];
  plannedLabors: PlannedLabor[];
  bpaChecklist: Record<string, boolean>;
  agenda: AgendaEvent[];
  ppeLogs: PPELog[];
  wasteLogs: WasteLog[];
  soilAnalyses: SoilAnalysis[];
  setOps: {
    setCostCenters: React.Dispatch<React.SetStateAction<CostCenter[]>>;
    setPersonnel: React.Dispatch<React.SetStateAction<Personnel[]>>;
    setActivities: React.Dispatch<React.SetStateAction<Activity[]>>;
    setLaborLogs: React.Dispatch<React.SetStateAction<LaborLog[]>>;
    setHarvests: React.Dispatch<React.SetStateAction<HarvestLog[]>>;
    setPlannedLabors: React.Dispatch<React.SetStateAction<PlannedLabor[]>>;
    setBpaChecklist: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
    setRainLogs: React.Dispatch<React.SetStateAction<RainLog[]>>;
    setPestLogs: React.Dispatch<React.SetStateAction<PestLog[]>>;
    setPhenologyLogs: React.Dispatch<React.SetStateAction<PhenologyLog[]>>;
    setAgenda: React.Dispatch<React.SetStateAction<AgendaEvent[]>>;
    setPPELogs: React.Dispatch<React.SetStateAction<PPELog[]>>;
    setWasteLogs: React.Dispatch<React.SetStateAction<WasteLog[]>>;
    setSoilAnalyses: React.Dispatch<React.SetStateAction<SoilAnalysis[]>>;
  };
}

interface FinancialContextType {
  budgets: BudgetPlan[];
  assets: Asset[];
  financeLogs: FinanceLog[];
  clients: Client[];
  salesContracts: SalesContract[];
  sales: Sale[];
  setFinancial: {
    setBudgets: React.Dispatch<React.SetStateAction<BudgetPlan[]>>;
    setFinanceLogs: React.Dispatch<React.SetStateAction<FinanceLog[]>>;
    setAssets: React.Dispatch<React.SetStateAction<Asset[]>>;
  };
}

const CoreContext = createContext<CoreContextType | undefined>(undefined);
const InventoryContext = createContext<InventoryContextType | undefined>(undefined);
const OperationsContext = createContext<OperationsContextType | undefined>(undefined);
const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

const PersistenceWatcher: React.FC = () => {
  const core = useCore();
  const inv = useInventory();
  const ops = useOperations();
  const fin = useFinancial();

  useEffect(() => {
    const consolidatedState: AppState = {
      warehouses: core.warehouses,
      activeWarehouseId: core.activeWarehouseId,
      laborFactor: core.laborFactor,
      swot: core.swot,
      inventory: inv.inventory,
      movements: inv.movements,
      suppliers: inv.suppliers,
      costCenters: ops.costCenters,
      personnel: ops.personnel,
      activities: ops.activities,
      laborLogs: ops.laborLogs,
      harvests: ops.harvests,
      rainLogs: ops.rainLogs,
      pestLogs: ops.pestLogs,
      phenologyLogs: ops.phenologyLogs,
      plannedLabors: ops.plannedLabors,
      bpaChecklist: ops.bpaChecklist,
      agenda: ops.agenda,
      ppeLogs: ops.ppeLogs,
      wasteLogs: ops.wasteLogs,
      soilAnalyses: ops.soilAnalyses,
      budgets: fin.budgets,
      assets: fin.assets,
      financeLogs: fin.financeLogs,
      clients: fin.clients,
      salesContracts: fin.salesContracts,
      sales: fin.sales,
      machines: [], 
      maintenanceLogs: []
    };
    
    persistenceManager.saveDebounced(consolidatedState);
  }, [core, inv, ops, fin]);

  return null;
};

export const DataProvider: React.FC<{ children: React.ReactNode; onError?: (error: any) => void }> = ({ children, onError }) => {
  const { showNotification } = useNotification();
  const [isLoaded, setIsLoaded] = useState(false);

  const [coreState, setCoreState] = useState<any>(null);
  const [inventoryState, setInventoryState] = useState<InventoryItem[]>([]);
  const [movementsState, setMovementsState] = useState<Movement[]>([]);
  const [suppliersState, setSuppliersState] = useState<Supplier[]>([]);
  const [opsState, setOpsState] = useState<any>(null);
  const [finState, setFinState] = useState<any>(null);

  useEffect(() => {
    const init = async () => {
      try {
        const data = await persistenceManager.loadInitialState();
        
        setCoreState({ 
          warehouses: data.warehouses, 
          activeWarehouseId: data.activeWarehouseId, 
          laborFactor: data.laborFactor, 
          swot: data.swot 
        });
        setInventoryState(data.inventory);
        setMovementsState(data.movements);
        setSuppliersState(data.suppliers);
        
        setOpsState({
          costCenters: data.costCenters,
          personnel: data.personnel,
          activities: data.activities,
          laborLogs: data.laborLogs,
          harvests: data.harvests,
          rainLogs: data.rainLogs,
          pestLogs: data.pestLogs,
          phenologyLogs: data.phenologyLogs,
          plannedLabors: data.plannedLabors,
          bpaChecklist: data.bpaChecklist,
          agenda: data.agenda,
          ppeLogs: data.ppeLogs,
          wasteLogs: data.wasteLogs,
          soilAnalyses: data.soilAnalyses
        });

        setFinState({
          budgets: data.budgets,
          assets: data.assets,
          financeLogs: data.financeLogs,
          clients: data.clients,
          salesContracts: data.salesContracts,
          sales: data.sales
        });

        setIsLoaded(true);
      } catch (err) {
        if (onError) onError(err);
      }
    };
    init();
  }, [onError]);

  const saveNewItem = useCallback((item: NewInventoryItem, initialQuantity: number, details: InitialMovementDetails | undefined, initialUnit?: Unit) => {
    const baseUnit = getBaseUnitType(item.lastPurchaseUnit);
    const newItem: InventoryItem = { 
      ...item, 
      id: generateId(), 
      warehouseId: coreState.activeWarehouseId, 
      baseUnit: baseUnit, 
      currentQuantity: 0, 
      averageCost: 0 
    };
    
    setInventoryState(prev => {
      let updatedInv = [...prev, newItem];
      if (initialQuantity > 0 && initialUnit) {
        const { updatedInventory: finalInv, movementCost } = processInventoryMovement(updatedInv, {
          itemId: newItem.id, itemName: newItem.name, type: 'IN', quantity: initialQuantity, unit: initialUnit, calculatedCost: 0,
          supplierId: details?.supplierId, supplierName: suppliersState.find(s => s.id === details?.supplierId)?.name,
          invoiceNumber: details?.invoiceNumber, invoiceImage: details?.invoiceImage, notes: 'Saldo inicial'
        } as any, item.lastPurchasePrice);
        
        setMovementsState(mPrev => [{
          id: generateId(), warehouseId: coreState.activeWarehouseId, date: new Date().toISOString(),
          itemId: newItem.id, itemName: newItem.name, type: 'IN', quantity: initialQuantity, unit: initialUnit,
          calculatedCost: movementCost, supplierId: details?.supplierId, supplierName: suppliersState.find(s => s.id === details?.supplierId)?.name
        } as any, ...mPrev]);
        
        return finalInv;
      }
      return updatedInv;
    });
    showNotification('Producto creado correctamente.', 'success');
  }, [coreState?.activeWarehouseId, suppliersState, showNotification]);

  const coreValue = useMemo(() => ({
    ...coreState,
    setCore: (update: any) => setCoreState((prev: any) => ({ ...prev, ...(typeof update === 'function' ? update(prev) : update) }))
  }), [coreState]);

  const inventoryValue = useMemo(() => ({
    inventory: inventoryState,
    movements: movementsState,
    suppliers: suppliersState,
    setInventory: setInventoryState,
    setMovements: setMovementsState,
    setSuppliers: setSuppliersState,
    actions: { saveNewItem }
  }), [inventoryState, movementsState, suppliersState, saveNewItem]);

  const opsValue = useMemo(() => ({
    ...opsState,
    setOps: {
      setCostCenters: (val: any) => setOpsState((p: any) => ({ ...p, costCenters: typeof val === 'function' ? val(p.costCenters) : val })),
      setPersonnel: (val: any) => setOpsState((p: any) => ({ ...p, personnel: typeof val === 'function' ? val(p.personnel) : val })),
      setActivities: (val: any) => setOpsState((p: any) => ({ ...p, activities: typeof val === 'function' ? val(p.activities) : val })),
      setLaborLogs: (val: any) => setOpsState((p: any) => ({ ...p, laborLogs: typeof val === 'function' ? val(p.laborLogs) : val })),
      setHarvests: (val: any) => setOpsState((p: any) => ({ ...p, harvests: typeof val === 'function' ? val(p.harvests) : val })),
      setPlannedLabors: (val: any) => setOpsState((p: any) => ({ ...p, plannedLabors: typeof val === 'function' ? val(p.plannedLabors) : val })),
      setBpaChecklist: (val: any) => setOpsState((p: any) => ({ ...p, bpaChecklist: typeof val === 'function' ? val(p.bpaChecklist) : val })),
      setRainLogs: (val: any) => setOpsState((p: any) => ({ ...p, rainLogs: typeof val === 'function' ? val(p.rainLogs) : val })),
      setPestLogs: (val: any) => setOpsState((p: any) => ({ ...p, pestLogs: typeof val === 'function' ? val(p.pestLogs) : val })),
      setPhenologyLogs: (val: any) => setOpsState((p: any) => ({ ...p, phenologyLogs: typeof val === 'function' ? val(p.phenologyLogs) : val })),
      setAgenda: (val: any) => setOpsState((p: any) => ({ ...p, agenda: typeof val === 'function' ? val(p.agenda) : val })),
      setPPELogs: (val: any) => setOpsState((p: any) => ({ ...p, ppeLogs: typeof val === 'function' ? val(p.ppeLogs) : val })),
      setWasteLogs: (val: any) => setOpsState((p: any) => ({ ...p, wasteLogs: typeof val === 'function' ? val(p.wasteLogs) : val })),
      setSoilAnalyses: (val: any) => setOpsState((p: any) => ({ ...p, soilAnalyses: typeof val === 'function' ? val(p.soilAnalyses) : val })),
    }
  }), [opsState]);

  const financialValue = useMemo(() => ({
    ...finState,
    setFinancial: {
      setBudgets: (val: any) => setFinState((p: any) => ({ ...p, budgets: typeof val === 'function' ? val(p.budgets) : val })),
      setFinanceLogs: (val: any) => setFinState((p: any) => ({ ...p, financeLogs: typeof val === 'function' ? val(p.financeLogs) : val })),
      setAssets: (val: any) => setFinState((p: any) => ({ ...p, assets: typeof val === 'function' ? val(p.assets) : val })),
    }
  }), [finState]);

  if (!isLoaded) return null;

  return (
    <CoreContext.Provider value={coreValue}>
      <InventoryContext.Provider value={inventoryValue}>
        <OperationsContext.Provider value={opsValue}>
          <FinancialContext.Provider value={financialValue}>
            <PersistenceWatcher />
            {children}
          </FinancialContext.Provider>
        </OperationsContext.Provider>
      </InventoryContext.Provider>
    </CoreContext.Provider>
  );
};

export const useCore = () => {
  const context = useContext(CoreContext);
  if (!context) throw new Error('useCore must be used within DataProvider');
  return context;
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) throw new Error('useInventory must be used within DataProvider');
  return context;
};

export const useOperations = () => {
  const context = useContext(OperationsContext);
  if (!context) throw new Error('useOperations must be used within DataProvider');
  return context;
};

export const useFinancial = () => {
  const context = useContext(FinancialContext);
  if (!context) throw new Error('useFinancial must be used within DataProvider');
  return context;
};

export const useData = () => {
  const core = useCore();
  const inv = useInventory();
  const ops = useOperations();
  const fin = useFinancial();
  const { showNotification } = useNotification();

  const data = useMemo(() => ({
    ...core, ...inv, ...ops, ...fin
  } as unknown as AppState), [core, inv, ops, fin]);

  const setData = useCallback((update: any) => {
    const nextState = typeof update === 'function' ? update(data) : update;
    
    core.setCore({
      warehouses: nextState.warehouses,
      activeWarehouseId: nextState.activeWarehouseId,
      laborFactor: nextState.laborFactor,
      swot: nextState.swot
    });

    inv.setInventory(nextState.inventory);
    inv.setMovements(nextState.movements);
    inv.setSuppliers(nextState.suppliers);

    ops.setOps.setCostCenters(nextState.costCenters);
    ops.setOps.setPersonnel(nextState.personnel);
    ops.setOps.setActivities(nextState.activities);
    ops.setOps.setLaborLogs(nextState.laborLogs);
    ops.setOps.setHarvests(nextState.harvests);
    ops.setOps.setPlannedLabors(nextState.plannedLabors);
    ops.setOps.setBpaChecklist(nextState.bpaChecklist);
    
    if (nextState.rainLogs) ops.setOps.setRainLogs(nextState.rainLogs);
    if (nextState.pestLogs) ops.setOps.setPestLogs(nextState.pestLogs);
    if (nextState.phenologyLogs) ops.setOps.setPhenologyLogs(nextState.phenologyLogs);
    if (nextState.agenda) ops.setOps.setAgenda(nextState.agenda);
    if (nextState.ppeLogs) ops.setOps.setPPELogs(nextState.ppeLogs);
    if (nextState.wasteLogs) ops.setOps.setWasteLogs(nextState.wasteLogs);
    if (nextState.soilAnalyses) ops.setOps.setSoilAnalyses(nextState.soilAnalyses);
    
    fin.setFinancial.setBudgets(nextState.budgets);
    fin.setFinancial.setFinanceLogs(nextState.financeLogs);
    fin.setFinancial.setAssets(nextState.assets);
  }, [data, core, inv, ops, fin]);

  const actions: DataActions = useMemo(() => ({
    loadDemoData: () => {
        const demo = getDemoData();
        core.setCore({ activeWarehouseId: demo.activeWarehouseId, laborFactor: demo.laborFactor, warehouses: demo.warehouses });
        inv.setInventory(demo.inventory);
        inv.setMovements(demo.movements);
        inv.setSuppliers(demo.suppliers);
        ops.setOps.setCostCenters(demo.costCenters);
        ops.setOps.setPersonnel(demo.personnel);
        ops.setOps.setActivities(demo.activities);
        showNotification('Demo cargada correctamente', 'success');
    },
    deleteCostCenter: (id) => ops.setOps.setCostCenters(prev => prev.filter(c => c.id !== id)),
    deletePersonnel: (id) => ops.setOps.setPersonnel(prev => prev.filter(p => p.id !== id)),
    deleteActivity: (id) => ops.setOps.setActivities(prev => prev.filter(a => a.id !== id)),
    saveNewItem: inv.actions.saveNewItem,
    addLaborLog: (log) => ops.setOps.setLaborLogs(prev => [...prev, { ...log, id: generateId(), warehouseId: core.activeWarehouseId, paid: false }]),
    addPlannedLabor: (l) => ops.setOps.setPlannedLabors(prev => [...prev, { ...l, id: generateId(), warehouseId: core.activeWarehouseId, completed: false }]),
    updateCostCenter: (lot) => ops.setOps.setCostCenters(prev => prev.map(c => c.id === lot.id ? lot : c)),
    saveBudget: (b) => fin.setFinancial.setBudgets(prev => [...prev.filter(x => x.id !== b.id), b])
  }), [core, inv, ops, fin, showNotification]);

  return { data, setData, isDataLoaded: true, actions };
};
