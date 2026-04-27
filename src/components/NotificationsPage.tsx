import { useState, useEffect } from 'react';
import { Order, apiGetOrders } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Icon from '@/components/ui/icon';

interface Notif {
  id: string;
  type: string;
  title: string;
  desc: string;
  time: string;
  read: boolean;
}

const TYPE_CFG: Record<string, { icon: string; bg: string; color: string }> = {
  new: { icon: 'Plus', bg: 'bg-[hsl(var(--status-new)/0.15)]', color: 'text-[hsl(var(--status-new))]' },
  accepted: { icon: 'UserCheck', bg: 'bg-primary/15', color: 'text-primary' },
  in_progress: { icon: 'Zap', bg: 'bg-primary/15', color: 'text-primary' },
  done: { icon: 'CheckCircle', bg: 'bg-[hsl(var(--status-done)/0.15)]', color: 'text-[hsl(var(--status-done))]' },
  cancelled: { icon: 'XCircle', bg: 'bg-destructive/10', color: 'text-destructive' },
};

const STATUS_RU: Record<string, string> = {
  new: 'Новая заявка', accepted: 'Заявка принята', in_progress: 'Мастер в работе', done: 'Заявка выполнена', cancelled: 'Заявка отменена',
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'только что';
  if (m < 60) return `${m} мин назад`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} ч назад`;
  return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
}

export default function NotificationsPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem('read_notifs');
    if (stored) setReadIds(new Set(JSON.parse(stored)));

    apiGetOrders().then((o) => {
      setOrders(o.slice(0, 20));
      setLoading(false);
    }).catch(() => setLoading(false));

    const iv = setInterval(() => {
      apiGetOrders().then((o) => setOrders(o.slice(0, 20))).catch(() => {});
    }, 15000);
    return () => clearInterval(iv);
  }, []);

  const notifs: Notif[] = orders.map((o) => ({
    id: `${o.id}-${o.status}`,
    type: o.status,
    title: STATUS_RU[o.status] || o.status,
    desc: `#${o.id} — ${o.client_name}, ${o.work_type}${o.master_name ? `, мастер: ${o.master_name}` : ''}`,
    time: timeAgo(o.updated_at),
    read: readIds.has(`${o.id}-${o.status}`),
  }));

  const unread = notifs.filter((n) => !n.read).length;

  const markAllRead = () => {
    const allIds = notifs.map((n) => n.id);
    const newSet = new Set([...readIds, ...allIds]);
    setReadIds(newSet);
    localStorage.setItem('read_notifs', JSON.stringify([...newSet]));
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Оповещения</p>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            Уведомления
            {unread > 0 && (
              <span className="text-sm font-bold px-2 py-0.5 rounded-full bg-primary text-primary-foreground">
                {unread}
              </span>
            )}
          </h1>
        </div>
        {unread > 0 && (
          <button onClick={markAllRead} className="text-xs text-primary tap-highlight px-3 py-2 rounded-xl bg-primary/10">
            Прочитать все
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-2 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && notifs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Icon name="Bell" size={40} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Уведомлений нет</p>
          </div>
        )}

        {notifs.map((n, idx) => {
          const cfg = TYPE_CFG[n.type] || TYPE_CFG.new;
          return (
            <div
              key={n.id}
              className={`card-surface p-3.5 flex gap-3 animate-slide-up transition-opacity ${n.read ? 'opacity-55' : ''}`}
              style={{ animationDelay: `${idx * 30}ms` }}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                <Icon name={cfg.icon} size={16} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-tight ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {n.title}
                  </p>
                  {!n.read && <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.desc}</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">{n.time}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
