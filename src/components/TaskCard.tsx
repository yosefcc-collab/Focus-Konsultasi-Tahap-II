import React from 'react';
import { Calendar, Clock, MapPin, UserCheck, Edit3, MessageCircle, AlertCircle, CheckCircle2, Phone, FileText } from 'lucide-react';
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
  const focusInfo = FOCUS_LIST.find((f) => f.id === task.focusId);

  const isFasilitator = highlightPerson && task.fasilitator.toLowerCase().includes(highlightPerson.toLowerCase());
  const isNotulen = highlightPerson && task.notulen.toLowerCase().includes(highlightPerson.toLowerCase());

  const getStatusBadge = () => {
    switch (task.status) {
      case 'terjadwal':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
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
      case 'selesai':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-300">
            <CheckCircle2 className="w-3 h-3 text-blue-600" />
            Selesai
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
    <div
      className={`rounded-xl border transition-all duration-200 overflow-hidden shadow-sm hover:shadow-md bg-white ${
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
        <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs space-y-0.5">
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
              <span>Ganti Petugas</span>
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

        {/* Schedule & Location Details */}
        <div className="bg-slate-50/80 rounded-lg p-2.5 text-xs space-y-1.5 border border-slate-100">
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

          {task.tempat && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <MapPin className="w-3.5 h-3.5 text-rose-500 shrink-0" />
              <span className="truncate">{task.tempat}</span>
            </div>
          )}

          {task.kontakPic && (
            <div className="flex items-center gap-1.5 text-slate-600">
              <Phone className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span className="truncate">{task.kontakPic}</span>
            </div>
          )}

          {task.catatan && (
            <div className="mt-1 pt-1 border-t border-slate-200/60 text-slate-500 text-[11px] italic truncate">
              "{task.catatan}"
            </div>
          )}
        </div>

        {/* Actions for Mobile: Edit Schedule & WhatsApp Coordination */}
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={() => onEdit(task)}
            className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-900 text-white hover:bg-slate-800 transition active:scale-[0.98]"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>{task.tanggalKonsultasi ? 'Ubah Jadwal' : 'Atur Jadwal'}</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenWhatsApp(task)}
            className="inline-flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 transition active:scale-[0.98]"
            title="Kirim template WhatsApp koordinasi"
          >
            <MessageCircle className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">WA Koordinasi</span>
            <span className="sm:hidden">WA</span>
          </button>
        </div>
      </div>
    </div>
  );
};
