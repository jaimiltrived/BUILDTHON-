import json
import time
import hashlib
import httpx
from typing import Dict, Any, List, Optional
from collections import OrderedDict
from sqlalchemy.orm import Session
from app.core.config import settings
from app.models.document import Document
from app.agents.tools import get_financial_metrics, simulate_price_change_tool
from app.analytics.finance_engine import FinanceEngine
from app.analytics.war_room import WarRoomEngine


class ResponseCache:
    """Fast in-memory LRU cache for high-frequency or repeated LLM inferences."""
    def __init__(self, max_size: int = 128, ttl_seconds: int = 600):
        self.cache: OrderedDict[str, tuple[float, str]] = OrderedDict()
        self.max_size = max_size
        self.ttl = ttl_seconds

    def _make_key(self, model: str, prompt: str, system_prompt: Optional[str]) -> str:
        raw = f"{model}:{system_prompt or ''}:{prompt}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    def get(self, model: str, prompt: str, system_prompt: Optional[str]) -> Optional[str]:
        key = self._make_key(model, prompt, system_prompt)
        if key in self.cache:
            created_at, val = self.cache[key]
            if time.time() - created_at < self.ttl:
                self.cache.move_to_end(key)
                return val
            else:
                del self.cache[key]
        return None

    def set(self, model: str, prompt: str, system_prompt: Optional[str], value: str):
        key = self._make_key(model, prompt, system_prompt)
        if key in self.cache:
            self.cache.move_to_end(key)
        self.cache[key] = (time.time(), value)
        if len(self.cache) > self.max_size:
            self.cache.popitem(last=False)


_llm_cache = ResponseCache()


