import type { Firestore } from 'firebase/firestore';

export interface Migration {
  id: string; // e.g. "001_initial_master_data"
  name: string;
  description?: string;
  up: (db: Firestore) => Promise<void>;
}

export interface MigrationRecord {
  id: string;
  name: string;
  executedAt: string;
  batch: number;
}
