import {
  Firestore,
  doc,
  getDoc,
  setDoc,
  writeBatch,
} from 'firebase/firestore';
import appMenus from '../master/appMenus.json' with { type: 'json' };
import dplMaster from '../master/dplMaster.json' with { type: 'json' };
import { TEAM_MEMBERS } from '../../src/data/initialData';

/**
 * Non-destructive UPSERT for App Menus
 */
export async function upsertMasterMenus(db: Firestore): Promise<number> {
  let count = 0;
  for (const menu of appMenus) {
    const docRef = doc(db, 'menus', menu.id);
    await setDoc(docRef, {
      ...menu,
      updatedAt: new Date().toISOString(),
    }, { merge: true });
    count++;
  }
  return count;
}

/**
 * Non-destructive UPSERT for DPL & Kategorial Master Tasks
 * PRESERVES ALL TRANSACTION DATA (Dates, Times, Locations, Notes, Attendance, Photos)
 */
export async function upsertMasterTasks(db: Firestore): Promise<number> {
  let count = 0;
  for (const master of dplMaster) {
    const docRef = doc(db, 'tasks', master.id);
    const existingSnap = await getDoc(docRef);

    if (existingSnap.exists()) {
      const current = existingSnap.data();
      // Keep transaction fields intact
      const merged = {
        // Master fields (governed by Git version-control)
        id: master.id,
        namaDpl: master.namaDpl,
        category: master.category,
        focusId: master.focusId,
        focusKonsultasi: master.focusKonsultasi,
        fasilitator: master.fasilitator,
        notulen: master.notulen,
        locked: true,

        // Transaction fields (preserved from live production user input)
        tanggalKonsultasi: current.tanggalKonsultasi || '',
        hari: current.hari || '',
        jam: current.jam || '',
        status: current.status || 'belum_ditentukan',
        tempat: current.tempat || current.lokasiPelaksanaan || '',
        lokasiPelaksanaan: current.lokasiPelaksanaan || current.tempat || '',
        kontakPic: current.kontakPic || '',
        terlaksana: current.terlaksana ?? false,
        jumlahPeserta: current.jumlahPeserta ?? '',
        fotoDokumentasi: current.fotoDokumentasi || '',
        fotoNama: current.fotoNama || '',
        catatan: current.catatan || '',
        updatedAt: current.updatedAt || new Date().toISOString(),
      };
      await setDoc(docRef, merged, { merge: true });
    } else {
      // New master item added
      const newItem = {
        id: master.id,
        namaDpl: master.namaDpl,
        category: master.category,
        focusId: master.focusId,
        focusKonsultasi: master.focusKonsultasi,
        fasilitator: master.fasilitator,
        notulen: master.notulen,
        tanggalKonsultasi: '',
        hari: '',
        jam: '',
        status: 'belum_ditentukan',
        tempat: '',
        lokasiPelaksanaan: '',
        kontakPic: '',
        terlaksana: false,
        jumlahPeserta: '',
        fotoDokumentasi: '',
        fotoNama: '',
        catatan: '',
        locked: true,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, newItem, { merge: true });
    }
    count++;
  }
  return count;
}

/**
 * Non-destructive UPSERT for Initial Team Members
 */
export async function upsertMasterMembers(db: Firestore): Promise<number> {
  const batch = writeBatch(db);
  let count = 0;
  for (const member of TEAM_MEMBERS) {
    const docRef = doc(db, 'members', member.id);
    batch.set(docRef, {
      id: member.id,
      name: member.name,
      origin: member.origin,
      phone: member.phone || '',
    }, { merge: true });
    count++;
  }
  await batch.commit();
  return count;
}
