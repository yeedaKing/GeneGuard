# services/memory_db.py

import uuid, time

users  = {} # user_id -> result dict
groups = {} # group_id -> [user_id]

def new_user(result: dict | None = None) -> str:
    """Create a short user id and optionally store a payload."""
    uid = str(uuid.uuid4())[:8]
    if result is not None:
        users[uid] = {"timestamp": time.time(), **result}
        
    return uid

def get_user(uid: str):
    return users.get(uid)

def add_to_group(uid: str, group_id: str):
    groups.setdefault(group_id, []).append(uid)
