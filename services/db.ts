
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppState } from '../types';
import { loadDataFromLocalStorage, generateId, STORAGE_KEY } from './inventoryService';

const DB_NAME = 'DatosFincaVivaDB';
const DB_VERSION = 1;
const STORE_NAME = 'appState';
const KEY = 'root';
const MIGRATION_FLAG = 'MIGRATION_COMPLETED';

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
      blocked(currentVersion, blockedVersion, event) {
          console.warn("DB blocked", currentVersion, blockedVersion);
      },
      blocking(currentVersion, blockedVersion, event) {
          console.warn("DB blocking", currentVersion, blockedVersion);
      },
      terminated() {
          console.error("DB terminated unexpectedly");
          dbPromise = null;
      },
    });
  }
  return dbPromise;
};

// Generador de estado limpio seguro para casos de corrupción/zombie
const getCleanState = (): AppState => {
    const id = generateId();
    return {
        warehouses: [{ id, name: 'Finca Recuperada', created: new Date().toISOString(), ownerId: 'local_user' }],
        activeWarehouseId: id,
        inventory: [], movements: [], suppliers: [], costCenters: [], personnel: [], activities: [], 
        laborLogs: [], harvests: [], machines: [], maintenanceLogs: [], rainLogs: [], financeLogs: [], 
        soilAnalyses: [], ppeLogs: [], wasteLogs: [], agenda: [], phenologyLogs: [], pestLogs: [], 
        plannedLabors: [], budgets: [], assets: [], bpaChecklist: {}, laborFactor: 1.0
    };
};

export const dbService = {
  
  saveState: async (state: AppState): Promise<void> => {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, state, KEY);
    } catch (error) {
      console.error("Error crítico guardando en IDB:", error);
      // Fallback: Solo guardamos en LS si NO hemos migrado completamente o como último recurso de emergencia
      // usando la MISMA clave que el loader para evitar inconsistencia.
      try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch (lsError) {
          console.error("Fallo total de guardado", lsError);
      }
    }
  },

  loadState: async (): Promise<AppState> => {
    // 1. Verificación de Integridad
    const hasMigrated = localStorage.getItem(MIGRATION_FLAG) === 'true';
    let db;

    try {
      db = await getDB();
      const data = await db.get(STORE_NAME, KEY);

      if (data) {
        // Integridad confirmada: IDB tiene datos. Aseguramos la marca.
        if (!hasMigrated) localStorage.setItem(MIGRATION_FLAG, 'true');
        return data;
      }
    } catch (error) {
      console.error("Error leyendo IndexedDB:", error);
      // Si falla IDB y ya migramos, NO tocar LocalStorage.
      if (hasMigrated) {
          console.warn("Error de IDB post-migración. Retornando estado limpio para proteger integridad.");
          return getCleanState();
      }
    }

    // 2. Lógica Anti-Zombie
    // Si llegamos aquí, IDB está vacío o falló.
    if (hasMigrated) {
        console.warn("ALERTA DE INTEGRIDAD: IndexedDB vacío pero migración marcada. Ignorando LocalStorage (Zombie Data).");
        // Devolvemos un estado nuevo para evitar revivir datos de hace meses.
        return getCleanState();
    }

    // 3. Puente de Migración (Solo corre si nunca se ha migrado)
    console.log("⚠️ Inicializando migración a IndexedDB...");
    try {
        const legacyData = loadDataFromLocalStorage();
        if (db) {
            await db.put(STORE_NAME, legacyData, KEY);
            localStorage.setItem(MIGRATION_FLAG, 'true');
            console.log("✅ Migración completada exitosamente.");
        }
        return legacyData;
    } catch (migrationError) {
        console.error("Fallo en migración:", migrationError);
        return loadDataFromLocalStorage(); // Último recurso
    }
  },

  clearDatabase: async (): Promise<void> => {
      try {
        const db = await getDB();
        await db.clear(STORE_NAME);
        localStorage.removeItem(MIGRATION_FLAG); // Permitir nueva migración si se borra explícitamente
      } catch (e) {
          console.error("Error clearing DB", e);
      }
  }
};
