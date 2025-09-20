# services/genome_parser.py
import pandas as pd
from io import BytesIO
import requests, time

MYVARIANT_URL = "https://myvariant.info/v1/query"
FIELDS        = "gene.symbol,dbsnp.gene.symbol"
CHUNK_SIZE    = 200

def _symbol_from_hit(hit: dict) -> str | None:
    """Return the gene symbol from a MyVariant hit dict, or None."""
    if (s := hit.get("gene", {}).get("symbol")):
        return s
    # dbSNP path can be dict or list depending on record
    g = hit.get("dbsnp", {}).get("gene")
    if isinstance(g, dict):
        return g.get("symbol")
    if isinstance(g, list) and g:
        return g[0].get("symbol")
    return None

def parse_genome_file(raw_bytes: bytes, max_rsids: int = 500) -> set[str]:
    """Return HGNC symbols found in a 23andMe / Ancestry TXT file."""
    df = pd.read_csv(
        BytesIO(raw_bytes),
        sep=r"\s+",              # ← split on one or more whitespace chars
        comment="#",
        names=["rsid", "chrom", "pos", "genotype"],
        usecols=["rsid"],
        engine="python",         # regex separator needs the python engine
    )
    rsids = df["rsid"].head(max_rsids).tolist()
    genes = set()

    for rsid in rsids[:max_rsids]:
        resp = requests.get(
            MYVARIANT_URL,
            params={
                "q": rsid,
                "scopes": "dbsnp.rsid",
                "fields": FIELDS,
                "species": "human",
                "size": 1,
            },
            timeout=10,
        )
        if resp.ok and resp.json().get("hits"):
            if sym := _symbol_from_hit(resp.json()["hits"][0]):
                genes.add(sym.upper())

        time.sleep(0.1)  # be polite to the API

    """
    for i in range(0, len(rsids), CHUNK_SIZE):
        chunk = ",".join(rsids[i : i + CHUNK_SIZE])

        resp = requests.get(
            MYVARIANT_URL,
            params={
                "q": chunk,              # ★ use 'q', not 'ids'
                "scopes": "dbsnp.rsid",  # matches rsXXXX style
                "fields": FIELDS,
                "species": "human",
                "size": CHUNK_SIZE,
            },
            timeout=10,
        )
        if not resp.ok:
            print("HTTP error:", resp.status_code, resp.text)
            continue
        if not resp.json().get("hits"):
            print("Empty hits for chunk:", chunk[:50], "…")
            continue

        for hit in resp.json().get("hits", []):
            if sym := _symbol_from_hit(hit):
                genes.add(sym.upper())
    """
    print(genes)
    return genes
