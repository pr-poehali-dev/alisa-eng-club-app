import { useState, useEffect } from "react";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

const GROUPS_URL = "https://functions.poehali.dev/f21c4595-d3bb-4863-97d4-ad0de6afa1bb";

interface GroupStudent { id: number; name: string; }
interface Group {
  id: number;
  name: string;
  teacher_id: number;
  teacher_name: string;
  students: GroupStudent[];
}
interface UserItem { id: number; name: string; role: string; }

async function api(action: string, payload?: object) {
  const res = await fetch(GROUPS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ action, ...payload }),
  });
  return res.json();
}

export default function GroupsSection({ user }: { user: User }) {
  const [groups, setGroups] = useState<Group[]>([]);
  const [teachers, setTeachers] = useState<UserItem[]>([]);
  const [students, setStudents] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<number | null>(null);

  // Форма создания группы
  const [showCreate, setShowCreate] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createTeacherId, setCreateTeacherId] = useState<number | "">("");
  const [creating, setCreating] = useState(false);

  // Форма редактирования группы
  const [editId, setEditId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");
  const [editTeacherId, setEditTeacherId] = useState<number | "">("");
  const [saving, setSaving] = useState(false);

  // Добавление ученика
  const [addStudentGroupId, setAddStudentGroupId] = useState<number | null>(null);
  const [addStudentId, setAddStudentId] = useState<number | "">("");

  useEffect(() => {
    Promise.all([
      api("list"),
      api("users", { role: "teacher" }),
      api("users", { role: "student" }),
    ]).then(([g, t, s]) => {
      setGroups(g.groups ?? []);
      setTeachers(t.users ?? []);
      setStudents(s.users ?? []);
      setLoading(false);
    });
  }, []);

  const reload = () =>
    api("list").then((g) => setGroups(g.groups ?? []));

  const handleCreate = async () => {
    if (!createName.trim() || !createTeacherId) return;
    setCreating(true);
    const res = await api("create", { name: createName.trim(), teacher_id: createTeacherId });
    if (res.group) setGroups((p) => [...p, res.group]);
    setCreateName("");
    setCreateTeacherId("");
    setShowCreate(false);
    setCreating(false);
  };

  const handleUpdate = async (groupId: number) => {
    if (!editName.trim() && !editTeacherId) return;
    setSaving(true);
    await api("update", {
      group_id: groupId,
      ...(editName.trim() ? { name: editName.trim() } : {}),
      ...(editTeacherId ? { teacher_id: editTeacherId } : {}),
    });
    await reload();
    setEditId(null);
    setSaving(false);
  };

  const handleDeleteGroup = async (groupId: number) => {
    if (!confirm("Удалить группу?")) return;
    await api("delete_group", { group_id: groupId });
    setGroups((p) => p.filter((g) => g.id !== groupId));
  };

  const handleAddStudent = async (groupId: number) => {
    if (!addStudentId) return;
    const res = await api("add_student", { group_id: groupId, student_id: addStudentId });
    if (res.group) setGroups((p) => p.map((g) => g.id === groupId ? res.group : g));
    setAddStudentGroupId(null);
    setAddStudentId("");
  };

  const handleRemoveStudent = async (groupId: number, studentId: number) => {
    const res = await api("remove_student", { group_id: groupId, student_id: studentId });
    if (res.group) setGroups((p) => p.map((g) => g.id === groupId ? res.group : g));
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
          <h2 className="text-xl font-bold text-foreground">Группы</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{groups.length} групп · преподаватели и ученики</p>
        </div>
        <button
          onClick={() => { setShowCreate(!showCreate); setEditId(null); }}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
        >
          <Icon name="Plus" size={15} />
          Создать группу
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="bg-card border border-primary/30 rounded-xl p-4 mb-5 animate-scale-in space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Новая группа</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Название группы</label>
              <input
                placeholder="Например: Elementary B"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Преподаватель</label>
              <select
                value={createTeacherId}
                onChange={(e) => setCreateTeacherId(+e.target.value || "")}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                <option value="">Выберите...</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
          </div>
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowCreate(false)} className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground">Отмена</button>
            <button
              onClick={handleCreate}
              disabled={creating || !createName.trim() || !createTeacherId}
              className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
            >
              {creating ? "Создаём..." : "Создать"}
            </button>
          </div>
        </div>
      )}

      {/* Groups list */}
      {groups.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="Users" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Групп пока нет</p>
        </div>
      ) : (
        <div className="space-y-3">
          {groups.map((group) => {
            const isExpanded = expandedId === group.id;
            const isEditing = editId === group.id;
            const isAddingStudent = addStudentGroupId === group.id;

            // Ученики не в этой группе
            const notInGroup = students.filter((s) => !group.students.find((gs) => gs.id === s.id));

            return (
              <div key={group.id} className="bg-card border border-border rounded-xl overflow-hidden hover:border-primary/30 transition-colors">
                {/* Header */}
                <div className="flex items-center gap-3 px-4 py-3.5">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    <Icon name="Users" size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm text-foreground">{group.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Icon name="User" size={11} />
                      {group.teacher_name}
                      <span className="mx-1">·</span>
                      <Icon name="Users" size={11} />
                      {group.students.length} учеников
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditId(isEditing ? null : group.id);
                        setEditName(group.name);
                        setEditTeacherId(group.teacher_id);
                        setExpandedId(group.id);
                      }}
                      title="Редактировать"
                      className="p-1.5 text-muted-foreground hover:text-primary transition-colors rounded-lg hover:bg-primary/5"
                    >
                      <Icon name="Pencil" size={14} />
                    </button>
                    <button
                      onClick={() => handleDeleteGroup(group.id)}
                      title="Удалить группу"
                      className="p-1.5 text-muted-foreground hover:text-destructive transition-colors rounded-lg hover:bg-destructive/5"
                    >
                      <Icon name="Trash2" size={14} />
                    </button>
                    <button
                      onClick={() => setExpandedId(isExpanded ? null : group.id)}
                      className="p-1.5 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      <Icon name={isExpanded ? "ChevronUp" : "ChevronDown"} size={16} />
                    </button>
                  </div>
                </div>

                {/* Edit form */}
                {isEditing && (
                  <div className="px-4 pb-4 pt-0 border-t border-border/60 animate-fade-in">
                    <p className="text-xs font-semibold text-muted-foreground mb-2 mt-3">Редактировать группу</p>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Название</label>
                        <input
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-muted-foreground block mb-1">Преподаватель</label>
                        <select
                          value={editTeacherId}
                          onChange={(e) => setEditTeacherId(+e.target.value || "")}
                          className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                        >
                          {teachers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => setEditId(null)} className="px-3 py-1.5 rounded-lg text-xs border border-border text-muted-foreground">Отмена</button>
                      <button
                        onClick={() => handleUpdate(group.id)}
                        disabled={saving}
                        className="px-3 py-1.5 rounded-lg text-xs bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                      >
                        {saving ? "Сохраняем..." : "Сохранить"}
                      </button>
                    </div>
                  </div>
                )}

                {/* Students list */}
                {isExpanded && !isEditing && (
                  <div className="border-t border-border/60 animate-fade-in">
                    {group.students.length === 0 ? (
                      <div className="px-4 py-3 text-xs text-muted-foreground">Учеников нет</div>
                    ) : (
                      <div className="divide-y divide-border/40">
                        {group.students.map((s) => (
                          <div key={s.id} className="flex items-center justify-between px-4 py-2.5">
                            <div className="flex items-center gap-2.5">
                              <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                                {s.name.charAt(0)}
                              </div>
                              <span className="text-sm text-foreground">{s.name}</span>
                            </div>
                            <button
                              onClick={() => handleRemoveStudent(group.id, s.id)}
                              className="text-muted-foreground hover:text-destructive transition-colors p-1"
                              title="Убрать из группы"
                            >
                              <Icon name="UserMinus" size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Add student */}
                    <div className="px-4 py-3 border-t border-border/40 bg-muted/20">
                      {isAddingStudent ? (
                        <div className="flex items-center gap-2">
                          <select
                            value={addStudentId}
                            onChange={(e) => setAddStudentId(+e.target.value || "")}
                            className="flex-1 border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
                          >
                            <option value="">Выберите ученика...</option>
                            {notInGroup.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                          </select>
                          <button
                            onClick={() => handleAddStudent(group.id)}
                            disabled={!addStudentId}
                            className="px-3 py-2 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-50"
                          >
                            Добавить
                          </button>
                          <button
                            onClick={() => { setAddStudentGroupId(null); setAddStudentId(""); }}
                            className="px-3 py-2 rounded-lg text-sm border border-border text-muted-foreground"
                          >
                            Отмена
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddStudentGroupId(group.id)}
                          className="flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 font-medium transition-colors"
                        >
                          <Icon name="UserPlus" size={14} />
                          Добавить ученика
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
