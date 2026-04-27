import Icon from '@/components/ui/icon';

const weekData = [
  { day: 'Пн', amount: 12400, orders: 4 },
  { day: 'Вт', amount: 8200, orders: 3 },
  { day: 'Ср', amount: 15800, orders: 6 },
  { day: 'Чт', amount: 9600, orders: 3 },
  { day: 'Пт', amount: 18200, orders: 7 },
  { day: 'Сб', amount: 21400, orders: 8 },
  { day: 'Вс', amount: 6800, orders: 2 },
];

const maxAmount = Math.max(...weekData.map((d) => d.amount));

const masterStats = [
  { name: 'Карпов И.', orders: 12, revenue: 48600, percent: 38 },
  { name: 'Волков Д.', orders: 8, revenue: 32400, percent: 26 },
  { name: 'Новиков А.', orders: 7, revenue: 27800, percent: 22 },
  { name: 'Семёнов П.', orders: 5, revenue: 18200, percent: 14 },
];

export default function StatsPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Апрель 2026</p>
        <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-4 pb-4">
        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="card-surface p-4">
            <Icon name="TrendingUp" size={18} className="text-[hsl(var(--status-done))] mb-2" />
            <p className="text-2xl font-bold text-foreground">127 400 ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">Выручка за апрель</p>
            <p className="text-xs text-[hsl(var(--status-done))] mt-1">+14% к марту</p>
          </div>
          <div className="card-surface p-4">
            <Icon name="Wallet" size={18} className="text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">18 500 ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">Предоплаты</p>
            <p className="text-xs text-muted-foreground mt-1">32 платежа</p>
          </div>
          <div className="card-surface p-4">
            <Icon name="ClipboardCheck" size={18} className="text-[hsl(var(--status-new))] mb-2" />
            <p className="text-2xl font-bold text-foreground">32</p>
            <p className="text-xs text-muted-foreground mt-0.5">Закрытых заявок</p>
            <p className="text-xs text-[hsl(var(--status-done))] mt-1">из 38 принятых</p>
          </div>
          <div className="card-surface p-4">
            <Icon name="Star" size={18} className="text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">4.8</p>
            <p className="text-xs text-muted-foreground mt-0.5">Средний рейтинг</p>
            <p className="text-xs text-muted-foreground mt-1">28 отзывов</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-foreground text-sm">Доходы по дням</p>
            <span className="text-xs text-muted-foreground">Эта неделя</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {weekData.map((d) => {
              const height = Math.round((d.amount / maxAmount) * 100);
              const isToday = d.day === 'Вс';
              return (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                    <div
                      className={`w-full rounded-t-lg transition-all ${isToday ? 'bg-primary' : 'bg-primary/25'}`}
                      style={{ height: `${height}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Masters performance */}
        <div className="card-surface p-4">
          <p className="font-semibold text-foreground text-sm mb-4">Выручка по мастерам</p>
          <div className="space-y-3">
            {masterStats.map((m) => (
              <div key={m.name}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm text-foreground">{m.name}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{m.orders} зак.</span>
                    <span className="text-sm font-semibold text-foreground">{m.revenue.toLocaleString()} ₽</span>
                  </div>
                </div>
                <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                  <div
                    className="h-full bg-primary rounded-full transition-all"
                    style={{ width: `${m.percent}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Period selector */}
        <div className="card-surface p-1 flex">
          {['Неделя', 'Месяц', 'Квартал', 'Год'].map((p, i) => (
            <button
              key={p}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${
                i === 1 ? 'bg-primary text-primary-foreground' : 'text-muted-foreground'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
