import React, { useState, useEffect } from 'react';
import { useGRC } from '../context/GRCContext';
import { FIREBASE_PROJECT_ID, FIRESTORE_DATABASE_ID } from '../services/firebase';
import {
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Lock,
  Unlock,
  Settings,
  Users,
  BarChart3,
  MessageSquare,
  History,
  Globe,
} from 'lucide-react';

export const DatabaseConfigModal: React.FC = () => {
  const {
    isDatabaseModalOpen,
    setIsDatabaseModalOpen,
    firebaseUser,
    isFirestoreLive,
    isDbConnected,
    isDbConnecting,
    isSyncingDb,
    lastSyncedAt,
    dbSyncError,
    clearDbSyncError,
    appConfig,
    updateAppConfiguration,
    connectDatabaseWithGoogle,
    disconnectDatabase,
    syncLocalStateToDatabase,
    satkers,
    users,
    auditLogs,
    comments,
    currentUser,
  } = useGRC();

  const [appTitle, setAppTitle] = useState(appConfig.appTitle);
  const [evaluationPeriod, setEvaluationPeriod] = useState(appConfig.evaluationPeriod);
  const [editLocked, setEditLocked] = useState(appConfig.spreadsheetEditLocked);
  const [savedNotice, setSavedNotice] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    if (isDatabaseModalOpen) {
      setAppTitle(appConfig.appTitle);
      setEvaluationPeriod(appConfig.evaluationPeriod);
      setEditLocked(appConfig.spreadsheetEditLocked);
      setSavedNotice(false);
    }
  }, [isDatabaseModalOpen, appConfig]);

  if (!isDatabaseModalOpen) return null;

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateAppConfiguration({
      appTitle: appTitle.trim() || 'MonGRC Ditjen P2',
      evaluationPeriod: evaluationPeriod.trim() || '2026',
      spreadsheetEditLocked: editLocked,
    });
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Database Firestore & Konfigurasi Sistem
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pembacaan data GRC aktif otomatis untuk semua pengunjung · Login Google khusus Admin/Editor
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsDatabaseModalOpen(false)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto space-y-5 custom-scrollbar text-xs">
          {/* Firebase Authentication & Database Status */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {isDbConnected ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        Admin / Editor Aktif (Baca & Tulis Database)
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Login sebagai: <span className="font-semibold text-slate-700 dark:text-slate-300">{firebaseUser?.email}</span>
                        {lastSyncedAt && <span> · Sinkron terakhir: {lastSyncedAt}</span>}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className={`w-5 h-5 shrink-0 ${isFirestoreLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'}`} />
                    <div>
                      <div className="font-bold text-slate-900 dark:text-slate-100">
                        {isFirestoreLive
                          ? 'Terhubung ke Firestore (Mode Baca Publik)'
                          : 'Menghubungkan ke Firestore...'}
                      </div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        Semua data Satker & konfigurasi terbaca otomatis. Masuk sebagai Admin/Editor untuk mengedit data atau mengelola pengguna.
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {!isDbConnected ? (
                  <button
                    type="button"
                    onClick={() => void connectDatabaseWithGoogle()}
                    disabled={isDbConnecting}
                    className="gsi-material-button"
                  >
                    <div className="gsi-material-button-state" />
                    <div className="gsi-material-button-content-wrapper">
                      <div className="gsi-material-button-icon">
                        <svg version="1.1" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" style={{ display: 'block' }}>
                          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
                          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
                          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
                          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
                          <path fill="none" d="M0 0h48v48H0z" />
                        </svg>
                      </div>
                      <span className="gsi-material-button-contents">
                        {isDbConnecting ? 'Menghubungkan...' : 'Sign in with Google'}
                      </span>
                    </div>
                  </button>
                ) : (
                  <>
                    {isAdmin && (
                      <button
                        type="button"
                        onClick={() => void syncLocalStateToDatabase()}
                        disabled={isSyncingDb}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isSyncingDb ? 'animate-spin' : ''}`} />
                        <span>Sinkronkan Ulang</span>
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void disconnectDatabase()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 font-medium transition-colors cursor-pointer"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Putuskan</span>
                    </button>
                  </>
                )}
              </div>
            </div>

            {dbSyncError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 flex items-start justify-between gap-2">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                  <span>{dbSyncError}</span>
                </div>
                <button
                  onClick={clearDbSyncError}
                  className="text-rose-600 dark:text-rose-300 hover:underline shrink-0 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            {/* Live Collection Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1">
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>/satkers</span>
                </div>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {satkers.length} Unit
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>/users</span>
                </div>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {users.length} Akun
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>/auditLogs</span>
                </div>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {auditLogs.length} Entri
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>/comments</span>
                </div>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {comments.length} Catatan
                </div>
              </div>
            </div>

            <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono flex flex-wrap items-center gap-x-4 gap-y-1">
              <span>Project: {FIREBASE_PROJECT_ID}</span>
              <span>Database ID: {FIRESTORE_DATABASE_ID}</span>
            </div>
          </div>

          {/* System Configuration Form (/config/app) */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                <span>Pengaturan Sistem (/config/app)</span>
              </h4>
              {!isAdmin && (
                <span className="text-[11px] text-amber-700 dark:text-amber-300 font-medium">
                  Hanya Admin yang dapat mengubah konfigurasi
                </span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Judul Aplikasi
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={appTitle}
                  onChange={(e) => setAppTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 disabled:opacity-60 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Periode Evaluasi
                </label>
                <input
                  type="text"
                  disabled={!isAdmin}
                  value={evaluationPeriod}
                  onChange={(e) => setEvaluationPeriod(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 disabled:opacity-60 font-mono focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                />
              </div>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                {editLocked ? (
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                ) : (
                  <Unlock className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                )}
                <div>
                  <div className="font-semibold text-slate-900 dark:text-slate-100">
                    Kunci Pengeditan Grid Spreadsheet
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Diterapkan langsung di antarmuka dan aturan keamanan database Firestore.
                  </div>
                </div>
              </div>
              <button
                type="button"
                disabled={!isAdmin}
                onClick={() => setEditLocked((prev) => !prev)}
                className={`px-3 py-1.5 rounded-lg font-semibold border transition-colors shrink-0 ${
                  editLocked
                    ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-800'
                    : 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800'
                } disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed`}
              >
                {editLocked ? 'Terkunci (Hanya-Baca)' : 'Terbuka (Bisa Edit)'}
              </button>
            </div>

            {savedNotice && (
              <div className="p-2.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>Konfigurasi berhasil disimpan{isDbConnected ? ' ke Cloud Firestore' : ' secara lokal'}.</span>
              </div>
            )}

            {isAdmin && (
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  disabled={isSyncingDb}
                  className="px-4 py-2 rounded-lg bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 text-white font-semibold transition-colors disabled:opacity-50 cursor-pointer"
                >
                  Simpan Konfigurasi
                </button>
              </div>
            )}
          </form>

          {/* GitHub Pages Deployment Note */}
          <div className="p-3.5 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-800/60 flex items-start gap-2.5">
            <Globe className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0 mt-0.5" />
            <div className="text-[11px] text-slate-700 dark:text-slate-300 leading-relaxed">
              <strong className="text-slate-900 dark:text-slate-100">Siap Deploy ke github.io:</strong> Aplikasi ini menggunakan arsitektur statis + Firestore tanpa server backend terpisah. Saat menerbitkan ke <span className="font-mono">*.github.io</span>, pastikan menambahkan domain GitHub Pages Anda di <strong>Firebase Console &rarr; Authentication &rarr; Settings &rarr; Authorized domains</strong> agar login Google berjalan lancar.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
