import functools, httpx, os, random, datetime, re
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
        f"Today is {seed}. Give exactly **five distinct, concise, and evidence-based lifestyle actions** "
        f"that could reduce {disease} risk specifically for carriers of {gene} variants.\n"
        f"Number them 1. to 5. without any introductory text or bullets. "
        f"Each recommendation should cite a known biological pathway or mechanism if applicable, "
        f"and include authoritative orgs (e.g., WHO, NIH, CDC) in parentheses.\n"
        f"Avoid generic repetition across tips (e.g., don’t say 'exercise regularly' more than once)."
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

    res = []
    for s in text.split("\n"):
        s = re.sub(r"^[•\-\d\. ]+\s*", "", s.strip())
        if s:
            res.append(s)

    random.shuffle(res)
    return res[:5]