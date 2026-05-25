CREATE TABLE IF NOT EXISTS t_p95371417_alisa_eng_club_app.group_students (
  group_id    INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.groups(id),
  student_id  INTEGER NOT NULL REFERENCES t_p95371417_alisa_eng_club_app.users(id),
  PRIMARY KEY (group_id, student_id)
)
