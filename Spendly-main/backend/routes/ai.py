from fastapi import APIRouter, Depends
from pydantic import BaseModel
from typing import Optional
from groq import Groq
from database import get_conn
from auth_utils import get_current_user
import json, re
import os
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
client = Groq(api_key=GROQ_API_KEY)
MODEL  = "llama-3.1-8b-instant"

router = APIRouter()


def ask(prompt: str) -> str:
    response = client.chat.completions.create(
        model=MODEL,
        messages=[{"role": "user", "content": prompt}],
        max_tokens=1024,
    )
    return response.choices[0].message.content


def get_user_context(user_id: int) -> str:
    conn = get_conn()
    txs = conn.execute("""
        SELECT date, description, amount, type, category
        FROM transactions WHERE user_id = ?
        ORDER BY date DESC LIMIT 100
    """, (user_id,)).fetchall()

    monthly = conn.execute("""
        SELECT strftime('%Y-%m', date) as month,
               SUM(CASE WHEN type='income'  THEN amount ELSE 0 END) as income,
               SUM(CASE WHEN type='expense' THEN amount ELSE 0 END) as expense
        FROM transactions WHERE user_id = ?
        GROUP BY month ORDER BY month DESC LIMIT 6
    """, (user_id,)).fetchall()

    cats = conn.execute("""
        SELECT category, SUM(amount) as total
        FROM transactions WHERE user_id = ? AND type='expense'
        GROUP BY category ORDER BY total DESC LIMIT 8
    """, (user_id,)).fetchall()

    conn.close()

    if not txs:
        return "No transaction data available yet."

    tx_lines      = "\n".join([f"- {t['date']}: {t['description']} | Rs{t['amount']} | {t['type']} | {t['category']}" for t in txs])
    monthly_lines = "\n".join([f"- {m['month']}: Income Rs{m['income']:.0f}, Expense Rs{m['expense']:.0f}, Savings Rs{m['income']-m['expense']:.0f}" for m in monthly])
    cat_lines     = "\n".join([f"- {c['category']}: Rs{c['total']:.0f}" for c in cats])

    return f"""
USER'S FINANCIAL DATA:

Recent Transactions (last 100):
{tx_lines}

Monthly Summary (last 6 months):
{monthly_lines}

Top Spending Categories:
{cat_lines}
"""


# ── 1. AI FINANCE COACH ─────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    message: str
    history: Optional[list] = []

@router.post("/chat")
def ai_chat(data: ChatMessage, user=Depends(get_current_user)):
    context = get_user_context(user["id"])

    history_text = ""
    for h in data.history[-6:]:
        history_text += f"\n{h['role'].upper()}: {h['content']}"

    prompt = f"""You are Spendly AI - a friendly, smart personal finance coach for Indian users.
You have access to the user's real financial data below. Give specific, actionable advice.
Always refer to amounts in Indian Rupees (Rs). Be concise, warm, and practical.
If the user asks something unrelated to finance, gently redirect them.

{context}

CONVERSATION HISTORY:{history_text}

USER: {data.message}

ASSISTANT:"""

    try:
        return {"reply": ask(prompt)}
    except Exception as e:
        return {"reply": f"Sorry, I couldn't process that. Error: {str(e)}"}


# ── 2. RECEIPT SCANNER ───────────────────────────────────────────────────────

class ReceiptData(BaseModel):
    image_base64: str
    mime_type: str = "image/jpeg"

