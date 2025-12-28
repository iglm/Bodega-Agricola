import { InventoryItem, Movement, Unit, AppState, Warehouse } from '../types';

const STORAGE_KEY = 'agrobodega_pro_data_v1';

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

export const getCostPerGramOrMl = (item: InventoryItem): number => {
  if (item.averageCost && item.averageCost > 0) {
    return item.averageCost;
  }
  const basePurchase = convertToBase(1, item.lastPurchaseUnit);
  return item.lastPurchasePrice / basePurchase;
};

export const loadData = (): AppState => {
  try {
    const rawData = localStorage.getItem(STORAGE_KEY);
    if (rawData) {
      const parsed = JSON.parse(rawData);
      
      let migrated = { ...parsed };

      // 1. Multi-tenant structure migration
      if (!migrated.warehouses) {
        const defaultId = crypto.randomUUID();
        const defaultWarehouse: Warehouse = {
          id: defaultId,
          name: 'Bodega Principal',
          description: 'Bodega por defecto migrada',
          created: new Date().toISOString()
        };
        migrated.warehouses = [defaultWarehouse];
        migrated.activeWarehouseId = defaultId;
        migrated.inventory = (migrated.inventory || []).map((i: any) => ({ ...i, warehouseId: defaultId }));
        migrated.movements = (migrated.movements || []).map((m: any) => ({ ...m, warehouseId: defaultId }));
      }

      // 2. Admin Features Migration
      if (!migrated.suppliers) migrated.suppliers = [];
      if (!migrated.costCenters) migrated.costCenters = [];
      if (!migrated.personnel) migrated.personnel = [];

      // 3. Labor Module Migration
      if (!migrated.activities) {
          migrated.activities = [
            { id: crypto.randomUUID(), name: 'Guadaña / Plateo' },
            { id: crypto.randomUUID(), name: 'Fumigación' },
            { id: crypto.randomUUID(), name: 'Fertilización' },
            { id: crypto.randomUUID(), name: 'Cosecha' },
            { id: crypto.randomUUID(), name: 'Poda' },
          ];
      }
      if (!migrated.laborLogs) {
          migrated.laborLogs = [];
      } else {
          // PAYROLL MIGRATION: Ensure existing logs have 'paid' status (default to false if missing)
          migrated.laborLogs = migrated.laborLogs.map((l: any) => ({
              ...l,
              paid: l.paid !== undefined ? l.paid : false
          }));
      }

      // 4. Average Cost Migration
      migrated.inventory = migrated.inventory.map((item: any) => {
        if (item.averageCost === undefined) {
           const basePurchase = convertToBase(1, item.lastPurchaseUnit);
           const initialAvg = item.lastPurchasePrice / basePurchase;
           return { ...item, averageCost: initialAvg };
        }
        return item;
      });
      
      if (migrated.adminPin === undefined) migrated.adminPin = undefined; 

      // 5. NEW MODULES MIGRATION (Production, Agenda, Machinery, Rain)
      if (!migrated.harvests) migrated.harvests = [];
      if (!migrated.agenda) migrated.agenda = [];
      if (!migrated.machines) migrated.machines = [];
      if (!migrated.maintenanceLogs) migrated.maintenanceLogs = [];
      if (!migrated.rainLogs) migrated.rainLogs = [];

      return migrated;
    }
  } catch (e) {
    console.error("Error loading data", e);
  }

  const initId = crypto.randomUUID();
  return { 
    warehouses: [{ id: initId, name: 'Bodega Principal', created: new Date().toISOString() }],
    activeWarehouseId: initId,
    inventory: [], 
    movements: [],
    suppliers: [],
    costCenters: [],
    personnel: [],
    activities: [
        { id: crypto.randomUUID(), name: 'Guadaña / Plateo' },
        { id: crypto.randomUUID(), name: 'Fumigación' },
        { id: crypto.randomUUID(), name: 'Fertilización' },
        { id: crypto.randomUUID(), name: 'Cosecha' }
    ],
    laborLogs: [],
    harvests: [],
    agenda: [],
    machines: [],
    maintenanceLogs: [],
    rainLogs: []
  };
};

export const saveData = (data: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving data", e);
  }
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
