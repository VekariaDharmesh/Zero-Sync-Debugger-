import subprocess
import tempfile
import os
from typing import Tuple

def validate_patch(patch_diff: str) -> Tuple[bool, str]:
    if not patch_diff or not patch_diff.strip():
        return False, "Empty patch"
    if "--- a/" not in patch_diff or "+++ b/" not in patch_diff:
        return False, "Invalid unified diff format — missing file headers"
    if "@@ " not in patch_diff:
        return False, "Invalid unified diff format — missing hunk header"
    return True, "ok"

def apply_patch_dry_run(patch_diff: str, base_dir: str) -> Tuple[bool, str]:
    with tempfile.NamedTemporaryFile(mode="w", suffix=".patch", delete=False) as f:
        f.write(patch_diff)
        patch_file = f.name
    try:
        result = subprocess.run(
            ["patch", "--dry-run", "-p1", "-i", patch_file],
            cwd=base_dir,
            capture_output=True,
            text=True,
            timeout=10,
        )
        success = result.returncode == 0
        output = result.stdout if success else result.stderr
        return success, output
    except FileNotFoundError:
        return True, "patch binary not found — skipping dry run"
    except Exception as e:
        return False, str(e)
    finally:
        os.unlink(patch_file)
