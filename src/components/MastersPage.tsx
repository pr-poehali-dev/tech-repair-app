import Icon from '@/components/ui/icon';

const masters = [
  { id: 1, name: 'Карпов Иван Сергеевич', phone: '+7 (912) 345-67-89', speciality: 'Сантехника', rating: 4.9, orders: 142, active: 2, status: 'busy', revenue: 48600 },
  { id: 2, name: 'Волков Дмитрий Андреевич', phone: '+7 (903) 211-44-55', speciality: 'Сантехника / Отопление', rating: 4.7, orders: 98, active: 1, status: 'busy', revenue: 32400 },
  { id: 3, name: 'Новиков Алексей Игоревич', phone: '+7 (916) 788-22-11', speciality: 'Канализация', rating: 4.8, orders: 76, active: 0, status: 'free', revenue: 27800 },
  { id: 4, name: 'Семёнов Пётр Вячеславович', phone: '+7 (926) 133-90-40', speciality: 'Отопление', rating: 4.5, orders: 54, active: 0, status: 'offline', revenue: 18200 },
];

const summaryItems = [
  { label: 'Всего', value: '4', icon: 'Users' },
  { label: 'На заявках', value: '2', icon: 'Wrench' },
  { label: 'Свободны', value: '1', icon: 'CheckCircle' },
];

export default function MastersPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Команда</p>
          <h1 className="text-2xl font-bold text-foreground">Мастера</h1>
        </div>
        <button className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center tap-highlight active:scale-95 transition-transform">
          <Icon name="UserPlus" size={18} className="text-primary-foreground" />
        </button>
      </div>

      {/* Summary */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-2">
        {summaryItems.map((s) => (
          <div key={s.label} className="card-surface p-3 flex flex-col items-center gap-1">
            <Icon name={s.icon} size={18} className="text-primary" />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Masters list */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-3 pb-4">
        {masters.map((m, idx) => (
          <div
            key={m.id}
            className="card-surface p-4 tap-highlight active:scale-[0.98] transition-transform cursor-pointer animate-slide-up"
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              {/* Avatar */}
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{m.name[0]}</span>
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
                  m.status === 'busy' ? 'bg-[hsl(var(--status-progress))]' :
                  m.status === 'free' ? 'bg-[hsl(var(--status-done))]' : 'bg-muted-foreground'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm leading-tight">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.speciality}</p>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Icon name="Star" size={11} className="text-primary fill-primary" />
                    <span className="text-xs font-medium text-foreground">{m.rating}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{m.orders} заявок</span>
                  {m.active > 0 && (
                    <span className="text-xs status-progress px-1.5 py-0.5 rounded border">
                      {m.active} активных
                    </span>
                  )}
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-foreground">{m.revenue.toLocaleString()} ₽</p>
                <p className="text-[10px] text-muted-foreground mt-0.5">за апрель</p>
              </div>
            </div>

            <div className="flex gap-2 mt-3">
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-sm text-foreground tap-highlight">
                <Icon name="Phone" size={13} className="text-primary" />
                Позвонить
              </button>
              <button className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-primary/10 text-sm text-primary tap-highlight">
                <Icon name="ClipboardList" size={13} />
                Заявки
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
