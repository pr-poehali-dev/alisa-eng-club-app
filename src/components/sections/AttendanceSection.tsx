import { useState } from "react";
import { User, DEMO_USERS } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface LessonAttendance {
  lessonId: string;
  date: string;
  subject: string;
  teacherName: string;
  records: Record<string, "present" | "absent" | "late">;
}

const STUDENTS_T1 = ["s1", "s2"];
const STUDENTS_T2 = ["s3", "s4"];

function genRecords(ids: string[], presentProb = 0.8): Record<string, "present" | "absent" | "late"> {
  const r: Record<string, "present" | "absent" | "late"> = {};
  ids.forEach((id) => {
    const rand = Math.random();
    r[id] = rand < presentProb ? "present" : rand < 0.9 ? "late" : "absent";
  });
  return r;
}

const INITIAL_ATTENDANCE: LessonAttendance[] = [
  { lessonId: "l1", date: "2026-05-19", subject: "Elementary A", teacherName: "Анна Ковалёва", records: genRecords(STUDENTS_T1) },
  { lessonId: "l2", date: "2026-05-19", subject: "Pre-Intermediate", teacherName: "Дмитрий Волков", records: genRecords(STUDENTS_T2) },
  { lessonId: "l3", date: "2026-05-21", subject: "Elementary A", teacherName: "Анна Ковалёва", records: genRecords(STUDENTS_T1) },
  { lessonId: "l4", date: "2026-05-21", subject: "Pre-Intermediate", teacherName: "Дмитрий Волков", records: genRecords(STUDENTS_T2) },
  { lessonId: "l5", date: "2026-05-22", subject: "Elementary A", teacherName: "Анна Ковалёва", records: genRecords(STUDENTS_T1) },
  { lessonId: "l6", date: "2026-05-23", subject: "Elementary A", teacherName: "Анна Ковалёва", records: genRecords(STUDENTS_T1) },
  { lessonId: "l7", date: "2026-05-23", subject: "Pre-Intermediate", teacherName: "Дмитрий Волков", records: genRecords(STUDENTS_T2) },
  { lessonId: "l8", date: "2026-05-25", subject: "Elementary A", teacherName: "Анна Ковалёва", records: { s1: "present", s2: "present" } },
];

const STATUS_LABEL: Record<"present" | "absent" | "late", string> = { present: "Присутствовал", absent: "Отсутствовал", late: "Опоздал" };
const STATUS_COLOR: Record<"present" | "absent" | "late", string> = {
  present: "bg-emerald-100 text-emerald-700",
  absent: "bg-red-100 text-red-700",
  late: "bg-amber-100 text-amber-700",
};
const STATUS_DOT: Record<"present" | "absent" | "late", string> = {
  present: "bg-emerald-500",
  absent: "bg-red-500",
  late: "bg-amber-500",
};

export default function AttendanceSection({ user }: { user: User }) {
  const [attendance, setAttendance] = useState<LessonAttendance[]>(INITIAL_ATTENDANCE);

  const canEdit = user.role === "teacher" || user.role === "admin";

  const visibleLessons = attendance.filter((la) => {
    if (user.role === "student") return la.records[user.id] !== undefined;
    if (user.role === "teacher") return la.teacherName === (user.id === "t1" ? "Анна Ковалёва" : "Дмитрий Волков");
    return true;
  });

  const getStudentsForLesson = (la: LessonAttendance) => {
    return Object.keys(la.records).map((sid) => ({
      id: sid,
      name: DEMO_USERS.find((u) => u.id === sid)?.name ?? sid,
      status: la.records[sid],
    }));
  };

  const updateStatus = (lessonId: string, studentId: string, status: "present" | "absent" | "late") => {
    setAttendance((prev) =>
      prev.map((la) =>
        la.lessonId === lessonId
          ? { ...la, records: { ...la.records, [studentId]: status } }
          : la
      )
    );
  };

  // Stats for student view
  const studentStats = () => {
    const myLessons = attendance.filter((la) => la.records[user.id] !== undefined);
    const present = myLessons.filter((la) => la.records[user.id] === "present").length;
    const late = myLessons.filter((la) => la.records[user.id] === "late").length;
    const absent = myLessons.filter((la) => la.records[user.id] === "absent").length;
    const pct = myLessons.length > 0 ? Math.round(((present + late) / myLessons.length) * 100) : 0;
    return { total: myLessons.length, present, late, absent, pct };
  };

  const stats = user.role === "student" ? studentStats() : null;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground">Табель посещаемости</h2>
        <p className="text-muted-foreground text-sm mt-0.5">Автоматически сохраняется по итогам каждого урока</p>
      </div>

      {/* Student stats */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          {[
            { label: "Всего уроков", value: stats.total, color: "text-foreground" },
            { label: "Присутствовал", value: stats.present, color: "text-emerald-600" },
            { label: "Опоздал", value: stats.late, color: "text-amber-600" },
            { label: "Пропустил", value: stats.absent, color: "text-red-600" },
          ].map((s) => (
            <div key={s.label} className="bg-card border border-border rounded-xl p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-1">{s.label}</div>
            </div>
          ))}
          <div className="col-span-2 sm:col-span-4 bg-card border border-border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-foreground">Посещаемость</span>
              <span className="text-sm font-bold text-primary">{stats.pct}%</span>
            </div>
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${stats.pct >= 80 ? "bg-emerald-500" : stats.pct >= 60 ? "bg-amber-500" : "bg-red-500"}`}
                style={{ width: `${stats.pct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Lesson records */}
      <div className="space-y-3">
        {visibleLessons
          .sort((a, b) => b.date.localeCompare(a.date))
          .map((la) => {
            const lessonStudents = getStudentsForLesson(la);

            return (
              <div key={la.lessonId} className="bg-card border border-border rounded-xl overflow-hidden">
                <div className="flex items-center gap-4 px-4 py-3 border-b border-border/60">
                  <div className="text-sm font-semibold text-foreground">{la.subject}</div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Icon name="Calendar" size={12} />
                    {new Date(la.date).toLocaleDateString("ru-RU", { day: "numeric", month: "long" })}
                  </div>
                  <div className="text-xs text-muted-foreground">{la.teacherName}</div>
                </div>

                {user.role === "student" ? (
                  <div className="px-4 py-3 flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${STATUS_DOT[la.records[user.id]]}`} />
                    <span className={`text-sm font-medium px-2.5 py-1 rounded-full ${STATUS_COLOR[la.records[user.id]]}`}>
                      {STATUS_LABEL[la.records[user.id]]}
                    </span>
                  </div>
                ) : (
                  <div className="divide-y divide-border/40">
                    {lessonStudents.map((s) => (
                      <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-2 h-2 rounded-full ${STATUS_DOT[s.status]}`} />
                          <span className="text-sm text-foreground">{s.name}</span>
                        </div>
                        <div className="flex gap-1.5">
                          {(["present", "late", "absent"] as const).map((st) => (
                            <button
                              key={st}
                              onClick={() => canEdit && updateStatus(la.lessonId, s.id, st)}
                              disabled={!canEdit}
                              className={`text-xs px-2.5 py-1 rounded-full font-medium transition-all
                                ${s.status === st ? STATUS_COLOR[st] : "bg-muted text-muted-foreground hover:bg-secondary"}
                                ${!canEdit ? "cursor-default" : "cursor-pointer"}`}
                            >
                              {st === "present" ? "Присут." : st === "late" ? "Опоздал" : "Отсут."}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {visibleLessons.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="ClipboardList" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Записей нет</p>
        </div>
      )}
    </div>
  );
}
