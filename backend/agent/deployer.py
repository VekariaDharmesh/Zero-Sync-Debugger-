import httpx
import os
import subprocess
import tempfile
from config import ENTER_PRO_API_KEY, ENTER_PRO_PROJECT_ID, ENTER_PRO_BASE_URL

async def deploy_patch(patch_diff: str, fix_summary: str, affected_file: str) -> dict:
    # First: Apply the patch locally so that the local running Express app gets fixed
    base_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "demo", "buggy_app"))
    local_success = False
    local_msg = ""
    
    if os.path.exists(base_dir) and os.path.exists(os.path.join(base_dir, affected_file)):
        with tempfile.NamedTemporaryFile(mode="w", suffix=".patch", delete=False) as f:
            f.write(patch_diff)
            patch_file = f.name
        try:
            # Apply the patch file to buggy app files
            result = subprocess.run(
                ["patch", "-p1", "-i", patch_file],
                cwd=base_dir,
                capture_output=True,
                text=True,
                timeout=10,
            )
            local_success = result.returncode == 0
            local_msg = result.stdout if local_success else result.stderr
        except Exception as e:
            local_msg = str(e)
        finally:
            if os.path.exists(patch_file):
                os.unlink(patch_file)

    # Second: Hit Enter Pro API if key is available
    if not ENTER_PRO_API_KEY or not ENTER_PRO_PROJECT_ID:
        # Fallback simulated response
        return {
            "status": "deployed",
            "deploy_url": "http://localhost:3001",
            "local_applied": local_success,
            "local_msg": local_msg
        }

    HEADERS = {
        "Authorization": f"Bearer {ENTER_PRO_API_KEY}",
        "Content-Type": "application/json",
    }
    
    async with httpx.AsyncClient(timeout=60.0) as client:
        response = await client.post(
            f"{ENTER_PRO_BASE_URL}/projects/{ENTER_PRO_PROJECT_ID}/apply-patch",
            headers=HEADERS,
            json={
                "patch": patch_diff,
                "commit_message": fix_summary,
                "affected_file": affected_file,
                "auto_deploy": True,
            },
        )
        response.raise_for_status()
        res_data = response.json()
        res_data["local_applied"] = local_success
        return res_data
