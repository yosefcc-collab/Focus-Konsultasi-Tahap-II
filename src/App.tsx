/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Church,
  Calendar,
  Layers,
  Users,
  Table,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Share2,
  Download,
  Database,
  CheckSquare,
  Laptop,
  Lock,
  ShieldCheck,
  RotateCcw,
  Award,
  Check,
  Github,
} from 'lucide-react';
import { TaskAssignment, CategoryType, FocusType, ScheduleStatus, TeamMember, SynodalExportData } from './types';
import {
  INITIAL_ASSIGNMENTS,
  TEAM_MEMBERS,
  FOCUS_LIST,
  formatIndonesianDate,
} from './data/initialData';
import {
  loadPersistentTasks,
  loadPersistentMembers,
  savePersistentTasks,
  savePersistentMembers,
  getBackupSnapshot,
  saveAsFinalMaster,
  getFinalMasterStatus,
} from './utils/persistentStorage';
import { TaskCard } from './components/TaskCard';
import { EditScheduleModal } from './components/EditScheduleModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { DataSyncModal } from './components/DataSyncModal';
import { AdminMergePanel } from './components/AdminMergePanel';
import { FocusTab } from './components/FocusTab';
import { MembersTab } from './components/MembersTab';
import { MatrixTab } from './components/MatrixTab';
import { GuideTab } from './components/GuideTab';
import { triggerAutoSyncToGitHub } from './utils/githubSync';
import {
  fetchCloudTasks,
  fetchCloudMembers,
  saveTaskToCloud,
  saveTasksBatchToCloud,
  saveMemberToCloud,
  deleteMemberFromCloud,
  seedInitialDataToCloud,
  subscribeCloudTasks,
  subscribeCloudMembers,
} from './services/synodalDbService';

const TASKS_STORAGE_KEY = 'tim_sinodal_katedral_medan_tasks_v2';
const MEMBERS_STORAGE_KEY = 'tim_sinodal_katedral_medan_members_v2';

