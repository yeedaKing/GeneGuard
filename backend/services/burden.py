# services/burden.py
from collections import Counter, defaultdict

IMPACT_WEIGHT = {"HIGH": 3, "MODERATE": 2, "LOW": 1, None: 0}

def burden_scores(annotation_dict, severe_only=False):
    """
    Input: {rsid: {'gene': str, 'impact': str}}
    Output: Counter({gene: score})
    """
    gene_scores = defaultdict(int)
    for info in annotation_dict.values():
        impact = info["impact"]
        if severe_only and impact not in {"HIGH", "MODERATE"}:
            continue
        gene_scores[info["gene"]] += IMPACT_WEIGHT[impact]
    return Counter(gene_scores)
