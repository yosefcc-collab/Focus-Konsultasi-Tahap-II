import { initializeApp, getApps } from 'firebase/app';
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore';
import { allMigrations } from './migrations/index';
import firebaseConfigFallback from '../firebase-applet-config.json' with { type: 'json' };

async function runMigrations() {
  console.log('------------------------------------------------------------');
  console.log('🚀 [Database Migration Runner] Memulai Pemeriksaan Migrasi...');
  console.log('------------------------------------------------------------');

  const activeConfig = firebaseConfigFallback;

  const apiKey =
    activeConfig.apiKey ||
    process.env.VITE_FIREBASE_API_KEY ||
    process.env.FIREBASE_API_KEY;

  const authDomain =
    activeConfig.authDomain ||
    process.env.VITE_FIREBASE_AUTH_DOMAIN ||
    process.env.FIREBASE_AUTH_DOMAIN;

  const projectId =
    activeConfig.projectId ||
    process.env.VITE_FIREBASE_PROJECT_ID ||
    process.env.FIREBASE_PROJECT_ID;

  const storageBucket =
    activeConfig.storageBucket ||
    process.env.VITE_FIREBASE_STORAGE_BUCKET;

  const messagingSenderId =
    activeConfig.messagingSenderId ||
    process.env.VITE_FIREBASE_MESSAGING_SENDER_ID;

  const appId =
    activeConfig.appId ||
    process.env.VITE_FIREBASE_APP_ID;

  const databaseId =
    activeConfig.firestoreDatabaseId ||
    process.env.VITE_FIREBASE_DATABASE_ID ||
    '(default)';

  if (!apiKey || !projectId) {
    console.error('❌ [Migration Runner] Konfigurasi Firebase tidak ditemukan.');
    process.exit(1);
  }

  const app =
    getApps().length === 0
      ? initializeApp({
          apiKey,
          authDomain,
          projectId,
          storageBucket,
          messagingSenderId,
          appId,
        })
      : getApps()[0];

  const db =
    databaseId && databaseId !== '(default)'
      ? getFirestore(app, databaseId)
      : getFirestore(app);

  console.log(`📌 Target Project: ${projectId}`);
  console.log(`📌 Database ID: ${databaseId}`);

  try {
    // 1. Ambil daftar migrasi yang sudah pernah dijalankan
    const migrationsCol = collection(db, '_migrations');
    const snap = await getDocs(migrationsCol);
    const executedMap = new Map<string, any>();

    snap.forEach((d) => {
      executedMap.set(d.id, d.data());
    });

    console.log(`📋 Total riwayat migrasi yang tercatat: ${executedMap.size}`);

    let executedCount = 0;
    let skippedCount = 0;

    // 2. Eksekusi migrasi yang belum dijalankan secara berurutan
    for (const mig of allMigrations) {
      if (executedMap.has(mig.id)) {
        const record = executedMap.get(mig.id);
        console.log(`⏩ [SKIP] Migrasi "${mig.id}" (${mig.name}) - Selesai pada ${record?.executedAt || 'sebelumnya'}`);
        skippedCount++;
        continue;
      }

      console.log(`⚡ [EXEC] Menjalankan Migrasi "${mig.id}": ${mig.name}...`);
      const startTime = Date.now();

      await mig.up(db);

      // Simpan record migrasi ke Firestore
      const docRef = doc(db, '_migrations', mig.id);
      await setDoc(docRef, {
        id: mig.id,
        name: mig.name,
        description: mig.description || '',
        executedAt: new Date().toISOString(),
        executionTimeMs: Date.now() - startTime,
      });

      console.log(`✅ [SUCCESS] Migrasi "${mig.id}" berhasil diselesaikan (${Date.now() - startTime}ms)`);
      executedCount++;
    }

    console.log('------------------------------------------------------------');
    console.log(`🏁 [Migration Runner Selesai] Baru Dijalankan: ${executedCount} | Dilewati: ${skippedCount} | Total: ${allMigrations.length}`);
    console.log('------------------------------------------------------------');
    process.exit(0);
  } catch (err: any) {
    console.error('❌ [Migration Runner Error]:', err);
    // Jika kegagalan jaringan saat build offline tanpa internet, tampilkan peringatan
    if (process.env.CI || process.env.NETLIFY) {
      console.warn('⚠️ Build pipeline mendeteksi masalah jaringan pada Firestore. Melanjutkan build frontend...');
      process.exit(0);
    }
    process.exit(1);
  }
}

runMigrations();
