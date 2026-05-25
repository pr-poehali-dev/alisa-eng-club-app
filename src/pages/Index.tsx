import { useState, useEffect } from "react";
import LoginScreen from "@/components/LoginScreen";
import AppLayout from "@/components/AppLayout";

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  teacher_id?: string | null;
  email?: string;
}

// Временный экспорт для совместимости с разделами (будет убран при подключении БД)
export const DEMO_USERS: User[] = [];

const AUTH_URL = "https://functions.poehali.dev/805b4ec7-7283-4893-8f20-77c78c98a309";
const SESSION_KEY = "alisa_eng_session";

export async function apiAuth(action: string, payload?: object) {
  const token = localStorage.getItem(SESSION_KEY) || "";
  const res = await fetch(AUTH_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Id": token },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export default function Index() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // При загрузке проверяем сохранённую сессию
  useEffect(() => {
    const token = localStorage.getItem(SESSION_KEY);
    if (!token) { setLoading(false); return; }
    apiAuth("me").then((data) => {
      if (data.user) setUser({ ...data.user, id: String(data.user.id) });
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleLogin = (userData: User, token: string) => {
    localStorage.setItem(SESSION_KEY, token);
    setUser(userData);
  };

  const handleLogout = () => {
    apiAuth("logout");
    localStorage.removeItem(SESSION_KEY);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} />;
  }

  return <AppLayout user={user} onLogout={handleLogout} />;
}
