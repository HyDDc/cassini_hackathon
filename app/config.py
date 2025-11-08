import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()  # load from .env

SUPABASE_URL = os.getenv("SUPABASE_URL", "https://dujlalvcyqzouibkdymd.supabase.co")
SUPABASE_KEY = os.getenv("SUPABASE_KEY", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImR1amxhbHZjeXF6b3VpYmtkeW1kIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI2MDk4MjcsImV4cCI6MjA3ODE4NTgyN30.kSonnNwcbJ2qfrFJCbpEiWvITX259e-EBbuGUalooLo")

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)
max_users = os.getenv("MAX_USERS", 30)
