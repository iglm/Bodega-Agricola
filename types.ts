
export enum Category {
  FERTILIZANTE = 'Fertilizante',
  INSECTICIDA = 'Insecticida',
  FUNGICIDA = 'Fungicida',
  HERBICIDA = 'Herbicida',
  BIOESTIMULANTE = 'Bioestimulante',
  DESINFECTANTE = 'Desinfectante',
  OTRO = 'Otro'
}

export enum Unit {
  BULTO_50KG = 'Bulto 50kg',
  KILO = 'Kilo',
  GRAMO = 'Gramo',
  LITRO = 'Litro',
  MILILITRO = 'Mililitro',
  UNIDAD = 'Unidad'
}

export interface Warehouse {
  id: string;
  name: string;
  description?: string;
  created: string;
}

export interface Supplier {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface Personnel {
  id: string;
  name: string;
  role?: string; 
}

export interface CostCenter {
  id: string;
  name: string;
  description?: string;
  budget?: number;
  area?: number;
}

export interface Activity {
  id: string;
  name: string;
  description?: string;
}

export interface LaborLog {
  id: string;
  date: string;
  personnelId: string;
  personnelName: string;
  costCenterId: string; 
  costCenterName: string;
  activityId: string;
  activityName: string;
  value: number;
  notes?: string;
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  name: string;
  category: Category;
  currentQuantity: number;
  baseUnit: 'g' | 'ml' | 'unit';
  image?: string;
  lastPurchasePrice: number;
  lastPurchaseUnit: Unit;
  averageCost: number;
  minStock?: number;
  minStockUnit?: Unit;
  description?: string;
  expirationDate?: string;
}

export interface Movement {
  id: string;
  warehouseId: string;
  itemId: string;
  itemName: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unit: Unit;
  calculatedCost: number;
  date: string;
  notes?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  outputCode?: string;
  supplierId?: string;
  supplierName?: string;
  costCenterId?: string;
  costCenterName?: string;
  personnelId?: string;
  personnelName?: string;
}

// --- NEW MODULES ---

// 1. Production / Harvest
export interface HarvestLog {
  id: string;
  date: string;
  costCenterId: string; // Lote
  costCenterName: string;
  cropName: string; // e.g. "Café Pergamino", "Aguacate Hass"
  quantity: number;
  unit: string; // "Kg", "Arrobas", "Toneladas"
  totalValue: number; // Ingreso Real ($)
  notes?: string;
}

// 2. Agenda / Planning
export interface AgendaEvent {
  id: string;
  date: string;
  title: string;
  description?: string;
  costCenterId?: string;
  completed: boolean;
}

// 3. Machinery & Maintenance
export interface Machine {
  id: string;
  name: string; // "Tractor John Deere"
  brand?: string;
  purchaseDate?: string;
}

export interface MaintenanceLog {
  id: string;
  machineId: string;
  date: string;
  type: 'Preventivo' | 'Correctivo' | 'Combustible';
  cost: number;
  description: string;
}

// 4. Rain / Pluviometry
export interface RainLog {
  id: string;
  date: string;
  millimeters: number;
  notes?: string;
}

export interface AppState {
  warehouses: Warehouse[];
  activeWarehouseId: string;
  inventory: InventoryItem[];
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel: Personnel[]; 
  activities: Activity[]; 
  laborLogs: LaborLog[]; 
  adminPin?: string;

  // New State Arrays
  harvests: HarvestLog[];
  agenda: AgendaEvent[];
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
}
