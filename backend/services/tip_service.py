import functools, httpx, os, random, datetime
from dotenv import load_dotenv

load_dotenv()

ENDPOINT = "https://api.openai.com/v1/chat/completions"
MODEL = "gpt-4o-mini"
KEY = os.getenv("OPENAI_API_KEY")
if not KEY:
    raise RuntimeError("OPENAI_API_KEY not set")

@functools.lru_cache(maxsize=2048)
def get_tips(gene: str, disease: str) -> list[str]:
    # Random seed so same gene/disease can vary day-to-day but still cached daily
    seed = datetime.date.today().isoformat()
    prompt = (
        f"You are a health scientist.\n"
        f"Today is {seed}. Give **exactly two** concise, evidence-based lifestyle "
        f"actions that could reduce {disease} risk **specifically for carriers of {gene} variants**. "
        f"Reference the biological pathway or mechanism if known. "
        f"Don’t repeat phrases like 'Regular physical activity' more than once across runs. "
        f"Label them 1. and 2. and cite authoritative orgs (WHO, NIH, CDC) in parentheses."
    )

    headers = {"Authorization": f"Bearer {KEY}"}
    body = {
        "model": MODEL,
        "messages": [{"role": "user", "content": prompt}],
        "temperature": 1.1,     # more variety
        "top_p": 0.9,
        "max_tokens": 256,
    }
    resp = httpx.post(ENDPOINT, json=body, headers=headers, timeout=20)
    resp.raise_for_status()
    text = resp.json()["choices"][0]["message"]["content"]

    # simple post-shuffle to mix order
    lines = [s.strip("• ").strip() for s in text.split("\n") if s.strip()]
    # random.shuffle(lines)
    return lines[:2]  # guarantee exactly two
