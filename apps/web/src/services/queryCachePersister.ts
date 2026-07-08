import type { PersistedClient, Persister } from '@tanstack/react-query-persist-client';

const CACHE_KEY = 'swiftspend:tanstack-query-cache';
const DB_NAME = 'swiftspend-query-cache';
const DB_VERSION = 1;
const STORE_NAME = 'query-cache';
const RECORD_KEY = 'client';

function createLocalStoragePersister(): Persister {
  return {
    persistClient: (client: PersistedClient) => {
      window.localStorage.setItem(CACHE_KEY, JSON.stringify(client));
    },
    restoreClient: () => {
      const cached = window.localStorage.getItem(CACHE_KEY);

      if (!cached) {
        return undefined;
      }

      return JSON.parse(cached) as PersistedClient;
    },
    removeClient: () => {
      window.localStorage.removeItem(CACHE_KEY);
    },
  };
}

function openQueryCacheDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      request.result.createObjectStore(STORE_NAME);
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
    request.onblocked = () => reject(new Error('IndexedDB query cache open was blocked.'));
  });
}

function withQueryCacheStore<T>(
  mode: IDBTransactionMode,
  callback: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openQueryCacheDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const transaction = db.transaction(STORE_NAME, mode);
        const request = callback(transaction.objectStore(STORE_NAME));

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
        transaction.onerror = () => reject(transaction.error);
        transaction.oncomplete = () => db.close();
        transaction.onabort = () => {
          db.close();
          reject(transaction.error);
        };
      }),
  );
}

function createIndexedDbPersister(fallbackPersister: Persister): Persister {
  return {
    persistClient: async (client: PersistedClient) => {
      try {
        await withQueryCacheStore('readwrite', (store) => store.put(client, RECORD_KEY));
      } catch {
        await fallbackPersister.persistClient(client);
      }
    },
    restoreClient: async () => {
      try {
        return await withQueryCacheStore<PersistedClient | undefined>('readonly', (store) => store.get(RECORD_KEY));
      } catch {
        return fallbackPersister.restoreClient();
      }
    },
    removeClient: async () => {
      try {
        await withQueryCacheStore('readwrite', (store) => store.delete(RECORD_KEY));
      } catch {
        await fallbackPersister.removeClient();
      }
    },
  };
}

export async function clearPersistedQueryCache(): Promise<void> {
  window.localStorage.removeItem(CACHE_KEY);

  if (!('indexedDB' in window)) {
    return;
  }

  try {
    await withQueryCacheStore('readwrite', (store) => store.delete(RECORD_KEY));
  } catch {
    // The in-memory cache is still cleared by the caller. A future persist will replace stale data.
  }
}

async function canUseIndexedDb(): Promise<boolean> {
  if (!('indexedDB' in window)) {
    return false;
  }

  try {
    const db = await openQueryCacheDb();
    db.close();
    return true;
  } catch {
    return false;
  }
}

export async function createQueryCachePersister(): Promise<Persister> {
  const localStoragePersister = createLocalStoragePersister();

  if (await canUseIndexedDb()) {
    return createIndexedDbPersister(localStoragePersister);
  }

  return localStoragePersister;
}
