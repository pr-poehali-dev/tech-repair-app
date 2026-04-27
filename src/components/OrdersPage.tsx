import { useState, useEffect, useCallback } from 'react';
import { Order, User, apiGetOrders, apiGetUsers } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Icon from '@/components/ui/icon';
import OrderDetailSheet from './OrderDetailSheet';
import CreateOrderModal from './CreateOrderModal';

const STATUS_LABEL: Record<string, string> = {
  new: 'Новая', accepted: 'Принята', in_progress: 'В работе', done: 'Выполнена', cancelled: 'Отменена',
};
const STATUS_CLASS: Record<string, string> = {
  new: 'status-new', accepted: 'status-pending', in_progress: 'status-progress', done: 'status-done', cancelled: 'status-cancelled',
};

const FILTERS = ['Все', 'Новые', 'Принятые', 'В работе', 'Выполнены', 'Отменены'];
const FILTER_STATUS: Record<string, string | null> = {
  'Все': null, 'Новые': 'new', 'Принятые': 'accepted', 'В работе': 'in_progress', 'Выполнены': 'done', 'Отменены': 'cancelled',
};

export default function OrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [masters, setMasters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('Все');
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Order | null>(null);
  const [showCreate, setShowCreate] = useState(false);

  const load = useCallback(async () => {
    try {
      const [ords, usrs] = await Promise.all([apiGetOrders(), user?.role === 'admin' ? apiGetUsers() : Promise.resolve([])]);
      setOrders(ords);
      setMasters(usrs);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
    const interval = setInterval(load, 15000);
    return () => clearInterval(interval);
  }, [load]);

  const filtered = orders.filter((o) => {
    const statusOk = !FILTER_STATUS[filter] || o.status === FILTER_STATUS[filter];
    const searchOk = !search || o.client_name.toLowerCase().includes(search.toLowerCase()) || o.address.toLowerCase().includes(search.toLowerCase()) || o.work_type.toLowerCase().includes(search.toLowerCase());
    return statusOk && searchOk;
  });

  const counts = {
    all: orders.length,
    new: orders.filter((o) => o.status === 'new').length,
    in_progress: orders.filter((o) => o.status === 'in_progress' || o.status === 'accepted').length,
    done: orders.filter((o) => o.status === 'done').length,
  };

  const handleUpdated = (updated: Order) => {
    setOrders((prev) => prev.map((o) => o.id === updated.id ? updated : o));
    setSelected(updated);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    if (diff < 86400000) return d.toLocaleTimeString('ru', { hour: '2-digit', minute: '2-digit' });
    if (diff < 172800000) return 'Вчера';
    return d.toLocaleDateString('ru', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
            {new Date().toLocaleDateString('ru', { day: 'numeric', month: 'long' })}
          </p>
          <h1 className="text-2xl font-bold text-foreground">Заявки</h1>
        </div>
        {user?.role === 'admin' && (
          <button
            onClick={() => setShowCreate(true)}
            className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center tap-highlight active:scale-95 transition-transform"
          >
            <Icon name="Plus" size={20} className="text-primary-foreground" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-4 mb-3">
        <div className="flex items-center gap-2 bg-secondary rounded-xl px-3 py-2.5">
          <Icon name="Search" size={16} className="text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Поиск по заявкам..."
            className="flex-1 bg-transparent text-foreground text-sm outline-none placeholder:text-muted-foreground"
          />
          {search && <button onClick={() => setSearch('')}><Icon name="X" size={14} className="text-muted-foreground" /></button>}
        </div>
      </div>

      {/* Stats row */}
      <div className="px-4 mb-3 grid grid-cols-4 gap-2">
        {[
          { label: 'Всего', value: counts.all, color: 'text-foreground' },
          { label: 'Новых', value: counts.new, color: 'text-[hsl(var(--status-new))]' },
          { label: 'В работе', value: counts.in_progress, color: 'text-primary' },
          { label: 'Готово', value: counts.done, color: 'text-[hsl(var(--status-done))]' },
        ].map((s) => (
          <div key={s.label} className="card-surface p-2.5 text-center">
            <p className={`text-xl font-bold ${s.color}`}>{s.value}</p>
            <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="px-4 mb-3 flex gap-2 overflow-x-auto scrollbar-none">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex-shrink-0 px-3 py-1.5 rounded-lg text-sm font-medium tap-highlight transition-all ${
              filter === f ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-2.5 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Icon name="ClipboardList" size={40} className="text-muted-foreground/30" />
            <p className="text-muted-foreground text-sm">Заявок нет</p>
            {user?.role === 'admin' && (
              <button onClick={() => setShowCreate(true)} className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium">
                Создать первую
              </button>
            )}
          </div>
        )}

        {filtered.map((order, idx) => (
          <div
            key={order.id}
            onClick={() => setSelected(order)}
            className="card-surface p-3.5 tap-highlight active:scale-[0.98] transition-transform cursor-pointer animate-slide-up"
            style={{ animationDelay: `${idx * 30}ms` }}
          >
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-muted-foreground">#{order.id}</span>
                <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full border ${STATUS_CLASS[order.status]}`}>
                  {STATUS_LABEL[order.status]}
                </span>
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDate(order.updated_at)}</span>
            </div>

            <p className="font-semibold text-foreground text-sm mb-0.5">{order.client_name}</p>
            <p className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
              <Icon name="MapPin" size={11} className="flex-shrink-0" />
              {order.address}
            </p>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {order.master_name ? (
                  <>
                    <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                      <Icon name="Wrench" size={10} className="text-primary" />
                    </div>
                    <span className="text-xs text-muted-foreground">{order.master_name}</span>
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground/50 italic">Не назначен</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                {order.prepaid > 0 && (
                  <span className="text-xs text-[hsl(var(--status-done))]">+{order.prepaid.toLocaleString('ru')} ₽</span>
                )}
                {order.final_amount > 0 && (
                  <span className="text-sm font-bold text-foreground">{order.final_amount.toLocaleString('ru')} ₽</span>
                )}
              </div>
            </div>

            <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
              <Icon name="Zap" size={11} className="text-primary flex-shrink-0" />
              {order.work_type}
            </p>
          </div>
        ))}
      </div>

      {selected && (
        <OrderDetailSheet
          order={selected}
          masters={masters}
          onClose={() => setSelected(null)}
          onUpdated={handleUpdated}
        />
      )}

      {showCreate && (
        <CreateOrderModal
          masters={masters}
          onClose={() => setShowCreate(false)}
          onCreated={() => { setShowCreate(false); load(); }}
        />
      )}
    </div>
  );
}
