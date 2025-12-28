
import { InventoryItem, Movement, Unit, AppState, Warehouse, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog } from '../types';

const STORAGE_KEY = 'agrobodega_pro_data_v1';
const DEBOUNCE_TIME = 500; // ms

// Temporizador interno para el debouncing
let saveTimeout: ReturnType<typeof setTimeout> | null = null;
let lastPendingData: AppState | null = null;

// Base conversion factors (to grams or milliliters)
const CONVERSION_RATES: Record<Unit, number> = {
  [Unit.BULTO_50KG]: 50000, 
  [Unit.KILO]: 1000,        
  [Unit.GRAMO]: 1,          
  [Unit.LITRO]: 1000,       
  [Unit.MILILITRO]: 1,      
  [Unit.UNIDAD]: 1          
};

const UNIT_TYPE: Record<Unit, 'g' | 'ml' | 'unit'> = {
  [Unit.BULTO_50KG]: 'g',
  [Unit.KILO]: 'g',
  [Unit.GRAMO]: 'g',
  [Unit.LITRO]: 'ml',
  [Unit.MILILITRO]: 'ml',
  [Unit.UNIDAD]: 'unit'
};

export const getBaseUnitType = (unit: Unit): 'g' | 'ml' | 'unit' => {
  return UNIT_TYPE[unit];
};

export const convertToBase = (quantity: number, unit: Unit): number => {
  return quantity * CONVERSION_RATES[unit];
};

export const calculateCost = (
  amountUsed: number, 
  unitUsed: Unit, 
  purchasePrice: number, 
  purchaseUnit: Unit
): number => {
  const baseUsed = convertToBase(amountUsed, unitUsed);
  const basePurchase = convertToBase(1, purchaseUnit); 
  
  const costPerBaseUnit = purchasePrice / basePurchase;
  
  return baseUsed * costPerBaseUnit;
};

export const calculateWeightedAverageCost = (
  currentQuantity: number,
  currentAvgCost: number,
  incomingQuantity: number,
  incomingUnit: Unit,
  incomingUnitPrice: number
): number => {
  const currentTotalValue = currentQuantity * currentAvgCost;
  const incomingBaseQuantity = convertToBase(incomingQuantity, incomingUnit);
  const baseInPurchaseUnit = convertToBase(1, incomingUnit);
  const costPerBaseIncoming = incomingUnitPrice / baseInPurchaseUnit; 
  const incomingTotalValue = incomingBaseQuantity * costPerBaseIncoming;
  const nextTotalQty = currentQuantity + incomingBaseQuantity;

  if (nextTotalQty <= 0) return currentAvgCost;
  
  return (currentTotalValue + incomingTotalValue) / nextTotalQty;
};

/**
 * Procesa un movimiento y devuelve el inventario actualizado y el costo calculado del movimiento.
 */
export const processInventoryMovement = (
  inventory: InventoryItem[],
  movData: Omit<Movement, 'id' | 'date' | 'warehouseId'>,
  newUnitPrice?: number,
  newExpirationDate?: string
): { updatedInventory: InventoryItem[], movementCost: number } => {
  const baseQuantity = convertToBase(movData.quantity, movData.unit);
  let movementCost = 0;

  const updatedInventory = inventory.map(item => {
    if (item.id === movData.itemId) {
      let nextQty = item.currentQuantity;
      let nextAvgCost = item.averageCost;
      let nextLastPrice = item.lastPurchasePrice;
      let nextLastUnit = item.lastPurchaseUnit;
      let nextExpDate = item.expirationDate;

      if (movData.type === 'IN') {
        if (newUnitPrice !== undefined) {
          nextAvgCost = calculateWeightedAverageCost(
            item.currentQuantity,
            item.averageCost,
            movData.quantity,
            movData.unit,
            newUnitPrice
          );
          nextLastPrice = newUnitPrice;
          nextLastUnit = movData.unit;
          const baseInPurchaseUnit = convertToBase(1, movData.unit);
          movementCost = baseQuantity * (newUnitPrice / baseInPurchaseUnit);
          if (newExpirationDate) nextExpDate = newExpirationDate;
        } else {
          movementCost = baseQuantity * item.averageCost;
        }
        nextQty += baseQuantity;
      } else {
        movementCost = baseQuantity * item.averageCost;
        nextQty -= baseQuantity;
      }

      if (nextQty < 0.0001) nextQty = 0;

      return {
        ...item,
        currentQuantity: nextQty,
        averageCost: nextAvgCost,
        lastPurchasePrice: nextLastPrice,
        lastPurchaseUnit: nextLastUnit,
        expirationDate: nextExpDate
      };
    }
    return item;
  });

  return { updatedInventory, movementCost };
};

