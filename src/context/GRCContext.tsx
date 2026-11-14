import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { BASELINE_SATKERS, INDICATOR_METAS } from '../data/baselineData';
import {
  DEFAULT_ADMIN_EMAIL,
  DEFAULT_ADMIN_PASSWORD,
  DEFAULT_ADMIN_USERNAME,
  DEFAULT_USER_PASSWORD,
  buildInitialSatkerUsers,
  resolveIdentifierToEmail,
} from '../data/satkerUsers';
import {
  SatkerData,
  UserProfile,
  ThreadedComment,
  AuditLogEntry,
  AppConfiguration,
} from '../types/mongrc';
import { recalculateSatkerScores, calculateSummaryStats } from '../utils/grcCalculations';
import {
  DEFAULT_APP_CONFIG,
  DEFAULT_APPS_SCRIPT_URL,
  fetchSatkersFromAppsScript,
  getStoredAppsScriptUrl,
  pushBulkSatkersToAppsScript,
  pushSatkerUpdateToAppsScript,
  setStoredAppsScriptUrl,
} from '../services/googleSheetsService';

export const PUBLIC_VIEWER_USER: UserProfile = {
  id: 'public-viewer',
  username: 'pemantau',
  email: '',
  nip: '-',
  name: 'Mode Pemantau (Publik)',
  role: 'Viewer',
  agency: 'Ditjen P2 Kemenkes RI',
  avatarInitials: 'MP',
  status: 'active',
  createdAt: '2026-01-01 00:00',
};

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-admin-1',
    username: DEFAULT_ADMIN_USERNAME,
    email: DEFAULT_ADMIN_EMAIL,
    nip: '198205142006041002',
    name: 'Budi Hermawan, S.Kom., M.T.I.',
    role: 'Admin',
    agency: 'Setditjen P2 Kemenkes RI',
    avatarInitials: 'BH',
    status: 'active',
    lastLogin: '2026-11-10 08:30',
    createdAt: '2026-01-15 09:00',
  },
  {
    id: 'user-auditor-1',
    username: 'auditor.itjen',
    email: 'endang.sulastri@kemkes.go.id',
    nip: '197903222003122001',
    name: 'Dra. Endang Sulastri, M.M., CRGP',
    role: 'Auditor',
    agency: 'Inspektorat Jenderal Kemenkes RI',
    avatarInitials: 'ES',
    status: 'active',
    lastLogin: '2026-11-09 14:15',
    createdAt: '2026-01-20 10:30',
  },
  ...buildInitialSatkerUsers(BASELINE_SATKERS),
];

export const DEMO_USERS = INITIAL_USERS;

const INITIAL_COMMENTS: ThreadedComment[] = [
  {
    id: 'comm-1',
    satkerNo: 1,
    indicatorKey: 'iepk',
    authorId: 'user-auditor-1',
    authorName: 'Dra. Endang Sulastri, M.M., CRGP',
    authorRole: 'Auditor',
    content:
      'Capaian IEPK Batam saat ini 2.99 masih di bawah ambang batas 4.00. Perlu percepatan pelaporan LHKPN dan evaluasi berkala tim penanganan benturan kepentingan.',
    createdAt: '2026-11-08 09:15',
    status: 'in_review',
  },
  {
    id: 'comm-2',
    satkerNo: 1,
    indicatorKey: 'iepk',
    authorId: 'user-pic-batam',
    authorName: 'Dr. Rian Pratama, M.K.M.',
    authorRole: 'Satker PIC',
    content:
      'Siap Ibu Auditor, berkas evidensi pengendalian gratifikasi per November telah kami unggah ke e-SPIP. Mohon re-verifikasi.',
    createdAt: '2026-11-09 11:30',
    status: 'in_review',
  },
  {
    id: 'comm-3',
    satkerNo: 2,
    indicatorKey: 'nka',
    authorId: 'user-admin-1',
    authorName: 'Budi Hermawan, S.Kom., M.T.I.',
    authorRole: 'Admin',
    content:
      'Realisasi NKA Denpasar 74.69 perlu peningkatan menuju target nasional 92.55. Mohon koordinasi dengan KPPN setempat terkait percepatan serapan output strategis triwulan IV.',
    createdAt: '2026-11-07 14:20',
    status: 'open',
  },
  {
    id: 'comm-4',
    satkerNo: 11,
    indicatorKey: 'spip',
    authorId: 'user-auditor-1',
    authorName: 'Dra. Endang Sulastri, M.M., CRGP',
    authorRole: 'Auditor',
    content:
      'Apresiasi untuk BKK Kelas I Bandung dengan capaian SPIP 4.53 dan SAKIP 84.85, telah melampaui seluruh indikator maturitas governance.',
    createdAt: '2026-11-06 16:45',
    status: 'resolved',
  },
];

