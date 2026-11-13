import { INDICATOR_METAS } from '../data/baselineData';
import { IndicatorMeta, SatkerData, SummaryThresholdResult } from '../types/mongrc';

/**
 * Recalculate normalized P-scores and composite AVERAGE for a Satker record.
 */
export function recalculateSatkerScores(satker: Partial<SatkerData>): SatkerData {
  const ski = satker.ski ?? 0;
  const spip = satker.spip ?? 0;
  const mri = satker.mri ?? 0;
  const iepk = satker.iepk ?? 0;
  const spipt = satker.spipt ?? 0;
  const wbkRb = satker.wbkRb ?? 0;
  const sakip = satker.sakip ?? 0;
  const nka = satker.nka ?? 0;
  const ikpa = satker.ikpa ?? 0;
  const ipAsn = satker.ipAsn ?? 0;
  const arsip = satker.arsip ?? 0;
  const pekppp = satker.pekppp ?? null;

  // Normalizations (0-100)
  const pSki = round2(ski);
  const pSpip = round2(spip * 20);
  const pMri = round2(mri * 20);
  const pIepk = round2(iepk * 20);
  const pWbkRb = round2(wbkRb);
  const pSakip = round2(sakip);
  const pNka = round2(nka);
  const pIkpa = round2(ikpa);
  const pIpAsn = round2(ipAsn);
  const pArsip = round2(arsip);
  const pPekppp = pekppp !== null ? round2(pekppp * 20) : 0;

  // Composite average over the 11 normalized dimensions (matches Kemenkes MonGRC formula)
  const pValues = [
    pSki,
    pSpip,
    pMri,
    pIepk,
    pWbkRb,
    pSakip,
    pNka,
    pIkpa,
    pIpAsn,
    pArsip,
    pPekppp,
  ];

  const sum = pValues.reduce((acc, val) => acc + val, 0);
  const average = round2(sum / 11);

  return {
    no: satker.no ?? 1,
    unitKerja: satker.unitKerja ?? 'Satker Baru',
    satker: satker.satker ?? 'Satker',
    category: satker.category ?? 'Balai Kelas I',
    ski,
    spip,
    mri,
    iepk,
    spipt,
    wbkRb,
    sakip,
    nka,
    ikpa,
    ipAsn,
    arsip,
    pekppp,
    pSki,
    pSpip,
    pMri,
    pIepk,
    pWbkRb,
    pSakip,
    pNka,
    pIkpa,
    pIpAsn,
    pArsip,
    pPekppp,
    average,
    notes: satker.notes,
    lastUpdatedBy: satker.lastUpdatedBy,
    lastUpdatedAt: satker.lastUpdatedAt,
  };
}

export function round2(num: number): number {
  return Math.round((num + Number.EPSILON) * 100) / 100;
}

