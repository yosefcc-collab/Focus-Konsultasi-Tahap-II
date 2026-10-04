export type FocusType = 'focus-1' | 'focus-2' | 'focus-3' | 'focus-4';

export type CategoryType = 'Lingkungan' | 'Kategorial';

export type ScheduleStatus = 'belum_ditentukan' | 'proses_koordinasi' | 'terjadwal' | 'selesai';

export interface FocusInfo {
  id: FocusType;
  number: number;
  title: string;
  theme: string;
  fullName: string;
  description: string;
  color: {
    bg: string;
    text: string;
    border: string;
    badge: string;
    badgeText: string;
    accent: string;
    light: string;
  };
}

export interface TeamMember {
  id: string;
  name: string;
  origin: string; // Lingkungan asal atau "Non DPL dan Kategorial"
  phone?: string;
}

export interface TaskAssignment {
  id: string;
  namaDpl: string;
  category: CategoryType;
  focusId: FocusType;
  focusKonsultasi: string;
  fasilitator: string; // Orang pertama dalam pendamping
  notulen: string;     // Orang kedua dalam pendamping
  // Tahap 1: Koordinasi Jadwal
  tanggalKonsultasi: string; // YYYY-MM-DD atau kosong
  hari: string;              // Senin, Selasa, dst.
  jam: string;               // 19:30 WIB
  kontakPic?: string;        // Nama & no kontak pengurus lingkungan/kategorial
  status: ScheduleStatus;

  // Tahap 2: Pelaksanaan (Terbuka setelah Tanggal & Jam terisi)
  terlaksana?: boolean;
  tempat?: string;           // Lokasi pelaksanaan
  lokasiPelaksanaan?: string;// Alias / lokasi spesifik
  jumlahPeserta?: number | string;
  fotoDokumentasi?: string;  // Data URL base64 gambar dokumentasi terkompresi (Foto 1)
  fotoNama?: string;
  fotoDokumentasi2?: string; // Data URL base64 gambar dokumentasi ke-2 (Opsional Foto 2)
  fotoNama2?: string;
  catatan?: string;          // Catatan penting atau hasil ringkas
  notulensiPoin?: string[];  // 5 butir buah percakapan sesuai fokus konsultasi
  // Dokumen / Notulen Dinamika Pertemuan (PDF atau JPEG/PNG)
  fileNotulenDinamika?: string; // Data URL base64 PDF atau gambar
  fileNotulenDinamikaNama?: string; // Nama file asli (misal: "Notulen_Dinamika_St_Elisabet.pdf")
  fileNotulenDinamikaTipe?: string; // MIME type (misal: "application/pdf", "image/jpeg")
  fileNotulenDinamikaSize?: number; // Ukuran file (bytes)
  updatedAt?: string;

  // Proteksi Kunci Data
  locked?: boolean;          // Jika true, data terlindungi & terkunci dari perubahan tidak disengaja
  lockedAt?: string;
}

export interface SynodalExportData {
  appName: string;
  paroki: string;
  version: string;
  exportedAt: string;
  exportedBy?: string;
  totalTasks: number;
  totalMembers: number;
  tasks: TaskAssignment[];
  members: TeamMember[];
}
