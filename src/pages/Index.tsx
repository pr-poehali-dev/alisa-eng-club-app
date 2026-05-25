import { useState } from "react";
import LoginScreen from "@/components/LoginScreen";
import AppLayout from "@/components/AppLayout";

export type UserRole = "student" | "teacher" | "admin";

export interface User {
  id: string;
  name: string;
  role: UserRole;
  teacherId?: string;
}

export const DEMO_USERS: User[] = [
  { id: "s1", name: "Алиса Морозова", role: "student", teacherId: "t1" },
  { id: "s2", name: "Ольга Петрова", role: "student", teacherId: "t1" },
  { id: "s3", name: "Михаил Соколов", role: "student", teacherId: "t2" },
  { id: "s4", name: "Егор Лебедев", role: "student", teacherId: "t2" },
  { id: "t1", name: "Анна Ковалёва", role: "teacher" },
  { id: "t2", name: "Дмитрий Волков", role: "teacher" },
  { id: "a1", name: "Елена Смирнова", role: "admin" },
];

export default function Index() {
  const [user, setUser] = useState<User | null>(null);

  if (!user) {
    return <LoginScreen users={DEMO_USERS} onLogin={setUser} />;
  }

  return <AppLayout user={user} onLogout={() => setUser(null)} />;
}
