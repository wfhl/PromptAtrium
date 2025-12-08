import { ExtractedPrompt } from "../types";

const DB_NAME = "PromptMinerDB";
const STORE_NAME = "prompts";
const DB_VERSION = 1;

// Share DB (Matches sw.js)
const SHARE_DB_NAME = 'PromptMinerShareDB';
const SHARE_DB_STORE = 'shared-content';

const openDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => reject("Database error: " + (event.target as any).error);

    request.onsuccess = (event) => resolve((event.target as IDBOpenDBRequest).result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: "id" });
      }
    };
  });
};

export const savePromptToStorage = async (prompt: ExtractedPrompt): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(prompt); // put handles both add and update

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to save to storage", error);
    throw error;
  }
};

export const loadPromptsFromStorage = async (): Promise<ExtractedPrompt[]> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readonly");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to load from storage", error);
    return [];
  }
};

export const deletePromptFromStorage = async (id: string): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to delete from storage", error);
    throw error;
  }
};

export const clearStorage = async (): Promise<void> => {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction([STORE_NAME], "readwrite");
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (error) {
    console.error("Failed to clear storage", error);
    throw error;
  }
};

// --- PWA Share Logic ---

export interface SharedContent {
  text?: string;
  file?: File;
  title?: string;
}

export const checkSharedContent = async (): Promise<SharedContent | null> => {
  return new Promise((resolve, reject) => {
    // Open the separate Share DB used by Service Worker
    const request = indexedDB.open(SHARE_DB_NAME, 1);
    
    request.onerror = () => resolve(null); // DB might not exist yet
    
    request.onsuccess = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(SHARE_DB_STORE)) {
        db.close();
        resolve(null);
        return;
      }
      
      const tx = db.transaction(SHARE_DB_STORE, 'readwrite');
      const store = tx.objectStore(SHARE_DB_STORE);
      const getReq = store.get('latest-share');
      
      getReq.onsuccess = () => {
        const result = getReq.result;
        if (result) {
          // Clear it after reading so we don't process it twice
          store.delete('latest-share'); 
          resolve({
             text: result.text,
             file: result.file,
             title: result.title
          });
        } else {
          resolve(null);
        }
      };
      getReq.onerror = () => resolve(null);
    };
  });
};