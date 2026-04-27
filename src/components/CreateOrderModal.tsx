import { useState } from 'react';
import { User, apiCreateOrder, CreateOrderPayload } from '@/lib/api';
import Icon from '@/components/ui/icon';

interface Props {
  masters: User[];
  onClose: () => void;
  onCreated: () => void;
}

export default function CreateOrderModal({ masters, onClose, onCreated }: Props) {
  const [form, setForm] = useState<CreateOrderPayload & { scheduled_date: string; scheduled_time: string }>({
    client_name: '',
    client_phone: '',
    address: '',
    work_type: '',
    description: '',
    master_id: undefined,
    prepaid: 0,
    scheduled_date: '',
    scheduled_time: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const workTypes = [
    'Замена смесителя', 'Установка унитаза', 'Прочистка канализации', 'Замена радиатора',
    'Монтаж счётчиков воды', 'Течь трубы', 'Монтаж водонагревателя', 'Монтаж тёплого пола',
    'Ремонт трубы', 'Другое',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      let scheduled_at: string | undefined;
      if (form.scheduled_date && form.scheduled_time) {
        scheduled_at = new Date(`${form.scheduled_date}T${form.scheduled_time}`).toISOString();
      } else if (form.scheduled_date) {
        scheduled_at = new Date(form.scheduled_date).toISOString();
      }
      await apiCreateOrder({
        client_name: form.client_name,
        client_phone: form.client_phone,
        address: form.address,
        work_type: form.work_type,
        description: form.description,
        master_id: form.master_id || undefined,
        prepaid: form.prepaid || 0,
        scheduled_at,
      });
      onCreated();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative mt-auto bg-background rounded-t-2xl max-h-[95vh] flex flex-col animate-slide-up">
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-border">
          <h2 className="font-bold text-foreground text-lg">Новая заявка</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
            <Icon name="X" size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-4">
          {/* Client */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Клиент</p>
            <input
              required
              value={form.client_name}
              onChange={(e) => setForm((f) => ({ ...f, client_name: e.target.value }))}
              placeholder="ФИО клиента *"
              className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-foreground text-sm outline-none focus:border-primary"
            />
            <input
              required
              type="tel"
              value={form.client_phone}
              onChange={(e) => setForm((f) => ({ ...f, client_phone: e.target.value }))}
              placeholder="Телефон *"
              className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-foreground text-sm outline-none focus:border-primary"
            />
            <input
              required
              value={form.address}
              onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))}
              placeholder="Адрес *"
              className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-foreground text-sm outline-none focus:border-primary"
            />
          </div>

          {/* Work type */}
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Вид работ</p>
            <div className="flex flex-wrap gap-2">
              {workTypes.map((wt) => (
                <button
                  key={wt}
                  type="button"
                  onClick={() => setForm((f) => ({ ...f, work_type: wt }))}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    form.work_type === wt
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-secondary text-muted-foreground border-border'
                  }`}
                >
                  {wt}
                </button>
              ))}
            </div>
            {form.work_type === 'Другое' && (
              <input
                value={form.work_type === 'Другое' ? '' : form.work_type}
                onChange={(e) => setForm((f) => ({ ...f, work_type: e.target.value }))}
                placeholder="Укажите вид работ"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-primary"
              />
            )}
          </div>

          {/* Description */}
          <textarea
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            placeholder="Описание проблемы (необязательно)"
            rows={2}
            className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-primary resize-none"
          />

          {/* Assign master + schedule */}
          <div className="space-y-3">
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Назначение</p>
            <select
              value={form.master_id || ''}
              onChange={(e) => setForm((f) => ({ ...f, master_id: e.target.value ? Number(e.target.value) : undefined }))}
              className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-foreground text-sm outline-none focus:border-primary"
            >
              <option value="">Мастер не назначен</option>
              {masters.filter((m) => m.role === 'master' && m.is_active !== false).map((m) => (
                <option key={m.id} value={m.id}>{m.name} — {m.speciality}</option>
              ))}
            </select>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Дата</label>
                <input
                  type="date"
                  value={form.scheduled_date}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_date: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-primary"
                />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Время</label>
                <input
                  type="time"
                  value={form.scheduled_time}
                  onChange={(e) => setForm((f) => ({ ...f, scheduled_time: e.target.value }))}
                  className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-primary"
                />
              </div>
            </div>
          </div>

          {/* Prepaid */}
          <div>
            <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-1.5 block">Предоплата (₽)</label>
            <input
              type="number"
              value={form.prepaid || ''}
              onChange={(e) => setForm((f) => ({ ...f, prepaid: parseFloat(e.target.value) || 0 }))}
              placeholder="0"
              className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-foreground text-sm outline-none focus:border-primary"
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-destructive/10 border border-destructive/30">
              <Icon name="AlertCircle" size={14} className="text-destructive" />
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading || !form.client_name || !form.client_phone || !form.address || !form.work_type}
            className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 tap-highlight active:scale-[0.98] disabled:opacity-50 mb-4"
          >
            {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Plus" size={16} />}
            Создать заявку
          </button>
        </form>
      </div>
    </div>
  );
}
