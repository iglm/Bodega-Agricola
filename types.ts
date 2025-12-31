
export enum Category {
  FERTILIZANTE = 'Fertilizante',
  INSECTICIDA = 'Insecticida',
  FUNGICIDA = 'Fungicida',
  HERBICIDA = 'Herbicida',
  BIOESTIMULANTE = 'Bioestimulante',
  DESINFECTANTE = 'Desinfectante',
  BIOABONO = 'Bioabono',
  OTRO = 'Otro'
}

export enum Unit {
  BULTO_50KG = 'Bulto 50kg',
  KILO = 'Kilo',
  GRAMO = 'Gramo',
  LITRO = 'Litro',
  MILILITRO = 'Mililitro',
  GALON = 'Galón', // NEW: Added Galón unit
  UNIDAD = 'Unidad'
}

export interface User {
  id: string;
  name: string;
  email: string;
  isSupporter?: boolean;
  avatar?: string;
}

export interface AgendaEvent {
  id: string;
  warehouseId: string;
  date: string;
  title: string;
  completed: boolean;
}

export interface SWOT {
  f: string;
  o: string;
  d: string;
  a: string;
}

export interface BpaCriterion {
  id:string;
  standard: 'ICA' | 'GLOBALGAP' | 'CODE_4C'; // NEW: Added 4C Code
  category: string; // Changed to string to support diverse modules (AF, CB, FV, etc)
  code: string;
  label: string;
  complianceLevel: 'MAJOR' | 'MINOR' | 'REC'; // NEW: For GlobalGap logic
  compliant: boolean;
  na?: boolean;
}

export interface Asset {
  id: string;
  warehouseId: string;
  name: string;
  purchasePrice: number;
  lifespanYears: number;
  purchaseDate: string;
  category: 'MAQUINARIA' | 'HERRAMIENTA' | 'INFRAESTRUCTURA';
}

export interface PhenologyLog {
  id: string;
  warehouseId: string;
  costCenterId: string;
  date: string;
  stage: 'Dormancia' | 'Brote' | 'Floración' | 'Cuajado' | 'Llenado' | 'Maduración';
  notes?: string;
}

export interface PestLog {
  id: string;
  warehouseId: string;
  costCenterId: string;
  date: string;
  pestOrDisease: string;
  incidence: 'Baja' | 'Media' | 'Alta';
  notes?: string;
}

export interface PlannedLabor {
  id: string;
  warehouseId: string;
  activityId: string;
  activityName: string;
  costCenterId: string;
  costCenterName: string;
  date: string;
  targetArea: number; // Hectáreas a trabajar
  technicalYield: number; // Rendimiento técnico (ej: Jornales/Ha o Ha/Jornal)
  unitCost: number; // Costo unitario del jornal
  efficiency: number; // Porcentaje de eficiencia (0-100)
  calculatedPersonDays: number; // Jornales calculados
  calculatedTotalCost: number; // Costo total calculado
  completed: boolean;
  notes?: string;
}

// --- NEW BUDGET INTERFACES ---
export interface BudgetItem {
  id: string;
  conceptId: string; // ID of Activity or InventoryItem
  conceptName: string;
  type: 'LABOR' | 'SUPPLY';
  unitCost: number;
  quantityPerHa: number; // The technical density (e.g., 4 jornales/Ha or 2 Liters/Ha)
  months: number[]; // Array of months (0-11) where this expense occurs
}

export interface BudgetPlan {
  id: string;
  warehouseId: string;
  year: number;
  costCenterId: string;
  items: BudgetItem[];
}
// -----------------------------

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
  harvests: HarvestLog[];
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  financeLogs: FinanceLog[]; 
  soilAnalyses: SoilAnalysis[];
  ppeLogs: PPELog[];
  wasteLogs: WasteLog[];
  agenda: AgendaEvent[];
  phenologyLogs: PhenologyLog[];
  pestLogs: PestLog[];
  plannedLabors: PlannedLabor[]; 
  budgets: BudgetPlan[]; // Nuevo campo para presupuestos
  swot?: SWOT;
  bpaChecklist: Record<string, boolean>;
  assets: Asset[];
  laborFactor: number; 
  adminPin?: string; 
}

export interface Warehouse { 
  id: string; 
  name: string; 
  created: string; 
  ownerId: string; // Add ownerId to the Warehouse interface
  sharedWith?: { userId: string; email: string; role: 'viewer' | 'editor' }[]; // For sharing functionality
}

