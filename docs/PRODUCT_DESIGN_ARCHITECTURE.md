# Financial Time Machine — Product Design & Architecture Specification
**Version 2.0 | Multi-Tenant AI Financial Decision Intelligence Platform**

---

## 1. What Is This System?

The **Financial Time Machine** is not a dashboard. It is a full **AI-native enterprise financial decision engine**:

> **Business Data → Prediction → Simulation → Risk → Decision → Outcome → System Learns**

Organizations bring in their historical and live transactional data. Users — primarily CFOs and analysts — ask forward-looking questions:

- *"What happens if we raise prices by 10%?"*
- *"Why did profit fall last quarter?"*
- *"Which product line carries the highest financial risk?"*

The system then:
1. Runs a multi-scenario stochastic simulation (Pessimistic / Base / Optimistic)
2. Passes results through a Risk Guardian
3. Routes through a multi-agent AI pipeline: Supervisor → Financial Observer → Simulation Engine → Risk Guardian → Recommendation Engine → Qwen3 4B / Deterministic Fallback
4. Returns a **structured AI recommendation** with confidence score, risk score, and the "why"
5. Routes the recommendation into an **approval workflow** (CFO → Executive)
6. Seals the approved decision into the **Decision Ledger**
7. Compares predicted outcomes against **actual business results**
8. Feeds variance back into **AI Memory** to improve future predictions

---

## 2. Platform Architecture (Multi-Tenant)

```
PLATFORM (Multi-Tenant)
│
├── Super Admin    ← controls entire platform
│
└── ORGANIZATION (e.g., Nova Commerce)
        │
        ├── Org Admin    ← manages this org only
        ├── CFO
        ├── Business Analyst
        ├── Executive
        └── Auditor
            (all work on this org's financial data only)
```

**Tenant isolation** is enforced at the database layer via `organization_id` on every financial record (`Customer`, `Order`, `Transaction`). The backend never mixes cross-organization data.

---

## 3. Core Workflow — The Decision Loop

```
Business Analyst prepares data
         |
         v
     CFO asks question via AI Controller
         |
         v
   Supervisor Agent orchestrates pipeline
         |
    +----+-------------------+
    v                        v
Financial Observer      Simulation Engine
(24-month baseline)     (Monte Carlo / Elasticity)
    |                        |
    +----------+-------------+
               v
         Risk Guardian
         (VaR, churn elasticity, tail risk)
               |
               v
       Recommendation Engine
               |
               v
          Qwen3 4B (local, via Ollama)
          OR Deterministic Fallback
               |
               v
       AI Verdict delivered to CFO
       (confidence %, risk score, why list)
               |
         +-----+-----+
         v     v     v
      APPROVE MODIFY REJECT
         |     |     |
         |     v     |
         |  RE-SIMULATE
         +-----+-----+
               v
        Decision Ledger (sealed entry)
               |
               v
       Actual Business Executes
               |
               v
     Prediction vs. Reality tracking
               |
               v
       AI Memory updated
               |
               v
        Next decision is smarter
```

---

## 4. Backend API — Currently Registered Routes

| Route | File | Purpose |
|---|---|---|
| `POST /api/auth/login` | `routers/auth.py` | JWT auth, returns role + org |
| `GET /api/data/live-baseline` | `routers/financial.py` | Live aggregated KPIs from DB |
| `GET /api/data/dashboard-metrics` | `routers/financial.py` | High-level CFO dashboard numbers |
| `GET /api/data/customers` | `routers/financial.py` | Org-scoped customer list |
| `GET /api/data/orders` | `routers/financial.py` | Org-scoped order list |
| `POST /api/simulations/simulate-price` | `routers/simulations.py` | 3-scenario price change simulation |
| `GET /api/ai/status` | `routers/ai.py` | Qwen3/Ollama health check |
| `POST /api/ai/analyze` | `routers/ai.py` | Full multi-agent AI analysis |
| `POST /api/ai/chat` | `routers/ai.py` | Natural-language AI chat |
| `GET /api/ledger/` | `routers/ledger.py` | List all decisions |
| `POST /api/ledger/` | `routers/ledger.py` | Create new ledger entry |
| `PATCH /api/ledger/{id}/status` | `routers/ledger.py` | Approve / Reject / Modify |
| `GET /api/memory/history` | `routers/memory.py` | Historical decision + outcomes |
| `GET /api/memory/prediction-vs-reality` | `routers/memory.py` | Aggregated accuracy metrics |
| `POST /api/memory/record-actual` | `routers/memory.py` | Log real-world outcome |
| `GET /api/war-room` | `routers/war_room.py` | War room comparison data |
| `GET /api/health` | `main.py` | System / AI engine health |

