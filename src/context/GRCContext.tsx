import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { User } from 'firebase/auth';
import { BASELINE_SATKERS, INDICATOR_METAS } from '../data/baselineData';
import {
  SatkerData,
  UserProfile,
  ThreadedComment,
  AuditLogEntry,
  AppConfiguration,
} from '../types/mongrc';
import { recalculateSatkerScores, calculateSummaryStats } from '../utils/grcCalculations';
import {
  BOOTSTRAP_ADMIN_EMAIL,
  signInWithGoogle,
  signOutFirebase,
  subscribeToFirebaseAuth,
  testFirestoreConnection,
} from '../services/firebase';
import {
  DEFAULT_APP_CONFIG,
  batchSaveSatkersToFirestore,
  checkIsDatabaseSeeded,
  createAuditLogInFirestore,
  createCommentInFirestore,
  deleteUserFromFirestore,
  resolveUserRoleFromFirestore,
  saveAppConfigToFirestore,
  saveSatkerToFirestore,
  saveUserToFirestore,
  seedInitialDatabase,
  subscribeToAppConfig,
  subscribeToAuditLogs,
  subscribeToComments,
  subscribeToSatkers,
  subscribeToUsers,
  updateCommentInFirestore,
} from '../services/firestoreService';

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
    username: 'admin.p2',
    email: 'budi.hermawan.a@gmail.com',
    nip: '198205142006041002',
    name: 'Budi Hermawan, S.Kom., M.T.I.',
    role: 'Admin',
    agency: 'Setditjen P2 Kemenkes RI',
    avatarInitials: 'BH',
    status: 'active',
    password: 'admin',
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
    password: 'auditor',
    lastLogin: '2026-11-09 14:15',
    createdAt: '2026-01-20 10:30',
  },
  {
    id: 'user-pic-batam',
    username: 'pic.batam',
    email: 'rian.pratama@kemkes.go.id',
    nip: '198611092010121004',
    name: 'Dr. Rian Pratama, M.K.M.',
    role: 'Satker PIC',
    agency: 'Balai Besar Kekarantinaan Kesehatan Batam',
    assignedSatker: 'Batam',
    assignedSatkerNo: 1,
    avatarInitials: 'RP',
    status: 'active',
    password: 'batam',
    lastLogin: '2026-11-10 09:45',
    createdAt: '2026-02-01 11:00',
  },
  {
    id: 'user-pic-denpasar',
    username: 'pic.denpasar',
    email: 'wayan.gede@kemkes.go.id',
    nip: '198804152012011003',
    name: 'I Wayan Gede, S.K.M., M.Kes.',
    role: 'Satker PIC',
    agency: 'Balai Besar Kekarantinaan Kesehatan Denpasar',
    assignedSatker: 'Denpasar',
    assignedSatkerNo: 2,
    avatarInitials: 'WG',
    status: 'active',
    password: 'denpasar',
    lastLogin: '2026-11-08 16:20',
    createdAt: '2026-02-01 11:15',
  },
  {
    id: 'user-pic-soetta',
    username: 'pic.soetta',
    email: 'aulia.rahma@kemkes.go.id',
    nip: '199208202015032002',
    name: 'Aulia Rahma, S.K.M.',
    role: 'Satker PIC',
    agency: 'Balai Besar Kekarantinaan Kesehatan Soekarno Hatta',
    assignedSatker: 'Soekarno Hatta',
    assignedSatkerNo: 5,
    avatarInitials: 'AR',
    status: 'active',
    password: 'soetta',
    lastLogin: '2026-11-09 11:10',
    createdAt: '2026-02-05 13:45',
  },
  {
    id: 'user-pic-bandung',
    username: 'pic.bandung',
    email: 'hendri.santoso@kemkes.go.id',
    nip: '198506122008121002',
    name: 'Hendri Santoso, M.Epid.',
    role: 'Satker PIC',
    agency: 'Balai Kekarantinaan Kesehatan Kelas I Bandung',
    assignedSatker: 'Bandung',
    assignedSatkerNo: 11,
    avatarInitials: 'HS',
    status: 'active',
    password: 'bandung',
    lastLogin: '2026-11-06 17:00',
    createdAt: '2026-02-10 14:00',
  },
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

