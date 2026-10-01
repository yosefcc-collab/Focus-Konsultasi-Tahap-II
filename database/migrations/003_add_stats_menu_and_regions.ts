import type { Firestore } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import type { Migration } from '../types';
import regionsMaster from '../master/regionsMaster.json' with { type: 'json' };
import appMenus from '../master/appMenus.json' with { type: 'json' };

export const migration: Migration = {
  id: '003_add_stats_menu_and_regions',
  name: 'Tambah Menu Statistik & Master Data Rayon Wilayah Paroki',
  description: 'Mendaftarkan menu Statistik (Stats) dan master data 4 Rayon Paroki Katedral Medan',
  async up(db: Firestore): Promise<void> {
    // 1. Upsert menu statistik
    const statMenu = appMenus.find((m) => m.id === 'menu-statistik');
    if (statMenu) {
      const menuRef = doc(db, 'menus', statMenu.id);
      await setDoc(menuRef, {
        ...statMenu,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    // 2. Upsert master data rayon wilayah
    for (const rayon of regionsMaster) {
      const rayonRef = doc(db, 'regions', rayon.id);
      await setDoc(rayonRef, {
        ...rayon,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
    }

    console.log(`[Migration 003] Berhasil mendaftarkan Menu Statistik & ${regionsMaster.length} Rayon Wilayah ke Firestore.`);
  },
};