### Routes Still Needed (Phase 9+)

```
POST /api/organizations           <- Super Admin: create org
GET  /api/organizations           <- Super Admin: list all orgs
POST /api/users                   <- Org Admin: create/invite user
GET  /api/users                   <- Org Admin: list org users
POST /api/data/import/csv         <- CSV/Excel upload + validation
GET  /api/risk/center             <- Aggregated risk dashboard
GET  /api/audit/decision/{id}     <- Full audit trace for Auditor
```

---

## 5. Backend Data Models — Current State

### `users`
```
id, email, hashed_password, full_name, is_active
role: SUPER_ADMIN | ORG_ADMIN | CFO | BUSINESS_ANALYST | EXECUTIVE | AUDITOR
organization_id (FK -> organizations)
created_at, updated_at
```

### `organizations`
```
id, name, created_at, updated_at
-> users (relationship)
```

### `customers`
```
id, organization_id (tenant-scoped)
name, email, segment  ('High Value', 'Price Sensitive')
created_at
-> orders (relationship)
```

### `orders`
```
id, organization_id, customer_id
total_amount, status
created_at
-> transactions (relationship)
```

### `transactions`
```
id, organization_id, order_id
amount, type  ('payment' | 'refund')
created_at
```

### Tables Still Needed

```sql
simulations       (id, org_id, decision_type, params_json, created_by, created_at)
simulation_results(id, sim_id, scenario, revenue, profit, churn, risk_level)

decisions         (id, org_id, question, proposed_action, status, created_by, approved_by)
decision_audit_log(id, decision_id, actor_id, action, note, timestamp)

ai_memory         (id, org_id, decision_id, predicted_json, actual_json, accuracy, lesson)
risk_assessments  (id, org_id, category, level, impact_amount, probability, timestamp)
org_settings      (id, org_id, industry, currency, fiscal_year_start, timezone)
```

---

## 6. Frontend — Current State

### Tech Stack
- **Framework**: React + TypeScript (Vite)
- **Charting**: Recharts
- **HTTP**: Axios
- **Icons**: Lucide React
- **Styling**: Tailwind CSS
- **State**: Local `useState` / `useEffect` (no global store yet)

### Existing Components

| File | What It Does |
|---|---|
| `App.tsx` | Main shell: tab nav, global state, simulation runner |
| `AIChat.tsx` | Natural-language AI chat -> `POST /api/ai/chat` |
| `AIMemory.tsx` | Historical decisions + lessons -> `GET /api/memory/history` |
| `WarRoom.tsx` | Plan A vs B vs C side-by-side comparison |
| `PredictionVsReality.tsx` | Accuracy tracking dashboard |
| `DecisionLedger.tsx` | Decision log with Approve/Reject controls |
| `FinancialGraph.tsx` | Revenue/profit trend line chart |
| `CommandPalette.tsx` | Keyboard shortcut navigation (Cmd+K) |

### Current Tab Navigation (App.tsx)

```
simulator  -> What-If Simulator  (main landing)
war-room   -> Decision War Room
ledger     -> Decision Ledger
memory     -> AI Memory
pvr        -> Prediction vs Reality
chat       -> AI Controller Chat
```

---

## 7. All Frontend Pages — Full Design Specification

---

### Page 1: Login
**Route**: `/login` | **API**: `POST /api/auth/login`

