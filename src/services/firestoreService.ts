import {
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  setDoc,
  deleteDoc,
  where,
  writeBatch,
  Unsubscribe,
} from 'firebase/firestore';
import {
  db,
  BOOTSTRAP_ADMIN_EMAIL,
  OperationType,
  handleFirestoreError,
} from './firebase';
import {
  AppConfiguration,
  AuditLogEntry,
  SatkerData,
  ThreadedComment,
  UserProfile,
} from '../types/mongrc';

export const DEFAULT_APP_CONFIG: AppConfiguration = {
  spreadsheetEditLocked: true,
  evaluationPeriod: '2026',
  appTitle: 'MonGRC Ditjen P2',
};

function sanitizeSatkerForFirestore(satker: SatkerData): Record<string, unknown> {
  const docData: Record<string, unknown> = {
    no: Math.trunc(satker.no),
    unitKerja: satker.unitKerja,
    satker: satker.satker,
    category: satker.category === 'Direktorat' ? 'Pusat' : satker.category,
    ski: Number(satker.ski) || 0,
    spip: Number(satker.spip) || 0,
    mri: Number(satker.mri) || 0,
    iepk: Number(satker.iepk) || 0,
    spipt: Number(satker.spipt) || 0,
    wbkRb: Number(satker.wbkRb) || 0,
    sakip: Number(satker.sakip) || 0,
    nka: Number(satker.nka) || 0,
    ikpa: Number(satker.ikpa) || 0,
    ipAsn: Number(satker.ipAsn) || 0,
    arsip: Number(satker.arsip) || 0,
    pekppp: satker.pekppp !== null && satker.pekppp !== undefined ? Number(satker.pekppp) : null,
    pSki: Number(satker.pSki) || 0,
    pSpip: Number(satker.pSpip) || 0,
    pMri: Number(satker.pMri) || 0,
    pIepk: Number(satker.pIepk) || 0,
    pWbkRb: Number(satker.pWbkRb) || 0,
    pSakip: Number(satker.pSakip) || 0,
    pNka: Number(satker.pNka) || 0,
    pIkpa: Number(satker.pIkpa) || 0,
    pIpAsn: Number(satker.pIpAsn) || 0,
    pArsip: Number(satker.pArsip) || 0,
    pPekppp: Number(satker.pPekppp) || 0,
    average: Number(satker.average) || 0,
  };
  if (satker.notes) docData.notes = satker.notes;
  if (satker.lastUpdatedBy) docData.lastUpdatedBy = satker.lastUpdatedBy;
  if (satker.lastUpdatedAt) docData.lastUpdatedAt = satker.lastUpdatedAt;
  return docData;
}

function sanitizeUserForFirestore(user: UserProfile): Record<string, unknown> {
  // Never persist passwords in Firestore
  const docData: Record<string, unknown> = {
    id: user.id,
    username: user.username,
    email: user.email.trim().toLowerCase(),
    nip: user.nip,
    name: user.name,
    role: user.role,
    agency: user.agency,
    avatarInitials: user.avatarInitials,
    status: user.status,
    createdAt: user.createdAt,
  };
  if (user.uid) docData.uid = user.uid;
  if (user.assignedSatker) docData.assignedSatker = user.assignedSatker;
  if (typeof user.assignedSatkerNo === 'number') {
    docData.assignedSatkerNo = Math.trunc(user.assignedSatkerNo);
  }
  if (user.lastLogin) docData.lastLogin = user.lastLogin;
  return docData;
}

function sanitizeUserRoleEntry(user: UserProfile): Record<string, unknown> {
  const emailLower = user.email.trim().toLowerCase();
  const entry: Record<string, unknown> = {
    email: emailLower,
    userId: user.id,
    role: user.role,
    status: user.status,
  };
  if (user.assignedSatker) entry.assignedSatker = user.assignedSatker;
  if (typeof user.assignedSatkerNo === 'number') {
    entry.assignedSatkerNo = Math.trunc(user.assignedSatkerNo);
  }
  return entry;
}

function sanitizeUidRoleEntry(user: UserProfile, uid: string): Record<string, unknown> {
  const entry: Record<string, unknown> = {
    uid,
    email: user.email.trim().toLowerCase(),
    userId: user.id,
    role: user.role,
    status: user.status,
  };
  if (user.assignedSatker) entry.assignedSatker = user.assignedSatker;
  if (typeof user.assignedSatkerNo === 'number') {
    entry.assignedSatkerNo = Math.trunc(user.assignedSatkerNo);
  }
  return entry;
}

