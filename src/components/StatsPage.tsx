import { useState, useEffect } from 'react';
import { Order, apiGetOrders } from '@/lib/api';
import Icon from '@/components/ui/icon';

export default function StatsPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetOrders().then((o) => { setOrders(o); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const done = orders.filter((o) => o.status === 'done');
  const totalRevenue = done.reduce((s, o) => s + (o.final_amount || 0), 0);
  const totalPrepaid = orders.reduce((s, o) => s + (o.prepaid || 0), 0);
  const totalParts = done.reduce((s, o) => s + (o.parts_cost || 0), 0);
  const avgCheck = done.length > 0 ? Math.round(totalRevenue / done.length) : 0;

  // Revenue by master
  const byMaster: Record<string, { name: string; orders: number; revenue: number }> = {};
  done.forEach((o) => {
    if (!o.master_name) return;
    if (!byMaster[o.master_name]) byMaster[o.master_name] = { name: o.master_name, orders: 0, revenue: 0 };
    byMaster[o.master_name].orders++;
    byMaster[o.master_name].revenue += o.final_amount || 0;
  });
  const masterStats = Object.values(byMaster).sort((a, b) => b.revenue - a.revenue);
  const maxRevenue = masterStats[0]?.revenue || 1;

  // Last 7 days chart
  const days: { label: string; amount: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const label = d.toLocaleDateString('ru', { weekday: 'short' });
    const dayStr = d.toISOString().slice(0, 10);
    const amount = done
      .filter((o) => o.updated_at.slice(0, 10) === dayStr)
      .reduce((s, o) => s + (o.final_amount || 0), 0);
    days.push({ label, amount });
  }
  const maxDay = Math.max(...days.map((d) => d.amount), 1);

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <Icon name="Loader2" size={28} className="animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">
          {new Date().toLocaleDateString('ru', { month: 'long', year: 'numeric' })}
        </p>
        <h1 className="text-2xl font-bold text-foreground">Статистика</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-4 pb-4">
        {/* Main metrics */}
        <div className="grid grid-cols-2 gap-2">
          <div className="card-surface p-4">
            <Icon name="TrendingUp" size={18} className="text-[hsl(var(--status-done))] mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalRevenue.toLocaleString('ru')} ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">Выручка (закрытые)</p>
          </div>
          <div className="card-surface p-4">
            <Icon name="Wallet" size={18} className="text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{totalPrepaid.toLocaleString('ru')} ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">Предоплаты</p>
          </div>
          <div className="card-surface p-4">
            <Icon name="ClipboardCheck" size={18} className="text-[hsl(var(--status-new))] mb-2" />
            <p className="text-2xl font-bold text-foreground">{done.length}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Закрытых заявок</p>
            <p className="text-xs text-muted-foreground">из {orders.length} всего</p>
          </div>
          <div className="card-surface p-4">
            <Icon name="Receipt" size={18} className="text-primary mb-2" />
            <p className="text-2xl font-bold text-foreground">{avgCheck.toLocaleString('ru')} ₽</p>
            <p className="text-xs text-muted-foreground mt-0.5">Средний чек</p>
          </div>
        </div>

        {/* Bar chart */}
        <div className="card-surface p-4">
          <div className="flex items-center justify-between mb-4">
            <p className="font-semibold text-foreground text-sm">Выручка по дням</p>
            <span className="text-xs text-muted-foreground">7 дней</span>
          </div>
          <div className="flex items-end gap-2 h-28">
            {days.map((d) => {
              const height = Math.round((d.amount / maxDay) * 100);
              return (
                <div key={d.label} className="flex-1 flex flex-col items-center gap-1">
                  <div className="w-full flex flex-col justify-end" style={{ height: '96px' }}>
                    <div className="w-full rounded-t-lg bg-primary/30 transition-all" style={{ height: `${Math.max(height, 2)}%` }}>
                      {d.amount > 0 && height >= 30 && (
                        <div className="w-full h-full rounded-t-lg bg-primary" />
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-muted-foreground">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Masters performance */}
        {masterStats.length > 0 && (
          <div className="card-surface p-4">
            <p className="font-semibold text-foreground text-sm mb-4">Выручка по мастерам</p>
            <div className="space-y-3">
              {masterStats.map((m) => (
                <div key={m.name}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm text-foreground">{m.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground">{m.orders} зак.</span>
                      <span className="text-sm font-semibold text-foreground">{m.revenue.toLocaleString('ru')} ₽</span>
                    </div>
                  </div>
                  <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div className="h-full bg-primary rounded-full" style={{ width: `${Math.round((m.revenue / maxRevenue) * 100)}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {masterStats.length === 0 && (
          <div className="card-surface p-6 flex flex-col items-center gap-2">
            <Icon name="BarChart3" size={32} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Статистика появится после закрытия первых заявок</p>
          </div>
        )}

        {/* Parts cost */}
        {totalParts > 0 && (
          <div className="card-surface p-4 flex items-center gap-3">
            <Icon name="Package" size={18} className="text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-foreground">Запчасти и материалы</p>
              <p className="text-xs text-muted-foreground">Общая стоимость закупок</p>
            </div>
            <p className="ml-auto font-bold text-foreground">{totalParts.toLocaleString('ru')} ₽</p>
          </div>
        )}
      </div>
    </div>
  );
}
