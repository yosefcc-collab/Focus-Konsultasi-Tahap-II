import React, { useState } from 'react';
import { Table, Copy, Check, Printer, RotateCcw, Search, Edit2 } from 'lucide-react';
import { TaskAssignment } from '../types';
import { formatIndonesianDate } from '../data/initialData';

interface MatrixTabProps {
  tasks: TaskAssignment[];
  onEditTask: (task: TaskAssignment) => void;
  onResetToDefault: () => void;
}

export const MatrixTab: React.FC<MatrixTabProps> = ({
  tasks,
  onEditTask,
  onResetToDefault,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'Lingkungan' | 'Kategorial'>('all');
  const [copied, setCopied] = useState(false);
  const [search, setSearch] = useState('');

  const filteredTasks = tasks.filter((t) => {
    if (filterType !== 'all' && t.category !== filterType) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        t.namaDpl.toLowerCase().includes(q) ||
        t.fasilitator.toLowerCase().includes(q) ||
        t.notulen.toLowerCase().includes(q) ||
        t.focusKonsultasi.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const handleCopyTextTable = async () => {
    let text = `MATRIKS PENUGASAN TIM SINODAL\n`;
    text += `PAROKI ST PERAWAN MARIA DIKANDUNG TANPA NODA KATEDRAL KEUSKUPAN AGUNG MEDAN\n`;
    text += `(14 Lingkungan & 7 Kategorial | 4 Focus Konsultasi)\n\n`;
    text += `No | Nama DPL | Tanggal | Hari | Jam | Focus Konsultasi | Pendamping (Fasilitator & Notulen)\n`;
    text += `----------------------------------------------------------------------------------------\n`;

    tasks.forEach((t, i) => {
      const tgl = t.tanggalKonsultasi ? formatIndonesianDate(t.tanggalKonsultasi) : '-';
      const hari = t.hari || '-';
      const jam = t.jam || '-';
      const tag = t.category === 'Kategorial' ? '[Kategorial] ' : '';
      text += `${i + 1}. ${tag}${t.namaDpl} | ${tgl} | ${hari} | ${jam} | ${t.focusKonsultasi} | ${t.fasilitator} dan ${t.notulen}\n`;
    });

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Info */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-sm print:hidden">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Table className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Format Tabel Resmi
            </span>
          </div>
          <h2 className="text-lg font-bold">Matriks Penugasan Tim Sinodal</h2>
          <p className="text-xs text-slate-300 mt-0.5">
            Baris kuning menandakan kelompok <strong>Kategorial (7 sasaran)</strong>, baris putih
            adalah <strong>Lingkungan (14 sasaran)</strong>.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={handleCopyTextTable}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white border border-slate-700 transition"
            title="Salin isi tabel sebagai teks rapi"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Tersalin!' : 'Salin Tabel'}</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-700 hover:bg-red-800 text-white transition"
            title="Cetak matriks"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Cetak / PDF</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-2 print:hidden">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Cari DPL, Tim Pendamping, atau Focus..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600"
          />
        </div>

        <div className="flex gap-1 bg-slate-200/70 p-1 rounded-xl shrink-0">
          <button
            type="button"
            onClick={() => setFilterType('all')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Semua (21)
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Lingkungan')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
              filterType === 'Lingkungan' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            14 Lingkungan
          </button>
          <button
            type="button"
            onClick={() => setFilterType('Kategorial')}
            className={`px-3 py-1 text-xs font-semibold rounded-lg transition ${
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
                <th className="py-3 px-3 border-r border-slate-300 min-w-[200px]">Nama DPL</th>
                <th className="py-3 px-2 border-r border-slate-300 min-w-[110px] text-center">Tanggal Konsultasi</th>
                <th className="py-3 px-2 border-r border-slate-300 min-w-[70px] text-center">Hari</th>
                <th className="py-3 px-2 border-r border-slate-300 min-w-[80px] text-center">Jam</th>
                <th className="py-3 px-3 border-r border-slate-300 min-w-[230px]">Focus Konsultasi</th>
                <th className="py-3 px-3 border-r border-slate-300 min-w-[170px]">Pendamping</th>
                <th className="py-3 px-2 text-center min-w-[70px] print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300">
              {filteredTasks.map((t) => {
                const isKategorial = t.category === 'Kategorial';

                return (
                  <tr
                    key={t.id}
                    className={`transition hover:opacity-90 ${
                      isKategorial ? 'bg-yellow-300/80 font-medium text-slate-950' : 'bg-white text-slate-900'
                    }`}
                  >
                    {/* Nama DPL */}
                    <td className="py-2.5 px-3 border-r border-slate-300 font-bold">
                      <div className="flex items-center gap-1.5">
                        <span>{t.namaDpl}</span>
                      </div>
                    </td>

                    {/* Tanggal */}
                    <td className="py-2.5 px-2 border-r border-slate-300 text-center font-medium">
                      {t.tanggalKonsultasi ? (
                        <span className="font-semibold">{formatIndonesianDate(t.tanggalKonsultasi)}</span>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">-</span>
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
                        (Fasilitator: {t.fasilitator} | Notulen: {t.notulen})
                      </span>
                    </td>

                    {/* Aksi */}
                    <td className="py-2.5 px-2 text-center print:hidden">
                      <button
                        type="button"
                        onClick={() => onEditTask(t)}
                        className="p-1.5 rounded-lg bg-slate-900/10 hover:bg-slate-900/20 text-slate-900 font-semibold transition"
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
            <span>Kategorial (7 sasaran)</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-white border border-slate-300 inline-block" />
            <span>Lingkungan (14 sasaran)</span>
          </div>
        </div>

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Apakah Anda yakin ingin mereset semua jadwal kembali ke data awal?')) {
              onResetToDefault();
            }
          }}
          className="text-slate-400 hover:text-rose-600 text-xs inline-flex items-center gap-1 transition print:hidden"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Kembalikan Data Awal</span>
        </button>
      </div>
    </div>
  );
};
