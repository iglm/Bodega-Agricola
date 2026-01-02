
import React, { createContext, useContext, useState, useEffect } from 'react';
import { AppState, CostCenter, InventoryItem, BudgetPlan, PlannedLabor, Unit } from '../types';
import { dbService } from '../services/db';
import { loadDataFromLocalStorage, saveDataToLocalStorage } from '../services/inventoryService';
import { useAppActions } from '../hooks/useAppActions';

interface DataContextType {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
  isDataLoaded: boolean;
  actions: {
    loadDemoData: () => void;
    deleteCostCenter: (id: string) => void;
    deletePersonnel: (id: string) => void;
    deleteActivity: (id: string) => void;
    saveNewItem: (item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails?: any, initialUnit?: Unit) => void;
    addPlannedLabor: (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => void;
    updateCostCenter: (lot: CostCenter) => void;
    saveBudget: (budget: BudgetPlan) => void;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode, notify: (msg: string, type: 'success' | 'error') => void }> = ({ children, notify }) => {
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [data, setData] = useState<AppState>(() => ({
      warehouses: [], activeWarehouseId: '', inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], plannedLabors: [], budgets: [], assets: [], bpaChecklist: {}, laborFactor: 1.0
  }));

  // Lógica de negocio extraída a un hook personalizado
  const actions = useAppActions(data, setData, notify);

  // Carga Inicial
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

  // Persistencia Automática
  useEffect(() => {
    if (!isDataLoaded || !data.activeWarehouseId) return;
    saveDataToLocalStorage(data);
    dbService.saveState(data).catch(err => console.warn("Guardado asíncrono:", err));
  }, [data, isDataLoaded]);

  return (
    <DataContext.Provider value={{ data, setData, isDataLoaded, actions }}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
