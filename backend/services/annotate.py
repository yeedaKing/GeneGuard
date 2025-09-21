# services/annotate.py
import requests, json, itertools, time
from tqdm import tqdm

MYVARIANT = "https://myvariant.info/v1/query"
CHUNK = 200  # ≤1000 ids per call :contentReference[oaicite:3]{index=3}

VEP_ENDPOINT = "https://rest.ensembl.org/vep/human/region"

def vep_batch(hgvs_list):
    """
    POST up to 200 'chr:pos ref/alt' strings and return Ensembl VEP JSON.
    """
    headers = {"Content-Type": "text/plain", "Accept": "application/json"}
    body    = "\n".join(hgvs_list)
    resp    = requests.post(VEP_ENDPOINT, body, headers=headers, timeout=30)
    resp.raise_for_status()
    return resp.json()

def annotate_variants(variants):
    """Return {rsid: {'gene': str, 'impact': str}} dict."""

    by_rsid = {v.rsid: v for v in variants if v.rsid and v.rsid != "."}
    rsids = list(by_rsid.keys())
    ann = {}

    """ SLOW - SWITCH TO CHUNKS LATER IF POSSIBLE FOR SCALABILITY """
    for rsid in tqdm(rsids, desc="MyVariant (1-by-1)"):
        resp = requests.get(
            MYVARIANT,
            params={
                "q": rsid,
                "scopes": "dbsnp.rsid",
                "fields": "gene.symbol,dbsnp.gene.symbol,snpeff.ann.impact",
                "size": 1,          # one result is enough for a single rsID
            },
            timeout=10,
        )
        if not resp.ok or not resp.json().get("hits"):
            continue  # skip if no match or HTTP error
        hit = resp.json()["hits"][0]

        gene = (
            hit.get("gene", {}).get("symbol")
            or hit.get("dbsnp", {}).get("gene", {}).get("symbol")
        )
        impact = (
            hit.get("snpeff", {})
            .get("ann", [{}])[0]
            .get("impact")
        )
        if gene:
            ann[hit["_id"]] = {"gene": gene.upper(), "impact": impact}

        time.sleep(0.1)  # polite pacing for 1-by-1 calls


    """
    for i in tqdm(range(0, len(rsids), CHUNK), desc="MyVariant"):
        chunk = ",".join(rsids[i:i+CHUNK])
        resp = requests.get(
            MYVARIANT,
            params={
                "q": chunk,
                "scopes": "dbsnp.rsid",
                "fields": "gene.symbol,dbsnp.gene.symbol,snpeff.ann.impact",
                "size": CHUNK,
            },
            timeout=20,
        )
        resp.raise_for_status()
        for hit in resp.json().get("hits", []):
            gene = (
                hit.get("gene" , {}).get("symbol")
                or hit.get("dbsnp", {}).get("gene", {}).get("symbol")
            )
            impact = (
                hit.get("snpeff", {})
                   .get("ann", [{}])[0]
                   .get("impact")
            )  # HIGH / MODERATE / LOW / MODIFIER
            if gene:
                ann[hit["_id"]] = {"gene": gene.upper(), "impact": impact}
        time.sleep(0.2)  # polite pacing
    """

    return ann
