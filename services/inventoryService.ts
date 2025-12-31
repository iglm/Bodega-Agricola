
import { InventoryItem, Movement, Unit, AppState } from '../types';

const STORAGE_KEY = 'datosfinca_viva_v1_expert'; // Updated to DatosFinca Viva

export const generateId = () => Math.random().toString(36).substring(2, 15);

const CONVERSION_RATES: Record<string, number> = {
  [Unit.BULTO_50KG]: 50000, [Unit.KILO]: 1000, [Unit.GRAMO]: 1,
  [Unit.LITRO]: 1000, [Unit.MILILITRO]: 1, [Unit.GALON]: 3785.41, // NEW: Added Galón (1 US liquid gallon = 3785.41 ml)
  [Unit.UNIDAD]: 1
};

export const convertToBase = (qty: number, unit: Unit) => qty * CONVERSION_RATES[unit];

export const getBaseUnitType = (unit: Unit): 'g' | 'ml' | 'unit' => {
  if (unit === Unit.UNIDAD) return 'unit';
  if (unit === Unit.LITRO || unit === Unit.MILILITRO || unit === Unit.GALON) return 'ml'; // NEW: Included Galón
  return 'g';
};

export const getCostPerGramOrMl = (item: InventoryItem) => {
  return item.averageCost;
};

export const calculateCost = (qty: number, unit: Unit, avgCost: number) => {
  return convertToBase(qty, unit) * avgCost;
};

export const formatCurrency = (val: number) => 
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

export const formatBaseQuantity = (qty: number, type: string) => {
  if (type === 'unit') return `${qty} und`;
  if (type === 'g' && qty >= 1000) return `${(qty/1000).toFixed(2)} kg`;
  if (type === 'g') return `${qty.toFixed(0)} g`;
  if (type === 'ml' && qty >= 1000) return `${(qty/1000).toFixed(2)} L`;
  if (type === 'ml') return `${qty.toFixed(0)} ml`;
  return `${qty.toFixed(0)} ${type}`;
};

export const calculateWeightedAverageCost = (item: InventoryItem, incomingQty: number, incomingUnit: Unit, incomingPrice: number) => {
  const currentTotalVal = item.currentQuantity * item.averageCost;
  const incomingBaseQty = convertToBase(incomingQty, incomingUnit);
  const costPerBase = incomingPrice / convertToBase(1, incomingUnit);
  const incomingTotalVal = incomingBaseQty * costPerBase;
  const nextQty = item.currentQuantity + incomingBaseQty;
  return nextQty > 0 ? (currentTotalVal + incomingTotalVal) / nextQty : item.averageCost;
};

export const processInventoryMovement = (inventory: InventoryItem[], movement: Omit<Movement, 'id' | 'date' | 'warehouseId'>, newPrice?: number, newExpirationDate?: string) => {
  const itemIndex = inventory.findIndex(i => i.id === movement.itemId);
  if (itemIndex === -1) return { updatedInventory: inventory, movementCost: 0 };

  const updatedInventory = [...inventory];
  const item = { ...updatedInventory[itemIndex] };
  const baseQty = convertToBase(movement.quantity, movement.unit);
  let movementCost = 0;

  if (movement.type === 'IN') {
    const unitPrice = newPrice || item.lastPurchasePrice;
    movementCost = movement.quantity * unitPrice; 
    item.averageCost = calculateWeightedAverageCost(item, movement.quantity, movement.unit, unitPrice);
    item.currentQuantity += baseQty;
    item.lastPurchasePrice = unitPrice;
    item.lastPurchaseUnit = movement.unit;
    if (newExpirationDate) item.expirationDate = newExpirationDate;
  } else {
    movementCost = baseQty * item.averageCost;
    item.currentQuantity -= baseQty;
  }

  updatedInventory[itemIndex] = item;
  return { updatedInventory, movementCost };
};

// --- MIGRATION UTILITY ---
// Used only for the first-time bridge from LocalStorage to IndexedDB
export const loadDataFromLocalStorage = (): AppState => {
  const storedData = localStorage.getItem(STORAGE_KEY);
  let parsed: any = {};
  
  if (storedData) {
    try {
      parsed = JSON.parse(storedData);
    } catch (e) {
      console.error("Error parsing local storage data", e);
    }
  }

  const id = parsed.activeWarehouseId || generateId();
  
  return {
    warehouses: parsed.warehouses || [{ id, name: 'Finca Principal', created: new Date().toISOString(), ownerId: 'local_user' }], // Added default ownerId
    activeWarehouseId: id,
    inventory: parsed.inventory || [],
    movements: parsed.movements || [],
    suppliers: parsed.suppliers || [],
    costCenters: parsed.costCenters || [],
    personnel: parsed.personnel || [],
    activities: parsed.activities || [],
    laborLogs: parsed.laborLogs || [],
    harvests: parsed.harvests || [],
    machines: parsed.machines || [],
    maintenanceLogs: parsed.maintenanceLogs || [],
    rainLogs: parsed.rainLogs || [],
    financeLogs: parsed.financeLogs || [],
    soilAnalyses: parsed.soilAnalyses || [],
    ppeLogs: parsed.ppeLogs || [],
    wasteLogs: parsed.wasteLogs || [],
    agenda: parsed.agenda || [],
    phenologyLogs: parsed.phenologyLogs || [],
    pestLogs: parsed.pestLogs || [],
    plannedLabors: parsed.plannedLabors || [], // Inicializado para el programador
    laborFactor: parsed.laborFactor || 1.0,
    // adminPin: parsed.adminPin || undefined, // Removed adminPin
    swot: parsed.swot || {
      f: 'Experiencia técnica en el cultivo.',
      o: 'Demanda de productos orgánicos.',
      d: 'Costos de insumos elevados.',
      a: 'Cambio climático severo.'
    }, // REMOVED TRAILING COMMA HERE
    bpaChecklist: parsed.bpaChecklist || {},
    assets: parsed.assets || []
  };
};

// Legacy save - deprecated for main flow but kept for emergency fallbacks
export const saveDataToLocalStorage = (data: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving data to local storage", e);
  }
};
