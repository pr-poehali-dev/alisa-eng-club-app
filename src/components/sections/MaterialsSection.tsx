import { useState } from "react";
import { User } from "@/pages/Index";
import Icon from "@/components/ui/icon";

type MaterialType = "pdf" | "video" | "audio" | "link" | "doc";

interface Material {
  id: string;
  title: string;
  description: string;
  type: MaterialType;
  url: string;
  uploadedBy: string;
  level: string;
  createdAt: Date;
}

const TYPE_ICONS: Record<MaterialType, string> = {
  pdf: "FileText",
  video: "PlayCircle",
  audio: "Music",
  link: "Link",
  doc: "FileEdit",
};

const TYPE_COLORS: Record<MaterialType, string> = {
  pdf: "bg-red-50 text-red-600",
  video: "bg-blue-50 text-blue-600",
  audio: "bg-purple-50 text-purple-600",
  link: "bg-green-50 text-green-600",
  doc: "bg-amber-50 text-amber-600",
};

const TYPE_LABELS: Record<MaterialType, string> = {
  pdf: "PDF",
  video: "Видео",
  audio: "Аудио",
  link: "Ссылка",
  doc: "Документ",
};

const INITIAL_MATERIALS: Material[] = [
  { id: "m1", title: "Учебник English File Elementary", description: "Основной учебник для группы Elementary A", type: "pdf", url: "#", uploadedBy: "Анна Ковалёва", level: "Elementary", createdAt: new Date(Date.now() - 86400000 * 5) },
  { id: "m2", title: "Listening – Unit 3 Tracks", description: "Аудио записи к Юниту 3", type: "audio", url: "#", uploadedBy: "Анна Ковалёва", level: "Elementary", createdAt: new Date(Date.now() - 86400000 * 3) },
  { id: "m3", title: "Grammar in Use – Present Perfect", description: "Видеоурок по Present Perfect с объяснением", type: "video", url: "#", uploadedBy: "Дмитрий Волков", level: "Pre-Intermediate", createdAt: new Date(Date.now() - 86400000 * 2) },
  { id: "m4", title: "Cambridge Dictionary Online", description: "Официальный кембриджский словарь", type: "link", url: "https://dictionary.cambridge.org", uploadedBy: "Дмитрий Волков", level: "All levels", createdAt: new Date(Date.now() - 86400000) },
  { id: "m5", title: "Рабочая тетрадь Pre-Intermediate", description: "Упражнения к основному курсу", type: "doc", url: "#", uploadedBy: "Дмитрий Волков", level: "Pre-Intermediate", createdAt: new Date(Date.now() - 43200000) },
];

const LEVELS = ["Все уровни", "Elementary", "Pre-Intermediate", "All levels"];

export default function MaterialsSection({ user }: { user: User }) {
  const [materials, setMaterials] = useState<Material[]>(INITIAL_MATERIALS);
  const [filter, setFilter] = useState<string>("Все уровни");
  const [showForm, setShowForm] = useState(false);
  const [newMat, setNewMat] = useState({ title: "", description: "", type: "pdf" as MaterialType, url: "", level: "Elementary" });

  const canAdd = user.role === "teacher" || user.role === "admin";

  const visible = filter === "Все уровни" ? materials : materials.filter((m) => m.level === filter);

  const addMaterial = () => {
    if (!newMat.title) return;
    const mat: Material = {
      id: `mat${Date.now()}`,
      ...newMat,
      uploadedBy: user.name,
      createdAt: new Date(),
    };
    setMaterials((p) => [mat, ...p]);
    setNewMat({ title: "", description: "", type: "pdf", url: "", level: "Elementary" });
    setShowForm(false);
  };

  const deleteMaterial = (id: string) => {
    setMaterials((p) => p.filter((m) => m.id !== id));
  };

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Учебные материалы</h2>
          <p className="text-muted-foreground text-sm mt-0.5">{visible.length} материалов</p>
        </div>
        {canAdd && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:opacity-90"
          >
            <Icon name="Plus" size={15} />
            Добавить
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setFilter(l)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
              ${filter === l ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground hover:text-foreground"}`}
          >
            {l}
          </button>
        ))}
      </div>

      {/* Add form */}
      {showForm && canAdd && (
        <div className="bg-card border border-border rounded-xl p-4 mb-5 animate-scale-in space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Новый материал</h3>
          <input
            placeholder="Название"
            value={newMat.title}
            onChange={(e) => setNewMat((f) => ({ ...f, title: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
          <input
            placeholder="Описание"
            value={newMat.description}
            onChange={(e) => setNewMat((f) => ({ ...f, description: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Тип</label>
              <select
                value={newMat.type}
                onChange={(e) => setNewMat((f) => ({ ...f, type: e.target.value as MaterialType }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                {(Object.keys(TYPE_LABELS) as MaterialType[]).map((t) => <option key={t} value={t}>{TYPE_LABELS[t]}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-muted-foreground block mb-1">Уровень</label>
              <select
                value={newMat.level}
                onChange={(e) => setNewMat((f) => ({ ...f, level: e.target.value }))}
                className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
              >
                {["Elementary", "Pre-Intermediate", "All levels"].map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
          </div>
          <input
            placeholder="Ссылка (URL)"
            value={newMat.url}
            onChange={(e) => setNewMat((f) => ({ ...f, url: e.target.value }))}
            className="w-full border border-border rounded-lg px-3 py-2 text-sm bg-background text-foreground"
          />
          <div className="flex gap-2 justify-end">
            <button onClick={() => setShowForm(false)} className="px-3 py-1.5 rounded-lg text-sm border border-border text-muted-foreground">Отмена</button>
            <button onClick={addMaterial} className="px-3 py-1.5 rounded-lg text-sm bg-primary text-primary-foreground hover:opacity-90">Сохранить</button>
          </div>
        </div>
      )}

      <div className="grid gap-3">
        {visible.map((mat) => (
          <div key={mat.id} className="bg-card border border-border rounded-xl p-4 flex items-start gap-4 hover:border-primary/30 transition-colors group">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${TYPE_COLORS[mat.type]}`}>
              <Icon name={TYPE_ICONS[mat.type]} size={20} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <a
                  href={mat.url !== "#" ? mat.url : undefined}
                  target="_blank"
                  rel="noreferrer"
                  className={`font-semibold text-sm text-foreground hover:text-primary transition-colors ${mat.url !== "#" ? "cursor-pointer" : "cursor-default"}`}
                >
                  {mat.title}
                </a>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[mat.type]}`}>{TYPE_LABELS[mat.type]}</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground">{mat.level}</span>
              </div>
              {mat.description && <p className="text-xs text-muted-foreground mt-1">{mat.description}</p>}
              <p className="text-xs text-muted-foreground mt-1">Загрузил: {mat.uploadedBy} · {mat.createdAt.toLocaleDateString("ru-RU")}</p>
            </div>
            {canAdd && (
              <button
                onClick={() => deleteMaterial(mat.id)}
                className="text-muted-foreground hover:text-destructive transition-colors opacity-0 group-hover:opacity-100 shrink-0"
              >
                <Icon name="Trash2" size={15} />
              </button>
            )}
          </div>
        ))}
      </div>

      {visible.length === 0 && (
        <div className="text-center py-16 text-muted-foreground">
          <Icon name="FolderOpen" size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">Материалов нет</p>
        </div>
      )}
    </div>
  );
}
