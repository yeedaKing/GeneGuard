# services/disease_ranker.py
from __future__ import annotations
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Iterable, Optional
import os
import pandas as pd
from .adagio_loader import load_risk_table
from .risk_annotator import annotate_risks

SUPPORTED_DISEASES = [
    "alzheimers", "CHD", "hypertension", "multiple_sclerosis",
    "obesity", "parkinsons", "stroke", "T1D", "T2D", "rheumatoid_arthritis"
]

# Simple in-memory cache to avoid reloading JSON every call
_TABLE_CACHE: dict[str, pd.DataFrame] = {}

def _get_table(disease: str) -> pd.DataFrame:
    tbl = _TABLE_CACHE.get(disease)
    if tbl is None:
        tbl = load_risk_table(disease)
        _TABLE_CACHE[disease] = tbl
        
    return tbl

def _score_only(disease: str, user_genes: set[str]) -> Optional[dict]:
    """Return {'disease', 'score'} or None if no overlap."""
    table = _get_table(disease)
    if table.empty:
        return None

    # fast intersection using .isin
    mask = table.index.isin(user_genes)
    if not mask.any():
        return None

    score = float(table.loc[mask, "risk"].sum())
    if score <= 0.0:
        return None

    return {"disease": disease, "score": round(score, 6)}

def disease_scores(
        user_genes: set[str],
        top_n: int = 3,
        include_tips: bool = True,
        max_workers: Optional[int] = None,
    ) -> list[dict]:
    """
    Parallel scoring across all diseases.
    1) compute scores (no tips) in parallel
    2) annotate only top-N (optionally in parallel), returning:
       [{disease, score, risks:[…]}] sorted by score desc
    """
    if not user_genes:
        return []

    # I/O-bound (JSON load + small pandas ops) -> threads are fine
    if max_workers is None:
        # generous since we’re mostly I/O bound; cap to avoid oversubmitting
        max_workers = min(8, (os.cpu_count() or 2) * 4)

    scored: list[dict] = []
    with ThreadPoolExecutor(max_workers=max_workers) as ex:
        futs = {ex.submit(_score_only, dis, user_genes): dis for dis in SUPPORTED_DISEASES}
        for fut in as_completed(futs):
            res = fut.result()
            if res:
                scored.append(res)

    if not scored:
        return []

    # sort and take top-N
    scored.sort(key=lambda x: x["score"], reverse=True)
    top = scored[:top_n]

    # annotate just the top-N diseases
    # To keep latency low during demo, can set include_tips=False and
    # let the frontend fetch tips lazily per gene if desired.
    if include_tips:
        def _annotate(entry: dict) -> dict:
            disease = entry["disease"]
            risks = annotate_risks(disease, user_genes)  # function adds levels + tips
            return {**entry, "risks": risks}

        annotated: list[dict] = []
        with ThreadPoolExecutor(max_workers=min(len(top), max_workers)) as ex:
            futs = {ex.submit(_annotate, e): e["disease"] for e in top}
            for fut in as_completed(futs):
                annotated.append(fut.result())

        annotated.sort(key=lambda x: x["score"], reverse=True)
        return annotated

    # if don’t want tips here, still return consistent shape with empty risks
    for e in top:
        e["risks"] = []

    return top
