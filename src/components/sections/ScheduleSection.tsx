import { useState, useEffect, useMemo } from "react";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

const GROUPS_URL = "https://functions.poehali.dev/f21c4595-d3bb-4863-97d4-ad0de6afa1bb";

const WEEKDAYS_SHORT = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];
const WEEKDAYS_FULL  = ["Понедельник","Вторник","Среда","Четверг","Пятница","Суббота","Воскресенье"];
const MONTHS_RU = ["Январь","Февраль","Март","Апрель","Май","Июнь","Июль","Август","Сентябрь","Октябрь","Ноябрь","Декабрь"];
const MONTHS_GEN = ["января","февраля","марта","апреля","мая","июня","июля","августа","сентября","октября","ноября","декабря"];

type ViewMode = "month" | "week" | "day";

interface Group { id: number; name: string; teacher_id: number; teacher_name: string; }

interface Lesson {
  id: string;
  date: string;   // YYYY-MM-DD
  time: string;   // HH:MM
  groupId: number;
  room: string;
  duration: string;
  recurring?: boolean; // повторяется каждую неделю
  weekday?: number;    // 0=Пн для повторяющихся
}

// Цвета групп
const GROUP_COLORS = [
  "bg-blue-100 text-blue-800 border-blue-200",
  "bg-emerald-100 text-emerald-800 border-emerald-200",
  "bg-violet-100 text-violet-800 border-violet-200",
  "bg-amber-100 text-amber-800 border-amber-200",
  "bg-rose-100 text-rose-800 border-rose-200",
  "bg-cyan-100 text-cyan-800 border-cyan-200",
  "bg-orange-100 text-orange-800 border-orange-200",
  "bg-teal-100 text-teal-800 border-teal-200",
];
const GROUP_DOTS = [
  "bg-blue-500","bg-emerald-500","bg-violet-500","bg-amber-500",
  "bg-rose-500","bg-cyan-500","bg-orange-500","bg-teal-500",
];

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

