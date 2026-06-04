from fastapi import APIRouter, Depends
from database import get_conn
from auth_utils import get_current_user

router = APIRouter()

@router.get("/monthly-summary")
def monthly_summary(user=Depends(get_current_user)):
    conn = get_conn()
    rows = conn.execute("""
        SELECT strftime('%Y-%m', date) as month,
               SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) as income,
               SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
        FROM transactions WHERE user_id=?
        GROUP BY month ORDER BY month
    """, (user["id"],)).fetchall()
    conn.close()
    result = []
    for r in rows:
        income  = r["income"]  or 0
        expense = r["expense"] or 0
        savings = income - expense
        rate    = round(savings / income * 100, 1) if income > 0 else 0
        result.append({"month": r["month"], "income": income,
                        "expense": expense, "savings": savings, "savings_rate": rate})
    return result

@router.get("/category-breakdown")
def category_breakdown(month: str = None, user=Depends(get_current_user)):
    conn = get_conn()
    query = """
        SELECT category, SUM(amount) as total, COUNT(*) as count
        FROM transactions WHERE user_id=? AND type='expense'
    """
    params = [user["id"]]
    if month:
        query += " AND strftime('%Y-%m', date) = ?"
        params.append(month)
    query += " GROUP BY category ORDER BY total DESC"
    rows = conn.execute(query, params).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.get("/notifications")
def get_notifications(user=Depends(get_current_user)):
    conn = get_conn()
    rows = conn.execute(
        "SELECT * FROM notifications WHERE user_id=? ORDER BY created_at DESC LIMIT 20",
        (user["id"],)
    ).fetchall()
    conn.close()
    return [dict(r) for r in rows]

@router.patch("/notifications/{notif_id}/read")
def mark_read(notif_id: int, user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute("UPDATE notifications SET is_read=1 WHERE id=? AND user_id=?",
                 (notif_id, user["id"]))
    conn.commit()
    conn.close()
    return {"message": "Marked read"}

@router.patch("/notifications/read-all")
def mark_all_read(user=Depends(get_current_user)):
    conn = get_conn()
    conn.execute("UPDATE notifications SET is_read=1 WHERE user_id=?", (user["id"],))
    conn.commit()
    conn.close()
    return {"message": "All marked read"}
