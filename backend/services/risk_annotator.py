# services/risk_annotator.py
import pandas as pd
from .adagio_loader import load_risk_table

BINS  = [0, 0.7, 0.9, 1.01]
LABEL = ['Low', 'Medium', 'High']

def annotate_risks(disease: str, user_genes: set[str]):
    """Return list[dict] rows ready for JSON."""
    table = load_risk_table(disease)
    if table.empty: 
        return []

    # keep only user genes
    hits = table.loc[table.index.intersection(user_genes)].copy()
    if hits.empty: 
        return []

    hits['level'] = pd.cut(hits['risk'], bins=BINS, labels=LABEL)
    hits.reset_index(inplace=True)
    hits.rename(columns={'index': 'gene'}, inplace=True)
    return hits.to_dict(orient='records')
