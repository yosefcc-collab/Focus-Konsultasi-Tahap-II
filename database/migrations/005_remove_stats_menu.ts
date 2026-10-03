import type { Firestore } from 'firebase/firestore';
import { doc, deleteDoc, setDoc } from 'firebase/firestore';
import type { Migration } from '../types';

export const migration: Migration = {
  id: '005_remove_stats_menu',
  name: 'Hapus Menu Statistik Rayon',
  description: 'Menonaktifkan dan menghapus menu Statistik & Rayon dari navigasi aplikasi',
  async up(db: Firestore): Promise<void> {
    try {
      const menuRef = doc(db, 'menus', 'menu-statistik');
      await deleteDoc(menuRef);
      console.log('[Migration 005] Sukses menghapus menu-statistik dari Firestore collection menus.');
    } catch (e) {
      console.warn('[Migration 005] Note saat menghapus menu-statistik:', e);
    }
  },
};
