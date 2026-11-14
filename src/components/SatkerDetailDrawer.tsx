import React, { useState, useMemo, useEffect } from 'react';
import { useGRC } from '../context/GRCContext';
import { INDICATOR_METAS } from '../data/baselineData';
import { RadarChart } from './RadarChart';
import {
  calculateNormalizedPercentage,
  formatNumber,
  getDimensionMaxScore,
  isIndicatorTercapai,
  recalculateSatkerScores,
} from '../utils/grcCalculations';
import { SatkerData } from '../types/mongrc';
import {
  X,
  MessageSquare,
  TrendingUp,
  History,
  Send,
  CheckCircle2,
  AlertTriangle,
  Edit3,
  Save,
  Lock,
  Loader2,
} from 'lucide-react';

type RawScoreKey =
  | 'ski'
  | 'spip'
  | 'mri'
  | 'iepk'
  | 'spipt'
  | 'wbkRb'
  | 'sakip'
  | 'nka'
  | 'ikpa'
  | 'ipAsn'
  | 'arsip'
  | 'pekppp';

export const SatkerDetailDrawer: React.FC = () => {
  const {
    satkers,
    selectedSatkerNo,
    setSelectedSatkerNo,
    summaryStats,
    currentUser,
    comments,
    addComment,
    updateCommentStatus,
    auditLogs,
    canEditSatker,
    appConfig,
    saveSatkerScores,
  } = useGRC();

  const [activeDrawerTab, setActiveDrawerTab] = useState<'profile' | 'comments' | 'audit'>('profile');
  const [commentIndicator, setCommentIndicator] = useState<string>('general');
  const [newCommentText, setNewCommentText] = useState<string>('');

  // Modal score editing state
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [draftInputs, setDraftInputs] = useState<Record<RawScoreKey, string>>({} as Record<RawScoreKey, string>);
  const [editReason, setEditReason] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState<{ ok: boolean; text: string } | null>(null);

  const satker = useMemo(() => {
    return satkers.find((s) => s.no === selectedSatkerNo) || null;
  }, [satkers, selectedSatkerNo]);

  // Reset edit mode whenever switching satker or closing
  useEffect(() => {
    setIsEditingScores(false);
    setSaveFeedback(null);
    setEditReason('');
  }, [selectedSatkerNo]);

  // Satker comments
  const satkerComments = useMemo(() => {
    if (!satker) return [];
    return comments.filter((c) => c.satkerNo === satker.no);
  }, [comments, satker]);

  // Satker audit logs
  const satkerAuditLogs = useMemo(() => {
    if (!satker) return [];
    return auditLogs.filter((a) => a.satkerNo === satker.no);
  }, [auditLogs, satker]);

  // Preview satker with live recalculated percentages & composite while editing
  const previewSatker = useMemo(() => {
    if (!satker) return null;
    if (!isEditingScores) return satker;

    const draft: SatkerData = { ...satker };
    for (const meta of INDICATOR_METAS) {
      const rawStr = (draftInputs[meta.key as RawScoreKey] ?? '').replace(',', '.').trim();
      if (rawStr === '') {
        (draft as unknown as Record<string, unknown>)[meta.key] = meta.key === 'pekppp' ? null : 0;
      } else {
        const num = Number(rawStr);
        if (Number.isFinite(num)) {
          (draft as unknown as Record<string, unknown>)[meta.key] = num;
        }
      }
    }
    return recalculateSatkerScores(draft);
  }, [satker, isEditingScores, draftInputs]);

  const rank = useMemo(() => {
    if (!satker) return 0;
    let higherCount = 0;
    for (let i = 0; i < satkers.length; i++) {
      if (satkers[i].average > satker.average) higherCount++;
    }
    return higherCount + 1;
  }, [satkers, satker]);

  if (!satker || !previewSatker) return null;

  const canModifyThisSatker = canEditSatker(satker);
  const isLocked = appConfig.spreadsheetEditLocked;

  const startEditingScores = () => {
    const initialDraft = {} as Record<RawScoreKey, string>;
    for (const meta of INDICATOR_METAS) {
      const val = satker[meta.key] as number | null;
      initialDraft[meta.key as RawScoreKey] = val !== null && val !== undefined ? String(val) : '';
    }
    setDraftInputs(initialDraft);
    setEditReason('');
    setSaveFeedback(null);
    setIsEditingScores(true);
  };

  const handleSaveModalScores = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveFeedback(null);

    const parsedUpdates: Partial<Pick<SatkerData, RawScoreKey>> = {};
    for (const meta of INDICATOR_METAS) {
      const key = meta.key as RawScoreKey;
      const rawStr = (draftInputs[key] ?? '').replace(',', '.').trim();
      if (rawStr === '') {
        if (key === 'pekppp') {
          parsedUpdates.pekppp = null;
        } else {
          parsedUpdates[key] = 0;
        }
      } else {
        const parsed = Number(rawStr);
        if (!Number.isFinite(parsed) || parsed < 0) {
          setSaveFeedback({
            ok: false,
            text: `Nilai untuk indikator ${meta.label} harus berupa angka valid (>= 0).`,
          });
          return;
        }
        const maxAllowed = getDimensionMaxScore(meta);
        if (parsed > maxAllowed) {
          setSaveFeedback({
            ok: false,
            text: `Nilai untuk indikator ${meta.label} tidak boleh melebihi skor maksimal (${maxAllowed}).`,
          });
          return;
        }
        parsedUpdates[key] = parsed;
      }
    }

    setIsSaving(true);
    const res = await saveSatkerScores(satker.no, parsedUpdates, editReason);
    setIsSaving(false);

    if (res.success) {
      setIsEditingScores(false);
      setSaveFeedback({
        ok: true,
        text: `Pembaruan skor ${satker.satker} berhasil disimpan ke Google Spreadsheet.`,
      });
      setTimeout(() => setSaveFeedback(null), 4000);
    } else {
      setSaveFeedback({
        ok: false,
        text: res.error || 'Gagal menyimpan pembaruan ke Google Spreadsheet.',
      });
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCommentText.trim()) return;
    addComment(satker.no, commentIndicator, newCommentText.trim());
    setNewCommentText('');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 dark:bg-black/65 flex justify-end">
      <div className="w-full max-w-2xl bg-white dark:bg-slate-900 h-full shadow-2xl flex flex-col border-l border-slate-200 dark:border-slate-800 animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-6 bg-slate-900 dark:bg-slate-950 text-white shrink-0 border-b border-transparent dark:border-slate-800">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded-sm bg-blue-800 text-blue-200 text-[10px] font-bold uppercase tracking-wider">
                  {satker.category}
                </span>
                <span className="text-xs text-slate-300">
                  Peringkat #{rank} dari {satkers.length} Satker
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {satker.satker}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{satker.unitKerja}</p>
            </div>

            <button
              onClick={() => setSelectedSatkerNo(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Score Ribbon */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800 text-center font-mono">
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block font-sans">Skor Komposit</span>
              <span className="text-lg font-bold text-white tabular-nums">
                {formatNumber(previewSatker.average)}
              </span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block font-sans">Rata-Rata Nasional</span>
              <span className="text-lg font-bold text-slate-300 tabular-nums">
                {formatNumber(summaryStats.nationalAverage)}
              </span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block font-sans">Deviasi Benchmark</span>
              <span
                className={`text-lg font-bold tabular-nums ${
                  previewSatker.average >= summaryStats.nationalAverage
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {previewSatker.average >= summaryStats.nationalAverage ? '+' : ''}
                {formatNumber(previewSatker.average - summaryStats.nationalAverage)}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 px-6 shrink-0">
          <button
            onClick={() => setActiveDrawerTab('profile')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeDrawerTab === 'profile'
                ? 'border-blue-900 dark:border-blue-400 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-800/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Analisis 11 Dimensi</span>
          </button>
          <button
            onClick={() => setActiveDrawerTab('comments')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeDrawerTab === 'comments'
                ? 'border-blue-900 dark:border-blue-400 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-800/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Diskusi & Review ({satkerComments.length})</span>
          </button>
          <button
            onClick={() => setActiveDrawerTab('audit')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeDrawerTab === 'audit'
                ? 'border-blue-900 dark:border-blue-400 text-blue-900 dark:text-blue-400 bg-white dark:bg-slate-800/60'
                : 'border-transparent text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Riwayat Perubahan ({satkerAuditLogs.length})</span>
          </button>
        </div>

        {/* Drawer Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          {/* TAB 1: PROFILE & RADAR ANALYSIS */}
          {activeDrawerTab === 'profile' && (
            <div className="space-y-6">
              {/* Radar visualization */}
              <div className="bg-slate-50 dark:bg-slate-950/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800 flex justify-center">
                <RadarChart
                  primarySatker={previewSatker}
                  nationalAverages={summaryStats.pAverages}
                  size={380}
                />
              </div>

              {/* Complete Metric Breakdown Table + Single-Satker Edit Form */}
              <form onSubmit={handleSaveModalScores} className="space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Rincian 12 Indikator Kinerja GRC
                  </h4>

                  {canModifyThisSatker && !isEditingScores && (
                    isLocked ? (
                      <span
                        title="Mode edit spreadsheet sedang terkunci. Admin dapat membuka kunci dari menu Spreadsheet."
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-[11px] font-medium text-amber-800 dark:text-amber-300"
                      >
                        <Lock className="w-3 h-3" />
                        <span>Edit Terkunci</span>
                      </span>
                    ) : (
                      <button
                        type="button"
                        onClick={startEditingScores}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 text-white text-xs font-semibold transition-colors cursor-pointer"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Edit Skor</span>
                      </button>
                    )
                  )}
                </div>

                {saveFeedback && (
                  <div
                    className={`p-3 rounded-lg border text-xs flex items-start justify-between gap-2 ${
                      saveFeedback.ok
                        ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-200'
                        : 'bg-rose-50 dark:bg-rose-950/60 border-rose-200 dark:border-rose-800 text-rose-800 dark:text-rose-200'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {saveFeedback.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0 mt-0.5" />
                      )}
                      <span>{saveFeedback.text}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setSaveFeedback(null)}
                      className="hover:underline shrink-0 cursor-pointer"
                    >
                      Tutup
                    </button>
                  </div>
                )}

                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Indikator</th>
                        <th className="py-2.5 px-3 text-center">Skor Riil</th>
                        <th className="py-2.5 px-3 text-center">Target</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th
                          className="py-2.5 px-3 text-right"
                          title="Read-Only: Dihitung otomatis dari (Skor Riil ÷ Skor Maksimal Dimensi) × 100%"
                        >
                          Skor (0-100) · RO
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {INDICATOR_METAS.map((m) => {
                        const rawVal = previewSatker[m.key] as number | null;
                        const maxScore = getDimensionMaxScore(m);
                        const reached = isIndicatorTercapai(m, rawVal);
                        const pVal = m.pKey !== null ? calculateNormalizedPercentage(m, rawVal) : null;

                        return (
                          <tr key={m.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-900 dark:text-slate-100">{m.label}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">
                                {m.fullName} (maks. {maxScore})
                              </div>
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {isEditingScores ? (
                                <input
                                  type="text"
                                  inputMode="decimal"
                                  value={draftInputs[m.key as RawScoreKey] ?? ''}
                                  onChange={(e) =>
                                    setDraftInputs((prev) => ({
                                      ...prev,
                                      [m.key]: e.target.value,
                                    }))
                                  }
                                  placeholder={m.key === 'pekppp' ? 'Kosong' : '0'}
                                  className="w-20 px-2 py-1 text-center font-mono text-xs bg-white dark:bg-slate-800 border border-blue-400 dark:border-blue-600 rounded-md text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                                />
                              ) : (
                                formatNumber(rawVal)
                              )}
                            </td>
                            <td className="py-2 px-3 text-center font-mono text-slate-500 dark:text-slate-400">
                              {m.threshold}
                            </td>
                            <td className="py-2 px-3 text-center">
                              {rawVal === null ? (
                                <span className="text-[10px] text-slate-400 dark:text-slate-500">N/A</span>
                              ) : reached ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                  Tercapai
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full">
                                  <AlertTriangle className="w-3 h-3 text-rose-600 dark:text-rose-400" />
                                  Belum
                                </span>
                              )}
                            </td>
                            <td
                              aria-readonly="true"
                              className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100 bg-slate-50/40 dark:bg-slate-800/30 select-none"
                            >
                              {pVal !== null ? formatNumber(pVal) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {isEditingScores && (
                  <div className="p-4 rounded-xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 space-y-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Catatan / Alasan Pembaruan (Opsional)
                      </label>
                      <input
                        type="text"
                        value={editReason}
                        onChange={(e) => setEditReason(e.target.value)}
                        placeholder="Contoh: Validasi data triwulan IV dari OMSPAN / e-SPIP"
                        className="w-full px-3 py-1.5 text-xs bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 rounded-lg text-slate-900 dark:text-slate-100 focus:outline-hidden focus:ring-2 focus:ring-blue-600"
                      />
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        disabled={isSaving}
                        onClick={() => {
                          setIsEditingScores(false);
                          setSaveFeedback(null);
                        }}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 font-semibold hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
                      >
                        Batal
                      </button>
                      <button
                        type="submit"
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-emerald-700 hover:bg-emerald-600 text-white font-semibold transition-colors disabled:opacity-60 cursor-pointer"
                      >
                        {isSaving ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Save className="w-3.5 h-3.5" />
                        )}
                        <span>{isSaving ? 'Menyimpan...' : 'Simpan ke Spreadsheet'}</span>
                      </button>
                    </div>
                  </div>
                )}
              </form>
            </div>
          )}

          {/* TAB 2: THREADED COMMENTS & COLLABORATION */}
          {activeDrawerTab === 'comments' && (
            <div className="space-y-5">
              {/* Comment Submission Form */}
              <form onSubmit={handlePostComment} className="bg-slate-50 dark:bg-slate-800/60 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-xs font-bold text-slate-900 dark:text-slate-100">
                    Tambah Catatan / Rekomendasi Review
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400">
                    Sebagai: <strong className="text-blue-900 dark:text-blue-400">{currentUser?.name || 'Pengguna'}</strong> ({currentUser?.role || 'Guest'})
                  </div>
                </div>

                {/* Indicator tag selection */}
                <div className="mb-2">
                  <label className="block text-[10px] text-slate-500 dark:text-slate-400 font-semibold mb-1">
                    Terkait Indikator:
                  </label>
                  <select
                    value={commentIndicator}
                    onChange={(e) => setCommentIndicator(e.target.value)}
                    className="text-xs w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md p-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="general">Catatan Umum Satker</option>
                    {INDICATOR_METAS.map((m) => (
                      <option key={m.key} value={m.key}>
                        {m.label} - {m.fullName}
                      </option>
                    ))}
                  </select>
                </div>

                <textarea
                  rows={3}
                  disabled={!currentUser || currentUser.role === 'Viewer'}
                  value={newCommentText}
                  onChange={(e) => setNewCommentText(e.target.value)}
                  placeholder={
                    !currentUser || currentUser.role === 'Viewer'
                      ? 'Mode Baca Publik: Masuk terlebih dahulu sebagai Admin/Auditor/PIC untuk mengirim catatan.'
                      : 'Tuliskan temuan audit, permintaan evidensi, atau tanggapan perbaikan...'
                  }
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                />

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newCommentText.trim() || !currentUser || currentUser.role === 'Viewer'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 dark:bg-blue-700 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 disabled:opacity-40 transition-colors cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Kirim Catatan</span>
                  </button>
                </div>
              </form>

              {/* Comments Feed */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Riwayat Diskusi Terbuka
                </h4>

                {satkerComments.length === 0 ? (
                  <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                    Belum ada catatan atau diskusi untuk {satker.satker}. Gunakan formulir di atas untuk memulai evaluasi kolaboratif.
                  </div>
                ) : (
                  satkerComments.map((c) => {
                    const meta = INDICATOR_METAS.find((m) => m.key === c.indicatorKey);
                    const tagLabel = meta ? meta.label : 'Umum';

                    return (
                      <div key={c.id} className="p-4 bg-white dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs space-y-2 text-xs">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-slate-900 dark:text-slate-100">{c.authorName}</span>
                            <span className="text-[10px] text-blue-800 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/70 px-1.5 py-0.2 rounded-sm font-semibold">
                              {c.authorRole}
                            </span>
                            <span className="text-slate-400 dark:text-slate-500">·</span>
                            <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.2 rounded-sm">
                              {tagLabel}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-400 dark:text-slate-500 font-mono">{c.createdAt}</span>
                        </div>

                        <p className="text-slate-700 dark:text-slate-300 leading-relaxed">{c.content}</p>

                        <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-[11px]">
                          <span className="text-slate-500 dark:text-slate-400">
                            Status:{' '}
                            <strong
                              className={`font-semibold ${
                                c.status === 'resolved'
                                  ? 'text-emerald-700 dark:text-emerald-400'
                                  : c.status === 'in_review'
                                  ? 'text-amber-700 dark:text-amber-400'
                                  : 'text-blue-700 dark:text-blue-400'
                              }`}
                            >
                              {c.status === 'resolved'
                                ? 'Selesai'
                                : c.status === 'in_review'
                                ? 'Dalam Telaah'
                                : 'Terbuka'}
                            </strong>
                          </span>

                          {/* Status changer */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateCommentStatus(c.id, 'open')}
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-medium cursor-pointer ${
                                c.status === 'open'
                                  ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 font-bold'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Buka
                            </button>
                            <button
                              onClick={() => updateCommentStatus(c.id, 'in_review')}
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-medium cursor-pointer ${
                                c.status === 'in_review'
                                  ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-bold'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Telaah
                            </button>
                            <button
                              onClick={() => updateCommentStatus(c.id, 'resolved')}
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-medium cursor-pointer ${
                                c.status === 'resolved'
                                  ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-bold'
                                  : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Selesai
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 3: AUDIT TRAIL FOR THIS SATKER */}
          {activeDrawerTab === 'audit' && (
            <div className="space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Log Perubahan Nilai ({satkerAuditLogs.length} Entri)
              </h4>

              {satkerAuditLogs.length === 0 ? (
                <div className="p-8 text-center bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-dashed border-slate-200 dark:border-slate-700 text-xs text-slate-500 dark:text-slate-400">
                  Belum ada catatan perubahan nilai untuk {satker.satker}. Semua data masih sesuai baseline awal.
                </div>
              ) : (
                <div className="relative pl-6 border-l-2 border-slate-200 dark:border-slate-700 space-y-4 text-xs">
                  {satkerAuditLogs.map((log) => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                      <div className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.authorName} ({log.authorRole})
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">
                            {log.timestamp}
                          </span>
                        </div>
                        <div className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                          Perubahan Indikator: {log.indicatorLabel}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded-sm border border-slate-100 dark:border-slate-800">
                          <span className="line-through text-slate-400 dark:text-slate-500">
                            {String(log.oldValue)}
                          </span>
                          <span className="text-slate-500 dark:text-slate-400">→</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">
                            {String(log.newValue)}
                          </span>
                        </div>
                        {log.reason && (
                          <div className="mt-2 text-[11px] text-slate-600 dark:text-slate-300 italic">
                            "{log.reason}"
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