```
+------------------------------------------+
|  FINANCIAL TIME MACHINE                  |
|  Enterprise Financial Intelligence       |
|                                          |
|  Email    ____________________________   |
|  Password ____________________________   |
|                                          |
|  [ SIGN IN ]                             |
+------------------------------------------+
```

Response: `{ accessToken, user: { id, role, organizationId } }`
Frontend reads `role` and redirects to the correct dashboard.

---

### Page 2: Super Admin Dashboard
**Route**: `/admin` | **Roles**: SUPER_ADMIN only

```
SUPER ADMIN — PLATFORM CONTROL

Organizations      42    [+ NEW]
Users             386
AI Requests    18,492
Simulations     7,821
System Health   99.8%

AI Engine   * Qwen3 4B  ONLINE
Database    * HEALTHY
API         * HEALTHY

[ ORGANIZATIONS ] [ USERS ] [ AI CONFIG ] [ AUDIT LOGS ]
```

---

### Page 3: Organization Admin Dashboard
**Route**: `/org-admin` | **Roles**: ORG_ADMIN

```
ORGANIZATION: Nova Commerce

Users         12   [+ INVITE]
Data Records 45K   [IMPORT]
Last Sync    2h ago

[ MANAGE USERS ] [ DATA CENTER ] [ SETTINGS ] [ AUDIT ]
```

---

### Page 4: Main Financial Dashboard (CFO View)
**Route**: `/dashboard`
**API**: `GET /api/data/dashboard-metrics` + `GET /api/data/live-baseline`

```
+----------------------------------------------------------+
| FINANCIAL TIME MACHINE              * AI ONLINE          |
+----------------------------------------------------------+
| Revenue      Profit      Margin      Cash Flow           |
| Rs82.4L      Rs21.2L     25.7%       Rs14.8L            |
| +8.4%        +11.2%      +2.1%       +6.7%              |
+----------------------+-----------------------------------+
| REVENUE TREND        | AI INSIGHT                        |
| [FinancialGraph]     | "Margin improved but churn        |
|                      |  increased in metro accounts."    |
+----------------------+-----------------------------------+
| TOP RISKS            | PENDING DECISIONS                 |
| [red] Churn          | 4 awaiting approval               |
| [yellow] Cash Flow   | [ VIEW LEDGER ]                   |
+----------------------+-----------------------------------+
```

---

### Page 5: AI Controller
**Route**: `/ai`
**API**: `POST /api/ai/chat`, `GET /api/ai/status`

```
AI FINANCE CONTROLLER
* LOCAL QWEN3 4B ACTIVE

+--------------------------------------------------+
| What happens if price increases 10%?             |
+--------------------------------------------------+

Quick prompts:
[Top Risks] [Price +10%] [Compare Plans] [Financial Health]

[ ASK AI ]
```

Agent pipeline shown live:
```
* Financial Observer    COMPLETED - Audited 24-month baseline
* Simulation Engine     COMPLETED - 3-scenario modeling
* Risk Guardian         COMPLETED - Churn elasticity assessed
* Recommendation Engine COMPLETED - Risk-adjusted score calculated
* Qwen3 4B Synthesis    COMPLETED - Narrative generated
```

---

### Page 6: What-If Simulator  ← HERO PAGE
**Route**: `/simulator`
**API**: `POST /api/simulations/simulate-price` + `POST /api/ai/analyze`

Controls:
```
Price Increase    |||||||||||||..  +10%
Marketing Spend   ||||||||......   +5%
Delivery Fee      |||...........   -2%
Discount Rate     ||||||||......   -5%
```

Three Futures output:
```
                 PRICE +10% SIMULATION

  +-------------+------------+-------------+
  | PESSIMISTIC |    BASE    |  OPTIMISTIC |
  +-------------+------------+-------------+
  | Rs76.9L     | Rs88.7L    | Rs94.1L     | Revenue
  | Rs17.8L     | Rs23.4L    | Rs29.1L     | Profit
  | 10.8%       | 8.9%       | 7.5%        | Churn
  | HIGH        | MEDIUM     | LOW         | Risk
  +-------------+------------+-------------+

Rs76.9L ------------ Rs88.7L ------------ Rs94.1L
Pessimistic            Base              Optimistic
```

