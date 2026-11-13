import React, { useState } from 'react';
import { GRCProvider, useGRC } from './context/GRCContext';
import { Header } from './components/Header';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { HeatmapMatrix } from './components/HeatmapMatrix';
import { SpreadsheetGrid } from './components/SpreadsheetGrid';
import { AuditAndCollaborationView } from './components/AuditAndCollaborationView';
import { UserManagementView } from './components/UserManagementView';
import { SatkerDetailDrawer } from './components/SatkerDetailDrawer';
import { CSVImportModal } from './components/CSVImportModal';
import { LoginPage } from './components/LoginPage';
import { DatabaseConfigModal } from './components/DatabaseConfigModal';
import { Database, AlertTriangle, X } from 'lucide-react';

function MainApp() {
  const {
    activeTab,
    currentUser,
    isDbConnected,
    dbSyncError,
    clearDbSyncError,
    setIsDatabaseModalOpen,
  } = useGRC();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [, setIsLoginModalOpen] = useState(false);

  if (!currentUser) {
    return (
      <LoginPage
        onSuccess={() => setIsLoginModalOpen(false)}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Top Navigation Bar */}
      <Header
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenLoginModal={() => setIsLoginModalOpen(true)}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Contextual Firestore Database Status Banner */}
        {!isDbConnected && (
          <div className="mb-6 p-3 rounded-xl bg-blue-50/80 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-blue-900 dark:text-blue-200">
              <Database className="w-4 h-4 text-blue-700 dark:text-blue-400 shrink-0" />
              <span>
                <strong>Database Cloud Firestore siap dihubungkan.</strong> Masuk dengan akun Google untuk membaca & menyimpan perubahan data, pengguna, dan konfigurasi secara real-time.
              </span>
            </div>
            <button
              onClick={() => setIsDatabaseModalOpen(true)}
              className="px-3 py-1.5 rounded-lg bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 text-white font-semibold shrink-0 transition-colors cursor-pointer"
            >
              Hubungkan Database
            </button>
          </div>
        )}

        {dbSyncError && (
          <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/70 flex items-center justify-between gap-3 text-xs text-rose-900 dark:text-rose-200">
            <div className="flex items-center gap-2.5">
              <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
              <span>{dbSyncError}</span>
            </div>
            <button
              onClick={clearDbSyncError}
              className="p-1 text-rose-600 dark:text-rose-300 hover:bg-rose-100 dark:hover:bg-rose-900/50 rounded-md cursor-pointer"
              aria-label="Tutup peringatan"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {activeTab === 'executive' && <ExecutiveDashboard />}
        {activeTab === 'heatmap' && <HeatmapMatrix />}
        {activeTab === 'spreadsheet' && <SpreadsheetGrid />}
        {activeTab === 'audit' && <AuditAndCollaborationView />}
        {activeTab === 'users' && <UserManagementView />}
      </main>

      {/* Interactive Flyout Drawers and Modals */}
      <SatkerDetailDrawer />
      <CSVImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
      />
      <DatabaseConfigModal />

      {/* Clean, Quiet Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 mt-12 py-6 text-xs text-slate-500 dark:text-slate-400 transition-colors duration-150">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="./assets/aistudio/favicon_f44d1301.png" alt="Logo MonGRC" className="w-5 h-5 object-contain shrink-0" />
            <span className="font-bold text-slate-900 dark:text-slate-100">MonGRC P2</span>
            <span>·</span>
            <span>Sistem Monitoring Tata Kelola, Risiko & Kepatuhan Satuan Kerja</span>
          </div>

          <div className="flex items-center gap-6">
            <span>Kementerian Kesehatan Republik Indonesia</span>
            <span>·</span>
            <span>57 Satker Terdaftar</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <GRCProvider>
      <MainApp />
    </GRCProvider>
  );
}
