"""
Generate demo TXT and VCF files for each disease.

-TXT  : 150 rows, tab-separated  (rsid chrom pos genotype)
-VCF  : 300 rows, bgzip-compressed, minimal header

Create TXT + VCF samples for every disease JSON in backend/data:
    python sample_file_generator.py  --all

Or one disease only:
    python sample_file_generator.py  --disease alzheimers
"""

import argparse, random, gzip, json, pathlib, time, requests
import pandas as pd
from collections import defaultdict

ROOT      = pathlib.Path(__file__).resolve().parents[1]
DATA_DIR  = ROOT / "data"
TXT_DIR   = ROOT / "samples" / "txt"
VCF_DIR   = ROOT / "samples" / "vcf"

TXT_DIR.mkdir(parents=True, exist_ok=True)
VCF_DIR.mkdir(parents=True, exist_ok=True)

MYVARIANT = "https://myvariant.info/v1/query"

def load_table(disease):
    fp = DATA_DIR / f"adagio_{disease}.json"
    return pd.read_json(fp, orient="index")  # index = gene

def choose_genes(df):
    hi = df[df["rank"] < 100].sample(15, replace=True).index
    md = df[(df["rank"] >= 100) & (df["rank"] < 300)].sample(15, replace=True).index
    lo = df[(df["rank"] >= 300) & (df["rank"] < 500)].sample(20, replace=True).index
    return list(hi) + list(md) + list(lo)   # total 50

def rsid_for_gene(symbol):
    """Return a single rsID for a gene symbol, else None."""
    try:
        resp = requests.get(
            MYVARIANT,
            params={
                "q": symbol,
                "scopes": "gene.symbol",
                "fields": "dbsnp.rsid,chrom,pos",
                "species": "human",
                "size": 1,
            },
            timeout=10,
        )
        hit = resp.json().get("hits", [{}])[0]
        rsid = hit.get("dbsnp", {}).get("rsid")
        chrom = hit.get("chrom") or hit.get("chr") or "1"
        pos = hit.get("pos") or hit.get("hg19", {}).get("start") or random.randint(1_000_000,9_000_000)
        return rsid, chrom, pos

    except Exception:
        return None

def write_txt(disease, rows):
    out = TXT_DIR / f"sample_{disease}.txt"
    with out.open("w") as f:
        f.write("# rsid\tchrom\tpos\tgenotype\n")
        for r in rows:
            f.write(f"{r['rsid']}\t{r['chrom']}\t{r['pos']}\t{r['gt']}\n")

def write_vcf(disease, rows):
    header = ("##fileformat=VCFv4.2\n"
              f"##source=GeneGuardDemo\n"
              "#CHROM\tPOS\tID\tREF\tALT\tQUAL\tFILTER\tINFO\tFORMAT\tSAMPLE\n")

    out = gzip.open(VCF_DIR / f"sample_{disease}.vcf.gz", "wt")
    out.write(header)
    for r in rows:
        out.write(f"{r['chrom']}\t{r['pos']}\t{r['rsid']}\t{r['ref']}\t{r['alt']}\t.\tPASS\t.\tGT\t{r['gt']}\n")

    out.close()

def random_rsid():
    return f"rs{random.randint(1_000_000, 9_999_999)}"

def make_samples(disease):
    df = load_table(disease)
    genes = choose_genes(df)

    rows = []
    seen = set()

    # gene-linked variants (up to 50)
    for g in genes:
        tup = rsid_for_gene(g)
        if tup and tup[0] not in seen:
            rsid, chrom, pos = tup
            rows.append({
                "rsid": rsid,
                "chrom": chrom,
                "pos":  pos,
                "ref": random.choice(list("ACGT")),
                "alt": random.choice(list("ACGT")),
                "gt" : random.choice(["0/0","0/1","1/1"]),
            })
            seen.add(rsid)
            time.sleep(0.1)   # polite pacing

    # pad to 150 / 300 with random rsIDs
    while len(rows) < 300:
        rsid = random_rsid()
        if rsid in seen: continue
        rows.append({
            "rsid": rsid,
            "chrom": random.randint(1,22),
            "pos": random.randint(1_000_000, 200_000_000),
            "ref": random.choice(list("ACGT")),
            "alt": random.choice(list("ACGT")),
            "gt" : random.choice(["0/0","0/1","1/1"]),
        })
        seen.add(rsid)

    random.shuffle(rows)
    write_txt(disease, rows[:150])
    write_vcf(disease, rows)

    print(f"{disease}: wrote TXT(150) and VCF(300)")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument("--disease", help="one disease (stem of adagio_*.json)")
    p.add_argument("--all", action="store_true", help="generate for every JSON file")
    args = p.parse_args()

    if args.all:
        diseases = [f.stem.split("adagio_")[1] for f in DATA_DIR.glob("adagio_*.json")]

    elif args.disease:
        diseases = [args.disease]

    else:
        p.error("pass --disease name or --all")

    for d in diseases:
        make_samples(d)
