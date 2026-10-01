import React, { useState } from 'react';
import {
  Github,
  Upload,
  Download,
  Check,
  Copy,
  ExternalLink,
  Key,
  FolderGit2,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Lock,
} from 'lucide-react';
import { TaskAssignment, TeamMember } from '../types';
import { saveTasksBatchToCloud } from '../services/synodalDbService';
import { savePersistentTasks } from '../utils/persistentStorage';
import {
  GitHubSyncConfig,
  getSavedGitHubConfig,
  saveGitHubConfig,
  buildDatabasePayload,
  pushToGitHubRepo,
  pullFromGitHubRepo,
  pushToGitHubGist,
  pullFromGitHubGist,
} from '../utils/githubSync';

interface GitHubSyncPanelProps {
  tasks: TaskAssignment[];
  members: TeamMember[];
  isFinalMasterLocked: boolean;
  finalMasterDate?: string;
  onImportData: (
    incomingTasks: TaskAssignment[],
    incomingMembers?: TeamMember[],
    mode?: 'merge' | 'replace'
  ) => void;
  onSuccessNotice?: (message: string) => void;
}

export const GitHubSyncPanel: React.FC<GitHubSyncPanelProps> = ({
  tasks,
  members,
  isFinalMasterLocked,
  finalMasterDate,
  onImportData,
  onSuccessNotice,
}) => {
  const [config, setConfig] = useState<GitHubSyncConfig>(getSavedGitHubConfig);
  const [showToken, setShowToken] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error' | 'info';
    text: string;
    linkUrl?: string;
  } | null>(null);
  const [copied, setCopied] = useState(false);

  const handleConfigChange = (field: keyof GitHubSyncConfig, value: any) => {
    const updated = { ...config, [field]: value };
    setConfig(updated);
    saveGitHubConfig(updated);
  };

  const handleForceSyncToFirestore = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      await saveTasksBatchToCloud(tasks);
      await savePersistentTasks(tasks);
      setStatusMessage({
        type: 'success',
        text: `Berhasil! Seluruh ${tasks.length} data sasaran & jadwal telah dikirim ke Cloud Firestore dan langsung aktif di Website.`,
      });
      if (onSuccessNotice) onSuccessNotice('Data berhasil dikirim ke Cloud Firestore!');
    } catch (err: any) {
      console.error('Firestore push error:', err);
      setStatusMessage({
        type: 'error',
        text: `Gagal mengirim ke Cloud Firestore: ${err.message || 'Periksa koneksi'}`,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePushToGitHub = async () => {
    if (!config.token.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Masukkan Token GitHub (Personal Access Token) terlebih dahulu.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      // 1. Simpan ke Cloud Firestore terlebih dahulu agar Website live langsung sinkron real-time
      try {
        await saveTasksBatchToCloud(tasks);
        await savePersistentTasks(tasks);
      } catch (cloudErr) {
        console.warn('Cloud Firestore sync note:', cloudErr);
      }

      // 2. Kirim payload ke GitHub Repository / Gist
      const payload = buildDatabasePayload(
        tasks,
        members,
        isFinalMasterLocked,
        finalMasterDate
      );

      if (config.syncMode === 'repo') {
        const res = await pushToGitHubRepo(config, payload);
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        handleConfigChange('lastSyncedAt', now);
        setStatusMessage({
          type: 'success',
          text: `Sinkronisasi ke Cloud Firestore & GitHub berhasil! (${now}) ${res.message}`,
          linkUrl: res.commitUrl,
        });
        if (onSuccessNotice) onSuccessNotice(res.message);
      } else {
        const res = await pushToGitHubGist(config, payload);
        handleConfigChange('gistId', res.gistId);
        const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' WIB';
        handleConfigChange('lastSyncedAt', now);
        setStatusMessage({
          type: 'success',
          text: `Sinkronisasi ke Cloud Firestore & GitHub Gist berhasil! (${now})`,
          linkUrl: res.gistUrl,
        });
        if (onSuccessNotice) onSuccessNotice(res.message);
      }
    } catch (err: any) {
      console.error('GitHub Push error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Terjadi kesalahan saat menghubungkan ke GitHub.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePullFromGitHub = async () => {
    if (!config.token.trim()) {
      setStatusMessage({
        type: 'error',
        text: 'Masukkan Token GitHub terlebih dahulu.',
      });
      return;
    }

    setIsLoading(true);
    setStatusMessage(null);

    try {
      let result;
      if (config.syncMode === 'repo') {
        result = await pullFromGitHubRepo(config);
      } else {
        result = await pullFromGitHubGist(config);
      }

      onImportData(result.tasks, result.members, 'merge');
      const now = new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
      handleConfigChange('lastSyncedAt', now);

      setStatusMessage({
        type: 'success',
        text: `Berhasil mengambil ${result.tasks.length} data sasaran dan ${result.members.length} petugas dari GitHub!`,
      });
      if (onSuccessNotice) onSuccessNotice('Data berhasil diselaraskan dari GitHub!');
    } catch (err: any) {
      console.error('GitHub Pull error:', err);
      setStatusMessage({
        type: 'error',
        text: err.message || 'Gagal mengambil data dari GitHub. Periksa token dan nama repository.',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyPayload = async () => {
    try {
      const payload = buildDatabasePayload(
        tasks,
        members,
        isFinalMasterLocked,
        finalMasterDate
      );
      await navigator.clipboard.writeText(JSON.stringify(payload, null, 2));
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-4 text-xs">
      {/* Overview Info Header */}
      <div className="p-3.5 rounded-2xl bg-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md border border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-800 text-amber-400 flex items-center justify-center font-bold shrink-0 border border-slate-700">
            <Github className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-amber-300 font-bold text-xs uppercase tracking-wider">
                GitHub Cloud Sync
              </span>
              {isFinalMasterLocked && (
                <span className="px-1.5 py-0.2 rounded-md bg-amber-400 text-slate-950 font-extrabold text-[9px] flex items-center gap-0.5">
                  <Lock className="w-2.5 h-2.5" /> Data Akhir Terkunci
                </span>
              )}
            </div>
            <h3 className="font-extrabold text-sm text-white mt-0.5">
              Sinkronisasi Database Petugas &amp; Pengaturan
            </h3>
            <p className="text-[11px] text-slate-400">
              Simpan dan selaraskan 21 sasaran, nama petugas, susunan Fasilitator &amp; Notulen secara permanen ke GitHub.
            </p>
          </div>
        </div>

        {config.lastSyncedAt && (
          <div className="text-right text-[10px] text-slate-400 shrink-0">
            <span>Terakhir sync:</span>
            <div className="font-bold text-slate-200">{config.lastSyncedAt}</div>
          </div>
        )}
      </div>

      {/* Status Alert Banner */}
      {statusMessage && (
        <div
          className={`p-3 rounded-xl border flex items-start justify-between gap-2 animate-in fade-in ${
            statusMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : statusMessage.type === 'error'
              ? 'bg-red-50 border-red-200 text-red-900'
              : 'bg-blue-50 border-blue-200 text-blue-900'
          }`}
        >
          <div className="flex items-start gap-2">
            {statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            )}
            <div>
              <div className="font-bold">{statusMessage.text}</div>
              {statusMessage.linkUrl && (
                <a
                  href={statusMessage.linkUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] font-bold underline mt-1 hover:opacity-80"
                >
                  <span>Buka di GitHub</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setStatusMessage(null)}
            className="text-slate-400 hover:text-slate-600 font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Sync Mode Selector */}
      <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between">
          <label className="font-extrabold text-slate-800 text-xs flex items-center gap-1.5">
            <FolderGit2 className="w-3.5 h-3.5 text-red-700" />
            <span>Pilih Mode Penyimpanan GitHub:</span>
          </label>
          <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => handleConfigChange('syncMode', 'repo')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                config.syncMode === 'repo'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Repository
            </button>
            <button
              type="button"
              onClick={() => handleConfigChange('syncMode', 'gist')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                config.syncMode === 'gist'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Gist (Praktis)
            </button>
          </div>
        </div>

        {/* Auto Sync Toggle Switch */}
        <div className="p-3 bg-emerald-500/10 border border-emerald-400/40 rounded-xl flex items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="font-extrabold text-emerald-950 text-xs flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5 text-emerald-700 animate-spin-slow" />
              <span>Otomatis Sinkron ke GitHub (Auto-Sync)</span>
              <span className="px-1.5 py-0.2 rounded-full text-[9px] font-bold bg-emerald-200 text-emerald-950">
                Aktif
              </span>
            </div>
            <p className="text-[11px] text-emerald-900/80">
              Setiap kali ada perubahan petugas (Fasilitator/Notulen) atau jadwal, data otomatis disimpan valid dan langsung disinkronkan ke GitHub.
            </p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer shrink-0">
            <input
              type="checkbox"
              checked={config.autoSyncEnabled !== false}
              onChange={(e) => handleConfigChange('autoSyncEnabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-9 h-5 bg-slate-300 peer-focus:outline-hidden rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
          </label>
        </div>

        {/* GitHub Personal Access Token (PAT) Input */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
              <Key className="w-3 h-3 text-amber-600" />
              <span>GitHub Personal Access Token:</span>
            </label>
            <a
              href="https://github.com/settings/tokens/new?scopes=repo,gist&description=Tim-Sinodal-Katedral-Sync"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[10px] text-blue-600 hover:underline flex items-center gap-0.5"
            >
              <span>Buat Token di GitHub</span>
              <ExternalLink className="w-2.5 h-2.5" />
            </a>
          </div>
          <div className="relative">
            <input
              type={showToken ? 'text' : 'password'}
              value={config.token}
              onChange={(e) => handleConfigChange('token', e.target.value)}
              placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
              className="w-full pl-3 pr-16 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono focus:ring-2 focus:ring-red-600 outline-hidden"
            />
            <button
              type="button"
              onClick={() => setShowToken(!showToken)}
              className="absolute right-2.5 top-2 text-[10px] font-bold text-slate-500 hover:text-slate-800"
            >
              {showToken ? 'Sembunyikan' : 'Lihat'}
            </button>
          </div>
          <p className="text-[10px] text-slate-400 mt-1">
            Token disimpan aman di penyimpanan lokal peramban Anda dengan izin cakupan (scope) <code>repo</code> atau <code>gist</code>.
          </p>
        </div>

        {/* Mode-specific Fields */}
        {config.syncMode === 'repo' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2 border-t border-slate-100">
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Owner (Username / Org):
              </label>
              <input
                type="text"
                value={config.owner}
                onChange={(e) => handleConfigChange('owner', e.target.value)}
                placeholder="misal: yosefcc"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Nama Repository:
              </label>
              <input
                type="text"
                value={config.repo}
                onChange={(e) => handleConfigChange('repo', e.target.value)}
                placeholder="misal: sinodal-katedral-medan"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Cabang (Branch):
              </label>
              <input
                type="text"
                value={config.branch}
                onChange={(e) => handleConfigChange('branch', e.target.value)}
                placeholder="main"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                Lokasi File (Path):
              </label>
              <input
                type="text"
                value={config.filePath}
                onChange={(e) => handleConfigChange('filePath', e.target.value)}
                placeholder="data/sinodal_database.json"
                className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
              />
            </div>
          </div>
        ) : (
          <div className="pt-2 border-t border-slate-100">
            <label className="block text-[11px] font-bold text-slate-700 mb-1">
              Gist ID (Opsional, kosongkan jika ingin membuat Gist baru otomatis):
            </label>
            <input
              type="text"
              value={config.gistId || ''}
              onChange={(e) => handleConfigChange('gistId', e.target.value)}
              placeholder="Kosongkan untuk membuat Gist otomatis saat Sync"
              className="w-full px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white text-xs font-mono"
            />
          </div>
        )}
      </div>

      {/* Main Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          type="button"
          onClick={handlePushToGitHub}
          disabled={isLoading}
          className="py-2.5 px-3 rounded-xl bg-slate-900 hover:bg-slate-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98"
          title="Kirim ke Cloud Firestore dan dorong ke GitHub Repository"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
          ) : (
            <Upload className="w-4 h-4 text-emerald-400" />
          )}
          <span>Sync ke Firestore &amp; GitHub</span>
        </button>

        <button
          type="button"
          onClick={handlePullFromGitHub}
          disabled={isLoading}
          className="py-2.5 px-3 rounded-xl bg-white hover:bg-slate-50 disabled:opacity-50 text-slate-800 border border-slate-300 font-bold text-xs flex items-center justify-center gap-1.5 shadow-2xs transition active:scale-98"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Download className="w-4 h-4 text-blue-600" />
          )}
          <span>Tarik dari GitHub (Pull)</span>
        </button>

        <button
          type="button"
          onClick={handleForceSyncToFirestore}
          disabled={isLoading}
          className="py-2.5 px-3 rounded-xl bg-blue-700 hover:bg-blue-800 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98"
          title="Kirim seluruh data ini langsung ke Cloud Firestore agar Website live seketika terbarui"
        >
          {isLoading ? (
            <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
          ) : (
            <RefreshCw className="w-4 h-4 text-white" />
          )}
          <span>Update ke Firestore (Web)</span>
        </button>
      </div>

      {/* Quick Manual Copy Box */}
      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between gap-2">
        <div className="text-[11px] text-slate-600">
          <strong className="text-slate-800">Ingin commit manual tanpa token?</strong> Salin seluruh kode JSON database siap pakai.
        </div>
        <button
          type="button"
          onClick={handleCopyPayload}
          className="px-3 py-1.5 rounded-lg bg-white hover:bg-slate-100 border border-slate-300 text-slate-700 font-bold text-[11px] flex items-center gap-1 shrink-0 transition"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copied ? 'Tersalin!' : 'Salin JSON'}</span>
        </button>
      </div>
    </div>
  );
};
