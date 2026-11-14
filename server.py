#!/usr/bin/env python3
"""
Smart Clothing Size Checker - Secure Backend Server with Database Authentication
Batch SC-24 | Department of AIML, IoT & RAI | VNRVJIET
Supervisor: Mr. U. Veeresh
Student Team: N. Gayathri, Sneha Sam, Swayam Prangya, K. Hema Sundhar, K. Manideep

Features:
- Cryptographic Password Hashing: PBKDF2-HMAC-SHA256 (100,000 rounds + 16-byte secure random salt)
- Dual Database Architecture: MongoDB driver support (mongodb://localhost:27017 or MONGO_URI)
  with automatic fallback to persistent SQLite document store (smart_size_checker.db)
- REST Endpoints for /api/auth/signup, /api/auth/login, /api/auth/profile, /api/db/status
- Zero-dependency local serving for static assets, live camera, and size-matching logic
"""

import http.server
import socketserver
import os
import sys
import json
import re
import sqlite3
import hashlib
import hmac
import secrets
import datetime
import urllib.parse
import webbrowser

PORT = 8080
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SQLITE_DB_PATH = os.path.join(BASE_DIR, "smart_size_checker.db")

# ==============================================================================
# 1. DATABASE LAYER (MongoDB with Persistent SQLite Document Store Fallback)
# ==============================================================================

