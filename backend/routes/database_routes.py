# routes/database_routes.py 
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import text 
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional
import uuid
from .database import get_db

router = APIRouter(tags=["database"])

# pydantic models
class UserCreate(BaseModel):
    firebase_uid: str
    email: str
    display_name: str
    phone: Optional[str] = None
    
class UserUpdate(BaseModel):
    display_name: str
    phone: Optional[str] = None

class GroupCreate(BaseModel):
    name: str
    
class GroupJoin(BaseModel):
    invite_code: str
    
class AnalysisShare(BaseModel):
    analysis_id: str
    group_id: str
 
def generate_invite_code():
    return str(uuid.uuid4())[:16].upper()
        
def get_firebase_uid(db: Session, firebase_uid: str):
    query = text("""
        SELECT id 
        FROM users 
        WHERE firebase_uid = :uid
        LIMIT 1
    """)
    
    result = db.execute(query, {"uid": firebase_uid})
    row = result.fetchone()
    
    if not row:
        raise HTTPException(404, "User not found. Please sync user first")

    return str(row[0])

def log_action(db: Session, user_id: str, action: str, resource_type: str, resource_id: str = None):
    try:
        query = text("""
            INSERT INTO audit_log (user_id, action, resource_type, resource_id)
            VALUES (:user_id, :action, :resource_type, :resource_id)             
        """)
        db.execute(query, {
            "user_id": user_id, 
            "action": action, 
            "resource_type": resource_type, 
            "resource_id": resource_id
        })
        db.commit()
    except Exception as e:
        print(f"Audi log error: {e}")

@router.post("/users/sync")
async def sync_user(user_data: UserCreate, db: Session = Depends(get_db)):
    query = text("""
        INSERT INTO users (firebase_uid, email, display_name, phone, last_login)
        VALUES (:firebase_uid, :email, :display_name, :phone, CURRENT_TIMESTAMP)
        ON CONFLICT (firebase_uid)
        DO UPDATE SET 
            last_login = CURRENT_TIMESTAMP,
            display_name = COALESCE(EXCLUDED.display_name, users.display_name),
            phone = COALESCE(EXCLUDED.phone, users.phone)
        RETURNING id, firebase_uid, email, display_name, phone
    """)
    
    result = db.execute(query, {
        "firebase_uid": user_data.firebase_uid,
        "email": user_data.email,
        "display_name": user_data.display_name, 
        "phone": user_data.phone
    })
    db.commit()
    
    user = result.fetchone()
    return {
        "id": str(user[0]),
        "firebase_uid": user[1],
        "email": user[2],
        "display_name": user[3],
        "phone": user[4]
    }

@router.get("/users/{firebase_uid}")
async def get_user(firebase_uid: str, db: Session = Depends(get_db)):
    query = ("""
        SELECT id, firebase_uid, email, display_name, phone
        FROM users 
        WHERE firebase_uid = :uid
    """)
    result = db.execute(query, {"uid": firebase_uid})
    user = result.fetchone()

    if not user:
        raise HTTPException(404, "User not found")

    return {
        "id": str(user[0]),
        "firebase_uid": user[1],
        "email": user[2],
        "display_name": user[3],
        "phone": user[4]
    }

@router.put("/users/{firebase_uid}/profile")
async def update_profile(firebase_uid: str, profile: UserUpdate, db: Session = Depends(get_db)):
    user_id =  get_firebase_uid(db, firebase_uid)
    
    query = text("""
        UPDATE users 
        SET display_name = :display_name, phone = :phone
        WHERE firebase_uid = :uid
        RETURNING id
    """)
    
    result = db.execute(query, {
        "display_name": profile.display_name, 
        "phone": profile.phone, 
        "uid": firebase_uid
    })
    db.commit()
    
    if not result.fetchone():
        raise HTTPException(404, "User not found")

    log_action(db, user_id, "update_profile", "user", user_id) # have david add function for logging
    return {"success": True}

