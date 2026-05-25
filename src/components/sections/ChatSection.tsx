import { useState, useRef, useEffect } from "react";
import { User, DEMO_USERS } from "@/pages/Index";
import Icon from "@/components/ui/icon";

interface Message {
  id: string;
  senderId: string;
  senderName: string;
  text: string;
  timestamp: Date;
  isBroadcast?: boolean;
}

interface Conversation {
  partnerId: string;
  partnerName: string;
  messages: Message[];
}

function initConversations(userId: string): Record<string, Conversation> {
  return {
    "t1-s1": { partnerId: "s1", partnerName: "Алиса Морозова", messages: [
      { id: "m1", senderId: "t1", senderName: "Анна Ковалёва", text: "Добрый день, Алиса! Как дела с домашним заданием?", timestamp: new Date(Date.now() - 3600000) },
      { id: "m2", senderId: "s1", senderName: "Алиса Морозова", text: "Здравствуйте! Всё выполнила, отправлю сегодня.", timestamp: new Date(Date.now() - 3500000) },
    ]},
    "t1-s2": { partnerId: "s2", partnerName: "Ольга Петрова", messages: [
      { id: "m3", senderId: "t1", senderName: "Анна Ковалёва", text: "Ольга, не забудьте подготовиться к тесту в среду!", timestamp: new Date(Date.now() - 7200000) },
    ]},
    "t2-s3": { partnerId: "s3", partnerName: "Михаил Соколов", messages: [
      { id: "m4", senderId: "t2", senderName: "Дмитрий Волков", text: "Михаил, хорошая работа на прошлом уроке!", timestamp: new Date(Date.now() - 86400000) },
    ]},
    "t2-s4": { partnerId: "s4", partnerName: "Егор Лебедев", messages: [] },
  };
}

function getConversationKey(a: string, b: string) {
  const pairs: Record<string, string> = { "s1": "t1", "s2": "t1", "s3": "t2", "s4": "t2" };
  if (pairs[a] === b || pairs[b] === a) {
    const teacher = a.startsWith("t") ? a : b;
    const student = a.startsWith("s") ? a : b;
    return `${teacher}-${student}`;
  }
  return `${a}-${b}`;
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
}

