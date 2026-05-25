import { useState } from "react";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

const DAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб"];
const FULL_DAYS = ["Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"];

// Группы — исчерпывающий список. teacherId совпадает с id преподавателя в БД (строка).
interface Group {
  id: string;       // совпадает с teacher_id участников
  name: string;     // отображаемое название группы
  teacherName: string;
}

const GROUPS: Group[] = [
  { id: "1", name: "Elementary A", teacherName: "Анна Ковалёва" },
  { id: "2", name: "Pre-Intermediate B", teacherName: "Дмитрий Волков" },
];

interface Lesson {
  id: string;
  day: number;
  time: string;
  groupId: string;   // ссылка на Group.id
  room: string;
  duration: string;
}

const INITIAL_LESSONS: Lesson[] = [
  { id: "l1", day: 0, time: "09:00", groupId: "1", room: "Zoom #1", duration: "60 мин" },
  { id: "l2", day: 1, time: "11:00", groupId: "2", room: "Zoom #2", duration: "60 мин" },
  { id: "l3", day: 2, time: "09:00", groupId: "1", room: "Zoom #1", duration: "60 мин" },
  { id: "l4", day: 2, time: "14:00", groupId: "2", room: "Zoom #2", duration: "60 мин" },
  { id: "l5", day: 3, time: "10:00", groupId: "1", room: "Zoom #1", duration: "60 мин" },
  { id: "l6", day: 4, time: "09:00", groupId: "1", room: "Zoom #1", duration: "60 мин" },
  { id: "l7", day: 4, time: "15:00", groupId: "2", room: "Zoom #2", duration: "60 мин" },
  { id: "l8", day: 5, time: "11:00", groupId: "2", room: "Zoom #2", duration: "60 мин" },
];

interface AddForm {
  day: number;
  time: string;
  groupId: string;
  room: string;
  duration: string;
}

/** Какие группы видит пользователь */
function visibleGroups(user: User): Group[] {
  if (user.role === "admin") return GROUPS;
  if (user.role === "teacher") return GROUPS.filter((g) => g.id === user.id);
  // student — только своя группа (teacher_id хранится как строка)
  if (user.role === "student") return GROUPS.filter((g) => g.id === String(user.teacher_id));
  return [];
}

export default function ScheduleSection({ user }: { user: User }) {
  const [lessons, setLessons] = useState<Lesson[]>(INITIAL_LESSONS);
  const [selectedDay, setSelectedDay] = useState(0);
  const [showForm, setShowForm] = useState(false);

  const myGroups = visibleGroups(user);
  const defaultGroupId = myGroups[0]?.id ?? GROUPS[0].id;

  // Для преподавателя/адмика доступен выбор группы в форме
  const editableGroups = user.role === "admin" ? GROUPS : myGroups;

  const [form, setForm] = useState<AddForm>({
    day: 0,
    time: "10:00",
    groupId: defaultGroupId,
    room: "Zoom #1",
    duration: "60 мин",
  });

  const canEdit = user.role === "teacher" || user.role === "admin";

  const visibleLessons = lessons.filter((l) => {
    if (l.day !== selectedDay) return false;
    return myGroups.some((g) => g.id === l.groupId);
  });

  const addLesson = () => {
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      day: form.day,
      time: form.time,
      groupId: form.groupId,
      room: form.room,
      duration: form.duration,
    };
    setLessons((prev) => [...prev, newLesson]);
    setShowForm(false);
    setForm({ day: 0, time: "10:00", groupId: defaultGroupId, room: "Zoom #1", duration: "60 мин" });
  };

  const deleteLesson = (id: string) => {
    setLessons((prev) => prev.filter((l) => l.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Расписание</h2>
          <p className="text-muted-foreground text-sm mt-0.5">Текущая неделя</p>
        </div>
        {canEdit && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Icon name="Plus" size={15} />
            Добавить урок
          </button>
        )}
      </div>

      {/* Day tabs */}
      <div className="flex gap-1.5 mb-5 overflow-x-auto pb-1">
        {DAYS.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedDay(i)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all duration-150
              ${selectedDay === i
                ? "bg-primary text-primary-foreground shadow-sm"
                : "bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
              }`}
          >
            {d}
          </button>
        ))}
      </div>

      <div className="mb-2 text-sm font-semibold text-foreground">{FULL_DAYS[selectedDay]}</div>

      {/* Add form */}
      {showForm && canEdit && (
        <div className="bg-card border border-border rounded-xl p-4 mb-4 animate-scale-in space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Новый урок</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">День</label>
              <select
                value={form.day}
                onChange={(e) => setForm((f) => ({ ...f, day: +e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                {FULL_DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Время</label>
              <input
                type="time"
                value={form.time}
                onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Группа</label>
              <select
                value={form.groupId}
                onChange={(e) => setForm((f) => ({ ...f, groupId: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                {editableGroups.map((g) => (
                  <option key={g.id} value={g.id}>{g.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Кабинет / Zoom</label>
              <input
                placeholder="Zoom #1"
                value={form.room}
                onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">Отмена</button>
            <button onClick={addLesson} className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90">Сохранить</button>
          </div>
        </div>
      )}

      {/* Lessons */}
      {visibleLessons.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="CalendarX2" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Занятий нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {visibleLessons
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((lesson) => {
              const group = GROUPS.find((g) => g.id === lesson.groupId);
              return (
                <div key={lesson.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:border-primary/30 transition-colors">
                  <div className="text-center shrink-0 w-12">
                    <div className="text-lg font-bold text-primary">{lesson.time}</div>
                    <div className="text-xs text-muted-foreground">{lesson.duration}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-foreground text-sm">{group?.name ?? "—"}</div>
                    <div className="text-xs text-muted-foreground mt-0.5 flex items-center gap-3">
                      <span className="flex items-center gap-1"><Icon name="User" size={11} />{group?.teacherName}</span>
                      <span className="flex items-center gap-1"><Icon name="Video" size={11} />{lesson.room}</span>
                    </div>
                  </div>
                  {canEdit && (
                    <button
                      onClick={() => deleteLesson(lesson.id)}
                      className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                    >
                      <Icon name="Trash2" size={15} />
                    </button>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}
