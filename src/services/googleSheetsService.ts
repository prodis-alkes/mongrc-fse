import { AppConfiguration, SatkerCategory, SatkerData } from '../types/mongrc';
import { recalculateSatkerScores } from '../utils/grcCalculations';

export const DEFAULT_APPS_SCRIPT_URL =
  'https://script.google.com/macros/s/AKfycbyYm43wOWuTZTUGIORPEa80xPbuPYlTrgvXdbNHVjCi3A-j7Zgo34JqBmeGK9uXySS8/exec';

const APPS_SCRIPT_URL_STORAGE_KEY = 'mongrc_apps_script_url_v1';

export const DEFAULT_APP_CONFIG: AppConfiguration = {
  spreadsheetEditLocked: true,
  evaluationPeriod: '2026',
  appTitle: 'MonGRC Ditjen P2',
};

export function getStoredAppsScriptUrl(): string {
  try {
    const saved = localStorage.getItem(APPS_SCRIPT_URL_STORAGE_KEY);
    if (saved && saved.trim().startsWith('https://script.google.com/')) {
      return saved.trim();
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

export function serializeSatkerToSheetRow(satker: SatkerData): Record<string, unknown> {
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

export async function fetchSatkersFromAppsScript(url: string): Promise<SatkerData[]> {
  const targetUrl = (url || DEFAULT_APPS_SCRIPT_URL).trim();
  const response = await fetch(targetUrl, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(`Gagal memuat data Google Spreadsheet (HTTP ${response.status}).`);
  }

  const text = await response.text();
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('Respons Google Apps Script bukan JSON yang valid. Pastikan Web App di-deploy untuk akses publik.');
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

export interface AppsScriptWriteResult {
  ok: boolean;
  doPostMissing?: boolean;
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

    const text = await response.text();
    if (!response.ok) {
      return {
        ok: false,
        message: `Gagal menulis ke Google Spreadsheet (HTTP ${response.status}).`,
      };
    }

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
      const json = JSON.parse(text) as { status?: string; ok?: boolean; message?: string; error?: string };
      if (json.status === 'error' || json.ok === false) {
        return {
          ok: false,
          message: json.message || json.error || 'Google Apps Script menolak pembaruan data.',
        };
      }
      return { ok: true };
    } catch {
      // Some simple doPost implementations return plain text like "OK" or "Success"
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
      message: 'Tidak dapat menghubungi endpoint Google Apps Script. Periksa koneksi jaringan atau izin deploy Web App.',
    };
  }
}

export async function pushSatkerUpdateToAppsScript(
  url: string,
  satker: SatkerData,
  updatedBy: string
): Promise<AppsScriptWriteResult> {
  const row = serializeSatkerToSheetRow(satker);
  return postToAppsScript(url, {
    action: 'update',
    no: satker.no,
    satker: satker.satker,
    row,
    data: row,
    updatedBy,
    updatedAt: satker.lastUpdatedAt || new Date().toISOString(),
  });
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

export const APPS_SCRIPT_DO_POST_TEMPLATE = `function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
  var payload = JSON.parse(e.postData.contents);
  var headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];

  function rowObjToValues(obj) {
    return headers.map(function(h) {
      return obj.hasOwnProperty(h) ? obj[h] : '';
    });
  }

  if (payload.action === 'bulkUpdate' && Array.isArray(payload.data)) {
    var rows = payload.data.map(rowObjToValues);
    if (rows.length > 0) {
      sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    }
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', updated: rows.length }))
      .setMimeType(ContentService.MimeType.JSON);
  }

  var rowObj = payload.row || payload.data;
  if (rowObj) {
    var targetNo = Number(payload.no || rowObj['No']);
    var noColIdx = headers.indexOf('No');
    var lastRow = sheet.getLastRow();
    var allNos = sheet.getRange(2, noColIdx + 1, Math.max(1, lastRow - 1), 1).getValues();
    for (var i = 0; i < allNos.length; i++) {
      if (Number(allNos[i][0]) === targetNo) {
        sheet.getRange(i + 2, 1, 1, headers.length).setValues([rowObjToValues(rowObj)]);
        return ContentService.createTextOutput(JSON.stringify({ status: 'success', no: targetNo }))
          .setMimeType(ContentService.MimeType.JSON);
      }
    }
  }

  return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Row not found' }))
    .setMimeType(ContentService.MimeType.JSON);
}`;
