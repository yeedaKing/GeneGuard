# services/annotate.py
from typing import Optional, Dict, Iterable
from myvariant import MyVariantInfo
import requests

VEP_ENDPOINT = "https://rest.ensembl.org/vep/human/region"
FIELDS = "gene.symbol,dbsnp.gene.symbol,snpeff.ann.impact"

def vep_batch(hgvs_list: Iterable[str]):
    """
    POST up to ~200 'chr:pos ref/alt' strings and return Ensembl VEP JSON.
    """
    headers = {"Content-Type": "text/plain", "Accept": "application/json"}
    body = "\n".join(hgvs_list)
    resp = requests.post(VEP_ENDPOINT, data=body, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()

def _gene_symbol_from_hit(hit: dict) -> Optional[str]:
    """Extract a gene symbol from a MyVariant record (hit or flattened)."""
    if (s := hit.get("gene", {}).get("symbol")):
        return s

    g = hit.get("dbsnp", {}).get("gene")
    if isinstance(g, dict):
        return g.get("symbol")

    if isinstance(g, list) and g:
        return g[0].get("symbol")

    return None

def _impact_from_hit(hit: dict) -> Optional[str]:
    """
    Extract snpEff impact. snpeff.ann can be:
      - a list[dict], prefer the first entry
      - occasionally a dict (rare)
    """
    ann = hit.get("snpeff", {}).get("ann")
    if isinstance(ann, list) and ann:
        if isinstance(ann[0], dict):
            return ann[0].get("impact")

    elif isinstance(ann, dict):
        return ann.get("impact")

    return None

def annotate_variants(variants) -> Dict[str, Dict[str, Optional[str]]]:
    """
    Return {rsid: {'gene': str, 'impact': Optional[str]}}.

    Notes:
      - Uses MyVariant's querymany for batching (fast, no manual sleeps).
      - De-duplicates rsIDs and upper-cases gene symbols like before.
      - Keys the result by the variant's rsID (input), not MyVariant _id.
    """
    # Collect unique, valid rsIDs from the variant objects
    by_rsid = {v.rsid: v for v in variants if getattr(v, "rsid", None) and v.rsid != "."}
    rsids = [r for r in by_rsid.keys() if isinstance(r, str) and r.startswith("rs")]
    if not rsids:
        return {}

    mv = MyVariantInfo()
    # querymany returns a list of dicts; preserves input order as much as possible
    out = mv.querymany(
        rsids,
        scopes="dbsnp.rsid",
        fields=FIELDS,
        species="human",
        returnall=False,
        as_dataframe=False,
        verbose=False,
        size=1,  # one top hit per rsID
    )

    ann: Dict[str, Dict[str, Optional[str]]] = {}
    for res in out:
        # For each input query, MyVariant returns either flattened fields or a 'hits' list
        record = res["hits"][0] if ("hits" in res and res["hits"]) else res
        gene = _gene_symbol_from_hit(record)
        impact = _impact_from_hit(record)

        # Prefer the original input rsID as the key (res['query']); fall back to _id if missing
        key = res.get("query") or record.get("_id")
        if not key:
            continue

        if gene:
            ann[key] = {"gene": gene.upper(), "impact": impact}

    return ann
