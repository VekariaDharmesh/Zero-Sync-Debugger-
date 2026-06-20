# Zero-Sync Debugger
### Memory-Driven Autonomous Incident Recovery Command Center
### National Security & Predictive Infrastructure Platform
### AI-Driven (Claude 3.5 Sonnet + Parcle Vector Memory + Enter Pro) — Zero Manual Inspection Dependency

📌 **What is Zero-Sync Debugger?**
Zero-Sync Debugger is an autonomous, mission-critical operations command center that intercepts production runtime errors, references historical incident memory via Parcle, reasons on code repairs using Claude 3.5 Sonnet, and deploys surgical hotfixes through Enter Pro without manual debugging.

It learns the "normal" operational state and logs resolution patterns of a healthy application network, flagging anomalies such as:

- **Structural Exceptions**: Undefined variable lookups, null references, and range boundary errors.
- **Context Recalls**: Semantic matches of historical fixes stored in Parcle vector memory.
- **Vulnerability Risks**: Automated patch evaluation to prevent regression errors.

---

## ✨ Main Features
- **Zero-Day Incident Recovery**: Automated identification, diagnosis, and fix generation of unknown application bugs.
- **Parcle Vector Memory**: Long-term state storage and semantic query search of preceding incidents.
- **Memory Influence Analyzer**: Real-time analytics displaying confidence improvements before and after memory retrieval.
- **Reasoning Pipeline Flow**: Interactive status monitoring tracking incident triage from capture to deploy.
- **Enter Pro Hotfix Deployments**: Autonomous surgical unified diff patching and rolling container builds.
- **One-Click Safe Rollback**: Instantly revert active patches to restore original service code stability.
- **Cyber-NOC Operations Dashboard**: A high-end dark luxury telemetry interface built for mission control operators.

---

## 🚀 Quick Start (Installation)

### 1. Clone Repository
```bash
git clone https://github.com/VekariaDharmesh/Zero-Sync-Debugger-.git
cd Zero-Sync-Debugger-
```

### 2. Configure Environment Variables
Create a `.env` configuration file in the `backend` folder:
```bash
cd backend
cp .env.example .env
# Populate ANTHROPIC_API_KEY, PARCLE_API_KEY, and ENTER_PRO credentials
```

### 3. Initialize Virtual Environment
#### Linux / macOS
```bash
python3 -m venv venv
source venv/bin/activate
```
#### Windows
```bash
python -m venv venv
.\venv\Scripts\activate
```

### 4. Install Dependencies
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

### 5. Start Application Nodes

#### Node A – Launch Buggy Demo App (Express App target)
```bash
cd demo/buggy_app
npm install
node index.js
```

#### Node B – Start FastAPI Backend Server
```bash
cd ../..
venv/bin/uvicorn main:app --reload --port 8000
```

#### Node C – Start React Frontend Client Dashboard
```bash
cd ../frontend
npm install
npm run dev
```

Open `http://localhost:5173` to access the Cyber-NOC mission control room.

---

## 📂 Project Structure
```markdown
Zero-Sync-Debugger-/
│
├── backend/
│   ├── main.py                 # FastAPI Application Server Entrypoint
│   ├── config.py               # Credentials & environment configurations
│   ├── requirements.txt        # Python backend dependencies
│   │
│   ├── agent/
│   │   ├── pipeline.py         # Autonomous workflow orchestrator & SSE broadcaster
│   │   ├── reasoner.py         # Claude-3.5-Sonnet patch reasoning service
│   │   ├── patcher.py          # Unified diff parser & dry-run validator
│   │   └── deployer.py         # Enter Pro API integration & target server patch applier
│   │
│   ├── services/
│   │   └── parcle_service.py   # Parcle client user provisioning, dialog ingest, & search
│   │
│   ├── memory/
│   │   ├── parcle_client.py    # Memory endpoint routes (rollbacks, history ledger)
│   │   └── schemas.py          # Pydantic schemas (ErrorRecords, FixRecords)
│   │
│   ├── ingest/
│   │   ├── custom_logger.py    # Custom agent exception receiver webhook
│   │   └── sentry_webhook.py   # Sentry incident ingestion route
│   │
│   ├── streams/
│   │   └── sse.py              # Server-Sent Events subscription hub
│   │
│   └── demo/
│       └── buggy_app/          # Target node server simulating real-time outages
│
└── frontend/
    ├── src/
    │   ├── App.tsx             # Cyber-NOC React Dashboard UI Component
    │   ├── hooks/
    │   │   ├── useAgentState.js # SSE event state pipeline parser
    │   │   └── useEventStream.js# EventSource connection lifecycle hook
    │   └── components/         # Premium modular UI widgets (PatchViewer, ErrorFeed)
    │
    ├── package.json            # Vite frontend node dependencies
    └── vite.config.ts          # Vite build config
```

---

## 🛠️ Full Setup Guide
### Requirements
- **Runtime Environment**: Python 3.10+, Node.js 18+
- **API Access**: 
  - Anthropic API Key (Claude-3.5 reasoning context)
  - Parcle API Key (Long-term vector memory layer)
  - Enter Pro Credentials (Production deployment orchestrator)

---

## 🔧 Typical Usage

### 1. Simulating Outages
- In the dashboard top bar, click **"Simulate Outage"** or trigger individual error endpoints manually.
- The target server will throw an exception, immediately feeding it into the Sentry ingestion webhook.

### 2. Monitoring Reasoning Pipelines
- Follow the active reasoning nodes: **Captured → Query Memory → Match Score → Diagnosed → Patch Output → Validated → Deploying → Recovered**.
- Observe the **Memory Influence Analyzer** calculating confidence rating improvements.

### 3. Reviewing Memory Diffs
- Head over to the **Memory Lifecycle** or **Engineering Journal** tabs.
- Analyze the vector write logs, similarity metrics, and historical document citations.

---

## ⚠️ Notes & Limitations
- **API Fallback Mode**: If valid credentials are not supplied, the platform falls back to a local simulation cache so core interface functionality is unaffected.
- **Rollback Window**: rollbacks restore the target directory index files to their clean, unpatched backups stored prior to deployment.

---

## 🛠️ Troubleshooting
| Problem | Solution |
| :--- | :--- |
| **Parcle SDK connection errors** | Ensure `PARCLE_API_KEY` is loaded in `.env` and contains correct permissions. |
| **Port Conflicts** | Make sure ports `8000` (FastAPI), `3001` (Express App), and `5173` (Vite Dashboard) are not occupied. |
| **SSE Logs Disconnected** | Verify the backend server is running and accessible at `http://localhost:8000`. |
| **Empty Memory Stream** | Run the simulation sequence to populate Parcle ledger namespaces. |

---

## 🔮 Future Improvements
- Multi-service telemetry tracking of distributed microservices.
- Automatic recovery validation using isolated production-preview testing containers.
- ChatOps integrations for Slack and Discord status reporting alerts.

---

## 📄 License
MIT License — Free to use, modify, and distribute for operations research and infrastructure safety.

---

## ❤️ Contributing
Pull requests are welcome for:
- Improved computer science exception parsers.
- Enhanced vector clustering algorithms.
- Custom NOC dashboard widgets.

---

## 👨💻 Author
**Dharmesh Vekaria & Team Meridian**
Gandhinagar, Gujarat · 2026

*Focused on national infrastructure safety & modern AI-driven threat detection.*

🛡️ **Zero-Sync · Recover Faster.**