function sanitizeAuditLogForFirestore(
  entry: AuditLogEntry,
  authorUid: string
): Record<string, unknown> {
  return {
    id: entry.id,
    timestamp: entry.timestamp,
    authorUid,
    authorName: entry.authorName,
    authorRole: entry.authorRole,
    satkerNo: Math.trunc(entry.satkerNo),
    satkerName: entry.satkerName,
    indicatorKey: entry.indicatorKey,
    indicatorLabel: entry.indicatorLabel,
    oldValue: String(entry.oldValue ?? '-').slice(0, 200),
    newValue: String(entry.newValue ?? '-').slice(0, 200),
    reason: String(entry.reason || 'Pembaruan data').slice(0, 500),
  };
}

function sanitizeCommentForFirestore(
  comment: ThreadedComment,
  fallbackUid: string
): Record<string, unknown> {
  return {
    id: comment.id,
    satkerNo: Math.trunc(comment.satkerNo),
    indicatorKey: comment.indicatorKey,
    authorId: comment.authorId,
    authorUid: comment.authorUid || fallbackUid,
    authorName: comment.authorName,
    authorRole: comment.authorRole,
    content: comment.content.slice(0, 2000),
    createdAt: comment.createdAt,
    status: comment.status,
  };
}

export async function checkIsDatabaseSeeded(): Promise<boolean> {
  try {
    const snap = await getDocs(collection(db, 'satkers'));
    return !snap.empty;
  } catch {
    return false;
  }
}

export async function resolveUserRoleFromFirestore(
  email: string,
  uid: string,
  emailVerified = false
): Promise<{
  isAdmin: boolean;
  userDoc: UserProfile | null;
  hasFirestoreRole: boolean;
}> {
  const emailLower = email.trim().toLowerCase();
  const isBootstrap = emailVerified && emailLower === BOOTSTRAP_ADMIN_EMAIL.toLowerCase();

  try {
    const adminSnap = await getDoc(doc(db, 'admins', uid)).catch(() => null);
    const uidRoleSnap = await getDoc(doc(db, 'uidRoles', uid)).catch(() => null);

    let emailRoleSnap = null;
    if (emailVerified && emailLower) {
      emailRoleSnap = await getDoc(doc(db, 'userRoles', emailLower)).catch(() => null);
    }

    const activeRoleData = uidRoleSnap?.exists()
      ? uidRoleSnap.data()
      : emailRoleSnap?.exists()
      ? emailRoleSnap.data()
      : null;

    let userDoc: UserProfile | null = null;
    if (activeRoleData?.userId) {
      const uSnap = await getDoc(doc(db, 'users', String(activeRoleData.userId))).catch(() => null);
      if (uSnap?.exists()) {
        userDoc = uSnap.data() as UserProfile;
      }
    }

    const isAdmin =
      isBootstrap ||
      Boolean(adminSnap?.exists()) ||
      (activeRoleData?.role === 'Admin' && activeRoleData?.status === 'active');

    return {
      isAdmin,
      userDoc,
      hasFirestoreRole: Boolean(isBootstrap || adminSnap?.exists() || activeRoleData),
    };
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `uidRoles/${uid}`);
    return { isAdmin: isBootstrap, userDoc: null, hasFirestoreRole: isBootstrap };
  }
}

function formatFirestoreUiError(rawError: string): string {
  const lower = rawError.toLowerCase();
  if (lower.includes('permission') || lower.includes('insufficient')) {
    return 'Akses database ditolak: akun Anda belum memiliki izin untuk operasi ini.';
  }
  if (lower.includes('offline') || lower.includes('network') || lower.includes('unavailable')) {
    return 'Koneksi ke server database terganggu. Periksa koneksi internet Anda.';
  }
  return 'Terjadi kesalahan saat menyinkronkan data dengan database.';
}

export async function ensureBootstrapAdminDocsInFirestore(params: {
  uid: string;
  email: string;
  name: string;
  adminProfile: UserProfile;
}): Promise<void> {
  const emailLower = params.email.trim().toLowerCase();
  const batch = writeBatch(db);
  const nowIso = new Date().toISOString();

  batch.set(doc(db, 'admins', params.uid), {
    uid: params.uid,
    email: emailLower,
    name: params.name,
    grantedAt: nowIso,
    grantedBy: emailLower,
  });

  const adminWithUid: UserProfile = {
    ...params.adminProfile,
    uid: params.uid,
    email: emailLower,
  };

  batch.set(doc(db, 'users', adminWithUid.id), sanitizeUserForFirestore(adminWithUid));
  batch.set(doc(db, 'userRoles', emailLower), sanitizeUserRoleEntry(adminWithUid));
  batch.set(doc(db, 'uidRoles', params.uid), sanitizeUidRoleEntry(adminWithUid, params.uid));

  try {
    await batch.commit();
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.WRITE, `admins/${params.uid}`);
    throw new Error(formatFirestoreUiError(info.error));
  }
}

