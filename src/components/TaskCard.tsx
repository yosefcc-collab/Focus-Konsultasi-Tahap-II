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
  Lock,
  ExternalLink,
} from 'lucide-react';
import { TaskAssignment } from '../types';
import { FOCUS_LIST, FOCUS_NOTULENSI_QUESTIONS, formatIndonesianDate, FOCUS_1_POINT_TITLES } from '../data/initialData';

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
  const [selectedPhotoSlot, setSelectedPhotoSlot] = useState<1 | 2>(1);
  const [showNotulensiModal, setShowNotulensiModal] = useState(false);
  const focusInfo = FOCUS_LIST.find((f) => f.id === task.focusId);
  const notulensiQuestions = FOCUS_NOTULENSI_QUESTIONS[task.focusId || 'focus-1'] || FOCUS_NOTULENSI_QUESTIONS['focus-1'];
  const filledPointsCount = (task.notulensiPoin || []).filter((p) => p.trim()).length;
  const hasNotulensi = filledPointsCount > 0;

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
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200"
                  title="Susunan petugas ini tersimpan permanen di database"
                >
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Tetap
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">
                {task.namaDpl}
              </h3>
            </div>
          </div>

          {/* Focus Pillar Info */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs space-y-1">
            <div className="flex items-center gap-1.5 font-bold text-slate-900 leading-snug">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: focusInfo?.color.accent || '#991b1b' }} />
              <span className="line-clamp-2">
                {focusInfo ? `Fokus ${focusInfo.number}: ${focusInfo.title}` : (task.focusKonsultasi || 'Fokus Konsultasi')}
              </span>
            </div>
            {focusInfo?.theme && (
              <div className="text-[11px] text-slate-500 font-medium pl-4">
                {focusInfo.theme}
              </div>
            )}
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
            {(task.lokasiPelaksanaan || task.tempat) ? (
              <div className="flex items-center gap-1.5 text-slate-700 font-medium">
                <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                <span className="truncate">{task.lokasiPelaksanaan || task.tempat}</span>
              </div>
            ) : task.tanggalKonsultasi ? (
              <button
                type="button"
                onClick={() => onEdit(task)}
                className="flex items-center gap-1.5 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/70 px-2 py-1 rounded-md text-[11px] font-semibold border border-dashed border-amber-300 w-full transition text-left cursor-pointer"
                title="Jadwal sudah ada. Klik untuk mengisi tempat pelaksanaan"
              >
                <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                <span>Tempat belum diisi (Klik untuk isi tempat)</span>
              </button>
            ) : null}

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

            {/* Catatan Tambahan Ringkas */}
            {task.catatan && (
              <div className="mt-1 pt-1 border-t border-slate-200/60 text-slate-600 text-[11px] italic line-clamp-2">
                "{task.catatan}"
              </div>
            )}

            {/* Hasil Buah Percakapan */}
            {hasNotulensi ? (
              <div className="mt-1 pt-1.5 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => setShowNotulensiModal(!showNotulensiModal)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-blue-50/80 hover:bg-blue-100/80 text-blue-900 border border-blue-200 transition text-[11px] cursor-pointer"
                >
                  <div className="flex items-center gap-1.5 font-bold">
                    <FileText className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    <span>Buah Percakapan ({filledPointsCount}/{task.focusId === 'focus-1' ? 10 : 5} Poin)</span>
                  </div>
                  <span className="text-[10px] text-blue-700 font-bold underline">
                    {showNotulensiModal ? 'Tutup Buah Percakapan' : 'Lihat Buah Percakapan'}
                  </span>
                </button>

                {showNotulensiModal && (
                  <div className="mt-2 p-2.5 bg-white rounded-xl border border-blue-200 text-xs space-y-2.5 animate-in fade-in duration-150 shadow-2xs">
                    <div className="flex items-center justify-between pb-1.5 border-b border-blue-100">
                      <span className="text-[11px] font-extrabold text-blue-950">
                        Hasil Buah Percakapan {task.namaDpl}:
                      </span>
                      <button
                        type="button"
                        onClick={() => onEdit(task)}
                        className="text-[10px] text-blue-700 font-bold hover:underline"
                      >
                        Edit Buah Percakapan
                      </button>
                    </div>

                    <div className="space-y-2">
                      {task.focusId === 'focus-1' ? (
                        notulensiQuestions.map((q, qIdx) => {
                          const startSlot = qIdx * 5;
                          const points = [0, 1, 2, 3, 4].map((p) => ({
                            num: p + 1,
                            title: FOCUS_1_POINT_TITLES[p] || `Poin ${p + 1}`,
                            val: task.notulensiPoin?.[startSlot + p] || '',
                          }));
                          const hasAny = points.some((p) => p.val.trim());

                          return (
                            <div key={qIdx} className="space-y-1.5 p-2 rounded-lg bg-blue-50/40 border border-blue-100 text-[11px]">
                              <div className="font-bold text-slate-800 leading-snug">
                                <span className="text-blue-700 mr-1">[Pertanyaan {qIdx + 1}]</span>
                                <span>{q}</span>
                              </div>
                              {hasAny ? (
                                <div className="space-y-1.5 pl-1">
                                  {points.map((pt) => {
                                    if (!pt.val.trim()) return null;
                                    return (
                                      <div key={pt.num} className="p-1.5 rounded-lg bg-white/80 border border-blue-100/70 space-y-1">
                                        <div className="font-bold text-blue-900 text-[11px] flex items-center gap-1.5">
                                          <span className="w-3.5 h-3.5 rounded-full bg-blue-100 text-blue-900 font-bold text-[9px] flex items-center justify-center shrink-0">
                                            {pt.num}
                                          </span>
                                          <span>Poin {pt.num}: {pt.title}</span>
                                        </div>
                                        <div className="text-right pl-3 pt-0.5">
                                          <div className="inline-block text-right text-[11px] text-slate-800 font-medium italic bg-blue-50/50 px-2 py-1 rounded-md border border-blue-100/60 max-w-full whitespace-pre-wrap leading-relaxed shadow-2xs">
                                            "{pt.val}"
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-slate-400 italic text-[10px] pl-1">
                                  (Belum ada buah percakapan untuk pertanyaan ini)
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        notulensiQuestions.map((q, idx) => {
                          const ans = task.notulensiPoin?.[idx];
                          const isAnsFilled = Boolean(ans && ans.trim());
                          return (
                            <div key={idx} className="space-y-1 text-[11px]">
                              <div className="font-bold text-slate-800 flex items-start gap-1 leading-snug">
                                <span
                                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[9px] font-black shrink-0 mt-0.5 ${
                                    isAnsFilled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                                <span>{q}</span>
                              </div>
                              {isAnsFilled ? (
                                <div className="pl-5 text-slate-700 font-medium whitespace-pre-wrap bg-slate-50 p-1.5 rounded-lg border border-slate-100 text-[11px]">
                                  {ans}
                                </div>
                              ) : (
                                <div className="pl-5 text-slate-400 italic text-[10px]">
                                  (Belum ada buah percakapan untuk poin ini)
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : isTerlaksana ? (
              <div className="mt-1 pt-1.5 border-t border-slate-200/60">
                <button
                  type="button"
                  onClick={() => onEdit(task)}
                  className="w-full flex items-center justify-center gap-1.5 p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-dashed border-amber-300 transition text-[11px] font-bold cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>Konsultasi Selesai • Isi Buah Percakapan ({task.focusId === 'focus-1' ? '2 Pertanyaan' : '5 Poin'})</span>
                </button>
              </div>
            ) : null}

            {/* Foto Dokumentasi Thumbnail if available (Maks 2 Foto) */}
            {(task.fotoDokumentasi || task.fotoDokumentasi2) && (
              <div className="pt-1.5 border-t border-slate-200/60">
                <div className="flex items-center gap-2">
                  {task.fotoDokumentasi && (
                    <div
                      onClick={() => {
                        setSelectedPhotoSlot(1);
                        setShowPhotoModal(true);
                      }}
                      className="flex-1 flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-emerald-400 transition"
                      title="Klik untuk melihat Foto 1"
                    >
                      <img
                        src={task.fotoDokumentasi}
                        alt="Foto Dokumentasi 1"
                        className="w-9 h-9 object-cover rounded-md border border-slate-100 shrink-0"
                      />
                      <div className="text-[11px] min-w-0">
                        <span className="font-bold text-slate-800 block truncate">📷 Foto 1 (Utama)</span>
                        <span className="text-emerald-700 font-semibold text-[10px]">Perbesar</span>
                      </div>
                    </div>
                  )}

                  {task.fotoDokumentasi2 && (
                    <div
                      onClick={() => {
                        setSelectedPhotoSlot(2);
                        setShowPhotoModal(true);
                      }}
                      className="flex-1 flex items-center gap-2 p-1.5 bg-white rounded-lg border border-slate-200 cursor-pointer hover:border-blue-400 transition"
                      title="Klik untuk melihat Foto 2"
                    >
                      <img
                        src={task.fotoDokumentasi2}
                        alt="Foto Dokumentasi 2"
                        className="w-9 h-9 object-cover rounded-md border border-slate-100 shrink-0"
                      />
                      <div className="text-[11px] min-w-0">
                        <span className="font-bold text-slate-800 block truncate">📷 Foto 2 (Opsional)</span>
                        <span className="text-blue-700 font-semibold text-[10px]">Perbesar</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Dokumen Notulen Dinamika Pertemuan if available */}
            {task.fileNotulenDinamika && (
              <div className="pt-1.5 border-t border-slate-200/60">
                <a
                  href={task.fileNotulenDinamika}
                  target="_blank"
                  rel="noopener noreferrer"
                  download={task.fileNotulenDinamikaNama || `Notulen_Dinamika_${task.namaDpl.replace(/\s+/g, '_')}`}
                  className="flex items-center justify-between p-2 bg-blue-50/70 hover:bg-blue-100/70 rounded-xl border border-blue-200 transition text-[11px] group"
                  title="Klik untuk membuka atau mengunduh Notulen Dinamika Pertemuan"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                      {task.fileNotulenDinamikaTipe?.includes('pdf') || task.fileNotulenDinamikaNama?.toLowerCase().endsWith('.pdf') ? (
                        <FileText className="w-4 h-4 text-white" />
                      ) : (
                        <ImageIcon className="w-4 h-4 text-white" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-blue-950 block truncate text-[11px]">
                        {task.fileNotulenDinamikaNama || 'Notulen Dinamika Pertemuan'}
                      </span>
                      <span className="text-[10px] text-blue-700 font-medium">
                        {task.fileNotulenDinamikaTipe?.includes('pdf') || task.fileNotulenDinamikaNama?.toLowerCase().endsWith('.pdf') ? 'Dokumen PDF' : 'Berkas Gambar/Scan'}
                      </span>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-blue-800 bg-white px-2 py-0.5 rounded-md border border-blue-200 group-hover:bg-blue-600 group-hover:text-white transition shrink-0 ml-1.5">
                    Buka Berkas
                  </span>
                </a>
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
      {showPhotoModal && (task.fotoDokumentasi || task.fotoDokumentasi2) && (
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
                className="p-1 text-slate-400 hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Toggle between Foto 1 and Foto 2 if both exist */}
            {task.fotoDokumentasi && task.fotoDokumentasi2 && (
              <div className="bg-slate-800 p-1.5 flex items-center justify-center gap-2 border-b border-slate-700">
                <button
                  type="button"
                  onClick={() => setSelectedPhotoSlot(1)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedPhotoSlot === 1
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Foto 1 (Utama)
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedPhotoSlot(2)}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition cursor-pointer ${
                    selectedPhotoSlot === 2
                      ? 'bg-blue-600 text-white shadow-2xs'
                      : 'bg-slate-700 text-slate-300 hover:text-white'
                  }`}
                >
                  Foto 2 (Tambahan)
                </button>
              </div>
            )}

            <div className="p-2 bg-black flex items-center justify-center min-h-[200px]">
              <img
                src={selectedPhotoSlot === 1 ? (task.fotoDokumentasi || task.fotoDokumentasi2) : (task.fotoDokumentasi2 || task.fotoDokumentasi)}
                alt="Foto Dokumentasi Penuh"
                className="max-h-[75vh] w-auto object-contain rounded-lg"
              />
            </div>
            <div className="p-3 bg-white text-xs flex items-center justify-between">
              <span className="text-slate-600 font-medium truncate max-w-[280px]">
                {task.lokasiPelaksanaan ? `Lokasi: ${task.lokasiPelaksanaan}` : task.namaDpl}
                {task.fotoDokumentasi && task.fotoDokumentasi2 && ` • Foto ${selectedPhotoSlot} dari 2`}
              </span>
              <button
                onClick={() => setShowPhotoModal(false)}
                className="px-3 py-1 rounded-lg bg-slate-200 text-slate-800 font-bold hover:bg-slate-300 transition cursor-pointer"
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
