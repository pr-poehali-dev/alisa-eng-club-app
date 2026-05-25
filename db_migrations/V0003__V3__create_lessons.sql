ALTER TABLE t_p95371417_alisa_eng_club_app.users
  ADD COLUMN IF NOT EXISTS role_check TEXT;

CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.lessons (
  id          SERIAL PRIMARY KEY,
  day_of_week INTEGER NOT NULL,
  time_start  TIME NOT NULL,
  subject     TEXT NOT NULL,
  teacher_id  INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  room        TEXT NOT NULL DEFAULT 'Zoom #1',
  duration    TEXT NOT NULL DEFAULT '60 мин',
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
