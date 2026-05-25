CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.groups (
  id          SERIAL PRIMARY KEY,
  name        TEXT NOT NULL,
  teacher_id  INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
)
