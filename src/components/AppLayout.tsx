import { useState } from "react";
import { User, UserRole } from "@/pages/Index";
import Icon from "@/components/ui/icon";
import ScheduleSection from "@/components/sections/ScheduleSection";
import ChatSection from "@/components/sections/ChatSection";
import HomeworkSection from "@/components/sections/HomeworkSection";
import MaterialsSection from "@/components/sections/MaterialsSection";
import UsersSection from "@/components/sections/UsersSection";
import GroupsSection from "@/components/sections/GroupsSection";

export type SectionId = "schedule" | "chat" | "homework" | "materials" | "groups" | "users";

const ROLE_LABELS: Record<UserRole, string> = {
  student: "Ученик",
  teacher: "Преподаватель",
  admin: "Администратор",
};

const ROLE_BADGE: Record<UserRole, string> = {
  student: "bg-blue-500/20 text-blue-300",
  teacher: "bg-emerald-500/20 text-emerald-300",
  admin: "bg-violet-500/20 text-violet-300",
};

interface NavItem {
  id: SectionId;
  label: string;
  icon: string;
  roles: UserRole[];
}

const NAV_ITEMS: NavItem[] = [
  { id: "schedule", label: "Расписание", icon: "CalendarDays", roles: ["student", "teacher", "admin"] },
  { id: "chat", label: "Чат", icon: "MessageSquare", roles: ["student", "teacher", "admin"] },
  { id: "homework", label: "Задания", icon: "BookOpen", roles: ["student", "teacher", "admin"] },
  { id: "materials", label: "Материалы", icon: "FolderOpen", roles: ["student", "teacher", "admin"] },
  { id: "groups", label: "Группы", icon: "UsersRound", roles: ["admin"] },
  { id: "users", label: "Пользователи", icon: "UserCog", roles: ["admin"] },
];

interface Props {
  user: User;
  onLogout: () => void;
}

export default function AppLayout({ user, onLogout }: Props) {
  const [activeSection, setActiveSection] = useState<SectionId>("schedule");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = NAV_ITEMS.filter((n) => n.roles.includes(user.role));

  const renderSection = () => {
    switch (activeSection) {
      case "schedule": return <ScheduleSection user={user} />;
      case "chat": return <ChatSection user={user} />;
      case "homework": return <HomeworkSection user={user} />;
      case "materials": return <MaterialsSection user={user} />;
      case "groups": return <GroupsSection user={user} />;
      case "users": return <UsersSection user={user} />;
    }
  };

  const navLabel = visibleNav.find((n) => n.id === activeSection)?.label ?? "";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed lg:static inset-y-0 left-0 z-30 w-60 flex flex-col
          bg-[hsl(var(--sidebar-background))] border-r border-[hsl(var(--sidebar-border))]
          transition-transform duration-300 ease-in-out
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
      >
        {/* Logo */}
        <div className="px-5 py-5 border-b border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center text-lg">🎓</div>
            <div>
              <div className="text-[hsl(var(--sidebar-foreground))] font-bold text-sm leading-tight">Alisa Eng Club</div>
              <div className="text-[hsl(var(--sidebar-foreground))/50] text-xs opacity-60">Учебная платформа</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
          {visibleNav.map((item) => {
            const active = activeSection === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setActiveSection(item.id); setSidebarOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-left
                  ${active
                    ? "bg-[hsl(var(--sidebar-accent))] text-[hsl(var(--sidebar-accent-foreground))]"
                    : "text-[hsl(var(--sidebar-foreground))] hover:bg-[hsl(var(--sidebar-accent))]/60 hover:text-[hsl(var(--sidebar-accent-foreground))]"
                  }`}
              >
                <Icon name={item.icon} size={17} className={active ? "text-[hsl(var(--sidebar-primary))]" : ""} />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* User */}
        <div className="px-3 py-4 border-t border-[hsl(var(--sidebar-border))]">
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg">
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[hsl(var(--sidebar-primary))] font-semibold text-sm shrink-0">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-[hsl(var(--sidebar-foreground))] text-sm font-medium truncate">{user.name}</div>
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_BADGE[user.role]}`}>
                {ROLE_LABELS[user.role]}
              </span>
            </div>
            <button
              onClick={onLogout}
              title="Выйти"
              className="text-[hsl(var(--sidebar-foreground))] opacity-50 hover:opacity-100 transition-opacity shrink-0"
            >
              <Icon name="LogOut" size={15} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top bar (mobile) */}
        <div className="lg:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-card">
          <button onClick={() => setSidebarOpen(true)} className="text-muted-foreground">
            <Icon name="Menu" size={20} />
          </button>
          <span className="font-semibold text-foreground text-sm">{navLabel}</span>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div key={activeSection} className="animate-fade-in h-full">
            {renderSection()}
          </div>
        </div>
      </main>
    </div>
  );
}