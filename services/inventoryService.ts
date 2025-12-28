
import { InventoryItem, Movement, Unit, AppState, Warehouse, LaborLog, HarvestLog, MaintenanceLog, RainLog, FinanceLog } from '../types';
import * as XLSX from 'xlsx';

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

// --- BULK IMPORT LOGIC (UPDATED FOR ALL MODULES) ---

export const processExcelImport = async (file: File, currentState: AppState): Promise<{ success: boolean, message: string, newState?: AppState }> => {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        
        let newState = { ...currentState };
        let logsAdded = 0;
        let errors: string[] = [];

        const activeId = newState.activeWarehouseId;

        // HELPER: Find matching ID by name (case insensitive)
        const findId = (list: any[], name: string) => {
            if (!name) return undefined;
            return list.find(i => i.name.toLowerCase() === name.toString().toLowerCase() && i.warehouseId === activeId);
        };

        // 1. JORNALES_NOMINA
        const laborSheet = workbook.SheetNames.find(n => n.toLowerCase().includes('jornales'));
        if (laborSheet) {
          const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[laborSheet]);
          rows.forEach((row, index) => {
             // Skip reference rows if user left them
             if (row.Trabajador?.includes("Copiar")) return;

             const person = findId(newState.personnel, row.Trabajador);
             const activity = findId(newState.activities, row.Labor);
             const lot = findId(newState.costCenters, row.Lote);

             if (person && activity && lot) {
               newState.laborLogs = [...newState.laborLogs, {
                 id: crypto.randomUUID(),
                 warehouseId: activeId,
                 date: new Date(row.Fecha).toISOString().split('T')[0],
                 personnelId: person.id,
                 personnelName: person.name,
                 activityId: activity.id,
                 activityName: activity.name,
                 costCenterId: lot.id,
                 costCenterName: lot.name,
                 value: Number(row.Valor),
                 notes: row.Notas || 'Importado Excel',
                 paid: false
               }];
               logsAdded++;
             }
          });
        }

        // 2. COSECHAS
        const harvestSheet = workbook.SheetNames.find(n => n.toLowerCase().includes('cosechas'));
        if (harvestSheet) {
           const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[harvestSheet]);
           rows.forEach(row => {
              if (row.Lote?.includes("Lote 1")) return; // Skip example
              const lot = findId(newState.costCenters, row.Lote);
              if (lot) {
                newState.harvests = [...newState.harvests, {
                  id: crypto.randomUUID(),
                  warehouseId: activeId,
                  date: new Date(row.Fecha).toISOString().split('T')[0],
                  costCenterId: lot.id,
                  costCenterName: lot.name,
                  cropName: row.Cultivo,
                  quantity: Number(row.Cantidad),
                  unit: row.Unidad || 'Kg',
                  totalValue: Number(row.ValorTotal),
                  notes: row.Notas || 'Importado Excel'
                }];
                logsAdded++;
              }
           });
        }

        // 3. MOVIMIENTOS (New)
        const movSheet = workbook.SheetNames.find(n => n.toLowerCase().includes('inventario'));
        if (movSheet) {
            const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[movSheet]);
            rows.forEach(row => {
                if (row.Producto?.includes("Urea")) return; // Skip example
                
                const item = findId(newState.inventory, row.Producto);
                if (item) {
                    const type = row.Tipo.toUpperCase().includes('ENTRADA') ? 'IN' : 'OUT';
                    
                    // Logic to update inventory quantity is complex here because we are mass importing history.
                    // For safety, this import ADDS LOGS but DOES NOT recalculate average cost historically.
                    // It strictly updates current quantity based on the movement.
                    
                    const baseQty = convertToBase(Number(row.Cantidad), row.Unidad as Unit);
                    const targetItemIndex = newState.inventory.findIndex(i => i.id === item.id);
                    
                    if (targetItemIndex >= 0) {
                        // Update Stock
                        if (type === 'IN') {
                            newState.inventory[targetItemIndex].currentQuantity += baseQty;
                        } else {
                            newState.inventory[targetItemIndex].currentQuantity = Math.max(0, newState.inventory[targetItemIndex].currentQuantity - baseQty);
                        }

                        newState.movements = [{
                            id: crypto.randomUUID(),
                            warehouseId: activeId,
                            itemId: item.id,
                            itemName: item.name,
                            type: type,
                            quantity: Number(row.Cantidad),
                            unit: row.Unidad as Unit,
                            calculatedCost: Number(row.Costo_Total),
                            date: new Date(row.Fecha).toISOString(),
                            notes: row.Notas || 'Importado Excel',
                            costCenterName: row.Destino_Lote_o_Maquina // Just storing string for reference
                        }, ...newState.movements];
                        logsAdded++;
                    }
                }
            });
        }

        // 4. MAQUINARIA (New)
        const machSheet = workbook.SheetNames.find(n => n.toLowerCase().includes('maquinaria'));
        if (machSheet) {
            const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[machSheet]);
            rows.forEach(row => {
                if(row.Maquina?.includes("Tractor")) return;
                const mach = findId(newState.machines, row.Maquina);
                if (mach) {
                    newState.maintenanceLogs = [...newState.maintenanceLogs, {
                        id: crypto.randomUUID(),
                        warehouseId: activeId,
                        machineId: mach.id,
                        date: new Date(row.Fecha).toISOString().split('T')[0],
                        type: row.Tipo || 'Correctivo',
                        cost: Number(row.Costo),
                        description: row.Descripcion || 'Importado',
                        usageAmount: row.Horas_Km ? Number(row.Horas_Km) : undefined
                    }];
                    logsAdded++;
                }
            });
        }

        // 5. LLUVIAS (New)
        const rainSheet = workbook.SheetNames.find(n => n.toLowerCase().includes('lluvias'));
        if (rainSheet) {
            const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[rainSheet]);
            rows.forEach(row => {
                newState.rainLogs = [...newState.rainLogs, {
                    id: crypto.randomUUID(),
                    warehouseId: activeId,
                    date: new Date(row.Fecha).toISOString().split('T')[0],
                    millimeters: Number(row.Milimetros),
                    notes: 'Importado'
                }];
                logsAdded++;
            });
        }

        // 6. FINANZAS (New)
        const finSheet = workbook.SheetNames.find(n => n.toLowerCase().includes('gastos'));
        if (finSheet) {
            const rows = XLSX.utils.sheet_to_json<any>(workbook.Sheets[finSheet]);
            rows.forEach(row => {
                const type = row.Tipo?.toUpperCase().includes('INGRESO') ? 'INCOME' : 'EXPENSE';
                newState.financeLogs = [...newState.financeLogs, {
                    id: crypto.randomUUID(),
                    warehouseId: activeId,
                    date: new Date(row.Fecha).toISOString().split('T')[0],
                    type: type,
                    category: row.Categoria || 'Otros',
                    amount: Number(row.Monto),
                    description: row.Descripcion || 'Importado Excel'
                }];
                logsAdded++;
            });
        }

        if (logsAdded > 0) {
          resolve({ 
            success: true, 
            message: `Proceso completado: ${logsAdded} registros nuevos añadidos a la base de datos.`, 
            newState 
          });
        } else {
          resolve({ success: false, message: "No se encontraron nuevos registros válidos. Verifique que los nombres (Trabajadores, Lotes, etc.) coincidan con los de la App." });
        }

      } catch (err) {
        console.error(err);
        resolve({ success: false, message: "Error crítico al leer el archivo. Asegúrese de usar la plantilla oficial." });
      }
    };
    reader.readAsBinaryString(file);
  });
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
      if (!migrated.suppliers) migrated.suppliers = [];
      if (!migrated.costCenters) migrated.costCenters = [];
      if (!migrated.personnel) migrated.personnel = [];
      if (!migrated.activities) migrated.activities = [];
      if (!migrated.laborLogs) migrated.laborLogs = [];
      if (!migrated.harvests) migrated.harvests = [];
      if (!migrated.agenda) migrated.agenda = [];
      if (!migrated.machines) migrated.machines = [];
      if (!migrated.maintenanceLogs) migrated.maintenanceLogs = [];
      if (!migrated.rainLogs) migrated.rainLogs = [];
      if (!migrated.financeLogs) migrated.financeLogs = [];

      // 3. MULTI-FARM MIGRATION: Assign warehouseId to orphaned records
      // This ensures data created before the update gets assigned to the current active farm.
      
      const assignFarm = (item: any) => {
          if (!item.warehouseId) item.warehouseId = defaultId;
          return item;
      };

      migrated.inventory = (migrated.inventory || []).map(assignFarm);
      migrated.movements = (migrated.movements || []).map(assignFarm);
      migrated.suppliers = migrated.suppliers.map(assignFarm);
      migrated.costCenters = migrated.costCenters.map(assignFarm);
      migrated.personnel = migrated.personnel.map(assignFarm);
      migrated.activities = migrated.activities.map(assignFarm);
      migrated.laborLogs = migrated.laborLogs.map(assignFarm);
      migrated.harvests = migrated.harvests.map(assignFarm);
      migrated.agenda = migrated.agenda.map(assignFarm);
      migrated.machines = migrated.machines.map(assignFarm);
      migrated.maintenanceLogs = migrated.maintenanceLogs.map(assignFarm);
      migrated.rainLogs = migrated.rainLogs.map(assignFarm);
      migrated.financeLogs = migrated.financeLogs.map(assignFarm);

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
    console.error("Error loading data", e);
  }

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
