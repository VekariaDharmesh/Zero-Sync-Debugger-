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

## Parcle SDK Integration

Zero-Sync Debugger initializes the official Parcle SDK to manage long-term engineering memory state. Check the centralized implementation in [parcle_service.py](file:///Users/vekariadharmeshh/Desktop/Quackathon/backend/services/parcle_service.py).

### Initializing Parcle Client
```python
from parcle import Parcle

# Initialize the Parcle client using the API key
client = Parcle(api_key=os.getenv("PARCLE_API_KEY"))

# Create or reuse the zero_sync user on startup
try:
    client.create_user(user_id="zero_sync", name="Zero-Sync Debugger Operator")
except Exception as e:
    # Gracefully handles existing profiles (e.g. 409 Conflict)
    pass
```

### Ingesting Dialog (Incident Resolution)
When a hotfix patch is successfully deployed, Zero-Sync records the incident state in Parcle memory using `ingest_dialog()`:
```python
messages = [
    {"role": "user", "content": "TypeError: Cannot read property 'name' of undefined..."},
    {"role": "assistant", "content": "Root Cause: Null lookup\nFix: Added guard...\nConfidence: 94\nDeployment: Success"}
]
res = client.ingest_dialog(user_id="zero_sync", messages=messages)
```

### Querying Memory
Before Claude 3.5 Sonnet generates a fix, the pipeline queries past incident fixes using `search()`:
```python
# Returns similar memories, confidence scores, and documents citations
res = client.search(user_id="zero_sync", query=error_query)
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
