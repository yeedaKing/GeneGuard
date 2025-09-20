"""
from pathlib import Path
from services.genome_parser import parse_genome_file

raw = Path("sample_genome.txt").read_bytes()
print(raw.decode().splitlines()[-3:])          # last few lines, should include rs279858

genes = parse_genome_file(raw, max_rsids=500)
print("Genes set:", genes)
"""

import requests, pprint

FIELDS = "gene.symbol,dbsnp.gene.symbol"

resp = requests.get(
    "https://myvariant.info/v1/query",
    params={
        "q": "rs279858",
        "scopes": "dbsnp.rsid",
        "fields": FIELDS,
        "species": "human"
    },
    timeout=10,
)

data = resp.json()          # convert once
pprint.pprint(data)         # optional: inspect whole payload

print(data["hits"][0]["dbsnp"]["gene"]["symbol"])   # → 'GABRA2'
