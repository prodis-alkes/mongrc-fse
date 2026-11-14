import {
  AppConfiguration,
  SatkerCategory,
  SatkerData,
  UserProfile,
  UserRole,
} from '../types/mongrc';
import { recalculateSatkerScores } from '../utils/grcCalculations';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbwtbnnwlfKzVWUrUrTxllF7-KhLQEtJ1cSPbdnqPc6he7gKnqmp4xdqXi_Jqu8iqvZp/exec';

const LEGACY_DEFAULT_APPS_SCRIPT_URLS = new Set([
  'https://script.google.com/macros/s/AKfycbyYm43wOWuTZTUGIORPEa80xPbuPYlTrgvXdbNHVjCi3A-j7Zgo34JqBmeGK9uXySS8/exec',
]);

const APPS_SCRIPT_URL_STORAGE_KEY = 'mongrc_apps_script_url_v1';

export const DEFAULT_APP_CONFIG: AppConfiguration = {
  spreadsheetEditLocked: true,
  evaluationPeriod: '2026',
  appTitle: 'MonGRC Ditjen P2',
};

export interface SatkerRow extends Record<string, unknown> {
  No: number;
  'Unit Kerja / Satuan Kerja': string;
  SATKER: string;
  Kategori: string;
  SKI: number;
  SPIP: number;
  MRI: number;
  IEPK: number;
  SPIPT: number;
  'WBK/RB': number;
  SAKIP: number;
  NKA: number;
  IKPA: number;
  'IP-ASN': number;
  ARSIP: number;
  PEKPPP: number | '';
  PSKI: number;
  PSPIP: number;
  PMRI: number;
  PIEPK: number;
  PWBKRB: number;
  PSAKIP: number;
  PNKA: number;
  PIKPA: number;
  PIPASN: number;
  PARSIP: number;
  PPEKPPP: number;
  AVERAGE: number;
  'Terakhir Diubah Oleh': string;
  'Waktu Update': string;
}

export interface UserAccount extends Record<string, unknown> {
  ID: string;
  Username: string;
  Email: string;
  NIP: string;
  'Nama Lengkap': string;
  'Peran (Role)': UserRole;
  Instansi: string;
  'Satker Ditugaskan': string;
  'No Satker': number | '';
  Inisial: string;
  Status: 'active' | 'inactive';
  Password?: string;
  'Login Terakhir': string;
  'Dibuat Pada'?: string;
}

export function getStoredAppsScriptUrl(): string {
  try {
    const saved = localStorage.getItem(APPS_SCRIPT_URL_STORAGE_KEY);
    const trimmed = saved?.trim();
    if (trimmed && trimmed.startsWith('https://script.google.com/')) {
      if (LEGACY_DEFAULT_APPS_SCRIPT_URLS.has(trimmed)) {
        localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, DEFAULT_APPS_SCRIPT_URL);
        return DEFAULT_APPS_SCRIPT_URL;
      }
      return trimmed;
    }
  } catch {
    // ignore storage read error
  }
  return DEFAULT_APPS_SCRIPT_URL;
}

export function setStoredAppsScriptUrl(url: string): string {
  const clean = url.trim() || DEFAULT_APPS_SCRIPT_URL;
  try {
    localStorage.setItem(APPS_SCRIPT_URL_STORAGE_KEY, clean);
  } catch {
    // ignore storage write error
  }
  return clean;
}