AI Verdict section below:
```
AI FINANCE SUPERVISOR

RECOMMENDATION: Increase price by 5% instead of 10%.
Confidence: 88%    Risk: MEDIUM    Score: 36/100

WHY?
01  Immediate margin improves
02  10% creates excessive churn in metro accounts
03  High-LTV customers are price-elastic
04  +5% has better 12-month risk-adjusted score

[ LOG DECISION ]  [ COMPARE IN WAR ROOM ]
```

---

### Page 7: Decision War Room
**Route**: `/war-room`
**API**: `GET /api/war-room`
**Component**: `WarRoom.tsx`

```
                    WAR ROOM

         PLAN A        PLAN B        PLAN C
           +5%          +10%          +15%

Revenue  Rs86L        Rs88.7L       Rs91L
Profit   Rs24L        Rs23.4L       Rs20L
Risk     LOW          MEDIUM        HIGH
Churn    7.8%         8.9%          11.2%
Score     92            84            68

                  PLAN A RECOMMENDED
```

---

### Page 8: Risk Center
**Route**: `/risk`
**API**: `GET /api/risk/center` (to build)

```
RISK CENTER

Overall Risk Score
||||||....  36 / 100  MEDIUM

[red]    CUSTOMER CHURN      HIGH    Impact: Rs4.2L  [ DETAILS ]
[yellow] CASH FLOW PRESSURE  MEDIUM  Impact: Rs1.8L  [ DETAILS ]
[yellow] PRICING SENSITIVITY MEDIUM  Impact: Rs1.1L  [ DETAILS ]
[green]  INVENTORY           LOW                     [ DETAILS ]
```

Risk drilldown shows: root cause, affected segment, financial impact, probability, recommended mitigation.

---

### Page 9: Decision Ledger
**Route**: `/ledger`
**API**: `GET/POST /api/ledger/`, `PATCH /api/ledger/{id}/status`
**Component**: `DecisionLedger.tsx`

```
DECISION LEDGER

#DEC-1043  Expand Logistics Budget +15%   LOW     AWAITING APPROVAL  [REVIEW]
#DEC-1042  Price Increase +5%             MEDIUM  APPROVED            [VIEW]
#DEC-1041  Flash Sale -20%               LOW     COMPLETED           [AUDIT]
#DEC-1040  Delivery Fee +10%             HIGH    REJECTED            [AUDIT]
```

Detail view traces: Decision -> Simulation Evidence -> AI Recommendation -> Approver -> Audit Trail.

---

### Page 10: Executive Dashboard  ← MINIMALIST
**Route**: `/executive`
**Roles**: EXECUTIVE only

No charts to swim through. Just decisions requiring action.

```
EXECUTIVE WAR ROOM

Business Health: 82/100

Revenue  Rs82.4L  up 8.4%
Profit   Rs21.2L  up 11.2%
Top Risk Customer Churn

DECISIONS REQUIRING YOUR APPROVAL (4)
────────────────────────────────────────
#DEC-1043  Logistics Budget +15%
           AI: Approve with milestone review
           Risk: LOW | Confidence: 92% | Expected Profit: Rs24.8L

[ APPROVE ]  [ REJECT ]  [ MODIFY ]  [ VIEW SIMULATION ]
```

---

### Page 11: Prediction vs. Reality
**Route**: `/prediction-vs-reality`
**API**: `GET /api/memory/prediction-vs-reality`
**Component**: `PredictionVsReality.tsx`

```
PREDICTION VS REALITY

Revenue
  Predicted --------------------  Rs88.7L
  Actual    -------------------   Rs87.9L    Accuracy: 99.1%

Profit
  Predicted -------------  Rs23.4L
  Actual    ------------   Rs22.8L           Accuracy: 97.4%

MODEL PERFORMANCE
Revenue  96.8%  ||||||||||||||||||||||||..
Profit   94.3%  |||||||||||||||||||||||...
Churn    91.2%  ||||||||||||||||||||||....

Tracked Decisions: 2
```