@router.post("/groups")
async def create_group(group_data: GroupCreate, firebase_uid: str, db: Session = Depends(get_db)):
    user_id = get_firebase_uid(db, firebase_uid)
    
    invite_code = generate_invite_code()
    group_id = str(uuid.uuid4())
    
    group_query = text(""" 
        INSERT INTO groups (id, name, invite_code, creator_id)
        VALUES (:id, :name, :invite_code, :creator_id)
        RETURNING id, name, invite_code, created_at
    """)
    
    group_result = db.execute(group_query, {
        "id": group_id,
        "name": group_data.name,
        "invite_code": invite_code,
        "creator_id": user_id
    })
    
    group = group_result.fetchone()
    
    member_query = text("""
        INSERT INTO group_members (group_id, user_id, role)
        VALUES (:group_id, :user_id, 'creator')
    """)
    
    db.execute(member_query, {
        "group_id": group_id,
        "user_id": user_id
    })
    db.commit()
    
    log_action(db, user_id, "create_group", "group", group_id)
    
    return {
        "id": str(group[0]),
        "name": group[1],
        "invite_code": group[2],
        "created_at": group[3].isoformat()
    }

@router.post("/groups/join")
async def join_group(join_data: GroupJoin, firebase_uid: str, db: Session = Depends(get_db)):
    user_id = get_firebase_uid(db, firebase_uid)
    
    group_query = text("""
        SELECT id, name 
        FROM groups
        WHERE invite_code = :code
    """)
    
    group_result = db.execute(group_query, {
        "code": join_data.invite_code.upper()
    })
    
    group = group_result.fetchone()
    
    if not group:
        raise HTTPException(404, "Invalid invite code")
    
    group_id = str(group[0])
    
    check_query = text("""
        SELECT id 
        FROM group_members
        WHERE group_id = :group_id AND user_id = :user_id
    """)
    existing = db.execute(check_query, {
        "group_id": group_id,
        "user_id": user_id
    }).fetchone()
    
    if existing:
        raise HTTPException(400, "Already a member of this group")

    member_query = text("""
        INSERT INTO group_members (group_id, user_id)
        VALUES (:group_id, :user_id)
    """)
    
    db.execute(member_query, {
        "group_id": group_id,
        "user_id": user_id
    })
    db.commit()
    
    log_action(db, user_id, "join_group", "group", group_id)
    
    return {"success": True, "group_name": group[1], "group_id": group_id}

@router.get("/groups/{firebase_uid}")
async def get_user_groups(firebase_uid: str, db: Session = Depends(get_db)):
    query = text("""
        SELECT g.id, g.name, g.invite_code, g.created_at, 
               creator.display_name as creator_name,
               COUNT(gm.id) as member_count
        FROM groups g
        JOIN group_members my_membership ON g.id = my_membership.group_id
        JOIN users me ON my_membership.user_id = me.id
        JOIN users creator ON g.creator_id = creator.id 
        LEFT JOIN group_members gm ON g.id = gm.group_id
        WHERE me.firebase_uid = :uid
        GROUP BY g.id, g.name, g.invite_code, g.created_at, creator.display_name
        ORDER BY g.created_at DESC
    """)
    
    result = db.execute(query, {"uid": firebase_uid})
    groups = result.fetchall()
    
    return [{
        "id": str(group[0]),
        "name": group[1],
        "invite_code": group[2],
        "created_at": group[3].isoformat(),
        "creator_name": group[4],
        "member_count": group[5]
    } for group in groups]
    
@router.get("/groups/{group_id}/members")
async def get_group_members(group_id: str, firebase_uid: str, db: Session = Depends(get_db)):
    user_id = get_firebase_uid(db, firebase_uid) 
    check_query = text("""
        SELECT id 
        FROM group_members
        WHERE group_id = :group_id AND user_id = :user_id
    """)
    is_member = db.execute(check_query, {
       "group_id": group_id, 
       "user_id": user_id
    }).fetchone()
   
    if not is_member:
       raise HTTPException(403, "Not a member of this group")

    query = text("""
        SELECT u.id, u.display_name, u.email, u.phone, gm.joined_at, gm.role,
            u.firebase_uid, 
            EXISTS(
                SELECT 1 
                FROM shared_analyses sa
                WHERE sa.group_id = :group_id AND sa.shared_by = u.id
            ) as has_shared
        FROM group_members gm
        JOIN users u ON gm.user_id = u.id 
        WHERE gm.group_id = :group_id
        ORDER BY gm.joined_at
    """)
    
    result = db.execute(query, {
        "group_id": group_id
    })
    
    members = result.fetchall()
    
    return [{
        "id": str(member[0]),
        "name": member[1],
        "email": member[2],
        "phone": member[3],
        "joined_at": member[4].isoformat(),
        "role": member[5],
        "firebase_uid": member[6],
        "has_shared_analysis": member[7]
    } for member in members]
   
