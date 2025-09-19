import json, pathlib, pandas as pd
DATA_DIR = pathlib.Path(__file__).resolve().parent.parent / "data"

def load_risk_table(disease: str) -> pd.DataFrame:
    fp = DATA_DIR / f"adagio_{disease}.json"
    with open(fp) as f:
        return pd.DataFrame.from_dict(json.load(f), orient="index")