---

### Page 12: AI Memory
**Route**: `/memory`
**API**: `GET /api/memory/history`
**Component**: `AIMemory.tsx`

```
AI MEMORY — Historical Decision Intelligence

+-----------------------------------------------+
| DEC-1042  Nov 2025  Operations/Logistics       |
| "Increase standard delivery fee by Rs20"       |
|                                               |
| Predicted: Revenue Rs84.5L  Profit Rs22.4L    |
| Actual:    Revenue Rs81.2L  Profit Rs20.8L    |
| Accuracy:  96.1%                              |
|                                               |
| Lesson: Logistics fee increases affect        |
| high-LTV accounts most. Bundle into           |
| subscription tier instead.                    |
+-----------------------------------------------+

"This historical pattern influenced the current recommendation."
```

---

### Page 13: Data Center
**Route**: `/data`
**Roles**: ORG_ADMIN, CFO, ANALYST

Step 1 — Overview:
```
DATA CENTER — Nova Commerce

Customers     12,430   Live
Orders        45,821   Live
Transactions  46,102   Live
Expenses       8,421   Live
Products       1,842   Live

[ IMPORT CSV ] [ IMPORT EXCEL ] [ CONNECT DATABASE ] [ API SYNC ]
```

Step 2 — Validation:
```
CUSTOMER DATA VALIDATION

  12,430 records imported
  0 duplicate IDs
  0 invalid emails
  14 missing phone numbers (WARNING)
  All customer IDs valid

DATA QUALITY ||||||||||||||||||||....  94%

[ REVIEW 14 ISSUES ]  [ IMPORT ANYWAY ]
```

---

### Page 14: Audit Center
**Route**: `/audit`
**Roles**: AUDITOR (full), all others (read-only)

```
AUDIT CENTER

Decision #DEC-1042

WHO?          Rahul Kumar / CFO
WHEN?         23 Aug 2026  11:42 IST
WHAT?         Price Increase +5%
DATA USED?    24 months transaction history
AI MODEL?     Qwen3 4B (local inference)
SIMULATIONS?  3 scenarios run
AI VERDICT?   Recommend +5% not +10%
APPROVED BY?  Pooja Mehta / Executive Director
TIMESTAMP?    2026-08-23T11:58:42+05:30
RESULT?       Pending 30-day outcome
```

Every step, every agent output, every token of AI rationale is preserved and traceable.

---

### Page 15: Organization Setup
**Route**: `/setup`
**Roles**: ORG_ADMIN

```
ORGANIZATION SETUP

Company Name   Nova Commerce
Industry       E-Commerce
Currency       INR Rs
Fiscal Year    April - March
Timezone       Asia/Kolkata (IST)

[ SAVE & CONTINUE ]
```

---

## 8. Role-to-Navigation Mapping

| Nav Item | Super Admin | Org Admin | CFO | Analyst | Executive | Auditor |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| System Dashboard | YES | - | - | - | - | - |
| Organizations | YES | - | - | - | - | - |
| Financial Dashboard | YES | YES | YES | YES | YES | READ |
| AI Controller | YES | YES | YES | YES | YES | READ |
| What-If Simulator | YES | YES | YES | YES | READ | READ |
| Decision War Room | YES | YES | YES | YES | YES | READ |
| Risk Center | YES | YES | YES | YES | YES | READ |
| Decision Ledger | YES | YES | YES | READ | YES | READ |
| Executive Dashboard | - | - | - | - | YES | - |
| Prediction vs Reality | YES | YES | YES | YES | YES | READ |
| AI Memory | YES | YES | YES | READ | READ | READ |
| Data Center | YES | YES | YES | YES | - | - |
| Users | YES | YES | - | - | - | - |
| Audit Center | YES | OWN | READ | READ | READ | YES |
| Settings | YES | YES | - | - | - | - |

---

## 9. Authentication & RBAC Security Architecture

