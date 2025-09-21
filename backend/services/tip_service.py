# services/tip_service.py
import functools, httpx, os
from dotenv import load_dotenv 

load_dotenv() 

ENDPOINT = "https://api.openai.com/v1/chat/completions"
MODEL    = "gpt-4o-mini"
KEY      = os.getenv("OPENAI_API_KEY")

if not KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

@functools.lru_cache(maxsize=2048)
def get_tips(gene: str, disease: str) -> list[str]:
    prompt = (
        f"Give two succinct, evidence-backed lifestyle changes that can "
        f"lower the risk of {disease} for someone carrying variants in {gene}. "
        f"Be non-prescriptive and cite generic sources (e.g., WHO, CDC)."
    )
    headers = {"Authorization": f"Bearer {KEY}"}
    body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 0.5,
        "max_tokens": 10000,
    }
    resp = httpx.post(ENDPOINT, json=body, headers=headers, timeout=20)
    resp.raise_for_status()
    text = resp.json()["choices"][0]["message"]["content"]
    return [s.strip("• ") for s in text.split("\n") if s.strip()]