@router.delete("/groups/{group_id}/leave")
async def leave_group(group_id: str, firebase_uid: str, db: Session = Depends(get_db)):
    user_id = get_firebase_uid(db, firebase_uid)
    
    query = text("""
        DELETE 
        FROM group_members
        WHERE group_id= :group_id AND user_id = :user_id
        RETURNING id    
    """)
    
    result = db.execute(query, {
        "group_id": group_id, 
        "user_id": user_id
    })
    db.commit()
    
    if not result.fetchone():
        raise HTTPException(404, "Not a member of this group")

    log_action(db, user_id, "leave_group", "group", group_id)
    return {"success": True}

@router.post("/analyses/share")
def share_analysis(share_data: AnalysisShare, firebase_uid: str, db: Session = Depends(get_db)):
    user_id = get_firebase_uid(db, firebase_uid)
    
    verify_query = text("""
        SELECT
            EXISTS(
                SELECT 1 
                FROM genetic_analyses 
                WHERE id = :analysis_id and user_id = : user_id
            ) as owns_analysis,
            EXISTS(
                SELECT 1 
                FROM group_members 
                WHERE group_id = :group_id AND user_id = :user_id
            ) as in_group
    """)
    
    membership = db.execute(verify_query, {
        "analysis_id": share_data.analysis_id,
        "group_id": share_data.group_id, 
        "user_id": user_id
    })
    verification = membership.fetchone()
    
    if not verification[0]:
        raise HTTPException(403, "Analysis not found or access denied")

    if not verification[1]:
        raise HTTPException(403, "Not a member of this group")
    
    insert_query = text("""
        INSERT INTO shared_analyses (analysis_id, group_id, shared_by)
        VALUES (:analysis_id, :group_id, :shared_by)
        ON CONFLICT (analysis_id, group_id) DO NOTHING
    """)
    
    db.execute(insert_query, {
        "analysis_id": share_data.analysis_id,
        "group_id": share_data.group_id, 
        "shared_by": user_id
    })
    db.commit()
    
    log_action(db, user_id, "share_analysis", "analysis", share_data.analysis_id)
    
    return {"success": True}

@router.delete("/analyses/{analysis_id}/unshare/{group_id}")
def unshare_analysis(analysis_id: str, group_id: str, firebase_uid: str, db: Session = Depends(get_db)):
    user_id = get_firebase_uid(db, firebase_uid)
    
    user_query = text("""
        DELETE 
        FROM shared_analyses
        WHERE analysis_id = :analysis_id
        AND group_id = :group_id
        AND shared_by = :user_id
        RETURNING id
    """)
    
    user_row = db.execute(user_query, {
        "analysis_id": analysis_id,
        "group_id": group_id, 
        "user_id": user_id        
    })
    db.commit()
    
    if not user_row.fetchone():
        raise HTTPException(404, "Share not found")
    
    log_action(db, user_id, "unshare_analysis", "analysis", analysis_id)
    
    return {"success": True}