function parseOptionalNumber(val: unknown): number | null {
  if (val === null || val === undefined || val === '') return null;
  if (typeof val === 'number') return Number.isFinite(val) ? val : null;
  const cleaned = String(val).replace(',', '.').trim();
  if (!cleaned) return null;
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseRequiredNumber(val: unknown, fallback = 0): number {
  const num = parseOptionalNumber(val);
  return num !== null ? num : fallback;
}

function normalizeCategory(raw: unknown): SatkerCategory {
  const text = String(raw || '').trim();
  if (text === 'Balai Besar') return 'Balai Besar';
  if (text === 'Balai Kelas I') return 'Balai Kelas I';
  if (text === 'Balai Kelas II') return 'Balai Kelas II';
  if (text === 'Loka') return 'Loka';
  if (text === 'Pusat' || text === 'Direktorat') return 'Pusat';
  return 'Balai Kelas I';
}

function normalizeUserRole(raw: unknown): UserRole {
  const text = String(raw || '').trim().toLowerCase();
  if (text === 'admin') return 'Admin';
  if (text === 'auditor') return 'Auditor';
  if (text === 'viewer') return 'Viewer';
  return 'Satker PIC';
}

function normalizeUserStatus(raw: unknown): 'active' | 'inactive' {
  const text = String(raw || '').trim().toLowerCase();
  if (text === 'inactive' || text === 'nonaktif' || text === 'disabled') {
    return 'inactive';
  }
  return 'active';
}

export function mapSheetRowToSatker(raw: Record<string, unknown>): SatkerData | null {
  const no = Math.trunc(parseRequiredNumber(raw['No'] ?? raw['no'], 0));
  if (!no || no <= 0) return null;

  const unitKerja = String(
    raw['Unit Kerja / Satuan Kerja'] ?? raw['unitKerja'] ?? `Satker ${no}`
  ).trim();
  const satker = String(raw['SATKER'] ?? raw['satker'] ?? unitKerja).trim();
  const category = normalizeCategory(raw['Kategori'] ?? raw['category']);

  const lastUpdatedByRaw = String(
    raw['Terakhir Diubah Oleh'] ?? raw['lastUpdatedBy'] ?? ''
  ).trim();
  const lastUpdatedAtRaw = String(
    raw['Waktu Update'] ?? raw['lastUpdatedAt'] ?? ''
  ).trim();

  const pekppp = parseOptionalNumber(raw['PEKPPP'] ?? raw['pekppp']);

  const draft: SatkerData = {
    no,
    unitKerja,
    satker,
    category,
    ski: parseRequiredNumber(raw['SKI'] ?? raw['ski']),
    spip: parseRequiredNumber(raw['SPIP'] ?? raw['spip']),
    mri: parseRequiredNumber(raw['MRI'] ?? raw['mri']),
    iepk: parseRequiredNumber(raw['IEPK'] ?? raw['iepk']),
    spipt: parseRequiredNumber(raw['SPIPT'] ?? raw['spipt']),
    wbkRb: parseRequiredNumber(raw['WBK/RB'] ?? raw['wbkRb']),
    sakip: parseRequiredNumber(raw['SAKIP'] ?? raw['sakip']),
    nka: parseRequiredNumber(raw['NKA'] ?? raw['nka']),
    ikpa: parseRequiredNumber(raw['IKPA'] ?? raw['ikpa']),
    ipAsn: parseRequiredNumber(raw['IP-ASN'] ?? raw['ipAsn']),
    arsip: parseRequiredNumber(raw['ARSIP'] ?? raw['arsip']),
    pekppp,
    pSki: parseRequiredNumber(raw['PSKI'] ?? raw['pSki']),
    pSpip: parseRequiredNumber(raw['PSPIP'] ?? raw['pSpip']),
    pMri: parseRequiredNumber(raw['PMRI'] ?? raw['pMri']),
    pIepk: parseRequiredNumber(raw['PIEPK'] ?? raw['pIepk']),
    pWbkRb: parseRequiredNumber(raw['PWBKRB'] ?? raw['pWbkRb']),
    pSakip: parseRequiredNumber(raw['PSAKIP'] ?? raw['pSakip']),
    pNka: parseRequiredNumber(raw['PNKA'] ?? raw['pNka']),
    pIkpa: parseRequiredNumber(raw['PIKPA'] ?? raw['pIkpa']),
    pIpAsn: parseRequiredNumber(raw['PIPASN'] ?? raw['pIpAsn']),
    pArsip: parseRequiredNumber(raw['PARSIP'] ?? raw['pArsip']),
    pPekppp: parseRequiredNumber(raw['PPEKPPP'] ?? raw['pPekppp']),
    average: parseRequiredNumber(raw['AVERAGE'] ?? raw['average']),
    lastUpdatedBy: lastUpdatedByRaw || undefined,
    lastUpdatedAt: lastUpdatedAtRaw || undefined,
  };

  return recalculateSatkerScores(draft);
}

export function serializeSatkerToSheetRow(satker: SatkerData): SatkerRow {
  return {
    No: Math.trunc(satker.no),
    'Unit Kerja / Satuan Kerja': satker.unitKerja,
    SATKER: satker.satker,
    Kategori: satker.category === 'Direktorat' ? 'Pusat' : satker.category,
    SKI: satker.ski,
    SPIP: satker.spip,
    MRI: satker.mri,
    IEPK: satker.iepk,
    SPIPT: satker.spipt,
    'WBK/RB': satker.wbkRb,
    SAKIP: satker.sakip,
    NKA: satker.nka,
    IKPA: satker.ikpa,
    'IP-ASN': satker.ipAsn,
    ARSIP: satker.arsip,
    PEKPPP: satker.pekppp ?? '',
    PSKI: satker.pSki,
    PSPIP: satker.pSpip,
    PMRI: satker.pMri,
    PIEPK: satker.pIepk,
    PWBKRB: satker.pWbkRb,
    PSAKIP: satker.pSakip,
    PNKA: satker.pNka,
    PIKPA: satker.pIkpa,
    PIPASN: satker.pIpAsn,
    PARSIP: satker.pArsip,
    PPEKPPP: satker.pPekppp,
    AVERAGE: satker.average,
    'Terakhir Diubah Oleh': satker.lastUpdatedBy || '',
    'Waktu Update': satker.lastUpdatedAt || '',
  };
}

export function mapSheetRowToUser(
  raw: Record<string, unknown>
): { user: UserProfile; password?: string } | null {
  const username = String(raw['Username'] ?? raw['username'] ?? '').trim();
  const email = String(raw['Email'] ?? raw['email'] ?? '').trim().toLowerCase();
  const id = String(raw['ID'] ?? raw['id'] ?? '').trim();

  // Guard against legacy code.gs returning Data sheet rows when ?sheet=Users is ignored
  if (!username && !email) {
    return null;
  }

  const name = String(raw['Nama Lengkap'] ?? raw['name'] ?? (username || email)).trim();
  const role = normalizeUserRole(raw['Peran (Role)'] ?? raw['role']);
  const assignedSatkerRaw = String(
    raw['Satker Ditugaskan'] ?? raw['assignedSatker'] ?? ''
  ).trim();
  const assignedSatkerNoRaw = parseOptionalNumber(
    raw['No Satker'] ?? raw['assignedSatkerNo']
  );

  const initialsRaw = String(raw['Inisial'] ?? raw['avatarInitials'] ?? '').trim();
  const avatarInitials =
    initialsRaw ||
    name
      .split(/\s+/)
      .filter((w) => w && !w.includes('.') && !w.includes(','))
      .slice(0, 2)
      .map((w) => w[0]?.toUpperCase())
      .join('') ||
    'US';

  const lastLoginRaw = String(raw['Login Terakhir'] ?? raw['lastLogin'] ?? '').trim();
  const createdAtRaw = String(raw['Dibuat Pada'] ?? raw['createdAt'] ?? '').trim();
  const passwordRaw = String(raw['Password'] ?? raw['password'] ?? '').trim();

  const user: UserProfile = {
    id: id || `user-${username || email}`,
    username: username || email.split('@')[0],
    email,
    nip: String(raw['NIP'] ?? raw['nip'] ?? '-').trim() || '-',
    name,
    role,
    agency: String(raw['Instansi'] ?? raw['agency'] ?? 'Ditjen P2 Kemenkes RI').trim(),
    assignedSatker: assignedSatkerRaw || undefined,
    assignedSatkerNo:
      assignedSatkerNoRaw !== null && assignedSatkerNoRaw > 0
        ? Math.trunc(assignedSatkerNoRaw)
        : undefined,
    avatarInitials,
    status: normalizeUserStatus(raw['Status'] ?? raw['status']),
    lastLogin: lastLoginRaw || undefined,
    createdAt: createdAtRaw || new Date().toLocaleString('id-ID'),
  };

  return {
    user,
    password: passwordRaw || undefined,
  };
}

export function serializeUserToSheetAccount(
  user: UserProfile,
  password?: string
): UserAccount {
  return {
    ID: user.id,
    Username: user.username,
    Email: user.email.trim().toLowerCase(),
    NIP: user.nip,
    'Nama Lengkap': user.name,
    'Peran (Role)': user.role,
    Instansi: user.agency,
    'Satker Ditugaskan': user.assignedSatker || '',
    'No Satker': user.assignedSatkerNo ?? '',
    Inisial: user.avatarInitials,
    Status: user.status,
    ...(password ? { Password: password } : {}),
    'Login Terakhir': user.lastLogin || '',
    'Dibuat Pada': user.createdAt || '',
  };
}

export async function fetchSatkersFromAppsScript(
  url: string,
  signal?: AbortSignal
): Promise<SatkerData[]> {
  const targetUrl = (url || DEFAULT_APPS_SCRIPT_URL).trim();
  const response = await fetch(targetUrl, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat data Google Spreadsheet (HTTP ${response.status}).`);
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error(
      'Respons Google Apps Script bukan JSON yang valid. Pastikan Web App di-deploy untuk akses publik.'
    );
  }

  const rowsRaw = Array.isArray(parsed)
    ? parsed
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { data?: unknown }).data)
    ? (parsed as { data: unknown[] }).data
    : parsed && typeof parsed === 'object' && Array.isArray((parsed as { rows?: unknown }).rows)
    ? (parsed as { rows: unknown[] }).rows
    : null;

  if (!rowsRaw) {
    const errMsg =
      parsed && typeof parsed === 'object' && 'message' in parsed
        ? String((parsed as { message?: unknown }).message)
        : 'Format respons Google Apps Script tidak dikenali.';
    throw new Error(errMsg);
  }

  const mapped = rowsRaw
    .filter((item): item is Record<string, unknown> => Boolean(item && typeof item === 'object'))
    .map(mapSheetRowToSatker)
    .filter((item): item is SatkerData => item !== null)
    .sort((a, b) => a.no - b.no);

  if (mapped.length === 0) {
    throw new Error('Data Satker pada Google Spreadsheet kosong.');
  }

  return mapped;
}

export interface FetchUsersResult {
  users: UserProfile[];
  passwords: Record<string, string>;
  usersSheetSupported: boolean;
}

export async function fetchUsersFromAppsScript(
  url: string,
  signal?: AbortSignal
): Promise<FetchUsersResult> {
  const targetUrl = (url || DEFAULT_APPS_SCRIPT_URL).trim();
  const separator = targetUrl.includes('?') ? '&' : '?';
  const response = await fetch(`${targetUrl}${separator}sheet=Users`, {
    method: 'GET',
    cache: 'no-store',
    signal,
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat tab Users dari Google Spreadsheet (HTTP ${response.status}).`);
  }

  const json = (await response.json()) as {
    status?: string;
    data?: unknown[];
    message?: string;
  };

  if (json.status !== 'success' || !Array.isArray(json.data)) {
    throw new Error(json.message || 'Respons tab Users Google Apps Script tidak valid.');
  }

  const rawItems = json.data.filter(
    (item): item is Record<string, unknown> => Boolean(item && typeof item === 'object')
  );

  // Detect if Apps Script ignored ?sheet=Users and returned Data sheet Satker rows
  const looksLikeDataSheet =
    rawItems.length > 0 &&
    !('Username' in rawItems[0]) &&
    !('Email' in rawItems[0]) &&
    ('SATKER' in rawItems[0] || 'SKI' in rawItems[0]);

  if (looksLikeDataSheet) {
    return {
      users: [],
      passwords: {},
      usersSheetSupported: false,
    };
  }

  const users: UserProfile[] = [];
  const passwords: Record<string, string> = {};

  for (const row of rawItems) {
    const mapped = mapSheetRowToUser(row);
    if (!mapped) continue;
    users.push(mapped.user);
    if (mapped.password && mapped.user.email) {
      passwords[mapped.user.email.trim().toLowerCase()] = mapped.password;
    }
  }

  return {
    users,
    passwords,
    usersSheetSupported: true,
  };
}

