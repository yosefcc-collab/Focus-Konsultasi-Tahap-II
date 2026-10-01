import type { Firestore } from 'firebase/firestore';
import type { Migration } from '../types';
import { upsertMasterTasks, upsertMasterMembers } from '../seeds/seedMasterData';

export const migration: Migration = {
  id: '001_initial_master_data',
  name: 'Initial Canonical Master Data (21 DPL/Kategorial & Petugas)',
  description: 'Memastikan 21 target sasaran & personil Tim Sinodal ber-ID stabil ter-upsert tanpa menghapus transaksi',
  async up(db: Firestore): Promise<void> {
    const taskCount = await upsertMasterTasks(db);
    const memberCount = await upsertMasterMembers(db);
    console.log(`[Migration 001] Berhasil upsert ${taskCount} sasaran master & ${memberCount} anggota.`);
  },
};
