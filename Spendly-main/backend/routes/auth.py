from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
from database import get_conn
from auth_utils import hash_password, verify_password, create_access_token

router = APIRouter()

class RegisterInput(BaseModel):
    name: str
    email: str
    password: str

class LoginInput(BaseModel):
    email: str
    password: str

@router.post("/register")
def register(data: RegisterInput):
    conn = get_conn()
    existing = conn.execute("SELECT id FROM users WHERE email = ?", (data.email,)).fetchone()
    if existing:
        conn.close()
        raise HTTPException(status_code=400, detail="Email already registered")
    hashed = hash_password(data.password)
    conn.execute("INSERT INTO users (name, email, password) VALUES (?,?,?)",
                 (data.name, data.email, hashed))
    conn.commit()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email,)).fetchone()
    conn.close()
    ttoken = create_access_token({"sub": str(user["id"])})
    return {"token": ttoken, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@router.post("/login")
def login(data: LoginInput):
    conn = get_conn()
    user = conn.execute("SELECT * FROM users WHERE email = ?", (data.email,)).fetchone()
    conn.close()
    if not user or not verify_password(data.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_access_token({"sub": str(user["id"])})
    return {"token": token, "user": {"id": user["id"], "name": user["name"], "email": user["email"]}}

@router.get("/me")
def me(user=__import__('fastapi').Depends(__import__('auth_utils').get_current_user)):
    return {"id": user["id"], "name": user["name"], "email": user["email"]}
