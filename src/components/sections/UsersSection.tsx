import { useState } from "react";
import { User, UserRole, DEMO_USERS } from "@/pages/Index";
import Icon from "@/components/ui/icon";

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Ученик",
  teacher: "Преподаватель",
  admin: "Администратор",
};

const ROLE_COLORS: Record<UserRole, string> = {
  student: "bg-blue-50 text-blue-700 border-blue-200",
  teacher: "bg-emerald-50 text-emerald-700 border-emerald-200",
  admin: "bg-violet-50 text-violet-700 border-violet-200",
};

export default function UsersSection({ user }: { user: User }) {
  const [users, setUsers] = useState<User[]>(DEMO_USERS);
  const [showForm, setShowForm] = useState(false);
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const [newUser, setNewUser] = useState({ name: "", role: "student" as UserRole, teacherId: "t1" });

  const addUser = () => {
    if (!newUser.name.trim()) return;
    const u: User = {
      id: `u${Date.now()}`,
      name: newUser.name.trim(),
      role: newUser.role,
      teacherId: newUser.role === "student" ? newUser.teacherId : undefined,
    };
    setUsers((p) => [...p, u]);
    setNewUser({ name: "", role: "student", teacherId: "t1" });
    setShowForm(false);
  };

  const deleteUser = (id: string) => {
    if (id === user.id) return;
    setUsers((p) => p.filter((u) => u.id !== id));
  };

  const visible = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts: Record<UserRole | "all", number> = {
    all: users.length,
    student: users.filter((u) => u.role === "student").length,
    teacher: users.filter((u) => u.role === "teacher").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  const teachers = users.filter((u) => u.role === "teacher");

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Пользователи</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{users.length} человек в системе</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Icon name="UserPlus" size={15} />
          Добавить
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        {(["student", "teacher", "admin"] as UserRole[]).map((role) => (
          <div key={role} className="bg-card border border-border rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-primary">{counts[role]}</div>
            <div className="text-xs text-muted-foreground mt-1">{ROLE_LABELS[role]}ов</div>
          </div>
        ))}
      </div>

      {/* Add form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-4 mb-5 animate-scale-in space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Новый пользователь</h3>
          <input
            placeholder="Полное имя"
            value={newUser.name}
            onChange={(e) => setNewUser((f) => ({ ...f, name: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Роль</label>
              <select
                value={newUser.role}
                onChange={(e) => setNewUser((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="student">Ученик</option>
                <option value="teacher">Преподаватель</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            {newUser.role === "student" && (
              <div>
                <label className="text-xs text-muted-foreground block mb-1">Преподаватель</label>
                <select
                  value={newUser.teacherId}
                  onChange={(e) => setNewUser((f) => ({ ...f, teacherId: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                >
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
            )}
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground">Отмена</button>
            <button onClick={addUser} className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90">Сохранить</button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Поиск по имени..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-8 pr-3 py-2 border border-border rounded-lg text-sm bg-background text-foreground"
          />
        </div>
        {(["all", "student", "teacher", "admin"] as const).map((role) => (
          <button
            key={role}
            onClick={() => setFilterRole(role)}
            className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap
              ${filterRole === role ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {role === "all" ? "Все" : ROLE_LABELS[role]} ({counts[role]})
          </button>
        ))}
      </div>

      {/* User list */}
      <div className="space-y-2">
        {visible.map((u) => {
          const myTeacher = u.role === "student" && u.teacherId ? users.find((t) => t.id === u.teacherId) : null;
          return (
            <div key={u.id} className="bg-card border border-border rounded-xl flex items-center gap-3 px-4 py-3 hover:border-primary/30 transition-colors group">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {u.name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium text-foreground">{u.name}</span>
                  {u.id === user.id && <span className="text-xs text-muted-foreground">(вы)</span>}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[u.role]}`}>
                    {ROLE_LABELS[u.role]}
                  </span>
                  {myTeacher && <span className="text-xs text-muted-foreground">Преп.: {myTeacher.name}</span>}
                </div>
              </div>
              {u.id !== user.id && (
                <button
                  onClick={() => deleteUser(u.id)}
                  className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
                >
                  <Icon name="Trash2" size={15} />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Users" size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Пользователи не найдены</p>
        </div>
      )}
    </div>
  );
}
