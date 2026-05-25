import { useState } from "react";
import { User, apiAuth } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Props {
  onLogin: (user: User, token: string) => void;
}

export default function LoginScreen({ onLogin }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const data = await apiAuth("login", { email: email.trim().toLowerCase(), password });
      if (data.error) {
        setError(data.error);
      } else {
        onLogin({ ...data.user, id: String(data.user.id) }, data.token);
      }
    } catch {
      setError("Ошибка соединения. Попробуйте ещё раз.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-sm animate-fade-in">

        {/* Header */}
        <div className="text-center mb-8">
          <img
            src="https://cdn.poehali.dev/projects/d0572299-fe7a-4456-96eb-3a198585116b/bucket/63e32b5a-6dc4-4ba1-b8a3-1c4b06994aa5.jpg"
            alt="Alisa Eng Club"
            className="w-48 h-32 object-contain mx-auto mb-2"
          />
          <p className="text-muted-foreground text-sm">Войдите в свой аккаунт</p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Email</label>
            <div className="relative">
              <Icon name="Mail" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                autoComplete="email"
                placeholder="your@email.ru"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-muted-foreground block mb-1.5">Пароль</label>
            <div className="relative">
              <Icon name="Lock" size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="w-full pl-10 pr-10 py-3 border border-border rounded-xl bg-card text-foreground text-sm focus:outline-none focus:border-primary transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                <Icon name={showPassword ? "EyeOff" : "Eye"} size={15} />
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 px-3 py-2.5 bg-destructive/10 border border-destructive/20 rounded-lg animate-scale-in">
              <Icon name="AlertCircle" size={14} className="text-destructive shrink-0" />
              <p className="text-xs text-destructive">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !email || !password}
            className="w-full py-3 mt-1 bg-primary text-primary-foreground rounded-xl font-semibold text-sm
              hover:opacity-90 hover:shadow-md transition-all duration-200
              disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground/40 border-t-primary-foreground rounded-full animate-spin" />
                Вход...
              </>
            ) : "Войти"}
          </button>
        </form>

        {/* Hint */}
        <div className="mt-6 p-3 bg-muted/60 rounded-xl border border-border">
          <p className="text-xs font-semibold text-muted-foreground mb-2">Демо-доступ:</p>
          <div className="space-y-1 text-xs text-muted-foreground">
            <div className="flex justify-between"><span>anna@alisaeng.ru</span><span className="font-mono">alisa123</span></div>
            <div className="flex justify-between"><span>alisa@alisaeng.ru</span><span className="font-mono">alisa123</span></div>
            <div className="flex justify-between"><span>elena@alisaeng.ru</span><span className="font-mono">alisa123</span></div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">Alisa Eng Club · 2026</p>
      </div>
    </div>
  );
}