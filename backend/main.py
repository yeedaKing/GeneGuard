from services.genome_parser import parse_genome_file
from services.risk_annotator import annotate_risks

from fastapi import FastAPI, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse

import csv, io


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


@app.get("/results/{user_id}/csv")
def export_csv(user_id: str):
    data = get_user(user_id)
    if data is None:
        raise HTTPException(status_code=404, detail="not found")
    buffer = io.StringIO()
    writer = csv.DictWriter(buffer, fieldnames=data['risks'][0].keys())
    writer.writeheader()
    writer.writerows(data['risks'])
    buffer.seek(0)
    return StreamingResponse(buffer, media_type="text/csv",
                             headers={"Content-Disposition": f"attachment; filename={user_id}.csv"})