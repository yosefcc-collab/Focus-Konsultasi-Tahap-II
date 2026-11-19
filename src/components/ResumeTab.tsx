import React, { useState, useMemo, useEffect } from 'react';
import {
  FileDown,
  Copy,
  Check,
  Edit3,
  Save,
  ChevronDown,
  ChevronUp,
  ScrollText,
  BookOpen,
  AlertCircle,
  ExternalLink,
  RefreshCw,
} from 'lucide-react';
import {
  TaskAssignment,
  SavedResumeData,
  ResumeSection,
} from '../types';
import { synthesizeResumeFromTasks } from '../utils/resumeSynthesizer';
import { generateResumeWordDocument } from '../utils/wordGenerator';

interface ResumeTabProps {
  tasks: TaskAssignment[];
  savedResume: SavedResumeData | null;
  onSaveResume: (resumeData: SavedResumeData) => Promise<void>;
  onResetResumeToAuto: () => Promise<void>;
  onEditTask: (task: TaskAssignment) => void;
  onGoToBuahPercakapan: () => void;
}

const ROMANS = ['I', 'II', 'III', 'IV', 'V', 'VI'];

export const ResumeTab: React.FC<ResumeTabProps> = ({
  tasks,
  savedResume,
  onSaveResume,
  onResetResumeToAuto,
  onEditTask,
  onGoToBuahPercakapan,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloadingWord, setIsDownloadingWord] = useState(false);
  const [copied, setCopied] = useState(false);
  const [includeSourcesDetail, setIncludeSourcesDetail] = useState(true);
  const [includeAppendixTable, setIncludeAppendixTable] = useState(true);
  const [expandedSources, setExpandedSources] = useState<Record<string, boolean>>({});
  const [expandedAllSectionSources, setExpandedAllSectionSources] = useState<Record<string, boolean>>({});

  // Synthesize live data + apply any curated saved overrides
  const { sections, stats } = useMemo(
    () => synthesizeResumeFromTasks(tasks, savedResume),
    [tasks, savedResume]
  );

  // Draft state when editing
  const [draftValues, setDraftValues] = useState<
    Record<string, { title: string; summary: string }>
  >({});

  useEffect(() => {
    const initialDraft: Record<string, { title: string; summary: string }> = {};
    sections.forEach((sec) => {
      sec.items.forEach((it) => {
        initialDraft[it.id] = {
          title: it.title,
          summary: it.summary,
        };
      });
    });
    setDraftValues(initialDraft);
  }, [sections, isEditing]);

  const toggleItemSources = (itemId: string) => {
    setExpandedSources((prev) => ({
      ...prev,
      [itemId]: !prev[itemId],
    }));
  };

  const toggleSectionAllSources = (secKey: string) => {
    setExpandedAllSectionSources((prev) => ({
      ...prev,
      [secKey]: !prev[secKey],
    }));
  };

  const handleDraftChange = (itemId: string, field: 'title' | 'summary', value: string) => {
    setDraftValues((prev) => ({
      ...prev,
      [itemId]: {
        title: field === 'title' ? value : prev[itemId]?.title || '',
        summary: field === 'summary' ? value : prev[itemId]?.summary || '',
      },
    }));
  };

  const handleSaveEdits = async () => {
    setIsSaving(true);
    try {
      const payload: SavedResumeData = {
        sections: sections.map((sec) => ({
          key: sec.key,
          items: sec.items.map((it) => ({
            id: it.id,
            title: draftValues[it.id]?.title ?? it.title,
            summary: draftValues[it.id]?.summary ?? it.summary,
          })),
        })),
        isManuallyEdited: true,
        updatedAt: new Date().toISOString(),
        updatedBy: 'Tim Sinodal Paroki Katedral Medan',
      };
      await onSaveResume(payload);
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetAuto = async () => {
    setIsSaving(true);
    try {
      await onResetResumeToAuto();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDownloadWord = async () => {
    setIsDownloadingWord(true);
    try {
      await generateResumeWordDocument({
        sections,
        tasks,
        stats,
        includeSourcesDetail,
        includeAppendixTable,
      });
    } catch (err) {
      console.error('Error generating Word document:', err);
    } finally {
      setIsDownloadingWord(false);
    }
  };

  const handleCopyPlainText = async () => {
    const lines: string[] = [];
    lines.push('========================================================');
    lines.push('PAROKI ST. PERAWAN MARIA DIKANDUNG TANPA NODA – KATEDRAL MEDAN');
    lines.push('RESUME HASIL KONSULTASI TIM SINODAL PAROKI');
    lines.push('Menuju Sidang Sinode Diosesan VII Keuskupan Agung Medan');
    lines.push('========================================================');
    lines.push(
      `Cakupan Data: ${stats.tasksWithBuah}/${stats.totalTasks} Kunjungan (${stats.lingkunganWithData} Lingkungan, ${stats.kategorialWithData} Kategorial) • ${stats.totalParticipants} Umat • ${stats.totalAnsweredPoints} Butir Jawaban`
    );
    lines.push('');

    sections.forEach((sec) => {
      lines.push(`${ROMANS[sec.number - 1]}. ${sec.title.toUpperCase()}`);
      sec.items.forEach((it, idx) => {
        const prefix = sec.targetCount > 1 ? `${idx + 1}. ` : '';
        if (!it.title.trim() && !it.summary.trim()) {
          lines.push(`   ${prefix}(Menunggu data masukan tim)`);
        } else {
          lines.push(`   ${prefix}${it.title}`);
          if (it.summary.trim()) {
            lines.push(`      ${it.summary.trim()}`);
          }
          if (includeSourcesDetail && it.sources.length > 0) {
            const communities = Array.from(new Set(it.sources.map((s) => s.namaDpl)));
            lines.push(`      Sumber: ${communities.join(', ')}`);
          }
        }
      });
      lines.push('');
    });

    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Failed to copy resume text:', err);
    }
  };

  const openTaskById = (taskId: string) => {
    const found = tasks.find((t) => t.id === taskId);
    if (found) onEditTask(found);
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Header Banner */}
      <div className="bg-linear-to-r from-red-900 via-red-800 to-amber-900 rounded-2xl p-5 text-white shadow-md">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="text-xs font-bold uppercase tracking-wider text-amber-300 flex items-center gap-1.5">
              <ScrollText className="w-4 h-4" />
              <span>Sintesis Paroki Menuju Sidang Sinode Diosesan VII</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Resume Hasil Konsultasi Tim Sinodal
            </h2>
            <p className="text-xs sm:text-sm text-red-100 max-w-2xl leading-relaxed">
              Rangkuman otomatis dari seluruh data Lingkungan &amp; Kategorial yang telah dimasukkan
              oleh tim pendamping ke dalam sistem, siap disempurnakan dan diunduh dalam format Microsoft Word (.docx).
            </p>
          </div>

          {/* Primary Actions */}
          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleCopyPlainText}
              className="py-2 px-3.5 rounded-xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs flex items-center gap-1.5 border border-white/25 transition cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-300" /> : <Copy className="w-3.5 h-3.5 text-amber-300" />}
              <span>{copied ? 'Tersalin!' : 'Salin Teks'}</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadWord}
              disabled={isDownloadingWord}
              className="py-2.5 px-4 rounded-xl bg-amber-400 hover:bg-amber-300 disabled:opacity-60 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md transition cursor-pointer active:scale-95"
            >
              <FileDown className="w-4 h-4" />
              <span>{isDownloadingWord ? 'Menyiapkan Word...' : 'Download Word (.docx)'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Data Coverage Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-2xs space-y-3">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">Kunjungan Mengisi Data</div>
            <div className="text-lg font-extrabold text-slate-900 mt-0.5">
              {stats.tasksWithBuah} <span className="text-xs font-medium text-slate-500">/ {stats.totalTasks}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">
              {stats.lingkunganWithData} Lingkungan · {stats.kategorialWithData} Kategorial
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">Kunjungan Terlaksana</div>
            <div className="text-lg font-extrabold text-emerald-700 mt-0.5">
              {stats.completedTasks} <span className="text-xs font-medium text-slate-500">/ {stats.totalTasks}</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Konsultasi lapangan selesai</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">Total Umat Terdata</div>
            <div className="text-lg font-extrabold text-blue-700 mt-0.5">
              {stats.totalParticipants} <span className="text-xs font-medium text-slate-500">jiwa</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Peserta konsultasi sinodal</div>
          </div>

          <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
            <div className="text-[11px] font-semibold text-slate-500">Butir Teranalisis</div>
            <div className="text-lg font-extrabold text-amber-700 mt-0.5">
              {stats.totalAnsweredPoints} <span className="text-xs font-medium text-slate-500">butir</span>
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Masukan dari seluruh fokus</div>
          </div>
        </div>

        {/* Toolbar: Word Options + Edit / Re-sync Controls */}
        <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-4 text-slate-700">
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={includeSourcesDetail}
                onChange={(e) => setIncludeSourcesDetail(e.target.checked)}
                className="rounded border-slate-300 text-red-700 focus:ring-red-600 w-4 h-4 cursor-pointer"
              />
              <span>Cantumkan sumber komunitas di Word</span>
            </label>
            <label className="inline-flex items-center gap-1.5 cursor-pointer select-none font-medium">
              <input
                type="checkbox"
                checked={includeAppendixTable}
                onChange={(e) => setIncludeAppendixTable(e.target.checked)}
                className="rounded border-slate-300 text-red-700 focus:ring-red-600 w-4 h-4 cursor-pointer"
              />
              <span>Sertakan lampiran tabel 21 kunjungan</span>
            </label>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {savedResume?.isManuallyEdited ? (
              <button
                type="button"
                onClick={handleResetAuto}
                disabled={isSaving}
                className="py-1.5 px-3 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs flex items-center gap-1.5 transition cursor-pointer"
                title="Hapus suntingan manual dan rangkum ulang otomatis dari seluruh data tim terbaru"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Generate Ulang dari Data Tim</span>
              </button>
            ) : null}

            {!isEditing ? (
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="py-1.5 px-3.5 rounded-lg bg-red-800 hover:bg-red-700 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Sempurnakan / Edit Rumusan</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  disabled={isSaving}
                  className="py-1.5 px-3 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition cursor-pointer"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdits}
                  disabled={isSaving}
                  className="py-1.5 px-3.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan Rumusan Final'}</span>
                </button>
              </>
            )}
          </div>
        </div>

        {/* Status Note */}
        <div className="text-[11px] text-slate-500 flex flex-wrap items-center justify-between gap-2">
          <span>
            {savedResume?.isManuallyEdited
              ? `Mode Rumusan Disempurnakan · Terakhir disimpan ${
                  savedResume.updatedAt
                    ? new Date(savedResume.updatedAt).toLocaleString('id-ID')
                    : 'di Cloud'
                }`
              : 'Mode Sintesis Otomatis · Diperbarui langsung setiap kali tim menambahkan data Buah Percakapan.'}
          </span>
        </div>
      </div>

      {/* Empty data notice if no team input yet */}
      {stats.totalAnsweredPoints === 0 && !savedResume?.isManuallyEdited && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-amber-950">
          <div className="flex items-start gap-2.5">
            <AlertCircle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <div className="font-bold text-sm">Belum ada isian Buah Percakapan dari tim</div>
              <p className="text-amber-900 leading-relaxed">
                Resume akan otomatis terisi dan merangkum tema yang paling sering muncul begitu
                Fasilitator atau Notulen mengisi hasil konsultasi di tiap kunjungan Lingkungan &amp; Kategorial.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onGoToBuahPercakapan}
            className="py-2 px-3.5 rounded-xl bg-amber-900 hover:bg-amber-800 text-white font-bold text-xs shrink-0 flex items-center gap-1.5 cursor-pointer self-start sm:self-center"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Buka Buah Percakapan</span>
          </button>
        </div>
      )}

      {/* 6 Resume Sections */}
      <div className="space-y-4">
        {sections.map((section: ResumeSection) => {
          const distinctAllCommunities = Array.from(
            new Set(section.allSources.map((s) => s.namaDpl))
          );
          const isAllRawOpen = Boolean(expandedAllSectionSources[section.key]);

          return (
            <section
              key={section.key}
              className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden"
            >
              {/* Section Header */}
              <div className="p-4 sm:p-5 bg-slate-50/80 border-b border-slate-200 flex flex-col sm:flex-row sm:items-start justify-between gap-2">
                <div className="space-y-1">
                  <div className="text-xs font-bold uppercase tracking-wider text-red-800">
                    Bagian {ROMANS[section.number - 1]} · Target {section.targetCount} Butir Utama
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-slate-900 leading-snug">
                    {section.number}. {section.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {section.subtitle}
                  </p>
                </div>

                <div className="text-[11px] font-semibold text-slate-600 shrink-0 sm:text-right">
                  <div>{section.allSources.length} masukan terhimpun</div>
                  <div className="text-slate-400">
                    dari {distinctAllCommunities.length} komunitas
                  </div>
                </div>
              </div>

              {/* Section Items */}
              <div className="p-4 sm:p-5 space-y-3.5">
                {section.items.map((item, idx) => {
                  const hasContent = Boolean(item.title.trim() || item.summary.trim());
                  const isSourcesOpen = Boolean(expandedSources[item.id]);
                  const draft = draftValues[item.id] || {
                    title: item.title,
                    summary: item.summary,
                  };
                  const distinctItemCommunities = Array.from(
                    new Set(item.sources.map((s) => s.namaDpl))
                  );

                  return (
                    <div
                      key={item.id}
                      className={`rounded-xl border p-3.5 sm:p-4 transition ${
                        hasContent || isEditing
                          ? 'bg-white border-slate-200'
                          : 'bg-slate-50/50 border-dashed border-slate-200'
                      }`}
                    >
                      {isEditing ? (
                        <div className="space-y-2.5">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={draft.title}
                              onChange={(e) => handleDraftChange(item.id, 'title', e.target.value)}
                              placeholder={`Judul pokok poin ${idx + 1}...`}
                              className="flex-1 px-3 py-1.5 text-sm font-bold text-slate-900 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden"
                            />
                          </div>
                          <textarea
                            rows={3}
                            value={draft.summary}
                            onChange={(e) => handleDraftChange(item.id, 'summary', e.target.value)}
                            placeholder={`Tuliskan rumusan sintesis poin ${idx + 1}...`}
                            className="w-full px-3 py-2 text-xs sm:text-sm text-slate-800 rounded-lg border border-slate-300 focus:ring-2 focus:ring-red-600 outline-hidden leading-relaxed"
                          />
                        </div>
                      ) : hasContent ? (
                        <div className="space-y-2">
                          <div className="flex items-start gap-2.5">
                            <span className="w-6 h-6 rounded-full bg-red-800 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                              {idx + 1}
                            </span>
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex flex-wrap items-baseline justify-between gap-2">
                                <h4 className="text-sm sm:text-base font-bold text-slate-900 leading-snug">
                                  {item.title}
                                </h4>
                                {item.frequencyCount > 0 && (
                                  <span className="text-[11px] font-semibold text-amber-800 shrink-0">
                                    Muncul di {item.frequencyCount} komunitas
                                  </span>
                                )}
                              </div>

                              {item.summary && (
                                <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                                  {item.summary}
                                </p>
                              )}

                              {distinctItemCommunities.length > 0 && (
                                <div className="pt-1 flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-500">
                                  <span>
                                    Sumber: {distinctItemCommunities.join(' · ')}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => toggleItemSources(item.id)}
                                    className="text-red-800 hover:text-red-900 font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    <span>
                                      {isSourcesOpen
                                        ? 'Tutup kutipan sumber'
                                        : `Lihat ${item.sources.length} kutipan sumber`}
                                    </span>
                                    {isSourcesOpen ? (
                                      <ChevronUp className="w-3.5 h-3.5" />
                                    ) : (
                                      <ChevronDown className="w-3.5 h-3.5" />
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Collapsible item-level verbatim quotes */}
                          {isSourcesOpen && item.sources.length > 0 && (
                            <div className="mt-2 ml-8 pl-3 border-l-2 border-red-200 space-y-2">
                              {item.sources.map((src, sIdx) => (
                                <div
                                  key={`${src.taskId}-${sIdx}`}
                                  className="p-2.5 rounded-lg bg-slate-50 border border-slate-200/80 text-xs space-y-1"
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="font-bold text-slate-800">
                                      {src.namaDpl} · Fokus {src.focusNumber} · {src.pointTitle}
                                    </span>
                                    <button
                                      type="button"
                                      onClick={() => openTaskById(src.taskId)}
                                      className="text-[11px] text-blue-700 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer shrink-0"
                                    >
                                      <span>Edit Kunjungan</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </button>
                                  </div>
                                  <p className="text-slate-700 italic leading-relaxed">
                                    "{src.text}"
                                  </p>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-2.5 text-xs text-slate-400 italic">
                          <span className="w-6 h-6 rounded-full bg-slate-200 text-slate-600 font-bold text-xs flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <span>
                            Menunggu data masukan tim dari kunjungan Lingkungan / Kategorial.
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}

                {/* Drawer showing ALL raw team entries mapped to this section */}
                {section.allSources.length > 0 && (
                  <div className="pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => toggleSectionAllSources(section.key)}
                      className="text-xs font-bold text-slate-600 hover:text-red-800 inline-flex items-center gap-1.5 cursor-pointer"
                    >
                      {isAllRawOpen ? (
                        <ChevronUp className="w-3.5 h-3.5" />
                      ) : (
                        <ChevronDown className="w-3.5 h-3.5" />
                      )}
                      <span>
                        {isAllRawOpen
                          ? `Sembunyikan seluruh data masukan untuk Bagian ${ROMANS[section.number - 1]}`
                          : `Lihat seluruh ${section.allSources.length} data masukan tim untuk Bagian ${ROMANS[section.number - 1]}`}
                      </span>
                    </button>

                    {isAllRawOpen && (
                      <div className="mt-2.5 space-y-2 max-h-96 overflow-y-auto pr-1">
                        {section.allSources.map((src, idx) => (
                          <div
                            key={`${src.taskId}-all-${idx}`}
                            className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1"
                          >
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <span className="font-bold text-slate-800">
                                {idx + 1}. {src.namaDpl} ({src.category}) · Fokus {src.focusNumber} ·{' '}
                                {src.pointTitle}
                              </span>
                              <button
                                type="button"
                                onClick={() => openTaskById(src.taskId)}
                                className="text-[11px] text-blue-700 hover:underline font-semibold inline-flex items-center gap-1 cursor-pointer"
                              >
                                <span>Buka Data</span>
                                <ExternalLink className="w-3 h-3" />
                              </button>
                            </div>
                            <p className="text-slate-700 leading-relaxed">"{src.text}"</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
};
