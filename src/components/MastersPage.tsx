import { useState, useEffect } from 'react';
import { User, apiGetUsers } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Icon from '@/components/ui/icon';

export default function MastersPage() {
  const { user } = useAuth();
  const [masters, setMasters] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiGetUsers().then((users) => {
      setMasters(users.filter((u) => u.role === 'master'));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 pt-4 pb-3 flex items-center justify-between">
        <div>
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Команда</p>
          <h1 className="text-2xl font-bold text-foreground">Мастера</h1>
        </div>
      </div>

      {/* Summary */}
      <div className="px-4 mb-4 grid grid-cols-3 gap-2">
        {[
          { label: 'Всего', value: masters.length, icon: 'Users' },
          { label: 'Активных', value: masters.filter((m) => m.is_active !== false).length, icon: 'UserCheck' },
          { label: 'Специализаций', value: [...new Set(masters.map((m) => m.speciality).filter(Boolean))].length, icon: 'Wrench' },
        ].map((s) => (
          <div key={s.label} className="card-surface p-3 flex flex-col items-center gap-1">
            <Icon name={s.icon} size={18} className="text-primary" />
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-[10px] text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none px-4 space-y-3 pb-4">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Icon name="Loader2" size={24} className="animate-spin text-muted-foreground" />
          </div>
        )}

        {!loading && masters.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 gap-3">
            <Icon name="Users" size={40} className="text-muted-foreground/30" />
            <p className="text-sm text-muted-foreground">Мастера не добавлены</p>
          </div>
        )}

        {masters.map((m, idx) => (
          <div
            key={m.id}
            className={`card-surface p-4 animate-slide-up ${m.is_active === false ? 'opacity-50' : ''}`}
            style={{ animationDelay: `${idx * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="relative flex-shrink-0">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                  <span className="text-lg font-bold text-primary">{m.name[0]}</span>
                </div>
                <span className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
                  m.is_active === false ? 'bg-muted-foreground' : 'bg-[hsl(var(--status-done))]'
                }`} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-foreground text-sm leading-tight">{m.name}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{m.speciality || 'Мастер'}</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex items-center gap-1">
                    <Icon name="Star" size={11} className="text-primary fill-primary" />
                    <span className="text-xs font-medium text-foreground">{m.rating || 5.0}</span>
                  </div>
                  {m.is_active === false && (
                    <span className="text-xs text-destructive">Деактивирован</span>
                  )}
                </div>
              </div>

              {m.phone && (
                <a href={`tel:${m.phone}`} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <Icon name="Phone" size={15} className="text-primary" />
                </a>
              )}
            </div>

            <div className="flex gap-2 mt-3">
              {m.phone && (
                <a href={`tel:${m.phone}`} className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-sm text-foreground tap-highlight">
                  <Icon name="Phone" size={13} className="text-primary" />
                  Позвонить
                </a>
              )}
              <div className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-secondary text-sm text-muted-foreground">
                <Icon name="Mail" size={13} />
                {m.email}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
