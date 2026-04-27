import { useState } from 'react';
import { Toaster } from "@/components/ui/toaster";
import Icon from '@/components/ui/icon';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import LoginPage from '@/components/LoginPage';
import OrdersPage from '@/components/OrdersPage';
import MastersPage from '@/components/MastersPage';
import StatsPage from '@/components/StatsPage';
import HistoryPage from '@/components/HistoryPage';
import NotificationsPage from '@/components/NotificationsPage';
import ProfilePage from '@/components/ProfilePage';

type Tab = 'orders' | 'masters' | 'stats' | 'history' | 'notifications' | 'profile';

const tabs: { id: Tab; label: string; icon: string }[] = [
  { id: 'orders', label: 'Заявки', icon: 'ClipboardList' },
  { id: 'masters', label: 'Мастера', icon: 'HardHat' },
  { id: 'stats', label: 'Статистика', icon: 'BarChart3' },
  { id: 'history', label: 'История', icon: 'Archive' },
  { id: 'notifications', label: 'Лента', icon: 'Bell' },
  { id: 'profile', label: 'Профиль', icon: 'User' },
];

function AppInner() {
  const { user, loading } = useAuth();
  const [active, setActive] = useState<Tab>('orders');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center">
            <Icon name="Wrench" size={24} className="text-primary-foreground" />
          </div>
          <Icon name="Loader2" size={20} className="animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  const renderPage = () => {
    switch (active) {
      case 'orders': return <OrdersPage />;
      case 'masters': return <MastersPage />;
      case 'stats': return user.role === 'admin' ? <StatsPage /> : <OrdersPage />;
      case 'history': return <HistoryPage />;
      case 'notifications': return <NotificationsPage />;
      case 'profile': return <ProfilePage />;
    }
  };

  const visibleTabs = user.role === 'master'
    ? tabs.filter((t) => t.id !== 'stats' && t.id !== 'masters')
    : tabs;

  return (
    <div className="flex flex-col h-full bg-background max-w-lg mx-auto">
      <div className="flex-1 overflow-hidden">
        {renderPage()}
      </div>

      <nav className="flex-shrink-0 bg-[hsl(220,16%,8%)] border-t border-border nav-glow">
        <div className="flex items-stretch">
          {visibleTabs.map((tab) => {
            const isActive = tab.id === active;
            return (
              <button
                key={tab.id}
                onClick={() => setActive(tab.id)}
                className={`flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 tap-highlight transition-all relative ${
                  isActive ? '' : 'opacity-45'
                }`}
              >
                <Icon
                  name={tab.icon}
                  size={22}
                  className={isActive ? 'text-primary' : 'text-foreground'}
                />
                <span className={`text-[9px] font-medium leading-none ${isActive ? 'text-primary' : 'text-foreground'}`}>
                  {tab.label}
                </span>
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-primary" />
                )}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Toaster />
      <AppInner />
    </AuthProvider>
  );
}
