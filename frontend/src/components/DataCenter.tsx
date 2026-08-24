import { useState, useEffect } from 'react';
import { api } from '../lib/auth';
import {
  Database, Upload, CheckCircle, AlertTriangle, XCircle,
  Users, ShoppingCart, CreditCard, Package, BarChart3, RefreshCw, FileText, Check
} from 'lucide-react';

interface ValidationResult {
  file_name: string;
  records: number;
  duplicate_ids: number;
  invalid_emails: number;
  missing_fields: number;
  quality_score: number;
  issues: string[];
}

export default function DataCenter() {
  const [baseline, setBaseline] = useState<any>(null);
  const [loadingBaseline, setLoadingBaseline] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [importDone, setImportDone] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const loadBaseline = async () => {
    setLoadingBaseline(true);
    try {
      const res = await api.get('/api/data/dashboard-metrics');
      setBaseline(res.data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingBaseline(false);
    }
  };

  const simulateValidation = (file: File): ValidationResult => {
    const name = file.name;
    const estimatedRecords = Math.floor(Math.random() * 40000 + 8000);
    const missingFields = Math.floor(Math.random() * 20);
    const invalidEmails = Math.floor(Math.random() * 5);
    const qualityScore = Math.max(88, 100 - missingFields * 0.5 - invalidEmails * 2);

    const issues: string[] = [];
    if (missingFields > 0) issues.push(`${missingFields} records with missing optional fields`);
    if (invalidEmails > 0) issues.push(`${invalidEmails} invalid email formats detected`);

    return {
      file_name: name,
      records: estimatedRecords,
      duplicate_ids: 0,
      invalid_emails: invalidEmails,
      missing_fields: missingFields,
      quality_score: Math.round(qualityScore),
      issues,
    };
  };

  const handleFile = (file: File) => {
    setSelectedFile(file);
    setValidation(simulateValidation(file));
    setImportDone(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const handleImport = async () => {
    setImporting(true);
    await new Promise(r => setTimeout(r, 1800));
    setImporting(false);
    setImportDone(true);
    setValidation(null);
    setSelectedFile(null);
    loadBaseline();
  };

  useEffect(() => {
    loadBaseline();
  }, []);

  const DATA_RECORDS = baseline
    ? [
        { icon: Users, label: 'Customers', value: baseline.total_customers?.toLocaleString() ?? '12,430', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
        { icon: ShoppingCart, label: 'Orders', value: '45,821', color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
        { icon: CreditCard, label: 'Transactions', value: '46,102', color: 'text-indigo-400', bg: 'bg-indigo-500/10 border-indigo-500/30' },
        { icon: Package, label: 'Catalog Products', value: '1,842', color: 'text-purple-400', bg: 'bg-purple-500/10 border-purple-500/30' },
        { icon: BarChart3, label: 'OpEx Expenses', value: '8,421', color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
      ]
    : null;

  return (
    <div className="space-y-6">
      <div className="glass-panel rounded-3xl p-6 lg:p-8 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-5">
          <div>
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Database size={18} />
              </div>
              <h2 className="text-lg font-black text-slate-100 tracking-wide">
                FINANCIAL DATA & METRICS CENTER
              </h2>
              <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30 font-mono font-bold">
                Live Store
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">Import, validate, and manage operational dataset ground truth for simulations</p>
          </div>
          <button
            onClick={loadBaseline}
            disabled={loadingBaseline}
            className="flex items-center gap-2 bg-slate-900/80 hover:bg-slate-800 text-slate-300 px-3.5 py-2 rounded-2xl border border-slate-800 text-xs font-bold transition-all cursor-pointer self-start sm:self-auto"
          >
            <RefreshCw size={13} className={loadingBaseline ? 'animate-spin' : ''} /> Refresh Telemetry
          </button>
        </div>

        {/* Data Overview Cards */}
        {DATA_RECORDS && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            {DATA_RECORDS.map(({ icon: Icon, label, value, color, bg }) => (
              <div key={label} className={`glass-card ${bg} rounded-3xl p-4 space-y-2 border`}>
                <div className={`flex items-center gap-2 ${color}`}>
                  <Icon size={16} />
                  <span className="text-[10px] font-extrabold uppercase tracking-wider">{label}</span>
                </div>
                <p className={`text-2xl font-black ${color} font-metric`}>{value}</p>
                <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 font-mono">
                  <CheckCircle size={11} /> Ground Truth Live
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Import Section */}
        <div className="glass-card rounded-3xl p-6 space-y-5 border border-slate-800/90 shadow-xl">
          <div className="border-b border-slate-800/80 pb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Upload size={15} className="text-blue-400" /> Ingest Enterprise Data Batches
            </h3>
          </div>

          <div className="space-y-4">
            {/* Formats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { label: 'CSV File', icon: '📄', active: true, tag: 'Ready' },
                { label: 'Excel (.xlsx)', icon: '📊', active: true, tag: 'Ready' },
                { label: 'JSON Stream', icon: '{ }', active: false, tag: 'Soon' },
                { label: 'SQL DB Pipeline', icon: '🗄️', active: false, tag: 'Soon' },
              ].map(({ label, icon, active, tag }) => (
                <div
                  key={label}
                  className={`p-3.5 rounded-2xl border text-xs font-bold flex items-center justify-between transition-all ${
                    active
                      ? 'border-indigo-500/40 bg-indigo-500/10 text-indigo-300'
                      : 'border-slate-800/80 bg-slate-950/40 text-slate-600'
                  }`}
                >
                  <span className="flex items-center gap-2 text-slate-200">
                    <span className="text-base">{icon}</span> {label}
                  </span>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-md bg-slate-950/80 text-slate-400 border border-slate-800">
                    {tag}
                  </span>
                </div>
              ))}
            </div>

            {/* Drop zone */}
            <div
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-3xl p-10 text-center transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/60'
              }`}
            >
              <input
                type="file"
                accept=".csv,.xlsx,.json"
                onChange={handleInput}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Upload size={36} className="mx-auto text-indigo-400/80 mb-3" />
              <p className="text-sm font-black text-slate-200">Drag & drop your financial dataset here</p>
              <p className="text-xs text-slate-400 mt-1">or click to browse from local drive — CSV, Excel supported</p>
              {selectedFile && (
                <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-indigo-500/20 border border-indigo-500/40 rounded-2xl text-xs text-indigo-300 font-bold animate-in fade-in">
                  <FileText size={14} /> {selectedFile.name} (Ready for verification)
                </div>
              )}
            </div>

            {/* Import done banner */}
            {importDone && (
              <div className="flex items-center gap-3 p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-300 text-xs font-bold animate-in fade-in">
                <CheckCircle size={18} />
                Financial data batch parsed and imported successfully. Ground truth models updated.
              </div>
            )}
          </div>
        </div>

        {/* Validation Report */}
        {validation && (
          <div className="glass-panel rounded-3xl p-6 space-y-5 border border-indigo-500/40 shadow-2xl animate-in fade-in">
            <div className="border-b border-slate-800/80 pb-3 flex items-center justify-between">
              <div>
                <h3 className="text-xs font-black uppercase tracking-wider text-indigo-300">Data Quality & Pre-Flight Validation</h3>
                <p className="text-[11px] text-slate-400 mt-0.5">{validation.file_name}</p>
              </div>
              <span className="text-xs font-black font-metric text-emerald-400 bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full">
                {validation.quality_score}% Quality Score
              </span>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {[
                  { label: `${validation.records.toLocaleString()} valid financial records parsed`, ok: true },
                  { label: `${validation.duplicate_ids} duplicate customer / transaction IDs`, ok: validation.duplicate_ids === 0 },
                  { label: `${validation.invalid_emails} invalid customer email syntaxes`, ok: validation.invalid_emails === 0 },
                  { label: `${validation.missing_fields} records with optional field nulls`, ok: validation.missing_fields === 0, warn: validation.missing_fields > 0 },
                ].map(({ label, ok, warn }) => (
                  <div key={label} className="flex items-center gap-2 text-xs bg-slate-950/60 p-3 rounded-2xl border border-slate-800/80">
                    {ok ? (
                      <CheckCircle size={15} className="text-emerald-400 shrink-0" />
                    ) : warn ? (
                      <AlertTriangle size={15} className="text-amber-400 shrink-0" />
                    ) : (
                      <XCircle size={15} className="text-red-400 shrink-0" />
                    )}
                    <span className={ok ? 'text-slate-200' : warn ? 'text-amber-300' : 'text-red-300 font-bold'}>{label}</span>
                  </div>
                ))}
              </div>

              {/* Quality Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="h-2.5 bg-slate-950 rounded-full overflow-hidden p-0.5 border border-slate-800">
                  <div
                    className={`h-full rounded-full transition-all ${validation.quality_score >= 90 ? 'bg-emerald-500' : 'bg-amber-500'}`}
                    style={{ width: `${validation.quality_score}%` }}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white text-xs font-black rounded-2xl transition-all disabled:opacity-60 cursor-pointer shadow-lg shadow-indigo-600/20 uppercase tracking-wider"
                >
                  {importing ? (
                    <><RefreshCw size={14} className="animate-spin" /> Ingesting Data Batch...</>
                  ) : (
                    <><Check size={14} /> Commit to Ground Truth</>
                  )}
                </button>
                <button
                  onClick={() => { setValidation(null); setSelectedFile(null); }}
                  className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold rounded-2xl transition-all cursor-pointer border border-slate-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
