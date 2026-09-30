import React, { useState } from 'react';
import { X, Copy, Check, MessageSquare, ExternalLink, Send, Users } from 'lucide-react';
import { TaskAssignment } from '../types';
import { formatIndonesianDate } from '../data/initialData';

interface WhatsAppShareModalProps {
  task: TaskAssignment | null;
  isOpen: boolean;
  onClose: () => void;
}

export const WhatsAppShareModal: React.FC<WhatsAppShareModalProps> = ({
  task,
  isOpen,
  onClose,
}) => {
  const [templateType, setTemplateType] = useState<'dpl' | 'pendamping'>('dpl');
  const [copied, setCopied] = useState(false);
  const [targetPhone, setTargetPhone] = useState('');

  if (!isOpen || !task) return null;

  const jadwalText = task.tanggalKonsultasi
    ? `🗓️ Hari/Tanggal: ${task.hari ? `${task.hari}, ` : ''}${formatIndonesianDate(task.tanggalKonsultasi)}\n⏰ Waktu: ${task.jam || 'Akan disepakati'}\n📍 Tempat: ${task.tempat || 'Akan disepakati bersama'}`
    : `🗓️ Jadwal Waktu: Menunggu konfirmasi & kesepakatan bersama Bapak/Ibu`;

  // Template 1: Koordinasi ke Pengurus Lingkungan / Kategorial
  const dplMessage = `*TIM SINODAL*
*PAROKI ST PERAWAN MARIA DIKANDUNG TANPA NODA KATEDRAL KEUSKUPAN AGUNG MEDAN*
*Fokus Konsultasi Sinodal*

Salam sejahtera dalam kasih Kristus,
Yth. Bapak/Ibu Pengurus & Anggota *${task.namaDpl}* (${task.category}),

Sehubungan dengan rangkaian kegiatan Sinode Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan, kami menginformasikan pelaksanaan sesi Fokus Konsultasi:

📌 *Tema Fokus:*
${task.focusKonsultasi}

👥 *Tim Pendamping Sinodal:*
• *Fasilitator:* ${task.fasilitator} (Pemimpin Sharing & Dialog)
• *Notulen:* ${task.notulen} (Pencatat Refleksi & Notulensi)

${jadwalText}

Mohon kesediaan Bapak/Ibu pengurus untuk berkoordinasi mengenai waktu dan tempat pelaksanaan agar proses mendengarkan dan berjalan bersama ini dapat berlangsung dengan baik.

Terima kasih atas perhatian dan partisipasinya. Tuhan Memberkati

_Salam Tim Sinodal Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan_`;

  // Template 2: Pengingat untuk Tim Pendamping (Fasilitator & Notulen)
  const pendampingMessage = `*PENGINGAT PENUGASAN TIM SINODAL*
Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan

Halo Rekan Tim Sinodal:
• Fasilitator: *${task.fasilitator}*
• Notulen: *${task.notulen}*

Berikut rincian penugasan pendampingan konsultasi:
🏛️ *Sasaran:* ${task.namaDpl} (${task.category})
🎯 *Fokus:* ${task.focusKonsultasi}
${jadwalText}

${task.catatan ? `📝 *Catatan:* ${task.catatan}\n` : ''}
Mari saling berkoordinasi dan persiapkan bahan panduan konsultasi. Terima kasih atas pelayanannya! 🙏✨`;

  const currentMessage = templateType === 'dpl' ? dplMessage : pendampingMessage;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(currentMessage);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSendWhatsApp = () => {
    const encoded = encodeURIComponent(currentMessage);
    let url = `https://wa.me/?text=${encoded}`;
    if (targetPhone.trim()) {
      // Clean phone number (e.g. 0812 -> 62812)
      let cleanPhone = targetPhone.replace(/[^0-9]/g, '');
      if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.slice(1);
      }
      url = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encoded}`;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-emerald-50 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow-xs">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Format WhatsApp Koordinasi</h2>
              <p className="text-xs text-emerald-800">{task.namaDpl}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch template */}
        <div className="p-3 bg-slate-50 border-b border-slate-200/70 flex gap-2">
          <button
            type="button"
            onClick={() => setTemplateType('dpl')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              templateType === 'dpl'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Ke Pengurus {task.category}</span>
          </button>
          <button
            type="button"
            onClick={() => setTemplateType('pendamping')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
              templateType === 'pendamping'
                ? 'bg-emerald-700 text-white shadow-xs'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
            }`}
          >
            <span>Ke Tim Pendamping</span>
          </button>
        </div>

        {/* Body content */}
        <div className="p-4 overflow-y-auto space-y-3 flex-1 text-xs">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 mb-1">
              Nomor WhatsApp Tujuan (Opsional, contoh: 08123456789):
            </label>
            <input
              type="tel"
              placeholder="Kosongkan jika ingin memilih kontak langsung di WA"
              value={targetPhone}
              onChange={(e) => setTargetPhone(e.target.value)}
              className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:ring-2 focus:ring-emerald-600 focus:border-emerald-600 outline-hidden bg-white"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="font-semibold text-slate-700 text-[11px]">Pratinjau Pesan:</span>
              <button
                type="button"
                onClick={handleCopy}
                className="text-emerald-700 hover:text-emerald-800 font-semibold inline-flex items-center gap-1"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Tersalin!' : 'Salin Pesan'}
              </button>
            </div>
            <pre className="p-3 bg-slate-900 text-slate-100 rounded-xl text-[11px] leading-relaxed whitespace-pre-wrap font-sans border border-slate-800 max-h-56 overflow-y-auto">
              {currentMessage}
            </pre>
          </div>
        </div>

        {/* Footer actions */}
        <div className="p-3 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={handleCopy}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 transition inline-flex items-center justify-center gap-1.5"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Tersalin' : 'Salin Teks'}</span>
          </button>

          <button
            type="button"
            onClick={handleSendWhatsApp}
            className="flex-1 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition inline-flex items-center justify-center gap-1.5"
          >
            <Send className="w-4 h-4" />
            <span>Kirim via WA</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70" />
          </button>
        </div>
      </div>
    </div>
  );
};
