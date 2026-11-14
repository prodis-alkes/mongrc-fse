import React, { useState, useMemo } from 'react';
import { useGRC } from '../context/GRCContext';
import { INDICATOR_METAS } from '../data/baselineData';
import { 
  History, 
  MessageSquare, 
  Search, 
  Filter, 
  ShieldCheck, 
  CheckCircle2, 
  Clock, 
  ArrowRight,
  ExternalLink
} from 'lucide-react';

export const AuditAndCollaborationView: React.FC = () => {
  const { 
    auditLogs, 
    comments, 
    satkers, 
    setSelectedSatkerNo, 
    updateCommentStatus 
  } = useGRC();

  const [searchFilter, setSearchFilter] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'audit' | 'comments'>('audit');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'all' | 'open' | 'in_review' | 'resolved'>('all');

  // O(1) lookup map for satkers
  const satkerByNo = useMemo(() => {
    return new Map(satkers.map((s) => [s.no, s]));
  }, [satkers]);

  // Filtered audit logs
  const filteredAuditLogs = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    if (!q) return auditLogs;
    return auditLogs.filter((log) =>
      log.satkerName.toLowerCase().includes(q) ||
      log.authorName.toLowerCase().includes(q) ||
      log.indicatorLabel.toLowerCase().includes(q) ||
      log.reason.toLowerCase().includes(q)
    );
  }, [auditLogs, searchFilter]);

  // Filtered comments
  const filteredComments = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return comments.filter((c) => {
      if (selectedStatusFilter !== 'all' && c.status !== selectedStatusFilter) {
        return false;
      }
      if (!q) return true;
      const satkerName = satkerByNo.get(c.satkerNo)?.satker || '';
      return (
        satkerName.toLowerCase().includes(q) ||
        c.authorName.toLowerCase().includes(q) ||
        c.content.toLowerCase().includes(q)
      );
    });
  }, [comments, satkerByNo, searchFilter, selectedStatusFilter]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-50 tracking-tight">
            Log Update Multi-User
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Pusat transparansi akuntabilitas: rekam jejak setiap pembaruan nilai skor.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-800 text-xs">
          <button
            onClick={() => setActiveSubTab('audit')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'audit'
                ? 'bg-blue-900 dark:bg-blue-700 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>
          <button
            onClick={() => setActiveSubTab('comments')}
            className={`px-3 py-1.5 rounded-md font-medium transition-colors flex items-center gap-1.5 ${
              activeSubTab === 'comments'
                ? 'bg-blue-900 dark:bg-blue-700 text-white font-semibold'
                : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Diskusi & Temuan ({comments.length})</span>
          </button>
        </div>
      </div>

      {/* Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder={activeSubTab === 'audit' ? "Cari log berdasarkan satker, pengubah, alasan..." : "Cari komentar / temuan..."}
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {activeSubTab === 'comments' && (
          <div className="flex items-center gap-1.5 text-xs">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Status:</span>
            {[
              { key: 'all', label: 'Semua' },
              { key: 'open', label: 'Terbuka' },
              { key: 'in_review', label: 'Dalam Telaah' },
              { key: 'resolved', label: 'Selesai' },
            ].map(s => (
              <button
                key={s.key}
                onClick={() => setSelectedStatusFilter(s.key as any)}
                className={`px-2.5 py-1 rounded-md transition-colors ${
                  selectedStatusFilter === s.key
                    ? 'bg-blue-900 dark:bg-blue-700 text-white font-semibold'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* SUBTAB 1: AUDIT TRAIL STREAM */}
      {activeSubTab === 'audit' && (
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/90 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Waktu & Tanggal</th>
                  <th className="py-3 px-4">Satuan Kerja</th>
                  <th className="py-3 px-4">Indikator</th>
                  <th className="py-3 px-4 text-center">Perubahan Nilai</th>
                  <th className="py-3 px-4">Pengubah (Role)</th>
                  <th className="py-3 px-4">Alasan & Evidensi</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-sans">
                {filteredAuditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-slate-500 dark:text-slate-400">
                      Tidak ada entri log yang cocok dengan pencarian Anda.
                    </td>
                  </tr>
                ) : (
                  filteredAuditLogs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="py-3 px-4 font-mono text-[11px] text-slate-500 dark:text-slate-400 whitespace-nowrap">
                        {log.timestamp}
                      </td>
                      <td className="py-3 px-4 font-bold text-blue-900 dark:text-blue-400">
                        {log.satkerName}
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-100">
                        {log.indicatorLabel}
                      </td>
                      <td className="py-3 px-4 text-center font-mono">
                        <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-sm bg-slate-100 dark:bg-slate-800 border border-transparent dark:border-slate-700">
                          <span className="line-through text-slate-400 dark:text-slate-500">{String(log.oldValue)}</span>
                          <ArrowRight className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                          <span className="font-bold text-emerald-700 dark:text-emerald-400">{String(log.newValue)}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="font-semibold text-slate-900 dark:text-slate-100">{log.authorName}</div>
                        <div className="text-[10px] text-blue-800 dark:text-blue-400 font-medium">{log.authorRole}</div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 max-w-xs">
                        <div className="italic">"{log.reason}"</div>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        {log.satkerNo > 0 && (
                          <button
                            onClick={() => setSelectedSatkerNo(log.satkerNo)}
                            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-900 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline"
                          >
                            <span>Buka Satker</span>
                            <ExternalLink className="w-3 h-3" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUBTAB 2: CENTRALIZED COMMENTS & REVIEW TICKETS */}
      {activeSubTab === 'comments' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredComments.length === 0 ? (
            <div className="col-span-2 p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 dark:text-slate-400 text-xs">
              Tidak ada catatan diskusi yang memenuhi filter saat ini.
            </div>
          ) : (
            filteredComments.map(c => {
              const satker = satkers.find(s => s.no === c.satkerNo);
              const meta = INDICATOR_METAS.find(m => m.key === c.indicatorKey);

              return (
                <div key={c.id} className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs flex flex-col justify-between text-xs space-y-3">
                  <div>
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                      <div>
                        <div 
                          onClick={() => satker && setSelectedSatkerNo(satker.no)}
                          className="font-bold text-sm text-blue-900 dark:text-blue-400 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <span>{satker ? satker.satker : `Satker #${c.satkerNo}`}</span>
                          <ExternalLink className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          Terkait: <strong className="text-slate-700 dark:text-slate-200">{meta ? `${meta.label} (${meta.fullName})` : 'Catatan Umum'}</strong>
                        </div>
                      </div>

                      <span className={`px-2 py-0.5 rounded-sm text-[10px] font-bold ${
                        c.status === 'resolved'
                          ? 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-900 dark:text-emerald-300 border border-transparent dark:border-emerald-800/70'
                          : c.status === 'in_review'
                          ? 'bg-amber-100 dark:bg-amber-950/70 text-amber-900 dark:text-amber-300 border border-transparent dark:border-amber-800/70'
                          : 'bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-300 border border-transparent dark:border-blue-800/70'
                      }`}>
                        {c.status === 'resolved' ? 'Selesai' : c.status === 'in_review' ? 'Dalam Telaah' : 'Terbuka'}
                      </span>
                    </div>

                    {/* Content */}
                    <p className="text-slate-700 dark:text-slate-300 leading-relaxed mt-3">
                      {c.content}
                    </p>
                  </div>

                  {/* Footer */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{c.authorName}</span>
                      <span>·</span>
                      <span className="text-blue-700 dark:text-blue-400 font-medium">{c.authorRole}</span>
                      <span>·</span>
                      <span className="font-mono text-[10px]">{c.createdAt}</span>
                    </div>

                    {/* Quick status switch */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => updateCommentStatus(c.id, c.status === 'resolved' ? 'open' : 'resolved')}
                        className="px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-sm transition-colors"
                      >
                        {c.status === 'resolved' ? 'Buka Kembali' : 'Tandai Selesai'}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};
