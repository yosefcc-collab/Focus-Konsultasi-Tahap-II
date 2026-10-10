import React, { useState } from 'react';
import { Sparkles, Users, ChevronRight, ChevronDown, Calendar, Clock, MapPin, UserCheck, FileText } from 'lucide-react';
import { TaskAssignment, FocusInfo } from '../types';
import { FOCUS_LIST, formatIndonesianDate, FOCUS_1_POINT_TITLES } from '../data/initialData';

interface FocusTabProps {
  tasks: TaskAssignment[];
  onEditTask: (task: TaskAssignment) => void;
  onOpenWhatsApp: (task: TaskAssignment) => void;
}

export const FocusTab: React.FC<FocusTabProps> = ({
  tasks,
  onEditTask,
  onOpenWhatsApp,
}) => {
  const [expandedFocus, setExpandedFocus] = useState<string | null>('focus-1');

  const toggleFocus = (focusId: string) => {
    setExpandedFocus(expandedFocus === focusId ? null : focusId);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Overview Intro */}
      <div className="bg-linear-to-r from-red-900 to-red-800 text-white p-4 rounded-2xl shadow-sm">
        <div className="flex items-center gap-2 mb-1.5">
          <Sparkles className="w-4 h-4 text-amber-300" />
          <span className="text-xs font-bold uppercase tracking-wider text-red-200">
            4 Pilar Fokus Sinodal
          </span>
        </div>
        <h2 className="text-base sm:text-lg font-extrabold tracking-tight">
          Konsultasi Sinode Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan
        </h2>
        <p className="text-xs text-red-100/90 mt-1 leading-relaxed">
          Tiap fokus dijalankan ke 14 Lingkungan dan 7 Kategorial yang telah dibagi secara merata
          dengan tim pendamping (Fasilitator &amp; Notulen).
        </p>
      </div>

      {/* Accordion / Card List for 4 Focuses */}
      <div className="space-y-3">
        {FOCUS_LIST.map((focus: FocusInfo) => {
          const focusTasks = tasks.filter((t) => t.focusId === focus.id);
          const isExpanded = expandedFocus === focus.id;
          const scheduledCount = focusTasks.filter((t) => t.status === 'terjadwal' || t.status === 'selesai').length;

          return (
            <div
              key={focus.id}
              className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-xs ${
                isExpanded ? 'border-slate-300 ring-2 ring-slate-100' : 'border-slate-200'
              }`}
            >
              {/* Header Bar */}
              <button
                type="button"
                onClick={() => toggleFocus(focus.id)}
                className="w-full text-left p-4 flex items-start justify-between gap-3 hover:bg-slate-50/70 transition"
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className="px-2 py-0.5 rounded text-[11px] font-bold"
                      style={{
                        backgroundColor: focus.color.light,
                        color: focus.color.accent,
                      }}
                    >
                      {focus.theme}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {focusTasks.length} Kunjungan ({scheduledCount} Terjadwal)
                    </span>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 leading-snug">
                    {focus.number}. {focus.title}
                  </h3>

                  <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                    {focus.description}
                  </p>
                </div>

                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-slate-500 bg-slate-100 shrink-0 self-center"
                  style={{
                    backgroundColor: isExpanded ? focus.color.light : undefined,
                    color: isExpanded ? focus.color.accent : undefined,
                  }}
                >
                  {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                </div>
              </button>

              {/* Collapsible Content */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/50 space-y-3">
                  {/* Focus 1: 2 Pertanyaan Panduan */}
                  {focus.id === 'focus-1' && (
                    <div className="p-3.5 bg-blue-50/90 rounded-xl border border-blue-200 text-xs space-y-2.5 shadow-2xs">
                      <div className="font-extrabold text-blue-950 flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <FileText className="w-4 h-4 text-blue-700" />
                          <span>2 Pertanyaan Panduan Refleksi Sinodal (Fokus 1):</span>
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900">
                          Masing-masing 5 Poin Buah Percakapan
                        </span>
                      </div>
                      <div className="space-y-3 text-slate-800">
                        <div className="p-3 bg-white rounded-xl border border-blue-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-blue-900 text-[11px] uppercase tracking-wider">
                              Pertanyaan 1:
                            </span>
                            <span className="text-[10px] font-bold text-blue-800 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                              5 Poin Buah Percakapan
                            </span>
                          </div>
                          <p className="leading-relaxed font-semibold text-slate-900 text-xs bg-blue-50/40 p-2 rounded-lg border border-blue-100">
                            "Dari tiga keprihatinan yang disebutkan dalam Lineamenta: ketidakhadiran pastoral, rasa tidak aman untuk berbicara, dan jarak antara nilai-nilai Katolik dengan praktik yang dijalankan, mana yang paling Anda kenali dalam lingkungan atau stasi Anda?"
                          </p>
                          <div className="pt-1.5 border-t border-slate-100 space-y-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              5 Poin yang Perlu Diisikan:
                            </div>
                            <div className="space-y-1">
                              {FOCUS_1_POINT_TITLES.map((title, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-800">
                                  <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 font-black text-[9px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="font-extrabold text-blue-950">Poin {idx + 1}:</span>
                                  <span className="font-medium text-slate-700">{title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div className="p-3 bg-white rounded-xl border border-indigo-100 space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="font-black text-indigo-900 text-[11px] uppercase tracking-wider">
                              Pertanyaan 2:
                            </span>
                            <span className="text-[10px] font-bold text-indigo-800 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                              5 Poin Buah Percakapan
                            </span>
                          </div>
                          <p className="leading-relaxed font-semibold text-slate-900 text-xs bg-indigo-50/40 p-2 rounded-lg border border-indigo-100">
                            "Dalam satu tahun terakhir, peristiwa apa yang membuat Anda sungguh merasa menjadi Gereja, dan peristiwa apa yang membuat kamu merasa sendirian?"
                          </p>
                          <div className="pt-1.5 border-t border-slate-100 space-y-1">
                            <div className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                              5 Poin yang Perlu Diisikan:
                            </div>
                            <div className="space-y-1">
                              {FOCUS_1_POINT_TITLES.map((title, idx) => (
                                <div key={idx} className="flex items-center gap-1.5 text-xs text-slate-800">
                                  <span className="w-4 h-4 rounded-full bg-indigo-100 text-indigo-900 font-black text-[9px] flex items-center justify-center shrink-0">
                                    {idx + 1}
                                  </span>
                                  <span className="font-extrabold text-indigo-950">Poin {idx + 1}:</span>
                                  <span className="font-medium text-slate-700">{title}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5" />
                    <span>Daftar Lingkungan &amp; Kategorial Kunjungan:</span>
                  </div>

                  <div className="grid grid-cols-1 gap-2.5">
                    {focusTasks.map((task) => (
                      <div
                        key={task.id}
                        className={`p-3 rounded-xl border bg-white space-y-2 transition shadow-xs ${
                          task.category === 'Kategorial' ? 'border-amber-300 bg-amber-50/20' : 'border-slate-200'
                        }`}
                      >
                        {/* Top: Name & Type */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span
                              className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold mr-1.5 uppercase ${
                                task.category === 'Kategorial'
                                  ? 'bg-amber-100 text-amber-900 border border-amber-300'
                                  : 'bg-slate-100 text-slate-600'
                              }`}
                            >
                              {task.category}
                            </span>
                            <span className="font-bold text-sm text-slate-900">
                              {task.namaDpl}
                            </span>
                          </div>

                          {task.tanggalKonsultasi ? (
                            <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                              {task.hari ? `${task.hari}, ` : ''}{formatIndonesianDate(task.tanggalKonsultasi)}
                            </span>
                          ) : (
                            <span className="text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                              Belum Dijadwalkan
                            </span>
                          )}
                        </div>

                        {/* Pendamping Breakdown */}
                        <div
                          onClick={() => onEditTask(task)}
                          className="grid grid-cols-2 gap-2 text-xs pt-1 cursor-pointer"
                          title="Klik untuk ubah petugas atau jadwal"
                        >
                          <div className="bg-slate-50 hover:bg-blue-50/60 p-2 rounded-lg border border-slate-100 transition">
                            <span className="text-[10px] text-blue-700 font-semibold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <UserCheck className="w-3 h-3" />
                                Fasilitator
                              </span>
                              <span className="text-[9px] text-blue-500 font-normal">Ubah &rarr;</span>
                            </span>
                            <p className="font-bold text-slate-800 text-xs mt-0.5 truncate">
                              {task.fasilitator}
                            </p>
                          </div>
                          <div className="bg-slate-50 hover:bg-emerald-50/60 p-2 rounded-lg border border-slate-100 transition">
                            <span className="text-[10px] text-emerald-700 font-semibold flex items-center justify-between">
                              <span className="flex items-center gap-1">
                                <FileText className="w-3 h-3" />
                                Notulen
                              </span>
                              <span className="text-[9px] text-emerald-500 font-normal">Ubah &rarr;</span>
                            </span>
                            <p className="font-bold text-slate-800 text-xs mt-0.5 truncate">
                              {task.notulen}
                            </p>
                          </div>
                        </div>

                        {/* Schedule details if any */}
                        {(task.jam || task.tempat) && (
                          <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-600 pt-1 border-t border-slate-100">
                            {task.jam && (
                              <div className="flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-400" />
                                <span>{task.jam}</span>
                              </div>
                            )}
                            {task.tempat && (
                              <div className="flex items-center gap-1">
                                <MapPin className="w-3 h-3 text-rose-500" />
                                <span className="truncate max-w-[200px]">{task.tempat}</span>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Action buttons */}
                        <div className="flex items-center justify-end gap-2 pt-1">
                          <button
                            type="button"
                            onClick={() => onOpenWhatsApp(task)}
                            className="text-xs px-2.5 py-1 font-semibold rounded-md text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition"
                          >
                            Template WA
                          </button>
                          <button
                            type="button"
                            onClick={() => onEditTask(task)}
                            className="text-xs px-2.5 py-1 font-semibold rounded-md text-slate-700 bg-slate-100 hover:bg-slate-200 transition"
                          >
                            {task.tanggalKonsultasi ? 'Ubah Jadwal' : 'Atur Jadwal'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
