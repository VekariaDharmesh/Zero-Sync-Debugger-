import asyncio
import httpx
from config import PARCLE_API_KEY, PARCLE_BASE_URL

HEADERS = {
    "Authorization": f"Bearer {PARCLE_API_KEY}",
    "Content-Type": "application/json",
}

SEED_DATA = [
    {
        "content": (
            "ERROR TYPE: TypeError\n"
            "MESSAGE: Cannot read properties of undefined (reading 'name')\n"
            "FILE: routes/users.js:42\n"
            "FIX SUMMARY: Added null guard before accessing user properties after find() call\n"
            "PATCH:\n"
            "--- a/routes/users.js\n"
            "+++ b/routes/users.js\n"
            "@@ -40,3 +40,6 @@\n"
            " const user = db.users.find(u => u.id === id);\n"
            "-res.json({ name: user.name });\n"
            "+if (!user) return res.status(404).json({ error: 'User not found' });\n"
            "+res.json({ name: user.name });\n"
            "OUTCOME: success"
        ),
        "namespace": "bug-fixes",
        "metadata": {"error_type": "TypeError", "outcome": "success"},
    },
    {
        "content": (
            "ERROR TYPE: RangeError\n"
            "MESSAGE: Division by zero produces Infinity\n"
            "FILE: services/pricing.js:18\n"
            "FIX SUMMARY: Added guard for zero denominator before division operation\n"
            "PATCH:\n"
            "--- a/services/pricing.js\n"
            "+++ b/services/pricing.js\n"
            "@@ -16,3 +16,4 @@\n"
            " function calculateFee(amount) {\n"
            "+  if (amount === 0) return 0;\n"
            "   return BASE_FEE / amount;\n"
            " }\n"
            "OUTCOME: success"
        ),
        "namespace": "bug-fixes",
        "metadata": {"error_type": "RangeError", "outcome": "success"},
    },
]

async def seed():
    if not PARCLE_API_KEY:
        print("PARCLE_API_KEY not found. Skipping seeding remote Parcle API; local in-memory storage already pre-seeded.")
        return

    async with httpx.AsyncClient() as client:
        for record in SEED_DATA:
            try:
                r = await client.post(
                    f"{PARCLE_BASE_URL}/memory/store",
                    headers=HEADERS,
                    json=record,
                )
                print(f"Seeded: {r.status_code} — {record['metadata']['error_type']}")
            except Exception as e:
                print(f"Failed to seed {record['metadata']['error_type']}: {e}")

if __name__ == "__main__":
    import os
    import sys
    # Add parent directory to path so config is importable
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))
    from config import PARCLE_API_KEY, PARCLE_BASE_URL
    asyncio.run(seed())