@router.post("/scan-receipt")
def scan_receipt(data: ReceiptData, user=Depends(get_current_user)):
    try:
        import base64
        image_bytes = base64.b64decode(data.image_base64)

        # Groq vision support
        response = client.chat.completions.create(
            model="llama-4-scout-17b-16e-instruct",
            messages=[{
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": """Analyze this receipt/bill image and extract:
1. merchant/description (shop name or what was purchased)
2. total amount (numbers only, no currency symbol)
3. date (in YYYY-MM-DD format, use today if not visible)
4. category from: Food & Dining, Transport, Shopping, Entertainment, Utilities, Health, Education, Rent, Personal Care, Travel, Investments, Other

Respond ONLY in this exact JSON format, nothing else:
{"description": "...", "amount": 0.00, "date": "YYYY-MM-DD", "category": "..."}"""
                    },
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{data.mime_type};base64,{data.image_base64}"
                        }
                    }
                ]
            }],
            max_tokens=256,
        )

        text  = response.choices[0].message.content.strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            result = json.loads(match.group())
            return {"success": True, "data": result}
        return {"success": False, "error": "Could not parse receipt"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ── 3. AI BUDGET PLANNER ─────────────────────────────────────────────────────

@router.post("/generate-budget")
def generate_budget(user=Depends(get_current_user)):
    context = get_user_context(user["id"])

    prompt = f"""Based on this user's spending history, generate a realistic monthly budget for each category.
{context}

Rules:
- Analyze their average spending per category over the last 3 months
- Suggest a budget that is 10-15% lower than their average to encourage savings
- Only include categories they actually spend in
- Return ONLY valid JSON, no extra text, no markdown

Format exactly:
{{"budgets": [{{"category": "Food & Dining", "amount": 4000, "reason": "Your average is Rs4400. Suggested 10% reduction."}}]}}"""

    try:
        text  = ask(prompt).strip()
        text  = text.replace("```json", "").replace("```", "").strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            result = json.loads(match.group())
            return {"success": True, "budgets": result.get("budgets", [])}
        return {"success": False, "error": "Could not generate budget"}
    except Exception as e:
        return {"success": False, "error": str(e)}


# ── 4. NATURAL LANGUAGE SEARCH ───────────────────────────────────────────────

class NLSearchQuery(BaseModel):
    query: str

@router.post("/search")
def nl_search(data: NLSearchQuery, user=Depends(get_current_user)):
    conn = get_conn()
    txs  = conn.execute(
        "SELECT * FROM transactions WHERE user_id = ? ORDER BY date DESC",
        (user["id"],)
    ).fetchall()
    conn.close()

    if not txs:
        return {"results": [], "explanation": "No transactions found"}

    tx_list = "\n".join([f"ID:{t['id']} | {t['date']} | {t['description']} | Rs{t['amount']} | {t['type']} | {t['category']}" for t in txs])

    prompt = f"""User query: "{data.query}"

Transactions:
{tx_list}

Find ALL transactions matching the query. Return ONLY valid JSON, no markdown, no extra text:
{{"ids": [1, 2, 3], "explanation": "Found 3 food orders above Rs500 last month"}}

If none match: {{"ids": [], "explanation": "No matching transactions found"}}"""

    try:
        text  = ask(prompt).strip()
        text  = text.replace("```json", "").replace("```", "").strip()
        match = re.search(r'\{.*\}', text, re.DOTALL)
        if match:
            result      = json.loads(match.group())
            matched_ids = set(result.get("ids", []))
            matched_txs = [dict(t) for t in txs if t["id"] in matched_ids]
            return {
                "results":     matched_txs,
                "explanation": result.get("explanation", ""),
                "count":       len(matched_txs)
            }
        return {"results": [], "explanation": "Could not process search"}
    except Exception as e:
        return {"results": [], "explanation": f"Error: {str(e)}"}


# ── 5. ANOMALY DETECTOR ──────────────────────────────────────────────────────

@router.get("/anomalies")
def detect_anomalies(user=Depends(get_current_user)):
    conn = get_conn()
    txs  = conn.execute("""
        SELECT date, description, amount, category,
               strftime('%Y-%m', date) as month
        FROM transactions
        WHERE user_id = ? AND type = 'expense'
        ORDER BY date DESC
    """, (user["id"],)).fetchall()
    conn.close()

    if len(txs) < 5:
        return {"anomalies": [], "message": "Need more transactions to detect anomalies"}

    from collections import defaultdict
    cat_amounts = defaultdict(list)
    for t in txs:
        cat_amounts[t["category"]].append(t["amount"])

    anomalies  = []
    recent_txs = [t for t in txs if t["month"] >= txs[0]["month"]]

    for tx in recent_txs:
        history = cat_amounts[tx["category"]]
        if len(history) < 3:
            continue
        avg = sum(history) / len(history)
        if tx["amount"] > avg * 2.5 and tx["amount"] > avg + 500:
            anomalies.append({
                "date":         tx["date"],
                "description":  tx["description"],
                "amount":       tx["amount"],
                "category":     tx["category"],
                "average":      round(avg, 2),
                "times_higher": round(tx["amount"] / avg, 1),
                "message":      f'Rs{tx["amount"]:,.0f} on {tx["description"]} is {round(tx["amount"]/avg, 1)}x your usual {tx["category"]} spend (avg Rs{avg:,.0f})'
            })

    anomalies.sort(key=lambda x: x["times_higher"], reverse=True)
    return {"anomalies": anomalies[:10], "total": len(anomalies)}


# ── 6. MONTHLY AI REPORT ─────────────────────────────────────────────────────

class ReportRequest(BaseModel):
    month: str

@router.post("/monthly-report")
def monthly_report(data: ReportRequest, user=Depends(get_current_user)):
    conn = get_conn()
    txs  = conn.execute("""
        SELECT date, description, amount, type, category
        FROM transactions
        WHERE user_id = ? AND strftime('%Y-%m', date) = ?
        ORDER BY date
    """, (user["id"], data.month)).fetchall()

    goals = conn.execute(
        "SELECT name, target, saved FROM savings_goals WHERE user_id = ?",
        (user["id"],)
    ).fetchall()
    conn.close()

    if not txs:
        return {"success": False, "report": "No data for this month"}

    income  = sum(t["amount"] for t in txs if t["type"] == "income")
    expense = sum(t["amount"] for t in txs if t["type"] == "expense")
    savings = income - expense

    from collections import defaultdict
    by_cat = defaultdict(float)
    for t in txs:
        if t["type"] == "expense":
            by_cat[t["category"]] += t["amount"]

    cat_summary   = "\n".join([f"- {k}: Rs{v:,.0f}" for k, v in sorted(by_cat.items(), key=lambda x: -x[1])])
    goals_summary = "\n".join([f"- {g['name']}: Rs{g['saved']:,.0f} / Rs{g['target']:,.0f}" for g in goals]) or "No goals set"

    prompt = f"""Write a friendly, personal monthly financial report for {data.month}.

Data:
- Income: Rs{income:,.0f}
- Expenses: Rs{expense:,.0f}
- Savings: Rs{savings:,.0f} ({round(savings/income*100, 1) if income > 0 else 0}% rate)

Spending by category:
{cat_summary}

Savings Goals:
{goals_summary}

Write a report with these sections:
1. Month Summary (2-3 sentences, conversational tone)
2. What Went Well (2 points)
3. Areas to Improve (2 points)
4. Top 3 Actionable Tips for next month
5. Overall Financial Health Score out of 10 with brief reason

Keep it friendly, specific to their numbers, and motivating. Use Rs for amounts."""

    try:
        report_text = ask(prompt)
        return {
            "success": True,
            "report":  report_text,
            "month":   data.month,
            "stats":   {"income": income, "expense": expense, "savings": savings}
        }
    except Exception as e:
        return {"success": False, "report": f"Error generating report: {str(e)}"}
