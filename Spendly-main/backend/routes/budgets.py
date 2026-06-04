from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from database import get_conn
from auth_utils import get_current_user

router = APIRouter()

class BudgetIn(BaseModel):
    month: str
    category: str
    amount: float

@router.get("/")
def get_budgets(month: str, user=Depends(get_current_user)):
    conn = get_conn()
    rows = conn.execute("SELECT * FROM budgets WHERE user_id=? AND month=?",
                        (user["id"], month)).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/")
def set_budget(data: BudgetIn, user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute("INSERT OR REPLACE INTO budgets (user_id, month, category, amount) VALUES (?,?,?,?)",
                 (user["id"], data.month, data.category, data.amount))
    conn.commit()
    conn.close()
    return {"message": "Budget saved"}

@router.delete("/{budget_id}")
def delete_budget(budget_id: int, user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute("DELETE FROM budgets WHERE id=? AND user_id=?", (budget_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@router.post("/copy-last-month")
def copy_last_month(data: dict, user=Depends(get_current_user)):
    target_month = data.get("month")
    conn = get_conn()
    # Find most recent previous month with budgets
    prev = conn.execute(
        "SELECT DISTINCT month FROM budgets WHERE user_id=? AND month < ? ORDER BY month DESC LIMIT 1",
        (user["id"], target_month)
    ).fetchone()
    if not prev:
        conn.close()
        return {"message": "No previous budget found", "copied": 0}
    rows = conn.execute("SELECT category, amount FROM budgets WHERE user_id=? AND month=?",
                        (user["id"], prev["month"])).fetchall()
    count = 0
    for r in rows:
        conn.execute("INSERT OR IGNORE INTO budgets (user_id, month, category, amount) VALUES (?,?,?,?)",
                     (user["id"], target_month, r["category"], r["amount"]))
        count += 1
    conn.commit()
    conn.close()
    return {"message": f"Copied {count} budgets from {prev['month']}", "copied": count}
