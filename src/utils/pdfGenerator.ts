import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaskAssignment, TeamMember, FocusType, FocusInfo } from '../types';
import { formatIndonesianDate, FOCUS_LIST, FOCUS_NOTULENSI_QUESTIONS, FOCUS_1_POINT_TITLES } from '../data/initialData';

/**
 * Generates an official, beautifully styled PDF document of officer assignments
 * for Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan.
 */
export function generateOfficerPositionsPDF(
  tasks: TaskAssignment[],
  members: TeamMember[],
  specificMemberName?: string
) {
  // Use landscape for complete table readability, A4 format
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  const isPersonal = !!specificMemberName;

  // Header Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(153, 27, 27); // #991b1b (deep crimson)
  doc.text(
    'PAROKI ST PERAWAN MARIA DIKANDUNG TANPA NODA KATEDRAL KEUSKUPAN AGUNG MEDAN',
    pageWidth / 2,
    14,
    { align: 'center' }
  );

  doc.setFontSize(11);
  doc.setTextColor(30, 41, 59); // slate-800
  doc.text(
    'TIM SINODAL • DAFTAR PENUGASAN & POSISI PETUGAS PENDAMPING FOKUS KONSULTASI',
    pageWidth / 2,
    20,
    { align: 'center' }
  );

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  const now = new Date();
  const dateFormatted = `${now.getDate()} ${
    [
      'Januari',
      'Februari',
      'Maret',
      'April',
      'Mei',
      'Juni',
      'Juli',
      'Agustus',
      'September',
      'Oktober',
      'November',
      'Desember',
    ][now.getMonth()]
  } ${now.getFullYear()}`;

  const subtitle = isPersonal
    ? `Rekapitulasi Khusus Penugasan Petugas: ${specificMemberName} • Tanggal Dokumen: ${dateFormatted}`
    : `14 Lingkungan & 7 Kategorial (4 Focus Konsultasi) • Tanggal Dokumen: ${dateFormatted}`;
  doc.text(subtitle, pageWidth / 2, 25, { align: 'center' });

  // Divider line
  doc.setDrawColor(153, 27, 27);
  doc.setLineWidth(0.6);
  doc.line(14, 28, pageWidth - 14, 28);
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.3);
  doc.line(14, 29, pageWidth - 14, 29);

  // Filter tasks if personal
  let displayedTasks = tasks;
  if (isPersonal && specificMemberName) {
    const q = specificMemberName.toLowerCase().trim();
    displayedTasks = tasks.filter(
      (t) =>
        t.fasilitator.toLowerCase().includes(q) ||
        t.notulen.toLowerCase().includes(q)
    );
  }

  // Urutkan berdasarkan tanggal konsultasi (terlaksana pertama s/d terakhir)
  displayedTasks = [...displayedTasks].sort((a, b) => {
    const hasDateA = Boolean(a.tanggalKonsultasi && a.tanggalKonsultasi.trim());
    const hasDateB = Boolean(b.tanggalKonsultasi && b.tanggalKonsultasi.trim());
    if (hasDateA && !hasDateB) return -1;
    if (!hasDateA && hasDateB) return 1;
    if (!hasDateA && !hasDateB) return a.namaDpl.localeCompare(b.namaDpl);
    if (a.tanggalKonsultasi !== b.tanggalKonsultasi) {
      return (a.tanggalKonsultasi || '').localeCompare(b.tanggalKonsultasi || '');
    }
    const jamA = a.jam || '99:99';
    const jamB = b.jam || '99:99';
    if (jamA !== jamB) return jamA.localeCompare(jamB);
    return a.namaDpl.localeCompare(b.namaDpl);
  });

  // Prepare table data for Bagian 1: Matriks Kunjungan
  const tableData = displayedTasks.map((t, index) => {
    const jadwal = t.tanggalKonsultasi
      ? `${t.hari ? `${t.hari}, ` : ''}${formatIndonesianDate(t.tanggalKonsultasi)}${
          t.jam ? `\n(${t.jam})` : ''
        }`
      : 'Belum ditentukan\n(tahap koordinasi)';

    let statusText = 'Belum Ada';
    if (t.terlaksana) {
      statusText = `Terlaksana\n(${t.jumlahPeserta ? `${t.jumlahPeserta} jiwa` : 'Selesai'})`;
    } else if (t.tanggalKonsultasi) {
      statusText = 'Terjadwal';
    } else if (t.status === 'proses_koordinasi') {
      statusText = 'Koordinasi';
    }

    const lokasi = t.lokasiPelaksanaan || t.tempat || '-';

    return [
      (index + 1).toString(),
      t.namaDpl + (t.category === 'Kategorial' ? ' [Kategorial]' : ''),
      t.category,
      t.focusKonsultasi,
      t.fasilitator,
      t.notulen,
      jadwal,
      lokasi,
      statusText,
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [
      [
        'No',
        'Kunjungan (DPL / Kategorial)',
        'Kategori',
        'Focus Konsultasi',
        'Fasilitator (Utama)',
        'Notulen (Pencatat)',
        'Waktu / Jadwal',
        'Tempat / Lokasi',
        'Status',
      ],
    ],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: 8,
      cellPadding: 2,
      textColor: [15, 23, 42],
      valign: 'middle',
    },
    headStyles: {
      fillColor: [153, 27, 27], // Deep red
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
      fontSize: 8.5,
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 9 },
      1: { fontStyle: 'bold', cellWidth: 38 },
      2: { halign: 'center', cellWidth: 20 },
      3: { cellWidth: 48 },
      4: { fontStyle: 'bold', textColor: [29, 78, 216], cellWidth: 28 }, // blue for fasilitator
      5: { fontStyle: 'bold', textColor: [4, 120, 87], cellWidth: 28 }, // green for notulen
      6: { halign: 'center', cellWidth: 32 },
      7: { cellWidth: 34 },
      8: { halign: 'center', cellWidth: 22 },
    },
    didParseCell: (data) => {
      // Highlight Kategorial rows with pastel yellow/gold background
      const rawRow = displayedTasks[data.row.index];
      if (rawRow && rawRow.category === 'Kategorial' && data.section === 'body') {
        data.cell.styles.fillColor = [254, 249, 195]; // soft yellow
      }
    },
    foot: [
      [
        {
          content:
            'Ketentuan: Nama pertama bertindak sebagai FASILITATOR (pemimpin dialog) dan nama kedua sebagai NOTULEN (pencatat hasil). Baris kuning = Kategorial (7 kunjungan). Baris putih = Lingkungan (14 kunjungan).',
          colSpan: 9,
          styles: { fontStyle: 'italic', textColor: [100, 116, 139], fontSize: 7.5 },
        },
      ],
    ],
  });

  // Bagian 2: Rekapitulasi Pembagian Tugas per 15 Petugas (on full PDF)
  if (!isPersonal) {
    doc.addPage('a4', 'landscape');

    // Page 2 Header
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(13);
    doc.setTextColor(153, 27, 27);
    doc.text(
      'REKAPITULASI PEMBAGIAN TUGAS POSISI PETUGAS TIM SINODAL',
      pageWidth / 2,
      14,
      { align: 'center' }
    );
    doc.setFontSize(10);
    doc.setTextColor(71, 85, 105);
    doc.text(
      'Distribusi Peran sebagai Fasilitator dan Notulen untuk 15 Personil Tim',
      pageWidth / 2,
      20,
      { align: 'center' }
    );

    doc.setDrawColor(153, 27, 27);
    doc.setLineWidth(0.4);
    doc.line(14, 23, pageWidth - 14, 23);

    // Build member summary data
    const memberSummaryData = members.map((member, idx) => {
      const q = member.name.toLowerCase().trim();
      const memberTasks = tasks.filter(
        (t) =>
          t.fasilitator.toLowerCase().includes(q) ||
          t.notulen.toLowerCase().includes(q)
      );

      const asFas = memberTasks.filter((t) =>
        t.fasilitator.toLowerCase().includes(q)
      );
      const asNot = memberTasks.filter((t) =>
        t.notulen.toLowerCase().includes(q)
      );

      const fasTargets = asFas.map((t) => t.namaDpl).join(', ') || '-';
      const notTargets = asNot.map((t) => t.namaDpl).join(', ') || '-';

      return [
        (idx + 1).toString(),
        member.name,
        member.origin,
        asFas.length.toString(),
        asNot.length.toString(),
        memberTasks.length.toString(),
        `Fasilitator: ${fasTargets}\nNotulen: ${notTargets}`,
      ];
    });

    autoTable(doc, {
      startY: 26,
      head: [
        [
          'No',
          'Nama Petugas',
          'Asal Lingkungan / Komunitas',
          'Fasilitator',
          'Notulen',
          'Total Tugas',
          'Rincian Kunjungan Penugasan',
        ],
      ],
      body: memberSummaryData,
      theme: 'grid',
      styles: {
        fontSize: 8.5,
        cellPadding: 2.5,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [30, 41, 59], // Dark slate
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'center',
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 10 },
        1: { fontStyle: 'bold', cellWidth: 32 },
        2: { cellWidth: 50 },
        3: { halign: 'center', fontStyle: 'bold', textColor: [29, 78, 216], cellWidth: 20 },
        4: { halign: 'center', fontStyle: 'bold', textColor: [4, 120, 87], cellWidth: 20 },
        5: { halign: 'center', fontStyle: 'bold', cellWidth: 22 },
        6: { cellWidth: 115 },
      },
    });

    // Signature Footer
    const finalY = (doc as any).lastAutoTable.finalY + 12;
    if (finalY < pageHeight - 30) {
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(30, 41, 59);

      const rightX = pageWidth - 60;
      doc.text('Medan, ' + dateFormatted, rightX, finalY, { align: 'center' });
      doc.text('Koordinator Tim Sinodal,', rightX, finalY + 5, { align: 'center' });
      doc.text('(                                         )', rightX, finalY + 22, {
        align: 'center',
      });
      doc.text('Paroki Katedral Medan', rightX, finalY + 26, { align: 'center' });
    }
  }

  // Filename
  const dateStr = now.toISOString().slice(0, 10);
  const fileName = isPersonal
    ? `Posisi-Petugas-${specificMemberName?.replace(/\s+/g, '_')}-${dateStr}.pdf`
    : `Posisi-Petugas-Sinodal-Katedral-Medan-${dateStr}.pdf`;

  // Trigger download
  doc.save(fileName);
}

