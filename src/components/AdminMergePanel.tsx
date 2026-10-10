import React, { useState, useRef } from 'react';
import {
  Upload,
  Database,
  FileJson,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  Download,
  Layers,
  Users,
  Calendar,
  Camera,
  CheckSquare,
  ArrowRight,
  RefreshCw,
  Laptop,
  HelpCircle,
  Clock,
  Sparkles,
  Info,
  FileDown,
  Lock,
  Github,
} from 'lucide-react';
import { TaskAssignment, TeamMember, SynodalExportData } from '../types';
import { formatIndonesianDate } from '../data/initialData';
import { generateOfficerPositionsPDF } from '../utils/pdfGenerator';
import { saveAsFinalMaster } from '../utils/persistentStorage';
import { GitHubSyncPanel } from './GitHubSyncPanel';

interface AdminMergePanelProps {
  tasks: TaskAssignment[];
  members: TeamMember[];
  isFinalMasterLocked?: boolean;
  finalMasterDate?: string;
  onImportData: (incomingTasks: TaskAssignment[], incomingMembers?: TeamMember[], mode?: 'merge' | 'replace') => void;
  onEditTask: (task: TaskAssignment) => void;
}

interface MergeReport {
  fileName: string;
  tasksCount: number;
  updatedNames: string[];
  photosCount: number;
  completedCount: number;
  timestamp: string;
}

