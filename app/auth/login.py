"""
This module provides an endpoint to authenticate users.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import HTMLResponse
from app.config import supabase, max_users
import uuid


router = APIRouter()

SUCCESS_PAGE = """
<html>
  <head>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Logged in</title>
  </head>
  <body style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align:center; padding-top: 15vh;">
    <h2>✅ Logged in successfully!</h2>
    <p>Your demo account has been created.</p>
  </body>
</html>
"""

@router.get("/qr-login")
def login():
    # create a new supabase user every time someone scans
    email = f"user_{uuid.uuid4()}@example.com"
    user_id = str(uuid.uuid4())

    supabase.table("qr_users").insert({
        "user_id": user_id,
        "email": email,
    }).execute()

    current = supabase.table("qr_users").select("*").order("created_at", desc=False).execute()
    rows = current.data or []

    if len(rows) > max_users:
        # delete oldest extra users
        extra = len(rows) - max_users
        to_delete = rows[:extra]
        for row in to_delete:
            old_user_id = row["user_id"]
            # delete from table
            supabase.table("qr_users").delete().eq("user_id", old_user_id).execute()

    # always show the success page
    return HTMLResponse(content=SUCCESS_PAGE, status_code=200)

