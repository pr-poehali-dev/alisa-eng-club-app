"""
Авторизация и управление пользователями Alisa Eng Club.
action=login        — вход по email+пароль
action=logout       — выход
action=me           — получить текущего пользователя по X-Session-Id
action=list_users   — список всех пользователей (только admin)
action=create_user  — создать пользователя {name, email, password, role} (только admin)
action=delete_user  — деактивировать пользователя {user_id} (только admin)
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


def _get_session_user(event: dict) -> dict | None:
    token = (event.get("headers") or {}).get("X-Session-Id", "")
    if not token or token not in _sessions:
        return None
    return _get_user(_sessions[token])


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action") or (event.get("queryStringParameters") or {}).get("action", "me")

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

    # --- LIST_USERS (только admin) ---
    if action == "list_users":
        caller = _get_session_user(event)
        if not caller or caller["role"] != "admin":
            return err("Доступ запрещён", 403)
        conn = get_db()
        try:
            cur = conn.cursor()
            cur.execute(f"""
                SELECT id, name, role, email, active
                FROM {SCHEMA}.users
                WHERE active = TRUE
                ORDER BY role, name
            """)
            users = [
                {"id": r[0], "name": r[1], "role": r[2], "email": r[3]}
                for r in cur.fetchall()
            ]
            return ok({"users": users})
        finally:
            conn.close()

    # --- CREATE_USER (только admin) ---
    if action == "create_user":
        caller = _get_session_user(event)
        if not caller or caller["role"] != "admin":
            return err("Доступ запрещён", 403)

        name = (body.get("name") or "").strip()
        email = (body.get("email") or "").strip().lower()
        password = (body.get("password") or "").strip()
        role = (body.get("role") or "student").strip()

        if not name or not email or not password:
            return err("Имя, email и пароль обязательны")
        if role not in ("student", "teacher", "admin"):
            return err("Неверная роль")

        # Проверяем уникальность email
        existing = _get_user_by_email(email)
        if existing:
            return err("Пользователь с таким email уже существует")

        pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt(12)).decode()
        safe_name = name.replace("'", "''")
        safe_email = email.replace("'", "''")
        safe_hash = pw_hash.replace("'", "''")

        conn = get_db()
        try:
            cur = conn.cursor()
            cur.execute(f"""
                INSERT INTO {SCHEMA}.users (name, role, email, password_hash)
                VALUES ('{safe_name}', '{role}', '{safe_email}', '{safe_hash}')
                RETURNING id, name, role, email
            """)
            row = cur.fetchone()
            conn.commit()
            return ok({"user": {"id": row[0], "name": row[1], "role": row[2], "email": row[3]}})
        finally:
            conn.close()

    # --- DELETE_USER (только admin, мягкое удаление) ---
    if action == "delete_user":
        caller = _get_session_user(event)
        if not caller or caller["role"] != "admin":
            return err("Доступ запрещён", 403)

        user_id = int(body.get("user_id") or 0)
        if not user_id:
            return err("user_id обязателен")
        if user_id == caller["id"]:
            return err("Нельзя удалить самого себя")

        conn = get_db()
        try:
            cur = conn.cursor()
            cur.execute(f"UPDATE {SCHEMA}.users SET active = FALSE WHERE id = {user_id}")
            conn.commit()
            return ok({"ok": True})
        finally:
            conn.close()

    return err("Unknown action", 400)


def _get_user(user_id: int) -> dict | None:
    conn = get_db()
    try:
        cur = conn.cursor()
        cur.execute(
            f"SELECT id, name, role, teacher_id, email FROM {SCHEMA}.users WHERE id = {int(user_id)} AND active = TRUE"
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
