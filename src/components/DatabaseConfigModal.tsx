import React, { useState, useEffect } from 'react';
import { useGRC } from '../context/GRCContext';
import { APPS_SCRIPT_DO_POST_TEMPLATE } from '../services/googleSheetsService';
import {
  Database,
  X,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  Settings,
  Users,
  BarChart3,
  MessageSquare,
  History,
  Link2,
  Copy,
  Check,
  RotateCcw,
} from 'lucide-react';

export const DatabaseConfigModal: React.FC = () => {
  const {
    isDatabaseModalOpen,
    setIsDatabaseModalOpen,
    isAuthenticated,
    isSheetsLive,
    isSyncingDb,
    lastSyncedAt,
    dbSyncError,
    doPostMissing,
    clearDbSyncError,
    appConfig,
    updateAppConfiguration,
    appsScriptUrl,
    updateAppsScriptUrl,
    resetAppsScriptUrlToDefault,
    satkers,
    users,
    auditLogs,
    comments,
    currentUser,
  } = useGRC();

  const [appTitle, setAppTitle] = useState(appConfig.appTitle);
  const [evaluationPeriod, setEvaluationPeriod] = useState(appConfig.evaluationPeriod);
  const [editLocked, setEditLocked] = useState(appConfig.spreadsheetEditLocked);
  const [scriptUrlInput, setScriptUrlInput] = useState(appsScriptUrl);
  const [savedNotice, setSavedNotice] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ ok: boolean; text: string } | null>(null);
  const [showTemplate, setShowTemplate] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  const isAdmin = currentUser?.role === 'Admin';

  useEffect(() => {
    if (isDatabaseModalOpen) {
      setAppTitle(appConfig.appTitle);
      setEvaluationPeriod(appConfig.evaluationPeriod);
      setEditLocked(appConfig.spreadsheetEditLocked);
      setScriptUrlInput(appsScriptUrl);
      setSavedNotice(false);
    }
  }, [isDatabaseModalOpen, appConfig, appsScriptUrl]);

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

  const handleSaveUrl = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionNotice(null);
    const res = await updateAppsScriptUrl(scriptUrlInput);
    if (res.success) {
      setActionNotice({
        ok: true,
        text: 'Endpoint Google Apps Script berhasil disimpan dan data Spreadsheet telah dimuat ulang.',
      });
    } else if (res.error) {
      setActionNotice({ ok: false, text: res.error });
    }
  };

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(APPS_SCRIPT_DO_POST_TEMPLATE);
      setCopiedTemplate(true);
      setTimeout(() => setCopiedTemplate(false), 2500);
    } catch {
      // ignore clipboard failure
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 dark:bg-black/75 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-400 rounded-xl">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Koneksi Google Spreadsheet & Konfigurasi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Sinkronisasi data MonGRC melalui Google Apps Script Web App
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
          {/* Google Spreadsheet Connection Status */}
          <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-3">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 min-w-0">
                <CheckCircle2
                  className={`w-4 h-4 shrink-0 ${
                    isSheetsLive ? 'text-emerald-600 dark:text-emerald-400' : 'text-amber-500'
                  }`}
                />
                <div className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5 min-w-0">
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    {isAdmin
                      ? 'Admin Aktif (Google Spreadsheet Apps Script)'
                      : isAuthenticated
                      ? `Terautentikasi (${currentUser?.role})`
                      : isSheetsLive
                      ? 'Terhubung ke Google Spreadsheet (Read-Only)'
                      : 'Menghubungkan ke Google Spreadsheet...'}
                  </span>
                  <span className="text-slate-300 dark:text-slate-600 hidden sm:inline">·</span>
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 break-words min-w-0">
                    {isAuthenticated && (
                      <>
                        Login: <span className="font-semibold text-slate-700 dark:text-slate-300">{currentUser?.username}</span>
                      </>
                    )}
                    {!isAuthenticated && (
                      <span>{satkers.length} Satker termuat</span>
                    )}
                    {lastSyncedAt && <span> · Sinkron: {lastSyncedAt}</span>}
                  </span>
                </div>
              </div>

            </div>

            {actionNotice && (
              <div
                className={`p-3 rounded-lg border flex items-start justify-between gap-2 ${
                  actionNotice.ok
                    ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                    : 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800 text-amber-800 dark:text-amber-200'
                }`}
              >
                <span>{actionNotice.text}</span>
                <button
                  type="button"
                  onClick={() => setActionNotice(null)}
                  className="hover:underline shrink-0 cursor-pointer"
                >
                  Tutup
                </button>
              </div>
            )}

            {isAuthenticated && dbSyncError && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200 space-y-2">
                <div className="flex items-start justify-between gap-2">
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
                {doPostMissing && isAdmin && (
                  <div>
                    <button
                      type="button"
                      onClick={() => setShowTemplate((prev) => !prev)}
                      className="text-[11px] font-semibold underline cursor-pointer"
                    >
                      {showTemplate ? 'Sembunyikan contoh fungsi doPost(e)' : 'Lihat contoh fungsi doPost(e) untuk Apps Script'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {showTemplate && isAdmin && (
              <div className="p-3 rounded-lg bg-slate-900 text-slate-100 border border-slate-700 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-semibold text-emerald-300">
                    Contoh handler doPost(e) pada Google Apps Script
                  </span>
                  <button
                    type="button"
                    onClick={() => void handleCopyTemplate()}
                    className="inline-flex items-center gap-1 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-[11px] text-slate-200 cursor-pointer"
                  >
                    {copiedTemplate ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedTemplate ? 'Disalin' : 'Salin Kode'}</span>
                  </button>
                </div>
                <pre className="text-[10px] font-mono overflow-x-auto max-h-44 leading-relaxed text-slate-300">
                  {APPS_SCRIPT_DO_POST_TEMPLATE}
                </pre>
              </div>
            )}

            {/* Live Collection Summary */}
            <div className={`grid grid-cols-2 ${isAdmin ? 'sm:grid-cols-4' : 'sm:grid-cols-3'} gap-2 pt-1`}>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <BarChart3 className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                  <span>Unit Satker</span>
                </div>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {satkers.length} Unit
                </div>
              </div>
              {isAdmin && (
                <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                    <Users className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>Akun Pengguna</span>
                  </div>
                  <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                    {users.length} Akun
                  </div>
                </div>
              )}
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <History className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>Log Audit</span>
                </div>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {auditLogs.length} Entri
                </div>
              </div>
              <div className="p-2.5 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                <div className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 dark:text-slate-400 uppercase">
                  <MessageSquare className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>Catatan Pembinaan</span>
                </div>
                <div className="mt-1 font-mono font-bold text-sm text-slate-900 dark:text-slate-100">
                  {comments.length} Catatan
                </div>
              </div>
            </div>
          </div>

          {/* Apps Script Endpoint Configuration (Admin only) */}
          {isAdmin && (
            <form onSubmit={handleSaveUrl} className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-xs">
                  <Link2 className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
                  <span>Endpoint Web App Google Apps Script</span>
                </h4>
                <button
                  type="button"
                  onClick={() => void resetAppsScriptUrlToDefault()}
                  disabled={isSyncingDb}
                  className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 cursor-pointer"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset URL Default</span>
                </button>
              </div>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  required
                  value={scriptUrlInput}
                  onChange={(e) => setScriptUrlInput(e.target.value)}
                  placeholder="https://script.google.com/macros/s/.../exec"
                  className="flex-1 px-3 py-2 text-xs font-mono bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-emerald-600"
                />
                <button
                  type="submit"
                  disabled={isSyncingDb}
                  className="px-3.5 py-2 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-50 shrink-0 cursor-pointer"
                >
                  Terapkan URL
                </button>
              </div>
            </form>
          )}

          {/* System Configuration Form */}
          <form onSubmit={handleSaveConfig} className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 text-sm">
                <Settings className="w-4 h-4 text-blue-800 dark:text-blue-400" />
                <span>Pengaturan Sistem</span>
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
                    Mencegah pengeditan langsung pada tabel skor oleh operator.
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
                <span>Konfigurasi sistem berhasil disimpan.</span>
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
        </div>
      </div>
    </div>
  );
};