/**
 * Generates an official PDF summarizing consultation answers (Buah Percakapan) for each Focus.
 * Each point (Poin 1, Poin 2, etc.) is gathered across visits onto dedicated pages.
 */
export function generateFocusSummaryPDF(
  tasks: TaskAssignment[],
  selectedFocusId: FocusType | 'all'
) {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const now = new Date();
  const dateFormatted = `${now.getDate()} ${
    [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ][now.getMonth()]
  } ${now.getFullYear()}`;

  const targetFocusList = selectedFocusId === 'all'
    ? FOCUS_LIST
    : FOCUS_LIST.filter((f) => f.id === selectedFocusId);

  let pageIndex = 0;

  targetFocusList.forEach((focus) => {
    const focusTasks = tasks.filter((t) => t.focusId === focus.id);
    const questions = FOCUS_NOTULENSI_QUESTIONS[focus.id] || [];

    if (focus.id === 'focus-1') {
      // Focus 1: 2 questions with 5 points each
      questions.forEach((questionText, qIdx) => {
        const startSlot = qIdx * 5;
        [0, 1, 2, 3, 4].forEach((subIdx) => {
          const slot = startSlot + subIdx;
          const pointNum = subIdx + 1;
          const pointTitle = FOCUS_1_POINT_TITLES[subIdx] || `Poin ${pointNum}`;

          if (pageIndex > 0) {
            doc.addPage('a4', 'portrait');
          }
          pageIndex++;

          // Page Header
          const startY = renderPointPageHeader(
            doc,
            pageWidth,
            focus,
            `Pertanyaan ${qIdx + 1}: ${questionText}`,
            `Poin ${pointNum}: ${pointTitle}`
          );

          // Build rows for each task in this focus
          const rows: any[] = [];
          focusTasks.forEach((t, tIdx) => {
            const rawAns = t.notulensiPoin?.[slot] || '';
            const ansText = rawAns.trim() ? `"${rawAns.trim()}"` : '(Belum ada buah percakapan)';

            const visitInfo = `${t.namaDpl} (${t.category})\n` +
              `Pendamping: ${t.fasilitator} & ${t.notulen}\n` +
              `Jadwal: ${t.hari ? `${t.hari}, ` : ''}${t.tanggalKonsultasi || 'Belum diatur'}`;

            rows.push([
              tIdx + 1,
              visitInfo,
              ansText,
            ]);
          });

          autoTable(doc, {
            startY,
            head: [['No', 'Kunjungan & Pendamping', `Kumpulan Hasil Buah Percakapan (Poin ${pointNum})`]],
            body: rows,
            theme: 'grid',
            styles: {
              fontSize: 8.5,
              cellPadding: 3,
              textColor: [15, 23, 42],
              valign: 'top',
              overflow: 'linebreak',
            },
            headStyles: {
              fillColor: [153, 27, 27],
              textColor: [255, 255, 255],
              fontStyle: 'bold',
              fontSize: 9,
              halign: 'center',
            },
            columnStyles: {
              0: { halign: 'center', cellWidth: 10 },
              1: { fontStyle: 'bold', cellWidth: 58 },
              2: { cellWidth: 114 },
            },
            didParseCell: (data) => {
              if (data.section === 'body' && data.column.index === 2) {
                const text = String(data.cell.raw);
                if (text === '(Belum ada buah percakapan)') {
                  data.cell.styles.textColor = [148, 163, 184];
                  data.cell.styles.fontStyle = 'italic';
                }
              }
            },
            didDrawPage: () => {
              doc.setFontSize(7.5);
              doc.setFont('helvetica', 'italic');
              doc.setTextColor(100, 116, 139);
              doc.text(
                `Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan • Rangkuman Sinodal Fokus ${focus.number} • Halaman ${doc.getNumberOfPages()}`,
                pageWidth / 2,
                pageHeight - 7,
                { align: 'center' }
              );
            },
          });
        });
      });
    } else {
      // Focus 2, 3, 4: 5 questions / points each
      questions.forEach((qText, qIdx) => {
        const pointNum = qIdx + 1;

        if (pageIndex > 0) {
          doc.addPage('a4', 'portrait');
        }
        pageIndex++;

        // Page Header
        const startY = renderPointPageHeader(
          doc,
          pageWidth,
          focus,
          `Butir Refleksi ${pointNum}`,
          `Poin ${pointNum}: ${qText}`
        );

        const rows: any[] = [];
        focusTasks.forEach((t, tIdx) => {
          const rawAns = t.notulensiPoin?.[qIdx] || '';
          const ansText = rawAns.trim() ? `"${rawAns.trim()}"` : '(Belum ada buah percakapan)';

          const visitInfo = `${t.namaDpl} (${t.category})\n` +
            `Pendamping: ${t.fasilitator} & ${t.notulen}\n` +
            `Jadwal: ${t.hari ? `${t.hari}, ` : ''}${t.tanggalKonsultasi || 'Belum diatur'}`;

          rows.push([
            tIdx + 1,
            visitInfo,
            ansText,
          ]);
        });

        autoTable(doc, {
          startY,
          head: [['No', 'Kunjungan & Pendamping', `Kumpulan Hasil Buah Percakapan (Poin ${pointNum})`]],
          body: rows,
          theme: 'grid',
          styles: {
            fontSize: 8.5,
            cellPadding: 3,
            textColor: [15, 23, 42],
            valign: 'top',
            overflow: 'linebreak',
          },
          headStyles: {
            fillColor: [153, 27, 27],
            textColor: [255, 255, 255],
            fontStyle: 'bold',
            fontSize: 9,
            halign: 'center',
          },
          columnStyles: {
            0: { halign: 'center', cellWidth: 10 },
            1: { fontStyle: 'bold', cellWidth: 58 },
            2: { cellWidth: 114 },
          },
          didParseCell: (data) => {
            if (data.section === 'body' && data.column.index === 2) {
              const text = String(data.cell.raw);
              if (text === '(Belum ada buah percakapan)') {
                data.cell.styles.textColor = [148, 163, 184];
                data.cell.styles.fontStyle = 'italic';
              }
            }
          },
          didDrawPage: () => {
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 116, 139);
            doc.text(
              `Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan • Rangkuman Sinodal Fokus ${focus.number} • Halaman ${doc.getNumberOfPages()}`,
              pageWidth / 2,
              pageHeight - 7,
              { align: 'center' }
            );
          },
        });
      });
    }
  });

  const dateStr = now.toISOString().slice(0, 10);
  const fileName = selectedFocusId === 'all'
    ? `Rangkuman-Buah-Percakapan-Semua-Fokus-${dateStr}.pdf`
    : `Rangkuman-Buah-Percakapan-${selectedFocusId}-${dateStr}.pdf`;

  doc.save(fileName);
}

