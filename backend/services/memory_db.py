# services/memory_db.py
import uuid, time

users  = {}  # user_id -> result dict
groups = {}  # group_id -> [user_id]

def new_user(result: dict) -> str:
    uid = str(uuid.uuid4())[:8]
    users[uid] = {"timestamp": time.time(), **result}
    return uid

def get_user(uid: str):
    return users.get(uid)

def add_to_group(uid: str, group_id: str):
    groups.setdefault(group_id, []).append(uid)

##### beta

@app.post("/create-user")
async def create_user(disease: str, file: UploadFile = File(...)):
    raw = await file.read()
    genes = parse_genome_file(raw)
    result = {
        "disease": disease,
        "filename": file.filename,
        "gene_count": len(genes),
        "risks": annotate_risks(disease, genes),
    }
    user_id = new_user(result)
    return {"user_id": user_id, **result}

@app.get("/results/{user_id}")
def get_results(user_id: str):
    data = get_user(user_id)
    if data is None:
        raise HTTPException(status_code=404, detail="not found")
    return data