export interface CostCenter { 
  id: string; 
  warehouseId: string; 
  name: string; 
  area: number; 
  productionArea?: number;
  stage: 'Produccion' | 'Levante' | 'Infraestructura'; 
  cropType: string;
  associatedCrop?: string;
  budget?: number;
  coordinates?: { lat: number; lng: number };
  plantCount?: number;
  // Biological Asset Fields
  accumulatedCapex?: number; // Costo acumulado durante etapa de levante
  assetValue?: number; // Valor final activado al pasar a producción
  amortizationDuration?: number; // Vida útil contable en años
  activationDate?: string; // Fecha en que pasó a producción
}

export interface InventoryItem { 
  id: string; 
  warehouseId: string; 
  name: string; 
  category: Category; 
  currentQuantity: number; 
  baseUnit: 'g' | 'ml' | 'unit'; 
  averageCost: number; 
  lastPurchasePrice: number;
  lastPurchaseUnit: Unit;
  minStock?: number;
  minStockUnit?: Unit;
  image?: string;
  description?: string;
  expirationDate?: string;
  safetyIntervalDays?: number;
}

export interface LaborLog { 
  id: string; 
  warehouseId: string; 
  date: string; 
  personnelId: string;
  personnelName: string; 
  activityId: string;
  activityName: string; 
  costCenterId: string;
  costCenterName: string;
  value: number; 
  paid: boolean;
  notes?: string;
  technicalYield?: number; // Rendimiento Técnico (Ha/Jornal)
  hoursWorked?: number; // NEW: Horas reales trabajadas (Banco de Horas)
  hourlyRate?: number; // NEW: Valor de la hora pactada
}

export interface HarvestLog { 
  id: string; 
  warehouseId: string; 
  costCenterId: string;
  costCenterName: string;
  date: string; 
  cropName: string; 
  quantity: number; 
  unit: string; 
  totalValue: number;
  quality1Qty?: number;
  quality2Qty?: number;
  wasteQty?: number;
  rejectionCause?: string;
  notes?: string;
  yieldFactor?: number;
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
  machineId?: string;
  machineName?: string;
  personnelId?: string;
  personnelName?: string;
  phiApplied?: number;
}

export interface SoilAnalysis { 
  id: string; 
  warehouseId: string; 
  costCenterId: string;
  costCenterName: string; 
  date: string; 
  ph: number;
  nitrogen: number;
  phosphorus: number;
  potassium: number;
  calcium?: number;
  magnesium?: number;
  sulfur?: number;
  aluminum?: number;
  boron?: number;
  organicMatter: number;
  notes: string; 
}

export interface PPELog { id: string; warehouseId: string; personnelId: string; personnelName: string; date: string; items: string[]; notes?: string; }
export interface WasteLog { id: string; warehouseId: string; date: string; itemDescription: string; quantity: number; tripleWashed: boolean; disposalPoint?: string; }
export interface Machine { id: string; warehouseId: string; name: string; brand?: string; purchaseDate?: string; purchaseValue?: number; expectedLifeHours?: number; capacityTheoretical?: number; width?: number; efficiency?: number; dischargeRateLitersPerMin?: number; avgSpeedKmh?: number; }
export interface MaintenanceLog { id: string; warehouseId: string; machineId: string; date: string; cost: number; description: string; hoursWorked?: number; fuelUsedLiters?: number; }
export interface RainLog { id: string; warehouseId: string; date: string; millimeters: number; }
export interface FinanceLog { id: string; warehouseId: string; date: string; type: 'INCOME' | 'EXPENSE'; amount: number; category: string; description: string; }

export type CostClassification = 'JOINT' | 'COFFEE' | 'PLANTAIN' | 'OTHER';

export interface Activity { 
  id: string; 
  warehouseId: string; 
  name: string; 
  costClassification?: CostClassification;
}

export interface Personnel { 
  id: string; 
  warehouseId: string; 
  name: string; 
  role: string; 
  documentId?: string;
  phone?: string;
  emergencyContact?: string;
  eps?: string;
  arl?: boolean;
  birthDate?: string;
  disability?: string;
}

export interface Supplier { id: string; warehouseId: string; name: string; phone?: string; email?: string; address?: string; }
