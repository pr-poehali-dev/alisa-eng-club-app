import { useState, useEffect } from "react";
import { User, UserRole } from "@/pages/Index";
import Icon from "@/components/ui/icon";

const AUTH_URL = "https://functions.poehali.dev/805b4ec7-7283-4893-8f20-77c78c98a309";
const SESSION_KEY = "alisa_eng_session";

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

interface DBUser {
  id: number;
  name: string;
  role: UserRole;
  email: string;
}

interface NewUserForm {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

async function api(action: string, payload?: object) {
  const token = localStorage.getItem(SESSION_KEY) || "";
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Id": token },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export default function UsersSection({ user }: { user: User }) {
  const [users, setUsers] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState<UserRole | "all">("all");
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<NewUserForm>({ name: "", email: "", password: "", role: "student" });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    api("list_users").then((data) => {
      setUsers(data.users ?? []);
      setLoading(false);
    });
  }, []);

  const handleCreate = async () => {
    setFormError("");
    if (!form.name.trim() || !form.email.trim() || !form.password.trim()) {
      setFormError("Заполните все поля");
      return;
    }
    setSaving(true);
    const data = await api("create_user", {
      name: form.name.trim(),
      email: form.email.trim().toLowerCase(),
      password: form.password,
      role: form.role,
    });
    setSaving(false);
    if (data.error) {
      setFormError(data.error);
      return;
    }
    setUsers((p) => [...p, data.user]);
    setForm({ name: "", email: "", password: "", role: "student" });
    setShowForm(false);
  };

  const handleDelete = async (userId: number) => {
    if (!confirm("Удалить пользователя?")) return;
    const data = await api("delete_user", { user_id: userId });
    if (data.ok) setUsers((p) => p.filter((u) => u.id !== userId));
  };

  const visible = users.filter((u) => {
    const matchRole = filterRole === "all" || u.role === filterRole;
    const matchSearch = u.name.toLowerCase().includes(search.toLowerCase()) ||
      (u.email || "").toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  const counts = {
    all: users.length,
    student: users.filter((u) => u.role === "student").length,
    teacher: users.filter((u) => u.role === "teacher").length,
    admin: users.filter((u) => u.role === "admin").length,
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Пользователи</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{users.length} человек в системе</p>
        </div>
        <button
          onClick={() => { setShowForm(!showForm); setFormError(""); }}
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
        <div className="bg-card border border-primary/20 rounded-xl p-4 mb-5 animate-scale-in space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Новый пользователь</h3>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-muted-foreground block mb-1">Полное имя</label>
              <input
                placeholder="Иван Иванов"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div className="col-span-2 sm:col-span-1">
              <label className="text-xs text-muted-foreground block mb-1">Роль</label>
              <select
                value={form.role}
                onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as UserRole }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="student">Ученик</option>
                <option value="teacher">Преподаватель</option>
                <option value="admin">Администратор</option>
              </select>
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Email (логин)</label>
              <input
                type="email"
                placeholder="user@example.com"
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs text-muted-foreground block mb-1">Пароль</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Минимум 6 символов"
                  value={form.password}
                  onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                  className="w-full border border-border rounded-lg px-3 py-2 pr-9 text-sm bg-background text-foreground"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <Icon name={showPassword ? "EyeOff" : "Eye"} size={14} />
                </button>
              </div>
            </div>
          </div>

          {formError && (
            <div className="flex items-center gap-2 px-3 py-2 bg-destructive/10 border border-destructive/20 rounded-lg">
              <Icon name="AlertCircle" size={13} className="text-destructive shrink-0" />
              <p className="text-xs text-destructive">{formError}</p>
            </div>
          )}

          <div className="flex gap-2 justify-end">
            <button
              onClick={() => { setShowForm(false); setFormError(""); }}
              className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground hover:text-foreground"
            >
              Отмена
            </button>
            <button
              onClick={handleCreate}
              disabled={saving}
              className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {saving ? "Создаём..." : "Создать"}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-48">
          <Icon name="Search" size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            placeholder="Поиск по имени или email..."
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
        {visible.map((u) => (
          <div key={u.id} className="bg-card border border-border rounded-xl flex items-center gap-3 px-4 py-3 hover:border-primary/30 transition-colors group">
            <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
              {u.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-sm font-medium text-foreground">{u.name}</span>
                {String(u.id) === String(user.id) && (
                  <span className="text-xs text-muted-foreground">(вы)</span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${ROLE_COLORS[u.role]}`}>
                  {ROLE_LABELS[u.role]}
                </span>
                {u.email && (
                  <span className="text-xs text-muted-foreground">{u.email}</span>
                )}
              </div>
            </div>
            {String(u.id) !== String(user.id) && (
              <button
                onClick={() => handleDelete(u.id)}
                className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0 p-1"
                title="Удалить пользователя"
              >
                <Icon name="Trash2" size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {visible.length === 0 && !loading && (
        <div className="text-center py-12 text-muted-foreground">
          <Icon name="Users" size={36} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Пользователи не найдены</p>
        </div>
      )}
    </div>
  );
}
