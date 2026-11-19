import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableRow,
  TableCell,
  WidthType,
  AlignmentType,
  BorderStyle,
  ShadingType,
  Header,
  Footer,
  PageNumber,
  convertInchesToTwip,
} from 'docx';
import { ResumeSection, TaskAssignment } from '../types';
import { formatIndonesianDate } from '../data/initialData';

interface WordResumeOptions {
  sections: ResumeSection[];
  tasks: TaskAssignment[];
  stats: {
    totalTasks: number;
    tasksWithBuah: number;
    completedTasks: number;
    totalParticipants: number;
    totalAnsweredPoints: number;
    lingkunganWithData: number;
    kategorialWithData: number;
  };
  includeSourcesDetail?: boolean;
  includeAppendixTable?: boolean;
}

const CRIMSON = '991B1B';
const AMBER_DARK = '92400E';
const SLATE_DARK = '0F172A';
const SLATE_MED = '475569';
const SLATE_LIGHT = 'F8FAFC';
const BORDER_GRAY = 'CBD5E1';
const FONT_FAMILY = 'Calibri';

function getRomanNumeral(num: number): string {
  const romans = ['I', 'II', 'III', 'IV', 'V', 'VI'];
  return romans[num - 1] || String(num);
}

function makeCell(
  text: string,
  opts?: {
    bold?: boolean;
    color?: string;
    fill?: string;
    align?: (typeof AlignmentType)[keyof typeof AlignmentType];
    widthPercent?: number;
    fontSize?: number;
  }
): TableCell {
  return new TableCell({
    width: opts?.widthPercent
      ? { size: opts.widthPercent, type: WidthType.PERCENTAGE }
      : undefined,
    shading: opts?.fill
      ? { type: ShadingType.CLEAR, color: 'auto', fill: opts.fill }
      : undefined,
    margins: {
      top: 90,
      bottom: 90,
      left: 120,
      right: 120,
    },
    children: [
      new Paragraph({
        alignment: opts?.align ?? AlignmentType.LEFT,
        spacing: { before: 0, after: 0 },
        children: [
          new TextRun({
            text,
            font: FONT_FAMILY,
            size: opts?.fontSize ?? 19,
            bold: opts?.bold ?? false,
            color: opts?.color ?? SLATE_DARK,
          }),
        ],
      }),
    ],
  });
}

