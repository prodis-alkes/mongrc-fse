import React, { Suspense, lazy, useState } from 'react';
import { GRCProvider, useGRC } from './context/GRCContext';
import { Header } from './components/Header';
import { ExecutiveDashboard } from './components/ExecutiveDashboard';
import { AlertTriangle, X } from 'lucide-react';

const HeatmapMatrix = lazy(() =>
  import('./components/HeatmapMatrix').then((m) => ({ default: m.HeatmapMatrix }))
);
const SpreadsheetGrid = lazy(() =>
  import('./components/SpreadsheetGrid').then((m) => ({ default: m.SpreadsheetGrid }))
);
const AuditAndCollaborationView = lazy(() =>
  import('./components/AuditAndCollaborationView').then((m) => ({
    default: m.AuditAndCollaborationView,
  }))
);
const UserManagementView = lazy(() =>
  import('./components/UserManagementView').then((m) => ({ default: m.UserManagementView }))
);
const SatkerDetailDrawer = lazy(() =>
  import('./components/SatkerDetailDrawer').then((m) => ({ default: m.SatkerDetailDrawer }))
);
const CSVImportModal = lazy(() =>
  import('./components/CSVImportModal').then((m) => ({ default: m.CSVImportModal }))
);
const LoginPage = lazy(() =>
  import('./components/LoginPage').then((m) => ({ default: m.LoginPage }))
);
const DatabaseConfigModal = lazy(() =>
  import('./components/DatabaseConfigModal').then((m) => ({ default: m.DatabaseConfigModal }))
);

function ViewFallback() {
  return (
    <div className="py-16 text-center text-xs text-slate-500 dark:text-slate-400">
      Memuat tampilan...
    </div>
  );
}

function MainApp() {
  const {
    activeTab,
    isAuthenticated,
    dbSyncError,
    clearDbSyncError,
    isLoginModalOpen,
    setIsLoginModalOpen,
  } = useGRC();
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  if (isLoginModalOpen) {
    return (
      <Suspense fallback={<ViewFallback />}>
        <LoginPage
          onSuccess={() => setIsLoginModalOpen(false)}
          onExploreAsGuest={() => setIsLoginModalOpen(false)}
        />
      </Suspense>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans text-slate-900 dark:text-slate-100 transition-colors duration-150">
      {/* Top Navigation Bar */}
      <Header
        onOpenImportModal={() => setIsImportModalOpen(true)}
        onOpenLoginModal={() => {
          clearDbSyncError();
          setIsLoginModalOpen(true);
        }}
      />

      {/* Main View Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {isAuthenticated && dbSyncError && (
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

        <Suspense fallback={<ViewFallback />}>
          {activeTab === 'executive' && <ExecutiveDashboard />}
          {activeTab === 'heatmap' && <HeatmapMatrix />}
          {activeTab === 'spreadsheet' && <SpreadsheetGrid />}
          {activeTab === 'audit' && <AuditAndCollaborationView />}
          {activeTab === 'users' && <UserManagementView />}
        </Suspense>
      </main>

      {/* Interactive Flyout Drawers and Modals */}
      <Suspense fallback={null}>
        <SatkerDetailDrawer />
        <CSVImportModal
          isOpen={isImportModalOpen}
          onClose={() => setIsImportModalOpen(false)}
        />
        <DatabaseConfigModal />
      </Suspense>

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
            <span>Ditjen Penanggulangan Penyakit</span>
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
