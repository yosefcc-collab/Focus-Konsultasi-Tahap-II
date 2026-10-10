import React, { useState, useMemo } from 'react';
import {
  MessageSquareQuote,
  Filter,
  Search,
  Printer,
  Copy,
  Check,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  FileText,
  Users,
  Calendar,
  Sparkles,
  ExternalLink,
  Edit3,
  Download,
  BookOpen,
} from 'lucide-react';
import { TaskAssignment, FocusType } from '../types';
import { FOCUS_LIST, FOCUS_NOTULENSI_QUESTIONS, formatIndonesianDate, FOCUS_1_POINT_TITLES } from '../data/initialData';
import { generateFocusSummaryPDF } from '../utils/pdfGenerator';

interface BuahPercakapanTabProps {
  tasks: TaskAssignment[];
  onEditTask: (task: TaskAssignment) => void;
}

export const BuahPercakapanTab: React.FC<BuahPercakapanTabProps> = ({ tasks, onEditTask }) => {
  const [selectedFocus, setSelectedFocus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [filterFilledOnly, setFilterFilledOnly] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<'by-question' | 'by-target' | 'summary'>('by-question');
  const [copied, setCopied] = useState<boolean>(false);
  const [expandedTargets, setExpandedTargets] = useState<Record<string, boolean>>({});

  // Calculation of overall metrics
  const totalTasks = tasks.length;
  const tasksWithAnswers = useMemo(() => {
    return tasks.filter((t) => t.notulensiPoin && t.notulensiPoin.some((p) => p.trim()));
  }, [tasks]);

  const totalFilledAnswers = useMemo(() => {
    return tasks.reduce((sum, t) => {
      if (!t.notulensiPoin) return sum;
      return sum + t.notulensiPoin.filter((p) => p.trim()).length;
    }, 0);
  }, [tasks]);

  // Focus metrics
  const focusStats = useMemo(() => {
    return FOCUS_LIST.map((f) => {
      const focusTasks = tasks.filter((t) => t.focusId === f.id);
      const filledCount = focusTasks.filter((t) => t.notulensiPoin && t.notulensiPoin.some((p) => p.trim())).length;
      return {
        focus: f,
        total: focusTasks.length,
        filled: filledCount,
        percentage: focusTasks.length > 0 ? Math.round((filledCount / focusTasks.length) * 100) : 0,
      };
    });
  }, [tasks]);

  // Filter tasks based on selected focus, search query, and filled status
  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // Focus filter
      if (selectedFocus !== 'all' && t.focusId !== selectedFocus) {
        return false;
      }

      // Filled only filter
      const hasAnswers = t.notulensiPoin && t.notulensiPoin.some((p) => p.trim());
      if (filterFilledOnly && !hasAnswers) {
        return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = t.namaDpl.toLowerCase().includes(q);
        const matchFasilitator = t.fasilitator.toLowerCase().includes(q);
        const matchNotulen = t.notulen.toLowerCase().includes(q);
        const matchCatatan = (t.catatan || '').toLowerCase().includes(q);
        const matchAnswers = (t.notulensiPoin || []).some((ans) => ans.toLowerCase().includes(q));
        if (!matchName && !matchFasilitator && !matchNotulen && !matchCatatan && !matchAnswers) {
          return false;
        }
      }

      return true;
    });
  }, [tasks, selectedFocus, searchQuery, filterFilledOnly]);

  const toggleExpand = (taskId: string) => {
    setExpandedTargets((prev) => ({
      ...prev,
      [taskId]: !prev[taskId],
    }));
  };

  // Copy full text synthesis of Buah Percakapan
  const handleCopySummary = () => {
    let text = `========================================================\n`;
    text += `REKAPITULASI BUAH PERCAKAPAN KONSULTASI SINODAL\n`;
    text += `PAROKI SANTO YOSEF KATEDRAL MEDAN\n`;
    text += `Tanggal Ekspor: ${new Date().toLocaleDateString('id-ID', { dateStyle: 'full' })}\n`;
    text += `Total Kunjungan Mengisi: ${tasksWithAnswers.length} dari ${totalTasks} Kunjungan\n`;
    text += `========================================================\n\n`;

    FOCUS_LIST.forEach((focus) => {
      const focusTasks = tasks.filter((t) => t.focusId === focus.id);
      const questions = FOCUS_NOTULENSI_QUESTIONS[focus.id] || [];
      text += `--------------------------------------------------------\n`;
      text += `🎯 FOKUS ${focus.number}: ${focus.title.toUpperCase()} (${focus.theme})\n`;
      text += `--------------------------------------------------------\n\n`;

      if (focus.id === 'focus-1') {
        questions.forEach((q, qIdx) => {
          text += `[Pertanyaan ${qIdx + 1}] ${q}\n`;
          let countQAnswers = 0;
          focusTasks.forEach((t) => {
            const start = qIdx * 5;
            const points = [0, 1, 2, 3, 4]
              .map((p) => ({
                num: p + 1,
                title: FOCUS_1_POINT_TITLES[p] || `Poin ${p + 1}`,
                val: t.notulensiPoin?.[start + p] || '',
              }))
              .filter((pt) => Boolean(pt.val.trim()));

            if (points.length > 0) {
              countQAnswers++;
              text += `  • ${t.namaDpl}:\n`;
              points.forEach((pt) => {
                text += `    Poin ${pt.num} (${pt.title}): "${pt.val.trim()}"\n`;
              });
            }
          });
          if (countQAnswers === 0) {
            text += `  (Belum ada buah percakapan yang masuk untuk pertanyaan ini)\n`;
          }
          text += `\n`;
        });
      } else {
        questions.forEach((q, qIdx) => {
          text += `[Butir ${qIdx + 1}] ${q}\n`;
          let countQAnswers = 0;
          focusTasks.forEach((t) => {
            const ans = t.notulensiPoin?.[qIdx];
            if (ans && ans.trim()) {
              countQAnswers++;
              text += `  • ${t.namaDpl}:\n    "${ans.trim()}"\n`;
            }
          });
          if (countQAnswers === 0) {
            text += `  (Belum ada buah percakapan yang masuk untuk butir ini)\n`;
          }
          text += `\n`;
        });
      }
      text += `\n`;
    });

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-5 animate-in fade-in duration-200 pb-12">
      {/* Top Banner & Header */}
      <div className="bg-gradient-to-r from-red-900 via-red-800 to-amber-900 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-6 -mr-6 w-48 h-48 bg-amber-400/10 rounded-full blur-2xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-400/20 text-amber-200 text-xs font-bold border border-amber-300/30 mb-2">
              <MessageSquareQuote className="w-3.5 h-3.5" />
              <span>Rangkuman &amp; Rekapitulasi Sinodal</span>
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight flex items-center gap-2">
              <span>Rekapitulasi Buah Percakapan</span>
            </h1>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl mt-1 leading-relaxed">
              Kompilasi dan rangkuman seluruh <strong>Buah Percakapan</strong> dari 21 Lingkungan &amp; Kategorial 
              Paroki Katedral Medan yang terorganisir menurut 4 Pilar Fokus Pastoral.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              onClick={handleCopySummary}
              className="py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs flex items-center gap-1.5 border border-white/20 transition shadow-2xs cursor-pointer active:scale-95"
              title="Salin seluruh teks rekapitulasi ke clipboard"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
              <span>{copied ? 'Tersalin!' : 'Salin Rekap Teks'}</span>
            </button>
            <button
              onClick={() => {
                const targetFocus = selectedFocus === 'all' ? 'all' : (selectedFocus as FocusType);
                generateFocusSummaryPDF(tasks, targetFocus);
              }}
              className="py-2 px-3.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-xs flex items-center gap-1.5 shadow-md transition cursor-pointer active:scale-95"
              title="Unduh PDF Rangkuman Buah Percakapan: 1 Halaman per Poin"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF Rangkuman {selectedFocus === 'all' ? 'Semua Fokus' : `Fokus ${selectedFocus.replace('focus-', '')}`}</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Kemajuan Pengumpulan Buah Percakapan */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {focusStats.map(({ focus, total, filled, percentage }) => (
          <div
            key={focus.id}
            onClick={() => setSelectedFocus(selectedFocus === focus.id ? 'all' : focus.id)}
            className={`p-3.5 rounded-xl border transition cursor-pointer shadow-2xs ${
              selectedFocus === focus.id
                ? 'bg-white border-red-600 ring-2 ring-red-600/30 shadow-md'
                : 'bg-white hover:bg-slate-50 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between gap-1 mb-1">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0"
                style={{ backgroundColor: focus.color.accent }}
              />
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                Fokus {focus.number}
              </span>
              <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {percentage}%
              </span>
            </div>
            <div className="font-bold text-slate-900 text-xs line-clamp-1">
              {focus.title}
            </div>
            <div className="text-[10px] text-slate-500 font-medium">
              {focus.theme}
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2.5 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-300"
                style={{
                  width: `${percentage}%`,
                  backgroundColor: focus.color.accent,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-500 mt-1 font-semibold">
              <span>{filled} dari {total} Terisi</span>
              <span>{percentage === 100 ? '✅ Lengkap' : `${total - filled} Belum`}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Filter, Search & View Mode Bar */}
      <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Focus Selector Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-semibold">
            <button
              onClick={() => setSelectedFocus('all')}
              className={`px-3 py-1.5 rounded-lg shrink-0 transition cursor-pointer ${
                selectedFocus === 'all'
                  ? 'bg-slate-900 text-amber-300 font-bold shadow-xs'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              Semua Fokus ({totalTasks})
            </button>
            {FOCUS_LIST.map((f) => (
              <button
                key={f.id}
                onClick={() => setSelectedFocus(f.id)}
                className={`px-3 py-1.5 rounded-lg shrink-0 transition flex items-center gap-1.5 cursor-pointer ${
                  selectedFocus === f.id
                    ? 'text-white font-bold shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
                style={selectedFocus === f.id ? { backgroundColor: f.color.accent } : {}}
              >
                <span className="w-2 h-2 rounded-full bg-current" />
                <span>Fokus {f.number}</span>
              </button>
            ))}
          </div>

          {/* View Mode Toggle: Focus 4 vs Per Kunjungan vs Rangkuman per Fokus */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg shrink-0 text-xs self-start md:self-auto flex-wrap sm:flex-nowrap">
            <button
              onClick={() => {
                setSelectedFocus('focus-4');
                setViewMode('by-question');
              }}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                viewMode === 'by-question' && selectedFocus === 'focus-4'
                  ? 'bg-white text-slate-900 shadow-2xs font-extrabold'
                  : viewMode === 'by-question'
                  ? 'bg-white/80 text-slate-800 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Tampilkan Butir Jawaban Fokus 4"
            >
              Focus 4
            </button>
            <button
              onClick={() => setViewMode('by-target')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                viewMode === 'by-target'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Per Kunjungan
            </button>
            <button
              onClick={() => setViewMode('summary')}
              className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer flex items-center gap-1 ${
                viewMode === 'summary'
                  ? 'bg-red-800 text-white shadow-2xs font-black'
                  : 'text-slate-700 hover:text-slate-900'
              }`}
            >
              <FileText className="w-3.5 h-3.5 text-amber-300" />
              <span>Rangkuman per Fokus</span>
            </button>
          </div>
        </div>

        {/* Search & Checkbox Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-2 border-t border-slate-100 text-xs">
          <div className="relative flex-1 max-w-md">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari kata kunci dalam buah percakapan, nama kunjungan, atau pendamping..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:ring-2 focus:ring-red-600 outline-hidden bg-slate-50 focus:bg-white transition"
            />
          </div>

          <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 select-none">
            <input
              type="checkbox"
              checked={filterFilledOnly}
              onChange={(e) => setFilterFilledOnly(e.target.checked)}
              className="rounded border-slate-300 text-red-600 focus:ring-red-500 w-4 h-4 cursor-pointer"
            />
            <span>Hanya tampilkan yang sudah mengisi Buah Percakapan ({tasksWithAnswers.length})</span>
          </label>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* MODE 1: TAMPILAN BERDASARKAN BUTIR PERTANYAAN / FOKUS (BY-QUESTION)       */}
      {/* ========================================================================= */}
      {viewMode === 'by-question' && (
        <div className="space-y-6">
          {FOCUS_LIST.filter((f) => selectedFocus === 'all' || f.id === selectedFocus).map((focus) => {
            const focusTasks = filteredTasks.filter((t) => t.focusId === focus.id);
            const questions = FOCUS_NOTULENSI_QUESTIONS[focus.id] || [];

            return (
              <div
                key={focus.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden"
              >
                {/* Focus Card Header */}
                <div
                  className="p-4 border-b text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  style={{ backgroundColor: focus.color.accent }}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-xs">
                        Fokus {focus.number} • {focus.theme}
                      </span>
                    </div>
                    <h2 className="text-base sm:text-lg font-black mt-1">
                      Fokus {focus.number}: {focus.title}
                    </h2>
                    <p className="text-xs text-white/90 font-medium">
                      {focus.description}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <span className="text-xs font-bold bg-white/20 px-2.5 py-1 rounded-lg backdrop-blur-xs">
                      {focusTasks.filter((t) => t.notulensiPoin && t.notulensiPoin.some((p) => p.trim())).length} / {focusTasks.length} Kunjungan Terisi
                    </span>
                  </div>
                </div>

                {/* Questions Synthesis */}
                <div className="p-4 sm:p-5 space-y-6">
                  {questions.map((question, qIdx) => {
                    const isF1 = focus.id === 'focus-1';
                    const respondents = focusTasks.filter((t) => {
                      if (isF1) {
                        const start = qIdx * 5;
                        return [0, 1, 2, 3, 4].some((p) => Boolean(t.notulensiPoin?.[start + p]?.trim()));
                      }
                      return Boolean(t.notulensiPoin && t.notulensiPoin[qIdx] && t.notulensiPoin[qIdx].trim());
                    });

                    return (
                      <div
                        key={qIdx}
                        className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3"
                      >
                        {/* Question Title */}
                        <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-200">
                          <div className="flex items-start gap-2.5">
                            <span
                              className="inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-black shrink-0 mt-0.5 shadow-2xs"
                              style={{ backgroundColor: focus.color.accent }}
                            >
                              {qIdx + 1}
                            </span>
                            <div>
                              <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                                {question}
                              </h3>
                              <span className="text-[11px] text-slate-500 font-medium">
                                {isF1 ? `Pertanyaan ${qIdx + 1} (5 Poin Buah Percakapan)` : `Butir Pertanyaan ke-${qIdx + 1}`}
                              </span>
                            </div>
                          </div>

                          <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">
                            {respondents.length} Kunjungan Mengisi
                          </span>
                        </div>

                        {/* List of answers from Lingkungan & Kategorial */}
                        {respondents.length > 0 ? (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                            {respondents.map((task) => {
                              const answer = task.notulensiPoin?.[qIdx] || '';
                              const f1Points = isF1
                                ? [0, 1, 2, 3, 4]
                                    .map((p) => ({
                                      num: p + 1,
                                      title: FOCUS_1_POINT_TITLES[p] || `Poin ${p + 1}`,
                                      val: task.notulensiPoin?.[qIdx * 5 + p] || '',
                                    }))
                                    .filter((p) => p.val.trim())
                                : [];

                              return (
                                <div
                                  key={task.id}
                                  className="p-3 bg-white rounded-xl border border-slate-200 shadow-2xs space-y-2 hover:border-slate-300 transition"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-xs text-slate-900 line-clamp-1">
                                      {task.namaDpl}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => onEditTask(task)}
                                      className="text-[10px] text-blue-700 font-bold hover:underline shrink-0 flex items-center gap-0.5"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>Edit</span>
                                    </button>
                                  </div>

                                  {isF1 ? (
                                    <div className="space-y-2 bg-slate-50/70 p-2.5 rounded-lg border border-slate-100">
                                      {f1Points.map((pt) => (
                                        <div key={pt.num} className="p-2 rounded-lg bg-white border border-slate-200/70 shadow-2xs space-y-1">
                                          <div className="font-bold text-blue-900 text-[11px] flex items-center gap-1.5">
                                            <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 font-black text-[9px] flex items-center justify-center shrink-0">
                                              {pt.num}
                                            </span>
                                            <span>Poin {pt.num}: {pt.title}</span>
                                          </div>
                                          <div className="text-right pl-4 pt-0.5">
                                            <div className="inline-block text-right text-xs text-slate-800 font-medium italic bg-blue-50/40 p-2 rounded-lg border border-blue-100/70 max-w-full whitespace-pre-wrap leading-relaxed shadow-2xs">
                                              "{pt.val}"
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="text-right pt-0.5">
                                      <blockquote className="inline-block text-right text-xs text-slate-800 font-medium italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 max-w-full whitespace-pre-wrap leading-relaxed shadow-2xs">
                                        "{answer}"
                                      </blockquote>
                                    </div>
                                  )}

                                  <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-100">
                                    <span>
                                      {task.hari ? `${task.hari}, ` : ''}{task.tanggalKonsultasi || 'Waktu belum diatur'}
                                    </span>
                                    <span>
                                      Pendamping: <strong>{task.fasilitator}</strong> &amp; <strong>{task.notulen}</strong>
                                    </span>
                                  </div>

                                  {task.fileNotulenDinamika && (
                                    <div className="pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px]">
                                      <span className="text-slate-600 font-semibold flex items-center gap-1 truncate">
                                        <FileText className="w-3 h-3 text-blue-600 shrink-0" />
                                        <span className="truncate">{task.fileNotulenDinamikaNama || 'Notulen Dinamika'}</span>
                                      </span>
                                      <a
                                        href={task.fileNotulenDinamika}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        download={task.fileNotulenDinamikaNama || 'Notulen_Dinamika'}
                                        className="text-blue-700 font-bold underline hover:text-blue-900 shrink-0 ml-1.5 inline-flex items-center gap-0.5"
                                      >
                                        <span>Buka Dokumen</span>
                                        <ExternalLink className="w-2.5 h-2.5" />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-4 text-center rounded-xl bg-white border border-dashed border-slate-200 text-slate-400 text-xs">
                            Belum ada buah percakapan yang diisikan untuk butir pertanyaan ini.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 2: TAMPILAN BERDASARKAN KUNJUNGAN LINGKUNGAN / KATEGORIAL (BY-TARGET) */}
      {/* ========================================================================= */}
      {viewMode === 'by-target' && (
        <div className="space-y-4">
          {filteredTasks.length === 0 ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 space-y-2">
              <MessageSquareQuote className="w-10 h-10 text-slate-300 mx-auto" />
              <div className="font-bold text-slate-800">Tidak ada kunjungan yang cocok</div>
              <p className="text-xs text-slate-500">Coba ubah kata kunci pencarian atau filter yang dipilih.</p>
            </div>
          ) : (
            filteredTasks.map((task) => {
              const focusInfo = FOCUS_LIST.find((f) => f.id === task.focusId);
              const questions = FOCUS_NOTULENSI_QUESTIONS[task.focusId || 'focus-1'] || [];
              const filledCount = (task.notulensiPoin || []).filter((p) => p.trim()).length;
              const isExpanded = expandedTargets[task.id] !== false; // Default expanded

              return (
                <div
                  key={task.id}
                  className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden transition"
                >
                  {/* Card Header */}
                  <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className="w-2.5 h-2.5 rounded-full shrink-0"
                          style={{ backgroundColor: focusInfo?.color.accent }}
                        />
                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                          Fokus {focusInfo?.number || 1}: {focusInfo?.theme}
                        </span>
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-900 border border-blue-200">
                          {filledCount}/{task.focusId === 'focus-1' ? 10 : 5} Butir Buah Percakapan
                        </span>
                      </div>
                      <h3 className="text-base font-bold text-slate-900">
                        {task.namaDpl}
                      </h3>
                      <div className="text-xs text-slate-600 mt-0.5 flex flex-wrap items-center gap-3">
                        <span>Fasilitator: <strong>{task.fasilitator}</strong></span>
                        <span>•</span>
                        <span>Notulen: <strong>{task.notulen}</strong></span>
                        {task.tanggalKonsultasi && (
                          <>
                            <span>•</span>
                            <span>Pelaksanaan: {formatIndonesianDate(task.tanggalKonsultasi)}</span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <button
                        type="button"
                        onClick={() => onEditTask(task)}
                        className="py-1.5 px-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center gap-1 shadow-2xs transition cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Isi / Edit Buah</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleExpand(task.id)}
                        className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 cursor-pointer"
                        title={isExpanded ? 'Sembunyikan Butir' : 'Tampilkan Butir'}
                      >
                        {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  {/* Questions Body */}
                  {isExpanded && (
                    <div className="p-4 sm:p-5 space-y-3 bg-white">
                      {task.focusId === 'focus-1' ? (
                        questions.map((question, qIdx) => {
                          const startSlot = qIdx * 5;
                          const points = [0, 1, 2, 3, 4].map((p) => ({
                            num: p + 1,
                            title: FOCUS_1_POINT_TITLES[p] || `Poin ${p + 1}`,
                            val: task.notulensiPoin?.[startSlot + p] || '',
                          }));
                          const hasAny = points.some((p) => p.val.trim());

                          return (
                            <div
                              key={qIdx}
                              className={`p-3.5 rounded-xl border text-xs space-y-2 transition ${
                                hasAny
                                  ? 'bg-slate-50/70 border-slate-200'
                                  : 'bg-slate-50/30 border-dashed border-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-2 pb-1.5 border-b border-slate-200/80">
                                <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md text-[10px] font-black bg-blue-700 text-white uppercase tracking-wider shrink-0 mt-0.5">
                                  Pertanyaan {qIdx + 1}
                                </span>
                                <div className="font-bold text-slate-900 leading-snug">
                                  {question}
                                </div>
                              </div>

                              {hasAny ? (
                                <div className="space-y-2 pt-0.5">
                                  {points.map((pt) => {
                                    if (!pt.val.trim()) return null;
                                    return (
                                      <div key={pt.num} className="p-2.5 rounded-lg bg-white border border-slate-200/80 shadow-2xs space-y-1">
                                        <div className="font-bold text-blue-900 text-xs flex items-center gap-1.5">
                                          <span className="w-4 h-4 rounded-full bg-blue-100 text-blue-900 font-bold text-[9px] flex items-center justify-center shrink-0">
                                            {pt.num}
                                          </span>
                                          <span>Poin {pt.num}: {pt.title}</span>
                                        </div>
                                        <div className="text-right pl-4 pt-0.5">
                                          <div className="inline-block text-right text-xs text-slate-800 font-medium italic bg-blue-50/40 p-2.5 rounded-lg border border-blue-100 max-w-full whitespace-pre-wrap leading-relaxed shadow-2xs">
                                            "{pt.val}"
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="pl-2 text-slate-400 italic text-[11px]">
                                  (Belum ada buah percakapan yang diisikan untuk pertanyaan ini)
                                </div>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        questions.map((question, idx) => {
                          const answer = task.notulensiPoin?.[idx];
                          const isFilled = Boolean(answer && answer.trim());

                          return (
                            <div
                              key={idx}
                              className={`p-3 rounded-xl border text-xs space-y-1.5 transition ${
                                isFilled
                                  ? 'bg-slate-50/70 border-slate-200'
                                  : 'bg-slate-50/30 border-dashed border-slate-200'
                              }`}
                            >
                              <div className="flex items-start gap-2">
                                <span
                                  className={`inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-black shrink-0 mt-0.5 ${
                                    isFilled ? 'bg-emerald-600 text-white' : 'bg-slate-300 text-slate-600'
                                  }`}
                                >
                                  {idx + 1}
                                </span>
                                <div className="font-bold text-slate-900 leading-snug">
                                  {question}
                                </div>
                              </div>

                              {isFilled ? (
                                <div className="text-right pl-6 pt-1">
                                  <div className="inline-block text-right text-xs text-slate-800 font-medium italic bg-white p-2.5 rounded-lg border border-slate-200/80 max-w-full whitespace-pre-wrap leading-relaxed shadow-2xs">
                                    "{answer}"
                                  </div>
                                </div>
                              ) : (
                                <div className="pl-6 text-slate-400 italic text-[11px]">
                                  (Belum ada buah percakapan yang diisikan)
                                </div>
                              )}
                            </div>
                          );
                        })
                      )}

                      {/* Catatan Umum Tambahan */}
                      {task.catatan && (
                        <div className="mt-2 p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs space-y-1">
                          <span className="font-bold text-amber-950 flex items-center gap-1">
                            <FileText className="w-3.5 h-3.5 text-amber-700" />
                            <span>Catatan Umum Tambahan:</span>
                          </span>
                          <p className="text-amber-900 italic pl-5">"{task.catatan}"</p>
                        </div>
                      )}

                      {/* Berkas Notulen Dinamika Pertemuan */}
                      {task.fileNotulenDinamika && (
                        <div className="mt-2 p-3 bg-blue-50/70 border border-blue-200 rounded-xl text-xs flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <FileText className="w-4 h-4 text-blue-700 shrink-0" />
                            <div className="min-w-0">
                              <span className="font-bold text-blue-950 block truncate text-[11px]">
                                Dokumen Notulen Dinamika: {task.fileNotulenDinamikaNama || 'Berkas Terunggah'}
                              </span>
                              <span className="text-[10px] text-blue-700">
                                {task.fileNotulenDinamikaTipe?.includes('pdf') || task.fileNotulenDinamikaNama?.toLowerCase().endsWith('.pdf') ? 'Format PDF' : 'Format Gambar / Scan'}
                              </span>
                            </div>
                          </div>
                          <a
                            href={task.fileNotulenDinamika}
                            target="_blank"
                            rel="noopener noreferrer"
                            download={task.fileNotulenDinamikaNama || 'Notulen_Dinamika'}
                            className="py-1 px-2.5 rounded-lg bg-white hover:bg-blue-600 hover:text-white text-blue-800 font-bold border border-blue-200 transition text-[11px] shrink-0 inline-flex items-center gap-1"
                          >
                            <span>Buka / Unduh</span>
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODE 3: RANGKUMAN SETIAP FOKUS & UNDUH PDF PER POIN (SUMMARY)            */}
      {/* ========================================================================= */}
      {viewMode === 'summary' && (
        <div className="space-y-6">
          {/* Summary Helper Banner */}
          <div className="p-4 bg-amber-50/90 rounded-2xl border border-amber-200/90 text-xs shadow-2xs space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="space-y-1">
                <div className="font-extrabold text-amber-950 text-sm flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-700" />
                  <span>Menu Rangkuman Buah Percakapan per Fokus</span>
                </div>
                <p className="text-slate-700 text-xs leading-relaxed max-w-2xl">
                  Setiap butir dan poin dirangkum dari seluruh kunjungan Lingkungan &amp; Kategorial yang telah terlaksana.
                  Hasil cetak PDF akan menyusun <strong>1 halaman khusus untuk setiap poin</strong>.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    const targetFocus = selectedFocus === 'all' ? 'focus-1' : (selectedFocus as FocusType);
                    generateFocusSummaryPDF(tasks, targetFocus);
                  }}
                  className="py-2 px-3.5 rounded-xl bg-red-800 hover:bg-red-700 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  <span>Unduh PDF {selectedFocus === 'all' ? 'Fokus 1' : `Fokus ${selectedFocus.replace('focus-', '')}`}</span>
                </button>
                <button
                  type="button"
                  onClick={() => generateFocusSummaryPDF(tasks, 'all')}
                  className="py-2 px-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-extrabold text-xs flex items-center gap-1.5 shadow-sm transition cursor-pointer active:scale-95"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Unduh PDF Semua (4 Fokus)</span>
                </button>
              </div>
            </div>
          </div>

          {/* List of Focus Summaries */}
          {FOCUS_LIST.filter((f) => selectedFocus === 'all' || f.id === selectedFocus).map((focus) => {
            const focusTasks = tasks.filter((t) => t.focusId === focus.id);
            const questions = FOCUS_NOTULENSI_QUESTIONS[focus.id] || [];
            const isF1 = focus.id === 'focus-1';
            const filledTasks = focusTasks.filter((t) => t.notulensiPoin && t.notulensiPoin.some((p) => p.trim()));

            return (
              <div
                key={focus.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden space-y-4 p-4 sm:p-5"
              >
                {/* Focus Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className="px-2.5 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider"
                        style={{
                          backgroundColor: focus.color.light,
                          color: focus.color.accent,
                        }}
                      >
                        {focus.theme}
                      </span>
                      <span className="text-xs font-bold text-slate-600">
                        {filledTasks.length} / {focusTasks.length} Kunjungan Terisi
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-black text-slate-900 leading-snug">
                      Fokus {focus.number}: {focus.title}
                    </h3>
                    <p className="text-xs text-slate-600 leading-relaxed max-w-3xl">
                      {focus.description}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => generateFocusSummaryPDF(tasks, focus.id)}
                    className="py-2 px-3.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-300 font-bold text-xs flex items-center gap-2 self-start sm:self-center shrink-0 shadow-xs transition cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Cetak PDF Fokus {focus.number}</span>
                  </button>
                </div>

                {/* Focus 1: 2 Questions, each with 5 points */}
                {isF1 ? (
                  <div className="space-y-6">
                    {questions.map((questionText, qIdx) => {
                      const startSlot = qIdx * 5;
                      return (
                        <div key={qIdx} className="space-y-3 pt-1">
                          <div className="p-3 bg-blue-50/80 rounded-xl border border-blue-200/80 space-y-1">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black bg-blue-700 text-white uppercase tracking-wider">
                              Pertanyaan {qIdx + 1}
                            </span>
                            <h4 className="text-xs font-bold text-slate-900 leading-relaxed">
                              {questionText}
                            </h4>
                          </div>

                          {/* 5 Points under this question */}
                          <div className="space-y-3 pl-1 sm:pl-3">
                            {[0, 1, 2, 3, 4].map((subIdx) => {
                              const slot = startSlot + subIdx;
                              const pointNum = subIdx + 1;
                              const pointTitle = FOCUS_1_POINT_TITLES[subIdx] || `Poin ${pointNum}`;
                              const answersForThisPoint = focusTasks
                                .map((t) => ({
                                  task: t,
                                  answer: t.notulensiPoin?.[slot]?.trim() || '',
                                }))
                                .filter((item) => Boolean(item.answer));

                              return (
                                <div
                                  key={subIdx}
                                  className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2.5 shadow-2xs"
                                >
                                  {/* Point Title Bar */}
                                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                                    <div className="font-extrabold text-xs text-blue-950 flex items-center gap-2 flex-wrap">
                                      <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                        {pointNum}
                                      </span>
                                      <span>Poin {pointNum}: {pointTitle}</span>
                                    </div>
                                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">
                                      {answersForThisPoint.length} Kunjungan
                                    </span>
                                  </div>

                                  {/* List of responses */}
                                  {answersForThisPoint.length > 0 ? (
                                    <div className="space-y-2">
                                      {answersForThisPoint.map(({ task, answer }, aIdx) => (
                                        <div
                                          key={task.id}
                                          className="p-2.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs space-y-1"
                                        >
                                          <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-900">
                                            <span>
                                              {aIdx + 1}. {task.namaDpl} ({task.category})
                                            </span>
                                            <span className="text-[10px] text-slate-500 font-normal shrink-0">
                                              Pendamping: {task.fasilitator} &amp; {task.notulen}
                                            </span>
                                          </div>
                                          {/* Isian placed below and right-aligned */}
                                          <div className="text-right pl-4 pt-0.5">
                                            <div className="inline-block text-right text-xs text-slate-800 font-medium italic bg-blue-50/30 p-2.5 rounded-lg border border-blue-100/70 max-w-2xl whitespace-pre-wrap leading-relaxed shadow-2xs">
                                              "{answer}"
                                            </div>
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  ) : (
                                    <div className="p-3 text-center text-xs text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">
                                      (Belum ada buah percakapan yang diisikan untuk Poin {pointNum} ini)
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* Focus 2, 3, 4: 5 Questions / Points */
                  <div className="space-y-3.5">
                    {questions.map((qText, qIdx) => {
                      const pointNum = qIdx + 1;
                      const answersForThisPoint = focusTasks
                        .map((t) => ({
                          task: t,
                          answer: t.notulensiPoin?.[qIdx]?.trim() || '',
                        }))
                        .filter((item) => Boolean(item.answer));

                      return (
                        <div
                          key={qIdx}
                          className="p-3.5 rounded-xl border border-slate-200 bg-slate-50/40 space-y-2.5 shadow-2xs"
                        >
                          {/* Point Title Bar */}
                          <div className="flex items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
                            <div className="font-extrabold text-xs text-slate-900 flex items-center gap-2 flex-wrap">
                              <span className="w-5 h-5 rounded-full bg-slate-800 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                                {pointNum}
                              </span>
                              <span>Poin {pointNum}: {qText}</span>
                            </div>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-slate-200 text-slate-700 shrink-0">
                              {answersForThisPoint.length} Kunjungan
                            </span>
                          </div>

                          {/* List of responses */}
                          {answersForThisPoint.length > 0 ? (
                            <div className="space-y-2">
                              {answersForThisPoint.map(({ task, answer }, aIdx) => (
                                <div
                                  key={task.id}
                                  className="p-2.5 bg-white rounded-lg border border-slate-200/80 shadow-2xs space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-2 text-[11px] font-bold text-slate-900">
                                    <span>
                                      {aIdx + 1}. {task.namaDpl} ({task.category})
                                    </span>
                                    <span className="text-[10px] text-slate-500 font-normal shrink-0">
                                      Pendamping: {task.fasilitator} &amp; {task.notulen}
                                    </span>
                                  </div>
                                  {/* Isian placed below and right-aligned */}
                                  <div className="text-right pl-4 pt-0.5">
                                    <div className="inline-block text-right text-xs text-slate-800 font-medium italic bg-slate-50 p-2.5 rounded-lg border border-slate-200/80 max-w-2xl whitespace-pre-wrap leading-relaxed shadow-2xs">
                                      "{answer}"
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="p-3 text-center text-xs text-slate-400 italic bg-white rounded-lg border border-dashed border-slate-200">
                              (Belum ada buah percakapan yang diisikan untuk Poin {pointNum} ini)
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
