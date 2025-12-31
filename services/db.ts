
import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { AppState } from '../types';
import { loadDataFromLocalStorage } from './inventoryService';

const DB_NAME = 'DatosFincaVivaDB';
const DB_VERSION = 1;
const STORE_NAME = 'appState';
const KEY = 'root';

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

export const dbService = {
  
  saveState: async (state: AppState): Promise<void> => {
    try {
      const db = await getDB();
      await db.put(STORE_NAME, state, KEY);
    } catch (error) {
      console.error("Error crítico guardando en IDB, intentando LS como backup:", error);
      // Fallback extremo: guardar en localStorage si falla IDB
      try {
          localStorage.setItem('datosfinca_viva_v1_expert', JSON.stringify(state));
      } catch (lsError) {
          console.error("Fallo total de guardado", lsError);
      }
    }
  },

  loadState: async (): Promise<AppState> => {
    try {
      const db = await getDB();
      const data = await db.get(STORE_NAME, KEY);

      if (data) {
        return data;
      } else {
        // --- BRIDGE MIGRATION START ---
        console.log("⚠️ Inicializando migración a IndexedDB...");
        const legacyData = loadDataFromLocalStorage();
        
        // Guardamos inmediatamente en la nueva DB
        await db.put(STORE_NAME, legacyData, KEY);
        console.log("✅ Migración completada. Datos transferidos a base de datos de alta capacidad.");
        
        return legacyData;
        // --- BRIDGE MIGRATION END ---
      }
    } catch (error) {
      console.error("Error cargando DB, retornando estado por defecto desde LS:", error);
      return loadDataFromLocalStorage();
    }
  },

  clearDatabase: async (): Promise<void> => {
      try {
        const db = await getDB();
        await db.clear(STORE_NAME);
      } catch (e) {
          console.error("Error clearing DB", e);
      }
  }
};
