import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { TaskAssignment, TeamMember } from '../types';
import { formatIndonesianDate } from '../data/initialData';

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

  // Prepare table data for Bagian 1: Matriks Sasaran
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
        'Nama DPL / Sasaran',
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
            'Ketentuan: Nama pertama bertindak sebagai FASILITATOR (pemimpin dialog) dan nama kedua sebagai NOTULEN (pencatat hasil). Baris kuning = Kategorial (7 sasaran). Baris putih = Lingkungan (14 sasaran).',
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
          'Rincian Sasaran Penugasan',
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
