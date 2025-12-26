import { InventoryItem, Movement, Unit, AppState, Warehouse } from '../types';

const STORAGE_KEY = 'agrobodega_pro_data_v1';

// Base conversion factors (to grams or milliliters)
const CONVERSION_RATES: Record<Unit, number> = {
  [Unit.BULTO_50KG]: 50000, // 50kg = 50,000g
  [Unit.KILO]: 1000,        // 1kg = 1,000g
  [Unit.GRAMO]: 1,          // 1g = 1g
  [Unit.LITRO]: 1000,       // 1L = 1,000ml
  [Unit.MILILITRO]: 1,      // 1ml = 1ml
  [Unit.UNIDAD]: 1          // 1 unit
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
  const basePurchase = convertToBase(1, purchaseUnit); // How much base is in 1 purchase unit
  
  const costPerBaseUnit = purchasePrice / basePurchase;
  
  return baseUsed * costPerBaseUnit;
};

// NEW: Calculate Weighted Average Cost (CPP)
export const calculateWeightedAverageCost = (
  currentQuantity: number,
  currentAvgCost: number,
  incomingQuantity: number,
  incomingUnit: Unit,
  incomingUnitPrice: number
): number => {
  // 1. Current Total Value in Bodega
  const currentTotalValue = currentQuantity * currentAvgCost;
  
  // 2. Incoming Total Value
  const incomingBaseQuantity = convertToBase(incomingQuantity, incomingUnit);
  const baseInPurchaseUnit = convertToBase(1, incomingUnit);
  const costPerBaseIncoming = incomingUnitPrice / baseInPurchaseUnit; // Price per gram/ml of the new batch
  const incomingTotalValue = incomingBaseQuantity * costPerBaseIncoming;

  // 3. New Total Quantity
  const nextTotalQty = currentQuantity + incomingBaseQuantity;

  // 4. New Average Cost (Weighted)
  if (nextTotalQty <= 0) return currentAvgCost;
  
  return (currentTotalValue + incomingTotalValue) / nextTotalQty;
};

// Updated: Now relies on averageCost if available, fallback to last purchase
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
      
      // MIGRATION LOGIC
      let migrated = { ...parsed };

      // 1. Multi-tenant structure migration
      if (!migrated.warehouses) {
        console.log("Migrating data to multi-tenant structure...");
        const defaultId = crypto.randomUUID();
        const defaultWarehouse: Warehouse = {
          id: defaultId,
          name: 'Bodega Principal',
          description: 'Bodega por defecto migrada',
          created: new Date().toISOString()
        };
        
        migrated.warehouses = [defaultWarehouse];
        migrated.activeWarehouseId = defaultId;
        
        migrated.inventory = (migrated.inventory || []).map((i: any) => ({
          ...i,
          warehouseId: defaultId
        }));
        
        migrated.movements = (migrated.movements || []).map((m: any) => ({
          ...m,
          warehouseId: defaultId
        }));
      }

      // 2. Admin Features Migration (Suppliers/CostCenters/Personnel)
      if (!migrated.suppliers) migrated.suppliers = [];
      if (!migrated.costCenters) migrated.costCenters = [];
      if (!migrated.personnel) migrated.personnel = [];

      // 3. Labor Module Migration (NEW)
      if (!migrated.activities) {
          // Default activities
          const id = crypto.randomUUID();
          migrated.activities = [
            { id: crypto.randomUUID(), name: 'Guadaña / Plateo' },
            { id: crypto.randomUUID(), name: 'Fumigación' },
            { id: crypto.randomUUID(), name: 'Fertilización' },
            { id: crypto.randomUUID(), name: 'Cosecha' },
            { id: crypto.randomUUID(), name: 'Poda' },
          ];
      }
      if (!migrated.laborLogs) migrated.laborLogs = [];

      // 4. Average Cost Migration
      // If items exist without averageCost, calculate it based on lastPurchasePrice
      migrated.inventory = migrated.inventory.map((item: any) => {
        if (item.averageCost === undefined) {
           const basePurchase = convertToBase(1, item.lastPurchaseUnit);
           const initialAvg = item.lastPurchasePrice / basePurchase;
           return { ...item, averageCost: initialAvg };
        }
        return item;
      });
      
      // 5. Admin PIN migration (keep undefined if not set)
      if (migrated.adminPin === undefined) {
          migrated.adminPin = undefined; 
      }

      return migrated;
    }
  } catch (e) {
    console.error("Error loading data", e);
  }

  // Default empty state
  const initId = crypto.randomUUID();
  return { 
    warehouses: [{
      id: initId,
      name: 'Bodega Principal',
      created: new Date().toISOString()
    }],
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
    laborLogs: []
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