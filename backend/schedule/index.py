"""
API расписания Alisa Eng Club.
action=list   — уроки для пользователя {user_id, role, date_from?, date_to?}
action=create — создать урок {group_id, lesson_date?, time_start, duration, room, recurring, weekday?}
action=delete — удалить урок {lesson_id}
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


def handler(event: dict, context) -> dict:
    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": CORS, "body": ""}

    body = json.loads(event.get("body") or "{}")
    action = body.get("action", "list")

    conn = db()
    try:
        cur = conn.cursor()

        # --- LIST ---
        if action == "list":
            user_id = int(body.get("user_id") or 0)
            role = (body.get("role") or "").strip()

            # Получаем group_id доступных пользователю групп
            if role == "student":
                cur.execute(f"""
                    SELECT gs.group_id FROM {SCHEMA}.group_students gs
                    WHERE gs.student_id = {user_id} AND gs.active = TRUE
                """)
            elif role == "teacher":
                cur.execute(f"""
                    SELECT id FROM {SCHEMA}.groups
                    WHERE teacher_id = {user_id} AND active = TRUE
                """)
            else:  # admin — все
                cur.execute(f"SELECT id FROM {SCHEMA}.groups WHERE active = TRUE")

            group_ids = [r[0] for r in cur.fetchall()]
            if not group_ids:
                return ok({"lessons": []})

            gids = ",".join(str(g) for g in group_ids)
            cur.execute(f"""
                SELECT l.id, l.group_id, g.name AS group_name, g.teacher_id,
                       u.name AS teacher_name,
                       l.lesson_date, l.time_start, l.duration, l.room,
                       l.recurring, l.weekday
                FROM {SCHEMA}.lessons l
                JOIN {SCHEMA}.groups g ON g.id = l.group_id
                JOIN {SCHEMA}.users u ON u.id = g.teacher_id
                WHERE l.group_id IN ({gids}) AND l.active = TRUE
                ORDER BY l.lesson_date, l.time_start
            """)
            lessons = []
            for r in cur.fetchall():
                lessons.append({
                    "id": r[0],
                    "group_id": r[1],
                    "group_name": r[2],
                    "teacher_id": r[3],
                    "teacher_name": r[4],
                    "date": str(r[5]) if r[5] else None,
                    "time": str(r[6])[:5] if r[6] else None,
                    "duration": r[7],
                    "room": r[8],
                    "recurring": r[9],
                    "weekday": r[10],
                })
            return ok({"lessons": lessons})

        # --- CREATE ---
        if action == "create":
            group_id  = int(body.get("group_id") or 0)
            time_start = (body.get("time") or "").strip()
            duration   = (body.get("duration") or "60 мин").strip()
            room       = (body.get("room") or "Zoom").strip().replace("'", "''")
            recurring  = bool(body.get("recurring", False))
            lesson_date = body.get("date") or None
            weekday    = body.get("weekday")

            if not group_id or not time_start:
                return err("group_id и time обязательны")

            # Получаем teacher_id из группы для NOT NULL constraint
            cur.execute(f"SELECT teacher_id FROM {SCHEMA}.groups WHERE id = {group_id}")
            grow_pre = cur.fetchone()
            if not grow_pre:
                return err("Группа не найдена")
            teacher_id = grow_pre[0]

            from datetime import date as dt_date, datetime
            if lesson_date:
                d = datetime.strptime(lesson_date, "%Y-%m-%d")
                dow = (d.weekday())  # 0=Пн
            else:
                dow = int(weekday) if weekday is not None else 0

            date_sql = f"'{lesson_date}'" if lesson_date else "NULL"
            weekday_sql = str(int(weekday)) if weekday is not None else str(dow)

            cur.execute(f"""
                INSERT INTO {SCHEMA}.lessons
                  (group_id, teacher_id, day_of_week, lesson_date, time_start, duration, room, recurring, weekday, subject)
                VALUES
                  ({group_id}, {teacher_id}, {dow}, {date_sql}, '{time_start}', '{duration}', '{room}',
                   {'TRUE' if recurring else 'FALSE'}, {weekday_sql}, '')
                RETURNING id, group_id, lesson_date, time_start, duration, room, recurring, weekday
            """)
            row = cur.fetchone()
            conn.commit()

            # Получаем имя группы и преподавателя
            cur.execute(f"""
                SELECT g.name, g.teacher_id, u.name FROM {SCHEMA}.groups g
                JOIN {SCHEMA}.users u ON u.id = g.teacher_id
                WHERE g.id = {group_id}
            """)
            grow = cur.fetchone()

            return ok({"lesson": {
                "id": row[0],
                "group_id": row[1],
                "group_name": grow[0] if grow else "",
                "teacher_id": grow[1] if grow else None,
                "teacher_name": grow[2] if grow else "",
                "date": str(row[2]) if row[2] else None,
                "time": str(row[3])[:5] if row[3] else None,
                "duration": row[4],
                "room": row[5],
                "recurring": row[6],
                "weekday": row[7],
            }})

        # --- DELETE ---
        if action == "delete":
            lesson_id = int(body.get("lesson_id") or 0)
            if not lesson_id:
                return err("lesson_id обязателен")
            cur.execute(f"UPDATE {SCHEMA}.lessons SET active = FALSE WHERE id = {lesson_id}")
            conn.commit()
            return ok({"ok": True})

        return err("Unknown action")

    finally:
        conn.close()