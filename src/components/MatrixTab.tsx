import React, { useState, useMemo } from 'react';
import {
  Table,
  Copy,
  Check,
  Printer,
  RotateCcw,
  Search,
  Edit2,
  FileDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Calendar,
  CalendarCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Filter,
} from 'lucide-react';
import { TaskAssignment, TeamMember } from '../types';
import { formatIndonesianDate } from '../data/initialData';
import { generateOfficerPositionsPDF } from '../utils/pdfGenerator';

interface MatrixTabProps {
  tasks: TaskAssignment[];
  members: TeamMember[];
  onEditTask: (task: TaskAssignment) => void;
  onResetToDefault: () => void;
}

export const MatrixTab: React.FC<MatrixTabProps> = ({
  tasks,
  members,
  onEditTask,
  onResetToDefault,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'Lingkungan' | 'Kategorial'>('all');
  const [sortBy, setSortBy] = useState<'date_asc' | 'date_desc' | 'default'>('date_asc');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  // Urutkan berdasarkan tanggal konsultasi: terlaksana pertama sampai terakhir
  const sortedAndFilteredTasks = useMemo(() => {
    const list = tasks.filter((t) => {
      if (filterType !== 'all' && t.category !== filterType) return false;
      if (search.trim()) {
        const q = search.toLowerCase();
        return (
          t.namaDpl.toLowerCase().includes(q) ||
          t.fasilitator.toLowerCase().includes(q) ||
          t.notulen.toLowerCase().includes(q) ||
          t.focusKonsultasi.toLowerCase().includes(q) ||
          (t.hari || '').toLowerCase().includes(q) ||
          (t.jam || '').toLowerCase().includes(q) ||
          (t.tanggalKonsultasi || '').includes(q) ||
          (t.tempat || t.lokasiPelaksanaan || '').toLowerCase().includes(q)
        );
      }
      return true;
    });

    if (sortBy === 'default') {
      return list;
    }

    return [...list].sort((a, b) => {
      const hasDateA = Boolean(a.tanggalKonsultasi && a.tanggalKonsultasi.trim());
      const hasDateB = Boolean(b.tanggalKonsultasi && b.tanggalKonsultasi.trim());

      // Kunjungan yang telah memiliki tanggal konsultasi ditempatkan di atas,
      // kunjungan yang belum dijadwalkan ditempatkan di paling bawah
      if (hasDateA && !hasDateB) return -1;
      if (!hasDateA && hasDateB) return 1;

      // Jika keduanya belum ada tanggal, urutkan berdasarkan nama
      if (!hasDateA && !hasDateB) {
        return a.namaDpl.localeCompare(b.namaDpl);
      }

      // Keduanya memiliki tanggal
      const dateA = a.tanggalKonsultasi || '';
      const dateB = b.tanggalKonsultasi || '';

      if (dateA !== dateB) {
        return sortBy === 'date_asc' ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
      }

      // Jika tanggal sama persis, urutkan berdasarkan jam pelaksanaan
      const cleanJamA = (a.jam || '').replace(/[^0-9:]/g, '').trim() || '99:99';
      const cleanJamB = (b.jam || '').replace(/[^0-9:]/g, '').trim() || '99:99';
      if (cleanJamA !== cleanJamB) {
        return cleanJamA.localeCompare(cleanJamB);
      }

      return a.namaDpl.localeCompare(b.namaDpl);
    });
  }, [tasks, filterType, search, sortBy]);

  // Statistik jadwal
  const scheduledCount = tasks.filter((t) => Boolean(t.tanggalKonsultasi && t.tanggalKonsultasi.trim())).length;
  const completedCount = tasks.filter((t) => Boolean(t.terlaksana || t.status === 'selesai')).length;
  const unscheduledCount = tasks.length - scheduledCount;

  // Rentang tanggal pelaksanaan
  const dateRangeText = useMemo(() => {
    const dates = tasks
      .map((t) => t.tanggalKonsultasi)
      .filter((d): d is string => Boolean(d && d.trim()))
      .sort();
    if (dates.length === 0) return 'Belum ada jadwal konsultasi';
    const firstDate = formatIndonesianDate(dates[0]);
    const lastDate = formatIndonesianDate(dates[dates.length - 1]);
    if (firstDate === lastDate) return firstDate;
    return `${firstDate} s/d ${lastDate}`;
  }, [tasks]);

  const handleCopyTextTable = async () => {
    let text = `MATRIKS PENUGASAN TIM SINODAL (URUTAN TANGGAL PELAKSANAAN: TERLAKSANA PERTAMA S/D TERAKHIR)\n`;
    text += `PAROKI ST PERAWAN MARIA DIKANDUNG TANPA NODA KATEDRAL KEUSKUPAN AGUNG MEDAN\n`;
    text += `(14 Lingkungan & 7 Kategorial | 4 Focus Konsultasi)\n\n`;
    text += `No | Tanggal Konsultasi | Hari & Jam | Kunjungan (Nama DPL) | Focus Konsultasi | Pendamping (Fasilitator & Notulen) | Status\n`;
    text += `----------------------------------------------------------------------------------------------------------------\n`;

    sortedAndFilteredTasks.forEach((t, i) => {
      const tgl = t.tanggalKonsultasi ? formatIndonesianDate(t.tanggalKonsultasi) : 'Belum Dijadwalkan';
      const hari = t.hari || '-';
      const jam = t.jam || '-';
      const tag = t.category === 'Kategorial' ? '[Kategorial] ' : '';
      const status = t.terlaksana ? 'Terlaksana' : t.tanggalKonsultasi ? 'Terjadwal' : 'Koordinasi';
      text += `${i + 1}. ${tgl} | ${hari}, ${jam} | ${tag}${t.namaDpl} | ${t.focusKonsultasi} | ${t.fasilitator} & ${t.notulen} | ${status}\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDownloadPdf = () => {
    generateOfficerPositionsPDF(sortedAndFilteredTasks, members);
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleDateSort = () => {
    if (sortBy === 'date_asc') setSortBy('date_desc');
    else setSortBy('date_asc');
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info Banner */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Table className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Format Matriks Resmi
            </span>
          </div>
          <h2 className="text-lg font-bold">Matriks Penugasan Tim Sinodal</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Tabel disusun <strong>berdasarkan urutan tanggal konsultasi</strong> (dari yang akan terlaksana pertama sampai terakhir).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleDownloadPdf}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-400 hover:bg-amber-300 text-slate-950 shadow-sm transition active:scale-95 cursor-pointer"
            title="Download posisi petugas dalam format dokumen PDF resmi (berurutan tanggal)"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Download PDF</span>
          </button>

          <button
            type="button"
            onClick={handleCopyTextTable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition cursor-pointer"
            title="Salin isi tabel berurutan tanggal sebagai teks rapi"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-800 text-white transition cursor-pointer"
            title="Cetak langsung lewat printer / browser"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak</span>
          </button>
        </div>
      </div>

      {/* Bar Statistik Urutan Pelaksanaan */}
      <div className="bg-white rounded-xl border border-slate-200 p-3 shadow-2xs flex flex-wrap items-center justify-between gap-2.5 text-xs print:hidden">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Calendar className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-500">Rentang Pelaksanaan Konsultasi</div>
            <div className="font-bold text-slate-900">{dateRangeText}</div>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="text-slate-600 font-medium">Terjadwal:</span>
            <strong className="text-slate-900">{scheduledCount}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
            <span className="text-slate-600 font-medium">Selesai:</span>
            <strong className="text-slate-900">{completedCount}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
            <span className="text-slate-600 font-medium">Belum Dijadwalkan:</span>
            <strong className="text-slate-900">{unscheduledCount}</strong>
          </div>
        </div>
      </div>

      {/* Filter, Sort, and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 print:hidden">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari Kunjungan, Tim Pendamping, Focus, Hari, atau Tanggal..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
          />
        </div>

        {/* Sort Selector Dropdown/Pills */}
        <div className="flex items-center gap-1 bg-white border border-slate-200 p-1 rounded-xl shrink-0">
          <span className="text-[10px] font-bold text-slate-400 px-2 flex items-center gap-1">
            <Filter className="w-3 h-3 text-slate-500" />
            <span className="hidden sm:inline">Urutan:</span>
          </span>
          <button
            type="button"
            onClick={() => setSortBy('date_asc')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer ${
              sortBy === 'date_asc'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Urutkan dari yang terlaksana pertama sampai terakhir"
          >
            <ArrowUp className="w-3 h-3" />
            <span>Terlaksana Pertama (Awal ➔ Akhir)</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('date_desc')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition flex items-center gap-1 cursor-pointer ${
              sortBy === 'date_desc'
                ? 'bg-emerald-700 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Urutkan dari yang terlaksana paling akhir"
          >
            <ArrowDown className="w-3 h-3" />
            <span className="hidden sm:inline">Akhir ➔ Awal</span>
          </button>
          <button
            type="button"
            onClick={() => setSortBy('default')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              sortBy === 'default'
                ? 'bg-slate-800 text-white shadow-2xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
            title="Urutan default berdasarkan susunan kunjungan"
          >
            Standar Kunjungan
          </button>
        </div>

        {/* Filter Category */}
        <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua (21)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Lingkungan')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filterType === 'Lingkungan' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            14 Lingkungan
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Kategorial')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition cursor-pointer ${
              filterType === 'Kategorial' ? 'bg-amber-400 text-amber-950 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            7 Kategorial
          </button>
        </div>
      </div>

      {/* Table Container (Responsive Horizontal Scroll for Mobile) */}
      <div className="bg-white rounded-2xl border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-slate-900 bg-slate-100 text-slate-900 font-extrabold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-2 border-r border-slate-300 w-12 text-center">No</th>
                <th className="py-3 px-3 border-r border-slate-300 min-w-[200px]">Kunjungan (DPL / Kategorial)</th>
                <th
                  onClick={toggleDateSort}
                  className="py-3 px-2 border-r border-slate-300 min-w-[130px] text-center cursor-pointer hover:bg-slate-200 transition select-none group"
                  title="Klik untuk ubah urutan tanggal (Awal ➔ Akhir atau Akhir ➔ Awal)"
                >
                  <div className="inline-flex items-center gap-1">
                    <span>Tanggal Konsultasi</span>
                    {sortBy === 'date_asc' ? (
                      <ArrowUp className="w-3.5 h-3.5 text-emerald-700" />
                    ) : sortBy === 'date_desc' ? (
                      <ArrowDown className="w-3.5 h-3.5 text-emerald-700" />
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 group-hover:text-slate-700" />
                    )}
                  </div>
                </th>
                <th className="py-3 px-2 border-r border-slate-300 min-w-[70px] text-center">Hari</th>
                <th className="py-3 px-2 border-r border-slate-300 min-w-[80px] text-center">Jam</th>
                <th className="py-3 px-3 border-r border-slate-300 min-w-[210px]">Focus Konsultasi</th>
                <th className="py-3 px-3 border-r border-slate-300 min-w-[170px]">Pendamping</th>
                <th className="py-3 px-2 border-r border-slate-300 min-w-[90px] text-center">Status</th>
                <th className="py-3 px-2 text-center min-w-[70px] print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {sortedAndFilteredTasks.map((t, idx) => {
                const isKategorial = t.category === 'Kategorial';
                const hasDate = Boolean(t.tanggalKonsultasi && t.tanggalKonsultasi.trim());
                const isCompleted = Boolean(t.terlaksana || t.status === 'selesai');

                return (
                  <tr
                    key={t.id}
                    className={`transition hover:opacity-90 ${
                      isKategorial ? 'bg-yellow-300/80 font-medium text-slate-950' : 'bg-white text-slate-900'
                    }`}
                  >
                    {/* Nomor Urut Kronologis */}
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-bold">
                      <span
                        className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-[11px] ${
                          isCompleted
                            ? 'bg-emerald-600 text-white'
                            : hasDate
                            ? 'bg-slate-900 text-white'
                            : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>

                    {/* Nama DPL */}
                    <td className="py-2.5 px-3 border-r border-slate-300 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span>{t.namaDpl}</span>
                        {isKategorial && (
                          <span className="text-[9px] font-extrabold uppercase px-1.5 py-0.2 rounded bg-amber-400/90 text-amber-950 border border-amber-500/50">
                            Kategorial
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Tanggal Konsultasi */}
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-medium">
                      {t.tanggalKonsultasi ? (
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-900 block">
                            {formatIndonesianDate(t.tanggalKonsultasi)}
                          </span>
                          <span className="text-[10px] text-emerald-800 font-semibold block">
                            Urutan ke-{idx + 1}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px] flex items-center justify-center gap-1">
                          <AlertCircle className="w-3 h-3 text-amber-500" />
                          <span>Belum diatur</span>
                        </span>
                      )}
                    </td>

                    {/* Hari */}
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-medium">
                      {t.hari || '-'}
                    </td>

                    {/* Jam */}
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-medium">
                      {t.jam || '-'}
                    </td>

                    {/* Focus Konsultasi */}
                    <td className="py-2.5 px-3 border-r border-slate-300 leading-snug">
                      {t.focusKonsultasi}
                    </td>

                    {/* Pendamping (Fasilitator & Notulen) */}
                    <td
                      onClick={() => onEditTask(t)}
                      className="py-2.5 px-3 border-r border-slate-300 cursor-pointer hover:bg-black/5"
                      title="Klik untuk ubah petugas (Fasilitator/Notulen) atau jadwal"
                    >
                      <div className="leading-tight">
                        <span className="font-bold underline decoration-blue-500 decoration-2">
                          {t.fasilitator}
                        </span>{' '}
                        dan{' '}
                        <span className="font-bold underline decoration-emerald-500 decoration-2">
                          {t.notulen}
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-600 block mt-0.5">
                        (Fas: {t.fasilitator} | Not: {t.notulen})
                      </span>
                    </td>

                    {/* Status */}
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center">
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          <span>Selesai</span>
                        </span>
                      ) : hasDate ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-300">
                          <Clock className="w-3 h-3 text-blue-600" />
                          <span>Terjadwal</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span>Koordinasi</span>
                        </span>
                      )}
                    </td>

                    {/* Aksi */}
                    <td className="py-2.5 px-2 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => onEditTask(t)}
                        className="p-1.5 rounded-lg bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 font-semibold transition cursor-pointer"
                        title="Edit Petugas & Jadwal"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Legend & Reset button */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 p-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-yellow-300 border border-yellow-400 inline-block" />
            <span>Kategorial (7 kunjungan)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-white border border-slate-300 inline-block" />
            <span>Lingkungan (14 kunjungan)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={onResetToDefault}
          className="text-slate-400 hover:text-rose-600 text-xs inline-flex items-center gap-1 transition print:hidden cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kembalikan Data Awal</span>
        </button>
      </div>
    </div>
  );
};
