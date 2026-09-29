import React, { useState, useEffect } from 'react';
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
  UserPlus,
  AlertTriangle,
} from 'lucide-react';
import { TaskAssignment, ScheduleStatus, TeamMember } from '../types';
import { getIndonesianDayName, INDONESIAN_DAYS } from '../data/initialData';

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
  // Officers / Petugas state
  const [fasilitator, setFasilitator] = useState('');
  const [notulen, setNotulen] = useState('');
  const [customFasilitator, setCustomFasilitator] = useState(false);
  const [customNotulen, setCustomNotulen] = useState(false);

  // Schedule state
  const [tanggal, setTanggal] = useState('');
  const [hari, setHari] = useState('');
  const [jam, setJam] = useState('');
  const [tempat, setTempat] = useState('');
  const [kontakPic, setKontakPic] = useState('');
  const [status, setStatus] = useState<ScheduleStatus>('belum_ditentukan');
  const [catatan, setCatatan] = useState('');

  useEffect(() => {
    if (task) {
      setFasilitator(task.fasilitator || '');
      setNotulen(task.notulen || '');
      // Check if current task's fasilitator or notulen is in member list
      const fasInList = members.some((m) => m.name.toLowerCase() === (task.fasilitator || '').toLowerCase());
      setCustomFasilitator(!fasInList && !!task.fasilitator);

      const notInList = members.some((m) => m.name.toLowerCase() === (task.notulen || '').toLowerCase());
      setCustomNotulen(!notInList && !!task.notulen);

      setTanggal(task.tanggalKonsultasi || '');
      setHari(task.hari || '');
      setJam(task.jam || '');
      setTempat(task.tempat || '');
      setKontakPic(task.kontakPic || '');
      setStatus(task.status || 'belum_ditentukan');
      setCatatan(task.catatan || '');
    }
  }, [task, members]);

  if (!isOpen || !task) return null;

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      ...task,
      fasilitator: fasilitator.trim() || task.fasilitator,
      notulen: notulen.trim() || task.notulen,
      tanggalKonsultasi: tanggal,
      hari: hari,
      jam: jam,
      tempat: tempat,
      kontakPic: kontakPic,
      status: status,
      catatan: catatan,
      updatedAt: new Date().toISOString(),
    });
    onClose();
  };

  const handleClearSchedule = () => {
    setTanggal('');
    setHari('');
    setJam('');
    setTempat('');
    setStatus('belum_ditentukan');
  };

  const timePresets = ['18:30 WIB', '19:00 WIB', '19:30 WIB', '20:00 WIB', '09:00 WIB', '10:00 WIB', '16:00 WIB'];

  const isSamePerson = fasilitator.trim() && notulen.trim() && fasilitator.trim().toLowerCase() === notulen.trim().toLowerCase();

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                {task.category}
              </span>
              <span className="text-xs text-slate-500 font-medium">Edit Petugas &amp; Jadwal</span>
            </div>
            <h2 className="text-lg font-bold text-slate-900">{task.namaDpl}</h2>
            <p className="text-xs text-slate-600 line-clamp-1">{task.focusKonsultasi}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 overflow-y-auto space-y-4 text-sm flex-1">
          {/* SECTION: EDIT PETUGAS PENDAMPING */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-900">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Pengaturan Petugas Pendamping</span>
              </div>
              <button
                type="button"
                onClick={handleSwapRoles}
                className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-1 bg-white hover:bg-blue-100 text-blue-800 rounded-md border border-blue-300 transition shadow-2xs"
                title="Tukar posisi Fasilitator dan Notulen"
              >
                <ArrowLeftRight className="w-3 h-3 text-blue-600" />
                <span>Tukar Peran</span>
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
                <span>
                  Perhatian: Petugas Fasilitator dan Notulen tercatat sama (<strong>{fasilitator}</strong>).
                  Sebaiknya diisi oleh dua orang berbeda.
                </span>
              </div>
            )}
          </div>

          {/* Status Pelaksanaan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Status Koordinasi
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {[
                { value: 'belum_ditentukan', label: 'Belum Ada', color: 'slate' },
                { value: 'proses_koordinasi', label: 'Koordinasi', color: 'amber' },
                { value: 'terjadwal', label: 'Terjadwal', color: 'emerald' },
                { value: 'selesai', label: 'Selesai', color: 'blue' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setStatus(item.value as ScheduleStatus)}
                  className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition ${
                    status === item.value
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tanggal & Hari */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Tanggal Konsultasi
              </label>
              <input
                type="date"
                value={tanggal}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden bg-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
                <span>Hari</span>
                <span className="text-[10px] text-slate-400 font-normal">(Otomatis/Manual)</span>
              </label>
              <select
                value={hari}
                onChange={(e) => setHari(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden bg-white"
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

          {/* Jam Pelaksanaan & Presets */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Jam Pelaksanaan
            </label>
            <input
              type="text"
              placeholder="Contoh: 19:30 WIB atau 16:00 WIB"
              value={jam}
              onChange={(e) => setJam(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden bg-white mb-2"
            />
            {/* Quick Presets */}
            <div className="flex flex-wrap gap-1">
              <span className="text-[11px] text-slate-400 self-center mr-1">Pilihan Cepat:</span>
              {timePresets.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setJam(t)}
                  className={`text-[11px] px-2 py-0.5 rounded border ${
                    jam === t
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Tempat / Lokasi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-500" />
              Tempat / Lokasi
            </label>
            <input
              type="text"
              placeholder="Contoh: Rumah Bpk/Ibu [Nama], Gedung Pastoral Katedral, dsb."
              value={tempat}
              onChange={(e) => setTempat(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden bg-white"
            />
          </div>

          {/* Kontak PIC Pengurus */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-500" />
              Kontak PIC / Ketua (Nama &amp; No HP)
            </label>
            <input
              type="text"
              placeholder="Contoh: Bpk. Yosef (0812-XXXX-XXXX)"
              value={kontakPic}
              onChange={(e) => setKontakPic(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden bg-white"
            />
          </div>

          {/* Catatan / Poin Pembahasan */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Catatan / Poin Khusus
            </label>
            <textarea
              rows={2}
              placeholder="Catatan persiapan, koordinasi via WA, atau hasil ringkas..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 focus:border-red-600 outline-hidden bg-white"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
            {(tanggal || jam || tempat) && (
              <button
                type="button"
                onClick={handleClearSchedule}
                className="text-xs text-rose-600 hover:text-rose-700 font-medium py-2 px-1"
              >
                Reset Jadwal
              </button>
            )}
            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold rounded-lg text-slate-600 hover:bg-slate-100 transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-red-700 hover:bg-red-800 text-white shadow-xs inline-flex items-center gap-1.5 transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
