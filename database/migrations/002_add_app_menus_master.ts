import type { Firestore } from 'firebase/firestore';
import type { Migration } from '../types';
import { upsertMasterMenus } from '../seeds/seedMasterData';

export const migration: Migration = {
  id: '002_add_app_menus_master',
  name: 'Master Menu Navigasi Berversi',
  description: 'Mendaftarkan seluruh struktur menu aplikasi ke Firestore dengan ID stabil',
  async up(db: Firestore): Promise<void> {
    const menuCount = await upsertMasterMenus(db);
    console.log(`[Migration 002] Berhasil upsert ${menuCount} master menu aplikasi.`);
  },
};
