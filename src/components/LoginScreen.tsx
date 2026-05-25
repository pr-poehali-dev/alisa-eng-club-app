import { useState } from "react";
import { User, UserRole } from "@/pages/Index";
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

interface Props {
  users: User[];
  onLogin: (user: User) => void;
}

export default function LoginScreen({ users, onLogin }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  const grouped = users.reduce<Record<UserRole, User[]>>(
    (acc, u) => { acc[u.role].push(u); return acc; },
    { student: [], teacher: [], admin: [] }
  );

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md animate-fade-in">
        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-5">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Alisa Eng Club</h1>
          <p className="text-muted-foreground mt-1 text-sm">Выберите свой профиль для входа</p>
        </div>

        {/* Role groups */}
        <div className="space-y-5">
          {(["student", "teacher", "admin"] as UserRole[]).map((role) => (
            <div key={role}>
              <div className="flex items-center gap-2 mb-2">
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${ROLE_COLORS[role]}`}>
                  {ROLE_LABELS[role]}
                </span>
              </div>
              <div className="space-y-1.5">
                {grouped[role].map((u) => (
                  <button
                    key={u.id}
                    onClick={() => setSelected(u.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all duration-150
                      ${selected === u.id
                        ? "border-primary bg-primary/5 shadow-sm"
                        : "border-border bg-card hover:border-primary/40 hover:bg-accent/50"
                      }`}
                  >
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                      {u.name.charAt(0)}
                    </div>
                    <span className="text-sm font-medium text-foreground">{u.name}</span>
                    {selected === u.id && (
                      <Icon name="Check" size={16} className="ml-auto text-primary" />
                    )}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        <button
          disabled={!selected}
          onClick={() => {
            const u = users.find((x) => x.id === selected);
            if (u) onLogin(u);
          }}
          className={`mt-8 w-full py-3 rounded-xl font-semibold text-sm transition-all duration-200
            ${selected
              ? "bg-primary text-primary-foreground hover:opacity-90 hover:shadow-md"
              : "bg-muted text-muted-foreground cursor-not-allowed"
            }`}
        >
          Войти в систему
        </button>

        <p className="text-center text-xs text-muted-foreground mt-4">Демо-версия · Alisa Eng Club 2026</p>
      </div>
    </div>
  );
}