export interface AppsScriptWriteResult {
  ok: boolean;
  doPostMissing?: boolean;
  unsupportedAction?: boolean;
  message?: string;
}

async function postToAppsScript(
  url: string,
  payload: Record<string, unknown>
): Promise<AppsScriptWriteResult> {
  const targetUrl = (url || DEFAULT_APPS_SCRIPT_URL).trim();
  try {
    // Use text/plain so the browser sends a CORS-simple POST without an OPTIONS preflight
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      return {
        ok: false,
        message: `Gagal menulis ke Google Spreadsheet (HTTP ${response.status}).`,
      };
    }

    const text = await response.text();

    if (
      text.includes('Script function not found: doPost') ||
      text.includes('Fungsi skrip tidak ditemukan: doPost')
    ) {
      return {
        ok: false,
        doPostMissing: true,
        message:
          'Google Apps Script belum memiliki fungsi doPost(e) untuk menyimpan pembaruan ke Sheet. Perubahan tetap tersimpan di sesi lokal.',
      };
    }

    try {
      const result = JSON.parse(text) as { status?: string; message?: string; error?: string };
      if (result.status !== 'success') {
        const msg = result.message || result.error || 'Google Apps Script menolak pembaruan data.';
        return {
          ok: false,
          unsupportedAction: msg.toLowerCase().includes('unknown action'),
          message: msg,
        };
      }
      return { ok: true };
    } catch {
      if (text.toLowerCase().includes('error') || text.trim().startsWith('<')) {
        return {
          ok: false,
          doPostMissing: text.toLowerCase().includes('dopost'),
          message: 'Respons tulis Google Apps Script tidak berbentuk JSON sukses.',
        };
      }
      return { ok: true };
    }
  } catch {
    return {
      ok: false,
      message:
        'Tidak dapat menghubungi endpoint Google Apps Script. Periksa koneksi jaringan atau izin deploy Web App.',
    };
  }
}

