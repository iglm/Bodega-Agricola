
import { openDB, DBSchema } from 'idb';

const DB_NAME = 'FincaVivaMedia';
const STORE_NAME = 'images';

interface MediaDBSchema extends DBSchema {
  [STORE_NAME]: {
    key: string;
    value: Blob;
  };
}

export const getMediaDB = async () => {
  return openDB<MediaDBSchema>(DB_NAME, 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    },
  });
};

export const saveBlob = async (id: string, blob: Blob): Promise<void> => {
  const db = await getMediaDB();
  await db.put(STORE_NAME, blob, id);
};

export const getBlob = async (id: string): Promise<Blob | undefined> => {
  const db = await getMediaDB();
  return db.get(STORE_NAME, id);
};

export const deleteBlob = async (id: string): Promise<void> => {
  const db = await getMediaDB();
  await db.delete(STORE_NAME, id);
};
