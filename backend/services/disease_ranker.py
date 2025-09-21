"""
Quick utility: score every disease table against a user's gene set and
return the top-N highest-risk diseases.
"""
from .adagio_loader import load_risk_table
from .risk_annotator import annotate_risks

SUPPORTED_DISEASES = ["alzheimers", "CHD", "hypertension", "multiple_sclerosis", "obesity",
                        "parkinsons", "stroke", "T1D", "T2D", "rheumatoid_arthritis"]

def disease_scores(user_genes: set[str], top_n: int = 3):
    """
    Returns list[dict]:
        [{disease, score, risks:[…]}, …] sorted high to low.
    Scoring = sum of ADAGIO risk for matching genes.
    """
    results = []
    for dis in SUPPORTED_DISEASES:
        table = load_risk_table(dis)
        if table.empty:
            continue
        matches = table.loc[table.index.intersection(user_genes)]
        if matches.empty:
            continue
        score = matches["risk"].sum()
        risks  = annotate_risks(dis, user_genes)   # respects High/Med/Low
        results.append({"disease": dis,
                        "score": round(float(score), 6),
                        "risks": risks})
                        
    # sort and slice
    return sorted(results, key=lambda x: x["score"], reverse=True)[:top_n]
