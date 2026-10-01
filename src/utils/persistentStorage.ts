import { TaskAssignment, TeamMember } from '../types';
import { INITIAL_ASSIGNMENTS, TEAM_MEMBERS } from '../data/initialData';

const DB_NAME = 'SinodalKatedralMedanDB';
const DB_VERSION = 2;
const STORE_NAME = 'sinodal_data';

const LS_FINAL_MASTER_TASKS_KEY = 'tim_sinodal_final_master_tasks_permanent';
const LS_FINAL_MASTER_MEMBERS_KEY = 'tim_sinodal_final_master_members_permanent';
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
 * Check if the application currently has a verified Final Master data saved
 */
export async function getFinalMasterStatus(): Promise<{
  isFinalized: boolean;
  finalizedAt?: string;
  count?: number;
}> {
  try {
    const meta = await idbGet<{ isFinalized: boolean; finalizedAt: string }>('final_master_metadata');
    if (meta && meta.isFinalized) {
      return { isFinalized: true, finalizedAt: meta.finalizedAt };
    }
  } catch (e) {}

  try {
    const lsFinal = localStorage.getItem(LS_FINAL_MASTER_TASKS_KEY);
    if (lsFinal) {
      const parsed = JSON.parse(lsFinal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return { isFinalized: true, count: parsed.length };
      }
    }
  } catch (e) {}

  return { isFinalized: false };
}

/**
 * Save and lock current tasks and members permanently as the FINAL MASTER DATA
 * so that when days change or new sessions start, the Fasilitator & Notulen arrangements
 * NEVER revert or shift!
 */
export async function saveAsFinalMaster(
  tasks: TaskAssignment[],
  members: TeamMember[]
): Promise<{ success: boolean; finalizedAt: string }> {
  const finalizedAt = new Date().toISOString();

  // Mark all tasks as locked & finalized
  const finalizedTasks = tasks.map((t) => ({
    ...t,
    locked: true,
    lockedAt: t.lockedAt || finalizedAt,
  }));

  const metadata = {
    isFinalized: true,
    finalizedAt,
    finalizedBy: 'Admin / Koordinator Paroki Katedral Medan',
    totalTasks: tasks.length,
    totalMembers: members.length,
  };

  // 1. Save to IndexedDB Final Master
  await idbSet('final_master_tasks', finalizedTasks);
  await idbSet('final_master_members', members);
  await idbSet('final_master_metadata', metadata);

  // 2. Also save to current active slots
  await idbSet('tasks', finalizedTasks);
  await idbSet('members', members);
  await idbSet('tasks_last_saved', finalizedAt);

  // 3. Mirror into localStorage permanent slots
  safeLocalStorageSet(LS_FINAL_MASTER_TASKS_KEY, finalizedTasks);
  safeLocalStorageSet(LS_FINAL_MASTER_MEMBERS_KEY, members);
  safeLocalStorageSet(LS_TASKS_KEY, finalizedTasks);
  safeLocalStorageSet(LS_MEMBERS_KEY, members);
  safeLocalStorageSet(LS_BACKUP_KEY, finalizedTasks);

  return { success: true, finalizedAt };
}

/**
 * Load tasks with multi-layer persistence.
 * Hierarchy:
 * 1. Final Master from IndexedDB (permanent)
 * 2. Final Master from localStorage (permanent)
 * 3. Active IndexedDB tasks
 * 4. Active localStorage tasks
 * 5. Backup snapshot
 * 6. INITIAL_ASSIGNMENTS fallback
 */
