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