export type NavigationTab = 'executive' | 'heatmap' | 'spreadsheet' | 'audit' | 'users';

interface GRCContextType {
  satkers: SatkerData[];
  users: UserProfile[];
  currentUser: UserProfile | null;
  setCurrentUser: (user: UserProfile) => void;
  isAuthenticated: boolean;
  login: (identifier: string, password?: string) => { success: boolean; error?: string };
  logout: () => void;
  addUser: (userData: Omit<UserProfile, 'id' | 'createdAt'>) => { success: boolean; error?: string };
  updateUser: (userId: string, updates: Partial<UserProfile>) => { success: boolean; error?: string };
  deleteUser: (userId: string) => { success: boolean; error?: string };
  toggleUserStatus: (userId: string) => void;
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
  // Configuration & Firestore Database Integration
  appConfig: AppConfiguration;
  setSpreadsheetEditLocked: (locked: boolean) => void;
  updateAppConfiguration: (updates: Partial<AppConfiguration>) => Promise<void>;
  firebaseUser: User | null;
  isFirestoreLive: boolean;
  isDbConnected: boolean;
  isDbConnecting: boolean;
  isSyncingDb: boolean;
  isDatabaseSeeded: boolean;
  lastSyncedAt: string | null;
  dbSyncError: string | null;
  clearDbSyncError: () => void;
  isDatabaseModalOpen: boolean;
  setIsDatabaseModalOpen: (open: boolean) => void;
  connectDatabaseWithGoogle: () => Promise<boolean>;
  disconnectDatabase: () => Promise<void>;
  syncLocalStateToDatabase: () => Promise<void>;
}

const GRCContext = createContext<GRCContextType | null>(null);

