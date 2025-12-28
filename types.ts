
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

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  isSupporter?: boolean; 
  subscriptionExpiry?: string; // Para manejar renovaciones
}

export interface AppState {
  user?: User;
  isSupporter?: boolean; 
  subscriptionExpiry?: string;
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
  agenda: AgendaEvent[];
  machines: Machine[];
  maintenanceLogs: MaintenanceLog[];
  rainLogs: RainLog[];
  financeLogs: FinanceLog[]; 
}

export interface Warehouse { id: string; name: string; description?: string; created: string; }
export interface Supplier { id: string; warehouseId?: string; name: string; phone?: string; email?: string; address?: string; }
export interface Personnel { id: string; warehouseId?: string; name: string; role?: string; }
export interface CostCenter { id: string; warehouseId?: string; name: string; description?: string; budget?: number; area?: number; stage?: 'Produccion' | 'Levante' | 'Infraestructura'; plantCount?: number; cropType?: string; }
export interface Activity { id: string; warehouseId?: string; name: string; description?: string; }
export interface LaborLog { id: string; warehouseId?: string; date: string; personnelId: string; personnelName: string; costCenterId: string; costCenterName: string; activityId: string; activityName: string; value: number; notes?: string; paid?: boolean; paymentDate?: string; }
export interface InventoryItem { id: string; warehouseId: string; name: string; category: Category; currentQuantity: number; baseUnit: 'g' | 'ml' | 'unit'; image?: string; lastPurchasePrice: number; lastPurchaseUnit: Unit; averageCost: number; minStock?: number; minStockUnit?: Unit; description?: string; expirationDate?: string; }
export interface Movement { id: string; warehouseId: string; itemId: string; itemName: string; type: 'IN' | 'OUT'; quantity: number; unit: Unit; calculatedCost: number; date: string; notes?: string; invoiceNumber?: string; invoiceImage?: string; outputCode?: string; supplierId?: string; supplierName?: string; costCenterId?: string; costCenterName?: string; machineId?: string; machineName?: string; personnelId?: string; personnelName?: string; }
export interface HarvestLog { id: string; warehouseId?: string; date: string; costCenterId: string; costCenterName: string; cropName: string; quantity: number; unit: string; totalValue: number; notes?: string; }
export interface AgendaEvent { id: string; warehouseId?: string; date: string; title: string; description?: string; completed: boolean; personnelId?: string; personnelName?: string; activityId?: string; activityName?: string; costCenterId?: string; costCenterName?: string; machineId?: string; machineName?: string; estimatedCost?: number; }
export interface Machine { id: string; warehouseId?: string; name: string; brand?: string; purchaseDate?: string; }
export interface MaintenanceLog { id: string; warehouseId?: string; machineId: string; date: string; type: 'Preventivo' | 'Correctivo' | 'Combustible'; cost: number; description: string; usageAmount?: number; }
export interface RainLog { id: string; warehouseId?: string; date: string; millimeters: number; notes?: string; }
export interface FinanceLog { id: string; warehouseId?: string; date: string; type: 'INCOME' | 'EXPENSE'; category: 'Servicios' | 'Impuestos' | 'Bancario' | 'Transporte' | 'Administracion' | 'Otros' | 'Prestamo' | 'Capital'; amount: number; description: string; }
