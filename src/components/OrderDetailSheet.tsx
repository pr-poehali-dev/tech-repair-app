import { useState, useEffect } from 'react';
import { Order, User, OrderFile, apiChangeStatus, apiUpdateOrder, apiGetFiles, apiUploadFile } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Icon from '@/components/ui/icon';

interface Props {
  order: Order;
  masters: User[];
  onClose: () => void;
  onUpdated: (order: Order) => void;
}

const STATUS_LABEL: Record<string, string> = {
  new: 'Новая', accepted: 'Принята', in_progress: 'В работе', done: 'Выполнена', cancelled: 'Отменена',
};
const STATUS_CLASS: Record<string, string> = {
  new: 'status-new', accepted: 'status-pending', in_progress: 'status-progress', done: 'status-done', cancelled: 'status-cancelled',
};

// What buttons to show based on role + status
const MASTER_ACTIONS: Record<string, { label: string; next: string; icon: string; primary?: boolean }[]> = {
  new: [{ label: 'Принять заявку', next: 'accepted', icon: 'CheckCircle', primary: true }],
  accepted: [{ label: 'Я на месте — в работе', next: 'in_progress', icon: 'Zap', primary: true }],
  in_progress: [
    { label: 'Завершить заявку', next: 'done', icon: 'CheckCircle2', primary: true },
  ],
};

const ADMIN_ACTIONS: Record<string, { label: string; next: string; icon: string; primary?: boolean }[]> = {
  new: [
    { label: 'Передать мастеру', next: 'accepted', icon: 'UserCheck', primary: true },
    { label: 'Отменить', next: 'cancelled', icon: 'X' },
  ],
  accepted: [
    { label: 'Отменить', next: 'cancelled', icon: 'X' },
  ],
  in_progress: [
    { label: 'Отменить', next: 'cancelled', icon: 'X' },
  ],
};

