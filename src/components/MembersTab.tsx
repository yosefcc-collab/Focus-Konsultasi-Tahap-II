import React, { useState } from 'react';
import {
  User,
  UserCheck,
  FileText,
  Share2,
  Check,
  Calendar,
  ChevronDown,
  ChevronRight,
  UserPlus,
  Edit2,
  ShieldCheck,
} from 'lucide-react';
import { TeamMember, TaskAssignment } from '../types';
import { formatIndonesianDate } from '../data/initialData';
import { MemberEditModal } from './MemberEditModal';

interface MembersTabProps {
  tasks: TaskAssignment[];
  members: TeamMember[];
  onSelectMemberFilter: (memberName: string) => void;
  onEditTask: (task: TaskAssignment) => void;
  onAddMember: (newMember: TeamMember) => void;
  onEditMember: (updatedMember: TeamMember, oldName?: string, updateInTasks?: boolean) => void;
  onDeleteMember: (memberId: string, memberName: string) => void;
}

export const MembersTab: React.FC<MembersTabProps> = ({
  tasks,
  members,
  onSelectMemberFilter,
  onEditTask,
  onAddMember,
  onEditMember,
  onDeleteMember,
}) => {
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [copiedMember, setCopiedMember] = useState<string | null>(null);

  // Modal state for adding/editing members
  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);

  // Normalize check for names like "Desyre" and "Desry"
  const isPersonMatched = (personName: string, query: string) => {
    const p = personName.toLowerCase().trim();
    const q = query.toLowerCase().trim();
    if (p === q) return true;
    if ((p.includes('desy') || p.includes('desr')) && (q.includes('desy') || q.includes('desr'))) return true;
    return false;
  };

  const getMemberTasks = (memberName: string) => {
    return tasks.filter(
      (t) => isPersonMatched(t.fasilitator, memberName) || isPersonMatched(t.notulen, memberName)
    );
  };

  const handleShareSchedule = async (member: TeamMember) => {
    const memberTasks = getMemberTasks(member.name);
    const fasilitatorTasks = memberTasks.filter((t) => isPersonMatched(t.fasilitator, member.name));
    const notulenTasks = memberTasks.filter((t) => isPersonMatched(t.notulen, member.name));

    let text = `*REKAP PENUGASAN TIM SINODAL*\n`;
    text += `*PAROKI ST PERAWAN MARIA DIKANDUNG TANPA NODA KATEDRAL KEUSKUPAN AGUNG MEDAN*\n`;
    text += `👤 *Nama:* ${member.name}\n`;
    text += `📍 *Asal:* ${member.origin}\n`;
    text += `📊 *Total Penugasan:* ${memberTasks.length} Kali (${fasilitatorTasks.length} Fasilitator, ${notulenTasks.length} Notulen)\n\n`;

    text += `📋 *Daftar Penugasan:*\n`;
    memberTasks.forEach((t, idx) => {
      const role = isPersonMatched(t.fasilitator, member.name) ? 'Fasilitator' : 'Notulen';
      const partner = isPersonMatched(t.fasilitator, member.name) ? t.notulen : t.fasilitator;
      const partnerRole = isPersonMatched(t.fasilitator, member.name) ? 'Notulen' : 'Fasilitator';
      const jadwal = t.tanggalKonsultasi
        ? `${t.hari ? `${t.hari}, ` : ''}${formatIndonesianDate(t.tanggalKonsultasi)} (${t.jam || 'Jam menyusul'})`
        : 'Jadwal belum ditentukan (koordinasi)';

      text += `${idx + 1}. *${t.namaDpl}* (${t.category})\n`;
      text += `   • Peran: *${role}* (Rekan ${partnerRole}: ${partner})\n`;
      text += `   • Fokus: ${t.focusKonsultasi}\n`;
      text += `   • Waktu: ${jadwal}\n`;
      if (t.tempat) text += `   • Lokasi: ${t.tempat}\n`;
      text += `\n`;
    });

    text += `_Tim Sinodal Paroki St Perawan Maria Dikandung Tanpa Noda Katedral Keuskupan Agung Medan_`;

    try {
      await navigator.clipboard.writeText(text);
      setCopiedMember(member.id);
      setTimeout(() => setCopiedMember(null), 2000);
    } catch (err) {
      console.error('Clipboard copy failed', err);
    }

    // Direct WhatsApp share url
    const encoded = encodeURIComponent(text);
    window.open(`https://wa.me/?text=${encoded}`, '_blank', 'noopener,noreferrer');
  };

  const handleOpenAddModal = () => {
    setEditingMember(null);
    setIsMemberModalOpen(true);
  };

  const handleOpenEditModal = (m: TeamMember, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingMember(m);
    setIsMemberModalOpen(true);
  };

  const handleSaveMember = (
    memberData: TeamMember,
    oldName?: string,
    updateInTasks?: boolean
  ) => {
    if (editingMember) {
      onEditMember(memberData, oldName, updateInTasks);
    } else {
      onAddMember(memberData);
    }
  };

  return (
    <div className="space-y-4 pb-20">
      {/* Intro Box with Add Member Button */}
      <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <User className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-bold uppercase tracking-wider text-amber-300">
              Personil Tim Sinodal ({members.length} Orang)
            </span>
          </div>
          <h2 className="text-lg font-bold">Daftar &amp; Manajemen Petugas</h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Nama petugas dapat diedit atau ditambah sesuai kebutuhan penugasan di lapangan.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAddModal}
          className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition"
        >
          <UserPlus className="w-4 h-4" />
          <span>+ Tambah Petugas</span>
        </button>
      </div>

      {/* Member Cards */}
      <div className="grid grid-cols-1 gap-3">
        {members.map((member) => {
          const memberTasks = getMemberTasks(member.name);
          const asFasilitator = memberTasks.filter((t) => isPersonMatched(t.fasilitator, member.name)).length;
          const asNotulen = memberTasks.filter((t) => isPersonMatched(t.notulen, member.name)).length;
          const isExpanded = selectedMemberId === member.id;

          return (
            <div
              key={member.id}
              className={`rounded-2xl border transition-all duration-200 bg-white overflow-hidden shadow-xs ${
                isExpanded ? 'border-slate-300 ring-2 ring-slate-100' : 'border-slate-200'
              }`}
            >
              <div className="p-4 flex items-start justify-between gap-3">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-base font-extrabold text-slate-900">
                      {member.name}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                      {memberTasks.length} Tugas
                    </span>
                    <button
                      type="button"
                      onClick={(e) => handleOpenEditModal(member, e)}
                      className="text-[11px] font-bold text-blue-600 hover:text-blue-800 inline-flex items-center gap-0.5 ml-1 px-1.5 py-0.5 rounded bg-blue-50 hover:bg-blue-100 transition"
                      title="Edit nama atau asal petugas"
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Edit</span>
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 font-medium">
                    Asal: <span className="text-slate-800 font-semibold">{member.origin}</span>
                  </p>

                  {/* Role Counters */}
                  <div className="flex items-center gap-2 pt-1 text-xs">
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-800 font-semibold border border-blue-200 text-[11px]">
                      <UserCheck className="w-3 h-3 text-blue-600" />
                      {asFasilitator}x Fasilitator
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 text-[11px]">
                      <FileText className="w-3 h-3 text-emerald-600" />
                      {asNotulen}x Notulen
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => setSelectedMemberId(isExpanded ? null : member.id)}
                    className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                    title={isExpanded ? 'Tutup rincian' : 'Lihat rincian tugas'}
                  >
                    {isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => handleShareSchedule(member)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition"
                    title="Kirim rekap jadwal anggota via WhatsApp"
                  >
                    {copiedMember === member.id ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
                    <span>{copiedMember === member.id ? 'Tersalin' : 'Kirim WA'}</span>
                  </button>
                </div>
              </div>

              {/* Expanded List of Assignments */}
              {isExpanded && (
                <div className="border-t border-slate-100 p-4 bg-slate-50/70 space-y-2.5">
                  <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
                    <span>Penugasan untuk {member.name}:</span>
                    <button
                      type="button"
                      onClick={() => onSelectMemberFilter(member.name)}
                      className="text-red-700 hover:text-red-800 font-bold underline"
                    >
                      Buka di Tab Utama
                    </button>
                  </div>

                  {memberTasks.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-500 italic bg-white rounded-xl border border-slate-200">
                      Belum ada penugasan untuk {member.name}. Anda dapat menugaskannya pada tab Penugasan.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {memberTasks.map((t) => {
                        const isFas = isPersonMatched(t.fasilitator, member.name);
                        const partner = isFas ? t.notulen : t.fasilitator;

                        return (
                          <div
                            key={t.id}
                            className="p-3 rounded-xl border border-slate-200 bg-white text-xs space-y-1.5 shadow-2xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-sm">
                                {t.namaDpl}
                              </span>
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  isFas
                                    ? 'bg-blue-100 text-blue-900'
                                    : 'bg-emerald-100 text-emerald-900'
                                }`}
                              >
                                Sebagai {isFas ? 'Fasilitator' : 'Notulen'}
                              </span>
                            </div>

                            <p className="text-slate-600 line-clamp-1">
                              {t.focusKonsultasi}
                            </p>

                            <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                              <div>
                                Rekan ({isFas ? 'Notulen' : 'Fasilitator'}):{' '}
                                <strong className="text-slate-700">{partner}</strong>
                              </div>
                              <div>
                                {t.tanggalKonsultasi ? (
                                  <span className="font-semibold text-emerald-700">
                                    {t.hari ? `${t.hari}, ` : ''}{formatIndonesianDate(t.tanggalKonsultasi)}
                                  </span>
                                ) : (
                                  <span className="text-amber-600 italic">Belum terjadwal</span>
                                )}
                              </div>
                            </div>

                            <div className="pt-1 flex justify-end">
                              <button
                                type="button"
                                onClick={() => onEditTask(t)}
                                className="text-[11px] text-blue-700 hover:text-blue-800 font-semibold"
                              >
                                Edit Jadwal &amp; Petugas &rarr;
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal for adding/editing member */}
      <MemberEditModal
        isOpen={isMemberModalOpen}
        member={editingMember}
        onClose={() => setIsMemberModalOpen(false)}
        onSave={handleSaveMember}
        onDelete={onDeleteMember}
      />
    </div>
  );
};
