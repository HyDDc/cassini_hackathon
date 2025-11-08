"""Main application entry point"""
from fastapi import FastAPI
from app.auth import login

app = FastAPI(
    title = "Re-patterning",
    description = "A simple app to re-pattern environmental factors and visualise the impact",
    cersion = "1.0.0"
)

app.include_router(login.router)

@app.get("/")
def home():
    """Root endpoint to display the welcome message."""
    return {"message": "You're ready to re-pattern your world"}