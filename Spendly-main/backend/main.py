from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import init_db
from routes import auth, transactions, budgets, goals, analytics, ai

app = FastAPI(title="Spendly API", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
def startup():
    init_db()

app.include_router(auth.router,         prefix="/auth",         tags=["Auth"])
app.include_router(transactions.router, prefix="/transactions", tags=["Transactions"])
app.include_router(budgets.router,      prefix="/budgets",      tags=["Budgets"])
app.include_router(goals.router,        prefix="/goals",        tags=["Goals"])
app.include_router(analytics.router,    prefix="/analytics",    tags=["Analytics"])
app.include_router(ai.router,           prefix="/ai",           tags=["AI"])

@app.get("/")
def root():
    return {"message": "Spendly API v2 is running"}
