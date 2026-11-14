import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useGRC } from '../context/GRCContext';
import { INDICATOR_METAS } from '../data/baselineData';
import {
  INDICATOR_META_BY_KEY,
  NORMALIZED_INDICATOR_METAS,
  calculateNormalizedPercentage,
  formatNumber,
  getDimensionMaxScore,
  isIndicatorTercapai,
} from '../utils/grcCalculations';
import { SatkerData, IndicatorMeta } from '../types/mongrc';
import { 
  Search, 
  MessageSquare, 
  Edit3, 
  Check, 
  X, 
  Eye, 
  AlertCircle,
  Columns,
  Download,
  Lock,
  Unlock
} from 'lucide-react';

export const SpreadsheetGrid: React.FC = () => {
  const {
    satkers,
    currentUser,
    setSelectedSatkerNo,
    selectedCategory,
    setSelectedCategory,
    summaryStats,
    updateSatkerField,
    canEditSatker,
    comments,
    appConfig,
  } = useGRC();

  const isAdmin = currentUser?.role === 'Admin';
  const isEditLocked = appConfig.spreadsheetEditLocked;

  const [searchFilter, setSearchFilter] = useState('');
  const [columnViewMode, setColumnViewMode] = useState<'all' | 'raw' | 'normalized'>('all');

  // Editing state
  const [editingCell, setEditingCell] = useState<{
    satkerNo: number;
    fieldKey: keyof SatkerData;
    initialValue: number | null;
  } | null>(null);
  const [editInputVal, setEditInputVal] = useState<string>('');
  const [editReason, setEditReason] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [hoveredCell, setHoveredCell] = useState<{
    satker: SatkerData;
    indicator: IndicatorMeta;
    value: number | null;
    canEdit: boolean;
  } | null>(null);
  const [hoveredNormalizedCell, setHoveredNormalizedCell] = useState<{
    satker: SatkerData;
    indicator: IndicatorMeta;
    rawValue: number | null;
    maxScore: number;
    percentage: number;
  } | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCell && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingCell]);

  useEffect(() => {
    if (isEditLocked && editingCell) {
      setEditingCell(null);
      setErrorMsg(null);
    }
  }, [isEditLocked, editingCell]);

  const filteredSatkers = useMemo(() => {
    const q = searchFilter.trim().toLowerCase();
    return satkers.filter((s) => {
      const matchCat =
        selectedCategory === 'ALL' ||
        s.category === selectedCategory ||
        (selectedCategory === 'Pusat' && (s.category === 'Pusat' || s.category === 'Direktorat'));
      const matchSearch =
        !q ||
        s.satker.toLowerCase().includes(q) ||
        s.unitKerja.toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [satkers, selectedCategory, searchFilter]);

  const startEditing = (satker: SatkerData, meta: IndicatorMeta) => {
    if (isEditLocked) {
      setErrorMsg(
        isAdmin
          ? 'Mode pengeditan spreadsheet saat ini terkunci (Hanya-Baca). Klik tombol "Kunci Edit" di menu atas untuk membuka izin pengeditan data.'
          : 'Mode pengeditan spreadsheet saat ini terkunci (Hanya-Baca). Hanya peran Administrator yang memiliki wewenang untuk membuka kunci spreadsheet.'
      );
      setTimeout(() => setErrorMsg(null), 4500);
      return;
    }

    if (!canEditSatker(satker)) {
      setErrorMsg(
        `Peran Anda (${currentUser?.role || 'Tamu'} · ${currentUser?.name || 'Tamu'}) hanya memiliki hak baca/tinjau untuk ${satker.satker}.`
      );
      setTimeout(() => setErrorMsg(null), 4000);
      return;
    }

    const currentVal = satker[meta.key] as number | null;
    setEditingCell({
      satkerNo: satker.no,
      fieldKey: meta.key,
      initialValue: currentVal,
    });
    setEditInputVal(currentVal !== null ? String(currentVal) : '');
    setEditReason('');
    setErrorMsg(null);
  };

  const handleSaveEdit = () => {
    if (!editingCell) return;

    const meta = INDICATOR_META_BY_KEY.get(String(editingCell.fieldKey));
    let parsedVal: number | null = null;
    if (editInputVal.trim() !== '') {
      const cleaned = editInputVal.replace(',', '.').trim();
      parsedVal = parseFloat(cleaned);
      if (isNaN(parsedVal) || parsedVal < 0) {
        setErrorMsg('Nilai input harus berupa angka valid (>= 0).');
        return;
      }
      if (meta) {
        const maxAllowed = getDimensionMaxScore(meta);
        if (parsedVal > maxAllowed) {
          setErrorMsg(
            `Nilai ${meta.label} tidak boleh melebihi skor maksimal dimensi (${maxAllowed}).`
          );
          return;
        }
      }
    }

    const result = updateSatkerField(
      editingCell.satkerNo,
      editingCell.fieldKey,
      parsedVal,
      editReason.trim() || `Pembaruan nilai oleh ${currentUser?.name || 'Pengguna'}`
    );

    if (result.success) {
      setEditingCell(null);
      setErrorMsg(null);
    } else {
      setErrorMsg(result.error || 'Gagal menyimpan perubahan.');
    }
  };

  const handleCancelEdit = () => {
    setEditingCell(null);
    setErrorMsg(null);
  };

  // Count comments per satker
  const commentCountsBySatker = useMemo(() => {
    const counts: Record<number, number> = {};
    comments.forEach(c => {
      counts[c.satkerNo] = (counts[c.satkerNo] || 0) + 1;
    });
    return counts;
  }, [comments]);

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Grid Spreadsheet MonGRC
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            MAtriks tata kelola Ditjen P2, nilai normalisasi (P-Scores), rata-rata, dan rekapitulasi.
          </p>
        </div>

        {/* Header Action Menu: Column View Mode Filter */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Column View Mode Filter */}
          <div className="flex items-center gap-1 bg-white dark:bg-slate-900 p-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs shadow-xs">
            <Columns className="w-3.5 h-3.5 text-slate-400 ml-1.5" />
            <button
              onClick={() => setColumnViewMode('all')}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                columnViewMode === 'all' ? 'bg-blue-900 dark:bg-blue-700 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Semua Kolom
            </button>
            <button
              onClick={() => setColumnViewMode('raw')}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                columnViewMode === 'raw' ? 'bg-blue-900 dark:bg-blue-700 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Skor Riil
            </button>
            <button
              onClick={() => setColumnViewMode('normalized')}
              className={`px-2.5 py-1 rounded-md transition-colors font-medium cursor-pointer ${
                columnViewMode === 'normalized' ? 'bg-blue-900 dark:bg-blue-700 text-white' : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Persentase (0-100)
            </button>
          </div>
        </div>
      </div>

      {/* Filters & Search Toolbar */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Cari satker / unit kerja..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600"
          />
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {[
            { key: 'ALL', label: 'Semua (57)' },
            { key: 'Balai Besar', label: 'Balai Besar (7)' },
            { key: 'Balai Kelas I', label: 'Balai Kelas I (26)' },
            { key: 'Balai Kelas II', label: 'Balai Kelas II (16)' },
            { key: 'Loka', label: 'Loka (2)' },
            { key: 'Pusat', label: 'Pusat (6)' },
          ].map(c => (
            <button
              key={c.key}
              onClick={() => setSelectedCategory(c.key)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                selectedCategory === c.key
                  ? 'bg-blue-900 dark:bg-blue-700 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>

      {/* Spreadsheet Main Grid */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        {/* Table Sub-bar: Edit lock status hint & active filter count */}
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/70 border-b border-slate-200 dark:border-slate-800 flex flex-wrap items-center justify-between text-xs text-slate-500 dark:text-slate-400 gap-2">
          <div className="flex items-center gap-2">
            {isEditLocked ? (
              <span className="inline-flex items-center gap-1.5 text-amber-900 dark:text-amber-200 font-medium bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-sm border border-amber-200 dark:border-amber-800 text-[11px]">
                <Lock className="w-3 h-3 text-amber-600 dark:text-amber-400 shrink-0" />
                <span>
                  Mode Terkunci (Read-Only) &bull; Formulir spreadsheet diproteksi. {isAdmin ? 'Admin dapat membuka kunci pada menu di atas.' : 'Hanya Administrator yang dapat membuka kunci.'}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 text-emerald-900 dark:text-emerald-200 font-medium bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-sm border border-emerald-200 dark:border-emerald-800 text-[11px]">
                <Unlock className="w-3 h-3 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <span>
                  Mode Edit Terbuka &bull; Pengguna berwenang dapat memperbarui data sel secara live. {isAdmin && '(Admin dapat mengunci kembali)'}
                </span>
              </span>
            )}
          </div>
          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            Menampilkan <span className="font-bold text-slate-800 dark:text-slate-200">{filteredSatkers.length}</span> dari {satkers.length} Satker
          </div>
        </div>

        <div className="overflow-x-auto max-h-[720px] custom-scrollbar">
          <table className="w-full text-center border-collapse text-xs select-none">
            {/* Grouped Super Header (Sticky Top) */}
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-300 dark:border-slate-700">
              <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-200 font-extrabold text-[11px]">
                {/* Fixed Identity Columns Header */}
                <th 
                  colSpan={3} 
                  className="py-2 px-3 text-left bg-slate-200/80 dark:bg-slate-800 sticky left-0 z-30 border-r-2 border-slate-300 dark:border-slate-700"
                >
                  IDENTITAS SATUAN KERJA
                </th>

                {/* Raw Indicators Super Header */}
                {(columnViewMode === 'all' || columnViewMode === 'raw') && (
                  <th 
                    colSpan={INDICATOR_METAS.length} 
                    className="py-2 px-3 bg-blue-50/70 dark:bg-blue-950/60 text-blue-950 dark:text-blue-200 border-r-2 border-slate-300 dark:border-slate-700"
                  >
                    INDIKATOR KINERJA GRC (SKOR RIIL)
                  </th>
                )}

                {/* Normalized P-Scores Super Header (Always Read-Only) */}
                {(columnViewMode === 'all' || columnViewMode === 'normalized') && (
                  <th 
                    colSpan={11} 
                    className="py-2 px-3 bg-emerald-50/70 dark:bg-emerald-950/50 text-emerald-950 dark:text-emerald-200 border-r-2 border-slate-300 dark:border-slate-700"
                  >
                    <span className="inline-flex items-center justify-center gap-1.5">
                      <Lock className="w-3 h-3 text-emerald-700 dark:text-emerald-400 shrink-0" />
                      <span>SKOR NORMALISASI PERSENTASE (0 - 100) · READ-ONLY</span>
                    </span>
                  </th>
                )}

                {/* Overall Average Super Header */}
                <th className="py-2 px-3 bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100 min-w-[90px]">
                  KOMPOSIT
                </th>
                <th className="py-2 px-3 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 min-w-[70px]">
                  AKSI
                </th>
              </tr>

              {/* Individual Column Sub-Headers */}
              <tr className="bg-slate-50 dark:bg-slate-800/90 text-slate-600 dark:text-slate-300 font-bold uppercase tracking-wider text-[10px] border-b border-slate-200 dark:border-slate-700">
                <th className="py-2.5 px-2 w-10 text-center sticky left-0 bg-slate-50 dark:bg-slate-800 z-30">No</th>
                <th className="py-2.5 px-3 text-left min-w-[200px] sticky left-10 bg-slate-50 dark:bg-slate-800 z-30">Unit Kerja</th>
                <th className="py-2.5 px-3 text-left min-w-[130px] sticky left-[250px] bg-slate-50 dark:bg-slate-800 z-30 border-r-2 border-slate-300 dark:border-slate-700">SATKER</th>

                {/* Raw Indicator Columns */}
                {(columnViewMode === 'all' || columnViewMode === 'raw') && (
                  INDICATOR_METAS.map(m => (
                    <th key={`raw-${m.key}`} className="py-2.5 px-2 min-w-[68px] whitespace-nowrap bg-blue-50/30 dark:bg-blue-950/30">
                      <div>{m.label}</div>
                      <div className="text-[9px] text-slate-400 dark:text-slate-400 font-normal lowercase font-mono">
                        {m.scale === '5-scale' ? '1-5' : '0-100'}
                      </div>
                    </th>
                  ))
                )}

                {/* Normalized P-Columns (Always Read-Only, computed from max dimension score) */}
                {(columnViewMode === 'all' || columnViewMode === 'normalized') && (
                  NORMALIZED_INDICATOR_METAS.map(m => {
                    const maxScore = getDimensionMaxScore(m);
                    return (
                      <th
                        key={`p-${m.pKey}`}
                        title={`Read-Only: Dihitung otomatis dari (${m.label} ÷ ${maxScore}) × 100%`}
                        className="py-2.5 px-2 min-w-[68px] whitespace-nowrap bg-emerald-50/30 dark:bg-emerald-950/30 font-mono"
                      >
                        <div>P{m.label.replace('/', '')}</div>
                        <div className="text-[9px] text-emerald-600 dark:text-emerald-400 font-normal font-mono">
                          (/{maxScore} → %)
                        </div>
                      </th>
                    );
                  })
                )}

                <th className="py-2.5 px-3 text-right bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 font-extrabold border-l border-slate-200 dark:border-slate-700">
                  AVERAGE
                </th>
                <th className="py-2.5 px-2 text-center bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                  MENU
                </th>
              </tr>
            </thead>

            {/* Table Rows */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSatkers.map(s => {
                const canEditThis = canEditSatker(s);
                const commentCount = commentCountsBySatker[s.no] || 0;

                return (
                  <tr 
                    key={s.no} 
                    className="hover:bg-blue-50/40 dark:hover:bg-slate-800/70 transition-colors group"
                  >
                    {/* Fixed Identity Columns */}
                    <td className="py-2 px-2 text-center font-mono font-semibold text-slate-400 dark:text-slate-500 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-blue-50/40 dark:group-hover:bg-slate-800 z-10">
                      {s.no}
                    </td>
                    <td className="py-2 px-3 text-left font-medium text-slate-900 dark:text-slate-100 truncate max-w-[200px] sticky left-10 bg-white dark:bg-slate-900 group-hover:bg-blue-50/40 dark:group-hover:bg-slate-800 z-10" title={s.unitKerja}>
                      {s.unitKerja}
                    </td>
                    <td className="py-2 px-3 text-left font-bold text-blue-900 dark:text-blue-300 truncate max-w-[130px] sticky left-[250px] bg-white dark:bg-slate-900 group-hover:bg-blue-50/40 dark:group-hover:bg-slate-800 z-10 border-r-2 border-slate-300 dark:border-slate-700">
                      <div className="flex items-center justify-between gap-1">
                        <span className="truncate">{s.satker}</span>
                        {commentCount > 0 && (
                          <span className="inline-flex items-center gap-0.5 text-[10px] text-blue-700 dark:text-blue-300 bg-blue-100 dark:bg-blue-900/60 px-1 py-0.2 rounded-xs font-mono">
                            <MessageSquare className="w-2.5 h-2.5" />
                            {commentCount}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Raw Metric Cells (Click to edit!) */}
                    {(columnViewMode === 'all' || columnViewMode === 'raw') && (
                      INDICATOR_METAS.map(meta => {
                        const isEditingThisCell = editingCell?.satkerNo === s.no && editingCell?.fieldKey === meta.key;
                        const rawVal = s[meta.key] as number | null;
                        const reached = isIndicatorTercapai(meta, rawVal);

                        if (isEditingThisCell) {
                          return (
                            <td key={`cell-${meta.key}`} className="p-1 bg-amber-50 dark:bg-amber-950/60 ring-2 ring-blue-600 z-10">
                              <div className="flex flex-col gap-1">
                                <input
                                  ref={inputRef}
                                  type="text"
                                  value={editInputVal}
                                  onChange={e => setEditInputVal(e.target.value)}
                                  onKeyDown={e => {
                                    if (e.key === 'Enter') handleSaveEdit();
                                    if (e.key === 'Escape') handleCancelEdit();
                                  }}
                                  className="w-16 px-1.5 py-1 text-xs text-center font-mono font-bold bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 border border-blue-400 rounded-sm focus:outline-hidden"
                                />
                                <div className="flex items-center justify-center gap-1">
                                  <button
                                    onClick={handleSaveEdit}
                                    title="Simpan perubahan skor"
                                    className="p-1 bg-emerald-600 text-white rounded-xs hover:bg-emerald-700"
                                  >
                                    <Check className="w-3 h-3" />
                                  </button>
                                  <button
                                    onClick={handleCancelEdit}
                                    title="Batal"
                                    className="p-1 bg-slate-300 dark:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xs hover:bg-slate-400 dark:hover:bg-slate-600"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            </td>
                          );
                        }

                        const canEditThisCell = !isEditLocked && canEditThis;

                        return (
                          <td
                            key={`cell-${meta.key}`}
                            onClick={() => startEditing(s, meta)}
                            onMouseEnter={() =>
                              setHoveredCell({
                                satker: s,
                                indicator: meta,
                                value: rawVal,
                                canEdit: canEditThisCell,
                              })
                            }
                            onMouseLeave={() => setHoveredCell(null)}
                            className={`py-2 px-2 font-mono text-[11px] tabular-nums transition-colors ${
                              canEditThisCell 
                                ? 'cursor-pointer hover:bg-blue-100/70 dark:hover:bg-blue-900/50 hover:font-bold hover:ring-1 hover:ring-blue-400' 
                                : isEditLocked
                                  ? 'cursor-not-allowed hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                  : ''
                            } ${
                              reached ? 'text-slate-900 dark:text-slate-100' : 'text-rose-700 dark:text-rose-300 font-semibold bg-rose-50/30 dark:bg-rose-950/30'
                            }`}
                          >
                            {formatNumber(rawVal)}
                          </td>
                        );
                      })
                    )}

                    {/* Normalized P-Columns Cells (Always Read-Only, calculated from raw / maxScore * 100) */}
                    {(columnViewMode === 'all' || columnViewMode === 'normalized') && (
                      NORMALIZED_INDICATOR_METAS.map(meta => {
                        const rawVal = s[meta.key] as number | null;
                        const maxScore = getDimensionMaxScore(meta);
                        const pVal = calculateNormalizedPercentage(meta, rawVal);
                        return (
                          <td
                            key={`pcell-${meta.pKey}`}
                            aria-readonly="true"
                            onClick={() => {
                              setErrorMsg(
                                `Kolom P${meta.label.replace('/', '')} bersifat Read-Only (kalkulasi otomatis dari ${meta.label}: ${rawVal !== null ? formatNumber(rawVal) : '-'} ÷ ${maxScore} × 100% = ${formatNumber(pVal)}%).`
                              );
                              setTimeout(() => setErrorMsg(null), 4000);
                            }}
                            onMouseEnter={() =>
                              setHoveredNormalizedCell({
                                satker: s,
                                indicator: meta,
                                rawValue: rawVal,
                                maxScore,
                                percentage: pVal,
                              })
                            }
                            onMouseLeave={() => setHoveredNormalizedCell(null)}
                            className="py-2 px-2 font-mono text-[11px] tabular-nums text-slate-600 dark:text-slate-300 bg-slate-50/40 dark:bg-slate-800/30 cursor-not-allowed select-none"
                          >
                            {formatNumber(pVal)}
                          </td>
                        );
                      })
                    )}

                    {/* Composite Average Cell */}
                    <td className="py-2 px-3 text-right font-mono font-bold text-xs text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60 border-l border-slate-200 dark:border-slate-700">
                      <span className={`px-2 py-0.5 rounded-sm ${
                        s.average >= 85 ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70 font-extrabold' :
                        s.average >= 80 ? 'text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70' :
                        s.average >= 75 ? 'text-slate-800 dark:text-slate-200' :
                        'text-rose-700 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70'
                      }`}>
                        {formatNumber(s.average)}
                      </span>
                    </td>

                    {/* Quick Action Button */}
                    <td className="py-2 px-2 text-center whitespace-nowrap">
                      <button
                        onClick={() => setSelectedSatkerNo(s.no)}
                        title="Buka panel telaah detail & diskusi kolaborasi"
                        className="inline-flex items-center gap-1 px-2 py-1 text-[10px] font-medium text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60 hover:bg-blue-100 dark:hover:bg-blue-900/60 rounded-md transition-colors cursor-pointer"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Detail</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>

            {/* Official Summary Rows (Sticky Footer) */}
            <tfoot className="sticky bottom-0 z-20 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-semibold text-[11px] shadow-lg">
              {/* Row 1: Rata-Rata Satker */}
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td colSpan={3} className="py-2.5 px-3 text-left font-bold text-slate-900 dark:text-slate-100 sticky left-0 bg-slate-200 dark:bg-slate-800 z-30 border-r-2 border-slate-300 dark:border-slate-700">
                  Rata-Rata Satker (Nasional)
                </td>

                {(columnViewMode === 'all' || columnViewMode === 'raw') && (
                  INDICATOR_METAS.map(m => (
                    <td key={`foot-raw-avg-${m.key}`} className="py-2.5 px-2 font-mono font-bold text-slate-900 dark:text-slate-100 bg-blue-50/50 dark:bg-blue-950/40">
                      {formatNumber(summaryStats.rawAverages[m.key])}
                    </td>
                  ))
                )}

                {(columnViewMode === 'all' || columnViewMode === 'normalized') && (
                  NORMALIZED_INDICATOR_METAS.map(m => (
                    <td key={`foot-p-avg-${m.pKey}`} className="py-2.5 px-2 font-mono font-bold text-emerald-950 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40">
                      {formatNumber(summaryStats.pAverages[m.pKey!])}
                    </td>
                  ))
                )}

                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-950/80 text-xs border-l border-slate-200 dark:border-slate-700">
                  {formatNumber(summaryStats.nationalAverage)}
                </td>
                <td className="py-2.5 px-2 bg-slate-100 dark:bg-slate-800" />
              </tr>

              {/* Row 2: TERCAPAI (Target Met) */}
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td colSpan={3} className="py-2 px-3 text-left font-bold text-emerald-800 dark:text-emerald-300 sticky left-0 bg-slate-200 dark:bg-slate-800 z-30 border-r-2 border-slate-300 dark:border-slate-700">
                  TERCAPAI (Memenuhi Standar)
                </td>

                {(columnViewMode === 'all' || columnViewMode === 'raw') && (
                  summaryStats.tercapaiSummary.map(item => (
                    <td key={`foot-tercapai-${item.indicatorKey}`} className="py-2 px-2 font-mono font-extrabold text-emerald-700 dark:text-emerald-300 bg-emerald-50/70 dark:bg-emerald-950/50">
                      {item.tercapaiCount}
                    </td>
                  ))
                )}

                {(columnViewMode === 'all' || columnViewMode === 'normalized') && (
                  <td colSpan={11} className="py-2 px-2 text-center text-slate-400 dark:text-slate-500 text-[10px]">
                    (Evaluasi berdasarkan skor mentah)
                  </td>
                )}

                <td className="py-2 px-3 text-right font-mono text-emerald-800 dark:text-emerald-300 font-bold border-l border-slate-200 dark:border-slate-700">
                  {summaryStats.tercapaiSummary.reduce((a, b) => a + b.tercapaiCount, 0)} Capai
                </td>
                <td className="py-2 px-2 bg-slate-100 dark:bg-slate-800" />
              </tr>

              {/* Row 3: TIDAK TERCAPAI (Below Target) */}
              <tr>
                <td colSpan={3} className="py-2 px-3 text-left font-bold text-rose-800 dark:text-rose-300 sticky left-0 bg-slate-200 dark:bg-slate-800 z-30 border-r-2 border-slate-300 dark:border-slate-700">
                  TIDAK TERCAPAI (Belum Memenuhi)
                </td>

                {(columnViewMode === 'all' || columnViewMode === 'raw') && (
                  summaryStats.tercapaiSummary.map(item => (
                    <td key={`foot-tidak-${item.indicatorKey}`} className="py-2 px-2 font-mono font-extrabold text-rose-700 dark:text-rose-300 bg-rose-50/70 dark:bg-rose-950/50">
                      {item.tidakTercapaiCount}
                    </td>
                  ))
                )}

                {(columnViewMode === 'all' || columnViewMode === 'normalized') && (
                  <td colSpan={11} className="py-2 px-2 text-center text-slate-400 dark:text-slate-500 text-[10px]">
                    (Evaluasi berdasarkan skor mentah)
                  </td>
                )}

                <td className="py-2 px-3 text-right font-mono text-rose-800 dark:text-rose-300 font-bold border-l border-slate-200 dark:border-slate-700">
                  {summaryStats.tercapaiSummary.reduce((a, b) => a + b.tidakTercapaiCount, 0)} Gagal
                </td>
                <td className="py-2 px-2 bg-slate-100 dark:bg-slate-800" />
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Floating Bottom-Right Popup for View-Only / Lock / Auto-Calculated Notification (on hover or click) */}
      {(errorMsg || hoveredNormalizedCell || (hoveredCell && !hoveredCell.canEdit)) && (
        <div
          className={`fixed bottom-6 right-6 z-40 p-4 bg-amber-50 dark:bg-amber-950/95 border border-amber-300 dark:border-amber-800 rounded-xl shadow-xl text-amber-900 dark:text-amber-200 max-w-xs text-xs animate-in fade-in duration-150 ${
            errorMsg ? '' : 'pointer-events-none'
          }`}
        >
          {errorMsg ? (
            <div className="flex items-start justify-between gap-2.5">
              <div className="flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <span className="leading-relaxed">{errorMsg}</span>
              </div>
              <button
                type="button"
                onClick={() => setErrorMsg(null)}
                className="text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100 shrink-0 cursor-pointer"
                aria-label="Tutup notifikasi"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : hoveredNormalizedCell ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-bold text-sm">{hoveredNormalizedCell.satker.satker}</div>
                  <div className="text-[11px] opacity-85">
                    P{hoveredNormalizedCell.indicator.label.replace('/', '')} · Kalkulasi Otomatis (Read-Only)
                  </div>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800/80 space-y-1 font-mono text-[11px]">
                <div className="flex justify-between gap-3">
                  <span className="opacity-80 font-sans">Skor Riil ({hoveredNormalizedCell.indicator.label}):</span>
                  <span className="font-semibold">{formatNumber(hoveredNormalizedCell.rawValue)}</span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="opacity-80 font-sans">Skor Maksimal Dimensi:</span>
                  <span className="font-semibold">{hoveredNormalizedCell.maxScore}</span>
                </div>
                <div className="flex justify-between gap-3 pt-0.5">
                  <span className="opacity-80 font-sans">Persentase (0-100):</span>
                  <span className="font-bold text-sm">{formatNumber(hoveredNormalizedCell.percentage)}%</span>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800/80 text-[11px] leading-relaxed">
                Sel ini selalu Read-Only dan dihitung otomatis: (Skor Riil ÷ {hoveredNormalizedCell.maxScore}) × 100%.
              </div>
            </div>
          ) : hoveredCell ? (
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                {isEditLocked ? (
                  <Lock className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                )}
                <div>
                  <div className="font-bold text-sm">{hoveredCell.satker.satker}</div>
                  <div className="text-[11px] opacity-85">{hoveredCell.satker.unitKerja}</div>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800/80 space-y-1">
                <div className="flex justify-between gap-3">
                  <span className="opacity-80">Indikator:</span>
                  <span className="font-semibold text-right">
                    {hoveredCell.indicator.fullName} ({hoveredCell.indicator.label})
                  </span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="opacity-80">Nilai Satker:</span>
                  <span className="font-bold text-sm">{formatNumber(hoveredCell.value)}</span>
                </div>
                <div className="flex justify-between font-mono">
                  <span className="opacity-80">Ambang Target:</span>
                  <span className="font-semibold">{hoveredCell.indicator.threshold}</span>
                </div>
                <div className="flex justify-between pt-0.5">
                  <span className="opacity-80">Status:</span>
                  <span
                    className={
                      isIndicatorTercapai(hoveredCell.indicator, hoveredCell.value)
                        ? 'text-emerald-700 dark:text-emerald-300 font-bold'
                        : 'text-rose-700 dark:text-rose-300 font-bold'
                    }
                  >
                    {isIndicatorTercapai(hoveredCell.indicator, hoveredCell.value)
                      ? 'TERCAPAI'
                      : 'TIDAK TERCAPAI'}
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-amber-200 dark:border-amber-800/80 text-[11px] leading-relaxed">
                {isEditLocked
                  ? isAdmin
                    ? 'Spreadsheet terkunci (Hanya-Baca). Klik tombol Kunci Edit di menu atas untuk membuka mode edit.'
                    : 'Spreadsheet terkunci (Hanya-Baca). Hanya Administrator yang dapat membuka kunci mode edit.'
                  : `Peran Anda (${currentUser?.role || 'Tamu'} · ${currentUser?.name || 'Tamu'}) hanya memiliki hak baca/tinjau (View-Only) untuk ${hoveredCell.satker.satker}.`}
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
};
