CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.homeworks (
  id           SERIAL PRIMARY KEY,
  title        TEXT NOT NULL,
  description  TEXT,
  due_date     DATE,
  teacher_id   INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.homework_students (
  homework_id  INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.homeworks(id),
  student_id   INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  PRIMARY KEY (homework_id, student_id)
);

CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.homework_submissions (
  id           SERIAL PRIMARY KEY,
  homework_id  INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.homeworks(id),
  student_id   INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  text         TEXT NOT NULL,
  grade        TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (homework_id, student_id)
)