// Понедельник недели для даты
function weekStart(d: Date) {
  const day = d.getDay(); // 0=вс
  const diff = (day === 0 ? -6 : 1 - day);
  return addDays(d, diff);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function formatDateHeader(d: Date) {
  return `${d.getDate()} ${MONTHS_GEN[d.getMonth()]} ${d.getFullYear()}`;
}

interface AddForm {
  date: string;
  time: string;
  groupId: number | "";
  room: string;
  duration: string;
  recurring: boolean;
}

export default function ScheduleSection({ user }: { user: User }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [lessons, setLessons] = useState<Lesson[]>([]);
  const [view, setView] = useState<ViewMode>("week");
  const [cursor, setCursor] = useState(new Date()); // опорная дата навигации
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<AddForm>({
    date: isoDate(new Date()), time: "10:00", groupId: "", room: "Zoom", duration: "60 мин", recurring: false,
  });
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);

  const canEdit = user.role === "teacher" || user.role === "admin";
  const myGroupIds = useMemo(() => new Set(groups.map((g) => g.id)), [groups]);

  useEffect(() => {
    fetch(GROUPS_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "my_groups", user_id: Number(user.id), role: user.role }),
    })
      .then((r) => r.json())
      .then((data) => {
        const g: Group[] = data.groups ?? [];
        setGroups(g);
        if (g.length > 0) setForm((f) => ({ ...f, groupId: g[0].id }));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [user.id, user.role]);

  const groupColor = (groupId: number) => {
    const idx = groups.findIndex((g) => g.id === groupId);
    return GROUP_COLORS[idx % GROUP_COLORS.length] ?? GROUP_COLORS[0];
  };
  const groupDot = (groupId: number) => {
    const idx = groups.findIndex((g) => g.id === groupId);
    return GROUP_DOTS[idx % GROUP_DOTS.length] ?? GROUP_DOTS[0];
  };

  // Получить уроки для конкретной даты
  const lessonsForDate = (date: Date): Lesson[] => {
    const ds = isoDate(date);
    const wd = (date.getDay() + 6) % 7; // 0=Пн
    return lessons.filter((l) => {
      if (!myGroupIds.has(l.groupId)) return false;
      if (l.recurring) return l.weekday === wd;
      return l.date === ds;
    }).sort((a, b) => a.time.localeCompare(b.time));
  };

  const addLesson = () => {
    if (!form.groupId) return;
    const wd = (new Date(form.date).getDay() + 6) % 7;
    const newLesson: Lesson = {
      id: `l${Date.now()}`,
      date: form.date,
      time: form.time,
      groupId: form.groupId as number,
      room: form.room,
      duration: form.duration,
      recurring: form.recurring,
      weekday: form.recurring ? wd : undefined,
    };
    setLessons((p) => [...p, newLesson]);
    setShowForm(false);
  };

  const deleteLesson = (id: string) => {
    setLessons((p) => p.filter((l) => l.id !== id));
    setSelectedLesson(null);
  };

  // --- НАВИГАЦИЯ ---
  const navigate = (dir: -1 | 1) => {
    if (view === "month") setCursor((d) => { const r = new Date(d); r.setMonth(r.getMonth() + dir); return r; });
    if (view === "week")  setCursor((d) => addDays(d, dir * 7));
    if (view === "day")   { setCursor((d) => addDays(d, dir)); setSelectedDate((d) => addDays(d, dir)); }
  };
  const goToday = () => { const t = new Date(); setCursor(t); setSelectedDate(t); };

  // --- ЗАГОЛОВОК ---
  const headerTitle = () => {
    if (view === "month") return `${MONTHS_RU[cursor.getMonth()]} ${cursor.getFullYear()}`;
    if (view === "week") {
      const ws = weekStart(cursor);
      const we = addDays(ws, 6);
      if (ws.getMonth() === we.getMonth()) return `${ws.getDate()}–${we.getDate()} ${MONTHS_GEN[ws.getMonth()]} ${ws.getFullYear()}`;
      return `${ws.getDate()} ${MONTHS_GEN[ws.getMonth()]} – ${we.getDate()} ${MONTHS_GEN[we.getMonth()]}`;
    }
    return formatDateHeader(selectedDate);
  };

  // ---- РЕНДЕР МЕСЯЦ ----
  const renderMonth = () => {
    const year = cursor.getFullYear(), month = cursor.getMonth();
    const firstDay = new Date(year, month, 1);
    const startOffset = (firstDay.getDay() + 6) % 7; // сдвиг от Пн
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const cells: (Date | null)[] = [
      ...Array(startOffset).fill(null),
      ...Array.from({ length: daysInMonth }, (_, i) => new Date(year, month, i + 1)),
    ];
    while (cells.length % 7 !== 0) cells.push(null);
    const today = new Date();

    return (
      <div>
        {/* Заголовки дней */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS_SHORT.map((d) => (
            <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
          ))}
        </div>
        {/* Ячейки */}
        <div className="grid grid-cols-7 gap-px bg-border rounded-xl overflow-hidden border border-border">
          {cells.map((date, i) => {
            if (!date) return <div key={i} className="bg-muted/30 min-h-20" />;
            const dayLessons = lessonsForDate(date);
            const isToday = sameDay(date, today);
            const isSelected = sameDay(date, selectedDate);
            const isOtherMonth = date.getMonth() !== month;
            return (
              <div
                key={i}
                onClick={() => { setSelectedDate(date); if (view !== "day") setView("day"); setCursor(date); }}
                className={`bg-card min-h-20 p-1.5 cursor-pointer transition-colors hover:bg-accent/40
                  ${isSelected ? "ring-2 ring-inset ring-primary" : ""}
                  ${isOtherMonth ? "opacity-40" : ""}`}
              >
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold mb-1 mx-auto
                  ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                  {date.getDate()}
                </div>
                <div className="space-y-0.5">
                  {dayLessons.slice(0, 2).map((l) => (
                    <div key={l.id} className={`text-xs px-1.5 py-0.5 rounded truncate border ${groupColor(l.groupId)}`}>
                      {l.time} {groups.find((g) => g.id === l.groupId)?.name}
                    </div>
                  ))}
                  {dayLessons.length > 2 && (
                    <div className="text-xs text-muted-foreground pl-1">+{dayLessons.length - 2} ещё</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---- РЕНДЕР НЕДЕЛЯ ----
  const renderWeek = () => {
    const ws = weekStart(cursor);
    const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i));
    const today = new Date();

    return (
      <div className="overflow-x-auto">
        <div className="grid grid-cols-7 min-w-[560px]">
          {days.map((date, i) => {
            const dayLessons = lessonsForDate(date);
            const isToday = sameDay(date, today);
            const isSelected = sameDay(date, selectedDate);
            return (
              <div key={i} className={`border-r border-border last:border-r-0 ${isSelected ? "bg-accent/30" : ""}`}>
                {/* Заголовок дня */}
                <div
                  onClick={() => { setSelectedDate(date); setView("day"); setCursor(date); }}
                  className="flex flex-col items-center py-2 border-b border-border cursor-pointer hover:bg-accent/20 transition-colors"
                >
                  <span className="text-xs text-muted-foreground">{WEEKDAYS_SHORT[i]}</span>
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold mt-0.5
                    ${isToday ? "bg-primary text-primary-foreground" : "text-foreground"}`}>
                    {date.getDate()}
                  </span>
                </div>
                {/* Уроки */}
                <div className="p-1.5 space-y-1 min-h-32">
                  {dayLessons.length === 0 && (
                    <div className="text-xs text-muted-foreground text-center pt-3 opacity-50">—</div>
                  )}
                  {dayLessons.map((l) => (
                    <div
                      key={l.id}
                      onClick={() => setSelectedLesson(l)}
                      className={`text-xs p-1.5 rounded-lg border cursor-pointer hover:opacity-80 transition-opacity ${groupColor(l.groupId)}`}
                    >
                      <div className="font-semibold">{l.time}</div>
                      <div className="truncate">{groups.find((g) => g.id === l.groupId)?.name}</div>
                      {l.recurring && <div className="opacity-60">↻</div>}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  // ---- РЕНДЕР ДЕНЬ ----
  const renderDay = () => {
    const dayLessons = lessonsForDate(selectedDate);
    const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 08:00–21:00

    return (
      <div className="relative">
        <div className="text-sm font-semibold text-foreground mb-3">
          {WEEKDAYS_FULL[(selectedDate.getDay() + 6) % 7]}, {formatDateHeader(selectedDate)}
        </div>
        {dayLessons.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Icon name="CalendarX2" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm">Занятий нет</p>
          </div>
        ) : (
          <div className="space-y-2">
            {hours.map((h) => {
              const hourLessons = dayLessons.filter((l) => parseInt(l.time) === h);
              if (hourLessons.length === 0) return null;
              return (
                <div key={h} className="flex gap-3">
                  <div className="w-12 text-right text-xs text-muted-foreground pt-2 shrink-0">{String(h).padStart(2,"0")}:00</div>
                  <div className="flex-1 space-y-1">
                    {hourLessons.map((l) => (
                      <div
                        key={l.id}
                        onClick={() => setSelectedLesson(l)}
                        className={`p-3 rounded-xl border cursor-pointer hover:shadow-sm transition-all ${groupColor(l.groupId)}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-sm">{groups.find((g) => g.id === l.groupId)?.name}</span>
                          <span className="text-xs opacity-70">{l.time} · {l.duration}</span>
                        </div>
                        <div className="text-xs opacity-70 mt-0.5 flex items-center gap-2">
                          <span>{l.room}</span>
                          {l.recurring && <span>↻ еженедельно</span>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Top bar */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border gap-3 flex-wrap">
        <div className="flex items-center gap-2">
          <button onClick={() => navigate(-1)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            <Icon name="ChevronLeft" size={16} />
          </button>
          <button onClick={goToday} className="px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            Сегодня
          </button>
          <button onClick={() => navigate(1)} className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors">
            <Icon name="ChevronRight" size={16} />
          </button>
          <span className="text-sm font-semibold text-foreground ml-1">{headerTitle()}</span>
        </div>

        <div className="flex items-center gap-2">
          {/* View switcher */}
          <div className="flex rounded-lg border border-border overflow-hidden">
            {(["month","week","day"] as ViewMode[]).map((v) => (
              <button
                key={v}
                onClick={() => setView(v)}
                className={`px-3 py-1.5 text-xs font-medium transition-colors
                  ${view === v ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground bg-card"}`}
              >
                {v === "month" ? "Месяц" : v === "week" ? "Неделя" : "День"}
              </button>
            ))}
          </div>

          {canEdit && groups.length > 0 && (
            <button
              onClick={() => { setForm((f) => ({ ...f, date: isoDate(selectedDate) })); setShowForm(true); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-medium hover:opacity-90"
            >
              <Icon name="Plus" size={14} />
              Урок
            </button>
          )}
        </div>
      </div>

      {/* Calendar */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {groups.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground bg-card border border-border rounded-xl">
            <Icon name="UsersRound" size={36} className="mx-auto mb-3 opacity-30" />
            <p className="text-sm font-medium">Вы не состоите ни в одной группе</p>
            <p className="text-xs mt-1">Обратитесь к администратору</p>
          </div>
        ) : (
          <div className="animate-fade-in">
            {view === "month" && renderMonth()}
            {view === "week" && renderWeek()}
            {view === "day" && renderDay()}
          </div>
        )}

        {/* Легенда групп */}
        {groups.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-border">
            {groups.map((g, i) => (
              <div key={g.id} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <div className={`w-2.5 h-2.5 rounded-full ${GROUP_DOTS[i % GROUP_DOTS.length]}`} />
                {g.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add lesson modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setShowForm(false)}>
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-sm shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold text-base text-foreground mb-4">Новый урок</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Дата</label>
                  <input type="date" value={form.date} onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Время</label>
                  <input type="time" value={form.time} onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Группа</label>
                <select value={form.groupId} onChange={(e) => setForm((f) => ({ ...f, groupId: +e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground">
                  <option value="">Выберите группу...</option>
                  {groups.map((g) => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Кабинет / Zoom</label>
                  <input placeholder="Zoom" value={form.room} onChange={(e) => setForm((f) => ({ ...f, room: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground" />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground block mb-1">Длительность</label>
                  <select value={form.duration} onChange={(e) => setForm((f) => ({ ...f, duration: e.target.value }))}
                    className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground">
                    {["30 мин","45 мин","60 мин","90 мин"].map((d) => <option key={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input type="checkbox" checked={form.recurring} onChange={(e) => setForm((f) => ({ ...f, recurring: e.target.checked }))}
                  className="w-4 h-4 rounded border-border accent-primary" />
                <span className="text-sm text-foreground">Повторять еженедельно</span>
              </label>
            </div>
            <div className="flex gap-2 mt-5 justify-end">
              <button onClick={() => setShowForm(false)} className="px-4 py-2 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground">Отмена</button>
              <button onClick={addLesson} disabled={!form.groupId}
                className="px-4 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50">
                Добавить
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Lesson detail popup */}
      {selectedLesson && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4" onClick={() => setSelectedLesson(null)}>
          <div className="bg-card border border-border rounded-2xl p-5 w-full max-w-xs shadow-xl animate-scale-in" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const g = groups.find((g) => g.id === selectedLesson.groupId);
              return (
                <>
                  <div className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border mb-3 ${groupColor(selectedLesson.groupId)}`}>
                    <div className={`w-2 h-2 rounded-full ${groupDot(selectedLesson.groupId)}`} />
                    {g?.name}
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-foreground">
                      <Icon name="Clock" size={14} className="text-muted-foreground" />
                      {selectedLesson.time} · {selectedLesson.duration}
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Icon name="User" size={14} className="text-muted-foreground" />
                      {g?.teacher_name}
                    </div>
                    <div className="flex items-center gap-2 text-foreground">
                      <Icon name="Video" size={14} className="text-muted-foreground" />
                      {selectedLesson.room}
                    </div>
                    {selectedLesson.recurring && (
                      <div className="flex items-center gap-2 text-muted-foreground text-xs">
                        <Icon name="RefreshCw" size={13} />
                        Еженедельно
                      </div>
                    )}
                  </div>
                  {canEdit && (
                    <button onClick={() => deleteLesson(selectedLesson.id)}
                      className="mt-4 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-sm text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors">
                      <Icon name="Trash2" size={14} />
                      Удалить урок
                    </button>
                  )}
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