const INITIAL_AUDIT_LOGS: AuditLogEntry[] = [
  {
    id: 'audit-1',
    timestamp: '2026-11-08 10:20:15',
    authorName: 'Budi Hermawan, S.Kom., M.T.I.',
    authorRole: 'Admin',
    satkerNo: 11,
    satkerName: 'Bandung',
    indicatorKey: 'spip',
    indicatorLabel: 'SPIP',
    oldValue: '4.40',
    newValue: '4.53',
    reason: 'Validasi laporan penjaminan mutu BPKP tahap II tahun 2026',
  },
  {
    id: 'audit-2',
    timestamp: '2026-11-07 15:45:00',
    authorName: 'Dr. Rian Pratama, M.K.M.',
    authorRole: 'Satker PIC',
    satkerNo: 1,
    satkerName: 'Batam',
    indicatorKey: 'ikpa',
    indicatorLabel: 'IKPA',
    oldValue: '98.50',
    newValue: '99.02',
    reason: 'Pembaruan data resmi OMSPAN Kemenkeu per 31 Oktober',
  },
];

const USERS_STORAGE_KEY = 'mongrc_users_v1';
const PASSWORDS_STORAGE_KEY = 'mongrc_user_passwords_v1';
const SESSION_USER_KEY = 'mongrc_session_user_id_v1';

function buildDefaultPasswordMap(): Record<string, string> {
  const map: Record<string, string> = {};
  for (const u of INITIAL_USERS) {
    const key = u.email.trim().toLowerCase();
    map[key] = u.id === 'user-admin-1' ? DEFAULT_ADMIN_PASSWORD : DEFAULT_USER_PASSWORD;
  }
  return map;
}

function loadStoredPasswords(): Record<string, string> {
  const defaults = buildDefaultPasswordMap();
  try {
    const raw = localStorage.getItem(PASSWORDS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === 'object') {
        return { ...defaults, ...parsed };
      }
    }
  } catch {
    // ignore storage read error
  }
  return defaults;
}

