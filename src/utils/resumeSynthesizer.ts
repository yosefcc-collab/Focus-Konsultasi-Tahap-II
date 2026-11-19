import {
  TaskAssignment,
  FocusType,
  ResumeSection,
  ResumeSectionKey,
  ResumePointItem,
  ResumeSourceItem,
  SavedResumeData,
} from '../types';
import { getFocusPointTitles, getFocusTotalPoints } from '../data/initialData';

export interface ResumeSectionConfig {
  key: ResumeSectionKey;
  number: number;
  title: string;
  subtitle: string;
  targetCount: number;
}

export const RESUME_SECTION_CONFIGS: ResumeSectionConfig[] = [
  {
    key: 'pengalaman',
    number: 1,
    title: 'Tiga pengalaman utama yang paling sering atau paling kuat muncul',
    subtitle: 'Rangkuman pengalaman hidup menggereja dan perjumpaan dengan Sabda Allah dari berbagai Lingkungan & Kategorial.',
    targetCount: 3,
  },
  {
    key: 'rahmat',
    number: 2,
    title: 'Dua rahmat atau praktik baik yang perlu diteguhkan',
    subtitle: 'Karunia Roh, semangat solidaritas, dan kesaksian nyata yang sudah hidup serta patut terus dipelihara.',
    targetCount: 2,
  },
  {
    key: 'luka',
    number: 3,
    title: 'Dua luka atau kesenjangan yang paling mendesak',
    subtitle: 'Relasi yang retak, kelompok yang terabaikan, hambatan partisipasi, dan suara yang belum cukup didengar.',
    targetCount: 2,
  },
  {
    key: 'pertobatan',
    number: 4,
    title: 'Satu pertobatan yang terutama dituntut dari Lingkungan, Stasi, Paroki sendiri',
    subtitle: 'Pembaruan diri, sikap hati, dan kebiasaan komunitas yang perlu ditinggalkan sebelum menuntut pihak lain.',
    targetCount: 1,
  },
  {
    key: 'jembatan',
    number: 5,
    title: 'Satu jembatan pastoral yang paling perlu dibangun',
    subtitle: 'Langkah rekonsiliasi dan penghubung Koinonia, Kerygma-Liturgia, Diakonia, serta Martyria yang mendesak.',
    targetCount: 1,
  },
  {
    key: 'pesan_sinode',
    number: 6,
    title: 'Tiga pesan utama bagi Sidang Sinode Diosesan VII',
    subtitle: 'Suara dan harapan terpenting umat Paroki Katedral Medan untuk disampaikan kepada Sidang Sinode Diosesan VII.',
    targetCount: 3,
  },
];

const STOPWORDS = new Set([
  'yang', 'dan', 'di', 'ke', 'dari', 'untuk', 'dengan', 'pada', 'dalam', 'adalah',
  'tidak', 'belum', 'sudah', 'atau', 'juga', 'ini', 'itu', 'kita', 'kami', 'mereka',
  'anda', 'saya', 'aku', 'ia', 'dia', 'nya', 'sering', 'masih', 'lebih', 'agar',
  'supaya', 'sehingga', 'karena', 'oleh', 'bisa', 'dapat', 'harus', 'perlu', 'sangat',
  'secara', 'para', 'orang', 'hal', 'satu', 'dua', 'tiga', 'empat', 'lima', 'ada',
  'akan', 'telah', 'sedang', 'hanya', 'saja', 'bahkan', 'namun', 'tetapi', 'tapi',
  'jika', 'bila', 'kalau', 'ketika', 'saat', 'waktu', 'seperti', 'antara', 'terhadap',
  'tentang', 'mengenai', 'bagi', 'kepada', 'sebagai', 'menjadi', 'membuat', 'memberi',
  'banyak', 'sedikit', 'semua', 'seluruh', 'setiap', 'masing', 'beberapa', 'lain',
  'sendiri', 'sama', 'paling', 'utama', 'kurang', 'baik', 'buruk', 'lingkungan',
  'stasi', 'paroki', 'katedral', 'medan', 'gereja', 'umat', 'dpl', 'kategorial',
]);

interface ThemeBucket {
  id: string;
  label: string;
  keywords: string[];
}

