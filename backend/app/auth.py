from datetime import datetime, timedelta
from typing import Optional
import os
import json
from dotenv import load_dotenv
import firebase_admin
from firebase_admin import credentials, auth
from passlib.context import CryptContext

load_dotenv()

# Initialize Firebase Admin
if not firebase_admin._apps:
    # Try environment variable first (for Render deployment)
    firebase_creds_json = os.getenv("FIREBASE_CREDENTIALS")
    if firebase_creds_json:
        cred_dict = json.loads(firebase_creds_json)
        cred = credentials.Certificate(cred_dict)
    else:
        # Fall back to file (for local development)
        cred_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), "firebase-service-account.json")
        cred = credentials.Certificate(cred_path)
    firebase_admin.initialize_app(cred)


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def verify_firebase_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        print(f"Error verifying firebase token: {e}")
        return None