function saveStoredPasswords(map: Record<string, string>): void {
  try {
    localStorage.setItem(PASSWORDS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // ignore storage write error
  }
}

export type NavigationTab = 'executive' | 'heatmap' | 'spreadsheet' | 'audit' | 'users';

interface GRCContextType {
  satkers: SatkerData[];
  users: UserProfile[];
  currentUser: UserProfile | null;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  addUser: (
    userData: Omit<UserProfile, 'id' | 'createdAt'> & { provisionAuthLogin?: boolean }
  ) => Promise<{ success: boolean; error?: string }>;
  updateUser: (userId: string, updates: Partial<UserProfile>) => { success: boolean; error?: string };
  deleteUser: (userId: string) => { success: boolean; error?: string };
  toggleUserStatus: (userId: string) => void;
  provisionAllSatkerAccounts: (
    onProgress?: (done: number, total: number, email: string) => void
  ) => Promise<{
    created: number;
    linked: number;
    failed: number;
    errors: string[];
  }>;
  resetAdminCredentialsToDefault: () => Promise<{ success: boolean; mode?: 'updated'; error?: string }>;
  isProvisioningUsers: boolean;
  selectedSatkerNo: number | null;
  setSelectedSatkerNo: (no: number | null) => void;
  activeTab: NavigationTab;
  setActiveTab: (tab: NavigationTab) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;
  comments: ThreadedComment[];
  auditLogs: AuditLogEntry[];
  summaryStats: ReturnType<typeof calculateSummaryStats>;
  updateSatkerField: (
    satkerNo: number,
    fieldKey: keyof SatkerData,
    newValue: number | null,
    reason: string
  ) => { success: boolean; error?: string };
  addComment: (satkerNo: number, indicatorKey: string, content: string) => void;
  updateCommentStatus: (commentId: string, status: ThreadedComment['status']) => void;
  bulkImportSatkers: (imported: SatkerData[]) => void;
  resetToBaselineData: () => void;
  canEditSatker: (satker: SatkerData) => boolean;
  theme: 'light' | 'dark';
  setTheme: (theme: 'light' | 'dark') => void;
  toggleTheme: () => void;
  // Google Spreadsheet (Google Apps Script) Configuration & Sync
  appConfig: AppConfiguration;
  setSpreadsheetEditLocked: (locked: boolean) => void;
  updateAppConfiguration: (updates: Partial<AppConfiguration>) => Promise<void>;
  appsScriptUrl: string;
  updateAppsScriptUrl: (url: string) => Promise<{ success: boolean; error?: string }>;
  resetAppsScriptUrlToDefault: () => Promise<{ success: boolean; error?: string }>;
  isSheetsLive: boolean;
  isDbConnected: boolean;
  isSyncingDb: boolean;
  lastSyncedAt: string | null;
  dbSyncError: string | null;
  doPostMissing: boolean;
  clearDbSyncError: () => void;
  isDatabaseModalOpen: boolean;
  setIsDatabaseModalOpen: (open: boolean) => void;
  isLoginModalOpen: boolean;
  setIsLoginModalOpen: (open: boolean) => void;
  refreshFromSpreadsheet: () => Promise<boolean>;
  syncLocalStateToDatabase: () => Promise<{ success: boolean; error?: string }>;
}

const GRCContext = createContext<GRCContextType | null>(null);

export const GRCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [directoryUsers, setDirectoryUsers] = useState<UserProfile[]>(() => {
    try {
      const stored = localStorage.getItem(USERS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as UserProfile[];
        if (Array.isArray(parsed) && parsed.length > 0) {
          // Strip any legacy plaintext password fields if present
          return parsed.map(({ password: _pw, ...rest }) => rest);
        }
      }
    } catch {
      // ignore
    }
    return INITIAL_USERS;
  });

  useEffect(() => {
    try {
      const sanitized = directoryUsers.map(({ password: _pw, ...rest }) => rest);
      localStorage.setItem(USERS_STORAGE_KEY, JSON.stringify(sanitized));
    } catch {
      // ignore
    }
  }, [directoryUsers]);

  const [currentUser, setCurrentUserState] = useState<UserProfile | null>(() => {
    try {
      const savedUserId = localStorage.getItem(SESSION_USER_KEY);
      if (savedUserId) {
        const storedUsersRaw = localStorage.getItem(USERS_STORAGE_KEY);
        const pool: UserProfile[] = storedUsersRaw ? JSON.parse(storedUsersRaw) : INITIAL_USERS;
        const found = pool.find((u) => u.id === savedUserId && u.status === 'active');
        if (found) {
          const { password: _pw, ...safeUser } = found;
          return safeUser;
        }
      }
    } catch {
      // ignore
    }
    return PUBLIC_VIEWER_USER;
  });

  const setCurrentUser = useCallback((user: UserProfile) => {
    const { password: _pw, ...safeUser } = user;
    setCurrentUserState(safeUser);
    try {
      if (safeUser.role === 'Viewer') {
        localStorage.removeItem(SESSION_USER_KEY);
      } else {
        localStorage.setItem(SESSION_USER_KEY, safeUser.id);
      }
    } catch {
      // ignore
    }
  }, []);

  const isAuthenticated = currentUser !== null && currentUser.role !== 'Viewer';
  const users = currentUser?.role === 'Admin' ? directoryUsers : [];

  const [activeTab, setActiveTab] = useState<NavigationTab>('executive');
  const [selectedSatkerNo, setSelectedSatkerNo] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const [appConfig, setAppConfig] = useState<AppConfiguration>(() => {
    try {
      const storedConfig = localStorage.getItem('mongrc_config_v1');
      if (storedConfig) {
        const parsed = JSON.parse(storedConfig);
        return {
          ...DEFAULT_APP_CONFIG,
          ...parsed,
          spreadsheetEditLocked:
            parsed.spreadsheetEditLocked !== undefined
              ? Boolean(parsed.spreadsheetEditLocked)
              : DEFAULT_APP_CONFIG.spreadsheetEditLocked,
        };
      }
    } catch {
      // ignore
    }
    return DEFAULT_APP_CONFIG;
  });

  useEffect(() => {
    try {
      localStorage.setItem('mongrc_config_v1', JSON.stringify(appConfig));
    } catch {
      // ignore
    }
  }, [appConfig]);

  // Theme state
  const [theme, setThemeState] = useState<'light' | 'dark'>(() => {
    try {
      const saved = localStorage.getItem('mongrc_theme');
      if (saved === 'dark' || saved === 'light') return saved;
      if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
        return 'dark';
      }
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    try {
      localStorage.setItem('mongrc_theme', theme);
    } catch {
      // ignore
    }
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme === 'dark');
      document.documentElement.style.colorScheme = theme;
    }
  }, [theme]);

  const setTheme = (nextTheme: 'light' | 'dark') => setThemeState(nextTheme);
  const toggleTheme = () => setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));

  const [satkers, setSatkers] = useState<SatkerData[]>(() => {
    try {
      const stored = localStorage.getItem('mongrc_satkers_v1');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed.map((s: SatkerData) =>
            s.category === 'Direktorat' ? { ...s, category: 'Pusat' as const } : s
          );
        }
      }
    } catch (e) {
      console.warn('Failed to parse stored satkers, falling back to baseline:', e);
    }
    return BASELINE_SATKERS;
  });

  const [comments, setComments] = useState<ThreadedComment[]>(() => {
    try {
      const stored = localStorage.getItem('mongrc_comments_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored comments:', e);
    }
    return INITIAL_COMMENTS;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>(() => {
    try {
      const stored = localStorage.getItem('mongrc_audit_logs_v1');
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.warn('Failed to parse stored audit logs:', e);
    }
    return INITIAL_AUDIT_LOGS;
  });

  // Google Spreadsheet (Google Apps Script) State
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => getStoredAppsScriptUrl());
  const [isSheetsLive, setIsSheetsLive] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isProvisioningUsers, setIsProvisioningUsers] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [dbSyncError, setDbSyncError] = useState<string | null>(null);
  const [doPostMissing, setDoPostMissing] = useState(false);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const isDbConnected = isSheetsLive;

  const markSyncedNow = useCallback(() => {
    setIsSheetsLive(true);
    setLastSyncedAt(
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, []);

  const refreshFromSpreadsheet = useCallback(
    async (targetUrl?: string): Promise<boolean> => {
      const urlToFetch = (targetUrl || appsScriptUrl || DEFAULT_APPS_SCRIPT_URL).trim();
      setIsSyncingDb(true);
      try {
        const rows = await fetchSatkersFromAppsScript(urlToFetch);
        setSatkers(rows);
        setDbSyncError(null);
        markSyncedNow();
        return true;
      } catch (err) {
        setIsSheetsLive(false);
        setDbSyncError(
          err instanceof Error
            ? err.message
            : 'Gagal memuat data dari Google Spreadsheet (Apps Script).'
        );
        return false;
      } finally {
        setIsSyncingDb(false);
      }
    },
    [appsScriptUrl, markSyncedNow]
  );

  // Initial load from Google Spreadsheet + periodic refresh every 30s when tab is active
  useEffect(() => {
    void refreshFromSpreadsheet(appsScriptUrl);
    const intervalId = window.setInterval(() => {
      if (typeof document !== 'undefined' && !document.hidden) {
        void refreshFromSpreadsheet(appsScriptUrl);
      }
    }, 30000);
    return () => window.clearInterval(intervalId);
  }, [appsScriptUrl, refreshFromSpreadsheet]);

  const updateAppsScriptUrl = async (
    url: string
  ): Promise<{ success: boolean; error?: string }> => {
    const clean = url.trim();
    if (!clean.startsWith('https://script.google.com/')) {
      return {
        success: false,
        error: 'URL harus berupa endpoint Web App Google Apps Script (https://script.google.com/...).',
      };
    }
    const stored = setStoredAppsScriptUrl(clean);
    setAppsScriptUrl(stored);
    setDoPostMissing(false);
    const ok = await refreshFromSpreadsheet(stored);
    if (!ok) {
      return {
        success: false,
        error: 'URL disimpan, namun gagal mengambil data JSON dari Google Apps Script.',
      };
    }
    return { success: true };
  };

  const resetAppsScriptUrlToDefault = async () => {
    return updateAppsScriptUrl(DEFAULT_APPS_SCRIPT_URL);
  };

  const syncLocalStateToDatabase = async (): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || currentUser.role !== 'Admin') {
      const msg = 'Masuk sebagai Admin terlebih dahulu untuk mengirim seluruh data ke Google Spreadsheet.';
      setDbSyncError(msg);
      return { success: false, error: msg };
    }
    setIsSyncingDb(true);
    setDbSyncError(null);
    try {
      const res = await pushBulkSatkersToAppsScript(
        appsScriptUrl,
        satkers.length > 0 ? satkers : BASELINE_SATKERS,
        currentUser.name || 'Admin'
      );
      if (!res.ok) {
        if (res.doPostMissing) setDoPostMissing(true);
        const msg = res.message || 'Gagal menyinkronkan data ke Google Spreadsheet.';
        setDbSyncError(msg);
        return { success: false, error: msg };
      }
      setDoPostMissing(false);
      markSyncedNow();
      return { success: true };
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Cache GRC data locally for instant startup
  useEffect(() => {
    try {
      localStorage.setItem('mongrc_satkers_v1', JSON.stringify(satkers));
    } catch (e) {
      console.warn('Storage error for satkers:', e);
    }
  }, [satkers]);

  useEffect(() => {
    try {
      localStorage.setItem('mongrc_comments_v1', JSON.stringify(comments));
    } catch (e) {
      console.warn('Storage error for comments:', e);
    }
  }, [comments]);

  useEffect(() => {
    try {
      localStorage.setItem('mongrc_audit_logs_v1', JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Storage error for audit logs:', e);
    }
  }, [auditLogs]);

  const summaryStats = calculateSummaryStats(satkers);

  const login = async (
    identifier: string,
    password?: string
  ): Promise<{ success: boolean; error?: string }> => {
    const cleanId = identifier.trim();
    if (!cleanId) {
      return { success: false, error: 'Silakan masukkan Username atau Email.' };
    }
    if (!password) {
      return { success: false, error: 'Silakan masukkan kata sandi.' };
    }

    const pool = directoryUsers.length > 0 ? directoryUsers : INITIAL_USERS;
    const resolvedEmail = resolveIdentifierToEmail(cleanId, pool);
    if (!resolvedEmail) {
      return { success: false, error: 'Username/Email atau kata sandi tidak sesuai.' };
    }

    const matchedProfile = pool.find(
      (u) => u.email.trim().toLowerCase() === resolvedEmail
    );
    if (!matchedProfile) {
      return { success: false, error: 'Username/Email atau kata sandi tidak sesuai.' };
    }
    if (matchedProfile.status === 'inactive') {
      return {
        success: false,
        error: 'Akun Anda saat ini dinonaktifkan oleh Administrator.',
      };
    }

    const passwordMap = loadStoredPasswords();
    const expectedPassword =
      passwordMap[resolvedEmail] ||
      (matchedProfile.username.toLowerCase() === DEFAULT_ADMIN_USERNAME
        ? DEFAULT_ADMIN_PASSWORD
        : DEFAULT_USER_PASSWORD);

    if (password !== expectedPassword) {
      return { success: false, error: 'Username/Email atau kata sandi tidak sesuai.' };
    }

    const loggedInProfile: UserProfile = {
      ...matchedProfile,
      lastLogin: new Date().toLocaleString('id-ID'),
    };
    setDirectoryUsers((prev) =>
      prev.map((u) => (u.id === loggedInProfile.id ? loggedInProfile : u))
    );
    setCurrentUser(loggedInProfile);
    setDbSyncError(null);
    return { success: true };
  };

  const logout = () => {
    setDbSyncError(null);
    setCurrentUser(PUBLIC_VIEWER_USER);
  };

  const updateAppConfiguration = async (updates: Partial<AppConfiguration>) => {
    if (!currentUser || currentUser.role !== 'Admin') {
      setDbSyncError('Masuk sebagai Admin untuk mengubah konfigurasi sistem.');
      return;
    }

    const nextConfig: AppConfiguration = {
      ...appConfig,
      ...updates,
      updatedBy: currentUser.name,
      updatedAt: new Date().toISOString(),
    };
    setAppConfig(nextConfig);
  };

  const setSpreadsheetEditLocked = (locked: boolean) => {
    if (appConfig.spreadsheetEditLocked === locked) return;
    void updateAppConfiguration({ spreadsheetEditLocked: locked });
  };

  const addUser = async (
    userData: Omit<UserProfile, 'id' | 'createdAt'> & { provisionAuthLogin?: boolean }
  ): Promise<{ success: boolean; error?: string }> => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return {
        success: false,
        error: 'Hanya Admin yang berwenang menambahkan pengguna.',
      };
    }

    const exists = directoryUsers.some(
      (u) =>
        u.username.toLowerCase() === userData.username.toLowerCase() ||
        u.email.toLowerCase() === userData.email.toLowerCase() ||
        u.nip === userData.nip
    );

    if (exists) {
      return { success: false, error: 'Username, Email, atau NIP sudah terdaftar dalam sistem.' };
    }

    const { provisionAuthLogin: _prov, password: rawPassword, ...profileFields } = userData;
    const emailLower = profileFields.email.trim().toLowerCase();
    const initialPassword = (rawPassword && rawPassword.trim()) || DEFAULT_USER_PASSWORD;

    const passwords = loadStoredPasswords();
    passwords[emailLower] = initialPassword;
    saveStoredPasswords(passwords);

    const newUser: UserProfile = {
      ...profileFields,
      email: emailLower,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorName: currentUser.name,
      authorRole: 'Admin',
      satkerNo: userData.assignedSatkerNo || 0,
      satkerName: userData.assignedSatker || 'Setditjen P2',
      indicatorKey: 'user_management',
      indicatorLabel: 'Penambahan Akun Pengguna',
      oldValue: '-',
      newValue: `${newUser.name} (${newUser.role})`,
      reason: `Akun baru ditambahkan oleh ${currentUser.name}`,
    };

    setDirectoryUsers((prev) => [newUser, ...prev]);
    setAuditLogs((prev) => [auditEntry, ...prev]);
    return { success: true };
  };

  const provisionAllSatkerAccounts = async (
    onProgress?: (done: number, total: number, email: string) => void
  ): Promise<{
    created: number;
    linked: number;
    failed: number;
    errors: string[];
  }> => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return {
        created: 0,
        linked: 0,
        failed: 1,
        errors: ['Hanya Admin yang berwenang menyinkronkan akun Satker.'],
      };
    }

    setIsProvisioningUsers(true);
    const satkerSeeds = buildInitialSatkerUsers(satkers.length > 0 ? satkers : BASELINE_SATKERS);
    const passwords = loadStoredPasswords();
    const byEmail = new Map<string, UserProfile>();
    for (const u of directoryUsers) {
      byEmail.set(u.email.trim().toLowerCase(), u);
    }

    let created = 0;
    let linked = 0;
    const syncedList: UserProfile[] = [];

    for (let i = 0; i < satkerSeeds.length; i++) {
      const seed = satkerSeeds[i];
      const emailKey = seed.email.trim().toLowerCase();
      const existing = byEmail.get(emailKey);
      onProgress?.(i + 1, satkerSeeds.length, seed.email);

      if (existing) {
        linked += 1;
        syncedList.push({
          ...existing,
          username: seed.username,
          email: emailKey,
          role: 'Satker PIC',
          assignedSatker: seed.assignedSatker,
          assignedSatkerNo: seed.assignedSatkerNo,
          status: existing.status || 'active',
        });
      } else {
        created += 1;
        syncedList.push(seed);
      }

      if (!passwords[emailKey]) {
        passwords[emailKey] = DEFAULT_USER_PASSWORD;
      }
    }

    saveStoredPasswords(passwords);

    setDirectoryUsers((prev) => {
      const merged = new Map<string, UserProfile>();
      for (const u of prev) merged.set(u.email.trim().toLowerCase(), u);
      for (const s of syncedList) merged.set(s.email.trim().toLowerCase(), s);
      return Array.from(merged.values());
    });

    setIsProvisioningUsers(false);
    return { created, linked, failed: 0, errors: [] };
  };

  const resetAdminCredentialsToDefault = async (): Promise<{
    success: boolean;
    mode?: 'updated';
    error?: string;
  }> => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return {
        success: false,
        error: 'Masuk sebagai Admin terlebih dahulu untuk mereset kredensial admin.p2.',
      };
    }

    const adminEmail = DEFAULT_ADMIN_EMAIL.trim().toLowerCase();
    const passwords = loadStoredPasswords();
    passwords[adminEmail] = DEFAULT_ADMIN_PASSWORD;
    saveStoredPasswords(passwords);

    const baseAdmin =
      directoryUsers.find((u) => u.id === 'user-admin-1') ||
      directoryUsers.find((u) => u.email.trim().toLowerCase() === adminEmail) ||
      INITIAL_USERS[0];

    const updatedAdmin: UserProfile = {
      ...baseAdmin,
      username: DEFAULT_ADMIN_USERNAME,
      email: adminEmail,
      role: 'Admin',
      status: 'active',
    };

    setDirectoryUsers((prev) => {
      const exists = prev.some((u) => u.id === updatedAdmin.id);
      return exists
        ? prev.map((u) => (u.id === updatedAdmin.id ? updatedAdmin : u))
        : [updatedAdmin, ...prev];
    });
    if (currentUser.id === updatedAdmin.id || currentUser.role === 'Admin') {
      setCurrentUser(updatedAdmin);
    }

    return { success: true, mode: 'updated' };
  };

  const updateUser = (
    userId: string,
    updates: Partial<UserProfile>
  ): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return {
        success: false,
        error: 'Hanya Admin yang berwenang mengubah profil pengguna.',
      };
    }

    const targetUser = directoryUsers.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    const { password: nextPassword, ...profileUpdates } = updates;
    const updatedUser: UserProfile = {
      ...targetUser,
      ...profileUpdates,
      email: (profileUpdates.email || targetUser.email).trim().toLowerCase(),
    };

    const passwords = loadStoredPasswords();
    const oldEmailKey = targetUser.email.trim().toLowerCase();
    const newEmailKey = updatedUser.email;
    if (nextPassword && nextPassword.trim()) {
      passwords[newEmailKey] = nextPassword.trim();
    } else if (oldEmailKey !== newEmailKey && passwords[oldEmailKey]) {
      passwords[newEmailKey] = passwords[oldEmailKey];
    }
    saveStoredPasswords(passwords);

    setDirectoryUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));
    if (currentUser.id === userId) {
      setCurrentUser(updatedUser);
    }

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorName: currentUser.name,
      authorRole: 'Admin',
      satkerNo: updatedUser.assignedSatkerNo || 0,
      satkerName: updatedUser.assignedSatker || 'Setditjen P2',
      indicatorKey: 'user_management',
      indicatorLabel: 'Pembaruan Akun Pengguna',
      oldValue: `${targetUser.name} (${targetUser.role} · ${targetUser.status})`,
      newValue: `${updatedUser.name} (${updatedUser.role} · ${updatedUser.status})`,
      reason: `Pembaruan data akun oleh ${currentUser.name}`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    return { success: true };
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    if (!currentUser || currentUser.role !== 'Admin') {
      return {
        success: false,
        error: 'Hanya Admin yang berwenang menghapus akun pengguna.',
      };
    }

    if (currentUser.id === userId) {
      return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.' };
    }

    const targetUser = directoryUsers.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    setDirectoryUsers((prev) => prev.filter((u) => u.id !== userId));

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorName: currentUser.name,
      authorRole: 'Admin',
      satkerNo: targetUser.assignedSatkerNo || 0,
      satkerName: targetUser.assignedSatker || 'Setditjen P2',
      indicatorKey: 'user_management',
      indicatorLabel: 'Penghapusan Akun Pengguna',
      oldValue: `${targetUser.name} (${targetUser.role})`,
      newValue: 'Dihapus',
      reason: `Penghapusan akun oleh ${currentUser.name}`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    return { success: true };
  };

  const toggleUserStatus = (userId: string) => {
    const targetUser = directoryUsers.find((u) => u.id === userId);
    if (!targetUser) return;
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    updateUser(userId, { status: newStatus });
  };

  const canEditSatker = (satker: SatkerData): boolean => {
    if (!currentUser || currentUser.role === 'Viewer') return false;
    if (currentUser.role === 'Admin') return true;
    if (currentUser.role === 'Satker PIC') {
      return currentUser.assignedSatker?.toLowerCase() === satker.satker.toLowerCase();
    }
    return false;
  };

  const updateSatkerField = (
    satkerNo: number,
    fieldKey: keyof SatkerData,
    newValue: number | null,
    reason: string
  ): { success: boolean; error?: string } => {
    const readOnlyCalculatedFields: Array<keyof SatkerData> = [
      'pSki',
      'pSpip',
      'pMri',
      'pIepk',
      'pWbkRb',
      'pSakip',
      'pNka',
      'pIkpa',
      'pIpAsn',
      'pArsip',
      'pPekppp',
      'average',
    ];
    if (readOnlyCalculatedFields.includes(fieldKey)) {
      return {
        success: false,
        error: 'Kolom skor normalisasi persentase dan komposit bersifat otomatis (Read-Only) dan dihitung dari skor riil masing-masing dimensi.',
      };
    }

    if (!currentUser || currentUser.role === 'Viewer') {
      return {
        success: false,
        error: 'Mode Baca Publik: Masuk sebagai Admin atau PIC terdaftar untuk menyimpan perubahan.',
      };
    }

    const targetSatker = satkers.find((s) => s.no === satkerNo);
    if (!targetSatker) {
      return { success: false, error: 'Satuan kerja tidak ditemukan.' };
    }

    if (!canEditSatker(targetSatker)) {
      return {
        success: false,
        error: `Akses ditolak: Anda login sebagai ${currentUser.role} (${currentUser.name}) dan tidak berwenang mengubah nilai untuk ${targetSatker.satker}.`,
      };
    }

    const oldValue = targetSatker[fieldKey] as number | null;
    if (oldValue === newValue) {
      return { success: true };
    }

    const nowFormatted = new Date().toLocaleString('id-ID', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const updatedDraft: SatkerData = {
      ...targetSatker,
      [fieldKey]: newValue,
      lastUpdatedBy: currentUser.name,
      lastUpdatedAt: nowFormatted,
    };

    const finalSatker = recalculateSatkerScores(updatedDraft);
    setSatkers((prev) => prev.map((s) => (s.no === satkerNo ? finalSatker : s)));

    const meta = INDICATOR_METAS.find((m) => m.key === fieldKey);
    const indicatorLabel = meta ? meta.label : String(fieldKey).toUpperCase();

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: nowFormatted,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      satkerNo,
      satkerName: targetSatker.satker,
      indicatorKey: String(fieldKey),
      indicatorLabel,
      oldValue: oldValue !== null ? oldValue : '-',
      newValue: newValue !== null ? newValue : '-',
      reason: reason || 'Pembaruan skor berkala oleh ' + currentUser.name,
    };

    setAuditLogs((prev) => [auditEntry, ...prev]);

    setIsSyncingDb(true);
    pushSatkerUpdateToAppsScript(appsScriptUrl, finalSatker, currentUser.name)
      .then((res) => {
        if (res.ok) {
          setDoPostMissing(false);
          setDbSyncError(null);
          markSyncedNow();
        } else {
          if (res.doPostMissing) setDoPostMissing(true);
          if (res.message) setDbSyncError(res.message);
        }
      })
      .finally(() => setIsSyncingDb(false));

    return { success: true };
  };

  const addComment = (satkerNo: number, indicatorKey: string, content: string) => {
    if (!currentUser || currentUser.role === 'Viewer' || !content.trim()) {
      return;
    }

    const newComment: ThreadedComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      satkerNo,
      indicatorKey,
      authorId: currentUser.id,
      authorName: currentUser.name,
      authorRole: currentUser.role,
      content: content.trim(),
      createdAt: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
      status: 'open',
    };

    setComments((prev) => [newComment, ...prev]);
  };

  const updateCommentStatus = (commentId: string, status: ThreadedComment['status']) => {
    if (!currentUser || currentUser.role === 'Viewer') {
      return;
    }
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, status } : c)));
  };

  const bulkImportSatkers = (imported: SatkerData[]) => {
    if (!currentUser || currentUser.role !== 'Admin') {
      setDbSyncError('Hanya Admin yang dapat mengimpor data ke Google Spreadsheet.');
      return;
    }

    setSatkers(imported);
    const authorName = currentUser.name || 'Administrator';
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorName,
      authorRole: 'Admin',
      satkerNo: 0,
      satkerName: 'Semua Satker',
      indicatorKey: 'bulk_import',
      indicatorLabel: 'Impor Massal CSV',
      oldValue: 'Versi Sebelumnya',
      newValue: `${imported.length} Satker Dimuat`,
      reason: `Pembaruan massal melalui unggah berkas CSV MonGRC oleh ${authorName}`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    setIsSyncingDb(true);
    pushBulkSatkersToAppsScript(appsScriptUrl, imported, authorName)
      .then((res) => {
        if (res.ok) {
          setDoPostMissing(false);
          setDbSyncError(null);
          markSyncedNow();
        } else {
          if (res.doPostMissing) setDoPostMissing(true);
          if (res.message) setDbSyncError(res.message);
        }
      })
      .finally(() => setIsSyncingDb(false));
  };

  const resetToBaselineData = () => {
    if (!currentUser || currentUser.role !== 'Admin') {
      setDbSyncError('Hanya Admin yang dapat mereset data ke baseline.');
      return;
    }

    setSatkers(BASELINE_SATKERS);
    const authorName = currentUser.name || 'Administrator';
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorName,
      authorRole: 'Admin',
      satkerNo: 0,
      satkerName: 'Semua Satker',
      indicatorKey: 'system_reset',
      indicatorLabel: 'Reset Data Standar',
      oldValue: 'Skor Kustom',
      newValue: 'Baseline 57 Satker Resmi',
      reason: `Pengembalian data ke standar rujukan awal Kemenkes oleh ${authorName}`,
    };
    setAuditLogs((prev) => [auditEntry, ...prev]);

    setIsSyncingDb(true);
    pushBulkSatkersToAppsScript(appsScriptUrl, BASELINE_SATKERS, authorName)
      .then((res) => {
        if (res.ok) {
          setDoPostMissing(false);
          setDbSyncError(null);
          markSyncedNow();
        } else {
          if (res.doPostMissing) setDoPostMissing(true);
          if (res.message) setDbSyncError(res.message);
        }
      })
      .finally(() => setIsSyncingDb(false));
  };

  return (
    <GRCContext.Provider
      value={{
        satkers,
        users,
        currentUser,
        isAuthenticated,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
        provisionAllSatkerAccounts,
        resetAdminCredentialsToDefault,
        isProvisioningUsers,
        selectedSatkerNo,
        setSelectedSatkerNo,
        activeTab,
        setActiveTab,
        searchQuery,
        setSearchQuery,
        selectedCategory,
        setSelectedCategory,
        comments,
        auditLogs,
        summaryStats,
        updateSatkerField,
        addComment,
        updateCommentStatus,
        bulkImportSatkers,
        resetToBaselineData,
        canEditSatker,
        theme,
        setTheme,
        toggleTheme,
        appConfig,
        setSpreadsheetEditLocked,
        updateAppConfiguration,
        appsScriptUrl,
        updateAppsScriptUrl,
        resetAppsScriptUrlToDefault,
        isSheetsLive,
        isDbConnected,
        isSyncingDb,
        lastSyncedAt,
        dbSyncError,
        doPostMissing,
        clearDbSyncError: () => setDbSyncError(null),
        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        isLoginModalOpen,
        setIsLoginModalOpen,
        refreshFromSpreadsheet,
        syncLocalStateToDatabase,
      }}
    >
      {children}
    </GRCContext.Provider>
  );
};

export const useGRC = () => {
  const ctx = useContext(GRCContext);
  if (!ctx) throw new Error('useGRC must be used within a GRCProvider');
  return ctx;
};