const PASTORAL_THEMES: ThemeBucket[] = [
  {
    id: 'omk-anak-remaja',
    label: 'Pendampingan & Suara Orang Muda, Remaja, serta Anak',
    keywords: ['omk', 'muda', 'remaja', 'anak', 'sekami', 'misdinar', 'generasi', 'pelajar', 'mahasiswa', 'krisma', 'pemuda', 'pemudi'],
  },
  {
    id: 'keluarga-katekese',
    label: 'Ketahanan Iman Keluarga & Katekese Kontekstual',
    keywords: ['keluarga', 'ortu', 'orangtua', 'pasutri', 'suami', 'istri', 'rumah', 'tangga', 'katekese', 'pembinaan', 'pendalaman', 'iman', 'ajaran', 'katolik'],
  },
  {
    id: 'lansia-sakit-rentan',
    label: 'Perhatian bagi Lansia, Umat Sakit, Miskin & Terpinggirkan',
    keywords: ['lansia', 'sakit', 'tua', 'jompo', 'miskin', 'ekonomi', 'lemah', 'difabel', 'disabilitas', 'janda', 'duda', 'yatim', 'terpinggir', 'rentan', 'terlihat', 'bantuan', 'sembako', 'diakonia'],
  },
  {
    id: 'sabda-doa-ekaristi',
    label: 'Penghayatan Sabda Allah, Doa Lingkungan & Liturgi yang Hidup',
    keywords: ['sabda', 'kitab', 'suci', 'alkitab', 'firman', 'doa', 'rosario', 'ekaristi', 'misa', 'liturgi', 'sakramen', 'homili', 'khotbah', 'koor', 'lektor', 'pewartaan', 'kerygma'],
  },
  {
    id: 'koinonia-kebersamaan',
    label: 'Kebersamaan, Kunjungan Pastoral & Persaudaraan Komunitas',
    keywords: ['kebersamaan', 'bersama', 'kunjungan', 'mengunjungi', 'hadir', 'kehadiran', 'kompak', 'rukun', 'persaudaraan', 'koinonia', 'gotong', 'royong', 'saling', 'merangkul', 'terbuka'],
  },
  {
    id: 'komunikasi-rasa-aman',
    label: 'Keterbukaan Komunikasi, Ruang Mendengarkan & Rasa Aman',
    keywords: ['komunikasi', 'dengar', 'mendengar', 'mendengarkan', 'bicara', 'berbicara', 'aman', 'suara', 'kritik', 'dialog', 'relasi', 'konflik', 'jarak', 'tertutup', 'eksklusif', 'kelompok'],
  },
  {
    id: 'kepemimpinan-kaderisasi',
    label: 'Pembaruan Sikap Pengurus, Kaderisasi & Semangat Melayani',
    keywords: ['pengurus', 'ketua', 'pelayan', 'kaderisasi', 'regenerasi', 'monopoli', 'ego', 'sombong', 'hati', 'keteladanan', 'partisipasi', 'aktif', 'pasif', 'malas', 'apatis', 'komitmen'],
  },
  {
    id: 'martyria-sosial-ekologi',
    label: 'Kesaksian Hidup di Masyarakat Majemuk & Kepedulian Sosial',
    keywords: ['masyarakat', 'tetangga', 'lintas', 'agama', 'sosial', 'lingkungan hidup', 'ekologi', 'sampah', 'kesaksian', 'martyria', 'kerja', 'profesi', 'politik', 'publik', 'media'],
  },
  {
    id: 'pastor-paroki-struktur',
    label: 'Sinergi Pastor, DPL, Kategorial & Struktur Pendampingan Paroki',
    keywords: ['pastor', 'romo', 'imam', 'suster', 'biarawan', 'biarawati', 'dpp', 'pendampingan', 'pastoral', 'jadwal', 'waktu', 'akses', 'jarak', 'transportasi', 'birokrasi'],
  },
];

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/gi, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));
}

function splitMultiStatements(text: string): string[] {
  const trimmed = text.trim();
  if (!trimmed) return [];

  // Split by numbered lines (1., 2., 3.) or bullet markers at line starts or inline numbered patterns
  const lines = trimmed
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  if (lines.length > 1) {
    return lines
      .map((l) => l.replace(/^(\d+[.)]|[-•*])\s*/, '').trim())
      .filter((l) => l.length > 3);
  }

  // Check inline numbering like "1. ... 2. ... 3. ..."
  const inlineParts = trimmed.split(/(?=(?:^|\s)[1-3][.)]\s+)/).map((p) => p.replace(/^[1-3][.)]\s*/, '').trim()).filter((p) => p.length > 5);
  if (inlineParts.length > 1) {
    return inlineParts;
  }

  return [trimmed];
}

