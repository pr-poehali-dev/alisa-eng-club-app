CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.users (
  id         SERIAL PRIMARY KEY,
  name       TEXT NOT NULL,
  role       TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
)
