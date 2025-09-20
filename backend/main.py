# main.py
from fastapi import FastAPI, File, UploadFile, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pathlib import Path
import io, csv, tempfile, shutil, uuid

from services.genome_parser import parse_genome_file  # TXT handler
from services.vcf_reader import stream_variants     # VCF handler
from services.annotate import annotate_variants
from services.burden import burden_scores
from services.risk_annotator import annotate_risks

TMPDIR = Path(tempfile.gettempdir())
SUPPORTED_DISEASES = [...]

app = FastAPI(title="GeneGuard API", version="0.2.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
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
            burden   = burden_scores(ann, severe_only=True)
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
        "disclaimer": (
            "Research-grade only; not a diagnostic tool. "
            "Consult a licensed genetic counselor before acting."
        ),
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
