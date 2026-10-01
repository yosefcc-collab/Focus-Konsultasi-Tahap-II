import React, { useState } from 'react';
import {
  BarChart3,
  MapPin,
  CheckCircle2,
  Clock,
  Layers,
  Calendar,
  Sparkles,
  GitBranch,
  ShieldCheck,
  Server,
  ArrowUpRight,
} from 'lucide-react';
import { TaskAssignment, TeamMember } from '../types';
import regionsMaster from '../../database/master/regionsMaster.json';

interface StatsTabProps {
  tasks: TaskAssignment[];
  members: TeamMember[];
  onSelectTask?: (task: TaskAssignment) => void;
}

export const StatsTab: React.FC<StatsTabProps> = ({ tasks, members }) => {
  const [selectedRegionId, setSelectedRegionId] = useState<string>('all');

  const totalTasks = tasks.length;
  const scheduledTasks = tasks.filter((t) => Boolean(t.tanggalKonsultasi) || t.status === 'terjadwal' || t.status === 'selesai');
  const completedTasks = tasks.filter((t) => t.terlaksana || t.status === 'selesai');
  const pendingTasks = tasks.filter((t) => !t.tanggalKonsultasi && !t.terlaksana);

  // Calculate per-rayon statistics
  const regionStats = regionsMaster.map((region) => {
    const regionTasks = tasks.filter((t) =>
      region.lingkungan.some((name) => name.toLowerCase().trim() === t.namaDpl.toLowerCase().trim())
    );
    const regionScheduled = regionTasks.filter((t) => Boolean(t.tanggalKonsultasi) || t.status === 'terjadwal');
    const regionCompleted = regionTasks.filter((t) => t.terlaksana || t.status === 'selesai');

    return {
      ...region,
      tasks: regionTasks,
      total: regionTasks.length,
      scheduled: regionScheduled.length,
      completed: regionCompleted.length,
      percentage: regionTasks.length > 0 ? Math.round((regionScheduled.length / regionTasks.length) * 100) : 0,
    };
  });

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-red-950 via-red-900 to-slate-900 text-white p-4 rounded-2xl shadow-sm border border-red-800/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-400/20 text-amber-400 border border-amber-400/30 flex items-center justify-center shrink-0">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-2">
              <span>Statistik &amp; Persebaran 4 Rayon Paroki</span>
              <span className="text-[10px] font-bold bg-amber-400/20 text-amber-300 px-2 py-0.5 rounded-full border border-amber-400/30">
                Fitur Baru (Migration 003)
              </span>
            </h2>
            <p className="text-xs text-red-200">
              Data master pembagian 4 Rayon &amp; rekapitulasi progres konsultasi sinodal di Paroki Katedral Medan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs bg-black/30 px-3 py-1.5 rounded-xl border border-white/10 self-start sm:self-auto">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span className="font-semibold text-slate-200">Data Master Versioned (Git &amp; Netlify)</span>
        </div>
      </div>

      {/* Database & Migration Architecture Status Card */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-700" />
            <h3 className="text-xs font-extrabold text-slate-900">Arsitektur Database &amp; Riwayat Migrasi</h3>
          </div>
          <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
            Firestore Production Connected
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-500">Database Engine</div>
            <div className="font-extrabold text-slate-900 mt-0.5">Google Cloud Firestore</div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">ai-studio-timsinodal...</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-500">Deployment Pipeline</div>
            <div className="font-extrabold text-slate-900 mt-0.5">Netlify Server-Side Build</div>
            <div className="text-[10px] text-blue-700 font-mono mt-0.5">npm run db:migrate &amp;&amp; vite build</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/80">
            <div className="text-[10px] uppercase font-bold text-slate-500">Status Transaksi</div>
            <div className="font-extrabold text-emerald-700 mt-0.5">Non-Destructive UPSERT</div>
            <div className="text-[10px] text-slate-600 mt-0.5">Jadwal &amp; catatan user terlindungi 100%</div>
          </div>
        </div>

        {/* Migrations Timeline */}
        <div className="bg-slate-900 text-slate-100 p-3 rounded-xl border border-slate-800 space-y-2">
          <div className="text-[11px] font-bold text-amber-400 flex items-center gap-1.5">
            <GitBranch className="w-3.5 h-3.5" />
            <span>Riwayat Migrasi Ter-deploy (Tercatat di Firestore collection `_migrations`):</span>
          </div>

          <div className="space-y-1.5 text-[11px]">
            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold">001</span>
                <span className="font-medium text-white">001_initial_master_data</span>
                <span className="text-slate-400 text-[10px]">(21 DPL/Kategorial &amp; 15 Petugas)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                APPLIED
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold">002</span>
                <span className="font-medium text-white">002_add_app_menus_master</span>
                <span className="text-slate-400 text-[10px]">(Master Menu Navigasi Berversi)</span>
              </div>
              <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-800">
                APPLIED
              </span>
            </div>

            <div className="flex items-center justify-between bg-slate-800/80 p-2 rounded-lg border border-slate-700">
              <div className="flex items-center gap-2">
                <span className="font-mono text-emerald-400 font-bold">003</span>
                <span className="font-medium text-white">003_add_stats_menu_and_regions</span>
                <span className="text-slate-400 text-[10px]">(Menu Statistik &amp; 4 Rayon Paroki)</span>
              </div>
              <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                APPLIED (NEW)
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rayon Wilayah Cards */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-extrabold text-slate-900 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-red-700" />
            <span>Pembagian &amp; Kemajuan 4 Rayon Wilayah</span>
          </h3>
          <div className="text-[11px] text-slate-500">
            Total <strong className="text-slate-800">{scheduledTasks.length}</strong> dari 21 telah terkoordinasi
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {regionStats.map((reg) => (
            <div
              key={reg.id}
              className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-xs transition space-y-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-extrabold bg-red-100 text-red-800 px-1.5 py-0.5 rounded">
                      {reg.code}
                    </span>
                    <h4 className="text-xs font-bold text-slate-900">{reg.name}</h4>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">{reg.coordinator}</div>
                </div>

                <div className="text-right">
                  <div className="text-xs font-extrabold text-blue-700">
                    {reg.scheduled}/{reg.total} Jadwal
                  </div>
                  <div className="text-[10px] font-bold text-slate-500">{reg.percentage}%</div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-blue-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${reg.percentage}%` }}
                />
              </div>

              {/* List Lingkungan / Kategorial under this rayon */}
              <div className="pt-2 border-t border-slate-100 space-y-1.5">
                <div className="text-[10px] uppercase font-bold text-slate-400">Sasaran di Wilayah Ini:</div>
                <div className="space-y-1">
                  {reg.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between text-[11px] p-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 transition"
                    >
                      <span className="font-semibold text-slate-800 truncate max-w-[200px]">{task.namaDpl}</span>
                      {task.tanggalKonsultasi ? (
                        <span className="text-[10px] font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-200 shrink-0">
                          {task.hari ? `${task.hari}, ` : ''}{task.tanggalKonsultasi}
                        </span>
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400 shrink-0">
                          Belum ditentukan
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
