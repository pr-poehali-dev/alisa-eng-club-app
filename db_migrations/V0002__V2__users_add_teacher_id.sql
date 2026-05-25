ALTER TABLE t_p95371417_alisa_eng_club_app.users
  ADD COLUMN IF NOT EXISTS teacher_id INTEGER REFERENCES t_p95371417_alisa_eng_club_app.users(id)
