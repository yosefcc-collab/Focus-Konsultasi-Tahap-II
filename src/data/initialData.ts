import { FocusInfo, TeamMember, TaskAssignment } from '../types';
import dplMaster from '../../database/master/dplMaster.json';

export const FOCUS_LIST: FocusInfo[] = [
  {
    id: 'focus-1',
    number: 1,
    title: 'Mendengarkan dan Mengenali Communio',
    theme: 'Focus Koinonia',
    fullName: '1. Mendengarkan dan Mengenali Communio (Focus Koinonia)',
    description: 'Membangun persekutuan iman, saling mendengarkan harapan, tantangan, dan dinamika kebersamaan hidup menggereja di tingkat lingkungan dan kategorial.',
    color: {
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-800 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      badge: 'bg-emerald-100 dark:bg-emerald-900/60',
      badgeText: 'text-emerald-700 dark:text-emerald-300',
      accent: '#059669',
      light: '#ecfdf5',
    },
  },
  {
    id: 'focus-2',
    number: 2,
    title: 'Hati Yang Berkobar',
    theme: 'Focus Kerygma dan Liturgia',
    fullName: '2. Hati Yang Berkobar (Focus Kerygma dan Liturgia)',
    description: 'Menghidupi Sabda Allah dan perayaan sakramental, membina katekese, serta menyalakan semangat pewartaan kabar sukacita Injil dalam kehidupan sehari-hari.',
    color: {
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-800 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      badge: 'bg-amber-100 dark:bg-amber-900/60',
      badgeText: 'text-amber-700 dark:text-amber-300',
      accent: '#d97706',
      light: '#fffbeb',
    },
  },
  {
    id: 'focus-3',
    number: 3,
    title: 'Mata yang Terbuka',
    theme: 'Focus Diakonia',
    fullName: '3. Mata yang Terbuka (Focus Diakonia)',
    description: 'Kepekaan hati dan tindakan nyata belas kasih (diakonia) bagi sesama yang kecil, lemah, miskin, tersingkir, dan difabel di lingkungan dan masyarakat sekitar.',
    color: {
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-800 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      badge: 'bg-sky-100 dark:bg-sky-900/60',
      badgeText: 'text-sky-700 dark:text-sky-300',
      accent: '#0284c7',
      light: '#f0f9ff',
    },
  },
  {
    id: 'focus-4',
    number: 4,
    title: 'Kembali Ke Yerusalem',
    theme: 'Focus Martyria',
    fullName: '4. Kembali Ke Yerusalem (Martyria)',
    description: 'Memberi kesaksian hidup beriman di tengah masyarakat majemuk, keterlibatan sosial kemasyarakatan, serta perutusan misioner Gereja di Kota Medan.',
    color: {
      bg: 'bg-rose-50 dark:bg-rose-950/40',
      text: 'text-rose-800 dark:text-rose-300',
      border: 'border-rose-200 dark:border-rose-800',
      badge: 'bg-rose-100 dark:bg-rose-900/60',
      badgeText: 'text-rose-700 dark:text-rose-300',
      accent: '#e11d48',
      light: '#fff1f2',
    },
  },
];

export const TEAM_MEMBERS: TeamMember[] = [
  { id: 'indra', name: 'Indra', origin: 'St Elisabet - Pulo Brayan Darat' },
  { id: 'gunawan', name: 'Gunawan', origin: 'SMRR - Cemara Asri' },
  { id: 'putut', name: 'Putut', origin: 'St Yosef - Multatuli' },
  { id: 'fr-robert', name: 'Fr Robert', origin: 'Non DPL dan Kategorial' },
  { id: 'hekdi', name: 'Hekdi', origin: 'St Antonius dari Padua - Sei Agul' },
  { id: 'desyre', name: 'Desyre', origin: 'St Antonius dari Padua - Sei Agul' },
  { id: 'yosef', name: 'Yosef', origin: 'St Maria - Sukaraja' },
  { id: 'sulina', name: 'Sulina', origin: 'St Maria - Sukaraja' },
  { id: 'jenny', name: 'Jenny', origin: 'St Maria - Sukaraja' },
  { id: 'sr-egidia', name: 'Sr Egidia', origin: 'Non DPL dan Kategorial' },
  { id: 'nuel', name: 'Nuel', origin: 'Non DPL dan Kategorial' },
  { id: 'erni', name: 'Erni', origin: 'St Agnes - Titi Kuning' },
  { id: 'anton', name: 'Anton', origin: 'St Agnes - Titi Kuning' },
  { id: 'samuel', name: 'Samuel', origin: 'St Yosef - Multatuli' },
  { id: 'zetra', name: 'Zetra', origin: 'St Maria Imaculata - Kesawan' },
];

export const INITIAL_ASSIGNMENTS: TaskAssignment[] = dplMaster.map((d) => ({
  id: d.id,
  namaDpl: d.namaDpl,
  category: d.category as any,
  focusId: d.focusId as any,
  focusKonsultasi: d.focusKonsultasi,
  fasilitator: d.fasilitator,
  notulen: d.notulen,
  tanggalKonsultasi: '',
  hari: '',
  jam: '',
  status: 'belum_ditentukan',
  tempat: '',
  kontakPic: '',
  catatan: '',
}));

export const INDONESIAN_DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

export function getIndonesianDayName(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString + 'T00:00:00');
    if (isNaN(d.getTime())) return '';
    return INDONESIAN_DAYS[d.getDay()];
  } catch {
    return '';
  }
}

export function formatIndonesianDate(dateString: string): string {
  if (!dateString) return '';
  try {
    const d = new Date(dateString + 'T00:00:00');
    if (isNaN(d.getTime())) return dateString;
    const months = [
      'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
      'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];
    return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
  } catch {
    return dateString;
  }
}
