UPDATE t_p95371417_alisa_eng_club_app.users SET name = 'Ваня' WHERE id = 15;

INSERT INTO t_p95371417_alisa_eng_club_app.group_students (group_id, student_id, active)
VALUES (5, 15, TRUE)
ON CONFLICT (group_id, student_id) DO UPDATE SET active = TRUE;

UPDATE t_p95371417_alisa_eng_club_app.group_students SET active = FALSE WHERE student_id = 27;
UPDATE t_p95371417_alisa_eng_club_app.users SET active = FALSE WHERE id = 27
