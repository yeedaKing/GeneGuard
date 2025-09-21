# services/risk_annotator.py
import numpy as np
import pandas as pd
from .adagio_loader import load_risk_table
from services.tip_service import get_tips

def annotate_risks(disease: str, user_genes: set[str]):
    """
    Return list[dict] rows ready for JSON, with levels defined by rank:
        -Top   100 → High
        -Next  200 → Medium
        -Next  200 → Low
    """
    table = load_risk_table(disease)
    if table.empty:
        return []

    # keep only user genes
    hits = table.loc[table.index.intersection(user_genes)].copy()
    if hits.empty:
        return []

    # sort by risk DESC so rank 0 = highest
    hits.sort_values("risk", ascending=False, inplace=True)
    hits.reset_index(inplace=True) # index column becomes 'index'
    hits.rename(columns={"index": "gene"}, inplace=True)

    # rank-based level assignment
    n = len(hits)
    ranks = np.arange(n)        # 0, 1, 2, …
    level = np.full(n, "Low", dtype=object)   # default Low
    level[ranks < 300] = "Medium"
    level[ranks < 100] = "High"
    hits["level"] = level

    # attach tips
    hits["tips"] = hits.apply(lambda r: get_tips(r["gene"], disease), axis=1)

    return hits.to_dict(orient="records")