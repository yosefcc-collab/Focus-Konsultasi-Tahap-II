import React from 'react';
import {
  ShieldCheck,
  Lock,
  CheckCircle2,
  Calendar,
  Users,
  Download,
  Church,
  X,
  FileCheck,
} from 'lucide-react';

interface FinalMasterSavedModalProps {
  isOpen: boolean;
  onClose: () => void;
  finalizedAt: string;
  isRelock?: boolean;
  totalTasks: number;
  onDownloadBackup?: () => void;
}

export const FinalMasterSavedModal: React.FC<FinalMasterSavedModalProps> = ({
  isOpen,
  onClose,
  finalizedAt,
  isRelock = false,
  totalTasks = 21,
  onDownloadBackup,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
    >
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in zoom-in-95 duration-200">
        {/* Top Header Motif Banner */}
        <div className="bg-gradient-to-br from-red-900 via-red-800 to-amber-900 text-white p-5 text-center relative">
          <button
            type="button"
            onClick={onClose}
            className="absolute right-3.5 top-3.5 text-white/70 hover:text-white p-1 rounded-full hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="w-16 h-16 rounded-2xl bg-amber-400 text-red-950 flex items-center justify-center mx-auto mb-3 shadow-lg ring-4 ring-white/20">
            <ShieldCheck className="w-9 h-9" />
          </div>

          <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
            Paroki Katedral Keuskupan Agung Medan
          </div>
          <h2 className="text-lg font-extrabold text-white mt-1 leading-snug">
            {isRelock
              ? 'Perubahan Berhasil Dikunci Kembali!'
              : 'Data Akhir Resmi Berhasil Dikunci!'}
          </h2>
          <p className="text-xs text-red-100/90 mt-1 max-w-xs mx-auto">
            {isRelock
              ? 'Susunan terbaru telah dibekukan sebagai Data Akhir Resmi yang baru.'
              : 'Susunan Fasilitator & Notulen telah tersimpan permanen dan terkunci rapat.'}
          </p>
        </div>

        {/* Motif Body & Confirmation Details */}
        <div className="p-5 space-y-4 text-slate-700 text-xs">
          {/* Main Motif Guarantee Box */}
          <div className="p-3.5 rounded-2xl bg-amber-50/90 border border-amber-300 flex items-start gap-3">
            <div className="p-2 rounded-xl bg-amber-500 text-slate-950 font-bold shrink-0 mt-0.5">
              <Lock className="w-4 h-4" />
            </div>
            <div className="space-y-1">
              <div className="font-extrabold text-amber-950 text-xs">
                Jaminan Perlindungan Data Akhir
              </div>
              <p className="text-[11px] text-amber-900 leading-relaxed">
                Susunan Fasilitator dan Notulen untuk <strong>seluruh {totalTasks} sasaran</strong>{' '}
                kini telah tersimpan ke dalam database permanen perangkat. Susunan petugas{' '}
                <strong>tidak akan berubah atau bergeser lagi saat berganti hari</strong>.
              </p>
            </div>
          </div>

          {/* Key Facts Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Users className="w-3 h-3 text-slate-400" />
                <span>Sasaran Terkunci</span>
              </div>
              <div className="font-extrabold text-slate-900 mt-0.5">
                {totalTasks} Lingkungan &amp; Kategorial
              </div>
            </div>

            <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-200">
              <div className="text-[10px] uppercase font-bold text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                <span>Waktu Kunci</span>
              </div>
              <div className="font-extrabold text-slate-900 mt-0.5 truncate" title={finalizedAt}>
                {finalizedAt || 'Baru saja'}
              </div>
            </div>
          </div>

          {/* Note on Future Changes */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 text-[11px] leading-relaxed flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <strong className="text-slate-800">Fleksibel di Masa Mendatang:</strong> Jika sewaktu-waktu
              ada personil yang berhalangan atau diganti, Anda tetap dapat mengeditnya kapan saja, lalu
              menekan tombol <em>"Kunci Lagi Sebagai Data Akhir"</em> untuk membekukan susunan baru.
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col gap-2">
            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-red-800 hover:bg-red-900 text-white font-bold text-xs shadow-md transition inline-flex items-center justify-center gap-2 active:scale-98"
            >
              <FileCheck className="w-4 h-4" />
              <span>Mengerti &amp; Tutup</span>
            </button>

            {onDownloadBackup && (
              <button
                type="button"
                onClick={onDownloadBackup}
                className="w-full py-2 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition inline-flex items-center justify-center gap-1.5"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Simpan File Salinan (.json)</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
