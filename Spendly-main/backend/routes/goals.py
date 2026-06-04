from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_conn
from auth_utils import get_current_user

router = APIRouter()

class GoalIn(BaseModel):
    name: str
    target: float
    saved: float = 0
    deadline: Optional[str] = None

@router.get("/")
def get_goals(user=Depends(get_current_user)):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM savings_goals WHERE user_id=? ORDER BY created_at DESC",
                        (user["id"],)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/")
def add_goal(data: GoalIn, user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute("INSERT INTO savings_goals (user_id, name, target, saved, deadline) VALUES (?,?,?,?,?)",
                 (user["id"], data.name, data.target, data.saved, data.deadline))
    conn.commit()
    conn.close()
    return {"message": "Goal created"}

@router.patch("/{goal_id}")
def update_goal(goal_id: int, data: dict, user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute("UPDATE savings_goals SET saved=? WHERE id=? AND user_id=?",
                 (data.get("saved", 0), goal_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Updated"}

@router.delete("/{goal_id}")
def delete_goal(goal_id: int, user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute("DELETE FROM savings_goals WHERE id=? AND user_id=?", (goal_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}
