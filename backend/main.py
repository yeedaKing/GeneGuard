from fastapi import FastAPI, UploadFile, File

app = FastAPI(title="GeneGuard API", version="0.1.0")

SUPPORTED_DISEASES = ["alzheimers", "t2d", "ra"]  # placeholder

@app.get("/diseases")
def list_diseases():
    return {"diseases": SUPPORTED_DISEASES}

@app.post("/upload-genome")
async def upload_genome(disease: str, file: UploadFile = File(...)):
    # TODO: wire real parsing / risk join
    return {
        "msg": "stub response",
        "disease": disease,
        "filename": file.filename,
    }
