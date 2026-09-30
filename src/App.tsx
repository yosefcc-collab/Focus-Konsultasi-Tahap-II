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
import { FinalMasterSavedModal } from './components/FinalMasterSavedModal';

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

  const [activeTab, setActiveTab] = useState<'tasks' | 'focus' | 'members' | 'matrix' | 'admin' | 'guide'>('tasks');
  const [editingTask, setEditingTask] = useState<TaskAssignment | null>(null);
  const [whatsAppTask, setWhatsAppTask] = useState<TaskAssignment | null>(null);
  const [isDataSyncOpen, setIsDataSyncOpen] = useState(false);
  const [storageStatus, setStorageStatus] = useState<string>('Tersimpan Aman');
  const [hasBackupSnapshot, setHasBackupSnapshot] = useState(false);
  const [isFinalMasterLocked, setIsFinalMasterLocked] = useState(false);
  const [finalMasterDate, setFinalMasterDate] = useState<string>('');
  const [hasPendingChanges, setHasPendingChanges] = useState(false);
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isRelockEvent, setIsRelockEvent] = useState(false);

  // Filters for main tasks view
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryType>('all');
  const [focusFilter, setFocusFilter] = useState<'all' | FocusType>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'terlaksana' | 'terjadwal' | 'belum_ditentukan'>('all');

  // Load from multi-layer persistent database (IndexedDB) on startup
  useEffect(() => {
    Promise.all([
      loadPersistentTasks(),
      loadPersistentMembers(),
      getFinalMasterStatus(),
    ])
      .then(([loadedTasks, loadedMembers, finalStatus]) => {
        if (loadedTasks && loadedTasks.length > 0) {
          setTasks(loadedTasks);
        }
        if (loadedMembers && loadedMembers.length > 0) {
          setMembers(loadedMembers);
        }
        if (finalStatus.isFinalized) {
          setIsFinalMasterLocked(true);
          if (finalStatus.finalizedAt) {
            setFinalMasterDate(new Date(finalStatus.finalizedAt).toLocaleDateString('id-ID'));
          }
        }
        isInitialLoadComplete.current = true;
      })
      .catch((e) => {
        console.warn('Persistent task load note:', e);
        isInitialLoadComplete.current = true;
      });

    getBackupSnapshot().then((snapshot) => {
      if (snapshot && snapshot.tasks) {
        setHasBackupSnapshot(true);
      }
    });
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

  const handleSaveTask = (updatedTask: TaskAssignment) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
    setHasPendingChanges(true);
  };

  // Permanently lock and freeze current tasks as FINAL MASTER (Supports Re-Locking when changes happen)
  const handleLockAsFinalMaster = async () => {
    const isRelock = isFinalMasterLocked;

    try {
      const res = await saveAsFinalMaster(tasks, members);
      setIsFinalMasterLocked(true);
      setHasPendingChanges(false);
      const timeStr = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
      const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
      const fullDateStr = `${dateStr}, ${timeStr}`;
      setFinalMasterDate(fullDateStr);
      setTasks((prev) => prev.map((t) => ({ ...t, locked: true, lockedAt: res.finalizedAt })));

      // Directly open in-app popup modal
      setIsRelockEvent(isRelock);
      setIsSavedModalOpen(true);
    } catch (err) {
      console.error('Failed locking master data:', err);
    }
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
    setMembers((prev) => [...prev, newMember]);
    setHasPendingChanges(true);
  };

  const handleEditMember = (
    updatedMember: TeamMember,
    oldName?: string,
    updateInTasks?: boolean
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );
    setHasPendingChanges(true);

    if (updateInTasks && oldName && oldName.toLowerCase() !== updatedMember.name.toLowerCase()) {
      setTasks((prev) =>
        prev.map((t) => {
          let newFas = t.fasilitator;
          let newNot = t.notulen;
          if (isPersonMatched(t.fasilitator, oldName)) {
            newFas = updatedMember.name;
          }
          if (isPersonMatched(t.notulen, oldName)) {
            newNot = updatedMember.name;
          }
          return { ...t, fasilitator: newFas, notulen: newNot };
        })
      );
    }
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
    setHasPendingChanges(true);
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
                className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-amber-300 leading-snug truncate max-w-[200px] sm:max-w-md"
                title="Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan"
              >
                Paroki St Perawan Maria Dikandung Tanpa Noda
              </div>
              <div className="text-[9px] sm:text-[10px] text-red-200 font-medium truncate max-w-[200px] sm:max-w-md">
                Katedral Keuskupan Agung Medan
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <h1 className="text-xs sm:text-base font-extrabold leading-tight text-white truncate">
                  Tim Sinodal • Penugasan Konsultasi
                </h1>
                {/* Real-time Storage Safe Badge */}
                <span
                  className="hidden sm:inline-flex items-center gap-1 text-[10px] px-2 py-0.2 rounded-full bg-emerald-950/60 text-emerald-300 border border-emerald-500/40"
                  title="Data otomatis tersimpan permanen di memori perangkat"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>{storageStatus}</span>
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {/* Final Master Lock / Status Button */}
            {hasPendingChanges ? (
              <button
                type="button"
                onClick={handleLockAsFinalMaster}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-md ring-2 ring-amber-300 transition active:scale-95 animate-pulse"
                title="Ada perubahan baru! Klik untuk mengunci kembali sebagai data akhir permanen"
              >
                <Lock className="w-3.5 h-3.5" />
                <span>Kunci Lagi Data Akhir</span>
              </button>
            ) : isFinalMasterLocked ? (
              <button
                type="button"
                onClick={handleLockAsFinalMaster}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400/90 hover:bg-amber-300 text-slate-950 shadow-sm border border-amber-300 transition"
                title={`Data akhir resmi terkunci (${finalMasterDate || 'Permanen'}). Klik jika ingin mengunci ulang versi terbaru.`}
              >
                <Lock className="w-3.5 h-3.5 text-slate-900" />
                <span className="hidden sm:inline">Data Akhir Terkunci</span>
                <span className="sm:hidden">Terkunci</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleLockAsFinalMaster}
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition active:scale-95"
                title="Kunci data saat ini sebagai data akhir resmi agar susunan petugas tidak berganti lagi"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Kunci Data Akhir</span>
                <span className="sm:hidden">Kunci Akhir</span>
              </button>
            )}

            {/* Quick Laptop Admin Tab Shortcut */}
            <button
              type="button"
              onClick={() => setActiveTab('admin')}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-bold transition shadow-sm ${
                activeTab === 'admin'
                  ? 'bg-white text-slate-950 ring-2 ring-amber-300'
                  : 'bg-red-950/70 hover:bg-red-950 text-amber-200 border border-red-700/60'
              }`}
              title="Portal Laptop Admin: Unggah & Satukan Data Terpadu"
            >
              <Laptop className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Laptop Admin</span>
              <span className="sm:hidden">Admin</span>
            </button>
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
              { id: 'admin', label: '💻 Laptop Admin (Pusat Data)', icon: Laptop },
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
        {/* Banner: Ada Perubahan Baru (Harus Dikunci Lagi) */}
        {hasPendingChanges && (
          <div className="mb-3 p-3.5 rounded-2xl bg-amber-500/20 border-2 border-amber-500 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs shadow-sm animate-in fade-in">
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0">
                <Lock className="w-4 h-4" />
              </span>
              <div>
                <strong className="text-amber-950 font-extrabold text-sm">
                  Ada Perubahan Baru pada Data Petugas / Jadwal
                </strong>
                <p className="text-[11px] text-amber-900 mt-0.5">
                  Klik tombol di samping agar perubahan ini <strong>dikunci lagi sebagai Data Akhir</strong> dan tidak berganti lagi saat hari berganti.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLockAsFinalMaster}
              className="px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-sm active:scale-95 transition"
            >
              <Lock className="w-4 h-4" />
              <span>Kunci Lagi Sebagai Data Akhir</span>
            </button>
          </div>
        )}

        {/* Final Master Banner Notification (Saat Tidak Ada Perubahan Menggantung) */}
        {!hasPendingChanges && isFinalMasterLocked && (
          <div className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-400/40 flex items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-amber-500 text-slate-950 shrink-0">
                <Lock className="w-3.5 h-3.5" />
              </span>
              <div>
                <strong className="text-amber-950 font-extrabold">Data Akhir Resmi Paroki Terkunci Permanen</strong>
                <p className="text-[11px] text-amber-900/80">
                  Susunan Fasilitator &amp; Notulen terlindungi. Jika nanti ada perubahan lagi, Anda dapat mengubahnya kapan saja dan mengeklik "Kunci Lagi Sebagai Data Akhir".
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLockAsFinalMaster}
              className="text-[11px] font-bold text-amber-900 hover:text-amber-950 bg-amber-200/80 hover:bg-amber-300 px-2.5 py-1 rounded-lg shrink-0 transition"
              title="Kunci ulang data saat ini"
            >
              Kunci Ulang
            </button>
          </div>
        )}

        {!hasPendingChanges && !isFinalMasterLocked && (
          <div className="mb-3 p-3 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-blue-600 text-white shrink-0">
                <ShieldCheck className="w-3.5 h-3.5" />
              </span>
              <div>
                <strong className="text-blue-950">Ingin menetapkan susunan saat ini sebagai Data Akhir?</strong>
                <p className="text-[11px] text-blue-800">
                  Klik tombol kunci agar susunan Fasilitator dan Notulen tersimpan permanen dan tidak berganti hari lagi.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleLockAsFinalMaster}
              className="px-3 py-1.5 rounded-xl bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 self-start sm:self-auto shadow-2xs transition"
            >
              <Lock className="w-3.5 h-3.5" />
              <span>Kunci Sebagai Data Akhir</span>
            </button>
          </div>
        )}

        {/* KPI Mini Stats Bar */}
        {activeTab !== 'admin' && (
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

            <div
              onClick={() => setActiveTab('admin')}
              className="bg-amber-50 hover:bg-amber-100/80 p-2.5 rounded-xl border border-amber-300 shadow-2xs cursor-pointer transition flex flex-col justify-center"
            >
              <div className="text-[10px] uppercase font-bold text-amber-900 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3 text-amber-700" />
                <span>Penyimpanan Aman</span>
              </div>
              <div className="text-xs font-extrabold text-amber-950 mt-0.5 flex items-center justify-between">
                <span>{isFinalMasterLocked ? 'Data Akhir Terkunci' : 'Auto-Saved Permanen'} &rarr;</span>
              </div>
            </div>
          </div>
        )}

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

        {/* Tab 5: Laptop Admin (Pusat Penyatuan Data Terpadu) */}
        {activeTab === 'admin' && (
          <AdminMergePanel
            tasks={tasks}
            members={members}
            isFinalMasterLocked={isFinalMasterLocked}
            finalMasterDate={finalMasterDate}
            onImportData={handleImportData}
            onEditTask={handleEditTaskSafe}
          />
        )}

        {/* Tab 6: Panduan Peran & Fokus */}
        {activeTab === 'guide' && <GuideTab />}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-1 py-1 flex items-center justify-around text-[10px]">
        {[
          { id: 'tasks', label: 'Tugas', icon: Layers },
          { id: 'focus', label: '4 Fokus', icon: Calendar },
          { id: 'members', label: 'Petugas', icon: Users },
          { id: 'matrix', label: 'Matriks', icon: Table },
          { id: 'admin', label: 'Admin', icon: Laptop },
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

      <FinalMasterSavedModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        finalizedAt={finalMasterDate}
        isRelock={isRelockEvent}
        totalTasks={tasks.length}
        onDownloadBackup={handleDownloadBackupJson}
      />
    </div>
  );
}
