import React, { useState, useMemo } from 'react';
import { useGRC } from '../context/GRCContext';
import { RadarChart } from './RadarChart';
import { INDICATOR_METAS } from '../data/baselineData';
import { formatNumber } from '../utils/grcCalculations';
import { SatkerData } from '../types/mongrc';
import { 
  Award, 
  TrendingUp, 
  AlertTriangle, 
  Building2, 
  Search, 
  ArrowUpDown, 
  ChevronRight,
  ShieldAlert,
  CheckCircle2,
  SlidersHorizontal
} from 'lucide-react';

export const ExecutiveDashboard: React.FC = () => {
  const { 
    satkers, 
    summaryStats, 
    setSelectedSatkerNo, 
    selectedCategory, 
    setSelectedCategory,
    setActiveTab 
  } = useGRC();

  // Radar selection
  const [radarPrimaryId, setRadarPrimaryId] = useState<number>(1); // Default to Batam
  const [radarCompareId, setRadarCompareId] = useState<number | null>(11); // Compare with Bandung

  // Leaderboard sorting
  const [sortField, setSortField] = useState<'average' | 'satker' | 'category'>('average');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [searchFilter, setSearchFilter] = useState('');

  // Primary and Compare Satker objects
  const primarySatker = useMemo(() => {
    return satkers.find(s => s.no === radarPrimaryId) || satkers[0];
  }, [satkers, radarPrimaryId]);

  const compareSatker = useMemo(() => {
    if (!radarCompareId) return null;
    return satkers.find(s => s.no === radarCompareId) || null;
  }, [satkers, radarCompareId]);

  // Ranked satkers
  const sortedSatkers = useMemo(() => {
    return [...satkers].sort((a, b) => b.average - a.average);
  }, [satkers]);

  const topSatker = sortedSatkers[0];
  const lowestSatker = sortedSatkers[sortedSatkers.length - 1];

  // Filtered leaderboard
  const displayedSatkers = useMemo(() => {
    return satkers
      .filter(s => {
        const matchesCategory = selectedCategory === 'ALL' || 
                                s.category === selectedCategory ||
                                (selectedCategory === 'Pusat' && (s.category === 'Pusat' || s.category === 'Direktorat'));
        const matchesSearch = s.satker.toLowerCase().includes(searchFilter.toLowerCase()) ||
                              s.unitKerja.toLowerCase().includes(searchFilter.toLowerCase());
        return matchesCategory && matchesSearch;
      })
      .sort((a, b) => {
        let diff = 0;
        if (sortField === 'average') diff = a.average - b.average;
        else if (sortField === 'satker') diff = a.satker.localeCompare(b.satker);
        else if (sortField === 'category') diff = a.category.localeCompare(b.category);
        return sortOrder === 'desc' ? -diff : diff;
      });
  }, [satkers, selectedCategory, searchFilter, sortField, sortOrder]);

  // Calculate overall target achievement rate across all metrics
  const totalEvaluations = summaryStats.tercapaiSummary.reduce((sum, item) => sum + item.totalEvaluated, 0);
  const totalTercapai = summaryStats.tercapaiSummary.reduce((sum, item) => sum + item.tercapaiCount, 0);
  const overallTercapaiRate = totalEvaluations > 0 ? (totalTercapai / totalEvaluations) * 100 : 0;

  // Indicators needing highest intervention (lowest achievement rate)
  const vulnerableIndicators = useMemo(() => {
    return [...summaryStats.tercapaiSummary]
      .sort((a, b) => a.achievementRate - b.achievementRate)
      .slice(0, 3);
  }, [summaryStats]);

  // Highest performing indicators
  const strongestIndicators = useMemo(() => {
    return [...summaryStats.tercapaiSummary]
      .sort((a, b) => b.achievementRate - a.achievementRate)
      .slice(0, 3);
  }, [summaryStats]);

  const categories = [
    { key: 'ALL', label: 'Semua Satker (57)' },
    { key: 'Balai Besar', label: 'Balai Besar (7)' },
    { key: 'Balai Kelas I', label: 'Balai Kelas I (26)' },
    { key: 'Balai Kelas II', label: 'Balai Kelas II (16)' },
    { key: 'Loka', label: 'Loka (2)' },
    { key: 'Pusat', label: 'Pusat (6)' },
  ];

  return (
    <div className="space-y-8">
      {/* Page Title & Context Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-slate-200 dark:border-slate-800">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            Dashboard Eksekutif MonGRC
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Evaluasi Governance, Risk, and Compliance Satuan Kerja di lingkungan Ditjen P2
          </p>
        </div>

        {/* Quick View Switcher button to Spreadsheet */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('spreadsheet')}
            className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-blue-900 dark:text-blue-200 bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/60 transition-colors cursor-pointer"
          >
            <span>Spreadsheet</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Top KPI Metrics Row (4 Clean structural cards) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: National Average */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Kinerja Rata-Rata
            </span>
            <Award className="w-4 h-4 text-blue-800 dark:text-blue-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatNumber(summaryStats.nationalAverage)}
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">/ 100</span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Kategori:{' '}
            <span className="font-semibold text-emerald-700 dark:text-emerald-400">Baik (Kepatuhan Terjaga)</span>
          </div>
        </div>

        {/* KPI 2: Overall Compliance Rate */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Tingkat Ketercapaian
            </span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-slate-100 font-mono tabular-nums">
              {formatNumber(overallTercapaiRate, 1)}%
            </span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              ({totalTercapai}/{totalEvaluations} target)
            </span>
          </div>
          <div className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Terpenuhi sesuai batas standar minimum
          </div>
        </div>

        {/* KPI 3: Highest Ranked Satker */}
        <div 
          onClick={() => {
            setRadarPrimaryId(topSatker.no);
            setSelectedSatkerNo(topSatker.no);
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-blue-400 dark:hover:border-blue-600 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Satker Skor Tertinggi
            </span>
            <TrendingUp className="w-4 h-4 text-blue-700 dark:text-blue-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {topSatker.satker}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{topSatker.category}</div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-blue-900 dark:text-blue-400">
            Skor Komposit: {formatNumber(topSatker.average)}
          </div>
        </div>

        {/* KPI 4: Lowest Unit / Needs Intervention */}
        <div 
          onClick={() => {
            setRadarPrimaryId(lowestSatker.no);
            setSelectedSatkerNo(lowestSatker.no);
          }}
          className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs hover:border-amber-400 dark:hover:border-amber-600 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Perlu Akselerasi
            </span>
            <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
          </div>
          <div className="mt-3">
            <div className="text-lg font-bold text-slate-900 dark:text-slate-100 truncate">
              {lowestSatker.satker}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 truncate">{lowestSatker.category}</div>
          </div>
          <div className="mt-2 text-xs font-mono font-bold text-amber-700 dark:text-amber-400">
            Skor Komposit: {formatNumber(lowestSatker.average)}
          </div>
        </div>
      </div>

      {/* Main Grid: Radar Comparison on Left, Systemic Highlights on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (7 cols): Radar Multi-Dimensional Comparison */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Profil Radar 11 Dimensi GRC
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Bandingkan performa tata kelola Satker terhadap rata-rata nasional.
              </p>
            </div>

            {/* Selectors for Satker */}
            <div className="flex items-center gap-2">
              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Satker Utama:
                </label>
                <select
                  value={radarPrimaryId}
                  onChange={e => setRadarPrimaryId(parseInt(e.target.value, 10))}
                  className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-blue-600"
                >
                  {satkers.map(s => (
                    <option key={s.no} value={s.no}>
                      {s.satker} ({formatNumber(s.average)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-semibold text-slate-500 dark:text-slate-400 mb-1">
                  Bandingkan:
                </label>
                <select
                  value={radarCompareId ?? ''}
                  onChange={e => setRadarCompareId(e.target.value ? parseInt(e.target.value, 10) : null)}
                  className="text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-md px-2.5 py-1.5 text-slate-800 dark:text-slate-100 focus:outline-hidden focus:ring-1 focus:ring-amber-600"
                >
                  <option value="">(Tidak Ada)</option>
                  {satkers.map(s => (
                    <option key={s.no} value={s.no}>
                      {s.satker} ({formatNumber(s.average)})
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* SVG Radar Chart component */}
          <div className="pt-4 flex justify-center">
            <RadarChart
              primarySatker={primarySatker}
              compareSatker={compareSatker}
              nationalAverages={summaryStats.pAverages}
              size={460}
            />
          </div>
        </div>

        {/* Right Column (5 cols): Systemic Diagnosis & Strategic Highlights */}
        <div className="lg:col-span-5 space-y-6">
          {/* Critical Vulnerabilities Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-rose-800 dark:text-rose-400 mb-2">
              <ShieldAlert className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Prioritas Intervensi
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Indikator dengan tingkat kegagalan target paling tinggi yang membutuhkan asistensi terpadu.
            </p>

            <div className="space-y-3">
              {vulnerableIndicators.map(item => {
                const meta = INDICATOR_METAS.find(m => m.key === item.indicatorKey);
                return (
                  <div 
                    key={item.indicatorKey} 
                    className="p-3 bg-rose-50/50 dark:bg-rose-950/30 border border-rose-100 dark:border-rose-900/60 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>{meta?.label} · {meta?.fullName}</span>
                      <span className="text-rose-700 dark:text-rose-400 font-mono">
                        {item.tercapaiCount} dari {item.totalEvaluated} Satker
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                      <span>Batas Ambang Target: <strong className="font-mono">{item.threshold}</strong></span>
                      <span className="font-semibold text-rose-800 dark:text-rose-300">
                        Hanya {formatNumber(item.achievementRate, 1)}% Memenuhi
                      </span>
                    </div>
                    <div className="w-full bg-rose-200 dark:bg-rose-950 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-rose-600 dark:bg-rose-500 h-full rounded-full" 
                        style={{ width: `${item.achievementRate}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Strongest Indicators Card */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs">
            <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-400 mb-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                Pilar Tata Kelola Terkuat
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Indikator dengan tingkat kepatuhan dan pencapaian target paling konsisten.
            </p>

            <div className="space-y-3">
              {strongestIndicators.map(item => {
                const meta = INDICATOR_METAS.find(m => m.key === item.indicatorKey);
                return (
                  <div 
                    key={item.indicatorKey} 
                    className="p-3 bg-emerald-50/50 dark:bg-emerald-950/30 border border-emerald-100 dark:border-emerald-900/60 rounded-lg text-xs"
                  >
                    <div className="flex items-center justify-between font-bold text-slate-900 dark:text-slate-100">
                      <span>{meta?.label} · {meta?.fullName}</span>
                      <span className="text-emerald-700 dark:text-emerald-400 font-mono">
                        {item.tercapaiCount} dari {item.totalEvaluated} Satker
                      </span>
                    </div>
                    <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-300">
                      <span>Batas Ambang Target: <strong className="font-mono">{item.threshold}</strong></span>
                      <span className="font-semibold text-emerald-800 dark:text-emerald-300">
                        {formatNumber(item.achievementRate, 1)}% Memenuhi
                      </span>
                    </div>
                    <div className="w-full bg-emerald-200 dark:bg-emerald-950 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div 
                        className="bg-emerald-600 dark:bg-emerald-500 h-full rounded-full" 
                        style={{ width: `${item.achievementRate}%` }} 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Leaderboard & Ranking Section */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs overflow-hidden">
        <div className="p-6 border-b border-slate-200 dark:border-slate-800">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Peringkat Seluruh Satuan Kerja
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daftar lengkap 57 unit kerja diurutkan berdasarkan skor komposit GRC. Klik baris untuk telaah detail & kolaborasi.
              </p>
            </div>

            {/* Search Input */}
            <div className="relative w-full lg:w-72">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchFilter}
                onChange={e => setSearchFilter(e.target.value)}
                placeholder="Cari satker / unit kerja..."
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600"
              />
            </div>
          </div>

          {/* Category Filter Tabs */}
          <div className="flex items-center gap-1.5 mt-4 overflow-x-auto pb-1">
            {categories.map(cat => (
              <button
                key={cat.key}
                onClick={() => setSelectedCategory(cat.key)}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                  selectedCategory === cat.key
                    ? 'bg-blue-900 dark:bg-blue-700 text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Table Leaderboard */}
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[11px]">
                <th className="py-3 px-4 w-14 text-center">Rank</th>
                <th className="py-3 px-4">Satker / Unit Kerja</th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4 text-center">SPIP</th>
                <th className="py-3 px-4 text-center">MRI</th>
                <th className="py-3 px-4 text-center">SAKIP</th>
                <th className="py-3 px-4 text-center">IKPA</th>
                <th className="py-3 px-4 text-right">Skor Rata-Rata</th>
                <th className="py-3 px-4 text-center">Tindakan</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {displayedSatkers.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 dark:text-slate-400">
                    Tidak ditemukan satuan kerja yang sesuai dengan kriteria pencarian.
                  </td>
                </tr>
              ) : (
                displayedSatkers.map((s) => {
                  const nationalRank = sortedSatkers.findIndex(item => item.no === s.no) + 1;
                  const isTop3 = nationalRank <= 3;

                  return (
                    <tr
                      key={s.no}
                      onClick={() => setSelectedSatkerNo(s.no)}
                      className="hover:bg-blue-50/50 dark:hover:bg-slate-800/60 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-4 text-center font-mono font-bold text-slate-500 dark:text-slate-400">
                        {isTop3 ? (
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 text-xs font-extrabold">
                            {nationalRank}
                          </span>
                        ) : (
                          nationalRank
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-slate-100">{s.satker}</div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 truncate max-w-sm">
                          {s.unitKerja}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 whitespace-nowrap">
                        {s.category}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800 dark:text-slate-200">
                        {formatNumber(s.spip)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800 dark:text-slate-200">
                        {formatNumber(s.mri)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800 dark:text-slate-200">
                        {formatNumber(s.sakip)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-800 dark:text-slate-200">
                        {formatNumber(s.ikpa)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-sm text-slate-900 dark:text-slate-100 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-sm ${
                          s.average >= 85 ? 'text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 font-extrabold' :
                          s.average >= 80 ? 'text-blue-900 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/60' :
                          s.average >= 75 ? 'text-slate-800 dark:text-slate-200' :
                          'text-rose-700 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60'
                        }`}>
                          {formatNumber(s.average)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedSatkerNo(s.no);
                          }}
                          className="px-2.5 py-1 text-[11px] font-medium text-blue-900 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-md transition-colors cursor-pointer"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
