# services/genome_parser.py
import pandas as pd
from io import BytesIO
import requests

MYVARIANT_URL = "https://myvariant.info/v1/query"

def parse_genome_file(raw_bytes: bytes, max_rsids: int = 500):
    """
    Parse 23andMe / Ancestry TXT into a set of gene symbols.
    Only uses first `max_rsids` to keep demo fast.
    """
    df = pd.read_csv(BytesIO(raw_bytes), sep='\t', comment='#',
                     names=['rsid', 'chrom', 'pos', 'genotype'],
                     usecols=['rsid'])
    rsids = df['rsid'].head(max_rsids).tolist()
    genes = set()

    # MyVariant lets up to 1000 ids per comma-sep query
    chunk_size = 200
    for i in range(0, len(rsids), chunk_size):
        chunk = ",".join(rsids[i:i+chunk_size])
        resp = requests.get(
            MYVARIANT_URL,
            params={"q": chunk, "fields": "gene.symbol", "scopes": "dbsnp.rsid"}
        )
        if resp.ok:
            for hit in resp.json()['hits']:
                sym = hit.get('gene', {}).get('symbol')
                if sym: genes.add(sym.upper())

    return genes


# in Python REPL
from pathlib import Path
raw = Path("sample_genome.txt").read_bytes()   # any small txt
print(parse_genome_file(raw))
