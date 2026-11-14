import React, { useState } from 'react';
import { useGRC } from '../context/GRCContext';
import { exportSatkersToCSV } from '../utils/grcCalculations';
import { 
  Download, 
  Upload, 
  Check, 
  ChevronDown,
  Users,
  LogOut,
  LogIn,
  Building2,
  Sun,
  Moon,
  Database
} from 'lucide-react';

interface HeaderProps {
  onOpenImportModal: () => void;
  onOpenLoginModal?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenImportModal, onOpenLoginModal }) => {
  const { 
    satkers, 
    users,
    currentUser, 
    setCurrentUser, 
    logout,
    activeTab, 
    setActiveTab, 
    theme,
    toggleTheme,
    isFirestoreLive,
    isDbConnected,
    isSyncingDb,
    setIsDatabaseModalOpen
  } = useGRC();

  const [showUserDropdown, setShowUserDropdown] = useState(false);

  const handleExportCSV = () => {
    const csvContent = exportSatkersToCSV(satkers);
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MonGRC_P2_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleLogout = () => {
    setShowUserDropdown(false);
    logout();
  };

  return (
    <header className="sticky top-0 z-30 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 shadow-xs transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-3 h-16">
          {/* Zone 1: Single text element wordmark with official logo */}
          <div className="flex items-center gap-2.5 shrink-0 cursor-pointer" onClick={() => setActiveTab('executive')}>
            <img 
              src="./assets/aistudio/favicon_f44d1301.png" 
              alt="Logo MonGRC Kemenkes" 
              className="w-9 h-9 object-contain shrink-0 drop-shadow-xs" 
            />
            <div>
              <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap block leading-tight">
                MonGRC
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 text-sm font-medium">
            <button
              onClick={() => setActiveTab('executive')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'executive'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'heatmap'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Heatmap
            </button>
            <button
              onClick={() => setActiveTab('spreadsheet')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'spreadsheet'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Spreadsheet
            </button>
            <button
              onClick={() => setActiveTab('audit')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'audit'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              Log
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-2.5 py-1.5 rounded-md transition-colors whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'users'
                  ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-semibold'
                  : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Manajemen Akun</span>
            </button>
          </nav>

          {/* Zone 3: Theme Toggle + Actions & Active User / Persona */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Light / Dark Mode Toggle Button (positioned between Manajemen Pengguna and Ekspor/Impor CSV) */}
            <button
              type="button"
              onClick={toggleTheme}
              role="switch"
              aria-checked={theme === 'dark'}
              aria-label={theme === 'dark' ? 'Beralih ke mode terang' : 'Beralih ke mode gelap'}
              title={theme === 'dark' ? 'Mode Gelap aktif — Klik untuk Mode Terang' : 'Mode Terang aktif — Klik untuk Mode Gelap'}
              className="inline-flex items-center gap-0.5 p-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition-colors shrink-0 cursor-pointer"
            >
              <span
                className={`p-1 rounded-md transition-all ${
                  theme === 'light'
                    ? 'bg-white text-amber-500 shadow-xs'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
              </span>
              <span
                className={`p-1 rounded-md transition-all ${
                  theme === 'dark'
                    ? 'bg-slate-900 text-blue-400 shadow-xs'
                    : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
              </span>
            </button>

            {/* Quick CSV Import / Export */}
            <div className="hidden sm:flex items-center gap-1.5 mr-0.5">
              <button
                onClick={handleExportCSV}
                title="Ekspor ke CSV resmi MonGRC"
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Download</span>
              </button>

              <button
                onClick={onOpenImportModal}
                disabled={currentUser?.role !== 'Admin'}
                title={
                  currentUser?.role === 'Admin'
                    ? 'Impor pembaruan dari berkas CSV'
                    : 'Impor CSV khusus Admin (Masuk Admin untuk mengaktifkan)'
                }
                className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-45 disabled:cursor-not-allowed"
              >
                <Upload className="w-3.5 h-3.5 text-slate-600 dark:text-slate-300" />
                <span>Upload</span>
              </button>

              <button
                onClick={() => setIsDatabaseModalOpen(true)}
                title={
                  isDbConnected
                    ? 'Admin/Editor Terautentikasi (Baca & Tulis Firestore)'
                    : isFirestoreLive
                    ? 'Terhubung ke Database Firestore (Mode Baca Publik) — Klik untuk Login Admin'
                    : 'Status & Konfigurasi Database Firestore'
                }
                className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  isDbConnected || isFirestoreLive
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 hover:bg-emerald-100 dark:hover:bg-emerald-900/60'
                    : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 border-slate-300 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700'
                }`}
              >
                <Database className={`w-3.5 h-3.5 ${isDbConnected || isFirestoreLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-600 dark:text-slate-300'}`} />
                <span className="hidden xl:inline">{isDbConnected ? 'Admin DB' : 'Live DB'}</span>
                <span
                  className={`w-2 h-2 rounded-full ${
                    isSyncingDb
                      ? 'bg-amber-500 animate-pulse'
                      : isDbConnected || isFirestoreLive
                      ? 'bg-emerald-500'
                      : 'bg-slate-300 dark:bg-slate-600'
                  }`}
                />
              </button>
            </div>

            {/* User Account / Profile Dropdown (Show compact Sign-In CTA for Public Viewer) */}
            {currentUser && currentUser.role !== 'Viewer' ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserDropdown(prev => !prev)}
                  className="flex items-center gap-2 p-1.5 pr-2.5 text-left rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700/80 transition-colors cursor-pointer"
                  title="Menu Profil & Manajemen Akun"
                >
                  <div className={`w-7 h-7 rounded-full text-white flex items-center justify-center text-xs font-semibold shrink-0 ${
                    currentUser.role === 'Admin' ? 'bg-blue-900 dark:bg-blue-700' :
                    currentUser.role === 'Auditor' ? 'bg-amber-600' :
                    'bg-slate-700'
                  }`}>
                    {currentUser.avatarInitials}
                  </div>
                  <div className="hidden lg:block text-left">
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[125px]">
                      {currentUser.name}
                    </div>
                    <div className="text-[10px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <span className="font-semibold text-blue-700 dark:text-blue-400">{currentUser.role}</span>
                      <span>·</span>
                      <span className="truncate max-w-[90px]">{currentUser.assignedSatker || currentUser.agency}</span>
                    </div>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
                </button>

                {/* Dropdown Menu */}
                {showUserDropdown && (
                  <div 
                    className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-50 animate-in fade-in duration-100"
                    onMouseLeave={() => setShowUserDropdown(false)}
                  >
                    {/* User Profile Card */}
                    <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/60">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-blue-900 dark:bg-blue-700 text-white flex items-center justify-center text-xs font-bold shrink-0">
                          {currentUser.avatarInitials}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                            {currentUser.name}
                          </div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                            NIP: {currentUser.nip}
                          </div>
                          <div className="text-[10px] text-blue-800 dark:text-blue-400 font-semibold mt-0.5">
                            {currentUser.agency}
                          </div>
                        </div>
                      </div>

                      {currentUser.assignedSatker && (
                        <div className="mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700 text-[11px] flex items-center gap-1 text-slate-700 dark:text-slate-300">
                          <Building2 className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400" />
                          <span>Unit Ditugaskan: <strong>{currentUser.assignedSatker}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Manage Users Link & Google Sheets Config */}
                    <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 space-y-0.5">
                      <button
                        onClick={() => {
                          setActiveTab('users');
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium flex items-center gap-2 transition-colors"
                      >
                        <Users className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                        <span>Manajemen Akun</span>
                      </button>
                      <button
                        onClick={() => {
                          setIsDatabaseModalOpen(true);
                          setShowUserDropdown(false);
                        }}
                        className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-700 dark:text-slate-200 font-medium flex items-center justify-between transition-colors"
                      >
                        <span className="flex items-center gap-2">
                          <Database className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                          <span>Database Firestore & Config</span>
                        </span>
                        <span
                          className={`w-2 h-2 rounded-full ${
                            isDbConnected ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-600'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Quick Switch Persona Section */}
                    <div className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                      Beralih Akun (Simulasi Peran):
                    </div>
                    <div className="max-h-48 overflow-y-auto px-1 space-y-0.5 custom-scrollbar">
                      {users.map(u => {
                        const isSelected = u.id === currentUser.id;
                        return (
                          <button
                            key={u.id}
                            onClick={() => {
                              setCurrentUser(u);
                              setShowUserDropdown(false);
                            }}
                            className={`w-full px-3 py-1.5 text-left rounded-md flex items-center justify-between text-xs transition-colors ${
                              isSelected ? 'bg-blue-50 dark:bg-blue-950/60 text-blue-900 dark:text-blue-200 font-bold' : 'hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            <div className="truncate mr-2">
                              <span className="font-medium">{u.name}</span>
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 block">
                                {u.role} {u.assignedSatker ? `· ${u.assignedSatker}` : ''}
                              </span>
                            </div>
                            {isSelected && <Check className="w-3.5 h-3.5 text-blue-700 dark:text-blue-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    {/* Logout Button */}
                    <div className="mt-1 pt-1 border-t border-slate-100 dark:border-slate-800 px-2">
                      <button
                        onClick={handleLogout}
                        className="w-full text-left px-3 py-2 rounded-lg text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Keluar dari Akun (Logout)</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => (onOpenLoginModal ? onOpenLoginModal() : setIsDatabaseModalOpen(true))}
                title="Masuk dengan Username/Email Satker atau Google Admin"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 dark:bg-blue-700 dark:hover:bg-blue-600 rounded-lg shadow-xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Sub-Navigation Bar */}
        <div className="flex md:hidden overflow-x-auto py-2 gap-1 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={() => setActiveTab('executive')}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'executive' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Dashboard
          </button>
          <button
            onClick={() => setActiveTab('heatmap')}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'heatmap' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Heatmap
          </button>
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'spreadsheet' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Spreadsheet
          </button>
          <button
            onClick={() => setActiveTab('audit')}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'audit' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Log Update
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`px-3 py-1 text-xs rounded-md whitespace-nowrap shrink-0 ${
              activeTab === 'users' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-200 font-semibold' : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Pengguna
          </button>
        </div>
      </div>
    </header>
  );
};
