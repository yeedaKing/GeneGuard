# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pathlib import Path
import io, csv, tempfile, shutil, uuid

from services.disease_ranker import disease_scores
from services.genome_parser import parse_genome_file  # TXT handler
from services.vcf_reader import stream_variants     # VCF handler
from services.annotate import annotate_variants
from services.burden import burden_scores
from services.risk_annotator import annotate_risks

# new imports for database implementation 
from fastapi import Depends, Header
from sqlalchemy import create_engine, text 
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from typing import Optional, List 
import os 
from dotenv import load_dotenv
from datetime import datetime

load_dotenv()

# Database settings
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://localhost/geneguard")
engine = create_engine(
    DATABASE_URL, 
    poolclass=QueuePool, 
    pool_size=5, 
    max_overflow=10,
    pool_pre_ping=True,
    pool_recycle=3600,
)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

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
        "http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# utility
def _detect_handler(filename: str):
    if filename.endswith((".txt", ".tsv")):
        return "TXT"
    elif filename.endswith((".vcf", ".vcf.gz")):
        return "VCF"
    else:
        raise HTTPException(415, "Unsupported file type")

# bad in-mem store (swap for DB later)
_USER_STORE: dict[str, dict] = {}

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

    # persist for CSV route
    user_id = str(uuid.uuid4())
    _USER_STORE[user_id] = {
        "disease": disease,
        "filename": file.filename,
        "genes": list(genes),
        "risks": risks,
    }

    # response
    return {
        "user_id": user_id,
        "gene_count": len(genes),
        "disease": disease,
        "risks": risks,
        "disclaimer": DISCLAIMER_TXT
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

@app.get("/results/{user_id}/csv")
def export_csv(user_id: str):
    data = _USER_STORE.get(user_id)
    if not data:
        raise HTTPException(404, "Result id not found")

    buf = io.StringIO()
    writer = csv.DictWriter(buf, fieldnames=data["risks"][0].keys())
    writer.writeheader()
    writer.writerows(data["risks"])
    buf.seek(0)
    headers = {
        "Content-Disposition": f'attachment; filename="{user_id}.csv"'
    }
    return StreamingResponse(buf, media_type="text/csv", headers=headers)

# Database implementation endpoints

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ----------------
# User endpoints 
# ----------------
# POST /users/sync 
# - create the user in database after login (using Firebase)
# - call immediately after user logs in 
# - parameters: firebase_uid, email, display_name, phone 
# - return: user id and profile info 

# GET /users/{firebase_uid}
# - get user profile info
# - call after loading the user's profile 
# - parameters: firebase_uid in URL
# - return: user details

# PUT /users/{firebase_uid}/profile
# - update user's display name and phone number 
# - call after user clicks 'Save Profile' 
# - parameters: firebase_uid in URL, display_name and phone 
# - return: success confirmation    

# ----------------
# Group endpoints 
# ----------------
# POST /groups 
# - create new group 
# - call when user clicks 'Create Group'
# - parameters: group name, firebase_uid
# - return: group ID, invite code, creation date 

# POST /groups/join
# - join group using invite code
# - call when user clicks 'Join' using invite code
# - parameters: invite_code, firebase_uid
# - return: success message and group name

# GET /groups/{firebase_uid}
# - get all groups a user belongs to 
# - call when loading the GroupsPage
# - parameters: firebase_uid in URL
# - return: array of user's groups

# DELETE /groups/{group_id}/leave
# - remove yourself from a group
# - call when user clicks 'Leave Group'
# - parameters: group_id in URL, firebase_uid
# - return: success message 

# ----------------
# Analysis endpoints 
# ----------------
# POST /analyses/share
# - share your analysis results with a group
# - call when user clicks 'Share My Analysis'
# - parameters: analysis_id, group_id, firebase_uid
# - return: success message 
@router.post("/analyses/share")
async def share_analysis(
    analysis_id: str,
    group_id: str,
    firebase_uid: str,
    db: Session = Depends(get_db)
):
    # get user_id from firebase_uid
    user_query = text("""
        SELECT id
        FROM users
        WHERE firebase_uid = :uid
    """)
    user_row = db.execute(user_query, {"uid": firebase_uid}).fetchone()
    if not user_row:
        raise HTTPException(404, "User not found")
    user_id = user_row[0]

    # check membership in group
    check_query = text("""
        SELECT id
        FROM group_members
        WHERE group_id = :group_id AND user_id = :user_id
    """)
    membership = db.execute(check_query, {
        "group_id": group_id,
        "user_id": user_id
    }).fetchone()
    if not membership:
        raise HTTPException(403, "Not a member of this group")

    # insert share record
    insert_query = text("""
        INSERT INTO shared_analyses (analysis_id, group_id, shared_by)
        VALUES (:analysis_id, :group_id, :user_id)
        RETURNING id, analysis_id, group_id, shared_by, shared_at
    """)
    result = db.execute(insert_query, {
        "analysis_id": analysis_id,
        "group_id": group_id,
        "user_id": user_id
    })
    db.commit()
    row = result.fetchone()

    return {
        "message": "Analysis shared successfully",
        "share": {
            "id": str(row[0]),
            "analysis_id": row[1],
            "group_id": row[2],
            "shared_by": row[3],
            "shared_at": row[4].isoformat()
        }
    }

# DELETE /analyses/{analysis_id}/unshare/{group_id}
# - stop sharing your results with group
# - call when user clicks 'Unshare My Analysis'
# - parameters: analysis_id and group_id in URL, firebase_uid
# - return: success message 
@router.delete("/analyses/{analysis_id}/unshare/{group_id}")
async def unshare_analysis(
    analysis_id: str, 
    group_id: str, 
    firebase_uid: str,
    db: Session = Depends(get_db)
    ):
    # get user_id from firebase_uid
    user_query = text("""
        SELECT id
        FROM users
        WHERE firebase_uid = :uid
    """)
    user_row = db.execute(user_query, {"uid": firebase_uid}).fetchone()
    if not user_row:
        raise HTTPException(404, "User not found")
    user_id = user_row[0]

    # check membership in group
    check_query = text("""
        SELECT id
        FROM group_members
        WHERE group_id = :group_id AND user_id = :user_id
    """)
    membership = db.execute(check_query, {
        "group_id": group_id,
        "user_id": user_id
    }).fetchone()
    if not membership:
        raise HTTPException(403, "Not a member of this group")

    # delete share record
    delete_query = text("""
        DELETE FROM shared_analyses
        WHERE analysis_id = :analysis_id AND group_id = :group_id AND shared_by = :user_id
    """)
    db.execute(delete_query, {
        "analysis_id": analysis_id,
        "group_id": group_id,
        "user_id": user_id
    })
    db.commit()

    return {"message": "Analysis unshared successfully"}

# GET /groups/{group_id}/analyses
# - view all analyses shared in a group
# - call when user clicks 'View Analysis' for another user
# - parameters: group_id in URL, firebase_uid for auth
# - return: array of shared analyses
@router.get("/groups/{group_id}/analyses")
async def view_shared_analyses(
    group_id: str,
    firebase_uid: str,
    db: Session = Depends(get_db)
    ):

    # get user_id from firebase_uid
    user_query = text("""
        SELECT id
        FROM users
        WHERE firebase_uid = :uid
    """)
    user_row = db.execute(user_query, {"uid": firebase_uid}).fetchone()
    if not user_row:
        raise HTTPException(404, "User not found")
    user_id = user_row[0]

    # check membership in group
    check_query = text("""
        SELECT id
        FROM group_members
        WHERE group_id = :group_id AND user_id = :user_id
    """)
    membership = db.execute(check_query, {
        "group_id": group_id,
        "user_id": user_id
    }).fetchone()
    if not membership:
        raise HTTPException(403, "Not a member of this group")

    # get shared analyses
    shared_query = text("""
        SELECT a.id, a.name, a.shared_by, a.shared_at
        FROM shared_analyses a
        WHERE a.group_id = :group_id
    """)
    shared_analyses = db.execute(shared_query, {"group_id": group_id}).fetchall()

    return {"shared_analyses": [dict(row) for row in shared_analyses]}