export function formatNumber(val: number | null | undefined, decimals = 2): string {
  if (val === null || val === undefined || isNaN(val)) return '-';
  return val.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

/**
 * Check whether a specific indicator value reaches its target threshold.
 */
export function isIndicatorTercapai(indicator: IndicatorMeta, value: number | null | undefined): boolean {
  if (value === null || value === undefined) return false;
  return value >= indicator.threshold;
}

/**
 * Calculate dynamic summary statistics (TERCAPAI, TIDAK TERCAPAI, Average) across all active satkers.
 */
export function calculateSummaryStats(satkers: SatkerData[]) {
  const count = satkers.length;
  if (count === 0) {
    return {
      nationalAverage: 0,
      tercapaiSummary: [] as SummaryThresholdResult[],
      rawAverages: {} as Record<string, number>,
      pAverages: {} as Record<string, number>,
    };
  }

  // Calculate averages per raw metric
  const rawAverages: Record<string, number> = {};
  const pAverages: Record<string, number> = {};

  for (const meta of INDICATOR_METAS) {
    let validCount = 0;
    let sum = 0;
    satkers.forEach(s => {
      const v = s[meta.key];
      if (typeof v === 'number' && !isNaN(v)) {
        sum += v;
        validCount++;
      }
    });
    rawAverages[meta.key] = validCount > 0 ? round2(sum / validCount) : 0;

    if (meta.pKey) {
      let pSum = 0;
      satkers.forEach(s => {
        const pv = s[meta.pKey!];
        if (typeof pv === 'number' && !isNaN(pv)) {
          pSum += pv;
        }
      });
      pAverages[meta.pKey] = round2(pSum / count);
    }
  }

  // Overall national average
  const totalAvgSum = satkers.reduce((acc, s) => acc + s.average, 0);
  const nationalAverage = round2(totalAvgSum / count);

  // Dynamic TERCAPAI / TIDAK TERCAPAI calculation
  const tercapaiSummary: SummaryThresholdResult[] = INDICATOR_METAS.map(meta => {
    let tercapai = 0;
    let tidakTercapai = 0;
    let evaluated = 0;

    satkers.forEach(s => {
      const v = s[meta.key];
      if (v !== null && v !== undefined && !isNaN(v)) {
        evaluated++;
        if (isIndicatorTercapai(meta, v)) {
          tercapai++;
        } else {
          tidakTercapai++;
        }
      }
    });

    return {
      indicatorKey: meta.key,
      label: meta.label,
      threshold: meta.threshold,
      tercapaiCount: tercapai,
      tidakTercapaiCount: tidakTercapai,
      totalEvaluated: evaluated,
      achievementRate: evaluated > 0 ? round2((tercapai / evaluated) * 100) : 0,
    };
  });

  return {
    nationalAverage,
    tercapaiSummary,
    rawAverages,
    pAverages,
  };
}

/**
 * Generate CSV string compliant with the official MonGRC format.
 */
export function exportSatkersToCSV(satkers: SatkerData[]): string {
  const headers = [
    'No',
    'Unit Kerja / Satuan Kerja',
    'SATKER',
    'SKI',
    'SPIP',
    'MRI',
    'IEPK',
    'SPIPT',
    'WBK/RB',
    'SAKIP',
    'NKA',
    'IKPA',
    'IP-ASN',
    'ARSIP',
    'PEKPPP',
    'PSKI',
    'PSPIP',
    'PMRI',
    'PIEPK',
    'PWBKRB',
    'PSAKIP',
    'PNKA',
    'PIKPA',
    'PIPASN',
    'PARSIP',
    'PPEKPPP',
    'AVERAGE',
  ];

  const escapeCSV = (val: string | number | null | undefined): string => {
    if (val === null || val === undefined) return '';
    if (typeof val === 'number') {
      return `"${formatNumber(val, 2)}"`;
    }
    const str = String(val);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = satkers.map(s => [
    s.no,
    escapeCSV(s.unitKerja),
    escapeCSV(s.satker),
    escapeCSV(s.ski),
    escapeCSV(s.spip),
    escapeCSV(s.mri),
    escapeCSV(s.iepk),
    escapeCSV(s.spipt),
    escapeCSV(s.wbkRb),
    escapeCSV(s.sakip),
    escapeCSV(s.nka),
    escapeCSV(s.ikpa),
    escapeCSV(s.ipAsn),
    escapeCSV(s.arsip),
    escapeCSV(s.pekppp),
    escapeCSV(s.pSki),
    escapeCSV(s.pSpip),
    escapeCSV(s.pMri),
    escapeCSV(s.pIepk),
    escapeCSV(s.pWbkRb),
    escapeCSV(s.pSakip),
    escapeCSV(s.pNka),
    escapeCSV(s.pIkpa),
    escapeCSV(s.pIpAsn),
    escapeCSV(s.pArsip),
    escapeCSV(s.pPekppp),
    escapeCSV(s.average),
  ].join(','));

  const summary = calculateSummaryStats(satkers);

  // Summary Row 1: Rata-Rata Satker
  const avgRow = [
    '',
    '"Rata-Rata Satker"',
    'RATA-RATA',
    escapeCSV(summary.rawAverages.ski),
    escapeCSV(summary.rawAverages.spip),
    escapeCSV(summary.rawAverages.mri),
    escapeCSV(summary.rawAverages.iepk),
    escapeCSV(summary.rawAverages.spipt),
    escapeCSV(summary.rawAverages.wbkRb),
    escapeCSV(summary.rawAverages.sakip),
    escapeCSV(summary.rawAverages.nka),
    escapeCSV(summary.rawAverages.ikpa),
    escapeCSV(summary.rawAverages.ipAsn),
    escapeCSV(summary.rawAverages.arsip),
    escapeCSV(summary.rawAverages.pekppp),
    escapeCSV(summary.pAverages.pSki),
    escapeCSV(summary.pAverages.pSpip),
    escapeCSV(summary.pAverages.pMri),
    escapeCSV(summary.pAverages.pIepk),
    escapeCSV(summary.pAverages.pWbkRb),
    escapeCSV(summary.pAverages.pSakip),
    escapeCSV(summary.pAverages.pNka),
    escapeCSV(summary.pAverages.pIkpa),
    escapeCSV(summary.pAverages.pIpAsn),
    escapeCSV(summary.pAverages.pArsip),
    escapeCSV(summary.pAverages.pPekppp),
    escapeCSV(summary.nationalAverage),
  ].join(',');

  // Indicator header for tercapai
  const tercapaiHeader = [
    '',
    '',
    '',
    ...INDICATOR_METAS.map(m => m.label),
    ...Array(11).fill(''),
  ].join(',');

  const tercapaiCounts = [
    '',
    '',
    'TERCAPAI',
    ...summary.tercapaiSummary.map(t => t.tercapaiCount),
    ...Array(11).fill(''),
  ].join(',');

  const tidakTercapaiCounts = [
    '',
    '',
    'TIDAK TERCAPAI',
    ...summary.tercapaiSummary.map(t => t.tidakTercapaiCount),
    ...Array(11).fill(''),
  ].join(',');

  return [
    headers.join(','),
    ...rows,
    avgRow,
    ',,,,,,,,,,,,,,,,,,,,,,,,,,',
    tercapaiHeader,
    tercapaiCounts,
    tidakTercapaiCounts,
  ].join('\n');
}

/**
 * Parse an uploaded CSV text into SatkerData records.
 */
export function parseCSVToSatkers(csvText: string): { satkers: SatkerData[]; errors: string[] } {
  const errors: string[] = [];
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length < 2) {
    return { satkers: [], errors: ['File CSV kosong atau tidak memiliki data.'] };
  }

  const parseLine = (line: string): string[] => {
    const res: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        res.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    res.push(cur.trim());
    return res;
  };

  const parseVal = (str: string | undefined): number | null => {
    if (!str) return null;
    const clean = str.replace(/"/g, '').replace(',', '.').trim();
    if (clean === '') return null;
    const n = parseFloat(clean);
    return isNaN(n) ? null : n;
  };

  const parsedSatkers: SatkerData[] = [];

  for (let idx = 1; idx < lines.length; idx++) {
    const parts = parseLine(lines[idx]);
    const noVal = parseInt(parts[0], 10);
    // Ignore summary footer rows (e.g. Rata-Rata or blank)
    if (isNaN(noVal) || parts[1]?.toLowerCase().includes('rata-rata') || parts[2]?.toLowerCase().includes('tercapai')) {
      continue;
    }

    const unitKerja = parts[1] || `Satker ${noVal}`;
    const satker = parts[2] || unitKerja;

    let category: SatkerData['category'] = 'Balai Kelas I';
    if (unitKerja.startsWith('Balai Besar')) category = 'Balai Besar';
    else if (unitKerja.startsWith('Balai Kekarantinaan Kesehatan Kelas I')) category = 'Balai Kelas I';
    else if (unitKerja.startsWith('Balai Kekarantinaan Kesehatan Kelas II')) category = 'Balai Kelas II';
    else if (unitKerja.startsWith('Loka')) category = 'Loka';
    else if (unitKerja.startsWith('Direktorat') || unitKerja.startsWith('Sekretariat')) category = 'Pusat';

    const rawRecord: Partial<SatkerData> = {
      no: noVal,
      unitKerja,
      satker,
      category,
      ski: parseVal(parts[3]) ?? 0,
      spip: parseVal(parts[4]) ?? 0,
      mri: parseVal(parts[5]) ?? 0,
      iepk: parseVal(parts[6]) ?? 0,
      spipt: parseVal(parts[7]) ?? 0,
      wbkRb: parseVal(parts[8]) ?? 0,
      sakip: parseVal(parts[9]) ?? 0,
      nka: parseVal(parts[10]) ?? 0,
      ikpa: parseVal(parts[11]) ?? 0,
      ipAsn: parseVal(parts[12]) ?? 0,
      arsip: parseVal(parts[13]) ?? 0,
      pekppp: parseVal(parts[14]),
    };

    // Auto-recalculate normalized scores and average
    const calculated = recalculateSatkerScores(rawRecord);
    parsedSatkers.push(calculated);
  }

  if (parsedSatkers.length === 0) {
    errors.push('Tidak dapat menemukan baris Satker valid dalam CSV.');
  }

  return { satkers: parsedSatkers, errors };
}
