import React, { useState, useEffect } from 'react';
import { X, UserPlus, UserCheck, CheckCircle2, Trash2 } from 'lucide-react';
import { TeamMember } from '../types';

interface MemberEditModalProps {
  isOpen: boolean;
  member: TeamMember | null; // null means adding a new member
  onClose: () => void;
  onSave: (memberData: TeamMember, oldName?: string, updateInTasks?: boolean) => void;
  onDelete?: (memberId: string, memberName: string) => void;
}

export const MemberEditModal: React.FC<MemberEditModalProps> = ({
  isOpen,
  member,
  onClose,
  onSave,
  onDelete,
}) => {
  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('');
  const [updateInTasks, setUpdateInTasks] = useState(true);
  const [error, setError] = useState('');

  const isEditing = !!member;

  useEffect(() => {
    if (member) {
      setName(member.name);
      setOrigin(member.origin);
      setUpdateInTasks(true);
      setError('');
    } else {
      setName('');
      setOrigin('Non DPL dan Kategorial');
      setUpdateInTasks(true);
      setError('');
    }
  }, [member, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Nama petugas tidak boleh kosong');
      return;
    }
    if (!origin.trim()) {
      setError('Asal lingkungan / kategorial tidak boleh kosong');
      return;
    }

    const memberId = member ? member.id : name.toLowerCase().replace(/[^a-z0-9]/g, '-') + '-' + Date.now().toString().slice(-4);
    
    onSave(
      {
        id: memberId,
        name: name.trim(),
        origin: origin.trim(),
      },
      member ? member.name : undefined,
      updateInTasks
    );
    onClose();
  };

  const originPresets = [
    'Non DPL dan Kategorial',
    'St Elisabet - Pulo Brayan Darat',
    'SMRR - Cemara Asri',
    'St Yosef - Multatuli',
    'St Antonius dari Padua - Sei Agul',
    'St Maria - Sukaraja',
    'St Agnes - Titi Kuning',
    'St Maria Imaculata - Kesawan',
    'St Bonaventura - Lorong 1',
    'St Yosef - Glugur Kota',
    'St Yosef - Mangkubumi',
    'St Yohanes Pembaptis - TNI AU',
    'St Mikael - Kampung Baru',
    'Hati Kudus Yesus - Brayan Kota',
    'St Theresia - Polonia',
  ];

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div
        className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200"
        role="dialog"
      >
        {/* Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
              {isEditing ? <UserCheck className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                {isEditing ? 'Edit Data Petugas' : 'Tambah Petugas Baru'}
              </h2>
              <p className="text-xs text-slate-500">
                {isEditing ? 'Perbarui identitas atau asal tim' : 'Masukkan nama petugas tim sinodal'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          {error && (
            <div className="p-2 rounded-lg bg-rose-50 border border-rose-200 text-rose-700 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Nama Lengkap Petugas:
            </label>
            <input
              type="text"
              placeholder="Contoh: Bpk. Gunawan, Sr. Maria, Fr. Robert"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-hidden font-medium text-slate-900 text-xs"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-slate-700 font-bold mb-1">
              Asal Lingkungan / Komunitas:
            </label>
            <input
              type="text"
              placeholder="Ketik atau pilih dari daftar di bawah..."
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-blue-600 outline-hidden font-medium text-slate-900 text-xs mb-1.5"
            />
            {/* Presets */}
            <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto p-1 bg-slate-50 rounded-lg border border-slate-200/70">
              {originPresets.map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setOrigin(preset)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition ${
                    origin === preset
                      ? 'bg-blue-600 text-white border-blue-600 font-bold'
                      : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset}
                </button>
              ))}
            </div>
          </div>

          {isEditing && (
            <div className="pt-2 border-t border-slate-100">
              <label className="flex items-start gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateInTasks}
                  onChange={(e) => setUpdateInTasks(e.target.checked)}
                  className="mt-0.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-slate-600 text-[11px] leading-tight">
                  Perbarui juga nama ini di seluruh penugasan (Fasilitator &amp; Notulen) yang sudah ada secara otomatis.
                </span>
              </label>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
            {isEditing && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  if (window.confirm(`Hapus petugas "${member.name}" dari daftar?`)) {
                    onDelete(member.id, member.name);
                    onClose();
                  }
                }}
                className="text-rose-600 hover:text-rose-700 font-medium inline-flex items-center gap-1 py-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Hapus</span>
              </button>
            ) : <span />}

            <div className="flex items-center gap-2 ml-auto">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-lg text-slate-600 hover:bg-slate-100 font-semibold transition"
              >
                Batal
              </button>
              <button
                type="submit"
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold inline-flex items-center gap-1.5 shadow-xs transition"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{isEditing ? 'Simpan' : 'Tambah Petugas'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
