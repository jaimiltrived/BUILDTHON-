import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useLedgerQuery, useUpdateLedgerStatusMutation } from '../../lib/queries';
import StatusPill from '../common/StatusPill';
import AuditTrail, { type AuditTrailStep } from '../common/AuditTrail';
import { BookOpen, Search, RotateCcw, Clock, Award, Check, X, Edit3, ChevronRight, Layers } from 'lucide-react';

interface DecisionLedgerPageProps {
  onSimulateAgain?: (val: number) => void;
}

export default function DecisionLedgerPage({ onSimulateAgain }: DecisionLedgerPageProps) {
  const { user } = useAuth();
  const isAuditor = user?.role === 'AUDITOR';

  const { data: ledger = [] } = useLedgerQuery(user?.organization_id || 'default');
  const { mutate: updateStatus } = useUpdateLedgerStatusMutation(user?.organization_id || 'default');

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>('DEC-1042');

  const filtered = ledger.filter((item: any) => {
    const matchesSearch =
      item.question?.toLowerCase().includes(search.toLowerCase()) ||
      item.proposed_action?.toLowerCase().includes(search.toLowerCase()) ||
      item.id?.toLowerCase().includes(search.toLowerCase());

    const matchesStatus =
      statusFilter === 'ALL' || item.status?.replace('_', ' ') === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedDecision = ledger.find((item: any) => item.id === selectedId) || ledger[0];

  const decisionTrailSteps: AuditTrailStep[] = selectedDecision
    ? [
        {
          step: 1,
          title: "Strategy Simulation Prompt",
          timestamp: selectedDecision.date || "2026-08-22",
          actor: "CFO / Finance Team",
          details: selectedDecision.question,
          evidence_tag: selectedDecision.proposed_action
        },
        {
          step: 2,
          title: "AI Risk-Adjusted Scoring & Evaluation",
          timestamp: selectedDecision.date || "2026-08-22",
          actor: "AI Finance Supervisor",
          details: selectedDecision.ai_recommendation,
          evidence_tag: `Confidence: ${selectedDecision.confidence}% · Risk: ${selectedDecision.risk}`
        },
        {
          step: 3,
          title: "Governance Sign-Off & Status",
          timestamp: selectedDecision.date || "2026-08-22",
          actor: "Executive Authority",
          details: `Current governance state: ${selectedDecision.status}. Expected Net Profit: ${selectedDecision.expected_profit}.`,
          evidence_tag: `Record ID: ${selectedDecision.id}`
        }
      ]
    : [];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#232E42] pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-[#E8A33D]/10 text-[#E8A33D] border border-[#E8A33D]/30">
              <BookOpen size={18} />
            </div>
            <h2 className="text-xl font-display font-bold text-[#E9EDF4] uppercase tracking-wide">
              CORPORATE DECISION GOVERNANCE LEDGER
            </h2>
            <span className="text-[10px] font-mono px-2.5 py-0.5 rounded bg-[#182234] text-[#3ADDA0] border border-[#3ADDA0]/30 font-bold">
              Cryptographically Tracked
            </span>
          </div>
          <p className="text-xs text-[#8C99AF] mt-1">
            Immutable audit trail of simulated scenarios, AI supervisor recommendations, and executive approvals
          </p>
        </div>

        {isAuditor && (
          <span className="text-xs font-mono font-bold text-[#E8A33D] bg-[#E8A33D]/10 border border-[#E8A33D]/30 px-3 py-1.5 rounded-lg flex items-center gap-1.5">
            <Layers size={13} /> Read-Only Compliance Mode Active
          </span>
        )}
      </div>

      {/* Search & Filter Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 ftm-card p-3 border border-[#232E42]">
        <div className="relative w-full sm:w-80">
          <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#5B6A82]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search decisions by ID, query, or action…"
            className="w-full bg-[#182234] border border-[#232E42] rounded-lg pl-9 pr-3 py-2 text-xs text-[#E9EDF4] outline-none focus:border-[#E8A33D] transition-all font-mono"
          />
        </div>

        <div className="flex flex-wrap gap-1.5 w-full sm:w-auto">
          {['ALL', 'APPROVED', 'AWAITING APPROVAL', 'REJECTED', 'MODIFIED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-[#E8A33D] text-[#0B0F17] shadow-sm shadow-[#E8A33D]/20'
                  : 'bg-[#182234] text-[#8C99AF] hover:text-[#E9EDF4] border border-[#232E42]'
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Grid: Decision List (6 cols) & Audit Detail Trail (6 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Decisions List (6 cols) */}
        <div className="lg:col-span-6 space-y-3">
          <div className="flex items-center justify-between pb-1">
            <h3 className="text-xs font-display font-bold uppercase tracking-wider text-[#E9EDF4]">
              Decision Records ({filtered.length})
            </h3>
            <span className="text-[10px] font-mono text-[#5B6A82]">Select to inspect governance trail</span>
          </div>

          <div className="space-y-2.5">
            {filtered.length === 0 ? (
              <div className="ftm-card p-8 text-center text-[#5B6A82] text-xs">
                No decisions found matching your filter criteria.
              </div>
            ) : (
              filtered.map((item: any) => {
                const isSelected = selectedId === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedId(item.id)}
                    className={`ftm-card p-4 space-y-3 cursor-pointer hover:border-[#2F3D57] transition-all ${
                      isSelected ? 'border-[#E8A33D] bg-[#E8A33D]/5' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-[#E8A33D] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#232E42]">
                          {item.id}
                        </span>
                        <span className="text-[11px] font-mono text-[#5B6A82] flex items-center gap-1">
                          <Clock size={11} /> {item.date}
                        </span>
                      </div>
                      <StatusPill status={item.status} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-[#E9EDF4]">{item.proposed_action}</p>
                      <p className="text-[11px] text-[#8C99AF] line-clamp-1 mt-0.5">{item.question}</p>
                    </div>

                    <div className="flex items-center justify-between pt-2 border-t border-[#232E42] text-[11px] font-mono">
                      <span className="text-[#8C99AF]">
                        Expected: <strong className="text-[#3ADDA0]">{item.expected_profit}</strong>
                      </span>
                      <span className="text-[#8C99AF]">
                        Risk: <strong className="text-[#E8A33D]">{item.risk}</strong>
                      </span>
                      <ChevronRight size={14} className="text-[#5B6A82]" />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Audit Trail & Sign-off Actions (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {selectedDecision ? (
            <div className="space-y-4">
              {/* Selected Summary Card */}
              <div className="ftm-card p-5 space-y-3 border border-[#232E42]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-[#E8A33D] bg-[#0B0F17] px-2 py-0.5 rounded border border-[#232E42]">
                      {selectedDecision.id}
                    </span>
                    <StatusPill status={selectedDecision.status} />
                  </div>
                  <span className="text-xs font-mono text-[#8C99AF]">
                    Confidence: <strong className="text-[#5B8DEF]">{selectedDecision.confidence}%</strong>
                  </span>
                </div>

                <div>
                  <h4 className="text-sm font-display font-bold text-[#E9EDF4]">
                    {selectedDecision.proposed_action}
                  </h4>
                  <p className="text-xs text-[#8C99AF] mt-1 leading-relaxed">
                    {selectedDecision.question}
                  </p>
                </div>

                <div className="p-3 ftm-card-nested border border-[#232E42] space-y-1">
                  <span className="text-[10px] font-mono font-bold uppercase text-[#E8A33D] flex items-center gap-1">
                    <Award size={12} /> AI Supervisor Verdict:
                  </span>
                  <p className="text-xs text-[#E9EDF4] leading-relaxed">
                    {selectedDecision.ai_recommendation}
                  </p>
                </div>

                {/* Governance Action Controls */}
                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#232E42]">
                  <button
                    disabled={isAuditor}
                    onClick={() => updateStatus({ id: selectedDecision.id, status: 'APPROVED' })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-all flex items-center gap-1.5 ${
                      isAuditor
                        ? 'bg-[#182234] text-[#5B6A82] border border-[#232E42] cursor-not-allowed opacity-60'
                        : 'bg-[#3ADDA0] hover:bg-[#3ADDA0]/90 text-[#0B0F17] cursor-pointer shadow-sm'
                    }`}
                  >
                    <Check size={13} /> {isAuditor ? 'Approve (Muted)' : 'Approve'}
                  </button>

                  <button
                    disabled={isAuditor}
                    onClick={() => updateStatus({ id: selectedDecision.id, status: 'REJECTED' })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-all flex items-center gap-1.5 ${
                      isAuditor
                        ? 'bg-[#182234] text-[#5B6A82] border border-[#232E42] cursor-not-allowed opacity-60'
                        : 'bg-[#F1584F] hover:bg-[#F1584F]/90 text-[#0B0F17] cursor-pointer shadow-sm'
                    }`}
                  >
                    <X size={13} /> {isAuditor ? 'Reject (Muted)' : 'Reject'}
                  </button>

                  <button
                    disabled={isAuditor}
                    onClick={() => updateStatus({ id: selectedDecision.id, status: 'MODIFIED' })}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-display font-bold uppercase transition-all flex items-center gap-1.5 ${
                      isAuditor
                        ? 'bg-[#182234] text-[#5B6A82] border border-[#232E42] cursor-not-allowed opacity-60'
                        : 'bg-[#5B8DEF] hover:bg-[#5B8DEF]/90 text-[#0B0F17] cursor-pointer shadow-sm'
                    }`}
                  >
                    <Edit3 size={13} /> {isAuditor ? 'Modify (Muted)' : 'Modify'}
                  </button>

                  {onSimulateAgain && (
                    <button
                      onClick={() => onSimulateAgain(10)}
                      className="px-3.5 py-1.5 rounded-lg bg-[#182234] hover:bg-[#232E42] text-[#E9EDF4] border border-[#232E42] text-xs font-display font-bold uppercase transition-all flex items-center gap-1.5 cursor-pointer ml-auto"
                    >
                      <RotateCcw size={13} /> Replay in Time Machine
                    </button>
                  )}
                </div>
              </div>

              {/* Connected-Dot Audit Trail */}
              <AuditTrail
                title={`Decision Lifecycle Audit Trail — ${selectedDecision.id}`}
                steps={decisionTrailSteps}
              />
            </div>
          ) : (
            <div className="ftm-card p-8 text-center text-[#5B6A82] text-xs">
              Select a decision to inspect the audit trail.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
