import React, { useState, useMemo } from 'react';
import { useGRC } from '../context/GRCContext';
import { INDICATOR_METAS } from '../data/baselineData';
import { RadarChart } from './RadarChart';
import { formatNumber, isIndicatorTercapai } from '../utils/grcCalculations';
import { 
  X, 
  MessageSquare, 
  TrendingUp, 
  History, 
  ShieldCheck, 
  Send, 
  CheckCircle2, 
  Clock, 
  AlertTriangle 
} from 'lucide-react';

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
    auditLogs
  } = useGRC();

  const [activeDrawerTab, setActiveDrawerTab] = useState<'profile' | 'comments' | 'audit'>('profile');
  const [commentIndicator, setCommentIndicator] = useState<string>('general');
  const [newCommentText, setNewCommentText] = useState<string>('');

  const satker = useMemo(() => {
    return satkers.find(s => s.no === selectedSatkerNo) || null;
  }, [satkers, selectedSatkerNo]);

  // Satker comments
  const satkerComments = useMemo(() => {
    if (!satker) return [];
    return comments.filter(c => c.satkerNo === satker.no);
  }, [comments, satker]);

  // Satker audit logs
  const satkerAuditLogs = useMemo(() => {
    if (!satker) return [];
    return auditLogs.filter(a => a.satkerNo === satker.no);
  }, [auditLogs, satker]);

  if (!satker) return null;

  // National rank calculation
  const sorted = [...satkers].sort((a, b) => b.average - a.average);
  const rank = sorted.findIndex(s => s.no === satker.no) + 1;

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
                  Peringkat #{rank} dari 57 Satker
                </span>
              </div>
              <h2 className="text-xl font-bold tracking-tight text-white">
                {satker.satker}
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">{satker.unitKerja}</p>
            </div>

            <button
              onClick={() => setSelectedSatkerNo(null)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Score Ribbon */}
          <div className="grid grid-cols-3 gap-3 mt-4 pt-4 border-t border-slate-800 text-center font-mono">
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block font-sans">Skor Komposit</span>
              <span className="text-lg font-bold text-white tabular-nums">{formatNumber(satker.average)}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block font-sans">Rata-Rata Nasional</span>
              <span className="text-lg font-bold text-slate-300 tabular-nums">{formatNumber(summaryStats.nationalAverage)}</span>
            </div>
            <div className="bg-slate-800/60 p-2 rounded-lg">
              <span className="text-[10px] uppercase text-slate-400 block font-sans">Deviasi Benchmark</span>
              <span className={`text-lg font-bold tabular-nums ${
                satker.average >= summaryStats.nationalAverage ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {satker.average >= summaryStats.nationalAverage ? '+' : ''}
                {formatNumber(satker.average - summaryStats.nationalAverage)}
              </span>
            </div>
          </div>
        </div>

        {/* Drawer Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/90 px-6 shrink-0">
          <button
            onClick={() => setActiveDrawerTab('profile')}
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
            className={`py-3 px-3 text-xs font-semibold border-b-2 transition-colors flex items-center gap-1.5 ${
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
                  primarySatker={satker}
                  nationalAverages={summaryStats.pAverages}
                  size={380}
                />
              </div>

              {/* Complete Metric Breakdown Table */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                  Rincian 12 Indikator Kinerja GRC
                </h4>
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold text-[11px]">
                      <tr>
                        <th className="py-2.5 px-3">Indikator</th>
                        <th className="py-2.5 px-3 text-center">Skor Mentah</th>
                        <th className="py-2.5 px-3 text-center">Target</th>
                        <th className="py-2.5 px-3 text-center">Status</th>
                        <th className="py-2.5 px-3 text-right">Skor (0-100)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {INDICATOR_METAS.map(m => {
                        const rawVal = satker[m.key] as number | null;
                        const reached = isIndicatorTercapai(m, rawVal);
                        const pVal = m.pKey ? (satker[m.pKey] as number) : null;

                        return (
                          <tr key={m.key} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50">
                            <td className="py-2 px-3">
                              <div className="font-bold text-slate-900 dark:text-slate-100">{m.label}</div>
                              <div className="text-[10px] text-slate-500 dark:text-slate-400">{m.fullName}</div>
                            </td>
                            <td className="py-2 px-3 text-center font-mono font-semibold text-slate-800 dark:text-slate-200">
                              {formatNumber(rawVal)}
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
                            <td className="py-2 px-3 text-right font-mono font-bold text-slate-800 dark:text-slate-100">
                              {pVal !== null ? formatNumber(pVal) : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
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
                    onChange={e => setCommentIndicator(e.target.value)}
                    className="text-xs w-full bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 rounded-md p-1.5 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                  >
                    <option value="general">Catatan Umum Satker</option>
                    {INDICATOR_METAS.map(m => (
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
                  onChange={e => setNewCommentText(e.target.value)}
                  placeholder={
                    !currentUser || currentUser.role === 'Viewer'
                      ? 'Mode Baca Publik: Masuk sebagai Admin/Editor melalui menu Database untuk mengirim catatan.'
                      : 'Tuliskan temuan audit, permintaan evidensi, atau tanggapan perbaikan...'
                  }
                  className="w-full text-xs p-2.5 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-md focus:outline-hidden focus:ring-1 focus:ring-blue-600 disabled:opacity-60"
                />

                <div className="flex justify-end mt-2">
                  <button
                    type="submit"
                    disabled={!newCommentText.trim() || !currentUser || currentUser.role === 'Viewer'}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-blue-900 dark:bg-blue-700 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 disabled:opacity-40 transition-colors"
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
                  satkerComments.map(c => {
                    const meta = INDICATOR_METAS.find(m => m.key === c.indicatorKey);
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
                            Status: <strong className={`font-semibold ${
                              c.status === 'resolved' ? 'text-emerald-700 dark:text-emerald-400' :
                              c.status === 'in_review' ? 'text-amber-700 dark:text-amber-400' : 'text-blue-700 dark:text-blue-400'
                            }`}>{c.status === 'resolved' ? 'Selesai' : c.status === 'in_review' ? 'Dalam Telaah' : 'Terbuka'}</strong>
                          </span>

                          {/* Status changer */}
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => updateCommentStatus(c.id, 'open')}
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-medium ${
                                c.status === 'open' ? 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Buka
                            </button>
                            <button
                              onClick={() => updateCommentStatus(c.id, 'in_review')}
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-medium ${
                                c.status === 'in_review' ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                              }`}
                            >
                              Telaah
                            </button>
                            <button
                              onClick={() => updateCommentStatus(c.id, 'resolved')}
                              className={`px-2 py-0.5 rounded-sm text-[10px] font-medium ${
                                c.status === 'resolved' ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 font-bold' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
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
                  {satkerAuditLogs.map(log => (
                    <div key={log.id} className="relative">
                      <div className="absolute -left-[31px] top-1 w-3 h-3 rounded-full bg-blue-600 dark:bg-blue-500 border-2 border-white dark:border-slate-900 shadow-xs" />
                      <div className="p-3 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-800 rounded-lg shadow-2xs">
                        <div className="flex items-center justify-between text-[11px] mb-1">
                          <span className="font-semibold text-slate-900 dark:text-slate-100">
                            {log.authorName} ({log.authorRole})
                          </span>
                          <span className="text-slate-400 dark:text-slate-500 font-mono text-[10px]">{log.timestamp}</span>
                        </div>
                        <div className="font-medium text-blue-900 dark:text-blue-400 mb-1">
                          Perubahan Indikator: {log.indicatorLabel}
                        </div>
                        <div className="flex items-center gap-2 font-mono text-xs bg-slate-50 dark:bg-slate-900 p-2 rounded-sm border border-slate-100 dark:border-slate-800">
                          <span className="line-through text-slate-400 dark:text-slate-500">{String(log.oldValue)}</span>
                          <span className="text-slate-500 dark:text-slate-400">→</span>
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{String(log.newValue)}</span>
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
