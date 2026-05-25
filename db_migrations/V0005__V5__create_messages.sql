CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.messages (
  id            SERIAL PRIMARY KEY,
  sender_id     INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  recipient_id  INTEGER REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  text          TEXT NOT NULL,
  is_broadcast  BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
)
