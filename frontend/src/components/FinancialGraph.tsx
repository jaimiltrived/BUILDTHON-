import { useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Network } from 'lucide-react';

const initialNodes = [
  { 
    id: '1', 
    position: { x: 280, y: 20 }, 
    data: { label: '⚡ Strategic Price Lever' }, 
    style: { background: '#1e1b4b', color: '#818cf8', border: '2px solid #6366f1', borderRadius: '16px', fontWeight: 800, padding: '12px 18px', fontSize: '13px' } 
  },
  { 
    id: '2', 
    position: { x: 80, y: 140 }, 
    data: { label: '📉 Conversion Rate (-0.5 Elasticity)' }, 
    style: { background: '#1e293b', color: '#f87171', border: '1px solid #ef4444', borderRadius: '14px', fontWeight: 700, padding: '10px 16px', fontSize: '12px' } 
  },
  { 
    id: '3', 
    position: { x: 460, y: 140 }, 
    data: { label: '📈 Gross Margin Ratio' }, 
    style: { background: '#064e3b', color: '#34d399', border: '1px solid #10b981', borderRadius: '14px', fontWeight: 700, padding: '10px 16px', fontSize: '12px' } 
  },
  { 
    id: '4', 
    position: { x: 80, y: 260 }, 
    data: { label: '📦 Order Volume' }, 
    style: { background: '#0f172a', color: '#94a3b8', border: '1px solid #475569', borderRadius: '14px', fontWeight: 700, padding: '10px 16px', fontSize: '12px' } 
  },
  { 
    id: '5', 
    position: { x: 280, y: 360 }, 
    data: { label: '💰 Top-Line Revenue' }, 
    style: { background: '#022c22', color: '#6ee7b7', border: '2px solid #059669', borderRadius: '16px', fontWeight: 800, padding: '12px 20px', fontSize: '13px' } 
  },
  { 
    id: '6', 
    position: { x: 280, y: 480 }, 
    data: { label: '🏆 Net Operating Profit' }, 
    style: { background: '#312e81', color: '#c7d2fe', border: '2px solid #4f46e5', borderRadius: '18px', fontWeight: 900, padding: '14px 24px', fontSize: '14px', boxShadow: '0 0 20px rgba(99, 102, 241, 0.4)' } 
  },
];

const initialEdges = [
  { id: 'e1-2', source: '1', target: '2', label: 'Elasticity Impact (-)', animated: true, style: { stroke: '#ef4444', strokeWidth: 2 } },
  { id: 'e1-3', source: '1', target: '3', label: 'Direct Margin Expansion (+)', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e2-4', source: '2', target: '4', label: 'Order Flow (+)', animated: true, style: { stroke: '#64748b', strokeWidth: 2 } },
  { id: 'e4-5', source: '4', target: '5', label: 'Volume Multiplier (+)', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e3-6', source: '3', target: '6', label: 'Margin Flow (+)', animated: true, style: { stroke: '#10b981', strokeWidth: 2 } },
  { id: 'e5-6', source: '5', target: '6', label: 'Cash Conversion (+)', animated: true, style: { stroke: '#6366f1', strokeWidth: 2 } },
];

export default function FinancialGraph() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  const onConnect = useCallback(
    (params: any) => setEdges((eds) => addEdge(params, eds)),
    [setEdges],
  );

  return (
    <div className="glass-panel rounded-3xl p-6 lg:p-8 space-y-5 shadow-2xl">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Network size={18} />
            </div>
            <h2 className="text-lg font-black text-slate-100 tracking-wide">
              FINANCIAL CAUSAL DNA GRAPH
            </h2>
            <span className="text-[10px] px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/30 font-mono font-bold">
              DAG Deterministic Model
            </span>
          </div>
          <p className="text-slate-400 text-xs mt-1">
            Interactive visual graph of upstream strategic decisions and downstream financial causal linkages.
          </p>
        </div>

        <div className="flex items-center gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-emerald-400"><span className="w-2 h-2 rounded-full bg-emerald-400" /> Positive Lever</span>
          <span className="flex items-center gap-1.5 text-red-400"><span className="w-2 h-2 rounded-full bg-red-400" /> Negative Elasticity</span>
        </div>
      </div>

      <div style={{ width: '100%', height: '560px' }} className="bg-slate-950/90 rounded-2xl border border-slate-800/90 overflow-hidden shadow-inner">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
        >
          <Controls className="bg-slate-900 border-slate-800 fill-slate-300" />
          <MiniMap 
            nodeStrokeColor={(n) => {
              if (n.style?.background) return n.style.background as string;
              return '#6366f1';
            }} 
            nodeColor={(n) => {
              if (n.style?.background) return n.style.background as string;
              return '#1e293b';
            }} 
            className="bg-slate-900/90 border border-slate-800 rounded-xl"
          />
          <Background gap={16} size={1} color="#1e293b" />
        </ReactFlow>
      </div>
    </div>
  );
}
