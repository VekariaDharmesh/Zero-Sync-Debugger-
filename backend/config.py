import os
from dotenv import load_dotenv

load_dotenv()

ANTHROPIC_API_KEY = os.environ.get("ANTHROPIC_API_KEY", "")
PARCLE_API_KEY = os.environ.get("PARCLE_API_KEY", "")
PARCLE_BASE_URL = os.environ.get("PARCLE_BASE_URL", "https://api.parcle.ai/v1")
ENTER_PRO_API_KEY = os.environ.get("ENTER_PRO_API_KEY", "")
ENTER_PRO_PROJECT_ID = os.environ.get("ENTER_PRO_PROJECT_ID", "")
ENTER_PRO_BASE_URL = os.environ.get("ENTER_PRO_BASE_URL", "https://api.enterapp.pro/v1")
SENTRY_WEBHOOK_SECRET = os.environ.get("SENTRY_WEBHOOK_SECRET", "")
PORT = int(os.environ.get("PORT", 8000))
