import { useState, useEffect } from 'react';
import { Order, apiGetOrders } from '@/lib/api';
import Icon from '@/components/ui/icon';

export default function HistoryPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    apiGetOrders().then((all) => {
      setOrders(all.filter((o) => o.status === 'done' || o.status === 'cancelled'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) =>
    !search ||
    o.client_name.toLowerCase().includes(search.toLowerCase()) ||
    o.work_type.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (iso: string) => {
    return new Date(iso).toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Архив</p>
          <h1 className="text-2xl font-bold text-foreground">История</h1>
        </div>
      </div>

      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск в архиве..."
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-2.5 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Icon name="Archive" size={40} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">История пуста</p>
          </div>
        )}

        {filtered.map((h, idx) => (
          <div
            key={h.id}
            className="card-surface p-3.5 animate-slide-up"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono text-muted-foreground">#{h.id}</span>
                  <span className={`text-xs px-1.5 py-0.5 rounded border ${h.status === 'done' ? 'status-done' : 'status-cancelled'}`}>
                    {h.status === 'done' ? 'Выполнена' : 'Отменена'}
                  </span>
                </div>
                <p className="font-semibold text-foreground text-sm">{h.client_name}</p>
                <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                  <Icon name="Zap" size={11} className="text-primary" />
                  {h.work_type}
                </p>
                {h.master_name && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className="w-4 h-4 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon name="Wrench" size={8} className="text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{h.master_name}</span>
                  </div>
                )}
                {h.master_notes && (
                  <p className="text-xs text-muted-foreground mt-1 italic">"{h.master_notes}"</p>
                )}
              </div>
              <div className="text-right flex-shrink-0">
                {h.final_amount > 0 && (
                  <p className="text-sm font-bold text-foreground">{h.final_amount.toLocaleString('ru')} ₽</p>
                )}
                {h.parts_cost > 0 && (
                  <p className="text-xs text-muted-foreground">запч. {h.parts_cost.toLocaleString('ru')} ₽</p>
                )}
                <p className="text-xs text-muted-foreground mt-1">{formatDate(h.updated_at)}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
