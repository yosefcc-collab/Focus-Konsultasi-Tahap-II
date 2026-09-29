/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Church,
  Calendar,
  Layers,
  Users,
  Table,
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  X,
  Share2,
} from 'lucide-react';
import { TaskAssignment, CategoryType, FocusType, ScheduleStatus, TeamMember } from './types';
import {
  INITIAL_ASSIGNMENTS,
  TEAM_MEMBERS,
  FOCUS_LIST,
  formatIndonesianDate,
} from './data/initialData';
import { TaskCard } from './components/TaskCard';
import { EditScheduleModal } from './components/EditScheduleModal';
import { WhatsAppShareModal } from './components/WhatsAppShareModal';
import { FocusTab } from './components/FocusTab';
import { MembersTab } from './components/MembersTab';
import { MatrixTab } from './components/MatrixTab';
import { GuideTab } from './components/GuideTab';

const TASKS_STORAGE_KEY = 'tim_sinodal_katedral_medan_tasks_v2';
const MEMBERS_STORAGE_KEY = 'tim_sinodal_katedral_medan_members_v2';

export default function App() {
  const [tasks, setTasks] = useState<TaskAssignment[]>(() => {
    try {
      const saved = localStorage.getItem(TASKS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading tasks localStorage', e);
    }
    return INITIAL_ASSIGNMENTS;
  });

  const [members, setMembers] = useState<TeamMember[]>(() => {
    try {
      const saved = localStorage.getItem(MEMBERS_STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed reading members localStorage', e);
    }
    return TEAM_MEMBERS;
  });

  const [activeTab, setActiveTab] = useState<'tasks' | 'focus' | 'members' | 'matrix' | 'guide'>('tasks');
  const [editingTask, setEditingTask] = useState<TaskAssignment | null>(null);
  const [whatsAppTask, setWhatsAppTask] = useState<TaskAssignment | null>(null);

  // Filters for main tasks view
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<'all' | CategoryType>('all');
  const [focusFilter, setFocusFilter] = useState<'all' | FocusType>('all');
  const [memberFilter, setMemberFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'terjadwal' | 'belum_ditentukan'>('all');

  // Save tasks to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_STORAGE_KEY, JSON.stringify(tasks));
    } catch (e) {
      console.error('Failed to save tasks to localStorage', e);
    }
  }, [tasks]);

  // Save members to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(MEMBERS_STORAGE_KEY, JSON.stringify(members));
    } catch (e) {
      console.error('Failed to save members to localStorage', e);
    }
  }, [members]);

  const handleSaveTask = (updatedTask: TaskAssignment) => {
    setTasks((prev) =>
      prev.map((t) => (t.id === updatedTask.id ? updatedTask : t))
    );
  };

  const handleAddMember = (newMember: TeamMember) => {
    setMembers((prev) => [...prev, newMember]);
  };

  const handleEditMember = (
    updatedMember: TeamMember,
    oldName?: string,
    updateInTasks?: boolean
  ) => {
    setMembers((prev) =>
      prev.map((m) => (m.id === updatedMember.id ? updatedMember : m))
    );

    if (updateInTasks && oldName && oldName.toLowerCase() !== updatedMember.name.toLowerCase()) {
      setTasks((prev) =>
        prev.map((t) => {
          let newFas = t.fasilitator;
          let newNot = t.notulen;
          if (isPersonMatched(t.fasilitator, oldName)) {
            newFas = updatedMember.name;
          }
          if (isPersonMatched(t.notulen, oldName)) {
            newNot = updatedMember.name;
          }
          return { ...t, fasilitator: newFas, notulen: newNot };
        })
      );
    }
  };

  const handleDeleteMember = (memberId: string) => {
    setMembers((prev) => prev.filter((m) => m.id !== memberId));
  };

  const handleResetToDefault = () => {
    setTasks(INITIAL_ASSIGNMENTS);
    setMembers(TEAM_MEMBERS);
    try {
      localStorage.removeItem(TASKS_STORAGE_KEY);
      localStorage.removeItem(MEMBERS_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
  };

  // Helper matching names (e.g. Desyre and Desry)
  const isPersonMatched = (personName: string, query: string) => {
    if (!query || query === 'all') return true;
    const p = personName.toLowerCase().trim();
    const q = query.toLowerCase().trim();
    if (p === q) return true;
    if ((p.includes('desy') || p.includes('desr')) && (q.includes('desy') || q.includes('desr'))) return true;
    return false;
  };

  // Filter tasks logic
  const filteredTasks = tasks.filter((t) => {
    if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
    if (focusFilter !== 'all' && t.focusId !== focusFilter) return false;
    if (statusFilter === 'terjadwal' && (!t.tanggalKonsultasi || t.status === 'belum_ditentukan')) return false;
    if (statusFilter === 'belum_ditentukan' && (t.tanggalKonsultasi && t.status !== 'belum_ditentukan')) return false;
    if (memberFilter !== 'all') {
      const matchFas = isPersonMatched(t.fasilitator, memberFilter);
      const matchNot = isPersonMatched(t.notulen, memberFilter);
      if (!matchFas && !matchNot) return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchDpl = t.namaDpl.toLowerCase().includes(q);
      const matchFas = t.fasilitator.toLowerCase().includes(q);
      const matchNot = t.notulen.toLowerCase().includes(q);
      const matchFocus = t.focusKonsultasi.toLowerCase().includes(q);
      const matchHari = t.hari.toLowerCase().includes(q);
      const matchTempat = (t.tempat || '').toLowerCase().includes(q);
      if (!matchDpl && !matchFas && !matchNot && !matchFocus && !matchHari && !matchTempat) return false;
    }
    return true;
  });

  // KPI Statistics
  const totalTasks = tasks.length;
  const lingkunganCount = tasks.filter((t) => t.category === 'Lingkungan').length;
  const kategorialCount = tasks.filter((t) => t.category === 'Kategorial').length;
  const scheduledCount = tasks.filter((t) => t.tanggalKonsultasi && t.status !== 'belum_ditentukan').length;
  const pendingCount = totalTasks - scheduledCount;

  return (
    <div className="min-h-screen bg-slate-100/80 text-slate-900 flex flex-col font-sans">
      {/* Mobile Top Bar */}
      <header className="sticky top-0 z-30 bg-red-900 text-white shadow-md border-b border-red-950/40">
        <div className="max-w-4xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-400 text-red-950 flex items-center justify-center font-bold shadow-xs">
              <Church className="w-6 h-6" />
            </div>
            <div>
              <div className="text-[10px] font-bold uppercase tracking-wider text-amber-300">
                Paroki Katedral Medan
              </div>
              <h1 className="text-sm sm:text-base font-extrabold leading-tight">
                Tim Sinodal • Penugasan Konsultasi
              </h1>
            </div>
          </div>

          <div className="text-right">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold bg-red-800/90 text-amber-200 border border-red-700/60">
              <Sparkles className="w-3 h-3 text-amber-300" />
              <span>{scheduledCount}/{totalTasks} Terjadwal</span>
            </span>
          </div>
        </div>

        {/* Top Desktop & Tablet Navigation */}
        <div className="hidden sm:block border-t border-red-800/80 bg-red-950/30">
          <div className="max-w-4xl mx-auto px-4 flex gap-1">
            {[
              { id: 'tasks', label: 'Penugasan (21)', icon: Layers },
              { id: 'focus', label: '4 Fokus', icon: Calendar },
              { id: 'members', label: `Petugas (${members.length})`, icon: Users },
              { id: 'matrix', label: 'Matriks Tabel', icon: Table },
              { id: 'guide', label: 'Panduan', icon: BookOpen },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`py-2 px-3 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition ${
                    isActive
                      ? 'border-amber-400 text-amber-300 bg-red-900/60'
                      : 'border-transparent text-red-200 hover:text-white hover:bg-red-900/30'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-4xl w-full mx-auto p-3 sm:p-4 flex-1">
        {/* KPI Mini Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Total Sasaran</div>
            <div className="text-base font-extrabold text-slate-900 flex items-baseline gap-1 mt-0.5">
              <span>21</span>
              <span className="text-[10px] text-slate-500 font-normal">
                ({lingkunganCount} Lingk, {kategorialCount} Katg)
              </span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Fokus Sinode</div>
            <div className="text-base font-extrabold text-red-700 flex items-baseline gap-1 mt-0.5">
              <span>4 Fokus</span>
              <span className="text-[10px] text-slate-500 font-normal">Konsultasi</span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Petugas Tim</div>
            <div className="text-base font-extrabold text-blue-700 flex items-baseline gap-1 mt-0.5">
              <span>{members.length} Orang</span>
              <span className="text-[10px] text-slate-500 font-normal">Dapat Diedit</span>
            </div>
          </div>

          <div className="bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
            <div className="text-[10px] uppercase font-bold text-slate-500">Jadwal Terisi</div>
            <div className="text-base font-extrabold text-emerald-700 flex items-baseline gap-1 mt-0.5">
              <span>{scheduledCount}</span>
              <span className="text-[10px] text-slate-500 font-normal">
                / {totalTasks} ({pendingCount} menunggu)
              </span>
            </div>
          </div>
        </div>

        {/* Tab 1: Semua Penugasan */}
        {activeTab === 'tasks' && (
          <div className="space-y-3 pb-20">
            {/* Search and Quick Filters */}
            <div className="bg-white p-3 rounded-2xl border border-slate-200 shadow-xs space-y-2.5">
              {/* Search Bar */}
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari Lingkungan, Kategorial, Fasilitator, atau Notulen..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-8 py-2 text-xs rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-hidden focus:ring-2 focus:ring-red-600 transition"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Filter Chips - Category */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1 text-xs">
                <span className="text-slate-400 text-[11px] font-semibold shrink-0">Sasaran:</span>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('all')}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                    categoryFilter === 'all'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  Semua (21)
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('Lingkungan')}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                    categoryFilter === 'Lingkungan'
                      ? 'bg-slate-900 text-white shadow-2xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  14 Lingkungan
                </button>
                <button
                  type="button"
                  onClick={() => setCategoryFilter('Kategorial')}
                  className={`px-2.5 py-1 rounded-lg font-semibold shrink-0 transition ${
                    categoryFilter === 'Kategorial'
                      ? 'bg-amber-400 text-amber-950 font-bold shadow-2xs'
                      : 'bg-amber-100 text-amber-900 hover:bg-amber-200'
                  }`}
                >
                  7 Kategorial
                </button>
              </div>

              {/* Filter by Team Member & Focus */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1 border-t border-slate-100 text-xs">
                {/* Personil Member Dropdown */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Filter Petugas ({members.length} Orang):
                  </label>
                  <select
                    value={memberFilter}
                    onChange={(e) => setMemberFilter(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  >
                    <option value="all">-- Semua Petugas --</option>
                    {members.map((m) => (
                      <option key={m.id} value={m.name}>
                        {m.name} ({m.origin})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Focus Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Filter 4 Fokus:
                  </label>
                  <select
                    value={focusFilter}
                    onChange={(e) => setFocusFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  >
                    <option value="all">-- Semua 4 Fokus --</option>
                    {FOCUS_LIST.map((f) => (
                      <option key={f.id} value={f.id}>
                        Fokus {f.number}: {f.title}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Status Filter */}
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 mb-1">
                    Status Jadwal:
                  </label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-medium focus:ring-2 focus:ring-red-600 outline-hidden"
                  >
                    <option value="all">Semua Status</option>
                    <option value="terjadwal">Sudah Ada Tanggal ({scheduledCount})</option>
                    <option value="belum_ditentukan">Belum Ditentukan ({pendingCount})</option>
                  </select>
                </div>
              </div>

              {/* Active Filter Indicator */}
              {(memberFilter !== 'all' || categoryFilter !== 'all' || focusFilter !== 'all' || statusFilter !== 'all' || searchQuery) && (
                <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100">
                  <span>Menampilkan <strong>{filteredTasks.length}</strong> dari {totalTasks} sasaran</span>
                  <button
                    type="button"
                    onClick={() => {
                      setMemberFilter('all');
                      setCategoryFilter('all');
                      setFocusFilter('all');
                      setStatusFilter('all');
                      setSearchQuery('');
                    }}
                    className="text-red-700 hover:text-red-800 font-bold"
                  >
                    Reset Filter
                  </button>
                </div>
              )}
            </div>

            {/* List of Tasks */}
            {filteredTasks.length === 0 ? (
              <div className="bg-white p-8 rounded-2xl border border-slate-200 text-center space-y-2">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center">
                  <Filter className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-slate-800 text-sm">Tidak ada penugasan yang sesuai</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto">
                  Coba ubah kata kunci pencarian atau reset filter yang sedang aktif.
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setMemberFilter('all');
                    setCategoryFilter('all');
                    setFocusFilter('all');
                    setStatusFilter('all');
                    setSearchQuery('');
                  }}
                  className="mt-2 text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg hover:bg-slate-800 transition"
                >
                  Tampilkan Semua Penugasan
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {filteredTasks.map((task) => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onEdit={(t) => setEditingTask(t)}
                    onOpenWhatsApp={(t) => setWhatsAppTask(t)}
                    highlightPerson={memberFilter !== 'all' ? memberFilter : undefined}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: 4 Fokus Sinodal */}
        {activeTab === 'focus' && (
          <FocusTab
            tasks={tasks}
            onEditTask={(t) => setEditingTask(t)}
            onOpenWhatsApp={(t) => setWhatsAppTask(t)}
          />
        )}

        {/* Tab 3: Petugas & Personil Tim Sinodal */}
        {activeTab === 'members' && (
          <MembersTab
            tasks={tasks}
            members={members}
            onSelectMemberFilter={(memberName) => {
              setMemberFilter(memberName);
              setActiveTab('tasks');
            }}
            onEditTask={(t) => setEditingTask(t)}
            onAddMember={handleAddMember}
            onEditMember={handleEditMember}
            onDeleteMember={handleDeleteMember}
          />
        )}

        {/* Tab 4: Matriks Resmi & Cetak */}
        {activeTab === 'matrix' && (
          <MatrixTab
            tasks={tasks}
            onEditTask={(t) => setEditingTask(t)}
            onResetToDefault={handleResetToDefault}
          />
        )}

        {/* Tab 5: Panduan Peran & Fokus */}
        {activeTab === 'guide' && <GuideTab />}
      </main>

      {/* Mobile Sticky Bottom Navigation Bar */}
      <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg px-2 py-1 flex items-center justify-around text-[10px]">
        {[
          { id: 'tasks', label: 'Tugas', icon: Layers },
          { id: 'focus', label: '4 Fokus', icon: Calendar },
          { id: 'members', label: 'Petugas', icon: Users },
          { id: 'matrix', label: 'Matriks', icon: Table },
          { id: 'guide', label: 'Panduan', icon: BookOpen },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex flex-col items-center justify-center py-1 px-2 rounded-lg font-medium transition ${
                isActive
                  ? 'text-red-700 font-bold'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 mb-0.5 ${isActive ? 'stroke-[2.5]' : ''}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Modals */}
      <EditScheduleModal
        task={editingTask}
        isOpen={!!editingTask}
        onClose={() => setEditingTask(null)}
        onSave={handleSaveTask}
        members={members}
      />

      <WhatsAppShareModal
        task={whatsAppTask}
        isOpen={!!whatsAppTask}
        onClose={() => setWhatsAppTask(null)}
      />
    </div>
  );
}
