import { useState, useEffect } from 'react';
import { Search, Play, Scale, Activity, History, Database, Bot, BookOpen, ShieldAlert, HardDrive, Layers } from 'lucide-react';

interface Props {
  onNavigate: (tab: string) => void;
}

export default function CommandPalette({ onNavigate }: Props) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const commands = [
    { id: 'simulator', label: 'Run What If? Simulation', category: 'Simulation', icon: Play, shortcut: '⌘S' },
    { id: 'warroom', label: 'Open Decision War Room', category: 'Strategy', icon: Scale, shortcut: '⌘W' },
    { id: 'ledger', label: 'View Corporate Decision Ledger', category: 'Governance', icon: BookOpen, shortcut: '⌘L' },
    { id: 'dna', label: 'Explore Financial Causal DNA Graph', category: 'Models', icon: Activity, shortcut: '⌘D' },
    { id: 'risk', label: 'Open Enterprise Risk Center', category: 'Analytics', icon: ShieldAlert, shortcut: '⌘R' },
    { id: 'prediction', label: 'Prediction vs Reality Calibration', category: 'AI Learning', icon: History, shortcut: '⌘P' },
    { id: 'memory', label: 'Institutional Decision Memory', category: 'AI Learning', icon: Database, shortcut: '⌘M' },
    { id: 'chat', label: 'Consult AI Finance Copilot', category: 'AI Assistant', icon: Bot, shortcut: '⌘A' },
    { id: 'data', label: 'Data Center & Metrics Import', category: 'Data', icon: HardDrive, shortcut: '⌘I' },
    { id: 'audit', label: 'Auditor Compliance Dashboard', category: 'Governance', icon: Layers, shortcut: '⌘U' },
  ];

  const filtered = commands.filter((c) =>
    c.label.toLowerCase().includes(query.toLowerCase()) ||
    c.category.toLowerCase().includes(query.toLowerCase())
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md z-50 flex items-start justify-center pt-20 px-4 animate-in fade-in duration-150">
      <div className="glass-panel w-full max-w-2xl rounded-3xl shadow-2xl overflow-hidden border border-slate-700/70 animate-in zoom-in-95 duration-150 space-y-2">
        {/* Search Bar */}
        <div className="p-4.5 border-b border-slate-800/80 flex items-center gap-3">
          <Search className="text-indigo-400 shrink-0" size={20} />
          <input
            autoFocus
            type="text"
            placeholder="Type a command, metric, or jump to page..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-slate-100 outline-none text-sm placeholder-slate-500 font-medium"
          />
          <kbd className="px-2 py-1 bg-slate-950 border border-slate-800 text-[10px] text-slate-400 rounded-lg font-mono">
            ESC
          </kbd>
        </div>

        {/* Command Items */}
        <div className="p-3 max-h-96 overflow-y-auto space-y-1.5">
          {filtered.length === 0 ? (
            <p className="p-6 text-center text-xs text-slate-500">No matching decision tools found.</p>
          ) : (
            filtered.map((c) => {
              const Icon = c.icon;
              return (
                <button
                  key={c.id}
                  onClick={() => {
                    onNavigate(c.id);
                    setOpen(false);
                    setQuery('');
                  }}
                  className="w-full flex items-center justify-between p-3 rounded-2xl hover:bg-slate-800/60 text-slate-200 text-left transition-all group cursor-pointer border border-transparent hover:border-indigo-500/30"
                >
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-xl bg-slate-950/80 border border-slate-800 text-indigo-400 group-hover:text-indigo-300 group-hover:border-indigo-500/40 transition-colors">
                      <Icon size={16} />
                    </div>
                    <div>
                      <span className="text-xs font-bold text-slate-100 block">{c.label}</span>
                      <span className="text-[10px] text-slate-500 font-medium">{c.category}</span>
                    </div>
                  </div>
                  <kbd className="text-[10px] bg-slate-950 border border-slate-800 px-2 py-0.5 rounded-lg text-slate-400 font-mono group-hover:border-slate-700">
                    {c.shortcut}
                  </kbd>
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