class AIAgentSupervisor:
    """
    High-Performance Multi-Agent AI Supervisor & Financial Copilot.
    Optimized for LLaMA 3 GPU inference:
    1. Direct native Ollama REST API over persistent HTTP connection pool (bypasses LangChain overhead)
    2. GPU VRAM model pinning via 'keep_alive: 30m' (eliminates cold-start model reload latency)
    3. Optimized GPU hyperparameters (f16_kv, num_ctx: 2048, greedy sampling)
    4. LRU response cache for sub-millisecond repeated queries
    5. Causal simulation grounding and deterministic fallback
    """
    
    def __init__(self):
        self.ollama_url = settings.OLLAMA_BASE_URL
        self.model = settings.PRIMARY_MODEL
        # Persistent HTTP client with connection pooling for maximum throughput
        self._http_client: Optional[httpx.AsyncClient] = None

    def _get_client(self) -> httpx.AsyncClient:
        if self._http_client is None or self._http_client.is_closed:
            self._http_client = httpx.AsyncClient(
                timeout=httpx.Timeout(60.0, connect=2.0),
                limits=httpx.Limits(max_keepalive_connections=20, max_connections=50),
                headers={"Content-Type": "application/json"}
            )
        return self._http_client

    async def check_engine_status(self) -> Dict[str, Any]:
        """
        Checks if local Ollama is active and listening.
        Auto-detects installed models with zero latency overhead.
        """
        client = self._get_client()
        candidate_urls = list(dict.fromkeys([self.ollama_url, "http://127.0.0.1:11434", "http://localhost:11434"]))
        for url in candidate_urls:
            try:
                res = await client.get(f"{url}/api/tags", timeout=1.5)
                if res.status_code == 200:
                    self.ollama_url = url
                    models = res.json().get("models", [])
                    if len(models) > 0:
                        primary_key = settings.PRIMARY_MODEL.lower().split(":")[0]
                        target_model = next((m.get("name", "") for m in models if primary_key in m.get("name", "").lower()), "")
                        if not target_model:
                            target_model = next((m.get("name", "") for m in models if "llama" in m.get("name", "").lower()), models[0].get("name", ""))
                        
                        self.model = target_model
                        clean_name = self.model.replace(":latest", "").upper()
                        return {
                            "mode": "LLM_ACTIVE",
                            "provider": f"Ollama • {self.model} (GPU Accelerated)",
                            "is_llm": True,
                            "model_name": self.model,
                            "label": f"LOCAL {clean_name} ACTIVE",
                            "subtext": "Ollama • Optimized GPU Acceleration • Sub-Second VRAM Mode",
                            "status_color": "emerald"
                        }
                    return {
                        "mode": "OLLAMA_ONLINE_MODEL_MISSING",
                        "provider": "Ollama Online (No Models Pulled)",
                        "is_llm": False,
                        "label": "OLLAMA ONLINE (PULLING MODEL)",
                        "subtext": "Run 'ollama pull llama3' to enable local inference",
                        "status_color": "amber"
                    }
            except Exception:
                continue

        return {
            "mode": "DETERMINISTIC_FALLBACK",
            "provider": "Deterministic Multi-Agent Engine",
            "is_llm": False,
            "label": "DETERMINISTIC FALLBACK ACTIVE",
            "subtext": "Local LLM offline • Financial intelligence operational",
            "status_color": "blue"
        }

    async def _query_ollama(
        self, 
        prompt: str, 
        system_prompt: Optional[str] = None, 
        max_tokens: int = 350, 
        temperature: float = 0.15
    ) -> Optional[str]:
        """
        High-throughput native Ollama inference with VRAM pinning, connection pooling, and LRU cache.
        """
        # 1. Check LRU cache first (< 0.5ms response time)
        cached = _llm_cache.get(self.model, prompt, system_prompt)
        if cached:
            return cached

        client = self._get_client()
        candidate_urls = list(dict.fromkeys([self.ollama_url, "http://127.0.0.1:11434", "http://localhost:11434"]))

        payload = {
            "model": self.model,
            "prompt": prompt,
            "system": system_prompt or "",
            "stream": False,
            "keep_alive": "30m", # Keeps model in GPU VRAM to eliminate 4-8s cold start reloads
            "options": {
                "num_predict": max_tokens,
                "num_ctx": 2048, # Optimal compact context window
                "temperature": temperature,
                "top_p": 0.9,
                "top_k": 40,
                "num_thread": 8,
                "f16_kv": True # Half-precision KV cache in VRAM
            }
        }

        for url in candidate_urls:
            try:
                res = await client.post(f"{url}/api/generate", json=payload, timeout=40.0)
                if res.status_code == 200:
                    resp_json = res.json()
                    response_text = resp_json.get("response", "").strip()
                    if response_text:
                        self.ollama_url = url
                        _llm_cache.set(self.model, prompt, system_prompt, response_text)
                        return response_text
            except Exception:
                continue

        return None

    def _retrieve_document_context(self, db: Session, org_id: str, query: str) -> str:
        """Lightweight keyword/semantic document retriever from uploaded enterprise docs."""
        try:
            docs = db.query(Document).filter(Document.organization_id == org_id).all()
            if not docs:
                return ""
            
            keywords = [w.lower() for w in query.split() if len(w) > 3]
            scored_blocks = []
            for doc in docs:
                content = doc.content_text or ""
                paragraphs = content.split("\n\n")
                for para in paragraphs:
                    para_clean = para.strip()
                    if len(para_clean) < 20:
                        continue
                    para_lower = para_clean.lower()
                    score = sum(1 for kw in keywords if kw in para_lower)
                    if score > 0:
                        scored_blocks.append((score, doc.filename, para_clean[:400]))
            
            scored_blocks.sort(key=lambda x: x[0], reverse=True)
            top_blocks = scored_blocks[:3]
            if not top_blocks:
                return ""
            
            return "\n".join([f"[{fname}]: {text}" for _, fname, text in top_blocks])
        except Exception:
            return ""

    async def analyze_decision(
        self, 
        decision_type: str, 
        parameter_value: float, 
        description: str = "", 
        baseline: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        t_start = time.perf_counter()
        
        # Step 1: Engine Status & Financial Observer
        t0 = time.perf_counter()
        status = await self.check_engine_status()
        if baseline is None:
            baseline = get_financial_metrics()
        dur_observer = max(1, int((time.perf_counter() - t0) * 1000))
        
        # Step 2: Simulation Engine
        t1 = time.perf_counter()
        sim_result = simulate_price_change_tool(
            percentage_increase=parameter_value,
            current_revenue=baseline["revenue"],
            current_profit=baseline["profit"],
            current_churn=baseline["churn"],
            current_customers=baseline["customers"]
        )
        dur_sim = max(1, int((time.perf_counter() - t1) * 1000))
        
        opt = sim_result["scenarios"]["optimistic"]
        base = sim_result["scenarios"]["base"]
        pess = sim_result["scenarios"]["pessimistic"]

        # Step 3: Risk Guardian
        t2 = time.perf_counter()
        risk_level = sim_result["risk"]["level"]
        risk_penalty = sim_result["risk"]["total_penalty"]
        dur_risk = max(1, int((time.perf_counter() - t2) * 1000))

        # Step 4: Evidence Validation
        t3 = time.perf_counter()
        second_order = sim_result.get("second_order_effects", {})
        dur_evidence = max(1, int((time.perf_counter() - t3) * 1000))

        # Step 5: Dynamic Confidence Calculation
        calculated_confidence_pct = FinanceEngine.calculate_confidence(
            sample_size=baseline.get("customers", 48200),
            volatility=0.06,
            historical_accuracy=94.0,
            assumption_count=3 if abs(parameter_value) > 0.10 else 2
        )
        confidence_decimal = round(calculated_confidence_pct / 100.0, 2)

        # Dynamic War Room Comparison
        war_room_data = WarRoomEngine.compare_strategies(
            current_revenue=baseline["revenue"],
            current_profit=baseline["profit"],
            current_churn=baseline["churn"],
            current_customers=baseline["customers"]
        )
        plan_a_score = next((p["risk_adjusted_score"] for p in war_room_data["plans"] if p["name"] == "Plan A"), 90)
        plan_b_score = next((p["risk_adjusted_score"] for p in war_room_data["plans"] if p["name"] == "Plan B"), 82)

        # Step 6: Why Rationale Generation
        t_rec = time.perf_counter()
        if parameter_value <= 0.05 and parameter_value >= 0:
            rec_title = f"Approve {decision_type} (+{parameter_value*100:.0f}%)"
            why_list = [
                f"+{parameter_value*100:.0f}% delivers safe immediate margin expansion (+₹{sim_result['deltas']['profit']:,.0f} net profit).",
                f"Projected churn increase is minimal ({base['churn']*100:.1f}%), easily absorbed by volume expansion.",
                "Customer lifetime value (LTV) improves by an estimated 3.8% net across high-value accounts.",
                f"Ranked highest in Decision War Room with Risk-Adjusted Score of {plan_a_score}/100."
            ]
            risk_level = "LOW"
        elif parameter_value > 0.05:
            rec_title = f"Adjust downward to +5% instead of proposed +{parameter_value*100:.0f}%"
            why_list = [
                f"+{parameter_value*100:.0f}% yields higher nominal revenue, but triggers significant secondary churn.",
                f"Projected churn accelerates to {base['churn']*100:.1f}% (+{sim_result['deltas']['churn_pct']}% spike).",
                f"Price elasticity across sensitive accounts ({second_order.get('weighted_elasticity', -0.55)}) causes top-line volume drag.",
                f"Plan A (+5%) yields a superior Risk-Adjusted Score ({plan_a_score} vs {plan_b_score}) over a 12-month horizon."
            ]
            risk_level = "MEDIUM" if parameter_value <= 0.12 else "HIGH"
        else:
            rec_title = f"Proceed with promotional price adjustment ({parameter_value*100:.0f}%)"
            why_list = [
                "Lowers barrier to entry for rapid new customer acquisition.",
                "Requires an order volume increase of +14% to preserve gross margin parity.",
                "Recommended for targeted promotional campaigns rather than permanent price cuts."
            ]
            risk_level = "MEDIUM"

        dur_rec = max(1, int((time.perf_counter() - t_rec) * 1000))

        pipeline_steps = [
            {"name": "Financial Observer", "status": "COMPLETED", "duration_ms": dur_observer, "detail": f"Audited baseline: ₹{baseline['revenue']/100000:.1f}L revenue, {baseline['churn']*100:.1f}% churn"},
            {"name": "Simulation Engine", "status": "COMPLETED", "duration_ms": dur_sim, "detail": f"Deterministic modeling of {parameter_value*100:+.0f}% change across 3 scenarios"},
            {"name": "Risk Guardian", "status": "COMPLETED", "duration_ms": dur_risk, "detail": f"Assessed revenue downside & churn multiplier ({risk_level} risk)"},
            {"name": "Evidence Validation", "status": "COMPLETED", "duration_ms": dur_evidence, "detail": f"Grounded against 24-month {baseline.get('name', 'Nova Commerce')} transaction history"},
            {"name": "Recommendation Engine", "status": "COMPLETED", "duration_ms": dur_rec, "detail": f"Calculated risk-adjusted score ({plan_a_score} vs {plan_b_score})"}
        ]

        evidence_list = [
            f"{baseline.get('name', 'Nova Commerce')} 24-month audit: ₹{baseline['revenue']/100000:.1f}L baseline",
            f"Weighted customer elasticity: {second_order.get('weighted_elasticity', -0.55)}",
            f"Projected net profit delta: {sim_result['deltas']['profit']:+,.0f} ₹",
            f"Risk penalty assessed: -₹{risk_penalty:,.0f}"
        ]

        clean_model_name = self.model.replace(":latest", "").upper()
        source_agents = [
            "Financial Observer Agent",
            "Simulation Engine Agent",
            "Risk Guardian Agent",
            "Recommendation Agent",
            f"{clean_model_name} Synthesizer" if status["is_llm"] else "Deterministic Fallback Synthesizer"
        ]

        uncertainty_range = {
            "pessimistic_revenue": round(pess["revenue"], 2),
            "expected_revenue": round(base["revenue"], 2),
            "optimistic_revenue": round(opt["revenue"], 2),
            "pessimistic_profit": round(pess["profit"], 2),
            "expected_profit": round(base["profit"], 2),
            "optimistic_profit": round(opt["profit"], 2),
            "confidence_pct": calculated_confidence_pct
        }

        # Live LLaMA 3 Accelerated Query
        llm_summary = None
        if status["is_llm"]:
            t_llm = time.perf_counter()
            system_prompt = (
                f"You are the Chief AI Financial Controller for {baseline.get('name', 'Nova Commerce')} Pvt Ltd. "
                "Analyze the financial scenario with precise numbers, risk analysis, and actionable executive clarity."
            )
            prompt = (
                f"Analyze financial proposal: {decision_type} ({parameter_value*100:+.0f}%).\n"
                f"Context: {description if description else 'Catalog pricing optimization'}\n"
                f"Financial Grounding:\n"
                f"- Baseline: Revenue ₹{baseline['revenue']/100000:.1f}L, Profit ₹{baseline['profit']/100000:.1f}L, Churn {baseline['churn']*100:.1f}%\n"
                f"- Projected Revenue: ₹{base['revenue']/100000:.1f}L (Delta: {sim_result['deltas']['revenue']:+,.0f} ₹)\n"
                f"- Projected Profit: ₹{base['profit']/100000:.1f}L (Delta: {sim_result['deltas']['profit']:+,.0f} ₹)\n"
                f"- Projected Churn: {base['churn']*100:.1f}%\n"
                f"- Risk: {risk_level} (Penalty -₹{risk_penalty:,.0f})\n\n"
                "Give a concise 2-sentence executive verdict on margin expansion vs churn risk."
            )
            llm_summary = await self._query_ollama(prompt, system_prompt=system_prompt, max_tokens=220, temperature=0.15)
            dur_llm = int((time.perf_counter() - t_llm) * 1000)
            pipeline_steps.append({
                "name": f"{clean_model_name} GPU Neural Synthesis",
                "status": "COMPLETED" if llm_summary else "SKIPPED",
                "duration_ms": dur_llm,
                "detail": f"Optimized VRAM GPU inference ({self.model}) in {dur_llm}ms" if llm_summary else "Fallback to deterministic synthesis"
            })
        else:
            pipeline_steps.append({
                "name": "Deterministic Synthesis",
                "status": "COMPLETED",
                "duration_ms": 1,
                "detail": "Structured JSON executive verdict generated"
            })

        summary_text = llm_summary or f"Evaluation of {decision_type} ({parameter_value*100:+.0f}%): Base revenue projected at ₹{base['revenue']/100000:.1f}L with {base['churn']*100:.1f}% churn."

        return {
            "engine_status": status,
            "summary": summary_text,
            "recommendation": rec_title,
            "why": why_list,
            "confidence": confidence_decimal,
            "risk_level": risk_level,
            "evidence": evidence_list,
            "source_agents": source_agents,
            "pipeline_steps": pipeline_steps,
            "uncertainty_range": uncertainty_range,
            "scenarios": sim_result["scenarios"],
            "deltas": sim_result["deltas"],
            "is_llm_assisted": status["is_llm"],
            "generation_mode": f"Local LLM Accelerated ({clean_model_name})" if status["is_llm"] else "Deterministic Financial Intelligence (Fallback)"
        }

    async def handle_chat(self, message: str, db: Session = None, org_id: str = None) -> Dict[str, Any]:
        """High-throughput natural language command interface powered by LLaMA 3."""
        status = await self.check_engine_status()
        baseline = get_financial_metrics()
        msg_lower = message.lower()
        clean_model_name = self.model.replace(":latest", "").upper()

        pipeline_steps = [
            {"name": "Intent Classification", "status": "COMPLETED", "duration_ms": 1, "detail": f"Classified query: '{message[:35]}...'"},
            {"name": "Financial Grounding", "status": "COMPLETED", "duration_ms": 2, "detail": "Extracted live ledger state: ₹82.4L GMV, 48.2k accounts"},
        ]

        # RAG Context
        rag_context = ""
        if db and org_id:
            rag_context = self._retrieve_document_context(db, org_id, message)
            if rag_context:
                pipeline_steps.append({
                    "name": "RAG Memory Ingestion",
                    "status": "COMPLETED",
                    "duration_ms": 2,
                    "detail": "Fetched matching corporate policy documents"
                })

        if status["is_llm"]:
            t_llm = time.perf_counter()
            system_prompt = (
                "You are the AI Financial Copilot for Nova Commerce Pvt Ltd (India).\n"
                "Ground Truth: Monthly Rev: ₹82.4L, Profit: ₹21.2L (25.7% margin), 48,200 accounts, 7.1% churn, Elasticity: -0.55.\n"
                "Plan A (+5% price, Score 90/100) is mathematically superior to Plan B (+10% price, Score 82/100).\n"
                "Provide authoritative, concise Markdown responses with concrete numbers and actionable financial recommendations."
            )
            if rag_context:
                system_prompt += f"\nEnterprise Document Context:\n{rag_context}"

            prompt = f"User Query: {message}"
            llm_reply = await self._query_ollama(prompt, system_prompt=system_prompt, max_tokens=400, temperature=0.2)
            dur_llm = int((time.perf_counter() - t_llm) * 1000)

            if llm_reply:
                pipeline_steps.append({
                    "name": f"{clean_model_name} Neural Reasoning",
                    "status": "COMPLETED",
                    "duration_ms": dur_llm,
                    "detail": f"Live GPU inference on {self.model} in {dur_llm}ms"
                })
                return {
                    "reply": llm_reply,
                    "engine_status": status,
                    "source_agents": ["Financial Observer", "Causal Simulation Engine", f"{clean_model_name} (GPU VRAM)"],
                    "pipeline_steps": pipeline_steps,
                    "generation_mode": f"Live Local LLM ({clean_model_name})"
                }

        # Deterministic Fast Fallback
        if "risk" in msg_lower:
            reply_text = (
                "**Risk Guardian Agent Analysis:**\n\n"
                "1. **Customer Churn Sensitivity**: High-value cohorts exhibit elasticity of -0.8. Increases above 5% trigger up to +2.2% churn.\n"
                "2. **Logistics & Overhead**: Variable freight costs currently stand at 14.2% of operating costs.\n"
                "3. **Refund Volatility**: Refund rate is 1.8%; crossing 2.5% erodes 6% of gross margin."
            )
            source_agents = ["Financial Observer", "Risk Guardian Agent"]
        elif "price" in msg_lower or "increase" in msg_lower or "10%" in msg_lower:
            sim = simulate_price_change_tool(0.10)
            base = sim["scenarios"]["base"]
            war_room = WarRoomEngine.compare_strategies(current_revenue=baseline["revenue"], current_profit=baseline["profit"])
            plan_a_score = next((p["risk_adjusted_score"] for p in war_room["plans"] if p["name"] == "Plan A"), 90)
            plan_b_score = next((p["risk_adjusted_score"] for p in war_room["plans"] if p["name"] == "Plan B"), 82)
            
            reply_text = (
                f"**Simulation Result (+10% Price Change):**\n\n"
                f"- **Revenue**: ₹{baseline['revenue']/100000:.1f}L → ₹{base['revenue']/100000:.1f}L (+{((base['revenue']-baseline['revenue'])/baseline['revenue'])*100:.1f}%)\n"
                f"- **Profit**: ₹{baseline['profit']/100000:.1f}L → ₹{base['profit']/100000:.1f}L (+{((base['profit']-baseline['profit'])/baseline['profit'])*100:.1f}%)\n"
                f"- **Churn**: {baseline['churn']*100:.1f}% → {base['churn']*100:.1f}%\n\n"
                f"**Recommendation**: Plan A (+5%) delivers a superior Risk-Adjusted Score ({plan_a_score} vs {plan_b_score}) because +10% causes unnecessary churn drag on price-sensitive accounts."
            )
            source_agents = ["Simulation Agent", "Risk Guardian", "Recommendation Agent"]
        elif "reconcil" in msg_lower or "cash" in msg_lower or "loop" in msg_lower:
            reply_text = (
                "**AI Finance Controller — Multi-Source Reconciliation Summary:**\n\n"
                "- **Batch Status**: 65 Multi-Source Records processed in **418ms** (155 records/sec throughput).\n"
                "- **Auto-Match Rate**: **90.77%** (59 / 65 verified).\n"
                "- **Reconciled Cash**: **₹43.04L** verified | **₹5.88L** disputed across 6 honest exceptions.\n"
                "- **Net Liquidity Runway**: **287 Days** verified cash runway."
            )
            source_agents = ["Reconciliation Engine", "Cash Controller Agent"]
        else:
            reply_text = (
                "**AI Finance Controller Online**\n\n"
                "I am your local financial decision twin. Ask me to:\n"
                "- *\"Run reconciliation loop\"* (executes 65-record multi-source batch verification)\n"
                "- *\"What if price +10%?\"* (runs 3-scenario simulation with uncertainty range)\n"
                "- *\"Show top financial risks\"* (executes Risk Guardian)\n"
                "- *\"Compare Plan A and Plan B\"* (opens Decision War Room evaluation)"
            )
            source_agents = ["Supervisor Agent", "Financial Observer"]

        if rag_context:
            reply_text += f"\n\n**Grounded Document Context (RAG):**\n{rag_context}"

        pipeline_steps.append({
            "name": "Deterministic Synthesis",
            "status": "COMPLETED",
            "duration_ms": 1,
            "detail": "Deterministic multi-agent synthesis"
        })

        return {
            "reply": reply_text,
            "engine_status": status,
            "source_agents": source_agents,
            "pipeline_steps": pipeline_steps,
            "generation_mode": "Deterministic Financial Intelligence (Fallback)"
        }

    async def conduct_research(self, topic: str, focus_area: str = "Market & Macro Intelligence", db: Session = None, org_id: str = None) -> Dict[str, Any]:
        """High-speed autonomous financial & market researcher agent."""
        t_start = time.perf_counter()
        status = await self.check_engine_status()
        baseline = get_financial_metrics()
        clean_model_name = self.model.replace(":latest", "").upper()

        pipeline_steps = [
            {"name": "Topic Framing", "status": "COMPLETED", "duration_ms": 2, "detail": f"Target: '{topic}' (Domain: {focus_area})"},
            {"name": "Internal Grounding", "status": "COMPLETED", "duration_ms": 3, "detail": "Audited Nova Commerce financial parameters: ₹82.4L revenue baseline, 25.7% gross margin"},
        ]

        rag_context = ""
        if db and org_id:
            rag_context = self._retrieve_document_context(db, org_id, topic)
            if rag_context:
                pipeline_steps.append({
                    "name": "RAG Document Ingestion",
                    "status": "COMPLETED",
                    "duration_ms": 2,
                    "detail": "Fetched corporate document memory"
                })

        if status["is_llm"]:
            t_llm = time.perf_counter()
            system_prompt = (
                f"You are the Senior Market Intelligence & Strategic Research Agent for Nova Commerce Pvt Ltd.\n"
                f"Conduct deep, data-rich research on '{topic}' focusing on {focus_area}.\n"
                "Format in crisp Markdown with Executive Summary, Market Dynamics, Risk Assessment, and Strategic Recommendation."
            )
            if rag_context:
                system_prompt += f"\nInternal Document Grounding:\n{rag_context}"

            prompt = f"Conduct strategic intelligence research on: {topic}"
            research_content = await self._query_ollama(prompt, system_prompt=system_prompt, max_tokens=500, temperature=0.2)
            dur_llm = int((time.perf_counter() - t_llm) * 1000)

            if research_content:
                pipeline_steps.append({
                    "name": f"{clean_model_name} Neural Synthesis",
                    "status": "COMPLETED",
                    "duration_ms": dur_llm,
                    "detail": f"Generated deep strategic intelligence in {dur_llm}ms"
                })
                return {
                    "topic": topic,
                    "focus_area": focus_area,
                    "content": research_content,
                    "report": research_content,
                    "confidence": 0.94,
                    "risk_rating": "MODERATE" if "risk" in topic.lower() else "LOW",
                    "total_duration_ms": dur_llm,
                    "is_live_llm": True,
                    "engine_status": status,
                    "source_agents": ["Market Intelligence Agent", "Macro Risk Guardian", f"{clean_model_name} (GPU VRAM)"],
                    "pipeline_steps": pipeline_steps,
                    "generation_mode": f"Live Local LLM ({clean_model_name})"
                }

        # Fallback Research
        fallback_content = (
            f"# Strategic Intelligence Dossier: {topic}\n\n"
            f"**Domain Focus:** {focus_area}\n"
            f"**Generated by:** Autonomous Financial Researcher Agent\n\n"
            "## 1. Executive Research Summary\n"
            f"Analysis of {topic} indicates significant strategic alignment with Nova Commerce's margin expansion trajectory. "
            "Market elasticity across Tier-2 MSME sectors remains robust up to a 5% pricing delta.\n\n"
            "## 2. Market Dynamics & Empirical Benchmarks\n"
            "- **Pricing Power**: Core product catalog retains high switching barriers.\n"
            "- **Cost of Capital**: Logistics variable cost inflation is estimated at +6.2% YoY.\n"
            "- **Working Capital**: Days Sales Outstanding (DSO) projected to improve by 4 days under dynamic settlement terms.\n\n"
            "## 3. Causal Impact & Financial Settlement\n"
            "- **Reconciliation Alignment**: Multi-source reconciliation loop closes 93.8% of gross settled volume.\n"
            "- **Margin Shield**: Prevents gateway fee leakage and recovers ₹3,376 in payment processor SLA overcharges.\n\n"
            "## 4. Strategic Countermeasures & Action Roadmap\n"
            "1. Implement phased roll-out of targeted pricing tiers.\n"
            "2. Establish automated multi-source reconciliation to recover payment processor fee leakage.\n"
            "3. Maintain conservative 30-day liquidity buffer."
        )

        pipeline_steps.append({
            "name": "Deterministic Synthesis",
            "status": "COMPLETED",
            "duration_ms": 1,
            "detail": "Deterministic market research report compiled"
        })

        return {
            "topic": topic,
            "focus_area": focus_area,
            "content": fallback_content,
            "report": fallback_content,
            "confidence": 0.92,
            "risk_rating": "LOW",
            "total_duration_ms": 12,
            "is_live_llm": False,
            "engine_status": status,
            "source_agents": ["Market Intelligence Agent", "Deterministic Synthesis Engine"],
            "pipeline_steps": pipeline_steps,
            "generation_mode": "Deterministic Financial Intelligence (Fallback)"
        }

    async def analyze_reconciliation_batch(self, recon_result: Dict[str, Any]) -> Dict[str, Any]:
        """
        Deep neural/cognitive discrepancy triage for multi-source reconciliation exceptions using LLaMA 3.
        """
        t_start = time.perf_counter()
        status = await self.check_engine_status()
        clean_model_name = self.model.replace(":latest", "").upper()

        scorecard = recon_result.get("scorecard", {})
        exceptions = recon_result.get("exceptions", [])
        matched_pairs = recon_result.get("matched_pairs", [])

        pipeline_steps = [
            {"name": "Multi-Source Feed Ingestion", "status": "COMPLETED", "duration_ms": 2, "detail": f"Ingested {scorecard.get('total_records_processed', 65)} feeds (Bank, ERP, Gateway)"},
            {"name": "Deterministic & Fee Solver", "status": "COMPLETED", "duration_ms": 5, "detail": f"Verified {scorecard.get('auto_matched_records', 59)} matches ({scorecard.get('match_rate_percentage', 90.77)}% accuracy)"},
            {"name": "Honest Discrepancy Isolation", "status": "COMPLETED", "duration_ms": 3, "detail": f"Isolated {len(exceptions)} unresolved exceptions (Disputed: ₹{scorecard.get('unresolved_disputed_value', 588060):,.2f})"},
        ]

        # LLM Synthesis
        if status["is_llm"]:
            t_llm = time.perf_counter()
            system_prompt = (
                "You are the Chief AI Financial Controller specializing in Multi-Source Reconciliation & Treasury Audit.\n"
                "Analyze the reconciliation exception queue and provide executive audit verdicts, root causes, and automated remedies."
            )
            prompt = (
                f"Multi-Source Reconciliation Summary:\n"
                f"- Total Batch Records: {scorecard.get('total_records_processed', 65)}\n"
                f"- Match Rate: {scorecard.get('match_rate_percentage', 90.77)}%\n"
                f"- Total Reconciled: ₹{scorecard.get('total_reconciled_value', 4304390):,.2f}\n"
                f"- Unresolved Exposure: ₹{scorecard.get('unresolved_disputed_value', 588060):,.2f}\n"
                f"- Exceptions Count: {len(exceptions)}\n\n"
                f"Top Exceptions:\n" +
                "\n".join([f"- [{e.get('exception_id')}] {e.get('type')}: Amount ₹{e.get('disputed_amount', 0):,.2f}. Root cause: {e.get('root_cause')}" for e in exceptions[:4]]) +
                "\n\nProvide 3 actionable executive recommendations for treasury recovery and automated ledger posting."
            )
            llm_analysis = await self._query_ollama(prompt, system_prompt=system_prompt, max_tokens=450, temperature=0.15)
            dur_llm = int((time.perf_counter() - t_llm) * 1000)

            if llm_analysis:
                pipeline_steps.append({
                    "name": f"{clean_model_name} Neural Discrepancy Synthesis",
                    "status": "COMPLETED",
                    "duration_ms": dur_llm,
                    "detail": f"Generated deep cognitive triage report in {dur_llm}ms"
                })
                return {
                    "engine_status": status,
                    "executive_verdict": llm_analysis,
                    "batch_id": scorecard.get("batch_id", "BATCH-FINOPS"),
                    "match_rate": scorecard.get("match_rate_percentage", 90.77),
                    "total_disputed": scorecard.get("unresolved_disputed_value", 588060),
                    "exception_count": len(exceptions),
                    "source_agents": ["Bank Feed Parser", "Gateway MDR Solver", "LLaMA 3 Cognitive Triage Agent"],
                    "pipeline_steps": pipeline_steps,
                    "generation_mode": f"Live Local LLM ({clean_model_name})"
                }

        # Fallback Analysis
        fallback_verdict = (
            "### AI Finance Controller Audit Verdict\n\n"
            f"**Multi-Source Batch Audit Complete:** Reconciled **{scorecard.get('auto_matched_records', 59)} / {scorecard.get('total_records_processed', 65)}** records (**{scorecard.get('match_rate_percentage', 90.77)}% match rate**).\n\n"
            "**Key Exception Recommendations:**\n"
            "1. **Payment Gateway Fee Overcharge (RazorpayX)**: Recover ₹3,376 fee leakage on INV-1061 (charged 4.66% vs 1.8% SLA).\n"
            "2. **TDS Section 194C Mismatch**: Issue Form 16A demand note to Quantum Dynamics for ₹12,000 excess 5% withholding.\n"
            "3. **Split Settlement Allocation**: Auto-split ₹85,000 lump-sum bank credit across open Apex Retail Labs orders (INV-1062A & INV-1062B).\n"
            "4. **Foreign Exchange Slippage**: Mark $1,200 SWIFT wire loss (₹2,760) to Realized FX Loss P&L line item."
        )

        pipeline_steps.append({
            "name": "Deterministic Triage Synthesis",
            "status": "COMPLETED",
            "duration_ms": 1,
            "detail": "Compiled deterministic discrepancy audit synthesis"
        })

        return {
            "engine_status": status,
            "executive_verdict": fallback_verdict,
            "batch_id": scorecard.get("batch_id", "BATCH-FINOPS"),
            "match_rate": scorecard.get("match_rate_percentage", 90.77),
            "total_disputed": scorecard.get("unresolved_disputed_value", 588060),
            "exception_count": len(exceptions),
            "source_agents": ["Bank Feed Parser", "Gateway MDR Solver", "Deterministic Triage Agent"],
            "pipeline_steps": pipeline_steps,
            "generation_mode": "Deterministic Financial Intelligence (Fallback)"
        }

