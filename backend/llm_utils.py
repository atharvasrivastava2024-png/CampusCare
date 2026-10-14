import os
from groq import Groq
from dotenv import load_dotenv

# Resolve the project's backend .env regardless of the directory from which
# uvicorn is launched.
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
def client():
    key = os.getenv("GROQ_API_KEY")
    if not key: raise RuntimeError("GROQ_API_KEY is not configured")
    return Groq(api_key=key)
def model(): return os.getenv("GROQ_MODEL", "openai/gpt-oss-120b")
