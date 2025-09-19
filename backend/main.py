from services.genome_parser import parse_genome_file
from services.risk_annotator import annotate_risks

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GeneGuard API", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

SUPPORTED_DISEASES = ["alzheimers", "t2d", "ra"]  # placeholder

@app.get("/diseases")
def list_diseases():
    return {"diseases": SUPPORTED_DISEASES}

@app.post("/upload-genome")
async def upload_genome(disease: str, file: UploadFile = File(...)):
    raw_bytes = await file.read()
    genes = parse_genome_file(raw_bytes)
    risks = annotate_risks(disease, genes)

    return {
        "disease": disease,
        "filename": file.filename,
        "gene_count": len(genes),
        "risks": risks,
    }