/**
 * Saves a single edited Satker row to Google Spreadsheet using action: "update".
 * Never triggers bulkUpdate on single-row edits.
 */
export async function handleSaveSatker(
  editedRow: SatkerRow,
  currentUser: string,
  url?: string
): Promise<void> {
  const targetUrl = (url || DEFAULT_APPS_SCRIPT_URL).trim();
  const payload = {
    action: 'update',
    no: editedRow.No,
    satker: editedRow.SATKER,
    row: {
      ...editedRow,
      'Terakhir Diubah Oleh': currentUser,
      'Waktu Update': editedRow['Waktu Update'] || new Date().toLocaleString('id-ID'),
    },
  };

  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Gagal menulis ke Google Spreadsheet (HTTP ${response.status}).`);
  }

  const text = await response.text();
  if (
    text.includes('Script function not found: doPost') ||
    text.includes('Fungsi skrip tidak ditemukan: doPost')
  ) {
    throw new Error('Fungsi doPost(e) tidak ditemukan pada Google Apps Script.');
  }

  const result = JSON.parse(text) as { status?: string; message?: string };
  if (result.status !== 'success') {
    throw new Error(result.message || 'Gagal memperbarui data Satker di Google Spreadsheet.');
  }
}

export async function pushSatkerUpdateToAppsScript(
  url: string,
  satker: SatkerData,
  updatedBy: string
): Promise<AppsScriptWriteResult> {
  const editedRow = serializeSatkerToSheetRow(satker);
  try {
    await handleSaveSatker(editedRow, updatedBy, url);
    return { ok: true };
  } catch (err) {
    const msg =
      err instanceof Error
        ? err.message
        : 'Tidak dapat menghubungi endpoint Google Apps Script.';
    return {
      ok: false,
      doPostMissing: msg.toLowerCase().includes('dopost'),
      message: msg,
    };
  }
}

export async function pushBulkSatkersToAppsScript(
  url: string,
  satkers: SatkerData[],
  updatedBy: string
): Promise<AppsScriptWriteResult> {
  const rows = satkers.map(serializeSatkerToSheetRow);
  return postToAppsScript(url, {
    action: 'bulkUpdate',
    data: rows,
    rows,
    updatedBy,
    updatedAt: new Date().toISOString(),
  });
}

// ============================================================================
// USERS SHEET DIRECT OPERATIONS (tab "Users" via ?sheet=Users & POST actions)
// ============================================================================

export async function handleUpdateUserInAppsScript(
  url: string,
  editedUser: UserAccount
): Promise<AppsScriptWriteResult> {
  return postToAppsScript(url, {
    sheet: 'Users',
    action: 'updateUser',
    id: editedUser.ID,
    user: editedUser,
  });
}

export async function handleCreateUserInAppsScript(
  url: string,
  newUser: Partial<UserAccount>
): Promise<AppsScriptWriteResult> {
  return postToAppsScript(url, {
    sheet: 'Users',
    action: 'createUser',
    user: newUser,
  });
}

export async function handleDeleteUserInAppsScript(
  url: string,
  userId: string
): Promise<AppsScriptWriteResult> {
  return postToAppsScript(url, {
    sheet: 'Users',
    action: 'deleteUser',
    id: userId,
  });
}

export async function recordUserLoginInAppsScript(
  url: string,
  userId: string
): Promise<void> {
  try {
    await postToAppsScript(url, {
      sheet: 'Users',
      action: 'updateLogin',
      id: userId,
    });
  } catch {
    // Non-blocking audit update
  }
}

export async function syncUsersToAppsScript(
  url: string,
  usersList: UserAccount[]
): Promise<AppsScriptWriteResult> {
  return postToAppsScript(url, {
    sheet: 'Users',
    action: 'syncUsers',
    users: usersList,
  });
}

export const APPS_SCRIPT_DO_POST_TEMPLATE = `const DATA_SHEET_NAME = 'Data';
const USERS_SHEET_NAME = 'Users';
const USER_HEADERS = [
  'ID', 'Username', 'Email', 'NIP', 'Nama Lengkap', 'Peran (Role)',
  'Instansi', 'Satker Ditugaskan', 'No Satker', 'Inisial',
  'Status', 'Password', 'Login Terakhir', 'Dibuat Pada'
];

function ensureUsersSheet(ss) {
  let sheet = ss.getSheetByName(USERS_SHEET_NAME);
  if (!sheet) {
    sheet = ss.insertSheet(USERS_SHEET_NAME);
  }
  if (sheet.getLastRow() === 0) {
    sheet.getRange(1, 1, 1, USER_HEADERS.length).setValues([USER_HEADERS]);
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function doGet(e) {
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const targetSheetName = (e && e.parameter && e.parameter.sheet) ? e.parameter.sheet : DATA_SHEET_NAME;
    const sheet = targetSheetName === USERS_SHEET_NAME
      ? ensureUsersSheet(ss)
      : (ss.getSheetByName(targetSheetName) || ss.getSheets()[0]);

    if (!sheet) {
      return jsonResponse({ status: 'success', data: [] });
    }
    const values = sheet.getDataRange().getValues();
    if (values.length < 2) {
      return jsonResponse({ status: 'success', data: [] });
    }
    const headers = values[0];
    const rows = [];
    for (let i = 1; i < values.length; i++) {
      const rowObj = {};
      for (let j = 0; j < headers.length; j++) {
        rowObj[headers[j]] = values[i][j];
      }
      rows.push(rowObj);
    }
    return jsonResponse({ status: 'success', data: rows });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    const payload = JSON.parse(e.postData.contents);
    const action = payload.action || 'update';

    // Otomatis arahkan ke sheet 'Users' jika action terkait user meskipun payload.sheet lupa dikirim
    const isUserAction = ['updateUser', 'createUser', 'deleteUser', 'updateLogin', 'syncUsers'].indexOf(action) !== -1;
    const sheetName = payload.sheet || (isUserAction ? USERS_SHEET_NAME : DATA_SHEET_NAME);

    const sheet = sheetName === USERS_SHEET_NAME
      ? ensureUsersSheet(ss)
      : (ss.getSheetByName(sheetName) || ss.getSheets()[0]);

    const values = sheet.getDataRange().getValues();
    const headers = values[0];

    const mapObjectToRow = (obj, existingRow) => {
      return headers.map((header, colIdx) => {
        if (Object.prototype.hasOwnProperty.call(obj, header)) {
          // Jangan timpa Password lama jika frontend mengirim password kosong saat edit
          if (header === 'Password' && !obj[header] && existingRow) {
            return existingRow[colIdx];
          }
          return obj[header];
        }
        return existingRow ? existingRow[colIdx] : '';
      });
    };

    // 1. DATA TAB OPERATIONS
    if (action === 'update') {
      const record = payload.row || payload.data || payload;
      const targetNo = Number(payload.no || record.No);
      const noColIdx = headers.indexOf('No');
      for (let i = 1; i < values.length; i++) {
        if (Number(values[i][noColIdx]) === targetNo) {
          sheet.getRange(i + 1, 1, 1, headers.length).setValues([mapObjectToRow(record, values[i])]);
          return jsonResponse({ status: 'success', updatedRow: i + 1 });
        }
      }
      return jsonResponse({ status: 'error', message: 'Satker tidak ditemukan' });
    }

    if (action === 'bulkUpdate') {
      const records = payload.data || payload.rows || [];
      const noColIdx = headers.indexOf('No');
      records.forEach((record) => {
        const targetNo = Number(record.No);
        for (let i = 1; i < values.length; i++) {
          if (Number(values[i][noColIdx]) === targetNo) {
            values[i] = mapObjectToRow(record, values[i]);
            break;
          }
        }
      });
      sheet.getRange(1, 1, values.length, headers.length).setValues(values);
      return jsonResponse({ status: 'success', message: 'Bulk update completed' });
    }

    // 2. USERS TAB OPERATIONS
    const idColIdx = headers.indexOf('ID');

    if (action === 'updateUser') {
      const targetId = String(payload.id || (payload.user && payload.user.ID) || '').trim();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idColIdx]).trim() === targetId) {
          sheet.getRange(i + 1, 1, 1, headers.length).setValues([mapObjectToRow(payload.user, values[i])]);
          return jsonResponse({ status: 'success', updatedRow: i + 1 });
        }
      }
      return jsonResponse({ status: 'error', message: 'User tidak ditemukan: ' + targetId });
    }

    if (action === 'createUser') {
      const newUser = payload.user || {};
      if (!newUser['Dibuat Pada']) {
        newUser['Dibuat Pada'] = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
      }
      sheet.appendRow(mapObjectToRow(newUser, null));
      return jsonResponse({ status: 'success', message: 'User ditambahkan' });
    }

    if (action === 'deleteUser') {
      const targetId = String(payload.id || '').trim();
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idColIdx]).trim() === targetId) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ status: 'success', deletedRow: i + 1 });
        }
      }
      return jsonResponse({ status: 'error', message: 'User tidak ditemukan: ' + targetId });
    }

    if (action === 'updateLogin') {
      const targetId = String(payload.id || '').trim();
      const loginColIdx = headers.indexOf('Login Terakhir');
      const nowWIB = Utilities.formatDate(new Date(), 'Asia/Jakarta', 'yyyy-MM-dd HH:mm');
      for (let i = 1; i < values.length; i++) {
        if (String(values[i][idColIdx]).trim() === targetId && loginColIdx !== -1) {
          sheet.getRange(i + 1, loginColIdx + 1).setValue(nowWIB);
          return jsonResponse({ status: 'success', loginTerakhir: nowWIB });
        }
      }
      return jsonResponse({ status: 'success' });
    }

    if (action === 'syncUsers' && Array.isArray(payload.users)) {
      const existingMap = {};
      for (let i = 1; i < values.length; i++) {
        existingMap[String(values[i][idColIdx]).trim()] = i;
      }
      payload.users.forEach((u) => {
        const idx = existingMap[String(u.ID).trim()];
        if (idx !== undefined) {
          values[idx] = mapObjectToRow(u, values[idx]);
        } else {
          values.push(mapObjectToRow(u, null));
        }
      });
      sheet.getRange(1, 1, values.length, headers.length).setValues(values);
      return jsonResponse({ status: 'success', total: payload.users.length });
    }

    return jsonResponse({ status: 'error', message: 'Unknown action: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}`;
