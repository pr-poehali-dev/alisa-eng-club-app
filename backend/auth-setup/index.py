"""
Утилита для генерации bcrypt-хэша и обновления паролей в БД.
POST / с {"action": "set_password", "email": "...", "password": "..."} — устанавливает пароль
GET  /?action=hash&password=xxx — возвращает bcrypt хэш (для отладки)
"""

import json
import os
import bcrypt
import psycopg2

SCHEMA = "t_p95371417_alisa_eng_club_app"
CORS = {"Access-Control-Allow-Origin": "*", "Access-Control-Allow-Methods": "GET, POST, OPTIONS", "Access-Control-Allow-Headers": "Content-Type"}


def ok(data):
    return {"statusCode": 200, "headers": {**CORS, "Content-Type": "application/json"}, "body": json.dumps(data, ensure_ascii=False)}


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    qs = event.get("queryStringParameters") or {}
    action = body.get("action") or qs.get("action", "")

    if action == "hash":
        pw = qs.get("password") or body.get("password") or ""
        h = bcrypt.hashpw(pw.encode(), bcrypt.gensalt(12)).decode()
        return ok({"hash": h})

    if action == "set_password":
        email = (body.get("email") or "").strip().lower()
        password = (body.get("password") or "").strip()
        h = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
        safe_email = email.replace("'", "''")
        safe_hash = h.replace("'", "''")
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        try:
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET password_hash = '{safe_hash}' WHERE email = '{safe_email}'")
            conn.commit()
            cur.execute(f"SELECT id, name, email FROM {SCHEMA}.users WHERE email = '{safe_email}'")
            row = cur.fetchone()
        finally:
            conn.close()
        if not row:
            return ok({"error": "user not found"})
        return ok({"ok": True, "user": {"id": row[0], "name": row[1], "email": row[2]}})

    if action == "set_all_passwords":
        password = (body.get("password") or "").strip()
        if not password:
            return ok({"error": "password required"})
        h = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
        safe_hash = h.replace("'", "''")
        conn = psycopg2.connect(os.environ["DATABASE_URL"])
        try:
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET password_hash = '{safe_hash}'")
            conn.commit()
            cur.execute(f"SELECT COUNT(*) FROM {SCHEMA}.users")
            count = cur.fetchone()[0]
        finally:
            conn.close()
        return ok({"ok": True, "updated": count, "password": password})

    return ok({"error": "unknown action"})