export default function OrderDetailSheet({ order: initialOrder, masters, onClose, onUpdated }: Props) {
  const { user } = useAuth();
  const [order, setOrder] = useState<Order>(initialOrder);
  const [files, setFiles] = useState<OrderFile[]>([]);
  const [saving, setSaving] = useState(false);
  const [statusLoading, setStatusLoading] = useState(false);
  const [showCloseForm, setShowCloseForm] = useState(false);
  const [finance, setFinance] = useState({
    prepaid: String(order.prepaid || ''),
    parts_cost: String(order.parts_cost || ''),
    final_amount: String(order.final_amount || ''),
    master_notes: order.master_notes || '',
  });
  const [uploadingFile, setUploadingFile] = useState(false);

  useEffect(() => {
    if (order.id) {
      apiGetFiles(order.id).then(setFiles).catch(() => {});
    }
  }, [order.id]);

  const handleStatusChange = async (next: string) => {
    if (next === 'done' && user?.role === 'master') {
      setShowCloseForm(true);
      return;
    }
    setStatusLoading(true);
    try {
      const updated = await apiChangeStatus(order.id, next);
      setOrder(updated);
      onUpdated(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleSaveFinance = async () => {
    setSaving(true);
    try {
      const updated = await apiUpdateOrder(order.id, {
        prepaid: parseFloat(finance.prepaid) || 0,
        parts_cost: parseFloat(finance.parts_cost) || 0,
        final_amount: parseFloat(finance.final_amount) || 0,
        master_notes: finance.master_notes,
      });
      setOrder(updated);
      onUpdated(updated);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleCloseOrder = async () => {
    setSaving(true);
    try {
      // Save finances first
      const updated = await apiUpdateOrder(order.id, {
        prepaid: parseFloat(finance.prepaid) || 0,
        parts_cost: parseFloat(finance.parts_cost) || 0,
        final_amount: parseFloat(finance.final_amount) || 0,
        master_notes: finance.master_notes,
      });
      // Then mark done
      const done = await apiChangeStatus(updated.id, 'done');
      setOrder(done);
      onUpdated(done);
      setShowCloseForm(false);
    } catch (e: unknown) {
      alert(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingFile(true);
    try {
      const uploaded = await apiUploadFile(order.id, file, 'receipt');
      setFiles((prev) => [uploaded, ...prev]);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally {
      setUploadingFile(false);
      e.target.value = '';
    }
  };

  const actions = user?.role === 'master'
    ? (MASTER_ACTIONS[order.status] || [])
    : (ADMIN_ACTIONS[order.status] || []);

  const canEditFinance = user?.role === 'admin' || (user?.role === 'master' && ['accepted', 'in_progress', 'done'].includes(order.status) && order.master_id === user?.id);
  const partsEntered = parseFloat(finance.parts_cost) > 0;

  return (
    <div className="fixed inset-0 z-50 flex flex-col">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />

      {/* Sheet */}
      <div className="relative mt-auto bg-background rounded-t-2xl max-h-[92vh] flex flex-col animate-slide-up">
        {/* Handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 rounded-full bg-border" />
        </div>

        {/* Header */}
        <div className="px-4 py-3 flex items-center justify-between flex-shrink-0 border-b border-border">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm text-muted-foreground">#{order.id}</span>
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${STATUS_CLASS[order.status]}`}>
                {STATUS_LABEL[order.status]}
              </span>
            </div>
            <p className="font-bold text-foreground mt-0.5">{order.work_type}</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
            <Icon name="X" size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-4">
          {/* Action buttons — PRIMARY, TOP */}
          {actions.length > 0 && order.status !== 'done' && order.status !== 'cancelled' && (
            <div className="space-y-2">
              {actions.map((a) => (
                <button
                  key={a.next}
                  onClick={() => handleStatusChange(a.next)}
                  disabled={statusLoading}
                  className={`w-full flex items-center justify-center gap-2 py-3.5 rounded-xl font-semibold text-sm tap-highlight active:scale-[0.98] transition-transform disabled:opacity-60 ${
                    a.primary
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-destructive/10 text-destructive border border-destructive/30'
                  }`}
                >
                  {statusLoading ? (
                    <Icon name="Loader2" size={16} className="animate-spin" />
                  ) : (
                    <Icon name={a.icon} size={16} />
                  )}
                  {a.label}
                </button>
              ))}
            </div>
          )}

          {/* Client info */}
          <div className="card-surface p-4 space-y-2.5">
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Клиент</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center">
                <Icon name="User" size={18} className="text-foreground" />
              </div>
              <div>
                <p className="font-semibold text-foreground">{order.client_name}</p>
                <a href={`tel:${order.client_phone}`} className="text-sm text-primary">{order.client_phone}</a>
              </div>
              <a href={`tel:${order.client_phone}`} className="ml-auto w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                <Icon name="Phone" size={16} className="text-primary" />
              </a>
            </div>
            <div className="flex items-start gap-2 pt-1 border-t border-border">
              <Icon name="MapPin" size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
              <p className="text-sm text-foreground">{order.address}</p>
            </div>
            {order.description && (
              <div className="flex items-start gap-2 border-t border-border pt-1">
                <Icon name="FileText" size={14} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                <p className="text-sm text-muted-foreground">{order.description}</p>
              </div>
            )}
            {order.scheduled_at && (
              <div className="flex items-center gap-2 border-t border-border pt-1">
                <Icon name="Clock" size={14} className="text-muted-foreground flex-shrink-0" />
                <p className="text-sm text-foreground">{new Date(order.scheduled_at).toLocaleString('ru', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
              </div>
            )}
          </div>

          {/* Master */}
          {order.master_name && (
            <div className="card-surface p-3.5 flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-primary/20 flex items-center justify-center">
                <span className="text-sm font-bold text-primary">{order.master_name[0]}</span>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Мастер</p>
                <p className="text-sm font-semibold text-foreground">{order.master_name}</p>
              </div>
            </div>
          )}

          {/* Finance */}
          <div className="card-surface p-4 space-y-3">
            <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Финансы</p>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Предоплата (₽)</label>
              <input
                type="number"
                value={finance.prepaid}
                onChange={(e) => setFinance((f) => ({ ...f, prepaid: e.target.value }))}
                disabled={!canEditFinance}
                placeholder="0"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Запчасти (₽)</label>
              <input
                type="number"
                value={finance.parts_cost}
                onChange={(e) => setFinance((f) => ({ ...f, parts_cost: e.target.value }))}
                disabled={!canEditFinance}
                placeholder="0"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-primary disabled:opacity-50"
              />
            </div>

            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Итоговая сумма (₽)</label>
              <input
                type="number"
                value={finance.final_amount}
                onChange={(e) => setFinance((f) => ({ ...f, final_amount: e.target.value }))}
                disabled={!canEditFinance}
                placeholder="0"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-primary disabled:opacity-50"
              />
            </div>

            {canEditFinance && !showCloseForm && (
              <button
                onClick={handleSaveFinance}
                disabled={saving}
                className="w-full py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium flex items-center justify-center gap-2 tap-highlight"
              >
                {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="Save" size={14} className="text-primary" />}
                Сохранить финансы
              </button>
            )}
          </div>

          {/* Notes */}
          {canEditFinance && (
            <div className="card-surface p-4">
              <label className="text-xs font-medium text-muted-foreground tracking-wide uppercase mb-2 block">Заметки мастера</label>
              <textarea
                value={finance.master_notes}
                onChange={(e) => setFinance((f) => ({ ...f, master_notes: e.target.value }))}
                placeholder="Что сделано, какие материалы..."
                rows={3}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-foreground text-sm outline-none focus:border-primary resize-none"
              />
            </div>
          )}

          {/* Files */}
          {(order.status === 'in_progress' || order.status === 'done') && (
            <div className="card-surface p-4 space-y-3">
              <p className="text-xs font-medium text-muted-foreground tracking-wide uppercase">Документы и чеки</p>

              {partsEntered && canEditFinance && (
                <label className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm cursor-pointer tap-highlight ${uploadingFile ? 'opacity-60' : ''}`}>
                  {uploadingFile ? (
                    <><Icon name="Loader2" size={14} className="animate-spin text-primary" /> Загрузка...</>
                  ) : (
                    <><Icon name="Upload" size={14} className="text-primary" /> Загрузить чек запчастей</>
                  )}
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" disabled={uploadingFile} />
                </label>
              )}

              {!partsEntered && canEditFinance && (
                <p className="text-xs text-muted-foreground text-center py-2">Заполните сумму запчастей, чтобы прикрепить чек</p>
              )}

              {files.length > 0 && (
                <div className="space-y-2">
                  {files.map((f) => (
                    <a key={f.id} href={f.file_url} target="_blank" rel="noreferrer"
                      className="flex items-center gap-3 p-2.5 rounded-xl bg-secondary tap-highlight">
                      <Icon name="FileText" size={16} className="text-primary flex-shrink-0" />
                      <span className="text-sm text-foreground truncate flex-1">{f.filename}</span>
                      <Icon name="ExternalLink" size={14} className="text-muted-foreground" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Close order form (master) */}
          {showCloseForm && (
            <div className="card-surface p-4 border-2 border-primary/30 space-y-3">
              <p className="font-semibold text-foreground flex items-center gap-2">
                <Icon name="CheckCircle2" size={16} className="text-[hsl(var(--status-done))]" />
                Закрытие заявки
              </p>
              <p className="text-xs text-muted-foreground">Заполните итоговые данные перед закрытием:</p>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Предоплата</label>
                  <input type="number" value={finance.prepaid} onChange={(e) => setFinance((f) => ({ ...f, prepaid: e.target.value }))} placeholder="0" className="w-full bg-secondary border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Запчасти</label>
                  <input type="number" value={finance.parts_cost} onChange={(e) => setFinance((f) => ({ ...f, parts_cost: e.target.value }))} placeholder="0" className="w-full bg-secondary border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-[10px] text-muted-foreground block mb-1">Итого</label>
                  <input type="number" value={finance.final_amount} onChange={(e) => setFinance((f) => ({ ...f, final_amount: e.target.value }))} placeholder="0" className="w-full bg-secondary border border-border rounded-lg px-2.5 py-2 text-sm outline-none focus:border-primary" />
                </div>
              </div>

              {partsEntered && (
                <label className={`w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm cursor-pointer ${uploadingFile ? 'opacity-60' : ''}`}>
                  {uploadingFile ? <><Icon name="Loader2" size={14} className="animate-spin" /> Загрузка...</> : <><Icon name="Paperclip" size={14} className="text-primary" /> Прикрепить чек запчастей (необязательно)</>}
                  <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.pdf" disabled={uploadingFile} />
                </label>
              )}

              <textarea value={finance.master_notes} onChange={(e) => setFinance((f) => ({ ...f, master_notes: e.target.value }))} placeholder="Что сделано..." rows={2} className="w-full bg-secondary border border-border rounded-xl px-3 py-2 text-sm outline-none focus:border-primary resize-none" />

              <div className="flex gap-2">
                <button onClick={() => setShowCloseForm(false)} className="flex-1 py-2.5 rounded-xl bg-secondary text-foreground text-sm">Отмена</button>
                <button onClick={handleCloseOrder} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-[hsl(var(--status-done))] text-white text-sm font-semibold flex items-center justify-center gap-1.5 disabled:opacity-60">
                  {saving ? <Icon name="Loader2" size={14} className="animate-spin" /> : <Icon name="CheckCircle2" size={14} />}
                  Закрыть заявку
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
