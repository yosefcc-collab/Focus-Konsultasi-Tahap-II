import React, { useState, useRef } from 'react';
import {
  X,
  Download,
  Upload,
  FileJson,
  FileSpreadsheet,
  Copy,
  Check,
  Share2,
  Database,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react';
import { TaskAssignment, TeamMember, SynodalExportData } from '../types';
import { formatIndonesianDate } from '../data/initialData';

interface DataSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: TaskAssignment[];
  members: TeamMember[];
  onImportData: (importedTasks: TaskAssignment[], importedMembers?: TeamMember[], mode?: 'merge' | 'replace') => void;
}

export const DataSyncModal: React.FC<DataSyncModalProps> = ({
  isOpen,
  onClose,
  tasks,
  members,
  onImportData,
}) => {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  const [copied, setCopied] = useState(false);
  const [importJsonText, setImportJsonText] = useState('');
  const [importStatus, setImportStatus] = useState<{ success: boolean; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Build structured JSON export payload
  const createExportPayload = (): SynodalExportData => {
    return {
      appName: 'Tim Sinodal - Penugasan Konsultasi',
      paroki: 'Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan',
      version: '2.0',
      exportedAt: new Date().toISOString(),
      totalTasks: tasks.length,
      totalMembers: members.length,
      tasks: tasks,
      members: members,
    };
  };

  // 1. Download as JSON file
  const handleDownloadJson = () => {
    const payload = createExportPayload();
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const timeStr = `${now.getHours()}.${now.getMinutes()}`;
    const filename = `data-terpadu-sinodal-katedral-${dateStr}-${timeStr}.json`;

    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', filename);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  // 2. Download as CSV (Excel compatible)
  const handleDownloadCsv = () => {
    const headers = [
      'No',
      'Nama DPL',
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
    const now = new Date();
    const dateStr = now.toISOString().slice(0, 10);
    const filename = `rekap-sinodal-katedral-${dateStr}.csv`;

    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  // 3. Copy JSON payload to clipboard
  const handleCopyPayload = async () => {
    try {
      const payload = createExportPayload();
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  // 4. File input parser for importing
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        processImportString(text);
      } catch (err) {
        setImportStatus({
          success: false,
          message: 'Format file tidak valid. Pastikan file JSON yang diunggah berasal dari aplikasi ini.',
        });
      }
    };
    reader.readAsText(file);
  };

  // 5. Process string JSON into tasks
  const processImportString = (jsonStr: string, mode: 'merge' | 'replace' = 'merge') => {
    try {
      const parsed = JSON.parse(jsonStr);
      let incomingTasks: TaskAssignment[] = [];
      let incomingMembers: TeamMember[] | undefined = undefined;

      if (Array.isArray(parsed)) {
        incomingTasks = parsed;
      } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
        incomingTasks = parsed.tasks;
        if (parsed.members && Array.isArray(parsed.members)) {
          incomingMembers = parsed.members;
        }
      } else {
        throw new Error('Data penugasan tidak ditemukan.');
      }

      onImportData(incomingTasks, incomingMembers, mode);
      setImportStatus({
        success: true,
        message: `Berhasil memproses ${incomingTasks.length} data penugasan ke dalam data terpadu!`,
      });
      setImportJsonText('');
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setImportStatus({
        success: false,
        message: 'Gagal memproses data. Pastikan format JSON sesuai.',
      });
    }
  };

  const scheduledCount = tasks.filter((t) => t.tanggalKonsultasi && t.status !== 'belum_ditentukan').length;
  const completedCount = tasks.filter((t) => t.terlaksana || t.status === 'selesai').length;
  const photoCount = tasks.filter((t) => !!t.fotoDokumentasi).length;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-linear-to-r from-red-900 to-red-800 text-white flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center shadow-xs">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[10px] uppercase font-bold text-amber-300">Sinkronisasi Data</div>
              <h2 className="text-base font-bold leading-tight">Data Terpadu Tim Sinodal</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-red-200 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="p-2.5 bg-slate-100 border-b border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('export');
              setImportStatus(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'export'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Download className="w-4 h-4 text-emerald-400" />
            <span>Download / Kirim Data</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('import');
              setImportStatus(null);
            }}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'import'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Upload className="w-4 h-4 text-blue-400" />
            <span>Gabung ke Data Terpadu</span>
          </button>
        </div>

        {/* Body Content */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs flex-1">
          {/* Quick Stats Pill */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-around text-center">
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Terjadwal</div>
              <div className="text-sm font-extrabold text-slate-900">{scheduledCount}/21</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Terlaksana</div>
              <div className="text-sm font-extrabold text-emerald-700">{completedCount}/21</div>
            </div>
            <div className="h-6 w-px bg-slate-200" />
            <div>
              <div className="text-[10px] text-slate-500 font-bold uppercase">Foto Bukti</div>
              <div className="text-sm font-extrabold text-blue-700">{photoCount} Foto</div>
            </div>
          </div>

          {/* ================= TAB EXPORT / DOWNLOAD ================= */}
          {activeTab === 'export' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-slate-600 leading-relaxed">
                Unduh file data hasil pengisian jadwal, pelaksanaan, atau foto dokumentasi Anda untuk
                dikirimkan ke Tim Koordinator agar dimasukkan ke dalam <strong>Data Terpadu Paroki</strong>.
              </p>

              {/* Download Option 1: File JSON */}
              <div className="p-3.5 rounded-xl border border-emerald-200 bg-emerald-50/60 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-950 text-sm">
                    <FileJson className="w-4 h-4 text-emerald-700" />
                    <span>Download File JSON (Data Lengkap)</span>
                  </div>
                  <p className="text-[11px] text-emerald-800 leading-tight">
                    Format resmi berisi 21 sasaran, rincian jadwal, status pelaksanaan, notulensi, dan foto dokumentasi.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadJson}
                  className="px-3 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .JSON</span>
                </button>
              </div>

              {/* Download Option 2: Excel / CSV */}
              <div className="p-3.5 rounded-xl border border-blue-200 bg-blue-50/60 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-blue-950 text-sm">
                    <FileSpreadsheet className="w-4 h-4 text-blue-700" />
                    <span>Download Rekap Excel (CSV)</span>
                  </div>
                  <p className="text-[11px] text-blue-800 leading-tight">
                    Cocok untuk dibuka langsung di Microsoft Excel, Google Sheets, atau dicetak sebagai laporan tabel.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleDownloadCsv}
                  className="px-3 py-2 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 shadow-xs transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download .CSV</span>
                </button>
              </div>

              {/* Option 3: Copy Code Text Payload */}
              <div className="p-3.5 rounded-xl border border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-slate-900 text-sm">
                    <Copy className="w-4 h-4 text-slate-600" />
                    <span>Salin Kode Teks Data</span>
                  </div>
                  <p className="text-[11px] text-slate-600 leading-tight">
                    Salin seluruh data dalam bentuk teks untuk langsung ditempelkan via chat WhatsApp Tim.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleCopyPayload}
                  className="px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs inline-flex items-center gap-1.5 shrink-0 shadow-xs transition"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
                </button>
              </div>
            </div>
          )}

          {/* ================= TAB IMPORT / GABUNG DATA ================= */}
          {activeTab === 'import' && (
            <div className="space-y-3 animate-in fade-in duration-150">
              <p className="text-slate-600 leading-relaxed">
                Unggah file JSON atau tempelkan data yang dikirimkan oleh rekan tim / peserta lapangan untuk
                digabungkan ke dalam <strong>Data Terpadu</strong> Anda.
              </p>

              {importStatus && (
                <div
                  className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                    importStatus.success
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                      : 'bg-rose-50 border-rose-300 text-rose-900'
                  }`}
                >
                  {importStatus.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  )}
                  <span>{importStatus.message}</span>
                </div>
              )}

              {/* Upload JSON File */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="p-4 border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl bg-slate-50 hover:bg-blue-50/40 text-center cursor-pointer transition space-y-1.5"
              >
                <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
                  <Upload className="w-5 h-5" />
                </div>
                <div className="font-bold text-slate-800 text-xs">Pilih File .JSON dari Perangkat</div>
                <div className="text-[10px] text-slate-500">Klik di sini untuk memilih file yang dikirim rekan tim</div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".json,application/json"
                onChange={handleFileUpload}
                className="hidden"
              />

              {/* Paste JSON text */}
              <div className="space-y-1.5 pt-1">
                <label className="block text-slate-700 font-bold">
                  Atau Tempelkan (Paste) Teks JSON Data di sini:
                </label>
                <textarea
                  rows={4}
                  placeholder='Tempelkan teks JSON yang disalin dari tim...'
                  value={importJsonText}
                  onChange={(e) => setImportJsonText(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 font-mono text-[11px] focus:ring-2 focus:ring-blue-600 outline-hidden bg-white"
                />
                {importJsonText.trim() && (
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => processImportString(importJsonText, 'merge')}
                      className="px-3 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white font-bold text-xs inline-flex items-center gap-1.5"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Gabungkan Data (Merge)</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between">
          <span className="text-[11px] text-slate-500">
            Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Medan
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-slate-800 font-semibold text-xs transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
