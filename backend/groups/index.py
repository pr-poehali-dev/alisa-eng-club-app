"""
API для управления группами Alisa Eng Club.
action=list           — все активные группы с преподавателем и учениками
action=my_groups      — группы текущего пользователя {user_id, role}
action=users          — список пользователей для выпадашек {role?}
action=create         — создать группу {name, teacher_id}
action=update         — обновить группу {group_id, name?, teacher_id?}
action=delete_group   — деактивировать группу {group_id}
action=add_student    — добавить ученика в группу {group_id, student_id}
action=remove_student — убрать ученика из группы {group_id, student_id}
"""

import json
import os
import psycopg2

SCHEMA = "t_p95371417_alisa_eng_club_app"
CORS = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, X-Session-Id",
}


def db():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def ok(data):
    return {
        "statusCode": 200,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps(data, ensure_ascii=False, default=str),
    }


def err(msg, code=400):
    return {
        "statusCode": code,
        "headers": {**CORS, "Content-Type": "application/json"},
        "body": json.dumps({"error": msg}, ensure_ascii=False),
    }


def get_group_full(conn, gid: int) -> dict:
    cur = conn.cursor()
    cur.execute(f"""
        SELECT g.id, g.name, g.teacher_id, u.name AS teacher_name, g.active
        FROM {SCHEMA}.groups g
        JOIN {SCHEMA}.users u ON u.id = g.teacher_id
        WHERE g.id = {gid}
    """)
    row = cur.fetchone()
    if not row:
        return {}
    cur2 = conn.cursor()
    cur2.execute(f"""
        SELECT s.id, s.name FROM {SCHEMA}.group_students gs
        JOIN {SCHEMA}.users s ON s.id = gs.student_id
        WHERE gs.group_id = {gid} AND gs.active = TRUE
        ORDER BY s.name
    """)
    students = [{"id": r[0], "name": r[1]} for r in cur2.fetchall()]
    return {
        "id": row[0], "name": row[1],
        "teacher_id": row[2], "teacher_name": row[3],
        "active": row[4], "students": students,
    }


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    qs = event.get("queryStringParameters") or {}
    action = body.get("action") or qs.get("action", "list")

    conn = db()
    try:
        cur = conn.cursor()

        if action == "list":
            cur.execute(f"""
                SELECT g.id, g.name, g.teacher_id, u.name, g.created_at
                FROM {SCHEMA}.groups g
                JOIN {SCHEMA}.users u ON u.id = g.teacher_id
                WHERE g.active = TRUE ORDER BY g.name
            """)
            groups = []
            for row in cur.fetchall():
                gid = row[0]
                c2 = conn.cursor()
                c2.execute(f"""
                    SELECT s.id, s.name FROM {SCHEMA}.group_students gs
                    JOIN {SCHEMA}.users s ON s.id = gs.student_id
                    WHERE gs.group_id = {gid} AND gs.active = TRUE ORDER BY s.name
                """)
                groups.append({
                    "id": row[0], "name": row[1],
                    "teacher_id": row[2], "teacher_name": row[3],
                    "students": [{"id": r[0], "name": r[1]} for r in c2.fetchall()],
                    "created_at": str(row[4]),
                })
            return ok({"groups": groups})

        if action == "my_groups":
            user_id = int(body.get("user_id") or 0)
            role = (body.get("role") or "").strip()
            if not user_id:
                return err("user_id required")
            if role == "teacher":
                cur.execute(f"""
                    SELECT g.id, g.name, g.teacher_id, u.name FROM {SCHEMA}.groups g
                    JOIN {SCHEMA}.users u ON u.id = g.teacher_id
                    WHERE g.teacher_id = {user_id} AND g.active = TRUE ORDER BY g.name
                """)
            elif role == "student":
                cur.execute(f"""
                    SELECT g.id, g.name, g.teacher_id, u.name FROM {SCHEMA}.groups g
                    JOIN {SCHEMA}.users u ON u.id = g.teacher_id
                    JOIN {SCHEMA}.group_students gs ON gs.group_id = g.id
                    WHERE gs.student_id = {user_id} AND gs.active = TRUE AND g.active = TRUE ORDER BY g.name
                """)
            else:
                cur.execute(f"""
                    SELECT g.id, g.name, g.teacher_id, u.name FROM {SCHEMA}.groups g
                    JOIN {SCHEMA}.users u ON u.id = g.teacher_id
                    WHERE g.active = TRUE ORDER BY g.name
                """)
            groups = [{"id": r[0], "name": r[1], "teacher_id": r[2], "teacher_name": r[3]}
                      for r in cur.fetchall()]
            return ok({"groups": groups})

        if action == "users":
            role_filter = (body.get("role") or "").strip()
            if role_filter:
                safe = role_filter.replace("'", "''")
                cur.execute(f"SELECT id, name, role FROM {SCHEMA}.users WHERE role = '{safe}' ORDER BY name")
            else:
                cur.execute(f"SELECT id, name, role FROM {SCHEMA}.users ORDER BY name")
            return ok({"users": [{"id": r[0], "name": r[1], "role": r[2]} for r in cur.fetchall()]})

        if action == "create":
            name = (body.get("name") or "").strip()
            teacher_id = int(body.get("teacher_id") or 0)
            if not name or not teacher_id:
                return err("name и teacher_id обязательны")
            safe_name = name.replace("'", "''")
            cur.execute(f"""
                INSERT INTO {SCHEMA}.groups (name, teacher_id)
                VALUES ('{safe_name}', {teacher_id}) RETURNING id
            """)
            new_id = cur.fetchone()[0]
            conn.commit()
            return ok({"group": get_group_full(conn, new_id)})

        if action == "update":
            group_id = int(body.get("group_id") or 0)
            caller_id = int(body.get("caller_id") or 0)
            caller_role = (body.get("caller_role") or "").strip()
            if not group_id:
                return err("group_id обязателен")
            # Преподаватель может менять только имя своих групп
            if caller_role == "teacher" and caller_id:
                cur.execute(f"SELECT teacher_id FROM {SCHEMA}.groups WHERE id = {group_id}")
                row = cur.fetchone()
                if not row or row[0] != caller_id:
                    return err("Нет доступа к этой группе", 403)
            sets = []
            if body.get("name"):
                safe_name = str(body["name"]).strip().replace("'", "''")
                sets.append(f"name = '{safe_name}'")
            # Смена преподавателя — только для admin
            if body.get("teacher_id") and caller_role == "admin":
                sets.append(f"teacher_id = {int(body['teacher_id'])}")
            if not sets:
                return err("Нечего обновлять")
            cur.execute(f"UPDATE {SCHEMA}.groups SET {', '.join(sets)} WHERE id = {group_id}")
            conn.commit()
            return ok({"group": get_group_full(conn, group_id)})

        if action == "delete_group":
            group_id = int(body.get("group_id") or 0)
            if not group_id:
                return err("group_id обязателен")
            cur.execute(f"UPDATE {SCHEMA}.groups SET active = FALSE WHERE id = {group_id}")
            conn.commit()
            return ok({"ok": True})

        if action == "add_student":
            group_id = int(body.get("group_id") or 0)
            student_id = int(body.get("student_id") or 0)
            if not group_id or not student_id:
                return err("group_id и student_id обязательны")
            cur.execute(f"""
                SELECT active FROM {SCHEMA}.group_students
                WHERE group_id = {group_id} AND student_id = {student_id}
            """)
            existing = cur.fetchone()
            if existing is None:
                cur.execute(f"""
                    INSERT INTO {SCHEMA}.group_students (group_id, student_id, active)
                    VALUES ({group_id}, {student_id}, TRUE)
                """)
            else:
                cur.execute(f"""
                    UPDATE {SCHEMA}.group_students SET active = TRUE
                    WHERE group_id = {group_id} AND student_id = {student_id}
                """)
            conn.commit()
            return ok({"group": get_group_full(conn, group_id)})

        if action == "remove_student":
            group_id = int(body.get("group_id") or 0)
            student_id = int(body.get("student_id") or 0)
            if not group_id or not student_id:
                return err("group_id и student_id обязательны")
            cur.execute(f"""
                UPDATE {SCHEMA}.group_students SET active = FALSE
                WHERE group_id = {group_id} AND student_id = {student_id}
            """)
            conn.commit()
            return ok({"group": get_group_full(conn, group_id)})

        return err("Unknown action")

    finally:
        conn.close()