function mapSlotToSections(focusId: FocusType, subIdx: number): ResumeSectionKey[] {
  if (focusId === 'focus-1') {
    if (subIdx === 0) return ['pengalaman'];
    if (subIdx === 1) return ['rahmat'];
    if (subIdx === 2 || subIdx === 3) return ['luka'];
    if (subIdx === 4) return ['jembatan'];
  }
  if (focusId === 'focus-2') {
    if (subIdx === 0) return ['luka'];
    if (subIdx === 1) return ['pengalaman'];
    if (subIdx === 2 || subIdx === 3) return ['luka'];
    if (subIdx === 4) return ['jembatan'];
  }
  if (focusId === 'focus-3') {
    if (subIdx === 0 || subIdx === 2 || subIdx === 3) return ['luka'];
    if (subIdx === 1) return ['rahmat'];
    if (subIdx === 4) return ['jembatan'];
  }
  if (focusId === 'focus-4') {
    if (subIdx === 0) return ['rahmat'];
    if (subIdx === 1 || subIdx === 2) return ['pertobatan'];
    if (subIdx === 3) return ['jembatan'];
    if (subIdx === 4) return ['pesan_sinode'];
  }
  return [];
}

function getFocusNumber(focusId: FocusType): number {
  const num = parseInt(focusId.replace('focus-', ''), 10);
  return Number.isNaN(num) ? 1 : num;
}

function detectThemeBucket(text: string): ThemeBucket | null {
  const lower = text.toLowerCase();
  const tokens = new Set(tokenize(text));

  let bestTheme: ThemeBucket | null = null;
  let bestScore = 0;

  for (const theme of PASTORAL_THEMES) {
    let score = 0;
    for (const kw of theme.keywords) {
      if (kw.includes(' ')) {
        if (lower.includes(kw)) score += 2;
      } else if (tokens.has(kw) || lower.includes(kw)) {
        score += 1;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestTheme = theme;
    }
  }

  return bestScore > 0 ? bestTheme : null;
}

function jaccardSimilarity(tokensA: string[], tokensB: string[]): number {
  if (tokensA.length === 0 || tokensB.length === 0) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);
  let intersection = 0;
  setA.forEach((t) => {
    if (setB.has(t)) intersection++;
  });
  const union = setA.size + setB.size - intersection;
  return union > 0 ? intersection / union : 0;
}

interface EntryCluster {
  id: string;
  themeLabel: string;
  entries: ResumeSourceItem[];
  uniqueTaskIds: Set<string>;
  tokens: string[];
}

function clusterEntries(entries: ResumeSourceItem[]): EntryCluster[] {
  if (entries.length === 0) return [];

  const themeMap = new Map<string, EntryCluster>();
  const unclustered: ResumeSourceItem[] = [];

  for (const entry of entries) {
    const theme = detectThemeBucket(entry.text);
    if (theme) {
      const existing = themeMap.get(theme.id);
      if (existing) {
        existing.entries.push(entry);
        existing.uniqueTaskIds.add(entry.taskId);
        existing.tokens.push(...tokenize(entry.text));
      } else {
        themeMap.set(theme.id, {
          id: theme.id,
          themeLabel: theme.label,
          entries: [entry],
          uniqueTaskIds: new Set([entry.taskId]),
          tokens: tokenize(entry.text),
        });
      }
    } else {
      unclustered.push(entry);
    }
  }

  const clusters: EntryCluster[] = Array.from(themeMap.values());

  // Cluster remaining unclustered entries by Jaccard token similarity
  for (const entry of unclustered) {
    const entryTokens = tokenize(entry.text);
    let bestCluster: EntryCluster | null = null;
    let bestSim = 0;

    for (const cl of clusters) {
      const sim = jaccardSimilarity(entryTokens, cl.tokens);
      if (sim > bestSim && sim >= 0.18) {
        bestSim = sim;
        bestCluster = cl;
      }
    }

    if (bestCluster) {
      bestCluster.entries.push(entry);
      bestCluster.uniqueTaskIds.add(entry.taskId);
      bestCluster.tokens.push(...entryTokens);
    } else {
      const previewWords = entry.text.split(/\s+/).slice(0, 7).join(' ');
      const cleanLabel = previewWords.length < entry.text.length ? `${previewWords}...` : previewWords;
      clusters.push({
        id: `custom-${clusters.length + 1}`,
        themeLabel: cleanLabel,
        entries: [entry],
        uniqueTaskIds: new Set([entry.taskId]),
        tokens: entryTokens,
      });
    }
  }

  // Sort clusters by number of distinct Lingkungan/Kategorial first, then total entries, then combined text richness
  clusters.sort((a, b) => {
    if (b.uniqueTaskIds.size !== a.uniqueTaskIds.size) {
      return b.uniqueTaskIds.size - a.uniqueTaskIds.size;
    }
    if (b.entries.length !== a.entries.length) {
      return b.entries.length - a.entries.length;
    }
    const lenA = a.entries.reduce((s, e) => s + e.text.length, 0);
    const lenB = b.entries.reduce((s, e) => s + e.text.length, 0);
    return lenB - lenA;
  });

  return clusters;
}

