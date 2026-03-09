import { useState } from "react";
import { motion } from "framer-motion";
import { Shield, Loader2, Lock, Eye, EyeOff, XCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getCurrentTelegramId } from "@/lib/adminAccess";

type AdminRole = "owner" | "moderator" | null;

type TelegramWindow = Window & {
  Telegram?: {
    WebApp?: {
      initData?: string;
    };
  };
};

type AdminLoginResponse = {
  error?: string;
  admin_token?: string;
};

export function PasswordGate({ onAuth }: { onAuth: (role: AdminRole) => void }) {
  const [password, setPassword] = useState("");
  const [visible, setVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const telegramId = getCurrentTelegramId();
  const initData = (window as TelegramWindow).Telegram?.WebApp?.initData || "";

  const writeAudit = async (action: string, details: Record<string, unknown>) => {
    await fetch("/api/audit", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, details, init_data: initData }),
    }).catch(() => undefined);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          password,
          init_data: initData,
        }),
      });
      const payload: AdminLoginResponse = await response.json().catch(() => ({}));

      if (!response.ok || !payload.admin_token) {
        const messageByError: Record<string, string> = {
          invalid_password: "Неверный пароль",
          admin_forbidden: "Доступ только для владельца",
          invalid_init_data: "Откройте приложение через Telegram",
        };
        const message = payload.error ? messageByError[payload.error] || "Ошибка авторизации" : "Ошибка авторизации";
        setError(message);
        toast.error(message);
        await writeAudit("admin_login_failed", { telegram_id: telegramId, reason: payload.error || "unknown" });
        setLoading(false);
        return;
      }

      sessionStorage.setItem("admin_auth", "true");
      sessionStorage.setItem("admin_token", payload.admin_token);
      sessionStorage.setItem("admin_telegram_id", telegramId || "");
      sessionStorage.setItem("admin_role", "owner");
      await writeAudit("admin_login_success", { telegram_id: telegramId });
      onAuth("owner");
    } catch {
      setError("Ошибка авторизации");
      toast.error("Ошибка авторизации");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="w-full max-w-sm bg-secondary/30 border-border/50">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2 glow-primary">
              <Shield size={24} className="text-primary" />
            </div>
            <CardTitle className="text-xl">Админ-центр</CardTitle>
            <CardDescription>Доступ только для владельцев</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground">Telegram ID</label>
                <Input type="text" value={telegramId || "не определен"} disabled className="font-mono" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-mono text-muted-foreground">Пароль</label>
                <div className="relative">
                  <Input
                    type={visible ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setError("");
                    }}
                    placeholder="Пароль"
                    className={`pr-10 font-mono ${error ? "border-destructive" : ""}`}
                  />
                  <button
                    type="button"
                    onClick={() => setVisible(!visible)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {visible ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <XCircle size={12} /> {error}
                </p>
              )}
              <Button type="submit" className="w-full gap-2" disabled={loading || !password}>
                {loading ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
                Войти
              </Button>
            </form>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
