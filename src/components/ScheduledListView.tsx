import React, { useState, useMemo } from 'react';
import {
  CalendarCheck,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  Edit3,
  ArrowUpDown,
  Search,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  CalendarDays,
  Printer,
} from 'lucide-react';
import { TaskAssignment, TeamMember } from '../types';
import { formatIndonesianDate } from '../data/initialData';

interface ScheduledListViewProps {
  tasks: TaskAssignment[];
  members: TeamMember[];
  onEditTask: (task: TaskAssignment) => void;
  onShareWhatsApp: (task: TaskAssignment) => void;
  onGoToTasks: () => void;
}

type SortOption = 'updated_desc' | 'updated_asc' | 'date_asc' | 'date_desc';

export const ScheduledListView: React.FC<ScheduledListViewProps> = ({
  tasks,
  onEditTask,
  onShareWhatsApp,
  onGoToTasks,
}) => {
  const [sortOption, setSortOption] = useState<SortOption>('updated_desc');
  const [filterCategory, setFilterCategory] = useState<'all' | 'Lingkungan' | 'Kategorial'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'upcoming' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Filter only tasks that are scheduled (have tanggalKonsultasi or marked scheduled/completed)
  const scheduledTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Must have a date set or be marked scheduled/selesai/terlaksana
      const hasDate = Boolean(t.tanggalKonsultasi && t.tanggalKonsultasi.trim() !== '');
      const isMarked = t.status === 'terjadwal' || t.status === 'selesai' || Boolean(t.terlaksana);
      return hasDate || isMarked;
    });
  }, [tasks]);

  // Apply sorting and user filters
  const processedTasks = useMemo(() => {
    let result = scheduledTasks.filter((t) => {
      if (filterCategory !== 'all' && t.category !== filterCategory) return false;
      if (filterStatus === 'upcoming' && (t.terlaksana || t.status === 'selesai')) return false;
      if (filterStatus === 'completed' && !(t.terlaksana || t.status === 'selesai')) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchDpl = t.namaDpl.toLowerCase().includes(q);
        const matchFas = t.fasilitator.toLowerCase().includes(q);
        const matchNot = t.notulen.toLowerCase().includes(q);
        const matchHari = (t.hari || '').toLowerCase().includes(q);
        const matchTempat = (t.tempat || t.lokasiPelaksanaan || '').toLowerCase().includes(q);
        const matchFocus = t.focusKonsultasi.toLowerCase().includes(q);
        if (!matchDpl && !matchFas && !matchNot && !matchHari && !matchTempat && !matchFocus) {
          return false;
        }
      }
      return true;
    });

    // Sorting
    result.sort((a, b) => {
      if (sortOption === 'updated_desc') {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (timeB !== timeA) return timeB - timeA;
        return (a.tanggalKonsultasi || '').localeCompare(b.tanggalKonsultasi || '');
      }
      if (sortOption === 'updated_asc') {
        const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        if (timeA !== timeB) return timeA - timeB;
        return (a.tanggalKonsultasi || '').localeCompare(b.tanggalKonsultasi || '');
      }
      if (sortOption === 'date_asc') {
        const dateA = a.tanggalKonsultasi || '9999-99-99';
        const dateB = b.tanggalKonsultasi || '9999-99-99';
        return dateA.localeCompare(dateB);
      }
      if (sortOption === 'date_desc') {
        const dateA = a.tanggalKonsultasi || '0000-00-00';
        const dateB = b.tanggalKonsultasi || '0000-00-00';
        return dateB.localeCompare(dateA);
      }
      return 0;
    });

    return result;
  }, [scheduledTasks, sortOption, filterCategory, filterStatus, searchQuery]);

  const completedCount = scheduledTasks.filter((t) => t.terlaksana || t.status === 'selesai').length;
  const upcomingCount = scheduledTasks.length - completedCount;
  const unscheduledCount = tasks.length - scheduledTasks.length;

  const formatEditTime = (dateStr?: string) => {
    if (!dateStr) return 'Tersimpan';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return 'Tersimpan';
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }) + ' WIB';
    } catch {
      return 'Tersimpan';
    }
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-200">
      {/* Top Banner Card */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 rounded-2xl p-4 sm:p-5 text-white shadow-md border border-red-700/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400 text-red-950 uppercase tracking-wider flex items-center gap-1 shadow-2xs">
                <CalendarCheck className="w-3.5 h-3.5" />
                Menu Khusus Terjadwal
              </span>
              <span className="text-xs text-red-200">
                {scheduledTasks.length} dari {tasks.length} Sasaran
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-black text-white leading-tight">
              Daftar Konsultasi Sinodal Terjadwal
            </h2>
            <p className="text-xs text-red-100/90 mt-1 max-w-xl">
              Memantau seluruh sasaran yang telah ditentukan tanggal dan waktunya, diurutkan berdasarkan tanggal edit terbaru atau tanggal pelaksanaan.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <button
              onClick={() => window.print()}
              className="py-1.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/20 transition"
              title="Cetak Ringkasan Jadwal"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak Jadwal</span>
            </button>
          </div>
        </div>

        {/* Stats Pill Row */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-red-700/50 text-center">
          <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2">
            <div className="text-[10px] text-amber-200 font-bold uppercase">Sudah Terjadwal</div>
            <div className="text-base sm:text-lg font-black text-white">{scheduledTasks.length}</div>
          </div>
          <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2">
            <div className="text-[10px] text-emerald-300 font-bold uppercase">Sudah Terlaksana</div>
            <div className="text-base sm:text-lg font-black text-white">{completedCount}</div>
          </div>
          <div className="bg-black/20 backdrop-blur-xs rounded-xl p-2">
            <div className="text-[10px] text-red-200 font-bold uppercase">Belum Dijadwalkan</div>
            <div className="text-base sm:text-lg font-black text-white">{unscheduledCount}</div>
          </div>
        </div>
      </div>

      {/* Control Bar: Search, Sort Dropdown & Filters */}
      <div className="bg-white p-3 sm:p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
          {/* Search Box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari sasaran, petugas, hari, tempat..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition"
            />
          </div>

          {/* Sort Selector: Utk Urutkan Berdasarkan Tanggal yang Sudah Diedit */}
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 p-1 rounded-xl">
            <span className="text-[11px] font-bold text-slate-600 pl-2 flex items-center gap-1">
              <ArrowUpDown className="w-3.5 h-3.5 text-red-700" />
              <span>Urutan:</span>
            </span>
            <select
              value={sortOption}
              onChange={(e) => setSortOption(e.target.value as SortOption)}
              className="text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 focus:outline-hidden focus:ring-1 focus:ring-red-600 cursor-pointer shadow-2xs"
            >
              <option value="updated_desc">🕒 Tanggal Diedit (Terbaru &rarr; Lama)</option>
              <option value="updated_asc">🕒 Tanggal Diedit (Terlama &rarr; Baru)</option>
              <option value="date_asc">🗓️ Tanggal Konsultasi (Terdekat)</option>
              <option value="date_desc">🗓️ Tanggal Konsultasi (Terjauh)</option>
            </select>
          </div>
        </div>

        {/* Filter Badges: Kategori & Status */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 text-xs">
          <span className="text-[11px] font-bold text-slate-500 mr-1">Filter:</span>

          {/* Category Filter */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setFilterCategory('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                filterCategory === 'all'
                  ? 'bg-red-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua ({scheduledTasks.length})
            </button>
            <button
              onClick={() => setFilterCategory('Lingkungan')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                filterCategory === 'Lingkungan'
                  ? 'bg-red-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lingkungan
            </button>
            <button
              onClick={() => setFilterCategory('Kategorial')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                filterCategory === 'Kategorial'
                  ? 'bg-red-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Kategorial
            </button>
          </div>

          {/* Status Filter */}
          <div className="flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                filterStatus === 'all'
                  ? 'bg-slate-800 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Semua Status
            </button>
            <button
              onClick={() => setFilterStatus('upcoming')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                filterStatus === 'upcoming'
                  ? 'bg-blue-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Menunggu ({upcomingCount})
            </button>
            <button
              onClick={() => setFilterStatus('completed')}
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold transition ${
                filterStatus === 'completed'
                  ? 'bg-emerald-700 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Terlaksana ({completedCount})
            </button>
          </div>

          <div className="ml-auto text-[11px] text-slate-500 font-medium">
            Menampilkan <strong className="text-slate-800">{processedTasks.length}</strong> sasaran
          </div>
        </div>
      </div>

      {/* Main List of Scheduled Items */}
      {processedTasks.length > 0 ? (
        <div className="space-y-3">
          {processedTasks.map((task, index) => {
            const isCompleted = task.terlaksana || task.status === 'selesai';

            return (
              <div
                key={task.id}
                className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-xs transition hover:shadow-md ${
                  isCompleted
                    ? 'border-emerald-200 bg-gradient-to-r from-emerald-50/20 to-white'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                  {/* Left Column: Date & Time Highlight Box */}
                  <div className="flex items-start gap-3 w-full sm:w-auto">
                    <div className="flex flex-col items-center justify-center p-2.5 rounded-xl bg-slate-900 text-white min-w-[76px] text-center shadow-xs shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                        {task.hari || 'Jadwal'}
                      </span>
                      <span className="text-lg font-black leading-none my-1">
                        {task.tanggalKonsultasi ? new Date(task.tanggalKonsultasi + 'T00:00:00').getDate() : '—'}
                      </span>
                      <span className="text-[10px] text-slate-300 font-medium">
                        {task.tanggalKonsultasi
                          ? new Date(task.tanggalKonsultasi + 'T00:00:00').toLocaleDateString('id-ID', { month: 'short' })
                          : 'Belum'}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      {/* Category & Status */}
                      <div className="flex flex-wrap items-center gap-1.5 mb-1">
                        <span className="text-[11px] font-bold text-slate-400 mr-1">
                          #{index + 1}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            task.category === 'Lingkungan'
                              ? 'bg-blue-100 text-blue-900 border border-blue-200'
                              : 'bg-purple-100 text-purple-900 border border-purple-200'
                          }`}
                        >
                          {task.category}
                        </span>

                        {isCompleted ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Terlaksana
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300 flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            Terjadwal
                          </span>
                        )}

                        {/* Last edited timestamp badge */}
                        <span
                          className="text-[10px] text-slate-500 font-medium ml-auto flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-full"
                          title="Waktu terakhir jadwal/data ini diedit"
                        >
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>Diedit: {formatEditTime(task.updatedAt)}</span>
                        </span>
                      </div>

                      {/* Title & Focus */}
                      <h3 className="text-base font-bold text-slate-900 leading-snug">
                        {task.namaDpl}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {task.focusKonsultasi}
                      </p>

                      {/* Detailed Schedule Info Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                        {/* Officers */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <Users className="w-3.5 h-3.5 text-slate-400" />
                            <span>Tim Pendamping:</span>
                          </div>
                          <div className="pl-4 space-y-0.5">
                            <div className="text-slate-800">
                              • Fasilitator: <strong className="text-red-900">{task.fasilitator}</strong>
                            </div>
                            <div className="text-slate-800">
                              • Notulen: <strong className="text-slate-900">{task.notulen}</strong>
                            </div>
                          </div>
                        </div>

                        {/* Timing & Location */}
                        <div className="space-y-1">
                          <div className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
                            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
                            <span>Waktu &amp; Tempat:</span>
                          </div>
                          <div className="pl-4 space-y-0.5">
                            <div className="text-slate-800 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-400" />
                              <span>
                                {task.tanggalKonsultasi
                                  ? `${task.hari ? `${task.hari}, ` : ''}${formatIndonesianDate(task.tanggalKonsultasi)} • ${task.jam || 'Jam belum ada'}`
                                  : 'Belum ditentukan'}
                              </span>
                            </div>
                            {(task.lokasiPelaksanaan || task.tempat) && (
                              <div className="text-slate-700 flex items-start gap-1">
                                <MapPin className="w-3 h-3 text-slate-400 shrink-0 mt-0.5" />
                                <span className="line-clamp-1">{task.lokasiPelaksanaan || task.tempat}</span>
                              </div>
                            )}
                            {task.kontakPic && (
                              <div className="text-slate-600 flex items-center gap-1">
                                <Phone className="w-3 h-3 text-slate-400" />
                                <span>PIC: {task.kontakPic}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Catatan if available */}
                      {task.catatan && (
                        <div className="mt-2.5 p-2 rounded-xl bg-amber-50/70 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-1.5">
                          <FileText className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <div>
                            <strong>Catatan:</strong> {task.catatan}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Action Buttons */}
                  <div className="flex sm:flex-col items-center sm:items-stretch gap-2 w-full sm:w-auto shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                    <button
                      onClick={() => onShareWhatsApp(task)}
                      className="flex-1 sm:flex-initial py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-2xs transition"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>WhatsApp</span>
                    </button>

                    <button
                      onClick={() => onEditTask(task)}
                      className="flex-1 sm:flex-initial py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-200 transition"
                    >
                      <Edit3 className="w-3.5 h-3.5 text-slate-600" />
                      <span>Ubah Jadwal</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center space-y-3">
          <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <CalendarCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-slate-800">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Tidak ada jadwal yang sesuai dengan filter'
              : 'Belum Ada Sasaran yang Dijadwalkan'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto">
            {searchQuery || filterCategory !== 'all' || filterStatus !== 'all'
              ? 'Coba ganti filter atau kata kunci pencarian Anda.'
              : 'Silakan buka tab "Penugasan", pilih Lingkungan atau Kategorial, lalu masukkan tanggal dan jam konsultasi.'}
          </p>
          <button
            onClick={onGoToTasks}
            className="mt-2 inline-flex items-center gap-2 py-2 px-4 rounded-xl bg-red-800 hover:bg-red-900 text-white text-xs font-bold transition shadow-xs"
          >
            <span>Buka Daftar Penugasan &amp; Jadwalkan</span>
          </button>
        </div>
      )}
    </div>
  );
};
