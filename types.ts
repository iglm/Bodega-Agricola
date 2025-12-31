
export enum Unit {
  BULTO_50KG = 'Bulto 50kg',
  KILO = 'Kilo',
  GRAMO = 'Gramo',
  LITRO = 'Litro',
  MILILITRO = 'Mililitro',
  GALON = 'Galón',
  UNIDAD = 'Unidad'
}

export enum Category {
  FERTILIZANTE = 'Fertilizante',
  INSECTICIDA = 'Insecticida',
  FUNGICIDA = 'Fungicida',
  HERBICIDA = 'Herbicida',
  BIOESTIMULANTE = 'Bioestimulante',
  DESINFECTANTE = 'Desinfectante',
  OTRO = 'Otro'
}

export type CostClassification = 'JOINT' | 'COFFEE' | 'PLANTAIN' | 'OTHER';

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Warehouse {
  id: string;
  name: string;
  created: string;
  ownerId: string;
}

export interface InventoryItem {
  id: string;
  warehouseId: string;
  name: string;
  category: Category;
  baseUnit: 'g' | 'ml' | 'unit';
  currentQuantity: number;
  averageCost: number;
  lastPurchasePrice: number;
  lastPurchaseUnit: Unit;
  minStock?: number;
  minStockUnit?: Unit;
  description?: string;
  expirationDate?: string;
  safetyIntervalDays?: number;
  image?: string;
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
  supplierId?: string;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  costCenterId?: string;
  costCenterName?: string;
  machineId?: string;
  machineName?: string;
  personnelId?: string;
  personnelName?: string;
  notes?: string;
  outputCode?: string;
  phiApplied?: number;
}

export interface Supplier {
  id: string;
  warehouseId: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CostCenter {
  id: string;
  warehouseId: string;
  name: string;
  area: number;
  stage: 'Produccion' | 'Levante' | 'Infraestructura';
  budget?: number;
  cropType: string;
  associatedCrop?: string;
  plantCount?: number;
  accumulatedCapex?: number;
  productionArea?: number;
  assetValue?: number;
  activationDate?: string;
  amortizationDuration?: number;
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
}

export interface Activity {
  id: string;
  warehouseId: string;
  name: string;
  costClassification?: CostClassification;
}

export interface LaborLog {
  id: string;
  warehouseId: string;
  date: string;
  personnelId: string;
  personnelName: string;
  costCenterId: string;
  costCenterName: string;
  activityId: string;
  activityName: string;
  value: number;
  paid: boolean;
  notes?: string;
  hoursWorked?: number;
  hourlyRate?: number;
  technicalYield?: number;
}

export interface HarvestLog {
  id: string;
  warehouseId: string;
  date: string;
  costCenterId: string;
  costCenterName: string;
  cropName: string;
  quantity: number;
  unit: string;
  totalValue: number;
  quality1Qty?: number;
  quality2Qty?: number;
  wasteQty?: number;
  yieldFactor?: number;
  notes?: string;
}

export interface Machine {
  id: string;
  warehouseId: string;
  name: string;
}

export interface MaintenanceLog {
  id: string;
  warehouseId: string;
  date: string;
  machineId: string;
  description: string;
  cost: number;
  hoursWorked?: number;
  fuelUsedLiters?: number;
}

export interface RainLog {
  id: string;
  warehouseId: string;
  date: string;
  millimeters: number;
}

export interface FinanceLog {
  id: string;
  warehouseId: string;
  date: string;
  type: 'INCOME' | 'EXPENSE';
  category: 'Servicios' | 'Impuestos' | 'Bancario' | 'Transporte' | 'Administracion' | 'Otros' | 'Prestamo' | 'Capital';
  amount: number;
  description: string;
}

export interface SoilAnalysis {
  id: string;
  warehouseId: string;
  date: string;
}

export interface PPELog {
  id: string;
  warehouseId: string;
  date: string;
  personnelId: string;
  personnelName: string;
  items: string[];
}

export interface WasteLog {
  id: string;
  warehouseId: string;
  date: string;
  itemDescription: string;
  quantity: number;
  tripleWashed: boolean;
}

export interface AgendaEvent {
  id: string;
  warehouseId: string;
  date: string;
  title: string;
  completed: boolean;
}

export interface PhenologyLog {
  id: string;
  warehouseId: string;
  date: string;
  costCenterId: string;
  stage: 'Floración' | 'Cuajado' | 'Llenado' | 'Maduración';
}

export interface PestLog {
  id: string;
  warehouseId: string;
  date: string;
  costCenterId: string;
  pestOrDisease: string;
  incidence: 'Baja' | 'Media' | 'Alta';
}

export interface Asset {
  id: string;
  warehouseId: string;
  name: string;
  purchasePrice: number;
  lifespanYears: number;
  category: 'MAQUINARIA' | 'HERRAMIENTA' | 'INFRAESTRUCTURA';
  purchaseDate: string;
}

export interface PlannedLabor {
  id: string;
  warehouseId: string;
  activityId: string;
  activityName: string;
  costCenterId: string;
  costCenterName: string;
  date: string;
  targetArea: number; 
  technicalYield: number;
  unitCost: number;
  efficiency: number; 
  calculatedPersonDays: number;
  calculatedTotalCost: number;
  completed: boolean;
  notes?: string;
  priority?: 'HIGH' | 'MEDIUM' | 'LOW';
}

export interface BudgetItem {
  id: string;
  type: 'LABOR' | 'SUPPLY';
  conceptId: string;
  conceptName: string;
  unitCost: number;
  quantityPerHa: number;
  months: number[];
}

export interface BudgetPlan {
  id: string;
  warehouseId: string;
  year: number;
  costCenterId: string;
  items: BudgetItem[];
}

export interface SWOT {
  f: string;
  o: string;
  d: string;
  a: string;
}

export interface BpaCriterion {
  id: string;
  standard: string;
  category: string;
  code: string;
  label: string;
  complianceLevel: 'MAJOR' | 'MINOR' | 'REC';
  compliant: boolean;
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
  budgets: BudgetPlan[];
  laborFactor: number;
  swot: SWOT;
  bpaChecklist: Record<string, boolean>;
  assets: Asset[];
  adminPin?: string;
}
