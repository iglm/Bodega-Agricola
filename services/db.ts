
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppState } from '../types';
import { loadDataFromLocalStorage, generateId, STORAGE_KEY } from './inventoryService';

const DB_NAME = 'DatosFincaVivaDB';
const DB_VERSION = 1;
const STORE_NAME = 'appState';
const KEY = 'root';
const MIGRATION_FLAG = 'MIGRATION_COMPLETED';

/** Error específico para fallos críticos de integridad de datos */
export class DataIntegrityError extends Error {
  constructor(message: string, public originalData?: string) {
    super(message);
    this.name = "DataIntegrityError";
  }
}

interface FincaDB extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: AppState;
  };
}

let dbPromise: Promise<IDBPDatabase<FincaDB>> | null = null;

const getDB = () => {
  if (!dbPromise) {
    dbPromise = openDB<FincaDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      },
    });
  }
  return dbPromise;
};

const getCleanState = (): AppState => {
    const id = generateId();
    return {
        warehouses: [{ id, name: 'Finca Principal', created: new Date().toISOString(), ownerId: 'local_user' }],
        activeWarehouseId: id,
        inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], 
        laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], 
        soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], 
        plannedLabors: [], budgets: [], assets: [], bpaChecklist: {}, laborFactor: 1.0,
        clients: [], salesContracts: [], sales: []
    };
};

export const dbService = {
  
  saveState: async (state: AppState): Promise<void> => {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, state, KEY);
    } catch (error) {
      console.error("Error crítico guardando en IDB:", error);
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (lsError) {
          console.error("Fallo total de guardado", lsError);
      }
    }
  },

  loadState: async (): Promise<AppState> => {
    const hasMigrated = localStorage.getItem(MIGRATION_FLAG) === 'true';
    let db;

    try {
      db = await getDB();
      const data = await db.get(STORE_NAME, KEY);

      if (data) {
        // Validación de integridad mínima
        if (!Array.isArray(data.inventory) || !Array.isArray(data.costCenters)) {
            throw new Error("Estructura de datos inconsistente detectada.");
        }
        if (!hasMigrated) localStorage.setItem(MIGRATION_FLAG, 'true');
        return data;
      }
    } catch (error) {
      console.error("Error crítico leyendo IndexedDB:", error);
    }

    if (hasMigrated) {
        const rawLegacyData = localStorage.getItem(STORAGE_KEY);
        if (rawLegacyData) {
            try {
                const recoveredState = JSON.parse(rawLegacyData);
                if (!Array.isArray(recoveredState.inventory)) throw new Error("LocalStorage Corrupto");
                
                if (db) await db.put(STORE_NAME, recoveredState, KEY);
                return recoveredState;
            } catch (recoveryError) {
                throw new DataIntegrityError("Fallo total de integridad. El respaldo local está dañado.", rawLegacyData);
            }
        }
        
        throw new DataIntegrityError("La base de datos local ha desaparecido inesperadamente. No hay respaldos automáticos.");
    }

    // Primer inicio
    try {
        const legacyData = loadDataFromLocalStorage();
        if (db && legacyData.inventory.length > 0) {
            await db.put(STORE_NAME, legacyData, KEY);
            localStorage.setItem(MIGRATION_FLAG, 'true');
        }
        return legacyData;
    } catch (migrationError) {
        return getCleanState();
    }
  },

  clearDatabase: async (): Promise<void> => {
      try {
        const db = await getDB();
        await db.clear(STORE_NAME);
        localStorage.removeItem(MIGRATION_FLAG);
      } catch (e) {
          console.error("Error clearing DB", e);
      }
  }
};