export async function loadPersistentTasks(): Promise<TaskAssignment[]> {
  // 1. Check permanent Final Master in IndexedDB
  try {
    const finalMasterIdb = await idbGet<TaskAssignment[]>('final_master_tasks');
    if (finalMasterIdb && Array.isArray(finalMasterIdb) && finalMasterIdb.length > 0) {
      // Also check if active tasks in IndexedDB have newer implementation data (jam, tanggal, foto)
      // but ensure Fasilitator & Notulen match the final master
      const activeIdb = await idbGet<TaskAssignment[]>('tasks');
      if (activeIdb && Array.isArray(activeIdb)) {
        return mergeWithFinalMaster(finalMasterIdb, activeIdb);
      }
      return finalMasterIdb;
    }
  } catch (e) {
    console.warn('Error reading final master from IndexedDB', e);
  }

  // 2. Check permanent Final Master in localStorage
  try {
    const lsFinal = localStorage.getItem(LS_FINAL_MASTER_TASKS_KEY);
    if (lsFinal) {
      const parsed = JSON.parse(lsFinal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        idbSet('final_master_tasks', parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (e) {}

  // 3. Try standard IndexedDB
  try {
    const idbData = await idbGet<TaskAssignment[]>('tasks');
    if (idbData && Array.isArray(idbData) && idbData.length > 0) {
      return idbData;
    }
  } catch (e) {
    console.warn('Error reading tasks from IndexedDB', e);
  }

  // 4. Fallback to standard localStorage
  try {
    const lsData = localStorage.getItem(LS_TASKS_KEY);
    if (lsData) {
      const parsed = JSON.parse(lsData);
      if (Array.isArray(parsed) && parsed.length > 0) {
        idbSet('tasks', parsed).catch(() => {});
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Error reading tasks from localStorage', e);
  }

  // 5. Fallback to Backup Snapshot if available
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
 * Merge implementation progress with immutable final master officers
 */
function mergeWithFinalMaster(
  finalMaster: TaskAssignment[],
  activeTasks: TaskAssignment[]
): TaskAssignment[] {
  return finalMaster.map((fm) => {
    const active = activeTasks.find(
      (a) => a.id === fm.id || a.namaDpl.toLowerCase().trim() === fm.namaDpl.toLowerCase().trim()
    );
    if (!active) return fm;

    return {
      ...fm,
      // If user edited fasilitator/notulen, active has the latest; otherwise fallback to fm
      fasilitator: active.fasilitator || fm.fasilitator,
      notulen: active.notulen || fm.notulen,
      // Implementation progress and schedule details always carry over and remain intact
      tanggalKonsultasi: active.tanggalKonsultasi !== undefined ? active.tanggalKonsultasi : fm.tanggalKonsultasi,
      hari: active.hari !== undefined ? active.hari : fm.hari,
      jam: active.jam !== undefined ? active.jam : fm.jam,
      kontakPic: active.kontakPic !== undefined ? active.kontakPic : fm.kontakPic,
      status: active.status !== undefined ? active.status : fm.status,
      terlaksana: active.terlaksana !== undefined ? active.terlaksana : fm.terlaksana,
      tempat: active.tempat || active.lokasiPelaksanaan || fm.tempat,
      lokasiPelaksanaan: active.lokasiPelaksanaan || active.tempat || fm.lokasiPelaksanaan,
      jumlahPeserta: active.jumlahPeserta !== undefined ? active.jumlahPeserta : fm.jumlahPeserta,
      fotoDokumentasi: active.fotoDokumentasi || fm.fotoDokumentasi,
      catatan: active.catatan !== undefined ? active.catatan : fm.catatan,
      locked: true,
      lockedAt: active.lockedAt || fm.lockedAt,
      updatedAt: active.updatedAt || fm.updatedAt,
    };
  });
}

/**
 * Load members with multi-layer persistence
 */
export async function loadPersistentMembers(): Promise<TeamMember[]> {
  try {
    const finalMasterMembers = await idbGet<TeamMember[]>('final_master_members');
    if (finalMasterMembers && Array.isArray(finalMasterMembers) && finalMasterMembers.length > 0) {
      return finalMasterMembers;
    }
  } catch (e) {}

  try {
    const lsFinal = localStorage.getItem(LS_FINAL_MASTER_MEMBERS_KEY);
    if (lsFinal) {
      const parsed = JSON.parse(lsFinal);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {}

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
