import { useState } from "react";
import { User, DEMO_USERS } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Submission {
  studentId: string;
  studentName: string;
  text: string;
  submittedAt: Date;
  grade?: string;
}

interface Homework {
  id: string;
  title: string;
  description: string;
  dueDate: string;
  teacherId: string;
  teacherName: string;
  studentIds: string[];
  submissions: Submission[];
  createdAt: Date;
}

const INITIAL_HW: Homework[] = [
  {
    id: "hw1",
    title: "Unit 3 – Vocabulary",
    description: "Выучите слова из Unit 3 (стр. 45–47). Составьте 5 предложений с новыми словами.",
    dueDate: "2026-05-28",
    teacherId: "t1",
    teacherName: "Анна Ковалёва",
    studentIds: ["s1", "s2"],
    submissions: [
      { studentId: "s1", studentName: "Алиса Морозова", text: "I have completed the vocabulary list. Here are my sentences...", submittedAt: new Date(Date.now() - 3600000) },
    ],
    createdAt: new Date(Date.now() - 86400000 * 2),
  },
  {
    id: "hw2",
    title: "Grammar – Present Perfect",
    description: "Упражнения 1–5 на стр. 52. Прочитайте правило и выполните задания.",
    dueDate: "2026-05-30",
    teacherId: "t2",
    teacherName: "Дмитрий Волков",
    studentIds: ["s3", "s4"],
    submissions: [],
    createdAt: new Date(Date.now() - 86400000),
  },
];

