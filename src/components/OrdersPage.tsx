import Icon from '@/components/ui/icon';

const orders = [
  { id: '№1042', client: 'Петров А.В.', address: 'ул. Ленина, 24, кв. 7', type: 'Замена смесителя', master: 'Карпов И.', time: '09:00', date: 'Сегодня', status: 'progress', prepaid: 1500, total: 4500 },
  { id: '№1041', client: 'Сидорова М.П.', address: 'пр. Мира, 88, кв. 31', type: 'Прочистка канализации', master: 'Волков Д.', time: '11:30', date: 'Сегодня', status: 'new', prepaid: 0, total: 3200 },
  { id: '№1040', client: 'Иванов С.Г.', address: 'ул. Садовая, 5, кв. 2', type: 'Установка унитаза', master: 'Карпов И.', time: '14:00', date: 'Сегодня', status: 'pending', prepaid: 2000, total: 6800 },
  { id: '№1039', client: 'Козлова Е.Н.', address: 'ул. Пушкина, 12, кв. 19', type: 'Течь трубы', master: 'Новиков А.', time: '16:00', date: 'Вчера', status: 'done', prepaid: 1000, total: 2800 },
  { id: '№1038', client: 'Морозов В.В.', address: 'ул. Гагарина, 3, кв. 45', type: 'Замена радиатора', master: 'Волков Д.', time: '10:00', date: 'Вчера', status: 'cancelled', prepaid: 0, total: 8500 },
  { id: '№1037', client: 'Алексеева Т.К.', address: 'ул. Советская, 67, кв. 8', type: 'Монтаж счётчиков воды', master: 'Новиков А.', time: '13:00', date: 'Вчера', status: 'done', prepaid: 500, total: 3600 },
];

const statusLabel: Record<string, string> = {
  new: 'Новая',
  progress: 'В работе',
  done: 'Выполнена',
  cancelled: 'Отменена',
  pending: 'Ожидание',
};

const statusClass: Record<string, string> = {
  new: 'status-new',
  progress: 'status-progress',
  done: 'status-done',
  cancelled: 'status-cancelled',
  pending: 'status-pending',
};

const filters = ['Все', 'Новые', 'В работе', 'Ожидание', 'Выполнены'];

export default function OrdersPage() {
  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Сегодня, 27 апр</p>
          <h1 className="text-2xl font-bold text-foreground leading-tight">Заявки</h1>
        </div>
        <button className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center tap-highlight active:scale-95 transition-transform">
          <Icon name="Plus" size={20} className="text-primary-foreground" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Поиск по заявкам...</span>
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 mb-3 grid grid-cols-4 gap-2">
        {[
          { label: 'Всего', value: '6', color: 'text-foreground' },
          { label: 'Новых', value: '1', color: 'text-[hsl(var(--status-new))]' },
          { label: 'В работе', value: '2', color: 'text-primary' },
          { label: 'Готово', value: '2', color: 'text-[hsl(var(--status-done))]' },
        ].map((s) => (
          <div key={s.label} className="card-surface p-2.5 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-none">
        {filters.map((f, i) => (
          <button
            key={f}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium tap-highlight transition-all ${
              i === 0
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-muted-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-2.5 pb-4">
        {orders.map((order, idx) => (
          <div
            key={order.id}
            className="card-surface p-3.5 tap-highlight active:scale-[0.98] transition-transform cursor-pointer animate-slide-up"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">{order.id}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${statusClass[order.status]}`}>
                  {statusLabel[order.status]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{order.date}, {order.time}</span>
            </div>

            <p className="font-semibold text-foreground text-sm mb-0.5">{order.client}</p>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Icon name="MapPin" size={11} className="flex-shrink-0" />
              {order.address}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                  <Icon name="Wrench" size={10} className="text-primary" />
                </div>
                <span className="text-xs text-muted-foreground">{order.master}</span>
              </div>
              <div className="flex items-center gap-3">
                {order.prepaid > 0 && (
                  <span className="text-xs text-[hsl(var(--status-done))]">+{order.prepaid.toLocaleString()} ₽</span>
                )}
                <span className="text-sm font-bold text-foreground">{order.total.toLocaleString()} ₽</span>
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Icon name="Zap" size={11} className="text-primary flex-shrink-0" />
              {order.type}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