export async function generateResumeWordDocument({
  sections,
  tasks,
  stats,
  includeSourcesDetail = true,
  includeAppendixTable = true,
}: WordResumeOptions): Promise<void> {
  const now = new Date();
  const dateLabel = now.toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const children: (Paragraph | Table)[] = [];

  // ==========================================================
  // 1. KOP DOKUMEN RESMI PAROKI
  // ==========================================================
  children.push(
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 40 },
      children: [
        new TextRun({
          text: 'KEUSKUPAN AGUNG MEDAN',
          font: FONT_FAMILY,
          size: 22,
          bold: true,
          color: AMBER_DARK,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 0, after: 60 },
      children: [
        new TextRun({
          text: 'PAROKI ST. PERAWAN MARIA DIKANDUNG TANPA NODA – KATEDRAL MEDAN',
          font: FONT_FAMILY,
          size: 26,
          bold: true,
          color: CRIMSON,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 40, after: 40 },
      border: {
        bottom: {
          color: CRIMSON,
          space: 6,
          style: BorderStyle.DOUBLE,
          size: 12,
        },
      },
      children: [
        new TextRun({
          text: 'RESUME HASIL KONSULTASI TIM SINODAL PAROKI',
          font: FONT_FAMILY,
          size: 28,
          bold: true,
          color: SLATE_DARK,
        }),
      ],
    }),
    new Paragraph({
      alignment: AlignmentType.CENTER,
      spacing: { before: 80, after: 220 },
      children: [
        new TextRun({
          text: 'Rangkuman Seluruh Masukan Lingkungan & Kategorial Menuju Sidang Sinode Diosesan VII',
          font: FONT_FAMILY,
          size: 21,
          italics: true,
          color: SLATE_MED,
        }),
      ],
    })
  );

  // ==========================================================
  // 2. TABEL RINGKASAN DATA INPUT TIM
  // ==========================================================
  children.push(
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
        bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
        left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
        right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
        insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
        insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
      },
      rows: [
        new TableRow({
          children: [
            makeCell('Tanggal Penyusunan Dokumen', { bold: true, fill: SLATE_LIGHT, widthPercent: 35, fontSize: 19 }),
            makeCell(dateLabel, { widthPercent: 65, fontSize: 19 }),
          ],
        }),
        new TableRow({
          children: [
            makeCell('Cakupan Data Lingkungan & Kategorial', { bold: true, fill: SLATE_LIGHT, widthPercent: 35, fontSize: 19 }),
            makeCell(
              `${stats.tasksWithBuah} dari ${stats.totalTasks} Kunjungan telah mengisi Buah Percakapan (${stats.lingkunganWithData} Lingkungan, ${stats.kategorialWithData} Kategorial)`,
              { widthPercent: 65, fontSize: 19 }
            ),
          ],
        }),
        new TableRow({
          children: [
            makeCell('Status Pelaksanaan & Partisipasi Umat', { bold: true, fill: SLATE_LIGHT, widthPercent: 35, fontSize: 19 }),
            makeCell(
              `${stats.completedTasks} Kunjungan Terlaksana • ${stats.totalParticipants} Umat Terdata • ${stats.totalAnsweredPoints} Butir Buah Percakapan Terhimpun`,
              { widthPercent: 65, fontSize: 19 }
            ),
          ],
        }),
      ],
    }),
    new Paragraph({ spacing: { before: 160, after: 120 }, children: [] })
  );

  // ==========================================================
  // 3. ENAM BAGIAN UTAMA RESUME SINODAL
  // ==========================================================
  sections.forEach((section) => {
    // Section Header Bar
    children.push(
      new Paragraph({
        spacing: { before: 200, after: 60 },
        shading: { type: ShadingType.CLEAR, color: 'auto', fill: 'FEF2F2' },
        border: {
          left: { color: CRIMSON, space: 8, style: BorderStyle.SINGLE, size: 24 },
          bottom: { color: 'FECACA', space: 4, style: BorderStyle.SINGLE, size: 6 },
        },
        children: [
          new TextRun({
            text: `  ${getRomanNumeral(section.number)}. ${section.title.toUpperCase()}`,
            font: FONT_FAMILY,
            size: 23,
            bold: true,
            color: CRIMSON,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 20, after: 120 },
        children: [
          new TextRun({
            text: section.subtitle,
            font: FONT_FAMILY,
            size: 19,
            italics: true,
            color: SLATE_MED,
          }),
        ],
      })
    );

    const hasAnyContent = section.items.some((it) => it.title.trim() || it.summary.trim());

    if (!hasAnyContent) {
      children.push(
        new Paragraph({
          spacing: { before: 40, after: 140 },
          indent: { left: convertInchesToTwip(0.25) },
          children: [
            new TextRun({
              text: '(Belum ada data buah percakapan yang masuk untuk bagian ini.)',
              font: FONT_FAMILY,
              size: 20,
              italics: true,
              color: SLATE_MED,
            }),
          ],
        })
      );
      return;
    }

    section.items.forEach((item, idx) => {
      const hasItemData = Boolean(item.title.trim() || item.summary.trim());
      if (!hasItemData) {
        children.push(
          new Paragraph({
            spacing: { before: 40, after: 80 },
            indent: { left: convertInchesToTwip(0.25) },
            children: [
              new TextRun({
                text: `${idx + 1}. (Menunggu tambahan data masukan dari Lingkungan/Kategorial)`,
                font: FONT_FAMILY,
                size: 20,
                italics: true,
                color: SLATE_MED,
              }),
            ],
          })
        );
        return;
      }

      // Item Title
      const prefixNumber = section.targetCount > 1 ? `${idx + 1}. ` : '';
      children.push(
        new Paragraph({
          spacing: { before: 80, after: 40 },
          indent: { left: convertInchesToTwip(0.2) },
          children: [
            new TextRun({
              text: `${prefixNumber}${item.title || 'Pokok Temuan'}`,
              font: FONT_FAMILY,
              size: 22,
              bold: true,
              color: SLATE_DARK,
            }),
            ...(item.frequencyCount > 0
              ? [
                  new TextRun({
                    text: `  [${item.frequencyCount} Komunitas]`,
                    font: FONT_FAMILY,
                    size: 18,
                    bold: true,
                    color: AMBER_DARK,
                  }),
                ]
              : []),
          ],
        })
      );

      // Item Summary Narrative
      if (item.summary.trim()) {
        children.push(
          new Paragraph({
            spacing: { before: 20, after: 60 },
            indent: { left: convertInchesToTwip(0.35) },
            alignment: AlignmentType.JUSTIFIED,
            children: [
              new TextRun({
                text: item.summary.trim(),
                font: FONT_FAMILY,
                size: 21,
                color: SLATE_DARK,
              }),
            ],
          })
        );
      }

      // Optional Source Citations
      if (includeSourcesDetail && item.sources.length > 0) {
        const distinctSources = Array.from(new Set(item.sources.map((s) => s.namaDpl)));
        children.push(
          new Paragraph({
            spacing: { before: 10, after: 90 },
            indent: { left: convertInchesToTwip(0.35) },
            children: [
              new TextRun({
                text: 'Sumber Komunitas: ',
                font: FONT_FAMILY,
                size: 18,
                bold: true,
                color: SLATE_MED,
              }),
              new TextRun({
                text: distinctSources.join(' • '),
                font: FONT_FAMILY,
                size: 18,
                italics: true,
                color: SLATE_MED,
              }),
            ],
          })
        );
      }
    });
  });

  // ==========================================================
  // 4. LAMPIRAN TABEL PARTISIPASI 21 KUNJUNGAN (OPSIONAL)
  // ==========================================================
  if (includeAppendixTable) {
    children.push(
      new Paragraph({
        pageBreakBefore: true,
        spacing: { before: 0, after: 80 },
        children: [
          new TextRun({
            text: 'LAMPIRAN: REKAPITULASI DATA MASUKAN 21 LINGKUNGAN & KATEGORIAL',
            font: FONT_FAMILY,
            size: 23,
            bold: true,
            color: CRIMSON,
          }),
        ],
      }),
      new Paragraph({
        spacing: { before: 0, after: 140 },
        children: [
          new TextRun({
            text: 'Daftar status pengisian data oleh Tim Pendamping (Fasilitator & Notulen) yang menjadi dasar penyusunan Resume Sinodal Paroki Katedral Medan.',
            font: FONT_FAMILY,
            size: 19,
            italics: true,
            color: SLATE_MED,
          }),
        ],
      })
    );

    const headerRow = new TableRow({
      tableHeader: true,
      children: [
        makeCell('No', { bold: true, color: 'FFFFFF', fill: CRIMSON, align: AlignmentType.CENTER, widthPercent: 6, fontSize: 18 }),
        makeCell('Lingkungan / Kategorial', { bold: true, color: 'FFFFFF', fill: CRIMSON, widthPercent: 28, fontSize: 18 }),
        makeCell('Fokus', { bold: true, color: 'FFFFFF', fill: CRIMSON, align: AlignmentType.CENTER, widthPercent: 10, fontSize: 18 }),
        makeCell('Pendamping', { bold: true, color: 'FFFFFF', fill: CRIMSON, widthPercent: 22, fontSize: 18 }),
        makeCell('Pelaksanaan', { bold: true, color: 'FFFFFF', fill: CRIMSON, widthPercent: 18, fontSize: 18 }),
        makeCell('Butir Terisi', { bold: true, color: 'FFFFFF', fill: CRIMSON, align: AlignmentType.CENTER, widthPercent: 16, fontSize: 18 }),
      ],
    });

    const dataRows = tasks.map((t, idx) => {
      const filledPts = (t.notulensiPoin || []).filter((p) => p.trim()).length;
      const focusNum = (t.focusId || 'focus-1').replace('focus-', 'Fokus ');
      const jadwal = t.tanggalKonsultasi
        ? `${formatIndonesianDate(t.tanggalKonsultasi)}${t.jumlahPeserta ? ` (${t.jumlahPeserta} jiwa)` : ''}`
        : t.terlaksana
        ? 'Terlaksana'
        : 'Belum Terjadwal';
      const rowFill = idx % 2 === 1 ? SLATE_LIGHT : undefined;

      return new TableRow({
        children: [
          makeCell(String(idx + 1), { align: AlignmentType.CENTER, fill: rowFill, fontSize: 17 }),
          makeCell(`${t.namaDpl} (${t.category})`, { bold: true, fill: rowFill, fontSize: 17 }),
          makeCell(focusNum, { align: AlignmentType.CENTER, fill: rowFill, fontSize: 17 }),
          makeCell(`${t.fasilitator} & ${t.notulen}`, { fill: rowFill, fontSize: 17 }),
          makeCell(jadwal, { fill: rowFill, fontSize: 17 }),
          makeCell(`${filledPts} butir`, { align: AlignmentType.CENTER, bold: filledPts > 0, fill: rowFill, fontSize: 17 }),
        ],
      });
    });

    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
          bottom: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
          left: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
          right: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
          insideHorizontal: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
          insideVertical: { style: BorderStyle.SINGLE, size: 4, color: BORDER_GRAY },
        },
        rows: [headerRow, ...dataRows],
      })
    );
  }

  // ==========================================================
  // 5. KOLOM PENGESAHAN TIM SINODAL PAROKI
  // ==========================================================
  children.push(
    new Paragraph({
      spacing: { before: 320, after: 120 },
      alignment: AlignmentType.RIGHT,
      children: [
        new TextRun({
          text: `Medan, ${dateLabel}`,
          font: FONT_FAMILY,
          size: 20,
          color: SLATE_DARK,
        }),
      ],
    }),
    new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      borders: {
        top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
      },
      rows: [
        new TableRow({
          children: [
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: 'Mengetahui,', font: FONT_FAMILY, size: 20 }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 700 },
                  children: [
                    new TextRun({ text: 'Pastor Paroki Katedral Medan', font: FONT_FAMILY, size: 20, bold: true }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: '( ................................................ )', font: FONT_FAMILY, size: 20 }),
                  ],
                }),
              ],
            }),
            new TableCell({
              width: { size: 50, type: WidthType.PERCENTAGE },
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: 'Disusun oleh,', font: FONT_FAMILY, size: 20 }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  spacing: { after: 700 },
                  children: [
                    new TextRun({ text: 'Koordinator Tim Sinodal Paroki', font: FONT_FAMILY, size: 20, bold: true }),
                  ],
                }),
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: '( ................................................ )', font: FONT_FAMILY, size: 20 }),
                  ],
                }),
              ],
            }),
          ],
        }),
      ],
    })
  );

  const doc = new Document({
    creator: 'Tim Sinodal Paroki Katedral Medan',
    title: 'Resume Hasil Konsultasi Tim Sinodal Paroki Katedral Medan',
    description: 'Rangkuman konsultasi 14 Lingkungan & 7 Kategorial menuju Sidang Sinode Diosesan VII',
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.8),
              right: convertInchesToTwip(0.8),
              bottom: convertInchesToTwip(0.8),
              left: convertInchesToTwip(0.8),
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                alignment: AlignmentType.RIGHT,
                children: [
                  new TextRun({
                    text: 'Tim Sinodal Paroki Katedral Medan • Menuju Sidang Sinode Diosesan VII',
                    font: FONT_FAMILY,
                    size: 16,
                    italics: true,
                    color: SLATE_MED,
                  }),
                ],
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({
                    text: 'Halaman ',
                    font: FONT_FAMILY,
                    size: 16,
                    color: SLATE_MED,
                  }),
                  new TextRun({
                    children: [PageNumber.CURRENT],
                    font: FONT_FAMILY,
                    size: 16,
                    color: SLATE_MED,
                  }),
                  new TextRun({
                    text: ' dari ',
                    font: FONT_FAMILY,
                    size: 16,
                    color: SLATE_MED,
                  }),
                  new TextRun({
                    children: [PageNumber.TOTAL_PAGES],
                    font: FONT_FAMILY,
                    size: 16,
                    color: SLATE_MED,
                  }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `RESUME-SINODAL-KATEDRAL-MEDAN-${now.toISOString().slice(0, 10)}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
