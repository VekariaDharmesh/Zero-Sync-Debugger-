# Zero-Sync Debugger

Zero-Sync Debugger is an autonomous, stateful engineering teammate that intercepts application errors, references historical memory via Parcle, reasons on code repairs using Claude 3.5 Sonnet, and deploys surgical hotfixes through Enter Pro.

## How it works

Traditional AI coding assistants are stateless. Zero-Sync Debugger maintains long-term engineering memory using Parcle. When an error is received, the agent:
1. Queries Parcle for similar historical bugs and patches.
2. Incorporates retrieved memory context into Claude 3.5 Sonnet's reasoning space.
3. Generates a unified diff patch and performs dry-run validation.
4. Pauses for manual confirmation on medium/low confidence patches, or auto-deploys high confidence patches via Enter Pro.
5. Saves the fix results and outcome metrics back into Parcle memory.

## Tech Stack
- **Memory**: [Parcle](https://parcle.ai) (Stateful engineering memory layer)
- **Deployment**: [Enter Pro](https://enterapp.pro) (Autonomous Hotfix Execution)
- **Orchestration**: FastAPI (Python)
- **Dashboard**: React + Server-Sent Events (SSE)

## Running Locally

1. **Clone & Set up Environment**:
   ```bash
   cd backend
   cp .env.example .env
   # Populate API Keys in .env
   ```

2. **Initialize Python Environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Install and Start the Buggy Demo Server**:
   ```bash
   cd demo/buggy_app
   npm install
   node index.js
   ```

4. **Start the FastAPI Orchestrator**:
   ```bash
   cd ../..
   venv/bin/uvicorn main:app --reload --port 8000
   ```

5. **Start the React Frontend**:
   ```bash
   cd frontend
   npm install
   npm run dev
   ```

Open `http://localhost:5173` to access the live dashboard.

## Parcle Integration

Zero-Sync Debugger reads and writes memory to Parcle to continuously improve performance.
Check implementation in [parcle_client.py](file:///Users/vekariadharmeshh/Desktop/Quackathon/backend/memory/parcle_client.py).

### Memory Query Example
```python
async def query_similar_bugs(error: ErrorRecord, top_k: int = 5) -> List[MemoryHit]:
    query_text = f"{error.error_type}: {error.message}\n\nStack:\n{error.stack_trace}"
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.parcle.ai/v1/memory/query",
            headers={"Authorization": f"Bearer {PARCLE_API_KEY}"},
            json={"query": query_text, "top_k": top_k, "namespace": "bug-fixes"}
        )
        return [MemoryHit(**h) for h in response.json().get("results", [])]
```

## Enter Pro Integration

Patches are automatically applied and hot-deployed.
Check implementation in [deployer.py](file:///Users/vekariadharmeshh/Desktop/Quackathon/backend/agent/deployer.py).

```python
async def deploy_patch(patch_diff: str, fix_summary: str, affected_file: str) -> dict:
    async with httpx.AsyncClient() as client:
        response = await client.post(
            f"https://api.enterapp.pro/v1/projects/{ENTER_PRO_PROJECT_ID}/apply-patch",
            headers={"Authorization": f"Bearer {ENTER_PRO_API_KEY}"},
            json={
                "patch": patch_diff,
                "commit_message": fix_summary,
                "affected_file": affected_file,
                "auto_deploy": True,
            }
        )
        return response.json()
```

## Team
Team Meridian — Shlok Shah, Het Patel, Dharmesh Vekaria, Ayush Mistry
