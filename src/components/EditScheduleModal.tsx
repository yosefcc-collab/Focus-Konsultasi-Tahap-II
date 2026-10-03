import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  FileText,
  CheckCircle2,
  UserCheck,
  ArrowLeftRight,
  Camera,
  Image as ImageIcon,
  Users,
  CheckSquare,
  Square,
  Lock,
  Trash2,
  Upload,
  AlertCircle,
  AlertTriangle,
} from 'lucide-react';
import { TaskAssignment, ScheduleStatus, TeamMember } from '../types';
import { getIndonesianDayName, INDONESIAN_DAYS } from '../data/initialData';
import { compressImage } from '../utils/imageCompressor';

interface EditScheduleModalProps {
  task: TaskAssignment | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedTask: TaskAssignment) => void;
  members: TeamMember[];
}

export const EditScheduleModal: React.FC<EditScheduleModalProps> = ({
  task,
  isOpen,
  onClose,
  onSave,
  members,
}) => {
  // Modal active step: 'koordinasi' | 'pelaksanaan'
  const [activeStep, setActiveStep] = useState<'koordinasi' | 'pelaksanaan'>('koordinasi');

  // Officers state
  const [fasilitator, setFasilitator] = useState('');
  const [notulen, setNotulen] = useState('');
  const [customFasilitator, setCustomFasilitator] = useState(false);
  const [customNotulen, setCustomNotulen] = useState(false);

  // Tahap 1: Koordinasi Jadwal
  const [tanggal, setTanggal] = useState('');
  const [hari, setHari] = useState('');
  const [jam, setJam] = useState('');
  const [kontakPic, setKontakPic] = useState('');
  const [status, setStatus] = useState<ScheduleStatus>('belum_ditentukan');

  // Tahap 2: Pelaksanaan
  const [terlaksana, setTerlaksana] = useState(false);
  const [lokasiPelaksanaan, setLokasiPelaksanaan] = useState('');
  const [jumlahPeserta, setJumlahPeserta] = useState<string | number>('');
  const [fotoDokumentasi, setFotoDokumentasi] = useState<string>('');
  const [catatan, setCatatan] = useState('');

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (task) {
      setFasilitator(task.fasilitator || '');
      setNotulen(task.notulen || '');
      const fasInList = members.some((m) => m.name.toLowerCase() === (task.fasilitator || '').toLowerCase());
      setCustomFasilitator(!fasInList && !!task.fasilitator);

      const notInList = members.some((m) => m.name.toLowerCase() === (task.notulen || '').toLowerCase());
      setCustomNotulen(!notInList && !!task.notulen);

      setTanggal(task.tanggalKonsultasi || '');
      setHari(task.hari || '');
      setJam(task.jam || '');
      setKontakPic(task.kontakPic || '');
      setStatus(task.status || 'belum_ditentukan');

      setTerlaksana(task.terlaksana ?? (task.status === 'selesai'));
      setLokasiPelaksanaan(task.lokasiPelaksanaan || task.tempat || '');
      setJumlahPeserta(task.jumlahPeserta ?? '');
      setFotoDokumentasi(task.fotoDokumentasi || '');
      setCatatan(task.catatan || '');

      // If already has date & time and user already has implementation data, default to step based on progress
      if (task.terlaksana || task.lokasiPelaksanaan || task.fotoDokumentasi) {
        setActiveStep('pelaksanaan');
      } else {
        setActiveStep('koordinasi');
      }
    }
  }, [task, members]);

  if (!isOpen || !task) return null;

  // Validation: Tab Pelaksanaan is only unlocked if Tanggal and Jam have been entered!
  const isJadwalDetermined = Boolean(tanggal.trim() && jam.trim());

  const handleSwapRoles = () => {
    const tempFas = fasilitator;
    const tempNot = notulen;
    setFasilitator(tempNot);
    setNotulen(tempFas);
  };

  const handleDateChange = (newDate: string) => {
    setTanggal(newDate);
    if (newDate) {
      const detectedDay = getIndonesianDayName(newDate);
      if (detectedDay) {
        setHari(detectedDay);
      }
      if (status === 'belum_ditentukan') {
        setStatus('terjadwal');
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressedDataUrl = await compressImage(file, 900, 900, 0.75);
      setFotoDokumentasi(compressedDataUrl);
    } catch (err) {
      console.error('Error compressing image', err);
      alert('Gagal memproses foto. Silakan coba kembali.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = () => {
    setFotoDokumentasi('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowPermanentConfirm(true);
  };

  const handleConfirmPermanentSave = () => {
    // Determine final status
    let finalStatus: ScheduleStatus = status;
    if (terlaksana) {
      finalStatus = 'selesai';
    } else if (tanggal.trim() && jam.trim()) {
      finalStatus = 'terjadwal';
    } else if (tanggal.trim() || kontakPic.trim()) {
      finalStatus = 'proses_koordinasi';
    } else {
      finalStatus = 'belum_ditentukan';
    }

    onSave({
      ...task,
      fasilitator: fasilitator.trim() || task.fasilitator,
      notulen: notulen.trim() || task.notulen,
      tanggalKonsultasi: tanggal,
      hari: hari,
      jam: jam,
      kontakPic: kontakPic,
      status: finalStatus,
      // Tahap 2: Pelaksanaan
      terlaksana: terlaksana,
      tempat: lokasiPelaksanaan,
      lokasiPelaksanaan: lokasiPelaksanaan,
      jumlahPeserta: jumlahPeserta !== '' ? Number(jumlahPeserta) : '',
      fotoDokumentasi: fotoDokumentasi,
      catatan: catatan,
      locked: true,
      lockedAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    setShowPermanentConfirm(false);
    onClose();
  };

  const timePresets = ['18:30 WIB', '19:00 WIB', '19:30 WIB', '20:00 WIB', '09:00 WIB', '10:00 WIB', '16:00 WIB'];
  const isSamePerson = fasilitator.trim() && notulen.trim() && fasilitator.trim().toLowerCase() === notulen.trim().toLowerCase();
  const hasSchedule = Boolean(tanggal.trim() || task?.tanggalKonsultasi?.trim());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Modal Top Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {task.category}
              </span>
              <span className="text-xs text-slate-500 font-medium">Pengaturan &amp; Pelaksanaan</span>
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900">{task.namaDpl}</h2>
            <p className="text-xs text-slate-600 line-clamp-1">{task.focusKonsultasi}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Structured Step Selector Tabs */}
        <div className="p-2.5 bg-slate-100/80 border-b border-slate-200/80 grid grid-cols-2 gap-2 text-xs">
          {/* Step 1: Koordinasi */}
          <button
            type="button"
            onClick={() => setActiveStep('koordinasi')}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              activeStep === 'koordinasi'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white text-slate-700 hover:bg-slate-50 border border-slate-200'
            }`}
          >
            <Calendar className="w-4 h-4 text-amber-400" />
            <div className="text-left leading-tight">
              <div className="text-[10px] text-slate-400 font-medium">Tahap 1</div>
              <div>Koordinasi Jadwal</div>
            </div>
          </button>

          {/* Step 2: Pelaksanaan */}
          <button
            type="button"
            onClick={() => {
              if (isJadwalDetermined) {
                setActiveStep('pelaksanaan');
              }
            }}
            disabled={!isJadwalDetermined}
            className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 transition ${
              !isJadwalDetermined
                ? 'bg-slate-200/60 text-slate-400 cursor-not-allowed border border-slate-200'
                : activeStep === 'pelaksanaan'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-emerald-800 hover:bg-emerald-50 border border-emerald-300'
            }`}
          >
            {isJadwalDetermined ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <Lock className="w-4 h-4 text-slate-400" />
            )}
            <div className="text-left leading-tight">
              <div className="text-[10px] opacity-75 font-medium">Tahap 2</div>
              <div>Pelaksanaan &amp; Bukti</div>
            </div>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-sm flex-1">
          {/* ================= TAHAP 1: KOORDINASI JADWAL ================= */}
          {activeStep === 'koordinasi' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Petugas Pendamping Section */}
              <div className="p-3 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <span>Petugas Pendamping</span>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwapRoles}
                    className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 bg-white hover:bg-blue-100 text-blue-800 rounded-md border border-blue-300 transition shadow-2xs"
                  >
                    <ArrowLeftRight className="w-3 h-3 text-blue-600" />
                    <span>Tukar Posisi</span>
                  </button>
                </div>

                {/* Fasilitator Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-blue-600 inline-block" />
                      <span>1. Fasilitator (Pemimpin Diskusi)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomFasilitator(!customFasilitator)}
                      className="text-[10px] text-blue-700 hover:underline font-semibold"
                    >
                      {customFasilitator ? 'Pilih dari Daftar' : '+ Ketik Nama Lain'}
                    </button>
                  </div>
                  {customFasilitator ? (
                    <input
                      type="text"
                      placeholder="Ketik nama petugas fasilitator..."
                      value={fasilitator}
                      onChange={(e) => setFasilitator(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-600 outline-hidden bg-white font-medium"
                    />
                  ) : (
                    <select
                      value={fasilitator}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomFasilitator(true);
                          setFasilitator('');
                        } else {
                          setFasilitator(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-blue-300 focus:ring-2 focus:ring-blue-600 outline-hidden bg-white font-medium"
                    >
                      <option value="">-- Pilih Fasilitator --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.origin})
                        </option>
                      ))}
                      <option value="__custom__">+ Ketik Nama Pengganti Lainnya...</option>
                    </select>
                  )}
                </div>

                {/* Notulen Selector */}
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
                      <span>2. Notulen (Pencatat Hasil)</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setCustomNotulen(!customNotulen)}
                      className="text-[10px] text-emerald-700 hover:underline font-semibold"
                    >
                      {customNotulen ? 'Pilih dari Daftar' : '+ Ketik Nama Lain'}
                    </button>
                  </div>
                  {customNotulen ? (
                    <input
                      type="text"
                      placeholder="Ketik nama petugas notulen..."
                      value={notulen}
                      onChange={(e) => setNotulen(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white font-medium"
                    />
                  ) : (
                    <select
                      value={notulen}
                      onChange={(e) => {
                        if (e.target.value === '__custom__') {
                          setCustomNotulen(true);
                          setNotulen('');
                        } else {
                          setNotulen(e.target.value);
                        }
                      }}
                      className="w-full px-3 py-1.5 text-xs rounded-lg border border-emerald-300 focus:ring-2 focus:ring-emerald-600 outline-hidden bg-white font-medium"
                    >
                      <option value="">-- Pilih Notulen --</option>
                      {members.map((m) => (
                        <option key={m.id} value={m.name}>
                          {m.name} ({m.origin})
                        </option>
                      ))}
                      <option value="__custom__">+ Ketik Nama Pengganti Lainnya...</option>
                    </select>
                  )}
                </div>

                {isSamePerson && (
                  <div className="flex items-center gap-1.5 text-[11px] text-amber-800 bg-amber-100/90 p-2 rounded-lg border border-amber-300">
                    <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-700" />
                    <span>Perhatian: Fasilitator &amp; Notulen diisi nama yang sama.</span>
                  </div>
                )}
              </div>

              {/* Tanggal & Jam Penentuan */}
              <div className="p-3.5 bg-amber-50/50 border border-amber-200 rounded-xl space-y-3">
                <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                  <Calendar className="w-4 h-4 text-amber-600" />
                  <span>Penetapan Jadwal (Tanggal &amp; Jam)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Tanggal Konsultasi:
                    </label>
                    <input
                      type="date"
                      value={tanggal}
                      onChange={(e) => handleDateChange(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden bg-white font-semibold"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Hari:
                    </label>
                    <select
                      value={hari}
                      onChange={(e) => setHari(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden bg-white font-semibold"
                    >
                      <option value="">-- Pilih Hari --</option>
                      {INDONESIAN_DAYS.map((d) => (
                        <option key={d} value={d}>
                          {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Jam Input & Presets */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-slate-500" />
                    <span>Jam Pelaksanaan:</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 19:30 WIB atau 16:00 WIB"
                    value={jam}
                    onChange={(e) => setJam(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden bg-white font-semibold mb-2"
                  />
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[10px] text-slate-500 self-center mr-1">Pilihan Cepat:</span>
                    {timePresets.map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setJam(t)}
                        className={`text-[10px] px-2 py-0.5 rounded border transition ${
                          jam === t
                            ? 'bg-slate-800 text-white border-slate-800 font-bold'
                            : 'bg-white text-slate-600 hover:bg-slate-100 border-slate-200'
                        }`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tempat Diadakannya Focus Konsultasi */}
                <div className="pt-1">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-rose-600" />
                      <span>Tempat Diadakannya Focus Konsultasi:</span>
                    </label>
                    {hasSchedule && !lokasiPelaksanaan.trim() && (
                      <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                        Belum diisi
                      </span>
                    )}
                  </div>
                  <input
                    type="text"
                    disabled={!hasSchedule}
                    placeholder={
                      hasSchedule
                        ? "Masukkan tempat pelaksanaan konsultasi..."
                        : "Tentukan tanggal konsultasi di atas terlebih dahulu"
                    }
                    value={lokasiPelaksanaan}
                    onChange={(e) => setLokasiPelaksanaan(e.target.value)}
                    className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden font-medium transition ${
                      hasSchedule
                        ? 'border-slate-300 focus:ring-2 focus:ring-red-600 bg-white text-slate-800'
                        : 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                  />
                  {!hasSchedule ? (
                    <p className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                      <AlertCircle className="w-3 h-3 text-slate-400 shrink-0" />
                      <span>Pengisian tempat dapat dilakukan jika jadwal sudah ada/ditentukan.</span>
                    </p>
                  ) : !lokasiPelaksanaan.trim() ? (
                    <p className="text-[11px] text-blue-700 flex items-center gap-1 mt-1 font-medium">
                      <MapPin className="w-3 h-3 text-blue-600 shrink-0" />
                      <span>Jadwal sudah ada. Silakan isi data tempat pelaksanaan sesuai kondisi.</span>
                    </p>
                  ) : null}
                </div>

                {/* Kontak PIC Koordinasi */}
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                    <Phone className="w-3.5 h-3.5 text-slate-500" />
                    <span>Kontak PIC DPL / Kategorial (Opsional):</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Nama & No WhatsApp Pengurus (contoh: Bpk. Anton 0812...)"
                    value={kontakPic}
                    onChange={(e) => setKontakPic(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden bg-white"
                  />
                </div>
              </div>

              {/* Next Step Callout / Unlocking Banner */}
              {isJadwalDetermined ? (
                <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-emerald-950">Jadwal Tanggal &amp; Jam Terisi!</div>
                      <div className="text-[11px] text-emerald-800">
                        Tab Pelaksanaan sekarang terbuka untuk diisi data pelaksanaan &amp; foto.
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setActiveStep('pelaksanaan')}
                    className="px-3 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold shrink-0 transition"
                  >
                    Buka Pelaksanaan &rarr;
                  </button>
                </div>
              ) : (
                <div className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-500">
                  <Lock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Tab <strong>Pelaksanaan</strong> (Terlaksana, Lokasi, Jumlah Peserta, &amp; Foto) akan aktif setelah Tanggal dan Jam diisi.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* ================= TAHAP 2: PELAKSANAAN (LOKASI, PESERTA, FOTO, DLL) ================= */}
          {activeStep === 'pelaksanaan' && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Summary Pill */}
              <div className="p-2.5 rounded-xl bg-slate-100 flex items-center justify-between text-xs text-slate-700">
                <div>
                  <span className="text-slate-500">Jadwal: </span>
                  <strong>{hari ? `${hari}, ` : ''}{tanggal}</strong> pukul <strong>{jam}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveStep('koordinasi')}
                  className="text-xs text-blue-700 font-bold hover:underline"
                >
                  Ubah Jadwal
                </button>
              </div>

              {/* Status Terlaksana Checkbox / Toggle */}
              <div
                onClick={() => setTerlaksana(!terlaksana)}
                className={`p-3.5 rounded-xl border-2 cursor-pointer transition flex items-center justify-between ${
                  terlaksana
                    ? 'bg-emerald-50 border-emerald-500 text-emerald-950'
                    : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {terlaksana ? (
                    <CheckSquare className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Square className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <div className="text-xs font-bold">
                      {terlaksana ? 'STATUS: KONSULTASI TELAH TERLAKSANA' : 'Tandai Sebagai "Terlaksana"'}
                    </div>
                    <div className="text-[11px] opacity-75">
                      {terlaksana
                        ? 'Kegiatan konsultasi sinodal telah selesai dilaksanakan di lapangan'
                        : 'Klik di sini jika kegiatan konsultasi telah selesai'}
                    </div>
                  </div>
                </div>
                <span
                  className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase ${
                    terlaksana ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {terlaksana ? 'Terlaksana' : 'Belum'}
                </span>
              </div>

              {/* Lokasi Pelaksanaan */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-500" />
                  <span>Lokasi Pelaksanaan:</span>
                </label>
                <input
                  type="text"
                  placeholder="Tempat / lokasi pelaksanaan konsultasi"
                  value={lokasiPelaksanaan}
                  onChange={(e) => setLokasiPelaksanaan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden bg-white font-medium"
                />
              </div>

              {/* Jumlah Peserta */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-blue-600" />
                  <span>Jumlah Peserta Hadir (Jiwa/Orang):</span>
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    min="0"
                    placeholder="Contoh: 28"
                    value={jumlahPeserta}
                    onChange={(e) => setJumlahPeserta(e.target.value)}
                    className="w-32 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden bg-white font-bold text-slate-900"
                  />
                  <span className="text-xs text-slate-500">Orang / Umat hadir</span>
                </div>
              </div>

              {/* Foto Dokumentasi Pelaksanaan */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Foto Dokumentasi Konsultasi:</span>
                  </label>
                  {fotoDokumentasi && (
                    <button
                      type="button"
                      onClick={handleRemovePhoto}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Foto</span>
                    </button>
                  )}
                </div>

                {/* Upload or Preview Box */}
                {fotoDokumentasi ? (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-black/5 group">
                    <img
                      src={fotoDokumentasi}
                      alt="Foto Dokumentasi Konsultasi"
                      className="w-full max-h-56 object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="px-3 py-1.5 rounded-lg bg-white/90 text-slate-900 font-bold text-xs shadow-md"
                      >
                        Ganti Foto
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-emerald-500 rounded-xl p-4 text-center cursor-pointer bg-white transition hover:bg-emerald-50/30 space-y-1.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                      {isUploadingPhoto ? (
                        <div className="w-5 h-5 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Camera className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {isUploadingPhoto ? 'Sedang memproses foto...' : 'Ambil Foto atau Pilih dari Galeri'}
                    </div>
                    <p className="text-[10px] text-slate-400">
                      Foto akan otomatis dioptimasi dan disimpan ke data terpadu tim.
                    </p>
                  </div>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Catatan / Rangkuman Notulensi */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  <span>Catatan / Poin Penting Notulensi:</span>
                </label>
                <textarea
                  rows={3}
                  placeholder="Catatan hasil diskusi, harapan umat, tantangan, atau usulan konkret..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden bg-white"
                />
              </div>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3.5 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition"
            >
              Batal
            </button>

            <button
              type="submit"
              className="px-4 py-2 text-xs font-bold rounded-lg bg-red-800 hover:bg-red-900 text-white shadow-xs inline-flex items-center gap-1.5 transition active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4 text-amber-300" />
              <span>Simpan Jadwal &amp; Petugas</span>
            </button>
          </div>
        </form>

        {/* Modal Konfirmasi Menjadi Data Tetap & Permanen */}
        {showPermanentConfirm && (
          <div className="absolute inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl p-5 max-w-md w-full shadow-2xl border border-slate-200 text-center animate-in zoom-in-95 duration-150 space-y-4">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-amber-400 text-slate-950 flex items-center justify-center shadow-md">
                <CheckCircle2 className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Tetapkan Perubahan Ini Sebagai Data Permanen?
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                  Perubahan susunan petugas dan jadwal untuk <strong>{task.namaDpl}</strong> ini akan langsung ditetapkan menjadi <strong>data tetap dan tersimpan dalam database yang permanen</strong> sampai dengan ada perubahan berikutnya.
                </p>
              </div>

              {/* Data Summary Pill */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-left text-xs space-y-2">
                <div className="flex justify-between items-center pb-1.5 border-b border-slate-200">
                  <span className="text-slate-500 font-semibold">Sasaran:</span>
                  <strong className="text-slate-900">{task.namaDpl}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Fasilitator:</span>
                  <strong className="text-slate-900">{fasilitator || '-'}</strong>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-medium">Notulen:</span>
                  <strong className="text-slate-900">{notulen || '-'}</strong>
                </div>
                {(tanggal || jam) && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Jadwal:</span>
                    <strong className="text-slate-900">{hari ? `${hari}, ` : ''}{tanggal} {jam}</strong>
                  </div>
                )}
                {lokasiPelaksanaan && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Tempat:</span>
                    <strong className="text-slate-900 truncate max-w-[200px]">{lokasiPelaksanaan}</strong>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="grid grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => setShowPermanentConfirm(false)}
                  className="py-2.5 px-4 rounded-xl border border-slate-300 hover:bg-slate-100 text-slate-700 font-bold text-xs transition"
                >
                  Batal / Edit Lagi
                </button>
                <button
                  type="button"
                  onClick={handleConfirmPermanentSave}
                  className="py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs shadow-md transition active:scale-95 flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>Iya, Simpan Permanen</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
