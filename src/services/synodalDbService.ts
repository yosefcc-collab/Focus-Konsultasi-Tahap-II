import {
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  setDoc,
  deleteDoc,
  writeBatch,
  onSnapshot,
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { TaskAssignment, TeamMember, SavedResumeData } from '../types';

const TASKS_COLLECTION = 'tasks';
const MEMBERS_COLLECTION = 'members';
const METADATA_COLLECTION = 'metadata';
const RESUME_DOC_ID = 'resume_sinodal';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function testFirestoreConnection(): Promise<void> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}

/**
 * Fetch all tasks from Cloud Firestore
 * Returns null if the collection is completely empty (needs initial seed)
 */
export async function fetchCloudTasks(): Promise<TaskAssignment[] | null> {
  try {
    const colRef = collection(db, TASKS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      return null;
    }

    const tasks: TaskAssignment[] = [];
    snapshot.forEach((docSnap) => {
      tasks.push(docSnap.data() as TaskAssignment);
    });

    // Sort according to canonical list
    return tasks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
  } catch (err) {
    console.error('Error fetching tasks from Cloud Firestore:', err);
    return null;
  }
}

/**
 * Fetch all members from Cloud Firestore
 * Returns null if collection is empty
 */
export async function fetchCloudMembers(): Promise<TeamMember[] | null> {
  try {
    const colRef = collection(db, MEMBERS_COLLECTION);
    const snapshot = await getDocs(colRef);

    if (snapshot.empty) {
      return null;
    }

    const members: TeamMember[] = [];
    snapshot.forEach((docSnap) => {
      members.push(docSnap.data() as TeamMember);
    });

    return members;
  } catch (err) {
    console.error('Error fetching members from Cloud Firestore:', err);
    return null;
  }
}

/**
 * Save / Update a single task in Cloud Firestore
 */
export async function saveTaskToCloud(task: TaskAssignment): Promise<void> {
  try {
    const docRef = doc(db, TASKS_COLLECTION, task.id);
    await setDoc(docRef, task, { merge: true });

    // Also update metadata
    const metaRef = doc(db, METADATA_COLLECTION, 'system');
    await setDoc(
      metaRef,
      {
        lastUpdatedTask: task.namaDpl,
        lastUpdatedAt: new Date().toISOString(),
      },
      { merge: true }
    );
  } catch (err) {
    console.error(`Error saving task ${task.id} to Cloud Firestore:`, err);
    throw err;
  }
}

/**
 * Batch save tasks to Cloud Firestore
 */
export async function saveTasksBatchToCloud(tasks: TaskAssignment[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const task of tasks) {
      const docRef = doc(db, TASKS_COLLECTION, task.id);
      batch.set(docRef, task, { merge: true });
    }
    await batch.commit();
  } catch (err) {
    console.error('Error batch saving tasks to Cloud Firestore:', err);
    throw err;
  }
}

/**
 * Save / Update a member in Cloud Firestore
 */
export async function saveMemberToCloud(member: TeamMember): Promise<void> {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, member.id);
    await setDoc(docRef, member, { merge: true });
  } catch (err) {
    console.error(`Error saving member ${member.id} to Cloud Firestore:`, err);
    throw err;
  }
}

/**
 * Delete a member from Cloud Firestore
 */
export async function deleteMemberFromCloud(memberId: string): Promise<void> {
  try {
    const docRef = doc(db, MEMBERS_COLLECTION, memberId);
    await deleteDoc(docRef);
  } catch (err) {
    console.error(`Error deleting member ${memberId} from Cloud Firestore:`, err);
    throw err;
  }
}

/**
 * Seed initial data to Cloud Firestore if cloud database is empty.
 * Does NOT overwrite existing records if already populated.
 */
export async function seedInitialDataToCloud(
  initialTasks: TaskAssignment[],
  initialMembers: TeamMember[]
): Promise<{ taskCount: number; memberCount: number; seeded: boolean }> {
  try {
    const existingTasks = await fetchCloudTasks();
    if (existingTasks && existingTasks.length > 0) {
      // Cloud database already has data, do not overwrite!
      return {
        taskCount: existingTasks.length,
        memberCount: (await fetchCloudMembers())?.length || initialMembers.length,
        seeded: false,
      };
    }

    // Seed tasks
    const batch = writeBatch(db);
    for (const task of initialTasks) {
      const docRef = doc(db, TASKS_COLLECTION, task.id);
      batch.set(docRef, task);
    }

    // Seed members
    for (const member of initialMembers) {
      const docRef = doc(db, MEMBERS_COLLECTION, member.id);
      batch.set(docRef, member);
    }

    // Metadata
    const metaRef = doc(db, METADATA_COLLECTION, 'system');
    batch.set(metaRef, {
      paroki: 'Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan',
      initialSeedAt: new Date().toISOString(),
      taskCount: initialTasks.length,
      memberCount: initialMembers.length,
    });

    await batch.commit();

    return {
      taskCount: initialTasks.length,
      memberCount: initialMembers.length,
      seeded: true,
    };
  } catch (err) {
    console.error('Error seeding initial data to Cloud Firestore:', err);
    throw err;
  }
}

/**
 * Subscribe to real-time updates for Tasks collection
 */
export function subscribeCloudTasks(
  onUpdate: (tasks: TaskAssignment[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, TASKS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const tasks: TaskAssignment[] = [];
        snapshot.forEach((d) => tasks.push(d.data() as TaskAssignment));
        tasks.sort((a, b) => a.id.localeCompare(b.id, undefined, { numeric: true }));
        onUpdate(tasks);
      }
    },
    (err) => {
      console.warn('Real-time listener error for tasks:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribe to real-time updates for Members collection
 */
export function subscribeCloudMembers(
  onUpdate: (members: TeamMember[]) => void,
  onError?: (err: Error) => void
): () => void {
  const colRef = collection(db, MEMBERS_COLLECTION);
  return onSnapshot(
    colRef,
    (snapshot) => {
      if (!snapshot.empty) {
        const members: TeamMember[] = [];
        snapshot.forEach((d) => members.push(d.data() as TeamMember));
        onUpdate(members);
      }
    },
    (err) => {
      console.warn('Real-time listener error for members:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Fetch saved curated Resume from Cloud Firestore
 */
export async function fetchCloudResume(): Promise<SavedResumeData | null> {
  const path = `${METADATA_COLLECTION}/${RESUME_DOC_ID}`;
  try {
    const docRef = doc(db, METADATA_COLLECTION, RESUME_DOC_ID);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return snap.data() as SavedResumeData;
  } catch (err) {
    console.warn('Error fetching resume from Cloud Firestore:', err);
    return null;
  }
}

/**
 * Save curated Resume to Cloud Firestore
 */
export async function saveResumeToCloud(resumeData: SavedResumeData): Promise<void> {
  const path = `${METADATA_COLLECTION}/${RESUME_DOC_ID}`;
  try {
    const docRef = doc(db, METADATA_COLLECTION, RESUME_DOC_ID);
    await setDoc(docRef, resumeData, { merge: false });
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, path);
  }
}

/**
 * Subscribe to real-time updates for Resume document
 */
export function subscribeCloudResume(
  onUpdate: (resumeData: SavedResumeData) => void,
  onError?: (err: Error) => void
): () => void {
  const docRef = doc(db, METADATA_COLLECTION, RESUME_DOC_ID);
  return onSnapshot(
    docRef,
    (snapshot) => {
      if (snapshot.exists()) {
        onUpdate(snapshot.data() as SavedResumeData);
      }
    },
    (err) => {
      console.warn('Real-time listener error for resume:', err);
      if (onError) onError(err);
    }
  );
}

