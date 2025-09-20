# tools/convert_adagio.py
import pandas as pd
import pathlib, mygene
import yaml

mg = mygene.MyGeneInfo()
DATA_DIR = pathlib.Path(__file__).resolve().parent.parent / "data"

"""
TIPS = yaml.safe_load(open(DATA_DIR / "tips.yaml"))

def get_tips(disease: str, gene: str) -> list[str]:
    dis_block = TIPS.get(disease, {})
    return dis_block.get(gene, dis_block.get("default", []))
"""

def ensp_to_symbol(ensps):
    """Return {clean_ENSP: HGNC_symbol} dict."""
    out = mg.querymany(
        ensps,
        scopes="ensemblprotein",       # preferred scope
        fields="symbol",
        species="human",
        returnall=False,
        verbose=False,
        notfound='ignore'
    )
    return {hit['query']: hit.get('symbol') for hit in out if 'symbol' in hit}

diseases = [
    "alzheimers", "CHD", "hypertension", "multiple_sclerosis",
    "obesity", "parkinsons", "stroke", "T1D", "T2D",
    "rheumatoid_arthritis"
]

for disease in diseases:
    # 1) read raw ADAGIO file
    df = pd.read_csv(
        DATA_DIR / f"adagio_{disease}.out",
        sep="\t", names=["ensp_raw", "risk"]
    )

    # 2) strip '9606.' prefix → new column
    df["ensp"] = df["ensp_raw"].str.split(".", n=1).str[-1]

    # 3) build mapping on cleaned IDs
    mapping = ensp_to_symbol(df["ensp"].unique().tolist())

    # 4) map → gene symbol column
    df["gene"] = df["ensp"].map(mapping)
    df.dropna(subset=["gene"], inplace=True)

    # 5) keep symbol + risk, sort, top 500
    tidy = (
    df[["gene", "risk"]]
      .sort_values("risk", ascending=False)
      .drop_duplicates("gene", keep="first")   # keep top score per gene
      .head(500)
      .set_index("gene")
    )
    tidy["rank"] = tidy["risk"].rank(method="first", ascending=False).astype(int)

    """
    tidy["tips"] = tidy["gene"].apply(lambda g: get_tips(disease, g))
    """

    # 6) write JSON next to other data files
    tidy.to_json(
        DATA_DIR / f"adagio_{disease}.json",
        orient="index"          # {gene: {risk: 0.93}}
    )

    print(f"{disease}: saved {len(tidy)} genes")
