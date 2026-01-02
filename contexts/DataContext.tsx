
import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { AppState, CostCenter, InventoryItem, BudgetPlan, PlannedLabor, Unit, InitialMovementDetails } from '../types';
import { dbService } from '../services/db';
import { loadDataFromLocalStorage, saveDataToLocalStorage } from '../services/inventoryService';
import { useAppActions } from '../hooks/useAppActions';
import { useNotification } from './NotificationContext';

interface DataContextType {
  data: AppState;
  setData: React.Dispatch<React.SetStateAction<AppState>>;
  isDataLoaded: boolean;
  actions: {
    loadDemoData: () => void;
    deleteCostCenter: (id: string) => void;
    deletePersonnel: (id: string) => void;
    deleteActivity: (id: string) => void;
    saveNewItem: (item: Omit<InventoryItem, 'id' | 'currentQuantity' | 'baseUnit' | 'warehouseId' | 'averageCost'>, initialQuantity: number, initialMovementDetails?: InitialMovementDetails, initialUnit?: Unit) => void;
    addPlannedLabor: (labor: Omit<PlannedLabor, 'id' | 'warehouseId' | 'completed'>) => void;
    updateCostCenter: (lot: CostCenter) => void;
    saveBudget: (budget: BudgetPlan) => void;
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { showNotification } = useNotification();
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [data, setData] = useState<AppState>(() => ({
      warehouses: [], activeWarehouseId: '', inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], plannedLabors: [], budgets: [], assets: [], bpaChecklist: {}, laborFactor: 1.0
  }));

  // Lógica de negocio extraída a un hook personalizado, usando la notificación del contexto
  const actions = useAppActions(data, setData, showNotification);

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

  // Persistencia Automática Optimizada con Debounce
  useEffect(() => {
    if (!isDataLoaded || !data.activeWarehouseId) return;

    // Utilizamos un timer para evitar escrituras excesivas en disco (Debounce de 1000ms)
    const timeoutId = setTimeout(() => {
        // 1. Guardado Asíncrono (IndexedDB): Siempre ocurre, no bloquea la UI.
        dbService.saveState(data).catch(err => console.warn("Guardado asíncrono:", err));

        // 2. Guardado Síncrono (LocalStorage): Solo si NO se ha migrado.
        // Evitamos JSON.stringify masivo si ya estamos en IDB.
        const isMigrated = localStorage.getItem('MIGRATION_COMPLETED') === 'true';
        if (!isMigrated) {
            saveDataToLocalStorage(data);
        }
    }, 1000);

    // Limpieza: Si data cambia antes de 1000ms, cancelamos el guardado anterior
    return () => clearTimeout(timeoutId);
  }, [data, isDataLoaded]);

  const contextValue = useMemo(() => ({
    data,
    setData,
    isDataLoaded,
    actions
  }), [data, isDataLoaded, actions]);

  return (
    <DataContext.Provider value={contextValue}>
      {children}
    </DataContext.Provider>
  );
};

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};
