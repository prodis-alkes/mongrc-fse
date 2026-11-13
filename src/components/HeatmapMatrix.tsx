import React, { useState, useMemo } from 'react';
import { useGRC } from '../context/GRCContext';
import { INDICATOR_METAS } from '../data/baselineData';
import { formatNumber, isIndicatorTercapai } from '../utils/grcCalculations';
import { SatkerData, IndicatorMeta } from '../types/mongrc';
import { Search, Filter, HelpCircle } from 'lucide-react';

export const HeatmapMatrix: React.FC = () => {
  const { 
    satkers, 
    setSelectedSatkerNo, 
    selectedCategory, 
    setSelectedCategory, 
    summaryStats 
  } = useGRC();

  const [searchFilter, setSearchFilter] = useState('');
  const [hoveredCell, setHoveredCell] = useState<{
    satker: SatkerData;
    indicator: IndicatorMeta;
    value: number | null;
  } | null>(null);

  const filteredSatkers = useMemo(() => {
    return satkers.filter(s => {
      const matchCat = selectedCategory === 'ALL' || 
                       s.category === selectedCategory ||
                       (selectedCategory === 'Pusat' && (s.category === 'Pusat' || s.category === 'Direktorat'));
      const matchSearch = s.satker.toLowerCase().includes(searchFilter.toLowerCase()) ||
                          s.unitKerja.toLowerCase().includes(searchFilter.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [satkers, selectedCategory, searchFilter]);

  // Color generator for heatmap cells based on performance ratio vs target threshold
  const getCellColorClass = (meta: IndicatorMeta, value: number | null | undefined): string => {
    if (value === null || value === undefined) {
      return 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500';
    }

    const threshold = meta.threshold;
    const ratio = value / threshold;

    if (ratio >= 1.05) {
      return 'bg-emerald-600 dark:bg-emerald-600 text-white font-medium'; // High achievement
    } else if (ratio >= 1.0) {
      return 'bg-emerald-500/85 dark:bg-emerald-500/80 text-white font-medium'; // Target reached
    } else if (ratio >= 0.85) {
      return 'bg-amber-100 dark:bg-amber-950/60 text-amber-950 dark:text-amber-200 font-medium border border-amber-200 dark:border-amber-800'; // Close to target
    } else {
      return 'bg-rose-100 dark:bg-rose-950/60 text-rose-950 dark:text-rose-200 font-medium border border-rose-200 dark:border-rose-800'; // Under target
    }
  };

  return (
    <div className="space-y-6">
      {/* View Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Matriks Heatmap Kinerja GRC
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Visualisasi spasial dimensi tata kelola identifikasi celah kepatuhan dan anomali.
          </p>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center gap-3 text-xs bg-white dark:bg-slate-900 px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300">
          <span className="text-slate-500 dark:text-slate-400 font-medium">Status Capaian:</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-emerald-600 inline-block" />
            <span>Memenuhi Target</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-amber-200 dark:bg-amber-900/70 border border-amber-300 dark:border-amber-700 inline-block" />
            <span>Mendekati (85-99%)</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded-xs bg-rose-200 dark:bg-rose-900/70 border border-rose-300 dark:border-rose-700 inline-block" />
            <span>Di Bawah Target (&lt;85%)</span>
          </span>
        </div>
      </div>

      {/* Control Bar: Search & Category Filter */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Search */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchFilter}
            onChange={e => setSearchFilter(e.target.value)}
            placeholder="Cari satker dalam heatmap..."
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

      {/* Large Scrollable Heatmap Table Container */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="overflow-x-auto max-h-[720px] custom-scrollbar">
          <table className="w-full text-center border-collapse text-xs">
            {/* Table Header (Sticky top) */}
            <thead className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 shadow-xs">
              <tr className="text-slate-700 dark:text-slate-200 font-bold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-3 text-left w-12 sticky left-0 bg-slate-100 dark:bg-slate-800 z-20">No</th>
                <th className="py-3 px-3 text-left min-w-[200px] sticky left-12 bg-slate-100 dark:bg-slate-800 z-20 border-r border-slate-200 dark:border-slate-700">
                  Satuan Kerja
                </th>
                {INDICATOR_METAS.map(m => (
                  <th key={m.key} className="py-3 px-2 min-w-[76px] whitespace-nowrap">
                    <div>{m.label}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 font-normal font-mono lowercase">
                      target: {m.threshold}
                    </div>
                  </th>
                ))}
                <th className="py-3 px-3 min-w-[84px] text-right bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-slate-100">
                  Rata-Rata
                </th>
              </tr>
            </thead>

            {/* Table Body */}
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredSatkers.map(s => (
                <tr 
                  key={s.no} 
                  className="hover:bg-slate-50/80 dark:hover:bg-slate-800/60 transition-colors cursor-pointer group"
                  onClick={() => setSelectedSatkerNo(s.no)}
                >
                  <td className="py-2.5 px-3 text-left font-mono font-semibold text-slate-400 dark:text-slate-500 sticky left-0 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800">
                    {s.no}
                  </td>
                  <td className="py-2.5 px-3 text-left font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[240px] sticky left-12 bg-white dark:bg-slate-900 group-hover:bg-slate-50 dark:group-hover:bg-slate-800 border-r border-slate-200 dark:border-slate-700">
                    <div className="truncate">{s.satker}</div>
                    <div className="text-[10px] text-slate-400 dark:text-slate-400 font-normal truncate">{s.category}</div>
                  </td>

                  {/* Indicator Heatmap Cells */}
                  {INDICATOR_METAS.map(meta => {
                    const rawVal = s[meta.key] as number | null;
                    const colorClass = getCellColorClass(meta, rawVal);

                    return (
                      <td
                        key={meta.key}
                        className="py-1 px-1"
                        onMouseEnter={() => setHoveredCell({ satker: s, indicator: meta, value: rawVal })}
                        onMouseLeave={() => setHoveredCell(null)}
                      >
                        <div
                          className={`w-full h-8 flex items-center justify-center rounded-sm font-mono text-[11px] tabular-nums transition-transform hover:scale-105 hover:ring-2 hover:ring-blue-600 ${colorClass}`}
                        >
                          {formatNumber(rawVal)}
                        </div>
                      </td>
                    );
                  })}

                  {/* Composite Average Cell */}
                  <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900 dark:text-slate-100 bg-slate-50 dark:bg-slate-800/60">
                    <span className={`px-1.5 py-0.5 rounded-sm ${
                      s.average >= 85 ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-950/70' :
                      s.average >= 80 ? 'text-blue-900 dark:text-blue-300 bg-blue-100 dark:bg-blue-950/70' :
                      'text-rose-800 dark:text-rose-300 bg-rose-100 dark:bg-rose-950/70'
                    }`}>
                      {formatNumber(s.average)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>

            {/* Table Footer: TERCAPAI count and National Average */}
            <tfoot className="sticky bottom-0 z-10 bg-slate-100 dark:bg-slate-800 border-t-2 border-slate-300 dark:border-slate-700 font-semibold text-[11px]">
              {/* Row 1: Rata-Rata Nasional */}
              <tr className="border-b border-slate-200 dark:border-slate-700">
                <td colSpan={2} className="py-2.5 px-3 text-left font-bold text-slate-800 dark:text-slate-100 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-700">
                  Rata-Rata Nasional
                </td>
                {INDICATOR_METAS.map(meta => (
                  <td key={`avg-${meta.key}`} className="py-2.5 px-2 font-mono font-bold text-slate-800 dark:text-slate-200">
                    {formatNumber(summaryStats.rawAverages[meta.key])}
                  </td>
                ))}
                <td className="py-2.5 px-3 text-right font-mono font-extrabold text-blue-900 dark:text-blue-200 bg-blue-100 dark:bg-blue-950/80 text-xs">
                  {formatNumber(summaryStats.nationalAverage)}
                </td>
              </tr>

              {/* Row 2: Target Tercapai Count */}
              <tr>
                <td colSpan={2} className="py-2 px-3 text-left font-bold text-emerald-800 dark:text-emerald-300 sticky left-0 bg-slate-100 dark:bg-slate-800 z-10 border-r border-slate-200 dark:border-slate-700">
                  Jumlah Satker TERCAPAI
                </td>
                {summaryStats.tercapaiSummary.map(item => (
                  <td key={`tercapai-${item.indicatorKey}`} className="py-2 px-2 font-mono font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-50/50 dark:bg-emerald-950/40">
                    {item.tercapaiCount}
                  </td>
                ))}
                <td className="py-2 px-3 text-right text-emerald-800 dark:text-emerald-300">
                  {summaryStats.tercapaiSummary.reduce((a, b) => a + b.tercapaiCount, 0)} Total
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Floating Info Tooltip when hovering any cell */}
      {hoveredCell && (
        <div className="fixed bottom-6 right-6 z-40 bg-slate-900 dark:bg-slate-800 text-white p-4 rounded-xl shadow-xl border border-slate-700 max-w-xs text-xs pointer-events-none animate-in fade-in duration-150">
          <div className="font-bold text-sm text-blue-300">
            {hoveredCell.satker.satker}
          </div>
          <div className="text-slate-300 text-[11px] mb-2">{hoveredCell.satker.unitKerja}</div>
          <div className="pt-2 border-t border-slate-700 space-y-1">
            <div className="flex justify-between">
              <span className="text-slate-400">Indikator:</span>
              <span className="font-semibold">{hoveredCell.indicator.fullName} ({hoveredCell.indicator.label})</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Nilai Satker:</span>
              <span className="font-bold text-white text-sm">{formatNumber(hoveredCell.value)}</span>
            </div>
            <div className="flex justify-between font-mono">
              <span className="text-slate-400">Ambang Target:</span>
              <span className="text-amber-300 font-semibold">{hoveredCell.indicator.threshold}</span>
            </div>
            <div className="flex justify-between pt-1">
              <span className="text-slate-400">Status:</span>
              <span className={isIndicatorTercapai(hoveredCell.indicator, hoveredCell.value) ? 'text-emerald-400 font-bold' : 'text-rose-400 font-bold'}>
                {isIndicatorTercapai(hoveredCell.indicator, hoveredCell.value) ? 'TERCAPAI' : 'TIDAK TERCAPAI'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
