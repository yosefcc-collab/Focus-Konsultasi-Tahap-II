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
  tanggalKonsultasi: string; // YYYY-MM-DD atau kosong
  hari: string;              // Senin, Selasa, dst.
  jam: string;               // 19:30 WIB
  tempat?: string;           // Rumah warga, Gereja, dsb.
  kontakPic?: string;        // Nama & no kontak pengurus lingkungan/kategorial
  status: ScheduleStatus;
  catatan?: string;          // Catatan penting atau hasil ringkas
  updatedAt?: string;
}
