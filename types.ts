
export enum Unit {
  BULTO_50KG = 'BULTO_50KG',
  KILO = 'KILO',
  GRAMO = 'GRAMO',
  LITRO = 'LITRO',
  MILILITRO = 'MILILITRO',
  GALON = 'GALON',
  UNIDAD = 'UNIDAD'
}

export enum Category {
  FERTILIZANTE = 'FERTILIZANTE',
  FUNGICIDA = 'FUNGICIDA',
  INSECTICIDA = 'INSECTICIDA',
  HERBICIDA = 'HERBICIDA',
  BIOESTIMULANTE = 'BIOESTIMULANTE',
  DESINFECTANTE = 'DESINFECTANTE',
  OTRO = 'OTRO'
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
  description?: string;
  image?: string;
  expirationDate?: string;
  safetyIntervalDays?: number;
}

export interface Movement {
  id: string;
  warehouseId: string;
  itemId: string;
  itemName: string;
  date: string;
  type: 'IN' | 'OUT';
  quantity: number;
  unit: Unit;
  calculatedCost: number;
  supplierId?: string;
  supplierName?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  costCenterId?: string;
  costCenterName?: string;
  personnelId?: string;
  personnelName?: string;
  notes?: string;
}

export interface Supplier {
  id: string;
  warehouseId: string;
  name: string;
  taxId?: string;
  phone?: string;
  email?: string;
  address?: string;
  creditDays?: number;
}

export interface RenovationRecord {
  date: string;
  type: 'TOTAL' | 'PARCIAL_SPLIT' | 'ZOCA' | 'SIEMBRA';
  details: string;
  previousAge?: number;
  originalArea?: number;
  splitArea?: number;
}

export interface CostCenter {
  id: string;
  warehouseId: string;
  name: string;
  area: number;
  budget?: number;
  stage: 'Produccion' | 'Levante' | 'Infraestructura';
  cropType: string;
  variety?: string;
  plantCount?: number;
  cropAgeMonths?: number;
  associatedCrop?: string;
  associatedCropAge?: number;
  associatedCropDensity?: number;
  activationDate?: string;
  assetValue?: number;
  accumulatedCapex?: number;
  amortizationDuration?: number;
  parentId?: string;
  renovationHistory?: RenovationRecord[];
}

export type ContractType = 'FIJO' | 'INDEFINIDO' | 'OBRA_LABOR' | 'PRESTACION_SERVICIOS';

export interface Personnel {
  id: string;
  warehouseId: string;
  name: string;
  role: string;
  documentId?: string;
  phone?: string;
  
  // New Fields
  age?: number;
  eps?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  
  contractType?: ContractType;
  contractEndDate?: string;
  contractDurationValue?: number;
  contractDurationUnit?: 'DIAS' | 'MESES' | 'INDEFINIDO';
  
  salary?: number;
}

export type CostClassification = 'JOINT' | 'COFFEE' | 'PLANTAIN' | 'OTHER';

export interface Activity {
  id: string;
  warehouseId: string;
  name: string;
  costClassification: CostClassification;
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
  areaWorked?: number;
  hoursWorked?: number;
  jornalesEquivalent?: number;
  performanceYieldHaJornal?: number;
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
  yieldFactor?: number;
  pestPercentage?: number;
  collectorsCount?: number;
  brocaLossValue?: number;
  quality1Qty?: number;
  quality2Qty?: number;
  wasteQty?: number;
}

export interface Machine {
  id: string;
  warehouseId: string;
  name: string;
  brand?: string;
  purchaseDate?: string;
  purchaseValue?: number;
  expectedLifeHours?: number;
  capacityTheoretical?: number;
  width?: number;
  efficiency?: number;
  dischargeRateLitersPerMin?: number;
  avgSpeedKmh?: number;
}

export interface MaintenanceLog {
  id: string;
  warehouseId: string;
  machineId: string;
  machineName: string;
  date: string;
  type: 'Preventivo' | 'Correctivo';
  description: string;
  cost: number;
  nextMaintenanceDate?: string;
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
  cost?: number;
}

export interface PPELog {
  id: string;
  warehouseId: string;
  personnelId: string;
  personnelName: string;
  date: string;
  items: string[];
  notes?: string;
}

export interface WasteLog {
  id: string;
  warehouseId: string;
  date: string;
  itemDescription: string;
  quantity: number;
  tripleWashed: boolean;
  disposalPoint?: string;
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
  notes?: string;
}

export interface PestLog {
  id: string;
  warehouseId: string;
  date: string;
  costCenterId: string;
  pestOrDisease: 'Broca' | 'Roya' | 'Otro';
  incidence: 'Baja' | 'Media' | 'Alta';
  notes?: string;
}

// NUEVA INTERFAZ: PLANIFICACIÓN DE LABORES
export interface PlannedLabor {
  id: string;
  warehouseId: string;
  date: string;
  activityId: string;
  activityName: string;
  costCenterId: string;
  costCenterName: string;
  
  // Parámetros Técnicos
  targetArea: number;       // Área a intervenir
  technicalYield: number;   // Rendimiento esperado (Ha/Jornal)
  unitCost: number;         // Costo estimado por Jornal
  efficiency: number;       // Factor de eficiencia (0-100%)
  
  // Cálculos Automáticos
  calculatedPersonDays: number; // Jornales necesarios
  calculatedHours?: number;
  calculatedTotalCost: number;
  
  // Asignación
  assignedPersonnelIds?: string[];
  completed: boolean;
  notes?: string;
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

export interface Asset {
  id: string;
  warehouseId: string;
  name: string;
  value: number;
}

export interface SWOT {
  f: string;
  o: string;
  d: string;
  a: string;
}

export interface Warehouse {
  id: string;
  name: string;
  created: string;
  ownerId: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
}

export interface Client {
    id: string;
    warehouseId: string;
    name: string;
}

export interface SalesContract {
    id: string;
}

export interface Sale {
    id: string;
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
  
  plannedLabors: PlannedLabor[]; // Nuevo array de estado
  
  budgets: BudgetPlan[];
  assets: Asset[];
  bpaChecklist: Record<string, boolean>;
  laborFactor: number;
  swot?: SWOT;
  clients: Client[];
  salesContracts: SalesContract[];
  sales: Sale[];
}

export interface InitialMovementDetails {
  supplierId?: string;
  invoiceNumber?: string;
  invoiceImage?: string;
  paymentDueDate?: string;
}