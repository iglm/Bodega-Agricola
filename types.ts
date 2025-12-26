
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

// New: Personnel Interface
export interface Personnel {
  id: string;
  name: string;
  role?: string; // e.g., Aplicador, Mayordomo
}

export interface CostCenter {
  id: string;
  name: string;
  description?: string;
  budget?: number; // New: Presupuesto asignado
  area?: number; // New: Área en Hectáreas para indicadores de eficiencia
}

// NEW: Activity Catalog (For Labor)
export interface Activity {
  id: string;
  name: string; // e.g. "Guadaña", "Poda", "Fumigación"
  description?: string;
}

// NEW: Labor Log (Jornales)
export interface LaborLog {
  id: string;
  date: string;
  personnelId: string;
  personnelName: string;
  costCenterId: string; // Lote
  costCenterName: string;
  activityId: string;
  activityName: string;
  value: number; // Costo del jornal o tarea
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
  
  // Cost tracking
  lastPurchasePrice: number;
  lastPurchaseUnit: Unit;
  averageCost: number; // New: Costo Promedio Ponderado por unidad base (g/ml)
  
  // Admin features
  minStock?: number;
  minStockUnit?: Unit;
  description?: string;
  expirationDate?: string; // New: Control de Vencimientos
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
  
  // Admin Tracking
  invoiceNumber?: string;
  invoiceImage?: string; // New: Foto de la factura/recibo
  outputCode?: string;
  
  supplierId?: string;
  supplierName?: string;
  costCenterId?: string;
  costCenterName?: string;
  
  // New: Personnel Tracking
  personnelId?: string;
  personnelName?: string;
}

export interface AppState {
  warehouses: Warehouse[];
  activeWarehouseId: string;
  inventory: InventoryItem[];
  movements: Movement[];
  suppliers: Supplier[];
  costCenters: CostCenter[];
  personnel: Personnel[]; 
  activities: Activity[]; // NEW: Labores Catalog
  laborLogs: LaborLog[]; // NEW: Registry
  adminPin?: string; // New: Security PIN for manager mode
}
