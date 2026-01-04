import { AppState } from '../types';
import { dbService } from './db';

class PersistenceManager {
  private saveTimeout: number | null = null;
  private isSaving: boolean = false;

  /**
   * Carga el estado inicial verificando la integridad de los datos.
   */
  async loadInitialState(): Promise<AppState> {
    try {
      const saved = await dbService.loadState();
      // Verificación de integridad exhaustiva: asegurar que todos los arrays existan
      return {
        ...saved,
        inventory: saved.inventory || [],
        movements: saved.movements || [],
        costCenters: saved.costCenters || [],
        laborLogs: saved.laborLogs || [],
        harvests: saved.harvests || [],
        financeLogs: saved.financeLogs || [],
        suppliers: saved.suppliers || [],
        personnel: saved.personnel || [],
        activities: saved.activities || [],
        rainLogs: saved.rainLogs || [],
        pestLogs: saved.pestLogs || [],
        phenologyLogs: saved.phenologyLogs || [],
        plannedLabors: saved.plannedLabors || [],
        agenda: saved.agenda || [],
        ppeLogs: saved.ppeLogs || [],
        wasteLogs: saved.wasteLogs || [],
        soilAnalyses: saved.soilAnalyses || [],
        budgets: saved.budgets || [],
        assets: saved.assets || [],
        clients: saved.clients || [],
        salesContracts: saved.salesContracts || [],
        sales: saved.sales || [],
        machines: saved.machines || [],
        maintenanceLogs: saved.maintenanceLogs || []
      };
    } catch (error) {
      console.error("Error al cargar estado:", error);
      throw error;
    }
  }

  /**
   * Guarda el estado de forma consolidada con debouncing.
   */
  saveDebounced(state: AppState, delay: number = 1000): void {
    if (this.saveTimeout) {
      window.clearTimeout(this.saveTimeout);
    }

    this.saveTimeout = window.setTimeout(async () => {
      await this.saveImmediate(state);
    }, delay);
  }

  /**
   * Guarda el estado inmediatamente (usado en cierres o eventos críticos).
   */
  async saveImmediate(state: AppState): Promise<void> {
    if (this.isSaving) return;
    
    try {
      this.isSaving = true;
      if (this.saveTimeout) {
        window.clearTimeout(this.saveTimeout);
        this.saveTimeout = null;
      }
      await dbService.saveState(state);
    } catch (error) {
      console.error("Error crítico de persistencia:", error);
    } finally {
      this.isSaving = false;
    }
  }
}

export const persistenceManager = new PersistenceManager();