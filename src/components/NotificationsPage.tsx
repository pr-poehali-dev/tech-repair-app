import Icon from '@/components/ui/icon';

const notifications = [
  { id: 1, type: 'new', title: 'Новая заявка №1042', desc: 'Петров А.В. — замена смесителя, ул. Ленина, 24', time: '2 мин назад', read: false },
  { id: 2, type: 'status', title: 'Мастер прибыл', desc: 'Карпов И. принял заявку №1041 — Сидорова М.П.', time: '18 мин назад', read: false },
  { id: 3, type: 'payment', title: 'Поступила предоплата', desc: '2 000 ₽ от Иванова С.Г. по заявке №1040', time: '1 ч назад', read: false },
  { id: 4, type: 'done', title: 'Заявка выполнена', desc: '№1039 — Козлова Е.Н., Волков Д. завершил работу', time: '3 ч назад', read: true },
  { id: 5, type: 'review', title: 'Новый отзыв ⭐⭐⭐⭐⭐', desc: 'Фёдоров Н.А. оставил оценку по заявке №1036', time: '5 ч назад', read: true },
  { id: 6, type: 'new', title: 'Новая заявка №1038', desc: 'Морозов В.В. — замена радиатора, ул. Гагарина, 3', time: 'Вчера, 16:42', read: true },
  { id: 7, type: 'status', title: 'Мастер задерживается', desc: 'Семёнов П. опаздывает на заявку №1037 на 20 минут', time: 'Вчера, 12:15', read: true },
];

const typeConfig: Record<string, { icon: string; bg: string; color: string }> = {
  new: { icon: 'Plus', bg: 'bg-[hsl(var(--status-new)/0.15)]', color: 'text-[hsl(var(--status-new))]' },
  status: { icon: 'RefreshCw', bg: 'bg-primary/15', color: 'text-primary' },
  payment: { icon: 'Wallet', bg: 'bg-[hsl(var(--status-done)/0.15)]', color: 'text-[hsl(var(--status-done))]' },
  done: { icon: 'CheckCircle', bg: 'bg-[hsl(var(--status-done)/0.15)]', color: 'text-[hsl(var(--status-done))]' },
  review: { icon: 'Star', bg: 'bg-primary/15', color: 'text-primary' },
};

export default function NotificationsPage() {
  const unread = notifications.filter((n) => !n.read).length;

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
        <button className="text-xs text-primary tap-highlight px-3 py-2 rounded-xl bg-primary/10">
          Прочитать все
        </button>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-2 pb-4">
        {notifications.map((n, idx) => {
          const cfg = typeConfig[n.type] ?? typeConfig.status;
          return (
            <div
              key={n.id}
              className={`card-surface p-3.5 flex gap-3 animate-slide-up transition-opacity ${n.read ? 'opacity-60' : ''}`}
              style={{ animationDelay: `${idx * 35}ms` }}
            >
              <div className={`flex-shrink-0 w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center`}>
                <Icon name={cfg.icon} size={16} className={cfg.color} />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={`text-sm font-semibold leading-tight ${n.read ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {n.title}
                  </p>
                  {!n.read && (
                    <span className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-1" />
                  )}
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