export const getCostPerGramOrMl = (item: InventoryItem): number => {
  if (item.averageCost && item.averageCost > 0) {
    return item.averageCost;
  }
  const basePurchase = convertToBase(1, item.lastPurchaseUnit);
  return item.lastPurchasePrice / basePurchase;
};

/**
 * Persiste los datos de forma inmediata.
 * Útil para cierres de app o procesos críticos.
 */
export const saveDataNow = (data: AppState) => {
    if (saveTimeout) {
        clearTimeout(saveTimeout);
        saveTimeout = null;
    }
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        lastPendingData = null;
    } catch (e) {
        console.error("Error crítico guardando en localStorage", e);
    }
};

/**
 * Guarda datos con debouncing para evitar sobrecarga del hilo principal y del disco.
 */
export const saveData = (data: AppState) => {
  lastPendingData = data;
  
  if (saveTimeout) {
      clearTimeout(saveTimeout);
  }

  saveTimeout = setTimeout(() => {
    saveDataNow(data);
  }, DEBOUNCE_TIME);
};

export const loadData = (): AppState => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      let migrated = { ...parsed };

      // 1. Initialize Warehouses if missing (Migration V1)
      let defaultId = '';
      if (!migrated.warehouses || migrated.warehouses.length === 0) {
        defaultId = crypto.randomUUID();
        const defaultWarehouse: Warehouse = {
          id: defaultId,
          name: 'Finca Principal',
          description: 'Sede migrada por defecto',
          created: new Date().toISOString()
        };
        migrated.warehouses = [defaultWarehouse];
        migrated.activeWarehouseId = defaultId;
      } else {
        defaultId = migrated.activeWarehouseId || migrated.warehouses[0].id;
      }

      // 2. Initialize Arrays
      const arraysToFix = [
          'suppliers', 'costCenters', 'personnel', 'activities', 
          'laborLogs', 'harvests', 'agenda', 'machines', 
          'maintenanceLogs', 'rainLogs', 'financeLogs', 'inventory', 'movements'
      ];
      
      arraysToFix.forEach(key => {
          if (!migrated[key]) migrated[key] = [];
      });

      // 3. MULTI-FARM MIGRATION: Assign warehouseId to orphaned records
      const assignFarm = (item: any) => {
          if (!item.warehouseId) item.warehouseId = defaultId;
          return item;
      };

      arraysToFix.forEach(key => {
          migrated[key] = migrated[key].map(assignFarm);
      });

      // 4. Default Activities (if empty)
      if (migrated.activities.length === 0) {
          migrated.activities = [
            { id: crypto.randomUUID(), warehouseId: defaultId, name: 'Guadaña / Plateo' },
            { id: crypto.randomUUID(), warehouseId: defaultId, name: 'Fumigación' },
            { id: crypto.randomUUID(), warehouseId: defaultId, name: 'Fertilización' },
            { id: crypto.randomUUID(), warehouseId: defaultId, name: 'Cosecha' },
            { id: crypto.randomUUID(), warehouseId: defaultId, name: 'Poda' },
          ];
      }

      return migrated;
    }
  } catch (e) {
    console.error("Error loading data from storage. Possible corruption.", e);
  }

  // Fallback to initial state
  const initId = crypto.randomUUID();
  return { 
    warehouses: [{ id: initId, name: 'Finca Principal', created: new Date().toISOString() }],
    activeWarehouseId: initId,
    inventory: [], 
    movements: [],
    suppliers: [],
    costCenters: [],
    personnel: [],
    activities: [
        { id: crypto.randomUUID(), warehouseId: initId, name: 'Guadaña / Plateo' },
        { id: crypto.randomUUID(), warehouseId: initId, name: 'Fumigación' },
        { id: crypto.randomUUID(), warehouseId: initId, name: 'Fertilización' },
        { id: crypto.randomUUID(), warehouseId: initId, name: 'Cosecha' }
    ],
    laborLogs: [],
    harvests: [],
    agenda: [],
    machines: [],
    maintenanceLogs: [],
    rainLogs: [],
    financeLogs: []
  };
};

export const formatCurrency = (val: number) => {
  return new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);
};

export const formatBaseQuantity = (qty: number, type: 'g' | 'ml' | 'unit'): string => {
  if (type === 'unit') return `${qty} und`;
  if (type === 'g') {
    if (qty >= 50000) return `${(qty / 50000).toFixed(2)} Bultos`;
    if (qty >= 1000) return `${(qty / 1000).toFixed(2)} kg`;
    return `${qty.toFixed(0)} g`;
  }
  if (type === 'ml') {
    if (qty >= 1000) return `${(qty / 1000).toFixed(2)} L`;
    return `${qty.toFixed(0)} ml`;
  }
  return `${qty}`;
};
