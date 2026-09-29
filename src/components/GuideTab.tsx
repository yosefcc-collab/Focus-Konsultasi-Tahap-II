import React from 'react';
import { BookOpen, UserCheck, FileText, CheckCircle2, MessageCircle, Calendar, ShieldCheck, HeartHandshake } from 'lucide-react';
import { FOCUS_LIST } from '../data/initialData';

export const GuideTab: React.FC = () => {
  return (
    <div className="space-y-4 pb-20">
      {/* Banner */}
      <div className="bg-linear-to-r from-red-950 via-red-900 to-red-800 text-white p-5 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <BookOpen className="w-5 h-5 text-amber-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-red-200">
            Pedoman Teknis
          </span>
        </div>
        <h2 className="text-lg font-extrabold">Panduan Pelaksanaan Focus Konsultasi</h2>
        <p className="text-xs text-red-100/90 mt-1 leading-relaxed">
          Petunjuk bagi Personil Tim Sinodal Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan dalam mendampingi
          14 Lingkungan dan 7 Kategorial.
        </p>
      </div>

      {/* Pembagian Peran Pendamping */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-red-700" />
          <span>Aturan Pembagian Peran Pendamping</span>
        </h3>
        <p className="text-xs text-slate-600 leading-relaxed">
          Sesuai arahan Dewan Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan, nama pendamping yang tertulis diatur dengan ketentuan:
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-200 space-y-1.5">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-xs">
              <UserCheck className="w-4 h-4 text-blue-600" />
              <span>1. Nama Pertama = FASILITATOR</span>
            </div>
            <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
              <li>Membuka sesi konsultasi dengan doa dan pengantar tema.</li>
              <li>Memandu jalannya sharing dan refleksi bersama umat/anggota.</li>
              <li>Menjaga suasana inklusif, saling mendengarkan tanpa menghakimi.</li>
              <li>Memastikan alokasi waktu berjalan dengan tertib.</li>
            </ul>
          </div>

          <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-1.5">
            <div className="flex items-center gap-2 text-emerald-900 font-bold text-xs">
              <FileText className="w-4 h-4 text-emerald-600" />
              <span>2. Nama Kedua = NOTULEN</span>
            </div>
            <ul className="text-[11px] text-slate-700 space-y-1 list-disc list-inside">
              <li>Mencatat daftar kehadiran peserta pertemuan.</li>
              <li>Merekam poin-poin refleksi, kendala, keluhan, dan harapan umat.</li>
              <li>Menyusun rangkuman notulensi untuk diserahkan ke Tim Inti Sinodal.</li>
              <li>Membantu fasilitator jika diperlukan saat sesi berlangsung.</li>
            </ul>
          </div>
        </div>
      </div>

      {/* 4 Focus Konsultasi */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <HeartHandshake className="w-4 h-4 text-red-700" />
          <span>4 Fokus Konsultasi Sinode Paroki</span>
        </h3>

        <div className="space-y-2.5">
          {FOCUS_LIST.map((f) => (
            <div
              key={f.id}
              className="p-3 rounded-xl border text-xs space-y-1"
              style={{
                backgroundColor: f.color.light,
                borderColor: f.color.accent + '40',
              }}
            >
              <div className="flex items-center gap-2 font-bold" style={{ color: f.color.accent }}>
                <span>Fokus {f.number}:</span>
                <span>{f.title}</span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white font-semibold ml-auto">
                  {f.theme}
                </span>
              </div>
              <p className="text-slate-700 leading-relaxed text-[11px]">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Alur Koordinasi Jadwal */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
          <Calendar className="w-4 h-4 text-red-700" />
          <span>Alur Penentuan Tanggal &amp; Jam Pelaksanaan</span>
        </h3>

        <div className="space-y-2 text-xs text-slate-700">
          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              1
            </span>
            <div>
              <strong className="text-slate-900 block">Koordinasi Antar Pendamping</strong>
              Fasilitator dan Notulen saling berkoordinasi terlebih dahulu mengenai kesiapan waktu masing-masing.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              2
            </span>
            <div>
              <strong className="text-slate-900 block">Menghubungi Ketua Lingkungan (DPL) / Kategorial</strong>
              Gunakan tombol <em>"WA Koordinasi"</em> di aplikasi ini untuk mengirimkan format pesan resmi penawaran jadwal.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              3
            </span>
            <div>
              <strong className="text-slate-900 block">Perbarui Jadwal di Aplikasi</strong>
              Setelah disepakati, klik <em>"Atur Jadwal"</em> untuk memasukkan tanggal, hari, jam, serta lokasi konsultasi.
            </div>
          </div>

          <div className="flex items-start gap-2.5">
            <span className="w-5 h-5 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-[11px] shrink-0 mt-0.5">
              4
            </span>
            <div>
              <strong className="text-slate-900 block">Pelaksanaan &amp; Laporan Notulensi</strong>
              Hadir tepat waktu, laksanakan konsultasi dengan semangat sinodalitas, dan rangkum hasil untuk tim paroki.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
