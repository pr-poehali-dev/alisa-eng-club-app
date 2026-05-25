CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.lesson_students (
  lesson_id   INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.lessons(id),
  student_id  INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  PRIMARY KEY (lesson_id, student_id)
)
