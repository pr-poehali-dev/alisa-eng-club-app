"""
Авторизация пользователей Alisa Eng Club.
action=login  — вход по email+пароль
action=logout — выход
action=me     — получить текущего пользователя по токену из X-Session-Id заголовка
"""

import json
import os
import secrets
import bcrypt
import psycopg2

SCHEMA = "t_p95371417_alisa_eng_club_app"

CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}

# In-memory сессии: token -> user_id
_sessions: dict[str, int] = {}


def get_db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data: dict) -> dict:
    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False),
    }


def err(msg: str, code: int = 400) -> dict:
    return {
        "statusCode": code,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"error": msg}, ensure_ascii=False),
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action") or event.get("queryStringParameters", {}).get("action", "me")

    # --- ME ---
    if action == "me":
        token = (event.get("headers") or {}).get("X-Session-Id", "")
        if not token or token not in _sessions:
            return err("Не авторизован", 401)
        user = _get_user(_sessions[token])
        if not user:
            return err("Пользователь не найден", 404)
        return ok({"user": user})

    # --- LOGIN ---
    if action == "login":
        email = (body.get("email") or "").strip().lower()
        password = (body.get("password") or "").strip()
        if not email or not password:
            return err("Введите email и пароль", 400)
        user = _get_user_by_email(email)
        if not user:
            return err("Неверный email или пароль", 401)
        pw_hash = user.pop("password_hash", None)
        if not pw_hash or not bcrypt.checkpw(password.encode(), pw_hash.encode()):
            return err("Неверный email или пароль", 401)
        token = secrets.token_hex(32)
        _sessions[token] = user["id"]
        return ok({"token": token, "user": user})

    # --- LOGOUT ---
    if action == "logout":
        token = (event.get("headers") or {}).get("X-Session-Id", "")
        if token and token in _sessions:
            del _sessions[token]
        return ok({"ok": True})

    return err("Unknown action", 400)


def _get_user(user_id: int) -> dict | None:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, role, teacher_id, email FROM {SCHEMA}.users WHERE id = {int(user_id)}"
        )
        row = cur.fetchone()
        if not row:
            return None
        return {"id": row[0], "name": row[1], "role": row[2], "teacher_id": row[3], "email": row[4]}
    finally:
        conn.close()


def _get_user_by_email(email: str) -> dict | None:
    safe = email.replace("'", "''")
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, role, teacher_id, email, password_hash FROM {SCHEMA}.users WHERE email = '{safe}'"
        )
        row = cur.fetchone()
        if not row:
            return None
        return {
            "id": row[0], "name": row[1], "role": row[2],
            "teacher_id": row[3], "email": row[4], "password_hash": row[5],
        }
    finally:
        conn.close()
