CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.materials (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  type         TEXT NOT NULL DEFAULT 'doc',
  url          TEXT NOT NULL DEFAULT '#',
  level        TEXT NOT NULL DEFAULT 'All levels',
  uploaded_by  INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.attendance (
  id          SERIAL PRIMARY KEY,
  lesson_id   INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.lessons(id),
  student_id  INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  lesson_date DATE NOT NULL,
  status      TEXT NOT NULL DEFAULT 'absent',
  marked_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (lesson_id, student_id, lesson_date)
)