export function subscribeToSatkers(
  onData: (satkers: SatkerData[]) => void,
  onError: (msg: string) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'satkers'),
    (snapshot) => {
      if (snapshot.empty) {
        onData([]);
        return;
      }
      const rows = snapshot.docs
        .map((d) => d.data() as SatkerData)
        .sort((a, b) => a.no - b.no);
      onData(rows);
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.LIST, 'satkers');
      onError(formatFirestoreUiError(info.error));
    }
  );
}

export function subscribeToAppConfig(
  onData: (config: AppConfiguration | null) => void,
  onError: (msg: string) => void
): Unsubscribe {
  return onSnapshot(
    doc(db, 'config', 'app'),
    (snapshot) => {
      if (!snapshot.exists()) {
        onData(null);
        return;
      }
      onData(snapshot.data() as AppConfiguration);
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.GET, 'config/app');
      onError(formatFirestoreUiError(info.error));
    }
  );
}

export function subscribeToAuditLogs(
  onData: (logs: AuditLogEntry[]) => void,
  onError: (msg: string) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'auditLogs'),
    (snapshot) => {
      const rows = snapshot.docs
        .map((d) => d.data() as AuditLogEntry)
        .sort((a, b) => b.id.localeCompare(a.id));
      onData(rows);
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.LIST, 'auditLogs');
      onError(formatFirestoreUiError(info.error));
    }
  );
}

export function subscribeToComments(
  onData: (comments: ThreadedComment[]) => void,
  onError: (msg: string) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'comments'),
    (snapshot) => {
      const rows = snapshot.docs
        .map((d) => d.data() as ThreadedComment)
        .sort((a, b) => b.id.localeCompare(a.id));
      onData(rows);
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.LIST, 'comments');
      onError(formatFirestoreUiError(info.error));
    }
  );
}

export function subscribeToUsers(
  isBootstrapAdmin: boolean,
  authUid: string | null,
  authEmail: string | null,
  emailVerified: boolean,
  onData: (users: UserProfile[]) => void,
  onError: (msg: string) => void
): Unsubscribe {
  const targetQuery = isBootstrapAdmin
    ? collection(db, 'users')
    : authUid
    ? query(collection(db, 'users'), where('uid', '==', authUid))
    : authEmail && emailVerified
    ? query(
        collection(db, 'users'),
        where('email', '==', authEmail.trim().toLowerCase())
      )
    : null;

  if (!targetQuery) {
    return () => {};
  }

  return onSnapshot(
    targetQuery,
    (snapshot) => {
      const rows = snapshot.docs.map((d) => d.data() as UserProfile);
      onData(rows);
    },
    (error) => {
      const info = handleFirestoreError(error, OperationType.LIST, 'users');
      onError(formatFirestoreUiError(info.error));
    }
  );
}

interface BatchWriteOp {
  ref: ReturnType<typeof doc>;
  data: Record<string, unknown>;
}

async function commitChunkedWrites(
  ops: BatchWriteOp[],
  pathLabel: string,
  chunkSize = 350
): Promise<void> {
  try {
    for (let i = 0; i < ops.length; i += chunkSize) {
      const batch = writeBatch(db);
      const slice = ops.slice(i, i + chunkSize);
      for (const op of slice) {
        batch.set(op.ref, op.data);
      }
      await batch.commit();
    }
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.WRITE, pathLabel);
    throw new Error(formatFirestoreUiError(info.error));
  }
}

export async function seedInitialDatabase(params: {
  satkers: SatkerData[];
  users: UserProfile[];
  config: AppConfiguration;
  auditLogs: AuditLogEntry[];
  comments: ThreadedComment[];
  authorUid: string;
  updatedBy: string;
}): Promise<void> {
  const ops: BatchWriteOp[] = [];

  for (const s of params.satkers) {
    ops.push({
      ref: doc(db, 'satkers', String(s.no)),
      data: sanitizeSatkerForFirestore(s),
    });
  }

  for (const u of params.users) {
    ops.push({
      ref: doc(db, 'users', u.id),
      data: sanitizeUserForFirestore(u),
    });
    ops.push({
      ref: doc(db, 'userRoles', u.email.trim().toLowerCase()),
      data: sanitizeUserRoleEntry(u),
    });
    if (u.uid) {
      ops.push({
        ref: doc(db, 'uidRoles', u.uid),
        data: sanitizeUidRoleEntry(u, u.uid),
      });
    }
  }

  ops.push({
    ref: doc(db, 'config', 'app'),
    data: {
      appTitle: params.config.appTitle,
      evaluationPeriod: params.config.evaluationPeriod,
      spreadsheetEditLocked: Boolean(params.config.spreadsheetEditLocked),
      updatedBy: params.updatedBy,
      updatedAt: new Date().toISOString(),
    },
  });

  for (const log of params.auditLogs) {
    ops.push({
      ref: doc(db, 'auditLogs', log.id),
      data: sanitizeAuditLogForFirestore(log, params.authorUid),
    });
  }

  for (const comment of params.comments) {
    ops.push({
      ref: doc(db, 'comments', comment.id),
      data: sanitizeCommentForFirestore(comment, params.authorUid),
    });
  }

  await commitChunkedWrites(ops, 'seedInitialDatabase');
}