export const GRCProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Users directory (populated from Firestore only when Admin authenticates)
  const [users, setUsers] = useState<UserProfile[]>([]);

  // Default to non-privileged Public Viewer so visitors immediately view live DB without Google Sign-In
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(PUBLIC_VIEWER_USER);

  const isAuthenticated = currentUser !== null && currentUser.role !== 'Viewer';

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

  // Firebase Auth + Firestore State
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [isFirestoreLive, setIsFirestoreLive] = useState(false);
  const [isDbConnecting, setIsDbConnecting] = useState(false);
  const [isSyncingDb, setIsSyncingDb] = useState(false);
  const [isDatabaseSeeded, setIsDatabaseSeeded] = useState(false);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [dbSyncError, setDbSyncError] = useState<string | null>(null);
  const [isDatabaseModalOpen, setIsDatabaseModalOpen] = useState(false);

  const isDbConnected = firebaseUser !== null;

  const markSyncedNow = useCallback(() => {
    setIsFirestoreLive(true);
    setLastSyncedAt(
      new Date().toLocaleTimeString('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    );
  }, []);

  // 1. Always attach public-read Firestore listeners immediately on boot (no Google Sign-In required!)
  useEffect(() => {
    testFirestoreConnection().then((res) => {
      if (!res.ok && res.message) {
        setDbSyncError(res.message);
      }
    });

    const unsubSatkers = subscribeToSatkers(
      (rows) => {
        if (rows.length > 0) {
          setSatkers(rows);
          setIsDatabaseSeeded(true);
        } else {
          setIsDatabaseSeeded(false);
        }
        markSyncedNow();
      },
      (errMsg) => setDbSyncError(errMsg)
    );

    const unsubConfig = subscribeToAppConfig(
      (cfg) => {
        if (cfg) {
          setAppConfig((prev) => ({ ...prev, ...cfg }));
        }
        markSyncedNow();
      },
      (errMsg) => setDbSyncError(errMsg)
    );

    const unsubLogs = subscribeToAuditLogs(
      (logs) => {
        if (logs.length > 0) {
          setAuditLogs(logs);
        }
        markSyncedNow();
      },
      (errMsg) => setDbSyncError(errMsg)
    );

    const unsubComments = subscribeToComments(
      (comms) => {
        if (comms.length > 0) {
          setComments(comms);
        }
        markSyncedNow();
      },
      (errMsg) => setDbSyncError(errMsg)
    );

    return () => {
      unsubSatkers();
      unsubConfig();
      unsubLogs();
      unsubComments();
    };
  }, [markSyncedNow]);

  // 2. Firebase Auth listener ONLY for Admin/Editor write privileges & PII user management
  useEffect(() => {
    let unsubUsers: (() => void) | null = null;
    let isCancelled = false;

    const cleanupUsers = () => {
      unsubUsers?.();
      unsubUsers = null;
    };

    const unsubAuth = subscribeToFirebaseAuth(async (user) => {
      cleanupUsers();
      setFirebaseUser(user);

      if (!user) {
        setUsers([]);
        setCurrentUser(PUBLIC_VIEWER_USER);
        return;
      }

      setIsSyncingDb(true);
      setDbSyncError(null);

      try {
        const emailLower = (user.email || '').trim().toLowerCase();
        const isBootstrap = emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();
        const { isAdmin, userDoc } = await resolveUserRoleFromFirestore(emailLower, user.uid);
        if (isCancelled) return;

        if (userDoc) {
          setCurrentUser(userDoc);
        } else if (isAdmin) {
          setCurrentUser({
            id: 'user-admin-1',
            uid: user.uid,
            username: 'admin.p2',
            email: emailLower || BOOTSTRAP_ADMIN_EMAIL,
            nip: '198205142006041002',
            name: user.displayName || 'Budi Hermawan, S.Kom., M.T.I.',
            role: 'Admin',
            agency: 'Setditjen P2 Kemenkes RI',
            avatarInitials:
              (user.displayName || 'BH')
                .split(' ')
                .slice(0, 2)
                .map((w) => w[0]?.toUpperCase() || '')
                .join('') || 'BH',
            status: 'active',
            lastLogin: new Date().toLocaleString('id-ID'),
            createdAt: '2026-01-15 09:00',
          });
        } else {
          setCurrentUser({
            id: user.uid,
            uid: user.uid,
            username: emailLower.split('@')[0] || 'pengguna',
            email: emailLower,
            nip: '-',
            name: user.displayName || emailLower || 'Pengguna Google',
            role: 'Auditor',
            agency: 'Kementerian Kesehatan RI',
            avatarInitials: (user.displayName || emailLower || 'PG').slice(0, 2).toUpperCase(),
            status: 'active',
            createdAt: new Date().toLocaleString('id-ID'),
          });
        }

        // Seed Firestore automatically on first Admin sign-in when database is empty
        const alreadySeeded = await checkIsDatabaseSeeded();
        if (isCancelled) return;

        if (!alreadySeeded && isAdmin) {
          await seedInitialDatabase({
            satkers: BASELINE_SATKERS,
            users: INITIAL_USERS,
            config: DEFAULT_APP_CONFIG,
            auditLogs: INITIAL_AUDIT_LOGS,
            comments: INITIAL_COMMENTS,
            authorUid: user.uid,
            updatedBy: user.displayName || user.email || 'Admin',
          });
          setIsDatabaseSeeded(true);
        }

        unsubUsers = subscribeToUsers(
          isBootstrap,
          emailLower || null,
          (dbUsers) => {
            if (dbUsers.length > 0) {
              setUsers(dbUsers);
              markSyncedNow();
            } else if (isAdmin) {
              setUsers(INITIAL_USERS);
            }
          },
          (errMsg) => setDbSyncError(errMsg)
        );
      } catch (err) {
        setDbSyncError(
          err instanceof Error ? err.message : 'Gagal memverifikasi otoritas akun pada Firestore.'
        );
      } finally {
        if (!isCancelled) setIsSyncingDb(false);
      }
    });

    return () => {
      isCancelled = true;
      cleanupUsers();
      unsubAuth();
    };
  }, [markSyncedNow]);

  const connectDatabaseWithGoogle = async (): Promise<boolean> => {
    setIsDbConnecting(true);
    setDbSyncError(null);
    try {
      await signInWithGoogle();
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Gagal masuk dengan Google.';
      setDbSyncError(msg);
      return false;
    } finally {
      setIsDbConnecting(false);
    }
  };

  const disconnectDatabase = async (): Promise<void> => {
    await signOutFirebase();
    setUsers([]);
    setCurrentUser(PUBLIC_VIEWER_USER);
    setDbSyncError(null);
  };

  const syncLocalStateToDatabase = async (): Promise<void> => {
    if (!firebaseUser) {
      setDbSyncError('Silakan masuk sebagai Admin terlebih dahulu untuk menyinkronkan database.');
      return;
    }
    setIsSyncingDb(true);
    setDbSyncError(null);
    try {
      await seedInitialDatabase({
        satkers: satkers.length > 0 ? satkers : BASELINE_SATKERS,
        users: users.length > 0 ? users : INITIAL_USERS,
        config: appConfig,
        auditLogs: auditLogs.length > 0 ? auditLogs : INITIAL_AUDIT_LOGS,
        comments: comments.length > 0 ? comments : INITIAL_COMMENTS,
        authorUid: firebaseUser.uid,
        updatedBy: currentUser?.name || firebaseUser.email || 'Admin',
      });
      setIsDatabaseSeeded(true);
      markSyncedNow();
    } catch (err) {
      setDbSyncError(err instanceof Error ? err.message : 'Gagal menyimpan data ke Firestore.');
    } finally {
      setIsSyncingDb(false);
    }
  };

  // Cache public non-PII GRC data locally for instant load
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

  const login = (identifier: string, password?: string): { success: boolean; error?: string } => {
    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId) {
      return { success: false, error: 'Silakan masukkan Username, Email, atau NIP.' };
    }

    const pool = users.length > 0 ? users : INITIAL_USERS;
    const matchedUser = pool.find(
      (u) =>
        u.username.toLowerCase() === cleanId ||
        u.email.toLowerCase() === cleanId ||
        u.nip === cleanId
    );

    if (!matchedUser) {
      return { success: false, error: 'Pengguna tidak ditemukan dengan kredensial tersebut.' };
    }

    if (matchedUser.status === 'inactive') {
      return {
        success: false,
        error: 'Akun Anda dinonaktifkan oleh Administrator. Hubungi Setditjen P2.',
      };
    }

    if (password && matchedUser.password && password !== matchedUser.password) {
      return { success: false, error: 'Kata sandi tidak sesuai.' };
    }

    const updatedUser: UserProfile = {
      ...matchedUser,
      lastLogin: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setCurrentUser(updatedUser);
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(PUBLIC_VIEWER_USER);
    setUsers([]);
    if (firebaseUser) {
      signOutFirebase().catch(() => {});
    }
  };

  const updateAppConfiguration = async (updates: Partial<AppConfiguration>) => {
    if (!firebaseUser || currentUser?.role !== 'Admin') {
      setDbSyncError('Masuk sebagai Admin (Google) melalui menu Database untuk mengubah konfigurasi.');
      return;
    }

    const nextConfig: AppConfiguration = { ...appConfig, ...updates };
    setAppConfig(nextConfig);
    setIsSyncingDb(true);
    setDbSyncError(null);
    try {
      await saveAppConfigToFirestore(
        nextConfig,
        currentUser?.name || firebaseUser.email || 'Administrator'
      );
      markSyncedNow();
    } catch (err) {
      setDbSyncError(
        err instanceof Error ? err.message : 'Gagal menyimpan konfigurasi ke Firestore.'
      );
    } finally {
      setIsSyncingDb(false);
    }
  };

  const setSpreadsheetEditLocked = (locked: boolean) => {
    if (appConfig.spreadsheetEditLocked === locked) return;
    void updateAppConfiguration({ spreadsheetEditLocked: locked });
  };

  const addUser = (
    userData: Omit<UserProfile, 'id' | 'createdAt'>
  ): { success: boolean; error?: string } => {
    if (!firebaseUser || !currentUser || currentUser.role !== 'Admin') {
      return {
        success: false,
        error: 'Hanya Admin yang sudah masuk ke Database yang berwenang menambahkan pengguna.',
      };
    }

    const exists = users.some(
      (u) =>
        u.username.toLowerCase() === userData.username.toLowerCase() ||
        u.email.toLowerCase() === userData.email.toLowerCase() ||
        u.nip === userData.nip
    );

    if (exists) {
      return { success: false, error: 'Username, Email, atau NIP sudah terdaftar dalam sistem.' };
    }

    const newUser: UserProfile = {
      ...userData,
      id: `user-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      createdAt: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      }),
    };

    setUsers((prev) => [newUser, ...prev]);

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorUid: firebaseUser.uid,
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
    setAuditLogs((prev) => [auditEntry, ...prev]);

    setIsSyncingDb(true);
    Promise.all([
      saveUserToFirestore(newUser),
      createAuditLogInFirestore(auditEntry, firebaseUser.uid),
    ])
      .then(() => markSyncedNow())
      .catch((err) =>
        setDbSyncError(err instanceof Error ? err.message : 'Gagal menyimpan pengguna ke Firestore.')
      )
      .finally(() => setIsSyncingDb(false));

    return { success: true };
  };

  const updateUser = (
    userId: string,
    updates: Partial<UserProfile>
  ): { success: boolean; error?: string } => {
    if (!firebaseUser || !currentUser || currentUser.role !== 'Admin') {
      return {
        success: false,
        error: 'Hanya Admin yang sudah masuk ke Database yang berwenang mengubah profil pengguna.',
      };
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    const updatedUser = { ...targetUser, ...updates };
    setUsers((prev) => prev.map((u) => (u.id === userId ? updatedUser : u)));

    if (currentUser.id === userId) {
      setCurrentUser(updatedUser);
    }

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorUid: firebaseUser.uid,
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

    setIsSyncingDb(true);
    Promise.all([
      saveUserToFirestore(updatedUser, targetUser.email),
      createAuditLogInFirestore(auditEntry, firebaseUser.uid),
    ])
      .then(() => markSyncedNow())
      .catch((err) =>
        setDbSyncError(
          err instanceof Error ? err.message : 'Gagal memperbarui pengguna di Firestore.'
        )
      )
      .finally(() => setIsSyncingDb(false));

    return { success: true };
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    if (!firebaseUser || !currentUser || currentUser.role !== 'Admin') {
      return {
        success: false,
        error: 'Hanya Admin yang sudah masuk ke Database yang berwenang menghapus akun pengguna.',
      };
    }

    if (currentUser.id === userId) {
      return { success: false, error: 'Anda tidak dapat menghapus akun Anda sendiri saat sedang aktif.' };
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) {
      return { success: false, error: 'Pengguna tidak ditemukan.' };
    }

    setUsers((prev) => prev.filter((u) => u.id !== userId));

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorUid: firebaseUser.uid,
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

    setIsSyncingDb(true);
    Promise.all([
      deleteUserFromFirestore(targetUser),
      createAuditLogInFirestore(auditEntry, firebaseUser.uid),
    ])
      .then(() => markSyncedNow())
      .catch((err) =>
        setDbSyncError(err instanceof Error ? err.message : 'Gagal menghapus pengguna di Firestore.')
      )
      .finally(() => setIsSyncingDb(false));

    return { success: true };
  };

  const toggleUserStatus = (userId: string) => {
    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;
    const newStatus = targetUser.status === 'active' ? 'inactive' : 'active';
    updateUser(userId, { status: newStatus });
  };

  const canEditSatker = (satker: SatkerData): boolean => {
    if (!firebaseUser || !currentUser || currentUser.role === 'Viewer') return false;
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
    if (!firebaseUser || !currentUser || currentUser.role === 'Viewer') {
      return {
        success: false,
        error: 'Mode Baca Publik: Masuk sebagai Admin atau PIC terdaftar via menu Database untuk menyimpan perubahan.',
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

    const updatedDraft: SatkerData = {
      ...targetSatker,
      [fieldKey]: newValue,
      lastUpdatedBy: currentUser.name,
      lastUpdatedAt: new Date().toISOString(),
    };

    const finalSatker = recalculateSatkerScores(updatedDraft);
    setSatkers((prev) => prev.map((s) => (s.no === satkerNo ? finalSatker : s)));

    const meta = INDICATOR_METAS.find((m) => m.key === fieldKey);
    const indicatorLabel = meta ? meta.label : String(fieldKey).toUpperCase();

    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      timestamp: new Date().toLocaleString('id-ID', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
      authorUid: firebaseUser.uid,
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
    Promise.all([
      saveSatkerToFirestore(finalSatker),
      createAuditLogInFirestore(auditEntry, firebaseUser.uid),
    ])
      .then(() => markSyncedNow())
      .catch((err) =>
        setDbSyncError(
          err instanceof Error ? err.message : 'Gagal menyimpan perubahan skor ke Firestore.'
        )
      )
      .finally(() => setIsSyncingDb(false));

    return { success: true };
  };

  const addComment = (satkerNo: number, indicatorKey: string, content: string) => {
    if (!firebaseUser || !currentUser || currentUser.role === 'Viewer' || !content.trim()) {
      if (!firebaseUser) {
        setDbSyncError('Masuk sebagai Admin / Editor melalui menu Database untuk mengirim catatan.');
      }
      return;
    }

    const newComment: ThreadedComment = {
      id: `comm-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      satkerNo,
      indicatorKey,
      authorId: currentUser.id,
      authorUid: firebaseUser.uid,
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

    setIsSyncingDb(true);
    createCommentInFirestore(newComment, firebaseUser.uid)
      .then(() => markSyncedNow())
      .catch((err) =>
        setDbSyncError(err instanceof Error ? err.message : 'Gagal menyimpan komentar ke Firestore.')
      )
      .finally(() => setIsSyncingDb(false));
  };

  const updateCommentStatus = (commentId: string, status: ThreadedComment['status']) => {
    if (!firebaseUser || !currentUser || currentUser.role === 'Viewer') {
      setDbSyncError('Masuk sebagai Admin / Auditor melalui menu Database untuk mengubah status catatan.');
      return;
    }

    const existing = comments.find((c) => c.id === commentId);
    setComments((prev) => prev.map((c) => (c.id === commentId ? { ...c, status } : c)));

    if (existing) {
      setIsSyncingDb(true);
      updateCommentInFirestore({ ...existing, status }, firebaseUser.uid)
        .then(() => markSyncedNow())
        .catch((err) =>
          setDbSyncError(
            err instanceof Error ? err.message : 'Gagal memperbarui status komentar di Firestore.'
          )
        )
        .finally(() => setIsSyncingDb(false));
    }
  };

  const bulkImportSatkers = (imported: SatkerData[]) => {
    if (!firebaseUser || currentUser?.role !== 'Admin') {
      setDbSyncError('Hanya Admin yang sudah masuk ke Database yang dapat mengimpor data ke Firestore.');
      return;
    }

    setSatkers(imported);
    const authorName = currentUser.name || 'Administrator';
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorUid: firebaseUser.uid,
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
    Promise.all([
      batchSaveSatkersToFirestore(imported),
      createAuditLogInFirestore(auditEntry, firebaseUser.uid),
    ])
      .then(() => markSyncedNow())
      .catch((err) =>
        setDbSyncError(err instanceof Error ? err.message : 'Gagal mengimpor data ke Firestore.')
      )
      .finally(() => setIsSyncingDb(false));
  };

  const resetToBaselineData = () => {
    if (!firebaseUser || currentUser?.role !== 'Admin') {
      setDbSyncError('Hanya Admin yang sudah masuk ke Database yang dapat mereset data ke baseline.');
      return;
    }

    setSatkers(BASELINE_SATKERS);
    const authorName = currentUser.name || 'Administrator';
    const auditEntry: AuditLogEntry = {
      id: `audit-${Date.now()}`,
      timestamp: new Date().toLocaleString('id-ID'),
      authorUid: firebaseUser.uid,
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
    Promise.all([
      batchSaveSatkersToFirestore(BASELINE_SATKERS),
      createAuditLogInFirestore(auditEntry, firebaseUser.uid),
    ])
      .then(() => markSyncedNow())
      .catch((err) =>
        setDbSyncError(err instanceof Error ? err.message : 'Gagal mereset database Firestore.')
      )
      .finally(() => setIsSyncingDb(false));
  };

  return (
    <GRCContext.Provider
      value={{
        satkers,
        users,
        currentUser,
        setCurrentUser: (u: UserProfile) => setCurrentUser(u),
        isAuthenticated,
        login,
        logout,
        addUser,
        updateUser,
        deleteUser,
        toggleUserStatus,
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
        firebaseUser,
        isFirestoreLive,
        isDbConnected,
        isDbConnecting,
        isSyncingDb,
        isDatabaseSeeded,
        lastSyncedAt,
        dbSyncError,
        clearDbSyncError: () => setDbSyncError(null),
        isDatabaseModalOpen,
        setIsDatabaseModalOpen,
        connectDatabaseWithGoogle,
        disconnectDatabase,
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