function buildReadableTitle(cluster: EntryCluster, fallbackIndex: number): string {
  if (!cluster.id.startsWith('custom-')) {
    return cluster.themeLabel;
  }
  const firstText = cluster.entries[0]?.text || `Temuan Utama ${fallbackIndex}`;
  const firstSentence = firstText.split(/[.!?]/)[0]?.trim() || firstText;
  if (firstSentence.length <= 75) return firstSentence;
  return `${firstSentence.slice(0, 72).trim()}...`;
}

function buildClusterSummary(cluster: EntryCluster): string {
  // Deduplicate identical/near-identical texts while keeping informative ones
  const seen = new Set<string>();
  const uniqueStatements: Array<{ namaDpl: string; text: string }> = [];

  // Sort entries by length (prefer richer, well-articulated statements)
  const sortedEntries = [...cluster.entries].sort((a, b) => b.text.length - a.text.length);

  for (const e of sortedEntries) {
    const norm = e.text.toLowerCase().replace(/\s+/g, ' ').trim();
    if (!seen.has(norm)) {
      seen.add(norm);
      uniqueStatements.push({ namaDpl: e.namaDpl, text: e.text.trim() });
    }
  }

  const distinctTargets = Array.from(new Set(cluster.entries.map((e) => e.namaDpl)));
  const sourceList =
    distinctTargets.length <= 4
      ? distinctTargets.join(', ')
      : `${distinctTargets.slice(0, 4).join(', ')}, dan ${distinctTargets.length - 4} komunitas lainnya`;

  const topHighlights = uniqueStatements.slice(0, 3).map((s) => {
    const clean = s.text.replace(/\s+/g, ' ').trim();
    const ended = /[.!?]$/.test(clean) ? clean : `${clean}.`;
    return `${ended} (${s.namaDpl})`;
  });

  const prefix =
    distinctTargets.length > 1
      ? `Muncul secara konsisten di ${distinctTargets.length} komunitas (${sourceList}): `
      : `Disampaikan dari ${sourceList}: `;

  return `${prefix}${topHighlights.join(' ')}`;
}

/**
 * Extracts all entries from tasks and generates the synthesized 6-section Resume
 */
