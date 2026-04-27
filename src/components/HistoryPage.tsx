import Icon from '@/components/ui/icon';

const history = [
  { id: '№1036', client: 'Фёдоров Н.А.', type: 'Замена счётчиков', master: 'Карпов И.', date: '25 апр', amount: 4200, rating: 5 },
  { id: '№1035', client: 'Романова О.С.', type: 'Монтаж тёплого пола', master: 'Волков Д.', date: '24 апр', amount: 12400, rating: 5 },
  { id: '№1034', client: 'Титов В.А.', type: 'Прочистка канализации', master: 'Новиков А.', date: '24 апр', amount: 2800, rating: 4 },
  { id: '№1033', client: 'Кузнецова Л.И.', type: 'Установка смесителя', master: 'Карпов И.', date: '23 апр', amount: 3600, rating: 5 },
  { id: '№1032', client: 'Павлов Г.В.', type: 'Замена радиатора отопления', master: 'Семёнов П.', date: '22 апр', amount: 8900, rating: 4 },
  { id: '№1031', client: 'Захарова Т.Н.', type: 'Ремонт трубы', master: 'Волков Д.', date: '21 апр', amount: 1900, rating: 5 },
  { id: '№1030', client: 'Андреев С.М.', type: 'Монтаж водонагревателя', master: 'Карпов И.', date: '20 апр', amount: 6800, rating: 5 },
];

export default function HistoryPage() {
  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Апрель 2026</p>
          <h1 className="text-2xl font-bold text-foreground">История</h1>
        </div>
        <button className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
          <Icon name="Filter" size={18} className="text-foreground" />
        </button>
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <span className="text-muted-foreground text-sm">Поиск в архиве...</span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-2.5 pb-4">
        {history.map((h, idx) => (
          <div
            key={h.id}
            className="card-surface p-3.5 animate-slide-up"
            style={{ animationDelay: `${idx * 40}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">{h.id}</span>
                  <span className="text-xs status-done px-1.5 py-0.5 rounded border">Выполнена</span>
                </div>
                <p className="font-semibold text-foreground text-sm">{h.client}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Icon name="Zap" size={11} className="text-primary" />
                  {h.type}
                </p>

                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon name="Wrench" size={8} className="text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{h.master}</span>
                  </div>
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Icon
                        key={i}
                        name="Star"
                        size={10}
                        className={i < h.rating ? 'text-primary fill-primary' : 'text-muted-foreground'}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <p className="text-sm font-bold text-foreground">{h.amount.toLocaleString()} ₽</p>
                <p className="text-xs text-muted-foreground mt-0.5">{h.date}</p>
                <button className="mt-2 flex items-center gap-1 text-xs text-primary">
                  <Icon name="FileText" size={11} />
                  Акт
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* Load more */}
        <button className="w-full py-3 text-sm text-muted-foreground border border-dashed border-border rounded-xl">
          Загрузить ещё
        </button>
      </div>
    </div>
  );
}
