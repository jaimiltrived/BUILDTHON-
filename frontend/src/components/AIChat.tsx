import { useState, useRef, useEffect } from 'react';
import { apiClient } from '../lib/apiClient';
import {
  Send, Bot, User, Sparkles, Shield, Check, Copy,
  Upload, Trash2, FileText, Lock, Loader2
} from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  source?: string;
  timestamp: string;
}

interface DocumentInfo {
  id: string;
  filename: string;
  char_count: number;
  created_at: string;
}

export default function AIChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome-1',
      sender: 'ai',
      text: "👋 **Hello! I am your AI Financial Copilot.**\n\nI operate locally using your Llama 3 engine. I am now grounded in your live Nova Commerce dataset and the **Sovereign RAG Memory** on the right.\n\nAsk me about scenarios, churn risks, price elasticities, or upload files on the right to ground my responses in custom enterprise data!",
      source: "Supervisor Agent (Local Llama 3 Engine)",
      timestamp: 'Just now'
    }
  ]);
  
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  // RAG State
  const [documents, setDocuments] = useState<DocumentInfo[]>([]);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const res = await apiClient.get<DocumentInfo[]>('/api/documents/');
      setDocuments(res);
    } catch (e) {
      console.error("Error fetching documents:", e);
    }
  };

  const handleUploadFile = async (file: File) => {
    if (!file) return;
    setUploadingDoc(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      await apiClient.post<any>('/api/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      await fetchDocuments();
      // Notify chat that document was indexed
      const infoMsg: ChatMessage = {
        id: `ai-info-${Date.now()}`,
        sender: 'ai',
        text: `📊 **System Grounding Update:**\nSuccessfully ingested, chunked, and indexed \`${file.name}\` into local RAG memory. I can now reference its contents in our conversation.`,
        source: "Document Processing Pipeline",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, infoMsg]);
    } catch (e: any) {
      console.error("Failed to upload file:", e);
      const errorMsg = e.response?.data?.detail || "Make sure file size is reasonable and type is supported.";
      alert(`Failed to upload file: ${errorMsg}`);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = async (id: string, filename: string) => {
    try {
      await apiClient.delete<any>(`/api/documents/${id}`);
      await fetchDocuments();
      const infoMsg: ChatMessage = {
        id: `ai-info-${Date.now()}`,
        sender: 'ai',
        text: `🗑️ **System Grounding Update:**\nRemoved document \`${filename}\` from local indexing memory.`,
        source: "Document Processing Pipeline",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, infoMsg]);
    } catch (e) {
      console.error("Failed to delete document:", e);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) handleUploadFile(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleUploadFile(file);
  };

  const triggerQuery = async (queryText: string) => {
    if (!queryText.trim() || loading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const res = await apiClient.post<any>('/api/ai/chat', { message: queryText });
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: res.reply,
        source: res.source || (res.source_agents ? res.source_agents.join(' • ') : 'Llama 3 Multi-Agent Supervisor'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      console.error("AI Chat Error", err);
      const errMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sender: 'ai',
        text: "⚠️ **Live AI Assistant Notification:**\n\nUnable to reach local Llama 3 inference node. Please ensure Ollama is running on localhost:11434.",
        source: "System Error Handler",
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;
    const q = input;
    setInput('');
    triggerQuery(q);
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl mx-auto items-stretch">
      
      {/* Left Column: Chat Container */}
      <div className="lg:col-span-8 flex flex-col">
        <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col h-[750px] border border-slate-800/90 relative">
          
          {/* Chat Header */}
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4 mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                <Bot size={20} />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-base font-black text-slate-100 uppercase tracking-wide">
                    AI Financial Copilot
                  </h2>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono font-bold">
                    Llama 3 Active
                  </span>
                </div>
                <p className="text-xs text-slate-400">
                  Natural-language reasoning twin with secure local vector database grounding.
                </p>
              </div>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800 font-mono">
              <Shield size={13} className="text-emerald-400" />
              <span>Sovereign Local-First</span>
            </div>
          </div>

          {/* Message Stream */}
          <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-3 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.sender === 'ai' && (
                  <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 mt-1">
                    <Sparkles size={14} />
                  </div>
                )}

                <div
                  className={`max-w-[85%] rounded-3xl p-4.5 space-y-2 text-xs relative group transition-all ${
                    msg.sender === 'user'
                      ? 'bg-indigo-600 text-white rounded-tr-sm shadow-md shadow-indigo-600/20'
                      : 'glass-card border-slate-800 text-slate-200 rounded-tl-sm shadow-lg'
                  }`}
                >
                  <div className="flex items-center justify-between gap-4 border-b border-slate-800/40 pb-1.5 text-[10px] font-mono text-slate-400">
                    <span className="font-bold text-indigo-300">
                      {msg.source || (msg.sender === 'user' ? 'You' : 'AI Copilot')}
                    </span>
                    <div className="flex items-center gap-2">
                      <span>{msg.timestamp}</span>
                      <button
                        onClick={() => copyMessage(msg.id, msg.text)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity hover:text-slate-200 cursor-pointer"
                      >
                        {copiedId === msg.id ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                  <div className="whitespace-pre-wrap leading-relaxed space-y-2 font-medium">
                    {msg.text}
                  </div>
                </div>

                {msg.sender === 'user' && (
                  <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 text-slate-300 flex items-center justify-center shrink-0 mt-1 font-bold text-xs">
                    <User size={14} />
                  </div>
                )}
              </div>
            ))}

            {loading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 animate-pulse">
                  <Sparkles size={14} />
                </div>
                <div className="glass-card rounded-3xl p-4 text-xs text-slate-400 flex items-center gap-2 border-slate-800">
                  <div className="w-2 h-2 rounded-full bg-indigo-500 animate-ping" />
                  <span>AI Supervisor reasoning & searching grounding indexes...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Suggested Prompts */}
          <div className="pt-3 border-t border-slate-800/80 mt-2">
            <p className="text-[10px] uppercase font-bold text-slate-500 mb-2 tracking-wider">Suggested Inquiries</p>
            <div className="flex flex-wrap gap-2">
              {[
                "What happens if we increase prices by 10%?",
                "Which customer segment has the highest churn elasticity?",
                "Are there budget constraints or milestones in uploaded reports?",
                "Assess pricing risks against indexed context"
              ].map((promptText) => (
                <button
                  key={promptText}
                  onClick={() => triggerQuery(promptText)}
                  disabled={loading}
                  className="text-[11px] bg-slate-950/80 hover:bg-indigo-950/40 text-slate-300 hover:text-indigo-200 border border-slate-800 hover:border-indigo-500/30 px-3 py-1.5 rounded-xl transition-all text-left font-medium cursor-pointer disabled:opacity-50"
                >
                  💡 {promptText}
                </button>
              ))}
            </div>
          </div>

          {/* Input Form */}
          <form onSubmit={handleFormSubmit} className="mt-3 flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about financial forecasts, risk scenarios, customer elasticity..."
              disabled={loading}
              className="flex-1 bg-slate-950/90 border border-slate-800 rounded-2xl px-4 py-3 text-xs text-slate-100 outline-none focus:border-indigo-500 transition-all font-medium placeholder:text-slate-600 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="px-5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Send size={15} />
            </button>
          </form>
        </div>
      </div>

      {/* Right Column: RAG Management */}
      <div className="lg:col-span-4 flex flex-col">
        <div className="glass-panel rounded-3xl p-6 shadow-2xl flex flex-col h-[750px] border border-slate-800/90">
          
          {/* Header */}
          <div className="border-b border-slate-800/80 pb-4 mb-4">
            <h3 className="text-sm font-black text-slate-100 uppercase tracking-wide flex items-center gap-2.5">
              <FileText size={18} className="text-indigo-400" />
              Sovereign RAG Memory
            </h3>
            <p className="text-[11px] text-slate-400 mt-1">
              Upload custom documents to contextually ground the LLaMA 3 model locally.
            </p>
          </div>

          {/* Active Status Info */}
          <div className="mb-4 bg-indigo-500/5 border border-indigo-500/20 rounded-2xl p-3.5 space-y-2">
            <div className="flex justify-between items-center text-xs font-bold text-slate-200">
              <span className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${documents.length > 0 ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
                Index Grounding
              </span>
              <span className="text-[10px] font-mono text-indigo-300">
                {documents.length} File{documents.length !== 1 ? 's' : ''} Active
              </span>
            </div>
            <p className="text-[10px] text-slate-400 leading-normal">
              When documents are active, the supervisor automatically performs paragraph lookup on your queries and appends matching grounding chunks.
            </p>
          </div>

          {/* Documents list */}
          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 custom-scrollbar">
            {documents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-48 text-center p-4 border border-dashed border-slate-800/80 rounded-2xl">
                <Upload size={24} className="text-slate-600 mb-2" />
                <p className="text-xs font-bold text-slate-400">RAG Index Empty</p>
                <p className="text-[10px] text-slate-500 mt-1">Grounding will fall back to baseline database stats only.</p>
              </div>
            ) : (
              documents.map((doc) => (
                <div
                  key={doc.id}
                  className="p-3 bg-slate-950/60 border border-slate-800 hover:border-indigo-500/30 rounded-2xl transition-all flex items-center justify-between gap-3 group animate-in fade-in"
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <FileText size={16} className="text-indigo-400 shrink-0" />
                    <div className="overflow-hidden">
                      <p className="text-xs font-bold text-slate-200 truncate" title={doc.filename}>
                        {doc.filename}
                      </p>
                      <p className="text-[10px] text-slate-500 font-mono mt-0.5">
                        {(doc.char_count / 1024).toFixed(1)} KB • {new Date(doc.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  
                  <button
                    onClick={() => handleDeleteDoc(doc.id, doc.filename)}
                    title="Remove from index"
                    className="p-1.5 bg-slate-900 hover:bg-red-500/10 hover:text-red-400 text-slate-500 border border-slate-800 hover:border-red-500/30 rounded-xl transition-all cursor-pointer"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Upload Drop Zone */}
          <div className="mt-4 pt-4 border-t border-slate-800/80">
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                dragOver
                  ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
                  : 'border-slate-800 hover:border-slate-700 bg-slate-950/40'
              }`}
            >
              <input
                type="file"
                ref={fileInputRef}
                accept=".txt,.csv,.json,.pdf"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              {uploadingDoc ? (
                <div className="space-y-2 py-2">
                  <Loader2 className="mx-auto text-indigo-400 animate-spin" size={24} />
                  <p className="text-xs font-bold text-slate-300">Ingesting Document...</p>
                  <p className="text-[10px] text-slate-500 font-mono">Parsing formatting and building index keys</p>
                </div>
              ) : (
                <div className="space-y-1 py-1">
                  <Upload size={20} className="mx-auto text-indigo-400/80 mb-1" />
                  <p className="text-xs font-bold text-slate-200">Ground New Reference</p>
                  <p className="text-[10px] text-slate-500">PDF, TXT, CSV, JSON supported</p>
                </div>
              )}
            </div>
            
            <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono mt-3 justify-center">
              <Lock size={10} className="text-emerald-500" />
              <span>100% LOCAL PROCESSING & IN-MEMORY SEARCH</span>
            </div>
          </div>

        </div>
      </div>

    </div>
  );
}
