import React, { useState } from 'react';
import {
  Calendar,
  Clock,
  MapPin,
  UserCheck,
  Edit3,
  MessageCircle,
  AlertCircle,
  CheckCircle2,
  Phone,
  FileText,
  Users,
  Camera,
  Image as ImageIcon,
  CheckSquare,
} from 'lucide-react';
import { TaskAssignment } from '../types';
import { FOCUS_LIST, formatIndonesianDate } from '../data/initialData';

interface TaskCardProps {
  task: TaskAssignment;
  onEdit: (task: TaskAssignment) => void;
  onOpenWhatsApp: (task: TaskAssignment) => void;
  highlightPerson?: string;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  onEdit,
  onOpenWhatsApp,
  highlightPerson,
}) => {
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const focusInfo = FOCUS_LIST.find((f) => f.id === task.focusId);

  const isFasilitator = highlightPerson && task.fasilitator.toLowerCase().includes(highlightPerson.toLowerCase());
  const isNotulen = highlightPerson && task.notulen.toLowerCase().includes(highlightPerson.toLowerCase());

  const isTerlaksana = Boolean(task.terlaksana || task.status === 'selesai');

  const getStatusBadge = () => {
    if (isTerlaksana) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          Terlaksana
        </span>
      );
    }
    switch (task.status) {
      case 'terjadwal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <Calendar className="w-3 h-3 text-blue-600" />
            Terjadwal
          </span>
        );
      case 'proses_koordinasi':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-300">
            <Clock className="w-3 h-3 text-amber-600" />
            Koordinasi
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-300">
            <AlertCircle className="w-3 h-3 text-slate-500" />
            Belum Ditentukan
          </span>
        );
    }
  };

  return (
    <>
      <div
        className={`rounded-2xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md bg-white ${
          task.category === 'Kategorial' ? 'border-amber-300 ring-1 ring-amber-100' : 'border-slate-200'
        }`}
      >
        {/* Top Banner Accent */}
        <div
          className="h-1.5 w-full"
          style={{ backgroundColor: focusInfo ? focusInfo.color.accent : '#991b1b' }}
        />

        <div className="p-4 space-y-3">
          {/* Header: Nama DPL & Category Badge */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-1.5 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-[11px] font-bold tracking-wide uppercase ${
                    task.category === 'Kategorial'
                      ? 'bg-amber-100 text-amber-900 border border-amber-300'
                      : 'bg-slate-100 text-slate-700 border border-slate-200'
                  }`}
                >
                  {task.category}
                </span>
                {getStatusBadge()}
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {task.namaDpl}
              </h3>
            </div>
          </div>

          {/* Focus Pillar Info */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-0.5">
            <div className="flex items-center gap-1.5 text-slate-500 font-medium">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: focusInfo?.color.accent }} />
              <span>{focusInfo?.theme || 'Focus Konsultasi'}</span>
            </div>
            <div className="font-semibold text-slate-800 line-clamp-2">
              {task.focusKonsultasi}
            </div>
          </div>

          {/* Pendamping Roles: Fasilitator & Notulen */}
          <div className="space-y-1 pt-1 border-t border-slate-100">
            <div className="flex items-center justify-between text-[11px] text-slate-500 font-semibold px-0.5">
              <span>Petugas Pendamping:</span>
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="text-[10px] text-blue-600 hover:text-blue-800 font-bold flex items-center gap-0.5"
              >
                <Edit3 className="w-2.5 h-2.5" />
                <span>Ubah Petugas</span>
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {/* Fasilitator (Orang Pertama) */}
              <div
                onClick={() => onEdit(task)}
                className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer hover:border-blue-400 ${
                  isFasilitator
                    ? 'bg-blue-50 border-blue-300 ring-2 ring-blue-200'
                    : 'bg-white border-slate-200'
                }`}
                title="Klik untuk ubah petugas"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-blue-700 mb-0.5">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>Fasilitator</span>
                </div>
                <p className="font-bold text-slate-900 text-sm truncate">
                  {task.fasilitator}
                </p>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Pemimpin diskusi
                </span>
              </div>

              {/* Notulen (Orang Kedua) */}
              <div
                onClick={() => onEdit(task)}
                className={`p-2 rounded-lg border text-xs transition-colors cursor-pointer hover:border-emerald-400 ${
                  isNotulen
                    ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-200'
                    : 'bg-white border-slate-200'
                }`}
                title="Klik untuk ubah petugas"
              >
                <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-700 mb-0.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Notulen</span>
                </div>
                <p className="font-bold text-slate-900 text-sm truncate">
                  {task.notulen}
                </p>
                <span className="text-[10px] text-slate-500 block leading-tight">
                  Pencatat hasil
                </span>
              </div>
            </div>
          </div>

          {/* Schedule & Location & Implementation Details */}
          <div className="bg-slate-50/90 rounded-xl p-2.5 text-xs space-y-1.5 border border-slate-100">
            {/* Tanggal & Jam */}
            <div className="flex items-center justify-between text-slate-700">
              <div className="flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                <span>
                  {task.tanggalKonsultasi
                    ? `${task.hari ? `${task.hari}, ` : ''}${formatIndonesianDate(task.tanggalKonsultasi)}`
                    : 'Tanggal belum ditentukan'}
                </span>
              </div>
              {task.jam && (
                <div className="flex items-center gap-1 text-slate-600 font-semibold bg-white px-2 py-0.5 rounded border border-slate-200">
                  <Clock className="w-3 h-3 text-slate-400" />
                  <span>{task.jam}</span>
                </div>
              )}
            </div>

            {/* Lokasi Pelaksanaan */}
            {(task.lokasiPelaksanaan || task.tempat) && (
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{task.lokasiPelaksanaan || task.tempat}</span>
              </div>
            )}

            {/* Jumlah Peserta Hadir (Jika sudah diinput) */}
            {task.jumlahPeserta !== undefined && task.jumlahPeserta !== '' && (
              <div className="flex items-center gap-1.5 text-blue-800 font-semibold">
                <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                <span>{task.jumlahPeserta} Peserta Hadir</span>
              </div>
            )}

            {/* Kontak PIC */}
            {task.kontakPic && (
              <div className="flex items-center gap-1.5 text-slate-600">
                <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span className="truncate">{task.kontakPic}</span>
              </div>
            )}

            {/* Catatan / Notulensi Ringkas */}
            {task.catatan && (
              <div className="mt-1 pt-1 border-t border-slate-200/60 text-slate-600 text-[11px] italic line-clamp-2">
                "{task.catatan}"
              </div>
            )}

            {/* Foto Dokumentasi Thumbnail if available */}
            {task.fotoDokumentasi && (
              <div className="pt-1.5 border-t border-slate-200/60">
                <div
                  onClick={() => setShowPhotoModal(true)}
                  className="flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400 transition"
                  title="Klik untuk melihat foto dokumentasi penuh"
                >
                  <img
                    src={task.fotoDokumentasi}
                    alt="Dokumentasi"
                    className="w-10 h-10 object-cover rounded-md border border-slate-100"
                  />
                  <div className="text-[11px] flex-1">
                    <span className="font-bold text-slate-800 block">📷 Foto Dokumentasi</span>
                    <span className="text-emerald-700 font-semibold text-[10px]">Klik untuk perbesar</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions for Mobile */}
          <div className="flex items-center gap-2 pt-1">
            <button
              type="button"
              onClick={() => onEdit(task)}
              className={`flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-bold rounded-xl transition active:scale-[0.98] ${
                isTerlaksana
                  ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                  : task.tanggalKonsultasi
                  ? 'bg-slate-900 text-white hover:bg-slate-800'
                  : 'bg-slate-900 text-white hover:bg-slate-800'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>
                {isTerlaksana
                  ? 'Edit Pelaksanaan'
                  : task.tanggalKonsultasi
                  ? 'Input Pelaksanaan & Foto'
                  : 'Atur Jadwal Koordinasi'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => onOpenWhatsApp(task)}
              className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 transition active:scale-[0.98]"
              title="Kirim template WhatsApp koordinasi"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">WA Koordinasi</span>
              <span className="sm:hidden">WA</span>
            </button>
          </div>
        </div>
      </div>

      {/* Photo Enlarge Modal */}
      {showPhotoModal && task.fotoDokumentasi && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-3 animate-in fade-in"
          onClick={() => setShowPhotoModal(false)}
        >
          <div
            className="bg-white rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 text-white flex items-center justify-between text-xs">
              <span className="font-bold">Foto Dokumentasi • {task.namaDpl}</span>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="p-2 bg-black flex items-center justify-center">
              <img
                src={task.fotoDokumentasi}
                alt="Foto Dokumentasi Penuh"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-white text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium">
                {task.lokasiPelaksanaan ? `Lokasi: ${task.lokasiPelaksanaan}` : task.namaDpl}
              </span>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
