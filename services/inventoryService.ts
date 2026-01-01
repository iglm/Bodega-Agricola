
import { InventoryItem, Movement, Unit, AppState } from '../types';

const STORAGE_KEY = 'datosfinca_viva_v1_expert';

export const generateId = () => Math.random().toString(36).substring(2, 15);

const CONVERSION_RATES: Record<string, number> = {
  [Unit.BULTO_50KG]: 50000, [Unit.KILO]: 1000, [Unit.GRAMO]: 1,
  [Unit.LITRO]: 1000, [Unit.MILILITRO]: 1, [Unit.GALON]: 3785.41,
  [Unit.UNIDAD]: 1
};

export const convertToBase = (qty: number, unit: Unit) => qty * CONVERSION_RATES[unit];

export const getBaseUnitType = (unit: Unit): 'g' | 'ml' | 'unit' => {
  if (unit === Unit.UNIDAD) return 'unit';
  if (unit === Unit.LITRO || unit === Unit.MILILITRO || unit === Unit.GALON) return 'ml';
  return 'g';
};

export const getCostPerGramOrMl = (item: InventoryItem) => {
  return item.averageCost;
};

/**
 * Calcula cuánto vale una unidad comercial basada en el costo promedio base.
 * Ej: Si el gramo vale 2.4, y pedimos el precio de 1kg, retorna 2400.
 */
export const calculatePriceForUnit = (item: InventoryItem, unit: Unit) => {
  const baseQty = convertToBase(1, unit);
  return baseQty * item.averageCost;
};

export const formatCurrency = (val: number, decimals: number = 0) => 
  new Intl.NumberFormat('es-CO', { 
    style: 'currency', 
    currency: 'COP', 
    maximumFractionDigits: decimals,
    minimumFractionDigits: decimals 
  }).format(val);

export const formatBaseQuantity = (qty: number, type: string) => {
  if (type === 'unit') return `${qty} und`;
  if (type === 'g' && qty >= 50000) return `${(qty/50000).toFixed(2)} bultos (50kg)`;
  if (type === 'g' && qty >= 1000) return `${(qty/1000).toFixed(2)} kg`;
  if (type === 'g') return `${qty.toFixed(1)} g`;
  if (type === 'ml' && qty >= 1000) return `${(qty/1000).toFixed(2)} L`;
  if (type === 'ml') return `${qty.toFixed(1)} ml`;
  return `${qty.toFixed(1)} ${type}`;
};

export const calculateWeightedAverageCost = (item: InventoryItem, incomingQty: number, incomingUnit: Unit, incomingPrice: number) => {
  const currentTotalVal = item.currentQuantity * item.averageCost;
  const incomingBaseQty = convertToBase(incomingQty, incomingUnit);
  // El incomingPrice es el precio por la UNIDAD de compra (ej: precio del bulto)
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
    const unitPrice = newPrice !== undefined ? newPrice : item.lastPurchasePrice;
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
    warehouses: parsed.warehouses || [{ id, name: 'Bodega Principal', created: new Date().toISOString(), ownerId: 'local_user' }],
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
    plannedLabors: parsed.plannedLabors || [], 
    budgets: parsed.budgets || [],
    laborFactor: parsed.laborFactor || 1.0,
    swot: parsed.swot || {
      f: 'Control estricto de inventario.',
      o: 'Exportación de reportes Excel.',
      d: 'Costos variables de insumos.',
      a: 'Piratería de software.'
    }, 
    bpaChecklist: parsed.bpaChecklist || {},
    assets: parsed.assets || []
  };
};

export const saveDataToLocalStorage = (data: AppState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Error saving data to local storage", e);
  }
};