export default function App() {
  const isInitialLoadComplete = useRef(false);

  const [tasks, setTasks] = useState<TaskAssignment[]>(() => {
    try {
      // Check final master in localStorage first
      const finalSaved = localStorage.getItem('tim_sinodal_final_master_tasks_permanent');
      if (finalSaved) {
        const parsed = JSON.parse(finalSaved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading tasks localStorage', e);
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [members, setMembers] = useState<TeamMember[]>(() => {
    try {
      const finalSaved = localStorage.getItem('tim_sinodal_final_master_members_permanent');
      if (finalSaved) {
        const parsed = JSON.parse(finalSaved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
      const saved = localStorage.getItem(MEMBERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading members localStorage', e);
    }
    return TEAM_MEMBERS;
  });

  const [activeTab, setActiveTab] = useState<'tasks' | 'focus' | 'members' | 'matrix' | 'guide'>('tasks');
  const [editingTask, setEditingTask] = useState<TaskAssignment | null>(null);
  const [whatsAppTask, setWhatsAppTask] = useState<TaskAssignment | null>(null);
  const [isDataSyncOpen, setIsDataSyncOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState<string>('Tersimpan Aman');
  const [hasBackupSnapshot, setHasBackupSnapshot] = useState(false);
  const [isFinalMasterLocked, setIsFinalMasterLocked] = useState(true);
  const [finalMasterDate, setFinalMasterDate] = useState<string>('');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [syncToast, setSyncToast] = useState<{
    message: string;
    type: 'success' | 'info' | 'error';
    isGitHub?: boolean;
  } | null>(null);

  useEffect(() => {
    if (syncToast) {
      const timer = setTimeout(() => setSyncToast(null), 4000);
      return () => clearTimeout(timer);
    }
  }, [syncToast]);

  // Filters for main tasks view
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryType>('all');
  const [focusFilter, setFocusFilter] = useState<'all' | FocusType>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'terlaksana' | 'terjadwal' | 'belum_ditentukan'>('all');

  // 1. Load data from IndexedDB cache + Cloud Firestore (Single Source of Truth)
  useEffect(() => {
    let isMounted = true;
    let unsubTasks: (() => void) | null = null;
    let unsubMembers: (() => void) | null = null;

    async function initializeDataPipeline() {
      // Step A: Load local IndexedDB cache first for instant UI response
      try {
        const [loadedTasks, loadedMembers, finalStatus] = await Promise.all([
          loadPersistentTasks(),
          loadPersistentMembers(),
          getFinalMasterStatus(),
        ]);

        if (isMounted) {
          if (loadedTasks && loadedTasks.length > 0) setTasks(loadedTasks);
          if (loadedMembers && loadedMembers.length > 0) setMembers(loadedMembers);
          if (finalStatus.isFinalized) {
            setIsFinalMasterLocked(true);
            if (finalStatus.finalizedAt) {
              setFinalMasterDate(new Date(finalStatus.finalizedAt).toLocaleDateString('id-ID'));
            }
          }
        }
      } catch (err) {
        console.warn('Local persistent cache read note:', err);
      } finally {
        isInitialLoadComplete.current = true;
      }

      // Step B: Cloud Firestore integration (Persists across Netlify, devices & sessions)
      try {
        // Safe seed: write current valid tasks & members if Cloud Firestore is empty
        await seedInitialDataToCloud(tasks, members);

        // Fetch latest authoritative cloud data
        const [cloudTasks, cloudMembers] = await Promise.all([
          fetchCloudTasks(),
          fetchCloudMembers(),
        ]);

        if (isMounted) {
          if (cloudTasks && cloudTasks.length > 0) {
            setTasks(cloudTasks);
            savePersistentTasks(cloudTasks).catch(() => {});
            saveAsFinalMaster(cloudTasks, members).catch(() => {});
          }
          if (cloudMembers && cloudMembers.length > 0) {
            setMembers(cloudMembers);
            savePersistentMembers(cloudMembers).catch(() => {});
          }
        }

        // Step C: Real-time listener so any edits in Netlify or AI Studio sync instantly!
        unsubTasks = subscribeCloudTasks((updatedTasks) => {
          if (isMounted && updatedTasks && updatedTasks.length > 0) {
            setTasks(updatedTasks);
            savePersistentTasks(updatedTasks).catch(() => {});
          }
        });

        unsubMembers = subscribeCloudMembers((updatedMembers) => {
          if (isMounted && updatedMembers && updatedMembers.length > 0) {
            setMembers(updatedMembers);
            savePersistentMembers(updatedMembers).catch(() => {});
          }
        });
      } catch (cloudErr) {
        console.warn('Cloud database sync note:', cloudErr);
      }
    }

    initializeDataPipeline();

    getBackupSnapshot().then((snapshot) => {
      if (snapshot && snapshot.tasks) {
        setHasBackupSnapshot(true);
      }
    });

    return () => {
      isMounted = false;
      if (unsubTasks) unsubTasks();
      if (unsubMembers) unsubMembers();
    };
  }, []);

  // Automatically save to IndexedDB, LocalStorage, and Backup Snapshot on any change
  // GUARDED by isInitialLoadComplete so initial default state never overwrites real persistent data!
  useEffect(() => {
    if (!isInitialLoadComplete.current) return;

    savePersistentTasks(tasks)
      .then(() => {
        const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
        setStorageStatus(`Tersimpan ${timeStr}`);
      })
      .catch((err) => {
        console.error('Save error', err);
      });
  }, [tasks]);

  useEffect(() => {
    if (!isInitialLoadComplete.current) return;
    savePersistentMembers(members).catch((err) => console.error(err));
  }, [members]);

  // Auto-sync helper to GitHub if token/repo is configured
  const syncChangeToGitHub = (
    currentTasks: TaskAssignment[],
    currentMembers: TeamMember[],
    changeDesc: string
  ) => {
    triggerAutoSyncToGitHub(
      currentTasks,
      currentMembers,
      isFinalMasterLocked,
      finalMasterDate,
      changeDesc
    ).then((result) => {
      if (result.attempted && result.success) {
        setSyncToast({
          message: result.message || 'Perubahan petugas tersimpan valid & otomatis tersinkron ke GitHub!',
          type: 'success',
          isGitHub: true,
        });
      } else if (result.attempted && !result.success) {
        setSyncToast({
          message: `Data tersimpan valid di perangkat. Info GitHub: ${result.error}`,
          type: 'info',
          isGitHub: true,
        });
      } else {
        setSyncToast({
          message: 'Data petugas tersimpan valid di memori perangkat.',
          type: 'success',
        });
      }
    });
  };

  const handleSaveTask = (updatedTask: TaskAssignment) => {
    const taskToSave: TaskAssignment = {
      ...updatedTask,
      locked: true,
      updatedAt: new Date().toISOString(),
    };
    const newTasks = tasks.map((t) => (t.id === taskToSave.id ? taskToSave : t));
    setTasks(newTasks);
    setHasPendingChanges(false);

    // Save to local multi-layer cache
    savePersistentTasks(newTasks).catch((e) => console.error(e));
    saveAsFinalMaster(newTasks, members).catch((e) => console.error(e));

    // Save directly to Cloud Firestore (Single Source of Truth across Netlify & devices)
    saveTaskToCloud(taskToSave)
      .then(() => {
        setSyncToast({
          message: `Perubahan di ${updatedTask.namaDpl} berhasil tersimpan ke Cloud Database!`,
          type: 'success',
        });
      })
      .catch((err) => {
        console.warn('Cloud save error:', err);
        setSyncToast({
          message: `Perubahan tersimpan permanen di perangkat.`,
          type: 'success',
        });
      });

    syncChangeToGitHub(
      newTasks,
      members,
      `Ubah petugas di ${updatedTask.namaDpl} (Fasilitator: ${updatedTask.fasilitator}, Notulen: ${updatedTask.notulen})`
    );
  };

  const handleDownloadBackupJson = () => {
    const backupData: SynodalExportData = {
      appName: 'Tim Sinodal Paroki Katedral Medan',
      paroki: 'Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan',
      version: '2.0.0-final-master',
      exportedAt: new Date().toISOString(),
      exportedBy: 'Koordinator Tim Sinodal',
      totalTasks: tasks.length,
      totalMembers: members.length,
      tasks,
      members,
    };
    const jsonStr = JSON.stringify(backupData, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `DATA-AKHIR-TIM-SINODAL-KATEDRAL-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Safe open task: prompts if locked
  const handleEditTaskSafe = (taskToEdit: TaskAssignment) => {
    setEditingTask(taskToEdit);
  };

  const handleAddMember = (newMember: TeamMember) => {
    const newMembers = [...members, newMember];
    setMembers(newMembers);
    setHasPendingChanges(false);
    savePersistentMembers(newMembers).catch((e) => console.error(e));
    saveAsFinalMaster(tasks, newMembers).catch((e) => console.error(e));
    saveMemberToCloud(newMember).catch((e) => console.warn('Cloud member save note:', e));
    syncChangeToGitHub(tasks, newMembers, `Tambah petugas baru: ${newMember.name}`);
  };

  const handleEditMember = (
    updatedMember: TeamMember,
    oldName?: string,
    updateInTasks?: boolean
  ) => {
    const newMembers = members.map((m) => (m.id === updatedMember.id ? updatedMember : m));
    setMembers(newMembers);
    setHasPendingChanges(false);
    savePersistentMembers(newMembers).catch((e) => console.error(e));

    let currentTasks = tasks;
    if (updateInTasks && oldName && oldName.toLowerCase() !== updatedMember.name.toLowerCase()) {
      currentTasks = tasks.map((t) => {
        let newFas = t.fasilitator;
        let newNot = t.notulen;
        if (isPersonMatched(t.fasilitator, oldName)) {
          newFas = updatedMember.name;
        }
        if (isPersonMatched(t.notulen, oldName)) {
          newNot = updatedMember.name;
        }
        return { ...t, fasilitator: newFas, notulen: newNot, updatedAt: new Date().toISOString() };
      });
      setTasks(currentTasks);
      savePersistentTasks(currentTasks).catch((e) => console.error(e));
      saveTasksBatchToCloud(currentTasks).catch((e) => console.warn('Cloud batch save note:', e));
    }

    saveAsFinalMaster(currentTasks, newMembers).catch((e) => console.error(e));
    saveMemberToCloud(updatedMember).catch((e) => console.warn('Cloud member update note:', e));
    syncChangeToGitHub(
      currentTasks,
      newMembers,
      `Perbarui petugas: ${updatedMember.name}${updateInTasks ? ' (diperbarui di 21 sasaran)' : ''}`
    );
  };

  const handleDeleteMember = (memberId: string) => {
    const deleted = members.find((m) => m.id === memberId);
    const newMembers = members.filter((m) => m.id !== memberId);
    setMembers(newMembers);
    setHasPendingChanges(false);
    savePersistentMembers(newMembers).catch((e) => console.error(e));
    saveAsFinalMaster(tasks, newMembers).catch((e) => console.error(e));
    deleteMemberFromCloud(memberId).catch((e) => console.warn('Cloud member delete note:', e));
    syncChangeToGitHub(tasks, newMembers, `Hapus petugas: ${deleted?.name || memberId}`);
  };

  // Safe Reset: requires typing confirmation and makes backup snapshot
  const handleResetToDefault = () => {
    if (isFinalMasterLocked) {
      alert('DATA AKHIR SEDANG TERKUNCI PERMANEN.\nUntuk menjaga konsistensi paroki, reset dinonaktifkan.');
      return;
    }

    const confirmInput = window.prompt(
      'PERINGATAN KEAMANAN DATA:\nTindakan ini akan mengembalikan seluruh jadwal ke data awal paroki.\n\nKetik "RESET" dengan huruf kapital untuk mengonfirmasi:'
    );
    if (confirmInput === 'RESET') {
      setTasks(INITIAL_ASSIGNMENTS);
      setMembers(TEAM_MEMBERS);
      savePersistentTasks(INITIAL_ASSIGNMENTS);
      savePersistentMembers(TEAM_MEMBERS);
      alert('Data telah dikembalikan ke data awal paroki.');
    }
  };

  // Import / Merge handler for central unified data
  const handleImportData = (
    incomingTasks: TaskAssignment[],
    incomingMembers?: TeamMember[],
    mode: 'merge' | 'replace' = 'merge'
  ) => {
    if (mode === 'replace') {
      setTasks(incomingTasks);
      if (incomingMembers && incomingMembers.length > 0) {
        setMembers(incomingMembers);
      }
    } else {
      // Merge updates
      setTasks((prev) => {
        return prev.map((curr) => {
          const incoming = incomingTasks.find(
            (inc) =>
              inc.id === curr.id ||
              inc.namaDpl.toLowerCase().trim() === curr.namaDpl.toLowerCase().trim()
          );
          if (!incoming) return curr;

          // IMMUTABLE FASILITATOR & NOTULEN: When Final Master is locked, Fasilitator & Notulen NEVER change!
          const finalFas = isFinalMasterLocked ? curr.fasilitator : (incoming.fasilitator || curr.fasilitator);
          const finalNot = isFinalMasterLocked ? curr.notulen : (incoming.notulen || curr.notulen);

          return {
            ...curr,
            fasilitator: finalFas,
            notulen: finalNot,
            tanggalKonsultasi: incoming.tanggalKonsultasi || curr.tanggalKonsultasi,
            hari: incoming.hari || curr.hari,
            jam: incoming.jam || curr.jam,
            kontakPic: incoming.kontakPic || curr.kontakPic,
            status: incoming.status || curr.status,
            terlaksana: incoming.terlaksana ?? curr.terlaksana,
            tempat: incoming.tempat || incoming.lokasiPelaksanaan || curr.tempat,
            lokasiPelaksanaan: incoming.lokasiPelaksanaan || incoming.tempat || curr.lokasiPelaksanaan,
            jumlahPeserta:
              incoming.jumlahPeserta !== undefined && incoming.jumlahPeserta !== ''
                ? incoming.jumlahPeserta
                : curr.jumlahPeserta,
            fotoDokumentasi: incoming.fotoDokumentasi || curr.fotoDokumentasi,
            catatan: incoming.catatan || curr.catatan,
            locked: isFinalMasterLocked ? true : (incoming.locked ?? curr.locked),
            lockedAt: curr.lockedAt || incoming.lockedAt,
            updatedAt: incoming.updatedAt || new Date().toISOString(),
          };
        });
      });

      if (incomingMembers && incomingMembers.length > 0 && !isFinalMasterLocked) {
        setMembers((prev) => {
          const merged = [...prev];
          incomingMembers.forEach((im) => {
            const idx = merged.findIndex(
              (m) => m.name.toLowerCase().trim() === im.name.toLowerCase().trim()
            );
            if (idx >= 0) {
              merged[idx] = { ...merged[idx], ...im };
            } else {
              merged.push(im);
            }
          });
          return merged;
        });
      }
    }
  };

  // Helper matching names (e.g. Desyre and Desry)
  const isPersonMatched = (personName: string, query: string) => {
    if (!query || query === 'all') return true;
    const p = personName.toLowerCase().trim();
    const q = query.toLowerCase().trim();
    if (p === q) return true;
    if ((p.includes('desy') || p.includes('desr')) && (q.includes('desy') || q.includes('desr'))) return true;
    return false;
  };

  // Filter tasks logic
  const filteredTasks = tasks.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (focusFilter !== 'all' && t.focusId !== focusFilter) return false;

    // Status filter
    if (statusFilter === 'terlaksana' && !(t.terlaksana || t.status === 'selesai')) return false;
    if (statusFilter === 'terjadwal' && (!t.tanggalKonsultasi || t.status === 'belum_ditentukan' || t.terlaksana))
      return false;
    if (statusFilter === 'belum_ditentukan' && (t.tanggalKonsultasi && t.status !== 'belum_ditentukan')) return false;

    if (memberFilter !== 'all') {
      const matchFas = isPersonMatched(t.fasilitator, memberFilter);
      const matchNot = isPersonMatched(t.notulen, memberFilter);
      if (!matchFas && !matchNot) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDpl = t.namaDpl.toLowerCase().includes(q);
      const matchFas = t.fasilitator.toLowerCase().includes(q);
      const matchNot = t.notulen.toLowerCase().includes(q);
      const matchFocus = t.focusKonsultasi.toLowerCase().includes(q);
      const matchHari = t.hari.toLowerCase().includes(q);
      const matchTempat = (t.tempat || t.lokasiPelaksanaan || '').toLowerCase().includes(q);
      if (!matchDpl && !matchFas && !matchNot && !matchFocus && !matchHari && !matchTempat) return false;
    }
    return true;
  });

  // KPI Statistics
  const totalTasks = tasks.length;
  const lingkunganCount = tasks.filter((t) => t.category === 'Lingkungan').length;
  const kategorialCount = tasks.filter((t) => t.category === 'Kategorial').length;
  const completedCount = tasks.filter((t) => t.terlaksana || t.status === 'selesai').length;
  const scheduledCount = tasks.filter((t) => t.tanggalKonsultasi && t.status !== 'belum_ditentukan').length;
  const pendingCount = totalTasks - scheduledCount;
  const lockedCount = tasks.filter((t) => !!t.locked).length;

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 bg-red-900 text-white shadow-md border-b border-red-950/40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center font-bold shadow-xs shrink-0">
              <Church className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <div
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 leading-snug truncate max-w-[280px] sm:max-w-lg"
                title="Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan"
              >
                Paroki St Perawan Maria Dikandung Tanpa Noda
              </div>
              <div className="text-[9px] sm:text-[10px] text-red-200 font-medium truncate max-w-[280px] sm:max-w-lg">
                Katedral Keuskupan Agung Medan
              </div>
              <h1 className="text-xs sm:text-base font-extrabold leading-tight text-white truncate mt-0.5">
                Tim Sinodal • Penugasan Konsultasi
              </h1>
            </div>
          </div>
        </div>

        {/* Top Desktop & Tablet Navigation */}
        <div className="hidden sm:block border-t border-red-800/80 bg-red-950/30">
          <div className="max-w-4xl mx-auto px-4 flex gap-1">
            {[
              { id: 'tasks', label: 'Penugasan (21)', icon: Layers },
              { id: 'focus', label: '4 Fokus', icon: Calendar },
              { id: 'members', label: `Petugas (${members.length})`, icon: Users },
              { id: 'matrix', label: 'Matriks Tabel', icon: Table },
              { id: 'guide', label: 'Panduan', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                    isActive
                      ? 'border-amber-400 text-amber-300 bg-red-900/60 font-bold'
                      : 'border-transparent text-red-200 hover:text-white hover:bg-red-900/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto p-3 sm:p-4 flex-1">
        {/* KPI Mini Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Sasaran</div>
            <div className="text-base font-extrabold text-slate-900 flex items-baseline gap-1 mt-0.5">
              <span>21</span>
              <span className="text-[10px] text-slate-500 font-normal">
                ({lingkunganCount} Lingk, {kategorialCount} Katg)
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Jadwal Terkoordinasi</div>
            <div className="text-base font-extrabold text-blue-700 flex items-baseline gap-1 mt-0.5">
              <span>{scheduledCount}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                / {totalTasks} ({pendingCount} belum)
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Sudah Terlaksana</div>
            <div className="text-base font-extrabold text-emerald-700 flex items-baseline gap-1 mt-0.5">
              <span>{completedCount}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                / {totalTasks}
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Belum Terkoordinasi</div>
            <div className="text-base font-extrabold text-amber-700 flex items-baseline gap-1 mt-0.5">
              <span>{pendingCount}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                / {totalTasks}
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Semua Penugasan */}
        {activeTab === 'tasks' && (
          <div className="space-y-3 pb-20">
            {/* Search and Quick Filters */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Lingkungan, Kategorial, Fasilitator, atau Notulen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips - Category */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold shrink-0">Sasaran:</span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                    categoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua (21)
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('Lingkungan')}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                    categoryFilter === 'Lingkungan'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  14 Lingkungan
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('Kategorial')}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                    categoryFilter === 'Kategorial'
                      ? 'bg-amber-400 text-amber-950 font-bold shadow-2xs'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  7 Kategorial
                </button>
              </div>

              {/* Filter by Team Member, Focus, & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
                {/* Personil Member Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Filter Petugas ({members.length} Orang):
                  </label>
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  >
                    <option value="all">-- Semua Petugas --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.origin})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Focus Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Filter 4 Fokus:
                  </label>
                  <select
                    value={focusFilter}
                    onChange={(e) => setFocusFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  >
                    <option value="all">-- Semua 4 Fokus --</option>
                    {FOCUS_LIST.map((f) => (
                      <option key={f.id} value={f.id}>
                        Fokus {f.number}: {f.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Status Pelaksanaan:
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  >
                    <option value="all">Semua Status</option>
                    <option value="terlaksana">✅ Sudah Terlaksana ({completedCount})</option>
                    <option value="terjadwal">🗓️ Terjadwal ({scheduledCount})</option>
                    <option value="belum_ditentukan">⏳ Belum Ditentukan ({pendingCount})</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Indicator */}
              {(memberFilter !== 'all' ||
                categoryFilter !== 'all' ||
                focusFilter !== 'all' ||
                statusFilter !== 'all' ||
                searchQuery) && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>
                    Menampilkan <strong>{filteredTasks.length}</strong> dari {totalTasks} sasaran
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberFilter('all');
                      setCategoryFilter('all');
                      setFocusFilter('all');
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-red-700 hover:text-red-800 font-bold"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>

            {/* List of Tasks */}
            {filteredTasks.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Tidak ada penugasan yang sesuai</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Coba ubah kata kunci pencarian atau reset filter yang sedang aktif.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMemberFilter('all');
                    setCategoryFilter('all');
                    setFocusFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Tampilkan Semua Penugasan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={handleEditTaskSafe}
                    onOpenWhatsApp={(t) => setWhatsAppTask(t)}
                    highlightPerson={memberFilter !== 'all' ? memberFilter : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 4 Fokus Sinodal */}
        {activeTab === 'focus' && (
          <FocusTab
            tasks={tasks}
            onEditTask={handleEditTaskSafe}
            onOpenWhatsApp={(t) => setWhatsAppTask(t)}
          />
        )}

        {/* Tab 3: Petugas & Personil Tim Sinodal */}
        {activeTab === 'members' && (
          <MembersTab
            tasks={tasks}
            members={members}
            onSelectMemberFilter={(memberName) => {
              setMemberFilter(memberName);
              setActiveTab('tasks');
            }}
            onEditTask={handleEditTaskSafe}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
          />
        )}

        {/* Tab 4: Matriks Resmi & Cetak */}
        {activeTab === 'matrix' && (
          <MatrixTab
            tasks={tasks}
            members={members}
            onEditTask={handleEditTaskSafe}
            onResetToDefault={handleResetToDefault}
          />
        )}

        {/* Tab 5: Panduan Peran & Fokus */}
        {activeTab === 'guide' && <GuideTab />}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-1 py-1 flex items-center justify-around text-[10px]">
        {[
          { id: 'tasks', label: 'Tugas', icon: Layers },
          { id: 'focus', label: '4 Fokus', icon: Calendar },
          { id: 'members', label: 'Petugas', icon: Users },
          { id: 'matrix', label: 'Matriks', icon: Table },
          { id: 'guide', label: 'Panduan', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-1.5 rounded-lg font-medium transition ${
                isActive
                  ? 'text-red-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span className="text-[9px] tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <EditScheduleModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        members={members}
      />

      <WhatsAppShareModal
        task={whatsAppTask}
        isOpen={!!whatsAppTask}
        onClose={() => setWhatsAppTask(null)}
      />

      <DataSyncModal
        isOpen={isDataSyncOpen}
        onClose={() => setIsDataSyncOpen(false)}
        tasks={tasks}
        members={members}
        isFinalMasterLocked={isFinalMasterLocked}
        finalMasterDate={finalMasterDate}
        onImportData={handleImportData}
      />

      {/* Floating Auto-Sync Notification Toast */}
      {syncToast && (
        <div
          role="status"
          className="fixed bottom-16 sm:bottom-6 right-3 sm:right-6 z-50 max-w-sm w-auto animate-in slide-in-from-bottom-3 duration-200"
        >
          <div
            className={`p-3 rounded-2xl shadow-xl border flex items-center gap-2.5 text-xs ${
              syncToast.type === 'success'
                ? 'bg-slate-900 text-white border-emerald-500/50'
                : 'bg-white text-slate-800 border-slate-300'
            }`}
          >
            {syncToast.isGitHub ? (
              <span className="p-1 rounded-lg bg-emerald-500 text-slate-950 font-bold shrink-0">
                <Github className="w-3.5 h-3.5" />
              </span>
            ) : (
              <span className="p-1 rounded-lg bg-emerald-500 text-slate-950 font-bold shrink-0">
                <Check className="w-3.5 h-3.5" />
              </span>
            )}
            <div className="flex-1 pr-1 font-semibold text-[11px] leading-tight">
              {syncToast.message}
            </div>
            <button
              type="button"
              onClick={() => setSyncToast(null)}
              className="text-slate-400 hover:text-white text-xs font-bold px-1"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
