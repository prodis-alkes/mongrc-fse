import React, { useState } from 'react';
import { useGRC } from '../context/GRCContext';
import { parseCSVToSatkers, formatNumber } from '../utils/grcCalculations';
import { SatkerData } from '../types/mongrc';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertTriangle, 
  FileText 
} from 'lucide-react';

interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CSVImportModal: React.FC<CSVImportModalProps> = ({ isOpen, onClose }) => {
  const { bulkImportSatkers } = useGRC();

  const [csvText, setCsvText] = useState('');
  const [parsedResult, setParsedResult] = useState<{
    satkers: SatkerData[];
    errors: string[];
  } | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      setCsvText(content);
      const res = parseCSVToSatkers(content);
      setParsedResult(res);
    };
    reader.readAsText(file);
  };

  const handleTextChange = (text: string) => {
    setCsvText(text);
    if (text.trim().length > 10) {
      const res = parseCSVToSatkers(text);
      setParsedResult(res);
    } else {
      setParsedResult(null);
    }
  };

  const handleCommitImport = () => {
    if (!parsedResult || parsedResult.satkers.length === 0) return;
    bulkImportSatkers(parsedResult.satkers);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 dark:bg-black/70 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-800/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-100 dark:bg-blue-950/70 text-blue-900 dark:text-blue-400 rounded-lg">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-50">
                Impor Pembaruan Berkas CSV MonGRC
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Unggah atau tempel data spreadsheet CSV resmi Ditjen P2 untuk memperbarui skor secara massal.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5 overflow-y-auto custom-scrollbar flex-1 text-xs">
          {/* File Upload Drop Area */}
          <div className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-blue-500 dark:hover:border-blue-500 rounded-xl p-6 text-center transition-colors bg-slate-50/50 dark:bg-slate-800/40">
            <Upload className="w-8 h-8 text-blue-700 dark:text-blue-400 mx-auto mb-2" />
            <div className="font-semibold text-slate-900 dark:text-slate-100 text-sm mb-1">
              Pilih Berkas CSV Spreadsheet
            </div>
            <p className="text-slate-500 dark:text-slate-400 text-xs mb-3">
              Mendukung format koma standar MonGRC (No, Unit Kerja, SATKER, SKI, SPIP, dst.)
            </p>
            <label className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 dark:bg-blue-700 hover:bg-blue-800 dark:hover:bg-blue-600 text-white font-medium rounded-lg cursor-pointer transition-colors text-xs">
              <span>Jelajahi File...</span>
              <input
                type="file"
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* Or Paste CSV Text directly */}
          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Atau Tempel (Paste) Teks CSV Langsung:
            </label>
            <textarea
              rows={4}
              value={csvText}
              onChange={e => handleTextChange(e.target.value)}
              placeholder="No,Unit Kerja / Satuan Kerja,SATKER,SKI,SPIP,..."
              className="w-full p-2.5 font-mono text-[11px] bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-slate-100 placeholder:text-slate-400 dark:placeholder:text-slate-500 rounded-lg focus:outline-hidden focus:ring-1 focus:ring-blue-600"
            />
          </div>

          {/* Validation & Preview section */}
          {parsedResult && (
            <div className="space-y-3 pt-2 border-t border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900 dark:text-slate-100 text-sm">
                  Hasil Pemindaian Struktur
                </span>
                {parsedResult.errors.length === 0 ? (
                  <span className="inline-flex items-center gap-1 text-emerald-800 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/60 px-2.5 py-1 rounded-full font-semibold">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    {parsedResult.satkers.length} Satker Terdeteksi Valid
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-rose-800 dark:text-rose-300 bg-rose-50 dark:bg-rose-950/60 px-2.5 py-1 rounded-full font-semibold">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                    Peringatan Struktur
                  </span>
                )}
              </div>

              {parsedResult.errors.length > 0 && (
                <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-lg text-rose-900 dark:text-rose-300 space-y-1">
                  {parsedResult.errors.map((err, idx) => (
                    <div key={idx}>· {err}</div>
                  ))}
                </div>
              )}

              {/* Preview First 3 Rows */}
              {parsedResult.satkers.length > 0 && (
                <div className="border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden">
                  <div className="bg-slate-100 dark:bg-slate-800 px-3 py-1.5 font-semibold text-slate-700 dark:text-slate-200 text-[11px]">
                    Pratinjau Data (3 Baris Pertama):
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-slate-800 font-mono text-[11px]">
                    {parsedResult.satkers.slice(0, 3).map(s => (
                      <div key={s.no} className="px-3 py-2 flex items-center justify-between">
                        <div>
                          <span className="font-bold text-slate-900 dark:text-slate-100">{s.no}. {s.satker}</span>
                          <span className="text-slate-400 dark:text-slate-500 ml-2">({s.category})</span>
                        </div>
                        <div className="text-right">
                          <span className="text-slate-500 dark:text-slate-400">Skor Rata-Rata: </span>
                          <span className="font-bold text-blue-900 dark:text-blue-400">{formatNumber(s.average)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/70 flex items-center justify-end gap-3 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-slate-700 dark:text-slate-200 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
          >
            Batal
          </button>
          <button
            onClick={handleCommitImport}
            disabled={!parsedResult || parsedResult.satkers.length === 0}
            className="px-4 py-2 text-xs font-semibold text-white bg-blue-900 dark:bg-blue-700 rounded-lg hover:bg-blue-800 dark:hover:bg-blue-600 disabled:opacity-50 transition-colors shadow-xs"
          >
            Terapkan & Muat {parsedResult?.satkers.length || 0} Satker
          </button>
        </div>
      </div>
    </div>
  );
};
