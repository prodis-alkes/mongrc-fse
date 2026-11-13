import React, { useState, useMemo } from 'react';
import { useGRC } from '../context/GRCContext';
import { UserProfile, UserRole } from '../types/mongrc';
import { 
  Users, 
  UserPlus, 
  ShieldCheck, 
  Search, 
  Filter, 
  Edit2, 
  Trash2, 
  CheckCircle2, 
  XCircle, 
  Lock, 
  Building2, 
  Mail, 
  X, 
  Check, 
  AlertTriangle,
  UserCheck
} from 'lucide-react';

export const UserManagementView: React.FC = () => {
  const { 
    users, 
    currentUser, 
    satkers, 
    addUser, 
    updateUser, 
    deleteUser, 
    toggleUserStatus 
  } = useGRC();

  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);

  // Form fields
  const [formName, setFormName] = useState('');
  const [formUsername, setFormUsername] = useState('');
  const [formNip, setFormNip] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Satker PIC');
  const [formAgency, setFormAgency] = useState('');
  const [formAssignedSatkerNo, setFormAssignedSatkerNo] = useState<number>(1);
  const [formPassword, setFormPassword] = useState('');
  const [formStatus, setFormStatus] = useState<'active' | 'inactive'>('active');
  const [formError, setFormError] = useState<string | null>(null);

  // Delete confirm modal state
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // Filtered users
  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchSearch = 
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.nip.includes(searchQuery) ||
        (u.assignedSatker && u.assignedSatker.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchRole = roleFilter === 'ALL' || u.role === roleFilter;
      const matchStatus = statusFilter === 'ALL' || u.status === statusFilter;

      return matchSearch && matchRole && matchStatus;
    });
  }, [users, searchQuery, roleFilter, statusFilter]);

  // Statistics
  const adminCount = users.filter(u => u.role === 'Admin').length;
  const auditorCount = users.filter(u => u.role === 'Auditor').length;
  const picCount = users.filter(u => u.role === 'Satker PIC').length;
  const activeCount = users.filter(u => u.status === 'active').length;

  const openAddModal = () => {
    setEditingUserId(null);
    setFormName('');
    setFormUsername('');
    setFormNip('');
    setFormEmail('');
    setFormRole('Satker PIC');
    setFormAgency('Balai Kekarantinaan Kesehatan');
    setFormAssignedSatkerNo(1);
    setFormPassword('');
    setFormStatus('active');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (user: UserProfile) => {
    setEditingUserId(user.id);
    setFormName(user.name);
    setFormUsername(user.username);
    setFormNip(user.nip);
    setFormEmail(user.email);
    setFormRole(user.role);
    setFormAgency(user.agency);
    setFormAssignedSatkerNo(user.assignedSatkerNo || 1);
    setFormPassword(user.password || '');
    setFormStatus(user.status);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveUser = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim() || !formUsername.trim() || !formNip.trim() || !formEmail.trim()) {
      setFormError('Nama lengkap, username, NIP, dan email wajib diisi.');
      return;
    }

    const assignedSatkerObj = satkers.find(s => s.no === formAssignedSatkerNo);
    const assignedSatkerName = formRole === 'Satker PIC' ? assignedSatkerObj?.satker : undefined;

    // Generate avatar initials from name
    const initials = formName
      .split(' ')
      .filter(w => !w.includes('.') && !w.includes(','))
      .slice(0, 2)
      .map(w => w[0]?.toUpperCase())
      .join('') || 'PG';

    if (editingUserId) {
      // Update
      const res = updateUser(editingUserId, {
        name: formName.trim(),
        username: formUsername.trim(),
        nip: formNip.trim(),
        email: formEmail.trim(),
        role: formRole,
        agency: formAgency.trim() || (formRole === 'Admin' ? 'Setditjen P2 Kemenkes RI' : 'Balai Karantina Kesehatan'),
        assignedSatker: assignedSatkerName,
        assignedSatkerNo: formRole === 'Satker PIC' ? formAssignedSatkerNo : undefined,
        avatarInitials: initials,
        status: formStatus,
        password: formPassword.trim() || undefined,
      });

      if (!res.success) {
        setFormError(res.error || 'Gagal memperbarui pengguna.');
        return;
      }
    } else {
      // Create
      const res = addUser({
        name: formName.trim(),
        username: formUsername.trim(),
        nip: formNip.trim(),
        email: formEmail.trim(),
        role: formRole,
        agency: formAgency.trim() || (formRole === 'Admin' ? 'Setditjen P2 Kemenkes RI' : 'Balai Karantina Kesehatan'),
        assignedSatker: assignedSatkerName,
        assignedSatkerNo: formRole === 'Satker PIC' ? formAssignedSatkerNo : undefined,
        avatarInitials: initials,
        status: formStatus,
        password: formPassword.trim() || 'kemenkes123',
      });

      if (!res.success) {
        setFormError(res.error || 'Gagal menambahkan pengguna baru.');
        return;
      }
    }

    setIsModalOpen(false);
  };

  const handleConfirmDelete = () => {
    if (!deletingUser) return;
    const res = deleteUser(deletingUser.id);
    if (!res.success) {
      alert(res.error || 'Gagal menghapus pengguna.');
    }
    setDeletingUser(null);
  };

  const isAdmin = currentUser?.role === 'Admin';

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight flex items-center gap-2.5">
            <span>Manajemen Pengguna & Otoritas</span>
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pengelolaan akun ASN, peran hak akses (RBAC), dan penugasan satuan kerja di lingkungan Ditjen P2 Kemenkes RI.
          </p>
        </div>

        {/* Primary Add User Action */}
        {isAdmin && (
          <button
            onClick={openAddModal}
            className="inline-flex items-center gap-2 px-3.5 py-2 text-xs font-semibold text-white bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 rounded-lg shadow-sm transition-colors cursor-pointer shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Pengguna Baru</span>
          </button>
        )}
      </div>

      {/* KPI Overview Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Total Pengguna</span>
            <Users className="w-4 h-4 text-slate-700 dark:text-slate-300" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-slate-900 dark:text-slate-50 tabular-nums">
            {users.length}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            {activeCount} Akun Aktif
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Admin Setditjen</span>
            <ShieldCheck className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-blue-900 dark:text-blue-400 tabular-nums">
            {adminCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Akses Penuh Otoritas
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>Auditor Itjen</span>
            <UserCheck className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-amber-700 dark:text-amber-400 tabular-nums">
            {auditorCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Hak Review & Catatan
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 dark:text-slate-400 text-xs font-semibold">
            <span>PIC Satuan Kerja</span>
            <Building2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-2 text-2xl font-bold font-mono text-emerald-700 dark:text-emerald-400 tabular-nums">
            {picCount}
          </div>
          <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">
            Operator Balai/Loka
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Cari nama, NIP, email, atau satker..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {/* Role and Status Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs w-full sm:w-auto">
          {/* Role Filter */}
          <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg">
            {['ALL', 'Admin', 'Auditor', 'Satker PIC'].map(role => (
              <button
                key={role}
                onClick={() => setRoleFilter(role)}
                className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
                  roleFilter === role
                    ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                {role === 'ALL' ? 'Semua Peran' : role}
              </button>
            ))}
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-700 dark:text-slate-200 focus:outline-hidden"
          >
            <option value="ALL">Semua Status</option>
            <option value="active">Aktif Saja</option>
            <option value="inactive">Nonaktif</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">NIP & Akun Dinas</th>
                <th className="py-3 px-4">Peran (Role)</th>
                <th className="py-3 px-4">Satker Ditugaskan</th>
                <th className="py-3 px-4 text-center">Status Akun</th>
                <th className="py-3 px-4">Login Terakhir</th>
                {isAdmin && <th className="py-3 px-4 text-center">Tindakan</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={isAdmin ? 7 : 6} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Tidak ditemukan pengguna yang sesuai dengan filter pencarian.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const isCurrent = currentUser?.id === user.id;

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                      {/* Name & Avatar */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
                            user.role === 'Admin' ? 'bg-blue-900 dark:bg-blue-700 text-white' :
                            user.role === 'Auditor' ? 'bg-amber-600 text-white' :
                            'bg-slate-700 dark:bg-slate-600 text-white'
                          }`}>
                            {user.avatarInitials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                              <span>{user.name}</span>
                              {isCurrent && (
                                <span className="text-[10px] bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 px-1.5 py-0.2 rounded-sm font-semibold">
                                  Anda
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                              @{user.username}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* NIP & Email */}
                      <td className="py-3 px-4">
                        <div className="font-mono text-slate-800 dark:text-slate-200 font-semibold text-[11px]">
                          {user.nip}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                          <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span>{user.email}</span>
                        </div>
                      </td>

                      {/* Role Badge */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          user.role === 'Admin'
                            ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 border border-transparent dark:border-blue-800/70'
                            : user.role === 'Auditor'
                            ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-transparent dark:border-amber-800/70'
                            : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-transparent dark:border-emerald-800/70'
                        }`}>
                          {user.role === 'Admin' && <ShieldCheck className="w-3 h-3" />}
                          {user.role === 'Auditor' && <UserCheck className="w-3 h-3" />}
                          {user.role === 'Satker PIC' && <Building2 className="w-3 h-3" />}
                          <span>{user.role}</span>
                        </span>
                        <div className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 max-w-[160px] truncate">
                          {user.agency}
                        </div>
                      </td>

                      {/* Assigned Satker */}
                      <td className="py-3 px-4">
                        {user.role === 'Satker PIC' && user.assignedSatker ? (
                          <div>
                            <div className="font-bold text-slate-900 dark:text-slate-100">
                              {user.assignedSatker}
                            </div>
                            <div className="text-[10px] text-slate-500 dark:text-slate-400">
                              Unit Kerja #{user.assignedSatkerNo}
                            </div>
                          </div>
                        ) : (
                          <span className="text-slate-400 dark:text-slate-500 text-[11px]">
                            Semua Satuan Kerja (Pusat)
                          </span>
                        )}
                      </td>

                      {/* Status Toggle */}
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          disabled={!isAdmin || isCurrent}
                          onClick={() => toggleUserStatus(user.id)}
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold transition-colors ${
                            user.status === 'active'
                              ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/70 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700 hover:bg-slate-200 dark:hover:bg-slate-700'
                          } disabled:cursor-not-allowed`}
                          title={isAdmin && !isCurrent ? 'Klik untuk mengubah status akun' : undefined}
                        >
                          {user.status === 'active' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                              <span>Aktif</span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                              <span>Nonaktif</span>
                            </>
                          )}
                        </button>
                      </td>

                      {/* Last Login */}
                      <td className="py-3 px-4 whitespace-nowrap font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {user.lastLogin || '-'}
                      </td>

                      {/* Actions */}
                      {isAdmin && (
                        <td className="py-3 px-4 text-center whitespace-nowrap">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => openEditModal(user)}
                              title="Edit Pengguna"
                              className="p-1.5 text-slate-600 dark:text-slate-400 hover:text-blue-900 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950/50 rounded-md transition-colors"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              disabled={isCurrent}
                              onClick={() => setDeletingUser(user)}
                              title={isCurrent ? 'Tidak dapat menghapus akun Anda sendiri' : 'Hapus Pengguna'}
                              className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-rose-700 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-md transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Tambah / Edit Pengguna */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 shrink-0">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-400 rounded-lg">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                    {editingUserId ? 'Edit Akun Pengguna' : 'Tambah Pengguna Baru'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Konfigurasikan profil pegawai, peran akses, dan penugasan satuan kerja.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveUser} className="p-6 overflow-y-auto space-y-4 custom-scrollbar text-xs flex-1">
              {formError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 text-rose-800 dark:text-rose-300 rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Nama Lengkap */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Lengkap & Gelar *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={e => setFormName(e.target.value)}
                  placeholder="Contoh: Dr. Rian Pratama, M.K.M."
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {/* Username & NIP grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={formUsername}
                    onChange={e => setFormUsername(e.target.value)}
                    placeholder="Contoh: pic.batam"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    NIP (18 Digit) *
                  </label>
                  <input
                    type="text"
                    required
                    value={formNip}
                    onChange={e => setFormNip(e.target.value)}
                    placeholder="198611092010121004"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Email & Kata Sandi */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Email Dinas *
                  </label>
                  <input
                    type="email"
                    required
                    value={formEmail}
                    onChange={e => setFormEmail(e.target.value)}
                    placeholder="nama@kemkes.go.id"
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Kata Sandi (Password)
                  </label>
                  <input
                    type="text"
                    value={formPassword}
                    onChange={e => setFormPassword(e.target.value)}
                    placeholder={editingUserId ? 'Kosongkan jika tidak diubah' : 'Default: kemenkes123'}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800 font-mono"
                  />
                </div>
              </div>

              {/* Role & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Peran Hak Akses (Role) *
                  </label>
                  <select
                    value={formRole}
                    onChange={e => setFormRole(e.target.value as UserRole)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800"
                  >
                    <option value="Admin">Admin (Otoritas Penuh Setditjen)</option>
                    <option value="Auditor">Auditor (Penilai & Reviewer Itjen)</option>
                    <option value="Satker PIC">Satker PIC (Operator Balai / Loka)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Status Akun *
                  </label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as any)}
                    className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800"
                  >
                    <option value="active">Aktif (Dapat Login)</option>
                    <option value="inactive">Nonaktif (Dibekukan)</option>
                  </select>
                </div>
              </div>

              {/* Satker Selection (Only visible if role is Satker PIC) */}
              {formRole === 'Satker PIC' && (
                <div className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 rounded-xl space-y-2">
                  <label className="block font-bold text-blue-900 dark:text-blue-300">
                    Penugasan Satuan Kerja Terkait *
                  </label>
                  <p className="text-[11px] text-blue-700 dark:text-blue-300/80">
                    Satker PIC hanya memiliki izin untuk memperbarui skor indikator pada satuan kerja yang dipilih di bawah ini.
                  </p>
                  <select
                    value={formAssignedSatkerNo}
                    onChange={e => setFormAssignedSatkerNo(parseInt(e.target.value, 10))}
                    className="w-full px-3 py-2 text-xs bg-white dark:bg-slate-800 border border-blue-300 dark:border-slate-700 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-600 font-semibold text-slate-900 dark:text-slate-100"
                  >
                    {satkers.map(s => (
                      <option key={s.no} value={s.no}>
                        #{s.no} - {s.satker} ({s.unitKerja})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Instansi / Unit Kerja */}
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Nama Instansi Dinas
                </label>
                <input
                  type="text"
                  value={formAgency}
                  onChange={e => setFormAgency(e.target.value)}
                  placeholder={formRole === 'Admin' ? 'Setditjen P2 Kemenkes RI' : 'Balai Kekarantinaan Kesehatan Kelas I ...'}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-2 focus:ring-blue-600 focus:bg-white dark:focus:bg-slate-800"
                />
              </div>

              {/* Modal Footer */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-end gap-2 shrink-0">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 dark:bg-blue-700 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 transition-colors shadow-xs"
                >
                  {editingUserId ? 'Simpan Perubahan' : 'Daftarkan Pengguna'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Konfirmasi Hapus Pengguna */}
      {deletingUser && (
        <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl max-w-md w-full p-6 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-3 text-rose-600 dark:text-rose-400 mb-3">
              <AlertTriangle className="w-6 h-6" />
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Hapus Akun Pengguna?
              </h3>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-4 leading-relaxed">
              Apakah Anda yakin ingin menghapus akun <strong>{deletingUser.name}</strong> (@{deletingUser.username})? Tindakan ini akan dicatat dalam log audit sistem.
            </p>
            <div className="flex justify-end gap-2.5">
              <button
                onClick={() => setDeletingUser(null)}
                className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmDelete}
                className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg transition-colors shadow-xs"
              >
                Ya, Hapus Akun
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
