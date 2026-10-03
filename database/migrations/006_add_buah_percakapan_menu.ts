import type { Firestore } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import type { Migration } from '../types';
import appMenus from '../master/appMenus.json' with { type: 'json' };

export const migration: Migration = {
  id: '006_add_buah_percakapan_menu',
  name: 'Tambah Menu Rekapitulasi Buah Percakapan',
  description: 'Mendaftarkan menu Buah Percakapan sebagai menu sintesis per fokus di Firestore',
  async up(db: Firestore): Promise<void> {
    const buahMenu = appMenus.find((m) => m.id === 'menu-buah-percakapan');
    if (buahMenu) {
      const menuRef = doc(db, 'menus', buahMenu.id);
      await setDoc(
        menuRef,
        {
          ...buahMenu,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }
    console.log('[Migration 006] Sukses mendaftarkan menu-buah-percakapan ke Firestore.');
  },
};