export function synthesizeResumeFromTasks(
  tasks: TaskAssignment[],
  savedOverrides?: SavedResumeData | null
): {
  sections: ResumeSection[];
  stats: {
    totalTasks: number;
    tasksWithBuah: number;
    completedTasks: number;
    totalParticipants: number;
    totalAnsweredPoints: number;
    lingkunganWithData: number;
    kategorialWithData: number;
  };
} {
  const sectionSources: Record<ResumeSectionKey, ResumeSourceItem[]> = {
    pengalaman: [],
    rahmat: [],
    luka: [],
    pertobatan: [],
    jembatan: [],
    pesan_sinode: [],
  };

  let totalAnsweredPoints = 0;
  let tasksWithBuah = 0;
  let completedTasks = 0;
  let totalParticipants = 0;
  let lingkunganWithData = 0;
  let kategorialWithData = 0;

  for (const task of tasks) {
    if (task.terlaksana || task.status === 'selesai') {
      completedTasks++;
    }
    const pesertaNum =
      typeof task.jumlahPeserta === 'number'
        ? task.jumlahPeserta
        : parseInt(String(task.jumlahPeserta || '0').replace(/\D/g, ''), 10);
    if (!Number.isNaN(pesertaNum) && pesertaNum > 0) {
      totalParticipants += pesertaNum;
    }

    const focusId: FocusType = task.focusId || 'focus-1';
    const focusNumber = getFocusNumber(focusId);
    const pointTitles = getFocusPointTitles(focusId);
    const totalSlots = getFocusTotalPoints(focusId);
    const points = task.notulensiPoin || [];

    let taskHasPoint = false;

    for (let slot = 0; slot < Math.min(points.length, totalSlots); slot++) {
      const rawVal = (points[slot] || '').trim();
      if (!rawVal) continue;

      taskHasPoint = true;
      totalAnsweredPoints++;

      const questionNumber = Math.floor(slot / 5) + 1;
      const subIdx = slot % 5;
      const pointTitle = pointTitles[subIdx] || `Butir ${subIdx + 1}`;
      const targetSections = mapSlotToSections(focusId, subIdx);

      for (const secKey of targetSections) {
        if (secKey === 'pesan_sinode' || secKey === 'pengalaman') {
          const splitItems = splitMultiStatements(rawVal);
          for (const part of splitItems) {
            sectionSources[secKey].push({
              taskId: task.id,
              namaDpl: task.namaDpl,
              category: task.category,
              focusId,
              focusNumber,
              questionNumber,
              pointTitle,
              text: part,
            });
          }
        } else {
          sectionSources[secKey].push({
            taskId: task.id,
            namaDpl: task.namaDpl,
            category: task.category,
            focusId,
            focusNumber,
            questionNumber,
            pointTitle,
            text: rawVal,
          });
        }
      }
    }

    // Also include general catatan if filled as additional experiential context
    if (task.catatan && task.catatan.trim()) {
      taskHasPoint = true;
      sectionSources.pengalaman.push({
        taskId: task.id,
        namaDpl: task.namaDpl,
        category: task.category,
        focusId,
        focusNumber,
        questionNumber: 0,
        pointTitle: 'Catatan Umum Pertemuan',
        text: task.catatan.trim(),
      });
    }

    if (taskHasPoint) {
      tasksWithBuah++;
      if (task.category === 'Lingkungan') lingkunganWithData++;
      else kategorialWithData++;
    }
  }

  const sections: ResumeSection[] = RESUME_SECTION_CONFIGS.map((cfg) => {
    const rawEntries = sectionSources[cfg.key];
    const clusters = clusterEntries(rawEntries);
    const selectedClusters = clusters.slice(0, cfg.targetCount);

    // If fewer clusters than targetCount, check if we can split remaining multi-entry cluster into distinct highlights
    const items: ResumePointItem[] = [];
    const usedFallbackKeys = new Set<string>();

    // Mark the first entry of each selected cluster as already represented
    selectedClusters.forEach((cl) => {
      const lead = cl.entries[0];
      if (lead) {
        usedFallbackKeys.add(`${lead.taskId}::${lead.text}`);
      }
    });

    for (let i = 0; i < cfg.targetCount; i++) {
      const itemId = `${cfg.key}-${i + 1}`;
      const cluster = selectedClusters[i];

      let autoTitle = '';
      let autoSummary = '';
      let freq = 0;
      let sources: ResumeSourceItem[] = [];

      if (cluster) {
        autoTitle = buildReadableTitle(cluster, i + 1);
        autoSummary = buildClusterSummary(cluster);
        freq = cluster.uniqueTaskIds.size;
        sources = cluster.entries;
      } else if (rawEntries.length > i) {
        // Fallback: surface another distinct statement from rawEntries not yet used as a primary item
        const unusedEntry = rawEntries.find(
          (e) => !usedFallbackKeys.has(`${e.taskId}::${e.text}`)
        );
        if (unusedEntry) {
          usedFallbackKeys.add(`${unusedEntry.taskId}::${unusedEntry.text}`);
          const preview = unusedEntry.text.split(/[.!?]/)[0]?.trim() || unusedEntry.text;
          autoTitle = preview.length <= 75 ? preview : `${preview.slice(0, 72)}...`;
          autoSummary = `Disampaikan dari ${unusedEntry.namaDpl}: ${unusedEntry.text}`;
          freq = 1;
          sources = [unusedEntry];
        }
      }

      // Check saved override if user edited it
      const savedSec = savedOverrides?.isManuallyEdited
        ? savedOverrides.sections?.find((s) => s.key === cfg.key)
        : undefined;
      const savedItem = savedSec?.items?.find((it) => it.id === itemId);

      items.push({
        id: itemId,
        title: savedItem?.title !== undefined ? savedItem.title : autoTitle,
        summary: savedItem?.summary !== undefined ? savedItem.summary : autoSummary,
        frequencyCount: freq,
        sources,
      });
    }

    return {
      key: cfg.key,
      number: cfg.number,
      title: cfg.title,
      subtitle: cfg.subtitle,
      targetCount: cfg.targetCount,
      items,
      allSources: rawEntries,
    };
  });

  return {
    sections,
    stats: {
      totalTasks: tasks.length,
      tasksWithBuah,
      completedTasks,
      totalParticipants,
      totalAnsweredPoints,
      lingkunganWithData,
      kategorialWithData,
    },
  };
}
