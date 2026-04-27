import { useState, useEffect } from 'react';
import { User, apiGetUsers, apiUpdateUser, apiCreateUser, apiUpdateProfile, apiResetOrders, apiDeactivateMaster } from '@/lib/api';
import { useAuth } from '@/lib/AuthContext';
import Icon from '@/components/ui/icon';

// Диалог подтверждения опасного действия
function ConfirmDialog({ title, desc, confirmLabel, confirmClass, onConfirm, onCancel, loading }: {
  title: string; desc: string; confirmLabel: string; confirmClass?: string;
  onConfirm: () => void; onCancel: () => void; loading?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-end bg-black/70 animate-fade-in" onClick={onCancel}>
      <div className="w-full max-w-lg mx-auto bg-card border-t border-border rounded-t-2xl p-6 space-y-4 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <p className="font-bold text-foreground text-lg text-center">{title}</p>
        <p className="text-sm text-muted-foreground text-center leading-relaxed">{desc}</p>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl bg-secondary text-foreground font-medium tap-highlight">Отмена</button>
          <button onClick={onConfirm} disabled={loading}
            className={`flex-1 py-3 rounded-xl font-medium flex items-center justify-center gap-2 tap-highlight disabled:opacity-60 ${confirmClass ?? 'bg-destructive text-destructive-foreground'}`}>
            {loading ? <Icon name="Loader2" size={16} className="animate-spin" /> : null}
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  const { user, logout, refreshUser } = useAuth();
  const [masters, setMasters] = useState<User[]>([]);
  const [showMasters, setShowMasters] = useState(false);
  const [editProfile, setEditProfile] = useState(false);
  const [editMaster, setEditMaster] = useState<User | null>(null);
  const [showAddMaster, setShowAddMaster] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  const [masterForm, setMasterForm] = useState({ name: '', email: '', phone: '', speciality: '', role: 'master', password: '', is_active: true });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  // Confirm dialogs
  const [confirmDelete, setConfirmDelete] = useState<User | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      apiGetUsers().then(setMasters).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    setProfileForm({ name: user?.name || '', email: user?.email || '', phone: user?.phone || '' });
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      await apiUpdateProfile(profileForm);
      await refreshUser();
      setEditProfile(false);
      setMsg('Профиль обновлён');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMaster = async () => {
    setSaving(true);
    try {
      if (editMaster) {
        const updated = await apiUpdateUser(editMaster.id, {
          name: masterForm.name, email: masterForm.email, phone: masterForm.phone,
          speciality: masterForm.speciality, role: masterForm.role as 'admin' | 'master',
          is_active: masterForm.is_active,
          ...(masterForm.password ? { password: masterForm.password } : {}),
        });
        setMasters((prev) => prev.map((m) => m.id === updated.id ? updated : m));
      } else {
        const created = await apiCreateUser({
          name: masterForm.name, email: masterForm.email, phone: masterForm.phone,
          speciality: masterForm.speciality, role: masterForm.role as 'admin' | 'master',
          password: masterForm.password || 'master123',
        });
        setMasters((prev) => [...prev, created]);
      }
      setEditMaster(null);
      setShowAddMaster(false);
      setMsg('Сохранено');
      setTimeout(() => setMsg(''), 3000);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setSaving(false);
    }
  };

  // Быстрое удаление мастера — деактивация + убийство сессий
  const handleDeleteMaster = async (m: User) => {
    setActionLoading(true);
    try {
      await apiDeactivateMaster(m.id);
      setMasters((prev) => prev.map((u) => u.id === m.id ? { ...u, is_active: false } : u));
      setConfirmDelete(null);
      setMsg(`Мастер ${m.name.split(' ')[0]} деактивирован`);
      setTimeout(() => setMsg(''), 3000);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  // Сброс всех заявок
  const handleResetOrders = async () => {
    setActionLoading(true);
    try {
      await apiResetOrders();
      setConfirmReset(false);
      setMsg('Все заявки удалены');
      setTimeout(() => setMsg(''), 4000);
    } catch (e: unknown) {
      setMsg(e instanceof Error ? e.message : 'Ошибка');
    } finally {
      setActionLoading(false);
    }
  };

  const openEditMaster = (m: User) => {
    setMasterForm({ name: m.name, email: m.email, phone: m.phone || '', speciality: m.speciality || '', role: m.role, password: '', is_active: m.is_active !== false });
    setEditMaster(m);
    setShowMasters(false);
  };

  const openAddMaster = () => {
    setMasterForm({ name: '', email: '', phone: '', speciality: '', role: 'master', password: '', is_active: true });
    setEditMaster(null);
    setShowAddMaster(true);
    setShowMasters(false);
  };

  if (!user) return null;

  // MASTER VIEW
  if (user.role === 'master') {
    return (
      <div className="flex flex-col h-full">
        <div className="px-4 pt-4 pb-3">
          <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Кабинет</p>
          <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-none px-4 pb-4 space-y-4">
          <div className="card-surface p-4">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
                <span className="text-2xl font-black text-primary-foreground">{user.name[0]}</span>
              </div>
              <div>
                <p className="font-bold text-foreground text-lg">{user.name}</p>
                <p className="text-sm text-muted-foreground">{user.speciality}</p>
                <div className="flex items-center gap-1 mt-1">
                  <Icon name="Star" size={12} className="text-primary fill-primary" />
                  <span className="text-sm text-foreground">{user.rating}</span>
                </div>
              </div>
            </div>
            {!editProfile ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm">
                  <Icon name="Mail" size={14} className="text-muted-foreground" />
                  <span className="text-foreground">{user.email}</span>
                </div>
                {user.phone && (
                  <div className="flex items-center gap-2 text-sm">
                    <Icon name="Phone" size={14} className="text-muted-foreground" />
                    <span className="text-foreground">{user.phone}</span>
                  </div>
                )}
                <button onClick={() => setEditProfile(true)} className="mt-2 flex items-center gap-2 text-sm text-primary">
                  <Icon name="Edit2" size={13} /> Редактировать профиль
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                <input value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Имя" className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
                <div className="flex gap-2">
                  <button onClick={() => setEditProfile(false)} className="flex-1 py-2.5 rounded-xl bg-secondary text-sm text-foreground">Отмена</button>
                  <button onClick={handleSaveProfile} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-60">
                    {saving ? <Icon name="Loader2" size={13} className="animate-spin" /> : null} Сохранить
                  </button>
                </div>
              </div>
            )}
          </div>
          {msg && <p className="text-center text-sm text-[hsl(var(--status-done))]">{msg}</p>}
          <button onClick={logout} className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl border border-destructive/40 text-destructive text-sm font-medium tap-highlight">
            <Icon name="LogOut" size={16} /> Выйти из аккаунта
          </button>
        </div>
      </div>
    );
  }

  // ADMIN VIEW
  return (
    <div className="flex flex-col h-full">
      {/* Confirm: delete master */}
      {confirmDelete && (
        <ConfirmDialog
          title="Удалить мастера?"
          desc={`${confirmDelete.name} будет деактивирован и немедленно потеряет доступ к приложению`}
          confirmLabel="Удалить доступ"
          onConfirm={() => handleDeleteMaster(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
          loading={actionLoading}
        />
      )}

      {/* Confirm: reset orders */}
      {confirmReset && (
        <ConfirmDialog
          title="Сбросить все заявки?"
          desc="Все заявки, история и статистика будут удалены безвозвратно. Мастера и настройки останутся."
          confirmLabel="Сбросить всё"
          onConfirm={handleResetOrders}
          onCancel={() => setConfirmReset(false)}
          loading={actionLoading}
        />
      )}

      <div className="px-4 pt-4 pb-3">
        <p className="text-xs text-muted-foreground font-medium tracking-wide uppercase">Кабинет</p>
        <h1 className="text-2xl font-bold text-foreground">Профиль</h1>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-none pb-4">
        {/* Admin profile card */}
        <div className="mx-4 mb-4 card-surface p-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center">
              <span className="text-2xl font-black text-primary-foreground">{user.name[0]}</span>
            </div>
            <div className="flex-1">
              <p className="font-bold text-foreground text-lg leading-tight">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.speciality || 'Генеральный директор'}</p>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary/20 text-primary mt-1 inline-block">ADMIN</span>
            </div>
            <button onClick={() => setEditProfile(!editProfile)} className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Icon name="Edit2" size={15} />
            </button>
          </div>
          {editProfile && (
            <div className="mt-4 space-y-2 border-t border-border pt-4">
              <input value={profileForm.name} onChange={(e) => setProfileForm((f) => ({ ...f, name: e.target.value }))} placeholder="Имя"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
              <input value={profileForm.email} onChange={(e) => setProfileForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email" type="email"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary" />
              <div className="flex gap-2">
                <button onClick={() => setEditProfile(false)} className="flex-1 py-2.5 rounded-xl bg-secondary text-sm text-foreground">Отмена</button>
                <button onClick={handleSaveProfile} disabled={saving} className="flex-1 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium flex items-center justify-center gap-1 disabled:opacity-60">
                  {saving ? <Icon name="Loader2" size={13} className="animate-spin" /> : null} Сохранить
                </button>
              </div>
            </div>
          )}
        </div>

        {msg && <p className="mx-4 mb-3 text-center text-sm text-[hsl(var(--status-done))]">{msg}</p>}

        {/* Stats */}
        <div className="mx-4 mb-4 grid grid-cols-3 gap-2">
          {[
            { label: 'Мастеров', value: masters.filter((m) => m.role === 'master' && m.is_active !== false).length, icon: 'Users' },
            { label: 'Активных', value: masters.filter((m) => m.role === 'master' && m.is_active !== false).length, icon: 'UserCheck' },
            { label: 'Сотрудников', value: masters.filter((m) => m.is_active !== false).length, icon: 'Briefcase' },
          ].map((s) => (
            <div key={s.label} className="card-surface p-3 text-center">
              <Icon name={s.icon} size={16} className="text-primary mx-auto mb-1" />
              <p className="text-lg font-bold text-foreground">{s.value}</p>
              <p className="text-[10px] text-muted-foreground">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Menu */}
        <div className="mx-4 card-surface overflow-hidden mb-4">
          {/* Masters management */}
          <button onClick={() => setShowMasters(!showMasters)}
            className="w-full flex items-center gap-3 px-4 py-3.5 tap-highlight text-left border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <Icon name="Users" size={15} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Управление мастерами</p>
              <p className="text-xs text-muted-foreground">Роли, доступы, профили</p>
            </div>
            <Icon name={showMasters ? 'ChevronUp' : 'ChevronDown'} size={16} className="text-muted-foreground" />
          </button>

          {showMasters && (
            <div className="border-b border-border bg-secondary/30">
              <div className="px-4 py-3 space-y-2">
                {masters.filter((m) => m.is_active !== false).map((m) => (
                  <div key={m.id} className="flex items-center gap-3 py-1.5">
                    <div className="w-8 h-8 rounded-xl bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold text-primary">{m.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{m.name}</p>
                      <p className="text-xs text-muted-foreground">{m.role === 'admin' ? 'Администратор' : m.speciality || 'Мастер'}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button onClick={() => openEditMaster(m)} className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center tap-highlight">
                        <Icon name="Edit2" size={13} className="text-foreground" />
                      </button>
                      {m.role === 'master' && (
                        <button onClick={() => setConfirmDelete(m)} className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center tap-highlight">
                          <Icon name="UserX" size={13} className="text-destructive" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
                <button onClick={openAddMaster}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 border-dashed border-border text-sm text-muted-foreground mt-1 tap-highlight">
                  <Icon name="UserPlus" size={14} className="text-primary" /> Добавить сотрудника
                </button>
              </div>
            </div>
          )}

          {/* Notifications toggle */}
          <button onClick={() => setNotifications(!notifications)}
            className="w-full flex items-center gap-3 px-4 py-3.5 tap-highlight text-left border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <Icon name="Bell" size={15} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Уведомления</p>
              <p className="text-xs text-muted-foreground">{notifications ? 'Включены' : 'Выключены'}</p>
            </div>
            <div className={`w-11 h-6 rounded-full flex items-center transition-colors px-0.5 ${notifications ? 'bg-primary justify-end' : 'bg-muted justify-start'}`}>
              <div className="w-5 h-5 rounded-full bg-white shadow" />
            </div>
          </button>

          {/* Export */}
          <button className="w-full flex items-center gap-3 px-4 py-3.5 tap-highlight text-left border-b border-border">
            <div className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
              <Icon name="Download" size={15} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">Экспорт данных</p>
              <p className="text-xs text-muted-foreground">Акты, договоры, отчёты</p>
            </div>
            <Icon name="ChevronRight" size={16} className="text-muted-foreground" />
          </button>

          {/* Logout */}
          <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3.5 tap-highlight text-left">
            <div className="w-8 h-8 rounded-xl bg-destructive/10 flex items-center justify-center">
              <Icon name="LogOut" size={15} className="text-destructive" />
            </div>
            <p className="text-sm font-medium text-destructive">Выйти</p>
          </button>
        </div>

        {/* Danger zone */}
        <div className="mx-4 rounded-2xl border border-destructive/30 overflow-hidden">
          <div className="px-4 py-3 bg-destructive/5">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Опасная зона</p>
          </div>
          <button
            onClick={() => setConfirmReset(true)}
            className="w-full flex items-center gap-3 px-4 py-4 tap-highlight text-left bg-destructive/5 active:bg-destructive/10 transition-colors"
          >
            <div className="w-9 h-9 rounded-xl bg-destructive/15 flex items-center justify-center flex-shrink-0">
              <Icon name="Trash2" size={16} className="text-destructive" />
            </div>
            <div className="flex-1">
              <p className="text-sm font-semibold text-destructive">Сбросить все заявки</p>
              <p className="text-xs text-destructive/70 mt-0.5">Удалить всю историю работ и статистику</p>
            </div>
            <Icon name="ChevronRight" size={16} className="text-destructive/50" />
          </button>
        </div>
      </div>

      {/* Edit master sheet */}
      {(editMaster || showAddMaster) && (
        <div className="fixed inset-0 z-50 flex flex-col">
          <div className="absolute inset-0 bg-black/60" onClick={() => { setEditMaster(null); setShowAddMaster(false); }} />
          <div className="relative mt-auto bg-background rounded-t-2xl max-h-[85vh] flex flex-col animate-slide-up">
            <div className="flex justify-center pt-3 pb-1"><div className="w-10 h-1 rounded-full bg-border" /></div>
            <div className="px-4 py-3 border-b border-border flex items-center justify-between flex-shrink-0">
              <h2 className="font-bold text-foreground">{editMaster ? 'Редактировать сотрудника' : 'Добавить сотрудника'}</h2>
              <button onClick={() => { setEditMaster(null); setShowAddMaster(false); }} className="w-8 h-8 rounded-xl bg-secondary flex items-center justify-center">
                <Icon name="X" size={16} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto scrollbar-none px-4 py-4 space-y-3">
              <input value={masterForm.name} onChange={(e) => setMasterForm((f) => ({ ...f, name: e.target.value }))} placeholder="ФИО *"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary" />
              <input value={masterForm.email} onChange={(e) => setMasterForm((f) => ({ ...f, email: e.target.value }))} placeholder="Email *" type="email"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary" />
              <input value={masterForm.phone} onChange={(e) => setMasterForm((f) => ({ ...f, phone: e.target.value }))} placeholder="Телефон"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary" />
              <input value={masterForm.speciality} onChange={(e) => setMasterForm((f) => ({ ...f, speciality: e.target.value }))} placeholder="Специальность"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary" />
              <select value={masterForm.role} onChange={(e) => setMasterForm((f) => ({ ...f, role: e.target.value }))}
                className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary">
                <option value="master">Мастер</option>
                <option value="admin">Администратор</option>
              </select>
              <input value={masterForm.password} onChange={(e) => setMasterForm((f) => ({ ...f, password: e.target.value }))}
                placeholder={editMaster ? 'Новый пароль (оставьте пустым)' : 'Пароль (по умолчанию: master123)'}
                type="password"
                className="w-full bg-secondary border border-border rounded-xl px-3 py-3 text-sm text-foreground outline-none focus:border-primary" />
              {msg && <p className="text-sm text-[hsl(var(--status-done))] text-center">{msg}</p>}
              <button onClick={handleSaveMaster} disabled={saving || !masterForm.name || !masterForm.email}
                className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50 mb-4">
                {saving ? <Icon name="Loader2" size={16} className="animate-spin" /> : <Icon name="Save" size={16} />}
                Сохранить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
