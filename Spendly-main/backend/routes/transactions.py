from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional
from database import get_conn
from auth_utils import get_current_user
from helpers import auto_categorize, create_notification

router = APIRouter()

class TransactionIn(BaseModel):
    date: str
    description: str
    amount: float
    type: str
    category: str
    notes: Optional[str] = ""

@router.get("/")
def get_transactions(month: Optional[str] = None, category: Optional[str] = None,
                     type: Optional[str] = None, user=Depends(get_current_user)):
    conn = get_conn()
    query = "SELECT * FROM transactions WHERE user_id = ?"
    params = [user["id"]]
    if month:
        query += " AND strftime('%Y-%m', date) = ?"
        params.append(month)
    if category and category != "All":
        query += " AND category = ?"
        params.append(category)
    if type and type != "All":
        query += " AND type = ?"
        params.append(type)
    query += " ORDER BY date DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.post("/")
def add_transaction(data: TransactionIn, user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute(
        "INSERT INTO transactions (user_id, date, description, amount, type, category, notes) VALUES (?,?,?,?,?,?,?)",
        (user["id"], data.date, data.description, data.amount, data.type, data.category, data.notes)
    )
    conn.commit()
    # Check budget and notify if over
    if data.type == "expense":
        month = data.date[:7]
        budget_row = conn.execute(
            "SELECT amount FROM budgets WHERE user_id=? AND month=? AND category=?",
            (user["id"], month, data.category)
        ).fetchone()
        if budget_row:
            spent = conn.execute(
                "SELECT SUM(amount) as total FROM transactions WHERE user_id=? AND type='expense' AND category=? AND strftime('%Y-%m', date)=?",
                (user["id"], data.category, month)
            ).fetchone()["total"] or 0
            if spent > budget_row["amount"]:
                create_notification(conn, user["id"],
                    f"Over budget in {data.category}! Spent ₹{spent:,.0f} of ₹{budget_row['amount']:,.0f} budget.",
                    "warning")
    conn.close()
    return {"message": "Transaction added"}

@router.delete("/{tx_id}")
def delete_transaction(tx_id: int, user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute("DELETE FROM transactions WHERE id=? AND user_id=?", (tx_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Deleted"}

@router.post("/categorize")
def categorize(data: dict):
    description = data.get("description", "")
    return {"category": auto_categorize(description), "type": "expense"}

@router.get("/summary/current-month")
def current_month_stats(user=Depends(get_current_user)):
    from datetime import datetime
    month = datetime.now().strftime("%Y-%m")
    conn = get_conn()
    row = conn.execute("""
        SELECT
            SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) as income,
            SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense,
            COUNT(CASE WHEN type='expense' THEN 1 END) as tx_count
        FROM transactions WHERE user_id=? AND strftime('%Y-%m', date)=?
    """, (user["id"], month)).fetchone()
    conn.close()
    income  = row["income"]  or 0
    expense = row["expense"] or 0
    savings = income - expense
    rate    = round(savings / income * 100, 1) if income > 0 else 0
    return {"income": income, "expense": expense, "savings": savings,
            "rate": rate, "tx_count": row["tx_count"] or 0, "month": month}