class Database:
    def __init__(self):
        self.engine_name = "Persistent SQLite Document Store"
        self.is_mongodb = False
        self.mongo_collection = None
        self._init_mongodb()
        if not self.is_mongodb:
            self._init_sqlite()

    def _init_mongodb(self):
        """Attempts to connect to MongoDB if pymongo is installed and service is reachable."""
        try:
            import pymongo
            mongo_uri = os.environ.get("MONGO_URI", "mongodb://localhost:27017")
            client = pymongo.MongoClient(mongo_uri, serverSelectionTimeoutMS=800)
            client.admin.command('ping')
            db = client['smart_clothing_size_checker']
            self.mongo_collection = db['users']
            self.mongo_collection.create_index("email", unique=True)
            self.is_mongodb = True
            self.engine_name = f"MongoDB (Connected: {mongo_uri})"
            print(f" 🍃 MongoDB Database connected successfully: {mongo_uri}")
        except Exception:
            self.is_mongodb = False
            self.mongo_collection = None

    def _init_sqlite(self):
        """Initializes persistent SQLite database schema."""
        conn = sqlite3.connect(SQLITE_DB_PATH)
        cur = conn.cursor()
        cur.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id TEXT PRIMARY KEY,
                name TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                salt TEXT NOT NULL,
                body_profile TEXT,
                created_at TEXT NOT NULL,
                last_login TEXT NOT NULL
            )
        """)
        conn.commit()
        conn.close()
        self.engine_name = f"Persistent Secure SQLite Store ({os.path.basename(SQLITE_DB_PATH)})"
        print(f" 💾 Secure SQLite Document Store active: {SQLITE_DB_PATH}")

    @staticmethod
    def hash_password(password: str, salt: str = None) -> tuple:
        """Hashes password using PBKDF2-HMAC-SHA256 with 100,000 iterations."""
        if not salt:
            salt = secrets.token_hex(16)
        pw_hash = hashlib.pbkdf2_hmac(
            'sha256',
            password.encode('utf-8'),
            salt.encode('utf-8'),
            100000
        ).hex()
        return pw_hash, salt

    @staticmethod
    def verify_password(password: str, salt: str, expected_hash: str) -> bool:
        """Verifies password using constant-time string comparison to prevent timing attacks."""
        computed_hash, _ = Database.hash_password(password, salt)
        return hmac.compare_digest(computed_hash, expected_hash)

    def get_user_by_email(self, email: str):
        clean_email = email.strip().lower()
        if self.is_mongodb:
            doc = self.mongo_collection.find_one({"email": clean_email})
            if doc:
                doc['id'] = str(doc.get('_id', ''))
                return doc
            return None
        else:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            conn.row_factory = sqlite3.Row
            cur = conn.cursor()
            cur.execute("SELECT * FROM users WHERE LOWER(email) = LOWER(?)", (clean_email,))
            row = cur.fetchone()
            conn.close()
            return dict(row) if row else None

    def create_user(self, name: str, email: str, password: str) -> tuple:
        clean_name = name.strip()
        clean_email = email.strip().lower()

        # Check duplicate
        if self.get_user_by_email(clean_email):
            return False, "An account with this email already exists. Please log in.", None

        pw_hash, salt = self.hash_password(password)
        user_id = 'usr_' + secrets.token_hex(8)
        now = datetime.datetime.utcnow().isoformat() + "Z"

        default_body_profile = json.dumps({
            "gender": "unisex",
            "height": 68.0,
            "weight": 150.0,
            "chest": 38.0,
            "waist": 32.0,
            "hips": 39.0,
            "shoulder": 17.5,
            "inseam": 30.0
        })

        if self.is_mongodb:
            user_doc = {
                "id": user_id,
                "name": clean_name,
                "email": clean_email,
                "password_hash": pw_hash,
                "salt": salt,
                "body_profile": default_body_profile,
                "created_at": now,
                "last_login": now
            }
            self.mongo_collection.insert_one(user_doc)
        else:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO users (id, name, email, password_hash, salt, body_profile, created_at, last_login)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (user_id, clean_name, clean_email, pw_hash, salt, default_body_profile, now, now))
            conn.commit()
            conn.close()

        user_public = {
            "name": clean_name,
            "email": clean_email,
            "avatar": clean_name[0].upper() if clean_name else "👤"
        }
        return True, "Account registered successfully!", user_public

    def verify_user(self, email: str, password: str) -> tuple:
        clean_email = email.strip().lower()
        user = self.get_user_by_email(clean_email)
        if not user:
            return False, "No account found with this email. Please create an account.", None

        if not self.verify_password(password, user['salt'], user['password_hash']):
            return False, "Incorrect password. Please verify and try again.", None

        # Update last login timestamp
        now = datetime.datetime.utcnow().isoformat() + "Z"
        if self.is_mongodb:
            self.mongo_collection.update_one({"email": clean_email}, {"$set": {"last_login": now}})
        else:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            cur = conn.cursor()
            cur.execute("UPDATE users SET last_login = ? WHERE LOWER(email) = LOWER(?)", (now, clean_email))
            conn.commit()
            conn.close()

        # Parse stored body profile if present
        body_profile = None
        raw_bp = user.get('body_profile')
        if raw_bp:
            try:
                body_profile = json.loads(raw_bp) if isinstance(raw_bp, str) else raw_bp
            except Exception:
                body_profile = None

        user_public = {
            "name": user['name'],
            "email": user['email'],
            "avatar": user['name'][0].upper() if user['name'] else "👤",
            "bodyProfile": body_profile
        }
        return True, f"Welcome back, {user['name']}!", user_public

    def update_profile(self, email: str, body_profile: dict) -> bool:
        clean_email = email.strip().lower()
        bp_json = json.dumps(body_profile)
        if self.is_mongodb:
            res = self.mongo_collection.update_one({"email": clean_email}, {"$set": {"body_profile": bp_json}})
            return res.modified_count > 0
        else:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            cur = conn.cursor()
            cur.execute("UPDATE users SET body_profile = ? WHERE LOWER(email) = LOWER(?)", (bp_json, clean_email))
            conn.commit()
            updated = cur.rowcount > 0
            conn.close()
            return updated

    def count_users(self) -> int:
        if self.is_mongodb:
            return self.mongo_collection.count_documents({})
        else:
            conn = sqlite3.connect(SQLITE_DB_PATH)
            cur = conn.cursor()
            cur.execute("SELECT COUNT(*) FROM users")
            count = cur.fetchone()[0]
            conn.close()
            return count

db = Database()

# ==============================================================================
# 2. HTTP REQUEST HANDLER WITH REST AUTHENTICATION API
# ==============================================================================

class CustomHTTPHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Prevent caching for rapid development and allow cross-origin security
        self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

    def send_json(self, status_code: int, data: dict):
        body = json.dumps(data).encode('utf-8')
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        parsed = urllib.parse.urlparse(self.path)
        if parsed.path == '/api/db/status':
            self.send_json(200, {
                "success": True,
                "engine": db.engine_name,
                "isMongoDB": db.is_mongodb,
                "registeredUsers": db.count_users(),
                "algorithm": "PBKDF2-HMAC-SHA256 (100,000 iterations)",
                "status": "online"
            })
            return
        
        # Serve normal static files
        super().do_GET()

    def do_POST(self):
        parsed = urllib.parse.urlparse(self.path)
        api_path = parsed.path

        content_length = int(self.headers.get('Content-Length', 0))
        post_body = self.rfile.read(content_length).decode('utf-8') if content_length > 0 else '{}'

        try:
            payload = json.loads(post_body)
        except Exception:
            self.send_json(400, {"success": False, "message": "Invalid JSON request body."})
            return

        # -------------------------------------------------------------
        # 1. REGISTER / SIGNUP ENDPOINT
        # -------------------------------------------------------------
        if api_path in ('/api/auth/signup', '/api/auth/register'):
            name = payload.get('name', '').strip()
            email = payload.get('email', '').strip()
            password = payload.get('password', '')

            # Validation
            if not name or len(name) < 2:
                self.send_json(400, {"success": False, "message": "Full name must be at least 2 characters."})
                return
            if not email or not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                self.send_json(400, {"success": False, "message": "Please enter a valid email address (e.g. name@domain.com)."})
                return
            if not password or len(password) < 6:
                self.send_json(400, {"success": False, "message": "Password must be at least 6 characters long."})
                return

            success, message, user = db.create_user(name, email, password)
            status_code = 201 if success else 400
            self.send_json(status_code, {
                "success": success,
                "message": message,
                "user": user,
                "engine": db.engine_name
            })
            return

        # -------------------------------------------------------------
        # 2. LOGIN ENDPOINT
        # -------------------------------------------------------------
        elif api_path == '/api/auth/login':
            email = payload.get('email', '').strip()
            password = payload.get('password', '')

            if not email or not re.match(r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$', email):
                self.send_json(400, {"success": False, "message": "Please enter a valid email address."})
                return
            if not password:
                self.send_json(400, {"success": False, "message": "Password cannot be empty."})
                return

            success, message, user = db.verify_user(email, password)
            status_code = 200 if success else 401
            self.send_json(status_code, {
                "success": success,
                "message": message,
                "user": user,
                "engine": db.engine_name
            })
            return

        # -------------------------------------------------------------
        # 3. SAVE BODY PROFILE MEASUREMENTS
        # -------------------------------------------------------------
        elif api_path == '/api/auth/profile':
            email = payload.get('email', '').strip()
            body_profile = payload.get('bodyProfile')

            if not email or not body_profile:
                self.send_json(400, {"success": False, "message": "Email and bodyProfile are required."})
                return

            updated = db.update_profile(email, body_profile)
            self.send_json(200, {"success": updated, "message": "Profile measurements saved to database."})
            return

        else:
            self.send_json(404, {"success": False, "message": f"Endpoint {api_path} not found."})

# ==============================================================================
# 3. SERVER BOOTSTRAPPER
# ==============================================================================

def run_server():
    os.chdir(BASE_DIR)
    handler = CustomHTTPHandler
    
    port = PORT
    socketserver.TCPServer.allow_reuse_address = True
    for attempt_port in range(PORT, PORT + 10):
        try:
            with socketserver.TCPServer(("", attempt_port), handler) as httpd:
                print("\n" + "=" * 70)
                print(" ✨ SMART CLOTHING SIZE CHECKER - SECURE FULL-STACK PORTAL")
                print(" Department of AIML, IoT & RAI | VNRVJIET (Batch SC-24)")
                print(" Supervisor: Mr. U. Veeresh")
                print(f" 🌐 Web Application: http://localhost:{attempt_port}")
                print(f" 🔒 Security Engine: PBKDF2-HMAC-SHA256 (100,000 Rounds + Salt)")
                print(f" 📦 Database Engine: {db.engine_name}")
                print(" 📷 Live camera, size-chart OCR detection & URL analysis fully active.")
                print("=" * 70 + "\n")
                sys.stdout.flush()
                
                httpd.serve_forever()
                break
        except OSError:
            continue

if __name__ == '__main__':
    try:
        run_server()
    except KeyboardInterrupt:
        print("\nServer gracefully stopped.")
        sys.exit(0)

