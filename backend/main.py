# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pathlib import Path
import io, csv, tempfile, shutil, uuid, os

from services.disease_ranker import disease_scores
from services.genome_parser import parse_genome_file  # TXT handler
from services.vcf_reader import stream_variants     # VCF handler
from services.annotate import annotate_variants
from services.burden import burden_scores
from services.risk_annotator import annotate_risks

# Database imports
from sqlalchemy import create_engine, text 
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import QueuePool
from typing import Optional
from datetime import datetime
from dotenv import load_dotenv

from routes.database import get_db
from routes.database_routes import router as database_router, get_firebase_uid, log_action

TMPDIR = Path(tempfile.gettempdir())
SUPPORTED_DISEASES = ["alzheimers", "CHD", "hypertension", "multiple_sclerosis", "obesity",
                        "parkinsons", "stroke", "T1D", "T2D", "rheumatoid_arthritis"]

DISCLAIMER_TXT = (
    "Research-grade only; not a diagnostic tool. "
    "Consult a licensed genetic counselor before acting."
)

app = FastAPI(title="GeneGuard API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://geneguard.vercel.app", 
        "https://*.vercel.app",
        "http://localhost:3000"
    ],
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True,
    expose_headers=["*"]
)

app.include_router(database_router)

# utility
def _detect_handler(filename: str):
    if filename.endswith((".txt", ".tsv")):
        return "TXT"
    elif filename.endswith((".vcf", ".vcf.gz")):
        return "VCF"
    else:
        raise HTTPException(415, "Unsupported file type")

# bad in-mem store (swap for DB later) (i got rid of this)
# _USER_STORE: dict[str, dict] = {}
        
# routes
@app.get("/diseases")
def list_diseases():
    return {"diseases": SUPPORTED_DISEASES}

@app.post("/upload-genome")
async def upload_genome(
    background: BackgroundTasks,
    disease: str,
    file: UploadFile = File(...),
    max_records: int = 10_000,
    firebase_uid: Optional[str] = None, 
    db: Session = Depends(get_db)
):
    if disease not in SUPPORTED_DISEASES:
        raise HTTPException(400, "Unsupported disease")

    handler = _detect_handler(file.filename)

    # parse variants
    if handler == "TXT":
        raw = await file.read()
        genes = parse_genome_file(raw, max_rsids=max_records)
        # quick path: MyVariant already used inside parse_genome_file
        burden = None  # burden meaningless for TXT rsID only

    else:  # VCF
        # stream parse, annotate, collapse – avoid loading file fully
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp.flush()
            variants = stream_variants(tmp.name, max_records=max_records)
            ann      = annotate_variants(variants)
            burden   = burden_scores(ann, severe_only=False)
            genes    = set(burden.keys())

    # disease-risk mapping
    risks = annotate_risks(disease, burden or genes)
    analysis_id = str(uuid.uuid4())

    # persist for CSV route
    # user_id = str(uuid.uuid4())
    # _USER_STORE[user_id] = {
    #     "disease": disease,
    #     "filename": file.filename,
    #     "genes": list(genes),
    #     "risks": risks,
    # }
    
    if firebase_uid and db:
        try:
            user_id = get_firebase_uid(db, firebase_uid)
            
            save_query = text("""
                INSERT INTO genetic_analyses (id, user_id, disease, filename, gene_count)
                VALUES (:id, :user_id, :disease, :filename, :gene_count)
            """)
            db.execute(save_query, {
                "id": analysis_id, 
                "user_id": user_id, 
                "disease": disease, 
                "filename": file.filename,
                "gene_count": len(genes)
            })
            
            # save the risk results
            if risks:
                for risk in risks:
                    risk_id = str(uuid.uuid4())
                    risk_query = text(""" 
                        INSERT INTO risk_results (id, analysis_id, gene, risk_score, risk_level, rank)
                        VALUES (:id, :analysis_id, :gene, :risk_score, :risk_level, :rank)
                    """)
                    db.execute(risk_query, {
                        "id": risk_id, 
                        "analysis_id": analysis_id,
                        "gene": risk.get("gene"),
                        "risk_score": risk.get("risk"),
                        "risk_level": risk.get("level"),
                        "rank": risk.get("rank")
                    })
                    
                    if risk.get("tips"):
                        for idx, tip in enumerate(risk.get("tips", [])):
                            tip_query = text("""
                                INSERT INTO recommendations (risk_result_id, tip_text, tip_order)
                                VALUES (:risk_result_id, :tip_text, :tip_order)                               
                            """)
                            db.execute(tip_query, {
                                "risk_result_id": risk_id, 
                                "tip_text": tip, 
                                "tip_order": idx
                            })
            db.commit()
            log_action(db, user_id, "analyze_genome", "analysis", analysis_id)
        
        except Exception as e:
            db.rollback()
            print(f"Database save error: {e}")
            
    # response
    return {
        "user_id": analysis_id,
        "gene_count": len(genes),
        "disease": disease,
        "risks": risks,
        "disclaimer": DISCLAIMER_TXT,
        "timestamp": datetime.now().isoformat()
    }

@app.post("/auto-rank")
async def auto_rank_genome(
        background: BackgroundTasks,
        file: UploadFile = File(...),
        max_records: int = 10_000,
    ):
    """
    Upload a TXT or VCF; return the top-3 diseases ranked by aggregate risk.
    """
    handler = _detect_handler(file.filename)

    if handler == "TXT":
        raw   = await file.read()
        genes = parse_genome_file(raw, max_rsids=max_records)

    else:   # VCF
        with tempfile.NamedTemporaryFile(delete=False) as tmp:
            shutil.copyfileobj(file.file, tmp)
            tmp.flush()
            variants = stream_variants(tmp.name, max_records=max_records)
            ann      = annotate_variants(variants)
            genes    = set(g["gene"].upper() for g in (v for v in ann.values()))
            # fallback if empty
            if not genes:
                raise HTTPException(400, "No mappable rsIDs in file.")

    if not genes:
        raise HTTPException(400, "No gene symbols extracted from file.")

    ranked = disease_scores(genes, top_n=3)
    return {
        "user_id": str(uuid.uuid4()),
        "gene_count": len(genes),
        "candidates": ranked,
        "disclaimer": DISCLAIMER_TXT
    }

@app.get("/results/{analysis_id}/csv")
def export_csv(analysis_id: str, db: Session = Depends(get_db)):
    # data = _USER_STORE.get(user_id)
    # Store in database
    query = text("""
        SELECT rr.gene, rr.risk_score, rr.risk_level, rr.rank
        FROM risk_results rr
        WHERE rr.analysis_id = :analysis_id
        ORDER BY rr.rank
    """)
    result = db.execute(query, {
        "analysis_id": analysis_id
    })
    rows = result.fetchall()
    
    if not rows:
        raise HTTPException(404, "Result id not found")

    buf = io.StringIO()
    # writer = csv.DictWriter(buf, fieldnames=data["risks"][0].keys())
    writer = csv.writer(buf)
    writer.writeheader()
    writer.writerow(["gene", "risk_score", "risk_level", "rank"])
    writer.writerows(rows)
    buf.seek(0)
    headers = {
        "Content-Disposition": f'attachment; filename="{analysis_id}.csv"'
    }
    return StreamingResponse(buf, media_type="text/csv", headers=headers)