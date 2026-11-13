import React, { useState } from 'react';
import { INDICATOR_METAS } from '../data/baselineData';
import { SatkerData } from '../types/mongrc';
import { formatNumber } from '../utils/grcCalculations';

interface RadarChartProps {
  primarySatker: SatkerData;
  compareSatker?: SatkerData | null;
  nationalAverages: Record<string, number>;
  size?: number;
}

export const RadarChart: React.FC<RadarChartProps> = ({
  primarySatker,
  compareSatker,
  nationalAverages,
  size = 460,
}) => {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // We have 11 normalized dimensions
  const dimensions = INDICATOR_METAS.filter(m => m.pKey !== null).map(m => ({
    key: m.pKey!,
    rawKey: m.key,
    label: m.label,
    fullName: m.fullName,
    scale: m.scale,
    threshold: m.scale === '5-scale' ? m.threshold * 20 : m.threshold,
    rawThreshold: m.threshold,
  }));

  const totalAxes = dimensions.length; // 11
  const center = size / 2;
  const radius = (size / 2) - 55; // Leave margin for labels
  const angleStep = (2 * Math.PI) / totalAxes;

  // Function to convert polar to cartesian coordinates
  const getCoordinates = (value: number, index: number, maxVal = 100) => {
    const angle = index * angleStep - Math.PI / 2;
    const clampedVal = Math.max(0, Math.min(maxVal, value));
    const r = (clampedVal / maxVal) * radius;
    return {
      x: center + r * Math.cos(angle),
      y: center + r * Math.sin(angle),
    };
  };

  // Polygon points generator
  const getPolygonPoints = (getValue: (dim: typeof dimensions[0]) => number) => {
    return dimensions
      .map((dim, i) => {
        const val = getValue(dim);
        const { x, y } = getCoordinates(val, i);
        return `${x.toFixed(1)},${y.toFixed(1)}`;
      })
      .join(' ');
  };

  // Concentric background rings (20%, 40%, 60%, 80%, 100%)
  const rings = [20, 40, 60, 80, 100];

  const primaryPoints = getPolygonPoints(dim => (primarySatker[dim.key] as number) ?? 0);
  const nationalPoints = getPolygonPoints(dim => (nationalAverages[dim.key] as number) ?? 0);
  const comparePoints = compareSatker 
    ? getPolygonPoints(dim => (compareSatker[dim.key] as number) ?? 0)
    : null;

  return (
    <div className="relative flex flex-col items-center select-none">
      <svg
        width={size}
        height={size}
        className="overflow-visible"
        viewBox={`0 0 ${size} ${size}`}
      >
        {/* Background Concentric Polygon Web */}
        {rings.map(ringVal => {
          const ringPoints = dimensions
            .map((_, i) => {
              const { x, y } = getCoordinates(ringVal, i);
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');

          return (
            <g key={ringVal}>
              <polygon
                points={ringPoints}
                fill="none"
                className={ringVal === 100 ? 'stroke-slate-300 dark:stroke-slate-600' : 'stroke-slate-200 dark:stroke-slate-700'}
                strokeWidth={ringVal === 100 ? 1.5 : 1}
                strokeDasharray={ringVal === 100 ? undefined : '2 2'}
              />
              {/* Ring percentage label */}
              <text
                x={center}
                y={center - (ringVal / 100) * radius - 2}
                textAnchor="middle"
                className="text-[9px] fill-slate-400 dark:fill-slate-500 font-mono select-none"
              >
                {ringVal}%
              </text>
            </g>
          );
        })}

        {/* Radial Axis Spokes */}
        {dimensions.map((dim, i) => {
          const { x, y } = getCoordinates(100, i);
          const isHovered = hoveredIndex === i;

          // Label position slightly outside the circle
          const labelAngle = i * angleStep - Math.PI / 2;
          const labelRadius = radius + 22;
          const labelX = center + labelRadius * Math.cos(labelAngle);
          const labelY = center + labelRadius * Math.sin(labelAngle);

          return (
            <g key={dim.key}>
              <line
                x1={center}
                y1={center}
                x2={x}
                y2={y}
                className={isHovered ? 'stroke-blue-500 dark:stroke-blue-400' : 'stroke-slate-200 dark:stroke-slate-700'}
                strokeWidth={isHovered ? 1.5 : 1}
              />
              <text
                x={labelX}
                y={labelY + 4}
                textAnchor="middle"
                className={`text-[11px] font-semibold transition-colors cursor-pointer ${
                  isHovered ? 'fill-blue-800 dark:fill-blue-400 font-bold' : 'fill-slate-600 dark:fill-slate-300'
                }`}
                onMouseEnter={() => setHoveredIndex(i)}
                onMouseLeave={() => setHoveredIndex(null)}
              >
                {dim.label}
              </text>
            </g>
          );
        })}

        {/* 1. National Benchmark Area */}
        <polygon
          points={nationalPoints}
          fill="rgba(148, 163, 184, 0.2)"
          stroke="#94a3b8"
          strokeWidth={1.5}
          strokeDasharray="4 3"
        />

        {/* 2. Compare Satker Area (if selected) */}
        {comparePoints && (
          <polygon
            points={comparePoints}
            fill="rgba(217, 119, 6, 0.18)"
            stroke="#f59e0b"
            strokeWidth={2}
          />
        )}

        {/* 3. Primary Satker Area */}
        <polygon
          points={primaryPoints}
          className="fill-blue-900/25 dark:fill-blue-500/25 stroke-blue-900 dark:stroke-blue-400"
          strokeWidth={2.5}
        />

        {/* Data points for Primary Satker */}
        {dimensions.map((dim, i) => {
          const val = (primarySatker[dim.key] as number) ?? 0;
          const { x, y } = getCoordinates(val, i);
          const isHovered = hoveredIndex === i;

          return (
            <circle
              key={`dot-${dim.key}`}
              cx={x}
              cy={y}
              r={isHovered ? 6 : 4}
              className="fill-blue-900 dark:fill-blue-400 stroke-white dark:stroke-slate-900 cursor-pointer transition-all duration-150"
              strokeWidth={1.5}
              onMouseEnter={() => setHoveredIndex(i)}
              onMouseLeave={() => setHoveredIndex(null)}
            />
          );
        })}
      </svg>

      {/* Chart Legend */}
      <div className="flex flex-wrap items-center justify-center gap-6 mt-2 text-xs font-medium text-slate-700 dark:text-slate-300">
        <div className="flex items-center gap-2">
          <span className="w-3.5 h-3.5 rounded-sm bg-blue-900 dark:bg-blue-500 border border-blue-900 dark:border-blue-400 inline-block opacity-85" />
          <span>{primarySatker.satker} (Utama)</span>
        </div>

        {compareSatker && (
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded-sm bg-amber-600 dark:bg-amber-500 border border-amber-600 dark:border-amber-400 inline-block opacity-85" />
            <span>{compareSatker.satker} (Pembanding)</span>
          </div>
        )}

        <div className="flex items-center gap-2">
          <span className="w-4 h-0.5 border-t-2 border-dashed border-slate-400 dark:border-slate-500 inline-block" />
          <span className="text-slate-500 dark:text-slate-400">Rata-Rata Nasional Satker</span>
        </div>
      </div>

      {/* Hovered Dimension Inspection Detail Card */}
      {hoveredIndex !== null && (
        <div className="mt-3 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-sm text-xs max-w-sm w-full">
          <div className="font-bold text-slate-900 dark:text-slate-100 text-sm">
            {dimensions[hoveredIndex].fullName} ({dimensions[hoveredIndex].label})
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-700 font-mono text-[11px]">
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Skor {primarySatker.satker}:</span>
              <span className="font-bold text-blue-900 dark:text-blue-400 text-sm">
                {formatNumber(primarySatker[dimensions[hoveredIndex].key] as number)}
              </span>
              <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">
                (mentah: {formatNumber(primarySatker[dimensions[hoveredIndex].rawKey] as number)})
              </span>
            </div>
            <div>
              <span className="text-slate-500 dark:text-slate-400 block text-[10px]">Rata-Rata Nasional:</span>
              <span className="font-bold text-slate-700 dark:text-slate-200 text-sm">
                {formatNumber(nationalAverages[dimensions[hoveredIndex].key])}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
