import Icon from '@/components/ui/icon';

const menuItems = [
  { icon: 'Bell', label: 'Уведомления', desc: 'Настройка оповещений', action: true },
  { icon: 'Users', label: 'Управление мастерами', desc: 'Роли и доступы' },
  { icon: 'CreditCard', label: 'Оплата и тарифы', desc: 'PRO-план активен' },
  { icon: 'Download', label: 'Экспорт данных', desc: 'Excel, PDF отчёты' },
  { icon: 'Smartphone', label: 'Мобильное приложение', desc: 'Синхронизация в реальном времени' },
  { icon: 'HelpCircle', label: 'Поддержка', desc: 'Чат и документация' },
  { icon: 'LogOut', label: 'Выйти', desc: '', danger: true },
];

export default function ProfilePage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Кабинет</p>
        <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-4">
        {/* Profile card */}
        <div className="mx-4 mb-4 card-surface p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <span className="text-2xl font-black text-primary-foreground">Д</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg leading-tight">Диспетчер</p>
              <p className="text-sm text-muted-foreground">Александр Смирнов</p>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary">
                  PRO
                </span>
                <span className="text-xs text-muted-foreground">admin@remsrv.ru</span>
              </div>
            </div>
            <button className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Icon name="Edit2" size={15} className="text-foreground" />
            </button>
          </div>
        </div>

        {/* Sync status */}
        <div className="mx-4 mb-4 card-surface p-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[hsl(var(--status-done)/0.15)] flex items-center justify-center">
            <Icon name="RefreshCw" size={15} className="text-[hsl(var(--status-done))]" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Синхронизация активна</p>
            <p className="text-xs text-muted-foreground">Последнее обновление: 2 мин назад</p>
          </div>
          <div className="w-2 h-2 rounded-full bg-[hsl(var(--status-done))] animate-pulse" />
        </div>

        {/* Stats */}
        <div className="mx-4 mb-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Заявок', value: '342', icon: 'ClipboardList' },
            { label: 'Мастеров', value: '4', icon: 'Users' },
            { label: 'Клиентов', value: '218', icon: 'UserCheck' },
          ].map((s) => (
            <div key={s.label} className="card-surface p-3 text-center">
              <Icon name={s.icon} size={16} className="text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="mx-4 card-surface overflow-hidden">
          {menuItems.map((item, idx) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 px-4 py-3.5 tap-highlight text-left transition-colors hover:bg-secondary/50 ${
                idx < menuItems.length - 1 ? 'border-b border-border' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                item.danger ? 'bg-destructive/10' : 'bg-secondary'
              }`}>
                <Icon
                  name={item.icon}
                  size={15}
                  className={item.danger ? 'text-destructive' : 'text-foreground'}
                />
              </div>
              <div className="flex-1">
                <p className={`text-sm font-medium ${item.danger ? 'text-destructive' : 'text-foreground'}`}>
                  {item.label}
                </p>
                {item.desc && <p className="text-xs text-muted-foreground">{item.desc}</p>}
              </div>
              {!item.danger && (
                item.action ? (
                  <div className="w-10 h-6 rounded-full bg-primary flex items-center justify-end pr-1">
                    <div className="w-4 h-4 rounded-full bg-white" />
                  </div>
                ) : (
                  <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
                )
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
