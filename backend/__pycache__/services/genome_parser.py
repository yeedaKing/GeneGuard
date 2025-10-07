# services/genome_parser.py
from myvariant import MyVariantInfo
import pandas as pd
from io import BytesIO
from typing import Optional

FIELDS = "gene.symbol,dbsnp.gene.symbol"

def _symbol_from_hit(hit: dict) -> Optional[str]:
    if (s := hit.get("gene", {}).get("symbol")):
        return s

    g = hit.get("dbsnp", {}).get("gene")
    if isinstance(g, dict):
        return g.get("symbol")

    if isinstance(g, list) and g:
        return g[0].get("symbol")

    return None

def parse_genome_file(raw_bytes: bytes, max_rsids: int = 500) -> set[str]:
    df = pd.read_csv(
        BytesIO(raw_bytes),
        sep=r"\s+",
        comment="#",
        names=["rsid", "chrom", "pos", "genotype"],
        usecols=["rsid"],
        engine="python",
    )
    rsids = [r for r in df["rsid"].astype(str).head(max_rsids).unique() if r.startswith("rs")]

    mv = MyVariantInfo()
    # querymany returns a list of per-query dicts; set as_dataframe=False to keep it simple
    out = mv.querymany(
        rsids,
        scopes="dbsnp.rsid",
        fields=FIELDS,
        species="human",
        returnall=False,
        as_dataframe=False,
        verbose=False,
        size=1,
    )

    genes = set()
    for res in out:
        # Client flattens top-level fields when possible; otherwise use hits
        if "hits" in res and res["hits"]:
            sym = _symbol_from_hit(res["hits"][0])

        else:
            # Sometimes fields appear at the top level
            sym = _symbol_from_hit(res)

        if sym:
            genes.add(sym.upper())
            
    return genes