@router.get("/groups/{group_id}/analyses")
def view_group_analyses(group_id: str, firebase_uid: str, db: Session = Depends(get_db)):
    user_id = get_firebase_uid(db, firebase_uid)
    
    check_query = text("""
        SELECT id 
        FROM group_members 
        WHERE group_id = :group_id AND user_id = :user_id
    """)
    
    is_member = db.execute(check_query, {
        "group_id": group_id,
        "user_id": user_id
    }).fetchone()
    
    if not is_member:
        raise HTTPException(403, "Not a member of this group")
    
    query = text("""
        SELECT ga.id, ga.disease, ga.analysis_date, u.display_name, sa.shared_at,
            json_agg(
                json_build_object(
                    'gene', rr.gene,
                    'risk_score', rr.risk_score,
                    'risk_level', rr.risk_level,
                    'rank', rr.rank
                ) ORDER BY rr.rank
            ) as risks
        FROM shared_analyses sa
        JOIN genetic_analyses ga ON sa.analysis_id = ga.id
        JOIN users u ON sa.shared_by = u.id 
        LEFT JOIN risk_results rr ON ga.id = rr.analysis_id
        WHERE sa.group_id = :group_id
        GROUP BY ga.id, ga.disease, ga.analysis_date, u.display_name, sa.shared_at
        ORDER BY sa.shared_at DESC
    """)
    
    result = db.execute(query, {
        "group_id": group_id
    })
    analyses = result.fetchall()
    
    log_action(db, user_id, "view_shared_analysis", "group", group_id)
    
    return [{
        "id": str(analysis[0]),
        "disease": analysis[1],
        "analysis_date": analysis[2],
        "shared_by": analysis[3],
        "shared_at": analysis[4],
        "risks": analysis[5][:10] if analysis[5] else []
        } for analysis in analyses]
    
@router.get("/users/{firebase_uid}/analyses")
async def get_user_analyses(firebase_uid: str, db: Session = Depends(get_db)):
    user_id = get_firebase_uid(db, firebase_uid)
    
    query = text("""
        SELECT ga.id, ga.disease, ga.filename, ga.gene_count, ga.analysis_date, 
               COUNT(rr.id) as risk_count
        FROM genetic_analyses ga
        LEFT JOIN risk_results rr ON ga.id = rr.analysis_id
        WHERE ga.user_id = :user_id
        GROUP BY ga.id, ga.disease, ga.filename, ga.gene_count, ga.analysis_date
        ORDER BY ga.analysis_date DESC
        LIMIT 10
    """)
    
    result = db.execute(query, {
        "user_id": user_id
    })
    analyses = result.fetchall()
    
    return [{
        "id": str(analysis[0]),
        "user_id": str(analysis[0]),
        "disease": analysis[1],
        "filename": analysis[2],
        "gene_count": analysis[3],
        "timestamp": analysis[4].isoformat(),
        "risk_count": analysis[5]
        } for analysis in analyses]

@router.get("/analyses/{analysis_id}")
async def get_analysis_by_id(analysis_id: str, db: Session = Depends(get_db)):
    analysis_query = text("""
        SELECT ga.id, ga.disease, ga.filename, ga.gene_count, ga.analysis_date
        FROM genetic_analyses ga 
        WHERE ga.id = :analysis_id
    """)
    
    analysis_result = db.execute(analysis_query, {
        "analysis_id": analysis_id    
    })
    analysis = analysis_result.fetchone()
    
    if not analysis:
        raise HTTPException(404, "Analysis not found")

    risks_query = text("""
        SELECT rr.gene, rr.risk_score, rr.risk_level, rr.rank,
            json_agg(
                json_build_object(
                    'text', r.tip_text,
                    'order', r.tip_order
                ) ORDER BY r.tip_order
            ) FILTER (WHERE r.id IS NOT NULL) as tips
        FROM risk_results rr 
        LEFT JOIN recommendations r ON rr.id = r.risk_result_id
        WHERE rr.analysis_id = :analysis_id
        GROUP BY rr.id, rr.gene, rr.risk_score, rr.risk_level, rr.rank
        ORDER BY rr.rank
    """)
    
    risks_result = db.execute(risks_query, {
        "analysis_id": analysis_id
    }) 
    risks = risks_result.fetchall()
    
    formatted_risks = []
    for risk in risks:
        tips = []
        if risk[4]:
            tips = [tip['text'] for tip in risk[4]]
        
        formatted_risks.append({
            "gene": risk[0],
            "risk": risk[1],
            "level": risk[2],
            "rank": risk[3],
            "tips": tips
        })
    
    return {
        "id": str(analysis[0]),
        "user_id": str(analysis[0]),
        "userId": str(analysis[1]),
        "disease": analysis[2],
        "filename": analysis[3],
        "gene_count": analysis[4],
        "timestamp": analysis[5].isoformat(),
        "risks": formatted_risks,
        "version": "1.0"
    }