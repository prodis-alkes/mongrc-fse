/**
 * MonGRC (Monitoring Governance, Risk, and Compliance) Type Definitions
 * Kementerian Kesehatan RI - Ditjen Pencegahan dan Pengendalian Penyakit (P2)
 */

export type SatkerCategory =
  | 'Balai Besar'
  | 'Balai Kelas I'
  | 'Balai Kelas II'
  | 'Loka'
  | 'Pusat'
  | 'Direktorat';

export interface SatkerData {
  no: number;
  unitKerja: string;
  satker: string;
  category: SatkerCategory;
  // Raw Indicators
  ski: number;           // Sasaran Kinerja Instansi (0 - 100)
  spip: number;          // Sistem Pengendalian Intern Pemerintah (0 - 5.0)
  mri: number;           // Manajemen Risiko Indeks (0 - 5.0)
  iepk: number;          // Indeks Efektivitas Pencegahan Korupsi (0 - 5.0)
  spipt: number;         // SPIP Terintegrasi (0 - 5.0)
  wbkRb: number;         // Wilayah Bebas dari Korupsi / RB (0 - 100)
  sakip: number;         // Sistem Akuntabilitas Kinerja Instansi Pemerintah (0 - 100)
  nka: number;           // Nilai Kinerja Anggaran (0 - 100)
  ikpa: number;          // Indikator Kinerja Pelaksanaan Anggaran (0 - 100)
  ipAsn: number;         // Indeks Profesionalitas ASN (0 - 100)
  arsip: number;         // Pengawasan Kearsipan (0 - 100)
  pekppp: number | null; // Evaluasi Pelayanan Publik (0 - 5.0, null for Pusat/Direktorat)
  // Normalized 100-scale Scores (P-scores)
  pSki: number;
  pSpip: number;
  pMri: number;
  pIepk: number;
  pWbkRb: number;
  pSakip: number;
  pNka: number;
  pIkpa: number;
  pIpAsn: number;
  pArsip: number;
  pPekppp: number;
  average: number;       // Composite GRC score
  notes?: string;
  lastUpdatedBy?: string;
  lastUpdatedAt?: string;
}

export interface IndicatorMeta {
  key: keyof Pick<
    SatkerData,
    'ski' | 'spip' | 'mri' | 'iepk' | 'spipt' | 'wbkRb' | 'sakip' | 'nka' | 'ikpa' | 'ipAsn' | 'arsip' | 'pekppp'
  >;
  pKey:
    | keyof Pick<
        SatkerData,
        'pSki' | 'pSpip' | 'pMri' | 'pIepk' | 'pWbkRb' | 'pSakip' | 'pNka' | 'pIkpa' | 'pIpAsn' | 'pArsip' | 'pPekppp'
      >
    | null;
  label: string;
  fullName: string;
  scale: '5-scale' | '100-scale';
  threshold: number;
  unit: string;
  description: string;
  weightCategory: 'Governance' | 'Risk' | 'Compliance' | 'Financial & Operational';
}

export type UserRole = 'Admin' | 'Auditor' | 'Satker PIC' | 'Viewer';

export interface UserProfile {
  id: string;
  uid?: string;
  username: string;
  email: string;
  nip: string;
  name: string;
  role: UserRole;
  agency: string;
  assignedSatker?: string;
  assignedSatkerNo?: number;
  avatarInitials: string;
  status: 'active' | 'inactive';
  password?: string;
  lastLogin?: string;
  createdAt: string;
}

export interface ThreadedComment {
  id: string;
  satkerNo: number;
  indicatorKey: string;
  authorId: string;
  authorUid?: string;
  authorName: string;
  authorRole: UserRole;
  content: string;
  createdAt: string;
  status: 'open' | 'in_review' | 'resolved';
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  authorUid?: string;
  authorName: string;
  authorRole: UserRole;
  satkerNo: number;
  satkerName: string;
  indicatorKey: string;
  indicatorLabel: string;
  oldValue: number | string | null;
  newValue: number | string | null;
  reason: string;
}

export interface SummaryThresholdResult {
  indicatorKey: string;
  label: string;
  threshold: number;
  tercapaiCount: number;
  tidakTercapaiCount: number;
  totalEvaluated: number;
  achievementRate: number;
}

export interface AppConfiguration {
  spreadsheetEditLocked: boolean;
  evaluationYear?: string;
  evaluationPeriod: string;
  appTitle: string;
  updatedBy?: string;
  updatedAt?: string;
}