export default function ChatSection({ user }: { user: User }) {
  const [conversations, setConversations] = useState(() => initConversations(user.id));
  const [activeConvKey, setActiveConvKey] = useState<string | null>(null);
  const [text, setText] = useState("");
  const [broadcastText, setBroadcastText] = useState("");
  const [showBroadcast, setShowBroadcast] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [conversations, activeConvKey]);

  const getContacts = (): { key: string; partnerName: string; partnerId: string; lastMsg?: Message }[] => {
    if (user.role === "student") {
      const teacherId = user.id === "s1" || user.id === "s2" ? "t1" : "t2";
      const key = getConversationKey(user.id, teacherId);
      const teacher = DEMO_USERS.find((u) => u.id === teacherId);
      const conv = conversations[key];
      return [{ key, partnerName: teacher?.name ?? "Преподаватель", partnerId: teacherId, lastMsg: conv?.messages.at(-1) }];
    }
    if (user.role === "teacher") {
      const myStudents = user.id === "t1" ? ["s1", "s2"] : ["s3", "s4"];
      return myStudents.map((sid) => {
        const key = getConversationKey(user.id, sid);
        const student = DEMO_USERS.find((u) => u.id === sid);
        const conv = conversations[key];
        return { key, partnerName: student?.name ?? sid, partnerId: sid, lastMsg: conv?.messages.at(-1) };
      });
    }
    // admin — all
    const pairs = [["t1","s1"],["t1","s2"],["t2","s3"],["t2","s4"]];
    return pairs.map(([tid, sid]) => {
      const key = `${tid}-${sid}`;
      const t = DEMO_USERS.find((u) => u.id === tid);
      const s = DEMO_USERS.find((u) => u.id === sid);
      const conv = conversations[key];
      return { key, partnerName: `${s?.name} ↔ ${t?.name}`, partnerId: sid, lastMsg: conv?.messages.at(-1) };
    });
  };

  const contacts = getContacts();
  const activeConv = activeConvKey ? conversations[activeConvKey] : null;

  const sendMessage = () => {
    if (!text.trim() || !activeConvKey) return;
    const msg: Message = {
      id: `m${Date.now()}`,
      senderId: user.id,
      senderName: user.name,
      text: text.trim(),
      timestamp: new Date(),
    };
    setConversations((prev) => ({
      ...prev,
      [activeConvKey]: { ...prev[activeConvKey], messages: [...(prev[activeConvKey]?.messages ?? []), msg] },
    }));
    setText("");
  };

  const sendBroadcast = () => {
    if (!broadcastText.trim()) return;
    const keys = Object.keys(conversations);
    const msg: Message = { id: `b${Date.now()}`, senderId: user.id, senderName: user.name, text: broadcastText.trim(), timestamp: new Date(), isBroadcast: true };
    setConversations((prev) => {
      const updated = { ...prev };
      keys.forEach((k) => { updated[k] = { ...updated[k], messages: [...(updated[k]?.messages ?? []), msg] }; });
      return updated;
    });
    setBroadcastText("");
    setShowBroadcast(false);
  };

  return (
    <div className="flex h-full">
      {/* Contact list */}
      <div className="w-64 shrink-0 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-bold text-foreground text-sm">Сообщения</h2>
          {user.role === "admin" && (
            <button
              onClick={() => setShowBroadcast(!showBroadcast)}
              title="Групповая рассылка"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <Icon name="Send" size={16} />
            </button>
          )}
        </div>

        {showBroadcast && user.role === "admin" && (
          <div className="p-3 border-b border-border bg-accent/30 animate-scale-in">
            <p className="text-xs font-semibold text-muted-foreground mb-2">Групповая рассылка</p>
            <textarea
              rows={2}
              placeholder="Текст для всех..."
              value={broadcastText}
              onChange={(e) => setBroadcastText(e.target.value)}
              className="w-full border border-border rounded-lg px-2 py-1.5 text-xs bg-background text-foreground resize-none"
            />
            <div className="flex gap-2 mt-2">
              <button onClick={() => setShowBroadcast(false)} className="text-xs text-muted-foreground hover:text-foreground">Отмена</button>
              <button onClick={sendBroadcast} className="text-xs px-2 py-1 bg-primary text-primary-foreground rounded-md hover:opacity-90">Отправить всем</button>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {contacts.map((c) => (
            <button
              key={c.key}
              onClick={() => setActiveConvKey(c.key)}
              className={`w-full flex items-start gap-3 px-4 py-3 text-left border-b border-border/50 transition-colors
                ${activeConvKey === c.key ? "bg-accent/60" : "hover:bg-muted/50"}`}
            >
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-semibold shrink-0 mt-0.5">
                {c.partnerName.charAt(0)}
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium text-foreground truncate">{c.partnerName}</div>
                <div className="text-xs text-muted-foreground truncate">{c.lastMsg?.text ?? "Нет сообщений"}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Chat window */}
      <div className="flex-1 flex flex-col min-w-0">
        {activeConv ? (
          <>
            <div className="px-5 py-3.5 border-b border-border flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-semibold">
                {contacts.find((c) => c.key === activeConvKey)?.partnerName.charAt(0)}
              </div>
              <span className="font-semibold text-sm text-foreground">{contacts.find((c) => c.key === activeConvKey)?.partnerName}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {activeConv.messages.length === 0 && (
                <div className="text-center text-muted-foreground text-sm py-8">Начните диалог</div>
              )}
              {activeConv.messages.map((msg) => {
                const isMine = msg.senderId === user.id;
                const isAdminReadOnly = user.role === "admin" && msg.isBroadcast === undefined;
                return (
                  <div key={msg.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-xs rounded-2xl px-3.5 py-2.5 ${
                      msg.isBroadcast
                        ? "bg-amber-50 border border-amber-200 text-amber-900 text-xs"
                        : isMine
                          ? "bg-primary text-primary-foreground"
                          : "bg-card border border-border text-foreground"
                    }`}>
                      {msg.isBroadcast && <div className="text-xs font-semibold mb-1 opacity-70">📢 Рассылка от {msg.senderName}</div>}
                      {!isMine && !msg.isBroadcast && (
                        <div className="text-xs font-medium mb-1 opacity-60">{msg.senderName}</div>
                      )}
                      <p className="text-sm leading-relaxed">{msg.text}</p>
                      <div className={`text-xs mt-1 ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"} text-right`}>{formatTime(msg.timestamp)}</div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {user.role !== "admin" && (
              <div className="p-4 border-t border-border flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
                  placeholder="Написать сообщение..."
                  className="flex-1 border border-border rounded-xl px-4 py-2.5 text-sm bg-background text-foreground focus:outline-none focus:border-primary"
                />
                <button
                  onClick={sendMessage}
                  disabled={!text.trim()}
                  className="px-4 py-2.5 bg-primary text-primary-foreground rounded-xl hover:opacity-90 disabled:opacity-40 transition-opacity"
                >
                  <Icon name="Send" size={16} />
                </button>
              </div>
            )}
            {user.role === "admin" && (
              <div className="p-3 text-center text-xs text-muted-foreground border-t border-border bg-muted/30">
                Администратор не может читать/редактировать личные сообщения учеников
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Icon name="MessageSquare" size={48} className="mx-auto mb-3 opacity-20" />
              <p className="text-sm">Выберите диалог</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
