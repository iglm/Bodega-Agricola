
import { InventoryItem, Movement, Unit, AppState } from '../types';

export const STORAGE_KEY = 'agrobodega_pro_v1';

export const generateId = (): string => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

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

export const formatNumberInput = (val: string | number | undefined | null): string => {
  if (val === undefined || val === null || val === '') return '';
  let s = val.toString().replace(/['\s]/g, ''); // Remove spaces and quotes
  // Check if it's a simple decimal like "0.5" or "1.5" to avoid formatting it as "5" or "15"
  if (s.includes('.') && !s.includes(',') && s.split('.')[1].length <= 2 && parseFloat(s) < 1000) {
      return s.replace('.', ','); // Display as comma for Spanish locale
  }
  
  s = s.replace('.', ''); // Remove dots for standard currency formatting
  const parts = s.split(',');
  let intStr = parts[0].replace(/\D/g, ''); 
  let decStr = parts.length > 1 ? ',' + parts[1].replace(/\D/g, '').slice(0, 2) : '';
  if (s === ',') return '0,';
  if (!intStr && decStr) intStr = '0';
  if (!intStr) return '';
  let formattedInt = "";
  let digitCount = 0;
  for (let i = intStr.length - 1; i >= 0; i--) {
    formattedInt = intStr[i] + formattedInt;
    digitCount++;
    if (i > 0 && digitCount % 3 === 0) {
      if (digitCount % 6 === 0) formattedInt = "'" + formattedInt;
      else formattedInt = "." + formattedInt;
    }
  }
  return formattedInt + decStr;
};

export const parseNumberInput = (s: string | number): number => {
  if (s === undefined || s === null) return 0;
  let str = s.toString();
  
  // Heuristic: If it looks like a small decimal (e.g., "0.5" or "1.5") treat dot as decimal
  // Regex checks for: Start, digits, dot, 1 or 2 digits, End. And Value < 1000.
  if (/^\d+\.\d{1,2}$/.test(str)) {
      return parseFloat(str);
  }

  // Standard Colombian/European parsing: 1.000 = 1000, 0,5 = 0.5
  const cleaned = str.replace(/['.]/g, '').replace(',', '.');
  return parseFloat(cleaned) || 0;
};

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
  }).format(val).replace('$', '$ ');

export const formatBaseQuantity = (qty: number, type: string) => {
  if (type === 'unit') return `${qty} und`;
  if (type === 'g' && qty >= 50000) return `${(qty/50000).toFixed(2)} bultos`;
  if (type === 'g' && qty >= 1000) return `${(qty/1000).toFixed(2)} kg`;
  if (type === 'g') return `${qty.toFixed(0)} g`;
  if (type === 'ml' && qty >= 1000) return `${(qty/1000).toFixed(2)} L`;
  if (type === 'ml') return `${qty.toFixed(0)} ml`;
  return `${qty.toFixed(1)} ${type}`;
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
  if (storedData) { try { parsed = JSON.parse(storedData); } catch (e) {}}
  const id = parsed.activeWarehouseId || generateId();
  return {
    warehouses: parsed.warehouses || [{ id, name: 'Finca Principal', created: new Date().toISOString(), ownerId: 'local_user' }],
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
    swot: parsed.swot || { f: '', o: '', d: '', a: '' }, 
    bpaChecklist: parsed.bpaChecklist || {},
    assets: parsed.assets || [],
    clients: parsed.clients || [],
    salesContracts: parsed.salesContracts || [],
    sales: parsed.sales || []
  };
};

export const saveDataToLocalStorage = (data: AppState) => {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); } catch (e) {}
};
