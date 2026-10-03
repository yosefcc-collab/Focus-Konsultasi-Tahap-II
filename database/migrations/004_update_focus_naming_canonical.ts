import type { Firestore } from 'firebase/firestore';
import { doc, setDoc } from 'firebase/firestore';
import type { Migration } from '../types';
import dplMaster from '../master/dplMaster.json' with { type: 'json' };
import focusMaster from '../master/focusMaster.json' with { type: 'json' };

export const migration: Migration = {
  id: '004_update_focus_naming_canonical',
  name: 'Penyesuaian Penamaan Focus Dashboard Sesuai Filter',
  description: 'Menyeragamkan teks focusKonsultasi pada 21 tugas di Firestore agar persis sesuai nama Fokus pada Filter',
  async up(db: Firestore): Promise<void> {
    // 1. Perbarui focusKonsultasi pada seluruh 21 dokumen tasks dengan non-destructive merge
    let updatedCount = 0;
    for (const d of dplMaster) {
      const taskRef = doc(db, 'tasks', d.id);
      await setDoc(
        taskRef,
        {
          focusId: d.focusId,
          focusKonsultasi: d.focusKonsultasi,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
      updatedCount++;
    }

    // 2. Simpan master 4 Fokus ke Firestore collection 'focuses'
    for (const f of focusMaster) {
      const focusRef = doc(db, 'focuses', f.id);
      await setDoc(
        focusRef,
        {
          ...f,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    console.log(`[Migration 004] Sukses menyelaraskan ${updatedCount} dokumen tasks & 4 fokus master di Firestore.`);
  },
};
