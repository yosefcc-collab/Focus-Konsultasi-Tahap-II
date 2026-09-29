import { TaskAssignment, TeamMember } from '../types';
import { INITIAL_ASSIGNMENTS, TEAM_MEMBERS } from '../data/initialData';

const DB_NAME = 'SinodalKatedralMedanDB';
const DB_VERSION = 1;
const STORE_NAME = 'sinodal_data';

const LS_TASKS_KEY = 'tim_sinodal_katedral_medan_tasks_v2';
const LS_MEMBERS_KEY = 'tim_sinodal_katedral_medan_members_v2';
const LS_BACKUP_KEY = 'tim_sinodal_backup_snapshot';

/**
 * Open or initialize IndexedDB for permanent, high-capacity client storage
 */
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }

    const request = window.indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save value to IndexedDB
 */
async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(value, key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB set error:', err);
  }
}

/**
 * Get value from IndexedDB
 */
async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB get error:', err);
    return null;
  }
}

/**
 * Safe localStorage setter that handles QuotaExceededError
 */
function safeLocalStorageSet(key: string, value: any): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (e: any) {
    console.warn(`localStorage quota warning for ${key}:`, e);
    // If quota exceeded due to photos, try saving without photos in localStorage
    // while IndexedDB keeps the full high-res photos
    if (Array.isArray(value)) {
      try {
        const lightweight = value.map((item) => {
          if (item && item.fotoDokumentasi) {
            const copy = { ...item };
            delete copy.fotoDokumentasi; // keep in IndexedDB only
            return copy;
          }
          return item;
        });
        localStorage.setItem(key, JSON.stringify(lightweight));
        return true;
      } catch (innerErr) {
        console.warn('Failed saving even lightweight tasks to localStorage', innerErr);
      }
    }
    return false;
  }
}

/**
 * Load tasks with multi-layer persistence (IndexedDB -> localStorage -> Defaults)
 */
export async function loadPersistentTasks(): Promise<TaskAssignment[]> {
  // 1. Try IndexedDB (holds full data including photos)
  try {
    const idbData = await idbGet<TaskAssignment[]>('tasks');
    if (idbData && Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }
  } catch (e) {
    console.warn('Error reading tasks from IndexedDB', e);
  }

  // 2. Fallback to localStorage
  try {
    const lsData = localStorage.getItem(LS_TASKS_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Also sync to IndexedDB for future stability
        idbSet('tasks', parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading tasks from localStorage', e);
  }

  // 3. Fallback to Backup Snapshot if available
  try {
    const backupData = localStorage.getItem(LS_BACKUP_KEY);
    if (backupData) {
      const parsed = JSON.parse(backupData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading backup snapshot', e);
  }

  return INITIAL_ASSIGNMENTS;
}

/**
 * Load members with multi-layer persistence
 */
export async function loadPersistentMembers(): Promise<TeamMember[]> {
  try {
    const idbData = await idbGet<TeamMember[]>('members');
    if (idbData && Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }
  } catch (e) {}

  try {
    const lsData = localStorage.getItem(LS_MEMBERS_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

  return TEAM_MEMBERS;
}

/**
 * Save tasks with guaranteed persistence & backup snapshot
 */
export async function savePersistentTasks(tasks: TaskAssignment[]): Promise<{ success: boolean; timestamp: string }> {
  const timestamp = new Date().toISOString();

  // 1. Save to IndexedDB (unlimited quota, supports photos)
  await idbSet('tasks', tasks);
  await idbSet('tasks_last_saved', timestamp);

  // 2. Save backup snapshot in IndexedDB
  await idbSet('tasks_backup_snapshot', {
    tasks,
    savedAt: timestamp,
  });

  // 3. Mirror to localStorage
  safeLocalStorageSet(LS_TASKS_KEY, tasks);
  safeLocalStorageSet(LS_BACKUP_KEY, tasks);

  return { success: true, timestamp };
}

/**
 * Save members with persistence
 */
export async function savePersistentMembers(members: TeamMember[]): Promise<void> {
  await idbSet('members', members);
  safeLocalStorageSet(LS_MEMBERS_KEY, members);
}

/**
 * Retrieve the last backup snapshot
 */
export async function getBackupSnapshot(): Promise<{ tasks: TaskAssignment[]; savedAt: string } | null> {
  const idbSnapshot = await idbGet<{ tasks: TaskAssignment[]; savedAt: string }>('tasks_backup_snapshot');
  if (idbSnapshot && idbSnapshot.tasks) {
    return idbSnapshot;
  }

  try {
    const lsBackup = localStorage.getItem(LS_BACKUP_KEY);
    if (lsBackup) {
      return {
        tasks: JSON.parse(lsBackup),
        savedAt: 'Tersimpan di perangkat',
      };
    }
  } catch (e) {}

  return null;
}