export const AdminMergePanel: React.FC<AdminMergePanelProps> = ({
  tasks,
  members,
  isFinalMasterLocked = false,
  finalMasterDate,
  onImportData,
  onEditTask,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [mergeLogs, setMergeLogs] = useState<MergeReport[]>([]);
  const [alertMessage, setAlertMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);
  const [pasteText, setPasteText] = useState('');
  const [showGitHubSync, setShowGitHubSync] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Statistics
  const totalTasks = tasks.length;
  const scheduledCount = tasks.filter((t) => t.tanggalKonsultasi && t.status !== 'belum_ditentukan').length;
  const completedCount = tasks.filter((t) => t.terlaksana || t.status === 'selesai').length;
  const photoCount = tasks.filter((t) => !!t.fotoDokumentasi).length;
  const totalParticipants = tasks.reduce((sum, t) => {
    const val = Number(t.jumlahPeserta);
    return !isNaN(val) ? sum + val : sum;
  }, 0);

  // Process a list of files dropped or selected
  const handleFiles = async (fileList: FileList) => {
    const files = Array.from(fileList).filter((f) => f.name.endsWith('.json') || f.type.includes('json') || f.type === '');
    if (files.length === 0) {
      setAlertMessage({
        type: 'error',
        text: 'Tidak ada file .JSON yang valid ditemukan. Pastikan memilih file data yang diekspor dari aplikasi.',
      });
      return;
    }

    let totalUpdatedTasks = 0;
    const newLogs: MergeReport[] = [];

    for (const file of files) {
      try {
        const text = await file.text();
        const parsed = JSON.parse(text);

        let incomingTasks: TaskAssignment[] = [];
        let incomingMembers: TeamMember[] | undefined = undefined;

        if (Array.isArray(parsed)) {
          incomingTasks = parsed;
        } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
          incomingTasks = parsed.tasks;
          if (parsed.members && Array.isArray(parsed.members)) {
            incomingMembers = parsed.members;
          }
        }

        if (incomingTasks.length > 0) {
          // Identify which items have real updates compared to current tasks
          const updatedDplNames: string[] = [];
          let photosInFile = 0;
          let completedInFile = 0;

          incomingTasks.forEach((inc) => {
            const current = tasks.find(
              (c) => c.id === inc.id || c.namaDpl.toLowerCase().trim() === inc.namaDpl.toLowerCase().trim()
            );

            // Check if inc has dates or implementation data
            if (inc.tanggalKonsultasi || inc.terlaksana || inc.fotoDokumentasi || inc.tempat || inc.jumlahPeserta) {
              updatedDplNames.push(inc.namaDpl);
            }
            if (inc.fotoDokumentasi) photosInFile++;
            if (inc.terlaksana) completedInFile++;
          });

          onImportData(incomingTasks, incomingMembers, 'merge');
          totalUpdatedTasks += updatedDplNames.length;

          newLogs.push({
            fileName: file.name,
            tasksCount: incomingTasks.length,
            updatedNames: updatedDplNames,
            photosCount: photosInFile,
            completedCount: completedInFile,
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
          });
        }
      } catch (err) {
        console.error('Error reading file:', file.name, err);
      }
    }

    if (newLogs.length > 0) {
      setMergeLogs((prev) => [...newLogs, ...prev]);
      setAlertMessage({
        type: 'success',
        text: `Berhasil menyatukan ${newLogs.length} file ke dalam sistem laptop admin! Data 21 kunjungan telah diperbarui.`,
      });
    } else {
      setAlertMessage({
        type: 'error',
        text: 'Format file tidak sesuai. Pastikan file JSON yang diunggah berasal dari fitur "Data Terpadu" aplikasi ini.',
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handlePasteSubmit = () => {
    if (!pasteText.trim()) return;
    try {
      const parsed = JSON.parse(pasteText);
      let incomingTasks: TaskAssignment[] = [];
      let incomingMembers: TeamMember[] | undefined = undefined;

      if (Array.isArray(parsed)) {
        incomingTasks = parsed;
      } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
        incomingTasks = parsed.tasks;
        if (parsed.members && Array.isArray(parsed.members)) {
          incomingMembers = parsed.members;
        }
      }

      if (incomingTasks.length > 0) {
        onImportData(incomingTasks, incomingMembers, 'merge');
        setAlertMessage({
          type: 'success',
          text: `Berhasil menyatukan data kiriman teks ke dalam sistem laptop admin!`,
        });
        setPasteText('');
      } else {
        throw new Error('Tidak ada data penugasan.');
      }
    } catch (e) {
      setAlertMessage({
        type: 'error',
        text: 'Teks yang ditempelkan bukan format JSON data yang valid.',
      });
    }
  };

  // Download Master JSON
  const handleDownloadMasterJson = () => {
    const payload: SynodalExportData = {
      appName: 'Tim Sinodal - Penugasan Konsultasi',
      paroki: 'Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan',
      version: '2.0-master',
      exportedAt: new Date().toISOString(),
      exportedBy: 'Admin Laptop / Koordinator Paroki',
      totalTasks: tasks.length,
      totalMembers: members.length,
      tasks: tasks,
      members: members,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `MASTER-TERPADU-Sinodal-Katedral-${dateStr}.json`;

    const a = document.createElement('a');
    a.href = dataStr;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  // Download Master Excel CSV
  const handleDownloadMasterCsv = () => {
    const headers = [
      'No',
      'Nama DPL / Kunjungan',
      'Kategori',
      'Focus Konsultasi',
      'Fasilitator',
      'Notulen',
      'Tanggal Konsultasi',
      'Hari',
      'Jam',
      'Status Pelaksanaan',
      'Lokasi Pelaksanaan',
      'Jumlah Peserta Hadir',
      'Kontak PIC',
      'Catatan Notulensi',
      'Ada Foto',
    ];

    const rows = tasks.map((t, idx) => {
      return [
        idx + 1,
        `"${t.namaDpl.replace(/"/g, '""')}"`,
        `"${t.category}"`,
        `"${t.focusKonsultasi.replace(/"/g, '""')}"`,
        `"${t.fasilitator.replace(/"/g, '""')}"`,
        `"${t.notulen.replace(/"/g, '""')}"`,
        `"${t.tanggalKonsultasi || '-'}"`,
        `"${t.hari || '-'}"`,
        `"${t.jam || '-'}"`,
        `"${t.terlaksana ? 'Terlaksana' : t.status}"`,
        `"${(t.lokasiPelaksanaan || t.tempat || '-').replace(/"/g, '""')}"`,
        `"${t.jumlahPeserta || '-'}"`,
        `"${(t.kontakPic || '-').replace(/"/g, '""')}"`,
        `"${(t.catatan || '-').replace(/"/g, '""')}"`,
        `"${t.fotoDokumentasi ? 'Ya' : 'Tidak'}"`,
      ];
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const dateStr = new Date().toISOString().slice(0, 10);
    const a = document.createElement('a');
    a.href = url;
    a.download = `REKAP-MASTER-TERPADU-Sinodal-Katedral-${dateStr}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Banner Admin */}
      <div className="bg-linear-to-r from-slate-900 via-slate-800 to-red-950 text-white p-5 rounded-2xl shadow-md border border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="p-1 rounded bg-amber-400 text-slate-950">
                <Laptop className="w-4 h-4" />
              </span>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
                Portal Admin Laptop
              </span>
            </div>
            <h2 className="text-lg font-extrabold tracking-tight">
              Pusat Penyatuan Data Terpadu Sinodal
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-xl leading-relaxed">
              Satukan laporan jadwal, catatan notulensi, dan foto dokumentasi yang dikirimkan oleh
              para petugas pendamping di lapangan ke dalam satu sistem terpadu di laptop admin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
            <button
              type="button"
              onClick={() => generateOfficerPositionsPDF(tasks, members)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs transition active:scale-95"
              title="Download posisi petugas dalam format dokumen PDF resmi"
            >
              <FileDown className="w-3.5 h-3.5" />
              <span>PDF Posisi</span>
            </button>
            <button
              type="button"
              onClick={() => setShowGitHubSync(!showGitHubSync)}
              className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition shadow-xs active:scale-95 ${
                showGitHubSync
                  ? 'bg-amber-400 text-slate-950 ring-2 ring-amber-300'
                  : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
              }`}
              title="Buka panel Sinkronisasi GitHub Cloud untuk database petugas dan pengaturan"
            >
              <Github className="w-3.5 h-3.5" />
              <span>Sync GitHub</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMasterJson}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs transition"
              title="Download backup file master data terpadu"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Master JSON</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadMasterCsv}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-xs transition"
              title="Download rekap Excel untuk pimpinan"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Rekap Excel</span>
            </button>
          </div>
        </div>
      </div>

      {/* Alert Notification */}
      {alertMessage && (
        <div
          className={`p-3.5 rounded-2xl border flex items-start justify-between gap-2 text-xs transition animate-in fade-in ${
            alertMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-rose-50 border-rose-300 text-rose-950'
          }`}
        >
          <div className="flex items-center gap-2">
            {alertMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span className="font-semibold">{alertMessage.text}</span>
          </div>
          <button
            onClick={() => setAlertMessage(null)}
            className="text-slate-400 hover:text-slate-600 p-0.5"
          >
            ✕
          </button>
        </div>
      )}

      {/* Collapsible GitHub Cloud Sync Section */}
      {showGitHubSync && (
        <div className="bg-white p-4 sm:p-5 rounded-3xl border-2 border-slate-900 shadow-xl animate-in fade-in duration-200 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-slate-900 text-amber-400">
                <Github className="w-4 h-4" />
              </span>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Panel Sinkronisasi GitHub Cloud Terpadu
              </h3>
            </div>
            <button
              type="button"
              onClick={() => setShowGitHubSync(false)}
              className="text-xs font-bold text-slate-400 hover:text-slate-700 px-2 py-1 rounded-md hover:bg-slate-100 transition"
            >
              ✕ Tutup Panel
            </button>
          </div>
          <GitHubSyncPanel
            tasks={tasks}
            members={members}
            isFinalMasterLocked={isFinalMasterLocked}
            finalMasterDate={finalMasterDate}
            onImportData={onImportData}
            onSuccessNotice={(msg) => {
              setAlertMessage({ type: 'success', text: msg });
            }}
          />
        </div>
      )}

      {/* KPI Real-Time Status in Admin System */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Total Kunjungan Paroki</div>
          <div className="text-lg font-black text-slate-900 mt-0.5">{totalTasks} Kunjungan</div>
          <div className="text-[10px] text-slate-500">14 Lingk • 7 Katg</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Jadwal Terkoordinasi</div>
          <div className="text-lg font-black text-blue-700 mt-0.5">{scheduledCount} / {totalTasks}</div>
          <div className="text-[10px] text-blue-600 font-medium">{Math.round((scheduledCount / totalTasks) * 100)}% terjadwal</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Telah Terlaksana</div>
          <div className="text-lg font-black text-emerald-700 mt-0.5">{completedCount} / {totalTasks}</div>
          <div className="text-[10px] text-emerald-600 font-medium">{totalParticipants} Jiwa Hadir</div>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] uppercase font-bold text-slate-500">Foto Dokumentasi</div>
          <div className="text-lg font-black text-amber-700 mt-0.5">{photoCount} Foto</div>
          <div className="text-[10px] text-amber-600 font-medium">Tersimpan di sistem</div>
        </div>
      </div>

      {/* Main Drag and Drop Upload Zone for Admin Laptop */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-800 flex items-center justify-center font-bold">
              <Upload className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm">
                Upload &amp; Satukan File Data Lapangan
              </h3>
              <p className="text-[11px] text-slate-500">
                Pilih atau seret (drag &amp; drop) satu atau beberapa file .JSON kiriman anggota tim
              </p>
            </div>
          </div>
        </div>

        {/* Drag & Drop Box */}
        <div
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files) {
              handleFiles(e.dataTransfer.files);
            }
          }}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? 'border-blue-600 bg-blue-50/80 scale-[0.99]'
              : 'border-slate-300 hover:border-blue-500 bg-slate-50/60 hover:bg-blue-50/30'
          }`}
        >
          <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-sm">
            <Upload className="w-6 h-6" />
          </div>
          <div>
            <div className="font-bold text-slate-900 text-sm">
              Klik untuk Pilih File atau Seret File .JSON ke Sini
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Mendukung pemilihan banyak file sekaligus (Multi-file upload otomatis disatukan)
            </p>
          </div>
          <span className="px-3 py-1 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-blue-700 shadow-2xs">
            Pilih File dari Laptop...
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            multiple
            onChange={(e) => {
              if (e.target.files) handleFiles(e.target.files);
            }}
            className="hidden"
          />
        </div>

        {/* Alternative: Paste JSON Text */}
        <div className="pt-2 border-t border-slate-100">
          <details className="text-xs group">
            <summary className="font-bold text-slate-700 cursor-pointer hover:text-blue-700 flex items-center gap-1.5">
              <span>Atau Tempelkan Teks Data (jika dikirim via chat WhatsApp Web) &rarr;</span>
            </summary>
            <div className="mt-2 space-y-2">
              <textarea
                rows={3}
                placeholder="Tempel teks JSON yang dikirimkan peserta lapangan..."
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handlePasteSubmit}
                  disabled={!pasteText.trim()}
                  className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs inline-flex items-center gap-1.5 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Satukan Teks Data</span>
                </button>
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Session Merge History Log */}
      {mergeLogs.length > 0 && (
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Riwayat File yang Baru Disatukan ({mergeLogs.length} File):</span>
            </h3>
            <button
              type="button"
              onClick={() => setMergeLogs([])}
              className="text-[10px] text-slate-400 hover:text-slate-600 font-medium"
            >
              Bersihkan Riwayat
            </button>
          </div>

          <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
            {mergeLogs.map((log, i) => (
              <div
                key={i}
                className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 truncate">
                    <FileJson className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span className="truncate">{log.fileName}</span>
                  </div>
                  <span className="text-[10px] text-slate-400 shrink-0">{log.timestamp}</span>
                </div>

                <div className="flex flex-wrap items-center gap-2 text-[11px] text-slate-600">
                  <span className="text-emerald-700 font-semibold">
                    ✓ {log.updatedNames.length} kunjungan diperbarui
                  </span>
                  {log.completedCount > 0 && (
                    <span className="text-blue-700 font-semibold">
                      • {log.completedCount} status terlaksana
                    </span>
                  )}
                  {log.photosCount > 0 && (
                    <span className="text-amber-700 font-semibold">
                      • {log.photosCount} foto tersimpan
                    </span>
                  )}
                </div>

                {log.updatedNames.length > 0 && (
                  <div className="text-[10px] text-slate-500 truncate pt-0.5">
                    Kunjungan: {log.updatedNames.join(', ')}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Unified Progress Status Table (Overview of all 21 items) */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
              <Database className="w-4 h-4 text-emerald-600" />
              <span>Daftar Data Terpadu Terkini (21 Kunjungan Paroki)</span>
            </h3>
            <p className="text-[11px] text-slate-500">
              Status penggabungan dari seluruh lingkungan dan kategorial di laptop admin
            </p>
          </div>
        </div>

        <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
          {tasks.map((t, idx) => {
            const hasDate = Boolean(t.tanggalKonsultasi);
            const isDone = Boolean(t.terlaksana);
            const hasPhoto = Boolean(t.fotoDokumentasi);

            return (
              <div
                key={t.id}
                className={`p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition ${
                  isDone ? 'bg-emerald-50/30' : t.category === 'Kategorial' ? 'bg-amber-50/20' : 'bg-white'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 flex-1">
                  <span className="w-5 text-[11px] font-bold text-slate-400 text-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span
                        className={`text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded ${
                          t.category === 'Kategorial'
                            ? 'bg-amber-200 text-amber-950 font-bold'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        {t.category}
                      </span>
                      <span className="font-bold text-slate-900 truncate">{t.namaDpl}</span>
                    </div>

                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      Pendamping: <strong className="text-slate-700">{t.fasilitator}</strong> &amp;{' '}
                      <strong className="text-slate-700">{t.notulen}</strong>
                    </div>
                  </div>
                </div>

                {/* Status Badges */}
                <div className="flex items-center gap-2 shrink-0">
                  {hasDate ? (
                    <span className="text-[10px] font-semibold text-slate-700 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 hidden sm:inline-block">
                      {t.hari ? `${t.hari}, ` : ''}{formatIndonesianDate(t.tanggalKonsultasi)} ({t.jam || '-'})
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-400 italic hidden sm:inline-block">
                      Belum dijadwalkan
                    </span>
                  )}

                  {hasPhoto && (
                    <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-1.5 py-0.5 rounded border border-amber-300 flex items-center gap-1" title="Foto dokumentasi tersimpan">
                      <Camera className="w-3 h-3 text-amber-700" />
                      <span className="hidden md:inline">Foto</span>
                    </span>
                  )}

                  {isDone ? (
                    <span className="text-[10px] font-extrabold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full border border-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                      <span>Terlaksana</span>
                    </span>
                  ) : hasDate ? (
                    <span className="text-[10px] font-semibold text-blue-800 bg-blue-100 px-2 py-0.5 rounded-full border border-blue-300">
                      Terjadwal
                    </span>
                  ) : (
                    <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                      Menunggu
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onEditTask(t)}
                    className="text-xs px-2 py-1 rounded bg-slate-900 text-white font-bold hover:bg-slate-800 transition"
                  >
                    Edit
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