export async function upsertUsersToFirestore(usersToSave: UserProfile[]): Promise<void> {
  const ops: BatchWriteOp[] = [];
  for (const u of usersToSave) {
    ops.push({
      ref: doc(db, 'users', u.id),
      data: sanitizeUserForFirestore(u),
    });
    ops.push({
      ref: doc(db, 'userRoles', u.email.trim().toLowerCase()),
      data: sanitizeUserRoleEntry(u),
    });
    if (u.uid) {
      ops.push({
        ref: doc(db, 'uidRoles', u.uid),
        data: sanitizeUidRoleEntry(u, u.uid),
      });
    }
  }
  await commitChunkedWrites(ops, 'users');
}

export async function saveSatkerToFirestore(satker: SatkerData): Promise<void> {
  const path = `satkers/${satker.no}`;
  try {
    await setDoc(doc(db, 'satkers', String(satker.no)), sanitizeSatkerForFirestore(satker));
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.UPDATE, path);
    throw new Error(info.error);
  }
}

export async function batchSaveSatkersToFirestore(
  satkers: SatkerData[]
): Promise<void> {
  try {
    const batch = writeBatch(db);
    for (const s of satkers) {
      batch.set(doc(db, 'satkers', String(s.no)), sanitizeSatkerForFirestore(s));
    }
    await batch.commit();
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.WRITE, 'satkers');
    throw new Error(info.error);
  }
}

export async function saveAppConfigToFirestore(
  config: AppConfiguration,
  updatedBy: string
): Promise<void> {
  try {
    await setDoc(doc(db, 'config', 'app'), {
      appTitle: config.appTitle,
      evaluationPeriod: config.evaluationPeriod,
      spreadsheetEditLocked: Boolean(config.spreadsheetEditLocked),
      updatedBy,
      updatedAt: new Date().toISOString(),
    });
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.WRITE, 'config/app');
    throw new Error(info.error);
  }
}

export async function saveUserToFirestore(
  user: UserProfile,
  previousEmail?: string
): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.set(doc(db, 'users', user.id), sanitizeUserForFirestore(user));
    const nextEmailLower = user.email.trim().toLowerCase();
    if (previousEmail && previousEmail.trim().toLowerCase() !== nextEmailLower) {
      batch.delete(doc(db, 'userRoles', previousEmail.trim().toLowerCase()));
    }
    batch.set(doc(db, 'userRoles', nextEmailLower), sanitizeUserRoleEntry(user));
    if (user.uid) {
      batch.set(doc(db, 'uidRoles', user.uid), sanitizeUidRoleEntry(user, user.uid));
    }
    await batch.commit();
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.WRITE, `users/${user.id}`);
    throw new Error(formatFirestoreUiError(info.error));
  }
}

export async function deleteUserFromFirestore(user: UserProfile): Promise<void> {
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'users', user.id));
    batch.delete(doc(db, 'userRoles', user.email.trim().toLowerCase()));
    if (user.uid) {
      batch.delete(doc(db, 'uidRoles', user.uid));
    }
    await batch.commit();
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.DELETE, `users/${user.id}`);
    throw new Error(formatFirestoreUiError(info.error));
  }
}

export async function createAuditLogInFirestore(
  entry: AuditLogEntry,
  authorUid: string
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'auditLogs', entry.id),
      sanitizeAuditLogForFirestore(entry, authorUid)
    );
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.CREATE, `auditLogs/${entry.id}`);
    throw new Error(info.error);
  }
}

export async function createCommentInFirestore(
  comment: ThreadedComment,
  authorUid: string
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'comments', comment.id),
      sanitizeCommentForFirestore(comment, authorUid)
    );
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.CREATE, `comments/${comment.id}`);
    throw new Error(info.error);
  }
}

export async function updateCommentInFirestore(
  comment: ThreadedComment,
  fallbackUid: string
): Promise<void> {
  try {
    await setDoc(
      doc(db, 'comments', comment.id),
      sanitizeCommentForFirestore(comment, fallbackUid)
    );
  } catch (err) {
    const info = handleFirestoreError(err, OperationType.UPDATE, `comments/${comment.id}`);
    throw new Error(info.error);
  }
}

export async function clearAllFirebaseUserData(userId: string): Promise<void> {
  await deleteDoc(doc(db, 'users', userId));
}
