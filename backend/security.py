import os
from dataclasses import dataclass
from dotenv import load_dotenv
from fastapi import Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWTError, decode
bearer = HTTPBearer(auto_error=False)
load_dotenv(os.path.join(os.path.dirname(__file__), ".env"))
@dataclass
class Identity: user_id: str; email: str | None; name: str | None
def current_identity(credentials: HTTPAuthorizationCredentials | None = Depends(bearer)) -> Identity:
    if not credentials: raise HTTPException(401, "Authorization: Bearer <Supabase access token> is required")
    secret = os.getenv("SUPABASE_JWT_SECRET")
    if not secret: raise HTTPException(503, "Supabase JWT verification is not configured")
    try:
        claims = decode(credentials.credentials, secret, algorithms=["HS256"], audience="authenticated")
        return Identity(str(claims["sub"]), claims.get("email"), claims.get("user_metadata", {}).get("full_name"))
    except PyJWTError: raise HTTPException(401, "Invalid or expired access token")