export default function HomeworkSection({ user }: { user: User }) {
  const [homeworks, setHomeworks] = useState<Homework[]>(INITIAL_HW);
  const [showForm, setShowForm] = useState(false);
  const [openHw, setOpenHw] = useState<string | null>(null);
  const [submitText, setSubmitText] = useState<Record<string, string>>({});
  const [newHw, setNewHw] = useState({ title: "", description: "", dueDate: "", studentGroup: "s1-s2" });
  const [grade, setGrade] = useState<Record<string, string>>({});

  const visibleHw = homeworks.filter((hw) => {
    if (user.role === "student") return hw.studentIds.includes(user.id);
    if (user.role === "teacher") return hw.teacherId === user.id;
    return true;
  });

  const addHomework = () => {
    if (!newHw.title) return;
    const studentIds = newHw.studentGroup === "s1-s2" ? ["s1", "s2"] : ["s3", "s4"];
    const hw: Homework = {
      id: `hw${Date.now()}`,
      title: newHw.title,
      description: newHw.description,
      dueDate: newHw.dueDate,
      teacherId: user.id,
      teacherName: user.name,
      studentIds,
      submissions: [],
      createdAt: new Date(),
    };
    setHomeworks((p) => [hw, ...p]);
    setNewHw({ title: "", description: "", dueDate: "", studentGroup: "s1-s2" });
    setShowForm(false);
  };

  const submitHomework = (hwId: string) => {
    const text = submitText[hwId];
    if (!text?.trim()) return;
    setHomeworks((prev) =>
      prev.map((hw) =>
        hw.id === hwId
          ? {
              ...hw,
              submissions: [
                ...hw.submissions.filter((s) => s.studentId !== user.id),
                { studentId: user.id, studentName: user.name, text: text.trim(), submittedAt: new Date() },
              ],
            }
          : hw
      )
    );
    setSubmitText((p) => ({ ...p, [hwId]: "" }));
  };

  const setGradeForSubmission = (hwId: string, studentId: string, gradeVal: string) => {
    setHomeworks((prev) =>
      prev.map((hw) =>
        hw.id === hwId
          ? { ...hw, submissions: hw.submissions.map((s) => s.studentId === studentId ? { ...s, grade: gradeVal } : s) }
          : hw
      )
    );
  };

  const canAdd = user.role === "teacher" || user.role === "admin";

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Задания</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{visibleHw.length} заданий</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Icon name="Plus" size={15} />
            Добавить задание
          </button>
        )}
      </div>

      {showForm && canAdd && (
        <div className="bg-card border border-border rounded-xl p-4 mb-5 animate-scale-in space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Новое задание</h3>
          <input
            placeholder="Название задания"
            value={newHw.title}
            onChange={(e) => setNewHw((f) => ({ ...f, title: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
          <textarea
            rows={3}
            placeholder="Описание и инструкции..."
            value={newHw.description}
            onChange={(e) => setNewHw((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground resize-none"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Срок сдачи</label>
              <input
                type="date"
                value={newHw.dueDate}
                onChange={(e) => setNewHw((f) => ({ ...f, dueDate: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Группа</label>
              <select
                value={newHw.studentGroup}
                onChange={(e) => setNewHw((f) => ({ ...f, studentGroup: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="s1-s2">Elementary A (Ковалёва)</option>
                <option value="s3-s4">Pre-Intermediate (Волков)</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground">Отмена</button>
            <button onClick={addHomework} className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90">Сохранить</button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {visibleHw.map((hw) => {
          const mySubmission = hw.submissions.find((s) => s.studentId === user.id);
          const isOpen = openHw === hw.id;
          const dueDate = hw.dueDate ? new Date(hw.dueDate).toLocaleDateString("ru-RU") : "—";
          const isDue = hw.dueDate && new Date(hw.dueDate) < new Date();

          return (
            <div key={hw.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
              <button
                className="w-full flex items-start gap-4 p-4 text-left"
                onClick={() => setOpenHw(isOpen ? null : hw.id)}
              >
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${mySubmission ? "bg-emerald-100 text-emerald-600" : "bg-primary/10 text-primary"}`}>
                  <Icon name={mySubmission ? "CheckCircle2" : "BookOpen"} size={18} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{hw.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3 flex-wrap">
                    <span className="flex items-center gap-1"><Icon name="User" size={11} />{hw.teacherName}</span>
                    <span className={`flex items-center gap-1 ${isDue && !mySubmission ? "text-destructive" : ""}`}>
                      <Icon name="Calendar" size={11} />до {dueDate}
                    </span>
                    {user.role !== "student" && (
                      <span className="flex items-center gap-1"><Icon name="CheckCircle2" size={11} />{hw.submissions.length} / {hw.studentIds.length} сдано</span>
                    )}
                    {mySubmission && <span className="text-emerald-600 font-medium">✓ Сдано{mySubmission.grade ? ` · ${mySubmission.grade}` : ""}</span>}
                  </div>
                </div>
                <Icon name={isOpen ? "ChevronUp" : "ChevronDown"} size={16} className="text-muted-foreground shrink-0 mt-1" />
              </button>

              {isOpen && (
                <div className="px-4 pb-4 border-t border-border/60 pt-3 space-y-3 animate-fade-in">
                  <p className="text-sm text-foreground/80 leading-relaxed">{hw.description}</p>

                  {/* Student: submit form */}
                  {user.role === "student" && !mySubmission && (
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground">Ваш ответ</label>
                      <textarea
                        rows={3}
                        placeholder="Напишите или вставьте выполненное задание..."
                        value={submitText[hw.id] ?? ""}
                        onChange={(e) => setSubmitText((p) => ({ ...p, [hw.id]: e.target.value }))}
                        className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground resize-none"
                      />
                      <button
                        onClick={() => submitHomework(hw.id)}
                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
                      >
                        Сдать задание
                      </button>
                    </div>
                  )}

                  {user.role === "student" && mySubmission && (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-3">
                      <p className="text-xs font-semibold text-emerald-700 mb-1">Ваш ответ отправлен</p>
                      <p className="text-sm text-emerald-800">{mySubmission.text}</p>
                      {mySubmission.grade && <p className="text-sm font-semibold text-emerald-700 mt-2">Оценка: {mySubmission.grade}</p>}
                    </div>
                  )}

                  {/* Teacher/Admin: submissions */}
                  {(user.role === "teacher" || user.role === "admin") && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground mb-2">Ответы учеников ({hw.submissions.length})</p>
                      {hw.submissions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">Ещё никто не сдал</p>
                      ) : (
                        <div className="space-y-2">
                          {hw.submissions.map((sub) => (
                            <div key={sub.studentId} className="bg-muted/50 rounded-lg p-3 space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-xs font-semibold text-foreground">{sub.studentName}</span>
                                <span className="text-xs text-muted-foreground">{sub.submittedAt.toLocaleDateString("ru-RU")}</span>
                              </div>
                              <p className="text-sm text-foreground/80">{sub.text}</p>
                              <div className="flex items-center gap-2">
                                <label className="text-xs text-muted-foreground">Оценка:</label>
                                <select
                                  value={sub.grade ?? ""}
                                  onChange={(e) => setGradeForSubmission(hw.id, sub.studentId, e.target.value)}
                                  className="border border-border rounded-md px-2 py-0.5 text-xs bg-background text-foreground"
                                >
                                  <option value="">—</option>
                                  {["5", "4", "3", "2", "Отлично", "Хорошо", "Зачёт"].map((g) => <option key={g} value={g}>{g}</option>)}
                                </select>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {visibleHw.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="BookOpen" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Заданий нет</p>
        </div>
      )}
    </div>
  );
}