function renderPointPageHeader(
  doc: jsPDF,
  pageWidth: number,
  focus: FocusInfo,
  subHeader: string,
  pointTitle: string
): number {
  // Title top
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(153, 27, 27); // #991b1b
  doc.text(
    'PAROKI ST PERAWAN MARIA DIKANDUNG TANPA NODA KATEDRAL MEDAN',
    pageWidth / 2,
    11,
    { align: 'center' }
  );

  doc.setFontSize(9);
  doc.setTextColor(30, 41, 59);
  doc.text(
    `RANGKUMAN BUAH PERCAKAPAN • FOKUS ${focus.number}: ${focus.title.toUpperCase()} (${focus.theme})`,
    pageWidth / 2,
    16.5,
    { align: 'center' }
  );

  // Subheader / question
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  const splitSub = doc.splitTextToSize(subHeader, pageWidth - 28);
  doc.text(splitSub, 14, 22.5);

  // Point title banner
  const bannerY = 22.5 + splitSub.length * 3.6 + 1.5;
  const splitPoint = doc.splitTextToSize(`KUMPULAN JAWABAN: ${pointTitle}`, pageWidth - 36);
  const bannerHeight = Math.max(8.5, splitPoint.length * 4.2 + 3);

  doc.setFillColor(241, 245, 249); // slate-100 background
  doc.setDrawColor(203, 213, 225); // slate-300 border
  doc.roundedRect(14, bannerY, pageWidth - 28, bannerHeight, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(splitPoint, 17, bannerY + 5);

  return bannerY + bannerHeight + 4;
}
