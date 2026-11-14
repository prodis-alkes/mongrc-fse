import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  sendEmailVerification,
  EmailAuthProvider,
  linkWithCredential,
  updatePassword,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  User,
} from 'firebase/auth';
import {
  getFirestore,
  doc,
  getDocFromServer,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId);

const provider = new GoogleAuthProvider();
provider.setCustomParameters({
  prompt: 'select_account',
});

export const BOOTSTRAP_ADMIN_EMAIL = 'budi.hermawan.a@gmail.com';
export const FIREBASE_PROJECT_ID = firebaseConfig.projectId;
export const FIRESTORE_DATABASE_ID = firebaseConfig.firestoreDatabaseId;

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
    tenantId: string | null | undefined;
    providerInfo: {
      providerId: string;
      displayName: string | null;
      email: string | null;
      photoUrl: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): FirestoreErrorInfo {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo:
        auth.currentUser?.providerData.map((p) => ({
          providerId: p.providerId,
          displayName: p.displayName,
          email: p.email,
          photoUrl: p.photoURL,
        })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error:', JSON.stringify(errInfo));
  return errInfo;
}

export async function testFirestoreConnection(): Promise<{
  ok: boolean;
  message?: string;
}> {
  try {
    await getDocFromServer(doc(db, 'config', 'app'));
    return { ok: true };
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      const msg =
        'Koneksi Firestore gagal (client offline). Periksa konfigurasi Firebase Anda.';
      console.error('Please check your Firebase configuration.', error);
      return { ok: false, message: msg };
    }
    // Permission error when unauthenticated is expected before sign-in; connectivity itself works
    return { ok: true };
  }
}

export const subscribeToFirebaseAuth = (
  callback: (user: User | null) => void
) => {
  return onAuthStateChanged(auth, callback);
};

export const signInWithGoogle = async (): Promise<User> => {
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<User> => {
  const result = await signInWithEmailAndPassword(
    auth,
    email.trim().toLowerCase(),
    password
  );
  return result.user;
};

export const sendResetPassword = async (email: string): Promise<void> => {
  await sendPasswordResetEmail(auth, email.trim().toLowerCase());
};

export const sendCurrentUserVerificationEmail = async (): Promise<void> => {
  if (!auth.currentUser) {
    throw new Error('Silakan masuk terlebih dahulu sebelum mengirim email verifikasi.');
  }
  await sendEmailVerification(auth.currentUser);
};

const PROVISIONING_APP_NAME = 'mon-grc-provisioning';

function getProvisioningAuth() {
  const existingApp = getApps().find((a) => a.name === PROVISIONING_APP_NAME);
  const provisioningApp = existingApp || initializeApp(firebaseConfig, PROVISIONING_APP_NAME);
  return getAuth(provisioningApp);
}

export const provisionAuthAccountAsAdmin = async (
  email: string,
  password: string
): Promise<{ uid: string; created: boolean }> => {
  const emailLower = email.trim().toLowerCase();
  const provisioningAuth = getProvisioningAuth();
  try {
    const cred = await createUserWithEmailAndPassword(provisioningAuth, emailLower, password);
    return { uid: cred.user.uid, created: true };
  } catch (err) {
    const code = getFirebaseAuthErrorCode(err);
    if (code === 'auth/email-already-in-use') {
      const cred = await signInWithEmailAndPassword(provisioningAuth, emailLower, password);
      return { uid: cred.user.uid, created: false };
    }
    throw err;
  } finally {
    await signOut(provisioningAuth).catch(() => {});
  }
};

export function getFirebaseAuthErrorCode(error: unknown): string {
  if (error && typeof error === 'object' && 'code' in error) {
    return String((error as { code?: unknown }).code || '');
  }
  return '';
}

export function formatFirebaseAuthError(error: unknown): string {
  const code = getFirebaseAuthErrorCode(error);
  switch (code) {
    case 'auth/operation-not-allowed':
      return 'Provider Email/Password belum diaktifkan di Firebase Console (Authentication → Sign-in method → Email/Password → Enable).';
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'Email/Username atau kata sandi tidak sesuai, atau akun login Firebase belum di-provision oleh Admin.';
    case 'auth/invalid-email':
      return 'Format alamat email tidak valid.';
    case 'auth/user-disabled':
      return 'Akun ini dinonaktifkan pada Firebase Authentication.';
    case 'auth/too-many-requests':
      return 'Terlalu banyak percobaan login gagal. Silakan tunggu beberapa menit sebelum mencoba lagi.';
    case 'auth/email-already-in-use':
      return 'Email sudah terdaftar di Firebase Authentication.';
    case 'auth/weak-password':
      return 'Kata sandi terlalu lemah (minimal 6 karakter).';
    case 'auth/requires-recent-login':
      return 'Demi keamanan, silakan keluar dan masuk ulang dengan Google terlebih dahulu sebelum mereset kata sandi.';
    case 'auth/unauthorized-domain': {
      const host = typeof window !== 'undefined' ? window.location.hostname : 'domain ini';
      return `Domain "${host}" belum diizinkan pada Firebase Authentication. Tambahkan "${host}" di Firebase Console → Authentication → Settings → Authorized domains.`;
    }
    case 'permission-denied':
      return 'Firestore: Missing or insufficient permissions. Pastikan akun Admin sudah terverifikasi (Sign in with Google) dan memiliki otoritas Admin pada database.';
    default:
      return error instanceof Error ? error.message : 'Terjadi kesalahan autentikasi Firebase.';
  }
}

export const linkOrUpdateCurrentUserPassword = async (
  newPassword: string
): Promise<'linked' | 'updated'> => {
  const user = auth.currentUser;
  if (!user || !user.email) {
    throw new Error('Silakan masuk terlebih dahulu sebelum mereset kata sandi.');
  }

  const hasPasswordProvider = user.providerData.some(
    (p) => p.providerId === EmailAuthProvider.PROVIDER_ID
  );

  if (hasPasswordProvider) {
    await updatePassword(user, newPassword);
    await user.getIdToken(true);
    return 'updated';
  }

  const credential = EmailAuthProvider.credential(user.email, newPassword);
  await linkWithCredential(user, credential);
  await user.getIdToken(true);
  return 'linked';
};

export const signOutFirebase = async (): Promise<void> => {
  await signOut(auth);
};
