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
  ExternalLink,
} from 'lucide-react';
import { TaskAssignment, ScheduleStatus, TeamMember, FocusType } from '../types';
import { getIndonesianDayName, INDONESIAN_DAYS, FOCUS_NOTULENSI_QUESTIONS, FOCUS_LIST } from '../data/initialData';
import { compressImage } from '../utils/imageCompressor';

const formatFileSize = (bytes?: number) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

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
  const [fotoNama, setFotoNama] = useState<string>('');
  const [fotoDokumentasi2, setFotoDokumentasi2] = useState<string>('');
  const [fotoNama2, setFotoNama2] = useState<string>('');
  const [activePhotoSlot, setActivePhotoSlot] = useState<1 | 2>(1);
  const [catatan, setCatatan] = useState('');
  const [notulensiAnswers, setNotulensiAnswers] = useState<string[]>(['', '', '', '', '']);

  // Dokumen Notulen Dinamika Pertemuan (PDF atau Gambar JPEG/PNG)
  const [fileNotulenDinamika, setFileNotulenDinamika] = useState<string>('');
  const [fileNotulenDinamikaNama, setFileNotulenDinamikaNama] = useState<string>('');
  const [fileNotulenDinamikaTipe, setFileNotulenDinamikaTipe] = useState<string>('');
  const [fileNotulenDinamikaSize, setFileNotulenDinamikaSize] = useState<number>(0);
  const [isUploadingDoc, setIsUploadingDoc] = useState(false);
  const docFileInputRef = useRef<HTMLInputElement>(null);

  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [showPermanentConfirm, setShowPermanentConfirm] = useState(false);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
      setFotoNama(task.fotoNama || '');
      setFotoDokumentasi2(task.fotoDokumentasi2 || '');
      setFotoNama2(task.fotoNama2 || '');
      setCatatan(task.catatan || '');

      // Dokumen Notulen Dinamika
      setFileNotulenDinamika(task.fileNotulenDinamika || '');
      setFileNotulenDinamikaNama(task.fileNotulenDinamikaNama || '');
      setFileNotulenDinamikaTipe(task.fileNotulenDinamikaTipe || '');
      setFileNotulenDinamikaSize(task.fileNotulenDinamikaSize || 0);

      if (task.notulensiPoin && Array.isArray(task.notulensiPoin)) {
        const arr = [...task.notulensiPoin];
        while (arr.length < 5) arr.push('');
        setNotulensiAnswers(arr.slice(0, 5));
      } else {
        setNotulensiAnswers(['', '', '', '', '']);
      }

      // If already has date & time and user already has implementation data, default to step based on progress
      const hasImplementationData =
        task.terlaksana ||
        task.lokasiPelaksanaan ||
        task.fotoDokumentasi ||
        task.fotoDokumentasi2 ||
        task.fileNotulenDinamika ||
        (task.notulensiPoin && task.notulensiPoin.some((p) => p.trim()));

      if (hasImplementationData) {
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

  const handleTriggerUpload = (slot: 1 | 2, source: 'camera' | 'gallery') => {
    setActivePhotoSlot(slot);
    if (source === 'camera') {
      if (cameraInputRef.current) {
        cameraInputRef.current.value = '';
        cameraInputRef.current.click();
      }
    } else {
      if (galleryInputRef.current) {
        galleryInputRef.current.value = '';
        galleryInputRef.current.click();
      }
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingPhoto(true);
      const compressedDataUrl = await compressImage(file, 1000, 1000, 0.78);
      if (activePhotoSlot === 1) {
        setFotoDokumentasi(compressedDataUrl);
        setFotoNama(file.name);
      } else {
        setFotoDokumentasi2(compressedDataUrl);
        setFotoNama2(file.name);
      }
    } catch (err) {
      console.error('Error compressing image', err);
      alert('Gagal memproses foto. Silakan coba kembali.');
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handleRemovePhoto = (slot: 1 | 2) => {
    if (slot === 1) {
      setFotoDokumentasi('');
      setFotoNama('');
    } else {
      setFotoDokumentasi2('');
      setFotoNama2('');
    }
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 7 * 1024 * 1024) {
      alert('Ukuran file terlalu besar (maksimal 7 MB). Silakan gunakan file yang lebih kecil atau kompres terlebih dahulu.');
      return;
    }

    try {
      setIsUploadingDoc(true);
      if (file.type.startsWith('image/')) {
        const compressedDataUrl = await compressImage(file, 1600, 1600, 0.85);
        setFileNotulenDinamika(compressedDataUrl);
      } else {
        const reader = new FileReader();
        const dataUrl = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (error) => reject(error);
          reader.readAsDataURL(file);
        });
        setFileNotulenDinamika(dataUrl);
      }
      setFileNotulenDinamikaNama(file.name);
      setFileNotulenDinamikaTipe(file.type || (file.name.toLowerCase().endsWith('.pdf') ? 'application/pdf' : 'image/jpeg'));
      setFileNotulenDinamikaSize(file.size);
    } catch (err) {
      console.error('Error uploading notulen dinamika', err);
      alert('Gagal memproses file notulen. Silakan coba kembali.');
    } finally {
      setIsUploadingDoc(false);
    }
  };

  const handleRemoveDoc = () => {
    setFileNotulenDinamika('');
    setFileNotulenDinamikaNama('');
    setFileNotulenDinamikaTipe('');
    setFileNotulenDinamikaSize(0);
    if (docFileInputRef.current) {
      docFileInputRef.current.value = '';
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
      fotoNama: fotoNama,
      fotoDokumentasi2: fotoDokumentasi2,
      fotoNama2: fotoNama2,
      catatan: catatan,
      notulensiPoin: notulensiAnswers,
      fileNotulenDinamika: fileNotulenDinamika,
      fileNotulenDinamikaNama: fileNotulenDinamikaNama,
      fileNotulenDinamikaTipe: fileNotulenDinamikaTipe,
      fileNotulenDinamikaSize: fileNotulenDinamikaSize,
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
  const currentFocusId = (task?.focusId || 'focus-1') as FocusType;
  const notulensiQuestions = FOCUS_NOTULENSI_QUESTIONS[currentFocusId] || FOCUS_NOTULENSI_QUESTIONS['focus-1'];
  const focusInfo = FOCUS_LIST.find((f) => f.id === currentFocusId);

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
              <div>Pelaksanaa dan Dokumentasi</div>
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

              {/* Foto Dokumentasi Pelaksanaan (Maks 2 Foto: Pilihan Kamera atau Galeri) */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                  <div>
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Camera className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Foto Dokumentasi Konsultasi (Maksimal 2 Foto):</span>
                    </label>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      Pilih langsung dari <strong>Kamera</strong> atau <strong>Galeri Foto</strong> HP Anda.
                    </p>
                  </div>
                  <span className="text-[10px] font-bold text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded-full shrink-0 self-start sm:self-auto">
                    {[fotoDokumentasi, fotoDokumentasi2].filter(Boolean).length} dari 2 Foto Terunggah
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {/* Foto 1 (Utama) */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-emerald-600 text-white inline-flex items-center justify-center text-[10px] font-black">1</span>
                        <span>Foto Utama</span>
                      </span>
                      {fotoDokumentasi && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(1)}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>

                    {fotoDokumentasi ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black/5 group">
                        <img
                          src={fotoDokumentasi}
                          alt="Foto Dokumentasi 1"
                          className="w-full h-36 object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(1, 'camera')}
                            className="px-2 py-1 rounded bg-white text-slate-900 font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Kamera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(1, 'gallery')}
                            className="px-2 py-1 rounded bg-white text-slate-900 font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Galeri</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50/50 space-y-2">
                        <div className="text-[11px] text-slate-600 font-medium">
                          {isUploadingPhoto && activePhotoSlot === 1 ? 'Mengoptimasi foto...' : 'Unggah Foto 1'}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(1, 'camera')}
                            className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Kamera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(1, 'gallery')}
                            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Galeri</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Foto 2 (Opsional) */}
                  <div className="bg-white rounded-xl p-2.5 border border-slate-200 shadow-2xs space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-slate-800 flex items-center gap-1">
                        <span className="w-4 h-4 rounded-full bg-blue-600 text-white inline-flex items-center justify-center text-[10px] font-black">2</span>
                        <span>Foto Tambahan (Opsional)</span>
                      </span>
                      {fotoDokumentasi2 && (
                        <button
                          type="button"
                          onClick={() => handleRemovePhoto(2)}
                          className="text-[10px] text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Hapus</span>
                        </button>
                      )}
                    </div>

                    {fotoDokumentasi2 ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-black/5 group">
                        <img
                          src={fotoDokumentasi2}
                          alt="Foto Dokumentasi 2"
                          className="w-full h-36 object-cover object-center"
                        />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(2, 'camera')}
                            className="px-2 py-1 rounded bg-white text-slate-900 font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <Camera className="w-3 h-3" />
                            <span>Kamera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(2, 'gallery')}
                            className="px-2 py-1 rounded bg-white text-slate-900 font-bold text-[10px] shadow-sm flex items-center gap-1 cursor-pointer"
                          >
                            <ImageIcon className="w-3 h-3" />
                            <span>Galeri</span>
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="border border-dashed border-slate-300 rounded-lg p-3 text-center bg-slate-50/50 space-y-2">
                        <div className="text-[11px] text-slate-600 font-medium">
                          {isUploadingPhoto && activePhotoSlot === 2 ? 'Mengoptimasi foto...' : 'Unggah Foto 2 (Opsional)'}
                        </div>
                        <div className="grid grid-cols-2 gap-1.5 pt-0.5">
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(2, 'camera')}
                            className="py-1.5 px-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                          >
                            <Camera className="w-3.5 h-3.5" />
                            <span>Kamera</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => handleTriggerUpload(2, 'gallery')}
                            className="py-1.5 px-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white font-bold text-[11px] flex items-center justify-center gap-1 shadow-2xs transition active:scale-95 cursor-pointer"
                          >
                            <ImageIcon className="w-3.5 h-3.5" />
                            <span>Galeri</span>
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Hidden Inputs: Explicit Camera vs Gallery */}
                <input
                  ref={cameraInputRef}
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <input
                  ref={galleryInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
              </div>

              {/* Upload Dokumen Notulen Dinamika Pertemuan (PDF atau JPEG/PNG) */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-blue-600" />
                    <span>Notulen Dinamika Pertemuan (PDF / Foto JPEG):</span>
                  </label>
                  {fileNotulenDinamika && (
                    <button
                      type="button"
                      onClick={handleRemoveDoc}
                      className="text-xs text-rose-600 hover:text-rose-700 font-bold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Hapus Dokumen</span>
                    </button>
                  )}
                </div>

                {fileNotulenDinamika ? (
                  <div className="p-3 bg-white rounded-xl border border-blue-200 shadow-2xs space-y-2.5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        {fileNotulenDinamikaTipe?.includes('pdf') || fileNotulenDinamikaNama?.toLowerCase().endsWith('.pdf') ? (
                          <FileText className="w-5 h-5 text-red-600" />
                        ) : (
                          <ImageIcon className="w-5 h-5 text-blue-600" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-bold text-xs text-slate-900 truncate" title={fileNotulenDinamikaNama}>
                          {fileNotulenDinamikaNama || 'Berkas Notulen Dinamika'}
                        </div>
                        <div className="text-[10px] text-slate-500 flex items-center gap-2 mt-0.5">
                          <span className="font-semibold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 uppercase">
                            {fileNotulenDinamikaTipe?.includes('pdf') || fileNotulenDinamikaNama?.toLowerCase().endsWith('.pdf') ? 'PDF' : 'Gambar / Foto'}
                          </span>
                          {fileNotulenDinamikaSize > 0 && (
                            <span>{formatFileSize(fileNotulenDinamikaSize)}</span>
                          )}
                          <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                            <CheckCircle2 className="w-3 h-3" />
                            <span>Siap Disimpan</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Preview Thumbnail if Image */}
                    {(!fileNotulenDinamikaTipe?.includes('pdf') && !fileNotulenDinamikaNama?.toLowerCase().endsWith('.pdf')) && (
                      <div className="rounded-lg overflow-hidden border border-slate-200 max-h-40 bg-slate-100">
                        <img
                          src={fileNotulenDinamika}
                          alt="Pratinjau Notulen"
                          className="w-full h-36 object-contain"
                        />
                      </div>
                    )}

                    <div className="flex items-center gap-2 pt-1 border-t border-slate-100 text-xs font-semibold">
                      <a
                        href={fileNotulenDinamika}
                        target="_blank"
                        rel="noopener noreferrer"
                        download={fileNotulenDinamikaNama || 'Notulen_Dinamika_Pertemuan'}
                        className="py-1 px-2.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 inline-flex items-center gap-1.5 transition text-[11px]"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Buka / Unduh Dokumen</span>
                      </a>
                      <button
                        type="button"
                        onClick={() => docFileInputRef.current?.click()}
                        className="py-1 px-2.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition text-[11px] cursor-pointer"
                      >
                        Ganti Berkas
                      </button>
                    </div>
                  </div>
                ) : (
                  <div
                    onClick={() => docFileInputRef.current?.click()}
                    className="border-2 border-dashed border-slate-300 hover:border-blue-500 rounded-xl p-4 text-center cursor-pointer bg-white transition hover:bg-blue-50/30 space-y-1.5"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-700 mx-auto flex items-center justify-center">
                      {isUploadingDoc ? (
                        <div className="w-5 h-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Upload className="w-5 h-5" />
                      )}
                    </div>
                    <div className="text-xs font-bold text-slate-800">
                      {isUploadingDoc ? 'Sedang memproses berkas...' : 'Upload Notulen Dinamika Pertemuan'}
                    </div>
                    <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                      Mendukung berkas <strong>PDF</strong> atau <strong>Foto/Scan Catatan JPEG/PNG</strong> (maksimal 7 MB).
                    </p>
                  </div>
                )}

                <input
                  ref={docFileInputRef}
                  type="file"
                  accept=".pdf,application/pdf,image/jpeg,image/png,image/jpg"
                  onChange={handleDocUpload}
                  className="hidden"
                />
              </div>

              {/* Buah Percakapan (5 Poin Khusus Sesuai Fokus) */}
              <div className="p-3.5 bg-gradient-to-br from-blue-50/80 to-indigo-50/50 border border-blue-200 rounded-xl space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 pb-2.5 border-b border-blue-200">
                  <div>
                    <div className="flex items-center gap-1.5 text-xs font-extrabold text-blue-950">
                      <FileText className="w-4 h-4 text-blue-700" />
                      <span>Buah Percakapan</span>
                    </div>
                    <div className="text-[11px] text-blue-800 font-medium mt-0.5">
                      Panduan 5 Butir Buah Percakapan untuk <strong>{focusInfo ? `Fokus ${focusInfo.number}: ${focusInfo.title}` : task.focusKonsultasi}</strong>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-300">
                      {notulensiAnswers.filter((a) => a.trim()).length} / 5 Poin Terisi
                    </span>
                  </div>
                </div>

                <div className="space-y-3">
                  {notulensiQuestions.map((qText, qIdx) => {
                    const isFilled = Boolean(notulensiAnswers[qIdx]?.trim());
                    return (
                      <div key={qIdx} className="space-y-1">
                        <label className="block text-xs font-bold text-slate-800 leading-snug">
                          <span
                            className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-black mr-1.5 shrink-0 transition ${
                              isFilled
                                ? 'bg-emerald-600 text-white shadow-2xs'
                                : 'bg-blue-600 text-white'
                            }`}
                          >
                            {qIdx + 1}
                          </span>
                          <span>{qText}</span>
                        </label>
                        <textarea
                          rows={2}
                          placeholder={`Tuliskan buah percakapan untuk: ${qText}...`}
                          value={notulensiAnswers[qIdx] || ''}
                          onChange={(e) => {
                            const updated = [...notulensiAnswers];
                            updated[qIdx] = e.target.value;
                            setNotulensiAnswers(updated);
                          }}
                          className={`w-full px-3 py-2 text-xs rounded-lg border outline-hidden transition font-medium text-slate-800 ${
                            isFilled
                              ? 'border-emerald-300 bg-white focus:ring-2 focus:ring-emerald-600'
                              : 'border-slate-300 bg-white focus:ring-2 focus:ring-blue-600'
                          }`}
                        />
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Catatan Tambahan / Refleksi Umum (Opsional) */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-slate-500" />
                    <span>Catatan Tambahan / Kesimpulan Umum (Opsional):</span>
                  </span>
                  <span className="text-[10px] text-slate-400 font-normal">Opsional</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Catatan hasil diskusi lainnya, suasana pertemuan, atau usulan konkret..."
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden bg-white text-slate-800 font-medium"
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
                {notulensiAnswers.some((a) => a.trim()) && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Buah Percakapan:</span>
                    <strong className="text-blue-700 font-bold">
                      {notulensiAnswers.filter((a) => a.trim()).length} dari 5 Poin Terisi
                    </strong>
                  </div>
                )}
                {fileNotulenDinamika && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Notulen Dinamika:</span>
                    <strong className="text-blue-700 font-bold truncate max-w-[180px]">
                      {fileNotulenDinamikaNama || 'Berkas Terlampir'}
                    </strong>
                  </div>
                )}
                {(fotoDokumentasi || fotoDokumentasi2) && (
                  <div className="flex justify-between items-center pt-1 border-t border-slate-100">
                    <span className="text-slate-500 font-medium">Foto Dokumentasi:</span>
                    <strong className="text-emerald-700 font-bold">
                      {[fotoDokumentasi, fotoDokumentasi2].filter(Boolean).length} Foto Terunggah
                    </strong>
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