```
Client Request
      |
      v
JWT in Authorization header
      |
      v
FastAPI Depends -> get_current_active_user (deps.py)
      |
      v
Decode JWT -> extract user.email
      |
      v
DB lookup -> real role + real org_id
      |
      v  (RoleChecker dependency)
API Handler executes
      |
      v
All DB queries filtered by organization_id
```

**Core principle**: The backend is the authority on role. The frontend only renders based on the role in the JWT — the API enforces `403 Forbidden` independently.

### RoleChecker Pattern (add to `deps.py`)

```python
class RoleChecker:
    def __init__(self, allowed_roles: list[RoleEnum]):
        self.allowed_roles = allowed_roles

    def __call__(self, user: User = Depends(get_current_active_user)):
        if user.role not in self.allowed_roles:
            raise HTTPException(
                status_code=403,
                detail="Operation not permitted for this role"
            )
        return user

# Usage:
@router.post("/decisions/{id}/approve")
def approve_decision(
    id: str,
    user: User = Depends(RoleChecker([RoleEnum.CFO, RoleEnum.EXECUTIVE]))
):
    ...
```

---

## 10. AI Engine — System Actors (Not Human Roles)

| Agent | Responsibility |
|---|---|
| **AIAgentSupervisor** | Orchestrates the full pipeline, routes to Qwen3 or Deterministic Fallback |
| **Financial Observer Agent** | Audits 24-month financial baseline, calculates KPIs |
| **Simulation Engine Agent** | Runs Monte Carlo / price elasticity / churn cascade models |
| **Risk Guardian Agent** | Computes VaR, churn elasticity sensitivity, revenue risk score |
| **Recommendation Engine** | Ranks scenarios, calculates risk-adjusted scores, builds "why" list |
| **Qwen3 4B via Ollama** | Local LLM synthesis: converts structured agent outputs to narrative |
| **Deterministic Fallback** | Mathematical rule-engine. Activates when Qwen3 is offline — 100% uptime |

AI engine status is surfaced in the nav bar badge, live-polled every 5 seconds via `GET /api/ai/status`.

---

## 11. Build Phases & Implementation Status

| Phase | What to Build | Status |
|---|---|---|
| 1. Auth + RBAC + Org | Login, JWT, org model | Done (foundation) |
| 2. Financial Data | CSV/Excel import, validation, DB seeding | Models exist; import UI needed |
| 3. Financial Engine | Revenue/profit/margin/churn KPIs | `/api/data/live-baseline` done |
| 4. Simulation Engine | What-If price simulator (3 scenarios) | `/api/simulations/simulate-price` done |
| 5. Risk Engine | Risk Guardian, churn elasticity, risk score | `analytics/risk_engine.py` done |
| 6. AI Controller | Multi-agent supervisor, Qwen3, fallback | `agents/supervisor.py` + `/api/ai/*` done |
| 7. Decision Governance | Ledger CRUD, status workflow | `/api/ledger/` with PATCH done |
| 8. Prediction vs Reality | Outcome logging, accuracy, AI Memory | `/api/memory/*` done |
| 9. Multi-tenant + RBAC | Super Admin org mgmt, role-gated nav, user invites | Needs implementation |
| 10. Frontend Pages | Login, per-role dashboards, org setup, data center | Partial; role-gating needed |
| 11. Polish | Animations, responsive, security hardening | Final phase |

---

## 12. The Core Design Principle

```
         FRONTEND
            |
     (display + interact)
            |
            v
           API
            |
            v
       SUPERVISOR
            |
  +---------+---------+
  v         v         v
  DB    SIMULATION    ML
  |         |         |
  +---------+---------+
            v
          RISK
            |
            v
    RECOMMENDATION
            |
            v
          QWEN3
            |
            v
       STRUCTURED JSON
            |
            v
         FRONTEND
     renders the result
```

**The frontend is never the brain.**

React/TypeScript renders what the backend produces. The intelligence lives entirely in:

> PostgreSQL + Financial Engine + Simulation Engine + Risk Engine + Multi-Agent System + Qwen3 4B + Decision Ledger

